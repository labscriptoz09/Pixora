const fs = require('fs');
const path = require('path');
const http = require('http');

const LLAMA_API = 'http://127.0.0.1:8081/v1/chat/completions';
const RESULTS_FILE = path.join(__dirname, 'copilote-seo-all.json');
const PROGRESS_FILE = path.join(__dirname, '.copilote-progress.json');
const VALID_URLS = path.join(__dirname, '..', 'pixora-patrol', 'valid_urls.json');

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return { done: [], errors: [] }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

function askQwen(nicheSlug, lang) {
  const prompt = 'Tu rediges le contenu d une page web pour un generateur d images IA gratuit appele IA Pixora. La niche est "' + nicheSlug + '" en langue "' + lang + '".\n\nGenere UNIQUEMENT ce JSON valide sans markdown sans explication:\n{\n  "title": "Titre oriente utilisateur + IA + Gratuit + (2026), max 60 chars",\n  "meta": "Meta description avec CTA, max 155 caracteres",\n  "h1": "H1 accrocheur oriente utilisateur",\n  "intro": "Introduction courte 2 phrases qui explique le benefice utilisateur",\n  "h2a": "Comment creer avec l IA ?",\n  "steps": ["Etape 1 simple", "Etape 2", "Etape 3", "Etape 4"],\n  "h2b": "Exemples de prompts",\n  "prompts": ["Prompt realiste et detaille 1", "Prompt 2", "Prompt 3", "Prompt 4"],\n  "faq": [["Question frequente 1 ?", "Reponse courte."], ["Question 2 ?", "Reponse."], ["Question 3 ?", "Reponse."]]\n}\n\nREGLES:\n- Le contenu doit etre utile pour un VISITEUR qui veut generer des images PAS un article sur le SEO\n- Les prompts doivent etre des exemples concrets qu un utilisateur copierait dans le generateur\n- Ton professionnel mais accessible comme un tutoriel\n- Toujours mentionner gratuit sans inscription IA Pixora\n- Reponds UNIQUEMENT en JSON valide:';

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'qwen2.5-3b.gguf',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 300
    });
    const req = http.request(LLAMA_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 360000
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b).choices[0].message.content); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data); req.end();
  });
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(VALID_URLS, 'utf8'));
  const urlList = Array.isArray(raw) ? raw : (raw.urls || []);
  const allNiches = urlList
    .filter(u => u.includes('/niche/'))
    .map(u => {
      const parts = u.replace(/.*\/niche\//, '').split('/');
      return { lang: parts[0], slug: parts[1] };
    })
    .filter(n => n.lang && n.slug);
  console.log('Chargement: ' + allNiches.length + ' niches depuis valid_urls.json');

  const progress = loadProgress();
  let ok = 0, errors = 0;
  const allResults = [];

  for (let i = 0; i < allNiches.length; i++) {
    const { lang, slug } = allNiches[i];
    const key = lang + '/' + slug;

    if (progress.done.includes(key)) {
      console.log('SKIP [' + (i+1) + '/' + allNiches.length + '] ' + key);
      continue;
    }

    process.stdout.write('[' + (i+1) + '/' + allNiches.length + '] ' + key + '...');
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const rawResult = await askQwen(slug, lang);
        const cleaned = rawResult.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.title && parsed.meta) {
          allResults.push({ lang: lang, slug: slug, title: parsed.title, meta: parsed.meta, h1: parsed.h1, intro: parsed.intro, h2a: parsed.h2a, steps: parsed.steps, h2b: parsed.h2b, prompts: parsed.prompts, faq: parsed.faq });
          progress.done.push(key);
          ok++;
          console.log(' OK: ' + parsed.title.substring(0,50));
          success = true;
          break;
        } else {
          throw new Error('Champs manquants');
        }
      } catch(e) {
        if (attempt < 3) {
          console.log(' RETRY ' + attempt + '/3 (' + e.message.substring(0,40) + ')');
          await new Promise(r => setTimeout(r, 1000));
        } else {
          errors++;
          progress.errors.push({ key: key, error: e.message });
          console.log(' ERR: ' + e.message);
        }
      }
    }

    saveProgress(progress);
    // Sauvegarde incrémentale des résultats
    let existNow = [];
    try { existNow = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch {}
    const mergedNow = existNow.concat(allResults.filter(r => !existNow.some(e => e.lang === r.lang && e.slug === r.slug)));
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(mergedNow, null, 2));
    await new Promise(r => setTimeout(r, 300));
  }

  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch {}
  const merged = existing.concat(allResults);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(merged, null, 2));

  console.log('TERMINE: ' + merged.length + ' niches, ' + errors + ' erreurs');
}

main().catch(e => console.error('Fatal: ' + e.message));
