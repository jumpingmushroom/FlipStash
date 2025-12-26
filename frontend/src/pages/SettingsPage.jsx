import React, { useState, useEffect } from 'react';
import { CURRENCIES } from '../services/currency';
import { settingsApi } from '../services/api';
import './SettingsPage.css';

function SettingsPage({ currentCurrency, onCurrencyChange }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [markupPercentage, setMarkupPercentage] = useState(10);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch markup setting on mount
  useEffect(() => {
    const fetchMarkup = async () => {
      try {
        const response = await settingsApi.getMarkup();
        setMarkupPercentage(response.data.markup_percentage);
      } catch (err) {
        console.error('Failed to fetch markup setting:', err);
      }
    };
    fetchMarkup();
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
      await settingsApi.setMarkup(markup);

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    } catch (err) {
      setError('Failed to save settings: ' + (err.response?.data?.error || err.message));
      console.error('Error saving settings:', err);
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
