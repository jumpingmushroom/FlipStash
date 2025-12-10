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
      igdb_id, igdb_cover_url, igdb_release_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateGame: db.prepare(`
    UPDATE games SET
      name = ?, platform = ?, purchase_value = ?, market_value = ?,
      selling_value = ?, sold_value = ?, purchase_date = ?, sale_date = ?,
      condition = ?, notes = ?, igdb_id = ?, igdb_cover_url = ?,
      igdb_release_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updateMarketValue: db.prepare(`
    UPDATE games SET
      market_value = ?, selling_value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteGame: db.prepare(`
    DELETE FROM games WHERE id = ?
  `)
};

export default db;
