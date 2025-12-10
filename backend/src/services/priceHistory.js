import { statements } from '../db/index.js';

/**
 * Records a price history entry for a game
 * @param {number} gameId - The game ID
 * @param {number} marketValue - The market value to record
 * @param {string} source - The source of the value (manual, pricecharting, finn, average)
 */
export function recordPriceHistory(gameId, marketValue, source) {
  try {
    statements.insertPriceHistory.run(gameId, marketValue, source);
    console.log(`Price history recorded for game ${gameId}: $${marketValue} from ${source}`);
  } catch (error) {
    console.error('Error recording price history:', error.message);
    throw error;
  }
}

/**
 * Gets price history for a game within a date range
 * @param {number} gameId - The game ID
 * @param {string} range - Time range (7d, 30d, 90d, all)
 * @returns {Array} Price history entries
 */
export function getPriceHistory(gameId, range = 'all') {
  try {
    if (range === 'all') {
      return statements.getPriceHistory.all(gameId);
    }

    // Calculate date threshold based on range
    const now = new Date();
    let daysAgo;

    switch (range) {
      case '7d':
        daysAgo = 7;
        break;
      case '30d':
        daysAgo = 30;
        break;
      case '90d':
        daysAgo = 90;
        break;
      default:
        return statements.getPriceHistory.all(gameId);
    }

    const threshold = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const thresholdISO = threshold.toISOString();

    return statements.getPriceHistoryByDateRange.all(gameId, thresholdISO);
  } catch (error) {
    console.error('Error getting price history:', error.message);
    throw error;
  }
}

/**
 * Gets the latest price history entry for a game
 * @param {number} gameId - The game ID
 * @returns {Object|null} Latest price history entry or null
 */
export function getLatestPriceHistory(gameId) {
  try {
    return statements.getLatestPriceHistory.get(gameId) || null;
  } catch (error) {
    console.error('Error getting latest price history:', error.message);
    throw error;
  }
}

/**
 * Calculates the price change percentage between current and previous value
 * @param {number} currentValue - Current market value
 * @param {number} previousValue - Previous market value
 * @returns {number} Percentage change
 */
export function calculatePriceChange(currentValue, previousValue) {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Gets all unsold games with their refresh status
 * @returns {Array} Games with refresh information
 */
export function getGamesWithRefreshStatus() {
  try {
    return statements.getAllGamesWithLastRefresh.all();
  } catch (error) {
    console.error('Error getting games with refresh status:', error.message);
    throw error;
  }
}
