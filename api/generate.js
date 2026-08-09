export const config = { maxDuration: 60 };

const ALLOWED_ORIGINS = [
  'https://iapixora.com',
  'https://www.iapixora.com',
  'http://localhost:3000'
];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const goodOrigin = ALLOWED_ORIGINS.includes(origin);
  res.setHeader('Access-Control-Allow-Origin', goodOrigin ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const prompt = req.body ? req.body.prompt : null;
    const width = req.body && req.body.width ? req.body.width : 768;
    const height = req.body && req.body.height ? req.body.height : 768;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }
    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt trop long (max 1000 caractères)' });
    }

    const validDimensions = ['768x768', '768x1024', '1024x576'];
    if (!validDimensions.includes(width + 'x' + height)) {
      return res.status(400).json({ error: 'Dimensions invalides' });
    }

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
