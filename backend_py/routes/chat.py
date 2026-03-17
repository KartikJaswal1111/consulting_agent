import asyncio
from fastapi import APIRouter, Request, HTTPException

from services.session import create_session, get_session, update_session, add_to_history
from services.claude import get_agent_response
from utils.state_manager import (
    States, JOBS, LOCATIONS, SHIFTS,
    get_next_state, get_buttons, get_input_type, get_data_key, detect_edit_field, FIELD_TO_STATE,
)
from utils.validator import (
    validate_job, validate_location, validate_shift,
    validate_name, validate_email, validate_phone, validate_dob,
    validate_start_date, validate_linkedin,
    is_resume_skip, is_linkedin_skip,
)

router = APIRouter()


# ─── POST /api/chat/start ─────────────────────────────────────────────────────
@router.post("/start")
async def start_chat():
    session = create_session()
    session_id = session["sessionId"]

    message = await get_agent_response(
        state=States.JOB_SELECTION,
        user_message="",
        collected_data=session["data"],
        history=[],
    )

    add_to_history(session_id, "assistant", message)

    return {
        "sessionId": session_id,
        "message":   message,
        "state":     States.JOB_SELECTION,
        "buttons":   get_buttons(States.JOB_SELECTION),
        "inputType": get_input_type(States.JOB_SELECTION),
        "isError":   False,
    }


# ─── POST /api/chat/message ───────────────────────────────────────────────────
# Accepts JSON or multipart/form-data (for resume file upload)
@router.post("/message")
async def send_message(request: Request):
    content_type = request.headers.get("content-type", "")

    # Parse body — JSON or multipart
    if "multipart/form-data" in content_type:
        form        = await request.form()
        session_id  = form.get("sessionId")
        user_message = form.get("message", "")
        upload_file = form.get("file")
    else:
        body        = await request.json()
        session_id  = body.get("sessionId")
        user_message = body.get("message", "")
        upload_file = None

    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId is required.")

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=400, detail="SESSION_EXPIRED")

    state         = States(session["state"])
    collected     = session["data"]
    history       = session["history"]
    is_error      = False
    is_edit       = False

    # ── Edit detection at CONFIRMATION ────────────────────────────────────────
    if state == States.CONFIRMATION and "edit" in user_message.lower():
        field = detect_edit_field(user_message)
        if field and field in FIELD_TO_STATE:
            target_state = FIELD_TO_STATE[field]
            update_session(session_id, {"state": target_state.value})
            add_to_history(session_id, "user", user_message)

            message = await get_agent_response(
                state=target_state.value,
                user_message=user_message,
                collected_data=collected,
                history=history,
                is_edit=True,
            )
            add_to_history(session_id, "assistant", message)

            return {
                "message":   message,
                "state":     target_state.value,
                "buttons":   get_buttons(target_state),
                "inputType": get_input_type(target_state),
                "isError":   False,
            }

    # ── Validate input for current state ──────────────────────────────────────
    valid, extracted, error_msg = _validate_for_state(state, user_message, upload_file)

    if not valid:
        is_error = True
        add_to_history(session_id, "user", user_message)

        message = await get_agent_response(
            state=state.value,
            user_message=user_message,
            collected_data=collected,
            history=history,
            is_error=True,
        )
        add_to_history(session_id, "assistant", message)

        return {
            "message":   error_msg or message,
            "state":     state.value,
            "buttons":   get_buttons(state),
            "inputType": get_input_type(state),
            "isError":   True,
        }

    # ── Save validated value to session ───────────────────────────────────────
    data_key = get_data_key(state)
    data_update = {}

    if data_key:
        data_update[data_key] = extracted

    # Handle resume buffer separately
    if state == States.COLLECT_RESUME and upload_file and not is_resume_skip(user_message):
        file_bytes = await upload_file.read()
        data_update["resumeBuffer"]   = file_bytes
        data_update["resumeFileName"] = upload_file.filename

    update_session(session_id, {"data": data_update})
    add_to_history(session_id, "user", user_message)

    # ── Advance state ─────────────────────────────────────────────────────────
    next_state = get_next_state(state)
    if next_state:
        update_session(session_id, {"state": next_state.value})

    # Refresh session after updates
    session     = get_session(session_id)
    collected   = session["data"]
    next_state  = States(session["state"])

    message = await get_agent_response(
        state=next_state.value,
        user_message=user_message,
        collected_data=collected,
        history=history,
    )
    add_to_history(session_id, "assistant", message)

    # Build confirmation summary if we just reached CONFIRMATION
    confirmation_data = _build_summary(collected) if next_state == States.CONFIRMATION else None

    return {
        "message":          message,
        "state":            next_state.value,
        "buttons":          get_buttons(next_state),
        "inputType":        get_input_type(next_state),
        "confirmationData": confirmation_data,
        "isError":          False,
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _validate_for_state(state: States, message: str, upload_file=None):
    """Dispatch to the correct validator for the current state."""
    if state == States.JOB_SELECTION:
        return validate_job(message, JOBS)
    if state == States.LOCATION_SELECTION:
        return validate_location(message, LOCATIONS)
    if state == States.SHIFT_SELECTION:
        return validate_shift(message, SHIFTS)
    if state == States.COLLECT_NAME:
        return validate_name(message)
    if state == States.COLLECT_EMAIL:
        return validate_email(message)
    if state == States.COLLECT_PHONE:
        return validate_phone(message)
    if state == States.COLLECT_DOB:
        return validate_dob(message)
    if state == States.COLLECT_START_DATE:
        return validate_start_date(message)
    if state == States.COLLECT_RESUME:
        if is_resume_skip(message):
            return True, None, None
        if upload_file:
            return True, upload_file.filename, None
        return False, None, "Please upload your resume (PDF, DOC, DOCX) or type 'skip'."
    if state == States.COLLECT_LINKEDIN:
        if is_linkedin_skip(message):
            return True, None, None
        return validate_linkedin(message)
    if state == States.CONFIRMATION:
        if message.strip().lower() in ["confirm", "confirm & submit", "submit", "yes", "looks good"]:
            return True, "confirmed", None
        return False, None, "Please click 'Confirm & Submit' to proceed, or say 'edit' to make changes."

    return True, message, None


def _build_summary(data: dict) -> dict:
    return {
        "jobRole":    data.get("jobRole"),
        "location":   data.get("location"),
        "shift":      data.get("shift"),
        "name":       data.get("name"),
        "email":      data.get("email"),
        "phone":      data.get("phone"),
        "dob":        data.get("dob"),
        "startDate":  data.get("startDate"),
        "resume":     data.get("resumeFileName") or "Not provided",
        "linkedIn":   data.get("linkedIn") or "Not provided",
    }
