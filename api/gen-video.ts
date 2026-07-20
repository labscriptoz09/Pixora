// api/gen-video.ts
// ✅ Version optimisée : durée 3s pour éviter le timeout Vercel (60s)
// ✅ Fallback : si Agnes échoue, essaie Hugging Face (gratuit)
// ✅ Logs détaillés pour diagnostic

declare const process: any;

// ============================================================
//  CONFIGURATION
// ============================================================

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/videos';
const AGNES_STATUS_URL = (id: string) => `https://apihub.agnes-ai.com/v1/videos/${id}`;

// ⏱️ Timeout réduit à 45s (pour être sûr de ne pas dépasser les 60s de Vercel)
const MAX_POLLING_TIME = 45000;
const POLL_INTERVAL = 2000; // On vérifie toutes les 2s au lieu de 3s

// ============================================================
//  CORS
// ============================================================

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ============================================================
//  POLLING AGNES
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
        console.warn(`[Agnes] ⚠️ Statut HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      console.log(`[Agnes] 📦 Statut (tentative ${attempt}):`, JSON.stringify(data).slice(0, 200));

      // Différents formats possibles
      const status = data?.status || data?.state || data?.data?.status;
      const videoUrl = data?.video_url || data?.video?.url || data?.url || data?.data?.video_url;

      if (status === 'completed' && videoUrl) {
        console.log('[Agnes] ✅ Vidéo générée');
        return videoUrl;
      }

      if (status === 'failed') {
        throw new Error(`Échec Agnes: ${data?.message || data?.error || 'inconnu'}`);
      }

      console.log(`[Agnes] ⏳ Statut: ${status || 'en attente...'}`);

    } catch (err: any) {
      console.warn('[Agnes] ⚠️ Erreur polling:', err.message);
      // On continue
    }
  }

  throw new Error('⏱️ Timeout Agnes (>45s)');
}

// ============================================================
//  FALLBACK : HUGGING FACE (ZEROSCOPE)
// ============================================================

async function generateWithHF(prompt: string): Promise<string> {
  console.log('[HF] 🔄 Tentative fallback vers Hugging Face...');
  
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfKey) {
    throw new Error('HUGGINGFACE_API_KEY manquante');
  }

  const res = await fetch('https://api-inference.huggingface.co/models/cerspense/zeroscope_v2_576w', {
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF ${res.status}: ${text.slice(0, 200)}`);
  }

  // HF retourne un blob vidéo
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  console.log('[HF] ✅ Vidéo générée (fallback)');
  return url;
}

// ============================================================
//  HANDLER PRINCIPAL
// ============================================================

export default async function handler(req: any, res: any) {
  setCors(res);

  // OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET = ping
  if (req.method === 'GET') {
    const agnesKey = !!process.env.AGNES_API_KEY;
    const hfKey = !!process.env.HUGGINGFACE_API_KEY;
    return res.status(200).json({
      ok: true,
      providers: {
        agnes: { configured: agnesKey },
        huggingface: { configured: hfKey }
      },
      timestamp: Date.now()
    });
  }

  // POST = génération
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST seulement' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // Amélioration du prompt (optionnel)
    const enhancedPrompt = prompt.trim() + ', cinematic, 4k, detailed';
    console.log('[API] 📝 Prompt:', enhancedPrompt);

    // ------------------------------
    // 1️⃣ ESSAYER AGNES AI (3 secondes)
    // ------------------------------
    const agnesKey = process.env.AGNES_API_KEY;
    let videoUrl: string;
    let provider = 'agnes-ai';

    if (agnesKey) {
      try {
        console.log('[Agnes] 🚀 Soumission...');

        const submitPayload = {
          model: 'agnes-video-v2.0',
          prompt: enhancedPrompt,
          duration: 3,          // ⬅️ SOLUTION 1 : 3 secondes au lieu de 5
          width: 576,
          height: 320
        };

        const submitRes = await fetch(AGNES_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agnesKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitPayload)
        });

        const submitText = await submitRes.text();
        console.log('[Agnes] 📨 Réponse:', submitText);

        if (!submitRes.ok) {
          if (submitRes.status === 429) {
            throw new Error('Quota Agnes épuisé (66 req/jour)');
          }
          throw new Error(`Agnes ${submitRes.status}: ${submitText.slice(0, 200)}`);
        }

        const submitData = JSON.parse(submitText);
        const taskId = submitData?.id || submitData?.task_id || submitData?.video_id;

        if (!taskId) {
          throw new Error('Aucun task_id reçu');
        }

        console.log('[Agnes] 🆔 Task ID:', taskId);

        // Polling
        videoUrl = await pollAgnes(taskId, agnesKey);
        console.log('[Agnes] ✅ Succès');

      } catch (agnesErr: any) {
        console.warn('[Agnes] ❌ Échec:', agnesErr.message);

        // ------------------------------
        // 2️⃣ FALLBACK : HUGGING FACE
        // ------------------------------
        try {
          videoUrl = await generateWithHF(enhancedPrompt);
          provider = 'huggingface';
        } catch (hfErr: any) {
          // Les deux ont échoué
          throw new Error(`Agnes: ${agnesErr.message} | HF: ${hfErr.message}`);
        }
      }
    } else {
      // Pas de clé Agnes → directement HF
      try {
        videoUrl = await generateWithHF(enhancedPrompt);
        provider = 'huggingface';
      } catch (hfErr: any) {
        throw new Error(`Hugging Face: ${hfErr.message}`);
      }
    }

    // ✅ Succès
    return res.status(200).json({
      url: videoUrl,
      provider: provider,
      prompt_used: enhancedPrompt,
      duration: 3,
      timestamp: Date.now()
    });

  } catch (err: any) {
    console.error('[API] ❌ Erreur globale:', err.message);
    return res.status(500).json({
      error: err.message || 'Erreur interne du serveur'
    });
  }
}
