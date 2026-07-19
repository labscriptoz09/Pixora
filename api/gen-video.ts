// Plan C - Test minimal: appel serveur vers CogVideoX-2B avec HF_TOKEN
// POST /api/gen-video  body: { prompt: string }
// Réponse: { url: string } ou { error: string, raw?: string }

const SPACE_BASE = 'https://zai-org-cogvideox-2b-space.hf.space';
const ENDPOINT = '/generate';
const TIMEOUT_MS = 55000; // marge sous les 60s Vercel

interface ReqBody { prompt?: string }

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'HF_TOKEN manquant en variables Vercel' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let prompt = '';
  try {
    const body = (await req.json()) as ReqBody;
    prompt = (body.prompt || '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (!prompt) prompt = 'a cat running in a field, cinematic lighting';

  // Signature CogVideoX-2B /generate: [Prompt, Inference Steps, Guidance Scale]
  const data = [prompt, 8, 6.0];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // 1. POST async
    const postRes = await fetch(`${SPACE_BASE}/gradio_api/call${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
      signal: ctrl.signal,
    });

    if (!postRes.ok) {
      const t = await postRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: `POST HTTP ${postRes.status}`, raw: t.slice(0, 500) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const ej = await postRes.json().catch(() => null);
    const eventId = ej?.event_id || ej?.id;
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'pas d\'event_id', raw: JSON.stringify(ej).slice(0, 500) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // 2. Polling synchrone (dans la même requête Vercel)
    const pollUrl = `${SPACE_BASE}/gradio_api/call${ENDPOINT}/${eventId}`;
    const startPoll = Date.now();
    let lastRaw = '';

    while (Date.now() - startPoll < TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, 2500));
      const g = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      }).catch(() => null);

      if (!g) continue;
      if (g.status === 202) continue;
      if (!g.ok) {
        lastRaw = await g.text().catch(() => '');
        return new Response(JSON.stringify({ error: `poll HTTP ${g.status}`, raw: lastRaw.slice(0, 500) }), {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });      }

      const txt = await g.text();
      lastRaw = txt;

      // Parse SSE basique
      const lines = txt.split(/\r?\n/);
      let curEvent = '';
      let lastVal: unknown = null;
      let done = false;
      for (const ln of lines) {
        if (ln.startsWith('event:')) curEvent = ln.substring(6).trim();
        else if (ln.startsWith('data:')) {
          try { lastVal = JSON.parse(ln.substring(5).trim()); } catch { lastVal = ln.substring(5).trim(); }
          if (curEvent === 'complete' || curEvent === 'error') done = true;
          curEvent = '';
        }
      }
      if (lastVal === null) {
        try { lastVal = JSON.parse(txt); done = true; } catch {}
      }

      // Extraction vidéo
      const videoUrl = extractVideo(SPACE_BASE, lastVal);
      if (videoUrl) {
        return new Response(JSON.stringify({ url: videoUrl }), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      if (done) {
        return new Response(JSON.stringify({ error: `event=${curEvent || 'unknown'}`, raw: txt.slice(0, 800) }), {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'timeout polling serveur', raw: lastRaw.slice(0, 500) }), {
      status: 504,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('aborted') || msg.includes('AbortError')) {
      return new Response(JSON.stringify({ error: 'timeout Vercel (55s)' }), {
        status: 504,
        headers: { ...cors, 'Content-Type': 'application/json' },      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractVideo(base: string, node: unknown): string | null {
  if (!node) return null;
  if (typeof node === 'string') {
    if (/\.(mp4|webm)(\?|$)/i.test(node)) {
      return /^https?:/i.test(node) ? node : base + (node.charAt(0) === '/' ? node : '/' + node);
    }
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const v = extractVideo(base, item);
      if (v) return v;
    }
    return null;
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj.url) {
      const u = String(obj.url);
      if (/^https?:/i.test(u)) return u;
      if (u.includes('file=')) return base + (u.charAt(0) === '/' ? u : '/' + u);
    }
    if (obj.path) {
      const ps = String(obj.path);
      if (/^https?:/i.test(ps)) return ps;
      if (ps.includes('file=')) return base + (ps.charAt(0) === '/' ? ps : '/' + ps);
      return base + '/gradio_api/file=' + (ps.charAt(0) === '/' ? ps : '/' + ps);
    }
    if (obj.video) {
      const r = extractVideo(base, obj.video);
      if (r) return r;
    }
    for (const k of Object.keys(obj)) {
      if (k === 'url' || k === 'path' || k === 'video') continue;
      const v = extractVideo(base, obj[k]);
      if (v) return v;
    }
  }
  return null;}
