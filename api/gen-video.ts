// api/gen-video.ts
// ✅ Agnes en priorité, fallback Hugging Face
// ✅ Pas de Pollinations (renvoie une image, pas une vidéo)

declare const process: any;

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/videos';
const AGNES_STATUS_URL = (id: string) => `https://apihub.agnes-ai.com/v1/videos/${id}`;
const HF_URL = 'https://api-inference.huggingface.co/models/cerspense/zeroscope_v2_576w';

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// ========== GET ==========
async function handleGet(req: any, res: any) {
  const { taskId } = req.query;

  if (!taskId) {
    return res.status(200).json({
      ok: true,
      hasAgnes: !!process.env.AGNES_API_KEY,
      hasHF: !!process.env.HUGGINGFACE_API_KEY
    });
  }

  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AGNES_API_KEY manquante' });
  }

  try {
    const statusRes = await fetch(AGNES_STATUS_URL(taskId), {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!statusRes.ok) {
      return res.status(statusRes.status).json({ error: `Statut ${statusRes.status}` });
    }

    const data = await statusRes.json();
    const status = data?.status || data?.state || 'unknown';
    const videoUrl = data?.video_url || data?.video?.url || data?.url;

    if (status === 'completed' && videoUrl) {
      return res.status(200).json({ status: 'completed', url: videoUrl });
    } else if (status === 'failed') {
      return res.status(200).json({ status: 'failed', error: data?.message });
    } else {
      return res.status(200).json({ status: 'processing' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ========== Hugging Face ==========
async function generateHF(prompt: string, hfKey: string): Promise<string> {
  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { num_frames: 24, width: 576, height: 320, fps: 24 }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF ${res.status}: ${text.slice(0, 200)}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ========== POST ==========
async function handlePost(req: any, res: any) {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt requis' });
  }

  const agnesKey = process.env.AGNES_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  // ✅ 1. PRIORITÉ AGNES (10s max)
  if (agnesKey) {
    try {
      console.log('[Agnes] 🚀 Tentative...');

      const submitRes = await fetch(AGNES_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${agnesKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'agnes-video-v2.0',
          prompt: prompt.trim(),
          duration: 2,
          width: 576,
          height: 320
        })
      });

      if (!submitRes.ok) {
        const text = await submitRes.text();
        console.warn('[Agnes] ❌ Erreur:', text);
        throw new Error(`Agnes ${submitRes.status}`);
      }

      const data = await submitRes.json();
      const taskId = data?.id || data?.task_id || data?.video_id;

      if (!taskId) {
        throw new Error('Aucun taskId');
      }

      const start = Date.now();
      while (Date.now() - start < 10000) {
        await new Promise(r => setTimeout(r, 1500));

        const statusRes = await fetch(AGNES_STATUS_URL(taskId), {
          headers: { 'Authorization': `Bearer ${agnesKey}` }
        });

        if (!statusRes.ok) continue;

        const statusData = await statusRes.json();
        const status = statusData?.status || statusData?.state;
        const videoUrl = statusData?.video_url || statusData?.video?.url || statusData?.url;

        if (status === 'completed' && videoUrl) {
          console.log('[Agnes] ✅ Vidéo en', (Date.now() - start) / 1000, 's');
          return res.status(200).json({ url: videoUrl, provider: 'agnes-ai' });
        }

        if (status === 'failed') {
          throw new Error('Échec génération Agnes');
        }
      }

      console.log('[Agnes] ⏱️ Trop lent (>10s) → fallback HF');

    } catch (err: any) {
      console.warn('[Agnes] ❌', err.message);
    }
  }

  // ✅ 2. FALLBACK HUGGING FACE
  if (hfKey) {
    try {
      console.log('[HF] 🚀 Fallback...');
      const url = await generateHF(prompt, hfKey);
      return res.status(200).json({ url, provider: 'huggingface' });
    } catch (err: any) {
      console.error('[HF] ❌', err.message);
      return res.status(500).json({
        error: 'Hugging Face échoué. Vérifie ta clé ou réessaie plus tard.',
        details: err.message
      });
    }
  }

  // ✅ 3. AUCUNE CLÉ
  return res.status(500).json({
    error: 'Aucun provider disponible. Configure AGNES_API_KEY ou HUGGINGFACE_API_KEY.',
    details: 'Agnes: ' + (agnesKey ? 'OK' : 'manquante') + ' | HF: ' + (hfKey ? 'OK' : 'manquante')
  });
}

// ========== HANDLER ==========
export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Méthode non autorisée' });
}
