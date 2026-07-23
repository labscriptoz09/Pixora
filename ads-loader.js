// ads-loader.js v14 — 3 slots (haut/milieu/bas), compact, mobile-first
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_ads_v14';
    var CACHE_TTL = 60000;
    var DONE = false;

    // ✅ CSS compact + mobile-first (injecté dynamiquement)
    if (!document.getElementById('pxr-styles')) {
        var style = document.createElement('style');
        style.id = 'pxr-styles';
        style.textContent = `
            .pxr-slot { width: 100%; margin: 0.8rem 0; }
            .pxr-native {
                background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(236,72,153,0.06));
                border: 1px solid rgba(139,92,246,0.15);
                border-radius: 12px;
                padding: 0.9rem 0.8rem;
                backdrop-filter: blur(20px);
                transition: all 0.3s ease;
                max-width: 400px;
                width: 100%;
                margin: 0 auto;
            }
            .pxr-native:hover {
                border-color: rgba(139,92,246,0.3);
                box-shadow: 0 4px 15px rgba(139,92,246,0.1);
            }
            .pxr-label {
                font-size: 0.55rem;
                color: rgba(139,92,246,0.7);
                text-transform: uppercase;
                letter-spacing: 0.12em;
                font-weight: 700;
                margin-bottom: 0.5rem;
                text-align: center;
            }
            .pxr-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 1.1rem;
                background: linear-gradient(135deg, #8B5CF6, #EC4899);
                color: white;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.8rem;                text-decoration: none;
                transition: all 0.3s ease;
                width: 100%;
                justify-content: center;
            }
            .pxr-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 15px rgba(139,92,246,0.4);
            }
            .pxr-ph {
                text-align: center;
                padding: 0.9rem;
                color: rgba(161,161,170,0.5);
                font-size: 0.75rem;
                cursor: pointer;
            }
            .pxr-ph:hover { color: rgba(139,92,246,0.7); }
        `;
        document.head.appendChild(style);
    }

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

    // ✅ Créer 3 slots : haut, milieu, bas
    function createSlots() {
        var slots = { top: null, middle: null, bottom: null };
        
        // Haut : après .hero
        var hero = getContainer().querySelector('.hero');
        if (hero && hero.parentNode) {
            slots.top = createSlot('pxr-top', hero, 'after');
        } else {
            slots.top = createSlot('pxr-top', null, 'prepend');
        }

        // Milieu : après .generator (index) ou .results-grid (galerie) ou .referral-card (earn)
        var gen = getContainer().querySelector('.generator');
        var grid = getContainer().querySelector('.results-grid');
        var ref = getContainer().querySelector('.referral-card');        var target = gen || grid || ref;
        if (target && target.parentNode) {
            slots.middle = createSlot('pxr-mid', target, 'after');
        } else {
            slots.middle = createSlot('pxr-mid', null, 'prepend');
        }

        // Bas : avant .site-footer
        var footer = getContainer().querySelector('.site-footer');
        if (footer && footer.parentNode) {
            slots.bottom = createSlot('pxr-btm', footer, 'before');
        } else {
            slots.bottom = createSlot('pxr-btm', null, 'append');
        }

        return slots;
    }

    function createSlot(id, anchor, where) {
        var ex = document.getElementById(id);
        if (ex) return ex;
        
        var s = document.createElement('div');
        s.id = id;
        s.className = 'pxr-slot';
        
        var main = getContainer();
        if (where === 'after' && anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(s, anchor.nextSibling);
        } else if (where === 'before' && anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(s, anchor);
        } else if (where === 'prepend') {
            main.prepend(s);
        } else {
            main.appendChild(s);
        }
        
        return s;
    }

    function injectAd(container, ad) {
        try {
            var code = (ad.code || '').trim();
            var name = ad.name || 'Offre Partenaire';
            var isUrl = code.indexOf('http://') === 0 || code.indexOf('https://') === 0;

            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';

            var label = document.createElement('div');            label.className = 'pxr-label';
            label.textContent = '⭐ Sponsorisé ⭐';
            wrap.appendChild(label);

            var content = document.createElement('div');
            content.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.5rem;';

            if (isUrl) {
                // URL → bouton natif (jamais bloqué)
                var btn = document.createElement('a');
                btn.className = 'pxr-btn';
                btn.href = code;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.innerHTML = '<i class="fas fa-external-link-alt"></i> ' + name;
                content.appendChild(btn);
            } else if (code && code.length > 10) {
                // HTML/JS → iframe sandboxé
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
                        iframe.style.height = (h > 10 && h < 500) ? h + 'px' : '150px';
                    } catch (e) { iframe.style.height = '150px'; }
                    iframe.style.opacity = '1';
                };

                setTimeout(function() {
                    if (resolved) return;
                    resolved = true;
                    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                    var fb = document.createElement('a');
                    fb.className = 'pxr-btn';
                    fb.href = '/earn.html';
                    fb.target = '_blank';
                    fb.innerHTML = '<i class="fas fa-star"></i> ' + name;
                    content.appendChild(fb);
                }, 1500);

                content.appendChild(iframe);
            } else {
                // Pas de code → placeholder propre
                var ph = document.createElement('div');                ph.className = 'pxr-ph';
                ph.innerHTML = '<i class="fas fa-gift" style="font-size:1.2rem;margin-bottom:0.3rem;display:block"></i>Gagnez des points';
                ph.onclick = function() { window.location.href = '/earn.html'; };
                content.appendChild(ph);
            }

            wrap.appendChild(content);
            container.appendChild(wrap);
        } catch (e) {
            container.innerHTML = '<div class="pxr-ph"><i class="fas fa-ad"></i><div>Publicité</div></div>';
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
            var allAds = await loadAds();            if (!allAds || !allAds.length) return;

            var slots = createSlots();

            // Filtrer les pubs pour la page courante et actives
            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active === true;
            });

            // Assigner par position : top / middle / bottom
            var positions = { top: [], middle: [], bottom: [] };
            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                if (positions[pos]) positions[pos].push(ad);
            });

            // Injecter la première pub de chaque position
            if (slots.top && positions.top[0]) injectAd(slots.top, positions.top[0]);
            if (slots.middle && positions.middle[0]) injectAd(slots.middle, positions.middle[0]);
            if (slots.bottom && positions.bottom[0]) injectAd(slots.bottom, positions.bottom[0]);

        } catch (e) {
            console.warn('[ADS] Init error:', e);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
