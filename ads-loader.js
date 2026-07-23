// ads-loader.js v4 — Proxy /api/config + Cache + Retry
// ✅ Lit les pubs via /api/config (bypass RLS)
// ✅ Cache localStorage 60s pour performance
// ✅ Fallback Supabase direct si proxy échoue
// ✅ Placement intelligent par page
// 📌 Compatible : index, earn, gallery, profile, shop

(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pixora_ads_cache';
    var CACHE_TTL = 60000; // 60 secondes

    // =============================================
    // DÉTECTION PAGE
    // =============================================
    function getPage() {
        var path = window.location.pathname.toLowerCase();
        if (path.indexOf('profile') !== -1) return 'profile';
        if (path.indexOf('shop') !== -1) return 'shop';
        if (path.indexOf('galer') !== -1 || path.indexOf('gallery') !== -1) return 'galerie';
        if (path.indexOf('earn') !== -1) return 'earn';
        return 'index';
    }

    // =============================================
    // CRÉATION SLOTS
    // =============================================
    function createAdSlot(id) {
        var slot = document.createElement('div');
        slot.id = id;
        slot.className = 'pixora-ad-slot';
        slot.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:1px;overflow:hidden;';
        return slot;
    }

    function placeSlots(page) {
        var slots = {};

        try {
            // === INDEX ===
            if (page === 'index') {
                var main = document.querySelector('.main-content');
                if (main) {
                    var hero = main.querySelector('.hero');
                    if (hero) {
                        slots.top = createAdSlot('ad-index-top');
                        hero.after(slots.top);                    }
                    var gen = main.querySelector('.generator');
                    if (gen) {
                        slots.middle = createAdSlot('ad-index-middle');
                        gen.after(slots.middle);
                    }
                    var footer = main.querySelector('.site-footer');
                    if (footer) {
                        slots.bottom = createAdSlot('ad-index-bottom');
                        footer.before(slots.bottom);
                    }
                }
            }
            // === GALERIE ===
            else if (page === 'galerie') {
                var mainEl = document.querySelector('.main-content') || document.querySelector('main');
                if (mainEl) {
                    var pageSub = mainEl.querySelector('.page-sub');
                    if (pageSub) {
                        slots.top = createAdSlot('ad-galerie-top');
                        pageSub.after(slots.top);
                    }
                    var grid = mainEl.querySelector('.results-grid');
                    if (grid) {
                        slots.middle = createAdSlot('ad-galerie-middle');
                        grid.after(slots.middle);
                    }
                    var footerEl = mainEl.querySelector('.site-footer');
                    if (footerEl) {
                        slots.bottom = createAdSlot('ad-galerie-bottom');
                        footerEl.before(slots.bottom);
                    }
                }
            }
            // === PROFILE ===
            else if (page === 'profile') {
                var mainP = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var headerP = document.querySelector('.site-header') || document.querySelector('header');
                var footerP = document.querySelector('.site-footer') || document.querySelector('footer');

                slots.top = createAdSlot('ad-profile-top');
                if (headerP && headerP.nextSibling) {
                    headerP.parentNode.insertBefore(slots.top, headerP.nextSibling);
                } else {
                    mainP.prepend(slots.top);
                }

                slots.bottom = createAdSlot('ad-profile-bottom');
                if (footerP) {
                    footerP.before(slots.bottom);                } else {
                    mainP.append(slots.bottom);
                }
            }
            // === SHOP ===
            else if (page === 'shop') {
                var mainS = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var headerS = document.querySelector('.site-header') || document.querySelector('header');
                var footerS = document.querySelector('.site-footer') || document.querySelector('footer');

                slots.top = createAdSlot('ad-shop-top');
                if (headerS && headerS.nextSibling) {
                    headerS.parentNode.insertBefore(slots.top, headerS.nextSibling);
                } else {
                    mainS.prepend(slots.top);
                }

                slots.bottom = createAdSlot('ad-shop-bottom');
                if (footerS) {
                    footerS.before(slots.bottom);
                } else {
                    mainS.append(slots.bottom);
                }
            }
        } catch (e) {
            console.warn('[ADS] Slots placement error:', e);
        }

        return slots;
    }

    // =============================================
    // INJECTION PUB (avec validation sécurité)
    // =============================================
    function injectAd(container, code) {
        try {
            // ✅ Validation basique du code avant injection
            if (!code || typeof code !== 'string' || code.trim().length === 0) return;

            // Bloquer les scripts inline dangereux
            var cleanCode = code.trim();
            if (cleanCode.indexOf('<script>') !== -1 && cleanCode.indexOf('</script>') === -1) {
                console.warn('[ADS] Blocked malformed script tag');
                return;
            }

            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:60px;}</style></head><body>' + cleanCode + '</body></html>';

            iframe.srcdoc = html;

            iframe.onload = function() {
                try {
                    var h = iframe.contentDocument.body.scrollHeight;
                    if (h > 10 && h < 1000) {
                        iframe.style.height = h + 'px';
                    } else {
                        iframe.style.height = '270px';
                    }
                } catch (e) {
                    // Cross-origin : hauteur par défaut sécurisée
                    iframe.style.height = '270px';
                }
            };

            container.appendChild(iframe);
        } catch (e) {
            console.warn('[ADS] Injection error:', e);
        }
    }

    // =============================================
    // ✅ NOUVEAU : Chargement via proxy /api/config avec cache
    // =============================================
    async function loadAdsConfig() {
        // 1. Vérifier le cache localStorage
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed.timestamp && (Date.now() - parsed.timestamp) < CACHE_TTL) {
                    console.log('[ADS] Cache hit (' + Math.round((CACHE_TTL - (Date.now() - parsed.timestamp)) / 1000) + 's remaining)');
                    return parsed.data;
                }
            }
        } catch (e) {
            // Cache corrompu, on continue sans cache
        }

        // 2. Appeler le proxy /api/config
        try {
            var res = await fetch('/api/config');
            if (res.ok) {
                var config = await res.json();
                var adNetworks = config.ad_networks || [];
                // Sauvegarder dans le cache
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: adNetworks,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    // localStorage plein ou indisponible
                }

                console.log('[ADS] Loaded ' + adNetworks.length + ' ads via proxy');
                return adNetworks;
            }
        } catch (e) {
            console.warn('[ADS] Proxy failed, trying Supabase fallback:', e.message);
        }

        // 3. Fallback Supabase direct (pour admin connecté uniquement)
        try {
            if (typeof window.supabase !== 'undefined') {
                var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                var result = await client.from('admin_config').select('value').eq('key', 'ad_networks').single();
                if (result.data && result.data.value) {
                    console.log('[ADS] Loaded via Supabase fallback');
                    return result.data.value;
                }
            }
        } catch (e) {
            console.warn('[ADS] Supabase fallback also failed:', e.message);
        }

        console.warn('[ADS] No ads loaded from any source');
        return [];
    }

    // =============================================
    // INIT PRINCIPAL
    // =============================================
    async function init() {
        try {
            var page = getPage();
            console.log('[ADS] Initializing for page: ' + page);

            // Charger les configs via proxy + cache
            var allAds = await loadAdsConfig();

            if (!allAds || allAds.length === 0) {
                console.log('[ADS] No ads configured');
                return;
            }
            // Filtrer les pubs pour la page courante
            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active !== false && ad.code && typeof ad.code === 'string' && ad.code.trim().length > 0;
            });

            if (pageAds.length === 0) {
                console.log('[ADS] No active ads for page: ' + page);
                return;
            }

            console.log('[ADS] Injecting ' + pageAds.length + ' ads on ' + page);

            // Placer les slots et injecter les pubs
            var slots = placeSlots(page);

            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                var slot = slots[pos];
                if (slot) {
                    injectAd(slot, ad.code);
                } else {
                    console.warn('[ADS] No slot for position "' + pos + '" on page ' + page);
                }
            });

        } catch (e) {
            console.warn('[ADS] Init error:', e);
        }
    }

    // =============================================
    // DÉMARRAGE INTELLIGENT (DOMContentLoaded + retry)
    // =============================================
    function startWithRetry(maxRetries) {
        var attempts = 0;

        function tryInit() {
            attempts++;
            // Vérifier que le DOM est prêt
            if (document.querySelector('.main-content') || document.querySelector('main') || document.body.children.length > 0) {
                init();
            } else if (attempts < maxRetries) {
                setTimeout(tryInit, 500);
            } else {
                console.warn('[ADS] DOM not ready after ' + maxRetries + ' retries, forcing init');
                init();
            }
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(tryInit, 300);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(tryInit, 300);
            });
        }
    }

    // Lancer avec max 5 retries
    startWithRetry(5);

})();
