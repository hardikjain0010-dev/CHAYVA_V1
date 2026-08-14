"""
SpendMind — classify_personality()
Classifies user into 1 of 4 spending personality types.
Triggered after 15+ logged expenses.
Called by Person B's GET /insights/personality endpoint.
"""

from typing import Optional
from collections import Counter

from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.personality_prompt import build_personality_prompt, get_minimum_expense_count
from ai_engine.prompts.base import GRACEFUL_DEFAULTS

VALID_PERSONALITY_TYPES = {
    "Comfort Spender",
    "Impulse Buyer",
    "Reward Seeker",
    "Social Spender"
}

PERSONALITY_FORMING_RESPONSE = {
    "type": "forming",
    "description": "Your spending personality is still taking shape. Log a few more expenses and your unique pattern will start to emerge.",
    "traits": ["building awareness", "patterns forming"],
    "expenses_needed": 0,
    "_meta": {"provider": "local", "model": "none", "latency_ms": 0, "fallback_used": False}
}


def classify_personality(spending_profile: dict, user_profile: dict | None = None) -> dict:
    """
    Classify user's spending personality from their aggregated spending profile.

    Args:
        spending_profile: {
            "category_totals": {"food": 3200, "shopping": 1400, ...},
            "mood_frequencies": {"stressed": 8, "happy": 4, ...},
            "impulse_count": 5,
            "total_expenses": 24,
            "weekend_spend_ratio": 0.6,
            "night_spend_ratio": 0.4,
            "avg_amount": 280,
            "top_notes_keywords": ["exam", "friends", ...]
        }

    Returns:
        {
            "type": str,          # one of 4 valid types (or "forming" if insufficient data)
            "description": str,   # personalized 2-3 sentence description
            "traits": list,       # 3-4 trait strings
            "_meta": {...}
        }
    """
    total_expenses = spending_profile.get("total_expenses", 0)
    minimum_required = get_minimum_expense_count()

    # Not enough data yet — return "forming" state for UI to handle
    if total_expenses < minimum_required:
        response = PERSONALITY_FORMING_RESPONSE.copy()
        response["expenses_needed"] = minimum_required - total_expenses
        return response

    # Build prompt
    prompt = build_personality_prompt(spending_profile, user_profile=user_profile)

    # Route to model (Gemini Flash, temperature=0.3 for consistent classification)
    result = route_prompt(task_type="personality", prompt=prompt)

    if not result["success"] or result["parsed"] is None:
        default = GRACEFUL_DEFAULTS["personality"].copy()
        default["_meta"] = {
            "provider": result.get("provider", "unknown"),
            "model": result.get("model", "unknown"),
            "latency_ms": result.get("latency_ms", 0),
            "fallback_used": True
        }
        return default

    parsed = result["parsed"]
    sanitized = _validate_personality_response(parsed)

    sanitized["_meta"] = {
        "provider": result["provider"],
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "fallback_used": result.get("fallback_used", False),
        "backup_model_used": result.get("backup_model_used", False)
    }

    return sanitized


def build_spending_profile_from_expenses(expenses: list) -> dict:
    """
    Helper: Build a spending_profile dict from raw expenses list.
    Person B can call this before calling classify_personality().

    Args:
        expenses: list of expense dicts with amount, category, mood, date, time_of_day, notes

    Returns:
        spending_profile dict
    """
    if not expenses:
        return {"total_expenses": 0}

    category_totals = Counter()
    mood_frequencies = Counter()
    impulse_count = 0
    night_count = 0
    weekend_count = 0
    notes_words = []

    IMPULSE_TAGS = {"impulse_buying", "boredom_spending"}
    NIGHT_TIMES = {"night", "late_night"}
    WEEKEND_DAYS = {"saturday", "sunday"}

    for exp in expenses:
        amount = float(exp.get("amount", 0))
        category = exp.get("category", "other")
        mood = exp.get("mood", "")
        time_of_day = exp.get("time_of_day", "")
        day_of_week = str(exp.get("day_of_week", "")).lower()
        notes = exp.get("notes", "")
        pattern_tag = exp.get("pattern_tag", "")

        category_totals[category] += amount
        if mood:
            mood_frequencies[mood] += 1
        if pattern_tag in IMPULSE_TAGS:
            impulse_count += 1
        if time_of_day in NIGHT_TIMES:
            night_count += 1
        if day_of_week in WEEKEND_DAYS:
            weekend_count += 1
        if notes:
            notes_words.extend(notes.lower().split()[:5])

    total = len(expenses)
    amounts = [float(e.get("amount", 0)) for e in expenses]
    avg_amount = round(sum(amounts) / total, 2) if total else 0

    # Top notes keywords (simple frequency, exclude stopwords)
    STOPWORDS = {"on", "for", "the", "a", "in", "at", "to", "of", "and", "it", "is", "was"}
    word_freq = Counter(w for w in notes_words if w not in STOPWORDS and len(w) > 2)
    top_keywords = [word for word, _ in word_freq.most_common(8)]

    return {
        "category_totals": dict(category_totals),
        "mood_frequencies": dict(mood_frequencies),
        "impulse_count": impulse_count,
        "total_expenses": total,
        "weekend_spend_ratio": round(weekend_count / total, 2) if total else 0,
        "night_spend_ratio": round(night_count / total, 2) if total else 0,
        "avg_amount": avg_amount,
        "top_notes_keywords": top_keywords
    }


def _validate_personality_response(parsed: dict) -> dict:
    """Validate and sanitize personality classification response."""
    personality_type = parsed.get("type", "")
    description = parsed.get("description", "")
    traits = parsed.get("traits", [])

    # Validate type
    if personality_type not in VALID_PERSONALITY_TYPES:
        personality_type = GRACEFUL_DEFAULTS["personality"]["type"]

    # Validate description
    if not description or len(description.strip()) < 20:
        description = GRACEFUL_DEFAULTS["personality"]["description"]

    # Validate traits
    if not isinstance(traits, list) or len(traits) < 2:
        traits = GRACEFUL_DEFAULTS["personality"]["traits"]
    else:
        # Cap at 4 traits
        traits = traits[:4]

    return {
        "type": personality_type,
        "description": description.strip(),
        "traits": traits
    }
