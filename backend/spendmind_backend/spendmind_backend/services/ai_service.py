"""Bridge between the FastAPI backend and the SpendMind AI Engine.

The backend should import only this service module. This file adapts backend
dicts into the AI Engine public API and normalizes responses back to the
existing router contracts.
"""

from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


_CHAYVA_ROOT = Path(__file__).resolve().parents[4]
if str(_CHAYVA_ROOT) not in sys.path:
    sys.path.insert(0, str(_CHAYVA_ROOT))

from ai_engine import (  # noqa: E402
    analyze_expense as engine_analyze_expense,
    classify_personality as engine_classify_personality,
    detect_triggers as engine_detect_triggers,
    generate_weekly_summary as engine_generate_weekly_summary,
    predict_nudge as engine_predict_nudge,
)


def analyze_expense(expense: dict) -> dict:
    adapted = _adapt_expense(expense)
    result = engine_analyze_expense(
        amount=adapted["amount"],
        category=adapted["category"],
        mood=adapted["mood"],
        notes=adapted["notes"],
        time_of_day=adapted["time_of_day"],
        last_5_expenses=expense.get("last_5_expenses") or expense.get("recent_expenses") or [],
    )
    return _without_meta(result)


def generate_weekly_summary(expenses: list[dict]) -> dict:
    result = engine_generate_weekly_summary(_adapt_expenses(expenses))
    return _without_meta(result)


def classify_personality(profile: dict) -> dict:
    result = engine_classify_personality(_adapt_spending_profile(profile))
    return _without_meta(result)


def detect_triggers(expenses_30d: list[dict]) -> list[dict]:
    return engine_detect_triggers(_adapt_expenses(expenses_30d))


def predict_nudge(
    user_id: str,
    current_dt: datetime,
    trigger_patterns: list[dict],
) -> Optional[str]:
    result = engine_predict_nudge(
        user_id=user_id,
        current_dt=current_dt,
        trigger_patterns=trigger_patterns,
    )
    if not result.get("should_nudge"):
        return None
    return result.get("message")


def parse_whatsapp_message(text: str) -> dict:
    amount = _extract_amount(text)
    return {
        "amount": amount,
        "category": "general",
        "notes": (text or "").strip(),
    }


def get_whatsapp_reply(expense: dict, insight: dict) -> str:
    amount = _coerce_float(expense.get("amount"), 0)
    category = expense.get("category", "expense")
    insight_text = (insight or {}).get("insight", "")
    short_insight = f"{insight_text[:100]}..." if len(insight_text) > 100 else insight_text
    return f"Got it! INR {amount:.0f} on {category} logged.\n\n{short_insight}"


def voice_to_expense(audio_file_path: str) -> dict:
    transcript = _transcribe_with_whisper(audio_file_path)
    parsed = parse_whatsapp_message(transcript)
    parsed["transcript"] = transcript
    return parsed


def generate_spend_dna(user_month_data: dict) -> dict:
    profile = _adapt_spending_profile(user_month_data.get("profile", {}))
    personality = classify_personality(profile)
    triggers = user_month_data.get("triggers", [])
    top_trigger = triggers[0].get("trigger") if triggers else "no clear pattern yet"
    category_totals = profile.get("category_totals", {})
    favorite_category = (
        max(category_totals, key=category_totals.get)
        if category_totals
        else "general"
    )

    return {
        "personality_type": personality.get("type"),
        "top_emotion_trigger": top_trigger,
        "favorite_category": favorite_category,
        "most_impulsive_hour": user_month_data.get("most_impulsive_hour", "late evening"),
        "biggest_behavioral_win": "You tracked your spending consistently enough to reveal patterns.",
        "monthly_narrative": personality.get("description"),
    }


def _adapt_expenses(expenses: list[dict]) -> list[dict]:
    return [_adapt_expense(expense) for expense in expenses or []]


def _adapt_expense(expense: dict) -> dict:
    date_value = expense.get("date") or expense.get("timestamp")
    dt = _parse_datetime(date_value)
    return {
        **expense,
        "amount": _coerce_float(expense.get("amount"), 0),
        "category": expense.get("category") or expense.get("category_guess") or "other",
        "mood": expense.get("mood") or "",
        "notes": expense.get("notes") or expense.get("merchant") or "",
        "date": dt.isoformat() if dt else date_value,
        "time_of_day": expense.get("time_of_day") or _time_of_day(dt),
        "day_of_week": expense.get("day_of_week") or (dt.strftime("%A").lower() if dt else ""),
    }


def _adapt_spending_profile(profile: dict) -> dict:
    adapted = {
        "category_totals": profile.get("category_totals", {}),
        "mood_frequencies": profile.get("mood_frequencies", {}),
        "impulse_count": int(profile.get("impulse_count") or 0),
        "total_expenses": int(profile.get("total_expenses") or 0),
        "weekend_spend_ratio": float(profile.get("weekend_spend_ratio") or 0),
        "night_spend_ratio": float(profile.get("night_spend_ratio") or 0),
        "avg_amount": float(profile.get("avg_amount") or 0),
        "top_notes_keywords": profile.get("top_notes_keywords", []),
    }
    if not adapted["total_expenses"]:
        adapted["total_expenses"] = max(
            sum(int(v) for v in adapted["mood_frequencies"].values()),
            adapted["impulse_count"],
        )
    return adapted


def _without_meta(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: val for key, val in value.items() if key != "_meta"}
    return value


def _parse_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _time_of_day(dt: Optional[datetime]) -> str:
    if dt is None:
        return "unknown"
    hour = dt.hour
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 22:
        return "evening"
    if 22 <= hour or hour < 2:
        return "late_night"
    return "night"


def _extract_amount(text: str) -> Optional[float]:
    match = re.search(r"(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)", text or "", re.IGNORECASE)
    if not match:
        return None
    return _coerce_float(match.group(1).replace(",", ""), None)


def _coerce_float(value: Any, default: Optional[float]) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _transcribe_with_whisper(audio_file_path: str) -> str:
    try:
        import whisper

        model = whisper.load_model("base")
        result = model.transcribe(audio_file_path)
        return result.get("text", "").strip()
    except Exception as exc:
        return f"[transcription unavailable: {exc}]"
