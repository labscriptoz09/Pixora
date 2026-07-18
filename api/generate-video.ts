import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const SUPABASE_URL = process.env.SUPABASE_URL;
// @ts-ignore  
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

export default async function handler(req: Request) {
    // Headers pour toujours retourner du JSON
    const headers = { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Gestion preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers, status: 200 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405,
            headers 
        });
    }

    try {
        const body = await req.json();
        const prompt = body.prompt;
        
        if (!prompt || typeof prompt !== 'string') {
            return new Response(JSON.stringify({ error: 'Prompt requis' }), { 
                status: 400,
                headers 
            });
        }

        // Création client Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

        // Récupération clé HF
        const { data: config, error: cfgErr } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'api_keys')
            .single();

        if (cfgErr || !config?.value?.huggingface) {            console.error('Clé HF manquante:', cfgErr);
            return new Response(JSON.stringify({ error: 'Clé Hugging Face manquante' }), { 
                status: 500,
                headers 
            });
        }
        const hfKey = config.value.huggingface;
        console.log('Clé HF trouvée, appel API...');

        // Appel Hugging Face ZeroScope
        const hfRes = await fetch('https://api-inference.huggingface.co/models/cerspense/zeroscope_v2_576w', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { 
                    num_frames: 24, 
                    width: 576, 
                    height: 320, 
                    fps: 24 
                }
            })
        });

        console.log('Réponse HF status:', hfRes.status);

        if (!hfRes.ok) {
            const text = await hfRes.text();
            console.error('HF erreur:', text);
            return new Response(JSON.stringify({ 
                error: `HF ${hfRes.status}`, 
                details: text 
            }), { 
                status: hfRes.status,
                headers 
            });
        }

        // Récupération blob vidéo
        const videoBlob = await hfRes.blob();
        const fileName = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp4`;
        console.log('Upload vers Supabase:', fileName);

        // Upload vers Supabase Storage
        const { error: uploadErr } = await supabase.storage
            .from('pixora-gallery')
            .upload(fileName, videoBlob, {                contentType: 'video/mp4',
                cacheControl: '3600'
            });

        if (uploadErr) {
            console.error('Upload échoué:', uploadErr);
            return new Response(JSON.stringify({ error: 'Upload échoué' }), { 
                status: 500,
                headers 
            });
        }

        // URL publique
        const { data: publicUrl } = supabase.storage.from('pixora-gallery').getPublicUrl(fileName);
        console.log('URL générée:', publicUrl.data);

        return new Response(JSON.stringify({ url: publicUrl.data }), {
            headers 
        });

    } catch (e: any) {
        console.error('Erreur backend complète:', e);
        return new Response(JSON.stringify({ 
            error: 'Internal server error', 
            message: e.message || 'Unknown error',
            stack: e.stack 
        }), { 
            status: 500,
            headers 
        });
    }
}
