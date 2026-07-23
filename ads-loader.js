// ads-loader.js v8 — STABLE, PROPRE, ANTI-ADBLOCK
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_ads_v8';
    var CACHE_TTL = 60000;
    var LOADED = false;

    function getPage() {
        var p = window.location.pathname.toLowerCase();
        if (p.indexOf('earn') !== -1) return 'earn';
        if (p.indexOf('galer') !== -1 || p.indexOf('gallery') !== -1) return 'galerie';
        if (p.indexOf('profile') !== -1) return 'profile';
        if (p.indexOf('shop') !== -1) return 'shop';
        return 'index';
    }

    // ✅ FIX #2 : Slots dans .main-content, PAS dans body
    function getContainer() {
        return document.querySelector('.main-content') || document.querySelector('main') || document.body;
    }

    function createSlot(id, afterEl) {
        var existing = document.getElementById(id);
        if (existing) return existing;
        var slot = document.createElement('div');
        slot.id = id;
        slot.className = 'pxr-w';
        slot.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:1px;overflow:hidden;';
        if (afterEl && afterEl.parentNode) {
            afterEl.parentNode.insertBefore(slot, afterEl.nextSibling);
        } else {
            getContainer().prepend(slot);
        }
        return slot;
    }

    function placeSlots(page) {
        var slots = {};
        var main = getContainer();
        try {
            if (page === 'index') {
                var hero = main.querySelector('.hero');
                var gen = main.querySelector('.generator');
                var footer = main.querySelector('.site-footer');
                if (hero) slots.top = createSlot('pxr-top', hero);
                if (gen) slots.middle = createSlot('pxr-mid', gen);
                if (footer) slots.bottom = createSlot('pxr-btm', footer.previousElementSibling || footer);            } else if (page === 'galerie') {
                var sub = main.querySelector('.page-sub');
                var grid = main.querySelector('.results-grid');
                if (sub) slots.top = createSlot('pxr-top', sub);
                if (grid) slots.middle = createSlot('pxr-mid', grid);
            } else if (page === 'earn') {
                var header = main.querySelector('.page-header') || main.querySelector('h1');
                var refCard = main.querySelector('.referral-card');
                if (header) slots.top = createSlot('pxr-top', header);
                if (refCard) slots.middle = createSlot('pxr-mid', refCard);
            } else {
                var h = main.querySelector('.page-header') || main.querySelector('h1') || main.firstElementChild;
                if (h) slots.top = createSlot('pxr-top', h);
            }
            // Toujours un slot bottom
            if (!slots.bottom) {
                var ft = main.querySelector('.site-footer') || main.lastElementChild;
                if (ft) slots.bottom = createSlot('pxr-btm', ft.previousElementSibling || ft);
            }
        } catch (e) { console.warn('[ADS] Place error:', e); }
        return slots;
    }

    // ✅ FIX #3 : Injection intelligente URL vs Script
    function injectAd(container, ad) {
        try {
            var code = (ad.code || '').trim();
            if (!code) return;

            var isUrl = code.indexOf('http://') === 0 || code.indexOf('https://') === 0;

            // Wrapper natif (style site)
            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';
            wrap.style.cssText = 'background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:16px;padding:1.2rem;text-align:center;backdrop-filter:blur(20px);transition:border-color 0.3s;';
            wrap.onmouseenter = function() { wrap.style.borderColor = 'rgba(139,92,246,0.3)'; };
            wrap.onmouseleave = function() { wrap.style.borderColor = 'rgba(63,63,70,0.5)'; };

            var label = document.createElement('div');
            label.style.cssText = 'font-size:0.6rem;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.6rem;font-weight:600;';
            label.textContent = 'Sponsorisé';
            wrap.appendChild(label);

            var content = document.createElement('div');
            content.style.cssText = 'min-height:60px;display:flex;align-items:center;justify-content:center;';
            wrap.appendChild(content);

            if (isUrl) {
                // ✅ URL = Lien HTML natif (JAMAIS bloqué par adblock)
                var link = document.createElement('a');                link.href = code;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                link.innerHTML = '<i class="fas fa-external-link-alt"></i> Découvrir';
                link.onmouseenter = function() { link.style.transform = 'translateY(-2px)'; link.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };
                link.onmouseleave = function() { link.style.transform = ''; link.style.boxShadow = ''; };
                content.appendChild(link);
            } else {
                // ✅ Script/HTML = Iframe sandboxé + détection blocage
                var iframe = document.createElement('iframe');
                iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;opacity:0;transition:opacity 0.3s;';
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

                var htmlDoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:60px;}</style></head><body>' + code + '</body></html>';
                iframe.srcdoc = htmlDoc;

                var resolved = false;

                iframe.onload = function() {
                    if (resolved) return;
                    try {
                        var h = iframe.contentDocument.body.scrollHeight;
                        iframe.style.height = (h > 10 && h < 1000) ? h + 'px' : '270px';
                        iframe.style.opacity = '1';
                        resolved = true;
                    } catch (e) {
                        iframe.style.height = '270px';
                        iframe.style.opacity = '1';
                        resolved = true;
                    }
                };

                // ✅ Si bloqué après 2.5s → remplacer par lien natif avec le nom de la pub
                setTimeout(function() {
                    if (resolved) return;
                    resolved = true;
                    content.removeChild(iframe);
                    var fallbackUrl = ad.link || code;
                    if (typeof fallbackUrl !== 'string' || fallbackUrl.indexOf('http') === -1) {
                        fallbackUrl = 'https://pixora-gold-eight.vercel.app/earn.html';
                    }
                    var fb = document.createElement('a');
                    fb.href = fallbackUrl;
                    fb.target = '_blank';
                    fb.rel = 'noopener noreferrer';
                    fb.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                    fb.innerHTML = '<i class="fas fa-star"></i> ' + (ad.name || 'Offre Partenaire');
                    fb.onmouseenter = function() { fb.style.transform = 'translateY(-2px)'; fb.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };                    fb.onmouseleave = function() { fb.style.transform = ''; fb.style.boxShadow = ''; };
                    content.appendChild(fb);
                }, 2500);

                content.appendChild(iframe);
            }

            container.appendChild(wrap);
        } catch (e) { console.warn('[ADS] Inject error:', e); }
    }

    async function loadAds() {
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var p = JSON.parse(cached);
                if (p.t && (Date.now() - p.t) < CACHE_TTL) return p.d;
            }
        } catch (e) {}

        try {
            var res = await fetch('/api/config');
            if (res.ok) {
                var cfg = await res.json();
                var ads = cfg.ad_networks || [];
                try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d: ads, t: Date.now() })); } catch (e) {}
                return ads;
            }
        } catch (e) {}

        try {
            if (typeof window.supabase !== 'undefined') {
                var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                var r = await client.from('admin_config').select('value').eq('key', 'ad_networks').single();
                if (r.data && r.data.value) return r.data.value;
            }
        } catch (e) {}

        return [];
    }

    // ✅ FIX #1 : Pas de setInterval, exécution unique
    async function init() {
        if (LOADED) return;
        LOADED = true;

        try {
            var page = getPage();
            var allAds = await loadAds();
            if (!allAds || !allAds.length) return;
            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active !== false;
            });

            if (!pageAds.length) return;

            var slots = placeSlots(page);

            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                var slot = slots[pos];
                if (slot) injectAd(slot, ad);
            });
        } catch (e) { console.warn('[ADS] Init error:', e); }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
