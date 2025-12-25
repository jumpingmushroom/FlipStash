import { useState } from 'react';
import './PriceSelectionModal.css';

/**
 * Modal for selecting price sources from search results
 * @param {Object} props
 * @param {Object} props.results - Search results with pricecharting and finnno arrays
 * @param {Function} props.onSelect - Callback when user confirms selection (pricechartingUrl, finnUrl)
 * @param {Function} props.onClose - Callback when modal is closed
 */
export default function PriceSelectionModal({ results, onSelect, onClose }) {
  const [selectedPriceCharting, setSelectedPriceCharting] = useState(null);
  const [selectedFinn, setSelectedFinn] = useState(null);

  const hasPriceChartingResults = results.pricecharting && results.pricecharting.length > 0;
  const hasFinnResults = results.finnno && results.finnno.length > 0;

  const handleConfirm = () => {
    // At least one selection is required
    if (!selectedPriceCharting && !selectedFinn) {
      alert('Please select at least one price source');
      return;
    }

    onSelect(selectedPriceCharting, selectedFinn);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleSkip}>
      <div className="modal-content price-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Price Sources</h2>
          <button className="close-button" onClick={handleSkip}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Select the correct game listing from the search results below. You can choose one or both sources.
          </p>

          {/* PriceCharting Results */}
          <div className="price-source-section">
            <h3>🇺🇸 PriceCharting (USD)</h3>
            {!hasPriceChartingResults ? (
              <p className="no-results">No results found</p>
            ) : (
              <div className="results-list">
                {results.pricecharting.map((result, index) => (
                  <div
                    key={index}
                    className={`result-card ${selectedPriceCharting === result.url ? 'selected' : ''}`}
                    onClick={() => setSelectedPriceCharting(result.url)}
                  >
                    <div className="result-info">
                      <div className="result-name">{result.name}</div>
                    </div>
                    {result.previewPrice !== null && result.previewPrice !== undefined && (
                      <div className="result-price">${result.previewPrice.toFixed(2)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finn.no Results */}
          <div className="price-source-section">
            <h3>🇳🇴 Finn.no (NOK)</h3>
            {!hasFinnResults ? (
              <p className="no-results">No results found</p>
            ) : (
              <div className="results-list">
                {results.finnno.map((result, index) => (
                  <div
                    key={index}
                    className={`result-card ${selectedFinn === result.url ? 'selected' : ''}`}
                    onClick={() => setSelectedFinn(result.url)}
                  >
                    <div className="result-info">
                      <div className="result-name">{result.name}</div>
                    </div>
                    {result.price !== null && result.price !== undefined && (
                      <div className="result-price">{result.price.toFixed(0)} kr</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleSkip}>
            Skip
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedPriceCharting && !selectedFinn}
          >
            Save Selected Sources
          </button>
        </div>
      </div>
    </div>
  );
}
