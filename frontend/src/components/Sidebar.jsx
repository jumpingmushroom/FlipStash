import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <h1>🎮 FlipStash</h1>
          </Link>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${isActive('/')}`}>
            <span className="sidebar-icon">🏠</span>
            <span className="sidebar-label">Home</span>
          </Link>
          <Link to="/statistics" className={`sidebar-link ${isActive('/statistics')}`}>
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-label">Statistics</span>
          </Link>
          <Link to="/price-tracker" className={`sidebar-link ${isActive('/price-tracker')}`}>
            <span className="sidebar-icon">📈</span>
            <span className="sidebar-label">Price Tracker</span>
          </Link>
          <Link to="/tools" className={`sidebar-link ${isActive('/tools')}`}>
            <span className="sidebar-icon">🛠️</span>
            <span className="sidebar-label">Tools</span>
          </Link>
          <Link to="/settings" className={`sidebar-link ${isActive('/settings')}`}>
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-label">Settings</span>
          </Link>
        </nav>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
    </>
  );
}

export default Sidebar;
