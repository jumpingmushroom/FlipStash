import puppeteer from 'puppeteer';

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
 * Fallback: Scrape price from PriceCharting.com using general search
 * This is used when platform-specific URL is not available or fails
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @param {string} condition - Game condition (Sealed, CIB, Loose, Box Only, Manual Only)
 * @param {string} region - Game region (PAL, NTSC, NTSC-J, None, Other)
 * @returns {number|null} - Price in USD or null if not found
 */
async function scrapePriceChartingGeneralSearch(gameName, platform, condition = 'CIB (Complete in Box)', region = 'PAL') {
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

    // Check if we're on a search results page and need to click the first result
    const isSearchResults = await page.evaluate(() => {
      const searchTable = document.querySelector('table.table.table-striped, table#games_table');
      return searchTable !== null;
    });

    console.log(`On search results page: ${isSearchResults}`);

    if (isSearchResults) {
      // Click on the first result that matches our platform AND region
      const clickedResult = await page.evaluate((regionPrefix, platformName) => {
        const rows = document.querySelectorAll('table.table.table-striped tbody tr, table#games_table tbody tr');

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
        const firstLink = document.querySelector('table.table.table-striped tbody tr a[href*="/game/"], table#games_table tbody tr a[href*="/game/"]');
        if (firstLink) {
          firstLink.click();
          return true;
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
 * @returns {number|null} - Price in USD or null if not found
 */
async function scrapePriceCharting(gameName, platform, condition = 'CIB (Complete in Box)', region = 'PAL') {
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
      return await scrapePriceChartingGeneralSearch(gameName, platform, condition, region);
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
      return await scrapePriceChartingGeneralSearch(gameName, platform, condition, region);
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
      return await scrapePriceChartingGeneralSearch(gameName, platform, condition, region);
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
 * Scrape price from Finn.no (Norwegian marketplace)
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @returns {number|null} - Average price in NOK or null if not found
 */
async function scrapeFinnNo(gameName, platform) {
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

    await page.goto(finnUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await randomDelay(2000, 3000);

    // Extract prices from search results
    const prices = await page.evaluate(() => {
      const prices = [];

      // Try multiple selectors for price elements
      const selectors = [
        '[class*="price"]',
        '[data-testid*="price"]',
        '.ads__unit__content__price',
        '.text-18',
        '.text-20',
        'span[class*="Price"]'
      ];

      for (const selector of selectors) {
        const priceElements = document.querySelectorAll(selector);

        for (const element of priceElements) {
          const text = element.textContent.trim();
          // Match Norwegian number format (spaces as thousand separators)
          const match = text.match(/([0-9\s]+)\s*kr/i);

          if (match) {
            const price = parseFloat(match[1].replace(/\s/g, ''));
            if (price > 0 && price < 100000) { // Sanity check
              prices.push(price);
              console.log(`Found price: ${price} kr`);
            }
          }
        }
      }

      return prices;
    });

    console.log(`Finn.no found ${prices.length} prices:`, prices);

    if (prices.length === 0) {
      return null;
    }

    // Calculate average price
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return Math.round(average);
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
 * @returns {Object} - Object with market_value, selling_value, and currency
 */
export async function getMarketValue(gameName, platform, condition = 'CIB (Complete in Box)', region = 'PAL') {
  console.log(`Fetching market value for: ${gameName} (${platform}) - Condition: ${condition}, Region: ${region}`);

  // Run both scrapers in parallel
  const [priceChartingPrice, finnNoPrice] = await Promise.all([
    scrapePriceCharting(gameName, platform, condition, region),
    scrapeFinnNo(gameName, platform)
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
  const sellingValue = Math.round(marketValue * 1.10 * 100) / 100;

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
