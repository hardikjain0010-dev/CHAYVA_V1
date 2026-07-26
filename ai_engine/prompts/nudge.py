"""
SpendMind — predict_nudge()
Predicts whether a spending nudge is relevant right now.
Model: Groq LLaMA 3.3 70B (fastest — nudges need real-time response).
Called by Person B's GET /nudges/current endpoint.
"""

from datetime import datetime
from typing import Optional

from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.nudge_prompt import build_nudge_prompt, should_attempt_nudge
from ai_engine.prompts.base import GRACEFUL_DEFAULTS


def predict_nudge(
    user_id: str,
    current_dt: Optional[datetime] = None,
    trigger_patterns: Optional[list] = None
) -> dict:
    """
    Predict whether to send a behavioral spending nudge right now.

    Args:
        user_id: user identifier (for logging/rate limiting)
        current_dt: datetime object — defaults to datetime.now() if None
        trigger_patterns: list of trigger dicts from detect_triggers()
                          [{trigger, behavior, frequency, emotion}]

    Returns:
        {
            "should_nudge": bool,
            "message": str | None,
            "_meta": {...}
        }
    """
    no_nudge_response = {
        "should_nudge": False,
        "message": None,
        "_meta": {"provider": "local", "model": "none", "latency_ms": 0, "fallback_used": False}
    }

    # No triggers = no nudge possible
    if not trigger_patterns:
        return no_nudge_response

    # Use current time if not provided
    if current_dt is None:
        current_dt = datetime.now()

    current_time = current_dt.strftime("%H:%M")
    current_day = current_dt.strftime("%A")  # "Friday", "Monday", etc.

    # ── Fast pre-check (Python, no API call) ──────────────────────────────
    # This prevents unnecessary API calls when no pattern is plausibly active.
    # Saves ~80-90% of API costs for the nudge feature.
    if not should_attempt_nudge(current_time, current_day, trigger_patterns):
        return no_nudge_response

    # ── Model call ────────────────────────────────────────────────────────
    prompt = build_nudge_prompt(
        current_time=current_time,
        current_day=current_day,
        trigger_patterns=trigger_patterns
    )

    # Route to Groq (fastest model — nudges must be near real-time)
    result = route_prompt(task_type="fast", prompt=prompt)

    if not result["success"] or result["parsed"] is None:
        return no_nudge_response

    parsed = result["parsed"]
    sanitized = _validate_nudge_response(parsed)

    sanitized["_meta"] = {
        "provider": result["provider"],
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "fallback_used": result.get("fallback_used", False)
    }

    return sanitized


def _validate_nudge_response(parsed: dict) -> dict:
    """
    Validate and sanitize nudge response.
    Enforces safety rules — no manipulative or negative nudges allowed.
    """
    should_nudge = parsed.get("should_nudge", False)
    message = parsed.get("message", None)

    # Enforce type safety
    if not isinstance(should_nudge, bool):
        should_nudge = bool(should_nudge)

    if not should_nudge:
        return {"should_nudge": False, "message": None}

    # Message quality checks
    if not message or len(message.strip()) < 10:
        return {"should_nudge": False, "message": None}

    message = message.strip()

    # Length check — nudges must be short
    if len(message) > 120:
        message = message[:117] + "..."

    # Forbidden phrases check — no negative nudges
    forbidden_phrases = [
        "stop", "don't", "warning", "overspend", "too much",
        "problem", "irresponsible", "bad habit", "wasteful", "control yourself"
    ]
    message_lower = message.lower()
    for phrase in forbidden_phrases:
        if phrase in message_lower:
            # Flip to no-nudge rather than send a bad nudge
            return {"should_nudge": False, "message": None}

    return {"should_nudge": True, "message": message}


generate_predictive_nudge = predict_nudge
