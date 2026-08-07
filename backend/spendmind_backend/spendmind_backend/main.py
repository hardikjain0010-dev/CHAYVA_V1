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

from routers import expense, mood, insights, auth, sms, webhook, voice, spend_dna

app = FastAPI(
    title="SpendMind API",
    description=(
        "Backend for SpendMind — an emotionally-aware expense tracker. "
        "Handles expense CRUD, analytics, AI-bridged behavioral insights, "
        "SMS import, WhatsApp/voice logging, and weekly AI coaching reports."
    ),
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)

print(f"[DEBUG] CORS_ORIGINS: {settings.CORS_ORIGINS}")
print(f"[DEBUG] CORS_ORIGINS type: {type(settings.CORS_ORIGINS)}")
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
app.include_router(spend_dna.router)


@app.get("/", tags=["Health"], summary="Health check")
def health_check():
    return {"status": "ok", "service": "SpendMind API", "env": settings.ENV}
