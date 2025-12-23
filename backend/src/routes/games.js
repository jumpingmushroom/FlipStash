import express from 'express';
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  searchGames,
  refreshMarketValue,
  refreshMarketValueSSE,
  exportToCSV,
  importFromCSV,
  getAcquisitionSources,
  updatePostedOnline,
  batchUpdatePostedOnline,
  batchUpdateCondition,
  batchDeleteGames,
  batchRefreshMarketValues,
  batchRefreshMarketValuesSSE
} from '../controllers/gameController.js';
import {
  getGamePriceHistory,
  getRefreshDashboard
} from '../controllers/priceHistoryController.js';

const router = express.Router();

// Additional routes (must be before parameterized routes)
router.get('/igdb/search', searchGames);
router.get('/refresh-dashboard', getRefreshDashboard);
router.get('/export/csv', exportToCSV);
router.post('/import/csv', importFromCSV);
router.get('/acquisition-sources', getAcquisitionSources);
router.post('/batch/posted-online', batchUpdatePostedOnline);
router.post('/batch/condition', batchUpdateCondition);
router.post('/batch/delete', batchDeleteGames);
router.post('/batch/refresh-market-values', batchRefreshMarketValues);
router.post('/batch/refresh-market-values-sse', batchRefreshMarketValuesSSE);

// CRUD routes
router.get('/', getAllGames);
router.get('/:id', getGameById);
router.post('/', createGame);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

// More specific routes
router.post('/:id/refresh-market-value', refreshMarketValue);
router.post('/:id/refresh-market-value-sse', refreshMarketValueSSE);
router.put('/:id/posted-online', updatePostedOnline);
router.get('/:id/price-history', getGamePriceHistory);

export default router;
