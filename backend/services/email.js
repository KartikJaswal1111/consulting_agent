const nodemailer = require('nodemailer');
const { ownerEmailTemplate } = require('../templates/ownerEmail');
const { applicantEmailTemplate } = require('../templates/applicantEmail');

// ─── Transporter factory ───────────────────────────────────────────────────────
// Uses Gmail SMTP with an App Password — no OAuth complexity needed
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

// ─── Owner notification ────────────────────────────────────────────────────────
// Sends a structured application email to the Consulting Group inbox
const sendOwnerEmail = async (data) => {
  const transporter = createTransporter();

  const attachments = [];
  if (data.resumeBuffer && data.resumeFileName) {
    attachments.push({
      filename: data.resumeFileName,
      content:  data.resumeBuffer,
    });
  }

  const info = await transporter.sendMail({
    from:        `"Consulting Group Agent" <${process.env.EMAIL_FROM}>`,
    to:          process.env.OWNER_EMAIL,
    subject:     `New Application — ${data.jobRole} | ${data.location} | ${data.shift}`,
    html:        ownerEmailTemplate(data),
    attachments,
  });

  console.log(`[Email] Owner notified — MessageId: ${info.messageId}`);
  return info;
};

// ─── Applicant confirmation ────────────────────────────────────────────────────
// Sends a friendly confirmation receipt to the job seeker
const sendApplicantEmail = async (data) => {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from:    `"Consulting Group" <${process.env.EMAIL_FROM}>`,
    to:      data.email,
    subject: 'Your Application to Consulting Group — Received',
    html:    applicantEmailTemplate(data),
  });

  console.log(`[Email] Applicant confirmed — MessageId: ${info.messageId}`);
  return info;
};

module.exports = { sendOwnerEmail, sendApplicantEmail };
