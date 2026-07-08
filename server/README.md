# Controle de Ponto — Backend

API REST simples (Express + SQLite/better-sqlite3) que guarda configuração do colaborador, períodos e lançamentos de ponto para o app em `../app`.

## Rodando

```bash
npm install
npm start        # produção
npm run dev       # com auto-reload
```

Sobe em `http://localhost:4000` (configurável via `PORT`). O banco `ponto.db` é criado automaticamente na primeira execução.

## Endpoints

- `GET/PUT /api/config` — empresa, funcionário, jornada padrão, tema
- `GET/POST /api/periodos`, `PUT/DELETE /api/periodos/:id`, `POST /api/periodos/:id/toggle` — múltiplos períodos (nome, data início/fim, encerrar/reabrir)
- `GET /api/dias?start=&end=`, `PUT /api/dias/:data`, `POST /api/dias/clear` — lançamentos diários (entrada, saída almoço, volta almoço, saída, carga)
