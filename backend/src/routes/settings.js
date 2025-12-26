import express from 'express';
import { getMarkupPercentage, setMarkupPercentage } from '../services/settings.js';

const router = express.Router();

/**
 * GET /api/settings/markup
 * Get the current markup percentage
 */
router.get('/markup', (req, res) => {
  try {
    const markupPercentage = getMarkupPercentage();
    res.json({ markup_percentage: markupPercentage });
  } catch (error) {
    console.error('Error getting markup:', error);
    res.status(500).json({ error: 'Failed to get markup setting' });
  }
});

/**
 * PUT /api/settings/markup
 * Update the markup percentage
 * Body: { markup_percentage: number }
 */
router.put('/markup', (req, res) => {
  try {
    const { markup_percentage } = req.body;

    if (markup_percentage === undefined || markup_percentage === null) {
      return res.status(400).json({ error: 'markup_percentage is required' });
    }

    setMarkupPercentage(markup_percentage);

    res.json({
      message: 'Markup percentage updated successfully',
      markup_percentage: parseFloat(markup_percentage)
    });
  } catch (error) {
    console.error('Error setting markup:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
