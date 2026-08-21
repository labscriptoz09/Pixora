// api/share.js - V3 avec resolution + no-store
export default async function handler(req, res) {
  let imgUrl = req.query.img || 'https://www.iapixora.com/favicon.png';

  // RESOLUTION : essaie plusieurs adresses, prend la 1ere qui existe (200)
  async function pick(url) {
    const base = 'https://pub-5df218abc5c34ffe8e2a67276fce23d1.r2.dev/';
    const variants = [url];
    if (url.includes('/gen/F')) variants.push(url.replace('/gen/F', '/gen/'));
    if (url.includes(base + 'gen/')) {
      variants.push(url.replace(base + 'gen/', base + 'img/'));
    }
    for (const v of variants) {
      try {
        const r = await fetch(v, { method: 'HEAD' });
        if (r.ok) return v;
      } catch (e) {}
    }
    return 'https://pub-5df218abc5c34ffe8e2a67276fce23d1.r2.dev/img_1785965946506_tu7nz6.jpg';
  }
  imgUrl = await pick(imgUrl);

  const lang = req.query.lang === 'en' ? 'en' : 'fr';
  const texts = {
    fr: {
      title: 'Regarde cette image IA créée avec IA Pixora 🎨',
      desc: 'Cette image a été générée gratuitement avec IA Pixora. Crée la tienne en quelques secondes, sans inscription !',
      btn: 'Créer mon image',
      download: 'Télécharger',
      gallery: 'Voir la galerie',
      badge: 'Générée gratuitement',
      error: 'Image non disponible'
    },
    en: {
      title: 'Check out this AI image made with IA Pixora 🎨',
      desc: 'This image was generated for free with IA Pixora. Create yours in seconds, no signup required!',
      btn: 'Create my image',
      download: 'Download',
      gallery: 'View gallery',
      badge: 'Generated for free',
      error: 'Image not available'
    }
  };
  const t = texts[lang];

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title}</title>
    <meta name="description" content="${t.desc}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="IA Pixora">
    <meta property="og:title" content="${t.title}">
    <meta property="og:description" content="${t.desc}">
    <meta property="og:image" content="${imgUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t.title}">
    <meta name="twitter:description" content="${t.desc}">
    <meta name="twitter:image" content="${imgUrl}">
</head>
<body style="background:#050507;color:#fff;font-family:system-ui">
    <p>Redirection...</p>
    <a href="https://www.iapixora.com">${t.btn}</a>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
}
