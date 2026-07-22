// api/remove-bg.ts — Détourage gratuit via Pollinations (remove-bg)
// ✅ 100% gratuit, illimité, sans auth
// 📌 UN fichier uniquement — zéro autre modification

declare const process: any;

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

    let sourceUrl: string;
    if (imageBase64) {
      // Convertir base64 → URL temporaire via blob + upload sur un service gratuit
      // Mais Pollinations ne supporte pas les blobs → on utilise une astuce : data URI directement
      sourceUrl = imageBase64;
    } else {
      sourceUrl = encodeURIComponent(imageUrl);
    }

    // ✅ Pollinations remove-bg endpoint gratuit
    // Format : https://image.pollinations.ai/remove-bg?image_url=URL_ENCODED
    const pollinationsUrl = `https://image.pollinations.ai/remove-bg?image_url=${sourceUrl}`;

    // Appeler Pollinations (pas d'auth, pas de clé)
    const response = await fetch(pollinationsUrl);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(response.status).json({
        error: `Pollinations failed: ${response.status}`,
        raw: text.slice(0, 200)
      });
    }

    // Pollinations retourne directement un PNG transparent
    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    return res.status(200).json({
      ok: true,
      image_base64: dataUrl,
      provider: 'pollinations-remove-bg'
    });

  } catch (err: any) {
    console.error('remove-bg error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
