// api/test-replicate.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, aspect_ratio = '1:1' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // Récupérer le token depuis les variables d'environnement Vercel
    const token = process.env.REPLICATE_API_TOKEN;
    
    if (!token) {
      return res.status(500).json({ error: 'Token Replicate non configuré' });
    }

    const replicateResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          resolution: "1 MP",
          aspect_ratio: aspect_ratio,
          output_format: "webp",
          output_quality: 80,
          safety_tolerance: 2
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.json().catch(() => ({}));
      return res.status(replicateResponse.status).json({ 
        error: errorData.detail || `Erreur Replicate: ${replicateResponse.status}` 
      });
    }

    const data = await replicateResponse.json();
    return res.status(200).json({ output: data.output });

  } catch (error) {
    console.error('Erreur proxy Replicate:', error);
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
}
