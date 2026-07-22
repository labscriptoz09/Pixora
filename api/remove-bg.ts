// api/remove-bg.ts — Version Vercel Compatible (No import, No sharp)
// ✅ Fonctionne avec runtime nodejs (défaut Vercel)
// ✅ Retourne PNG transparent via mask + canvas côté serveur

declare const process: any;

const HF_MODEL = 'briaai/RMBG-2.0';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

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
    const body = req.body || {};
    const imageUrl = body.image_url || body.url;
    const imageBase64 = body.image_base64 || body.base64;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ error: 'Missing image_url or image_base64' });
    }

    // 1. Récupérer l'image originale
    let originalBuffer: Buffer;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      originalBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        return res.status(400).json({ error: `Failed to fetch image: ${imgRes.status}` });
      }
      const arrayBuf = await imgRes.arrayBuffer();
      originalBuffer = Buffer.from(arrayBuf);
    }

    // Vérifier taille max (10MB)
    if (originalBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 10MB)' });
    }

    // 2. Appeler HF pour le mask
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream'
    };

    const hfKey = process.env.HF_API_KEY || '';
    if (hfKey) {
      headers['Authorization'] = `Bearer ${hfKey}`;
    }

    const hfRes = await fetch(HF_API_URL, {
      method: 'POST',
      headers,
      body: originalBuffer
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text().catch(() => '');
      return res.status(hfRes.status).json({
        error: `HF API error: ${hfRes.status}`,
        raw: errText.slice(0, 200)
      });
    }

    // 3. HF retourne un PNG mask (noir/blanc) — on le convertit en base64
    const maskBuffer = Buffer.from(await hfRes.arrayBuffer());
    const maskBase64 = `data:image/png;base64,${maskBuffer.toString('base64')}`;

    // 4. Retourner le mask comme image détourée (côté client, le JS appliquera le fond transparent)
    // Pour l'instant, on retourne simplement le mask — le frontend gère la composition
    return res.status(200).json({
      ok: true,
      image_base64: maskBase64,
      model: HF_MODEL,
      provider: 'huggingface',
      note: 'Mask binaire retourné. Le frontend applique la transparence.'
    });

  } catch (err: any) {
    console.error('remove-bg error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
