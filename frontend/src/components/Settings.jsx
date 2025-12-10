import React, { useState } from 'react';
import { CURRENCIES } from '../services/currency';

function Settings({ currentCurrency, onCurrencyChange, onClose }) {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
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
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Market values are scraped in USD and will be converted to your selected currency.
            </div>
          </div>

          {saveMessage && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--success-color)',
              color: 'white',
              borderRadius: '4px',
              marginTop: '1rem'
            }}>
              {saveMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
