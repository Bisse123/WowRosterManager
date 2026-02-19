import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RosterView from "./pages/RosterView";
import SplitsView from "./pages/SplitsView";
import { useState } from "react";

export const ALT_SLOT_COUNT = 3;

function App() {
  const [currentView, setCurrentView] = useState("roster");
  const [rosterPlayers, setPlayers] = useState([]);
  const [SplitsPlayers, setSplitsPlayers] = useState([]);
  const [altSlotCount, setAltSlotCount] = useState(ALT_SLOT_COUNT);
  const handleToggleView = () =>
    setCurrentView((v) => (v === "roster" ? "splits" : "roster"));

  useEffect(() => {
    const toolbar = document.querySelector(".toolbar");
    if (!toolbar) return;

    const setToolbarHeight = () => {
      const h = Math.round(toolbar.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--toolbar-height", `${h}px`);
    };

    setToolbarHeight();

    const ro = new ResizeObserver(setToolbarHeight);
    ro.observe(toolbar);
    window.addEventListener("resize", setToolbarHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setToolbarHeight);
    };
  });
  
  useEffect(() => {
    setSplitsPlayers((prev) => {
      return rosterPlayers.flatMap((player) => {
        const playerId = player.id;
        let mainSplit = "Characters Unassigned";
        if (prev.find((p) => p.id === `${playerId}-main`)) {
          mainSplit = prev.find((p) => p.id === `${playerId}-main`).split;
        }
        const playercharacters = [
          {
            id: `${playerId}-main`,
            name: player.mainName,
            class: player.mainClass,
            role: player.mainRole,
            split: mainSplit,
          },
        ];
        for (let i = 1; i <= altSlotCount; i++) {
          if (player[`alt${i}Name`]) {
            let altSplit = "Characters Unassigned";
            if (prev.find((p) => p.id === `${playerId}-alt${i}`)) {
              altSplit = prev.find((p) => p.id === `${playerId}-alt${i}`).split;
            }
            playercharacters.push({
              id: `${playerId}-alt${i}`,
              name: player.mainName,
              class: player[`alt${i}Class`],
              role: player[`alt${i}Role`],
              split: altSplit,
            });
          }
        }
        return playercharacters;
      });
    });
  }, [rosterPlayers, altSlotCount]);


  return (
    <>
      <Router>
        <Routes>
          <Route
            path="*"
            element={
              currentView === "roster" ? (
                <RosterView
                  toolbarProps={{ onToggleView: handleToggleView, currentView }}
                  players={rosterPlayers}
                  setPlayers={setPlayers}
                  altSlotCount={altSlotCount}
                  setAltSlotCount={setAltSlotCount}
                />
              ) : (
                <SplitsView
                  toolbarProps={{ onToggleView: handleToggleView, currentView }}
                  players={SplitsPlayers}
                  setPlayers={setSplitsPlayers}
                />
              )
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
