import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
