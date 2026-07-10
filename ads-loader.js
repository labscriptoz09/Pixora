// ads-loader.js v2 - INFAILLIBLE
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

    // Détecter la page actuelle
    function getPage() {
        var path = window.location.pathname.toLowerCase();
        if (path.indexOf('profile') !== -1) return 'profile';
        if (path.indexOf('shop') !== -1) return 'shop';
        if (path.indexOf('galer') !== -1 || path.indexOf('gallery') !== -1) return 'galerie';
        if (path.indexOf('earn') !== -1) return 'earn';
        return 'index';
    }

    // Créer un conteneur de pub stylisé
    function createAdSlot(id) {
        var slot = document.createElement('div');
        slot.id = id;
        slot.className = 'pixora-ad-slot';
        slot.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:1px;overflow:hidden;';
        return slot;
    }

    // Placer les conteneurs aux bons endroits selon la page
    function placeSlots(page) {
        var slots = {};

        try {
            if (page === 'index') {
                var main = document.querySelector('.main-content');
                if (main) {
                    // TOP : après le hero
                    var hero = main.querySelector('.hero');
                    if (hero) {
                        slots.top = createAdSlot('ad-' + page + '-top');
                        hero.after(slots.top);
                    }
                    // MIDDLE : après le générateur
                    var gen = main.querySelector('.generator');
                    if (gen) {
                        slots.middle = createAdSlot('ad-' + page + '-middle');
                        gen.after(slots.middle);
                    }
                    // BOTTOM : avant le footer
                    var footer = main.querySelector('.site-footer');
                    if (footer) {
                        slots.bottom = createAdSlot('ad-' + page + '-bottom');                        footer.before(slots.bottom);
                    }
                }
            } else if (page === 'profile') {
                var main2 = document.querySelector('main') || document.querySelector('.main-content') || document.body;
                var header = document.querySelector('header') || document.querySelector('.site-header');
                var footer2 = document.querySelector('footer') || document.querySelector('.site-footer');

                slots.top = createAdSlot('ad-' + page + '-top');
                if (header) header.after(slots.top);
                else main2.prepend(slots.top);

                slots.bottom = createAdSlot('ad-' + page + '-bottom');
                if (footer2) footer2.before(slots.bottom);
                else main2.append(slots.bottom);
            } else if (page === 'shop') {
                var main3 = document.querySelector('main') || document.querySelector('.main-content') || document.body;
                var header2 = document.querySelector('header') || document.querySelector('.site-header');
                var footer3 = document.querySelector('footer') || document.querySelector('.site-footer');

                slots.top = createAdSlot('ad-' + page + '-top');
                if (header2) header2.after(slots.top);
                else main3.prepend(slots.top);

                slots.bottom = createAdSlot('ad-' + page + '-bottom');
                if (footer3) footer3.before(slots.bottom);
                else main3.append(slots.bottom);
            } else if (page === 'galerie') {
                var main4 = document.querySelector('main') || document.querySelector('.main-content') || document.body;
                var header3 = document.querySelector('header') || document.querySelector('.site-header');
                var footer4 = document.querySelector('footer') || document.querySelector('.site-footer');

                slots.top = createAdSlot('ad-' + page + '-top');
                if (header3) header3.after(slots.top);
                else main4.prepend(slots.top);

                slots.bottom = createAdSlot('ad-' + page + '-bottom');
                if (footer4) footer4.before(slots.bottom);
                else main4.append(slots.bottom);
            }
        } catch (e) {
            console.log('Ad slots placement error:', e);
        }

        return slots;
    }

    // Injecter le code Adsterra dans un conteneur via iframe srcdoc
    function injectAd(container, code) {
        try {            if (!code || code.trim().length === 0) return;

            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:60px;}</style></head><body>' + code + '</body></html>';

            iframe.srcdoc = html;

            // Ajuster la hauteur automatiquement
            iframe.onload = function() {
                try {
                    var h = iframe.contentDocument.body.scrollHeight;
                    if (h > 10 && h < 1000) {
                        iframe.style.height = h + 'px';
                    } else {
                        iframe.style.height = '270px';
                    }
                } catch (e) {
                    iframe.style.height = '270px';
                }
            };

            container.appendChild(iframe);
        } catch (e) {
            console.log('Ad injection error:', e);
        }
    }

    // Fonction principale
    async function init() {
        try {
            var page = getPage();

            // Attendre que Supabase soit disponible
            if (typeof window.supabase === 'undefined') return;

            var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            var result = await client
                .from('admin_config')
                .select('value')
                .eq('key', 'ad_networks')
                .single();

            if (!result.data || !result.data.value) return;

            var allAds = result.data.value;            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active && ad.code && ad.code.trim().length > 0;
            });

            if (pageAds.length === 0) return;

            // Placer les conteneurs
            var slots = placeSlots(page);

            // Injecter les pubs dans les conteneurs correspondants
            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                var slot = slots[pos];
                if (slot) {
                    injectAd(slot, ad.code);
                }
            });

        } catch (e) {
            // SILENCIEUX - ne jamais casser le site
            console.log('Ads loader: silent fail', e);
        }
    }

    // Lancer quand tout est chargé
    if (document.readyState === 'complete') {
        setTimeout(init, 1000);
    } else {
        window.addEventListener('load', function() {
            setTimeout(init, 1000);
        });
    }
})();
