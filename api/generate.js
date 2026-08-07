import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // ✅ CORS restreint à ton domaine
  res.setHeader('Access-Control-Allow-Origin', 'https://iapixora.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // ✅ 1. VÉRIFIER LE SECRET INTERNE (obligatoire)
  const secretHeader = req.headers['x-internal-secret'];
  if (secretHeader !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const { prompt, width = 768, height = 768 } = req.body;

    // ✅ 2. VALIDER LE PROMPT
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }
    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt trop long (max 1000 caractères)' });
    }

    // ✅ 3. VALIDER LES DIMENSIONS (whitelist)
    const validDimensions = ['768x768', '768x1024', '1024x576'];
    const dimKey = `${width}x${height}`;
    if (!validDimensions.includes(dimKey)) {
      return res.status(400).json({ error: 'Dimensions invalides' });
    }

    // ✅ 4. APPELER LE WORKER (inchangé)
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

    // ✅ 5. SAUVEGARDE SUPABASE (sans userId du client)
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
          user_id: null,
          expires_at: permanentDate.toISOString(),
          prompt: prompt.substring(0, 1000),
          created_at: new Date().toISOString()
        });

    } catch (dbError) {
      // Silencieux en production
    }

    // ✅ 6. RÉPONSE
    return res.status(200).json({
      success: true,
      url: data.url,
      fileName: data.fileName,
      width: data.width,
      height: data.height
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur'
    });
  }
}

