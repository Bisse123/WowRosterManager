import { useState, useEffect } from 'react';

function Toolbar({ sessionId, participantCount, isConnected, lastSaved, readonly, onAddPlayer, onSave, clientName, onClientNameCommit, onStartLive }) {
  const [inputValue, setInputValue] = useState(clientName || '');

  useEffect(() => {
    setInputValue(clientName || '');
  }, [clientName]);
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('📋 Share link copied to clipboard!');
  };

  const copyReadonlyLink = () => {
    const readonlyUrl = `${window.location.origin}/session/${sessionId}/readonly`;
    navigator.clipboard.writeText(readonlyUrl);
    alert('📋 Read-only link copied to clipboard!');
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🎮 HKM War Room</h1>
        <div className="session-and-name">
          <span className="session-id">Session: {sessionId}</span>
          <div className="username-input">
            <label htmlFor="clientName" className="visually-hidden">Your name: </label>
            <input
              id="clientName"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => onClientNameCommit && onClientNameCommit(inputValue.trim())}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onClientNameCommit && onClientNameCommit(inputValue.trim()); e.currentTarget.blur(); } }}
              placeholder={clientName || 'Your name'}
              className="toolbar-username"
              title="Set the name others see when you select a player"
            />
          </div>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="status-indicators">
          <span className="status-item">
            👥 {participantCount} online
          </span>
          <span className={`status-item ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {readonly && <span className="readonly-badge">👁️ Read-only</span>}
        </div>
      </div>

      <div className="toolbar-right">
        {!readonly && (
          <>
            {isConnected ? (
              <>
                <button onClick={copyShareLink} className="toolbar-btn">
                  📋 Copy Share Link
                </button>
                <button onClick={copyReadonlyLink} className="toolbar-btn">
                  👁️ Copy Read-only Link
                </button>
              </>
            ) : (
              <button onClick={() => onStartLive && onStartLive()} className="toolbar-btn primary">
                🚀 Start Live Session
              </button>
            )}
            <button onClick={onAddPlayer} className="toolbar-btn primary">
              ➕ Add New Player
            </button>
            <button onClick={onSave} className="toolbar-btn save">
              💾 Save to Google Sheets
            </button>
          </>
        )}
        {lastSaved && (
          <span className="last-saved">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default Toolbar;