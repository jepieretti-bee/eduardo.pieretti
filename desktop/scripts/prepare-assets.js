// Monta desktop/server-src (backend + build do frontend) antes de empacotar/rodar o Electron.
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = path.join(__dirname, '..', '..');
const appDir = path.join(root, 'app');
const serverDir = path.join(root, 'server');
const desktopDir = path.join(root, 'desktop');
const outDir = path.join(desktopDir, 'server-src');

console.log('> Build do frontend (app/)');
execSync('npm run build', { cwd: appDir, stdio: 'inherit' });

console.log('> Preparando server-src/');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of ['app.js', 'db.js']) {
  fs.copyFileSync(path.join(serverDir, file), path.join(outDir, file));
}
// server-src fica dentro de um pacote "type":"commonjs" (desktop/); sem isso o
// import() dinâmico em main.js falha ao interpretar app.js/db.js como ESM.
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));

fs.cpSync(path.join(appDir, 'dist'), path.join(outDir, 'public'), { recursive: true });

console.log('> Pronto: desktop/server-src montado.');
