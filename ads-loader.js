// ads-loader.js v32 — Bouton dans conteneur séparé (protégé des scripts pub)
(function() {
    'use strict';

    console.log('[ADS] v32 START');

    // CSS
    var style = document.createElement('style');
    style.textContent = '.pxr-wrapper{width:100%;margin:1rem 0;border:2px dashed #8B5CF6;padding:0.8rem;background:rgba(139,92,246,0.1);border-radius:12px;text-align:center;max-height:400px;overflow:hidden}.pxr-ad-box{max-height:280px;overflow:hidden;margin-bottom:0.5rem}.pxr-ad-box img{max-width:100%;max-height:250px;object-fit:contain}.pxr-label{font-size:0.7rem;color:#8B5CF6;margin-bottom:0.5rem;font-weight:700}.pxr-btn-box{margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid rgba(139,92,246,0.2)}.pxr-rw-btn{background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.85rem;display:inline-flex;align-items:center;gap:0.4rem}.pxr-rw-btn:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(245,158,11,0.4)}';
    document.head.appendChild(style);

    function getPage() {
        var p = window.location.pathname.toLowerCase();
        if (p.indexOf('earn') !== -1) return 'earn';
        if (p.indexOf('galer') !== -1 || p.indexOf('gallery') !== -1) return 'galerie';
        return 'index';
    }

    function createProtectedSlot(id) {
        // Wrapper principal
        var wrapper = document.createElement('div');
        wrapper.id = id + '-wrapper';
        wrapper.className = 'pxr-wrapper';

        // Label
        var label = document.createElement('div');
        label.className = 'pxr-label';
        label.textContent = '⭐ SPONSORISÉ ⭐';
        wrapper.appendChild(label);

        // Boîte pub (isolée)
        var adBox = document.createElement('div');
        adBox.id = id;
        adBox.className = 'pxr-ad-box';
        adBox.innerHTML = '<div style="color:#A1A1AA;padding:1rem">Chargement...</div>';
        wrapper.appendChild(adBox);

        // Boîte bouton (SÉPARÉE, protégée)
        var btnBox = document.createElement('div');
        btnBox.className = 'pxr-btn-box';
        var btn = document.createElement('button');
        btn.className = 'pxr-rw-btn';
        btn.innerHTML = '🎁 Gagner des points';
        btn.onclick = function() { alert('Modale rewarded - à connecter'); };
        btnBox.appendChild(btn);
        wrapper.appendChild(btnBox);

        return { wrapper: wrapper, adBox: adBox };
    }
    async function loadAndInjectAds() {
        console.log('[ADS] Loading ads for page:', getPage());

        try {
            var page = getPage();
            var main = document.querySelector('.main-content') || document.querySelector('main') || document.body;

            // Créer les 3 slots protégés
            var topSlot = createProtectedSlot('pxr-top');
            var midSlot = createProtectedSlot('pxr-mid');
            var btmSlot = createProtectedSlot('pxr-btm');

            // Insérer dans la page
            var hero = main.querySelector('.hero');
            if (hero && hero.parentNode) {
                hero.parentNode.insertBefore(topSlot.wrapper, hero.nextSibling);
            } else {
                main.insertBefore(topSlot.wrapper, main.firstChild);
            }

            var generator = main.querySelector('.generator');
            if (generator && generator.parentNode) {
                generator.parentNode.insertBefore(midSlot.wrapper, generator.nextSibling);
            } else {
                main.appendChild(midSlot.wrapper);
            }

            var footer = main.querySelector('.site-footer');
            if (footer && footer.parentNode) {
                footer.parentNode.insertBefore(btmSlot.wrapper, footer);
            } else {
                main.appendChild(btmSlot.wrapper);
            }

            console.log('[ADS] Slots created');

            // Charger les pubs
            var res = await fetch('/api/serve-ad?page=' + page + '&position=top');
            var data = await res.json();
            console.log('[ADS] TOP:', data);

            var htmlTop = '';
            if (data.html && data.html.trim().length > 0) {
                htmlTop = data.html;
                topSlot.adBox.innerHTML = data.html;
            } else {
                topSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';
            }

            // MIDDLE            var res2 = await fetch('/api/serve-ad?page=' + page + '&position=middle');
            var data2 = await res2.json();
            if (data2.html && data2.html.trim().length > 0) {
                midSlot.adBox.innerHTML = data2.html;
            } else if (htmlTop) {
                midSlot.adBox.innerHTML = htmlTop;
            } else {
                midSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';
            }

            // BOTTOM
            var res3 = await fetch('/api/serve-ad?page=' + page + '&position=bottom');
            var data3 = await res3.json();
            if (data3.html && data3.html.trim().length > 0) {
                btmSlot.adBox.innerHTML = data3.html;
            } else if (htmlTop) {
                btmSlot.adBox.innerHTML = htmlTop;
            } else {
                btmSlot.adBox.innerHTML = '<div style="color:#EF4444">Aucune pub</div>';
            }

            // Injecter les scripts APRÈS (dans document.body pour éviter qu'ils cassent le DOM)
            [topSlot.adBox, midSlot.adBox, btmSlot.adBox].forEach(function(adBox) {
                var scripts = adBox.querySelectorAll('script');
                scripts.forEach(function(oldScript) {
                    var newScript = document.createElement('script');
                    for (var i = 0; i < oldScript.attributes.length; i++) {
                        newScript.setAttribute(oldScript.attributes[i].name, oldScript.attributes[i].value);
                    }
                    if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
                    document.body.appendChild(newScript);
                });
            });

            console.log('[ADS] DONE - 3 slots avec boutons protégés');

        } catch (e) {
            console.error('[ADS] Error:', e);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        loadAndInjectAds();
    } else {
        document.addEventListener('DOMContentLoaded', loadAndInjectAds);
    }
})();
