import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const children = [];

function run(name, command, args, { shell = isWindows } = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell,
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[campuscode] ${name} terminó con código ${code}.`);
    }
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('[campuscode] Iniciando API (4000) e interfaz Vite (5173)...');
run('servidor', process.execPath, ['--watch', 'server/index.js'], { shell: false });
setTimeout(() => run('vite', npm, ['run', 'dev:client']), 600);
