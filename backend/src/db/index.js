import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/flipstash.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create games table
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    purchase_value REAL,
    market_value REAL,
    selling_value REAL,
    sold_value REAL,
    purchase_date TEXT,
    sale_date TEXT,
    condition TEXT,
    notes TEXT,
    igdb_id INTEGER,
    igdb_cover_url TEXT,
    igdb_release_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add created_at and updated_at columns if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(games)").all();
  const columns = tableInfo.map(col => col.name);

  if (!columns.includes('created_at')) {
    console.log('Migrating database: Adding created_at column');
    db.exec(`ALTER TABLE games ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`);
  }

  if (!columns.includes('updated_at')) {
    console.log('Migrating database: Adding updated_at column');
    db.exec(`ALTER TABLE games ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`);
  }

  // Migration: Add currency tracking columns
  if (!columns.includes('purchase_value_currency')) {
    console.log('Migrating database: Adding purchase_value_currency column');
    db.exec(`ALTER TABLE games ADD COLUMN purchase_value_currency TEXT DEFAULT 'USD'`);
  }

  if (!columns.includes('market_value_currency')) {
    console.log('Migrating database: Adding market_value_currency column');
    db.exec(`ALTER TABLE games ADD COLUMN market_value_currency TEXT DEFAULT 'USD'`);
  }

  if (!columns.includes('selling_value_currency')) {
    console.log('Migrating database: Adding selling_value_currency column');
    db.exec(`ALTER TABLE games ADD COLUMN selling_value_currency TEXT DEFAULT 'USD'`);
  }

  if (!columns.includes('sold_value_currency')) {
    console.log('Migrating database: Adding sold_value_currency column');
    db.exec(`ALTER TABLE games ADD COLUMN sold_value_currency TEXT DEFAULT 'USD'`);
  }

  // Migration: Add posted_online column
  if (!columns.includes('posted_online')) {
    console.log('Migrating database: Adding posted_online column');
    db.exec(`ALTER TABLE games ADD COLUMN posted_online INTEGER DEFAULT 0`);
  }
} catch (error) {
  console.error('Migration error:', error.message);
}

// Create index for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
  CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
`);

// Prepared statements for CRUD operations
export const statements = {
  getAllGames: db.prepare(`
    SELECT * FROM games ORDER BY created_at DESC
  `),

  getGameById: db.prepare(`
    SELECT * FROM games WHERE id = ?
  `),

  insertGame: db.prepare(`
    INSERT INTO games (
      name, platform, purchase_value, market_value, selling_value, sold_value,
      purchase_date, sale_date, condition, notes,
      igdb_id, igdb_cover_url, igdb_release_date,
      purchase_value_currency, market_value_currency, selling_value_currency, sold_value_currency,
      posted_online
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateGame: db.prepare(`
    UPDATE games SET
      name = ?, platform = ?, purchase_value = ?, market_value = ?,
      selling_value = ?, sold_value = ?, purchase_date = ?, sale_date = ?,
      condition = ?, notes = ?, igdb_id = ?, igdb_cover_url = ?,
      igdb_release_date = ?,
      purchase_value_currency = ?, market_value_currency = ?, selling_value_currency = ?, sold_value_currency = ?,
      posted_online = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updateMarketValue: db.prepare(`
    UPDATE games SET
      market_value = ?, selling_value = ?,
      market_value_currency = 'USD', selling_value_currency = 'USD',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteGame: db.prepare(`
    DELETE FROM games WHERE id = ?
  `)
};

export default db;
