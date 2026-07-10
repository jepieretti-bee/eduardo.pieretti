import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = process.env.DB_DIR || __dirname;
const db = new DatabaseSync(path.join(dbDir, 'ponto.db'));

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    empresa TEXT NOT NULL DEFAULT 'SIPLAN',
    funcionario TEXT NOT NULL DEFAULT '',
    cargaPadrao TEXT NOT NULL DEFAULT '08:00',
    tema TEXT NOT NULL DEFAULT 'claro'
  );

  CREATE TABLE IF NOT EXISTS periodos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL DEFAULT '',
    dataInicio TEXT NOT NULL,
    dataFim TEXT NOT NULL,
    encerrado INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dias (
    data TEXT PRIMARY KEY,
    carga TEXT,
    entrada TEXT,
    saidaAlmoco TEXT,
    voltaAlmoco TEXT,
    saida TEXT,
    falta INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS feriados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL DEFAULT ''
  );
`);

// Migração: bancos criados antes do campo "falta" existir.
const diasCols = db.prepare("PRAGMA table_info(dias)").all().map((c) => c.name);
if (!diasCols.includes('falta')) {
  db.exec('ALTER TABLE dias ADD COLUMN falta INTEGER NOT NULL DEFAULT 0');
}

const configExists = db.prepare('SELECT id FROM config WHERE id = 1').get();
if (!configExists) {
  db.prepare(
    `INSERT INTO config (id, empresa, funcionario, cargaPadrao, tema) VALUES (1, 'SIPLAN', 'José Eduardo Pieretti', '08:00', 'claro')`
  ).run();
}

export default db;
