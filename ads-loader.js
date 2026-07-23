// ads-loader.js v5.1 — FIX CRITIQUE : Pubs toujours visibles
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_cfg_cache';
    var CACHE_TTL = 60000;

    function getPage() {
        var path = window.location.pathname.toLowerCase();
        if (path.indexOf('profile') !== -1) return 'profile';
        if (path.indexOf('shop') !== -1) return 'shop';
        if (path.indexOf('galer') !== -1 || path.indexOf('gallery') !== -1) return 'galerie';
        if (path.indexOf('earn') !== -1) return 'earn';
        return 'index';
    }

    function createWidgetSlot(id) {
        var slot = document.createElement('div');
        slot.id = id;
        slot.className = 'pxr-widget';
        slot.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:1px;overflow:hidden;';
        return slot;
    }

    function placeSlots(page) {
        var slots = {};
        try {
            if (page === 'index') {
                var main = document.querySelector('.main-content');
                if (main) {
                    var hero = main.querySelector('.hero');
                    if (hero) { slots.top = createWidgetSlot('pxr-w-top'); hero.after(slots.top); }
                    var gen = main.querySelector('.generator');
                    if (gen) { slots.middle = createWidgetSlot('pxr-w-mid'); gen.after(slots.middle); }
                    var footer = main.querySelector('.site-footer');
                    if (footer) { slots.bottom = createWidgetSlot('pxr-w-btm'); footer.before(slots.bottom); }
                }
            } else if (page === 'galerie') {
                var mainEl = document.querySelector('.main-content') || document.querySelector('main');
                if (mainEl) {
                    var pageSub = mainEl.querySelector('.page-sub');
                    if (pageSub) { slots.top = createWidgetSlot('pxr-w-top'); pageSub.after(slots.top); }
                    var grid = mainEl.querySelector('.results-grid');
                    if (grid) { slots.middle = createWidgetSlot('pxr-w-mid'); grid.after(slots.middle); }
                    var footerEl = mainEl.querySelector('.site-footer');
                    if (footerEl) { slots.bottom = createWidgetSlot('pxr-w-btm'); footerEl.before(slots.bottom); }
                }
            } else if (page === 'profile') {                var mainP = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var headerP = document.querySelector('.site-header') || document.querySelector('header');
                var footerP = document.querySelector('.site-footer') || document.querySelector('footer');
                slots.top = createWidgetSlot('pxr-w-top');
                if (headerP && headerP.nextSibling) { headerP.parentNode.insertBefore(slots.top, headerP.nextSibling); }
                else { mainP.prepend(slots.top); }
                slots.bottom = createWidgetSlot('pxr-w-btm');
                if (footerP) { footerP.before(slots.bottom); } else { mainP.append(slots.bottom); }
            } else if (page === 'shop') {
                var mainS = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var headerS = document.querySelector('.site-header') || document.querySelector('header');
                var footerS = document.querySelector('.site-footer') || document.querySelector('footer');
                slots.top = createWidgetSlot('pxr-w-top');
                if (headerS && headerS.nextSibling) { headerS.parentNode.insertBefore(slots.top, headerS.nextSibling); }
                else { mainS.prepend(slots.top); }
                slots.bottom = createWidgetSlot('pxr-w-btm');
                if (footerS) { footerS.before(slots.bottom); } else { mainS.append(slots.bottom); }
            }
        } catch (e) { console.warn('[PX] Slots error:', e); }
        return slots;
    }

    function createNativeWrapper(ad) {
        var wrapper = document.createElement('div');
        wrapper.className = 'pxr-native';
        wrapper.style.cssText = 'background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:16px;padding:1rem;text-align:center;backdrop-filter:blur(20px);transition:border-color 0.3s;min-height:80px;';

        var label = document.createElement('div');
        label.style.cssText = 'font-size:0.6rem;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;font-weight:600;';
        label.textContent = 'Sponsorisé';

        var content = document.createElement('div');
        content.className = 'pxr-native-content';
        content.style.cssText = 'min-height:60px;display:flex;align-items:center;justify-content:center;';

        wrapper.appendChild(label);
        wrapper.appendChild(content);

        wrapper.onmouseenter = function() { wrapper.style.borderColor = 'rgba(139,92,246,0.3)'; };
        wrapper.onmouseleave = function() { wrapper.style.borderColor = 'rgba(63,63,70,0.5)'; };

        return { wrapper: wrapper, content: content };
    }

    // ✅ FIX CRITIQUE : Toujours afficher un lien cliquable
    function injectAd(container, ad) {
        try {
            if (!ad.code || typeof ad.code !== 'string' || ad.code.trim().length === 0) {
                // ✅ Si pas de code → afficher un lien générique
                showGenericLink(container, ad);                return;
            }

            var cleanCode = ad.code.trim();
            var isUrl = cleanCode.startsWith('http://') || cleanCode.startsWith('https://');

            var native = createNativeWrapper(ad);
            container.appendChild(native.wrapper);

            if (isUrl) {
                // ✅ URL DIRECTE → Lien HTML (jamais bloqué)
                var link = document.createElement('a');
                link.href = cleanCode;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                link.innerHTML = '<i class="fas fa-external-link-alt"></i> Découvrir l\'offre';
                link.onmouseenter = function() { link.style.transform = 'translateY(-2px)'; link.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };
                link.onmouseleave = function() { link.style.transform = ''; link.style.boxShadow = ''; };
                native.content.appendChild(link);
            } else {
                // ✅ CODE HTML/SCRIPT → Iframe + fallback garanti
                var iframe = document.createElement('iframe');
                iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;';
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

                var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:60px;}</style></head><body>' + cleanCode + '</body></html>';
                iframe.srcdoc = html;

                var fallbackShown = false;

                iframe.onload = function() {
                    try {
                        var h = iframe.contentDocument.body.scrollHeight;
                        if (h > 10 && h < 1000) { iframe.style.height = h + 'px'; }
                        else { iframe.style.height = '270px'; }
                    } catch (e) { iframe.style.height = '270px'; }
                };

                // ✅ FALLBACK APRÈS 2s SI IFRAME VIDE
                setTimeout(function() {
                    if (fallbackShown) return;
                    try {
                        var doc = iframe.contentDocument;
                        if (!doc || !doc.body || doc.body.innerHTML.trim().length === 0 || doc.body.innerHTML.indexOf('<script') === -1) {
                            showFallbackLink(native.content, ad);
                            fallbackShown = true;
                        }
                    } catch (e) {                        showFallbackLink(native.content, ad);
                        fallbackShown = true;
                    }
                }, 2000);

                native.content.appendChild(iframe);
            }
        } catch (e) { console.warn('[PX] Injection error:', e); }
    }

    // ✅ FALLBACK : Lien HTML quand l'iframe est bloqué
    function showFallbackLink(container, ad) {
        container.innerHTML = '';
        var linkUrl = ad.link || ad.code || '#';
        if (linkUrl.indexOf('http') === -1) linkUrl = '#';

        var link = document.createElement('a');
        link.href = linkUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
        link.innerHTML = '<i class="fas fa-star"></i> Offre Partenaire';
        link.onmouseenter = function() { link.style.transform = 'translateY(-2px)'; link.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };
        link.onmouseleave = function() { link.style.transform = ''; link.style.boxShadow = ''; };
        container.appendChild(link);
    }

    // ✅ LIEN GÉNÉRIQUE SI AUCUN CODE
    function showGenericLink(container, ad) {
        var link = document.createElement('a');
        link.href = 'https://pixora-gold-eight.vercel.app/earn.html';
        link.target = '_blank';
        link.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
        link.innerHTML = '<i class="fas fa-coins"></i> Gagner des Points';
        link.onmouseenter = function() { link.style.transform = 'translateY(-2px)'; link.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };
        link.onmouseleave = function() { link.style.transform = ''; link.style.boxShadow = ''; };
        container.appendChild(link);
    }

    function detectAdblock() {
        var testEl = document.createElement('div');
        testEl.className = 'adsbygoogle';
        testEl.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
        testEl.innerHTML = '&nbsp;';
        document.body.appendChild(testEl);

        setTimeout(function() {
            var blocked = false;
            try {
                if (testEl.offsetHeight === 0 || testEl.offsetWidth === 0 ||                    getComputedStyle(testEl).display === 'none' ||
                    getComputedStyle(testEl).visibility === 'hidden') {
                    blocked = true;
                }
            } catch (e) { blocked = true; }

            document.body.removeChild(testEl);

            if (blocked) {
                showSoftAdblockMessage();
            }
        }, 2000);
    }

    function showSoftAdblockMessage() {
        if (sessionStorage.getItem('pxr_ab_msg')) return;
        sessionStorage.setItem('pxr_ab_msg', '1');

        var msg = document.createElement('div');
        msg.className = 'pxr-support-msg';
        msg.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(24,24,27,0.95);backdrop-filter:blur(24px);border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:1rem 1.5rem;z-index:999;display:flex;align-items:center;gap:1rem;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.5);animation:pxrFadeUp 0.5s ease;';

        msg.innerHTML = '<i class="fas fa-heart" style="color:#EC4899;font-size:1.2rem;flex-shrink:0"></i>' +
            '<div style="flex:1"><div style="font-size:0.85rem;font-weight:600;color:#FAFAFA;margin-bottom:0.2rem">Pixora est 100% gratuit</div>' +
            '<div style="font-size:0.75rem;color:#A1A1AA">Désactivez votre bloqueur de pubs pour nous soutenir.</div></div>' +
            '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#71717A;cursor:pointer;font-size:1rem;padding:0.3rem;flex-shrink:0"><i class="fas fa-times"></i></button>';

        if (!document.getElementById('pxr-styles')) {
            var style = document.createElement('style');
            style.id = 'pxr-styles';
            style.textContent = '@keyframes pxrFadeUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
            document.head.appendChild(style);
        }

        document.body.appendChild(msg);

        setTimeout(function() {
            if (msg.parentNode) {
                msg.style.opacity = '0';
                msg.style.transition = 'opacity 0.5s';
                setTimeout(function() { if (msg.parentNode) msg.remove(); }, 500);
            }
        }, 15000);
    }

    async function loadAdsConfig() {
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);                if (parsed.timestamp && (Date.now() - parsed.timestamp) < CACHE_TTL) {
                    return parsed.data;
                }
            }
        } catch (e) {}

        try {
            var res = await fetch('/api/config');
            if (res.ok) {
                var config = await res.json();
                var adNetworks = config.ad_networks || [];
                try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: adNetworks, timestamp: Date.now() })); } catch (e) {}
                return adNetworks;
            }
        } catch (e) { console.warn('[PX] Proxy failed:', e.message); }

        try {
            if (typeof window.supabase !== 'undefined') {
                var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                var result = await client.from('admin_config').select('value').eq('key', 'ad_networks').single();
                if (result.data && result.data.value) return result.data.value;
            }
        } catch (e) { console.warn('[PX] Supabase fallback failed:', e.message); }

        return [];
    }

    async function init() {
        try {
            var page = getPage();
            var allAds = await loadAdsConfig();

            if (!allAds || allAds.length === 0) {
                console.warn('[PX] No ads configured');
                return;
            }

            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active !== false;
            });

            if (pageAds.length === 0) {
                console.warn('[PX] No ads for page:', page);
                return;
            }

            var slots = placeSlots(page);

            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';                var slot = slots[pos];
                if (slot) { injectAd(slot, ad); }
            });

            detectAdblock();

        } catch (e) { console.warn('[PX] Init error:', e); }
    }

    function startWithRetry(maxRetries) {
        var attempts = 0;
        function tryInit() {
            attempts++;
            if (document.querySelector('.main-content') || document.querySelector('main') || document.body.children.length > 0) {
                init();
            } else if (attempts < maxRetries) {
                setTimeout(tryInit, 500);
            } else { init(); }
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(tryInit, 300);
        } else {
            document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInit, 300); });
        }
    }

    startWithRetry(5);
})();
