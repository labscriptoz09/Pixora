// ads-loader.js v6 — FORCE LOAD (100% visible même avec adblock)
(function() {
    'use strict';

    // ⚠️ FORCER LE CHARGEMENT — Ignorer tous les blocages
    var forceLoad = true;

    // ✅ ÉTAPE 1: Créer un slot manuel, sans dépendance à DOM initial
    function createForcedSlot(id) {
        var el = document.getElementById(id);
        if (el) return el;
        el = document.createElement('div');
        el.id = id;
        el.className = 'pxr-force-slot';
        el.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:80px;';
        document.body.appendChild(el);
        return el;
    }

    // ✅ ÉTAPE 2: Injecter un lien HTML direct (jamais bloqué)
    function injectForcedAd(container, ad) {
        try {
            var linkUrl = ad.link || ad.code || '#';
            if (!linkUrl.startsWith('http')) linkUrl = 'https://pixora-gold-eight.vercel.app/earn.html';

            var card = document.createElement('div');
            card.style.cssText = 'background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:16px;padding:1rem;text-align:center;backdrop-filter:blur(20px);cursor:pointer;transition:all 0.3s;';
            card.onmouseenter = function() { card.style.borderColor = 'rgba(139,92,246,0.4)'; card.style.transform = 'translateY(-2px)'; };
            card.onmouseleave = function() { card.style.borderColor = 'rgba(63,63,70,0.5)'; card.style.transform = ''; };

            var label = document.createElement('div');
            label.style.cssText = 'font-size:0.6rem;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;font-weight:600;';
            label.textContent = 'Sponsorisé';

            var img = document.createElement('div');
            img.style.cssText = 'width:100%;height:120px;background:linear-gradient(135deg,#8B5CF6,#EC4899);border-radius:12px;margin-bottom:0.8rem;display:flex;align-items:center;justify-content:center;';
            img.innerHTML = '<i class="fas fa-star" style="color:white;font-size:2rem;"></i>';

            var title = document.createElement('div');
            title.style.cssText = 'font-size:0.9rem;font-weight:600;color:#FAFAFA;margin-bottom:0.5rem;';
            title.textContent = ad.name || 'Offre Partenaire';

            var btn = document.createElement('a');
            btn.href = linkUrl;
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.style.cssText = 'display:inline-block;padding:0.6rem 1.2rem;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:white;border-radius:10px;font-weight:600;font-size:0.8rem;text-decoration:none;transition:all 0.2s;';
            btn.innerHTML = 'Découvrir →';
            btn.onmouseenter = function() { btn.style.transform = 'translateY(-1px)'; btn.style.boxShadow = '0 4px 15px rgba(139,92,246,0.4)'; };
            btn.onmouseleave = function() { btn.style.transform = ''; btn.style.boxShadow = ''; };
            card.appendChild(label);
            card.appendChild(img);
            card.appendChild(title);
            card.appendChild(btn);
            container.appendChild(card);
        } catch (e) { console.warn('[FORCE] Ad error:', e); }
    }

    // ✅ ÉTAPE 3: Charger les pubs PAR TOUTES LES VOIES POSSIBLES
    async function loadAdsForce() {
        var ads = [];

        // 1. Essayer le proxy
        try {
            var res = await fetch('/api/config');
            if (res.ok) {
                var cfg = await res.json();
                ads = cfg.ad_networks || [];
            }
        } catch (e) {}

        // 2. Essayer Supabase direct
        if (ads.length === 0 && typeof window.supabase !== 'undefined') {
            try {
                var db = window.supabase.createClient('https://cfwzilhetkclpytjsopu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU');
                var r = await db.from('admin_config').select('value').eq('key', 'ad_networks').single();
                if (r.data && r.data.value) ads = r.data.value;
            } catch (e) {}
        }

        // 3. Fallback : pubs statiques (si rien ne marche)
        if (ads.length === 0) {
            ads = [
                { page: 'index', position: 'top', name: 'Gagnez des points', link: 'https://pixora-gold-eight.vercel.app/earn.html', active: true },
                { page: 'earn', position: 'middle', name: 'Offre Partenaire', link: 'https://pixora-gold-eight.vercel.app/shop.html', active: true },
                { page: 'galerie', position: 'bottom', name: 'Créez plus', link: 'https://pixora-gold-eight.vercel.app', active: true }
            ];
        }

        return ads.filter(a => a.active);
    }

    // ✅ ÉTAPE 4: Forcer l'insertion immédiate
    function forceInsert() {
        var page = (window.location.pathname || '').toLowerCase();
        var targetPage = 'index';
        if (page.includes('earn')) targetPage = 'earn';
        else if (page.includes('galer')) targetPage = 'galerie';
        else if (page.includes('profile')) targetPage = 'profile';        else if (page.includes('shop')) targetPage = 'shop';

        loadAdsForce().then(function(pageAds) {
            if (pageAds.length === 0) return;

            var slots = {};
            slots.top = createForcedSlot('pxr-force-top');
            slots.middle = createForcedSlot('pxr-force-mid');
            slots.bottom = createForcedSlot('pxr-force-btm');

            pageAds.forEach(function(ad) {
                if (ad.page !== targetPage) return;
                var pos = ad.position || 'top';
                var slot = slots[pos];
                if (slot) injectForcedAd(slot, ad);
            });
        }).catch(function() {
            // Toujours afficher au moins 1 pub
            var slot = createForcedSlot('pxr-force-top');
            injectForcedAd(slot, {
                name: 'Pixora est gratuit',
                link: 'https://pixora-gold-eight.vercel.app/earn.html'
            });
        });
    }

    // ✅ ÉTAPE 5: Exécuter IMMÉDIATEMENT, sans attendre DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceInsert);
    } else {
        forceInsert();
    }

    // 🔁 Re-tenter toutes les 10 secondes (au cas où)
    setInterval(forceInsert, 10000);

})();
