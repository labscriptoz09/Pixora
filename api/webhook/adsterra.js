export default async function handler(req, res) {
  const token = req.query.token || req.body?.token;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM0NjE2OCwiZXhwIjoyMDk4OTIyMTY4fQ.ilHB6Lfk1T__ewFGOeNeekt-vL4weFw7dukh639nH8I';

  try {
    // 1. Chercher le token dans ad_clicks
    const clickResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/ad_clicks?token=eq.${token}&status=eq.pending`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const clicks = await clickResponse.json();
    
    if (!clicks || clicks.length === 0) {
      return res.status(404).json({ error: 'Token invalide ou déjà utilisé' });
    }

    const click = clicks[0];
    const userId = click.user_id;

    // 2. Récupérer les points actuels
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}&select=points`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const userData = await userResponse.json();
    const currentPoints = userData[0]?.points || 0;
    const newPoints = currentPoints + 25;

    // 3. Mettre à jour les points
    await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ points: newPoints })
    });

    // 4. Créer la transaction
    await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        type: 'earned',
        title: 'Adsterra Smartlink',
        amount: 25
      })
    });

    // 5. Marquer le clic comme payé
    await fetch(`${SUPABASE_URL}/rest/v1/ad_clicks?token=eq.${token}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: 'paid' })
    });

    return res.status(200).json({ success: true, message: 'Points crédités' });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
}
