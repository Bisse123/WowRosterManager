import { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RosterView from "./pages/RosterView";
import SplitsView from "./pages/SplitsView";
import ImportExportModals from "./pages/ImportExportModals";
import { useState } from "react";
import { saveToLocalStorage, loadFromLocalStorage } from "./utils/storage";

export const ALT_SLOT_COUNT = 3;
export const SPLIT_AMOUNT = 3;

function App() {
  const [currentView, setCurrentView] = useState("roster");
  const [autoSort, toggleAutoSort] = useState(true);
  const [rosterPlayers, setRosterPlayers] = useState([]);
  const [SplitsPlayers, setSplitsPlayers] = useState([]);
  const [altSlotCount, setAltSlotCount] = useState(ALT_SLOT_COUNT);
  const [splitAmount, setSplitAmount] = useState(SPLIT_AMOUNT);
  const [showImportExportModal, setShowImportExportModal] = useState(false);

  const initialisedFromStorage = useRef(false);
  const savedSplitsRef = useRef(null);

  const handleToggleView = () =>
    setCurrentView((v) => (v === "roster" ? "splits" : "roster"));

  useEffect(() => {
    if (initialisedFromStorage.current) return;
    const savedRoster = loadFromLocalStorage("wrm_roster");
    if (savedRoster) setRosterPlayers(savedRoster);
    const savedSplits = loadFromLocalStorage("wrm_splits");
    if (savedSplits) {
      savedSplitsRef.current = savedSplits;
      setSplitsPlayers(savedSplits);
    }
    const savedMeta = loadFromLocalStorage("wrm_meta");
    if (savedMeta) {
      if (typeof savedMeta.altSlotCount === "number") setAltSlotCount(savedMeta.altSlotCount);
      if (typeof savedMeta.splitAmount === "number") setSplitAmount(savedMeta.splitAmount);
      if (typeof savedMeta.autoSort === "boolean") toggleAutoSort(savedMeta.autoSort);
      if (typeof savedMeta.currentView === "string") setCurrentView(savedMeta.currentView);
    }
    initialisedFromStorage.current = true;
  }, []);
  useEffect(() => {
    saveToLocalStorage("wrm_roster", rosterPlayers);
  }, [rosterPlayers]);

  useEffect(() => {
    saveToLocalStorage("wrm_splits", SplitsPlayers);
    // console.log("Saved splits to storage:", SplitsPlayers);
  }, [SplitsPlayers]);

  useEffect(() => {
    saveToLocalStorage("wrm_meta", { altSlotCount, splitAmount, autoSort, currentView });
  }, [altSlotCount, splitAmount, autoSort, currentView]);


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
    if (showImportExportModal) return;
    handleSetSplitsPlayers();
  }, [rosterPlayers, altSlotCount]);

  const handleSetSplitsPlayers = (players = rosterPlayers) => {
    setSplitsPlayers((prev) => {
      const findSaved = (id) => {
        return (
          prev.find((p) => p.id === id) ||
          (savedSplitsRef.current && savedSplitsRef.current.find((p) => p.id === id)) ||
          null
        );
      };
      const splits = players.flatMap((player) => {
        const playerId = player.id;
        let mainSplit = "Unassigned";
        const foundMain = findSaved(`${playerId}-main`);
        if (foundMain) mainSplit = foundMain.split;
        const playercharacters = [
          {
            id: `${playerId}-main`,
            name: player.mainName,
            charName: player.mainName,
            class: player.mainClass,
            role: player.mainRole,
            split: mainSplit,
            status: player.status,
          },
        ];
        for (let i = 1; i <= altSlotCount; i++) {
          if (player[`alt${i}Name`] || player[`alt${i}Class`] || player[`alt${i}Role`]) {
            let altSplit = "Unassigned";
            const foundAlt = findSaved(`${playerId}-alt${i}`);
              if (foundAlt) altSplit = foundAlt.split;
            playercharacters.push({
              id: `${playerId}-alt${i}`,
              name: player.mainName,
              charName: player[`alt${i}Name`] || "",
              class: player[`alt${i}Class`] || "",
              role: player[`alt${i}Role`] || "",
              split: altSplit,
              status: null,
            });
          }
        }
        return playercharacters;
      });
      return splits;
    });
  };

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="*"
            element={
              currentView === "roster" ? (
                <RosterView
                  toolbarProps={{ onToggleView: handleToggleView, currentView, autoSort, toggleAutoSort}}
                  autoSort={autoSort}
                  players={rosterPlayers}
                  setPlayers={setRosterPlayers}
                  altSlotCount={altSlotCount}
                  setAltSlotCount={setAltSlotCount}
                  setShowImportExportModal={setShowImportExportModal}
                />
              ) : (
                <SplitsView
                  toolbarProps={{ onToggleView: handleToggleView, currentView, autoSort, toggleAutoSort}}
                  autoSort={autoSort}
                  players={SplitsPlayers}
                  setPlayers={setSplitsPlayers}
                  setShowImportExportModal={setShowImportExportModal}
                  splitAmount={splitAmount}
                  setSplitAmount={setSplitAmount}
                />
              )
            }
          />
        </Routes>
      </Router>
      <ImportExportModals
      showModal={showImportExportModal}
      setShowModal={setShowImportExportModal}
      RosterPlayers={rosterPlayers}
      setRosterPlayers={setRosterPlayers}
      SplitsPlayers={SplitsPlayers}
      setSplitsPlayers={setSplitsPlayers}
      altSlotCount={altSlotCount}
      setAltSlotCount={setAltSlotCount}
      setSplitAmount={setSplitAmount}
    />
    </>
  );
}

export default App;
