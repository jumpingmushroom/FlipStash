import React, { useState, useEffect } from 'react';
import { convertCurrency, formatCurrency } from '../services/currency';
import PriceChart from './PriceChart';
import api from '../services/api';

function GameCard({ game, currency = 'USD', onEdit, onDelete, onRefreshMarket }) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceHistoryCount, setPriceHistoryCount] = useState(0);

  useEffect(() => {
    // Fetch price history count to determine if we should show the chart
    const fetchPriceHistoryCount = async () => {
      if (game.market_value !== null) {
        try {
          const response = await api.get(`/games/${game.id}/price-history`);
          setPriceHistoryCount(response.data?.history?.length || 0);
        } catch (err) {
          console.error('Error fetching price history count:', err);
          setPriceHistoryCount(0);
        }
      }
    };

    fetchPriceHistoryCount();
  }, [game.id, game.last_refresh_at, game.market_value]);

  const calculateProfit = () => {
    if (game.sold_value && game.purchase_value) {
      // Convert both values to the same currency (USD) for calculation
      const soldInUSD = convertCurrency(game.sold_value, game.sold_value_currency || 'USD', 'USD');
      const purchaseInUSD = convertCurrency(game.purchase_value, game.purchase_value_currency || 'USD', 'USD');
      return soldInUSD - purchaseInUSD;
    }
    return null;
  };

  const profit = calculateProfit();
  const isSold = game.sold_value !== null;

  return (
    <div className="game-card">
      <div className="game-card-header">
        {game.igdb_cover_url ? (
          <img src={game.igdb_cover_url} alt={game.name} className="game-cover" />
        ) : (
          <div className="game-cover-placeholder">🎮</div>
        )}
        <div className="game-info">
          <h3 className="game-title">{game.name}</h3>
          <span className="game-platform">
            {game.platform}
            {game.region && game.region !== 'None' && ` (${game.region})`}
          </span>
          {game.condition && (
            <div className="game-condition">{game.condition}</div>
          )}
          {game.posted_online === 1 && (
            <div style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--success-color)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              Posted Online
            </div>
          )}
        </div>
      </div>

      <div className="game-details">
        {game.purchase_value !== null && (
          <div className="detail-item">
            <span className="detail-label">Purchase</span>
            <span className="detail-value">{formatCurrency(convertCurrency(game.purchase_value, game.purchase_value_currency || 'USD', currency), currency)}</span>
          </div>
        )}

        {game.market_value !== null && (
          <div className="detail-item">
            <span className="detail-label">Market</span>
            <span className="detail-value">{formatCurrency(convertCurrency(game.market_value, game.market_value_currency || 'USD', currency), currency)}</span>
          </div>
        )}

        {game.selling_value !== null && (
          <div className="detail-item">
            <span className="detail-label">Selling</span>
            <span className="detail-value">{formatCurrency(convertCurrency(game.selling_value, game.selling_value_currency || 'USD', currency), currency)}</span>
          </div>
        )}

        {game.sold_value !== null && (
          <div className="detail-item">
            <span className="detail-label">Sold For</span>
            <span className="detail-value">{formatCurrency(convertCurrency(game.sold_value, game.sold_value_currency || 'USD', currency), currency)}</span>
          </div>
        )}

        {profit !== null && (
          <div className="detail-item">
            <span className="detail-label">Profit/Loss</span>
            <span className={`detail-value ${profit >= 0 ? 'positive' : 'negative'}`}>
              {profit >= 0 ? '+' : ''}{formatCurrency(convertCurrency(Math.abs(profit), 'USD', currency), currency)}
            </span>
          </div>
        )}

        {game.purchase_date && (
          <div className="detail-item">
            <span className="detail-label">Purchased</span>
            <span className="detail-value">{new Date(game.purchase_date).toLocaleDateString()}</span>
          </div>
        )}

        {game.sale_date && (
          <div className="detail-item">
            <span className="detail-label">Sold</span>
            <span className="detail-value">{new Date(game.sale_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {game.notes && (
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {game.notes}
        </div>
      )}

      {/* Price History Section - only show if there are multiple price entries */}
      {game.market_value !== null && priceHistoryCount > 1 && (
        <div className="price-history-section">
          <div className="price-history-header">
            <span className="price-history-title">Price Trend</span>
            {game.last_refresh_at && (
              <span className="last-refresh">
                Last updated: {new Date(game.last_refresh_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="price-history-mini-container">
            <PriceChart gameId={game.id} mode="mini" />
          </div>
          <button
            onClick={() => setShowPriceHistory(true)}
            className="btn-link"
            style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}
          >
            View Price History →
          </button>
        </div>
      )}

      <div className="game-actions">
        <button onClick={() => onEdit(game)} className="btn btn-secondary btn-small">
          Edit
        </button>
        {!isSold && (
          <button onClick={() => onRefreshMarket(game)} className="btn btn-secondary btn-small">
            Refresh Market
          </button>
        )}
        <button onClick={() => onDelete(game.id)} className="btn btn-danger btn-small">
          Delete
        </button>
      </div>

      {/* Price History Modal */}
      {showPriceHistory && (
        <PriceChart
          gameId={game.id}
          mode="detailed"
          onClose={() => setShowPriceHistory(false)}
        />
      )}
    </div>
  );
}

export default GameCard;
