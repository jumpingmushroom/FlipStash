// Currency conversion service
// Note: Market values are scraped in USD, so conversion is from USD to selected currency

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

// Exchange rates from USD (as of typical rates, should be updated periodically)
// In a production app, you might fetch these from an API
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NOK: 10.85,
  SEK: 10.35,
  DKK: 6.87,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.88,
};

/**
 * Convert a value from USD to the target currency
 * @param {number} usdValue - Value in USD
 * @param {string} targetCurrency - Target currency code (e.g., 'EUR', 'NOK')
 * @returns {number} - Converted value
 */
export const convertFromUSD = (usdValue, targetCurrency) => {
  if (!usdValue || usdValue === null) return null;
  if (targetCurrency === 'USD') return usdValue;

  const rate = EXCHANGE_RATES[targetCurrency];
  if (!rate) return usdValue;

  return usdValue * rate;
};

/**
 * Format a value with the appropriate currency symbol
 * @param {number} value - The value to format
 * @param {string} currencyCode - Currency code (e.g., 'USD', 'EUR')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, currencyCode = 'USD', decimals = 2) => {
  if (value === null || value === undefined) return '-';

  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency ? currency.symbol : '$';

  // For JPY, we typically don't show decimals
  const decimalPlaces = currencyCode === 'JPY' ? 0 : decimals;

  const formattedValue = value.toFixed(decimalPlaces);

  // Format with symbol - for some currencies, symbol goes after
  if (currencyCode === 'NOK' || currencyCode === 'SEK' || currencyCode === 'DKK') {
    return `${formattedValue} ${symbol}`;
  }

  return `${symbol}${formattedValue}`;
};

/**
 * Get currency info by code
 * @param {string} code - Currency code
 * @returns {object|null} - Currency object or null
 */
export const getCurrency = (code) => {
  return CURRENCIES.find(c => c.code === code) || null;
};

/**
 * Save currency preference to localStorage
 * @param {string} currencyCode - Currency code to save
 */
export const saveCurrencyPreference = (currencyCode) => {
  localStorage.setItem('flipstash_currency', currencyCode);
};

/**
 * Load currency preference from localStorage
 * @returns {string} - Currency code (defaults to 'USD')
 */
export const loadCurrencyPreference = () => {
  return localStorage.getItem('flipstash_currency') || 'USD';
};
