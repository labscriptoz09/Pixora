/// api/gen-video.ts
// ✅ Agnes AI uniquement (pas de fallback)
// ✅ Durée 2s, timeout 25s
// ✅ GET = ping + statut, POST = soumission + polling

declare const process: any;

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/videos';
const AGNES_STATUS_URL = (id: string) => `https://apihub.agnes-ai.com/v1/videos/${id}`;

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// ========== GET ==========
async function handleGet(req: any, res: any) {
  const { taskId } = req.query;

  // Ping
  if (!taskId) {
    const hasKey = !!process.env.AGNES_API_KEY;
    return res.status(200).json({
      ok: true,
      hasKey,
      provider: 'agnes-ai'
    });
  }

  // Statut
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

// ========== POST ==========
async function handlePost(req: any, res: any) {
  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AGNES_API_KEY manquante' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt requis' });
  }

  try {
    // 1. Soumission
    console.log('[Agnes] 🚀 Soumission:', prompt);

    const submitRes = await fetch(AGNES_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      console.error('[Agnes] ❌ Erreur soumission:', text);
      return res.status(submitRes.status).json({
        error: `Soumission ${submitRes.status}`,
        raw: text.slice(0, 300)
      });
    }

    const data = await submitRes.json();
    const taskId = data?.id || data?.task_id || data?.video_id;

    if (!taskId) {
      return res.status(502).json({ error: 'Aucun taskId reçu' });
    }

    console.log('[Agnes] 🆔 Task ID:', taskId);

    // 2. Polling (max 25s)
    const start = Date.now();
    while (Date.now() - start < 25000) {
      await new Promise(r => setTimeout(r, 2000));

      const statusRes = await fetch(AGNES_STATUS_URL(taskId), {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      const status = statusData?.status || statusData?.state;
      const videoUrl = statusData?.video_url || statusData?.video?.url || statusData?.url;

      if (status === 'completed' && videoUrl) {
        console.log('[Agnes] ✅ Vidéo générée en', (Date.now() - start) / 1000, 's');
        return res.status(200).json({
          url: videoUrl,
          provider: 'agnes-ai',
          duration: 2,
          taskId
        });
      }

      if (status === 'failed') {
        return res.status(502).json({
          error: 'Échec génération',
          raw: JSON.stringify(statusData)
        });
      }
    }

    // Timeout : on renvoie le taskId pour que le client continue
    console.log('[Agnes] ⏱️ Timeout 25s, retour du taskId');
    return res.status(202).json({
      taskId,
      partial: true,
      message: 'En cours, interrogez /api/gen-video?taskId=' + taskId
    });

  } catch (err: any) {
    console.error('[Agnes] ❌ Erreur:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ========== HANDLER ==========
export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Méthode non autorisée' });
}
