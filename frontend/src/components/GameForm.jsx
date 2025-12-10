import React, { useState, useEffect } from 'react';
import { gamesApi } from '../services/api';

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
    setFormData(prev => ({
      ...prev,
      name: igdbGame.name,
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
        await gamesApi.create(dataToSubmit);
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
            <input
              type="text"
              name="platform"
              className="form-input"
              value={formData.platform}
              onChange={handleChange}
              placeholder="e.g., PS5, Nintendo Switch, Xbox Series X"
              required
            />
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
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : (game ? 'Update Game' : 'Add Game')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameForm;
