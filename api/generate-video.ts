// Fix pour build : declare process + compat Node
declare const process: any;

const SPACE_BASE = 'https://lightricks-ltx-video-distilled.hf.space';
const ENDPOINT = '/text_to_video';
const NEG = 'worst quality, inconsistent motion, blurry, jittery, distorted';

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hasToken: Boolean(process.env.HF_TOKEN), runtime: 'node', space: 'ltx' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST ou GET seulement' });

  const token = process.env.HF_TOKEN;
  if (!token) return res.status(500).json({ error: 'HF_TOKEN manquant en variables Vercel' });

  const body = req.body || {};
  const prompt = String(body.prompt || '').trim() || 'a cat running in a field, cinematic lighting';

  const data = [
    prompt, NEG, '', '', 512, 704, 'text-to-video', 2, 9, 42, true, 1, false
  ];

  const ctrl = new AbortController();
  const CAP = 55000;
  const timer = setTimeout(() => ctrl.abort(), CAP);

  try {
    const postRes = await fetch(SPACE_BASE + '/gradio_api/call' + ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ data }),
      signal: ctrl.signal,
    });
    if (!postRes.ok) {
      const t = await postRes.text().catch(() => '');
      return res.status(502).json({ error: 'POST HF HTTP ' + postRes.status, raw: t.slice(0, 500) });
    }
    const ej = await postRes.json().catch(() => null);
    const eid = ej && (ej.event_id || ej.id);
    if (!eid) return res.status(502).json({ error: "pas d'event_id", raw: JSON.stringify(ej).slice(0, 500) });

    const pollUrl = SPACE_BASE + '/gradio_api/call' + ENDPOINT + '/' + eid;
    const start = Date.now();
    let lastRaw = '';
    while (Date.now() - start < CAP) {
      await new Promise((r) => setTimeout(r, 2500));
      const g = await fetch(pollUrl, { headers: { 'Authorization': 'Bearer ' + token }, signal: ctrl.signal }).catch(() => null);
      if (!g) continue;
      if (g.status === 202) continue;
      if (!g.ok) { lastRaw = await g.text().catch(() => ''); return res.status(502).json({ error: 'poll HF HTTP ' + g.status, raw: lastRaw.slice(0, 500) }); }
      const txt = await g.text(); lastRaw = txt;
      const lines = txt.split(/\r?\n/); let cur = ''; let val: any = null; let done = false; let ev = '';
      for (const ln of lines) {
        if (ln.startsWith('event:')) cur = ln.slice(6).trim();
        else if (ln.startsWith('data:')) { try { val = JSON.parse(ln.slice(5).trim()); } catch { val = ln.slice(5).trim(); } ev = cur; if (cur === 'complete' || cur === 'error') done = true; cur = ''; }
      }
      if (val === null) { try { val = JSON.parse(txt); done = true; ev = 'complete'; } catch {} }
      const url = extractVideo(SPACE_BASE, val);
      if (url) return res.status(200).json({ url });
      if (done) return res.status(502).json({ error: 'event=' + (ev || '?'), raw: txt.slice(0, 800) });
    }
    return res.status(504).json({ error: 'timeout polling serveur 55s', raw: lastRaw.slice(0, 500) });
  } catch (err: any) {
    const msg = err && err.message ? err.message: String(err);
    if (/abort/i.test(msg)) return res.status(504).json({ error: 'abort/timeout (cap 55s)' });
    return res.status(500).json({ error: msg });
  } finally {
    clearTimeout(timer);
  }
}

function extractVideo(base: string, node: any): string | null {
  if (!node) return null;
  if (typeof node === 'string') {
    if (/\.(mp4|webm)(\?|$)/i.test(node)) return /^https?:/i.test(node) ? node : base + (node.charAt(0) === '/' ? node : '/' + node);
    return null;
  }
  if (Array.isArray(node)) { for (const it of node) { const v = extractVideo(base, it); if (v) return v; } return null; }
  if (typeof node === 'object') {
    if (node.url) { const u = String(node.url); if (/^https?:/i.test(u)) return u; if (u.includes('file=')) return base + (u.charAt(0) === '/' ? u : '/' + u); }
    if (node.path) { const ps = String(node.path); if (/^https?:/i.test(ps)) return ps; if (ps.includes('file=')) return base + (ps.charAt(0) === '/' ? ps : '/' + ps); return base + '/gradio_api/file=' + (ps.charAt(0) === '/' ? ps : '/' + ps); }
    if (node.video) { const r = extractVideo(base, node.video); if (r) return r; }
    for (const k of Object.keys(node)) { if (k === 'url' || k === 'path' || k === 'video') continue; const v = extractVideo(base, node[k]); if (v) return v; }
  }
  return null;
}
