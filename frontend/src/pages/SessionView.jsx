import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragOverlay, rectIntersection, closestCenter, pointerWithin } from '@dnd-kit/core';
import useSocket from '../hooks/useSocket';
import RosterSection from '../components/RosterSection';
import Sidebar from '../components/Sidebar';
import Toolbar from '../components/Toolbar';
import AddPlayerModal from '../components/AddPlayerModal';
import PlayerCard from '../components/PlayerCard';

function SessionView({ readonly = false }) {
  const { sessionId } = useParams();
  const [players, setPlayers] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  // dropPreview: { [status]: { sectionIndex: number, globalIndex: number } }
  const [dropPreview, setDropPreview] = useState({});
  // using a ref-like pattern without React ref to avoid re-renders for pointer updates
  const pointer = { current: { x: 0, y: 0 } };
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [remoteSelections, setRemoteSelections] = useState({});
  const [clientColor, setClientColor] = useState('#ffd700');
  const [clientName, setClientName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
    const [localClientId] = useState(() => `local-${Math.random().toString(36).slice(2,9)}`);

  // Backend URL management: allow `?backend=` query param to override, else env fallback
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  const paramBackend = params.get('backend');
  const defaultBackend = paramBackend || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const [backendUrl, setBackendUrl] = useState(defaultBackend);
  const [localHostReachable, setLocalHostReachable] = useState(null); // null = unknown, true/false
  const [publicUrlInput, setPublicUrlInput] = useState('');
  const [showStartLiveModal, setShowStartLiveModal] = useState(false);

  const socket = useSocket(backendUrl);

  useEffect(() => {
    if (!socket) return;
    console.log('SessionView useEffect', { sessionId, socket, readonly });
    // connection state tracking
    const onConnect = () => {
      setIsConnected(true);
      try {
        if (socket && sessionId) {
          socket.emit('join-session', { sessionId, readonly: !!readonly });
          console.log('Emitted join-session for', sessionId);
        }
        // set a default client name if none supplied
        try {
          const sid = socket && socket.id ? socket.id : null;
          if (sid && !clientName) setClientName(`User-${sid.slice(0,6)}`);
        } catch (e) {}
      } catch (e) {
        console.error('Failed to emit join-session', e);
      }
    };
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    // Fetch initial session data (guard against 404 / malformed responses)
    fetch(`${backendUrl}/api/session/${sessionId}`)
    .then(async (res) => {
      if (!res.ok) {
        const errBody = await res.text().catch(() => null);
        console.error('Failed to load session:', res.status, errBody);
        // keep players as empty array to avoid downstream crashes
        setPlayers([]);
        setParticipantCount(0);
        return null;
      }
      const data = await res.json().catch(() => null);
      if (data) {
        // initialize local state from server snapshot
        setPlayers(Array.isArray(data.players) ? data.players : []);
        setParticipantCount(typeof data.participantCount === 'number' ? data.participantCount : 0);
        console.log('session-joined: initial selections', data.selections);
        setRemoteSelections(data.selections || {});
      }
    }).catch((err) => {
      console.error('Failed to fetch session data', err);
      setPlayers([]);
      setParticipantCount(0);
    });

    socket.on('participant-joined', (data) => {
      setParticipantCount(data.participantCount);
    });

    // Handle authoritative session state sent by server when joining
    socket.on('session-joined', (data) => {
      try {
        if (!data) return;
        console.log('Received session-joined', data);
        setPlayers(Array.isArray(data.players) ? data.players : []);
        setParticipantCount(typeof data.participantCount === 'number' ? data.participantCount : (data.participants || 0));
        setRemoteSelections(data.selections || {});
      } catch (e) {
        console.error('Error handling session-joined', e);
      }
    });

    socket.on('participant-left', (data) => {
      setParticipantCount(data.participantCount);
    });

    socket.on('player-status-updated', ({ playerId, newStatus }) => {
      setPlayers(prev => 
        prev.map(p => p.id === playerId ? { ...p, status: newStatus } : p)
      );
    });

    socket.on('player-added', (newPlayer) => {
      setPlayers(prev => [...prev, newPlayer]);
    });

    socket.on('player-removed', ({ playerId }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });
    socket.on('players-synced', (newPlayers) => {
      if (Array.isArray(newPlayers)) {
        setPlayers(newPlayers);
      }
    });

    socket.on('player-updated', ({ playerId, updates }) => {
      setPlayers(prev =>
        prev.map(p => p.id === playerId ? { ...p, ...updates } : p)
      );
    });

    socket.on('player-selected', ({ playerId, selection }) => {
      console.log('socket player-selected received', { playerId, selection });
      setRemoteSelections(prev => {
        const next = { ...prev };
        if (!selection || Object.keys(selection).length === 0) {
          delete next[playerId];
        } else {
          next[playerId] = selection;
        }
        return next;
      });
    });
    socket.on('selections-updated', ({ selections }) => {
      console.log('socket selections-updated received', selections);
      // authoritative update
      setRemoteSelections(selections || {});
    });

    socket.on('saved-to-sheets', ({ timestamp }) => {
      setLastSaved(new Date(timestamp));
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('session-joined');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('player-status-updated');
      socket.off('player-added');
      socket.off('player-updated');
      socket.off('player-selected');
      socket.off('selections-updated');
      socket.off('saved-to-sheets');
    };
  }, [sessionId, socket, readonly]);

  // Probe a URL's health endpoint to see if a backend is reachable
  async function probeUrl(url, timeoutMs = 2500) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${url.replace(/\/$/, '')}/api/health`, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) return false;
      const j = await res.json().catch(() => null);
      return j && j.ok;
    } catch (e) {
      return false;
    }
  }

  const checkLocalhost = async () => {
    const localhostUrl = 'http://localhost:3000';
    setLocalHostReachable(null);
    const ok = await probeUrl(localhostUrl);
    setLocalHostReachable(!!ok);
    if (ok) setBackendUrl(localhostUrl);
    return ok;
  };

  // Handler for toolbar "Start Live Session" button
  const handleStartLive = async () => {
    // Open modal and pre-check localhost availability
    setShowStartLiveModal(true);
    const ok = await checkLocalhost();
    if (ok) {
      setBackendUrl('http://localhost:3000');
      try { if (socket && socket.connect) socket.connect(); } catch (e) {}
      setLocalHostReachable(true);
    } else {
      setLocalHostReachable(false);
    }
  };

  // deterministic color from socket id (simple hash)
  function colorFromId(id) {
    if (!id) return '#ffd700';
    const colors = ['#FFD700','#66B0FF','#7FEF4F','#FF8B91','#A330C9','#FF7C0A','#33937F','#AAD372','#3FC7EB','#00FF98','#F48CBA','#FFFFFF','#FFF468','#0070DD','#8788EE','#C69B6D'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleDragStart = (event) => {
    if (readonly) return;
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
  };

  const handleDragOver = (event) => {
    if (readonly) return;
    const { active, over } = event;
    if (!over || !active) {
      setDropPreview({});
      return;
    }

    const allowedStatuses = ['Main', 'Trial', 'Bench'];

    // helper to map over.id (player id, section id, or empty placeholder) to a section status
    const normalizeToStatus = (id) => {
      if (!id) return null;
      if (allowedStatuses.includes(id)) return id;
      if (typeof id === 'string' && (id.endsWith('-empty') || id.endsWith('-end'))) return id.replace(/-(empty|end)$/, '');
      const maybe = players.find(p => p.id === id);
      return maybe ? maybe.status : null;
    };

    const overPlayer = players.find(p => p.id === over.id);
    const preview = {};
    const targetStatus = normalizeToStatus(over.id);

    if (!targetStatus) {
      setDropPreview({});
      return;
    }

    // Build section players excluding the active dragging id
    const sectionPlayers = players.filter(p => p.status === targetStatus && p.id !== active.id);

    if (overPlayer) {
      // We hovered a specific player: decide before/after by pointer position
      const hoveredEl = document.querySelector(`[data-player-id="${overPlayer.id}"]`);
      let insertIndex = sectionPlayers.findIndex(p => p.id === overPlayer.id);
      try {
        if (hoveredEl && pointer && pointer.current) {
          const rect = hoveredEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (pointer.current.y > midY) insertIndex = insertIndex + 1;
        }
      } catch (e) {
        // ignore and fallback to inserting before
      }
      // compute global insertion index corresponding to inserting at insertIndex within sectionPlayers
      const insertBeforeId = sectionPlayers[insertIndex] && sectionPlayers[insertIndex].id;
      let globalIndex = -1;
      if (insertBeforeId) {
        const withoutDraggedForLookup = players.filter(p => p.id !== active.id);
        globalIndex = withoutDraggedForLookup.findIndex(p => p.id === insertBeforeId);
      } else {
        // append at end of section
        let lastIdx = -1;
        const withoutDragged = players.filter(p => p.id !== active.id);
        for (let i = withoutDragged.length - 1; i >= 0; i--) {
          if (withoutDragged[i].status === targetStatus) { lastIdx = i; break; }
        }
        const withoutDraggedForLen = players.filter(p => p.id !== active.id);
        globalIndex = lastIdx === -1 ? withoutDraggedForLen.length : lastIdx + 1;
      }
      preview[targetStatus] = { sectionIndex: insertIndex === -1 ? sectionPlayers.length : insertIndex, globalIndex };
    } else {
      // Hovering a section (possibly empty) — append to end, or for explicit
      // empty placeholder treat as index 0 to allow dropping as first
      if (typeof over.id === 'string' && over.id.endsWith('-empty')) {
        // explicit empty placeholder -> insert at start
        const withoutDragged = players.filter(p => p.id !== active.id);
        preview[targetStatus] = { sectionIndex: 0, globalIndex: 0 };
      } else {
        // append at end
        const withoutDragged = players.filter(p => p.id !== active.id);
        let lastIdx = -1;
        for (let i = withoutDragged.length - 1; i >= 0; i--) {
          if (withoutDragged[i].status === targetStatus) { lastIdx = i; break; }
        }
        const globalIndex = lastIdx === -1 ? withoutDragged.length : lastIdx + 1;
        preview[targetStatus] = { sectionIndex: sectionPlayers.length, globalIndex };
      }
    }

    setDropPreview(preview);
  };

  const handleDragEnd = (event) => {
    if (readonly) return;
    const { active, over } = event;
    setActiveId(null);
    // cleanup global pointer listeners
    try {
      if (handleDragStart._pointerListener) document.removeEventListener('pointermove', handleDragStart._pointerListener);
      if (handleDragStart._touchListener) document.removeEventListener('touchmove', handleDragStart._touchListener);
    } catch (e) {
      // ignore
    }
    setDropPreview({});
    // If DnD didn't report an `over` target but we computed a preview while
    // dragging, use that preview as the drop target. This helps when empty
    // section placeholders are detected by our onDragOver but not returned
    // as `over` on dragEnd by the collision algorithm.
    if (!over && Object.keys(dropPreview).length > 0) {
      const playerId = active.id;
      const draggedPlayer = players.find(p => p.id === playerId);
      // pick the first previewed section (there will only be one)
      const targetStatus = Object.keys(dropPreview)[0];
      const previewEntry = dropPreview[targetStatus];
      if (previewEntry && typeof previewEntry.globalIndex === 'number') {
        const globalIndex = previewEntry.globalIndex;
        const withoutDragged = players.filter(p => p.id !== playerId);
        const newDragged = { ...(draggedPlayer || {}), status: targetStatus };
        const newPlayers = [...withoutDragged.slice(0, globalIndex), newDragged, ...withoutDragged.slice(globalIndex)];
        setPlayers(newPlayers);
        if (socket) {
          socket.emit('update-player-status', { playerId, newStatus: targetStatus });
          socket.emit('sync-players', { players: newPlayers });
        }
        setDropPreview({});
        return;
      }
    }

    if (!over || active.id === over.id) {
      setDropPreview({});
      return;
    }

    const playerId = active.id;
    const overId = over.id;
    const draggedPlayer = players.find(p => p.id === playerId);
    const overPlayer = players.find(p => p.id === overId);
    const allowedStatuses = ['Main', 'Trial', 'Bench'];

    // Helper: remove dragged player from list
    const withoutDragged = players.filter(p => p.id !== playerId);

    // If dropping on a player, compute insertion in the global list based on
    // the first occurrence of that player's section chunk.
    if (overPlayer) {
      const targetStatus = overPlayer.status;
      // Build section players within the filtered list
      const sectionPlayers = withoutDragged.filter(p => p.status === targetStatus);

      // Determine insert index relative to the hovered player using pointer position
      let insertIndex = sectionPlayers.findIndex(p => p.id === overPlayer.id);
      try {
        const hoveredEl = document.querySelector(`[data-player-id="${overPlayer.id}"]`);
        if (hoveredEl && pointer && pointer.current) {
          const rect = hoveredEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (pointer.current.y > midY) insertIndex = insertIndex + 1;
        }
      } catch (e) {
        // ignore and fallback to inserting before
      }

      // Compute global index to insert at (insert before the item at insertIndex)
      const insertBeforeId = sectionPlayers[insertIndex] && sectionPlayers[insertIndex].id;
      let globalIndex = -1;
      if (insertBeforeId) {
        globalIndex = withoutDragged.findIndex(p => p.id === insertBeforeId);
      } else {
        // No players at that position in target section, append after last occurrence
        let lastIdx = -1;
        for (let i = withoutDragged.length - 1; i >= 0; i--) {
          if (withoutDragged[i].status === targetStatus) { lastIdx = i; break; }
        }
        globalIndex = lastIdx === -1 ? withoutDragged.length : lastIdx + 1;
      }

      const newDragged = { ...(draggedPlayer || {}), status: targetStatus };
      const newPlayers = [...withoutDragged.slice(0, globalIndex), newDragged, ...withoutDragged.slice(globalIndex)];
      setPlayers(newPlayers);
      if (socket) {
        socket.emit('update-player-status', { playerId, newStatus: targetStatus });
        socket.emit('sync-players', { players: newPlayers });
      }
      setDropPreview({});
      return;
    }

    // If dropping on an explicit empty-section placeholder id (e.g. 'Main-empty')
    if (typeof overId === 'string' && (overId.endsWith('-empty') || overId.endsWith('-end'))) {
      const newStatus = overId.replace(/-(empty|end)$/, '');
      const newDragged = { ...(draggedPlayer || {}), status: newStatus };
      // Insert as first element for '-empty', or as last element for '-end'
      const withoutDraggedList = withoutDragged;
      const insertAt = overId.endsWith('-empty') ? 0 : (() => {
        let lastIdx = -1;
        for (let i = withoutDraggedList.length - 1; i >= 0; i--) {
          if (withoutDraggedList[i].status === newStatus) { lastIdx = i; break; }
        }
        return lastIdx === -1 ? withoutDraggedList.length : lastIdx + 1;
      })();
      const newPlayers = [...withoutDraggedList.slice(0, insertAt), newDragged, ...withoutDraggedList.slice(insertAt)];
      setPlayers(newPlayers);
      if (socket) {
        socket.emit('update-player-status', { playerId, newStatus });
        socket.emit('sync-players', { players: newPlayers });
      }
      setDropPreview({});
      return;
    }

    // If dropping on a section id, append to that section
    if (allowedStatuses.includes(overId)) {
      const newStatus = overId;
      const newDragged = { ...(draggedPlayer || {}), status: newStatus };
      // place after last element of that section within current order
      const withoutDraggedList = withoutDragged;
      let lastIdx = -1;
      for (let i = withoutDraggedList.length - 1; i >= 0; i--) {
        if (withoutDraggedList[i].status === newStatus) { lastIdx = i; break; }
      }
      const insertAt = lastIdx === -1 ? withoutDraggedList.length : lastIdx + 1;
      const newPlayers = [...withoutDraggedList.slice(0, insertAt), newDragged, ...withoutDraggedList.slice(insertAt)];
      setPlayers(newPlayers);
      if (socket) {
        socket.emit('update-player-status', { playerId, newStatus });
        socket.emit('sync-players', { players: newPlayers });
      }
      setDropPreview({});
      return;
    }

    // Default: ignore
    setDropPreview({});
    return;
  };

  const handlePlayerClick = (playerId) => {
    const sid = socket?.id ?? localClientId;
    // toggle: if this client already selected this player, clear
    const current = remoteSelections[playerId];
    const iAmHere = current && current[sid];
    if (iAmHere) {
      console.log('clearing selection for player', playerId, 'from', sid);
      if (socket) socket.emit('select-player', { playerId: null, clientName: clientName || `User-${sid.slice(0,6)}`, color: clientColor });
      // optimistic local remove of this client's entry
      setRemoteSelections(prev => {
        const next = { ...prev };
        if (next[playerId]) {
          const clone = { ...next[playerId] };
          delete clone[sid];
          if (Object.keys(clone).length === 0) delete next[playerId];
          else next[playerId] = clone;
        }
        return next;
      });
      setSelectedPlayer(null);
      return;
    }

    // If this client had a previous selection on a different player, remove it locally
    const prevPid = Object.keys(remoteSelections).find(pid => {
      const s = remoteSelections[pid];
      return s && s[sid];
    });

    if (prevPid && prevPid !== playerId) {
      setRemoteSelections(prev => {
        const next = { ...prev };
        if (next[prevPid]) {
          const clone = { ...next[prevPid] };
          delete clone[sid];
          if (Object.keys(clone).length === 0) delete next[prevPid];
          else next[prevPid] = clone;
        }
        return next;
      });
    }

    // emit selection with client identity and color (if connected)
    const payload = { playerId, clientName: clientName || `User-${sid.slice(0,6)}`, color: clientColor };
    console.log('selection payload', payload);
    if (socket) socket.emit('select-player', payload);
    // optimistic local mark
    setRemoteSelections(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(pid => {
        if (next[pid] && next[pid][sid]) {
          const clone = { ...next[pid] };
          delete clone[sid];
          if (Object.keys(clone).length === 0) delete next[pid];
          else next[pid] = clone;
        }
      });
      const existing = { ...(next[playerId] || {}) };
      existing[sid] = { clientId: sid, clientName: payload.clientName, color: payload.color };
      next[playerId] = existing;
      return next;
    });
    setSelectedPlayer(playerId);
  };

  const handleAddPlayer = (playerData) => {
    if (readonly) return;
    const newPlayer = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      name: playerData.name,
      class: playerData.class,
      mainSpecRole: playerData.mainSpecRole,
      alt1Class: playerData.alt1Class || '',
      alt1SpecRole: playerData.alt1SpecRole || '',
      alt2Class: playerData.alt2Class || '',
      alt2SpecRole: playerData.alt2SpecRole || '',
      status: playerData.status || 'Main',
      notes: playerData.notes || ''
    };
    // Do not add optimistically to local state; emit to server and wait for authoritative event
    if (socket) {
      socket.emit('add-player', playerData);
    } else {
      // If not connected, still add locally so the user sees their entry (offline mode)
      setPlayers(prev => [...prev, newPlayer]);
    }
    setShowAddModal(false);
  };

  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setShowEditModal(true);
  };

  const handleRemovePlayer = (playerId) => {
    if (readonly) return;
    // Optimistic update
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    if (socket) {
      socket.emit('remove-player', { playerId });
    }
  };

  const handleSaveEdit = (updatedData) => {
    if (!editingPlayer) return;
    const updates = { ...updatedData };
    // Emit update to server
    if (socket && !readonly) {
      socket.emit('update-player', { playerId: editingPlayer.id, updates });
    }
    // Optimistic update locally
    setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...updates } : p));
    setShowEditModal(false);
    setEditingPlayer(null);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/session/${sessionId}/save`,
        { method: 'POST' }
      );
      const result = await response.json();
      setLastSaved(new Date(result.timestamp));
      alert('✅ Saved to Google Sheets!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('❌ Failed to save');
    }
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainRoster = filteredPlayers.filter(p => p.status === 'Main');
  const trials = filteredPlayers.filter(p => p.status === 'Trial');
  const bench = filteredPlayers.filter(p => p.status === 'Bench');

  const offline = !socket || !isConnected;

  return (
    <div className="session-view">
      <Toolbar
        sessionId={sessionId}
        participantCount={participantCount}
        isConnected={isConnected}
        lastSaved={lastSaved}
        readonly={readonly}
        onAddPlayer={() => setShowAddModal(true)}
          onSave={handleSave}
          clientName={clientName}
          onClientNameCommit={(name) => {
            setClientName(name);
            // If currently have a selected player, update our selection name on the server
            if (selectedPlayer) {
              const payload = { playerId: selectedPlayer, clientName: name || `User-${(socket?.id ?? localClientId).slice(0,6)}`, color: clientColor };
              console.log('committing clientName change and emitting select-player', payload);
              if (socket) socket.emit('select-player', payload);
            }
          }}
          onStartLive={handleStartLive}
      />
      
      {showStartLiveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ width: 720, maxWidth: '95%', background: '#1f1f1f', color: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
            <h2 style={{ marginTop: 0 }}>Start Live Session</h2>
            <p>This helps you run and expose the backend so others can join your session.</p>

            <h4>Run locally</h4>
            <pre style={{ background: '#111', color: '#fff', padding: 12, borderRadius: 6 }}>{`cd backend
npm install
node server.js`}</pre>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigator.clipboard?.writeText('cd backend && npm install && node server.js')}>Copy run command</button>
              <button style={{ marginLeft: 8 }} onClick={async () => { const ok = await checkLocalhost(); setLocalHostReachable(!!ok); if (ok) { setBackendUrl('http://localhost:3000'); setShowStartLiveModal(false); } }}>Check localhost:3000</button>
              <button style={{ marginLeft: 8 }} onClick={() => { setBackendUrl('http://localhost:3000'); setShowStartLiveModal(false); try { if (socket && socket.connect) socket.connect(); } catch(e){} }}>Use localhost</button>
            </div>

            <h4 style={{ marginTop: 12 }}>Expose to Internet</h4>
            <p>Use a tunneling tool (for example <strong>localtunnel</strong> or <strong>ngrok</strong>) to make your local backend reachable from outside your LAN.</p>
            <pre style={{ background: '#111', color: '#fff', padding: 12, borderRadius: 6 }}>npx localtunnel --port 3000</pre>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
              <input
                placeholder="Paste public URL from tunneling tool (https://...)"
                value={publicUrlInput}
                onChange={(e) => setPublicUrlInput(e.target.value)}
                style={{ width: '60%' }}
              />
              <button style={{ marginLeft: 8 }} onClick={() => {
                if (publicUrlInput && publicUrlInput.startsWith('http')) {
                  setBackendUrl(publicUrlInput.replace(/\/$/, ''));
                  setShowStartLiveModal(false);
                } else alert('Please paste a valid public URL (https://...)');
              }}>Use Public URL</button>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setShowStartLiveModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

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
              onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <RosterSection
              title="Main Roster"
              status="Main"
                players={mainRoster}
                selectedPlayer={selectedPlayer}
                remoteSelections={remoteSelections}
              onPlayerClick={handlePlayerClick}
              readonly={readonly}
              onEdit={handleEditClick}
              onRemove={handleRemovePlayer}
              placeholderIndex={dropPreview['Main'] ? dropPreview['Main'].sectionIndex : null}
            />
            <RosterSection
              title="Trials"
              status="Trial"
              players={trials}
              selectedPlayer={selectedPlayer}
              remoteSelections={remoteSelections}
              onPlayerClick={handlePlayerClick}
              readonly={readonly}
              onEdit={handleEditClick}
              onRemove={handleRemovePlayer}
              placeholderIndex={dropPreview['Trial'] ? dropPreview['Trial'].sectionIndex : null}
            />
            <RosterSection
              title="Bench / Backup"
              status="Bench"
              players={bench}
              selectedPlayer={selectedPlayer}
              remoteSelections={remoteSelections}
              onPlayerClick={handlePlayerClick}
              readonly={readonly}
              onEdit={handleEditClick}
              onRemove={handleRemovePlayer}
              placeholderIndex={dropPreview['Bench'] ? dropPreview['Bench'].sectionIndex : null}
            />

            <DragOverlay>
              {activeId ? (
                <PlayerCard
                  player={players.find(p => p.id === activeId)}
                  isDragging={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <Sidebar
          className="Sidebar"
          players={mainRoster}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalRosterSize={players.length}
        />
      </div>

      {showAddModal && (
        <AddPlayerModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPlayer}
          existingNames={players.map(p => p.name)}
        />
      )}
      {showEditModal && editingPlayer && (
        <AddPlayerModal
          onClose={() => { setShowEditModal(false); setEditingPlayer(null); }}
          initialData={editingPlayer}
          onSave={handleSaveEdit}
          existingNames={players.filter(p => p.id !== editingPlayer.id).map(p => p.name)}
        />
      )}
    </div>
  );
}

export default SessionView;