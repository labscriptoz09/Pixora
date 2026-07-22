// api/admin-save.ts — Proxy écriture admin sécurisé via service_role
// ✅ Vérifie que l'appelant est leonard@pixora.com AVANT d'écrire
// ✅ Utilise service_role pour bypass RLS sur admin_config
// ✅ Bloque toute clé API sensible dans les données envoyées
// 📌 Nécessite SUPABASE_SERVICE_ROLE_KEY dans Vercel env vars

declare const process: any;

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = 'leonard@pixora.com';

// Clés sensibles qui ne doivent JAMAIS être écrites via ce proxy
const BLOCKED_KEYS = ['api_keys', 'admin_email'];

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    // 1. Vérifier la clé service_role
    if (!SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' });
    }

    // 2. Vérifier l'identité de l'appelant via le token Supabase
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    // Vérifier le token via Supabase Auth REST API
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired token' });    }

    const userData = await userRes.json();
    const email = (userData.email || '').toLowerCase();

    // 3. Vérifier que c'est bien l'admin autorisé
    if (email !== ADMIN_EMAIL) {
      console.warn(`[ADMIN-SAVE] Unauthorized write attempt by: ${email}`);
      return res.status(403).json({ error: 'Unauthorized: admin access only' });
    }

    // 4. Parser le body
    const body = req.body || {};
    const key = body.key;
    const value = body.value;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Missing key or value in request body' });
    }

    // 5. Bloquer les clés sensibles
    if (BLOCKED_KEYS.includes(key)) {
      return res.status(403).json({ error: `Writing to '${key}' is blocked for security` });
    }

    // 6. Écrire dans admin_config via service_role
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_config`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key: key,
        value: value,
        updated_at: new Date().toISOString()
      })
    });

    if (!upsertRes.ok) {
      const errText = await upsertRes.text().catch(() => '');
      return res.status(upsertRes.status).json({
        error: `Supabase upsert failed: ${upsertRes.status}`,
        raw: errText.slice(0, 300)
      });
    }

    console.log(`[ADMIN-SAVE] ✅ Key '${key}' saved by ${email}`);
    return res.status(200).json({ ok: true, key: key });

  } catch (err: any) {
    console.error('[ADMIN-SAVE] Error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
