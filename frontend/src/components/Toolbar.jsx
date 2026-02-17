function Toolbar({ onAddPlayer, onSave, onSort }) {

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🎮 HKM War Room</h1>
      </div>

      <div className="toolbar-center">
        <button onClick={onAddPlayer} className="toolbar-btn primary">
          ➕ Add New Player
        </button>
        <button onClick={onSort} className="toolbar-btn sort" style={{ marginLeft: 16 }} title="Sort Players">
          ⇅ Sort Players
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