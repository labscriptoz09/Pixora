// /api/serve-ad.ts — RESTAURÉ : Renvoie le code HTML/script BRUT
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=30');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const page = (req.query.page as string) || 'index';
        const position = (req.query.position as string) || 'top';

        if (!SUPABASE_SERVICE_KEY) {
            return res.status(500).json({ error: 'Service key missing' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data, error } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'ad_networks')
            .single();

        if (error || !data || !data.value) {
            return res.status(200).json({ html: '', name: '', url: '' });
        }

        const allAds = data.value as Array<{
            name: string;
            page: string;
            type: string;
            position: string;
            points: number;
            code: string;
            active: boolean;
        }>;

        const matchingAds = allAds.filter(ad =>
            ad.page === page &&
            ad.position === position &&
            ad.active === true &&
            ad.code && ad.code.trim().length > 0
        );

        if (matchingAds.length === 0) {
            return res.status(200).json({ html: '', name: '', url: '' });
        }

        const ad = matchingAds[0];
        const code = ad.code.trim();

        // ✅ RENVOIE LE CODE TEL QUEL (script HTML ou URL)
        // Plus aucune transformation en bouton
        return res.status(200).json({
            html: code,
            name: ad.name || '',
            url: code.startsWith('http') ? code : '',
            points: ad.points || 0
        });

    } catch (e: any) {
        console.error('[SERVE-AD] Error:', e.message);
        return res.status(200).json({ html: '', name: '', url: '' });
    }
}
