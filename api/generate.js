import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { prompt, width = 768, height = 768, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // Appel au Worker Cloudflare
    const workerResponse = await fetch('https://ia-pixora-api.slimansoufian1.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height })
    });

    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({ 
        error: data.error || 'Erreur du Worker' 
      });
    }

    // ✅ SAUVEGARDE SUPABASE (avec import ES6)
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const permanentDate = new Date();
      permanentDate.setFullYear(permanentDate.getFullYear() + 10);
      
      await supabase
        .from('pixora_creations')
        .insert({
          file_name: data.fileName,
          user_id: userId || null,
          expires_at: permanentDate.toISOString(),
          prompt: prompt || '',
          created_at: new Date().toISOString()
        });
        
      console.log('[API] ✅ Sauvegardé dans Supabase:', data.fileName);
    } catch (dbError) {
      console.error('[API] ❌ Erreur Supabase:', dbError.message);
    }

    // Retourner la réponse
    return res.status(200).json({
      success: true,
      url: data.url,
      fileName: data.fileName,
      width: data.width,
      height: data.height
    });

  } catch (error) {
    console.error('Erreur proxy:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message 
    });
  }
}

