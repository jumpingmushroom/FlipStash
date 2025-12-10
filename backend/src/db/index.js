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

  // Migration: Add last_refresh_at column
  if (!columns.includes('last_refresh_at')) {
    console.log('Migrating database: Adding last_refresh_at column');
    db.exec(`ALTER TABLE games ADD COLUMN last_refresh_at TEXT`);
  }
} catch (error) {
  console.error('Migration error:', error.message);
}

// Create price_history table
db.exec(`
  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    market_value REAL NOT NULL,
    source TEXT NOT NULL,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  )
`);

// Create index for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
  CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
  CREATE INDEX IF NOT EXISTS idx_price_history_game_id ON price_history(game_id);
  CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);
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
      market_value_currency = ?, selling_value_currency = ?,
      last_refresh_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteGame: db.prepare(`
    DELETE FROM games WHERE id = ?
  `),

  // Price history statements
  insertPriceHistory: db.prepare(`
    INSERT INTO price_history (game_id, market_value, source)
    VALUES (?, ?, ?)
  `),

  getPriceHistory: db.prepare(`
    SELECT * FROM price_history
    WHERE game_id = ?
    ORDER BY recorded_at ASC
  `),

  getPriceHistoryByDateRange: db.prepare(`
    SELECT * FROM price_history
    WHERE game_id = ? AND recorded_at >= ?
    ORDER BY recorded_at ASC
  `),

  getLatestPriceHistory: db.prepare(`
    SELECT * FROM price_history
    WHERE game_id = ?
    ORDER BY recorded_at DESC
    LIMIT 1
  `),

  getAllGamesWithLastRefresh: db.prepare(`
    SELECT
      g.*,
      ph.market_value as latest_historical_value,
      ph.recorded_at as latest_history_recorded_at
    FROM games g
    LEFT JOIN (
      SELECT game_id, market_value, recorded_at
      FROM price_history ph1
      WHERE recorded_at = (
        SELECT MAX(recorded_at)
        FROM price_history ph2
        WHERE ph2.game_id = ph1.game_id
      )
    ) ph ON g.id = ph.game_id
    WHERE g.sold_value IS NULL
    ORDER BY g.created_at DESC
  `)
};

export default db;
