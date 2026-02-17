import { useEffect } from 'react';
import { useState } from 'react';
import { DndContext, DragOverlay, rectIntersection, closestCenter, pointerWithin } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import RosterSection from '../components/RosterSection';
import Sidebar from '../components/Sidebar';
import Toolbar from '../components/Toolbar';
import AddPlayerModal, { getInitialPlayerData } from '../components/AddPlayerModal';
import PlayerCard, { ALT_SLOT_COUNT } from '../components/PlayerCard';

function SessionView() {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeId, setActiveId] = useState(null); 
  const [dragTarget, setDragTarget] = useState({ status: null, index: null });
  const [hoverRect, setHoverRect] = useState(null);
  const pointer = { current: { x: 0, y: 0 } };
  const [editingPlayer, setEditingPlayer] = useState(null);

  const mainRoster = players.filter(p => p.status === 'Main');
  const trialRoster = players.filter(p => p.status === 'Trial');
  const benchRoster = players.filter(p => p.status === 'Bench');
  
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
    document.addEventListener('pointermove', onPointer);
    document.addEventListener('touchmove', onTouch, { passive: true });
    // stash references so we can remove later
    handleDragStart._pointerListener = onPointer;
    handleDragStart._touchListener = onTouch;

    const draggedId = event.active.id;
    const found = players.find(p => p.id === draggedId);
    if (found) {
      setDragTarget({ status: null, index: null });
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !active) {
      setHoverRect(null);
      return;
    }


    let toSection = null;
    const activePlayer = players.find(p => p.id === active.id);
    const overPlayer = players.find(p => p.id === over.id);
    if (overPlayer) {
      toSection = overPlayer.status;
      const hoveredEl = document.querySelector(`[data-player-id="${over.id}"]`);
      if (hoveredEl) {
        const r = hoveredEl.getBoundingClientRect();
        setHoverRect({ id: over.id, top: r.top, height: r.height });
        const secPlayers = players.filter(p => p.status === overPlayer.status);
        const idx = secPlayers.findIndex(p => p.id === over.id);
        setDragTarget({ status: overPlayer.status, index: idx });
      }
    } else if (over.id.endsWith('-empty') || over.id.endsWith('-end')) {
      toSection = over.id.replace(/(-empty|-end)$/, '');
      setHoverRect(null);
    }


    // If active player exists and its section differs from target, move it
    // visually into the target section at the end so the section change is
    // visible while dragging. Final ordering will be applied on drop.
    if (activePlayer && toSection && activePlayer.status !== toSection) {
      setPlayers(prev => {
        const without = prev.filter(p => p.id !== active.id);
        const secs = {
          Main: without.filter(p => p.status === 'Main'),
          Trial: without.filter(p => p.status === 'Trial'),
          Bench: without.filter(p => p.status === 'Bench'),
        };
        const moved = { ...activePlayer, status: toSection };
        secs[toSection] = [...secs[toSection], moved];
        return [...secs.Main, ...secs.Trial, ...secs.Bench];
      });
      const secPlayers = players.filter(p => p.status === toSection && p.id !== active.id);
      setDragTarget({ status: toSection, index: overPlayer ? 0 : secPlayers.length });
      return;
    }

    // Same-section hover: set dragTarget index to hovered player's index
    if (!over.id.endsWith('-empty') && !over.id.endsWith('-end')) {
      const overPlayer = players.find(p => p.id === over.id);
      if (overPlayer) {
        const secPlayers = players.filter(p => p.status === overPlayer.status);
        const idx = secPlayers.findIndex(p => p.id === over.id);
        setDragTarget({ status: overPlayer.status, index: idx });
      }
      return;
    }

    // Empty or end sentinel: move active to end of that section
    if (over.id.endsWith('-empty') || over.id.endsWith('-end')) {
      const status = over.id.replace(/(-empty|-end)$/, '');
      if (activePlayer) {
        setPlayers(prev => {
          const without = prev.filter(p => p.id !== active.id);
          const secs = {
            Main: without.filter(p => p.status === 'Main'),
            Trial: without.filter(p => p.status === 'Trial'),
            Bench: without.filter(p => p.status === 'Bench'),
          };
          const moved = { ...activePlayer, status };
          secs[status] = [...secs[status], moved];
          return [...secs.Main, ...secs.Trial, ...secs.Bench];
        });
        const secPlayers = players.filter(p => p.status === status && p.id !== active.id);
        setDragTarget({ status, index: secPlayers.length });
      }
    }
  };

  const handleDragMove = (event) => {
    if (!hoverRect) return;
    try {
      const dMid = pointer.current && pointer.current.y ? pointer.current.y : null;
      if (dMid == null) return;
      const hMid = hoverRect.top + hoverRect.height / 2;
      const overId = hoverRect.id;
      const overPlayer = players.find(p => p.id === overId);
      if (!overPlayer) return;
      const secPlayers = players.filter(p => p.status === overPlayer.status);
      const hoveredIndex = secPlayers.findIndex(p => p.id === overId);
      let insertIndex = hoveredIndex;
      if (dMid > hMid) insertIndex += 1;
      setDragTarget({ status: overPlayer.status, index: insertIndex });
    } catch (e) {
      // ignore
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    // cleanup global pointer listeners
    try {
      if (handleDragStart._pointerListener) document.removeEventListener('pointermove', handleDragStart._pointerListener);
      if (handleDragStart._touchListener) document.removeEventListener('touchmove', handleDragStart._touchListener);
    } catch (e) {
      // ignore
    }

    if (dragTarget && dragTarget.status && Number.isInteger(dragTarget.index)) {
      setPlayers(prev => {
        const secs = {
          Main: prev.filter(p => p.status === 'Main'),
          Trial: prev.filter(p => p.status === 'Trial'),
          Bench: prev.filter(p => p.status === 'Bench'),
        };
        const section = secs[dragTarget.status];
        const fromIdx = section.findIndex(p => p.id === activeId);
        if (fromIdx === -1) return prev;
        const toIdx = Math.max(0, Math.min(dragTarget.index, section.length - (fromIdx < dragTarget.index ? 1 : 0)));
        const newSection = arrayMove(section, fromIdx, toIdx);
        const rebuilt = [
          ...(dragTarget.status === 'Main' ? newSection : secs.Main),
          ...(dragTarget.status === 'Trial' ? newSection : secs.Trial),
          ...(dragTarget.status === 'Bench' ? newSection : secs.Bench),
        ].flat();
        return rebuilt;
      });
    }

    setDragTarget({ status: null, index: null });
    setHoverRect(null);
  };

  const updatePlayerCardColumnWidths = () => {
    // Query all player cards (excluding header)
    const cards = document.querySelectorAll('.player-card');
    let maxName = 0, maxClass = 0, maxRole = 0;
    const maxAlt = Array(ALT_SLOT_COUNT).fill(0);

    console.log(cards);

    cards.forEach(card => {
      const nameEl = card.querySelector('.player-name');
      const classEl = card.querySelector('.player-class');
      const roleEl = card.querySelector('.role-badge');
      if (nameEl) maxName = Math.max(maxName, nameEl.scrollWidth);
      if (classEl) maxClass = Math.max(maxClass, classEl.scrollWidth);
      if (roleEl) maxRole = Math.max(maxRole, roleEl.scrollWidth);
      const altEls = card.querySelectorAll('.player-alt');
      altEls.forEach((altEl, i) => {
        if (altEl) maxAlt[i] = Math.max(maxAlt[i], altEl.scrollWidth);
      });
    });

    // Fallback minimums
    const nameWidth = Math.max(maxName, 12) + 10;
    const classWidth = Math.max(maxClass, 12) + 10;
    const roleWidth = Math.max(maxRole, 12) + 10;
    document.documentElement.style.setProperty('--main-name-width', `${nameWidth}px`);
    document.documentElement.style.setProperty('--main-class-width', `${classWidth}px`);
    document.documentElement.style.setProperty('--main-role-width', `${roleWidth}px`);
    maxAlt.forEach((w, i) => {
      document.documentElement.style.setProperty(`--alt${i+1}-width`, `${Math.max(w, 12) + 10}px`);
    });
  };

  const handleAddPlayer = (playerData) => {
    const newPlayer = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      ...getInitialPlayerData(playerData)
    };
    setPlayers(prev => {
      const secs = {
        Main: prev.filter(p => p.status === 'Main'),
        Trial: prev.filter(p => p.status === 'Trial'),
        Bench: prev.filter(p => p.status === 'Bench'),
      };
      const status = newPlayer.status || 'Main';
      secs[status] = [...secs[status], newPlayer];
      const updated = [...secs.Main, ...secs.Trial, ...secs.Bench];
      return updated;
    });
    setShowAddModal(false);
  };

  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setShowEditModal(true);
  };

  const handleRemovePlayer = (playerId) => {
    setPlayers(prev => {
      const updated = prev.filter(p => p.id !== playerId);
      return updated;
    });
  };

  const handleSaveEdit = (updatedData) => {
    if (!editingPlayer) return;
    const updates = { ...updatedData };
    setPlayers(prev => {
      const updated = prev.map(p => p.id === editingPlayer.id ? { ...p, ...updates } : p);
      return updated;
    });
    setShowEditModal(false);
    setEditingPlayer(null);
  };

  // Sorting function for players
  const handleSortPlayers = () => {
    const statusOrder = { Main: 0, Trial: 1, Bench: 2 };
    const roleOrder = { tank: 0, healer: 1, melee: 2, ranged: 3 };
    setPlayers(prev => {
      const sorted = [...prev].sort((a, b) => {
        const sA = statusOrder[a.status] ?? 99;
        const sB = statusOrder[b.status] ?? 99;
        if (sA !== sB) return sA - sB;
        const rA = roleOrder[a.mainRole] ?? 99;
        const rB = roleOrder[b.mainRole] ?? 99;
        if (rA !== rB) return rA - rB;
        return (a.mainName || '').localeCompare(b.mainName || '', undefined, { sensitivity: 'base' });
      });
      return sorted;
    });
  };

  useEffect(() => {
    setTimeout(() => {
      updatePlayerCardColumnWidths();
    }, 0);
  });

  return (
    <div className="session-view">
      <Toolbar
        onAddPlayer={() => setShowAddModal(true)}
        onSort={handleSortPlayers}
      />

      <div className="session-content">
        <div className="roster-container">
          <DndContext
            collisionDetection={(args) => {
              // Prefer collisions with player cards and empty-section placeholders so
              // sections without players can still accept drops. Build a list of
              // valid target ids (player ids + empty placeholders).
              const playerIds = players.map(p => p.id);
              const allowedStatuses = ['Main', 'Trial', 'Bench'];
              const emptyPlaceholders = allowedStatuses
                .filter(s => players.filter(p => p.status === s).length === 0)
                .map(s => `${s}-empty`);
              const endPlaceholders = allowedStatuses.map(s => `${s}-end`);
              const validIds = new Set([...playerIds, ...emptyPlaceholders, ...endPlaceholders]);

              const filterToValid = (list) => (Array.isArray(list) ? list.filter(i => i && validIds.has(i.id || i)) : []);

              let byRect = rectIntersection(args) || [];
              byRect = filterToValid(byRect);
              if (byRect.length) return byRect;

              let byCenter = closestCenter(args) || [];
              byCenter = filterToValid(byCenter);
              if (byCenter.length) return byCenter;

              let byPointer = pointerWithin(args) || [];
              byPointer = filterToValid(byPointer);
              if (byPointer.length) return byPointer;

              // As a last resort return the full rectIntersection (may include sections)
              return rectIntersection(args) || [];
            }}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <RosterSection
              title="Main Roster"
              status="Main"
              players={mainRoster}
              onEdit={handleEditClick}
              onRemove={handleRemovePlayer}
            />
            <RosterSection
              title="Trials"
              status="Trial"
              players={trialRoster}
              onEdit={handleEditClick}
              onRemove={handleRemovePlayer}
            />
            <RosterSection
              title="Bench / Backup"
              status="Bench"
              players={benchRoster}
              onEdit={handleEditClick}
              onRemove={handleRemovePlayer}
            />

            <DragOverlay>
              {activeId ? (
                <PlayerCard
                  player={players.find(p => p.id === activeId)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      <Sidebar
        className="Sidebar"
        players={mainRoster.concat(trialRoster)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        mainRosterSize={mainRoster.length + trialRoster.length}
        benchRosterSize={benchRoster.length}
      />
      </div>


      {showAddModal && (
        <AddPlayerModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPlayer}
          existingNames={players.map(p => p.mainName)}
        />
      )}
      {showEditModal && editingPlayer && (
        <AddPlayerModal
          onClose={() => { setShowEditModal(false); setEditingPlayer(null); }}
          initialData={editingPlayer}
          onSave={handleSaveEdit}
          existingNames={players.filter(p => p.id !== editingPlayer.id).map(p => p.mainName)}
        />
      )}
    </div>
  );
}

export default SessionView;