// Proxy image anti-taint pour la vidéo cinématique.
// Récupère une image Pollinations CÔTÉ SERVEUR et la renvoie avec CORS ouvert,
// pour que le canvas du navigateur ne soit JAMAIS "tainted" (sinon l'enregistrement vidéo sort vide).
// Rapide (simple tuyau d'une image), sans GPU, sans timeout. Whitelist stricte = pas d'open-proxy.

const ALLOWED_HOST = 'image.pollinations.ai';

const BASE = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600'
};

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: BASE });
    if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'GET only' }), { status: 405, headers: Object.assign({ 'Content-Type': 'application/json' }, BASE) });

    let target = '';
    try { target = new URL(req.url).searchParams.get('url') || ''; } catch (e) { target = ''; }
    if (!target) return new Response(JSON.stringify({ error: 'param url manquant' }), { status: 400, headers: Object.assign({ 'Content-Type': 'application/json' }, BASE) });

    // whitelist stricte
    let parsed: URL;
    try { parsed = new URL(target); } catch (e) { return new Response(JSON.stringify({ error: 'url invalide' }), { status: 400, headers: Object.assign({ 'Content-Type': 'application/json' }, BASE) }); }
    if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_HOST) {
        return new Response(JSON.stringify({ error: 'host non autorisé (pollinations uniquement)' }), { status: 403, headers: Object.assign({ 'Content-Type': 'application/json' }, BASE) });
    }

    try {
        const up = await fetch(target, { redirect: 'follow' });
        if (!up.ok) return new Response(JSON.stringify({ error: 'upstream HTTP ' + up.status }), { status: 502, headers: Object.assign({ 'Content-Type': 'application/json' }, BASE) });
        const buf = await up.arrayBuffer();
        let ctype = up.headers.get('content-type') || '';
        if (!ctype || ctype.indexOf('image/') !== 0) ctype = 'image/jpeg';
        const headers = Object.assign({ 'Content-Type': ctype }, BASE);
        return new Response(buf, { status: 200, headers });
    } catch (err) {
        const e = err as any;
        return new Response(JSON.stringify({ error: 'fetch upstream échec', msg: e && e.message ? e.message : String(err) }), { status: 502, headers: Object.assign({ 'Content-Type': 'application/json' }, BASE) });
    }
}
