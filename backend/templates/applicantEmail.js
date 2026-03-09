const applicantEmailTemplate = (data) => {
  const firstName = data.name ? data.name.split(' ')[0] : 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 20px; background: #f0f4f4; font-family: Arial, sans-serif; }
  .wrap { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #0a7f88; padding: 32px 28px; text-align: center; }
  .checkmark { font-size: 48px; margin-bottom: 8px; }
  .header h1 { margin: 0 0 6px; color: #fff; font-size: 22px; }
  .header p { margin: 0; color: rgba(255,255,255,0.88); font-size: 14px; }
  .body { padding: 28px; }
  .body p { margin: 0 0 16px; font-size: 14px; color: #444; line-height: 1.6; }
  .summary { background: #f7fafa; border: 1px solid #e0eeee; border-radius: 8px; padding: 4px 0; margin: 20px 0; }
  .row { display: flex; padding: 10px 18px; border-bottom: 1px solid #eef4f4; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .label { width: 110px; color: #999; flex-shrink: 0; }
  .value { color: #222; font-weight: 600; }
  .note { background: #e6f4f5; border-left: 4px solid #0a7f88; padding: 14px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #2a5f63; margin: 20px 0; line-height: 1.6; }
  .contact { text-align: center; margin: 24px 0 8px; }
  .contact p { font-size: 13px; color: #777; margin: 0 0 12px; }
  .contact a { color: #0a7f88; text-decoration: none; font-weight: 600; }
  .footer { padding: 16px 28px; background: #f7fafa; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <div class="checkmark">&#10003;</div>
    <h1>Application Received!</h1>
    <p>Thank you for applying, ${firstName}</p>
  </div>

  <div class="body">
    <p>We've received your application for <strong>${data.jobRole}</strong> at Consulting Group. Here's a summary for your records:</p>

    <div class="summary">
      <div class="row"><span class="label">Position</span><span class="value">${data.jobRole}</span></div>
      <div class="row"><span class="label">Location</span><span class="value">${data.location}, Ontario</span></div>
      <div class="row"><span class="label">Shift</span><span class="value">${data.shift}</span></div>
      <div class="row"><span class="label">Start Date</span><span class="value">${data.startDate}</span></div>
      <div class="row"><span class="label">Resume</span><span class="value">${data.resumeFileName ? 'Submitted' : 'Not provided'}</span></div>
    </div>

    <div class="note">
      Our recruitment team will review your profile and reach out to you at <strong>${data.phone}</strong> if a suitable position is available. We appreciate your patience.
    </div>

    <div class="contact">
      <p>Have questions? We're here to help:</p>
      <a href="tel:${process.env.CONTACT_PHONE}">${process.env.CONTACT_PHONE}</a>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <a href="mailto:${process.env.CONTACT_EMAIL}">${process.env.CONTACT_EMAIL}</a>
      <br><br>
      <a href="${process.env.CONTACT_WEBSITE}">${process.env.CONTACT_WEBSITE}</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Consulting Group &nbsp;&bull;&nbsp; Ontario, Canada<br>
    You received this because you submitted a job application via our website.
  </div>

</div>
</body>
</html>
`;
};

module.exports = { applicantEmailTemplate };
