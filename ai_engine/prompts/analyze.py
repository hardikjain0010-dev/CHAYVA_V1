"""
SpendMind — analyze_expense()
Core AI function: analyzes a single expense for emotional/behavioral patterns.
Called by Person B's backend after every expense is saved to Firestore.
"""

import json
from typing import Optional

from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.insight_prompts import build_insight_prompt
from ai_engine.prompts.base import GRACEFUL_DEFAULTS


def analyze_expense(
    amount: float,
    category: str,
    mood: str = "",
    notes: str = "",
    time_of_day: str = "unknown",
    last_5_expenses: Optional[list] = None
) -> dict:
    """
    Analyze a single expense for behavioral and emotional patterns.

    Args:
        amount: expense amount in INR
        category: food | transport | shopping | entertainment | education | health | other
        mood: stressed | bored | happy | lonely | social | tired | (empty string if not logged)
        notes: user's free-text note (can be empty, can be Hindi)
        time_of_day: morning | afternoon | evening | night | late_night
        last_5_expenses: list of recent expense dicts for pattern context
                         [{amount, category, mood, date}]

    Returns:
        {
            "insight": str,        # warm behavioral explanation
            "pattern_tag": str,    # comfort_spending | reward_seeking | etc.
            "intensity": int,      # 1-5 emotional intensity score
            "confidence": float,   # 0.0-1.0 confidence in pattern tag
            "_meta": {             # internal metadata, strip before sending to frontend
                "provider": str,
                "model": str,
                "latency_ms": int,
                "fallback_used": bool
            }
        }
    """
    last_5 = last_5_expenses or []

    # Build prompt
    prompt = build_insight_prompt(
        amount=amount,
        category=category,
        mood=mood,
        notes=notes,
        time_of_day=time_of_day,
        last_5_expenses=last_5
    )

    # Route to model (Gemini Flash for insight tasks)
    result = route_prompt(task_type="insight", prompt=prompt)

    if not result["success"] or result["parsed"] is None:
        # Return graceful default — never crash the expense save flow
        default = GRACEFUL_DEFAULTS["insight"].copy()
        default["_meta"] = {
            "provider": result.get("provider", "unknown"),
            "model": result.get("model", "unknown"),
            "latency_ms": result.get("latency_ms", 0),
            "fallback_used": True
        }
        return default

    parsed = result["parsed"]

    # Validate and sanitize response
    sanitized = _validate_insight_response(parsed)

    sanitized["_meta"] = {
        "provider": result["provider"],
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "fallback_used": result.get("fallback_used", False)
    }

    return sanitized


def _validate_insight_response(parsed: dict) -> dict:
    """
    Validate and sanitize AI response.
    Fills in defaults for any missing/invalid fields.
    """
    VALID_PATTERN_TAGS = {
        "comfort_spending", "reward_seeking", "social_pressure",
        "impulse_buying", "boredom_spending", "habit_loop", "neutral"
    }

    insight = parsed.get("insight", "")
    pattern_tag = parsed.get("pattern_tag", "neutral")
    intensity = parsed.get("intensity", 1)
    confidence = parsed.get("confidence", 0.5)

    # Sanitize insight
    if not insight or len(insight.strip()) < 10:
        insight = GRACEFUL_DEFAULTS["insight"]["insight"]

    # Sanitize pattern_tag
    if pattern_tag not in VALID_PATTERN_TAGS:
        pattern_tag = "neutral"

    # Sanitize intensity (must be int 1-5)
    try:
        intensity = max(1, min(5, int(intensity)))
    except (TypeError, ValueError):
        intensity = 1

    # Sanitize confidence (must be float 0.0-1.0)
    try:
        confidence = max(0.0, min(1.0, float(confidence)))
        confidence = round(confidence, 2)
    except (TypeError, ValueError):
        confidence = 0.5

    # Check for forbidden phrases in insight
    forbidden = ["overspent", "wasteful", "bad habit", "irresponsible", "stop spending"]
    for phrase in forbidden:
        if phrase in insight.lower():
            insight = GRACEFUL_DEFAULTS["insight"]["insight"]
            break

    return {
        "insight": insight.strip(),
        "pattern_tag": pattern_tag,
        "intensity": intensity,
        "confidence": confidence
    }
