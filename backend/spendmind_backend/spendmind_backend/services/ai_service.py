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
from ai_engine.router.model_router import route_prompt  # noqa: E402
from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT  # noqa: E402
from ai_engine.prompts.insight_context import build_evidence_bundle, has_recorded_time  # noqa: E402
from ai_engine.prompts.profile_context import build_personal_context  # noqa: E402


def analyze_expense(expense: dict, user_profile: dict | None = None) -> dict:
    adapted = _adapt_expense(expense)
    recent = expense.get("last_5_expenses") or expense.get("recent_expenses") or []
    adapted_recent = [_adapt_expense(item) for item in recent]
    result = engine_analyze_expense(
        amount=adapted["amount"],
        category=adapted["category"],
        mood=adapted["mood"],
        notes=adapted["notes"],
        time_of_day=adapted["time_of_day"],
        last_5_expenses=adapted_recent,
        date=adapted.get("date"),
        classification_override=adapted.get("classification_override"),
        user_profile=user_profile,
    )
    return _enrich_expense_insight(_without_meta(result), adapted, adapted_recent, user_profile)


def apply_classification_fields(expense_doc: dict, insight: dict | None) -> dict:
    """Store deterministic classification fields alongside the expense document."""
    if not isinstance(insight, dict):
        return expense_doc
    classification = insight.get("expense_classification")
    significance = insight.get("behavioral_significance")
    if isinstance(classification, dict):
        expense_doc["expense_classification"] = classification
    if isinstance(significance, dict):
        expense_doc["behavioral_significance"] = significance
    return expense_doc


def generate_weekly_summary(expenses: list[dict], user_profile: dict | None = None) -> dict:
    result = engine_generate_weekly_summary(_adapt_expenses(expenses), user_profile=user_profile)
    return _without_meta(result)


def classify_personality(profile: dict, user_profile: dict | None = None) -> dict:
    result = engine_classify_personality(_adapt_spending_profile(profile), user_profile=user_profile)
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


def build_nudge_payload(message: Optional[str], triggers: list[dict]) -> dict:
    top_trigger = triggers[0] if triggers else {}
    trigger_name = top_trigger.get("trigger") or "No active trigger"
    behavior = top_trigger.get("behavior") or "Your coach is watching for the next clear spending cue."
    frequency = str(top_trigger.get("frequency") or "").lower()

    risk_level = "low"
    if message:
        risk_level = "medium"
        if frequency in {"daily", "often", "frequent", "very often", "most days"}:
            risk_level = "high"
        elif trigger_name not in {"Insufficient data", "Keep logging", "Almost there", "No active trigger"}:
            risk_level = "medium"

    confidence = 0.75 if message else 0.35
    if triggers and trigger_name not in {"Insufficient data", "Keep logging", "Almost there"}:
        confidence = min(0.92, confidence + 0.1)

    return {
        "prediction": message or "No urgent spending risk is active right now.",
        "upcoming_risk": trigger_name,
        "suggested_action": message or "Keep a short pause between emotion and purchase.",
        "trigger_behavior": behavior,
        "risk_level": risk_level,
        "confidence": round(confidence, 2),
    }


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


def generate_reflection_summary(mood_entry: dict, recent_expenses: list[dict]) -> str:
    """Generate an AI reflection summary from the latest mood log and recent spending."""
    mood = mood_entry.get("mood") or "neutral"
    triggers = mood_entry.get("triggers") or ""
    tomorrow = mood_entry.get("tomorrow") or ""
    rating = mood_entry.get("day_rating")

    expense_lines = []
    for expense in (recent_expenses or [])[:5]:
        insight = expense.get("insight") or {}
        expense_lines.append(
            f"- ₹{expense.get('amount', 0)} {expense.get('category', 'other')} "
            f"({expense.get('mood') or 'no mood'}): "
            f"{insight.get('insight') or insight.get('pattern_tag') or 'logged expense'}"
        )
    expense_context = "\n".join(expense_lines) if expense_lines else "No recent expenses logged."

    prompt = f"""{MASTER_SYSTEM_PROMPT.strip()}

TASK: REFLECTION SUMMARY

Write a warm 2-sentence reflection summary connecting today's mood/reflection to recent spending behavior.

TODAY'S REFLECTION:
- Mood: {mood}
- Day rating: {rating}/5
- Spending triggers named: {triggers or 'not specified'}
- Tomorrow intention: {tomorrow or 'not specified'}

RECENT EXPENSES:
{expense_context}

Return ONLY plain text — no JSON, no markdown."""
    result = route_prompt(task_type="fast", prompt=prompt)
    if result.get("success") and result.get("parsed"):
        parsed = result["parsed"]
        if isinstance(parsed, str) and parsed.strip():
            return parsed.strip()
        if isinstance(parsed, dict):
            for key in ("summary", "insight", "reflection", "message"):
                if parsed.get(key):
                    return str(parsed[key]).strip()

    parts = []
    if triggers:
        parts.append(f"You named {triggers} as a spending cue today.")
    if tomorrow:
        parts.append(f"Tomorrow's intention — {tomorrow} — is now part of your coaching context.")
    if mood:
        parts.append(f"Your mood today was {mood}, which helps Chayva read the emotional layer behind your spending.")
    return " ".join(parts) or "Your reflection is now shaping how your coach reads your spending patterns."


def generate_spend_dna(user_month_data: dict) -> dict:
    profile = _adapt_spending_profile(user_month_data.get("profile", {}))
    user_profile = user_month_data.get("user_profile")
    personality = classify_personality(profile, user_profile=user_profile)
    triggers = user_month_data.get("triggers", [])
    top_trigger = triggers[0].get("trigger") if triggers else "no clear pattern yet"
    category_totals = profile.get("category_totals", {})
    favorite_category = (
        max(category_totals, key=category_totals.get)
        if category_totals
        else "general"
    )
    most_impulsive_hour = user_month_data.get("most_impulsive_hour", "late evening")

    strengths = personality.get("traits", [])[:2] or [
        f"You are getting clearer about {favorite_category.lower()} spending.",
        "Your behavior is becoming legible to the coach.",
    ]
    growth_areas = []
    if top_trigger and top_trigger not in {"no clear pattern yet", "Insufficient data", "Keep logging", "Almost there"}:
        growth_areas.append(f"Watch for {top_trigger.lower()} around {most_impulsive_hour}.")
    if not growth_areas:
        growth_areas.append("Add mood and note context to sharpen trigger detection.")

    risk_level = "low"
    if top_trigger and top_trigger not in {"no clear pattern yet", "Insufficient data", "Keep logging", "Almost there"}:
        risk_level = "medium"
    impulse_ratio = profile.get("impulse_count", 0) / max(profile.get("total_expenses", 1), 1)
    if impulse_ratio >= 0.35:
        risk_level = "high"

    coach_advice = (
        growth_areas[0]
        if growth_areas
        else "Keep logging with mood context so your coach can stay one step ahead."
    )

    return {
        "personality_type": personality.get("type"),
        "confidence": round(min(0.95, 0.55 + min(0.25, max(0, len(triggers)) * 0.05)), 2),
        "traits": personality.get("traits", []),
        "strengths": strengths,
        "growth_areas": growth_areas,
        "top_emotion_trigger": top_trigger,
        "favorite_category": favorite_category,
        "most_impulsive_hour": most_impulsive_hour,
        "most_active_time": most_impulsive_hour,
        "biggest_behavioral_win": weekly_win if (weekly_win := user_month_data.get("biggest_win")) else personality.get("description"),
        "monthly_narrative": personality.get("description"),
        "behavior_narrative": personality.get("description"),
        "dominant_trigger": top_trigger,
        "behavior_pattern": top_trigger,
        "mindfulness_score": user_month_data.get("mindfulness_score", 100),
        "risk_level": risk_level,
        "coach_advice": coach_advice,
        "behavior_evolution": user_month_data.get("behavior_evolution"),
    }


def _enrich_expense_insight(
    insight: dict,
    expense: dict,
    recent_expenses: list[dict] | None = None,
    user_profile: dict | None = None,
) -> dict:
    evidence = build_evidence_bundle(
        amount=expense.get("amount"),
        category=expense.get("category"),
        mood=expense.get("mood"),
        notes=expense.get("notes"),
        date_value=expense.get("date"),
        recent_expenses=recent_expenses or [],
        classification_override=expense.get("classification_override"),
    )
    pattern = insight.get("pattern_tag") or "neutral"
    mood = expense.get("mood") or "neutral"
    category = expense.get("category") or "this category"
    time_period = _time_period_label(expense.get("time_of_day"))
    spending_nature = evidence.get("spending_nature", {}).get("label", "unclear")
    expense_classification = evidence.get("expense_classification", {})
    behavioral_significance = evidence.get("behavioral_significance", {})
    trigger = _trigger_from_context(pattern, mood, insight.get("observation", ""), time_period, spending_nature)
    personal_context = build_personal_context(user_profile, evidence=evidence, task="expense_analysis")

    enriched = {
        **insight,
        "behavior": _label_from_pattern(pattern),
        "emotion": mood if mood else "not specified",
        "detected_trigger": trigger,
        "spending_type": _spending_type(pattern, spending_nature),
        "suggestion": insight.get("reflection") or _suggestion_from_pattern(pattern, category),
        "time_period": time_period,
        "spending_nature": spending_nature,
        "expense_classification": expense_classification,
        "behavioral_significance": behavioral_significance,
        "evidence_strength": evidence.get("evidence_strength"),
        "history_counts": {
            "same_category": evidence.get("same_category_recent_count", 0),
            "same_time_period": evidence.get("same_time_period_recent_count", 0),
            "same_category_time_period": evidence.get("same_category_time_period_count", 0),
            "same_mood": evidence.get("same_mood_recent_count", 0),
            "same_category_mood": evidence.get("same_category_mood_count", 0),
        },
    }
    if personal_context.get("relevant_context"):
        enriched["personal_context"] = personal_context
    return enriched


def _time_period_label(time_of_day: str | None) -> str:
    mapping = {
        "morning": "Morning",
        "afternoon": "Afternoon",
        "evening": "Evening",
        "night": "Night",
        "late_night": "Night",
        "unknown": "Unknown",
    }
    return mapping.get((time_of_day or "unknown").lower(), "Unknown")


def _trigger_from_context(
    pattern: str,
    mood: str,
    observation: str,
    time_period: str,
    spending_nature: str = "unclear",
) -> str:
    if pattern == "neutral":
        if spending_nature == "routine_or_necessary":
            return "Routine or essential expense"
        if time_period != "Unknown":
            return f"{time_period} routine"
        return "No strong trigger detected"
    if mood and mood not in {"neutral", "not specified", ""}:
        return f"{mood.title()} mood cue"
    if observation:
        return observation[:80]
    return _label_from_pattern(pattern)


def _label_from_pattern(pattern: str) -> str:
    labels = {
        "comfort_spending": "Comfort spending",
        "reward_seeking": "Reward seeking",
        "social_pressure": "Social influence",
        "impulse_buying": "Impulse purchase",
        "boredom_spending": "Boredom spending",
        "habit_loop": "Habit loop",
        "neutral": "Intentional spend",
    }
    return labels.get(pattern, "Intentional spend")


def _spending_type(pattern: str, spending_nature: str = "unclear") -> str:
    if spending_nature == "routine_or_necessary":
        return "routine"
    if pattern in {"impulse_buying", "boredom_spending"}:
        return "impulsive"
    if pattern in {"comfort_spending", "reward_seeking", "social_pressure"}:
        return "emotional"
    if pattern == "habit_loop":
        return "habitual"
    return "planned"


def _suggestion_from_pattern(pattern: str, category: str) -> str:
    suggestions = {
        "comfort_spending": "Name the feeling first, then decide whether the purchase still serves you.",
        "reward_seeking": "Enjoy the reward, and pair it with one intentional boundary.",
        "social_pressure": "Check whether this spend reflects your wish or the room's momentum.",
        "impulse_buying": "Give this purchase a short pause before repeating it.",
        "boredom_spending": "Try one non-spending reset before another similar purchase.",
        "habit_loop": f"Notice what usually happens right before {category} spending.",
    }
    return suggestions.get(pattern, "Keep logging the context so your coach can sharpen the next read.")


def _adapt_expenses(expenses: list[dict]) -> list[dict]:
    return [_adapt_expense(expense) for expense in expenses or []]


def _adapt_expense(expense: dict) -> dict:
    date_value = expense.get("date") or expense.get("timestamp")
    dt = _parse_datetime(date_value)
    recorded_time = has_recorded_time(date_value)
    return {
        **expense,
        "amount": _coerce_float(expense.get("amount"), 0),
        "category": expense.get("category") or expense.get("category_guess") or "other",
        "mood": expense.get("mood") or "",
        "notes": expense.get("notes") or expense.get("merchant") or "",
        "date": dt.isoformat() if dt else date_value,
        "time_of_day": expense.get("time_of_day") or _time_of_day(dt, recorded_time),
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
        "routine_count": int(profile.get("routine_count") or 0),
        "time_period_counts": profile.get("time_period_counts", {}),
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


def _time_of_day(dt: Optional[datetime], has_time: bool = True) -> str:
    if dt is None or not has_time:
        return "unknown"
    hour = dt.hour
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 22:
        return "evening"
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
