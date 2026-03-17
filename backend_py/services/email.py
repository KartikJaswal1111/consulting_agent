import os
import smtplib
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from templates.owner_email import owner_email_template
from templates.applicant_email import applicant_email_template


# ─── Low-level sender ─────────────────────────────────────────────────────────
def _send_smtp(msg: MIMEMultipart):
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(os.getenv("EMAIL_FROM"), os.getenv("EMAIL_APP_PASSWORD"))
        server.send_message(msg)


# ─── Owner notification ───────────────────────────────────────────────────────
# Sends structured application data + resume attachment to the owner inbox
async def send_owner_email(data: dict):
    msg = MIMEMultipart()
    msg["From"]    = f"Consulting Group Agent <{os.getenv('EMAIL_FROM')}>"
    msg["To"]      = os.getenv("OWNER_EMAIL")
    msg["Subject"] = f"New Application — {data.get('jobRole')} | {data.get('location')} | {data.get('shift')}"

    msg.attach(MIMEText(owner_email_template(data), "html"))

    # Attach resume if uploaded
    if data.get("resumeBuffer") and data.get("resumeFileName"):
        part = MIMEBase("application", "octet-stream")
        part.set_payload(data["resumeBuffer"])
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{data["resumeFileName"]}"')
        msg.attach(part)

    # Run blocking SMTP in thread pool — don't block the event loop
    await asyncio.to_thread(_send_smtp, msg)
    print(f"[Email] Owner notified — {data.get('name')} | {data.get('jobRole')}")


# ─── Applicant confirmation ───────────────────────────────────────────────────
# Sends branded confirmation receipt to the job seeker
async def send_applicant_email(data: dict):
    msg = MIMEMultipart()
    msg["From"]    = f"Consulting Group <{os.getenv('EMAIL_FROM')}>"
    msg["To"]      = data["email"]
    msg["Subject"] = "Your Application to Consulting Group — Received"

    msg.attach(MIMEText(applicant_email_template(data), "html"))

    await asyncio.to_thread(_send_smtp, msg)
    print(f"[Email] Applicant confirmed — {data.get('email')}")
