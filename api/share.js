// api/share.js
export default async function handler(req, res) {
  let imgUrl = req.query.img || 'https://www.iapixora.com/favicon.png';
  async function pick(url) {
    const variants = [url];
    if (url.includes('/gen/F')) variants.push(url.replace('/gen/F', '/gen/'));
    for (const v of variants) {
      try { const r = await fetch(v, { method: 'HEAD' }); if (r.ok) return v; } catch (e) {}
    }
    return url;
  }
  imgUrl = await pick(imgUrl);

  // MODE RAW : sert l'image elle-meme (og:image LinkedIn)
  if (req.query.raw === '1' && imgUrl.includes('.r2.dev/')) {
    try {
      const r = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' } });
      if (r.ok) {
        const ext = imgUrl.split('.').pop().toLowerCase();
        const ct = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/webp';
        const buf = Buffer.from(await r.arrayBuffer());
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return res.status(200).send(buf);
      }
    } catch (e) {}
  }

  const ogUrl = imgUrl.includes('.r2.dev/')
    ? 'https://www.iapixora.com/api/share?img=' + encodeURIComponent(imgUrl) + '&raw=1'
    : imgUrl;
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
    <link rel="canonical" href="https://www.iapixora.com/api/share">
    <link rel="icon" type="image/png" href="https://www.iapixora.com/favicon.png">
    <link rel="apple-touch-icon" href="https://www.iapixora.com/favicon.png">
    
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="IA Pixora">
    <meta property="og:url" content="https://www.iapixora.com/api/share">
    <meta property="og:title" content="${t.title}">
    <meta property="og:description" content="${t.desc}">
    <meta property="og:image" content="${ogUrl}">
    <meta property="og:image:width" content="1024">
    <meta property="og:image:height" content="1024">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t.title}">    <meta name="twitter:description" content="${t.desc}">
    <meta name="twitter:image" content="${ogUrl}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root{--bg:#050507;--surf:rgba(24,24,27,0.6);--border:rgba(63,63,70,0.5);--prim:#8B5CF6;--sec:#EC4899;--text:#FAFAFA;--muted:#A1A1AA;--font:'Inter',sans-serif}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:1.5rem 1rem;text-align:center}
        .container{max-width:600px;width:100%;display:flex;flex-direction:column;align-items:center;gap:1.2rem}
        .logo{display:flex;align-items:center;gap:0.5rem;text-decoration:none;color:var(--text);margin-bottom:0.3rem}
        .logo svg{width:32px;height:32px}
        .logo span{font-size:1.3rem;font-weight:800;background:linear-gradient(135deg,#fff 20%,var(--prim) 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .badge-free{display:inline-flex;align-items:center;gap:0.3rem;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10B981;font-size:0.7rem;font-weight:700;padding:3px 10px;border-radius:20px}
        .image-wrapper{width:100%;border-radius:20px;overflow:hidden;border:1px solid var(--border);box-shadow:0 20px 60px rgba(139,92,246,0.25);position:relative;background:var(--surf)}
        .image-wrapper img{width:100%;height:auto;display:block}
        .actions{display:flex;gap:0.8rem;width:100%;flex-wrap:wrap;justify-content:center}
        .btn-create{display:inline-flex;align-items:center;gap:0.6rem;padding:1rem 2rem;background:linear-gradient(135deg,var(--prim),var(--sec));color:white;border-radius:14px;font-weight:700;font-size:1rem;text-decoration:none;box-shadow:0 8px 30px rgba(139,92,246,0.4);transition:all 0.3s;border:none;cursor:pointer;flex:1;justify-content:center;min-width:200px}
        .btn-create:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(139,92,246,0.6)}
        .btn-download{display:inline-flex;align-items:center;gap:0.5rem;padding:1rem 1.5rem;background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text);border-radius:14px;font-weight:600;font-size:0.9rem;text-decoration:none;transition:all 0.2s;cursor:pointer;flex:1;justify-content:center;min-width:160px}
        .btn-download:hover{background:rgba(255,255,255,0.15);border-color:var(--prim)}
        .btn-secondary{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:var(--muted);border-radius:12px;font-weight:600;font-size:0.8rem;text-decoration:none;transition:all 0.2s}
        .btn-secondary:hover{background:rgba(255,255,255,0.1);color:var(--text)}
        .cta-title{font-size:1.4rem;font-weight:800;line-height:1.3}
        .cta-sub{font-size:0.9rem;color:var(--muted);line-height:1.5;max-width:420px}
        .footer{margin-top:1.5rem;font-size:0.7rem;color:var(--muted)}
        .footer a{color:var(--prim);text-decoration:none}
        @media(max-width:400px){.cta-title{font-size:1.15rem}.btn-create,.btn-download{padding:0.85rem 1rem;font-size:0.85rem;min-width:auto}}
    </style>
</head>
<body>
    <div class="container">
        <a href="https://www.iapixora.com" class="logo">
            <svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs><path d="M16 2L28 10L24 28H8L4 10L16 2Z" fill="url(#sg)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/><path d="M16 2L4 10L16 14L16 2Z" fill="rgba(255,255,255,0.2)"/></svg>
            <span>IA Pixora</span>
        </a>
        <div class="badge-free"><i class="fas fa-check-circle"></i> ${t.badge}</div>
        <div class="image-wrapper">
            <img src="${imgUrl}" alt="AI Generated Image" onerror="this.parentElement.innerHTML='<p style=padding:2rem;color:var(--muted)>${t.error}</p>'">
        </div>
        <h1 class="cta-title">${t.title}</h1>
        <p class="cta-sub">${t.desc}</p>
        <div class="actions">
            <a href="https://www.iapixora.com" class="btn-create"><i class="fas fa-sparkles"></i> ${t.btn}</a>
            <button class="btn-download" onclick="downloadImage('${imgUrl}')"><i class="fas fa-download"></i> ${t.download}</button>
        </div>
        <a href="https://www.iapixora.com/gallery.html" class="btn-secondary"><i class="fas fa-images"></i> ${t.gallery}</a>
        <div class="footer">© 2026 IA Pixora · <a href="https://www.iapixora.com/privacy.html">${lang === 'fr' ? 'Confidentialité' : 'Privacy'}</a></div>
    </div>    <script>
        function downloadImage(url) {
            fetch(url).then(r=>r.blob()).then(blob=>{
                const u = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = u; a.download = 'ia-pixora-' + Date.now() + '.jpg';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }).catch(()=> window.open(url, '_blank'));
        }
    <\/script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
}
