from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Query, Request

from services.firebase_service import db_client
from services.ai_service import (
    generate_weekly_summary,
    classify_personality,
    detect_triggers,
    predict_nudge,
)
from services.cache_service import get_or_set
from core.config import settings
from core.limiter import limiter

router = APIRouter(tags=["Insights & Analytics"])

EXPENSE_COLLECTION = "expenses"


def _user_expenses(user_id: str) -> list[dict]:
    return db_client.query(EXPENSE_COLLECTION, user_id=user_id)


def _within_days(expenses: list[dict], days: int) -> list[dict]:
    cutoff = datetime.utcnow() - timedelta(days=days)
    out = []
    for e in expenses:
        try:
            d = datetime.fromisoformat(e.get("date", ""))
        except Exception:
            continue
        if d >= cutoff:
            out.append(e)
    return out


# ---------------------------------------------------------------------
# Weekly aggregation (for bar charts)
# ---------------------------------------------------------------------
@router.get(
    "/analytics/weekly",
    summary="Weekly spending aggregation",
    description="Sums expenses by category for the past 7 days and groups totals by day "
                "(Mon–Sun), returning JSON shaped for the frontend's weekly bar chart.",
)
def analytics_weekly(user_id: str = Query(...)):
    expenses = _within_days(_user_expenses(user_id), 7)

    by_category: dict[str, float] = defaultdict(float)
    by_day: dict[str, float] = defaultdict(float)
    for e in expenses:
        by_category[e.get("category", "other")] += e.get("amount", 0)
        try:
            day_name = datetime.fromisoformat(e["date"]).strftime("%a")
        except Exception:
            day_name = "Unknown"
        by_day[day_name] += e.get("amount", 0)

    return {
        "by_category": dict(by_category),
        "by_day": dict(by_day),
        "total": sum(by_category.values()),
    }


# ---------------------------------------------------------------------
# Weekly summary numbers (not the AI narrative — just the stats)
# ---------------------------------------------------------------------
@router.get(
    "/analytics/summary",
    summary="Weekly analytics summary",
    description="Returns total spend this week, top category, most impulsive day, and "
                "average daily spend.",
)
def analytics_summary(user_id: str = Query(...)):
    expenses = _within_days(_user_expenses(user_id), 7)
    if not expenses:
        return {"total_this_week": 0, "top_category": None, "most_impulsive_day": None, "avg_daily_spend": 0}

    total = sum(e.get("amount", 0) for e in expenses)
    by_category: dict[str, float] = defaultdict(float)
    by_day: dict[str, float] = defaultdict(float)
    for e in expenses:
        by_category[e.get("category", "other")] += e.get("amount", 0)
        try:
            day_name = datetime.fromisoformat(e["date"]).strftime("%A")
        except Exception:
            day_name = "Unknown"
        by_day[day_name] += e.get("amount", 0)

    top_category = max(by_category, key=by_category.get)
    most_impulsive_day = max(by_day, key=by_day.get)

    return {
        "total_this_week": total,
        "top_category": top_category,
        "most_impulsive_day": most_impulsive_day,
        "avg_daily_spend": round(total / 7, 2),
    }


# ---------------------------------------------------------------------
# AI-generated weekly narrative summary
# ---------------------------------------------------------------------
@router.post(
    "/insights/weekly",
    summary="AI weekly narrative summary",
    description="Pulls the last 7 days of a user's expenses, calls the AI weekly-summary "
                "function, saves the result to Firestore, and returns it. Cached for 24 hours.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def insights_weekly(request: Request, user_id: str = Query(...)):
    def compute():
        expenses = _within_days(_user_expenses(user_id), 7)
        summary = generate_weekly_summary(expenses)
        db_client.add("weekly_summaries", {"user_id": user_id, **summary}, doc_id=f"{user_id}_latest")
        return summary

    return get_or_set(f"weekly_summary:{user_id}", settings.WEEKLY_SUMMARY_TTL, compute)


# ---------------------------------------------------------------------
# Spending personality
# ---------------------------------------------------------------------
@router.get(
    "/insights/personality",
    summary="Spending personality classification",
    description="Builds a 30-day spending profile (category totals, mood frequencies, impulse "
                "count) and classifies the user into one of SpendMind's personality types. "
                "Cached for 7 days per user.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def insights_personality(request: Request, user_id: str = Query(...)):
    def compute():
        expenses = _within_days(_user_expenses(user_id), 30)
        category_totals: dict[str, float] = defaultdict(float)
        mood_counter = Counter()
        impulse_count = 0
        for e in expenses:
            category_totals[e.get("category", "other")] += e.get("amount", 0)
            if e.get("mood"):
                mood_counter[e["mood"]] += 1
            if e.get("source") in ("sms", "whatsapp", "voice") and e.get("mood") in ("bored", "stressed"):
                impulse_count += 1

        profile = {
            "category_totals": dict(category_totals),
            "mood_frequencies": dict(mood_counter),
            "impulse_count": impulse_count,
        }
        result = classify_personality(profile)
        db_client.add("personality_cache", {"user_id": user_id, **result}, doc_id=f"{user_id}_latest")
        return result

    return get_or_set(f"personality:{user_id}", settings.PERSONALITY_TTL, compute)


# ---------------------------------------------------------------------
# Trigger mapping
# ---------------------------------------------------------------------
@router.get(
    "/insights/triggers",
    summary="Behavioral trigger map",
    description="Analyzes 30 days of expenses for time-of-day + category + emotion patterns "
                "and returns the top 3 detected triggers.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def insights_triggers(request: Request, user_id: str = Query(...)):
    expenses = _within_days(_user_expenses(user_id), 30)
    return detect_triggers(expenses)


# ---------------------------------------------------------------------
# Predictive nudge
# ---------------------------------------------------------------------
@router.get(
    "/nudges/current",
    summary="Get current predictive nudge",
    description="Checks the current time and day against the user's stored trigger patterns "
                "and returns a nudge message, or null if nothing matches right now.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def nudges_current(request: Request, user_id: str = Query(...)):
    expenses = _within_days(_user_expenses(user_id), 30)
    triggers = detect_triggers(expenses)
    nudge = predict_nudge(user_id, datetime.utcnow(), triggers)
    return {"nudge": nudge}
