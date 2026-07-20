// api/gen-video.ts - SiliconFlow Multi-Key Router + Lunara Enhancer
declare const process: any;

const MODELS = [
  { name: 'Wan-AI/Wan2.1-T2V-1.3B', cost: 1, quality: 'fast' },
  { name: 'THUDM/CogVideoX-5b', cost: 2, quality: 'premium' },
  { name: 'Lightricks/LTX-Video', cost: 1, quality: 'balanced' }
];

const LUNARA_SUFFIXES = [
  ', cinematic lighting, volumetric fog, shallow depth of field, 4k resolution, film grain, color graded',
  ', professional photography, dramatic shadows, golden hour, ultra detailed, photorealistic textures',
  ', anime style, vibrant colors, dynamic composition, studio ghibli inspired, smooth motion blur'
];

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function getNextKey(): string | null {
  const keys = [
    process.env.SILICONFLOW_KEY_1,
    process.env.SILICONFLOW_KEY_2,
    process.env.SILICONFLOW_KEY_3
  ].filter(Boolean);
  
  if (keys.length === 0) return null;
  // Rotation simple basée sur l'heure UTC pour répartir la charge
  const index = Math.floor(Date.now() / 3600000) % keys.length;
  return keys[index];
}

function enhancePrompt(prompt: string): string {
  const suffix = LUNARA_SUFFIXES[Math.floor(Math.random() * LUNARA_SUFFIXES.length)];
  return prompt.trim() + suffix;
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    const key = getNextKey();
    return res.status(200).json({ 
      ok: true, 
      hasActiveKey: Boolean(key), 
      runtime: 'node', 
      provider: 'siliconflow',      ts: Date.now() 
    });
  }
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST ou GET seulement' });

  const apiKey = getNextKey();
  if (!apiKey) return res.status(500).json({ error: 'Aucune clé SiliconFlow configurée' });

  const body = req.body || {};
  const rawPrompt = String(body.prompt || '').trim() || 'a cat running in a field';
  const enhancedPrompt = enhancePrompt(rawPrompt);
  const selectedModel = MODELS[body.quality === 'premium' ? 1 : (body.quality === 'fast' ? 0 : 2)];

  try {
    const response = await fetch('https://api.siliconflow.com/v1/video/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel.name,
        prompt: enhancedPrompt,
        width: 832,
        height: 480,
        num_frames: 81,
        fps: 16,
        guidance_scale: 5.0,
        num_inference_steps: selectedModel.cost === 1 ? 20 : 30
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(502).json({ 
        error: `SiliconFlow HTTP ${response.status}`, 
        raw: errText.slice(0, 300) 
      });
    }

    const data = await response.json();
    
    // SiliconFlow retourne une URL directe dans data.videos[0].url
    const videoUrl = data?.videos?.[0]?.url || data?.data?.[0]?.url;
    
    if (!videoUrl) {
      return res.status(502).json({ 
        error: 'Pas d\'URL vidéo dans la réponse', 
        raw: JSON.stringify(data).slice(0, 300)       });
    }

    return res.status(200).json({ 
      url: videoUrl, 
      model: selectedModel.name,
      prompt_used: enhancedPrompt,
      mode: 'cloud-api'
    });

  } catch (err: any) {
    const msg = err?.message || String(err);
    return res.status(500).json({ error: msg });
  }
}
