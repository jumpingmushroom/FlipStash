import express from 'express';
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  searchGames,
  refreshMarketValue,
  exportToCSV,
  importFromCSV,
  getAcquisitionSources,
  batchUpdatePostedOnline,
  batchUpdateCondition,
  batchDeleteGames
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

// CRUD routes
router.get('/', getAllGames);
router.get('/:id', getGameById);
router.post('/', createGame);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

// More specific routes
router.post('/:id/refresh-market-value', refreshMarketValue);
router.get('/:id/price-history', getGamePriceHistory);

export default router;
