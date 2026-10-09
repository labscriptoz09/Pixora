const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TG_TOKEN = '8931833680:AAGCEF-ZpP6PCtGUbpnNWI58TGrhyucqY1Q';
const TG_CHAT = '1186135076';
const LOG_FILE = path.join(__dirname, 'reporter.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' });
    const req = https.request(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  log('📊 Génération rapport...');

  // GA4
  let ga4 = { totals: { sessions: 0, engagement_pct: 0, total_pageviews: 0 } };
  try { ga4 = JSON.parse(fs.readFileSync(path.join(__dirname, 'ga4-latest.json'), 'utf8')); } catch {}

  // SEO Progress
  let seo = { done: [], errors: [] };
  try { seo = JSON.parse(fs.readFileSync(path.join(__dirname, '.copilote-progress.json'), 'utf8')); } catch {}

  // Processus
  let procs = 0;
  try { procs = parseInt(execSync('ps aux | grep -E "llama-server|watchdog|scheduler|patrol\\.js|fullflow" | grep -v grep | wc -l', { encoding: 'utf8' }).trim()); } catch {}

  const report = `🤖 <b>RAPPORT PIXORA</b>
📅 ${new Date().toISOString().split('T')[0]}

📊 <b>GA4 (hier)</b>
• Sessions: ${ga4.totals.sessions}
• Engagement: ${ga4.totals.engagement_pct}%
• PageViews: ${ga4.totals.total_pageviews}

🧠 <b>SEO Copilote</b>
• Niches enrichies: ${seo.done.length}/137
• Erreurs: ${seo.errors.length}

⚙️ <b>Système</b>
• Processus actifs: ${procs}/5
• Moteur IA: Qwen2.5-3B local
• Coût IA: €0.00

💎 Pixora autonome opérationnel`;

  try {
    await sendTelegram(report);
    log('✅ Rapport envoyé sur Telegram');
  } catch (e) {
    log(`❌ Erreur Telegram: ${e.message}`);
  }
}

main().catch(e => log(`❌ Fatal: ${e.message}`));
