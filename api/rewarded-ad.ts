// /api/rewarded-ad.ts — VERSION FINALE ROBUSTE
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DEFAULT_CONFIG = {
    points_per_view: 1,
    timer_seconds: 20,
    daily_limit: 15,
    cooldown_seconds: 60,
};

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
        console.error('[REWARDED] MISSING SERVICE KEY');
        return res.status(500).json({ error: 'Service key missing' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =============================================
    // GET ?action=get
    // =============================================
    if (req.method === 'GET' && req.query.action === 'get') {
        try {
            const userId = req.query.user_id as string;
            if (!userId) return res.status(400).json({ error: 'user_id required' });

            // 1. Charger config
            let config = DEFAULT_CONFIG;
            try {
                const cfg = await supabase.from('admin_config').select('value').eq('key', 'rewarded_ad_config').single();
                if (cfg.data?.value) config = { ...DEFAULT_CONFIG, ...cfg.data.value };
            } catch (e) {                console.log('[REWARDED-GET] No custom config, using defaults');
            }

            // 2. Limite quotidienne
            const today = new Date().toISOString().split('T')[0];
            const { data: todayViews, error: tvError } = await supabase
                .from('transactions').select('id')
                .eq('user_id', userId).eq('title', 'Pub récompensée')
                .gte('created_at', today + 'T00:00:00');
            
            if (tvError) console.error('[REWARDED-GET] Transactions error:', tvError.message);
            const viewsToday = todayViews?.length || 0;
            
            if (viewsToday >= config.daily_limit) {
                return res.status(200).json({ available: false, reason: 'daily_limit_reached', views_today: viewsToday, daily_limit: config.daily_limit });
            }

            // 3. Cooldown
            const { data: lastView, error: lvError } = await supabase
                .from('transactions').select('created_at')
                .eq('user_id', userId).eq('title', 'Pub récompensée')
                .order('created_at', { ascending: false }).limit(1).single();
            
            if (lvError && lvError.code !== 'PGRST116') console.error('[REWARDED-GET] Last view error:', lvError.message);
            
            if (lastView) {
                const elapsed = (Date.now() - new Date(lastView.created_at).getTime()) / 1000;
                if (elapsed < config.cooldown_seconds) {
                    return res.status(200).json({ available: false, reason: 'cooldown_active', wait_seconds: Math.ceil(config.cooldown_seconds - elapsed) });
                }
            }

            // 4. Charger les pubs
            const { data: adsData, error: adsError } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'ad_networks')
                .single();

            if (adsError || !adsData?.value) {
                console.error('[REWARDED-GET] No ads found:', adsError?.message);
                return res.status(200).json({ available: false, reason: 'no_ads_config' });
            }

            const allAds = adsData.value as Array<any>;
            console.log('[REWARDED-GET] Total ads:', allAds.length);

            // 5. Filtrer mode=rewarded
            const rewardedAds = allAds.filter((ad: any) =>
                ad.mode === 'rewarded' &&                ad.active === true &&
                ad.code && ad.code.trim().length > 0
            );

            console.log('[REWARDED-GET] Rewarded ads found:', rewardedAds.length);

            if (rewardedAds.length === 0) {
                // Debug: afficher tous les modes disponibles
                const modes = allAds.map((a: any) => a.mode || 'undefined');
                console.log('[REWARDED-GET] Available modes:', [...new Set(modes)]);
                return res.status(200).json({ 
                    available: false, 
                    reason: 'no_rewarded_ads',
                    debug: { total_ads: allAds.length, modes: [...new Set(modes)] }
                });
            }

            // 6. Sélectionner une pub
            const ad = rewardedAds[Math.floor(Math.random() * rewardedAds.length)];
            const code = ad.code.trim();
            const isUrl = code.startsWith('http://') || code.startsWith('https://');
            const token = generateToken();

            // 7. Stocker le token
            const { error: tokenError } = await supabase.from('admin_config').upsert({
                key: 'rewarded_token_' + token,
                value: { 
                    user_id: userId, 
                    created_at: Date.now(), 
                    ad_name: ad.name, 
                    points: config.points_per_view, 
                    timer: config.timer_seconds, 
                    claimed: false 
                }
            }, { onConflict: 'key' });

            if (tokenError) {
                console.error('[REWARDED-GET] Token save error:', tokenError.message);
                return res.status(500).json({ error: 'Failed to create session' });
            }

            return res.status(200).json({
                available: true, 
                token,
                ad_url: isUrl ? code : null,
                ad_html: isUrl ? null : code,
                ad_name: ad.name || 'Offre Partenaire',
                timer_seconds: config.timer_seconds,
                points_reward: config.points_per_view,
                views_today: viewsToday,                 daily_limit: config.daily_limit
            });

        } catch (e: any) {
            console.error('[REWARDED-GET] Fatal error:', e);
            return res.status(500).json({ error: e.message, stack: e.stack });
        }
    }

    // =============================================
    // POST ?action=claim
    // =============================================
    if (req.method === 'POST' && req.query.action === 'claim') {
        try {
            const { token, user_id } = req.body;
            if (!token || !user_id) return res.status(400).json({ error: 'token and user_id required' });

            const { data: tokenData, error: tdError } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'rewarded_token_' + token)
                .single();

            if (tdError || !tokenData?.value) {
                console.error('[REWARDED-CLAIM] Token not found:', tdError?.message);
                return res.status(400).json({ error: 'invalid_token' });
            }

            const session = tokenData.value as any;
            if (session.user_id !== user_id) return res.status(403).json({ error: 'token_mismatch' });
            if (session.claimed === true) return res.status(400).json({ error: 'already_claimed' });

            const elapsedSec = (Date.now() - session.created_at) / 1000;
            if (elapsedSec < session.timer) {
                return res.status(400).json({
                    error: 'timer_not_complete',
                    remaining_seconds: Math.ceil(session.timer - elapsedSec)
                });
            }

            // Marquer réclamé
            await supabase
                .from('admin_config')
                .update({ value: { ...session, claimed: true } })
                .eq('key', 'rewarded_token_' + token);

            const pointsReward = Math.floor(session.points || DEFAULT_CONFIG.points_per_view);

            // Créditer points via RPC (fonction SQL créée précédemment)
            const { error: rpcError } = await supabase.rpc('add_user_points', {                user_uuid: user_id,
                points_to_add: pointsReward
            });

            if (rpcError) {
                console.error('[REWARDED-CLAIM] RPC error:', rpcError.message);
                // Fallback direct
                const { data: userData } = await supabase
                    .from('user_data').select('points').eq('uuid', user_id).single();
                
                if (userData) {
                    await supabase.from('user_data')
                        .update({ points: (userData.points || 0) + pointsReward })
                        .eq('uuid', user_id);
                } else {
                    await supabase.from('user_data')
                        .insert({ uuid: user_id, points: pointsReward });
                }
            }

            // Transaction
            await supabase.from('transactions').insert({
                user_id: user_id,
                type: 'earned',
                title: 'Pub récompensée',
                amount: pointsReward
            });

            // Solde final
            const { data: finalData } = await supabase
                .from('user_data').select('points').eq('uuid', user_id).single();

            return res.status(200).json({
                success: true,
                points_earned: pointsReward,
                new_balance: finalData?.points || pointsReward
            });

        } catch (e: any) {
            console.error('[REWARDED-CLAIM] Fatal:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
}
