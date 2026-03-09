// ─── State Definitions ─────────────────────────────────────────────────────────
const STATES = {
  JOB_SELECTION:      'JOB_SELECTION',
  LOCATION_SELECTION: 'LOCATION_SELECTION',
  SHIFT_SELECTION:    'SHIFT_SELECTION',
  COLLECT_NAME:       'COLLECT_NAME',
  COLLECT_EMAIL:      'COLLECT_EMAIL',
  COLLECT_PHONE:      'COLLECT_PHONE',
  COLLECT_DOB:        'COLLECT_DOB',
  COLLECT_START_DATE: 'COLLECT_START_DATE',
  COLLECT_RESUME:     'COLLECT_RESUME',
  COLLECT_LINKEDIN:   'COLLECT_LINKEDIN',
  CONFIRMATION:       'CONFIRMATION',
  SUBMITTED:          'SUBMITTED',
};

// ─── Job Data ──────────────────────────────────────────────────────────────────
const JOBS = [
  'Forklift Operator',
  'General Labour',
  'Skidders & Packers',
  'Mechanical Helper',
  'Machine Operators',
  'Light Loading/Unloading',
  'Sanitation Workers',
  'Chemical Compounder',
];

const LOCATIONS = ['Etobicoke', 'Tottenham', 'Mississauga'];

const SHIFTS = ['Mornings', 'Afternoons', 'Nights', 'Flexible'];

// ─── Ordered Flow ──────────────────────────────────────────────────────────────
// This is the canonical sequence — the state machine follows this exactly
const STATE_FLOW = [
  STATES.JOB_SELECTION,
  STATES.LOCATION_SELECTION,
  STATES.SHIFT_SELECTION,
  STATES.COLLECT_NAME,
  STATES.COLLECT_EMAIL,
  STATES.COLLECT_PHONE,
  STATES.COLLECT_DOB,
  STATES.COLLECT_START_DATE,
  STATES.COLLECT_RESUME,
  STATES.COLLECT_LINKEDIN,
  STATES.CONFIRMATION,
  STATES.SUBMITTED,
];

// Maps a field name (from edit requests) back to the state that collects it
const FIELD_TO_STATE = {
  job:        STATES.JOB_SELECTION,
  position:   STATES.JOB_SELECTION,
  role:       STATES.JOB_SELECTION,
  location:   STATES.LOCATION_SELECTION,
  shift:      STATES.SHIFT_SELECTION,
  name:       STATES.COLLECT_NAME,
  email:      STATES.COLLECT_EMAIL,
  phone:      STATES.COLLECT_PHONE,
  dob:        STATES.COLLECT_DOB,
  birthday:   STATES.COLLECT_DOB,
  birth:      STATES.COLLECT_DOB,
  start:      STATES.COLLECT_START_DATE,
  date:       STATES.COLLECT_START_DATE,
  resume:     STATES.COLLECT_RESUME,
  cv:         STATES.COLLECT_RESUME,
  linkedin:   STATES.COLLECT_LINKEDIN,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getNextState = (currentState) => {
  const idx = STATE_FLOW.indexOf(currentState);
  if (idx === -1 || idx >= STATE_FLOW.length - 1) return STATES.SUBMITTED;
  return STATE_FLOW[idx + 1];
};

// Quick-reply buttons to display per state
const getButtons = (state) => {
  switch (state) {
    case STATES.JOB_SELECTION:
      return JOBS;
    case STATES.LOCATION_SELECTION:
      return LOCATIONS;
    case STATES.SHIFT_SELECTION:
      return SHIFTS;
    case STATES.COLLECT_RESUME:
      return ["Skip — I'll send later"];
    case STATES.COLLECT_LINKEDIN:
      return ['Skip — No LinkedIn'];
    case STATES.CONFIRMATION:
      return ['Submit Application', 'Edit Details'];
    default:
      return [];
  }
};

// Input type hint so the widget knows what UI to render
const getInputType = (state) => {
  if (state === STATES.COLLECT_RESUME) return 'file';
  return 'text';
};

// The session data key that each state writes into
const getDataKey = (state) => {
  const map = {
    [STATES.JOB_SELECTION]:      'jobRole',
    [STATES.LOCATION_SELECTION]: 'location',
    [STATES.SHIFT_SELECTION]:    'shift',
    [STATES.COLLECT_NAME]:       'name',
    [STATES.COLLECT_EMAIL]:      'email',
    [STATES.COLLECT_PHONE]:      'phone',
    [STATES.COLLECT_DOB]:        'dob',
    [STATES.COLLECT_START_DATE]: 'startDate',
    [STATES.COLLECT_LINKEDIN]:   'linkedIn',
  };
  return map[state] || null;
};

// Detect if a user's edit message maps to a field jump
const detectEditField = (message) => {
  const lower = message.toLowerCase();
  for (const [keyword, state] of Object.entries(FIELD_TO_STATE)) {
    if (lower.includes(keyword)) return state;
  }
  return null;
};

module.exports = {
  STATES,
  JOBS,
  LOCATIONS,
  SHIFTS,
  STATE_FLOW,
  getNextState,
  getButtons,
  getInputType,
  getDataKey,
  detectEditField,
};
