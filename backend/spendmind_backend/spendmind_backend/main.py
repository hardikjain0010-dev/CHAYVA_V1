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
    allow_origin_regex=r"^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$",
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
    return {"status": "ok", "service": "arthyne-backend", "env": settings.ENV}


@app.get("/readiness", tags=["Health"], summary="Readiness check")
def readiness_check():
    return {"status": "ready", "service": "arthyne-backend"}


@app.get("/health/ai", tags=["Health"], summary="Safe AI providers diagnostics")
def ai_health_check():
    from ai_engine.clients.gemini_client import call_gemini
    from ai_engine.clients.groq_client import call_groq
    from ai_engine.clients.openrouter_client import call_openrouter

    diagnostics = {}

    # 1. Gemini
    gemini_key_set = bool(settings.GEMINI_API_KEY)
    if gemini_key_set:
        try:
            res = call_gemini("System", "Ping", max_retries=1, timeout_ms=5000)
            diagnostics["gemini"] = {
                "configured": True,
                "reachable": res.get("success", False),
                "model": res.get("model", "unknown"),
                "latency_ms": res.get("latency_ms", 0),
                "error_category": None if res.get("success") else ("timeout" if res.get("error") == "Request timeout" else "provider_error"),
            }
        except Exception as e:
            diagnostics["gemini"] = {
                "configured": True,
                "reachable": False,
                "error_category": type(e).__name__,
            }
    else:
        diagnostics["gemini"] = {"configured": False, "reachable": False}

    # 2. Groq
    groq_key_set = bool(settings.GROQ_API_KEY)
    if groq_key_set:
        try:
            res = call_groq("System", "Ping", max_retries=1, timeout_ms=5000)
            diagnostics["groq"] = {
                "configured": True,
                "reachable": res.get("success", False),
                "model": res.get("model", "unknown"),
                "latency_ms": res.get("latency_ms", 0),
                "error_category": None if res.get("success") else ("timeout" if res.get("error") == "Request timeout" else "provider_error"),
            }
        except Exception as e:
            diagnostics["groq"] = {
                "configured": True,
                "reachable": False,
                "error_category": type(e).__name__,
            }
    else:
        diagnostics["groq"] = {"configured": False, "reachable": False}

    # 3. OpenRouter
    openrouter_key_set = bool(settings.OPENROUTER_API_KEY)
    if openrouter_key_set:
        try:
            res = call_openrouter("System", "Ping", max_retries=1, timeout_ms=5000)
            diagnostics["openrouter"] = {
                "configured": True,
                "reachable": res.get("success", False),
                "model": res.get("model", "unknown"),
                "latency_ms": res.get("latency_ms", 0),
                "error_category": None if res.get("success") else ("timeout" if res.get("error") == "Request timeout" else "provider_error"),
            }
        except Exception as e:
            diagnostics["openrouter"] = {
                "configured": True,
                "reachable": False,
                "error_category": type(e).__name__,
            }
    else:
        diagnostics["openrouter"] = {"configured": False, "reachable": False}

    # 4. DeepSeek (routed via OpenRouter)
    diagnostics["deepseek"] = {
        "configured": openrouter_key_set,
        "mode": "routed_via_openrouter",
        "reachable": diagnostics.get("openrouter", {}).get("reachable", False),
    }

    return {"status": "ok", "providers": diagnostics}
