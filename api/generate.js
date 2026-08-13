export const config = { maxDuration: 60 };

const ALLOWED_ORIGINS = [
  'https://iapixora.com',
  'https://www.iapixora.com',
  'http://localhost:3000'
];

// 🆕 Les deux workers
const WORKER_FLUX = 'https://ia-pixora-api.slimansoufian1.workers.dev';
const WORKER_GEN  = 'https://iapixora-gen.slimansoufian1.workers.dev';

// 🆕 Map des modèles → worker + format
const MODEL_ROUTING = {
  flux:        { worker: WORKER_FLUX, needsWidth: true },
  lightning:   { worker: WORKER_GEN,  needsWidth: false },
  dreamshaper: { worker: WORKER_GEN,  needsWidth: false },
  auto:        { worker: WORKER_GEN,  needsWidth: false }  // auto = Lightning en priorité
};

export default async function handler(req, res) {
  // ✅ CORS DYNAMIQUE (inchangé)
  const origin = req.headers.origin || '';
  const goodOrigin = ALLOWED_ORIGINS.includes(origin);
  res.setHeader('Access-Control-Allow-Origin', goodOrigin ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  // ✅ SECRET (inchangé)
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const prompt = req.body ? req.body.prompt : null;
    const width  = req.body && req.body.width  ? req.body.width  : 1024;
    const height = req.body && req.body.height ? req.body.height : 1024;
    const model  = req.body && req.body.model  ? req.body.model  : 'auto'; // 🆕

    // ✅ VALIDATION PROMPT (inchangée)
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }
    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt trop long (max 1000 caractères)' });
    }

    // 🆕 VALIDATION DU MODÈLE
    const routing = MODEL_ROUTING[model] || MODEL_ROUTING['auto'];

    // ✅ VALIDATION DIMENSIONS (inchangée, seulement si Flux)
    if (routing.needsWidth) {
      const validDimensions = ['768x768', '768x1024', '1024x576'];
      if (!validDimensions.includes(width + 'x' + height)) {
        return res.status(400).json({ error: 'Dimensions invalides' });
      }
    }

    // 🆕 APPEL AU BON WORKER selon le modèle
    const payload = routing.needsWidth
      ? { prompt, width, height }                         // Flux (ancien format)
      : { prompt, model, seed: Math.floor(Math.random() * 2147483647) }; // nouveau format

    const workerResponse = await fetch(routing.worker, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        error: (data && data.error) ? data.error : 'Erreur du Worker'
      });
    }

    // 🆕 NORMALISATION du retour (toujours le même format qu'avant)
    const fileName = data.fileName || `gen-${Date.now()}-${model}.png`;
    const finalUrl = data.url;

    return res.status(200).json({
      success: true,
      url: finalUrl,
      fileName: fileName,
      width:  width,
      height: height,
      model:  model   // 🆕 bonus : le frontend sait quel modèle a été utilisé
    });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
    // ✅ APPEL WORKER
    const workerResponse = await fetch('https://ia-pixora-api.slimansoufian1.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, width: width, height: height })
    });

    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        error: (data && data.error) ? data.error : 'Erreur du Worker'
      });
    }

    // ✅ RÉPONSE
    return res.status(200).json({
      success: true,
      url: data.url,
      fileName: data.fileName,
      width: data.width,
      height: data.height
    });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
