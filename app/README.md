# Controle de Ponto — Frontend

App React (Vite) que implementa o protótipo `project/Controle de Ponto.dc.html`: Painel, Registrar Ponto, Espelho do Mês e Configurações (colaborador, múltiplos períodos, tema).

Consome a API em `../server` (por padrão `http://localhost:4000`; configurável via `VITE_API_URL`).

## Rodando

```bash
npm install
npm run dev
```

Certifique-se de que o backend (`../server`) esteja rodando antes de abrir o app.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção em `dist/`
- `npm run lint` — oxlint
