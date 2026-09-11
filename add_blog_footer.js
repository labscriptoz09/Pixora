const fs = require('fs');
const path = require('path');

const blogLink = `<div style="text-align:center;padding:20px;font-size:13px;opacity:0.7;"><a href="https://iapixora.blogspot.com" style="color:#888;text-decoration:none;">📖 IA Pixora Blog</a></div>`;

let count = 0;
const langs = ['fr', 'en', 'es'];

langs.forEach(lang => {
  const dir = path.join(__dirname, 'niche', lang);
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(niche => {
    const file = path.join(dir, niche, 'index.html');
    if (!fs.existsSync(file)) return;
    
    let html = fs.readFileSync(file, 'utf8');
    
    // Ne pas ajouter si déjà présent
    if (html.includes('iapixora.blogspot.com')) return;
    
    // Insérer avant </body>
    if (html.includes('</body>')) {
      html = html.replace('</body>', blogLink + '\n</body>');
      fs.writeFileSync(file, html);
      count++;
    }
  });
});

console.log(`✅ ${count} pages niche mises à jour avec lien blog`);
