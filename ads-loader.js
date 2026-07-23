// ads-loader.js v30 — FIX Taille + Réutilisation
(function() {
    'use strict';

    console.log('[ADS] v30 START');

    // CSS avec limites de taille
    var style = document.createElement('style');
    style.textContent = '.pxr-slot{width:100%;margin:1rem 0;border:2px dashed #8B5CF6;padding:0.8rem;background:rgba(139,92,246,0.1);border-radius:12px;text-align:center;max-height:300px;overflow:hidden}.pxr-slot img{max-width:100%;max-height:200px;object-fit:contain}.pxr-label{font-size:0.7rem;color:#8B5CF6;margin-bottom:0.5rem;font-weight:700}.pxr-rw-btn{background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;border:none;padding:0.7rem 1.5rem;border-radius:10px;font-weight:600;cursor:pointer;margin:0.5rem 0}';
    document.head.appendChild(style);

    function getPage() {
        var p = window.location.pathname.toLowerCase();
        if (p.indexOf('earn') !== -1) return 'earn';
        if (p.indexOf('galer') !== -1 || p.indexOf('gallery') !== -1) return 'galerie';
        return 'index';
    }

    async function loadAndInjectAds() {
        console.log('[ADS] Loading ads for page:', getPage());

        try {
            var page = getPage();
            var main = document.querySelector('.main-content') || document.querySelector('main') || document.body;

            // Créer les slots
            var slotTop = document.createElement('div');
            slotTop.id = 'pxr-top';
            slotTop.className = 'pxr-slot';
            slotTop.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div><div>Chargement...</div>';

            var slotMid = document.createElement('div');
            slotMid.id = 'pxr-mid';
            slotMid.className = 'pxr-slot';
            slotMid.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div><div>Chargement...</div>';

            var slotBtm = document.createElement('div');
            slotBtm.id = 'pxr-btm';
            slotBtm.className = 'pxr-slot';
            slotBtm.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div><div>Chargement...</div>';

            // Insérer les slots
            var hero = main.querySelector('.hero');
            if (hero && hero.parentNode) {
                hero.parentNode.insertBefore(slotTop, hero.nextSibling);
            } else {
                main.insertBefore(slotTop, main.firstChild);
            }

            var generator = main.querySelector('.generator');            if (generator && generator.parentNode) {
                generator.parentNode.insertBefore(slotMid, generator.nextSibling);
            } else {
                main.appendChild(slotMid);
            }

            var footer = main.querySelector('.site-footer');
            if (footer && footer.parentNode) {
                footer.parentNode.insertBefore(slotBtm, footer);
            } else {
                main.appendChild(slotBtm);
            }

            console.log('[ADS] Slots created');

            // Charger les pubs
            var res = await fetch('/api/serve-ad?page=' + page + '&position=top');
            var data = await res.json();
            console.log('[ADS] TOP response:', data);

            var htmlTop = '';
            if (data.html && data.html.trim().length > 0) {
                htmlTop = data.html;
                slotTop.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div>' + data.html;
                console.log('[ADS] TOP injected');
            } else {
                slotTop.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div><div style="color:#EF4444">Aucune pub</div>';
            }

            // MIDDLE : essayer, sinon réutiliser TOP
            var res2 = await fetch('/api/serve-ad?page=' + page + '&position=middle');
            var data2 = await res2.json();
            if (data2.html && data2.html.trim().length > 0) {
                slotMid.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div>' + data2.html;
                console.log('[ADS] MIDDLE injected');
            } else if (htmlTop) {
                slotMid.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div>' + htmlTop;
                console.log('[ADS] MIDDLE reused TOP');
            } else {
                slotMid.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div><div style="color:#EF4444">Aucune pub</div>';
            }

            // BOTTOM : essayer, sinon réutiliser TOP
            var res3 = await fetch('/api/serve-ad?page=' + page + '&position=bottom');
            var data3 = await res3.json();
            if (data3.html && data3.html.trim().length > 0) {
                slotBtm.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div>' + data3.html;
                console.log('[ADS] BOTTOM injected');
            } else if (htmlTop) {
                slotBtm.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div>' + htmlTop;                console.log('[ADS] BOTTOM reused TOP');
            } else {
                slotBtm.innerHTML = '<div class="pxr-label">⭐ SPONSORISÉ ⭐</div><div style="color:#EF4444">Aucune pub</div>';
            }

            // Injecter les scripts
            var allSlots = [slotTop, slotMid, slotBtm];
            allSlots.forEach(function(slot) {
                var scripts = slot.querySelectorAll('script');
                scripts.forEach(function(oldScript) {
                    var newScript = document.createElement('script');
                    for (var i = 0; i < oldScript.attributes.length; i++) {
                        newScript.setAttribute(oldScript.attributes[i].name, oldScript.attributes[i].value);
                    }
                    if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
                    document.body.appendChild(newScript);
                });
            });

            console.log('[ADS] DONE');

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
