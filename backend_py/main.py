from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.chat import router as chat_router
from routes.submit import router as submit_router
from services.session import start_cleanup_scheduler

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Consulting Group AI Agent", version="1.0.0")

# ─── CORS ─────────────────────────────────────────────────────────────────────
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static widget files ──────────────────────────────────────────────────────
widget_path = os.path.join(os.path.dirname(__file__), "..", "widget")
if os.path.exists(widget_path):
    app.mount("/widget", StaticFiles(directory=widget_path), name="widget")

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(chat_router,   prefix="/api/chat")
app.include_router(submit_router, prefix="/api/submit")


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    from datetime import datetime, timezone
    return {
        "status":    "ok",
        "service":   "consulting-group-agent-py",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    start_cleanup_scheduler()
    port = os.getenv("PORT", "8000")
    print(f"Consulting Group Backend (Python) running on http://localhost:{port}")
    print(f"API docs available at http://localhost:{port}/docs")
