import { statements } from '../db/index.js';
import db from '../db/index.js';

/**
 * Get a setting value by key
 * @param {string} key - The setting key
 * @param {string} defaultValue - Default value if setting doesn't exist
 * @returns {string} - The setting value
 */
export const getSetting = (key, defaultValue = null) => {
  try {
    const result = statements.getSetting.get(key);
    return result ? result.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error.message);
    return defaultValue;
  }
};

/**
 * Set a setting value
 * @param {string} key - The setting key
 * @param {string} value - The setting value
 * @returns {boolean} - Success status
 */
export const setSetting = (key, value) => {
  try {
    statements.setSetting.run(key, String(value));
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error.message);
    return false;
  }
};

/**
 * Get the markup percentage as a decimal multiplier
 * @returns {number} - Markup multiplier (e.g., 1.10 for 10%)
 */
export const getMarkupMultiplier = () => {
  const markupPercentage = parseFloat(getSetting('markup_percentage', '10'));
  return 1 + (markupPercentage / 100);
};

/**
 * Get the markup percentage
 * @returns {number} - Markup percentage (e.g., 10 for 10%)
 */
export const getMarkupPercentage = () => {
  return parseFloat(getSetting('markup_percentage', '10'));
};

/**
 * Set the markup percentage
 * @param {number} percentage - Markup percentage (0-100)
 * @returns {boolean} - Success status
 */
export const setMarkupPercentage = (percentage) => {
  // Validate percentage is between 0 and 100
  const numPercentage = parseFloat(percentage);
  if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
    throw new Error('Markup percentage must be between 0 and 100');
  }
  return setSetting('markup_percentage', numPercentage.toString());
};

/**
 * Recalculate all selling values based on current markup percentage
 * Updates all games that have a market_value
 * @returns {Object} - Object with count of updated games
 */
export const recalculateAllSellingPrices = () => {
  try {
    const markupMultiplier = getMarkupMultiplier();

    // Get all games that have a market_value
    const games = db.prepare('SELECT id, market_value, market_value_currency FROM games WHERE market_value IS NOT NULL').all();

    let updatedCount = 0;
    const updateStmt = db.prepare(`
      UPDATE games
      SET selling_value = ?,
          selling_value_currency = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const game of games) {
      const sellingValue = Math.round(game.market_value * markupMultiplier * 100) / 100;
      updateStmt.run(sellingValue, game.market_value_currency, game.id);
      updatedCount++;
    }

    return { updatedCount };
  } catch (error) {
    console.error('Error recalculating selling prices:', error.message);
    throw error;
  }
};
