import React from 'react';
import './ViewModeToggle.css';

function ViewModeToggle({ currentMode, onModeChange }) {
  const modes = [
    { id: 'grid', label: 'Grid', icon: '⊞' },
    { id: 'list', label: 'List', icon: '☰' },
    { id: 'tiles', label: 'Tiles', icon: '⊡' }
  ];

  return (
    <div className="view-mode-toggle">
      {modes.map(mode => (
        <button
          key={mode.id}
          className={`view-mode-btn ${currentMode === mode.id ? 'active' : ''}`}
          onClick={() => onModeChange(mode.id)}
          title={`${mode.label} view`}
        >
          <span className="view-mode-icon">{mode.icon}</span>
          <span className="view-mode-label">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

export default ViewModeToggle;
