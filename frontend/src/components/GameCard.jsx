import React from 'react';
import { useNavigate } from 'react-router-dom';
import { convertCurrency, formatCurrency } from '../services/currency';

function GameCard({ game, currency = 'USD', onEdit, onDelete, onRefreshMarket, isSelected = false, onSelect }) {
  const navigate = useNavigate();
  const isSold = game.sold_value !== null;

  const handleViewDetails = () => {
    navigate(`/game/${game.id}`);
  };

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
        {game.price_source && (
          <span className={`source-badge source-${game.price_source === 'finnno' ? 'finn' : game.price_source}`}>
            {game.price_source === 'pricecharting' ? 'PriceCharting' :
             game.price_source === 'finnno' ? 'Finn.no' :
             game.price_source === 'manual' ? 'Manual' :
             game.price_source}
          </span>
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

export default GameCard;
