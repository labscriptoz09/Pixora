// api/generate.js
export default async function handler(req, res) {
  // Headers CORS pour autoriser ton frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, userId, width = 512, height = 512 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    console.log(`[${new Date().toISOString()}] User ${userId || 'anon'} - Génération image`);

    // Appel à ton Worker Cloudflare (URL cachée dans les variables d'env)
    const workerResponse = await fetch(process.env.CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height })
    });

    if (!workerResponse.ok) {
      const errorData = await workerResponse.json().catch(() => ({}));
      
      if (workerResponse.status === 429) {
        return res.status(429).json({ 
          error: 'Quota journalier atteint. Réessayez demain !',
          retryAfter: 'Demain 00:00 UTC'
        });
      }
      
      return res.status(workerResponse.status).json({
        error: errorData.error || `Erreur serveur: ${workerResponse.status}`
      });
    }

    const data = await workerResponse.json();
    console.log(`✅ Image générée pour user ${userId || 'anon'}`);

    return res.status(200).json({
      success: true,
      url: data.url,
      width: data.width,
      height: data.height
    });

  } catch (error) {
    console.error(' Erreur critique:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
