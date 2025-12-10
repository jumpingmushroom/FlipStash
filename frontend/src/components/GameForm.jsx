import React, { useState, useEffect } from 'react';
import { gamesApi } from '../services/api';

// Common gaming platforms
const PLATFORMS = [
  'PlayStation 5',
  'PlayStation 4',
  'PlayStation 3',
  'PlayStation 2',
  'PlayStation 1',
  'PS Vita',
  'PSP',
  'Xbox Series X/S',
  'Xbox One',
  'Xbox 360',
  'Xbox',
  'Nintendo Switch',
  'Nintendo Wii U',
  'Nintendo Wii',
  'Nintendo GameCube',
  'Nintendo 64',
  'Super Nintendo (SNES)',
  'Nintendo Entertainment System (NES)',
  'Nintendo 3DS',
  'Nintendo DS',
  'Game Boy Advance',
  'Game Boy Color',
  'Game Boy',
  'Sega Genesis',
  'Sega Dreamcast',
  'Sega Saturn',
  'PC',
  'Other'
];

// Map IGDB platform names to our platform list
const normalizePlatform = (igdbPlatform) => {
  const platformMap = {
    'PlayStation 5': 'PlayStation 5',
    'PS5': 'PlayStation 5',
    'PlayStation 4': 'PlayStation 4',
    'PS4': 'PlayStation 4',
    'PlayStation 3': 'PlayStation 3',
    'PS3': 'PlayStation 3',
    'PlayStation 2': 'PlayStation 2',
    'PS2': 'PlayStation 2',
    'PlayStation': 'PlayStation 1',
    'PS1': 'PlayStation 1',
    'PSX': 'PlayStation 1',
    'PlayStation Vita': 'PS Vita',
    'PS Vita': 'PS Vita',
    'PSP': 'PSP',
    'Xbox Series X|S': 'Xbox Series X/S',
    'Xbox Series S/X': 'Xbox Series X/S',
    'Xbox One': 'Xbox One',
    'Xbox 360': 'Xbox 360',
    'Xbox': 'Xbox',
    'Nintendo Switch': 'Nintendo Switch',
    'Switch': 'Nintendo Switch',
    'Wii U': 'Nintendo Wii U',
    'Wii': 'Nintendo Wii',
    'GameCube': 'Nintendo GameCube',
    'Nintendo GameCube': 'Nintendo GameCube',
    'Nintendo 64': 'Nintendo 64',
    'N64': 'Nintendo 64',
    'Super Nintendo Entertainment System': 'Super Nintendo (SNES)',
    'Super Famicom': 'Super Nintendo (SNES)',
    'SNES': 'Super Nintendo (SNES)',
    'Nintendo Entertainment System': 'Nintendo Entertainment System (NES)',
    'NES': 'Nintendo Entertainment System (NES)',
    'Famicom': 'Nintendo Entertainment System (NES)',
    'Nintendo 3DS': 'Nintendo 3DS',
    '3DS': 'Nintendo 3DS',
    'Nintendo DS': 'Nintendo DS',
    'DS': 'Nintendo DS',
    'Game Boy Advance': 'Game Boy Advance',
    'GBA': 'Game Boy Advance',
    'Game Boy Color': 'Game Boy Color',
    'GBC': 'Game Boy Color',
    'Game Boy': 'Game Boy',
    'GB': 'Game Boy',
    'Sega Mega Drive/Genesis': 'Sega Genesis',
    'Genesis': 'Sega Genesis',
    'Mega Drive': 'Sega Genesis',
    'Dreamcast': 'Sega Dreamcast',
    'Sega Dreamcast': 'Sega Dreamcast',
    'Sega Saturn': 'Sega Saturn',
    'Saturn': 'Sega Saturn',
    'PC (Microsoft Windows)': 'PC',
    'PC': 'PC',
    'Windows': 'PC',
    'Mac': 'PC',
    'Linux': 'PC'
  };

  return platformMap[igdbPlatform] || 'Other';
};

function GameForm({ game, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    purchase_value: '',
    market_value: '',
    selling_value: '',
    sold_value: '',
    purchase_date: '',
    sale_date: '',
    condition: '',
    notes: '',
    igdb_id: '',
    igdb_cover_url: '',
    igdb_release_date: ''
  });

  const [igdbQuery, setIgdbQuery] = useState('');
  const [igdbResults, setIgdbResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMarketValue, setIsFetchingMarketValue] = useState(false);

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        platform: game.platform || '',
        purchase_value: game.purchase_value || '',
        market_value: game.market_value || '',
        selling_value: game.selling_value || '',
        sold_value: game.sold_value || '',
        purchase_date: game.purchase_date || '',
        sale_date: game.sale_date || '',
        condition: game.condition || '',
        notes: game.notes || '',
        igdb_id: game.igdb_id || '',
        igdb_cover_url: game.igdb_cover_url || '',
        igdb_release_date: game.igdb_release_date || ''
      });
    }
  }, [game]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate selling value when market value changes
    if (name === 'market_value' && value) {
      const marketVal = parseFloat(value);
      if (!isNaN(marketVal)) {
        setFormData(prev => ({
          ...prev,
          selling_value: (marketVal * 1.1).toFixed(2)
        }));
      }
    }
  };

  const searchIGDB = async () => {
    if (!igdbQuery.trim()) return;

    setIsSearching(true);
    setError('');
    try {
      const response = await gamesApi.searchIGDB(igdbQuery);
      setIgdbResults(response.data);
    } catch (err) {
      setError('Failed to search IGDB. Please check your API credentials.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectIGDBGame = (igdbGame) => {
    // Extract primary platform from IGDB result
    const primaryPlatform = igdbGame.platforms
      ? igdbGame.platforms.split(',')[0].trim()
      : '';
    const normalizedPlatform = normalizePlatform(primaryPlatform);

    setFormData(prev => ({
      ...prev,
      name: igdbGame.name,
      platform: normalizedPlatform,
      igdb_id: igdbGame.id,
      igdb_cover_url: igdbGame.coverUrl || '',
      igdb_release_date: igdbGame.releaseDate || ''
    }));
    setIgdbResults([]);
    setIgdbQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Convert empty strings to null for numeric fields
      const dataToSubmit = {
        ...formData,
        purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
        market_value: formData.market_value ? parseFloat(formData.market_value) : null,
        selling_value: formData.selling_value ? parseFloat(formData.selling_value) : null,
        sold_value: formData.sold_value ? parseFloat(formData.sold_value) : null,
        igdb_id: formData.igdb_id ? parseInt(formData.igdb_id) : null
      };

      if (game) {
        await gamesApi.update(game.id, dataToSubmit);
      } else {
        // Create new game
        const response = await gamesApi.create(dataToSubmit);
        const newGameId = response.data.id;

        // Auto-fetch market value for new games
        setIsFetchingMarketValue(true);
        try {
          await gamesApi.refreshMarketValue(newGameId);
        } catch (marketErr) {
          // Don't fail the whole operation if market value fetch fails
          console.warn('Failed to fetch initial market value:', marketErr);
        } finally {
          setIsFetchingMarketValue(false);
        }
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save game');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{game ? 'Edit Game' : 'Add New Game'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error">{error}</div>}

        {!game && (
          <div className="igdb-search">
            <div className="form-group">
              <label className="form-label">Search IGDB</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={igdbQuery}
                  onChange={(e) => setIgdbQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchIGDB()}
                  placeholder="Search for a game..."
                />
                <button
                  type="button"
                  onClick={searchIGDB}
                  disabled={isSearching}
                  className="btn btn-primary"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {igdbResults.length > 0 && (
              <div className="igdb-results">
                {igdbResults.map(result => (
                  <div
                    key={result.id}
                    className="igdb-result"
                    onClick={() => selectIGDBGame(result)}
                  >
                    {result.coverUrl ? (
                      <img src={result.coverUrl} alt={result.name} className="igdb-result-cover" />
                    ) : (
                      <div className="igdb-result-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🎮
                      </div>
                    )}
                    <div className="igdb-result-info">
                      <div className="igdb-result-name">{result.name}</div>
                      <div className="igdb-result-platforms">{result.platforms}</div>
                      {result.releaseDate && (
                        <div className="igdb-result-platforms">{result.releaseDate}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Game Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Platform *</label>
            <select
              name="platform"
              className="form-select"
              value={formData.platform}
              onChange={handleChange}
              required
            >
              <option value="">Select a platform</option>
              {PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purchase Value ($)</label>
              <input
                type="number"
                step="0.01"
                name="purchase_value"
                className="form-input"
                value={formData.purchase_value}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                className="form-input"
                value={formData.purchase_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Market Value ($)</label>
              <input
                type="number"
                step="0.01"
                name="market_value"
                className="form-input"
                value={formData.market_value}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Selling Value ($)</label>
              <input
                type="number"
                step="0.01"
                name="selling_value"
                className="form-input"
                value={formData.selling_value}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sold Value ($)</label>
              <input
                type="number"
                step="0.01"
                name="sold_value"
                className="form-input"
                value={formData.sold_value}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sale Date</label>
              <input
                type="date"
                name="sale_date"
                className="form-input"
                value={formData.sale_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Condition</label>
            <select
              name="condition"
              className="form-select"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="">Select condition</option>
              <option value="Sealed">Sealed</option>
              <option value="CIB (Complete in Box)">CIB (Complete in Box)</option>
              <option value="Loose">Loose</option>
              <option value="Box Only">Box Only</option>
              <option value="Manual Only">Manual Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this game..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting || isFetchingMarketValue}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || isFetchingMarketValue} className="btn btn-primary">
              {isFetchingMarketValue ? 'Fetching market value...' : (isSubmitting ? 'Saving...' : (game ? 'Update Game' : 'Add Game'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameForm;
