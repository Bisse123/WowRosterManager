import React from "react";

function Toolbar({
  onAddPlayer,
  onImport,
  onExport,
  onSort,
  onToggleView,
  currentView,
  altSlotCount = 3,
  onAltSlotCountChange,
  splitAmount = 3,
  onSplitAmountChange,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🎮 HKM War Room</h1>
        <button
          onClick={onToggleView}
          className="toolbar-btn"
          title="Swap View"
        >
          {currentView === "roster" ? "🔀 View Splits" : "🔀 View Roster"}
        </button>
      </div>

      {currentView === "roster" && (
        <div className="toolbar-center">
          <button
            onClick={onAddPlayer}
            className="toolbar-btn primary"
            title="Add Player"
          >
            ➕ Add New Player
          </button>
          <button
            onClick={onSort}
            className="toolbar-btn sort"
            title="Sort Players"
          >
            ⇅ Sort Players
          </button>
          <div className="toolbar-dropdown">
            <label>Max Alts</label>
            <select
              value={altSlotCount}
              onChange={(e) =>
                onAltSlotCountChange &&
                onAltSlotCountChange(Number(e.target.value))
              }
            >
              {[...Array(9)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {currentView === "roster" && (
        <div className="toolbar-right">
          <div>
            <button
              onClick={onImport}
              className="toolbar-btn import"
              title="Import Roster"
            >
              Import Roster
            </button>
            <button
              onClick={onExport}
              className="toolbar-btn export"
              title="Export Roster"
            >
              Export Roster
            </button>
          </div>
        </div>
      )}

      {currentView === "splits" && (
        <div className="toolbar-center">
          <div className="toolbar-dropdown">
            <label>Number of splits</label>
            <select
              value={splitAmount}
              onChange={(e) =>
                onSplitAmountChange &&
                onSplitAmountChange(Number(e.target.value))
              }
            >
              {[...Array(9)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Groups
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {currentView === "splits" && <div className="toolbar-right"></div>}
    </div>
  );
}

export default Toolbar;
