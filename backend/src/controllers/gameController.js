import { statements } from '../db/index.js';
import { searchGames as igdbSearch, getGameDetails } from '../services/igdb.js';
import { getMarketValue } from '../services/scraper.js';

/**
 * Get all games
 */
export async function getAllGames(req, res) {
  try {
    const games = statements.getAllGames.all();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}

/**
 * Get a single game by ID
 */
export async function getGameById(req, res) {
  try {
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
}

/**
 * Create a new game
 */
export async function createGame(req, res) {
  try {
    const {
      name, platform, purchase_value, market_value, selling_value, sold_value,
      purchase_date, sale_date, condition, notes,
      igdb_id, igdb_cover_url, igdb_release_date,
      purchase_value_currency, market_value_currency, selling_value_currency, sold_value_currency,
      posted_online
    } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: 'Name and platform are required' });
    }

    const result = statements.insertGame.run(
      name, platform,
      purchase_value || null,
      market_value || null,
      selling_value || null,
      sold_value || null,
      purchase_date || null,
      sale_date || null,
      condition || null,
      notes || null,
      igdb_id || null,
      igdb_cover_url || null,
      igdb_release_date || null,
      purchase_value_currency || 'USD',
      market_value_currency || 'USD',
      selling_value_currency || 'USD',
      sold_value_currency || 'USD',
      posted_online ? 1 : 0
    );

    const newGame = statements.getGameById.get(result.lastInsertRowid);
    res.status(201).json(newGame);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
}

/**
 * Update an existing game
 */
export async function updateGame(req, res) {
  try {
    const {
      name, platform, purchase_value, market_value, selling_value, sold_value,
      purchase_date, sale_date, condition, notes,
      igdb_id, igdb_cover_url, igdb_release_date,
      purchase_value_currency, market_value_currency, selling_value_currency, sold_value_currency,
      posted_online
    } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: 'Name and platform are required' });
    }

    statements.updateGame.run(
      name, platform,
      purchase_value || null,
      market_value || null,
      selling_value || null,
      sold_value || null,
      purchase_date || null,
      sale_date || null,
      condition || null,
      notes || null,
      igdb_id || null,
      igdb_cover_url || null,
      igdb_release_date || null,
      purchase_value_currency || 'USD',
      market_value_currency || 'USD',
      selling_value_currency || 'USD',
      sold_value_currency || 'USD',
      posted_online ? 1 : 0,
      req.params.id
    );

    const updatedGame = statements.getGameById.get(req.params.id);
    if (!updatedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(updatedGame);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
}

/**
 * Delete a game
 */
export async function deleteGame(req, res) {
  try {
    const result = statements.deleteGame.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
}

/**
 * Search games on IGDB
 */
export async function searchGames(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await igdbSearch(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching games:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Refresh market value for a game
 */
export async function refreshMarketValue(req, res) {
  try {
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Fetch new market value
    const marketData = await getMarketValue(game.name, game.platform);

    // Only update if we got valid data, otherwise leave as is
    if (marketData.market_value !== null) {
      statements.updateMarketValue.run(
        marketData.market_value,
        marketData.selling_value,
        req.params.id
      );

      const updatedGame = statements.getGameById.get(req.params.id);
      res.json({
        game: updatedGame,
        sources: marketData.sources
      });
    } else {
      // Return current game data with indication that no new data was found
      res.json({
        game,
        sources: marketData.sources,
        message: 'No market data found'
      });
    }
  } catch (error) {
    console.error('Error refreshing market value:', error);
    res.status(500).json({ error: 'Failed to refresh market value' });
  }
}
