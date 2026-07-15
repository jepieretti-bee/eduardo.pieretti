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
    tema TEXT NOT NULL DEFAULT 'claro',
    jornadaEntrada TEXT NOT NULL DEFAULT '08:00',
    jornadaSaidaAlmoco TEXT NOT NULL DEFAULT '11:00',
    jornadaVoltaAlmoco TEXT NOT NULL DEFAULT '12:00',
    jornadaSaida TEXT NOT NULL DEFAULT '17:00',
    tolerancia INTEGER NOT NULL DEFAULT 15
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

// Migração: bancos criados antes da jornada por intervalos existir.
const configCols = db.prepare("PRAGMA table_info(config)").all().map((c) => c.name);
if (!configCols.includes('jornadaEntrada')) {
  db.exec(`
    ALTER TABLE config ADD COLUMN jornadaEntrada TEXT NOT NULL DEFAULT '08:00';
    ALTER TABLE config ADD COLUMN jornadaSaidaAlmoco TEXT NOT NULL DEFAULT '11:00';
    ALTER TABLE config ADD COLUMN jornadaVoltaAlmoco TEXT NOT NULL DEFAULT '12:00';
    ALTER TABLE config ADD COLUMN jornadaSaida TEXT NOT NULL DEFAULT '17:00';
    ALTER TABLE config ADD COLUMN tolerancia INTEGER NOT NULL DEFAULT 15;
  `);
}

// Migração: uma versão anterior zerou a tolerância (achando que o Kairos não aplicava
// nenhuma) — o comparativo com o extrato oficial mostrou que a tolerância é real, só
// que vale apenas para a saída (entrada nunca teve tolerância). Restaura o padrão da
// coluna para 15 (via recriação da tabela, já que SQLite não altera DEFAULT em ALTER
// COLUMN) e corrige quem ficou com o valor 0 daquela versão.
const tolCol = db.prepare("PRAGMA table_info(config)").all().find((c) => c.name === 'tolerancia');
if (tolCol && tolCol.dflt_value === '0') {
  db.exec(`
    ALTER TABLE config RENAME TO config_old_tolerancia;
    CREATE TABLE config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      empresa TEXT NOT NULL DEFAULT 'SIPLAN',
      funcionario TEXT NOT NULL DEFAULT '',
      cargaPadrao TEXT NOT NULL DEFAULT '08:00',
      tema TEXT NOT NULL DEFAULT 'claro',
      jornadaEntrada TEXT NOT NULL DEFAULT '08:00',
      jornadaSaidaAlmoco TEXT NOT NULL DEFAULT '11:00',
      jornadaVoltaAlmoco TEXT NOT NULL DEFAULT '12:00',
      jornadaSaida TEXT NOT NULL DEFAULT '17:00',
      tolerancia INTEGER NOT NULL DEFAULT 15
    );
    INSERT INTO config (id, empresa, funcionario, cargaPadrao, tema, jornadaEntrada, jornadaSaidaAlmoco, jornadaVoltaAlmoco, jornadaSaida, tolerancia)
      SELECT id, empresa, funcionario, cargaPadrao, tema, jornadaEntrada, jornadaSaidaAlmoco, jornadaVoltaAlmoco, jornadaSaida,
        CASE WHEN tolerancia = 0 THEN 15 ELSE tolerancia END
      FROM config_old_tolerancia;
    DROP TABLE config_old_tolerancia;
  `);
}

const configExists = db.prepare('SELECT id FROM config WHERE id = 1').get();
if (!configExists) {
  db.prepare(
    `INSERT INTO config (id, empresa, funcionario, cargaPadrao, tema, jornadaEntrada, jornadaSaidaAlmoco, jornadaVoltaAlmoco, jornadaSaida, tolerancia)
     VALUES (1, 'SIPLAN', 'José Eduardo Pieretti', '08:00', 'claro', '08:00', '11:00', '12:00', '17:00', 15)`
  ).run();
}

export default db;
