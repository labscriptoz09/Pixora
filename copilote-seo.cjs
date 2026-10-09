const http = require('http');
const fs = require('fs');
const path = require('path');

const LLAMA_API = 'http://127.0.0.1:8081/v1/chat/completions';
const NICHE_DIR = path.join(__dirname, 'niche');
const MODEL = '/home/userland/llama.cpp/models/qwen2.5-3b.gguf';

async function generateSEO(nicheSlug, lang) {
  const prompt = `Tu es un expert SEO. Génère pour la niche "${nicheSlug}" en langue "${lang}":
1. Un titre SEO (max 60 caractères, mot-clé principal au début)
2. Une meta description (max 155 caractères, CTA inclus)
3. 5 mots-clés longue traîne pertinents
4. Un paragraphe d'introduction SEO de 150 mots

Réponds UNIQUEMENT en JSON valide:
{"title":"...","meta":"...","keywords":["...","...","...","...","..."],"intro":"..."}`;

  const data = JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500
  });

  return new Promise((resolve, reject) => {
    const req = http.request(LLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const content = json.choices[0].message.content;
          resolve(JSON.parse(content));
        } catch (e) { reject(e); }
      });
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  const langs = ['en', 'es', 'fr'];
  const results = [];

  for (const lang of langs) {
    const langDir = path.join(NICHE_DIR, lang);
    if (!fs.existsSync(langDir)) continue;
    const slugs = fs.readdirSync(langDir).filter(f =>
      fs.statSync(path.join(langDir, f)).isDirectory()
    );
    console.log(`\n🔍 [${lang.toUpperCase()}] ${slugs.length} niches trouvées`);

    for (const slug of slugs.slice(0, 3)) {
      console.log(`  ⏳ Génération SEO: ${lang}/${slug}...`);
      try {
        const seo = await generateSEO(slug, lang);
        results.push({ lang, slug, ...seo });
        console.log(`  ✅ ${slug}: "${seo.title}"`);
      } catch (e) {
        console.log(`  ❌ ${slug}: ${e.message}`);
      }
    }
  }

  const outFile = path.join(__dirname, 'copilote-seo-results.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Résultats sauvegardés: ${outFile}`);
  console.log(`📊 ${results.length} niches enrichies`);
}

main().catch(console.error);
