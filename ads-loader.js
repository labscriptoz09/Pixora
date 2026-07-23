// ads-loader.js v34 — SSA Visible + Bouton Orange connecté à Modale Rewarded
(function() {
    'use strict';

    console.log('[ADS] v34 START');

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

    // =============================================
    // NOTIFICATION SÉCURISÉE
    // =============================================
    function pxrNotify(msg, type) {
        try {
            var n = document.getElementById('notif');
            var nt = document.getElementById('notif-text');
            if (n && nt) { nt.textContent = msg; n.className = 'notification show ' + (type || 'success'); setTimeout(function() { n.classList.remove('show'); }, 3000); return; }
        } catch(e) {}
        console.log('[PX] ' + msg);
    }

    // =============================================
    // CSS (Identique v33 + Modale Rewarded)
    // =============================================
    var style = document.createElement('style');
    style.textContent = '.pxr-wrapper{width:100%;margin:1rem 0;border:2px dashed #8B5CF6;padding:0.8rem;background:rgba(139,92,246,0.1);border-radius:12px;text-align:center;max-height:400px;overflow:hidden}.pxr-ad-box{max-height:280px;overflow:hidden;margin-bottom:0.5rem}.pxr-ad-box img{max-width:100%;max-height:250px;object-fit:contain}.pxr-label{font-size:0.7rem;color:#8B5CF6;margin-bottom:0.5rem;font-weight:700}.pxr-btn-box{margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid rgba(139,92,246,0.2)}.pxr-rw-btn{background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.85rem;display:inline-flex;align-items:center;gap:0.4rem}.pxr-rw-btn:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(245,158,11,0.4)}' +
    '.pxr-rw-overlay{position:fixed;inset:0;z-index:10003;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:1rem}.pxr-rw-overlay.active{display:flex}.pxr-rw-modal{background:#0f0f14;border:1px solid rgba(139,92,246,0.3);border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow:hidden;position:relative;animation:pxrScaleIn 0.3s ease}@keyframes pxrScaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}.pxr-rw-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.2rem;border-bottom:1px solid rgba(63,63,70,0.5)}.pxr-rw-title{font-size:0.9rem;font-weight:700;color:#FAFAFA;display:flex;align-items:center;gap:0.5rem}.pxr-rw-close{background:none;border:none;color:#A1A1AA;font-size:1.2rem;cursor:pointer;padding:0.3rem}.pxr-rw-close:hover{color:#EF4444}.pxr-rw-body{padding:1.2rem;text-align:center}.pxr-rw-timer{font-family:"JetBrains Mono",monospace;font-size:2rem;font-weight:700;color:#8B5CF6;margin:1rem 0}.pxr-rw-timer.done{color:#10B981}.pxr-rw-info{font-size:0.8rem;color:#A1A1AA;margin-bottom:1rem;line-height:1.5}.pxr-rw-reward{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:8px;padding:0.4rem 0.8rem;color:#FBBF24;font-weight:700;font-size:0.85rem;margin-bottom:1rem}.pxr-rw-iframe{width:100%;height:250px;border:none;border-radius:12px;background:rgba(255,255,255,0.03);margin-bottom:1rem}.pxr-rw-btn-claim{width:100%;padding:0.9rem;background:linear-gradient(135deg,#10B981,#059669);color:white;border:none;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:0.5rem}.pxr-rw-btn-claim:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 25px rgba(16,185,129,0.4)}.pxr-rw-btn-claim:disabled{background:rgba(63,63,70,0.5);color:#71717A;cursor:not-allowed}.pxr-rw-limit{font-size:0.7rem;color:#71717A;margin-top:0.8rem}.pxr-rw-error{color:#EF4444;font-size:0.8rem;margin-top:0.5rem}';
    document.head.appendChild(style);

    // =============================================
    // MODALE REWARDED (Création + Logique)
    // =============================================
    function createRewardedModal() {
        if (document.getElementById('pxr-rw-overlay')) return;
        var overlay = document.createElement('div');
        overlay.id = 'pxr-rw-overlay';
        overlay.className = 'pxr-rw-overlay';
        overlay.innerHTML = '<div class="pxr-rw-modal"><div class="pxr-rw-header"><div class="pxr-rw-title"><i class="fas fa-gift"></i> Pub Récompensée</div><button class="pxr-rw-close" id="pxr-rw-close-btn"><i class="fas fa-times"></i></button></div><div class="pxr-rw-body"><div class="pxr-rw-reward"><i class="fas fa-bolt"></i> <span id="pxr-rw-points">0.5</span> points</div><div class="pxr-rw-info">Regarde cette annonce pendant <span id="pxr-rw-timer-val">20</span>s pour gagner des points.</div><iframe id="pxr-rw-iframe" class="pxr-rw-iframe" sandbox="allow-scripts allow-same-origin allow-popups"></iframe><div class="pxr-rw-timer" id="pxr-rw-timer-display">20s</div><button id="pxr-rw-claim-btn" class="pxr-rw-btn-claim" disabled><i class="fas fa-clock"></i> Patientez...</button><div class="pxr-rw-limit" id="pxr-rw-limit-info"></div><div class="pxr-rw-error" id="pxr-rw-error" style="display:none"></div></div></div>';
        document.body.appendChild(overlay);
        document.getElementById('pxr-rw-close-btn').addEventListener('click', window.pxrCloseRewarded);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) window.pxrCloseRewarded(); });
        document.getElementById('pxr-rw-claim-btn').addEventListener('click', window.pxrClaimRewardedAd);
    }

    var rwTimerInterval = null;
    var rwCurrentToken = null;
    var rwCurrentUserId = null;

    window.pxrOpenRewardedAd = async function() {
        try {            var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            var userResult = await supabase.auth.getUser();
            if (!userResult.data.user) { pxrNotify('Connectez-vous pour gagner des points !', 'error'); return; }
            rwCurrentUserId = userResult.data.user.id;

            var res = await fetch('/api/rewarded-ad?action=get&user_id=' + rwCurrentUserId);
            var data = await res.json();

            if (!data.available) {
                if (data.reason === 'daily_limit_reached') pxrNotify('Limite quotidienne atteinte (' + data.daily_limit + '/jour).', 'error');
                else if (data.reason === 'cooldown_active') pxrNotify('Patientez ' + data.wait_seconds + 's.', 'error');
                else if (data.reason === 'no_rewarded_ads') pxrNotify('Aucune pub récompensée configurée.', 'error');
                else pxrNotify('Aucune pub disponible.', 'error');
                return;
            }

            rwCurrentToken = data.token;
            document.getElementById('pxr-rw-points').textContent = data.points_reward;
            document.getElementById('pxr-rw-timer-val').textContent = data.timer_seconds;
            document.getElementById('pxr-rw-limit-info').textContent = data.views_today + '/' + data.daily_limit + ' vues aujourd\'hui';
            document.getElementById('pxr-rw-error').style.display = 'none';

            var iframe = document.getElementById('pxr-rw-iframe');
            if (data.ad_url) iframe.src = data.ad_url;
            else if (data.ad_html) iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#1a1a24;display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:sans-serif}</style></head><body>' + data.ad_html + '</body></html>';

            var claimBtn = document.getElementById('pxr-rw-claim-btn');
            claimBtn.disabled = true; claimBtn.innerHTML = '<i class="fas fa-clock"></i> Patientez...';

            document.getElementById('pxr-rw-overlay').classList.add('active');
            document.body.style.overflow = 'hidden';

            var remaining = data.timer_seconds;
            var timerDisplay = document.getElementById('pxr-rw-timer-display');
            timerDisplay.textContent = remaining + 's'; timerDisplay.classList.remove('done');

            if (rwTimerInterval) clearInterval(rwTimerInterval);
            rwTimerInterval = setInterval(function() {
                remaining--;
                if (remaining <= 0) { clearInterval(rwTimerInterval); rwTimerInterval = null; timerDisplay.textContent = '✅ Terminé !'; timerDisplay.classList.add('done'); claimBtn.disabled = false; claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points'; }
                else { timerDisplay.textContent = remaining + 's'; }
            }, 1000);
        } catch (e) { console.error('[RW] Open error:', e); pxrNotify('Erreur chargement pub.', 'error'); }
    };

    window.pxrClaimRewardedAd = async function() {
        try {
            if (!rwCurrentToken || !rwCurrentUserId) return;
            var claimBtn = document.getElementById('pxr-rw-claim-btn');
            claimBtn.disabled = true; claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validation...';
            var res = await fetch('/api/rewarded-ad?action=claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: rwCurrentToken, user_id: rwCurrentUserId }) });
            var data = await res.json();

            if (data.success) { pxrNotify('+' + data.points_earned + ' points ! Solde : ' + data.new_balance, 'success'); window.pxrCloseRewarded(); if (typeof updateUI === 'function') updateUI(); }
            else { var errEl = document.getElementById('pxr-rw-error'); errEl.textContent = data.error === 'timer_not_complete' ? 'Patientez encore ' + data.remaining_seconds + 's.' : (data.error || 'Erreur'); errEl.style.display = 'block'; claimBtn.disabled = false; claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points'; }
        } catch (e) { document.getElementById('pxr-rw-error').textContent = 'Erreur réseau.'; document.getElementById('pxr-rw-error').style.display = 'block'; }
    };

    window.pxrCloseRewarded = function() {
        document.getElementById('pxr-rw-overlay').classList.remove('active');
        document.body.style.overflow = '';
        if (rwTimerInterval) { clearInterval(rwTimerInterval); rwTimerInterval = null; }
        document.getElementById('pxr-rw-iframe').src = ''; document.getElementById('pxr-rw-iframe').srcdoc = '';
        rwCurrentToken = null;
    };

    // =============================================
    // SSA VISIBLE (Identique v33 — AUCUN CHANGEMENT)
    // =============================================
    function getPage() {
        var p = window.location.pathname.toLowerCase();
        if (p.indexOf('earn') !== -1) return 'earn';
        if (p.indexOf('galer') !== -1 || p.indexOf('gallery') !== -1) return 'galerie';
        return 'index';
    }

    function createProtectedSlot(id) {
        var wrapper = document.createElement('div');
        wrapper.id = id + '-wrapper';
        wrapper.className = 'pxr-wrapper';
        var label = document.createElement('div');
        label.className = 'pxr-label';
        label.textContent = '⭐ SPONSORISÉ ⭐';
        wrapper.appendChild(label);
        var adBox = document.createElement('div');
        adBox.id = id;
        adBox.className = 'pxr-ad-box';
        adBox.innerHTML = '<div style="color:#A1A1AA;padding:1rem">Chargement...</div>';
        wrapper.appendChild(adBox);
        var btnBox = document.createElement('div');
        btnBox.className = 'pxr-btn-box';
        var btn = document.createElement('button');
        btn.className = 'pxr-rw-btn';
        btn.innerHTML = '🎁 Gagner des points';
        btn.addEventListener('click', window.pxrOpenRewardedAd);
        btnBox.appendChild(btn);
        wrapper.appendChild(btnBox);
        return { wrapper: wrapper, adBox: adBox };
    }
    function injectHtmlWithScripts(container, html) {
        container.innerHTML = html;
        var scripts = container.querySelectorAll('script');
        scripts.forEach(function(oldScript) {
            var newScript = document.createElement('script');
            for (var i = 0; i < oldScript.attributes.length; i++) newScript.setAttribute(oldScript.attributes[i].name, oldScript.attributes[i].value);
            if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    async function loadAndInjectAds() {
        console.log('[ADS] Loading visible ads for page:', getPage());
        try {
            var page = getPage();
            var main = document.querySelector('.main-content') || document.querySelector('main') || document.body;

            var topSlot = createProtectedSlot('pxr-top');
            var midSlot = createProtectedSlot('pxr-mid');
            var btmSlot = createProtectedSlot('pxr-btm');

            var hero = main.querySelector('.hero');
            if (hero && hero.parentNode) hero.parentNode.insertBefore(topSlot.wrapper, hero.nextSibling);
            else main.insertBefore(topSlot.wrapper, main.firstChild);

            var generator = main.querySelector('.generator');
            if (generator && generator.parentNode) generator.parentNode.insertBefore(midSlot.wrapper, generator.nextSibling);
            else main.appendChild(midSlot.wrapper);

            var footer = main.querySelector('.site-footer');
            if (footer && footer.parentNode) footer.parentNode.insertBefore(btmSlot.wrapper, footer);
            else main.appendChild(btmSlot.wrapper);

            var res = await fetch('/api/serve-ad?page=' + page + '&position=top');
            var data = await res.json();
            var htmlTop = '';
            if (data.html && data.html.trim().length > 0) { htmlTop = data.html; injectHtmlWithScripts(topSlot.adBox, data.html); }
            else topSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';

            var res2 = await fetch('/api/serve-ad?page=' + page + '&position=middle');
            var data2 = await res2.json();
            if (data2.html && data2.html.trim().length > 0) injectHtmlWithScripts(midSlot.adBox, data2.html);
            else if (htmlTop) injectHtmlWithScripts(midSlot.adBox, htmlTop);
            else midSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';

            var res3 = await fetch('/api/serve-ad?page=' + page + '&position=bottom');
            var data3 = await res3.json();
            if (data3.html && data3.html.trim().length > 0) injectHtmlWithScripts(btmSlot.adBox, data3.html);
            else if (htmlTop) injectHtmlWithScripts(btmSlot.adBox, htmlTop);            else btmSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';

            console.log('[ADS] v34 DONE — SSA visible + boutons orange connectés');
        } catch (e) { console.error('[ADS] Init error:', e); }
    }

    // =============================================
    // INIT
    // =============================================
    async function init() {
        createRewardedModal();
        await loadAndInjectAds();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 300);
    else document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
})();
