import React, { useState, useEffect } from 'react';
import { CURRENCIES, refreshExchangeRates, getExchangeRatesLastUpdated } from '../services/currency';
import { settingsApi } from '../services/api';
import './SettingsPage.css';

function SettingsPage({ currentCurrency, onCurrencyChange }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [markupPercentage, setMarkupPercentage] = useState(10);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [exchangeRatesLastUpdated, setExchangeRatesLastUpdated] = useState(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  // Fetch markup setting and exchange rate timestamp on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsApi.getMarkup();
        setMarkupPercentage(response.data.markup_percentage);
      } catch (err) {
        console.error('Failed to fetch markup setting:', err);
      }
    };
    fetchSettings();
    setExchangeRatesLastUpdated(getExchangeRatesLastUpdated());
  }, []);

  const handleSave = async () => {
    setError('');
    setSaveMessage('');

    try {
      // Validate markup percentage
      const markup = parseFloat(markupPercentage);
      if (isNaN(markup) || markup < 0 || markup > 100) {
        setError('Markup percentage must be between 0 and 100');
        return;
      }

      // Save currency preference
      onCurrencyChange(selectedCurrency);

      // Save markup setting
      const response = await settingsApi.setMarkup(markup);

      // Show success message with number of games updated
      const gamesUpdated = response.data.games_updated || 0;
      if (gamesUpdated > 0) {
        setSaveMessage(`Settings saved successfully! Updated selling prices for ${gamesUpdated} game${gamesUpdated === 1 ? '' : 's'}.`);
      } else {
        setSaveMessage('Settings saved successfully!');
      }

      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to save settings: ' + (err.response?.data?.error || err.message));
      console.error('Error saving settings:', err);
    }
  };

  const handleRefreshExchangeRates = async () => {
    setError('');
    setSaveMessage('');
    setIsRefreshingRates(true);

    try {
      const result = await refreshExchangeRates();
      setExchangeRatesLastUpdated(result.lastUpdated);
      setSaveMessage('Exchange rates refreshed successfully!');

      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to refresh exchange rates: ' + (err.response?.data?.error || err.message));
      console.error('Error refreshing exchange rates:', err);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Currency Preferences</h2>
          <div className="form-group">
            <label className="form-label">Preferred Currency</label>
            <select
              className="form-select"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
            <div className="help-text">
              Market values are scraped in USD and will be converted to your selected currency.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Selling Price Markup (%)</label>
            <input
              type="number"
              className="form-input"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(e.target.value)}
              min="0"
              max="100"
              step="1"
              placeholder="10"
            />
            <div className="help-text">
              Percentage to add to market value when calculating selling price. For example, 10% means selling price = market value × 1.10.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Exchange Rates</label>
            <div className="exchange-rates-info">
              <div className="help-text">
                Last updated: {formatLastUpdated(exchangeRatesLastUpdated)}
              </div>
              <button
                onClick={handleRefreshExchangeRates}
                className="btn btn-secondary"
                disabled={isRefreshingRates}
                style={{ marginTop: '0.5rem' }}
              >
                {isRefreshingRates ? 'Refreshing...' : 'Refresh Exchange Rates'}
              </button>
            </div>
            <div className="help-text" style={{ marginTop: '0.5rem' }}>
              Exchange rates are automatically updated daily. Click to manually refresh from live rates.
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {saveMessage && (
            <div className="success-message">
              {saveMessage}
            </div>
          )}

          <div className="form-actions">
            <button onClick={handleSave} className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h2>About FlipStash</h2>
          <p className="about-text">
            FlipStash is a self-hosted application for tracking your physical video game collection.
            Track purchase values, current market values, and sale information to manage and potentially
            profit from your game collection.
          </p>
          <div className="version-info">
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
