import os
import json
from typing import Optional

# ─── Mock responses (MOCK_MODE=true) ─────────────────────────────────────────
MOCK_RESPONSES = {
    "JOB_SELECTION": (
        "Hi! Welcome to **Consulting Group**! We're excited to help you find your next "
        "opportunity across Ontario. Which position are you interested in today?"
    ),
    "LOCATION_SELECTION": lambda d: (
        f"Great choice! **{d.get('jobRole')}** is a fantastic role with strong demand "
        "across our locations. Which city works best for you?"
    ),
    "SHIFT_SELECTION": lambda d: (
        f"**{d.get('location')}** — great pick! Now, which shift works best for your schedule?"
    ),
    "COLLECT_NAME": (
        "Awesome! Could I get your **full name** please?"
    ),
    "COLLECT_EMAIL": lambda d: (
        f"Nice to meet you, **{d.get('name', '').split()[0] if d.get('name') else 'there'}**! "
        "What's your **email address**?"
    ),
    "COLLECT_PHONE": (
        "Got it! And your **phone number** so our team can reach you?"
    ),
    "COLLECT_DOB": (
        "Thank you! Could you share your **date of birth**? "
        "This is for eligibility verification only."
    ),
    "COLLECT_START_DATE": (
        "Perfect! When would you be **available to start**? "
        "You can say 'ASAP', a specific date, or something like 'next Monday'."
    ),
    "COLLECT_RESUME": (
        "Almost there! Would you like to **upload your resume**? "
        "(PDF, DOC, or DOCX — completely optional, you can skip this.)"
    ),
    "COLLECT_LINKEDIN": (
        "Great! Do you have a **LinkedIn profile** you'd like to share? "
        "No LinkedIn? No problem — just type 'skip'."
    ),
    "CONFIRMATION": (
        "Perfect! Here's a **summary of your application**. "
        "Please review everything and confirm when you're ready to submit."
    ),
    "SUBMITTED": lambda d: (
        f"Your application has been submitted successfully, "
        f"**{d.get('name', '').split()[0] if d.get('name') else 'there'}**!\n\n"
        f"Our team at Consulting Group will review your profile and reach out to you at "
        f"**{d.get('phone')}** if a suitable **{d.get('jobRole')}** position is available.\n\n"
        "Thank you for choosing Consulting Group — we wish you the very best!"
    ),
    "VALIDATION_ERROR": (
        "No worries — let's try that again. Please check your input and give it another shot!"
    ),
    "EDIT_REQUEST": (
        "Of course! Please go ahead and provide the updated information."
    ),
}


def _get_mock_response(state: str, collected_data: dict, is_error: bool, is_edit: bool) -> str:
    key = "VALIDATION_ERROR" if is_error else "EDIT_REQUEST" if is_edit else state
    response = MOCK_RESPONSES.get(key, "Let's continue with your application.")
    return response(collected_data) if callable(response) else response


# ─── Main entry point ─────────────────────────────────────────────────────────
async def get_agent_response(
    state: str,
    user_message: str,
    collected_data: dict,
    history: Optional[list] = None,
    is_error: bool = False,
    is_edit: bool = False,
) -> str:
    if history is None:
        history = []

    # Mock Mode — no API call
    if os.getenv("MOCK_MODE", "true").lower() == "true":
        return _get_mock_response(state, collected_data, is_error, is_edit)

    # Live Mode — call Claude
    from anthropic import Anthropic
    from prompts.system_prompt import build_system_prompt

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    system = build_system_prompt(state, collected_data, is_error, is_edit)

    messages = list(history)
    if user_message:
        messages.append({"role": "user", "content": user_message})
    if not messages:
        messages = [{"role": "user", "content": "start"}]

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=system,
        messages=messages,
    )

    raw = response.content[0].text.strip()

    # Parse structured JSON output
    try:
        parsed = json.loads(raw)
        return parsed.get("message", raw)
    except json.JSONDecodeError:
        return raw
