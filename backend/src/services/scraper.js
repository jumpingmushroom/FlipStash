import puppeteer from 'puppeteer';
import { getMarkupMultiplier } from './settings.js';

/**
 * Initialize a browser instance with human-like configuration
 */
async function createBrowser() {
  return await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
}

/**
 * Add random delays to simulate human behavior
 */
function randomDelay(min = 1000, max = 3000) {
  return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
}

/**
 * Map region to PriceCharting search prefix
 */
function mapRegionToPriceCharting(region) {
  const regionMap = {
    'PAL': 'PAL',
    'NTSC-J': 'JP',
    'NTSC': '',
    'None': '',
    'Other': ''
  };
  return regionMap[region] || '';
}

/**
 * Map platform + region to PriceCharting console-specific URL
 * Returns the console URL path or null if not mapped
 */
function getPriceChartingConsoleUrl(platform, region) {
  // Normalize platform name for mapping
  const platformLower = platform.toLowerCase();

  // Check if this is a PAL region - use PAL-specific URLs
  const isPAL = region === 'PAL';
  const isJP = region === 'NTSC-J';

  // Platform to URL mapping
  // PAL versions
  if (isPAL) {
    if (platformLower.includes('nintendo switch')) return '/console/pal-nintendo-switch';
    if (platformLower.includes('wii u')) return '/console/pal-wii-u';
    if (platformLower.includes('wii') && !platformLower.includes('wii u')) return '/console/pal-wii';
    if (platformLower.includes('gamecube')) return '/console/pal-gamecube';
    if (platformLower.includes('nintendo 64') || platformLower === 'n64') return '/console/pal-nintendo-64';
    if (platformLower.includes('snes') || platformLower.includes('super nintendo')) return '/console/pal-super-nintendo';
    if (platformLower.includes('nes') && !platformLower.includes('snes')) return '/console/pal-nes';
    if (platformLower.includes('3ds')) return '/console/pal-nintendo-3ds';
    if (platformLower.includes('nintendo ds') || platformLower === 'ds') return '/console/pal-nintendo-ds';
    if (platformLower.includes('game boy advance') || platformLower === 'gba') return '/console/pal-gameboy-advance';
    if (platformLower.includes('game boy color') || platformLower === 'gbc') return '/console/pal-gameboy-color';
    if (platformLower.includes('game boy') && !platformLower.includes('advance') && !platformLower.includes('color')) return '/console/pal-gameboy';
    if (platformLower.includes('playstation 5') || platformLower === 'ps5') return '/console/pal-playstation-5';
    if (platformLower.includes('playstation 4') || platformLower === 'ps4') return '/console/pal-playstation-4';
    if (platformLower.includes('playstation 3') || platformLower === 'ps3') return '/console/pal-playstation-3';
    if (platformLower.includes('playstation 2') || platformLower === 'ps2') return '/console/pal-playstation-2';
    if (platformLower.includes('playstation 1') || platformLower === 'ps1' || (platformLower.includes('playstation') && !platformLower.match(/[2-5]/))) return '/console/pal-playstation';
    if (platformLower.includes('psp')) return '/console/pal-psp';
    if (platformLower.includes('ps vita') || platformLower.includes('playstation vita')) return '/console/pal-vita';
    if (platformLower.includes('xbox series')) return '/console/pal-xbox-series-x';
    if (platformLower.includes('xbox one')) return '/console/pal-xbox-one';
    if (platformLower.includes('xbox 360')) return '/console/pal-xbox-360';
    if (platformLower.includes('xbox') && !platformLower.includes('360') && !platformLower.includes('one') && !platformLower.includes('series')) return '/console/pal-xbox';
    if (platformLower.includes('sega genesis') || platformLower.includes('mega drive')) return '/console/pal-sega-genesis';
    if (platformLower.includes('dreamcast')) return '/console/pal-dreamcast';
    if (platformLower.includes('saturn')) return '/console/pal-saturn';
    if (platformLower.includes('master system') || platformLower.includes('sega master system')) return '/console/pal-sega-master-system';
  }

  // Japanese versions
  if (isJP) {
    if (platformLower.includes('playstation 5') || platformLower === 'ps5') return '/console/jp-playstation-5';
    if (platformLower.includes('playstation 4') || platformLower === 'ps4') return '/console/jp-playstation-4';
    if (platformLower.includes('playstation 3') || platformLower === 'ps3') return '/console/jp-playstation-3';
    if (platformLower.includes('playstation 2') || platformLower === 'ps2') return '/console/jp-playstation-2';
    if (platformLower.includes('playstation 1') || platformLower === 'ps1' || (platformLower.includes('playstation') && !platformLower.match(/[2-5]/))) return '/console/jp-playstation';
    if (platformLower.includes('nintendo switch')) return '/console/jp-nintendo-switch';
    if (platformLower.includes('wii u')) return '/console/jp-wii-u';
    if (platformLower.includes('wii') && !platformLower.includes('wii u')) return '/console/jp-wii';
    if (platformLower.includes('gamecube')) return '/console/jp-gamecube';
    if (platformLower.includes('nintendo 64') || platformLower === 'n64') return '/console/jp-nintendo-64';
    if (platformLower.includes('super famicom') || (platformLower.includes('snes') || platformLower.includes('super nintendo'))) return '/console/jp-super-famicom';
    if (platformLower.includes('famicom') || (platformLower.includes('nes') && !platformLower.includes('snes'))) return '/console/jp-famicom';
    if (platformLower.includes('master system') || platformLower.includes('sega master system')) return '/console/jp-sega-master-system';
  }

  // NTSC/US versions and region-neutral platforms
  if (platformLower.includes('nintendo switch')) return '/console/nintendo-switch';
  if (platformLower.includes('wii u')) return '/console/wii-u';
  if (platformLower.includes('wii') && !platformLower.includes('wii u')) return '/console/wii';
  if (platformLower.includes('gamecube')) return '/console/gamecube';
  if (platformLower.includes('nintendo 64') || platformLower === 'n64') return '/console/nintendo-64';
  if (platformLower.includes('snes') || platformLower.includes('super nintendo')) return '/console/super-nintendo';
  if (platformLower.includes('nes') && !platformLower.includes('snes')) return '/console/nes';
  if (platformLower.includes('3ds')) return '/console/nintendo-3ds';
  if (platformLower.includes('nintendo ds') || platformLower === 'ds') return '/console/nintendo-ds';
  if (platformLower.includes('game boy advance') || platformLower === 'gba') return '/console/gameboy-advance';
  if (platformLower.includes('game boy color') || platformLower === 'gbc') return '/console/gameboy-color';
  if (platformLower.includes('game boy') && !platformLower.includes('advance') && !platformLower.includes('color')) return '/console/gameboy';
  if (platformLower.includes('playstation 5') || platformLower === 'ps5') return '/console/playstation-5';
  if (platformLower.includes('playstation 4') || platformLower === 'ps4') return '/console/playstation-4';
  if (platformLower.includes('playstation 3') || platformLower === 'ps3') return '/console/playstation-3';
  if (platformLower.includes('playstation 2') || platformLower === 'ps2') return '/console/playstation-2';
  if (platformLower.includes('playstation 1') || platformLower === 'ps1' || (platformLower.includes('playstation') && !platformLower.match(/[2-5]/))) return '/console/playstation';
  if (platformLower.includes('psp')) return '/console/psp';
  if (platformLower.includes('ps vita') || platformLower.includes('playstation vita')) return '/console/vita';
  if (platformLower.includes('xbox series')) return '/console/xbox-series-x';
  if (platformLower.includes('xbox one')) return '/console/xbox-one';
  if (platformLower.includes('xbox 360')) return '/console/xbox-360';
  if (platformLower.includes('xbox') && !platformLower.includes('360') && !platformLower.includes('one') && !platformLower.includes('series')) return '/console/xbox';
  if (platformLower.includes('sega genesis') || platformLower.includes('mega drive')) return '/console/sega-genesis';
  if (platformLower.includes('dreamcast')) return '/console/dreamcast';
  if (platformLower.includes('saturn')) return '/console/sega-saturn';
  if (platformLower.includes('master system') || platformLower.includes('sega master system')) return '/console/sega-master-system';
  if (platformLower === 'pc' || platformLower.includes('windows') || platformLower.includes('mac') || platformLower.includes('linux')) return '/console/pc-games';

  // Return null if no mapping found - will trigger fallback to general search
  return null;
}

/**
 * Convert game name to PriceCharting URL slug
 * Examples: "Mario Kart 8" -> "mario-kart-8", "The Legend of Zelda: Breath of the Wild" -> "legend-of-zelda-breath-of-wild"
 */
function generateGameSlug(gameName) {
  return gameName
    .toLowerCase()
    .replace(/&/g, 'and') // Replace & with "and"
    .replace(/:/g, '') // Remove colons
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\./g, '') // Remove periods
    .replace(/!/g, '') // Remove exclamation marks
    .replace(/\?/g, '') // Remove question marks
    .replace(/,/g, '') // Remove commas
    .replace(/\(/g, '') // Remove opening parentheses
    .replace(/\)/g, '') // Remove closing parentheses
    .replace(/\[/g, '') // Remove opening brackets
    .replace(/\]/g, '') // Remove closing brackets
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, '') // Remove any remaining special characters
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .replace(/^the-/g, ''); // Remove leading "the-" (PriceCharting often omits "The")
}

/**
 * Map condition to PriceCharting column name
 */
function mapConditionToPriceCharting(condition) {
  const conditionMap = {
    'Sealed': 'New',
    'CIB (Complete in Box)': 'Complete',
    'Loose': 'Loose',
    'Box Only': 'Box Only',
    'Manual Only': 'Manual Only'
  };
  return conditionMap[condition] || 'Complete'; // Default to Complete if no condition
}

/**
 * Parse search results from PriceCharting search page
 * @param {Object} page - Puppeteer page object already on search results
 * @param {string} condition - Game condition to extract the matching price column
 * @returns {Array} - Array of search results with name, platform, url, and preview price
 */
async function parsePriceChartingSearchResults(page, condition = 'CIB (Complete in Box)') {
  // Map condition to PriceCharting column header
  const conditionMap = {
    'Sealed': 'New',
    'CIB (Complete in Box)': 'Complete',
    'Loose': 'Loose',
    'Box Only': 'Box Only',
    'Manual Only': 'Manual Only'
  };
  const targetCondition = conditionMap[condition] || 'Complete';

  return await page.evaluate((targetCondition) => {
    // Try specific table selectors first
    let table = document.querySelector('table.table.table-striped, table#games_table');

    // If not found, look for any table with game links
    if (!table) {
      const tables = document.querySelectorAll('table');
      for (const t of tables) {
        const gameLinks = t.querySelectorAll('a[href*="/game/"]');
        if (gameLinks.length > 0) {
          table = t;
          break;
        }
      }
    }

    if (!table) {
      console.log('No table with game results found');
      return [];
    }

    console.log('Found results table');

    // Find which column index corresponds to the target condition
    const headerRow = table.querySelector('thead tr');
    const headers = headerRow ? Array.from(headerRow.querySelectorAll('th, td')) : [];

    let priceColumnIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i].textContent.trim();
      if (headerText.includes(targetCondition)) {
        priceColumnIndex = i;
        break;
      }
    }

    // If we couldn't find the specific condition, try to find any price column
    if (priceColumnIndex === -1) {
      for (let i = 2; i < headers.length; i++) {
        const headerText = headers[i].textContent.trim().toLowerCase();
        if (headerText.includes('price') || headerText.includes('loose') || headerText.includes('complete')) {
          priceColumnIndex = i;
          break;
        }
      }
    }

    // Get table body rows - try tbody first, fallback to all tr elements
    let rows = table.querySelectorAll('tbody tr');
    if (rows.length === 0) {
      rows = table.querySelectorAll('tr');
    }

    console.log(`Found ${rows.length} rows in table`);
    const results = [];

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 2) continue;

      // First column (cells[0]) = Title with game name and variant info
      // Second column (cells[1]) = Set/Platform
      const titleCell = cells[0];
      const setCell = cells[1];

      const link = titleCell.querySelector('a[href*="/game/"]');
      if (!link) continue;

      // Extract the game title from the link in the Title column
      const gameTitle = link.textContent.trim();
      const url = link.href;

      // Extract the platform/set from the Set column
      const platform = setCell.textContent.trim();

      // Get the price from the matched condition column
      let previewPrice = null;
      if (priceColumnIndex !== -1 && cells[priceColumnIndex]) {
        const cellText = cells[priceColumnIndex].textContent.trim();
        const priceMatch = cellText.match(/\$([0-9,]+\.?[0-9]*)/);
        if (priceMatch) {
          previewPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }

      // Store game title and platform separately - no parentheses
      results.push({
        name: gameTitle,
        platform,
        url,
        previewPrice
      });
    }

    return results;
  }, targetCondition);
}

/**
 * Scrape price from a specific PriceCharting URL
 * @param {string} url - Direct URL to game page
 * @param {string} condition - Game condition (Sealed, CIB, Loose, Box Only, Manual Only)
 * @returns {number|null} - Price in USD or null if not found
 */
async function scrapePriceChartingFromUrl(url, condition = 'CIB (Complete in Box)') {
  let browser;
  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    console.log(`Scraping PriceCharting from URL: ${url}`);

    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    if (!response || response.status() === 404) {
      console.log('URL returned 404');
      return null;
    }

    await randomDelay(1000, 2000);

    const targetCondition = mapConditionToPriceCharting(condition);
    console.log(`Looking for condition: ${targetCondition}`);

    const price = await page.evaluate((targetCondition) => {
      const table = document.querySelector('table#games_table, table.prices, table.price_table, div.price-table table, table[id*="price"]');

      if (!table) {
        console.log('Price table not found');
        return null;
      }

      const headerRow = table.querySelector('thead tr, tr:first-child');
      if (!headerRow) {
        console.log('Header row not found');
        return null;
      }

      const headers = Array.from(headerRow.querySelectorAll('th, td'));
      let targetColumnIndex = -1;

      for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].textContent.trim();
        if (headerText.includes(targetCondition)) {
          targetColumnIndex = i;
          break;
        }
      }

      if (targetColumnIndex === -1) {
        for (let i = 0; i < headers.length; i++) {
          const headerText = headers[i].textContent.trim().toLowerCase();
          if (headerText.includes('price') || headerText.includes('value')) {
            targetColumnIndex = i;
            break;
          }
        }
      }

      if (targetColumnIndex === -1) {
        return null;
      }

      const dataRows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'));

      for (const row of dataRows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length > targetColumnIndex) {
          const priceCell = cells[targetColumnIndex];
          const priceText = priceCell?.textContent.trim() || '';
          const match = priceText.match(/\$([0-9,]+\.?[0-9]*)/);

          if (match) {
            return parseFloat(match[1].replace(/,/g, ''));
          }
        }
      }

      return null;
    }, targetCondition);

    return price;
  } catch (error) {
    console.error('PriceCharting URL scraping error:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Fallback: Scrape price from PriceCharting.com using general search
 * This is used when platform-specific URL is not available or fails
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @param {string} condition - Game condition (Sealed, CIB, Loose, Box Only, Manual Only)
 * @param {string} region - Game region (PAL, NTSC, NTSC-J, None, Other)
 * @param {boolean} returnMultipleResults - If true, return all search results instead of auto-clicking
 * @returns {number|null|Array} - Price in USD, null if not found, or array of results if returnMultipleResults is true
 */
async function scrapePriceChartingGeneralSearch(gameName, platform, condition = 'CIB (Complete in Box)', region = 'PAL', returnMultipleResults = false) {
  let browser;
  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Enable JavaScript and set extra headers
    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Build search query with region prefix
    const regionPrefix = mapRegionToPriceCharting(region);
    const searchQuery = regionPrefix ? `${regionPrefix} ${gameName} ${platform}` : `${gameName} ${platform}`;

    console.log(`PriceCharting general search query: "${searchQuery}"`);

    // Navigate to PriceCharting
    await page.goto('https://www.pricecharting.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    await randomDelay(1000, 2000);

    // Search for the game
    await page.type('input[name="q"]', searchQuery, { delay: 100 });
    await randomDelay(500, 1000);

    // Submit search
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    await randomDelay(1000, 2000);

    // Log current URL for debugging
    const currentUrl = page.url();
    console.log(`Landed on URL: ${currentUrl}`);

    // Check if we're on a search results page - try multiple selectors
    const isSearchResults = await page.evaluate(() => {
      // Try specific table selectors first
      let searchTable = document.querySelector('table.table.table-striped, table#games_table');

      // If not found, try more generic table selectors
      if (!searchTable) {
        // Look for any table that has game links
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
          const gameLinks = table.querySelectorAll('a[href*="/game/"]');
          if (gameLinks.length > 0) {
            searchTable = table;
            break;
          }
        }
      }

      return searchTable !== null;
    });

    console.log(`On search results page: ${isSearchResults}`);

    if (isSearchResults) {
      // If returnMultipleResults is true, parse and return all results
      if (returnMultipleResults) {
        console.log('Returning multiple search results for user selection');
        const results = await parsePriceChartingSearchResults(page, condition);
        await browser.close();
        return results;
      }

      // Click on the first result that matches our platform AND region
      const clickedResult = await page.evaluate((regionPrefix, platformName) => {
        // Find the results table
        let table = document.querySelector('table.table.table-striped, table#games_table');
        if (!table) {
          const tables = document.querySelectorAll('table');
          for (const t of tables) {
            const gameLinks = t.querySelectorAll('a[href*="/game/"]');
            if (gameLinks.length > 0) {
              table = t;
              break;
            }
          }
        }

        if (!table) {
          console.log('No table found for clicking results');
          return false;
        }

        // Get rows from the table
        let rows = table.querySelectorAll('tbody tr');
        if (rows.length === 0) {
          rows = table.querySelectorAll('tr');
        }

        // Normalize platform name for matching
        const platformKeywords = platformName.toLowerCase().split(' ').filter(word =>
          !['the', 'a', 'an'].includes(word)
        );

        console.log(`Looking for platform: ${platformName}, region: ${regionPrefix}`);

        for (const row of rows) {
          const link = row.querySelector('a[href*="/game/"]');
          if (!link) continue;

          const rowText = row.textContent.toLowerCase();
          const href = link.href.toLowerCase();

          console.log(`Checking row: ${rowText.substring(0, 100)}, href: ${href}`);

          // First, check if platform matches
          let platformMatches = false;

          // Check if any platform keyword is in the row text or href
          for (const keyword of platformKeywords) {
            if (rowText.includes(keyword) || href.includes(keyword)) {
              platformMatches = true;
              break;
            }
          }

          if (!platformMatches) {
            console.log(`Platform mismatch, skipping`);
            continue;
          }

          // If platform matches, now check region
          if (regionPrefix) {
            const regionLower = regionPrefix.toLowerCase();
            if (regionPrefix === 'PAL' && (href.includes('pal') || rowText.includes('pal'))) {
              console.log(`Found match with PAL region and correct platform`);
              link.click();
              return true;
            }
            if (regionPrefix === 'JP' && (href.includes('jp-') || rowText.includes('japan') || rowText.includes('jp '))) {
              console.log(`Found match with JP region and correct platform`);
              link.click();
              return true;
            }
            // If no specific region in URL/text, but platform matches and we're looking for NTSC (default)
            if (!regionPrefix || regionPrefix === '') {
              if (!href.includes('pal') && !href.includes('jp-')) {
                console.log(`Found match with NTSC (default) region and correct platform`);
                link.click();
                return true;
              }
            }
          } else {
            // No region preference, just match platform
            console.log(`Found match with correct platform (no region specified)`);
            link.click();
            return true;
          }
        }

        console.log('No match found with platform+region filters, trying first result');
        // If no region match found, click the first result anyway as last resort
        if (table) {
          const firstLink = table.querySelector('a[href*="/game/"]');
          if (firstLink) {
            firstLink.click();
            return true;
          }
        }

        return false;
      }, regionPrefix, platform);

      if (clickedResult) {
        console.log('Clicked on search result, waiting for navigation...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        await randomDelay(1000, 2000);
      } else {
        console.log('No search results found to click');
        return null;
      }
    }

    // Map condition to column name
    const targetCondition = mapConditionToPriceCharting(condition);
    console.log(`Looking for condition: ${targetCondition}`);

    // Try to find price based on condition
    const price = await page.evaluate((targetCondition) => {
      const table = document.querySelector('table#games_table, table.prices, table.price_table, div.price-table table, table[id*="price"]');

      if (!table) {
        console.log('Price table not found');
        return null;
      }

      console.log('Found price table');

      const headerRow = table.querySelector('thead tr, tr:first-child');
      if (!headerRow) {
        console.log('Header row not found');
        return null;
      }

      const headers = Array.from(headerRow.querySelectorAll('th, td'));
      let targetColumnIndex = -1;

      console.log('Headers found:', headers.map(h => h.textContent.trim()));

      for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].textContent.trim();
        if (headerText.includes(targetCondition)) {
          targetColumnIndex = i;
          console.log(`Found ${targetCondition} at column ${i}`);
          break;
        }
      }

      if (targetColumnIndex === -1) {
        console.log(`Column for ${targetCondition} not found`);
        for (let i = 0; i < headers.length; i++) {
          const headerText = headers[i].textContent.trim().toLowerCase();
          if (headerText.includes('price') || headerText.includes('value')) {
            targetColumnIndex = i;
            console.log(`Using fallback price column at index ${i}: ${headers[i].textContent.trim()}`);
            break;
          }
        }
      }

      if (targetColumnIndex === -1) {
        console.log('No price column found');
        return null;
      }

      const dataRows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'));
      console.log(`Found ${dataRows.length} data rows`);

      for (const row of dataRows) {
        const cells = Array.from(row.querySelectorAll('td'));

        if (cells.length > targetColumnIndex) {
          const priceCell = cells[targetColumnIndex];
          const priceText = priceCell?.textContent.trim() || '';
          console.log(`Checking row, price text: "${priceText}"`);

          const match = priceText.match(/\$([0-9,]+\.?[0-9]*)/);

          if (match) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            console.log(`Found price: $${match[1]} (${price})`);
            return price;
          }
        }
      }

      console.log('No price found in any row');
      return null;
    }, targetCondition);

    return price;
  } catch (error) {
    console.error('PriceCharting general search error:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape price from PriceCharting.com using direct game URL
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @param {string} condition - Game condition (Sealed, CIB, Loose, Box Only, Manual Only)
 * @param {string} region - Game region (PAL, NTSC, NTSC-J, None, Other)
 * @param {boolean} returnMultipleResults - If true, return all search results instead of auto-selecting
 * @returns {number|null|Array} - Price in USD, null if not found, or array of results if returnMultipleResults is true
 */
async function scrapePriceCharting(gameName, platform, condition = 'CIB (Complete in Box)', region = 'PAL', returnMultipleResults = false) {
  let browser;
  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Enable JavaScript and set extra headers
    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Get console URL slug
    const consoleSlug = getPriceChartingConsoleUrl(platform, region);

    if (!consoleSlug) {
      console.log(`PriceCharting: No console mapping for ${platform} (${region}), using general search fallback`);
      await browser.close();
      return await scrapePriceChartingGeneralSearch(gameName, platform, condition, region, returnMultipleResults);
    }

    // Generate game slug from game name
    const gameSlug = generateGameSlug(gameName);

    // Remove leading slash from consoleSlug to get just the slug part
    const consoleSlugClean = consoleSlug.replace('/console/', '');

    // Build direct game URL
    const directGameUrl = `https://www.pricecharting.com/game/${consoleSlugClean}/${gameSlug}`;

    console.log(`PriceCharting: Trying direct URL: ${directGameUrl}`);

    // Try to navigate to direct game URL
    const response = await page.goto(directGameUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await randomDelay(1000, 2000);

    // Check if we got a 404 or invalid page
    if (!response || response.status() === 404) {
      console.log(`PriceCharting: Direct URL returned 404, falling back to search`);
      await browser.close();
      return await scrapePriceChartingGeneralSearch(gameName, platform, condition, region, returnMultipleResults);
    }

    // Check if we're on a search results page instead of a game page
    const isSearchResultsPage = await page.evaluate(() => {
      const searchTable = document.querySelector('table.table.table-striped, table#games_table');
      // Check if it's a search results page (has multiple game links)
      if (searchTable) {
        const gameLinks = searchTable.querySelectorAll('a[href*="/game/"]');
        return gameLinks.length > 1;
      }
      return false;
    });

    // If we landed on search results and returnMultipleResults is true, parse them
    if (isSearchResultsPage && returnMultipleResults) {
      console.log('Landed on search results page, returning multiple results');
      const results = await parsePriceChartingSearchResults(page, condition);
      await browser.close();
      return results;
    }

    // Check if we actually landed on a game page (not a 404 or error page)
    const isGamePage = await page.evaluate(() => {
      // Game pages have a price table
      const table = document.querySelector('table#games_table, table.prices, table.price_table, div.price-table table, table[id*="price"]');
      return table !== null;
    });

    if (!isGamePage) {
      console.log(`PriceCharting: Not a valid game page, falling back to search`);
      await browser.close();
      return await scrapePriceChartingGeneralSearch(gameName, platform, condition, region, returnMultipleResults);
    }

    console.log(`PriceCharting: Successfully loaded game page via direct URL`);

    // Map condition to column name
    const targetCondition = mapConditionToPriceCharting(condition);
    console.log(`Looking for condition: ${targetCondition}`);

    // Try to find price based on condition
    const price = await page.evaluate((targetCondition) => {
      // Try multiple selectors for the price table
      const table = document.querySelector('table#games_table, table.prices, table.price_table, div.price-table table, table[id*="price"]');

      if (!table) {
        console.log('Price table not found');
        return null;
      }

      console.log('Found price table');

      // Find the header row to locate the correct column
      const headerRow = table.querySelector('thead tr, tr:first-child');
      if (!headerRow) {
        console.log('Header row not found');
        return null;
      }

      const headers = Array.from(headerRow.querySelectorAll('th, td'));
      let targetColumnIndex = -1;

      console.log('Headers found:', headers.map(h => h.textContent.trim()));

      // Find the column index for the target condition
      for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].textContent.trim();
        if (headerText.includes(targetCondition)) {
          targetColumnIndex = i;
          console.log(`Found ${targetCondition} at column ${i}`);
          break;
        }
      }

      if (targetColumnIndex === -1) {
        console.log(`Column for ${targetCondition} not found`);
        // Try to find any price column as fallback
        for (let i = 0; i < headers.length; i++) {
          const headerText = headers[i].textContent.trim().toLowerCase();
          if (headerText.includes('price') || headerText.includes('value')) {
            targetColumnIndex = i;
            console.log(`Using fallback price column at index ${i}: ${headers[i].textContent.trim()}`);
            break;
          }
        }
      }

      if (targetColumnIndex === -1) {
        console.log('No price column found');
        return null;
      }

      // Find the first data row
      const dataRows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'));
      console.log(`Found ${dataRows.length} data rows`);

      for (const row of dataRows) {
        const cells = Array.from(row.querySelectorAll('td'));

        if (cells.length > targetColumnIndex) {
          // Extract price from the target column
          const priceCell = cells[targetColumnIndex];
          const priceText = priceCell?.textContent.trim() || '';
          console.log(`Checking row, price text: "${priceText}"`);

          const match = priceText.match(/\$([0-9,]+\.?[0-9]*)/);

          if (match) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            console.log(`Found price: $${match[1]} (${price})`);
            return price;
          }
        }
      }

      console.log('No price found in any row');
      return null;
    }, targetCondition);

    // If returnMultipleResults is true, return as an array with single result
    if (returnMultipleResults) {
      const currentUrl = page.url();

      await browser.close();

      if (price !== null) {
        // Extract both platform and game name from URL - more reliable than page scraping
        // URL format: /game/{platform-slug}/{game-name-slug}
        // Example: /game/pal-playstation-4/god-of-war
        const urlParts = currentUrl.split('/');
        let extractedPlatform = '';
        let extractedGameName = '';

        if (urlParts.length >= 6) {
          // Platform is at index 4, game name at index 5
          // ['https:', '', 'www.pricecharting.com', 'game', 'pal-playstation-4', 'god-of-war']

          if (urlParts[4]) {
            const platformSlug = urlParts[4];
            // Convert slug to readable format: "pal-playstation-4" -> "Pal Playstation 4"
            extractedPlatform = platformSlug
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }

          if (urlParts[5]) {
            const gameNameSlug = urlParts[5];
            // Convert slug to readable format: "god-of-war" -> "God Of War"
            extractedGameName = gameNameSlug
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }
        }

        const finalPlatform = extractedPlatform || platform;
        const finalGameName = extractedGameName || gameName;

        // Return game name and platform separately - no parentheses
        return [{
          name: finalGameName,
          platform: finalPlatform,
          url: currentUrl,
          previewPrice: price
        }];
      } else {
        // No price found, return empty array
        return [];
      }
    }

    return price;
  } catch (error) {
    console.error('PriceCharting scraping error:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Parse search results from Finn.no search page
 * @param {Object} page - Puppeteer page object already on search results
 * @returns {Array} - Array of search results with title, price, and url
 */
async function parseFinnNoSearchResults(page) {
  return await page.evaluate(() => {
    const results = [];

    // Try to find ad containers - expanded selector list to handle Finn.no changes
    const selectors = [
      'article[data-testid*="ad"]',
      'article[class*="Ad"]',
      'article',  // Try all articles if specific ones don't work
      'div[class*="Result"]',
      'div[data-testid*="result"]',
      '.ads__unit',
      '[class*="SearchResult"]',
      '[data-testid*="search-result"]'
    ];

    let adElements = [];
    for (const selector of selectors) {
      adElements = document.querySelectorAll(selector);
      console.log(`Trying selector "${selector}": found ${adElements.length} elements`);

      // Filter to only elements that contain both a link and a price
      const validElements = Array.from(adElements).filter(el => {
        const hasLink = el.querySelector('a[href*="/recommerce/"]') || el.querySelector('a[href]');
        const hasPrice = el.textContent.match(/\d+\s*kr/i);
        return hasLink && hasPrice;
      });

      if (validElements.length > 0) {
        console.log(`Found ${validElements.length} valid ad elements with selector "${selector}"`);
        adElements = validElements;
        break;
      }
    }

    if (adElements.length === 0) {
      console.log('No ad elements found with any selector');
      // Debug: log the page structure
      console.log('Page title:', document.title);
      console.log('Body classes:', document.body?.className);
      const allArticles = document.querySelectorAll('article');
      console.log('Total articles on page:', allArticles.length);
      return [];
    }

    for (const ad of adElements) {
      try {
        // Get title - prioritize heading tags first, then title classes
        let title = null;
        const titleSelectors = [
          'h2', 'h3', 'h1',
          '[class*="heading"]',
          '[class*="title"]',
          '[class*="Title"]',
          '[data-testid*="title"]',
          'a[class*="link"]',
          'a[href]'  // Fallback to any link
        ];

        for (const selector of titleSelectors) {
          const titleEl = ad.querySelector(selector);
          if (titleEl && titleEl.textContent.trim()) {
            title = titleEl.textContent.trim();
            break;
          }
        }

        // Get price - more comprehensive search
        let price = null;
        const priceSelectors = [
          '[class*="price"]',
          '[class*="Price"]',
          '[data-testid*="price"]',
          'span', // Sometimes prices are in plain spans
          'div'   // Or plain divs
        ];

        for (const selector of priceSelectors) {
          const priceElements = ad.querySelectorAll(selector);
          for (const priceEl of priceElements) {
            const text = priceEl.textContent.trim();
            const match = text.match(/([0-9\s]+)\s*kr/i);
            if (match) {
              price = parseFloat(match[1].replace(/\s/g, ''));
              if (price > 0 && price < 100000) {
                break;
              }
            }
          }
          if (price) break;
        }

        // Get URL
        let url = null;
        const linkEl = ad.querySelector('a[href*="/recommerce/"]') || ad.querySelector('a[href]');
        if (linkEl) {
          url = linkEl.href;
        }

        // Only add if we have at least title and price
        if (title && price && price > 0 && price < 100000) {
          console.log(`Found listing: "${title}" - ${price} kr`);
          results.push({
            name: title,
            price: price,
            url: url
          });
        }
      } catch (error) {
        console.log('Error parsing Finn.no ad:', error.message);
      }
    }

    console.log(`Total valid listings parsed: ${results.length}`);
    return results;
  });
}

/**
 * Filter out bundle/collection listings from Finn.no results
 * @param {Array} results - Array of search results with name and price
 * @param {string} gameName - The specific game name we're looking for
 * @returns {Array} - Filtered results containing only individual game listings
 */
function filterBundleListings(results, gameName) {
  // Keywords that indicate a bundle/collection listing
  const bundleKeywords = [
    'til salgs',
    'til sals',
    'pakke',
    'bundle',
    'samling',
    'collection',
    'spill ',
    ' spill',
    'flere',
    'mixed',
    'diverse'
  ];

  return results.filter(result => {
    const titleLower = result.name.toLowerCase();

    // Check if title contains bundle keywords
    for (const keyword of bundleKeywords) {
      if (titleLower.includes(keyword)) {
        console.log(`Filtering out bundle listing: "${result.name}"`);
        return false;
      }
    }

    // Check if the listing title is suspiciously short (likely "Til salgs" or similar)
    if (result.name.length < 10) {
      console.log(`Filtering out short title: "${result.name}"`);
      return false;
    }

    // Check if the title contains the game name (fuzzy match)
    // Split game name into significant words (remove "the", "of", etc.)
    const gameWords = gameName.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !['the', 'of', 'and', 'for', 'with'].includes(word));

    // At least one significant word from the game name should be in the title
    const hasGameName = gameWords.some(word => titleLower.includes(word));

    if (!hasGameName && gameWords.length > 0) {
      console.log(`Filtering out unrelated listing: "${result.name}"`);
      return false;
    }

    return true;
  });
}

/**
 * Calculate median from an array of numbers
 * @param {Array} numbers - Array of numbers
 * @returns {number} - Median value
 */
function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // Even number of elements - average the two middle values
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    // Odd number of elements - return the middle value
    return sorted[middle];
  }
}

/**
 * Scrape price from Finn.no (Norwegian marketplace)
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @param {boolean} returnMultipleResults - If true, return array of search results instead of median
 * @returns {number|null|Array} - Median price in NOK, null if not found, or array of results if returnMultipleResults is true
 */
async function scrapeFinnNo(gameName, platform, returnMultipleResults = false) {
  let browser;
  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,nn;q=0.7,en-US;q=0.6,en;q=0.5',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Navigate to Finn.no recommerce games category
    const searchQuery = encodeURIComponent(`${gameName} ${platform}`);
    const finnUrl = `https://www.finn.no/recommerce/forsale/search?product_category=2.93.3905.64&q=${searchQuery}`;

    console.log(`Finn.no URL: ${finnUrl}`);

    // Use 'domcontentloaded' instead of 'networkidle2' for faster, more reliable page loads
    // networkidle2 can timeout on pages with continuous background requests
    await page.goto(finnUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000  // Increased to 60 seconds for slow-loading pages
    });

    // Wait for the page to be fully rendered
    await randomDelay(3000, 4000);  // Slightly longer delay to ensure JS has rendered the ads

    // Always parse results properly using the parseFinnNoSearchResults function
    console.log('Parsing Finn.no search results...');
    const allResults = await parseFinnNoSearchResults(page);
    console.log(`Finn.no found ${allResults.length} total listings`);

    // Filter out bundles and collections
    const filteredResults = filterBundleListings(allResults, gameName);
    console.log(`After filtering: ${filteredResults.length} individual game listings`);

    await browser.close();

    // If returnMultipleResults is true, return filtered results for user selection
    if (returnMultipleResults) {
      console.log('Returning filtered Finn.no search results for user selection');
      return filteredResults;
    }

    // Extract prices from filtered results
    const prices = filteredResults
      .map(result => result.price)
      .filter(price => price !== null && price > 0);

    console.log(`Finn.no prices after filtering:`, prices);

    if (prices.length === 0) {
      return null;
    }

    // Calculate median price (more robust than average)
    const median = calculateMedian(prices);
    console.log(`Finn.no median price: ${median} kr (from ${prices.length} listings)`);

    return Math.round(median);
  } catch (error) {
    console.error('Finn.no scraping error:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Get market value from multiple sources
 * Priority: Finn.no (NOK) over PriceCharting (USD) to avoid mixing currencies
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @param {string} condition - Game condition (Sealed, CIB, Loose, Box Only, Manual Only)
 * @param {string} region - Game region (PAL, NTSC, NTSC-J, None, Other)
 * @param {boolean} returnMultipleResults - If true, return search results from both sources for user selection
 * @returns {Object} - Object with market_value, selling_value, and currency, or multipleResults object
 */
export async function getMarketValue(gameName, platform, condition = 'CIB (Complete in Box)', region = 'PAL', returnMultipleResults = false) {
  console.log(`Fetching market value for: ${gameName} (${platform}) - Condition: ${condition}, Region: ${region}`);

  // If returnMultipleResults is true, query both sources for search results
  if (returnMultipleResults) {
    const [priceChartingResults, finnNoResults] = await Promise.all([
      scrapePriceCharting(gameName, platform, condition, region, true),
      scrapeFinnNo(gameName, platform, true)
    ]);

    // Return both result sets for user selection
    return {
      multipleResults: {
        pricecharting: Array.isArray(priceChartingResults) ? priceChartingResults : [],
        finnno: Array.isArray(finnNoResults) ? finnNoResults : []
      }
    };
  }

  // Run both scrapers in parallel
  const [priceChartingPrice, finnNoPrice] = await Promise.all([
    scrapePriceCharting(gameName, platform, condition, region, false),
    scrapeFinnNo(gameName, platform, false)
  ]);

  console.log('PriceCharting price (USD):', priceChartingPrice);
  console.log('Finn.no price (NOK):', finnNoPrice);

  // Determine which source to use and the currency
  let marketValue = null;
  let currency = 'USD';

  // Prefer Finn.no (NOK) if available, otherwise use PriceCharting (USD)
  if (finnNoPrice !== null) {
    marketValue = finnNoPrice;
    currency = 'NOK';
    console.log('Using Finn.no price (NOK)');
  } else if (priceChartingPrice !== null) {
    marketValue = priceChartingPrice;
    currency = 'USD';
    console.log('Using PriceCharting price (USD)');
  }

  if (marketValue === null) {
    return {
      market_value: null,
      selling_value: null,
      currency: 'USD',
      sources: {
        pricecharting: priceChartingPrice,
        finnno: finnNoPrice
      }
    };
  }

  // Calculate selling value (market value + 10%)
  const sellingValue = Math.round(marketValue * getMarkupMultiplier() * 100) / 100;

  return {
    market_value: Math.round(marketValue * 100) / 100,
    selling_value: sellingValue,
    currency: currency,
    sources: {
      pricecharting: priceChartingPrice,
      finnno: finnNoPrice
    }
  };
}

/**
 * Scrape price from a specific Finn.no URL
 * @param {string} url - Direct URL to Finn.no ad
 * @returns {number|null} - Price in NOK or null if not found
 */
async function scrapeFinnNoFromUrl(url) {
  let browser;
  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,nn;q=0.7,en-US;q=0.6,en;q=0.5',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    console.log(`Scraping Finn.no from URL: ${url}`);

    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    if (!response || response.status() === 404) {
      console.log('Finn.no URL returned 404');
      return null;
    }

    await randomDelay(1000, 2000);

    const price = await page.evaluate(() => {
      const priceSelectors = [
        '[class*="price"]',
        '[class*="Price"]',
        '[data-testid*="price"]'
      ];

      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        if (priceEl) {
          const text = priceEl.textContent.trim();
          const match = text.match(/([0-9\s]+)\s*kr/i);
          if (match) {
            return parseFloat(match[1].replace(/\s/g, ''));
          }
        }
      }

      return null;
    });

    return price;
  } catch (error) {
    console.error('Finn.no URL scraping error:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Export function to scrape from a specific PriceCharting URL
 * Used when user selects a specific result from multiple search results
 */
export async function getPriceFromUrl(url, condition = 'CIB (Complete in Box)') {
  // Determine which source the URL is from
  if (url.includes('finn.no')) {
    const price = await scrapeFinnNoFromUrl(url);

    if (price === null) {
      return {
        market_value: null,
        selling_value: null,
        currency: 'NOK'
      };
    }

    const sellingValue = Math.round(price * getMarkupMultiplier() * 100) / 100;

    return {
      market_value: Math.round(price * 100) / 100,
      selling_value: sellingValue,
      currency: 'NOK'
    };
  } else if (url.includes('pricecharting.com')) {
    const price = await scrapePriceChartingFromUrl(url, condition);

    if (price === null) {
      return {
        market_value: null,
        selling_value: null,
        currency: 'USD'
      };
    }

    const sellingValue = Math.round(price * getMarkupMultiplier() * 100) / 100;

    return {
      market_value: Math.round(price * 100) / 100,
      selling_value: sellingValue,
      currency: 'USD'
    };
  } else {
    throw new Error('Unknown price source URL');
  }
}
