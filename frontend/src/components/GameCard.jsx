import React from 'react';
import { useNavigate } from 'react-router-dom';
import { convertCurrency, formatCurrency } from '../services/currency';

function GameCard({ game, currency = 'USD', onEdit, onDelete, onRefreshMarket, isSelected = false, onSelect, viewMode = 'grid' }) {
  const navigate = useNavigate();

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

  const handleViewDetails = () => {
    navigate(`/game/${game.id}`);
  };

  // List view - compact horizontal layout
  if (viewMode === 'list') {
    return (
      <div className="game-list-item" onClick={handleViewDetails}>
        {onSelect && (
          <div className="game-list-checkbox" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
            />
          </div>
        )}

        <div className="game-list-cover">
          {game.igdb_cover_url ? (
            <img src={game.igdb_cover_url} alt={game.name} />
          ) : (
            <div className="game-cover-placeholder-small">🎮</div>
          )}
        </div>

        <div className="game-list-info">
          <div className="game-list-title">{game.name}</div>
          <div className="game-list-platform">{game.platform}{game.region && game.region !== 'None' && ` (${game.region})`}</div>
        </div>

        <div className="game-list-condition">{game.condition || '-'}</div>

        <div className="game-list-value">
          {game.purchase_value !== null ? formatCurrency(convertCurrency(game.purchase_value, game.purchase_value_currency || 'USD', currency), currency) : '-'}
        </div>

        <div className="game-list-value">
          {game.market_value !== null ? formatCurrency(convertCurrency(game.market_value, game.market_value_currency || 'USD', currency), currency) : '-'}
        </div>

        <div className="game-list-badges">
          {game.acquisition_source && (
            <span className="badge badge-source">{game.acquisition_source}</span>
          )}
          {isSold ? (
            <span className="badge badge-sold">Sold</span>
          ) : game.posted_online === 1 ? (
            <span className="badge badge-posted">Posted</span>
          ) : null}
        </div>

        <div className="game-list-actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(game); }} className="btn btn-secondary btn-small">
            Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(game.id); }} className="btn btn-danger btn-small">
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Grid and Tiles view - simplified card layout
  return (
    <div className={`game-card ${viewMode === 'tiles' ? 'game-card-large' : ''}`} onClick={handleViewDetails}>
      {onSelect && (
        <div className="game-card-checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </div>
      )}
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
          {game.acquisition_source && (
            <div className="badge badge-source" style={{ marginTop: '0.5rem' }}>
              {game.acquisition_source}
            </div>
          )}
          {isSold ? (
            <div className="badge badge-sold" style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}>
              Sold
            </div>
          ) : game.posted_online === 1 ? (
            <div className="badge badge-posted" style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}>
              Posted Online
            </div>
          ) : null}
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

        {game.sold_value !== null && (
          <div className="detail-item">
            <span className="detail-label">Sold For</span>
            <span className="detail-value">{formatCurrency(convertCurrency(game.sold_value, game.sold_value_currency || 'USD', currency), currency)}</span>
          </div>
        )}
      </div>

      <button
        className="btn-view-details"
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails();
        }}
      >
        View Details →
      </button>
    </div>
  );
}

export default GameCard;
