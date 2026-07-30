// ads-loader.js v36.3 — CORRECTED: Pub statique si API échoue
(function() {
    'use strict';

    console.log('[ADS] v36.3 START');

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

    function pxrNotify(msg, type) {
        try {
            var n = document.getElementById('notif');
            var nt = document.getElementById('notif-text');
            if (n && nt) { nt.textContent = msg; n.className = 'notification show ' + (type || 'success'); setTimeout(function() { n.classList.remove('show'); }, 3000); return; }
        } catch(e) {}
        console.log('[PX] ' + msg);
    }

    var style = document.createElement('style');
    style.textContent = '.pxr-wrapper{display:block;width:100%;margin:1rem 0;border:2px dashed #8B5CF6;padding:0.8rem;background:rgba(139,92,246,0.1);border-radius:12px;text-align:center;overflow:hidden;clear:both}.pxr-ad-box{max-height:none;overflow:hidden;margin-bottom:0.5rem}.pxr-ad-box img{max-width:100%;max-height:250px;object-fit:contain}.pxr-label{font-size:0.7rem;color:#8B5CF6;margin-bottom:0.5rem;font-weight:700}.pxr-btn-box{margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid rgba(139,92,246,0.2)}.pxr-rw-btn{background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.85rem;display:inline-flex;align-items:center;gap:0.4rem}.pxr-rw-btn:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(245,158,11,0.4)}' +
    '.pxr-sponsor-static{width:100%;max-width:600px;margin:0 auto;position:relative;overflow:hidden;border-radius:12px;box-shadow:0 8px 24px rgba(139,92,246,0.2)}' +
    '.pxr-sponsor-static img{width:100%;height:auto;display:block}' +
    '.pxr-sponsor-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:1rem;color:white}';
    document.head.appendChild(style);

    function createRewardedModal() {
        if (document.getElementById('pxr-rw-overlay')) return;
        var overlay = document.createElement('div');
        overlay.id = 'pxr-rw-overlay';
        overlay.className = 'pxr-rw-overlay';
        overlay.innerHTML = '<div class="pxr-rw-modal"><div class="pxr-rw-header"><div class="pxr-rw-title"><i class="fas fa-gift"></i> Pub Récompensée</div><button class="pxr-rw-close" id="pxr-rw-close-btn"><i class="fas fa-times"></i></button></div><div class="pxr-rw-body" id="pxr-rw-body-content"><div class="pxr-rw-reward"><i class="fas fa-bolt"></i> <span id="pxr-rw-points">1</span> points</div><div class="pxr-rw-info">Cliquez sur l\'offre, attendez la fin du timer, puis réclamez vos points.</div><iframe id="pxr-rw-iframe" class="pxr-rw-iframe" sandbox="allow-scripts allow-same-origin allow-popups"></iframe><div class="pxr-rw-timer" id="pxr-rw-timer-display">20s</div><button id="pxr-rw-claim-btn" class="pxr-rw-btn-claim" disabled><i class="fas fa-clock"></i> Patientez...</button><div class="pxr-rw-limit" id="pxr-rw-limit-info"></div><div class="pxr-rw-error" id="pxr-rw-error" style="display:none"></div></div></div>';
        document.body.appendChild(overlay);
        document.getElementById('pxr-rw-close-btn').addEventListener('click', window.pxrCloseRewarded);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) window.pxrCloseRewarded(); });
        document.getElementById('pxr-rw-claim-btn').addEventListener('click', window.pxrClaimRewardedAd);
    }

    var rwTimerInterval = null;
    var rwCurrentToken = null;
    var rwCurrentUserId = null;
    var rwDailyLimit = 5;
    var rwClicked = false;
    var rwOfferOpened = false;

    function showStatusMessage(type, title, message) {
        var bodyContent = document.getElementById('pxr-rw-body-content');
        if (!bodyContent) return;
        bodyContent.innerHTML = '<div class="pxr-rw-status-msg ' + type + '"><i class="fas fa-' + (type === 'limit' ? 'lock' : 'hourglass-half') + '"></i><h3>' + title + '</h3><p>' + message + '</p></div>';
        document.getElementById('pxr-rw-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';    }
    function restoreModalContent() {
        var bodyContent = document.getElementById('pxr-rw-body-content');
        if (!bodyContent) return;
        bodyContent.innerHTML = '<div class="pxr-rw-reward"><i class="fas fa-bolt"></i> <span id="pxr-rw-points">1</span> points</div><div class="pxr-rw-info">Cliquez sur l\'offre, attendez la fin du timer, puis réclamez vos points.</div><iframe id="pxr-rw-iframe" class="pxr-rw-iframe" sandbox="allow-scripts allow-same-origin allow-popups"></iframe><div class="pxr-rw-timer" id="pxr-rw-timer-display">20s</div><button id="pxr-rw-claim-btn" class="pxr-rw-btn-claim" disabled><i class="fas fa-clock"></i> Patientez...</button><div class="pxr-rw-limit" id="pxr-rw-limit-info"></div><div class="pxr-rw-error" id="pxr-rw-error" style="display:none"></div>';
        document.getElementById('pxr-rw-claim-btn').addEventListener('click', window.pxrClaimRewardedAd);
    }

    window.addEventListener('focus', function() {
        if (rwOfferOpened === true && rwClicked === false) {
            rwClicked = true;
            var btn = document.getElementById('pxr-rw-claim-btn');
            var timerDisplay = document.getElementById('pxr-rw-timer-display');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
                btn.style.background = 'linear-gradient(135deg,#10B981,#059669)';
            }
            if (timerDisplay && timerDisplay.classList.contains('done')) {
                btn.disabled = false;
            }
        }
    });

    window.addEventListener('message', function(e) {
        if (e.data && e.data === 'rw-click') {
            rwClicked = true;
            rwOfferOpened = true;
            var btn = document.getElementById('pxr-rw-claim-btn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
                btn.style.background = 'linear-gradient(135deg,#10B981,#059669)';
            }
        }
    });

    window.pxrOpenRewardedAd = async function() {
        try {
            var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            var userResult = await supabase.auth.getUser();
            if (!userResult.data.user) { pxrNotify('Connectez-vous pour gagner des points !', 'error'); return; }
            rwCurrentUserId = userResult.data.user.id;

            var res = await fetch('/api/rewarded-ad?action=get&user_id=' + rwCurrentUserId);
            var data = await res.json();

            if (!data.available) {
                if (data.reason === 'daily_limit_reached') {
                    rwDailyLimit = data.daily_limit || 5;
                    showStatusMessage('limit', 'Limite quotidienne atteinte', 'Vous avez déjà vu ' + data.views_today + '/' + rwDailyLimit + ' pubs récompensées aujourd\'hui.<br><br>Revenez demain pour gagner plus de points !');
                    return;                }
                if (data.reason === 'cooldown_active') {
                    showStatusMessage('cooldown', 'Patientez un moment', 'Vous devez attendre encore ' + data.wait_seconds + ' secondes avant de voir une nouvelle pub récompensée.');
                    return;
                }
                pxrNotify('Aucune pub disponible.', 'error');
                return;
            }

            restoreModalContent();
            rwCurrentToken = data.token;
            rwDailyLimit = data.daily_limit || 5;
            rwClicked = false;
            rwOfferOpened = false;

            document.getElementById('pxr-rw-points').textContent = data.points_reward;
            document.getElementById('pxr-rw-timer-val') && (document.getElementById('pxr-rw-timer-val').textContent = data.timer_seconds);
            document.getElementById('pxr-rw-limit-info').textContent = data.views_today + '/' + rwDailyLimit + ' vues aujourd\'hui';
            document.getElementById('pxr-rw-error').style.display = 'none';

            var iframe = document.getElementById('pxr-rw-iframe');
            if (data.ad_url) {
                iframe.src = data.ad_url;
            } else if (data.ad_html) {
                var htmlWithTracking = data.ad_html.replace(/<a\s/gi, '<a onclick="window.parent.postMessage(\'rw-click\',\'*\')" ');
                iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#1a1a24;display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:sans-serif}</style></head><body>' + htmlWithTracking + '</body></html>';
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

                    if (rwClicked === true) {                        claimBtn.disabled = false;
                        claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
                    } else {
                        claimBtn.innerHTML = '⚠️ Cliquez d\'abord sur l\'offre !';
                        claimBtn.style.background = 'rgba(239,68,68,0.5)';
                        setTimeout(function() {
                            if (rwClicked === true) {
                                claimBtn.disabled = false;
                                claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
                                claimBtn.style.background = 'linear-gradient(135deg,#10B981,#059669)';
                            }
                        }, 10000);
                    }
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
            if (claimBtn.disabled) {
                pxrNotify('⚠️ Vous devez cliquer sur l\'offre avant de réclamer.', 'error');
                return;
            }
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
                var limitEl = document.getElementById('pxr-rw-limit-info');
                if (limitEl) {
                    var parts = limitEl.textContent.split('/');
                    var currentViews = parseInt(parts[0]) || 0;
                    limitEl.textContent = (currentViews + 1) + '/' + rwDailyLimit + ' vues aujourd\'hui';
                }
                window.pxrCloseRewarded();                if (typeof updateUI === 'function') updateUI();
            } else {
                var errEl = document.getElementById('pxr-rw-error');
                if (data.error === 'timer_not_complete') {
                    errEl.textContent = 'Patientez encore ' + data.remaining_seconds + 's.';
                } else {
                    errEl.textContent = data.error || 'Erreur lors de la validation.';
                }
                errEl.style.display = 'block';
                claimBtn.disabled = false;
                claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
            }
        } catch (e) {
            document.getElementById('pxr-rw-error').textContent = 'Erreur réseau. Réessayez.';
            document.getElementById('pxr-rw-error').style.display = 'block';
            var claimBtn = document.getElementById('pxr-rw-claim-btn');
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Réclamer mes points';
            }
        }
    };

    window.pxrCloseRewarded = function() {
        document.getElementById('pxr-rw-overlay').classList.remove('active');
        document.body.style.overflow = '';
        if (rwTimerInterval) { clearInterval(rwTimerInterval); rwTimerInterval = null; }
        var iframe = document.getElementById('pxr-rw-iframe');
        if (iframe) { iframe.src = ''; iframe.srcdoc = ''; }
        rwCurrentToken = null;
        rwClicked = false;
        rwOfferOpened = false;
    };

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
        var adBox = document.createElement('div');        adBox.id = id;
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
            var btmSlot = createProtectedSlot('pxr-btm');

            // TOP : après hero (INCHANGÉ)
            var hero = main.querySelector('.hero');
            if (hero && hero.parentNode) hero.parentNode.insertBefore(topSlot.wrapper, hero.nextSibling);
            else main.insertBefore(topSlot.wrapper, main.firstChild);

            // ✅ MIDDLE : INSÉRER UNE PUB STATIQUE SI L'API ÉCHOUE
            var midSlot = { wrapper: document.createElement('div'), adBox: null };
            midSlot.wrapper.id = 'pxr-mid-wrapper';
            midSlot.wrapper.className = 'pxr-wrapper';
            midSlot.wrapper.innerHTML = `
                <div class="pxr-label">⭐ SPONSORISÉ ⭐</div>
                <div class="pxr-sponsor-static">
                    <img src="https://iapixora.com/assets/pub-1win.jpg" alt="1win">
                    <div class="pxr-sponsor-overlay">
                        <h3 style="font-size:1.2rem;margin:0 0 0.5rem 0">Découvrez 1win</h3>                        <p style="font-size:0.9rem;margin:0">Jusqu’à 500% de bonus sur votre premier dépôt</p>
                        <a href="https://1win.com" target="_blank" rel="nofollow sponsored" 
                           style="display:inline-block;margin-top:0.8rem;background:#F59E0B;color:white;padding:0.6rem 1.2rem;border-radius:8px;text-decoration:none;font-weight:600;">
                           🎁 Explorer l'offre
                        </a>
                    </div>
                </div>
                <div class="pxr-btn-box">
                    <button class="pxr-rw-btn" onclick="window.pxrOpenRewardedAd()">🎁 Gagner des points</button>
                </div>
            `;

            // Trouve "Créations de référence"
            var refCreations = main.querySelector('#ref-creations') || 
                               main.querySelector('.reference-creations') ||
                               main.querySelector('.creations-reference') ||
                               Array.from(main.querySelectorAll('h2, h3, .section-title')).find(el => 
                                   el.textContent.toLowerCase().includes('référence') || 
                                   el.textContent.toLowerCase().includes('reference')
                               );

            if (refCreations && main.contains(refCreations)) {
                main.insertBefore(midSlot.wrapper, refCreations);
            } else {
                var generator = main.querySelector('.generator');
                if (generator && generator.parentNode) {
                    generator.parentNode.insertBefore(midSlot.wrapper, generator.nextSibling);
                } else {
                    main.appendChild(midSlot.wrapper);
                }
            }

            // BOTTOM : avant footer (INCHANGÉ)
            var footer = main.querySelector('.site-footer');
            if (footer && footer.parentNode) footer.parentNode.insertBefore(btmSlot.wrapper, footer);
            else main.appendChild(btmSlot.wrapper);

            // Chargement API (pour top/bottom seulement)
            var res = await fetch('/api/serve-ad?page=' + page + '&position=top');
            var data = await res.json();
            if (data.html && data.html.trim().length > 0) {
                injectHtmlWithScripts(topSlot.adBox, data.html);
            } else {
                topSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';
            }

            var res3 = await fetch('/api/serve-ad?page=' + page + '&position=bottom');
            var data3 = await res3.json();
            if (data3.html && data3.html.trim().length > 0) {
                injectHtmlWithScripts(btmSlot.adBox, data3.html);            } else {
                btmSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';
            }

            console.log('[ADS] v36.3 DONE');
        } catch (e) {
            console.error('[ADS] Init error:', e);
            // En cas d'erreur, assure que la pub statique est là
            try {
                var main = document.querySelector('main') || document.body;
                if (!main.querySelector('#pxr-mid-wrapper')) {
                    var fallback = document.createElement('div');
                    fallback.id = 'pxr-mid-wrapper';
                    fallback.className = 'pxr-wrapper';
                    fallback.innerHTML = `
                        <div class="pxr-label">⭐ SPONSORISÉ ⭐</div>
                        <div class="pxr-sponsor-static">
                            <img src="https://iapixora.com/assets/pub-1win.jpg" alt="1win">
                            <div class="pxr-sponsor-overlay">
                                <h3 style="font-size:1.2rem;margin:0 0 0.5rem 0">Découvrez 1win</h3>
                                <p style="font-size:0.9rem;margin:0">Jusqu’à 500% de bonus sur votre premier dépôt</p>
                                <a href="https://1win.com" target="_blank" rel="nofollow sponsored" 
                                   style="display:inline-block;margin-top:0.8rem;background:#F59E0B;color:white;padding:0.6rem 1.2rem;border-radius:8px;text-decoration:none;font-weight:600;">
                                   🎁 Explorer l'offre
                                </a>
                            </div>
                        </div>
                        <div class="pxr-btn-box">
                            <button class="pxr-rw-btn" onclick="window.pxrOpenRewardedAd()">🎁 Gagner des points</button>
                        </div>
                    `;
                    var refCreations = main.querySelector('#ref-creations') || 
                                      main.querySelector('.reference-creations') ||
                                      Array.from(main.querySelectorAll('h2, h3')).find(el => 
                                          el.textContent.toLowerCase().includes('référence'));
                    if (refCreations) {
                        main.insertBefore(fallback, refCreations);
                    } else {
                        main.appendChild(fallback);
                    }
                }
            } catch (e2) { console.error('Fallback error:', e2); }
        }
    }

    async function init() {
        createRewardedModal();
        await loadAndInjectAds();
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 300);
    else document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 300); });
})();
