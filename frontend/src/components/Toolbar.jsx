import React from "react";

function Toolbar({
  onAddPlayer,
  onImport,
  onExport,
  onSort,
  autoSort,
  toggleAutoSort,
  onToggleView,
  currentView,
  altSlotCount = 3,
  onAltSlotCountChange,
  splitAmount = 3,
  onSplitAmountChange,
  onResetSplits,
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
        <label>
          <input
            type="checkbox"
            checked={autoSort}
            onChange={(e) =>
              typeof toggleAutoSort === "function" &&
              toggleAutoSort(e.target.checked)
            }
            style={{ marginRight: 2 }}
          />
          Auto sort
        </label>
        {!autoSort && (
          <button
            onClick={onSort}
            className="toolbar-btn sort"
            title="Sort Players"
          >
            ⇅ Sort Players
          </button>
        )}
      </div>

      <div className="toolbar-center">

        {currentView === "splits" && (
          <button
            onClick={onResetSplits
              }
            className="toolbar-btn reset"
            title="Reset Splits"
          >
            🔄 Reset Splits
          </button>
        )}

        {currentView === "roster" && (
          <div>
            <button
              onClick={onAddPlayer}
              className="toolbar-btn primary"
              title="Add Player"
            >
              ➕ Add New Player
            </button>
          </div>
        )}
        <div className="toolbar-dropdown">
          <label>{currentView === "roster" ? "Max Alts" : "Max Splits"}</label>
          <select
            value={currentView === "roster" ? altSlotCount : splitAmount}
            onChange={(e) =>
              currentView === "roster"
                ? onAltSlotCountChange &&
                  onAltSlotCountChange(Number(e.target.value))
                : onSplitAmountChange &&
                  onSplitAmountChange(Number(e.target.value))
            }
          >
            {[...Array(9)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {currentView === "roster" ? "Alts" : "Groups"}
              </option>
            ))}
          </select>
        </div>
      </div>

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
    </div>
  );
}

export default Toolbar;
