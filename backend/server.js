import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
// import { google } from 'googleapis';

dotenv.config();

const app = express();
const server = createServer(app);
// Allow flexible CORS to support tunneled public origins (localtunnel/ngrok)
const io = new Server(server, {
  cors: {
    // allow any origin so tunneled hostnames won't be blocked by CORS
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Allow any origin for REST APIs as well (tunnels will have arbitrary hostnames)
app.use(cors({ origin: true }));
app.use(express.json());

// In-memory session storage
// TODO: Replace with Redis for production
const activeSessions = new Map();
// In-memory selection storage per session:
// { sessionId => { playerId: { [clientId]: { clientId, clientName, color } } } }
// This allows multiple clients to select the same player simultaneously.
const sessionSelections = new Map();

// Global error handlers to log uncaught exceptions/rejections for diagnostics
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED PROMISE REJECTION', reason);
});

// Google Sheets logic removed

// ===== REST ENDPOINTS =====

// Create new session (no Google Sheets, just empty roster)
app.post('/api/session/create', (req, res) => {
  try {
    // Generate unique session ID
    const sessionId = crypto.randomBytes(8).toString('hex');

    // Create session with empty roster
    const session = {
      id: sessionId,
      players: [],
      participants: new Set(),
      createdAt: new Date(),
      lastModified: new Date()
    };

    activeSessions.set(sessionId, session);

    // Auto-cleanup after 24 hours
    setTimeout(() => {
      activeSessions.delete(sessionId);
      console.log(`Session ${sessionId} auto-deleted after 24 hours`);
    }, 24 * 60 * 60 * 1000);

    res.json({
      sessionId,
      shareUrl: `${process.env.FRONTEND_URL}/session/${sessionId}`,
      readonlyUrl: `${process.env.FRONTEND_URL}/session/${sessionId}/readonly`,
      players: session.players
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session data
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.id,
    players: session.players,
    participantCount: session.participants.size
  });
});

// Health endpoint for diagnostics
app.get('/api/health', (req, res) => {
  try {
    res.json({
      ok: true,
      sessions: activeSessions.size,
      selections: sessionSelections.size
    });
  } catch (err) {
    console.error('Health check error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Save session (no Google Sheets, just update timestamp and notify clients)
app.post('/api/session/:sessionId/save', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.lastModified = new Date();

    // Notify all participants
    io.to(sessionId).emit('saved-to-sheets', {
      timestamp: session.lastModified
    });

    res.json({
      success: true,
      message: 'Session saved',
      timestamp: session.lastModified
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBSOCKET HANDLERS =====

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join session
  socket.on('join-session', ({ sessionId, readonly = false }) => {
    const session = activeSessions.get(sessionId);

    if (!session) {
      socket.emit('error', 'Session not found');
      return;
    }

    socket.join(sessionId);
    session.participants.add(socket.id);
    socket.sessionId = sessionId;
    socket.readonly = readonly;

    socket.emit('session-joined', {
      players: session.players,
      participantCount: session.participants.size,
      readonly,
      selections: sessionSelections.get(sessionId) || {}
    });

    socket.to(sessionId).emit('participant-joined', {
      participantCount: session.participants.size
    });

    console.log(`Socket ${socket.id} joined session ${sessionId} (readonly: ${readonly})`);
    console.log(`Current selections for session ${sessionId}:`, sessionSelections.get(sessionId) || {});
  });

  // Update player status (Main/Trial/Bench)
  socket.on('update-player-status', (data) => {
    if (socket.readonly) return;

    const { sessionId } = socket;
    const session = activeSessions.get(sessionId);

    if (!session) return;

    const { playerId, newStatus } = data;
    const player = session.players.find(p => p.id === playerId);

    if (player) {
      player.status = newStatus;
      session.lastModified = new Date();

      socket.to(sessionId).emit('player-status-updated', {
        playerId,
        newStatus
      });
    }
  });

  // Add new player
  socket.on('add-player', (data) => {
    if (socket.readonly) return;

    const { sessionId } = socket;
    const session = activeSessions.get(sessionId);

    if (!session) return;

    const newPlayer = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      class: data.class,
      mainSpecRole: data.mainSpecRole,
      alt1Class: data.alt1Class || '',
      alt1SpecRole: data.alt1SpecRole || '',
      alt2Class: data.alt2Class || '',
      alt2SpecRole: data.alt2SpecRole || '',
      status: data.status || 'Main',
      notes: data.notes || ''
    };

    session.players.push(newPlayer);
    session.lastModified = new Date();

    io.to(sessionId).emit('player-added', newPlayer);
  });

  // Update player details
  socket.on('update-player', (data) => {
    if (socket.readonly) return;

    const { sessionId } = socket;
    const session = activeSessions.get(sessionId);

    if (!session) return;

    const { playerId, updates } = data;
    const player = session.players.find(p => p.id === playerId);

    if (player) {
      Object.assign(player, updates);
      session.lastModified = new Date();

      socket.to(sessionId).emit('player-updated', {
        playerId,
        updates
      });
    }
  });

  // Remove player
  socket.on('remove-player', (data) => {
    if (socket.readonly) return;

    const { sessionId } = socket;
    const session = activeSessions.get(sessionId);

    if (!session) return;

    const { playerId } = data;
    const idx = session.players.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      session.players.splice(idx, 1);
      session.lastModified = new Date();

      io.to(sessionId).emit('player-removed', { playerId });
    }
  });

  // Sync players ordering/status from clients (e.g., after drag/drop)
  socket.on('sync-players', (data) => {
    if (socket.readonly) return;

    const { sessionId } = socket;
    const session = activeSessions.get(sessionId);
    if (!session) return;

    const { players: newPlayers } = data || {};
    if (!Array.isArray(newPlayers)) return;

    // Replace session players with the authoritative ordering
    session.players = newPlayers;
    session.lastModified = new Date();

    io.to(sessionId).emit('players-synced', session.players);
  });

  // Select player (highlight)
    socket.on('select-player', (data) => {
    const { sessionId } = socket;
    if (!sessionId) return;

    // Expect data to be { playerId, clientName, color } or { playerId: null } to clear
    const selections = sessionSelections.get(sessionId) || {};

    if (!data || !data.playerId) {
      console.log(`select-player: clear request from ${socket.id} in session ${sessionId}`);
      // Clear any selection made by this socket for any player
      Object.keys(selections).forEach(pid => {
        const byClients = selections[pid] || {};
        if (byClients[socket.id]) {
          delete byClients[socket.id];
          // cleanup empty player entry
          if (Object.keys(byClients).length === 0) delete selections[pid];
          else selections[pid] = byClients;
          console.log(`select-player: clearing selection for player ${pid} by ${socket.id}`);
          io.to(sessionId).emit('player-selected', { playerId: pid, selection: byClients && Object.keys(byClients).length ? byClients : null });
        }
      });
      sessionSelections.set(sessionId, selections);
      // emit authoritative snapshot after clears
      io.to(sessionId).emit('selections-updated', { selections });
      return;
    }

    const { playerId, clientName, color } = data;
    console.log(`select-player: received from ${socket.id} -> playerId=${playerId}, clientName=${clientName}, color=${color}`);
    const selection = { clientId: socket.id, clientName: clientName || `User-${socket.id.slice(0,6)}`, color: color || '#ffd700' };

    // Ensure this client only has one selection at a time: remove this client from any other players
    Object.keys(selections).forEach(pid => {
      if (pid !== playerId) {
        const byClients = selections[pid] || {};
        if (byClients[socket.id]) {
          delete byClients[socket.id];
          if (Object.keys(byClients).length === 0) delete selections[pid];
          else selections[pid] = byClients;
          console.log(`select-player: clearing previous selection for player ${pid} by ${socket.id}`);
          io.to(sessionId).emit('player-selected', { playerId: pid, selection: byClients && Object.keys(byClients).length ? byClients : null });
        }
      }
    });

    // Add this client's selection to the requested player (allow multiple clients per player)
    const existing = selections[playerId] || {};
    existing[socket.id] = selection;
    selections[playerId] = existing;
    sessionSelections.set(sessionId, selections);

    console.log(`select-player: broadcasting selection for player ${playerId} in session ${sessionId}:`, selection);
    io.to(sessionId).emit('player-selected', { playerId, selection: selections[playerId] });
    // Also emit an authoritative snapshot of all selections to avoid ordering/race issues on clients
    try {
      const snapshot = sessionSelections.get(sessionId) || {};
      io.to(sessionId).emit('selections-updated', { selections: snapshot });
    } catch (err) {
      console.error('Error emitting selections-updated', err);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const { sessionId } = socket;
    if (sessionId) {
      const session = activeSessions.get(sessionId);
      if (session) {
        session.participants.delete(socket.id);

        io.to(sessionId).emit('participant-left', {
          participantCount: session.participants.size
        });

        // Clear any selections made by this socket in this session
        const selections = sessionSelections.get(sessionId) || {};
        let changed = false;
        Object.keys(selections).forEach(pid => {
          const byClients = selections[pid] || {};
          if (byClients[socket.id]) {
            delete byClients[socket.id];
            if (Object.keys(byClients).length === 0) delete selections[pid];
            else selections[pid] = byClients;
            io.to(sessionId).emit('player-selected', { playerId: pid, selection: byClients && Object.keys(byClients).length ? byClients : null });
            changed = true;
          }
        });
        if (changed) {
          sessionSelections.set(sessionId, selections);
          io.to(sessionId).emit('selections-updated', { selections });
        }

        if (session.participants.size === 0) {
          console.log(`Session ${sessionId} is empty, keeping alive for reconnections`);
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});