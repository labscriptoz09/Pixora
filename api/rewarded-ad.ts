// /api/rewarded-ad.ts — v35 BLACK BOX — RPC Only
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DEFAULT_CONFIG = {
    points_per_view: 1,
    timer_seconds: 20,
    daily_limit: 5,
    cooldown_seconds: 60,
};

function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result + '_' + Date.now();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Service key missing' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =============================================
    // GET ?action=get
    // =============================================
    if (req.method === 'GET' && req.query.action === 'get') {
        try {
            const userId = req.query.user_id as string;
            if (!userId) return res.status(400).json({ error: 'user_id required' });

            // Compteur via RPC Black Box
            const { data: viewsToday, error: countErr } = await supabase.rpc('get_daily_rewarded_count', { p_user_id: userId });
            if (countErr) console.error('[GET] RPC count error:', countErr.message);

            const config = DEFAULT_CONFIG;
            const currentViews = viewsToday || 0;

            if (currentViews >= config.daily_limit) {
                return res.status(200).json({
                    available: false, reason: 'daily_limit_reached',
                    views_today: currentViews, daily_limit: config.daily_limit,                    message: `Vous avez déjà vu ${currentViews}/${config.daily_limit} pubs aujourd'hui. Revenez demain.`
                });
            }

            // Pub aléatoire
            const { data: adsData } = await supabase.from('admin_config').select('value').eq('key', 'ad_networks').single();
            if (!adsData?.value) return res.status(200).json({ available: false, reason: 'no_ads' });

            const rewardedAds = (adsData.value as any[]).filter(ad => ad.mode === 'rewarded' && ad.active && ad.code?.trim());
            if (rewardedAds.length === 0) return res.status(200).json({ available: false, reason: 'no_rewarded_ads' });

            const ad = rewardedAds[Math.floor(Math.random() * rewardedAds.length)];
            const code = ad.code.trim();
            const isUrl = code.startsWith('http');
            const token = generateToken();

            await supabase.from('admin_config').upsert({
                key: 'rewarded_token_' + token,
                value: { user_id: userId, created_at: Date.now(), points: config.points_per_view, timer: config.timer_seconds, claimed: false }
            }, { onConflict: 'key' });

            return res.status(200).json({
                available: true, token,
                ad_url: isUrl ? code : null, ad_html: isUrl ? null : code,
                ad_name: ad.name || 'Offre Partenaire',
                timer_seconds: config.timer_seconds, points_reward: config.points_per_view,
                views_today: currentViews, daily_limit: config.daily_limit
            });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // =============================================
    // POST ?action=claim
    // =============================================
    if (req.method === 'POST' && req.query.action === 'claim') {
        try {
            const { token, user_id } = req.body;
            if (!token || !user_id) return res.status(400).json({ error: 'token and user_id required' });

            // Validation token
            const { data: tokenData } = await supabase.from('admin_config').select('value').eq('key', 'rewarded_token_' + token).single();
            if (!tokenData?.value) return res.status(400).json({ error: 'invalid_token' });

            const session = tokenData.value as any;
            if (session.user_id !== user_id) return res.status(403).json({ error: 'token_mismatch' });
            if (session.claimed) return res.status(400).json({ error: 'already_claimed' });

            const elapsed = (Date.now() - session.created_at) / 1000;            if (elapsed < session.timer) {
                return res.status(400).json({ error: 'timer_not_complete', remaining_seconds: Math.ceil(session.timer - elapsed) });
            }

            // Marquer token comme utilisé
            await supabase.from('admin_config').update({ value: { ...session, claimed: true } }).eq('key', 'rewarded_token_' + token);

            // ✅ CLAIM via RPC Black Box (limite + cooldown + insert + crédit en 1 appel)
            const { data: result, error: rpcErr } = await supabase.rpc('claim_rewarded_ad', {
                p_user_id: user_id,
                p_points: Math.floor(session.points || DEFAULT_CONFIG.points_per_view)
            });

            if (rpcErr) return res.status(500).json({ error: rpcErr.message });
            if (!result.success) return res.status(400).json(result);

            return res.status(200).json(result);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
}
