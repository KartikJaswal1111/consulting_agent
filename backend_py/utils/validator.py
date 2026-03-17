import re
from datetime import datetime, date
from typing import Tuple, Optional


# ─── Fuzzy match helper ───────────────────────────────────────────────────────
def find_match(value: str, options: list) -> Optional[str]:
    v = value.lower().strip()
    for opt in options:
        if opt.lower() == v:
            return opt
    for opt in options:
        if v in opt.lower() or opt.lower() in v:
            return opt
    return None


# ─── Per-field validators ─────────────────────────────────────────────────────
# Each returns (is_valid, extracted_value, error_message)

def validate_job(message: str, jobs: list) -> Tuple[bool, Optional[str], Optional[str]]:
    match = find_match(message, jobs)
    if match:
        return True, match, None
    return False, None, f"Please select one of the available positions: {', '.join(jobs)}"


def validate_location(message: str, locations: list) -> Tuple[bool, Optional[str], Optional[str]]:
    match = find_match(message, locations)
    if match:
        return True, match, None
    return False, None, f"Please choose from: {', '.join(locations)}"


def validate_shift(message: str, shifts: list) -> Tuple[bool, Optional[str], Optional[str]]:
    match = find_match(message, shifts)
    if match:
        return True, match, None
    return False, None, f"Please select a shift: {', '.join(shifts)}"


def validate_name(message: str) -> Tuple[bool, Optional[str], Optional[str]]:
    name = message.strip()
    if len(name) < 2:
        return False, None, "Please enter your full name (at least 2 characters)."
    if not re.match(r"^[a-zA-Z\s\-']+$", name):
        return False, None, "Name should contain letters only — no numbers or special characters."
    return True, name, None


def validate_email(message: str) -> Tuple[bool, Optional[str], Optional[str]]:
    email = message.strip().lower()
    if re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return True, email, None
    return False, None, "Please enter a valid email address (e.g. john@example.com)."


def validate_phone(message: str) -> Tuple[bool, Optional[str], Optional[str]]:
    digits = re.sub(r'\D', '', message)
    if digits.startswith('1') and len(digits) == 11:
        digits = digits[1:]
    if len(digits) == 10:
        formatted = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        return True, formatted, None
    return False, None, "Please enter a valid Canadian phone number (e.g. 647-555-1234)."


def validate_dob(message: str) -> Tuple[bool, Optional[str], Optional[str]]:
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%B %d, %Y", "%b %d, %Y"]
    for fmt in formats:
        try:
            dob = datetime.strptime(message.strip(), fmt).date()
            today = date.today()
            age = (today - dob).days // 365
            if dob > today:
                return False, None, "Date of birth cannot be in the future."
            if age < 18:
                return False, None, "You must be at least 18 years old to apply."
            return True, dob.strftime("%B %d, %Y"), None
        except ValueError:
            continue
    return False, None, "Please enter your date of birth (e.g. 1990-01-15 or January 15, 1990)."


def validate_start_date(message: str) -> Tuple[bool, Optional[str], Optional[str]]:
    msg = message.strip().lower()
    if msg in ["asap", "as soon as possible", "immediately", "right away", "now"]:
        return True, "ASAP", None
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%B %d, %Y", "%b %d, %Y"]
    for fmt in formats:
        try:
            start = datetime.strptime(message.strip(), fmt).date()
            if start < date.today():
                return False, None, "Start date must be today or in the future."
            return True, start.strftime("%B %d, %Y"), None
        except ValueError:
            continue
    return False, None, 'Please enter a start date (e.g. "2024-06-01") or type "ASAP".'


def validate_linkedin(message: str) -> Tuple[bool, Optional[str], Optional[str]]:
    msg = message.strip()
    if "linkedin.com" in msg.lower():
        return True, msg, None
    return False, None, "Please enter a valid LinkedIn URL (e.g. linkedin.com/in/yourname) or type 'skip'."


def is_resume_skip(message: str) -> bool:
    return message.strip().lower() in [
        "skip", "no", "nope", "no thanks", "skip it",
        "dont have", "don't have", "no resume", "later", "n/a",
    ]


def is_linkedin_skip(message: str) -> bool:
    return message.strip().lower() in [
        "skip", "no", "nope", "no thanks", "skip it",
        "dont have", "don't have", "no linkedin", "later", "n/a",
    ]
