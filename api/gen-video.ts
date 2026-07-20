// api/gen-video.ts
// Version améliorée avec logs et fallback

declare const process: any;

// ✅ Configuration
const KLING_API_URL = 'https://api.klingai.com/v1/videos/text2video';
const KLING_STATUS_URL = (id: string) => `https://api.klingai.com/v1/videos/${id}`;
const MAX_POLLING_TIME = 60000; // 60s
const POLL_INTERVAL = 3000; // 3s

// ✅ Fonction CORS (pour les tests)
function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ✅ Récupération de la clé API
function getKlingKey(): string {
  const key = process.env.KLING_API_KEY;
  if (!key) {
    console.error('[Kling] ❌ Clé API manquante');
    throw new Error('KLING_API_KEY manquante dans les variables d\'environnement');
  }
  console.log('[Kling] 🔑 Clé API trouvée (longueur:', key.length, ')');
  return key;
}

// ✅ Amélioration du prompt (optionnelle)
function enhancePrompt(prompt: string): string {
  const suffix = ', cinematic, 4k, detailed';
  return prompt.trim() + suffix;
}

// ✅ Fonction de polling
async function pollForVideo(taskId: string, apiKey: string): Promise<string> {
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < MAX_POLLING_TIME) {
    attempt++;
    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    try {
      const res = await fetch(KLING_STATUS_URL(taskId), {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!res.ok) {
        console.warn(`[Kling] ⚠️ Statut ${res.status} pour task ${taskId}`);
        continue;
      }

      const data = await res.json();
      console.log(`[Kling] 📦 Réponse statut (tentative ${attempt}):`, JSON.stringify(data).slice(0, 200));

      // 🔍 Différents formats possibles
      const status = data?.data?.status || data?.status || data?.state;
      const videoUrl = data?.data?.video_url || data?.video_url || data?.video?.url;

      if (status === 'completed' && videoUrl) {
        console.log('[Kling] ✅ Vidéo générée:', videoUrl);
        return videoUrl;
      }

      if (status === 'failed') {
        const errorMsg = data?.data?.message || data?.message || 'Erreur inconnue';
        throw new Error(`Échec de la génération: ${errorMsg}`);
      }

      // Autres statuts: 'submitted', 'processing', etc.
      console.log(`[Kling] ⏳ Statut actuel: ${status || 'inconnu'}`);

    } catch (err: any) {
      console.warn('[Kling] ⚠️ Erreur polling:', err.message);
      // On continue le polling malgré l'erreur
    }
  }

  throw new Error('⏱️ Timeout: la vidéo n\'a pas été générée dans les 60 secondes');
}

// ✅ Handler principal
export default async function handler(req: any, res: any) {
  setCors(res);

  // Gestion preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET = ping
  if (req.method === 'GET') {
    try {
      const key = getKlingKey();
      return res.status(200).json({
        ok: true,
        hasKey: true,
        provider: 'klingai',
        timestamp: Date.now()
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message
      });
    }
  }

  // POST = génération
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const apiKey = getKlingKey();
    const { prompt, quality = 'fast' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis (chaîne de caractères)' });
    }

    const enhanced = enhancePrompt(prompt);
    console.log('[Kling] 📝 Prompt amélioré:', enhanced);

    // 1️⃣ Soumission de la tâche
    const submitPayload = {
      model_name: quality === 'premium' ? 'kling-ai/kling-v1.6-pro' : 'kling-ai/kling-v1.6',
      prompt: enhanced,
      duration: 5,
      mode: 'text2video'
    };

    console.log('[Kling] 🚀 Soumission:', JSON.stringify(submitPayload));

    const submitRes = await fetch(KLING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitPayload)
    });

    const submitText = await submitRes.text();
    console.log('[Kling] 📨 Réponse soumission:', submitText);

    if (!submitRes.ok) {
      // Gestion spécifique du quota
      if (submitRes.status === 429) {
        return res.status(429).json({
          error: 'Quota Kling épuisé (66 crédits/jour). Réessayez demain.',
          code: 'QUOTA_EXCEEDED'
        });
      }
      return res.status(submitRes.status).json({
        error: `Échec soumission (${submitRes.status})`,
        raw: submitText.slice(0, 500)
      });
    }

    let submitData;
    try {
      submitData = JSON.parse(submitText);
    } catch (e) {
      return res.status(502).json({ error: 'Réponse invalide', raw: submitText });
    }

    const taskId = submitData?.data?.task_id || submitData?.task_id || submitData?.id;
    if (!taskId) {
      return res.status(502).json({
        error: 'Aucun task_id reçu',
        raw: JSON.stringify(submitData).slice(0, 500)
      });
    }

    console.log('[Kling] 🆔 Task ID:', taskId);

    // 2️⃣ Polling
    const videoUrl = await pollForVideo(taskId, apiKey);

    return res.status(200).json({
      url: videoUrl,
      model: quality === 'premium' ? 'kling-v1.6-pro' : 'kling-v1.6',
      prompt_used: enhanced,
      task_id: taskId
    });

  } catch (err: any) {
    console.error('[Kling] ❌ Erreur globale:', err.message);
    return res.status(500).json({
      error: err.message || 'Erreur interne du serveur'
    });
  }
}
