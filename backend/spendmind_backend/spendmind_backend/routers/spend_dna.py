from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Query, Request

from services.firebase_service import db_client
from services.ai_service import generate_spend_dna, detect_triggers
from core.config import settings
from core.limiter import limiter

router = APIRouter(prefix="/insights", tags=["Spend DNA"])

EXPENSE_COLLECTION = "expenses"


@router.get(
    "/spend-dna",
    summary="Generate Spend DNA (viral share card data)",
    description="Builds a full month spending profile and returns the Spend DNA payload the "
                "frontend renders as a Spotify-Wrapped-style shareable card: personality type, "
                "top trigger, favorite category, most impulsive hour, and a narrative summary.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def spend_dna(request: Request, user_id: str = Query(...)):
    cutoff = datetime.utcnow() - timedelta(days=30)
    all_expenses = db_client.query(EXPENSE_COLLECTION, user_id=user_id)
    expenses = []
    for e in all_expenses:
        try:
            if datetime.fromisoformat(e.get("date", "")) >= cutoff:
                expenses.append(e)
        except Exception:
            continue

    category_totals: dict[str, float] = defaultdict(float)
    mood_counter = Counter()
    hour_counter = Counter()
    for e in expenses:
        category_totals[e.get("category", "other")] += e.get("amount", 0)
        if e.get("mood"):
            mood_counter[e["mood"]] += 1
        try:
            hour_counter[datetime.fromisoformat(e["date"]).hour] += 1
        except Exception:
            pass

    most_impulsive_hour = None
    if hour_counter:
        h = hour_counter.most_common(1)[0][0]
        most_impulsive_hour = f"{h:02d}:00"

    profile = {
        "category_totals": dict(category_totals),
        "mood_frequencies": dict(mood_counter),
        "impulse_count": sum(mood_counter.values()),
    }

    month_data = {
        "profile": profile,
        "triggers": detect_triggers(expenses),
        "most_impulsive_hour": most_impulsive_hour or "late evening",
    }

    return generate_spend_dna(month_data)
