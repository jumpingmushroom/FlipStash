import { statements } from '../db/index.js';
import { searchGames as igdbSearch, getGameDetails } from '../services/igdb.js';
import { getMarketValue, getPriceFromUrl } from '../services/scraper.js';
import { recordPriceHistory } from '../services/priceHistory.js';
import { getMarkupMultiplier } from '../services/settings.js';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

/**
 * Platform alias mapping for matching user input to IGDB platform names
 * Maps common abbreviations and variants to their IGDB equivalents
 */
const PLATFORM_ALIASES = {
  // PlayStation variants
  'psx': 'PlayStation',
  'ps1': 'PlayStation',
  'playstation 1': 'PlayStation',
  'ps one': 'PlayStation',
  'ps2': 'PlayStation 2',
  'ps3': 'PlayStation 3',
  'ps4': 'PlayStation 4',
  'ps5': 'PlayStation 5',
  'psp': 'PlayStation Portable',
  'ps vita': 'PlayStation Vita',
  'vita': 'PlayStation Vita',

  // Nintendo variants
  'nes': 'Nintendo Entertainment System',
  'snes': 'Super Nintendo Entertainment System',
  'super nes': 'Super Nintendo Entertainment System',
  'n64': 'Nintendo 64',
  'ngc': 'Nintendo GameCube',
  'gamecube': 'Nintendo GameCube',
  'wii': 'Wii',
  'wii u': 'Wii U',
  'switch': 'Nintendo Switch',
  'gb': 'Game Boy',
  'gbc': 'Game Boy Color',
  'gba': 'Game Boy Advance',
  'nds': 'Nintendo DS',
  'ds': 'Nintendo DS',
  '3ds': 'Nintendo 3DS',

  // Xbox variants
  'xbox': 'Xbox',
  'xbox 360': 'Xbox 360',
  'xbox one': 'Xbox One',
  'xbox series x': 'Xbox Series X|S',
  'xbox series s': 'Xbox Series X|S',
  'xbox series x/s': 'Xbox Series X|S',
  'xbox series x|s': 'Xbox Series X|S',

  // Sega variants
  'sega genesis': 'Sega Mega Drive/Genesis',
  'genesis': 'Sega Mega Drive/Genesis',
  'mega drive': 'Sega Mega Drive/Genesis',
  'dreamcast': 'Dreamcast',
  'saturn': 'Sega Saturn',
  'game gear': 'Sega Game Gear',
  'master system': 'Sega Master System',
  'sega master system': 'Sega Master System',
  'sms': 'Sega Master System',

  // PC variants
  'pc': 'PC (Microsoft Windows)',
  'windows': 'PC (Microsoft Windows)',
  'mac': 'Mac',
  'linux': 'Linux'
};

/**
 * Normalize platform name using alias mapping
 * @param {string} platform - Platform name from CSV or user input
 * @returns {string} - Normalized platform name for IGDB matching
 */
function normalizePlatformName(platform) {
  if (!platform) return platform;

  const lowercasePlatform = platform.toLowerCase().trim();
  return PLATFORM_ALIASES[lowercasePlatform] || platform;
}

/**
 * Get all games
 */
export async function getAllGames(req, res) {
  try {
    const games = statements.getAllGames.all();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}

/**
 * Get a single game by ID
 */
export async function getGameById(req, res) {
  try {
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
}

/**
 * Create a new game
 */
export async function createGame(req, res) {
  try {
    const {
      name, platform, purchase_value, market_value, selling_value, sold_value,
      purchase_date, sale_date, condition, notes,
      igdb_id, igdb_cover_url, igdb_release_date,
      purchase_value_currency, market_value_currency, selling_value_currency, sold_value_currency,
      posted_online, region, acquisition_source,
      igdb_slug, igdb_summary, igdb_genres, igdb_rating, igdb_url,
      pricecharting_url, finn_url, price_source
    } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: 'Name and platform are required' });
    }

    const result = statements.insertGame.run(
      name, platform,
      purchase_value || null,
      market_value || null,
      selling_value || null,
      sold_value || null,
      purchase_date || null,
      sale_date || null,
      condition || null,
      notes || null,
      igdb_id || null,
      igdb_cover_url || null,
      igdb_release_date || null,
      purchase_value_currency || 'USD',
      market_value_currency || 'USD',
      selling_value_currency || 'USD',
      sold_value_currency || 'USD',
      posted_online ? 1 : 0,
      region || 'PAL',
      acquisition_source || null,
      igdb_slug || null,
      igdb_summary || null,
      igdb_genres || null,
      igdb_rating || null,
      igdb_url || null,
      pricecharting_url || null,
      finn_url || null,
      price_source || null
    );

    const newGame = statements.getGameById.get(result.lastInsertRowid);

    // Record initial price history if market value is provided
    if (market_value) {
      recordPriceHistory(newGame.id, market_value, 'manual');
    }

    res.status(201).json(newGame);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
}

/**
 * Update an existing game
 */
export async function updateGame(req, res) {
  try {
    const {
      name, platform, purchase_value, market_value, selling_value, sold_value,
      purchase_date, sale_date, condition, notes,
      igdb_id, igdb_cover_url, igdb_release_date,
      purchase_value_currency, market_value_currency, selling_value_currency, sold_value_currency,
      posted_online, region, acquisition_source,
      igdb_slug, igdb_summary, igdb_genres, igdb_rating, igdb_url,
      pricecharting_url, finn_url, price_source
    } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: 'Name and platform are required' });
    }

    // Get current game to check if market value changed
    const currentGame = statements.getGameById.get(req.params.id);
    if (!currentGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    statements.updateGame.run(
      name, platform,
      purchase_value || null,
      market_value || null,
      selling_value || null,
      sold_value || null,
      purchase_date || null,
      sale_date || null,
      condition || null,
      notes || null,
      igdb_id || null,
      igdb_cover_url || null,
      igdb_release_date || null,
      purchase_value_currency || 'USD',
      market_value_currency || 'USD',
      selling_value_currency || 'USD',
      sold_value_currency || 'USD',
      posted_online ? 1 : 0,
      region || 'PAL',
      acquisition_source || null,
      igdb_slug || null,
      igdb_summary || null,
      igdb_genres || null,
      igdb_rating || null,
      igdb_url || null,
      pricecharting_url || null,
      finn_url || null,
      price_source || null,
      req.params.id
    );

    // Record price history if market value changed
    if (market_value && market_value !== currentGame.market_value) {
      recordPriceHistory(req.params.id, market_value, 'manual');
    }

    const updatedGame = statements.getGameById.get(req.params.id);
    res.json(updatedGame);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
}

/**
 * Delete a game
 */
export async function deleteGame(req, res) {
  try {
    const result = statements.deleteGame.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
}

/**
 * Search games on IGDB
 */
export async function searchGames(req, res) {
  try {
    const { query, platform } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await igdbSearch(query, platform);
    res.json(results);
  } catch (error) {
    console.error('Error searching games:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Refresh market value for a game
 */
export async function refreshMarketValue(req, res) {
  try {
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if we have stored URLs to use
    if (game.pricecharting_url || game.finn_url) {
      // Use stored URLs to fetch prices
      let marketValue = null;
      let currency = 'USD';
      let sources = {
        pricecharting: null,
        finnno: null
      };

      // Fetch from stored URLs in parallel
      const fetchPromises = [];
      if (game.pricecharting_url) {
        fetchPromises.push(
          getPriceFromUrl(game.pricecharting_url, game.condition).then(data => ({
            source: 'pricecharting',
            data
          }))
        );
      }
      if (game.finn_url) {
        fetchPromises.push(
          getPriceFromUrl(game.finn_url, game.condition).then(data => ({
            source: 'finnno',
            data
          }))
        );
      }

      const results = await Promise.all(fetchPromises);

      // Process results
      for (const result of results) {
        if (result.source === 'pricecharting' && result.data.market_value !== null) {
          sources.pricecharting = result.data.market_value;
        } else if (result.source === 'finnno' && result.data.market_value !== null) {
          sources.finnno = result.data.market_value;
        }
      }

      // Prefer Finn.no if available
      if (sources.finnno !== null) {
        marketValue = sources.finnno;
        currency = 'NOK';
      } else if (sources.pricecharting !== null) {
        marketValue = sources.pricecharting;
        currency = 'USD';
      }

      if (marketValue !== null) {
        const sellingValue = Math.round(marketValue * getMarkupMultiplier() * 100) / 100;

        // Determine price source
        let priceSource = null;
        if (sources.finnno !== null) {
          priceSource = 'finnno';
        } else if (sources.pricecharting !== null) {
          priceSource = 'pricecharting';
        }

        statements.updateMarketValue.run(
          marketValue,
          sellingValue,
          currency,
          currency,
          priceSource,
          req.params.id
        );

        // Determine the source for price history
        let historySource = 'manual';
        if (sources.finnno !== null) {
          historySource = 'finn';
        } else if (sources.pricecharting !== null) {
          historySource = 'pricecharting';
        }

        recordPriceHistory(req.params.id, marketValue, historySource);

        const updatedGame = statements.getGameById.get(req.params.id);
        res.json({
          game: updatedGame,
          sources
        });
      } else {
        res.json({
          game,
          sources,
          message: 'No market data found'
        });
      }
    } else {
      // No stored URLs, fetch new market value with condition and region
      const marketData = await getMarketValue(game.name, game.platform, game.condition, game.region);

      // Only update if we got valid data, otherwise leave as is
      if (marketData.market_value !== null) {
        // Determine price source
        const { pricecharting, finnno } = marketData.sources;
        let priceSource = null;
        if (finnno !== null) {
          priceSource = 'finnno';
        } else if (pricecharting !== null) {
          priceSource = 'pricecharting';
        }

        statements.updateMarketValue.run(
          marketData.market_value,
          marketData.selling_value,
          marketData.currency,
          marketData.currency,
          priceSource,
          req.params.id
        );

        // Determine the source for price history
        let source = 'manual';
        if (finnno !== null) {
          source = 'finn';
        } else if (pricecharting !== null) {
          source = 'pricecharting';
        }

        // Record price history
        recordPriceHistory(req.params.id, marketData.market_value, source);

        const updatedGame = statements.getGameById.get(req.params.id);
        res.json({
          game: updatedGame,
          sources: marketData.sources
        });
      } else {
        // Return current game data with indication that no new data was found
        res.json({
          game,
          sources: marketData.sources,
          message: 'No market data found'
        });
      }
    }
  } catch (error) {
    console.error('Error refreshing market value:', error);
    res.status(500).json({ error: 'Failed to refresh market value' });
  }
}

/**
 * Refresh market value for a single game using SSE (Server-Sent Events)
 * Provides real-time progress updates similar to batch refresh
 */
export async function refreshMarketValueSSE(req, res) {
  try {
    const id = req.params.id;
    const game = statements.getGameById.get(id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Helper function to send SSE message
    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial start event
    sendUpdate({
      type: 'start',
      total: 1
    });

    // Send progress with current game info
    sendUpdate({
      type: 'progress',
      completed: 0,
      total: 1,
      current: {
        id: game.id,
        name: game.name,
        platform: game.platform,
        condition: game.condition,
        region: game.region,
        coverUrl: game.igdb_cover_url
      },
      stats: {
        succeeded: 0,
        failed: 0,
        skipped: 0
      }
    });

    // Check if game is sold
    if (game.sold_value !== null) {
      sendUpdate({
        type: 'progress',
        completed: 1,
        total: 1,
        current: null,
        result: {
          id,
          status: 'skipped',
          message: 'Game is sold',
          name: game.name
        },
        stats: {
          succeeded: 0,
          failed: 0,
          skipped: 1
        }
      });

      sendUpdate({
        type: 'complete',
        results: {
          total: 1,
          succeeded: 0,
          failed: 0,
          skipped: 1,
          details: [{
            id,
            status: 'skipped',
            message: 'Game is sold',
            name: game.name
          }]
        }
      });

      res.end();
      return;
    }

    // Check if we have stored URLs to use
    let marketData;

    if (game.pricecharting_url || game.finn_url) {
      // Use stored URLs to fetch prices
      let marketValue = null;
      let currency = 'USD';
      let sources = {
        pricecharting: null,
        finnno: null
      };

      // Fetch from stored URLs in parallel
      const fetchPromises = [];
      if (game.pricecharting_url) {
        fetchPromises.push(
          getPriceFromUrl(game.pricecharting_url, game.condition).then(data => ({
            source: 'pricecharting',
            data
          }))
        );
      }
      if (game.finn_url) {
        fetchPromises.push(
          getPriceFromUrl(game.finn_url, game.condition).then(data => ({
            source: 'finnno',
            data
          }))
        );
      }

      const results = await Promise.all(fetchPromises);

      // Process results
      for (const result of results) {
        if (result.source === 'pricecharting' && result.data.market_value !== null) {
          sources.pricecharting = result.data.market_value;
        } else if (result.source === 'finnno' && result.data.market_value !== null) {
          sources.finnno = result.data.market_value;
        }
      }

      // Prefer Finn.no if available
      let priceSource = null;
      if (sources.finnno !== null) {
        marketValue = sources.finnno;
        currency = 'NOK';
        priceSource = 'finnno';
      } else if (sources.pricecharting !== null) {
        marketValue = sources.pricecharting;
        currency = 'USD';
        priceSource = 'pricecharting';
      }

      const sellingValue = marketValue !== null ? Math.round(marketValue * getMarkupMultiplier() * 100) / 100 : null;

      marketData = {
        market_value: marketValue,
        selling_value: sellingValue,
        currency: currency,
        sources: sources,
        price_source: priceSource
      };
    } else {
      // No stored URLs, fetch new market value - request multiple results if available
      marketData = await getMarketValue(game.name, game.platform, game.condition, game.region, true);

      // Check if we got multiple results for user selection
      if (marketData.multipleResults) {
        const { pricecharting, finnno } = marketData.multipleResults;
        const totalResults = (pricecharting?.length || 0) + (finnno?.length || 0);

        // If only one result total, automatically select it
        if (totalResults === 1) {
          const selectedUrl = pricecharting?.length === 1 ? pricecharting[0].url : finnno[0].url;
          const source = pricecharting?.length === 1 ? 'pricecharting' : 'finnno';

          // Save the URL to database
          if (source === 'pricecharting') {
            statements.updatePriceUrls.run(selectedUrl, null, id);
          } else {
            statements.updatePriceUrls.run(null, selectedUrl, id);
          }

          // Fetch price from the selected URL (or use median for Finn.no)
          let priceData;
          if (source === 'finnno' && finnno[0].isFinnMedian) {
            // Finn.no median result - use the price directly
            priceData = {
              market_value: finnno[0].price,
              currency: 'NOK'
            };
          } else {
            // Regular URL fetch for PriceCharting or individual Finn.no listing
            priceData = await getPriceFromUrl(selectedUrl, game.condition);
          }

          if (priceData.market_value !== null) {
            marketData = {
              market_value: priceData.market_value,
              selling_value: Math.round(priceData.market_value * getMarkupMultiplier() * 100) / 100,
              currency: priceData.currency,
              sources: {
                pricecharting: source === 'pricecharting' ? priceData.market_value : null,
                finnno: source === 'finnno' ? priceData.market_value : null
              },
              price_source: source
            };
          } else {
            // No price found, treat as failed
            marketData = { market_value: null, selling_value: null, currency: 'USD', sources: {}, price_source: null };
          }
        } else {
          // Multiple results, show modal for user selection
          sendUpdate({
            type: 'multipleResults',
            gameId: id,
            results: marketData.multipleResults
          });
          res.end();
          return;
        }
      }
    }

    // Process result
    if (marketData.market_value !== null) {
      statements.updateMarketValue.run(
        marketData.market_value,
        marketData.selling_value,
        marketData.currency,
        marketData.currency,
        marketData.price_source || null,
        id
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
      recordPriceHistory(id, marketData.market_value, source);

      const detail = {
        id,
        status: 'success',
        name: game.name,
        platform: game.platform,
        oldValue: game.market_value,
        newValue: marketData.market_value,
        currency: marketData.currency,
        sources: marketData.sources
      };

      sendUpdate({
        type: 'progress',
        completed: 1,
        total: 1,
        current: null,
        result: detail,
        stats: {
          succeeded: 1,
          failed: 0,
          skipped: 0
        }
      });

      sendUpdate({
        type: 'complete',
        results: {
          total: 1,
          succeeded: 1,
          failed: 0,
          skipped: 0,
          details: [detail]
        }
      });
    } else {
      const detail = {
        id,
        status: 'failed',
        message: 'No market data found',
        name: game.name,
        platform: game.platform
      };

      sendUpdate({
        type: 'progress',
        completed: 1,
        total: 1,
        current: null,
        result: detail,
        stats: {
          succeeded: 0,
          failed: 1,
          skipped: 0
        }
      });

      sendUpdate({
        type: 'complete',
        results: {
          total: 1,
          succeeded: 0,
          failed: 1,
          skipped: 0,
          details: [detail]
        }
      });
    }

    res.end();
  } catch (error) {
    console.error('Error refreshing market value:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}

/**
 * Export all games to CSV
 */
export async function exportToCSV(req, res) {
  try {
    const games = statements.getAllGames.all();

    // Define CSV columns
    const columns = [
      'id', 'name', 'platform', 'region', 'purchase_value', 'market_value',
      'selling_value', 'sold_value', 'purchase_date', 'sale_date',
      'condition', 'notes', 'igdb_id', 'igdb_cover_url', 'igdb_release_date',
      'purchase_value_currency', 'market_value_currency',
      'selling_value_currency', 'sold_value_currency', 'posted_online',
      'acquisition_source', 'created_at', 'updated_at', 'last_refresh_at'
    ];

    // Convert games to CSV format
    const csv = stringify(games, {
      header: true,
      columns: columns
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=flipstash_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({ error: 'Failed to export games to CSV' });
  }
}

/**
 * Helper function to automatically fetch IGDB metadata for a game
 * @param {string} gameName - Name of the game
 * @param {string} platform - Platform of the game
 * @returns {Object|null} - IGDB metadata or null if not found
 */
async function autoFetchIGDBMetadata(gameName, platform) {
  try {
    // Search IGDB for the game
    const searchResults = await igdbSearch(gameName);

    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    // Try to find a match that includes the platform
    let bestMatch = null;

    // First, try to find a match that includes the platform in the platforms list
    if (platform) {
      // Normalize the platform name to match IGDB's naming convention
      const normalizedPlatform = normalizePlatformName(platform);

      bestMatch = searchResults.find(game =>
        game.platforms && game.platforms.toLowerCase().includes(normalizedPlatform.toLowerCase())
      );
    }

    // If no platform match found, use the first result
    if (!bestMatch) {
      bestMatch = searchResults[0];
    }

    return {
      igdb_id: bestMatch.id,
      igdb_cover_url: bestMatch.coverUrl,
      igdb_release_date: bestMatch.releaseDate,
      igdb_slug: bestMatch.slug,
      igdb_summary: bestMatch.summary,
      igdb_genres: bestMatch.genres,
      igdb_rating: bestMatch.rating,
      igdb_url: bestMatch.url
    };
  } catch (error) {
    console.log(`Could not auto-fetch IGDB data for ${gameName}:`, error.message);
    return null;
  }
}

/**
 * Import games from CSV
 */
export async function importFromCSV(req, res) {
  try {
    const { csv: csvData, mode, defaultCurrency } = req.body;

    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }

    if (!mode || !['skip', 'update', 'replace'].includes(mode)) {
      return res.status(400).json({ error: 'Valid import mode is required (skip, update, replace)' });
    }

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      total: records.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // If mode is replace, delete all existing games first
    if (mode === 'replace') {
      const allGames = statements.getAllGames.all();
      for (const game of allGames) {
        statements.deleteGame.run(game.id);
      }
    }

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        // Validate required fields
        if (!record.name || !record.platform) {
          results.errors.push({
            row: i + 2, // +2 because: +1 for header, +1 for 0-index
            error: 'Missing required fields (name and platform)'
          });
          results.skipped++;
          continue;
        }

        // Check for duplicates (based on name + platform)
        const existingGames = statements.getAllGames.all();
        const duplicate = existingGames.find(g =>
          g.name.toLowerCase() === record.name.toLowerCase() &&
          g.platform.toLowerCase() === record.platform.toLowerCase()
        );

        if (duplicate && mode === 'skip') {
          results.skipped++;
          continue;
        }

        // Fetch IGDB data
        let igdbData = {
          igdb_id: record.igdb_id || null,
          igdb_cover_url: record.igdb_cover_url || null,
          igdb_release_date: record.igdb_release_date || null,
          igdb_slug: record.igdb_slug || null,
          igdb_summary: record.igdb_summary || null,
          igdb_genres: record.igdb_genres || null,
          igdb_rating: record.igdb_rating || null,
          igdb_url: record.igdb_url || null
        };

        // If igdb_id is provided but other data is missing, fetch details
        if (record.igdb_id && (!record.igdb_cover_url || !record.igdb_slug)) {
          try {
            const details = await getGameDetails(parseInt(record.igdb_id));
            if (details) {
              igdbData.igdb_cover_url = details.coverUrl || igdbData.igdb_cover_url;
              igdbData.igdb_release_date = details.releaseDate || igdbData.igdb_release_date;
              igdbData.igdb_slug = details.slug || igdbData.igdb_slug;
              igdbData.igdb_summary = details.summary || igdbData.igdb_summary;
              igdbData.igdb_genres = details.genres || igdbData.igdb_genres;
              igdbData.igdb_rating = details.rating || igdbData.igdb_rating;
              igdbData.igdb_url = details.url || igdbData.igdb_url;
            }
          } catch (igdbError) {
            console.log(`Could not fetch IGDB data for game ${record.name}:`, igdbError.message);
          }
        }
        // If no igdb_id provided, automatically search and fetch metadata
        else if (!record.igdb_id) {
          try {
            const autoMetadata = await autoFetchIGDBMetadata(record.name, record.platform);
            if (autoMetadata) {
              igdbData = autoMetadata;
            }
          } catch (igdbError) {
            console.log(`Could not auto-fetch IGDB data for game ${record.name}:`, igdbError.message);
          }
        }

        // Prepare game data
        const gameData = {
          name: record.name,
          platform: record.platform,
          region: record.region || 'PAL',
          purchase_value: record.purchase_value ? parseFloat(record.purchase_value) : null,
          market_value: record.market_value ? parseFloat(record.market_value) : null,
          selling_value: record.selling_value ? parseFloat(record.selling_value) : null,
          sold_value: record.sold_value ? parseFloat(record.sold_value) : null,
          purchase_date: record.purchase_date || null,
          sale_date: record.sale_date || null,
          condition: record.condition || null,
          notes: record.notes || null,
          igdb_id: igdbData.igdb_id ? parseInt(igdbData.igdb_id) : null,
          igdb_cover_url: igdbData.igdb_cover_url,
          igdb_release_date: igdbData.igdb_release_date,
          igdb_slug: igdbData.igdb_slug,
          igdb_summary: igdbData.igdb_summary,
          igdb_genres: igdbData.igdb_genres,
          igdb_rating: igdbData.igdb_rating ? parseFloat(igdbData.igdb_rating) : null,
          igdb_url: igdbData.igdb_url,
          purchase_value_currency: record.purchase_value_currency || defaultCurrency || 'USD',
          market_value_currency: record.market_value_currency || defaultCurrency || 'USD',
          selling_value_currency: record.selling_value_currency || defaultCurrency || 'USD',
          sold_value_currency: record.sold_value_currency || defaultCurrency || 'USD',
          posted_online: record.posted_online === '1' || record.posted_online === 'true' ? 1 : 0,
          acquisition_source: record.acquisition_source || null
        };

        if (duplicate && mode === 'update') {
          // Update existing game
          statements.updateGame.run(
            gameData.name,
            gameData.platform,
            gameData.purchase_value,
            gameData.market_value,
            gameData.selling_value,
            gameData.sold_value,
            gameData.purchase_date,
            gameData.sale_date,
            gameData.condition,
            gameData.notes,
            gameData.igdb_id,
            gameData.igdb_cover_url,
            gameData.igdb_release_date,
            gameData.purchase_value_currency,
            gameData.market_value_currency,
            gameData.selling_value_currency,
            gameData.sold_value_currency,
            gameData.posted_online,
            gameData.region,
            gameData.acquisition_source,
            gameData.igdb_slug,
            gameData.igdb_summary,
            gameData.igdb_genres,
            gameData.igdb_rating,
            gameData.igdb_url,
            duplicate.id
          );
          results.updated++;
        } else {
          // Insert new game
          const result = statements.insertGame.run(
            gameData.name,
            gameData.platform,
            gameData.purchase_value,
            gameData.market_value,
            gameData.selling_value,
            gameData.sold_value,
            gameData.purchase_date,
            gameData.sale_date,
            gameData.condition,
            gameData.notes,
            gameData.igdb_id,
            gameData.igdb_cover_url,
            gameData.igdb_release_date,
            gameData.purchase_value_currency,
            gameData.market_value_currency,
            gameData.selling_value_currency,
            gameData.sold_value_currency,
            gameData.posted_online,
            gameData.region,
            gameData.acquisition_source,
            gameData.igdb_slug,
            gameData.igdb_summary,
            gameData.igdb_genres,
            gameData.igdb_rating,
            gameData.igdb_url
          );

          // Record price history if market value is provided
          if (gameData.market_value) {
            recordPriceHistory(result.lastInsertRowid, gameData.market_value, 'import');
          }

          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message
        });
        results.skipped++;
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error importing from CSV:', error);
    res.status(500).json({ error: 'Failed to import games from CSV: ' + error.message });
  }
}

/**
 * Get unique acquisition sources for autocomplete
 */
export async function getAcquisitionSources(req, res) {
  try {
    const sources = statements.getUniqueAcquisitionSources.all();
    res.json(sources.map(s => s.acquisition_source));
  } catch (error) {
    console.error('Error fetching acquisition sources:', error);
    res.status(500).json({ error: 'Failed to fetch acquisition sources' });
  }
}

/**
 * Update posted_online status for a single game
 */
export async function updatePostedOnline(req, res) {
  try {
    const { posted_online } = req.body;

    if (typeof posted_online !== 'number' || (posted_online !== 0 && posted_online !== 1)) {
      return res.status(400).json({ error: 'posted_online must be 0 or 1' });
    }

    // Check if game exists
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update posted_online status
    statements.updatePostedOnline.run(posted_online, req.params.id);

    // Return updated game
    const updatedGame = statements.getGameById.get(req.params.id);
    res.json(updatedGame);
  } catch (error) {
    console.error('Error updating posted online status:', error);
    res.status(500).json({ error: 'Failed to update posted online status' });
  }
}

/**
 * Batch update posted_online status for multiple games
 */
export async function batchUpdatePostedOnline(req, res) {
  try {
    const { gameIds, postedOnline } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }

    if (typeof postedOnline !== 'boolean') {
      return res.status(400).json({ error: 'postedOnline boolean is required' });
    }

    const value = postedOnline ? 1 : 0;

    // Update each game
    for (const id of gameIds) {
      statements.updatePostedOnline.run(value, id);
    }

    res.json({ success: true, updated: gameIds.length });
  } catch (error) {
    console.error('Error batch updating posted online:', error);
    res.status(500).json({ error: 'Failed to batch update posted online status' });
  }
}

/**
 * Batch update condition for multiple games
 */
export async function batchUpdateCondition(req, res) {
  try {
    const { gameIds, condition } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }

    if (!condition) {
      return res.status(400).json({ error: 'condition is required' });
    }

    // Update each game
    for (const id of gameIds) {
      statements.updateCondition.run(condition, id);
    }

    res.json({ success: true, updated: gameIds.length });
  } catch (error) {
    console.error('Error batch updating condition:', error);
    res.status(500).json({ error: 'Failed to batch update condition' });
  }
}

/**
 * Batch delete multiple games
 */
export async function batchDeleteGames(req, res) {
  try {
    const { gameIds } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }

    let deletedCount = 0;

    // Delete each game
    for (const id of gameIds) {
      const result = statements.deleteGame.run(id);
      if (result.changes > 0) {
        deletedCount++;
      }
    }

    res.json({ success: true, deleted: deletedCount });
  } catch (error) {
    console.error('Error batch deleting games:', error);
    res.status(500).json({ error: 'Failed to batch delete games' });
  }
}

/**
 * Batch refresh market values for multiple games
 */
export async function batchRefreshMarketValues(req, res) {
  try {
    const { gameIds } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }

    const results = {
      total: gameIds.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    // Process each game
    for (const id of gameIds) {
      try {
        const game = statements.getGameById.get(id);
        if (!game) {
          results.failed++;
          results.details.push({ id, status: 'failed', message: 'Game not found' });
          continue;
        }

        // Skip sold games
        if (game.sold_value !== null) {
          results.skipped++;
          results.details.push({ id, status: 'skipped', message: 'Game is sold', name: game.name });
          continue;
        }

        // Only refresh games that have stored price URLs
        // Games without URLs require manual selection via the modal
        if (!game.pricecharting_url && !game.finn_url) {
          results.skipped++;
          results.details.push({
            id,
            status: 'skipped',
            message: 'No price source URLs configured. Please refresh individually to select price sources.',
            name: game.name
          });
          continue;
        }

        // Use stored URLs to fetch prices
        let marketValue = null;
        let currency = 'USD';
        let sources = {
          pricecharting: null,
          finnno: null
        };

        // Fetch from stored URLs in parallel
        const fetchPromises = [];
        if (game.pricecharting_url) {
          fetchPromises.push(
            getPriceFromUrl(game.pricecharting_url, game.condition).then(data => ({
              source: 'pricecharting',
              data
            }))
          );
        }
        if (game.finn_url) {
          fetchPromises.push(
            getPriceFromUrl(game.finn_url, game.condition).then(data => ({
              source: 'finnno',
              data
            }))
          );
        }

        const fetchResults = await Promise.all(fetchPromises);

        // Process results
        for (const result of fetchResults) {
          if (result.source === 'pricecharting' && result.data.market_value !== null) {
            sources.pricecharting = result.data.market_value;
          } else if (result.source === 'finnno' && result.data.market_value !== null) {
            sources.finnno = result.data.market_value;
          }
        }

        // Prefer Finn.no if available
        let priceSource = null;
        if (sources.finnno !== null) {
          marketValue = sources.finnno;
          currency = 'NOK';
          priceSource = 'finnno';
        } else if (sources.pricecharting !== null) {
          marketValue = sources.pricecharting;
          currency = 'USD';
          priceSource = 'pricecharting';
        }

        // Only update if we got valid data
        if (marketValue !== null) {
          const sellingValue = Math.round(marketValue * getMarkupMultiplier() * 100) / 100;

          statements.updateMarketValue.run(
            marketValue,
            sellingValue,
            currency,
            currency,
            priceSource,
            id
          );

          // Determine the source for price history
          let source = 'manual';
          if (sources.finnno !== null) {
            source = 'finn';
          } else if (sources.pricecharting !== null) {
            source = 'pricecharting';
          }

          // Record price history
          recordPriceHistory(id, marketValue, source);

          results.succeeded++;
          results.details.push({
            id,
            status: 'success',
            name: game.name,
            oldValue: game.market_value,
            newValue: marketValue,
            currency: currency
          });
        } else {
          results.failed++;
          results.details.push({
            id,
            status: 'failed',
            message: 'No market data found from stored URLs',
            name: game.name
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({ id, status: 'failed', message: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error batch refreshing market values:', error);
    res.status(500).json({ error: 'Failed to batch refresh market values' });
  }
}

/**
 * Save selected price source URLs and fetch prices from them
 * Used when user selects from multiple search results
 */
export async function savePriceSources(req, res) {
  try {
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { pricechartingUrl, finnUrl } = req.body;

    // At least one URL must be provided
    if (!pricechartingUrl && !finnUrl) {
      return res.status(400).json({ error: 'At least one price source URL is required' });
    }

    // Save the URLs to the database
    statements.updatePriceUrls.run(
      pricechartingUrl || null,
      finnUrl || null,
      req.params.id
    );

    // Fetch prices from the provided URLs
    let marketValue = null;
    let currency = 'USD';
    let sources = {
      pricecharting: null,
      finnno: null
    };

    // Fetch from both URLs in parallel
    const fetchPromises = [];
    if (pricechartingUrl) {
      fetchPromises.push(
        getPriceFromUrl(pricechartingUrl, game.condition).then(data => ({
          source: 'pricecharting',
          data
        }))
      );
    }
    if (finnUrl) {
      fetchPromises.push(
        getPriceFromUrl(finnUrl, game.condition).then(data => ({
          source: 'finnno',
          data
        }))
      );
    }

    const results = await Promise.all(fetchPromises);

    // Process results and determine which price to use
    for (const result of results) {
      if (result.source === 'pricecharting' && result.data.market_value !== null) {
        sources.pricecharting = result.data.market_value;
      } else if (result.source === 'finnno' && result.data.market_value !== null) {
        sources.finnno = result.data.market_value;
      }
    }

    // Prefer Finn.no (NOK) if available, otherwise use PriceCharting (USD)
    let priceSource = null;
    if (sources.finnno !== null) {
      marketValue = sources.finnno;
      currency = 'NOK';
      priceSource = 'finnno';
    } else if (sources.pricecharting !== null) {
      marketValue = sources.pricecharting;
      currency = 'USD';
      priceSource = 'pricecharting';
    }

    // Update market value if we got data
    if (marketValue !== null) {
      const sellingValue = Math.round(marketValue * getMarkupMultiplier() * 100) / 100;

      statements.updateMarketValue.run(
        marketValue,
        sellingValue,
        currency,
        currency,
        priceSource,
        req.params.id
      );

      // Determine the source for price history
      let historySource = 'manual';
      if (sources.finnno !== null) {
        historySource = 'finn';
      } else if (sources.pricecharting !== null) {
        historySource = 'pricecharting';
      }

      // Record price history
      recordPriceHistory(req.params.id, marketValue, historySource);

      const updatedGame = statements.getGameById.get(req.params.id);
      res.json({
        game: updatedGame,
        sources
      });
    } else {
      // Even if no price was found, the URLs were saved
      const updatedGame = statements.getGameById.get(req.params.id);
      res.json({
        game: updatedGame,
        sources,
        message: 'Price source URLs saved, but no prices were found'
      });
    }
  } catch (error) {
    console.error('Error saving price sources:', error);
    res.status(500).json({ error: 'Failed to save price sources' });
  }
}

/**
 * Refresh market value from a specific PriceCharting URL
 * Used when user selects from multiple search results
 * @deprecated Use savePriceSources instead
 */
export async function refreshMarketValueFromUrl(req, res) {
  try {
    const game = statements.getGameById.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch price from the specific URL
    const marketData = await getPriceFromUrl(url, game.condition);

    if (marketData.market_value !== null) {
      // Determine price source from URL
      let priceSource = null;
      let historySource = 'manual';
      if (url.includes('pricecharting.com')) {
        priceSource = 'pricecharting';
        historySource = 'pricecharting';
      } else if (url.includes('finn.no')) {
        priceSource = 'finnno';
        historySource = 'finn';
      }

      statements.updateMarketValue.run(
        marketData.market_value,
        marketData.selling_value,
        marketData.currency,
        marketData.currency,
        priceSource,
        req.params.id
      );

      // Record price history
      recordPriceHistory(req.params.id, marketData.market_value, historySource);

      const updatedGame = statements.getGameById.get(req.params.id);
      res.json({
        game: updatedGame
      });
    } else {
      res.status(400).json({ error: 'No price found at the specified URL' });
    }
  } catch (error) {
    console.error('Error refreshing market value from URL:', error);
    res.status(500).json({ error: 'Failed to refresh market value from URL' });
  }
}

/**
 * Batch refresh market values with Server-Sent Events for real-time progress
 */
export async function batchRefreshMarketValuesSSE(req, res) {
  try {
    const { gameIds } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const results = {
      total: gameIds.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    // Helper function to send SSE message
    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial progress
    sendUpdate({
      type: 'start',
      total: gameIds.length
    });

    // Process each game
    for (let i = 0; i < gameIds.length; i++) {
      const id = gameIds[i];

      try {
        const game = statements.getGameById.get(id);

        if (!game) {
          results.failed++;
          const detail = { id, status: 'failed', message: 'Game not found' };
          results.details.push(detail);

          sendUpdate({
            type: 'progress',
            completed: i + 1,
            total: gameIds.length,
            current: null,
            result: detail,
            stats: {
              succeeded: results.succeeded,
              failed: results.failed,
              skipped: results.skipped
            }
          });
          continue;
        }

        // Send progress update with current game info
        sendUpdate({
          type: 'progress',
          completed: i,
          total: gameIds.length,
          current: {
            id: game.id,
            name: game.name,
            platform: game.platform,
            condition: game.condition,
            region: game.region,
            coverUrl: game.igdb_cover_url
          },
          stats: {
            succeeded: results.succeeded,
            failed: results.failed,
            skipped: results.skipped
          }
        });

        // Skip sold games
        if (game.sold_value !== null) {
          results.skipped++;
          const detail = { id, status: 'skipped', message: 'Game is sold', name: game.name };
          results.details.push(detail);

          sendUpdate({
            type: 'progress',
            completed: i + 1,
            total: gameIds.length,
            current: null,
            result: detail,
            stats: {
              succeeded: results.succeeded,
              failed: results.failed,
              skipped: results.skipped
            }
          });
          continue;
        }

        // Only refresh games that have stored price URLs
        // Games without URLs require manual selection via the modal
        if (!game.pricecharting_url && !game.finn_url) {
          results.skipped++;
          const detail = {
            id,
            status: 'skipped',
            message: 'No price source URLs configured. Please refresh individually to select price sources.',
            name: game.name,
            platform: game.platform
          };
          results.details.push(detail);

          sendUpdate({
            type: 'progress',
            completed: i + 1,
            total: gameIds.length,
            current: null,
            result: detail,
            stats: {
              succeeded: results.succeeded,
              failed: results.failed,
              skipped: results.skipped
            }
          });
          continue;
        }

        // Use stored URLs to fetch prices
        let marketValue = null;
        let currency = 'USD';
        let sources = {
          pricecharting: null,
          finnno: null
        };

        // Fetch from stored URLs in parallel
        const fetchPromises = [];
        if (game.pricecharting_url) {
          fetchPromises.push(
            getPriceFromUrl(game.pricecharting_url, game.condition).then(data => ({
              source: 'pricecharting',
              data
            }))
          );
        }
        if (game.finn_url) {
          fetchPromises.push(
            getPriceFromUrl(game.finn_url, game.condition).then(data => ({
              source: 'finnno',
              data
            }))
          );
        }

        const fetchResults = await Promise.all(fetchPromises);

        // Process results
        for (const result of fetchResults) {
          if (result.source === 'pricecharting' && result.data.market_value !== null) {
            sources.pricecharting = result.data.market_value;
          } else if (result.source === 'finnno' && result.data.market_value !== null) {
            sources.finnno = result.data.market_value;
          }
        }

        // Prefer Finn.no if available
        let priceSource = null;
        if (sources.finnno !== null) {
          marketValue = sources.finnno;
          currency = 'NOK';
          priceSource = 'finnno';
        } else if (sources.pricecharting !== null) {
          marketValue = sources.pricecharting;
          currency = 'USD';
          priceSource = 'pricecharting';
        }

        // Only update if we got valid data
        if (marketValue !== null) {
          const sellingValue = Math.round(marketValue * getMarkupMultiplier() * 100) / 100;

          statements.updateMarketValue.run(
            marketValue,
            sellingValue,
            currency,
            currency,
            priceSource,
            id
          );

          // Determine the source for price history
          let source = 'manual';
          if (sources.finnno !== null) {
            source = 'finn';
          } else if (sources.pricecharting !== null) {
            source = 'pricecharting';
          }

          // Record price history
          recordPriceHistory(id, marketValue, source);

          results.succeeded++;
          const detail = {
            id,
            status: 'success',
            name: game.name,
            platform: game.platform,
            oldValue: game.market_value,
            newValue: marketValue,
            currency: currency,
            sources: sources
          };
          results.details.push(detail);

          sendUpdate({
            type: 'progress',
            completed: i + 1,
            total: gameIds.length,
            current: null,
            result: detail,
            stats: {
              succeeded: results.succeeded,
              failed: results.failed,
              skipped: results.skipped
            }
          });
        } else {
          results.failed++;
          const detail = {
            id,
            status: 'failed',
            message: 'No market data found from stored URLs',
            name: game.name,
            platform: game.platform
          };
          results.details.push(detail);

          sendUpdate({
            type: 'progress',
            completed: i + 1,
            total: gameIds.length,
            current: null,
            result: detail,
            stats: {
              succeeded: results.succeeded,
              failed: results.failed,
              skipped: results.skipped
            }
          });
        }
      } catch (error) {
        results.failed++;
        const detail = {
          id,
          status: 'failed',
          message: error.message
        };
        results.details.push(detail);

        sendUpdate({
          type: 'progress',
          completed: i + 1,
          total: gameIds.length,
          current: null,
          result: detail,
          stats: {
            succeeded: results.succeeded,
            failed: results.failed,
            skipped: results.skipped
          }
        });
      }
    }

    // Send completion message
    sendUpdate({
      type: 'complete',
      results
    });

    res.end();
  } catch (error) {
    console.error('Error batch refreshing market values:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}
