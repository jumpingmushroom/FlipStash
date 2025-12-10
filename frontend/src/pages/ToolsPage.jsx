import React, { useState, useRef } from 'react';
import { gamesApi } from '../services/api';
import './ToolsPage.css';

function ToolsPage({ onDataChange }) {
  const [importMode, setImportMode] = useState('skip');
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const response = await gamesApi.exportCSV();

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv' });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipstash_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Export successful! Check your downloads folder.');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setImportFile(file);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a CSV file first');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      // Read the file as text
      const text = await importFile.text();

      // Send to API
      const response = await gamesApi.importCSV(text, importMode);

      setImportResults(response.data.results);

      // Refresh the games list in the parent component
      if (onDataChange) {
        onDataChange();
      }

      // Clear the file input
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="tools-page">
      <div className="page-header">
        <h1>🛠️ Data Management Tools</h1>
      </div>

      <section className="tools-section">
        <h2>📤 Export Collection</h2>
        <p>Download your entire collection as a CSV file for backup or analysis in Excel.</p>
        <button onClick={handleExport} className="btn btn-primary">
          📥 Download CSV
        </button>
      </section>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

      <section className="tools-section">
        <h2>📥 Import Collection</h2>
        <p>Bulk add or update games from a CSV file. Great for existing collectors!</p>

        <div className="import-controls">
          <div className="form-group">
            <label htmlFor="import-mode">Import Mode:</label>
            <select
              id="import-mode"
              className="select"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
              disabled={isImporting}
            >
              <option value="skip">Skip Duplicates - Keep existing data, only add new games</option>
              <option value="update">Update Duplicates - Update existing games with CSV data</option>
              <option value="replace">Replace All - Delete all games and import from CSV</option>
            </select>
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Duplicates are identified by matching name and platform.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="csv-file">Select CSV File:</label>
            <input
              ref={fileInputRef}
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="input"
              style={{ padding: '0.5rem' }}
            />
          </div>

          <button
            onClick={handleImport}
            className="btn btn-primary"
            disabled={!importFile || isImporting}
          >
            {isImporting ? '⏳ Importing...' : '📤 Import CSV'}
          </button>
        </div>

        {importResults && (
          <div className="import-results">
            <h3>Import Results:</h3>
            <div className="results-grid">
              <div className="result-item">
                <div className="result-value">{importResults.total}</div>
                <div className="result-label">Total Rows</div>
              </div>
              <div className="result-item success">
                <div className="result-value">{importResults.imported}</div>
                <div className="result-label">Imported</div>
              </div>
              <div className="result-item info">
                <div className="result-value">{importResults.updated}</div>
                <div className="result-label">Updated</div>
              </div>
              <div className="result-item warning">
                <div className="result-value">{importResults.skipped}</div>
                <div className="result-label">Skipped</div>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div className="error-list">
                <h4>Errors:</h4>
                <ul>
                  {importResults.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                  {importResults.errors.length > 10 && (
                    <li>... and {importResults.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="csv-format-info">
          <h3>CSV Format Requirements:</h3>
          <ul>
            <li><strong>Required fields:</strong> name, platform</li>
            <li><strong>Optional fields:</strong> purchase_value, market_value, selling_value, sold_value, purchase_date, sale_date, condition, notes, igdb_id, etc.</li>
            <li>If igdb_id is provided, cover art and release date will be fetched automatically</li>
            <li>Use the export function to see the correct format</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default ToolsPage;
