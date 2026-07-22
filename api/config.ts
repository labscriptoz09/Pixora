// api/config.ts — Proxy sécurisé pour configs publiques
// ✅ Lit admin_config via service_role (RLS autorisé)
// ✅ Filtre les clés API sensibles (ne renvoie QUE les configs publiques)
// ✅ Cache CORS activé pour toutes les pages
// 📌 Zéro clé API exposée côté client

declare const process: any;

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    if (!SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured in Vercel env' });
    }

    // Appel via service_role (bypass RLS)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/admin_config?select=key,value`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch config' });
    }

    const rows = await response.json();

    // Liste des clés SENSIBLES à NE PAS renvoyer
    const SENSITIVE_KEYS = ['api_keys', 'admin_email'];

    // Construire l'objet config public
    const publicConfig: Record<string, any> = {};
    for (const row of rows) {
      if (!SENSITIVE_KEYS.includes(row.key)) {
        publicConfig[row.key] = row.value;
      }
    }

    // Cache 60s côté navigateur (réduit appels serveur)
    res.setHeader('Cache-Control', 'public, max-age=60');

    return res.status(200).json(publicConfig);

  } catch (err: any) {
    console.error('config proxy error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
