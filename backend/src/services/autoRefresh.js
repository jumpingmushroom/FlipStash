import cron from 'node-cron';
import { statements } from '../db/index.js';
import { getMarketValue } from './scraper.js';
import { recordPriceHistory } from './priceHistory.js';

/**
 * Delays execution for a random amount of time
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 */
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Shuffles an array to randomize order
 * @param {Array} array - The array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Refreshes market values for all unsold games
 */
export async function refreshAllUnsoldGames() {
  console.log('Starting automated market value refresh...');

  try {
    // Get all unsold games
    const allGames = statements.getAllGames.all();
    const unsoldGames = allGames.filter(game => game.sold_value === null);

    if (unsoldGames.length === 0) {
      console.log('No unsold games to refresh');
      return;
    }

    console.log(`Found ${unsoldGames.length} unsold games to refresh`);

    // Randomize order to appear more human-like
    const shuffledGames = shuffleArray(unsoldGames);

    let successCount = 0;
    let failCount = 0;

    for (const game of shuffledGames) {
      try {
        console.log(`Refreshing market value for: ${game.name} (${game.platform})`);

        // Fetch new market value
        const marketData = await getMarketValue(game.name, game.platform);

        if (marketData.market_value !== null) {
          // Update the game with new market value
          statements.updateMarketValue.run(
            marketData.market_value,
            marketData.selling_value,
            marketData.currency,
            marketData.currency,
            game.id
          );

          // Determine the source for price history
          let source = 'manual';
          const { pricecharting, finnno } = marketData.sources;

          if (finnno !== null) {
            source = 'finn';
          } else if (pricecharting !== null) {
            source = 'pricecharting';
          }

          // Record price history
          recordPriceHistory(game.id, marketData.market_value, source);

          console.log(`✓ Successfully updated ${game.name}: ${marketData.market_value} ${marketData.currency} (${source})`);
          successCount++;
        } else {
          console.log(`✗ No market data found for ${game.name}`);
          failCount++;
        }
      } catch (error) {
        console.error(`✗ Error refreshing ${game.name}:`, error.message);
        failCount++;
      }

      // Random delay between games (30-120 seconds) to emulate human behavior
      // This helps avoid being flagged as a bot
      const delayMs = Math.floor(Math.random() * (120000 - 30000 + 1)) + 30000;
      const delaySec = Math.floor(delayMs / 1000);
      console.log(`Waiting ${delaySec}s before next game...`);
      await randomDelay(delayMs, delayMs);
    }

    console.log(`\nAutomated refresh complete: ${successCount} updated, ${failCount} failed`);
  } catch (error) {
    console.error('Error in automated refresh:', error);
  }
}

/**
 * Initializes the automated market value refresh cron job
 * Runs in the evening (7pm-11pm) with human-like randomization
 */
export function initializeAutoRefresh() {
  // Get cron schedule from environment or use default
  // Default: Run at a random time between 7pm and 11pm
  const cronSchedule = process.env.AUTO_REFRESH_CRON || '0 19-23 * * *';

  console.log(`Initializing auto-refresh with schedule: ${cronSchedule}`);

  // Schedule the cron job
  cron.schedule(cronSchedule, async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Auto-refresh triggered at ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // Add initial random delay (0-60 minutes) to vary the exact start time
    const initialDelay = Math.floor(Math.random() * 60 * 60 * 1000); // 0-60 minutes
    const initialDelayMin = Math.floor(initialDelay / 60000);
    console.log(`Random initial delay: ${initialDelayMin} minutes`);
    await randomDelay(initialDelay, initialDelay);

    await refreshAllUnsoldGames();
  });

  console.log('Auto-refresh cron job scheduled successfully');
}

/**
 * Manually trigger a refresh (for testing or manual runs)
 */
export async function manualRefresh() {
  await refreshAllUnsoldGames();
}
