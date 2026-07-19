// Proxy serveur pour le Space Gradio Wan 2.2 I2V Fast (kulkas2pintu/wan555)
// Aucun CORS (appel serveur), aucune clé requise (Space public).
// Renvoie toujours du JSON + un tableau steps[] pour debug complet.

const SPACE = 'https://kulkas2pintu-wan555.hf.space';

const H = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function j(body: any, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: H });
}

// fetch qui ne jette jamais (distingue CORS réseau vs HTTP)
async function sf(url: string, opts?: any): Promise<any> {
    try {
        const r = await fetch(url, opts);
        return { ok: r.ok, status: r.status, kind: 'http', r };
    } catch (err) {
        const e = err as any;
        return { ok: false, status: 0, kind: 'net', msg: e && e.message ? e.message : String(err) };
    }
}

function trunc(s: any, n = 220) {
    const t = String(s == null ? '' : s);
    return t.length > n ? t.substring(0, n) + '…' : t;
}

// découvre api_name + signature
async function discover(steps: any[]) {
    const eps = ['/gradio_api/info', '/info', '/config'];
    for (let i = 0; i < eps.length; i++) {
        const f = await sf(SPACE + eps[i]);
        if (f.kind !== 'http') { steps.push({ s: 'info ' + eps[i], ok: false, d: 'net:' + f.msg }); continue; }
        if (!f.ok) { steps.push({ s: 'info ' + eps[i], ok: false, d: 'HTTP ' + f.status }); continue; }
        const txt = await f.r.text();
        let p: any = null; try { p = JSON.parse(txt); } catch (e) { p = null; }
        if (!p) { steps.push({ s: 'info ' + eps[i], ok: false, d: 'non-json' }); continue; }
        let apiNames: string[] = [];
        let params: any[] = [];
        const ne = p.named_endpoints;
        if (ne && typeof ne === 'object' && !Array.isArray(ne)) {
            const ks = Object.keys(ne);
            for (const k of ks) { apiNames.push(k.replace(/^\//, '')); if (!params.length && ne[k] && ne[k].parameters) params = ne[k].parameters; }
        } else if (Array.isArray(p.endpoints)) {            for (const e2 of p.endpoints) { if (e2.api_name) apiNames.push(e2.api_name); if (!params.length && e2.parameters) params = e2.parameters; }
        }
        steps.push({ s: 'info ' + eps[i], ok: true, d: 'api=[' + apiNames.join(',') + '] params=' + params.length });
        return { apiName: apiNames[0] || 'predict', params };
    }
    return { apiName: 'predict', params: [] };
}

// construit data[] d'après la signature, en plaçant l'image et le prompt aux bons endroits
function buildData(params: any[], imageArg: any, prompt: string) {
    if (!params || !params.length) return [imageArg, prompt];
    const data: any[] = [];
    let imgDone = false, promptDone = false;
    for (const p of params) {
        const comp = String((p && p.component) || '').toLowerCase();
        const props = (p && p.props) || {};
        const label = String(props.label || '').toLowerCase();
        if (!imgDone && (comp === 'image' || comp === 'file' || comp === 'uploadbutton' || comp === 'imageupload')) { imgDone = true; data.push(imageArg); continue; }
        if (!promptDone && (comp === 'textbox' || comp === 'text') && label.indexOf('neg') < 0) { promptDone = true; data.push(prompt); continue; }
        if (props && 'value' in props && props.value !== null && props.value !== undefined) { data.push(props.value); continue; }
        if (comp === 'slider' || comp === 'number') data.push(0);
        else if (comp === 'checkbox') data.push(false);
        else data.push('');
    }
    if (!promptDone) { for (let i = 0; i < params.length; i++) { const c = String((params[i] && params[i].component) || '').toLowerCase(); if (c === 'textbox' || c === 'text') { data[i] = prompt; break; } } }
    return data;
}

// upload image vers le Space (essaie 2 endpoints Gradio)
async function uploadImage(buf: ArrayBuffer, steps: any[]) {
    for (const ep of ['/gradio_api/upload', '/upload']) {
        try {
            const fd = new FormData();
            fd.append('files', new Blob([buf], { type: 'image/png' }), 'init.png');
            const f = await sf(SPACE + ep, { method: 'POST', body: fd });
            if (f.kind !== 'http') { steps.push({ s: 'upload ' + ep, ok: false, d: 'net:' + f.msg }); continue; }
            if (!f.ok) { steps.push({ s: 'upload ' + ep, ok: false, d: 'HTTP ' + f.status }); continue; }
            const arr = await f.r.json();
            const path = Array.isArray(arr) ? arr[0] : (arr && arr.path ? arr.path : null);
            steps.push({ s: 'upload ' + ep, ok: !!path, d: trunc(JSON.stringify(arr), 160) });
            if (path) return path;
        } catch (err) { const e = err as any; steps.push({ s: 'upload ' + ep, ok: false, d: 'ex:' + (e.message || e) }); }
    }
    return null;
}

function fileObj(path: string) {
    return { path: path, url: SPACE + '/gradio_api/file=' + path, orig_name: 'init.png', mime_type: 'image/png', is_file: true, meta: { _type: 'gradio.FileData' } };
}
// résout une url vidéo relative/absolue
function resolveUrl(u: any): string | null {
    if (!u) return null;
    const s = String(u);
    if (/^https?:/i.test(s)) return s;
    if (s.charAt(0) === '/' || s.indexOf('/gradio_api/') >= 0 || s.indexOf('file=') >= 0) return SPACE + (s.charAt(0) === '/' ? s : '/' + s);
    return null;
}
function extractVideo(node: any): string | null {
    if (!node) return null;
    if (typeof node === 'string') { if (/\.mp4(\?|$)/i.test(node)) return resolveUrl(node); return null; }
    if (Array.isArray(node)) { for (const x of node) { const v = extractVideo(x); if (v) return v; } return null; }
    if (typeof node === 'object') {
        if (node.url) { const r = resolveUrl(node.url); if (r) return r; }
        if (node.path) { const r = resolveUrl(node.path); if (r) return r; }
        if (node.video) { const r = extractVideo(node.video); if (r) return r; }
        for (const k of Object.keys(node)) { const v = extractVideo(node[k]); if (v) return v; }
    }
    return null;
}

// parse le SSE Gradio (event: complete / data: [...])
function parseSSE(text: string): any {
    const lines = text.split(/\r?\n/);
    let lastData: any = null;
    for (const ln of lines) {
        if (ln.indexOf('data:') === 0) {
            const payload = ln.substring(5).trim();
            try { lastData = JSON.parse(payload); } catch (e) { /* ignore */ }
        }
    }
    if (lastData == null) {
        // peut-être du JSON direct
        try { lastData = JSON.parse(text); } catch (e) { lastData = null; }
    }
    return lastData;
}

// appelle le Space (POST async + polling GET), essaie plusieurs api_name
async function callSpace(apiName: string, data: any, steps: any[]) {
    const names = Array.from(new Set([apiName, 'predict', 'generate', 'process'].filter(Boolean)));
    for (const name of names) {
        const postUrl = SPACE + '/gradio_api/call/' + name;
        steps.push({ s: 'POST ' + postUrl, ok: null, d: 'data=' + trunc(JSON.stringify(data), 160) });
        const post = await sf(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
        if (post.kind !== 'http') { steps.push({ s: 'POST ' + name, ok: false, d: 'net:' + post.msg }); if (/fetch|network/i.test(post.msg || '')) return null; continue; }
        if (post.status === 401 || post.status === 403) { steps.push({ s: 'POST ' + name, ok: false, d: 'AUTH REQUISE (' + post.status + ') → il faudra une clé HF gratuite' }); return { auth: true }; }
        if (!post.ok) { const t = await post.r.text(); steps.push({ s: 'POST ' + name, ok: false, d: 'HTTP ' + post.status + ' ' + trunc(t, 200) }); continue; }
        let ej: any = null; try { ej = await post.r.json(); } catch (e) { const t = await post.r.text(); steps.push({ s: 'POST ' + name, ok: false, d: 'resp non-json ' + trunc(t, 160) }); continue; }
        const eid = ej && (ej.event_id || ej.id);        if (!eid) { steps.push({ s: 'POST ' + name, ok: false, d: 'pas event_id: ' + trunc(JSON.stringify(ej), 200) }); continue; }
        steps.push({ s: 'POST ' + name, ok: true, d: 'event_id=' + eid });
        // polling
        const getUrl = SPACE + '/gradio_api/call/' + name + '/' + eid;
        const get = await sf(getUrl);
        if (get.kind !== 'http') { steps.push({ s: 'GET poll', ok: false, d: 'net:' + get.msg }); continue; }
        if (!get.ok) { const t = await get.r.text(); steps.push({ s: 'GET poll', ok: false, d: 'HTTP ' + get.status + ' ' + trunc(t, 200) }); continue; }
        const txt = await get.r.text();
        const parsed = parseSSE(txt);
        steps.push({ s: 'GET poll', ok: true, d: trunc(JSON.stringify(parsed), 300) });
        return { result: parsed };
    }
    return null;
}

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: H });

    const steps: any[] = [];
    try {
        let prompt = 'a cat running in a field, cinematic lighting, smooth motion';
        if (req.method === 'POST') {
            try { const b = JSON.parse(await req.text()); if (b && b.prompt) prompt = String(b.prompt); } catch (e) { /* garde défaut */ }
        }
        steps.push({ s: 'start', ok: true, d: 'prompt=' + trunc(prompt, 80) });

        // 1) découverte
        const disc = await discover(steps);
        steps.push({ s: 'chosen api', ok: true, d: disc.apiName });

        // 2) image Pollinations (côté serveur)
        const seed = Math.floor(Math.random() * 100000);
        const pollUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=512&height=512&nologo=true&seed=' + seed;
        const imgFetch = await sf(pollUrl);
        if (imgFetch.kind !== 'http' || !imgFetch.ok) return j({ error: 'Pollinations injoignable', steps }, 502);
        const buf = await imgFetch.r.arrayBuffer();
        steps.push({ s: 'pollinations', ok: true, d: Math.round(buf.byteLength / 1024) + ' KB' });

        // 3) upload
        const path = await uploadImage(buf, steps);

        // 4) construit data avec plusieurs formes d'image, tente l'appel
        const imageForms: any[] = [];
        if (path) imageForms.push(fileObj(path));
        if (path) imageForms.push(path);
        imageForms.push(pollUrl); // fallback URL directe

        let finalResult: any = null;
        for (let fi = 0; fi < imageForms.length; fi++) {
            const data = buildData(disc.params, imageForms[fi], prompt);            steps.push({ s: 'imageForm #' + fi, ok: true, d: trunc(JSON.stringify(imageForms[fi]), 120) });
            const call = await callSpace(disc.apiName, data, steps);
            if (!call) continue;
            if (call.auth) return j({ error: 'Le Space exige une connexion HF (clé gratuite nécessaire). Dis-le au dev.', steps }, 401);
            if (call.result) { finalResult = call.result; break; }
        }

        if (!finalResult) return j({ error: 'Aucune réponse exploitable du Space (voir steps)', steps }, 502);

        const videoUrl = extractVideo(finalResult);
        if (!videoUrl) return j({ error: 'Réponse reçue mais aucune URL vidéo dedans', raw: finalResult, steps }, 502);

        steps.push({ s: 'DONE', ok: true, d: videoUrl });
        return j({ url: videoUrl, steps });

    } catch (err) {
        const e = err as any;
        steps.push({ s: 'EXCEPTION', ok: false, d: (e && e.message ? e.message : String(err)) + (e && e.stack ? '\n' + e.stack : '') });
        return j({ error: 'Exception proxy', steps }, 500);
    }
}
