import { useState } from 'react';
import './PriceSelectionModal.css';

/**
 * Modal for selecting price sources from search results
 * @param {Object} props
 * @param {Object} props.results - Search results with pricecharting and finnno arrays
 * @param {string} props.gamePlatform - The platform of the game being refreshed
 * @param {Function} props.onSelect - Callback when user confirms selection (pricechartingUrl, finnUrl)
 * @param {Function} props.onClose - Callback when modal is closed
 */
export default function PriceSelectionModal({ results, gamePlatform, onSelect, onClose }) {
  const [selectedPriceCharting, setSelectedPriceCharting] = useState(null);
  const [selectedFinn, setSelectedFinn] = useState(null);

  // Filter results by platform if gamePlatform is provided
  const filterByPlatform = (resultsList) => {
    if (!gamePlatform || !resultsList) return resultsList;

    // Normalize the game platform for comparison (lowercase, remove special chars)
    const normalizedGamePlatform = gamePlatform.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    return resultsList.filter(result => {
      if (!result.platform) return true; // Keep results without platform info

      const normalizedResultPlatform = result.platform.toLowerCase().replace(/[^a-z0-9\s]/g, '');

      // Check if platforms match (result platform should contain game platform keywords)
      // e.g., "Nintendo DS" should match "PAL Nintendo DS", "Nintendo DS", etc.
      // but not "Wii" or "PlayStation"
      const gamePlatformWords = normalizedGamePlatform.split(/\s+/).filter(w => w.length > 2);
      const resultPlatformWords = normalizedResultPlatform.split(/\s+/).filter(w => w.length > 2);

      // Check if major platform keywords match
      return gamePlatformWords.some(gameWord =>
        resultPlatformWords.some(resultWord =>
          resultWord.includes(gameWord) || gameWord.includes(resultWord)
        )
      );
    });
  };

  const filteredPriceCharting = filterByPlatform(results.pricecharting);
  const filteredFinnNo = filterByPlatform(results.finnno);

  const hasPriceChartingResults = filteredPriceCharting && filteredPriceCharting.length > 0;
  const hasFinnResults = filteredFinnNo && filteredFinnNo.length > 0;

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
                {filteredPriceCharting.map((result, index) => (
                  <div
                    key={index}
                    className={`result-card ${selectedPriceCharting === result.url ? 'selected' : ''}`}
                    onClick={() => setSelectedPriceCharting(result.url)}
                  >
                    <div className="result-info">
                      <div className="result-name">{result.name}</div>
                      {result.platform && (
                        <div className="result-platform">{result.platform}</div>
                      )}
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
                {filteredFinnNo.map((result, index) => (
                  <div
                    key={index}
                    className={`result-card ${selectedFinn === result.url ? 'selected' : ''}`}
                    onClick={() => setSelectedFinn(result.url)}
                  >
                    <div className="result-info">
                      <div className="result-name">{result.name}</div>
                      {result.platform && (
                        <div className="result-platform">{result.platform}</div>
                      )}
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
