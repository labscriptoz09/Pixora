declare const process: any;

const MODELS = [
  { name: 'Wan-AI/Wan2.1-T2V-1.3B', cost: 1 },
  { name: 'THUDM/CogVideoX-5b', cost: 2 },
  { name: 'Lightricks/LTX-Video', cost: 1 }
];

const LUNARA_SUFFIXES = [
  ', cinematic lighting, volumetric fog, shallow depth of field, 4k',
  ', professional photography, dramatic shadows, golden hour, ultra detailed'
];

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getNextKey(): string | null {
  const keys = [
    process.env.SILICONFLOW_KEY_1,
    process.env.SILICONFLOW_KEY_2,
    process.env.SILICONFLOW_KEY_3
  ].filter(Boolean);
  if (keys.length === 0) return null;
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
    return res.status(200).json({ 
      ok: true, 
      hasActiveKey: Boolean(getNextKey()),
      provider: 'siliconflow'
    });
  }
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = getNextKey();
  if (!apiKey) return res.status(500).json({ error: 'No API key' });
  const body = req.body || {};
  const prompt = enhancePrompt(String(body.prompt || 'a cat running'));
  const model = MODELS[body.quality === 'premium' ? 1 : 0];

  try {
    // ÉTAPE 1: Soumettre la tâche
    const submitRes = await fetch('https://api.siliconflow.cn/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.name,
        prompt: prompt,
        width: 832,
        height: 480,
        video_length: 5
      })
    });

    if (!submitRes.ok) {
      const err = await submitRes.text().catch(() => '');
      return res.status(502).json({ error: `Submit failed ${submitRes.status}`, raw: err.slice(0, 200) });
    }

    const submitData = await submitRes.json();
    const taskId = submitData?.data?.id || submitData?.id;
    
    if (!taskId) {
      return res.status(502).json({ error: 'No task_id', raw: JSON.stringify(submitData).slice(0, 300) });
    }

    // ÉTAPE 2: Poller le résultat (max 60s)
    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
      await new Promise(r => setTimeout(r, 3000));
      
      const statusRes = await fetch(`https://api.siliconflow.cn/v1/videos/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!statusRes.ok) continue;
      
      const statusData = await statusRes.json();
      const status = statusData?.data?.status || statusData?.status;
      
      if (status === 'completed') {
        const videoUrl = statusData?.data?.video?.url || statusData?.data?.url;        return res.status(200).json({ 
          url: videoUrl, 
          model: model.name,
          prompt_used: prompt,
          mode: 'cloud-api'
        });
      }
      
      if (status === 'failed') {
        return res.status(502).json({ error: 'Generation failed', raw: JSON.stringify(statusData).slice(0, 300) });
      }
    }

    return res.status(504).json({ error: 'Timeout 60s' });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
