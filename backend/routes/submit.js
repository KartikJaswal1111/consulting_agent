const express = require('express');
const router  = express.Router();

const { getSession, updateSession } = require('../services/session');
const { sendOwnerEmail, sendApplicantEmail } = require('../services/email');
const { STATES } = require('../utils/stateManager');

// Required fields — every application must have all of these
const REQUIRED_FIELDS = ['jobRole', 'location', 'shift', 'name', 'email', 'phone', 'dob', 'startDate'];

// ─── POST /api/submit ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ error: 'sessionId is required.' });

    const session = getSession(sessionId);
    if (!session) {
      return res.status(400).json({ error: 'SESSION_EXPIRED', message: 'Session expired. Please start over.' });
    }

    // Guard — must be in CONFIRMATION state to submit
    if (session.state !== STATES.CONFIRMATION) {
      return res.status(400).json({ error: 'Application is not ready for submission.' });
    }

    const data = session.data;

    // Verify all required fields are populated
    const missing = REQUIRED_FIELDS.filter(f => !data[f]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Fire both emails in parallel — fastest possible delivery to owner
    const [ownerResult, applicantResult] = await Promise.allSettled([
      sendOwnerEmail(data),
      sendApplicantEmail(data),
    ]);

    if (ownerResult.status === 'rejected') {
      // Critical failure — owner didn't get the application
      console.error('[Submit] Owner email FAILED:', ownerResult.reason);
      return res.status(500).json({ error: 'Failed to deliver application. Please try again or call +1 647-292-5145.' });
    }

    if (applicantResult.status === 'rejected') {
      // Non-critical — applicant confirmation failed but owner got it
      console.warn('[Submit] Applicant confirmation email failed:', applicantResult.reason);
    }

    // Mark session complete and clear resume buffer from memory
    updateSession(sessionId, {
      state: STATES.SUBMITTED,
      data:  { resumeBuffer: null }, // Free memory — already sent as attachment
    });

    console.log(`[Submit] Application submitted — ${data.name} | ${data.jobRole} | ${data.location}`);

    const firstName = data.name ? data.name.split(' ')[0] : 'there';

    res.json({
      success: true,
      message: `Your application has been submitted successfully, **${firstName}**!\n\nOur team at Consulting Group will review your profile and reach out to you at **${data.phone}** if a suitable **${data.jobRole}** position is available.\n\nThank you for choosing Consulting Group — we wish you all the best!`,
    });

  } catch (err) {
    console.error('[Submit] Unexpected error:', err.message);
    res.status(500).json({ error: 'Submission failed. Please try again.' });
  }
});

module.exports = router;
