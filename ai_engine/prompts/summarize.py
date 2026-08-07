"""
SpendMind — generate_weekly_summary()
Generates a 7-day behavioral spending summary.
Called by Person B's backend on POST /insights/weekly.
"""

from typing import Optional

from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.summary_prompt import build_weekly_summary_prompt, validate_weekly_summary
from ai_engine.prompts.base import GRACEFUL_DEFAULTS


def generate_weekly_summary(expenses: list) -> dict:
    """
    Generate a 7-day behavioral spending summary.

    Args:
        expenses: list of expense dicts for the past 7 days.
                  Each dict: {amount, category, mood, notes, date, time_of_day}

    Returns:
        {
            "headline": str,         # emotional theme of the week
            "top_insight": str,      # most important behavioral pattern
            "biggest_trigger": str,  # dominant trigger (3-5 words)
            "emotional_trend": str,  # how emotions evolved across the week
            "one_win": str,          # one genuine positive observation
            "_meta": {...}           # internal metadata
        }
    """
    if not expenses:
        default = GRACEFUL_DEFAULTS["weekly_summary"].copy()
        default["_meta"] = {"provider": "default", "model": "none", "latency_ms": 0, "fallback_used": True}
        return default

    # Build prompt
    prompt, stats = build_weekly_summary_prompt(expenses)

    # Route to model (Gemini Flash for narrative generation)
    result = route_prompt(task_type="summary", prompt=prompt)

    if not result["success"] or result["parsed"] is None:
        default = GRACEFUL_DEFAULTS["weekly_summary"].copy()
        default["_meta"] = {
            "provider": result.get("provider", "unknown"),
            "model": result.get("model", "unknown"),
            "latency_ms": result.get("latency_ms", 0),
            "fallback_used": True
        }
        return default

    parsed = result["parsed"]
    is_valid, errors = validate_weekly_summary(parsed)

    if not is_valid:
        # Attempt field-level repair before falling back entirely
        parsed = _repair_weekly_summary(parsed)

    parsed["_meta"] = {
        "provider": result["provider"],
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "fallback_used": result.get("fallback_used", False),
        "stats": stats
    }

    return parsed


def _repair_weekly_summary(parsed: dict) -> dict:
    """
    Attempt to repair a partially valid weekly summary.
    Fills missing fields with graceful defaults.
    """
    defaults = GRACEFUL_DEFAULTS["weekly_summary"]
    required = [
        "headline", "top_insight", "biggest_trigger", "emotional_trend", "one_win",
        "improvements", "regressions", "trigger_changes", "mood_changes",
        "category_trends", "personality_changes", "coach_recommendation",
    ]

    forbidden = ["overspent", "wasted", "bad habit", "irresponsible", "stop spending", "cut down"]

    for field in required:
        value = parsed.get(field, "")
        if not value or (isinstance(value, str) and len(value.strip()) < 5):
            parsed[field] = defaults[field]
        elif isinstance(value, str):
            for phrase in forbidden:
                if phrase in value.lower():
                    parsed[field] = defaults[field]
                    break

    return parsed
