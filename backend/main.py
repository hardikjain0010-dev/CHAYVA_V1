"""Compatibility entrypoint for local uvicorn runs.

The application package lives in ``spendmind_backend/spendmind_backend`` and
uses top-level imports such as ``core`` and ``routers`` internally. Keep this
shim small so ``uvicorn main:app --reload`` works from the backend directory
without moving the existing backend code.
"""
from pathlib import Path
import sys

PACKAGE_DIR = Path(__file__).resolve().parent / "spendmind_backend" / "spendmind_backend"

if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from spendmind_backend.spendmind_backend.main import app
"""
SpendMind Backend — FastAPI entrypoint.

Run locally:
    uvicorn main:app --reload

Docs (Swagger UI): http://localhost:8000/docs
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.config import settings
from core.exceptions import register_exception_handlers
from core.limiter import limiter

from routers import expense, mood, insights, auth, sms, webhook, voice, report, spend_dna

app = FastAPI(
    title="SpendMind API",
    description=(
        "Backend for SpendMind — an emotionally-aware expense tracker. "
        "Handles expense CRUD, analytics, AI-bridged behavioral insights, "
        "SMS import, WhatsApp/voice logging, and weekly PDF reports."
    ),
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expense.router)
app.include_router(mood.router)
app.include_router(mood.router_plural)
app.include_router(insights.router)
app.include_router(auth.router)
app.include_router(sms.router)
app.include_router(webhook.router)
app.include_router(voice.router)
app.include_router(report.router)
app.include_router(spend_dna.router)


@app.get("/", tags=["Health"], summary="Health check")
def health_check():
    return {"status": "ok", "service": "SpendMind API", "env": settings.ENV}
