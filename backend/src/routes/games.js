import express from 'express';
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  searchGames,
  refreshMarketValue
} from '../controllers/gameController.js';

const router = express.Router();

// Additional routes (must be before parameterized routes)
router.get('/igdb/search', searchGames);

// CRUD routes
router.get('/', getAllGames);
router.get('/:id', getGameById);
router.post('/', createGame);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

// More specific routes
router.post('/:id/refresh-market-value', refreshMarketValue);

export default router;
