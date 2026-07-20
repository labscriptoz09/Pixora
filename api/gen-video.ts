// api/gen-video.ts
// ✅ API dédiée à Agnes AI (gratuite)
// ✅ Gère CORS, ping, soumission, polling, timeout
// ✅ Logs détaillés pour diagnostiquer les erreurs

declare const process: any;

// ============================================================
//  CONFIGURATION
// ============================================================

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/videos';
const AGNES_STATUS_URL = (id: string) => `https://apihub.agnes-ai.com/v1/videos/${id}`;
const MAX_POLLING_TIME = 60000; // 60s
const POLL_INTERVAL = 3000; // 3s

// ============================================================
//  CORS
// ============================================================

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ============================================================
//  POLLING
// ============================================================

async function pollAgnes(taskId: string, apiKey: string): Promise<string> {
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < MAX_POLLING_TIME) {
    attempt++;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    try {
      const res = await fetch(AGNES_STATUS_URL(taskId), {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!res.ok) {
        console.warn(`[Agnes] ⚠️ Statut HTTP ${res.status} pour ${taskId}`);
        continue;
      }

      const data = await res.json();
      console.log(`[Agnes] 📦 Statut (tentative ${attempt}):`, JSON.stringify(data).slice(0, 200));

      // Le format de réponse peut varier selon la version de l'API
      const status = data?.status || data?.state || data?.data?.status;
      const videoUrl = data?.video_url || data?.video?.url || data?.url || data?.data?.video_url;

      if (status === 'completed' && videoUrl) {
        console.log('[Agnes] ✅ Vidéo générée:', videoUrl);
        return videoUrl;
      }

      if (status === 'failed') {
        const errorMsg = data?.message || data?.error || 'Erreur inconnue';
        throw new Error(`Échec Agnes: ${errorMsg}`);
      }

      // Autres statuts: 'submitted', 'processing', 'queued'...
      console.log(`[Agnes] ⏳ Statut actuel: ${status || 'inconnu'}`);

    } catch (err: any) {
      console.warn('[Agnes] ⚠️ Polling error:', err.message);
      // On continue le polling malgré l'erreur (peut être réseau)
    }
  }

  throw new Error('⏱️ Timeout: génération vidéo trop longue (>60s)');
}

// ============================================================
//  HANDLER PRINCIPAL
// ============================================================

export default async function handler(req: any, res: any) {
  setCors(res);

  // Gestion des requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET = ping (vérifier si la clé est configurée)
  if (req.method === 'GET') {
    const key = process.env.AGNES_API_KEY;
    return res.status(200).json({
      ok: true,
      provider: 'agnes-ai',
      hasKey: !!key,
      keyLength: key ? key.length : 0,
      timestamp: Date.now()
    });
  }

  // POST = génération de vidéo
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée (utilisez POST)' });
  }

  try {
    const apiKey = process.env.AGNES_API_KEY;
    if (!apiKey) {
      console.error('[Agnes] ❌ Clé API manquante');
      return res.status(500).json({ error: 'AGNES_API_KEY manquante dans les variables d\'environnement' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Le prompt est requis (chaîne de caractères)' });
    }

    // Optionnel : améliorer le prompt
    const enhancedPrompt = prompt.trim() + ', cinematic, 4k, detailed';
    console.log('[Agnes] 📝 Prompt:', enhancedPrompt);

    // 1️⃣ Soumettre la tâche à Agnes
    const submitPayload = {
      model: 'agnes-video-v2.0', // ou 'agnes-video-v1' selon disponibilité
      prompt: enhancedPrompt,
      duration: 5,          // durée en secondes
      width: 576,
      height: 320,
      // D'autres paramètres peuvent être ajoutés : seed, cfg_scale, etc.
    };

    console.log('[Agnes] 🚀 Soumission:', JSON.stringify(submitPayload));

    const submitRes = await fetch(AGNES_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitPayload)
    });

    const submitText = await submitRes.text();
    console.log('[Agnes] 📨 Réponse soumission:', submitText);

    if (!submitRes.ok) {
      // Gestion spécifique des erreurs
      if (submitRes.status === 429) {
        return res.status(429).json({
          error: 'Quota Agnes épuisé. Réessayez plus tard.',
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
      return res.status(502).json({
        error: 'Réponse invalide (non-JSON)',
        raw: submitText.slice(0, 500)
      });
    }

    // Extraction du task_id (différents formats possibles)
    const taskId = submitData?.id || submitData?.task_id || submitData?.video_id;
    if (!taskId) {
      return res.status(502).json({
        error: 'Aucun task_id reçu d\'Agnes',
        raw: JSON.stringify(submitData).slice(0, 500)
      });
    }

    console.log('[Agnes] 🆔 Task ID:', taskId);

    // 2️⃣ Polling pour attendre la fin de la génération
    const videoUrl = await pollAgnes(taskId, apiKey);

    // ✅ Succès
    return res.status(200).json({
      url: videoUrl,
      provider: 'agnes-ai',
      model: 'agnes-video-v2.0',
      prompt_used: enhancedPrompt,
      task_id: taskId,
      timestamp: Date.now()
    });

  } catch (err: any) {
    console.error('[Agnes] ❌ Erreur globale:', err.message);
    console.error(err.stack);
    return res.status(500).json({
      error: err.message || 'Erreur interne du serveur'
    });
  }
}
