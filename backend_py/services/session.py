import uuid
import time
import threading
from typing import Optional, Dict

# ─── Config ───────────────────────────────────────────────────────────────────
SESSION_TTL = 30 * 60  # 30 minutes in seconds

# ─── In-memory store ──────────────────────────────────────────────────────────
_sessions: Dict[str, dict] = {}
_lock = threading.Lock()


# ─── Session shape ────────────────────────────────────────────────────────────
def _new_data() -> dict:
    return {
        "jobRole":        None,
        "location":       None,
        "shift":          None,
        "name":           None,
        "email":          None,
        "phone":          None,
        "dob":            None,
        "startDate":      None,
        "resumeBuffer":   None,
        "resumeFileName": None,
        "linkedIn":       None,
    }


# ─── CRUD ─────────────────────────────────────────────────────────────────────
def create_session() -> dict:
    session_id = str(uuid.uuid4())
    session = {
        "sessionId":  session_id,
        "state":      "JOB_SELECTION",
        "data":       _new_data(),
        "history":    [],
        "createdAt":  time.time(),
        "lastActive": time.time(),
    }
    with _lock:
        _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[dict]:
    with _lock:
        session = _sessions.get(session_id)
        if not session:
            return None
        # evict if expired
        if time.time() - session["lastActive"] > SESSION_TTL:
            del _sessions[session_id]
            return None
        session["lastActive"] = time.time()
        return session


def update_session(session_id: str, updates: dict) -> Optional[dict]:
    with _lock:
        session = _sessions.get(session_id)
        if not session:
            return None
        if "state" in updates:
            session["state"] = updates["state"]
        if "data" in updates:
            for key, val in updates["data"].items():
                session["data"][key] = val
        session["lastActive"] = time.time()
        return session


def add_to_history(session_id: str, role: str, content: str):
    with _lock:
        session = _sessions.get(session_id)
        if session:
            session["history"].append({"role": role, "content": content})
            session["lastActive"] = time.time()


# ─── Cleanup ──────────────────────────────────────────────────────────────────
def _cleanup():
    with _lock:
        now = time.time()
        expired = [sid for sid, s in _sessions.items() if now - s["lastActive"] > SESSION_TTL]
        for sid in expired:
            del _sessions[sid]
    if expired:
        print(f"[Session] Cleaned up {len(expired)} expired session(s)")


def start_cleanup_scheduler():
    """Runs session cleanup every 10 minutes in a background daemon thread."""
    def run():
        while True:
            time.sleep(10 * 60)
            _cleanup()
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
