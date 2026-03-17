from enum import Enum
from typing import Optional, List


# ─── States ───────────────────────────────────────────────────────────────────
class States(str, Enum):
    JOB_SELECTION      = "JOB_SELECTION"
    LOCATION_SELECTION = "LOCATION_SELECTION"
    SHIFT_SELECTION    = "SHIFT_SELECTION"
    COLLECT_NAME       = "COLLECT_NAME"
    COLLECT_EMAIL      = "COLLECT_EMAIL"
    COLLECT_PHONE      = "COLLECT_PHONE"
    COLLECT_DOB        = "COLLECT_DOB"
    COLLECT_START_DATE = "COLLECT_START_DATE"
    COLLECT_RESUME     = "COLLECT_RESUME"
    COLLECT_LINKEDIN   = "COLLECT_LINKEDIN"
    CONFIRMATION       = "CONFIRMATION"
    SUBMITTED          = "SUBMITTED"


# ─── Job data ─────────────────────────────────────────────────────────────────
JOBS = [
    "Forklift Operator",
    "General Labour",
    "Skidders & Packers",
    "Mechanical Helper",
    "Machine Operators",
    "Light Loading/Unloading",
    "Sanitation Workers",
    "Chemical Compounder",
]

LOCATIONS = ["Etobicoke", "Tottenham", "Mississauga"]

SHIFTS = ["Morning (6AM–2PM)", "Afternoon (2PM–10PM)", "Night (10PM–6AM)"]


# ─── Flow order ───────────────────────────────────────────────────────────────
STATE_FLOW = [
    States.JOB_SELECTION,
    States.LOCATION_SELECTION,
    States.SHIFT_SELECTION,
    States.COLLECT_NAME,
    States.COLLECT_EMAIL,
    States.COLLECT_PHONE,
    States.COLLECT_DOB,
    States.COLLECT_START_DATE,
    States.COLLECT_RESUME,
    States.COLLECT_LINKEDIN,
    States.CONFIRMATION,
    States.SUBMITTED,
]

# ─── Buttons per state ────────────────────────────────────────────────────────
STATE_BUTTONS = {
    States.JOB_SELECTION:      JOBS,
    States.LOCATION_SELECTION: LOCATIONS,
    States.SHIFT_SELECTION:    SHIFTS,
    States.COLLECT_RESUME:     ["Skip"],
    States.COLLECT_LINKEDIN:   ["Skip"],
    States.CONFIRMATION:       ["Confirm & Submit", "Edit"],
}

# ─── Input type per state ─────────────────────────────────────────────────────
STATE_INPUT_TYPE = {
    States.JOB_SELECTION:      "buttons",
    States.LOCATION_SELECTION: "buttons",
    States.SHIFT_SELECTION:    "buttons",
    States.COLLECT_RESUME:     "file",
    States.CONFIRMATION:       "buttons",
}

# ─── Which data key each state fills ─────────────────────────────────────────
STATE_DATA_KEY = {
    States.JOB_SELECTION:      "jobRole",
    States.LOCATION_SELECTION: "location",
    States.SHIFT_SELECTION:    "shift",
    States.COLLECT_NAME:       "name",
    States.COLLECT_EMAIL:      "email",
    States.COLLECT_PHONE:      "phone",
    States.COLLECT_DOB:        "dob",
    States.COLLECT_START_DATE: "startDate",
    States.COLLECT_RESUME:     "resumeFileName",
    States.COLLECT_LINKEDIN:   "linkedIn",
}

# ─── Edit keyword → field mapping ─────────────────────────────────────────────
FIELD_TO_STATE = {
    "jobRole":   States.JOB_SELECTION,
    "location":  States.LOCATION_SELECTION,
    "shift":     States.SHIFT_SELECTION,
    "name":      States.COLLECT_NAME,
    "email":     States.COLLECT_EMAIL,
    "phone":     States.COLLECT_PHONE,
    "dob":       States.COLLECT_DOB,
    "startDate": States.COLLECT_START_DATE,
    "resume":    States.COLLECT_RESUME,
    "linkedIn":  States.COLLECT_LINKEDIN,
}

EDIT_KEYWORDS = {
    "job": "jobRole", "role": "jobRole", "position": "jobRole",
    "location": "location", "city": "location",
    "shift": "shift", "schedule": "shift",
    "name": "name",
    "email": "email",
    "phone": "phone", "number": "phone",
    "dob": "dob", "birth": "dob", "date of birth": "dob",
    "start": "startDate", "available": "startDate",
    "resume": "resume", "cv": "resume",
    "linkedin": "linkedIn",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────
def get_next_state(current: States) -> Optional[States]:
    try:
        idx = STATE_FLOW.index(current)
        if idx + 1 < len(STATE_FLOW):
            return STATE_FLOW[idx + 1]
    except ValueError:
        pass
    return None


def get_buttons(state: States) -> List[str]:
    return STATE_BUTTONS.get(state, [])


def get_input_type(state: States) -> str:
    return STATE_INPUT_TYPE.get(state, "text")


def get_data_key(state: States) -> Optional[str]:
    return STATE_DATA_KEY.get(state)


def detect_edit_field(message: str) -> Optional[str]:
    msg = message.lower()
    for keyword, field in EDIT_KEYWORDS.items():
        if keyword in msg:
            return field
    return None
