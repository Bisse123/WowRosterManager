import { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RosterView from "./pages/RosterView";
import SplitsView from "./pages/SplitsView";
import PrioritiesView from "./pages/PrioritiesView";
import { TOKEN_TYPES } from "./utils/tokenDetection";
import ImportExportModals from "./components/Modals/ImportExportModals";
import AddPriorityItemModal from "./components/Modals/AddPriorityItemModal";
import RemovePriorityItemModal from "./components/Modals/RemovePriorityItemModal";
import { saveToLocalStorage, loadFromLocalStorage } from "./utils/storage";
import titleCase from "./utils/general";

export const ALT_SLOT_COUNT = 3;
export const SPLIT_AMOUNT = 4;

function App() {
  const [currentView, setCurrentView] = useState("roster");
  const [autoSort, toggleAutoSort] = useState(true);
  const [rosterPlayers, setRosterPlayers] = useState([]);
  const [SplitsPlayers, setSplitsPlayers] = useState([]);
  const [altSlotCount, setAltSlotCount] = useState(ALT_SLOT_COUNT);
  const [splitAmount, setSplitAmount] = useState(SPLIT_AMOUNT);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showAddPriorityModal, setShowAddPriorityModal] = useState(false);
  const [showRemovePriorityModal, setShowRemovePriorityModal] = useState(false);

  const defaultPriorities = Object.keys(TOKEN_TYPES).reduce((acc, k) => {
    acc[k] = { players: {}, types: TOKEN_TYPES[k] || [] };
    return acc;
  }, {});
  const [priorities, setPriorities] = useState(defaultPriorities);

  const initialisedFromStorage = useRef(false);
  const savedSplitsRef = useRef(null);

  const handleToggleView = (target) => {
    setCurrentView(target);
  };

  useEffect(() => {
    if (initialisedFromStorage.current) return;
    const savedRoster = loadFromLocalStorage("wrm_roster");
    if (savedRoster) setRosterPlayers(savedRoster);
    const savedSplits = loadFromLocalStorage("wrm_splits");
    if (savedSplits) {
      savedSplitsRef.current = savedSplits;
      setSplitsPlayers(savedSplits);
    }
    const savedPriorities = loadFromLocalStorage("wrm_priorities");
    if (savedPriorities) setPriorities(savedPriorities);

    const savedMeta = loadFromLocalStorage("wrm_meta");
    if (savedMeta) {
      if (typeof savedMeta.altSlotCount === "number")
        setAltSlotCount(savedMeta.altSlotCount);
      if (typeof savedMeta.splitAmount === "number")
        setSplitAmount(savedMeta.splitAmount);
      if (typeof savedMeta.autoSort === "boolean")
        toggleAutoSort(savedMeta.autoSort);
      if (typeof savedMeta.currentView === "string")
        setCurrentView(savedMeta.currentView);
    }
    initialisedFromStorage.current = true;
  }, []);

  useEffect(() => {
    saveToLocalStorage("wrm_roster", rosterPlayers);
  }, [rosterPlayers]);

  useEffect(() => {
    saveToLocalStorage("wrm_splits", SplitsPlayers);
  }, [SplitsPlayers]);

  useEffect(() => {
    saveToLocalStorage("wrm_priorities", priorities);
  }, [priorities]);

  useEffect(() => {
    saveToLocalStorage("wrm_meta", {
      altSlotCount,
      splitAmount,
      autoSort,
      currentView,
    });
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

  const setPlayerPriority = (tokenKey, playerId, priority = 5) => {
    setPriorities((prev) => {
      const data = prev[tokenKey] || { players: {}, types: [] };
      const playersMap = { ...(data.players || {}) };
      const p = priority == null ? null : Number(priority);
      if (p === null || p === 5) {
        delete playersMap[playerId];
      } else {
        playersMap[playerId] = p;
      }
      return { ...prev, [tokenKey]: { ...data, players: playersMap } };
    });
  };
  
  const clearPriorities = () => {
    setPriorities((prev = {}) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        next[k] = { players: {}, types: prev[k]?.types ?? [] };
      });
      return next;
    });
  };

  const addPriorityItem = (key, type) => {
    if (!key || typeof key !== "string") return;
    setPriorities((prev) => {
      if (prev && Object.prototype.hasOwnProperty.call(prev, key)) return prev;
      return { ...prev, [key]: { players: {}, types: type } };
    });
  };

  const openRemovePriorityModal = () => setShowRemovePriorityModal(true);
  const closeRemovePriorityModal = () => setShowRemovePriorityModal(false);

  const removePriorityItem = (key) => {
    if (!key) return;
    setPriorities((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const openAddPriorityModal = () => setShowAddPriorityModal(true);
  const closeAddPriorityModal = () => setShowAddPriorityModal(false);


  const handleSetSplitsPlayers = (players = rosterPlayers) => {
    setSplitsPlayers((prev) => {
      const findSaved = (id) => {
        return (
          prev.find((p) => p.id === id) ||
          (savedSplitsRef.current &&
            savedSplitsRef.current.find((p) => p.id === id)) ||
          null
        );
      };
      const splits = players.flatMap((player) => {
        const playerId = player.id;
        let mainSplit = "Unassigned";
        let mainRole = player.mainRole;
        const foundMain = findSaved(`${playerId}-main`);
        if (foundMain) {
          mainSplit = foundMain.split;
          mainRole = foundMain.role;
        }
        const playercharacters = [
          {
            id: `${playerId}-main`,
            name: player.mainName,
            charName: player.mainName,
            class: player.mainClass,
            role: mainRole,
            split: mainSplit,
            status: player.status,
          },
        ];
        for (let i = 1; i <= altSlotCount; i++) {
          if (
            player[`alt${i}Name`] ||
            player[`alt${i}Class`] ||
            player[`alt${i}Role`]
          ) {
            let altSplit = "Unassigned";
            let altRole = player[`alt${i}Role`] || "";
            const foundAlt = findSaved(`${playerId}-alt${i}`);
            if (foundAlt) {
              altSplit = foundAlt.split;
              altRole = foundAlt.role;
            }
            playercharacters.push({
              id: `${playerId}-alt${i}`,
              name: player.mainName,
              charName: player[`alt${i}Name`] || "",
              class: player[`alt${i}Class`] || "",
              role: altRole,
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
                  toolbarProps={{
                    onImport: () => setShowImportExportModal("Import"),
                    onExport: () => setShowImportExportModal("Export"),
                    onToggleView: handleToggleView,
                    currentView,
                    autoSort,
                    toggleAutoSort,
                  }}
                  autoSort={autoSort}
                  players={rosterPlayers}
                  setPlayers={setRosterPlayers}
                  altSlotCount={altSlotCount}
                  setAltSlotCount={setAltSlotCount}
                />
              ) : currentView === "splits" ? (
                <SplitsView
                  toolbarProps={{
                    onImport: () => setShowImportExportModal("Import"),
                    onExport: () => setShowImportExportModal("Export"),
                    onToggleView: handleToggleView,
                    currentView,
                    autoSort,
                    toggleAutoSort,
                  }}
                  autoSort={autoSort}
                  players={SplitsPlayers}
                  setPlayers={setSplitsPlayers}
                  splitAmount={splitAmount}
                  setSplitAmount={setSplitAmount}
                  priorities={priorities}
                />
              ) : (
                <PrioritiesView
                  toolbarProps={{
                    onImport: () => setShowImportExportModal("Import"),
                    onExport: () => setShowImportExportModal("Export"),
                    onToggleView: handleToggleView,
                    currentView,
                    autoSort,
                    toggleAutoSort,
                    onClearAllPriorities: () => clearPriorities(),
                    onAddPriorityItem: () => openAddPriorityModal(),
                    onRemovePriorityItem: () => openRemovePriorityModal(),
                  }}
                  players={rosterPlayers}
                  priorities={priorities}
                  onPriorityChange={setPlayerPriority}
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
        priorities={priorities}
        setPriorities={setPriorities}
        altSlotCount={altSlotCount}
        setAltSlotCount={setAltSlotCount}
        setSplitAmount={setSplitAmount}
      />
      <AddPriorityItemModal
        show={showAddPriorityModal}
        onClose={closeAddPriorityModal}
        onAdd={(key, type) => {
          addPriorityItem(key, type);
          closeAddPriorityModal();
        }}
      />
      <RemovePriorityItemModal
        show={showRemovePriorityModal}
        onClose={closeRemovePriorityModal}
        priorities={priorities}
        onRemove={(k) => {
          removePriorityItem(k);
        }}
      />
    </>
  );
}

export default App;
