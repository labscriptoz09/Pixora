const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// === CONFIGURATION ===
const SYNC_URL = process.env.SYNC_URL || 'https://pixora-sync.slimansoufian1.workers.dev';
const SYNC_KEY = process.env.SYNC_KEY || 'pixora-sync-internal-2026';
const FORCED_AGENT = process.env.AGENT_ID || null; // Override manuel si besoin
const CACHE_FILE = path.join(__dirname, '.ip-cache.json');
const IDENTITIES_FILE = path.join(__dirname, 'identities.json');

// === SOURCES PAR LANGUE ===
const SOURCES = {
  fr: [
    'https://www.iapixora.com/blog/ia-gratuite-2026.html',
    'https://www.iapixora.com/guide/prompt-engineering.html',
    'https://www.iapixora.com/niche/tatouage.html',
    'https://www.iapixora.com/niche/anime.html',
    'https://dev.to/t/pixora',
    'https://medium.com/tag/pixora',
    'https://hashnode.com/n/pixora',
    'https://telegra.ph/pixora-guide'
  ],
  en: [
    'https://www.iapixora.com/blog/free-ai-image-generator-2026.html',
    'https://www.iapixora.com/guide/prompt-crafting.html',
    'https://www.iapixora.com/niche/logo.html',
    'https://www.iapixora.com/niche/avatar.html',
    'https://dev.to/t/iapixora',
    'https://medium.com/tag/iapixora',
    'https://hashnode.com/n/iapixora'
  ],
  es: [
    'https://www.iapixora.com/blog/generador-imagenes-ia.html',
    'https://www.iapixora.com/niche/fond-ecran.html',
    'https://www.iapixora.com/niche/coloriage.html'
  ]
};

const NICHES = ['tatouage','anime','logo','avatar','animaux','fond-ecran','coloriage',
  'cyberpunk','fantasy','portrait','paysage','abstract','minimalist','vintage',  'steampunk','pixel-art','watercolor','oil-painting','sketch','manga','comic',
  'realistic','surreal','gothic','kawaii','chibi','mecha','sci-fi','horror',
  'nature','space','ocean','mountain','forest','city','architecture','food',
  'fashion','sport','music','gaming','tech','education','health','travel'];

// === UTILITAIRES HUMAINS ===
function expRandom(min, max) {
  const u = Math.random();
  return Math.floor(min + (max - min) * (-Math.log(1 - u) / 3));
}

function addTypos(text, rate = 0.03) {
  if (Math.random() > rate) return text;
  const chars = text.split('');
  const idx = Math.floor(Math.random() * chars.length);
  const ops = ['del', 'swap', 'replace'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  if (op === 'del') chars.splice(idx, 1);
  else if (op === 'swap' && idx < chars.length - 1) [chars[idx], chars[idx+1]] = [chars[idx+1], chars[idx]];
  else chars[idx] = String.fromCharCode(chars[idx].charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
  return chars.join('');
}

async function humanScroll(page) {
  const steps = expRandom(3, 8);
  let current = 0;
  for (let i = 0; i < steps; i++) {
    const step = expRandom(50, 300);
    current += step;
    await page.evaluate(d => window.scrollBy(0, d), step);
    await page.waitForTimeout(expRandom(200, 2000));
    if (Math.random() < 0.15) {
      const back = expRandom(50, 150);
      current -= back;
      await page.evaluate(d => window.scrollBy(0, d), -back);
      await page.waitForTimeout(expRandom(500, 3000));
    }
  }
}

async function humanMove(page, x, y) {
  const startX = Math.random() * 400;
  const startY = Math.random() * 300;
  const steps = expRandom(15, 40);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cx = startX + (x - startX) * t + (Math.random() - 0.5) * 20 * Math.sin(t * Math.PI);
    const cy = startY + (y - startY) * t + (Math.random() - 0.5) * 15 * Math.sin(t * Math.PI);
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(expRandom(5, 30));  }
}

async function humanType(page, selector, text) {
  await page.click(selector);
  await page.waitForTimeout(expRandom(200, 600));
  for (const char of text) {
    await page.keyboard.type(char, { delay: expRandom(50, 200) });
  }
}

function extractKeyword(lang, memory = {}) {
  const avoid = memory.lastKeyword;
  const available = NICHES.filter(n => n !== avoid);
  return available[Math.floor(Math.random() * available.length)];
}

// === DÉTECTION IP INTELLIGENTE ===
async function detectIP() {
  // 1. Vérifier le cache
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const age = Date.now() - (cache.timestamp || 0);
      if (age < 3600000) { // Cache valide 1h
        console.log(`[IP-CACHE] ${cache.ip} (${cache.country}, ${cache.city})`);
        return cache;
      }
    } catch(e) {}
  }

  // 2. Détecter via ipapi.co (gratuit, pas de clé)
  const services = [
    'https://ipapi.co/json/',
    'https://ipinfo.io/json',
    'https://api.ip.sb/geoip'
  ];

  for (const url of services) {
    try {
      const data = await fetch(url, { signal: AbortSignal.timeout(5000) }).then(r => r.json());
      const result = {
        ip: data.ip || data.query || 'unknown',
        country: (data.country_code || data.country || 'US').toUpperCase(),
        city: data.city || 'Unknown',
        region: data.region || data.region_name || '',
        isp: data.org || data.isp || data.asn || 'Unknown',
        timezone: data.timezone || data.time_zone || 'UTC',
        timestamp: Date.now()
      };      
      // Sauvegarder dans le cache
      fs.writeFileSync(CACHE_FILE, JSON.stringify(result, null, 2));
      console.log(`[IP-DETECT] ${result.ip} → ${result.city}, ${result.country} (${result.isp})`);
      return result;
    } catch(e) {
      console.log(`[IP-DETECT] ${url} failed: ${e.message.slice(0,50)}`);
    }
  }

  // 3. Fallback si tous les services échouent
  console.log('[IP-DETECT] All services failed, using fallback');
  return { ip: 'unknown', country: 'US', city: 'Unknown', isp: 'Unknown', timezone: 'America/New_York', timestamp: Date.now() };
}

// === MATCHING AGENT INTELLIGENT ===
function matchAgent(ipInfo) {
  // 1. Si override manuel
  if (FORCED_AGENT) {
    console.log(`[AGENT] Forced: ${FORCED_AGENT}`);
    return { agentId: FORCED_AGENT, source: 'forced' };
  }

  // 2. Charger les identités connues
  let identities = {};
  try {
    identities = JSON.parse(fs.readFileSync(IDENTITIES_FILE, 'utf8'));
  } catch(e) {
    console.log('[AGENT] identities.json not found, generating dynamic profile');
  }

  // 3. Chercher un match par pays
  const country = ipInfo.country;
  const candidates = Object.entries(identities).filter(([k, v]) => 
    k !== 'orchestrator' && v.country === country
  );

  if (candidates.length > 0) {
    const [agentId, profile] = candidates[Math.floor(Math.random() * candidates.length)];
    console.log(`[AGENT-MATCH] ${agentId} (${profile.lang}, ${profile.device}) ← matched to ${country}`);
    return { agentId, profile, source: 'matched' };
  }

  // 4. Générer un profil dynamique basé sur l'IP
  const langMap = {
    FR: 'fr', DE: 'de', ES: 'es', IT: 'it', PT: 'pt', NL: 'nl', BE: 'fr',
    GB: 'en', US: 'en', CA: 'en', AU: 'en', IE: 'en', NZ: 'en', IN: 'en',
    JP: 'ja', KR: 'ko', CN: 'zh', BR: 'pt', MX: 'es', AR: 'es', CO: 'es'
  };
    const lang = langMap[country] || 'en';
  const devices = ['Windows 11', 'MacBook Pro', 'iPhone 15', 'Samsung Galaxy S24', 'Pixel 8', 'iPad Air'];
  const browsers = ['Chrome Desktop', 'Safari Desktop', 'Firefox Desktop', 'Chrome Mobile', 'Safari Mobile'];
  const isMobile = Math.random() < 0.4;
  const device = isMobile 
    ? devices.filter(d => d.includes('iPhone') || d.includes('Samsung') || d.includes('Pixel') || d.includes('iPad'))[Math.floor(Math.random() * 4)]
    : devices.filter(d => d.includes('Windows') || d.includes('MacBook'))[Math.floor(Math.random() * 2)];
  const browser = isMobile
    ? (device.includes('iPhone') || device.includes('iPad') ? 'Safari Mobile' : 'Chrome Mobile')
    : ['Chrome Desktop', 'Firefox Desktop', 'Edge Desktop'][Math.floor(Math.random() * 3)];

  const dynamicProfile = {
    lang,
    locale: lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US',
    tz: ipInfo.timezone || 'UTC',
    device,
    browser,
    isp: ipInfo.isp,
    country,
    city: ipInfo.city
  };

  console.log(`[AGENT-DYNAMIC] Generated: ${lang}-${country} | ${device} | ${browser} | ${ipInfo.city}`);
  return { agentId: `dynamic-${country.toLowerCase()}`, profile: dynamicProfile, source: 'dynamic' };
}

// === GÉNÉRATION USER-AGENT RÉALISTE ===
function generateUA(profile) {
  const chromeVer = `${Math.floor(Math.random()*20)+110}.0.${Math.floor(Math.random()*5000)}.0`;
  const safariVer = `${Math.floor(Math.random()*100)+537}.${Math.floor(Math.random()*50)+36}`;
  
  if (profile.browser.includes('Safari Mobile')) {
    const iosVer = `${Math.floor(Math.random()*5)+16}_${Math.floor(Math.random()*7)}`;
    return `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVer} like Mac OS X) AppleWebKit/${safariVer} (KHTML, like Gecko) Version/${Math.floor(Math.random()*5)+16}.0 Mobile/15E148 Safari/${safariVer}`;
  }
  if (profile.browser.includes('Chrome Mobile')) {
    const androidVer = `${Math.floor(Math.random()*5)+10}.0`;
    return `Mozilla/5.0 (Linux; Android ${androidVer}; ${profile.device}) AppleWebKit/${safariVer} (KHTML, like Gecko) Chrome/${chromeVer} Mobile Safari/${safariVer}`;
  }
  if (profile.browser.includes('Safari Desktop')) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_${Math.floor(Math.random()*5)+15}_${Math.floor(Math.random()*9)}) AppleWebKit/${safariVer} (KHTML, like Gecko) Version/${Math.floor(Math.random()*5)+16}.0 Safari/${safariVer}`;
  }
  if (profile.browser.includes('Firefox')) {
    const ffVer = Math.floor(Math.random()*30)+100;
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${ffVer}.0) Gecko/20100101 Firefox/${ffVer}.0`;
  }
  // Chrome Desktop (default)
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/${safariVer} (KHTML, like Gecko) Chrome/${chromeVer} Safari/${safariVer}`;
}
// === NAVIGATION SÉCURISÉE ===
async function safeGoto(page, url, timeout = 30000) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    const title = await page.title().catch(() => '');
    if (title.toLowerCase().includes('captcha') || title.toLowerCase().includes('access denied')) {
      console.log(`[ADAPT] Blocage détecté sur ${url}`);
      return false;
    }
    return true;
  } catch(e) {
    console.log(`[ADAPT] Erreur navigation ${url}: ${e.message.slice(0, 50)}`);
    return false;
  }
}

// === RAPPORT VERS PIXORA-SYNC ===
async function pushReport(agentId, sourcePlatform, keyword, agentLang) {
  try {
    const r = await fetch(`${SYNC_URL}/push?key=${SYNC_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, sourcePlatform, keyword, agentLang })
    });
    const data = await r.json();
    console.log(`[SYNC] Report: ${JSON.stringify(data)}`);
    return data;
  } catch(e) {
    console.log(`[SYNC] Erreur: ${e.message}`);
    return null;
  }
}

// === CYCLE PRINCIPAL INTELLIGENT ===
async function runCycle() {
  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] ═══ CYCLE DÉBUT ═══`);

  // 1. Détecter l'IP du runner
  const ipInfo = await detectIP();
  
  // 2. Matcher ou générer un agent adapté
  const { agentId, profile, source } = matchAgent(ipInfo);
  
  if (!profile) {
    console.log('[ERR] No profile available, aborting cycle');
    return;
  }

  // 3. Générer le User-Agent réaliste
  const ua = generateUA(profile);
  const isMobile = profile.device.includes('iPhone') || profile.device.includes('Samsung') || 
                   profile.device.includes('Pixel') || profile.device.includes('iPad');
  
  // 4. Viewport adaptatif avec jitter
  const vw = isMobile 
    ? { width: 390 + Math.floor(Math.random()*20-10), height: 844 + Math.floor(Math.random()*20-10) }
    : { width: 1920 + Math.floor(Math.random()*20-10), height: 1080 + Math.floor(Math.random()*20-10) };

  // 5. Accept-Language cohérent
  const acceptLang = profile.lang === 'fr' ? 'fr-FR,fr;q=0.9,en-US;q=0.8' 
    : profile.lang === 'es' ? 'es-ES,es;q=0.9,en-US;q=0.8'
    : profile.lang === 'de' ? 'de-DE,de;q=0.9,en-US;q=0.8'
    : 'en-US,en;q=0.9';

  console.log('[PROFILE] ' + agentId + ' | ' + profile.lang + '-' + profile.country + ' | ' + profile.device + ' | ' + ua.slice(0,60) + '...');

  let browser;
  let visitSuccess = false;
  let sourcePlatform = 'direct';
  let keyword = '';

  try {
    // 6. Lancer le navigateur avec anti-détection
    // Détection intelligente de l'environnement (Userland vs GitHub Runner)
    const os = require('os');
    const fs = require('fs');
    let launchOptions = {
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    };

    // Chemin Userland (mobile)
    const userlandChrome = path.join(os.homedir(), '.cache', 'ms-playwright', 'chromium-1234', 'chrome-linux', 'chrome');
    const userlandLibs = path.join(os.homedir(), 'chromium-libs', 'usr', 'lib', 'aarch64-linux-gnu');

    if (fs.existsSync(userlandChrome)) {
      // Environnement Userland
      launchOptions.executablePath = userlandChrome;
      if (!process.env.LD_LIBRARY_PATH || !process.env.LD_LIBRARY_PATH.includes(userlandLibs)) {
        process.env.LD_LIBRARY_PATH = userlandLibs + ':' + (process.env.LD_LIBRARY_PATH || '');
      }
      console.log('[ENV] Userland detected → ' + userlandChrome);
    } else {
      // Environnement GitHub Runner / CI → utiliser le Chromium Playwright par défaut
      console.log('[ENV] CI/GitHub detected → using default Playwright Chromium');
      // Pas de executablePath = Playwright utilise son propre binaire installé
    }

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      locale: profile.locale,
      timezoneId: profile.tz,
      userAgent: ua,
      viewport: vw,
      extraHTTPHeaders: { 'Accept-Language': acceptLang },
      geolocation: undefined, // Pas de géolocalisation forcée
      permissions: []
    });

    // Anti-fingerprint: override WebGL
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      window.chrome = { runtime: {} };
    });

    const page = await context.newPage();
    const memory = { lastKeyword: '' };

    // === BOUNCE IMMÉDIAT (8%) ===
    if (Math.random() < 0.08) {
      const bounceUrl = (SOURCES[profile.lang] || SOURCES.en)[0];
      if (await safeGoto(page, bounceUrl)) {
        await page.waitForTimeout(expRandom(1000, 4000));
        console.log('[BOUNCE] Visite courte naturelle');
      }
      await browser.close();
      console.log(`[${new Date().toISOString()}] ═══ CYCLE FIN (bounce, ${Date.now()-startTime}ms) ═══`);
      return;
    }

    // === RECHERCHE GOOGLE (50%) ===
    if (Math.random() < 0.5) {
      keyword = extractKeyword(profile.lang, memory);
      const query = addTypos(keyword);
      console.log(`[SEARCH] "${query}"`);

      var googleOk = await safeGoto(page, `https://www.google.com/search?q=${encodeURIComponent(query)}`);
      if (googleOk) {
        await humanScroll(page);
        await page.waitForTimeout(expRandom(2000, 5000));
        const links = await page.$$eval('a[href*="iapixora.com"]', els => els.map(e => e.href));
        if (links.length > 0) {
          const target = links[Math.floor(Math.random() * links.length)];
          await humanMove(page, Math.random() * 600 + 100, Math.random() * 400);
          await page.evaluate((href) => { var el = document.querySelector('a[href="'+href+'"]'); if(el) el.click(); }, target);
          await page.waitForTimeout(expRandom(1000, 3000));
          sourcePlatform = 'google';
          visitSuccess = true;
        } else {
          console.log('[SMART] Google OK mais aucun lien iapixora → fallback direct');
        }
      } else {
        console.log('[SMART] Google bloque → fallback direct automatique');
      }
    }

    // === SOURCE DIRECTE (fallback ou 50%) ===
    if (!visitSuccess) {
      const langSources = SOURCES[profile.lang] || SOURCES.en;
      const url = langSources[Math.floor(Math.random() * langSources.length)];      console.log(`[DIRECT] ${url}`);

      if (await safeGoto(page, url)) {
        await humanScroll(page);
        
        // Dwell adaptatif selon type de page
        var dwellBase = 15;
        if (url.includes('/blog/') || url.includes('/guide/')) dwellBase = 30;
        else if (url.includes('/faq/') || url.includes('/privacy/')) dwellBase = 10;
        else if (url.includes('/gallery') || url.includes('/shop')) dwellBase = 25;
        else if (url.includes('/niche/')) dwellBase = 20;
        else if (url.includes('dev.to') || url.includes('medium.com') || url.includes('hashnode')) dwellBase = 35;
        const dwell = Math.max(8000, (dwellBase + expRandom(-5, 15)) * 1000);
        await page.waitForTimeout(dwell);

        // Navigation interne 30%
        if (Math.random() < 0.30) {
          const internalLinks = await page.$$eval('a[href*="iapixora.com"]', els => els.map(e => e.href));
          if (internalLinks.length > 0) {
            const next = internalLinks[Math.floor(Math.random() * internalLinks.length)];
            await humanMove(page, Math.random() * 800, Math.random() * 600);
            await safeGoto(page, next);
            await page.waitForTimeout(expRandom(3, 30) * 1000);
          }
        }

        // Détecter la plateforme source
        if (url.includes('dev.to')) sourcePlatform = 'devto';
        else if (url.includes('medium.com')) sourcePlatform = 'medium';
        else if (url.includes('hashnode')) sourcePlatform = 'hashnode';
        else if (url.includes('telegra.ph')) sourcePlatform = 'telegraph';
        else if (url.includes('rentry')) sourcePlatform = 'rentry';
        else if (url.includes('pinterest')) sourcePlatform = 'pinterest';
        else sourcePlatform = 'site';

        visitSuccess = true;
      }
    }

    // === ENVOI RAPPORT ===
    if (!keyword) keyword = extractKeyword(profile.lang, memory);
    await pushReport(agentId, sourcePlatform, keyword, profile.lang);

  } catch(e) {
    console.log(`[ERR] ${e.message.slice(0, 100)}`);
  } finally {
    if (browser) await browser.close();
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ═══ CYCLE FIN (${duration}ms, success: ${visitSuccess}) ═══`);
  }}

runCycle().catch(e => console.error(`[FATAL] ${e.message}`));
