// ads-loader.js v17 — Anti-Adblock + Slots garantis + Format LONG
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_ads_v17';
    var CACHE_TTL = 60000;
    var DONE = false;

    // ✅ CSS : Anti-adblock message + Slots
    if (!document.getElementById('pxr-styles')) {
        var style = document.createElement('style');
        style.id = 'pxr-styles';
        style.textContent = `
            .pxr-slot { width: 100%; margin: 1rem 0; }
            .pxr-native {
                background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08));
                border: 1px solid rgba(139,92,246,0.2);
                border-radius: 16px;
                padding: 1.5rem;
                backdrop-filter: blur(20px);
                transition: all 0.3s ease;
                width: 100%;
                min-height: 100px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
            }
            .pxr-native:hover {
                border-color: rgba(139,92,246,0.4);
                box-shadow: 0 8px 25px rgba(139,92,246,0.15);
            }
            .pxr-label {
                font-size: 0.6rem;
                color: rgba(139,92,246,0.8);
                text-transform: uppercase;
                letter-spacing: 0.15em;
                font-weight: 700;
                margin-bottom: 1rem;
                text-align: center;
            }
            .pxr-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.8rem 2rem;
                background: linear-gradient(135deg, #8B5CF6, #EC4899);
                color: white;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.9rem;
                text-decoration: none;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(139,92,246,0.3);
            }
            .pxr-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(139,92,246,0.5);
            }
            .pxr-ph {
                text-align: center;
                padding: 1.5rem;
                color: rgba(161,161,170,0.6);
                font-size: 0.85rem;
                cursor: pointer;
            }
            .pxr-ph:hover { color: rgba(139,92,246,0.8); }
            
            /* Anti-adblock message */
            .pxr-adblock-msg {
                background: rgba(245,158,11,0.1);
                border: 1px solid rgba(245,158,11,0.3);
                border-radius: 12px;
                padding: 1.2rem;
                text-align: center;
                margin: 1rem 0;
            }
            .pxr-adblock-msg i {
                color: #F59E0B;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
            }
            .pxr-adblock-msg p {
                color: rgba(255,255,255,0.8);
                font-size: 0.85rem;
                margin-bottom: 0.8rem;
            }
            .pxr-adblock-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 1.2rem;
                background: rgba(245,158,11,0.2);
                border: 1px solid rgba(245,158,11,0.4);
                border-radius: 8px;
                color: #FBBF24;
                font-weight: 600;
                font-size: 0.8rem;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.3s;
            }
            .pxr-adblock-btn:hover {
                background: rgba(245,158,11,0.3);
                transform: translateY(-1px);
            }
            
            @media (max-width: 768px) {
                .pxr-native { padding: 1rem; min-height: 80px; }
                .pxr-btn { padding: 0.7rem 1.5rem; font-size: 0.85rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // ✅ DÉTECTION ADBLOCK
    function detectAdblock() {
        var adBlockDetected = false;

        // Test 1: Elements piégés
        var testEl = document.createElement('div');
        testEl.innerHTML = '&nbsp;';
        testEl.className = 'adsbox adsense ad-unit ad-banner';
        testEl.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
        document.body.appendChild(testEl);

        setTimeout(function() {
            try {
                if (testEl.offsetHeight === 0 || testEl.offsetWidth === 0 ||
                    getComputedStyle(testEl).display === 'none' ||
                    getComputedStyle(testEl).visibility === 'hidden') {
                    adBlockDetected = true;
                }
            } catch (e) {
                adBlockDetected = true;
            }
            document.body.removeChild(testEl);
        }, 100);

        // Test 2: Variables piégées
        setTimeout(function() {
            var fakeAd = document.createElement('div');
            fakeAd.innerHTML = '<div class="ad-banner" style="height:1px"></div>';
            document.body.appendChild(fakeAd);
            
            try {
                var adFrame = document.createElement('iframe');
                adFrame.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
                adFrame.className = 'adsbygoogle';
                document.body.appendChild(adFrame);
                
                setTimeout(function() {
                    if (adFrame.offsetWidth === 0 || adFrame.offsetHeight === 0) {
                        adBlockDetected = true;
                    }
                    document.body.removeChild(adFrame);
                    document.body.removeChild(fakeAd);
                }, 100);
            } catch (e) {
                adBlockDetected = true;
                if (fakeAd.parentNode) document.body.removeChild(fakeAd);
            }
        }, 100);

        return adBlockDetected;
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

    function createSlots() {
        var slots = { top: null, middle: null, bottom: null };
        var main = getContainer();

        var hero = main.querySelector('.hero');
        if (hero && hero.parentNode) {
            slots.top = createSlot('pxr-top', hero, 'after');
        } else {
            slots.top = createSlot('pxr-top', main.firstElementChild, 'before');
        }

        var target = main.querySelector('.generator') || main.querySelector('.results-grid') || main.querySelector('.referral-card');
        if (target && target.parentNode) {
            slots.middle = createSlot('pxr-mid', target, 'after');
        } else {
            var children = main.children;
            var midIndex = Math.floor(children.length / 2);
            if (children[midIndex]) {
                slots.middle = createSlot('pxr-mid', children[midIndex], 'after');
            } else {
                slots.middle = createSlot('pxr-mid', null, 'append');
            }
        }

        var footer = main.querySelector('.site-footer');
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
        } else if (where === 'append') {
            main.appendChild(s);
        } else {
            main.prepend(s);
        }
        
        return s;
    }

    function injectAd(container, ad, isAdblock) {
        try {
            // ✅ Si AdBlock détecté → afficher message poli
            if (isAdblock) {
                var msg = document.createElement('div');
                msg.className = 'pxr-adblock-msg';
                msg.innerHTML = '<i class="fas fa-exclamation-triangle"></i>' +
                    '<p>Pixora est 100% gratuit grâce aux publicités.<br>Désactivez votre bloqueur pour nous soutenir et accéder à toutes les fonctionnalités.</p>' +
                    '<a href="/earn.html" class="pxr-adblock-btn"><i class="fas fa-coins"></i> Gagner des points autrement</a>';
                container.appendChild(msg);
                return;
            }

            var code = (ad.code || '').trim();
            var name = ad.name || 'Offre Partenaire';
            var isUrl = code.indexOf('http://') === 0 || code.indexOf('https://') === 0;

            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';

            var label = document.createElement('div');
            label.className = 'pxr-label';
            label.textContent = '⭐ Sponsorisé ⭐';
            wrap.appendChild(label);

            if (isUrl) {
                var btn = document.createElement('a');
                btn.className = 'pxr-btn';
                btn.href = code;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.innerHTML = '<i class="fas fa-external-link-alt"></i> ' + name;
                wrap.appendChild(btn);
            } else if (code && code.length > 10) {
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
                        iframe.style.height = (h > 10 && h < 500) ? h + 'px' : '120px';
                    } catch (e) { iframe.style.height = '120px'; }
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
                    wrap.appendChild(fb);
                }, 1500);

                wrap.appendChild(iframe);
            } else {
                var ph = document.createElement('div');
                ph.className = 'pxr-ph';
                ph.innerHTML = '<i class="fas fa-gift" style="font-size:1.5rem;margin-bottom:0.5rem;display:block"></i>Gagnez des points avec nos partenaires';
                ph.onclick = function() { window.location.href = '/earn.html'; };
                wrap.appendChild(ph);
            }

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
            
            // ✅ Détecter AdBlock
            var adblockActive = detectAdblock();
            console.log('[ADS] AdBlock détecté:', adblockActive);

            var allAds = await loadAds();
            console.log('[ADS] Page:', page, 'Total ads:', allAds ? allAds.length : 0);
            
            if (!allAds || !allAds.length) {
                console.warn('[ADS] Aucune pub chargée');
                return;
            }

            var slots = createSlots();
            console.log('[ADS] Slots créés:', !!slots.top, !!slots.middle, !!slots.bottom);

            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active === true;
            });
            
            console.log('[ADS] Pubs pour cette page:', pageAds.length);

            // ✅ Si AdBlock actif → afficher message dans TOUS les slots
            if (adblockActive) {
                console.log('[ADS] AdBlock actif → affichage message alternatif');
                if (slots.top) injectAd(slots.top, null, true);
                if (slots.middle) injectAd(slots.middle, null, true);
                if (slots.bottom) injectAd(slots.bottom, null, true);
                return;
            }

            // Sinon afficher les pubs normales
            var positions = { top: [], middle: [], bottom: [] };
            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                if (positions[pos]) positions[pos].push(ad);
            });

            if (slots.top && positions.top[0]) injectAd(slots.top, positions.top[0], false);
            if (slots.middle && positions.middle[0]) injectAd(slots.middle, positions.middle[0], false);
            if (slots.bottom && positions.bottom[0]) injectAd(slots.bottom, positions.bottom[0], false);

        } catch (e) {
            console.error('[ADS] Init error:', e);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
