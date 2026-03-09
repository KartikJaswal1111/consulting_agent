const { buildSystemPrompt } = require('../prompts/systemPrompt');

// ─── Mock responses — used when MOCK_MODE=true (no API key needed) ─────────────
// Keyed by state name. Supports {firstName} and {jobRole} placeholders.
const MOCK_RESPONSES = {
  JOB_SELECTION:
    "Hi! Welcome to **Consulting Group**! We're excited to help you find your next opportunity across Ontario. Which position are you interested in today?",

  LOCATION_SELECTION: (d) =>
    `Great choice! **${d.jobRole}** is a fantastic role with strong demand across our locations. Which city works best for you?`,

  SHIFT_SELECTION: (d) =>
    `Perfect — **${d.location}** it is! Now, what shift would work best for your schedule?`,

  COLLECT_NAME: (d) =>
    `Excellent! You're applying for **${d.jobRole}** in **${d.location}** on **${d.shift}** shifts. Let me collect a few personal details. What is your full name?`,

  COLLECT_EMAIL: (d) =>
    `Nice to meet you, **${d.name ? d.name.split(' ')[0] : 'there'}**! What's the best email address to reach you at?`,

  COLLECT_PHONE: () =>
    `Got it! And what's your phone number so our team can reach you directly when a position opens up?`,

  COLLECT_DOB: () =>
    `Thank you! For eligibility verification purposes, could you please share your date of birth? (e.g., March 3, 1990)`,

  COLLECT_START_DATE: () =>
    `Almost done! When would you be available to start? You can say **ASAP**, **next Monday**, or give a specific date.`,

  COLLECT_RESUME: () =>
    `Would you like to upload your resume? It's completely optional — you can skip and send it later if you prefer.`,

  COLLECT_LINKEDIN: () =>
    `Do you have a LinkedIn profile you'd like to share? No LinkedIn? Absolutely no problem — just click Skip!`,

  CONFIRMATION: () =>
    `Perfect! Here's a complete summary of your application. Please review everything carefully before we submit.`,

  SUBMITTED: (d) =>
    `Your application has been submitted successfully, **${d.name ? d.name.split(' ')[0] : 'there'}**!\n\nOur team at Consulting Group will review your profile and reach out to you at **${d.phone}** if a suitable **${d.jobRole}** position is available.\n\nThank you for choosing Consulting Group — we wish you the very best!`,

  VALIDATION_ERROR: () =>
    `No worries at all! Let's try that again — please provide the correct information below.`,

  EDIT_REQUEST: () =>
    `Of course! No problem. Please provide the updated value and I'll make that change for you right away.`,
};

const getMockResponse = (state, collectedData, isError, isEdit) => {
  const key = isError ? 'VALIDATION_ERROR' : isEdit ? 'EDIT_REQUEST' : state;
  const template = MOCK_RESPONSES[key] || MOCK_RESPONSES[state];
  if (!template) return { message: 'Please continue with your application.', extractedValue: null };
  const message = typeof template === 'function' ? template(collectedData) : template;
  return { message, extractedValue: null };
};

// ─── Core agent call ───────────────────────────────────────────────────────────
const getAgentResponse = async ({
  state,
  userMessage,
  collectedData,
  history = [],
  isError = false,
  isEdit = false,
}) => {
  // ── Mock mode — no API key required ─────────────────────────────────────────
  if (process.env.MOCK_MODE === 'true') {
    console.log(`[Mock] State: ${state} | isError: ${isError} | isEdit: ${isEdit}`);
    return getMockResponse(state, collectedData, isError, isEdit);
  }

  // ── Live mode — calls Claude API ─────────────────────────────────────────────
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = buildSystemPrompt(state, collectedData, isError, isEdit);
  const messages = [
    ...history.slice(-10),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const raw = response.content[0]?.text || '';

    try {
      const parsed = JSON.parse(raw);
      return {
        message:        parsed.message || raw,
        extractedValue: parsed.extractedValue ?? null,
      };
    } catch {
      console.warn('[Claude] Non-JSON response, using raw text');
      return { message: raw, extractedValue: null };
    }
  } catch (err) {
    console.error('[Claude] API error:', err.message);
    throw new Error('Agent unavailable. Please try again.');
  }
};

module.exports = { getAgentResponse };
