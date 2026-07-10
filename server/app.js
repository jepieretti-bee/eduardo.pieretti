import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Config ----------
app.get('/api/config', (req, res) => {
  const cfg = db.prepare('SELECT * FROM config WHERE id = 1').get();
  res.json(cfg);
});

app.put('/api/config', (req, res) => {
  const { empresa, funcionario, cargaPadrao, tema } = req.body;
  const current = db.prepare('SELECT * FROM config WHERE id = 1').get();
  const next = {
    empresa: empresa ?? current.empresa,
    funcionario: funcionario ?? current.funcionario,
    cargaPadrao: cargaPadrao ?? current.cargaPadrao,
    tema: tema ?? current.tema
  };
  db.prepare(
    'UPDATE config SET empresa = ?, funcionario = ?, cargaPadrao = ?, tema = ? WHERE id = 1'
  ).run(next.empresa, next.funcionario, next.cargaPadrao, next.tema);
  res.json(db.prepare('SELECT * FROM config WHERE id = 1').get());
});

// ---------- Periodos ----------
app.get('/api/periodos', (req, res) => {
  const rows = db.prepare('SELECT * FROM periodos ORDER BY dataInicio ASC').all();
  res.json(rows.map((r) => ({ ...r, encerrado: !!r.encerrado })));
});

app.post('/api/periodos', (req, res) => {
  const { nome, dataInicio, dataFim } = req.body;
  if (!dataInicio || !dataFim) {
    return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
  }
  const info = db
    .prepare('INSERT INTO periodos (nome, dataInicio, dataFim, encerrado) VALUES (?, ?, ?, 0)')
    .run(nome || '', dataInicio, dataFim);
  const row = db.prepare('SELECT * FROM periodos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...row, encerrado: !!row.encerrado });
});

app.put('/api/periodos/:id', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM periodos WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Período não encontrado' });
  const { nome, dataInicio, dataFim } = req.body;
  const next = {
    nome: nome ?? current.nome,
    dataInicio: dataInicio ?? current.dataInicio,
    dataFim: dataFim ?? current.dataFim
  };
  db.prepare('UPDATE periodos SET nome = ?, dataInicio = ?, dataFim = ? WHERE id = ?').run(
    next.nome,
    next.dataInicio,
    next.dataFim,
    id
  );
  const row = db.prepare('SELECT * FROM periodos WHERE id = ?').get(id);
  res.json({ ...row, encerrado: !!row.encerrado });
});

app.post('/api/periodos/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM periodos WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Período não encontrado' });
  const encerrado = current.encerrado ? 0 : 1;
  db.prepare('UPDATE periodos SET encerrado = ? WHERE id = ?').run(encerrado, id);
  const row = db.prepare('SELECT * FROM periodos WHERE id = ?').get(id);
  res.json({ ...row, encerrado: !!row.encerrado });
});

app.delete('/api/periodos/:id', (req, res) => {
  db.prepare('DELETE FROM periodos WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ---------- Dias ----------
app.get('/api/dias', (req, res) => {
  const { start, end } = req.query;
  let rows;
  if (start && end) {
    rows = db.prepare('SELECT * FROM dias WHERE data >= ? AND data <= ? ORDER BY data ASC').all(start, end);
  } else {
    rows = db.prepare('SELECT * FROM dias ORDER BY data ASC').all();
  }
  res.json(rows.map((r) => ({ ...r, falta: !!r.falta })));
});

app.put('/api/dias/:data', (req, res) => {
  const { data } = req.params;
  const { carga, entrada, saidaAlmoco, voltaAlmoco, saida, falta } = req.body;
  db.prepare(
    `INSERT INTO dias (data, carga, entrada, saidaAlmoco, voltaAlmoco, saida, falta)
     VALUES (@data, @carga, @entrada, @saidaAlmoco, @voltaAlmoco, @saida, @falta)
     ON CONFLICT(data) DO UPDATE SET
       carga = excluded.carga,
       entrada = excluded.entrada,
       saidaAlmoco = excluded.saidaAlmoco,
       voltaAlmoco = excluded.voltaAlmoco,
       saida = excluded.saida,
       falta = excluded.falta`
  ).run({
    data,
    carga: carga ?? null,
    entrada: entrada ?? '',
    saidaAlmoco: saidaAlmoco ?? '',
    voltaAlmoco: voltaAlmoco ?? '',
    saida: saida ?? '',
    falta: falta ? 1 : 0
  });
  const row = db.prepare('SELECT * FROM dias WHERE data = ?').get(data);
  res.json({ ...row, falta: !!row.falta });
});

app.post('/api/dias/clear', (req, res) => {
  const { start, end } = req.body;
  if (!start || !end) return res.status(400).json({ error: 'start e end são obrigatórios' });
  db.prepare('DELETE FROM dias WHERE data >= ? AND data <= ?').run(start, end);
  res.status(204).end();
});

// ---------- Feriados ----------
app.get('/api/feriados', (req, res) => {
  const rows = db.prepare('SELECT * FROM feriados ORDER BY data ASC').all();
  res.json(rows);
});

app.post('/api/feriados', (req, res) => {
  const { data, nome } = req.body;
  if (!data) return res.status(400).json({ error: 'data é obrigatória' });
  try {
    const info = db.prepare('INSERT INTO feriados (data, nome) VALUES (?, ?)').run(data, nome || '');
    const row = db.prepare('SELECT * FROM feriados WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    res.status(409).json({ error: 'já existe um feriado cadastrado nessa data' });
  }
});

app.delete('/api/feriados/:id', (req, res) => {
  db.prepare('DELETE FROM feriados WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ---------- Frontend estático (build do app React), usado no empacotamento desktop ----------
const staticDir = process.env.STATIC_DIR || path.join(__dirname, 'public');
if (fs.existsSync(path.join(staticDir, 'index.html'))) {
  app.use(express.static(staticDir));
  app.get('/', (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
}

export default app;
