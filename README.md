# Controle de Ponto — Siplan

Sistema de controle de ponto da Siplan: registro de horários, cálculo automático de horas trabalhadas/extras, banco de horas por período e folha de ponto mensal.

Implementado a partir do protótipo criado no Claude Design (`project/Controle de Ponto.dc.html`), com as decisões de produto documentadas em `chats/chat1.md`.

## Estrutura do projeto

- **`app/`** — frontend (React + Vite): telas de Painel, Registrar Ponto, Espelho do Mês e Configurações.
- **`server/`** — backend (Express + `node:sqlite`): API REST usada pelo frontend web.
- **`desktop/`** — app desktop (Electron) para Windows, empacotando frontend + backend num instalador único, com banco de dados local por usuário. O instalador gerado fica em `desktop/installer/`.
- **`project/`** — protótipo original exportado do Claude Design (referência de design, não é o código de produção).
- **`chats/`** — transcrição da conversa de design que definiu os requisitos do produto.

## Como rodar

**Web (frontend + backend separados):**
```bash
cd server && npm install && npm start   # API em http://localhost:4000
cd app && npm install && npm run dev     # app em http://localhost:5173
```

**Desktop (Windows):** veja `desktop/README.md` para gerar o instalador (`npm run dist:win`) ou usar o workflow do GitHub Actions em `.github/workflows/build-desktop-windows.yml`.

Cada subpasta (`app/`, `server/`, `desktop/`) tem seu próprio README com mais detalhes.
