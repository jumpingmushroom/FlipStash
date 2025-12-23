import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gamesApi } from '../services/api';
import { convertCurrency, formatCurrency } from '../services/currency';
import PriceChart from '../components/PriceChart';
import './GameDetailPage.css';

function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceHistoryCount, setPriceHistoryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(null);
  const [multipleResults, setMultipleResults] = useState(null);

  useEffect(() => {
    // Load currency preference
    const savedCurrency = localStorage.getItem('flipstash_currency') || 'USD';
    setCurrency(savedCurrency);
    loadGame();
  }, [id]);

  useEffect(() => {
    if (game && game.market_value !== null) {
      fetchPriceHistoryCount();
    }
  }, [game]);

  const loadGame = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await gamesApi.getById(id);
      setGame(response.data);
    } catch (err) {
      setError('Failed to load game details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceHistoryCount = async () => {
    try {
      const response = await gamesApi.getPriceHistory(id);
      setPriceHistoryCount(response.data?.history?.length || 0);
    } catch (err) {
      console.error('Error fetching price history count:', err);
      setPriceHistoryCount(0);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-game/${id}`, { state: { game } });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;

    try {
      await gamesApi.delete(id);
      navigate('/');
    } catch (err) {
      alert('Failed to delete game');
      console.error(err);
    }
  };

  const handleRefreshMarket = async () => {
    if (!window.confirm('Refresh market value? This may take a moment.')) return;

    setIsRefreshing(true);
    setRefreshProgress({
      total: 1,
      completed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      current: null,
      results: []
    });

    try {
      await gamesApi.refreshMarketValueSSE(id, (data) => {
        // Handle different event types
        if (data.type === 'start') {
          setRefreshProgress({
            total: data.total,
            completed: 0,
            succeeded: 0,
            failed: 0,
            skipped: 0,
            current: null,
            results: []
          });
        } else if (data.type === 'progress') {
          setRefreshProgress(prev => ({
            ...prev,
            completed: data.completed,
            succeeded: data.stats.succeeded,
            failed: data.stats.failed,
            skipped: data.stats.skipped,
            current: data.current,
            results: data.result ? [...(prev.results || []), data.result] : prev.results
          }));
        } else if (data.type === 'multipleResults') {
          // Show dropdown for user to select the correct result
          setIsRefreshing(false);
          setRefreshProgress(null);
          setMultipleResults({
            gameId: data.gameId,
            results: data.results
          });
        } else if (data.type === 'complete') {
          setRefreshProgress(prev => ({
            ...prev,
            completed: data.results.total,
            succeeded: data.results.succeeded,
            failed: data.results.failed,
            skipped: data.results.skipped,
            current: null,
            isComplete: true,
            details: data.results.details
          }));

          // Refresh the game details
          setTimeout(() => {
            loadGame();
            setIsRefreshing(false);

            // Close progress modal after a short delay
            setTimeout(() => {
              setRefreshProgress(null);
            }, 3000);
          }, 1000);
        } else if (data.type === 'error') {
          alert('Failed to refresh market value: ' + data.message);
          setIsRefreshing(false);
          setRefreshProgress(null);
        }
      });
    } catch (err) {
      alert('Failed to refresh market value');
      console.error(err);
      setIsRefreshing(false);
      setRefreshProgress(null);
    }
  };

  const handleSelectResult = async (url) => {
    setMultipleResults(null);
    setIsRefreshing(true);

    try {
      await gamesApi.refreshMarketValueFromUrl(id, url);
      loadGame();
      alert('Market value updated successfully!');
    } catch (err) {
      alert('Failed to update market value from selected result');
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTogglePosted = async () => {
    try {
      await gamesApi.updatePostedOnline(id, game.posted_online === 1 ? 0 : 1);
      loadGame();
    } catch (err) {
      alert('Failed to update posted status');
      console.error(err);
    }
  };

  const calculateProfit = () => {
    if (game.sold_value && game.purchase_value) {
      const soldInUSD = convertCurrency(game.sold_value, game.sold_value_currency || 'USD', 'USD');
      const purchaseInUSD = convertCurrency(game.purchase_value, game.purchase_value_currency || 'USD', 'USD');
      return soldInUSD - purchaseInUSD;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="loading">Loading game details...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="page-content">
        <div className="error">{error || 'Game not found'}</div>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          ← Back to Collection
        </button>
      </div>
    );
  }

  const profit = calculateProfit();
  const isSold = game.sold_value !== null;

  return (
    <div className="game-detail-page">
      <button onClick={() => navigate('/')} className="btn-back">
        ← Back to Collection
      </button>

      <div className="game-detail-container">
        {/* Left Column - Image and Metadata */}
        <div className="game-detail-left">
          <div className="game-detail-cover">
            {game.igdb_cover_url ? (
              <img src={game.igdb_cover_url} alt={game.name} />
            ) : (
              <div className="game-cover-placeholder-large">🎮</div>
            )}
          </div>

          <div className="game-metadata">
            <h1 className="game-detail-title">{game.name}</h1>

            {/* External Links */}
            {(game.igdb_slug || game.igdb_url) && (
              <div className="external-links">
                {(game.igdb_slug || game.igdb_url) && (
                  <a
                    href={game.igdb_url || `https://www.igdb.com/games/${game.igdb_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    🎮 View on IGDB
                  </a>
                )}
                {game.platform && (
                  <a
                    href={`https://www.pricecharting.com/search-products?q=${encodeURIComponent(game.name + ' ' + game.platform)}&type=videogames`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    💰 View on PriceCharting
                  </a>
                )}
              </div>
            )}

            <div className="metadata-item">
              <span className="metadata-label">Platform</span>
              <span className="game-platform-badge">
                {game.platform}
                {game.region && game.region !== 'None' && ` (${game.region})`}
              </span>
            </div>

            {game.condition && (
              <div className="metadata-item">
                <span className="metadata-label">Condition</span>
                <span className="condition-badge">{game.condition}</span>
              </div>
            )}

            {game.acquisition_source && (
              <div className="metadata-item">
                <span className="metadata-label">Acquisition Source</span>
                <span className="badge badge-source">{game.acquisition_source}</span>
              </div>
            )}

            <div className="metadata-item">
              <span className="metadata-label">Posted Online</span>
              <button
                onClick={handleTogglePosted}
                className={`btn ${game.posted_online === 1 ? 'btn-success' : 'btn-secondary'} btn-small`}
              >
                {game.posted_online === 1 ? '✓ Posted' : 'Not Posted'}
              </button>
            </div>

            {game.igdb_release_date && (
              <div className="metadata-item">
                <span className="metadata-label">Release Date</span>
                <span className="metadata-value">{new Date(game.igdb_release_date).toLocaleDateString()}</span>
              </div>
            )}

            {game.igdb_genres && (
              <div className="metadata-item">
                <span className="metadata-label">Genres</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {game.igdb_genres.split(', ').map((genre, index) => (
                    <span key={index} className="badge badge-genre">{genre}</span>
                  ))}
                </div>
              </div>
            )}

            {game.igdb_rating && (
              <div className="metadata-item">
                <span className="metadata-label">IGDB Rating</span>
                <span className="metadata-value">{Math.round(game.igdb_rating)}/100</span>
              </div>
            )}

            {game.igdb_summary && (
              <div className="notes-section">
                <h3>Description</h3>
                <p>{game.igdb_summary}</p>
              </div>
            )}

            {game.notes && (
              <div className="notes-section">
                <h3>Personal Notes</h3>
                <p>{game.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Financial Information */}
        <div className="game-detail-right">
          <div className="financial-section">
            <h2>Financial Information</h2>

            <div className="financial-grid">
              {game.purchase_value !== null && (
                <div className="financial-item">
                  <span className="financial-label">Purchase Value</span>
                  <span className="financial-value">
                    {formatCurrency(convertCurrency(game.purchase_value, game.purchase_value_currency || 'USD', currency), currency)}
                  </span>
                  {game.purchase_date && (
                    <span className="financial-date">
                      {new Date(game.purchase_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {game.market_value !== null && (
                <div className="financial-item">
                  <span className="financial-label">Market Value</span>
                  <span className="financial-value financial-value-primary">
                    {formatCurrency(convertCurrency(game.market_value, game.market_value_currency || 'USD', currency), currency)}
                  </span>
                  {game.last_refresh_at && (
                    <span className="financial-date">
                      Updated: {new Date(game.last_refresh_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {game.selling_value !== null && (
                <div className="financial-item">
                  <span className="financial-label">Selling Value</span>
                  <span className="financial-value">
                    {formatCurrency(convertCurrency(game.selling_value, game.selling_value_currency || 'USD', currency), currency)}
                  </span>
                </div>
              )}

              {game.sold_value !== null && (
                <div className="financial-item">
                  <span className="financial-label">Sold For</span>
                  <span className="financial-value financial-value-success">
                    {formatCurrency(convertCurrency(game.sold_value, game.sold_value_currency || 'USD', currency), currency)}
                  </span>
                  {game.sale_date && (
                    <span className="financial-date">
                      {new Date(game.sale_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {profit !== null && (
                <div className="financial-item">
                  <span className="financial-label">Profit/Loss</span>
                  <span className={`financial-value financial-value-${profit >= 0 ? 'positive' : 'negative'}`}>
                    {profit >= 0 ? '+' : ''}{formatCurrency(convertCurrency(Math.abs(profit), 'USD', currency), currency)}
                  </span>
                </div>
              )}
            </div>

            {!isSold && (
              <button onClick={handleRefreshMarket} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                Refresh Market Value
              </button>
            )}
          </div>

          {/* Price History Section */}
          {game.market_value !== null && priceHistoryCount > 1 && (
            <div className="price-history-detail-section">
              <div className="price-history-detail-header">
                <h2>Price Trend</h2>
                <button
                  onClick={() => setShowPriceHistory(true)}
                  className="btn btn-secondary btn-small"
                >
                  View Full History
                </button>
              </div>
              <div className="price-history-chart-container">
                <PriceChart gameId={game.id} mode="mini" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="game-detail-actions">
            <button onClick={handleEdit} className="btn btn-primary">
              Edit Game
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Game
            </button>
          </div>
        </div>
      </div>

      {/* Price History Modal */}
      {showPriceHistory && (
        <PriceChart
          gameId={game.id}
          mode="detailed"
          onClose={() => setShowPriceHistory(false)}
        />
      )}

      {/* Refresh Progress Modal */}
      {refreshProgress && (
        <div className="modal-overlay">
          <div className="modal-content refresh-progress-modal">
            <h2>Refreshing Market Value</h2>

            {/* Progress Bar */}
            <div className="progress-info">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${(refreshProgress.completed / refreshProgress.total) * 100}%`
                  }}
                ></div>
              </div>
              <p className="progress-text">
                {refreshProgress.completed} of {refreshProgress.total} game processed
              </p>
            </div>

            {/* Statistics */}
            <div className="progress-stats">
              <div className="stat-item success">
                <span className="stat-icon">✓</span>
                <span className="stat-label">Succeeded:</span>
                <span className="stat-value">{refreshProgress.succeeded}</span>
              </div>
              <div className="stat-item failed">
                <span className="stat-icon">✗</span>
                <span className="stat-label">Failed:</span>
                <span className="stat-value">{refreshProgress.failed}</span>
              </div>
              {refreshProgress.skipped > 0 && (
                <div className="stat-item skipped">
                  <span className="stat-icon">⊝</span>
                  <span className="stat-label">Skipped:</span>
                  <span className="stat-value">{refreshProgress.skipped}</span>
                </div>
              )}
            </div>

            {/* Current Game Being Processed */}
            {refreshProgress.current && (
              <div className="current-game-card">
                <div className="current-game-header">
                  <div className="spinner"></div>
                  <h3>Processing...</h3>
                </div>
                <div className="current-game-content">
                  {refreshProgress.current.coverUrl && (
                    <img
                      src={refreshProgress.current.coverUrl}
                      alt={refreshProgress.current.name}
                      className="current-game-cover"
                    />
                  )}
                  <div className="current-game-details">
                    <h4>{refreshProgress.current.name}</h4>
                    <div className="current-game-meta">
                      <span className="meta-item">
                        <strong>Platform:</strong> {refreshProgress.current.platform}
                      </span>
                      {refreshProgress.current.condition && (
                        <span className="meta-item">
                          <strong>Condition:</strong> {refreshProgress.current.condition}
                        </span>
                      )}
                      {refreshProgress.current.region && (
                        <span className="meta-item">
                          <strong>Region:</strong> {refreshProgress.current.region}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results List */}
            {refreshProgress.results && refreshProgress.results.length > 0 && (
              <div className="results-list">
                <h3>Result</h3>
                <div className="results-scroll">
                  {refreshProgress.results.map((result, idx) => (
                    <div key={idx} className={`result-item ${result.status}`}>
                      <span className="result-icon">
                        {result.status === 'success' && '✓'}
                        {result.status === 'failed' && '✗'}
                        {result.status === 'skipped' && '⊝'}
                      </span>
                      <div className="result-details">
                        <div className="result-name">{result.name}</div>
                        {result.status === 'success' && result.newValue !== undefined && (
                          <div className="result-value">
                            {result.oldValue !== null ? (
                              <>
                                {result.oldValue} {result.currency} → {result.newValue} {result.currency}
                                <span className={result.newValue > result.oldValue ? 'change-up' : 'change-down'}>
                                  {' '}({result.newValue > result.oldValue ? '+' : ''}
                                  {((result.newValue - result.oldValue) / (result.oldValue || 1) * 100).toFixed(1)}%)
                                </span>
                              </>
                            ) : (
                              <>New: {result.newValue} {result.currency}</>
                            )}
                          </div>
                        )}
                        {result.status === 'failed' && (
                          <div className="result-message error">{result.message}</div>
                        )}
                        {result.status === 'skipped' && (
                          <div className="result-message">{result.message}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {refreshProgress.isComplete && (
              <div className="completion-message">
                <h3>✓ Refresh Complete!</h3>
                <p>Market value has been processed.</p>
              </div>
            )}

            {/* Close Button */}
            {!isRefreshing && (
              <button
                onClick={() => setRefreshProgress(null)}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Multiple Results Selection Modal */}
      {multipleResults && (
        <div className="modal-overlay">
          <div className="modal-content multiple-results-modal">
            <h2>Multiple Results Found</h2>
            <p>PriceCharting returned multiple results. Please select the correct game:</p>

            <div className="results-list">
              {multipleResults.results.map((result, index) => (
                <div
                  key={index}
                  className="result-item-selectable"
                  onClick={() => handleSelectResult(result.url)}
                >
                  <div className="result-info">
                    <div className="result-name">{result.name}</div>
                    <div className="result-platform">{result.platform}</div>
                  </div>
                  {result.previewPrice && (
                    <div className="result-price">
                      ${result.previewPrice.toFixed(2)}
                    </div>
                  )}
                  <div className="result-arrow">→</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMultipleResults(null)}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameDetailPage;
