// /api/admin-users.ts — v1.0 — Proxy Admin Users (Black Box RPC)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = 'leonard@pixora.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Service key missing' });

    try {
        // ✅ Vérification auth admin (même pattern que admin-save)
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant' });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !userData.user || userData.user.email?.toLowerCase() !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Accès refusé — admin uniquement' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { action } = req.body;

        // =============================================
        // ACTION: list — Lister tous les utilisateurs
        // =============================================
        if (action === 'list') {
            const { data, error } = await supabase.rpc('admin_get_users');
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true, users: data || [] });
        }

        // =============================================
        // ACTION: update — Modifier points/streak/banned
        // =============================================
        if (action === 'update') {
            const { user_id, points, rewarded_count, banned } = req.body;
            if (!user_id) return res.status(400).json({ error: 'user_id requis' });

            const { data, error } = await supabase.rpc('admin_update_user', {
                p_user_id: user_id,
                p_points: points ?? null,
                p_rewarded_count: rewarded_count ?? null,
                p_banned: banned ?? null
            });

            if (error) return res.status(500).json({ error: error.message });
            if (data && !data.success) return res.status(400).json(data);
            return res.status(200).json({ ok: true, ...data });
        }

        // =============================================
        // ACTION: delete — Supprimer utilisateur + données
        // =============================================
        if (action === 'delete') {
            const { user_id } = req.body;
            if (!user_id) return res.status(400).json({ error: 'user_id requis' });

            const { data, error } = await supabase.rpc('admin_delete_user', {
                p_user_id: user_id
            });

            if (error) return res.status(500).json({ error: error.message });
            if (data && !data.success) return res.status(400).json(data);
            return res.status(200).json({ ok: true, ...data });
        }

        return res.status(400).json({ error: 'Action invalide. Utiliser: list, update, delete' });

    } catch (e: any) {
        console.error('[ADMIN-USERS] Error:', e.message);
        return res.status(500).json({ error: e.message });
    }
}
