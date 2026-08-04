// api/test-krea.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, width = 1024, height = 1024 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Clé RapidAPI non configurée' });

    const host = 'krea-flux-ai-prompt-to-image-generator.p.rapidapi.com';

    // Essayer plusieurs endpoints possibles
    const endpoints = [
      { url: `https://${host}/generate`, method: 'POST', body: { prompt, width, height } },
      { url: `https://${host}/predict`, method: 'POST', body: { prompt, width, height } },
      { url: `https://${host}/text-to-image`, method: 'POST', body: { prompt, width, height } },
      { url: `https://${host}/generateImage?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}`, method: 'GET' }
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const options = {
          method: endpoint.method,
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': host,
            'Content-Type': 'application/json'
          }
        };

        if (endpoint.method === 'POST') {
          options.body = JSON.stringify(endpoint.body);
        }

        const response = await fetch(endpoint.url, options);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Endpoint ${endpoint.url} fonctionne !`);
          
          // Extraire l'URL de l'image
          const imageUrl = data.image || data.imageUrl || data.output || 
                          (data.images && data.images[0]) || data.url;
          
          if (imageUrl) {
            return res.status(200).json({ 
              success: true, 
              url: imageUrl,
              endpoint: endpoint.url,
              raw: data
            });
          }
        } else {
          lastError = `Erreur ${response.status} sur ${endpoint.url}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(500).json({ 
      error: 'Aucun endpoint ne fonctionne', 
      lastError,
      hint: 'Vérifie le nom exact de l\'API sur RapidAPI'
    });

  } catch (error) {
    console.error('Erreur Krea:', error);
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
}
