import express from 'express';
import { getExchangeRates, refreshExchangeRates } from '../services/exchangeRates.js';

const router = express.Router();

/**
 * GET /api/exchange-rates
 * Get current exchange rates
 */
router.get('/', (req, res) => {
  try {
    const data = getExchangeRates();

    if (!data) {
      return res.status(404).json({
        error: 'Exchange rates not available',
        message: 'Please try refreshing the rates'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    res.status(500).json({ error: 'Failed to get exchange rates' });
  }
});

/**
 * POST /api/exchange-rates/refresh
 * Manually refresh exchange rates
 */
router.post('/refresh', async (req, res) => {
  try {
    const data = await refreshExchangeRates(true); // Force refresh

    res.json({
      message: 'Exchange rates refreshed successfully',
      ...data
    });
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    res.status(500).json({
      error: 'Failed to refresh exchange rates',
      message: error.message
    });
  }
});

export default router;
