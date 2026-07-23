// ads-loader.js v10 — Raffiné et Efficace
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_ads_v10';
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
        s.className = 'pxr-slot';
        s.style.cssText = 'width:100%;margin:1.5rem 0;min-height:120px;';
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
                if (hero) slots.top = createSlot('pxr-top', hero);
                if (gen) slots.middle = createSlot('pxr-mid', gen);
            } else if (page === 'galerie') {
                var sub = main.querySelector('.page-sub');
                var grid = main.querySelector('.results-grid');                if (sub) slots.top = createSlot('pxr-top', sub);
                if (grid) slots.middle = createSlot('pxr-mid', grid);
            } else if (page === 'earn') {
                var header = main.querySelector('.page-header') || main.querySelector('h1');
                var refCard = main.querySelector('.referral-card');
                if (header) slots.top = createSlot('pxr-top', header);
                if (refCard) slots.middle = createSlot('pxr-mid', refCard);
            }
        } catch (e) {}
        return slots;
    }

    function injectAd(container, ad) {
        try {
            var code = (ad.code || '').trim();
            var name = ad.name || 'Offre Partenaire';
            var linkUrl = ad.link || '';

            // Wrapper raffiné
            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';

            // Label
            var label = document.createElement('div');
            label.className = 'sponsor-label';
            label.innerHTML = '<i class="fas fa-star"></i> Sponsorisé <i class="fas fa-star"></i>';
            wrap.appendChild(label);

            // Contenu
            var content = document.createElement('div');
            content.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:1rem;';

            var isUrl = code.indexOf('http://') === 0 || code.indexOf('https://') === 0;

            if (isUrl) {
                // Bouton élégant
                var btn = document.createElement('a');
                btn.className = 'pxr-native-btn';
                btn.href = code;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.innerHTML = '<i class="fas fa-external-link-alt"></i> ' + name;
                content.appendChild(btn);
            } else if (code && code.length > 10) {
                // Iframe avec fallback
                var iframe = document.createElement('iframe');
                iframe.style.cssText = 'width:100%;border:none;display:block;opacity:0;transition:opacity 0.3s;';
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

                setTimeout(function() {
                    if (resolved) return;
                    resolved = true;
                    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                    var fbUrl = linkUrl.indexOf('http') === 0 ? linkUrl : 'https://pixora-gold-eight.vercel.app/earn.html';
                    var fb = document.createElement('a');
                    fb.className = 'pxr-native-btn';
                    fb.href = fbUrl;
                    fb.target = '_blank';
                    fb.innerHTML = '<i class="fas fa-star"></i> ' + name;
                    content.appendChild(fb);
                }, 1500);

                content.appendChild(iframe);
            } else {
                // Placeholder élégant
                var ph = document.createElement('div');
                ph.className = 'pxr-placeholder';
                ph.innerHTML = '<i class="fas fa-gift"></i><div>Gagnez des points avec nos partenaires</div>';
                ph.onclick = function() { window.location.href = '/earn.html'; };
                ph.style.cssText += 'cursor:pointer;';
                content.appendChild(ph);
            }

            wrap.appendChild(content);
            container.appendChild(wrap);
        } catch (e) {
            // Fallback simple
            container.innerHTML = '<div class="pxr-placeholder"><i class="fas fa-ad"></i><div>Publicité</div></div>';
        }
    }

    async function loadAds() {
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var p = JSON.parse(cached);
                if (p.t && (Date.now() - p.t) < CACHE_TTL) return p.d;
            }        } catch (e) {}

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
    } else {        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
