import db from '../db/index.js';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const CACHE_DURATION_HOURS = 24; // Refresh rates daily

/**
 * Fetch current exchange rates from API
 * @returns {Promise<Object>} - Exchange rates object
 */
export const fetchExchangeRates = async () => {
  try {
    console.log('Fetching exchange rates from API...');
    const response = await fetch(EXCHANGE_RATE_API);

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates) {
      throw new Error('Invalid response from exchange rate API');
    }

    console.log('Successfully fetched exchange rates');
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error.message);
    throw error;
  }
};

/**
 * Save exchange rates to database
 * @param {Object} rates - Exchange rates object
 */
export const saveExchangeRates = (rates) => {
  try {
    const now = new Date().toISOString();

    // Clear old rates
    db.prepare('DELETE FROM exchange_rates').run();

    // Insert new rates
    const insertStmt = db.prepare(
      'INSERT INTO exchange_rates (currency_code, rate, updated_at) VALUES (?, ?, ?)'
    );

    for (const [currencyCode, rate] of Object.entries(rates)) {
      insertStmt.run(currencyCode, rate, now);
    }

    console.log(`Saved ${Object.keys(rates).length} exchange rates to database`);
  } catch (error) {
    console.error('Error saving exchange rates:', error.message);
    throw error;
  }
};

/**
 * Get exchange rates from database
 * @returns {Object} - Exchange rates object with metadata
 */
export const getExchangeRates = () => {
  try {
    const rates = db.prepare('SELECT currency_code, rate, updated_at FROM exchange_rates').all();

    if (rates.length === 0) {
      return null;
    }

    const ratesObject = {};
    let lastUpdated = null;

    for (const row of rates) {
      ratesObject[row.currency_code] = row.rate;
      if (!lastUpdated || row.updated_at > lastUpdated) {
        lastUpdated = row.updated_at;
      }
    }

    return {
      rates: ratesObject,
      lastUpdated
    };
  } catch (error) {
    console.error('Error getting exchange rates from database:', error.message);
    return null;
  }
};

/**
 * Check if exchange rates need to be refreshed
 * @returns {boolean} - True if rates are stale or missing
 */
export const needsRefresh = () => {
  const data = getExchangeRates();

  if (!data || !data.lastUpdated) {
    return true;
  }

  const lastUpdate = new Date(data.lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

  return hoursSinceUpdate >= CACHE_DURATION_HOURS;
};

/**
 * Refresh exchange rates if needed
 * @param {boolean} force - Force refresh even if cache is fresh
 * @returns {Promise<Object>} - Exchange rates data
 */
export const refreshExchangeRates = async (force = false) => {
  try {
    if (!force && !needsRefresh()) {
      console.log('Exchange rates are up to date, skipping refresh');
      return getExchangeRates();
    }

    const rates = await fetchExchangeRates();
    saveExchangeRates(rates);

    return getExchangeRates();
  } catch (error) {
    console.error('Error refreshing exchange rates:', error.message);

    // Return cached rates if refresh fails
    const cached = getExchangeRates();
    if (cached) {
      console.log('Using cached exchange rates due to refresh failure');
      return cached;
    }

    throw error;
  }
};

/**
 * Initialize exchange rates on startup
 */
export const initializeExchangeRates = async () => {
  try {
    console.log('Initializing exchange rates...');
    await refreshExchangeRates();
    console.log('Exchange rates initialized successfully');
  } catch (error) {
    console.error('Failed to initialize exchange rates:', error.message);
    console.log('Application will continue with default fallback rates');
  }
};
