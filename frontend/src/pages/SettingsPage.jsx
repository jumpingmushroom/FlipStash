import React, { useState } from 'react';
import { CURRENCIES } from '../services/currency';
import './SettingsPage.css';

function SettingsPage({ currentCurrency, onCurrencyChange }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    onCurrencyChange(selectedCurrency);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => {
      setSaveMessage('');
    }, 2000);
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
