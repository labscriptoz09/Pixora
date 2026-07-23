// ads-loader.js v19 — Motivation Désactivation + Bonus Points
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';
    var CACHE_KEY = 'pxr_ads_v19';
    var CACHE_TTL = 60000;
    var DONE = false;
    var BONUS_GRANTED_KEY = 'pxr_adblock_bonus_granted';

    // ✅ CSS : Message motivant + Slots
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
            
            /* Message Anti-Adblock Motivational */
            .pxr-adblock-msg {
                background: rgba(245,158,11,0.1);
                border: 1px solid rgba(245,158,11,0.3);
                border-radius: 12px;
                padding: 1.5rem;
                text-align: center;
                margin: 1rem 0;
                animation: pxrFadeIn 0.5s ease;
            }
            @keyframes pxrFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            .pxr-adblock-msg i {
                color: #F59E0B;
                font-size: 2rem;
                margin-bottom: 0.8rem;
                display: block;
            }
            .pxr-adblock-msg h3 {
                color: #FAFAFA;
                font-size: 1rem;
                margin-bottom: 0.5rem;
                font-weight: 700;
            }
            .pxr-adblock-msg p {
                color: rgba(255,255,255,0.7);
                font-size: 0.85rem;
                margin-bottom: 1rem;
                line-height: 1.5;
            }
            .pxr-adblock-bonus {
                background: rgba(16,185,129,0.15);
                border: 1px solid rgba(16,185,129,0.3);
                border-radius: 8px;
                padding: 0.6rem;
                margin-bottom: 1rem;
                color: #10B981;
                font-weight: 600;
                font-size: 0.85rem;
            }
            .pxr-adblock-actions {
                display: flex;
                gap: 0.8rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            .pxr-adblock-btn-primary {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.7rem 1.4rem;
                background: linear-gradient(135deg, #F59E0B, #EF4444);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.3s;
            }
            .pxr-adblock-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(245,158,11,0.4);
            }
            .pxr-adblock-btn-secondary {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.7rem 1.4rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: rgba(255,255,255,0.7);
                font-weight: 600;
                font-size: 0.85rem;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.3s;
            }
            .pxr-adblock-btn-secondary:hover {
                background: rgba(255,255,255,0.1);
                color: white;
            }
            
            @media (max-width: 768px) {
                .pxr-native { padding: 1rem; min-height: 80px; }
                .pxr-btn { padding: 0.7rem 1.5rem; font-size: 0.85rem; }
                .pxr-adblock-actions { flex-direction: column; }
            }
        `;
        document.head.appendChild(style);
    }

    // ✅ DÉTECTION FIABLE PAR RÉSEAU
    function detectAdblockByNetwork() {
        return new Promise(function(resolve) {
            var detected = false;
            var checks = 0;
            var totalChecks = 3;

            function checkDone() {
                checks++;
                if (checks >= totalChecks) resolve(detected);
            }

            // Test 1: Script Google Ads
            var s1 = document.createElement('script');
            s1.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?' + Date.now();
            s1.onerror = function() { detected = true; checkDone(); };
            s1.onload = function() { checkDone(); };
            document.body.appendChild(s1);

            // Test 2: Fetch domaine pub connu
            fetch('https://cdn.adskeeper.com/s/invoke.js?' + Date.now(), { method: 'HEAD', mode: 'no-cors' })
                .then(function(r) { 
                    if (r.type === 'error') detected = true; 
                    checkDone(); 
                })
                .catch(function() { detected = true; checkDone(); });

            // Test 3: Image tracker pub
            var img = new Image();
            img.src = 'https://www.google-analytics.com/analytics.js?' + Date.now();
            img.onerror = function() { detected = true; checkDone(); };
            img.onload = function() { checkDone(); };
        });
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

    // ✅ FONCTION POUR DONNER LE BONUS POINTS
    async function grantAdblockBonus() {
        try {
            // Vérifier si bonus déjà donné cette session
            if (sessionStorage.getItem(BONUS_GRANTED_KEY)) return false;
            
            var user = await window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY).auth.getUser();
            if (!user.data.user) return false;
            
            var userId = user.data.user.id;
            var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            // Ajouter 5 points
            var userData = await supabase.from('user_data').select('points,total_earned').eq('user_id', userId).single();
            if (!userData.data) return false;
            
            var currentPoints = userData.data.points || 0;
            var currentEarned = userData.data.total_earned || 0;
            
            await supabase.from('user_data').update({
                points: currentPoints + 5,
                total_earned: currentEarned + 5
            }).eq('user_id', userId);
            
            // Enregistrer transaction
            await supabase.from('transactions').insert({
                user_id: userId,
                type: 'earned',
                title: 'Bonus désactivation AdBlock',
                amount: 5
            });
            
            sessionStorage.setItem(BONUS_GRANTED_KEY, 'true');
            return true;
        } catch (e) {
            console.error('[ADS] Bonus error:', e);
            return false;
        }
    }

    function injectAd(container, ad, isAdblock) {
        try {
            // ✅ Si AdBlock détecté → message motivant + bonus
            if (isAdblock) {
                var msg = document.createElement('div');
                msg.className = 'pxr-adblock-msg';
                msg.innerHTML = '<i class="fas fa-heart"></i>' +
                    '<h3>Pixora reste gratuit grâce à vous</h3>' +
                    '<p>Les publicités nous permettent d\'offrir des générations IA illimitées sans abonnement.<br>Désactivez votre bloqueur pour soutenir le projet.</p>' +
                    '<div class="pxr-adblock-bonus">🎁 Bonus : +5 points offerts si vous désactivez !</div>' +
                    '<div class="pxr-adblock-actions">' +
                        '<button class="pxr-adblock-btn-primary" onclick="location.reload()"><i class="fas fa-sync"></i> J\'ai désactivé, recharger</button>' +
                        '<a href="/earn.html" class="pxr-adblock-btn-secondary"><i class="fas fa-coins"></i> Gagner des points autrement</a>' +
                    '</div>';
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
            label.textContent = '⭐ Sponsorisé ';
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
                }, 2000);

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
            
            // ✅ Détecter AdBlock par réseau
            var adblockActive = await detectAdblockByNetwork();
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

            // ✅ Si AdBlock actif → message motivant + bonus
            if (adblockActive) {
                console.log('[ADS] AdBlock actif → affichage message motivant');
                if (slots.top) injectAd(slots.top, null, true);
                if (slots.middle) injectAd(slots.middle, null, true);
                if (slots.bottom) injectAd(slots.bottom, null, true);
                
                // Donner le bonus si l'utilisateur clique "J'ai désactivé"
                // (Le reload donnera les points au prochain chargement)
                return;
            }

            // ✅ Si PAS d'AdBlock → vérifier si on doit donner le bonus
            if (!sessionStorage.getItem(BONUS_GRANTED_KEY)) {
                // L'utilisateur a probablement désactivé AdBlock
                var bonusGiven = await grantAdblockBonus();
                if (bonusGiven) {
                    console.log('[ADS] Bonus +5 points accordé !');
                    // Notifier l'utilisateur
                    setTimeout(function() {
                        var notif = document.createElement('div');
                        notif.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(16,185,129,0.95);color:white;padding:0.8rem 1.5rem;border-radius:12px;font-weight:600;z-index:9999;animation:pxrFadeIn 0.5s ease;box-shadow:0 8px 25px rgba(16,185,129,0.4);';
                        notif.innerHTML = '<i class="fas fa-gift"></i> +5 points bonus pour votre soutien !';
                        document.body.appendChild(notif);
                        setTimeout(function() { notif.remove(); }, 4000);
                    }, 1000);
                }
            }

            // Afficher les pubs normales
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
