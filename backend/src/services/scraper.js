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
 * Scrape price from PriceCharting.com
 * @param {string} gameName - Name of the game
 * @param {string} platform - Gaming platform
 * @returns {number|null} - Price in USD or null if not found
 */
async function scrapePriceCharting(gameName, platform) {
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

    // Navigate to PriceCharting
    await page.goto('https://www.pricecharting.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    await randomDelay(1000, 2000);

    // Search for the game
    const searchQuery = `${gameName} ${platform}`;
    await page.type('input[name="q"]', searchQuery, { delay: 100 });
    await randomDelay(500, 1000);

    // Submit search
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    await randomDelay(1000, 2000);

    // Try to find price - PriceCharting shows prices in a table
    const price = await page.evaluate(() => {
      // Look for the "Complete" price which is most relevant
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length >= 2) {
          // Try to find a price cell
          for (const cell of cells) {
            const text = cell.textContent.trim();
            const match = text.match(/\$([0-9,]+\.?[0-9]*)/);
            if (match) {
              return parseFloat(match[1].replace(',', ''));
            }
          }
        }
      }
      return null;
    });

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

    // Navigate to Finn.no
    const searchQuery = encodeURIComponent(`${gameName} ${platform}`);
    await page.goto(`https://www.finn.no/bap/forsale/search.html?q=${searchQuery}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await randomDelay(2000, 3000);

    // Extract prices from search results
    const prices = await page.evaluate(() => {
      const priceElements = Array.from(document.querySelectorAll('[class*="price"], .ads__unit__content__price'));
      const prices = [];

      for (const element of priceElements) {
        const text = element.textContent.trim();
        const match = text.match(/([0-9\s]+)(?:\s*kr)?/);
        if (match) {
          const price = parseFloat(match[1].replace(/\s/g, ''));
          if (price > 0 && price < 100000) { // Sanity check
            prices.push(price);
          }
        }
      }

      return prices;
    });

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
 * @returns {Object} - Object with market_value, selling_value, and currency
 */
export async function getMarketValue(gameName, platform) {
  console.log(`Fetching market value for: ${gameName} (${platform})`);

  // Run both scrapers in parallel
  const [priceChartingPrice, finnNoPrice] = await Promise.all([
    scrapePriceCharting(gameName, platform),
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
