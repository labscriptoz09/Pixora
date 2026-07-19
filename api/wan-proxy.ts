// Proxy serveur Wan 2.2 I2V Fast (kulkas2pintu/wan555) — MODE DEBUG PAR ÉTAPES
// ?step=info  -> découverte du Space (rapide)
// ?step=img   -> image Pollinations côté serveur (rapide)
// ?step=upload-> upload image vers le Space (rapide)
// ?step=call  -> appel GPU complet (LENT, peut timeout)
// Sans step   -> = call (compat)
// Aucune clé requise (Space public). Renvoie toujours JSON.

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

// fetch qui ne jette jamais
async function sf(url: string, opts?: any): Promise<any> {
    try {
        const r = await fetch(url, opts);
        return { ok: r.ok, status: r.status, kind: 'http', r };
    } catch (err) {
        const e = err as any;
        return { ok: false, status: 0, kind: 'net', msg: e && e.message ? e.message : String(err) };
    }
}

function trunc(s: any, n = 240) {
    const t = String(s == null ? '' : s);
    return t.length > n ? t.substring(0, n) + '…' : t;
}

function pollUrl(prompt: string) {
    const seed = Math.floor(Math.random() * 100000);
    return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=512&height=512&nologo=true&seed=' + seed;
}

// ---- découverte ----
async function discover() {
    const eps = ['/gradio_api/info', '/info', '/config'];
    for (const ep of eps) {
        const f = await sf(SPACE + ep);
        if (f.kind !== 'http') { console.log('[WAN][info] ' + ep + ' NET ' + f.msg); continue; }
        if (!f.ok) { console.log('[WAN][info] ' + ep + ' HTTP ' + f.status); continue; }
        const txt = await f.r.text();        let p: any = null; try { p = JSON.parse(txt); } catch (e) { p = null; }
        if (!p) { console.log('[WAN][info] ' + ep + ' non-json'); continue; }
        let apiNames: string[] = [];
        let params: any[] = [];
        const ne = p.named_endpoints;
        if (ne && typeof ne === 'object' && !Array.isArray(ne)) {
            for (const k of Object.keys(ne)) { apiNames.push(k.replace(/^\//, '')); if (!params.length && ne[k] && ne[k].parameters) params = ne[k].parameters; }
        } else if (Array.isArray(p.endpoints)) {
            for (const e2 of p.endpoints) { if (e2.api_name) apiNames.push(e2.api_name); if (!params.length && e2.parameters) params = e2.parameters; }
        }
        console.log('[WAN][info] OK ' + ep + ' api=[' + apiNames.join(',') + '] params=' + params.length);
        return { ok: true, ep, apiNames, params, raw: trunc(txt, 800) };
    }
    return { ok: false, apiNames: [], params: [], raw: null };
}

// ---- image Pollinations côté serveur ----
async function fetchImage(prompt: string) {
    const url = pollUrl(prompt);
    const f = await sf(url);
    if (f.kind !== 'http' || !f.ok) { console.log('[WAN][img] FAIL ' + (f.kind === 'net' ? f.msg : 'HTTP ' + f.status)); return { ok: false, url, kb: 0, msg: f.kind === 'net' ? f.msg : 'HTTP ' + f.status, buf: null }; }
    const buf = await f.r.arrayBuffer();
    console.log('[WAN][img] OK ' + Math.round(buf.byteLength / 1024) + ' KB');
    return { ok: true, url, kb: Math.round(buf.byteLength / 1024), buf };
}

// ---- upload vers Space ----
async function uploadImage(buf: ArrayBuffer) {
    for (const ep of ['/gradio_api/upload', '/upload']) {
        try {
            const fd = new FormData();
            fd.append('files', new Blob([buf], { type: 'image/png' }), 'init.png');
            const f = await sf(SPACE + ep, { method: 'POST', body: fd });
            if (f.kind !== 'http') { console.log('[WAN][upload] ' + ep + ' NET ' + f.msg); continue; }
            if (!f.ok) { const t = await f.r.text(); console.log('[WAN][upload] ' + ep + ' HTTP ' + f.status + ' ' + trunc(t, 120)); continue; }
            const arr = await f.r.json();
            const path = Array.isArray(arr) ? arr[0] : (arr && arr.path ? arr.path : null);
            console.log('[WAN][upload] ' + ep + ' -> ' + trunc(JSON.stringify(arr), 140));
            return { ok: !!path, ep, path, raw: trunc(JSON.stringify(arr), 200) };
        } catch (err) { const e = err as any; console.log('[WAN][upload] ' + ep + ' EX ' + (e.message || e)); }
    }
    return { ok: false, ep: null, path: null, raw: null };
}

// ---- construction data[] ----
function buildData(params: any[], imageArg: any, prompt: string) {
    if (!params || !params.length) return [imageArg, prompt];
    const data: any[] = [];
    let imgDone = false, promptDone = false;
    for (const p of params) {        const comp = String((p && p.component) || '').toLowerCase();
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

function fileObj(path: string) {
    return { path: path, url: SPACE + '/gradio_api/file=' + path, orig_name: 'init.png', mime_type: 'image/png', is_file: true, meta: { _type: 'gradio.FileData' } };
}

// ---- extracteur vidéo ----
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

function parseSSE(text: string): any {
    const lines = text.split(/\r?\n/);
    let lastData: any = null;
    for (const ln of lines) {
        if (ln.indexOf('data:') === 0) {
            const payload = ln.substring(5).trim();
            try { lastData = JSON.parse(payload); } catch (e) { /* ignore */ }
        }
    }
    if (lastData == null) { try { lastData = JSON.parse(text); } catch (e) { lastData = null; } }
    return lastData;}

// ---- appel Space (un api_name) ----
async function callOne(name: string, data: any) {
    const postUrl = SPACE + '/gradio_api/call/' + name;
    console.log('[WAN][call] POST ' + postUrl + ' data=' + trunc(JSON.stringify(data), 140));
    const post = await sf(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
    if (post.kind !== 'http') return { ok: false, name, d: 'NET ' + post.msg };
    if (post.status === 401 || post.status === 403) return { ok: false, name, auth: true, d: 'AUTH ' + post.status };
    if (!post.ok) { const t = await post.r.text(); return { ok: false, name, d: 'HTTP ' + post.status + ' ' + trunc(t, 180) }; }
    let ej: any = null; try { ej = await post.r.json(); } catch (e) { const t = await post.r.text(); return { ok: false, name, d: 'non-json ' + trunc(t, 160) }; }
    const eid = ej && (ej.event_id || ej.id);
    if (!eid) return { ok: false, name, d: 'pas event_id ' + trunc(JSON.stringify(ej), 180) };
    console.log('[WAN][call] event_id=' + eid + ' -> polling');
    const get = await sf(SPACE + '/gradio_api/call/' + name + '/' + eid);
    if (get.kind !== 'http') return { ok: false, name, d: 'poll NET ' + get.msg };
    if (!get.ok) { const t = await get.r.text(); return { ok: false, name, d: 'poll HTTP ' + get.status + ' ' + trunc(t, 180) }; }
    const txt = await get.r.text();
    const parsed = parseSSE(txt);
    console.log('[WAN][call] poll OK ' + trunc(JSON.stringify(parsed), 200));
    return { ok: true, name, result: parsed };
}

async function callSpace(apiName: string, data: any) {
    const names = Array.from(new Set([apiName, 'predict', 'generate', 'process'].filter(Boolean)));
    const tries: any[] = [];
    for (const name of names) {
        const r = await callOne(name, data);
        tries.push({ name, ok: r.ok, auth: !!r.auth, d: r.d });
        if (r.auth) return { auth: true, tries };
        if (r.ok && r.result) return { result: r.result, tries };
        if (r.d && /^NET/.test(r.d)) return { netfail: true, tries }; // réseau mort, inutile de retenter
    }
    return { tries };
}

// ---- étape CALL complète ----
async function doCall(prompt: string) {
    const steps: any[] = [];
    const disc = await discover();
    steps.push({ s: 'discover', ok: disc.ok, d: 'api=[' + disc.apiNames.join(',') + '] params=' + disc.params.length });
    if (!disc.ok) return { error: 'Space /info injoignable (down, sleep ou CORS serveur)', steps };
    const apiName = disc.apiNames[0] || 'predict';

    const img = await fetchImage(prompt);
    steps.push({ s: 'pollinations', ok: img.ok, d: img.ok ? img.kb + ' KB' : img.msg });
    if (!img.ok) return { error: 'Pollinations injoignable côté serveur', steps };

    const up = await uploadImage(img.buf as ArrayBuffer);
    steps.push({ s: 'upload', ok: up.ok, d: up.ok ? ('path=' + trunc(up.path, 100)) : 'échec upload' });
    const imageForms: any[] = [];
    if (up.ok && up.path) imageForms.push(fileObj(up.path));
    if (up.ok && up.path) imageForms.push(up.path);
    imageForms.push(img.url);

    for (let fi = 0; fi < imageForms.length; fi++) {
        const data = buildData(disc.params, imageForms[fi], prompt);
        steps.push({ s: 'imageForm#' + fi, ok: true, d: trunc(JSON.stringify(imageForms[fi]), 120) });
        const call = await callSpace(apiName, data);
        steps.push({ s: 'call#' + fi, ok: !!(call as any).result, auth: !!(call as any).auth, d: JSON.stringify((call as any).tries) });
        if ((call as any).auth) return { error: 'Le Space exige une connexion HF (clé gratuite nécessaire)', steps };
        if ((call as any).result) {
            const videoUrl = extractVideo((call as any).result);
            if (videoUrl) { steps.push({ s: 'DONE', ok: true, d: videoUrl }); return { url: videoUrl, steps }; }
            steps.push({ s: 'extract#' + fi, ok: false, d: 'réponse sans URL vidéo : ' + trunc(JSON.stringify((call as any).result), 200) });
        }
    }
    return { error: 'Aucune réponse exploitable du Space (voir steps)', steps };
}

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: H });

    let prompt = 'a cat running in a field, cinematic lighting, smooth motion';
    if (req.method === 'POST') { try { const b = JSON.parse(await req.text()); if (b && b.prompt) prompt = String(b.prompt); } catch (e) { /* défaut */ } }

    let step = 'call';
    try { step = (new URL(req.url).searchParams.get('step') || 'call').toLowerCase(); } catch (e) { /* défaut */ }
    console.log('[WAN] handler step=' + step + ' prompt=' + trunc(prompt, 60));

    try {
        if (step === 'info') {
            const d = await discover();
            return j({ step: 'info', ok: d.ok, apiNames: d.apiNames, paramsCount: d.params.length, params: d.params, raw: d.raw });
        }
        if (step === 'img') {
            const im = await fetchImage(prompt);
            return j({ step: 'img', ok: im.ok, kb: im.kb, url: im.url, msg: im.msg || null });
        }
        if (step === 'upload') {
            const im = await fetchImage(prompt);
            if (!im.ok) return j({ step: 'upload', ok: false, error: 'pollinations fail', msg: im.msg });
            const up = await uploadImage(im.buf as ArrayBuffer);
            return j({ step: 'upload', ok: up.ok, path: up.path, ep: up.ep, raw: up.raw });
        }
        // call (ou défaut)
        const res = await doCall(prompt);
        return j(Object.assign({ step: 'call' }, res), (res as any).url ? 200 : 502);
    } catch (err) {        const e = err as any;
        console.log('[WAN] EXCEPTION ' + (e && e.message ? e.message : String(err)));
        return j({ step, error: 'Exception proxy', msg: e && e.message ? e.message : String(err) }, 500);
    }
}
