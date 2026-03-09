const { v4: uuidv4 } = require('uuid');
const { STATES } = require('../utils/stateManager');

// ─── In-memory store — intentionally no database ──────────────────────────────
// All application data lives here until emailed to the owner.
// Sessions auto-expire after 30 minutes of inactivity.
const sessions = new Map();

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

// ─── Create ───────────────────────────────────────────────────────────────────
const createSession = () => {
  const sessionId = uuidv4();

  const session = {
    sessionId,
    state: STATES.JOB_SELECTION, // First real collection state (greeting is handled by /start)
    data: {
      jobRole:        null,
      location:       null,
      shift:          null,
      name:           null,
      email:          null,
      phone:          null,
      dob:            null,
      startDate:      null,
      resumeBuffer:   null,  // Buffer — kept in memory, attached to email
      resumeFileName: null,
      linkedIn:       null,
    },
    history:    [],   // Last N conversation turns fed to Claude for context
    createdAt:  Date.now(),
    lastActive: Date.now(),
  };

  sessions.set(sessionId, session);
  return session;
};

// ─── Read ─────────────────────────────────────────────────────────────────────
const getSession = (sessionId) => {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Evict expired sessions on access
  if (Date.now() - session.lastActive > SESSION_TTL) {
    sessions.delete(sessionId);
    return null;
  }

  session.lastActive = Date.now();
  return session;
};

// ─── Update ───────────────────────────────────────────────────────────────────
const updateSession = (sessionId, { state, data } = {}) => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (state) session.state = state;
  if (data) Object.assign(session.data, data);
  session.lastActive = Date.now();

  sessions.set(sessionId, session);
  return session;
};

// ─── Conversation history ─────────────────────────────────────────────────────
const addToHistory = (sessionId, role, content) => {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.history.push({ role, content });

  // Keep a rolling window — Claude doesn't need the full transcript
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }

  session.lastActive = Date.now();
  sessions.set(sessionId, session);
};

// ─── Cleanup job — runs every 10 minutes ─────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  let evicted = 0;
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActive > SESSION_TTL) {
      sessions.delete(id);
      evicted++;
    }
  }
  if (evicted > 0) console.log(`[Session] Evicted ${evicted} expired session(s). Active: ${sessions.size}`);
}, 10 * 60 * 1000);

module.exports = { createSession, getSession, updateSession, addToHistory };
