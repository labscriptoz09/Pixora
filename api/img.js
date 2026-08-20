// Proxy simple : /api/img?f=gen/xxx.png
export default async function handler(req, res) {
  const f = req.query.f || "";
  if (!f || f.includes("..")) {
    res.status(400).json({ error: "bad path" });
    return;
  }
  const up = await fetch(
    `https://iapixora-gen.slimansoufian1.workers.dev/img/${encodeURIComponent(f)}`
  );
  if (!up.ok) {
    res.status(up.status).end();
    return;
  }
  res.setHeader("Content-Type", up.headers.get("content-type") || "image/png");
  res.setHeader(
    "Cache-Control",
    "public, max-age=31536000, immutable, s-maxage=31536000"
  );
  const buf = Buffer.from(await up.arrayBuffer());
  res.status(200).send(buf);
}
