import {
  getPriceHistory,
  getLatestPriceHistory,
  getGamesWithRefreshStatus,
  calculatePriceChange
} from '../services/priceHistory.js';
import { statements } from '../db/index.js';

/**
 * Get price history for a specific game
 */
export async function getGamePriceHistory(req, res) {
  try {
    const { range = 'all' } = req.query;
    const gameId = req.params.id;

    // Verify game exists
    const game = statements.getGameById.get(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const history = getPriceHistory(gameId, range);

    // Calculate price change if there's history
    let priceChange = null;
    if (history.length >= 2) {
      const oldest = history[0].market_value;
      const newest = history[history.length - 1].market_value;
      priceChange = calculatePriceChange(newest, oldest);
    }

    res.json({
      game: {
        id: game.id,
        name: game.name,
        platform: game.platform,
        current_market_value: game.market_value
      },
      history,
      price_change: priceChange,
      range
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
}

/**
 * Get dashboard overview of all games with refresh status
 */
export async function getRefreshDashboard(req, res) {
  try {
    const games = getGamesWithRefreshStatus();

    // Enrich with price change calculations
    const enrichedGames = games.map(game => {
      let priceChange = null;
      let priceChangePercentage = null;

      if (game.first_historical_value && game.market_value) {
        const diff = game.market_value - game.first_historical_value;
        priceChange = diff;
        priceChangePercentage = calculatePriceChange(
          game.market_value,
          game.first_historical_value
        );
      }

      return {
        id: game.id,
        name: game.name,
        platform: game.platform,
        market_value: game.market_value,
        market_value_currency: game.market_value_currency,
        last_refresh_at: game.last_refresh_at,
        first_historical_value: game.first_historical_value,
        first_history_recorded_at: game.first_history_recorded_at,
        price_change: priceChange,
        price_change_percentage: priceChangePercentage,
        igdb_cover_url: game.igdb_cover_url
      };
    });

    res.json({
      total_games: enrichedGames.length,
      games: enrichedGames
    });
  } catch (error) {
    console.error('Error fetching refresh dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch refresh dashboard' });
  }
}
