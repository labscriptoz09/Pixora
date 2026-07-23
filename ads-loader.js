// ads-loader.js v26 — FIX Scope + Injection Robuste
(function() {
    'use strict';

    var DONE = false;
    var CACHE_KEY = 'pxr_ssa_v26';
    var CACHE_TTL = 30000;
    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

    // ✅ Notification SÉCURISÉE (ne casse pas le site)
    function pxrNotify(msg, type) {
        try {
            // Utiliser la notification du site si disponible
            var n = document.getElementById('notif');
            var nt = document.getElementById('notif-text');
            if (n && nt) {
                nt.textContent = msg;
                n.className = 'notification show ' + (type || 'success');
                setTimeout(function() { n.classList.remove('show'); }, 3000);
                return;
            }
        } catch(e) {}
        // Fallback discret
        console.log('[PX] ' + msg);
    }

    // =============================================
    // CSS DYNAMIQUE
    // =============================================
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

        var css = '';
        
        // Base SSA
        css += '.pxr-slot{width:100%;margin:1rem 0}';
        css += '.pxr-native{background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.08));border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:1.5rem;backdrop-filter:blur(20px);transition:all 0.3s ease;width:100%;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;overflow:hidden}';        css += '.pxr-native:hover{border-color:rgba(139,92,246,0.4);box-shadow:0 8px 25px rgba(139,92,246,0.15)}';
        css += '.pxr-label{font-size:0.6rem;color:rgba(139,92,246,0.8);text-transform:uppercase;letter-spacing:0.15em;font-weight:700;margin-bottom:1rem;text-align:center}';
        css += '.pxr-btn{display:inline-flex;align-items:center;gap:0.6rem;padding:0.8rem 2rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:12px;font-weight:600;font-size:0.9rem;text-decoration:none;transition:all 0.3s ease;box-shadow:0 4px 15px rgba(139,92,246,0.3);border:none;cursor:pointer}';
        css += '.pxr-btn:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(139,92,246,0.5)}';
        css += '.pxr-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none!important;box-shadow:none!important}';
        css += '.pxr-fallback{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:1rem;text-align:center;color:#FBBF24;font-size:0.8rem}';

        // Modale Rewarded
        css += '.pxr-rw-overlay{position:fixed;inset:0;z-index:10003;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:1rem}';
        css += '.pxr-rw-overlay.active{display:flex}';
        css += '.pxr-rw-modal{background:#0f0f14;border:1px solid rgba(139,92,246,0.3);border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow:hidden;position:relative;animation:pxrScaleIn 0.3s ease}';
        css += '@keyframes pxrScaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}';
        css += '.pxr-rw-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.2rem;border-bottom:1px solid rgba(63,63,70,0.5)}';
        css += '.pxr-rw-title{font-size:0.9rem;font-weight:700;color:#FAFAFA;display:flex;align-items:center;gap:0.5rem}';
        css += '.pxr-rw-close{background:none;border:none;color:#A1A1AA;font-size:1.2rem;cursor:pointer;padding:0.3rem}';
        css += '.pxr-rw-close:hover{color:#EF4444}';
        css += '.pxr-rw-body{padding:1.2rem;text-align:center}';
        css += '.pxr-rw-timer{font-family:"JetBrains Mono",monospace;font-size:2rem;font-weight:700;color:#8B5CF6;margin:1rem 0}';
        css += '.pxr-rw-timer.done{color:#10B981}';
        css += '.pxr-rw-info{font-size:0.8rem;color:#A1A1AA;margin-bottom:1rem;line-height:1.5}';
        css += '.pxr-rw-reward{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:8px;padding:0.4rem 0.8rem;color:#FBBF24;font-weight:700;font-size:0.85rem;margin-bottom:1rem}';
        css += '.pxr-rw-iframe{width:100%;height:250px;border:none;border-radius:12px;background:rgba(255,255,255,0.03);margin-bottom:1rem}';
        css += '.pxr-rw-btn-claim{width:100%;padding:0.9rem;background:linear-gradient(135deg,#10B981,#059669);color:white;border:none;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:0.5rem}';
        css += '.pxr-rw-btn-claim:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 25px rgba(16,185,129,0.4)}';
        css += '.pxr-rw-btn-claim:disabled{background:rgba(63,63,70,0.5);color:#71717A;cursor:not-allowed}';
        css += '.pxr-rw-limit{font-size:0.7rem;color:#71717A;margin-top:0.8rem}';
        css += '.pxr-rw-error{color:#EF4444;font-size:0.8rem;margin-top:0.5rem}';
        css += '.pxr-rw-trigger-wrap{text-align:center;margin:1.5rem 0}';

        // Device adapt
        if (device === 'mobile') {
            css += '.pxr-native{padding:1rem;min-height:80px;max-height:250px}.pxr-rw-modal{max-width:95vw}.pxr-rw-iframe{height:200px}';
        } else if (device === 'tablet') {
            css += '.pxr-native{padding:1.2rem;min-height:100px;max-height:300px}';
        } else {
            css += '.pxr-native{padding:1.5rem;min-height:100px;max-height:400px}';
        }

        style.textContent = css;
        document.head.appendChild(style);
    }

    // =============================================
    // MODALE REWARDED AD
    // =============================================
    function createRewardedModal() {
        if (document.getElementById('pxr-rw-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'pxr-rw-overlay';        overlay.className = 'pxr-rw-overlay';
        overlay.innerHTML = '<div class="pxr-rw-modal">' +
            '<div class="pxr-rw-header">' +
                '<div class="pxr-rw-title"><i class="fas fa-gift"></i> Pub Récompensée</div>' +
                '<button class="pxr-rw-close" id="pxr-rw-close-btn"><i class="fas fa-times"></i></button>' +
            '</div>' +
            '<div class="pxr-rw-body">' +
                '<div class="pxr-rw-reward"><i class="fas fa-bolt"></i> <span id="pxr-rw-points">0.5</span> points</div>' +
                '<div class="pxr-rw-info">Regarde cette annonce pendant <span id="pxr-rw-timer-val">20</span>s pour gagner des points.</div>' +
                '<iframe id="pxr-rw-iframe" class="pxr-rw-iframe" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>' +
                '<div class="pxr-rw-timer" id="pxr-rw-timer-display">20s</div>' +
                '<button id="pxr-rw-claim-btn" class="pxr-rw-btn-claim" disabled><i class="fas fa-clock"></i> Patientez...</button>' +
                '<div class="pxr-rw-limit" id="pxr-rw-limit-info"></div>' +
                '<div class="pxr-rw-error" id="pxr-rw-error" style="display:none"></div>' +
            '</div>' +
        '</div>';

        document.body.appendChild(overlay);

        // Event listeners sécurisés
        document.getElementById('pxr-rw-close-btn').addEventListener('click', window.pxrCloseRewarded);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) window.pxrCloseRewarded();
        });
        document.getElementById('pxr-rw-claim-btn').addEventListener('click', window.pxrClaimRewardedAd);
    }

    var rwTimerInterval = null;
    var rwCurrentToken = null;
    var rwCurrentUserId = null;

    window.pxrOpenRewardedAd = async function() {
        try {
            var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            var userResult = await supabase.auth.getUser();
            if (!userResult.data.user) {
                pxrNotify('Connectez-vous pour gagner des points !', 'error');
                return;
            }
            rwCurrentUserId = userResult.data.user.id;

            var res = await fetch('/api/rewarded-ad?action=get&user_id=' + rwCurrentUserId + '&position=rewarded');
            var data = await res.json();

            if (!data.available) {
                if (data.reason === 'daily_limit_reached') {
                    pxrNotify('Limite quotidienne atteinte (' + data.daily_limit + '/jour).', 'error');
                } else if (data.reason === 'cooldown_active') {
                    pxrNotify('Patientez ' + data.wait_seconds + 's avant la prochaine pub.', 'error');
                } else {                    pxrNotify('Aucune pub disponible.', 'error');
                }
                return;
            }

            rwCurrentToken = data.token;
            document.getElementById('pxr-rw-points').textContent = data.points_reward;
            document.getElementById('pxr-rw-timer-val').textContent = data.timer_seconds;
            document.getElementById('pxr-rw-limit-info').textContent = data.views_today + '/' + data.daily_limit + ' vues aujourd\'hui';
            document.getElementById('pxr-rw-error').style.display = 'none';

            var iframe = document.getElementById('pxr-rw-iframe');
            if (data.ad_url) {
                iframe.src = data.ad_url;
            } else if (data.ad_html) {
                iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#1a1a24;display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:sans-serif}</style></head><body>' + data.ad_html + '</body></html>';
            }

            var claimBtn = document.getElementById('pxr-rw-claim-btn');
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<i class="fas fa-clock"></i> Patientez...';

            document.getElementById('pxr-rw-overlay').classList.add('active');
            document.body.style.overflow = 'hidden';

            var remaining = data.timer_seconds;
            var timerDisplay = document.getElementById('pxr-rw-timer-display');
            timerDisplay.textContent = remaining + 's';
            timerDisplay.classList.remove('done');

            if (rwTimerInterval) clearInterval(rwTimerInterval);
            rwTimerInterval = setInterval(function() {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(rwTimerInterval);
                    rwTimerInterval = null;
                    timerDisplay.textContent = '✅ Terminé !';
                    timerDisplay.classList.add('done');
                    claimBtn.disabled = false;
                    claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
                } else {
                    timerDisplay.textContent = remaining + 's';
                }
            }, 1000);

        } catch (e) {
            console.error('[RW] Open error:', e);
            pxrNotify('Erreur chargement pub.', 'error');
        }
    };
    window.pxrClaimRewardedAd = async function() {
        try {
            if (!rwCurrentToken || !rwCurrentUserId) return;

            var claimBtn = document.getElementById('pxr-rw-claim-btn');
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validation...';

            var res = await fetch('/api/rewarded-ad?action=claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: rwCurrentToken, user_id: rwCurrentUserId })
            });

            var data = await res.json();

            if (data.success) {
                pxrNotify('+' + data.points_earned + ' points ! Solde : ' + data.new_balance, 'success');
                window.pxrCloseRewarded();
                if (typeof updateUI === 'function') updateUI();
            } else {
                var errEl = document.getElementById('pxr-rw-error');
                errEl.textContent = data.error === 'timer_not_complete' 
                    ? 'Patientez encore ' + data.remaining_seconds + 's.' 
                    : (data.error || 'Erreur inconnue');
                errEl.style.display = 'block';
                claimBtn.disabled = false;
                claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
            }
        } catch (e) {
            document.getElementById('pxr-rw-error').textContent = 'Erreur réseau.';
            document.getElementById('pxr-rw-error').style.display = 'block';
        }
    };

    window.pxrCloseRewarded = function() {
        document.getElementById('pxr-rw-overlay').classList.remove('active');
        document.body.style.overflow = '';
        if (rwTimerInterval) { clearInterval(rwTimerInterval); rwTimerInterval = null; }
        document.getElementById('pxr-rw-iframe').src = '';
        document.getElementById('pxr-rw-iframe').srcdoc = '';
        rwCurrentToken = null;
    };

    // =============================================
    // SSA (Server-Side Ads)
    // =============================================
    function getPage() {
        var p = window.location.pathname.toLowerCase();        if (p.indexOf('earn') !== -1) return 'earn';
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
            anchor.parentNode.insertBefore(s, anchor);
        } else if (where === 'append') {
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
        if (hero && hero.parentNode) slots.top = createSlot('pxr-top', hero, 'after');
        else slots.top = createSlot('pxr-top', main.firstElementChild, 'before');

        var target = main.querySelector('.generator') || main.querySelector('.results-grid') || main.querySelector('.referral-card');
        if (target && target.parentNode) slots.middle = createSlot('pxr-mid', target, 'after');
        else {
            var children = main.children;
            var midIndex = Math.floor(children.length / 2);
            slots.middle = createSlot('pxr-mid', children[midIndex] || null, children[midIndex] ? 'after' : 'append');
        }

        var footer = main.querySelector('.site-footer');
        if (footer && footer.parentNode) slots.bottom = createSlot('pxr-btm', footer, 'before');
        else slots.bottom = createSlot('pxr-btm', null, 'append');

        return slots;    }

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
            var res = await fetch('/api/serve-ad?page=' + encodeURIComponent(page) + '&position=' + encodeURIComponent(position));
            if (res.ok) {
                var data = await res.json();
                try { localStorage.setItem(cacheId, JSON.stringify({ d: data, t: Date.now() })); } catch (e) {}
                return data;
            }
        } catch (e) { console.error('[SSA] Fetch error:', e.message); }
        return null;
    }

    function injectServerAd(container, adData) {
        try {
            if (!adData || !adData.html) {
                container.innerHTML = '<div class="pxr-fallback"><i class="fas fa-gift" style="font-size:1.2rem;margin-bottom:0.3rem;display:block"></i>Offre partenaire</div>';
                return;
            }
            var wrap = document.createElement('div');
            wrap.className = 'pxr-native';
            wrap.innerHTML = '<div class="pxr-label">⭐ Sponsorisé ⭐</div>';
            
            var content = document.createElement('div');
            content.className = 'pxr-ad-content';
            content.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.6rem;width:100%;';
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = adData.html;
            var scripts = tempDiv.querySelectorAll('script');
            content.innerHTML = adData.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            
            scripts.forEach(function(oldScript) {
                var newScript = document.createElement('script');
                for (var i = 0; i < oldScript.attributes.length; i++) {
                    newScript.setAttribute(oldScript.attributes[i].name, oldScript.attributes[i].value);
                }
                if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
                content.appendChild(newScript);
            });
                        wrap.appendChild(content);
            container.appendChild(wrap);
        } catch (e) {
            container.innerHTML = '<div class="pxr-fallback">Publicité</div>';
        }
    }

    function injectRewardedButton() {
        if (document.getElementById('pxr-rw-trigger')) return;
        var main = getContainer();
        var footer = main.querySelector('.site-footer');
        if (!footer || !footer.parentNode) return;

        var btnWrap = document.createElement('div');
        btnWrap.id = 'pxr-rw-trigger';
        btnWrap.className = 'pxr-rw-trigger-wrap';
        btnWrap.innerHTML = '<button class="pxr-btn" id="pxr-rw-open-btn" style="background:linear-gradient(135deg,#F59E0B,#EF4444);box-shadow:0 4px 15px rgba(245,158,11,0.3)"><i class="fas fa-gift"></i> Gagner des points (Pub Récompensée)</button>';
        footer.parentNode.insertBefore(btnWrap, footer);
        
        document.getElementById('pxr-rw-open-btn').addEventListener('click', window.pxrOpenRewardedAd);
    }

    // =============================================
    // INIT
    // =============================================
    async function init() {
        if (DONE) return;
        DONE = true;

        try {
            injectDynamicStyles();
            createRewardedModal();

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

            injectRewardedButton();
            console.log('[ADS] v26 initialized successfully');

        } catch (e) {            console.error('[ADS] Init error:', e);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
    }
})();
