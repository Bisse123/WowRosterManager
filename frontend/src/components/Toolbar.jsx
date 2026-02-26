import React from "react";

function Toolbar({
  onAddPlayer,
  onImport,
  onExport,
  onSort,
  autoSort,
  toggleAutoSort,
  onClearAllPriorities,
  onAddPriorityItem,
  onRemovePriorityItem,
  onToggleView,
  currentView,
  altSlotCount = 3,
  onAltSlotCountChange,
  splitAmount = 3,
  onSplitAmountChange,
  onResetSplits,
  searchValue,
  onSearchChange,
  showDetailedView,
  onDetailedViewChange,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🎮 HKM War Room</h1>
        {currentView !== "roster" && (
          <button
            onClick={() => onToggleView("roster")}
            className="toolbar-btn"
            title="Swap View"
          >
            🔀 View Roster
          </button>
        )}
        {currentView !== "splits" && (
          <button
            onClick={() => onToggleView("splits")}
            className="toolbar-btn"
            title="Swap View"
          >
            🔀 View splits
          </button>
        )}
        {currentView !== "priorities" && (
          <button
            onClick={() => onToggleView("priorities")}
            className="toolbar-btn"
            title="Swap View"
          >
            🔀 View priorities
          </button>
        )}
      </div>

      <div className="toolbar-center">
        {currentView !== "priorities" && (
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
        )}
        {!autoSort && currentView !== "priorities" && (
          <button
            onClick={onSort}
            className="toolbar-btn sort"
            title="Sort Players"
          >
            ⇅ Sort Players
          </button>
        )}

        {currentView === "splits" && (
          <button
            onClick={onResetSplits}
            className="toolbar-btn reset"
            title="Reset Splits"
          >
            🔄 Reset Splits
          </button>
        )}
        
        {currentView === "splits" && (
          <button
            onClick={onDetailedViewChange}
            className="toolbar-btn priority"
            title="Show Detailed View"
          >
            Priority {showDetailedView ? "Summary View" : "Detailed View"}
          </button>
        )}

        {currentView === "roster" && (
          <div>
            <button
              onClick={onAddPlayer}
              className="toolbar-btn add"
              title="Add Player"
            >
              ➕ Add New Player
            </button>
          </div>
        )}
        {currentView !== "priorities" && (
          <div className="toolbar-dropdown">
            <label>
              {currentView === "roster" ? "Max Alts" : "Max Splits"}
            </label>
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
        )}
        {currentView === "priorities" && (
          <button
            onClick={onAddPriorityItem}
            className="toolbar-btn add"
            title="Add Priority Item"
          >
            ➕ Add Priority Item
          </button>
        )}
        {currentView === "priorities" && (
          <button
            onClick={onRemovePriorityItem}
            className="toolbar-btn remove"
            title="Remove Priority Item"
          >
            ➖ Remove Priority Item
          </button>
        )}
        {currentView === "priorities" && (
          <button
            onClick={onClearAllPriorities}
            className="toolbar-btn clear"
            title="Clear All Priorities"
          >
            🗑️ Clear All Priorities
          </button>
        )}
      </div>

      <div className="toolbar-right">
        {onSearchChange && (
          <input
            type="text"
            placeholder="🔍 Search players..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        )}
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
  );
}

export default Toolbar;
