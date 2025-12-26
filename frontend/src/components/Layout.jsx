import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { convertCurrency, formatCurrency } from '../services/currency';
import './Layout.css';

function Layout({ children, stats, currency }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <button className="hamburger-menu" onClick={toggleSidebar}>
                <span></span>
                <span></span>
                <span></span>
              </button>
              <Link to="/" className="logo-link">
                <h1>🎮 FlipStash</h1>
              </Link>
            </div>
            {stats && (
              <div className="header-stats">
                <div className="stat-item">
                  <div className="stat-value">{stats.totalGames}</div>
                  <div className="stat-label">Total Games</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatCurrency(convertCurrency(stats.totalValue, 'USD', currency), currency)}</div>
                  <div className="stat-label">Collection Value</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: stats.totalProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(convertCurrency(Math.abs(stats.totalProfit), 'USD', currency), currency)}
                  </div>
                  <div className="stat-label">Total Profit</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.soldGames}</div>
                  <div className="stat-label">Games Sold</div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
