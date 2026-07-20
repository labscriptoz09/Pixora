declare const process: any;

const MODELS = [
  { name: 'Wan-AI/Wan2.1-T2V-1.3B', cost: 1 },
  { name: 'THUDM/CogVideoX-5b', cost: 2 },
  { name: 'Lightricks/LTX-Video', cost: 1 }
];

const LUNARA_SUFFIXES = [
  ', cinematic lighting, volumetric fog, shallow depth of field, 4k',
  ', professional photography, dramatic shadows, golden hour'
];

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function getNextKey(): string {
  const keys = [
    process.env.SILICONFLOW_KEY_1,
    process.env.SILICONFLOW_KEY_2,
    process.env.SILICONFLOW_KEY_3
  ].filter(Boolean);
  if (keys.length === 0) throw new Error('No keys');
  return keys[Math.floor(Date.now() / 3600000) % keys.length];
}

function enhancePrompt(prompt: string): string {
  const suffix = LUNARA_SUFFIXES[Math.floor(Math.random() * LUNARA_SUFFIXES.length)];
  return prompt.trim() + suffix;
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hasActiveKey: !!getNextKey(), provider: 'siliconflow' });
  }

  try {
    const apiKey = getNextKey();
    const body = req.body || {};
    const rawPrompt = String(body.prompt || '').trim() || 'a cat running';
    const enhancedPrompt = enhancePrompt(rawPrompt);
    const model = MODELS[body.quality === 'premium' ? 1 : 0];

    const response = await fetch('https://api.siliconflow.com/v1/video/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.name,
        prompt: enhancedPrompt,
        width: 832,
        height: 480,
        duration: 5
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(response.status).json({ error: `HTTP ${response.status}`, raw: text.slice(0, 300) });
    }

    const data = await response.json();
    const videoUrl = data?.videos?.[0]?.url || data?.data?.[0]?.url;

    if (!videoUrl) {
      return res.status(502).json({ error: 'No video URL in response', raw: JSON.stringify(data).slice(0, 300) });
    }

    return res.status(200).json({ url: videoUrl, model: model.name, prompt_used: enhancedPrompt, mode: 'cloud-api' });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
