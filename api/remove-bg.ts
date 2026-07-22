// // api/remove-bg.ts — Détourage IA via BRIA-RMBG-2.0 (Hugging Face)
// ✅ Gratuit illimité (HF Inference API free tier)
// 📌 UN fichier uniquement, zéro autre modification

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

    // Récupérer l'image source
    let imageBuffer: Buffer;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        return res.status(400).json({ error: `Failed to fetch image: ${imgRes.status}` });
      }
      const arrayBuf = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
    }

    // Vérifier taille max (10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 10MB)' });
    }

    // Appeler HF Inference API
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream'
    };

    // Utiliser clé HF si disponible (depuis env ou admin_config)
    const hfKey = process.env.HF_API_KEY || '';
    if (hfKey) {
      headers['Authorization'] = `Bearer ${hfKey}`;
    }

    const hfRes = await fetch(HF_API_URL, {
      method: 'POST',
      headers,
      body: imageBuffer
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text().catch(() => '');
      // Si modèle en chargement, retourner erreur claire
      if (hfRes.status === 503) {
        return res.status(503).json({
          error: 'Model loading, retry in 30s',
          raw: errText.slice(0, 200)
        });
      }
      return res.status(hfRes.status).json({
        error: `HF API error: ${hfRes.status}`,
        raw: errText.slice(0, 200)
      });
    }

    // HF retourne l'image détourée en binaire PNG
    const resultBuffer = await hfRes.arrayBuffer();
    const base64Result = Buffer.from(resultBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Result}`;

    return res.status(200).json({
      ok: true,
      image_base64: dataUrl,
      model: HF_MODEL,
      provider: 'huggingface'
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
}
