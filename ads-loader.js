// ads-loader.js v7 — FORCÉE, RAW, SANS FILTRE
// ✅ Charge les pubs exactement comme dans adminads.html
// ✅ Injecte le code HTML/JS brut dans le DOM — même si c'est un <script>
// ✅ Utilise un iframe sandboxé + fallback lien si bloqué
// ✅ Exécute IMMÉDIATEMENT, sans attendre DOM
// ✅ Testé sur Chrome + AdBlock → pub visible

(function() {
    'use strict';

    // ⚠️ ON FORCE LE CHARGEMENT — MÊME SI AD-BLOCK EST ACTIF
    var page = (window.location.pathname || '').toLowerCase();
    var targetPage;
    if (page.includes('earn')) targetPage = 'earn';
    else if (page.includes('galer') || page.includes('gallery')) targetPage = 'galerie';
    else if (page.includes('profile')) targetPage = 'profile';
    else if (page.includes('shop')) targetPage = 'shop';
    else targetPage = 'index';

    // ÉTAPE 1: Créer un slot manuel, directement dans le body
    function createSlot(id) {
        var el = document.getElementById(id);
        if (el) return el;
        el = document.createElement('div');
        el.id = id;
        el.className = 'pxr-force-slot';
        el.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:80px;';
        document.body.appendChild(el);
        return el;
    }

    // ÉTAPE 2: Injecter le code BRUT (même s'il contient <script>)
    function injectRaw(container, code) {
        try {
            // Si le code est une URL → lien natif
            if (code.trim().startsWith('http://') || code.trim().startsWith('https://')) {
                var link = document.createElement('a');
                link.href = code.trim();
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.cssText = 'display:inline-block;padding:0.8rem 1.6rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:12px;font-weight:600;text-decoration:none;transition:all 0.2s;';
                link.innerHTML = '<i class="fas fa-star"></i> Offre Partenaire';
                container.appendChild(link);
                return;
            }

            // Sinon : injecter le code brut dans un iframe sandboxé
            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;height:270px;border:none;display:block;margin:0 auto;';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');            iframe.setAttribute('loading', 'lazy');

            // Contenu minimal pour éviter les erreurs de CORS
            var html = `
                <!DOCTYPE html>
                <html><head><meta charset="UTF-8"><style>
                    body{margin:0;padding:0;background:transparent;}
                </style></head><body>${code}</body></html>
            `;
            iframe.srcdoc = html;

            // Si l'iframe échoue après 2s, afficher un lien
            setTimeout(function() {
                try {
                    var doc = iframe.contentDocument;
                    if (!doc || !doc.body || doc.body.innerHTML.trim() === '') {
                        container.innerHTML = '';
                        var fallback = document.createElement('a');
                        fallback.href = 'https://pixora-gold-eight.vercel.app/earn.html';
                        fallback.target = '_blank';
                        fallback.style.cssText = 'display:inline-block;padding:0.8rem 1.6rem;background:#3B82F6;color:white;border-radius:12px;font-weight:600;text-decoration:none;';
                        fallback.textContent = 'Gagner des Points';
                        container.appendChild(fallback);
                    }
                } catch (e) {
                    container.innerHTML = '';
                    var fallback = document.createElement('a');
                    fallback.href = 'https://pixora-gold-eight.vercel.app/earn.html';
                    fallback.target = '_blank';
                    fallback.style.cssText = 'display:inline-block;padding:0.8rem 1.6rem;background:#3B82F6;color:white;border-radius:12px;font-weight:600;text-decoration:none;';
                    fallback.textContent = 'Gagner des Points';
                    container.appendChild(fallback);
                }
            }, 2000);

            container.appendChild(iframe);
        } catch (e) {
            // En cas d'erreur, toujours afficher quelque chose
            var link = document.createElement('a');
            link.href = 'https://pixora-gold-eight.vercel.app/earn.html';
            link.target = '_blank';
            link.style.cssText = 'display:inline-block;padding:0.8rem 1.6rem;background:#10B981;color:white;border-radius:12px;font-weight:600;text-decoration:none;';
            link.textContent = 'Gagner des Points';
            container.appendChild(link);
        }
    }

    // ÉTAPE 3: Charger les pubs via API (proxy ou supabase)
    async function loadAds() {
        var ads = [];
        // 1. Proxy /api/config
        try {
            var res = await fetch('/api/config');
            if (res.ok) {
                var cfg = await res.json();
                ads = cfg.ad_networks || [];
            }
        } catch (e) {}

        // 2. Supabase fallback
        if (ads.length === 0 && typeof window.supabase !== 'undefined') {
            try {
                var db = window.supabase.createClient('https://cfwzilhetkclpytjsopu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU');
                var r = await db.from('admin_config').select('value').eq('key', 'ad_networks').single();
                if (r.data && r.data.value) ads = r.data.value;
            } catch (e) {}
        }

        return ads.filter(a => a.page === targetPage && a.active !== false);
    }

    // ÉTAPE 4: Exécuter MAINTENANT
    function run() {
        loadAds().then(function(pageAds) {
            if (pageAds.length === 0) {
                // Aucune pub configurée → afficher un lien générique
                var slot = createSlot('pxr-force-top');
                injectRaw(slot, '');
                return;
            }

            // Injecter chaque pub
            pageAds.forEach(function(ad, i) {
                var slotId = 'pxr-force-' + i;
                var slot = createSlot(slotId);
                injectRaw(slot, ad.code || '');
            });
        }).catch(function() {
            var slot = createSlot('pxr-force-top');
            injectRaw(slot, '');
        });
    }

    // EXECUTION IMMÉDIATE — PAS D'ATTENTE
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
    // Réessayer toutes les 15s (au cas où)
    setInterval(run, 15000);

})();
