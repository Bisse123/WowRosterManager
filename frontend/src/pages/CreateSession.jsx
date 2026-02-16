import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOfflineOptions, setShowOfflineOptions] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    // Redirect immediately to a transient session view so users land in SessionView
    const id = generateTempSessionId();
    navigate(`/session/${id}`);
  }, []);
  const createSession = async () => {
    setIsLoading(true);
    setError('');
    setShowOfflineOptions(false);

    try {
      // Create a session with an empty roster
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      navigate(`/session/${data.sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to contact backend server');
      setShowOfflineOptions(true);
    } finally {
      setIsLoading(false);
    }
  };

  function generateTempSessionId() {
    return `local-${Math.random().toString(36).slice(2, 9)}`;
  }

  return (
    <div className="create-session-page">
      <div className="create-session-container">
        <h1>WoW Guild Roster Manager</h1>
        <p className="subtitle">Create a collaborative roster management session</p>

        <div className="setup-section">
          <button 
            onClick={createSession} 
            disabled={isLoading}
            className="create-btn"
          >
            {isLoading ? 'Creating Session...' : '🚀 Start with Empty Roster'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showOfflineOptions && (
          <div className="offline-options">
            <h3>Backend is offline — options to proceed</h3>
            <p>You can run the backend locally or expose it with a tunnel. Alternatively open the session view now (it will show a disconnected state until the backend is available).</p>
            <pre style={{ background: '#111', color: '#fff', padding: 12, borderRadius: 6 }}>
{`cd backend
npm install
node server.js`}
            </pre>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigator.clipboard?.writeText('cd backend && npm install && node server.js')}>Copy run command</button>
              <button style={{ marginLeft: 8 }} onClick={() => {
                const id = generateTempSessionId();
                navigate(`/session/${id}`);
              }}>Open session view offline</button>
            </div>
            <p style={{ marginTop: 8 }}>To make your local server reachable from the internet, run a tunnel:</p>
              <pre style={{ background: '#111', color: '#fff', padding: 12, borderRadius: 6 }}># localtunnel (no account required)
  npx localtunnel --port 3000

  # ngrok (if you prefer ngrok)
  npx ngrok http 3000</pre>
          </div>
        )}

        <div className="info-box">
          <h3>How it works:</h3>
          <ol>
            <li>Start with an empty roster</li>
            <li>Create a session and get a shareable link</li>
            <li>Collaborate in real-time with your guild!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CreateSession;