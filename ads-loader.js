// ads-loader.js v3 - CORRECTIF GALERIE + PROFILE + SHOP
(function() {
    'use strict';

    var SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

    function getPage() {
        var path = window.location.pathname.toLowerCase();
        if (path.indexOf('profile') !== -1) return 'profile';
        if (path.indexOf('shop') !== -1) return 'shop';
        if (path.indexOf('galer') !== -1 || path.indexOf('gallery') !== -1) return 'galerie';
        if (path.indexOf('earn') !== -1) return 'earn';
        return 'index';
    }

    function createAdSlot(id) {
        var slot = document.createElement('div');
        slot.id = id;
        slot.className = 'pixora-ad-slot';
        slot.style.cssText = 'width:100%;text-align:center;margin:1.5rem 0;min-height:1px;overflow:hidden;';
        return slot;
    }

    function placeSlots(page) {
        var slots = {};

        try {
            // === INDEX ===
            if (page === 'index') {
                var main = document.querySelector('.main-content');
                if (main) {
                    var hero = main.querySelector('.hero');
                    if (hero) {
                        slots.top = createAdSlot('ad-index-top');
                        hero.after(slots.top);
                    }
                    var gen = main.querySelector('.generator');
                    if (gen) {
                        slots.middle = createAdSlot('ad-index-middle');
                        gen.after(slots.middle);
                    }
                    var footer = main.querySelector('.site-footer');
                    if (footer) {
                        slots.bottom = createAdSlot('ad-index-bottom');
                        footer.before(slots.bottom);
                    }
                }
            }
            // === GALERIE ===
            else if (page === 'galerie') {
                var main = document.querySelector('.main-content') || document.querySelector('main');
                if (main) {
                    // TOP : après le sous-titre (.page-sub)
                    var pageSub = main.querySelector('.page-sub');
                    if (pageSub) {
                        slots.top = createAdSlot('ad-galerie-top');
                        pageSub.after(slots.top);
                    }

                    // MIDDLE : après la grille d'images (.results-grid)
                    var grid = main.querySelector('.results-grid');
                    if (grid) {
                        slots.middle = createAdSlot('ad-galerie-middle');
                        grid.after(slots.middle);
                    }

                    // BOTTOM : avant le footer
                    var footer = main.querySelector('.site-footer');
                    if (footer) {
                        slots.bottom = createAdSlot('ad-galerie-bottom');
                        footer.before(slots.bottom);
                    }
                }
            }

            // === PROFILE ===
            else if (page === 'profile') {
                var main = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var header = document.querySelector('.site-header') || document.querySelector('header');
                var footer = document.querySelector('.site-footer') || document.querySelector('footer');

                slots.top = createAdSlot('ad-profile-top');
                if (header && header.nextSibling) {
                    header.parentNode.insertBefore(slots.top, header.nextSibling);
                } else {
                    main.prepend(slots.top);
                }

                slots.bottom = createAdSlot('ad-profile-bottom');
                if (footer) {
                    footer.before(slots.bottom);
                } else {
                    main.append(slots.bottom);
                }
            }

            // === SHOP ===
            else if (page === 'shop') {                var main = document.querySelector('.main-content') || document.querySelector('main') || document.body;
                var header = document.querySelector('.site-header') || document.querySelector('header');
                var footer = document.querySelector('.site-footer') || document.querySelector('footer');

                slots.top = createAdSlot('ad-shop-top');
                if (header && header.nextSibling) {
                    header.parentNode.insertBefore(slots.top, header.nextSibling);
                } else {
                    main.prepend(slots.top);
                }

                slots.bottom = createAdSlot('ad-shop-bottom');
                if (footer) {
                    footer.before(slots.bottom);
                } else {
                    main.append(slots.bottom);
                }
            }

        } catch (e) {
            console.log('Ad slots placement error:', e);
        }

        return slots;
    }

    function injectAd(container, code) {
        try {
            if (!code || code.trim().length === 0) return;

            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;border:none;display:block;margin:0 auto;';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:60px;}</style></head><body>' + code + '</body></html>';

            iframe.srcdoc = html;

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
                }            };

            container.appendChild(iframe);
        } catch (e) {
            console.log('Ad injection error:', e);
        }
    }

    async function init() {
        try {
            var page = getPage();

            if (typeof window.supabase === 'undefined') return;

            var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            var result = await client
                .from('admin_config')
                .select('value')
                .eq('key', 'ad_networks')
                .single();

            if (!result.data || !result.data.value) return;

            var allAds = result.data.value;
            var pageAds = allAds.filter(function(ad) {
                return ad.page === page && ad.active && ad.code && ad.code.trim().length > 0;
            });

            if (pageAds.length === 0) return;

            var slots = placeSlots(page);

            pageAds.forEach(function(ad) {
                var pos = ad.position || 'top';
                var slot = slots[pos];
                if (slot) {
                    injectAd(slot, ad.code);
                }
            });

        } catch (e) {
            console.log('Ads loader: silent fail', e);
        }
    }

    if (document.readyState === 'complete') {
        setTimeout(init, 1000);
    } else {
        window.addEventListener('load', function() {            setTimeout(init, 1000);
        });
    }
})();
