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
 * Scrape price from PriceCharting.com
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

    // Build search query with region prefix
    const regionPrefix = mapRegionToPriceCharting(region);
    const searchQuery = regionPrefix ? `${regionPrefix} ${gameName} ${platform}` : `${gameName} ${platform}`;

    console.log(`PriceCharting search query: "${searchQuery}"`);

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
      // Look for search results table or list
      const searchTable = document.querySelector('table.table.table-striped, table#games_table');
      return searchTable !== null;
    });

    console.log(`On search results page: ${isSearchResults}`);

    if (isSearchResults) {
      // Click on the first result that matches our region
      const clickedResult = await page.evaluate((regionPrefix) => {
        const rows = document.querySelectorAll('table.table.table-striped tbody tr, table#games_table tbody tr');

        for (const row of rows) {
          const link = row.querySelector('a[href*="/game/"]');
          if (!link) continue;

          const rowText = row.textContent.toLowerCase();

          // If looking for a specific region, try to match it
          if (regionPrefix) {
            const regionLower = regionPrefix.toLowerCase();
            // For PAL, look for "pal" in the link href or row text
            if (regionPrefix === 'PAL' && (link.href.includes('pal') || rowText.includes('pal'))) {
              link.click();
              return true;
            }
            // For JP, look for "jp" or "japan"
            if (regionPrefix === 'JP' && (link.href.includes('jp-') || rowText.includes('japan') || rowText.includes('jp '))) {
              link.click();
              return true;
            }
          }

          // If no region specified or no match found yet, just click the first result
          if (!regionPrefix) {
            link.click();
            return true;
          }
        }

        // If no region match found, click the first result anyway
        const firstLink = document.querySelector('table.table.table-striped tbody tr a[href*="/game/"], table#games_table tbody tr a[href*="/game/"]');
        if (firstLink) {
          firstLink.click();
          return true;
        }

        return false;
      }, regionPrefix);

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
    const price = await page.evaluate((targetCondition, regionPrefix) => {
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
    }, targetCondition, regionPrefix);

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
