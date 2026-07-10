// ads-loader.js - Charge les publicités depuis Supabase
(function() {
    const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

    // Détecter la page actuelle
    const currentPage = detectCurrentPage();
    
    async function detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('index') || path === '/') return 'index';
        if (path.includes('profile')) return 'profile';
        if (path.includes('shop')) return 'shop';
        if (path.includes('galerie') || path.includes('gallery')) return 'galerie';
        if (path.includes('earn')) return 'earn';
        return 'index';
    }

    async function loadAds() {
        try {
            // Charger Supabase
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { data: configData } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'ad_networks')
                .single();

            const ads = configData?.value || [];
            
            // Filtrer les pubs pour la page actuelle et actives
            const pageAds = ads.filter(ad => ad.page === currentPage && ad.active);
            
            // Grouper par position
            const adsByPosition = {
                top: pageAds.filter(ad => ad.position === 'top'),
                middle: pageAds.filter(ad => ad.position === 'middle'),
                bottom: pageAds.filter(ad => ad.position === 'bottom'),
                sidebar: pageAds.filter(ad => ad.position === 'sidebar')
            };

            // Injecter chaque pub dans son conteneur
            for (const [position, positionAds] of Object.entries(adsByPosition)) {
                const containerId = `ad-${currentPage}-${position}`;
                const container = document.getElementById(containerId);
                
                if (container && positionAds.length > 0) {
                    positionAds.forEach(ad => {
                        injectAd(container, ad);                    });
                }
            }

        } catch (error) {
            console.error('Ads loader error:', error);
            // Silencieux - ne pas bloquer la page si les pubs ne chargent pas
        }
    }

    function injectAd(container, ad) {
        // Créer une iframe pour isoler la pub
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.margin = '1rem 0';
        iframe.style.display = 'block';
        
        // Hauteur selon le type
        if (ad.type === 'banner') {
            iframe.style.height = '270px';
        } else if (ad.type === 'banner_728') {
            iframe.style.height = '110px';
        } else if (ad.type === 'native') {
            iframe.style.height = 'auto';
            iframe.style.minHeight = '200px';
        } else if (ad.type === 'social_bar') {
            // Social Bar n'a pas besoin d'iframe, on l'injecte directement
            injectSocialBar(ad.code);
            return;
        }

        // Utiliser srcdoc pour charger le code Adsterra
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: transparent;
                        font-family: Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                ${ad.code}            </body>
            </html>
        `;

        container.appendChild(iframe);
    }

    function injectSocialBar(code) {
        // Social Bar s'injecte directement dans le body
        const script = document.createElement('div');
        script.innerHTML = code;
        document.body.appendChild(script);
    }

    // Charger quand la page est prête
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAds);
    } else {
        loadAds();
    }
})();
