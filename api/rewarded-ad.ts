// /api/rewarded-ad.ts — DEBUG COMPLET
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('[REWARDED] Service key present:', !!SUPABASE_SERVICE_KEY);

const DEFAULT_CONFIG = {
    points_per_view: 0.5,
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
        console.error('[REWARDED] Missing service key');
        return res.status(500).json({ error: 'Service key missing' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (req.method === 'POST' && req.query.action === 'claim') {
        console.log('[REWARDED-CLAIM] Starting claim process');
        try {
            const { token, user_id } = req.body;
            console.log('[REWARDED-CLAIM] Input:', { token, user_id });
            
            if (!token || !user_id) {
                console.error('[REWARDED-CLAIM] Missing token or user_id');
                return res.status(400).json({ error: 'token and user_id required' });
            }

            // Récupérer le token            console.log('[REWARDED-CLAIM] Fetching token from DB');
            const { data: tokenData, error: tokenError } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'rewarded_token_' + token)
                .single();
            
            if (tokenError || !tokenData?.value) {
                console.error('[REWARDED-CLAIM] Token not found:', tokenError);
                return res.status(400).json({ error: 'invalid_token' });
            }

            const session = tokenData.value as any;
            console.log('[REWARDED-CLAIM] Token data:', session);

            if (session.user_id !== user_id) {
                console.error('[REWARDED-CLAIM] Token mismatch');
                return res.status(403).json({ error: 'token_mismatch' });
            }
            if (session.claimed === true) {
                console.error('[REWARDED-CLAIM] Already claimed');
                return res.status(400).json({ error: 'already_claimed' });
            }

            // Vérifier timer
            const elapsedSec = (Date.now() - session.created_at) / 1000;
            console.log('[REWARDED-CLAIM] Elapsed:', elapsedSec, 's, Required:', session.timer, 's');
            
            if (elapsedSec < session.timer) {
                return res.status(400).json({ 
                    error: 'timer_not_complete', 
                    remaining_seconds: Math.ceil(session.timer - elapsedSec) 
                });
            }

            // Marquer comme réclamé
            console.log('[REWARDED-CLAIM] Marking as claimed');
            const { error: updateError } = await supabase
                .from('admin_config')
                .update({ value: { ...session, claimed: true } })
                .eq('key', 'rewarded_token_' + token);
            
            if (updateError) {
                console.error('[REWARDED-CLAIM] Failed to mark claimed:', updateError);
            }

            // Créditer points
            const pointsReward = session.points || DEFAULT_CONFIG.points_per_view;
            console.log('[REWARDED-CLAIM] Crediting points:', pointsReward);
            // Vérifier si user_data existe
            console.log('[REWARDED-CLAIM] Checking if user_data exists');
            const { data: userData, error: selectError } = await supabase
                .from('user_data')
                .select('points, total_earned')
                .eq('user_id', user_id)
                .single();

            console.log('[REWARDED-CLAIM] User data:', userData, 'Error:', selectError);

            if (selectError || !userData) {
                console.log('[REWARDED-CLAIM] User not found, creating with UPSERT');
                const { data: upsertData, error: upsertError } = await supabase
                    .from('user_data')
                    .upsert({
                        user_id: user_id,
                        points: pointsReward,
                        total_earned: pointsReward
                    }, { onConflict: 'user_id' });
                
                console.log('[REWARDED-CLAIM] UPSERT result:', upsertData, 'Error:', upsertError);
                if (upsertError) {
                    console.error('[REWARDED-CLAIM] UPSERT failed:', upsertError);
                    return res.status(500).json({ error: 'Failed to create user data', details: upsertError.message });
                }
            } else {
                console.log('[REWARDED-CLAIM] User found, updating');
                const { data: updateData, error: updateError } = await supabase
                    .from('user_data')
                    .update({
                        points: (userData.points || 0) + pointsReward,
                        total_earned: (userData.total_earned || 0) + pointsReward
                    })
                    .eq('user_id', user_id);
                
                console.log('[REWARDED-CLAIM] UPDATE result:', updateData, 'Error:', updateError);
                if (updateError) {
                    console.error('[REWARDED-CLAIM] UPDATE failed:', updateError);
                    return res.status(500).json({ error: 'Failed to update user data', details: updateError.message });
                }
            }

            // Transaction
            console.log('[REWARDED-CLAIM] Inserting transaction');
            const { error: transError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user_id,
                    type: 'earned',
                    title: 'Pub récompensée',                    amount: pointsReward
                });
            
            if (transError) {
                console.error('[REWARDED-CLAIM] Transaction insert failed:', transError);
            }

            // Lire le nouveau solde
            const { data: finalData } = await supabase
                .from('user_data')
                .select('points')
                .eq('user_id', user_id)
                .single();

            console.log('[REWARDED-CLAIM] Final balance:', finalData?.points);

            return res.status(200).json({
                success: true,
                points_earned: pointsReward,
                new_balance: finalData?.points || pointsReward
            });

        } catch (e: any) {
            console.error('[REWARDED-CLAIM] Fatal error:', e);
            console.error('[REWARDED-CLAIM] Stack:', e.stack);
            return res.status(500).json({ error: e.message, stack: e.stack });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
}
