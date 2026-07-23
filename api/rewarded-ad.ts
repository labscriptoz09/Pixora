// /api/rewarded-ad.ts — Version finale avec RPC SQL
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Service key missing' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =============================================
    // POST ?action=claim — UTILISE LA FONCTION SQL
    // =============================================
    if (req.method === 'POST' && req.query.action === 'claim') {
        try {
            const { token, user_id } = req.body;
            if (!token || !user_id) return res.status(400).json({ error: 'token and user_id required' });

            // 1. Vérifier le token
            const { data: tokenData } = await supabase.from('admin_config').select('value').eq('key', 'rewarded_token_' + token).single();
            if (!tokenData?.value) return res.status(400).json({ error: 'invalid_token' });

            const session = tokenData.value as any;
            if (session.user_id !== user_id || session.claimed) return res.status(400).json({ error: 'invalid' });

            const elapsedSec = (Date.now() - session.created_at) / 1000;
            if (elapsedSec < session.timer) {
                return res.status(400).json({ error: 'timer_not_complete', remaining_seconds: Math.ceil(session.timer - elapsedSec) });
            }

            // 2. Marquer comme réclamé
            await supabase.from('admin_config').update({ value: { ...session, claimed: true } }).eq('key', 'rewarded_token_' + token);

            // 3. ✅ Appeler la fonction SQL (bypass RLS)
            const pointsReward = Math.floor(session.points || 1);
            const { data: rpcResult, error: rpcError } = await supabase.rpc('add_user_points', {
                user_uuid: user_id,
                points_to_add: pointsReward
            });

            if (rpcError) {
                console.error('[REWARDED] RPC error:', rpcError);
                return res.status(500).json({ error: 'Database error', details: rpcError.message });
            }

            // 4. Enregistrer la transaction
            await supabase.from('transactions').insert({
                user_id: user_id,
                type: 'earned',
                title: 'Pub récompensée',
                amount: pointsReward
            });

            // 5. Lire le nouveau solde
            const { data: userData } = await supabase.from('user_data').select('points').eq('uuid', user_id).single();

            return res.status(200).json({
                success: true,
                points_earned: pointsReward,
                new_balance: userData?.points || pointsReward
            });

        } catch (e: any) {
            console.error('[REWARDED-CLAIM] Error:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
}
