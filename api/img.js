// api/img.js - proxy images R2 (og:image LinkedIn/Facebook)
export default async function handler(req, res) {
  const p = String(req.query.p || '');
  if (!/^[A-Za-z0-9/._-]+$/.test(p)) { res.status(400).end(); return; }
  const base = 'https://pub-5df218abc5c34ffe8e2a67276fce23d1.r2.dev/';
  const variants = [p];
  if (p.startsWith('gen/F')) variants.push(p.replace('gen/F', 'gen/'));
  for (const v of variants) {
    const r = await fetch(base + v);
    if (r.ok) {
      const ext = v.split('.').pop().toLowerCase();
      const ct = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/webp';
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.status(200).send(buf);
      return;
    }
  }
  res.status(404).end();
}
