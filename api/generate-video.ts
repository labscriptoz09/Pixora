import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { prompt } = await req.json();
        if (!prompt || typeof prompt !== 'string') {
            return new Response(JSON.stringify({ error: 'Prompt requis' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

        const { data: config, error: cfgErr } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'api_keys')
            .single();

        if (cfgErr || !config?.value?.huggingface) {
            return new Response(JSON.stringify({ error: 'Clé Hugging Face manquante' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const hfKey = config.value.huggingface;

        const hfRes = await fetch('https://api-inference.huggingface.co/models/cerspense/zeroscope_v2_576w', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { num_frames: 24, width: 576, height: 320, fps: 24 }
            })
        });

        if (!hfRes.ok) {
            const text = await hfRes.text();
            return new Response(JSON.stringify({ error: `HF ${hfRes.status}`, details: text }), { 
                status: hfRes.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const videoBlob = await hfRes.blob();
        const fileName = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp4`;

        const { error: uploadErr } = await supabase.storage
            .from('pixora-gallery')
            .upload(fileName, videoBlob, {
                contentType: 'video/mp4',
                cacheControl: '3600'
            });

        if (uploadErr) {
            return new Response(JSON.stringify({ error: 'Upload échoué' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data: publicUrl } = supabase.storage.from('pixora-gallery').getPublicUrl(fileName);

        return new Response(JSON.stringify({ url: publicUrl.data }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Erreur backend:', e);
        return new Response(JSON.stringify({ error: 'Internal server error', message: e instanceof Error ? e.message : 'Unknown' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
