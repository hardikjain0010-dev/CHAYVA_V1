"""
SpendMind — analyze_expense()
Core AI function: analyzes a single expense for emotional/behavioral patterns.
Called by Person B's backend after every expense is saved to Firestore.
"""

from typing import Optional

from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.insight_prompts import build_insight_prompt
from ai_engine.prompts.base import GRACEFUL_DEFAULTS
from ai_engine.prompts.insight_context import build_evidence_bundle, deterministic_insight_from_evidence


def analyze_expense(
    amount: float,
    category: str,
    mood: str = "",
    notes: str = "",
    time_of_day: str = "unknown",
    last_5_expenses: Optional[list] = None,
    date: Optional[str] = None,
    classification_override: Optional[dict] = None,
    user_profile: Optional[dict] = None,
) -> dict:
    """
    Analyze a single expense for behavioral and emotional patterns.

    Returns:
        {
            "insight": str,
            "observation": str,
            "interpretation": str,
            "reflection": str,
            "pattern_tag": str,
            "intensity": int,
            "confidence": float,
            "_meta": {...}
        }
    """
    last_5 = last_5_expenses or []
    evidence = build_evidence_bundle(
        amount=amount,
        category=category,
        mood=mood,
        notes=notes,
        date_value=date,
        recent_expenses=last_5,
        classification_override=classification_override,
    )

    prompt = build_insight_prompt(
        amount=amount,
        category=category,
        mood=mood,
        notes=notes,
        time_of_day=time_of_day,
        last_5_expenses=last_5,
        date=date,
        classification_override=classification_override,
        user_profile=user_profile,
    )

    result = route_prompt(task_type="insight", prompt=prompt)

    if not result["success"] or result["parsed"] is None:
        default = deterministic_insight_from_evidence(evidence)
        default["_meta"] = {
            "provider": result.get("provider", "unknown"),
            "model": result.get("model", "unknown"),
            "latency_ms": result.get("latency_ms", 0),
            "fallback_used": True,
        }
        return default

    sanitized = _validate_insight_response(result["parsed"])
    sanitized["_meta"] = {
        "provider": result["provider"],
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "fallback_used": result.get("fallback_used", False),
    }
    return sanitized


def _validate_insight_response(parsed: dict) -> dict:
    VALID_PATTERN_TAGS = {
        "comfort_spending", "reward_seeking", "social_pressure",
        "impulse_buying", "boredom_spending", "habit_loop", "neutral",
    }

    observation = str(parsed.get("observation") or "").strip()
    interpretation = str(parsed.get("interpretation") or "").strip()
    reflection = str(parsed.get("reflection") or "").strip()
    insight = str(parsed.get("insight") or "").strip()
    pattern_tag = parsed.get("pattern_tag", "neutral")
    intensity = parsed.get("intensity", 1)
    confidence = parsed.get("confidence", 0.5)

    if not insight:
        parts = [part for part in (observation, interpretation) if part]
        insight = " ".join(parts) if parts else GRACEFUL_DEFAULTS["insight"]["insight"]

    if not observation and insight:
        observation = insight

    if not reflection:
        reflection = "Notice what was happening just before this purchase."

    if not insight or len(insight.strip()) < 10:
        insight = GRACEFUL_DEFAULTS["insight"]["insight"]

    if pattern_tag not in VALID_PATTERN_TAGS:
        pattern_tag = "neutral"

    try:
        intensity = max(1, min(5, int(intensity)))
    except (TypeError, ValueError):
        intensity = 1

    try:
        confidence = max(0.0, min(1.0, float(confidence)))
        confidence = round(confidence, 2)
    except (TypeError, ValueError):
        confidence = 0.5

    forbidden = ["overspent", "wasteful", "bad habit", "irresponsible", "stop spending", "bad spending"]
    combined = " ".join([observation, interpretation, reflection, insight]).lower()
    for phrase in forbidden:
        if phrase in combined:
            default = GRACEFUL_DEFAULTS["insight"]
            return {
                "observation": default.get("observation", default["insight"]),
                "interpretation": default.get("interpretation", ""),
                "reflection": default.get("reflection", ""),
                "insight": default["insight"],
                "pattern_tag": "neutral",
                "intensity": 1,
                "confidence": 0.3,
            }

    return {
        "observation": observation,
        "interpretation": interpretation,
        "reflection": reflection,
        "insight": insight.strip(),
        "pattern_tag": pattern_tag,
        "intensity": intensity,
        "confidence": confidence,
    }
