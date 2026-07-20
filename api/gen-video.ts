// api/gen-video.ts
// ✅ Version unifiée : gère GET (statut) et POST (soumission + polling)
// ✅ Gère le CORS correctement
// ✅ Retourne toujours du JSON valide

declare const process: any;

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/videos';
const AGNES_STATUS_URL = (id: string) => `https://apihub.agnes-ai.com/v1/videos/${id}`;

// CORS
function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json'); // Force le JSON
}

// ============================================================
//  GET : Vérifier le statut d'une tâche
// ============================================================

async function handleGet(req: any, res: any) {
  try {
    const { taskId } = req.query;
    
    // Si pas de taskId, retourner le ping
    if (!taskId) {
      const hasKey = !!process.env.AGNES_API_KEY;
      return res.status(200).json({
        ok: true,
        provider: 'agnes-ai',
        hasKey: hasKey,
        timestamp: Date.now()
      });
    }

    // Vérifier le statut de la tâche
    const apiKey = process.env.AGNES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AGNES_API_KEY manquante' });
    }

    const statusRes = await fetch(AGNES_STATUS_URL(taskId), {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!statusRes.ok) {
      const text = await statusRes.text();
      return res.status(statusRes.status).json({
        error: `Statut ${statusRes.status}`,
        raw: text.slice(0, 200)
      });
    }

    const data = await statusRes.json();
    const status = data?.status || data?.state || 'unknown';
    const videoUrl = data?.video_url || data?.video?.url || data?.url;

    if (status === 'completed' && videoUrl) {
      return res.status(200).json({ status: 'completed', url: videoUrl });
    } else if (status === 'failed') {
      return res.status(200).json({
        status: 'failed',
        error: data?.message || 'Échec de la génération'
      });
    } else {
      return res.status(200).json({ status: 'processing' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================
//  POST : Soumettre une tâche (et polling si demandé)
// ============================================================

async function handlePost(req: any, res: any) {
  try {
    const apiKey = process.env.AGNES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AGNES_API_KEY manquante' });
    }

    const { prompt, wait = false } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // 1️⃣ Soumettre la tâche
    const submitPayload = {
      model: 'agnes-video-v2.0',
      prompt: prompt.trim(),
      duration: 5,
      width: 576,
      height: 320
    };

    const submitRes = await fetch(AGNES_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitPayload)
    });

    const submitText = await submitRes.text();

    if (!submitRes.ok) {
      return res.status(submitRes.status).json({
        error: `Soumission ${submitRes.status}`,
        raw: submitText.slice(0, 300)
      });
    }

    let submitData;
    try {
      submitData = JSON.parse(submitText);
    } catch (e) {
      return res.status(502).json({
        error: 'Réponse invalide (non-JSON)',
        raw: submitText.slice(0, 300)
      });
    }

    const taskId = submitData?.id || submitData?.task_id || submitData?.video_id;
    if (!taskId) {
      return res.status(502).json({
        error: 'Aucun task_id reçu',
        raw: submitText
      });
    }

    // Si wait=false (par défaut), retourner immédiatement le taskId
    if (!wait) {
      return res.status(200).json({ taskId });
    }

    // 2️⃣ Mode synchrone (polling jusqu'à 45s) - pour compatibilité
    const start = Date.now();
    const maxWait = 45000;
    while (Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(AGNES_STATUS_URL(taskId), {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!statusRes.ok) continue;
      const data = await statusRes.json();
      const status = data?.status || data?.state;
      const videoUrl = data?.video_url || data?.video?.url || data?.url;
      if (status === 'completed' && videoUrl) {
        return res.status(200).json({ url: videoUrl, taskId, provider: 'agnes-ai' });
      }
      if (status === 'failed') {
        return res.status(502).json({ error: 'Échec de la génération' });
      }
    }

    // Timeout : on retourne le taskId pour que le client continue le polling
    return res.status(202).json({ taskId, partial: true, message: 'Toujours en cours' });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================
//  HANDLER PRINCIPAL
// ============================================================

export default async function handler(req: any, res: any) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
