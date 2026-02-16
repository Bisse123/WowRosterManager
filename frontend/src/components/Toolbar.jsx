import { useState, useEffect } from 'react';

function Toolbar({ onAddPlayer, onSave }) {

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🎮 HKM War Room</h1>
      </div>

      <div className="toolbar-center">
            <button onClick={onAddPlayer} className="toolbar-btn primary">
              ➕ Add New Player
            </button>
        
      </div>

      <div className="toolbar-right">
            <button onClick={onSave} className="toolbar-btn save">
              Import Roster
            </button>
            <button onClick={onSave} className="toolbar-btn save">
              Export Roster
            </button>
      </div>
    </div>
  );
}

export default Toolbar;