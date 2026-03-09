const { JOBS, LOCATIONS, SHIFTS } = require('./stateManager');

// ─── Fuzzy matcher — handles button clicks and typed input equally ──────────────
const findMatch = (input, options) => {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  return (
    options.find(o => o.toLowerCase() === lower) ||
    options.find(o => o.toLowerCase().includes(lower)) ||
    options.find(o => lower.includes(o.toLowerCase())) ||
    null
  );
};

// ─── Individual field validators ───────────────────────────────────────────────
const validateJob = (input) => {
  const match = findMatch(input, JOBS);
  if (!match) return { valid: false, error: 'Please select a valid position from the options above.' };
  return { valid: true, value: match };
};

const validateLocation = (input) => {
  const match = findMatch(input, LOCATIONS);
  if (!match) return { valid: false, error: 'Please select one of the available locations: Etobicoke, Tottenham, or Mississauga.' };
  return { valid: true, value: match };
};

const validateShift = (input) => {
  const match = findMatch(input, SHIFTS);
  if (!match) return { valid: false, error: 'Please choose a shift: Mornings, Afternoons, Nights, or Flexible.' };
  return { valid: true, value: match };
};

const validateName = (input) => {
  const name = input.trim();
  if (name.length < 2) return { valid: false, error: 'Please enter your full name (at least 2 characters).' };
  if (!/^[a-zA-Z\s\-'.]+$/.test(name)) return { valid: false, error: 'Name should contain only letters, spaces, or hyphens.' };
  return { valid: true, value: name };
};

const validateEmail = (input) => {
  const email = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., john@example.com).' };
  }
  return { valid: true, value: email };
};

const validatePhone = (input) => {
  // Strips spaces, dashes, dots, parens, plus — then checks for 10 digits (or 11 starting with 1)
  const cleaned = input.replace(/[\s\-().+]/g, '');
  if (!/^1?\d{10}$/.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid Canadian phone number (10 digits, e.g., 647-292-5145).' };
  }
  return { valid: true, value: input.trim() };
};

const validateDOB = (input) => {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format. Please use a format like March 3, 1990 or 1990-03-03.' };
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;

  if (age < 18) return { valid: false, error: 'You must be at least 18 years old to apply.' };
  if (age > 85) return { valid: false, error: 'Please enter a valid date of birth.' };

  return {
    valid: true,
    value: date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
};

const validateStartDate = (input) => {
  const lower = input.trim().toLowerCase();

  // Accept "ASAP" / "immediately" / "now" as valid
  const immediate = ['asap', 'immediately', 'right away', 'now', 'anytime', 'flexible'];
  if (immediate.some(k => lower.includes(k))) {
    return { valid: true, value: 'As soon as possible' };
  }

  const date = new Date(input);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Please enter a valid start date (e.g., March 15, 2026 or ASAP).' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, error: 'Start date cannot be in the past. Please provide a future date.' };
  }

  return {
    valid: true,
    value: date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
};

const validateLinkedIn = (input) => {
  const lower = input.trim().toLowerCase();

  // User skipping
  const skipWords = ['skip', 'no', 'none', 'n/a', 'na', "skip — no linkedin", 'skip - no linkedin', 'no linkedin'];
  if (skipWords.some(k => lower.includes(k))) return { valid: true, value: null };

  if (!lower.includes('linkedin.com')) {
    return { valid: false, error: 'Please enter a valid LinkedIn URL (e.g., linkedin.com/in/yourname) or click Skip.' };
  }

  return { valid: true, value: input.trim() };
};

// ─── Resume skips ──────────────────────────────────────────────────────────────
const isResumeSkip = (input) => {
  const lower = input.trim().toLowerCase();
  return ['skip', "skip — i'll send later", "skip - i'll send later", 'no resume', 'later', 'skip resume'].some(k => lower.includes(k));
};

module.exports = {
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
};
