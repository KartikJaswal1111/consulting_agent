import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.session import get_session, update_session
from services.email import send_owner_email, send_applicant_email
from utils.state_manager import States

router = APIRouter()

REQUIRED_FIELDS = ["jobRole", "location", "shift", "name", "email", "phone", "dob", "startDate"]


class SubmitRequest(BaseModel):
    sessionId: str


# ─── POST /api/submit ─────────────────────────────────────────────────────────
@router.post("/")
async def submit_application(body: SubmitRequest):
    session = get_session(body.sessionId)
    if not session:
        raise HTTPException(status_code=400, detail="SESSION_EXPIRED")

    # Must be in CONFIRMATION state to submit
    if session["state"] != States.CONFIRMATION:
        raise HTTPException(status_code=400, detail="Application is not ready for submission.")

    data = session["data"]

    # Verify all required fields are present
    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    # Fire both emails in parallel — fastest delivery
    owner_result, applicant_result = await asyncio.gather(
        send_owner_email(data),
        send_applicant_email(data),
        return_exceptions=True,
    )

    # Owner email is critical — fail hard if it didn't send
    if isinstance(owner_result, Exception):
        print(f"[Submit] Owner email FAILED: {owner_result}")
        raise HTTPException(
            status_code=500,
            detail="Failed to deliver application. Please try again or call us directly.",
        )

    # Applicant confirmation is non-critical — warn only
    if isinstance(applicant_result, Exception):
        print(f"[Submit] Applicant confirmation failed: {applicant_result}")

    # Mark session complete — clear resume buffer from memory
    update_session(body.sessionId, {
        "state": States.SUBMITTED.value,
        "data":  {"resumeBuffer": None},
    })

    first_name = (data.get("name") or "there").split()[0]
    print(f"[Submit] Application submitted — {data.get('name')} | {data.get('jobRole')} | {data.get('location')}")

    return {
        "success": True,
        "message": (
            f"Your application has been submitted successfully, **{first_name}**!\n\n"
            f"Our team at Consulting Group will review your profile and reach out to you at "
            f"**{data.get('phone')}** if a suitable **{data.get('jobRole')}** position is available.\n\n"
            "Thank you for choosing Consulting Group — we wish you all the best!"
        ),
    }
