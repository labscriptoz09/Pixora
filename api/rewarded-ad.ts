// /api/rewarded-ad.ts — Rewarded Ad Server (Sécurité + Anti-Triche)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ✅ Config par défaut (overridable via admin_config)
const DEFAULT_CONFIG = {
    points_per_view: 0.5,       // Points par pub vue
    timer_seconds: 20,          // Durée minimale d'exposition
    daily_limit: 15,            // Max pubs/jour par utilisateur
    cooldown_seconds: 60,       // Délai entre 2 pubs (anti-spam)
};

// ✅ Générateur de token unique anti-replay
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '_' + Date.now();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Service key missing' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =============================================
    // GET /api/rewarded-ad?action=get&position=top
    // → Sert une pub + génère un token de session
    // =============================================
    if (req.method === 'GET' && req.query.action === 'get') {
        try {
            const position = (req.query.position as string) || 'top';
            const userId = req.query.user_id as string;

            if (!userId) {
                return res.status(400).json({ error: 'user_id required' });
            }
            // 1. Charger la config rewarded depuis admin
            let config = DEFAULT_CONFIG;
            try {
                const configResult = await supabase
                    .from('admin_config')
                    .select('value')
                    .eq('key', 'rewarded_ad_config')
                    .single();
                if (configResult.data?.value) {
                    config = { ...DEFAULT_CONFIG, ...configResult.data.value };
                }
            } catch (e) {}

            // 2. Vérifier la limite quotidienne
            const today = new Date().toISOString().split('T')[0];
            const { data: todayViews } = await supabase
                .from('transactions')
                .select('id')
                .eq('user_id', userId)
                .eq('title', 'Pub récompensée')
                .gte('created_at', today + 'T00:00:00');

            const viewsToday = todayViews?.length || 0;
            if (viewsToday >= config.daily_limit) {
                return res.status(200).json({
                    available: false,
                    reason: 'daily_limit_reached',
                    views_today: viewsToday,
                    daily_limit: config.daily_limit,
                });
            }

            // 3. Vérifier le cooldown
            const { data: lastView } = await supabase
                .from('transactions')
                .select('created_at')
                .eq('user_id', userId)
                .eq('title', 'Pub récompensée')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (lastView) {
                const lastTime = new Date(lastView.created_at).getTime();
                const elapsed = (Date.now() - lastTime) / 1000;
                if (elapsed < config.cooldown_seconds) {
                    return res.status(200).json({
                        available: false,
                        reason: 'cooldown_active',                        wait_seconds: Math.ceil(config.cooldown_seconds - elapsed),
                    });
                }
            }

            // 4. Trouver une pub rewarded active
            const { data: adsData } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'ad_networks')
                .single();

            if (!adsData?.value) {
                return res.status(200).json({ available: false, reason: 'no_ads' });
            }

            const allAds = adsData.value as Array<any>;
            const rewardedAds = allAds.filter((ad: any) =>
                ad.active === true &&
                ad.code && ad.code.trim().length > 0 &&
                (ad.type === 'rewarded' || ad.type === 'smartlink' || ad.type === 'native')
            );

            if (rewardedAds.length === 0) {
                return res.status(200).json({ available: false, reason: 'no_rewarded_ads' });
            }

            // Sélectionner une pub aléatoire
            const ad = rewardedAds[Math.floor(Math.random() * rewardedAds.length)];
            const code = ad.code.trim();
            const isUrl = code.startsWith('http://') || code.startsWith('https://');

            // 5. Générer un token unique pour cette session
            const token = generateToken();

            // 6. Stocker le token en base avec timestamp (anti-triche serveur)
            await supabase.from('admin_config').upsert({
                key: 'rewarded_token_' + token,
                value: {
                    user_id: userId,
                    created_at: Date.now(),
                    ad_name: ad.name,
                    points: config.points_per_view,
                    timer: config.timer_seconds,
                    claimed: false,
                },
            }, { onConflict: 'key' });

            // 7. Retourner les données de la pub
            return res.status(200).json({                available: true,
                token: token,
                ad_url: isUrl ? code : null,
                ad_html: isUrl ? null : code,
                ad_name: ad.name || 'Offre Partenaire',
                timer_seconds: config.timer_seconds,
                points_reward: config.points_per_view,
                views_today: viewsToday,
                daily_limit: config.daily_limit,
            });

        } catch (e: any) {
            console.error('[REWARDED-GET] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    // =============================================
    // POST /api/rewarded-ad?action=claim
    // → Valide le reward (timestamp serveur = anti-triche)
    // =============================================
    if (req.method === 'POST' && req.query.action === 'claim') {
        try {
            const { token, user_id } = req.body;

            if (!token || !user_id) {
                return res.status(400).json({ error: 'token and user_id required' });
            }

            // 1. Récupérer le token stocké
            const { data: tokenData, error: tokenError } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'rewarded_token_' + token)
                .single();

            if (tokenError || !tokenData?.value) {
                return res.status(400).json({ error: 'invalid_token' });
            }

            const session = tokenData.value as any;

            // 2. Vérifier que le token appartient à cet utilisateur
            if (session.user_id !== user_id) {
                return res.status(403).json({ error: 'token_mismatch' });
            }

            // 3. Vérifier que le token n'a pas déjà été réclamé
            if (session.claimed === true) {
                return res.status(400).json({ error: 'already_claimed' });            }

            // 4. ⚠️ VÉRIFICATION TIMESTAMP SERVEUR (anti-triche critique)
            // Le timer DOIT être écoulé selon l'horloge SERVEUR, pas celle du client
            const elapsedMs = Date.now() - session.created_at;
            const elapsedSec = elapsedMs / 1000;

            if (elapsedSec < session.timer) {
                return res.status(400).json({
                    error: 'timer_not_complete',
                    remaining_seconds: Math.ceil(session.timer - elapsedSec),
                });
            }

            // 5. Marquer le token comme réclamé
            await supabase
                .from('admin_config')
                .update({ value: { ...session, claimed: true } })
                .eq('key', 'rewarded_token_' + token);

            // 6. Créditer les points
            const pointsReward = session.points || DEFAULT_CONFIG.points_per_view;

            const { data: userData } = await supabase
                .from('user_data')
                .select('points, total_earned')
                .eq('user_id', user_id)
                .single();

            const currentPoints = userData?.points || 0;
            const currentEarned = userData?.total_earned || 0;

            await supabase
                .from('user_data')
                .update({
                    points: currentPoints + pointsReward,
                    total_earned: currentEarned + pointsReward,
                })
                .eq('user_id', user_id);

            // 7. Enregistrer la transaction
            await supabase.from('transactions').insert({
                user_id: user_id,
                type: 'earned',
                title: 'Pub récompensée',
                amount: pointsReward,
            });

            // 8. Nettoyer le token (optionnel, pour garder la DB propre)
            // On garde 24h pour debug puis suppression automatique par TTL si besoin
            return res.status(200).json({
                success: true,
                points_earned: pointsReward,
                new_balance: currentPoints + pointsReward,
            });

        } catch (e: any) {
            console.error('[REWARDED-CLAIM] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action. Use GET ?action=get or POST ?action=claim' });
}
