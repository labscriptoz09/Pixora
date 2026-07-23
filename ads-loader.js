// ads-loader.js v4 — Version Stable et Propre
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pixora_ads_cache';
    var CACHE_TTL = 60000;

    function getPage() {
        var path = window.location.pathname.toLowerCase();
        if (path.indexOf('profile') !== -1) return 'profile';
        if (path.indexOf('shop') !== -1) return 'shop';
        if (path.indexOf('galer') !== -1 || path.indexOf('gallery') !== -1) return 'galerie';
        if (path.indexOf('earn') !== -1) return 'earn';
        return 'index';
    }

    function createAdSlot(id) {
        var slot = document.createElement('div');
        slot.id = id;
        slot.className = 'pxr-widget'; // Nom neutre pour éviter les filtres basiques
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
                    if (hero) { slots.top = createAdSlot('pxr-top'); hero.after(slots.top); }
                    var gen = main.querySelector('.generator');
                    if (gen) { slots.middle = createAdSlot('pxr-mid'); gen.after(slots.middle); }
                    var footer = main.querySelector('.site-footer');
                    if (footer) { slots.bottom = createAdSlot('pxr-btm'); footer.before(slots.bottom); }
                }
            } else if (page === 'galerie') {
                var mainEl = document.querySelector('.main-content') || document.querySelector('main');
                if (mainEl) {
                    var pageSub = mainEl.querySelector('.page-sub');
                    if (pageSub) { slots.top = createAdSlot('pxr-top'); pageSub.after(slots.top); }
                    var grid = mainEl.querySelector('.results-grid');
                    if (grid) { slots.middle = createAdSlot('pxr-mid'); grid.after(slots.middle); }
                }
            } else if (page === 'profile' || page === 'shop') {
                var mainP = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var footerP = document.querySelector('.site-footer') || document.querySelector('footer');                slots.top = createAdSlot('pxr-top');
                mainP.prepend(slots.top);
                if (footerP) { slots.bottom = createAdSlot('pxr-btm'); footerP.before(slots.bottom); }
            }
        } catch (e) { console.warn('[ADS] Placement error:', e); }
        return slots;
    }

    function injectAd(container, code) {
        try {
            if (!code || typeof code !== 'string' || code.trim().length === 0) return;

            // Si c'est une URL (Smartlink), on crée un lien natif (JAMAIS bloqué par adblock)
            if (code.trim().startsWith('http://') || code.trim().startsWith('https://')) {
                var wrapper = document.createElement('div');
                wrapper.style.cssText = 'background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:16px;padding:1.5rem;text-align:center;backdrop-filter:blur(20px);';
                
                var label = document.createElement('div');
                label.style.cssText = 'font-size:0.6rem;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.8rem;font-weight:600;';
                label.textContent = 'Sponsorisé';

                var link = document.createElement('a');
                link.href = code.trim();
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.8rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                link.innerHTML = '<i class="fas fa-external-link-alt"></i> Découvrir l\'offre';
                
                wrapper.appendChild(label);
                wrapper.appendChild(link);
                container.appendChild(wrapper);
                return;
            }

            // Sinon, on injecte le code HTML/Script dans un iframe
            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:60px;}</style></head><body>' + code + '</body></html>';
            iframe.srcdoc = html;

            iframe.onload = function() {
                try {
                    var h = iframe.contentDocument.body.scrollHeight;
                    iframe.style.height = (h > 10 && h < 1000) ? h + 'px' : '270px';
                } catch (e) { iframe.style.height = '270px'; }
            };
            container.appendChild(iframe);
        } catch (e) { console.warn('[ADS] Injection error:', e); }
    }

    async function loadAdsConfig() {
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed.timestamp && (Date.now() - parsed.timestamp) < CACHE_TTL) return parsed.data;
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
        } catch (e) { console.warn('[ADS] Proxy failed:', e.message); }

        return [];
    }

    async function init() {
        try {
            var page = getPage();
            var allAds = await loadAdsConfig();
            if (!allAds || allAds.length === 0) return;

            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active !== false && ad.code && typeof ad.code === 'string' && ad.code.trim().length > 0;
            });

            if (pageAds.length === 0) return;

            var slots = placeSlots(page);
            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                var slot = slots[pos];
                if (slot) injectAd(slot, ad.code);
            });
        } catch (e) { console.warn('[ADS] Init error:', e); }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
