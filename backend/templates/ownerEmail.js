const ownerEmailTemplate = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 20px; background: #f0f4f4; font-family: Arial, sans-serif; }
  .wrap { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #0a7f88; padding: 24px 28px; }
  .header h1 { margin: 0 0 6px; color: #fff; font-size: 20px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(255,255,255,0.35); }
  .section { padding: 20px 28px; border-bottom: 1px solid #f0f0f0; }
  .section:last-of-type { border-bottom: none; }
  .section h3 { margin: 0 0 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #0a7f88; }
  .row { display: flex; margin-bottom: 9px; font-size: 14px; }
  .label { width: 130px; color: #999; flex-shrink: 0; }
  .value { color: #222; font-weight: 600; }
  .value a { color: #0a7f88; text-decoration: none; }
  .action { background: #f7fafa; padding: 20px 28px; text-align: center; }
  .action p { margin: 0 0 14px; font-size: 13px; color: #666; }
  .btn { display: inline-block; background: #0a7f88; color: #fff; text-decoration: none; padding: 11px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; }
  .footer { padding: 14px 28px; background: #fafafa; font-size: 11px; color: #bbb; text-align: center; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <h1>New Job Application Received</h1>
    <span class="badge">via Website AI Agent</span>
  </div>

  <div class="section">
    <h3>Position</h3>
    <div class="row"><span class="label">Role</span><span class="value">${data.jobRole}</span></div>
    <div class="row"><span class="label">Location</span><span class="value">${data.location}, ON</span></div>
    <div class="row"><span class="label">Shift</span><span class="value">${data.shift}</span></div>
    <div class="row"><span class="label">Available From</span><span class="value">${data.startDate}</span></div>
  </div>

  <div class="section">
    <h3>Applicant</h3>
    <div class="row"><span class="label">Full Name</span><span class="value">${data.name}</span></div>
    <div class="row"><span class="label">Phone</span><span class="value"><a href="tel:${data.phone}">${data.phone}</a></span></div>
    <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${data.email}">${data.email}</a></span></div>
    <div class="row"><span class="label">Date of Birth</span><span class="value">${data.dob}</span></div>
  </div>

  <div class="section">
    <h3>Links & Resume</h3>
    <div class="row">
      <span class="label">LinkedIn</span>
      <span class="value">${data.linkedIn ? `<a href="${data.linkedIn}">${data.linkedIn}</a>` : 'Not provided'}</span>
    </div>
    <div class="row">
      <span class="label">Resume</span>
      <span class="value">${data.resumeFileName ? `Attached — ${data.resumeFileName}` : 'Not uploaded'}</span>
    </div>
  </div>

  <div class="action">
    <p>Ready to reach out? Call the applicant directly:</p>
    <a href="tel:${data.phone}" class="btn">Call ${data.name.split(' ')[0]} — ${data.phone}</a>
  </div>

  <div class="footer">
    Received: ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'full', timeStyle: 'short' })} EST
    &nbsp;&bull;&nbsp; Consulting Group AI Agent
  </div>

</div>
</body>
</html>
`;

module.exports = { ownerEmailTemplate };
