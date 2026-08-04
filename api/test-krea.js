// api/test-krea.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, width = 1024, height = 1024 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Clé RapidAPI non configurée' });

    const host = 'krea-flux-ai-prompt-to-image-generator.p.rapidapi.com';
    
    // Encoder le prompt pour l'URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // URL exacte comme dans ton exemple curl (méthode GET)
    const url = `https://${host}/generate?prompt=${encodedPrompt}&size=${width}x${height}&seed=42`;

    console.log('Appel API Krea:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API:', errorText);
      return res.status(response.status).json({ 
        error: `Erreur RapidAPI: ${response.status}`,
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    console.log('✅ Réponse Krea:', data);

    // Extraire l'URL de l'image selon la structure
    let imageUrl = null;
    if (typeof data === 'object') {
      imageUrl = data.image || data.imageUrl || data.output || data.url || 
                 (data.images && data.images[0]) || data.image_url;
    }

    if (imageUrl) {
      return res.status(200).json({ 
        success: true, 
        url: imageUrl,
        raw: data
      });
    } else {
      return res.status(500).json({ 
        error: 'Aucune image dans la réponse',
        received: data
      });
    }

  } catch (error) {
    console.error('Erreur Krea:', error);
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
}
