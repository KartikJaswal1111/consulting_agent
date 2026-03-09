const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const { createSession, getSession, updateSession, addToHistory } = require('../services/session');
const { getAgentResponse } = require('../services/claude');
const {
  STATES,
  getNextState,
  getButtons,
  getInputType,
  getDataKey,
  detectEditField,
} = require('../utils/stateManager');
const {
  validateJob,
  validateLocation,
  validateShift,
  validateName,
  validateEmail,
  validatePhone,
  validateDOB,
  validateStartDate,
  validateLinkedIn,
  isResumeSkip,
} = require('../utils/validator');

// ─── Multer — resume upload, memory storage only ───────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, DOC, or DOCX files are accepted.'));
  },
});

// ─── POST /api/chat/start ──────────────────────────────────────────────────────
// Creates a new session and returns the opening greeting + first set of buttons
router.post('/start', async (req, res) => {
  try {
    const session = createSession();

    // Claude generates the greeting (JOB_SELECTION is the first real state)
    const { message } = await getAgentResponse({
      state:         STATES.JOB_SELECTION,
      userMessage:   'START',
      collectedData: session.data,
      history:       [],
    });

    addToHistory(session.sessionId, 'assistant', message);

    res.json({
      sessionId: session.sessionId,
      message,
      state:     STATES.JOB_SELECTION,
      buttons:   getButtons(STATES.JOB_SELECTION),
      inputType: 'buttons', // Force button-only at start
    });
  } catch (err) {
    console.error('[Chat/start]', err.message);
    res.status(500).json({ error: 'Failed to start session. Please try again.' });
  }
});

// ─── POST /api/chat/message ────────────────────────────────────────────────────
// Main conversation handler — processes each user turn
router.post('/message', upload.single('resume'), async (req, res) => {
  try {
    const { sessionId, message = '' } = req.body;

    if (!sessionId) return res.status(400).json({ error: 'sessionId is required.' });

    const session = getSession(sessionId);
    if (!session) {
      return res.status(400).json({
        error:   'SESSION_EXPIRED',
        message: 'Your session has expired. Please refresh the page to start a new application.',
      });
    }

    const currentState = session.state;
    let nextState      = currentState;
    let dataUpdate     = {};
    let validationError = null;
    let isEditMode     = false;

    // ── Handle resume file upload ────────────────────────────────────────────
    if (currentState === STATES.COLLECT_RESUME) {
      if (req.file) {
        dataUpdate.resumeBuffer   = req.file.buffer;
        dataUpdate.resumeFileName = req.file.originalname;
      }
      // Skip or file — both advance to next state
      nextState = getNextState(currentState);

    // ── Handle edit request from CONFIRMATION screen ─────────────────────────
    } else if (currentState === STATES.CONFIRMATION && message.toLowerCase().includes('edit')) {
      isEditMode = true;
      // Try to detect which specific field they want to change
      const targetState = detectEditField(message);
      nextState = targetState || STATES.COLLECT_NAME; // Default to name if unclear

    // ── Standard field validation ────────────────────────────────────────────
    } else {
      const result = validateForState(currentState, message);

      if (!result.valid) {
        validationError = result.error;
        nextState = currentState; // Stay on same state
      } else {
        const key = getDataKey(currentState);
        if (key) dataUpdate[key] = result.value;
        nextState = getNextState(currentState);
      }
    }

    // ── Call Claude to generate conversational response ──────────────────────
    const { message: agentMessage } = await getAgentResponse({
      state:         validationError ? currentState : nextState,
      userMessage:   validationError ? `The user provided: "${message}" but it was invalid.` : message,
      collectedData: { ...session.data, ...dataUpdate },
      history:       session.history,
      isError:       !!validationError,
      isEdit:        isEditMode,
    });

    // ── Persist updates only if input was valid ──────────────────────────────
    if (!validationError) {
      updateSession(sessionId, { state: nextState, data: dataUpdate });
    }

    // Add both turns to history
    addToHistory(sessionId, 'user', message);
    addToHistory(sessionId, 'assistant', agentMessage);

    // ── Build confirmation summary when entering CONFIRMATION state ──────────
    let confirmationData = null;
    if (nextState === STATES.CONFIRMATION && !validationError) {
      const fresh = getSession(sessionId);
      confirmationData = buildSummary(fresh.data);
    }

    // ── Build error message combining validation + agent message ─────────────
    const responseMessage = validationError
      ? `${validationError}\n\n${agentMessage}`
      : agentMessage;

    res.json({
      message:         responseMessage,
      state:           validationError ? currentState : nextState,
      buttons:         getButtons(validationError ? currentState : nextState),
      inputType:       getInputType(validationError ? currentState : nextState),
      confirmationData,
      isError:         !!validationError,
    });

  } catch (err) {
    console.error('[Chat/message]', err.message);
    res.status(500).json({
      message: 'Something went wrong on our end. Please try again or call us at +1 647-292-5145.',
      isError: true,
    });
  }
});

// ─── Per-state validation dispatcher ──────────────────────────────────────────
const validateForState = (state, input) => {
  switch (state) {
    case STATES.JOB_SELECTION:      return validateJob(input);
    case STATES.LOCATION_SELECTION: return validateLocation(input);
    case STATES.SHIFT_SELECTION:    return validateShift(input);
    case STATES.COLLECT_NAME:       return validateName(input);
    case STATES.COLLECT_EMAIL:      return validateEmail(input);
    case STATES.COLLECT_PHONE:      return validatePhone(input);
    case STATES.COLLECT_DOB:        return validateDOB(input);
    case STATES.COLLECT_START_DATE: return validateStartDate(input);
    case STATES.COLLECT_LINKEDIN:   return validateLinkedIn(input);
    case STATES.CONFIRMATION:       return { valid: true, value: input };
    default:                        return { valid: true, value: input };
  }
};

// ─── Summary builder for confirmation card ────────────────────────────────────
const buildSummary = (data) => ({
  jobRole:        data.jobRole,
  location:       data.location,
  shift:          data.shift,
  name:           data.name,
  email:          data.email,
  phone:          data.phone,
  dob:            data.dob,
  startDate:      data.startDate,
  linkedIn:       data.linkedIn,
  hasResume:      !!data.resumeBuffer,
  resumeFileName: data.resumeFileName,
});

module.exports = router;
