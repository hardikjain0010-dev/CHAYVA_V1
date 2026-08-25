"""
SpendMind Backend — FastAPI entrypoint.

Run locally:
    uvicorn main:app --reload

Docs (Swagger UI): http://localhost:8000/docs
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.exceptions import register_exception_handlers

from routers import expense, mood, insights, auth, sms, webhook, voice, spend_dna, profile

app = FastAPI(
    title="SpendMind API",
    description=(
        "Backend for SpendMind — an emotionally-aware expense tracker. "
        "Handles expense CRUD, analytics, AI-bridged behavioral insights, "
        "SMS import, WhatsApp/voice logging, and weekly AI coaching reports."
    ),
    version="1.0.0",
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(profile.router)


@app.get("/", tags=["Health"], summary="Root health check")
def root_check():
    return {"status": "ok", "service": "SpendMind API", "env": settings.ENV}


@app.get("/health", tags=["Health"], summary="Public health check")
def health_check():
    return {"status": "ok", "service": "caayva-backend", "env": settings.ENV}


@app.get("/readiness", tags=["Health"], summary="Readiness check")
def readiness_check():
    return {"status": "ready", "service": "caayva-backend"}
