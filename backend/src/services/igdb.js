import axios from 'axios';

let accessToken = null;
let tokenExpiry = null;

/**
 * Get or refresh IGDB access token
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials not configured. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET environment variables.');
  }

  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }
    });

    accessToken = response.data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    console.error('Failed to get IGDB access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with IGDB API');
  }
}

/**
 * Platform name to IGDB platform ID mapping
 * Based on IGDB platform IDs: https://api-docs.igdb.com/#platform
 */
const PLATFORM_TO_IGDB_ID = {
  'PlayStation 5': 167,
  'PlayStation 4': 48,
  'PlayStation 3': 9,
  'PlayStation 2': 8,
  'PlayStation 1': 7,
  'PlayStation': 7,
  'PSX': 7,
  'PS1': 7,
  'PS Vita': 46,
  'PlayStation Vita': 46,
  'PSP': 38,
  'PlayStation Portable': 38,
  'Xbox Series X/S': 169,
  'Xbox Series X|S': 169,
  'Xbox One': 49,
  'Xbox 360': 12,
  'Xbox': 11,
  'Nintendo Switch': 130,
  'Switch': 130,
  'Nintendo Wii U': 41,
  'Wii U': 41,
  'Nintendo Wii': 5,
  'Wii': 5,
  'Nintendo GameCube': 21,
  'GameCube': 21,
  'Nintendo 64': 4,
  'N64': 4,
  'Super Nintendo (SNES)': 19,
  'Super Nintendo Entertainment System': 19,
  'SNES': 19,
  'Nintendo Entertainment System (NES)': 18,
  'NES': 18,
  'Nintendo 3DS': 37,
  '3DS': 37,
  'Nintendo DS': 20,
  'DS': 20,
  'Game Boy Advance': 24,
  'GBA': 24,
  'Game Boy Color': 22,
  'GBC': 22,
  'Game Boy': 33,
  'GB': 33,
  'Sega Genesis': 29,
  'Sega Mega Drive/Genesis': 29,
  'Genesis': 29,
  'Mega Drive': 29,
  'Sega Dreamcast': 23,
  'Dreamcast': 23,
  'Sega Saturn': 32,
  'Saturn': 32,
  'PC': 6,
  'PC (Microsoft Windows)': 6,
  'Windows': 6
};

/**
 * Get IGDB platform ID from platform name
 * @param {string} platformName - Platform name
 * @returns {number|null} - IGDB platform ID or null if not found
 */
function getPlatformId(platformName) {
  if (!platformName) return null;
  return PLATFORM_TO_IGDB_ID[platformName] || null;
}

/**
 * Search for games on IGDB
 * @param {string} query - Game name to search for
 * @param {string} platform - Optional platform name to filter results
 * @returns {Array} - Array of game results
 */
export async function searchGames(query, platform = null) {
  const token = await getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID;

  try {
    // Build the IGDB query
    let igdbQuery = `search "${query}"; fields name, cover.url, first_release_date, platforms.name;`;

    // Add platform filter if specified
    if (platform) {
      const platformId = getPlatformId(platform);
      if (platformId) {
        igdbQuery += ` where platforms = [${platformId}];`;
      }
    }

    igdbQuery += ' limit 10;';

    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      igdbQuery,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      }
    );

    // Transform the response to a more usable format
    return response.data.map(game => ({
      id: game.id,
      name: game.name,
      coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : null,
      platforms: game.platforms?.map(p => p.name).join(', ') || 'Unknown'
    }));
  } catch (error) {
    console.error('Failed to search IGDB:', error.response?.data || error.message);
    throw new Error('Failed to search games on IGDB');
  }
}

/**
 * Get detailed game information from IGDB
 * @param {number} gameId - IGDB game ID
 * @returns {Object} - Game details
 */
export async function getGameDetails(gameId) {
  const token = await getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID;

  try {
    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `fields name, cover.url, first_release_date, platforms.name, summary; where id = ${gameId};`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      }
    );

    if (response.data.length === 0) {
      return null;
    }

    const game = response.data[0];
    return {
      id: game.id,
      name: game.name,
      coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : null,
      platforms: game.platforms?.map(p => p.name).join(', ') || 'Unknown',
      summary: game.summary || ''
    };
  } catch (error) {
    console.error('Failed to get game details from IGDB:', error.response?.data || error.message);
    throw new Error('Failed to get game details from IGDB');
  }
}
