import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { GoogleOAuthProvider } from '@react-oauth/google';
import CreateSession from './pages/CreateSession';
import SessionView from './pages/SessionView';

function App() {
  // <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  //   ...existing code...
  // </GoogleOAuthProvider>
  // For testing without Google authentication, use a fragment:
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<CreateSession />} />
          <Route path="/session/:sessionId" element={<SessionView />} />
          <Route path="/session/:sessionId/readonly" element={<SessionView readonly={true} />} />
          {/* Redirect /WowRosterManager/ to / */}
          <Route path="/WowRosterManager/" element={<CreateSession />} />
          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<CreateSession />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;