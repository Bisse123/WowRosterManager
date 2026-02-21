import { useEffect,useState } from "react";
import { DndContext, DragOverlay, rectIntersection } from "@dnd-kit/core";
import Toolbar from "../components/Toolbar";
import SplitsSection from "../components/Splits/SplitsSection";
import SplitsPlayerCard from "../components/Splits/SplitsPlayerCard";
import { WOW_CLASSES, WOW_ROLES } from "../utils/wowClasses";
import { SPLIT_AMOUNT } from "../App";


function SplitsView({ toolbarProps = {}, autoSort, players, setPlayers, splitAmount = SPLIT_AMOUNT, setSplitAmount, setShowImportExportModal }) {
  const [activeId, setActiveId] = useState(null);
  const [dragTarget, setDragTarget] = useState({
    newSplit: null,
    oldSplit: null,
    index: null,
  });
  const [swapTarget, setSwapTarget] = useState({
    id: null,
    newSplit: null,
    oldSplit: null,
    activeIndex: null,
  });
  const [hoverRect, setHoverRect] = useState(null);
  const pointer = { current: { x: 0, y: 0 } };

  const splits = Array.from({ length: splitAmount }, (_, i) => ({
    id: `split-${i + 1}`,
    name: `Split ${i + 1}`,
  }));

  useEffect(() => {
    if (autoSort) {
      handleSortPlayers();
    }
  }, [players, autoSort]);
    
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    // Track pointer position globally while dragging so we can compute
    // whether to insert before/after a hovered card
    const onPointer = (e) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    const onTouch = (e) => {
      if (e.touches && e.touches[0]) {
        pointer.current.x = e.touches[0].clientX;
        pointer.current.y = e.touches[0].clientY;
      }
    };
    document.addEventListener("pointermove", onPointer);
    document.addEventListener("touchmove", onTouch, { passive: true });
    // stash references so we can remove later
    handleDragStart._pointerListener = onPointer;
    handleDragStart._touchListener = onTouch;

    const draggedId = event.active.id;
    const found = players.find((p) => p.id === draggedId);
    if (found) {
      const idx = players
        .filter((p) => p.split === found.split)
        .findIndex((p) => p.id === draggedId);
      setDragTarget({
        newSplit: found.split,
        oldSplit: found.split,
        index: idx,
      });
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !active) {
      setHoverRect(null);
      return;
    }
    let toSection = null;
    const activePlayer = players.find((p) => p.id === active.id);
    const overPlayer = players.find((p) => p.id === over.id);
    if (overPlayer) {
      toSection = overPlayer.split;
      const hoveredEl = document.querySelector(`[data-player-id="${over.id}"]`);
      if (hoveredEl) {
        const r = hoveredEl.getBoundingClientRect();
        setHoverRect({ id: over.id, top: r.top, height: r.height });
        const secPlayers = players.filter((p) => p.split === overPlayer.split);
        const idx = secPlayers.findIndex((p) => p.id === over.id);
        setDragTarget((prev) => ({
          ...prev,
          newSplit: overPlayer.split,
          index: idx,
        }));
      }
    } else if (
      splits.some((s) => s.id === over.id) ||
      over.id.endsWith("-empty")
    ) {
      toSection = over.id.replace("-empty", "");
      setHoverRect(null);
      // Place at end of the split
      const secPlayers = players.filter((p) => p.split === toSection);
      setDragTarget((prev) => ({
        ...prev,
        newSplit: toSection,
        index: secPlayers.length,
      }));
    }

    if (activePlayer && toSection && activePlayer.split !== toSection) {
      let found = players.find(
        (p) =>
          p.split === toSection &&
          p.name === activePlayer.name &&
          p.id !== activePlayer.id &&
          p.split !== "Unassigned",
      );
      if (swapTarget && swapTarget.id) {
        setPlayers((prev) => {
          return prev.map((p) => {
            if (p.id === swapTarget.id) {
              return { ...p, split: swapTarget.oldSplit };
            }
            return p;
          });
        });
      }
      if (!found || (found && swapTarget && found.id === swapTarget.id)) {
        setSwapTarget(null);
        found = null;
      }
      if (found) {
        // If swapTarget exists and is different, restore previous swapTarget to its original split
        const secPlayers = players.filter(
          (p) => p.split === activePlayer.split,
        );
        const activeIndex = secPlayers.findIndex(
          (p) => p.id === activePlayer.id,
        );
        setSwapTarget({
          id: found.id,
          newSplit: dragTarget.oldSplit,
          oldSplit: found.split,
          activeIndex: activeIndex,
        });
      }
      setPlayers((prev) => {
        return prev.map((p) => {
          if (p.id === activePlayer.id) {
            return { ...p, split: toSection };
          } else if (found && p.id === found.id) {
            return { ...p, split: dragTarget.oldSplit };
          }
          return p;
        });
      });
      setDragTarget((prev) => ({ ...prev, newSplit: toSection }));
    }
  };

  const handleDragMove = (event) => {
    if (!hoverRect) return;
    try {
      const dMid =
        pointer.current && pointer.current.y ? pointer.current.y : null;
      if (dMid == null) return;
      const hMid = hoverRect.top + hoverRect.height / 2;
      const overId = hoverRect.id;
      const overPlayer = players.find((p) => p.id === overId);
      if (!overPlayer) return;
      const secPlayers = players.filter((p) => p.split === overPlayer.split);
      const hoveredIndex = secPlayers.findIndex((p) => p.id === overId);
      let insertIndex = hoveredIndex;
      if (dMid > hMid) insertIndex += 1;
      setDragTarget((prev) => ({
        ...prev,
        newSplit: overPlayer.split,
        index: insertIndex,
      }));
    } catch (e) {
      // ignore
    }
  };

  const handleDragEnd = (event) => {
    // cleanup global pointer listeners
    try {
      if (handleDragStart._pointerListener)
        document.removeEventListener(
          "pointermove",
          handleDragStart._pointerListener,
        );
      if (handleDragStart._touchListener)
        document.removeEventListener(
          "touchmove",
          handleDragStart._touchListener,
        );
    } catch (e) {
      // ignore
    }
    if (
      dragTarget &&
      dragTarget.newSplit &&
      Number.isInteger(dragTarget.index)
    ) {
      setPlayers((prev) => {
        const activePlayer = prev.find((p) => p.id === activeId);
        if (!activePlayer) return prev;
        const newSplit = dragTarget.newSplit;
        // Use swapTarget state for swap logic
        if (swapTarget && swapTarget.id) {
          return prev.map((p) => {
            if (p.id === activePlayer.id) {
              return { ...p, split: newSplit };
            } else if (p.id === swapTarget.id) {
              return { ...p, split: swapTarget.newSplit };
            }
            return p;
          });
        }
        // Remove active from its current split
        const withoutActive = prev.filter((p) => p.id !== activeId);
        // Get all players in the new split
        const splitPlayers = withoutActive.filter((p) => p.split === newSplit);
        // Insert at the correct index
        const before = splitPlayers.slice(0, dragTarget.index);
        const after = splitPlayers.slice(dragTarget.index);
        // Build new array
        let updated = [
          ...withoutActive.filter((p) => p.split !== newSplit),
          ...before,
          { ...activePlayer, split: newSplit },
          ...after,
        ];
        return updated;
      });
    }
    setDragTarget(null);
    setSwapTarget(null);
    setHoverRect(null);
    setActiveId(null);
  };
  
  const handleSortPlayers = () => {
    const splitOrder = splits.reduce((acc, s, index) => {
      acc[s.id] = index; 
      return acc;
    }, {});
    const classOrder = WOW_CLASSES.reduce((acc, cls, index) => {
      acc[cls.name] = index;
      return acc;
    }, {});
    const roleOrder = WOW_ROLES.reduce((acc, role, index) => {
      acc[role.key] = index;
      return acc;
    }, {});
    setPlayers((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const sA = splitOrder[a.split] ?? 99;
        const sB = splitOrder[b.split] ?? 99;
        if (sA !== sB) return sA - sB;
        const rA = roleOrder[a.role] ?? 99;
        const rB = roleOrder[b.role] ?? 99;
        if (rA !== rB) return rA - rB;
        const mA = !a.id.includes("-alt");
        const mB = !b.id.includes("-alt");
        if (mA !== mB) return mA ? -1 : 1;
        const cA = classOrder[a.class] ?? 99;
        const cB = classOrder[b.class] ?? 99;
        if (cA !== cB) return cA - cB;
        return (a.mainName || "").localeCompare(b.mainName || "", undefined, {
          sensitivity: "base",
        });
      });
      
      const same =
        sorted.length === prev.length &&
        sorted.every((p, i) => p.id === prev[i].id);
      return same ? prev : sorted;
    });
  };

  const handleResetSplits = () => {
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, split: "Unassigned" })),
    );
  };

  return (
    <div className="splits-view">
      <Toolbar
        onSort={handleSortPlayers}
        onImport={() => setShowImportExportModal("Import")}
        onExport={() => setShowImportExportModal("Export")}
        splitAmount={splitAmount}
        onSplitAmountChange={setSplitAmount}
        onResetSplits={handleResetSplits}
        {...toolbarProps}
      />
      <div className="splits-content">
        <DndContext
          collisionDetection={(args) => {
            return rectIntersection(args) || [];
          }}
          onDragMove={handleDragMove}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="splits-container">
            {splits.map((split) => (
              <SplitsSection
                key={split.id}
                title={split.name}
                split={split.id}
                players={players.filter((p) => p.split === split.id)}
              />
            ))}
          </div>
          <div className="splits-unassigned">
          <SplitsSection
            title="Unassigned"
            split="Unassigned"
            players={players.filter(
              (p) => !splits.some((s) => s.id === p.split),
            )}
          />
          </div>

          <DragOverlay>
            {activeId ? (
              <SplitsPlayerCard
                player={players.find((p) => p.id === activeId)}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default SplitsView;
