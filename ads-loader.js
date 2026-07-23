// ads-loader.js v9 — GARANTI 100% VISIBLE
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_ads_v9';
    var CACHE_TTL = 60000;
    var DONE = false;

    function getPage() {
        var p = window.location.pathname.toLowerCase();
        if (p.indexOf('earn') !== -1) return 'earn';
        if (p.indexOf('galer') !== -1 || p.indexOf('gallery') !== -1) return 'galerie';
        if (p.indexOf('profile') !== -1) return 'profile';
        if (p.indexOf('shop') !== -1) return 'shop';
        return 'index';
    }

    function getContainer() {
        return document.querySelector('.main-content') || document.querySelector('main') || document.body;
    }

    function createSlot(id, afterEl) {
        var ex = document.getElementById(id);
        if (ex) return ex;
        var s = document.createElement('div');
        s.id = id;
        s.className = 'pxr-w';
        s.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:80px;';
        if (afterEl && afterEl.parentNode) {
            afterEl.parentNode.insertBefore(s, afterEl.nextSibling);
        } else {
            getContainer().prepend(s);
        }
        return s;
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
                if (footer) slots.bottom = createSlot('pxr-btm', footer.previousElementSibling || footer);
            } else if (page === 'galerie') {                var sub = main.querySelector('.page-sub');
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
            if (!slots.bottom) {
                var ft = main.querySelector('.site-footer') || main.lastElementChild;
                if (ft) slots.bottom = createSlot('pxr-btm', ft.previousElementSibling || ft);
            }
        } catch (e) {}
        return slots;
    }

    // ✅ GARANTI: Affiche TOUJOURS un bouton cliquable
    function injectAd(container, ad) {
        try {
            var code = (ad.code || '').trim();
            var name = ad.name || 'Offre Partenaire';
            var linkUrl = ad.link || '';

            // Wrapper
            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';
            wrap.style.cssText = 'background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:16px;padding:1.2rem;text-align:center;backdrop-filter:blur(20px);transition:all 0.3s;min-height:80px;';
            wrap.onmouseenter = function() { wrap.style.borderColor = 'rgba(139,92,246,0.4)'; wrap.style.transform = 'translateY(-2px)'; };
            wrap.onmouseleave = function() { wrap.style.borderColor = 'rgba(63,63,70,0.5)'; wrap.style.transform = ''; };

            var label = document.createElement('div');
            label.style.cssText = 'font-size:0.6rem;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.6rem;font-weight:600;';
            label.textContent = 'Sponsorisé';
            wrap.appendChild(label);

            var content = document.createElement('div');
            content.style.cssText = 'min-height:60px;display:flex;align-items:center;justify-content:center;';
            wrap.appendChild(content);

            // ✅ STRATÉGIE: URL = lien natif, sinon bouton par défaut
            var isUrl = code.indexOf('http://') === 0 || code.indexOf('https://') === 0;

            if (isUrl) {
                // Lien natif (jamais bloqué)
                var btn = document.createElement('a');                btn.href = code;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                btn.innerHTML = '<i class="fas fa-external-link-alt"></i> ' + name;
                btn.onmouseenter = function() { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };
                btn.onmouseleave = function() { btn.style.transform = ''; btn.style.boxShadow = ''; };
                content.appendChild(btn);
            } else if (code && code.length > 10) {
                // Code HTML/script → iframe avec fallback IMMÉDIAT
                var iframe = document.createElement('iframe');
                iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;opacity:0;transition:opacity 0.3s;';
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
                iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;}</style></head><body>' + code + '</body></html>';

                var resolved = false;
                iframe.onload = function() {
                    if (resolved) return;
                    resolved = true;
                    try {
                        var h = iframe.contentDocument.body.scrollHeight;
                        iframe.style.height = (h > 10 && h < 1000) ? h + 'px' : '270px';
                    } catch (e) { iframe.style.height = '270px'; }
                    iframe.style.opacity = '1';
                };

                // Fallback après 1.5s si bloqué
                setTimeout(function() {
                    if (resolved) return;
                    resolved = true;
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                    var fbUrl = linkUrl.indexOf('http') === 0 ? linkUrl : 'https://pixora-gold-eight.vercel.app/earn.html';
                    var fb = document.createElement('a');
                    fb.href = fbUrl;
                    fb.target = '_blank';
                    fb.rel = 'noopener noreferrer';
                    fb.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                    fb.innerHTML = '<i class="fas fa-star"></i> ' + name;
                    content.appendChild(fb);
                }, 1500);

                content.appendChild(iframe);
            } else {
                // ✅ Code vide → bouton par défaut (TOUJOURS affiché)
                var defBtn = document.createElement('a');
                defBtn.href = 'https://pixora-gold-eight.vercel.app/earn.html';
                defBtn.target = '_blank';                defBtn.rel = 'noopener noreferrer';
                defBtn.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.2s;';
                defBtn.innerHTML = '<i class="fas fa-coins"></i> Gagner des Points';
                defBtn.onmouseenter = function() { defBtn.style.transform = 'translateY(-2px)'; defBtn.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)'; };
                defBtn.onmouseleave = function() { defBtn.style.transform = ''; defBtn.style.boxShadow = ''; };
                content.appendChild(defBtn);
            }

            container.appendChild(wrap);
        } catch (e) {
            // ERREUR → bouton par défaut
            var errBtn = document.createElement('a');
            errBtn.href = 'https://pixora-gold-eight.vercel.app/earn.html';
            errBtn.target = '_blank';
            errBtn.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:#10B981;color:white;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;';
            errBtn.innerHTML = '<i class="fas fa-coins"></i> Gagner des Points';
            container.appendChild(errBtn);
        }
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
    async function init() {
        if (DONE) return;
        DONE = true;

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
        } catch (e) {}
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
