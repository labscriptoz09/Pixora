import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM0NjE2OCwiZXhwIjoyMDk4OTIyMTY4fQ.ilHB6Lfk1T__ewFGOeNeekt-vL4weFw7dukh639nH8I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const token = req.query.token || req.body?.token;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    const { data: click, error } = await supabase
      .from('ad_clicks')
      .select('user_id, status')
      .eq('token', token)
      .single();

    if (error || !click) {
      return res.status(404).json({ error: 'Token invalide' });
    }

    if (click.status === 'paid') {
      return res.status(200).json({ message: 'Déjà payé' });
    }

    const { data: userData } = await supabase
      .from('user_data')
      .select('points')
      .eq('user_id', click.user_id)
      .single();

    const newPoints = (userData?.points || 0) + 25;

    await supabase
      .from('user_data')
      .update({ points: newPoints })
      .eq('user_id', click.user_id);

    await supabase
      .from('transactions')
      .insert({
        user_id: click.user_id,
        type: 'earned',
        title: 'Adsterra Smartlink',
        amount: 25
      });

    await supabase
      .from('ad_clicks')
      .update({ status: 'paid' })
      .eq('token', token);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
