const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scheduler.log');
const TASKS_FILE = path.join(__dirname, '.scheduler-tasks.json');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function loadTasks() {
  try { return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8')); }
  catch { return []; }
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function shouldRun(task) {
  const now = new Date();
  const lastRun = task.lastRun ? new Date(task.lastRun) : new Date(0);
  return (now - lastRun) / 60000 >= task.intervalMin;
}

function runTask(task) {
  log(`🚀 Exécution: ${task.name}`);
  try {
    const output = execSync(task.command, {
      cwd: __dirname, encoding: 'utf8', timeout: task.timeoutMs || 300000
    });
    log(`✅ ${task.name} terminé`);
    if (output.trim()) log(`📋 ${output.trim().substring(0, 300)}`);
    return true;
  } catch (e) {
    log(`❌ ${task.name}: ${e.message.substring(0, 300)}`);
    return false;
  }
}

function schedulerCycle() {
  const tasks = loadTasks();
  let ran = 0;
  for (const task of tasks) {
    if (!task.enabled) continue;
    if (shouldRun(task)) {
      const ok = runTask(task);
      task.lastRun = new Date().toISOString();
      task.runs = (task.runs || 0) + 1;
      task.lastStatus = ok ? 'ok' : 'error';
      ran++;
    }
  }
  if (ran > 0) saveTasks(tasks);
}

function initDefaultTasks() {
  if (loadTasks().length > 0) return;
  const defaults = [
    { name: "GA4 Metrics", command: "python3 scripts/ga4_metrics.py", intervalMin: 360, enabled: true, timeoutMs: 60000 },
    { name: "SEO Enrichissement", command: "node copilote-seo-massif.cjs", intervalMin: 1440, enabled: true, timeoutMs: 14400000 },
    { name: "Régénération HTML", command: "node gen-niches-pro.cjs", intervalMin: 1440, enabled: false, timeoutMs: 600000 },
    { name: "Rapport Telegram", command: "node reporter.cjs", intervalMin: 1440, enabled: false, timeoutMs: 120000 }
  ];
  saveTasks(defaults);
  log(`📋 ${defaults.length} tâches initialisées`);
}

async function main() {
  log('⏰ Scheduler démarré');
  initDefaultTasks();
  const tasks = loadTasks();
  tasks.forEach(t => log(`   ${t.enabled ? '✅' : '⏸️'} ${t.name} (${t.intervalMin}min)`));
  schedulerCycle();
  setInterval(schedulerCycle, 60000);
}

main().catch(e => log(`❌ Fatal: ${e.message}`));
