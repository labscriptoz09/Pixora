// api/gen-video.ts — Kling AI v1.6 Integration
// ✅ Validé : Adsterra/Monetag actifs, SiliconFlow 404 confirmé
// 📌 Priorité : Vidéo IA gratuite via free tier Kling (66 crédits/jour)

declare const process: any;

const MODELS = [
  { name: 'kling-ai/kling-v1.6', quality: 'fast' },   // Default, 1 crédit
  { name: 'kling-ai/kling-v1.6-pro', quality: 'premium' } // Pro, 2 crédits
];

const LUNARA_SUFFIXES = [
  ', cinematic lighting, volumetric fog, shallow depth of field, 4k',
  ', professional photography, dramatic shadows, golden hour, ultra detailed'
];

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function getKlingKey(): string {
  const key = process.env.KLING_API_KEY;
  if (!key) throw new Error('KLING_API_KEY missing in env');
  return key;
}

function enhancePrompt(prompt: string): string {
  const suffix = LUNARA_SUFFIXES[Math.floor(Math.random() * LUNARA_SUFFIXES.length)];
  return prompt.trim() + suffix;
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET ping
  if (req.method === 'GET') {
    try {
      const key = getKlingKey();
      return res.status(200).json({
        ok: true,
        hasActiveKey: !!key,
        provider: 'klingai',
        ts: Date.now()
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }  }

  // POST generation
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const apiKey = getKlingKey();
    const body = req.body || {};
    const rawPrompt = String(body.prompt || '').trim() || 'a cat running';
    const enhancedPrompt = enhancePrompt(rawPrompt);
    const quality = body.quality === 'premium' ? 'premium' : 'fast';
    const model = MODELS.find(m => m.quality === quality) || MODELS[0];

    // ÉTAPE 1: Soumettre la tâche à Kling
    const submitRes = await fetch('https://api.klingai.com/v1/videos/text2video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_name: model.name,
        prompt: enhancedPrompt,
        duration: 5,
        mode: 'text2video'
      })
    });

    if (!submitRes.ok) {
      const text = await submitRes.text().catch(() => '');
      return res.status(submitRes.status).json({
        error: `Submit failed ${submitRes.status}`,
        raw: text.slice(0, 300)
      });
    }

    const submitData = await submitRes.json();
    const taskId = submitData?.task_id || submitData?.id;

    if (!taskId) {
      return res.status(502).json({
        error: 'No task_id in response',
        raw: JSON.stringify(submitData).slice(0, 300)
      });
    }

    // ÉTAPE 2: Poller jusqu'à complétion (max 60s)
    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(`https://api.klingai.com/v1/videos/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      const status = statusData?.status || statusData?.state;

      if (status === 'completed') {
        const videoUrl = statusData?.video_url || statusData?.video?.url;
        if (!videoUrl) {
          return res.status(502).json({ error: 'No video_url in completed response', raw: JSON.stringify(statusData).slice(0, 300) });
        }
        return res.status(200).json({
          url: videoUrl,
          model: model.name,
          prompt_used: enhancedPrompt,
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
