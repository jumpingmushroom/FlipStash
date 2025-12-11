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
 * Search for games on IGDB
 * @param {string} query - Game name to search for
 * @param {string} platform - Optional platform to filter by
 * @returns {Array} - Array of game results
 */
export async function searchGames(query, platform = null) {
  const token = await getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID;

  try {
    // Increase limit when filtering by platform to ensure we get enough results
    const limit = platform ? 50 : 10;

    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${query}"; fields name, cover.url, first_release_date, platforms.name; limit ${limit};`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      }
    );

    // Transform the response to a more usable format
    let results = response.data.map(game => ({
      id: game.id,
      name: game.name,
      coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : null,
      platforms: game.platforms?.map(p => p.name).join(', ') || 'Unknown'
    }));

    // Filter by platform if specified
    if (platform && platform.trim() !== '') {
      const platformLower = platform.toLowerCase();
      results = results.filter(game =>
        game.platforms.toLowerCase().includes(platformLower)
      );

      // Limit to 10 results after filtering
      results = results.slice(0, 10);
    }

    return results;
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
