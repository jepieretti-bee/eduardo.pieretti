# Controle de Ponto Siplan — App Desktop (Windows)

Empacota o frontend (`../app`) e o backend (`../server`) num único app Electron,
com banco de dados local (`node:sqlite`, embutido no Node — sem módulo nativo
para compilar/recompilar). Ao abrir, sobe o servidor Express internamente em
`localhost` e carrega a interface numa janela nativa, sem precisar de navegador,
Node instalado ou terminal.

O banco (`ponto.db`) fica em `%APPDATA%/controle-de-ponto-desktop` no Windows,
por usuário, preservado entre atualizações do app.

## Gerar o instalador (.exe)

```bash
npm install
npm run dist:win
```

Gera `release/Controle de Ponto Siplan Setup <versão>.exe` (instalador NSIS,
com atalho de área de trabalho/menu iniciar e desinstalador).

**Requisitos para gerar o instalador:**
- Rodando em **Windows**: funciona direto, sem dependências extras.
- Rodando em **Linux/Mac**: o electron-builder precisa do **Wine** instalado
  (`sudo apt install wine wine32:i386` no Ubuntu/Debian) — usado só para gerar
  o desinstalador embutido no `.exe`, não para rodar o app em si.
- Alternativa recomendada: usar o workflow do GitHub Actions
  (`.github/workflows/build-desktop-windows.yml`, se configurado no repositório)
  rodando num runner `windows-latest`, sem precisar de Wine.

## Rodar em modo desenvolvimento (sem empacotar)

```bash
npm start
```

Builda o frontend, monta `server-src/` e abre a janela Electron localmente.

## Como funciona

- `main.js` — processo principal do Electron: sobe o Express (importado de
  `server-src/app.js`, gerado a partir de `../server/app.js` + `../server/db.js`)
  e abre a `BrowserWindow` apontando para `http://localhost:<porta>`.
- `scripts/prepare-assets.js` — builda `../app` (Vite) e monta `server-src/`
  (backend + build do frontend) antes de rodar/empacotar.
- `scripts/make-icon.js` — gera `build/icon.png` e `build/icon.ico` (ícone do
  app, desenhado em código já que não há ferramenta de imagem no ambiente de
  design original). Só precisa rodar de novo se quiser trocar o ícone.
