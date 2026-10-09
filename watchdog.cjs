const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'watchdog.log');
const CHECK_INTERVAL = 60000; // 60 secondes

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function isProcessRunning(name) {
  try {
    const result = execSync(`pgrep -f "${name}"`, { encoding: 'utf8', timeout: 5000 }).trim();
    return result.length > 0;
  } catch { return false; }
}

function startProcess(name, command, args) {
  log(`🔄 Redémarrage: ${name}`);
  try {
    const child = spawn(command, args, {
      cwd: __dirname,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    child.unref();
    child.stdout.on('data', d => fs.appendFileSync(LOG_FILE, `[${name}] ${d}`));
    child.stderr.on('data', d => fs.appendFileSync(LOG_FILE, `[${name} ERR] ${d}`));
    log(`✅ ${name} redémarré (PID: ${child.pid})`);
    return true;
  } catch (e) {
    log(`❌ Échec redémarrage ${name}: ${e.message}`);
    return false;
  }
}

function checkLlamaServer() {
  try {
    const http = require('http');
    return new Promise(resolve => {
      const req = http.get('http://127.0.0.1:8081/v1/models', { timeout: 5000 }, res => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });    });
  } catch { return Promise.resolve(false); }
}

async function watchdogCycle() {
  log('─── Cycle Watchdog ───');

  // 1. Vérifier llama-server
  const llamaOk = await checkLlamaServer();
  if (!llamaOk) {
    log('⚠️ llama-server DOWN → Redémarrage...');
    startProcess('llama-server',
      '/home/userland/llama.cpp/build/bin/llama-server',
      ['-m', '/home/userland/llama.cpp/models/qwen2.5-3b.gguf',
       '--host', '127.0.0.1', '--port', '8081', '-c', '4096']);
  } else {
    log('✅ llama-server OK');
  }

  // 2. Vérifier Patrol
  const patrolRunning = isProcessRunning('patrol');
  if (!patrolRunning) {
    log('⚠️ Patrol DOWN → Redémarrage...');
    startProcess('patrol', 'node', ['patrol.cjs']);
  } else {
    log('✅ Patrol OK');
  }

  // 3. Vérifier FullFlow
  const fullflowRunning = isProcessRunning('fullflow');
  if (!fullflowRunning) {
    log('⚠️ FullFlow DOWN → Redémarrage...');
    startProcess('fullflow', 'node', ['test_fullflow_AC_clean.js']);
  } else {
    log('✅ FullFlow OK');
  }

  // 4. Vérifier enrichissement massif
  const massifRunning = isProcessRunning('copilote-seo-massif');
  if (!massifRunning) {
    try {
      const progress = JSON.parse(fs.readFileSync(path.join(__dirname, '.copilote-progress.json'), 'utf8'));
      log(`📊 Massif terminé: ${progress.done.length} niches enrichies, ${progress.errors.length} erreurs`);
    } catch {
      log('ℹ️ Massif pas encore commencé ou terminé');
    }
  } else {
    try {
      const progress = JSON.parse(fs.readFileSync(path.join(__dirname, '.copilote-progress.json'), 'utf8'));
      log(`📊 Massif en cours: ${progress.done.length} faites, ${progress.errors.length} erreurs`);    } catch {}
  }
}

async function main() {
  log('🐕 Watchdog démarré');
  log(`📁 Surveillance: ${__dirname}`);
  log(`⏱️ Intervalle: ${CHECK_INTERVAL / 1000}s`);

  await watchdogCycle();
  setInterval(watchdogCycle, CHECK_INTERVAL);
}

main().catch(e => log(`❌ Watchdog fatal: ${e.message}`));
