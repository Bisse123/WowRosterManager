import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SessionView from './pages/SessionView';

function App() {
  useEffect(() => {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    const setToolbarHeight = () => {
      const h = Math.round(toolbar.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--toolbar-height', `${h}px`);
    };

    setToolbarHeight();

    const ro = new ResizeObserver(setToolbarHeight);
    ro.observe(toolbar);
    window.addEventListener('resize', setToolbarHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setToolbarHeight);
    };
  }, []);
  
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<SessionView sessionId={"local"} />} />
          <Route path="/session/:sessionId" element={<SessionView />} />
          <Route path="/session/:sessionId/readonly" element={<SessionView readonly={true} />} />
          {/* Redirect /WowRosterManager/ to root session view */}
          <Route path="/WowRosterManager/" element={<SessionView sessionId={"local"} />} />
          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<SessionView sessionId={"local"} />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;