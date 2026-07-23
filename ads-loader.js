// ads-loader.js v24 — Adaptation Device Automatique + Server-Side
(function() {
    'use strict';

    var DONE = false;
    var CACHE_KEY = 'pxr_ssa_v24';
    var CACHE_TTL = 30000;

    // ✅ Détection device + injection CSS dynamique
    function getDeviceClass() {
        var w = window.innerWidth;
        if (w <= 768) return 'mobile';
        if (w <= 1024) return 'tablet';
        return 'desktop';
    }

    function injectDynamicStyles() {
        var device = getDeviceClass();
        var styleId = 'pxr-styles-' + device;
        if (document.getElementById(styleId)) return;

        var style = document.createElement('style');
        style.id = styleId;

        var base = `
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
                overflow: hidden;
            }
            .pxr-native:hover {
                border-color: rgba(139,92,246,0.4);
                box-shadow: 0 8px 25px rgba(139,92,246,0.15);
            }
            .pxr-label {
                font-size: 0.6rem;
                color: rgba(139,92,246,0.8);
                text-transform: uppercase;                letter-spacing: 0.15em;
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
            .pxr-fallback {
                background: rgba(245,158,11,0.1);
                border: 1px solid rgba(245,158,11,0.3);
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
                color: #FBBF24;
                font-size: 0.8rem;
            }
        `;

        var rules = '';
        if (device === 'mobile') {
            rules = `
                .pxr-native { padding: 1rem; min-height: 80px; max-height: 250px; }
                .pxr-native .pxr-ad-content { max-height: 200px; }
                .pxr-native .pxr-ad-content img,
                .pxr-native .pxr-ad-content a img {
                    max-width: 100%;                    max-height: 180px;
                    object-fit: contain;
                }
                .pxr-btn { padding: 0.7rem 1.5rem; font-size: 0.85rem; }
            `;
        } else if (device === 'tablet') {
            rules = `
                .pxr-native { padding: 1.2rem; min-height: 100px; max-height: 300px; }
                .pxr-native .pxr-ad-content { max-height: 250px; }
                .pxr-native .pxr-ad-content img { max-height: 220px; }
                .pxr-btn { padding: 0.75rem 1.7rem; font-size: 0.87rem; }
            `;
        } else {
            // desktop
            rules = `
                .pxr-native { padding: 1.5rem; min-height: 100px; max-height: 400px; }
                .pxr-native .pxr-ad-content { max-height: 350px; }
                .pxr-native .pxr-ad-content img { max-height: 300px; }
                .pxr-btn { padding: 0.8rem 2rem; font-size: 0.9rem; }
            `;
        }

        style.textContent = base + rules;
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
            anchor.parentNode.insertBefore(s, anchor);        } else if (where === 'append') {
            main.appendChild(s);
        } else {
            main.prepend(s);
        }
        return s;
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

    async function fetchAdFromServer(page, position) {
        var cacheId = CACHE_KEY + '_' + page + '_' + position;
        try {
            var cached = localStorage.getItem(cacheId);
            if (cached) {
                var p = JSON.parse(cached);
                if (p.t && (Date.now() - p.t) < CACHE_TTL) return p.d;
            }
        } catch (e) {}

        try {
            var url = '/api/serve-ad?page=' + encodeURIComponent(page) + '&position=' + encodeURIComponent(position);            var res = await fetch(url);
            if (res.ok) {
                var data = await res.json();
                try { localStorage.setItem(cacheId, JSON.stringify({ d: data, t: Date.now() })); } catch (e) {}
                return data;
            }
        } catch (e) {
            console.error('[SSA] Fetch error:', e.message);
        }
        return null;
    }

    function injectServerAd(container, adData) {
        try {
            if (!adData || !adData.html) {
                var fb = document.createElement('div');
                fb.className = 'pxr-fallback';
                fb.innerHTML = '<i class="fas fa-gift" style="font-size:1.2rem;margin-bottom:0.3rem;display:block"></i>Offre partenaire';
                container.appendChild(fb);
                return;
            }

            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';

            var label = document.createElement('div');
            label.className = 'pxr-label';
            label.textContent = '⭐ Sponsorisé ⭐';
            wrap.appendChild(label);

            var content = document.createElement('div');
            content.className = 'pxr-ad-content';
            content.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.6rem;width:100%;';

            // Extraire et injecter les scripts
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = adData.html;
            var scripts = tempDiv.querySelectorAll('script');

            // HTML sans scripts
            var htmlWithoutScripts = adData.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            content.innerHTML = htmlWithoutScripts;

            // Injecter les scripts un par un
            scripts.forEach(function(oldScript) {
                var newScript = document.createElement('script');
                for (var i = 0; i < oldScript.attributes.length; i++) {
                    var attr = oldScript.attributes[i];
                    newScript.setAttribute(attr.name, attr.value);
                }                if (oldScript.innerHTML) {
                    newScript.innerHTML = oldScript.innerHTML;
                }
                content.appendChild(newScript);
            });

            wrap.appendChild(content);
            container.appendChild(wrap);
        } catch (e) {
            console.warn('[SSA] Inject error:', e);
            var fb = document.createElement('div');
            fb.className = 'pxr-fallback';
            fb.textContent = 'Publicité';
            container.appendChild(fb);
        }
    }

    async function init() {
        if (DONE) return;
        DONE = true;

        try {
            injectDynamicStyles(); // ✅ Injecte le bon CSS selon device
            var page = getPage();
            var slots = createSlots();

            var results = await Promise.all([
                fetchAdFromServer(page, 'top'),
                fetchAdFromServer(page, 'middle'),
                fetchAdFromServer(page, 'bottom')
            ]);

            if (slots.top) injectServerAd(slots.top, results[0]);
            if (slots.middle) injectServerAd(slots.middle, results[1]);
            if (slots.bottom) injectServerAd(slots.bottom, results[2]);

        } catch (e) {
            console.error('[SSA] Init error:', e);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
