from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request

from core.config import settings
from core.datetime_utils import (
    filter_within_days,
    is_within_days,
    parse_utc_datetime,
    safe_day_name,
    safe_hour,
    safe_iso_date,
    time_of_day_bucket,
    utc_now,
    utc_now_iso,
)
from core.limiter import limiter
from core.security import get_current_user_id
from routers.profile import load_profile_for_user
from services.ai_service import (
    build_nudge_payload,
    classify_personality,
    detect_triggers,
    generate_reflection_summary,
    generate_spend_dna,
    generate_weekly_summary,
    predict_nudge,
)
from services.cache_service import get_or_set
from services.firebase_service import db_client

router = APIRouter(tags=["Insights & Analytics"])

EXPENSE_COLLECTION = "expenses"


def _user_expenses(user_id: str) -> list[dict]:
    return db_client.query(EXPENSE_COLLECTION, user_id=user_id)


def _user_moods(user_id: str) -> list[dict]:
    return db_client.query("moods", user_id=user_id)


def _within_days(expenses: list[dict], days: int) -> list[dict]:
    return filter_within_days(expenses, days, date_keys=("date", "timestamp", "created_at"))


def _within_days_moods(moods: list[dict], days: int) -> list[dict]:
    return filter_within_days(moods, days, date_keys=("timestamp", "day", "date", "created_at"))


def _expense_stats(expenses: list[dict]) -> dict:
    today = utc_now().date().isoformat()
    week = _within_days(expenses, 7)
    today_expenses = [e for e in expenses if safe_iso_date(e.get("date") or e.get("timestamp")) == today]
    return {
        "total_spent": round(sum(e.get("amount", 0) for e in expenses), 2),
        "today_spend": round(sum(e.get("amount", 0) for e in today_expenses), 2),
        "weekly_spend": round(sum(e.get("amount", 0) for e in week), 2),
        "expense_count": len(expenses),
    }


def _category_totals(expenses: list[dict]) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for expense in expenses:
        totals[expense.get("category", "other")] += expense.get("amount", 0)
    return dict(totals)


def _day_totals(expenses: list[dict], days: int = 30) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    recent = _within_days(expenses, days)
    for expense in recent:
        day_str = safe_iso_date(expense.get("date") or expense.get("timestamp"))
        if day_str:
            totals[day_str] += expense.get("amount", 0)
    return dict(sorted(totals.items()))


def _mindfulness_score(expenses: list[dict], moods: list[dict]) -> int:
    mood_values = [e.get("mood") for e in expenses if e.get("mood")]
    mood_values.extend(entry.get("mood") for entry in moods if entry.get("mood"))
    if not mood_values:
        return 100
    reactive = sum(1 for mood in mood_values if mood in {"stressed", "bored", "lonely", "tired"})
    return max(0, min(100, round(((len(mood_values) - reactive) / len(mood_values)) * 100)))


def _profile_from_expenses(expenses: list[dict], moods: list[dict]) -> dict:
    category_totals = _category_totals(expenses)
    mood_counter = Counter()
    impulse_count = 0
    night_count = 0
    weekend_count = 0
    notes_counter = Counter()
    time_period_counter = Counter()
    routine_count = 0

    for expense in expenses:
        mood = expense.get("mood")
        if mood:
            mood_counter[mood] += 1
        insight = expense.get("insight") or {}
        if insight.get("spending_type") == "impulsive" or insight.get("pattern_tag") in {"impulse_buying", "boredom_spending"}:
            impulse_count += 1
        if insight.get("spending_type") == "routine" or insight.get("spending_nature") == "routine_or_necessary":
            routine_count += 1
        for word in str(expense.get("notes") or "").lower().replace(",", " ").split():
            cleaned = word.strip(".!?;:()[]")
            if len(cleaned) > 2 and cleaned not in {"the", "and", "for", "with", "from", "this", "that"}:
                notes_counter[cleaned] += 1
        dt = parse_utc_datetime(expense.get("date") or expense.get("timestamp"))
        if dt is not None:
            if dt.hour >= 22 or dt.hour < 5:
                night_count += 1
            if dt.weekday() >= 5:
                weekend_count += 1
            if 5 <= dt.hour < 12:
                time_period_counter["morning"] += 1
            elif 12 <= dt.hour < 17:
                time_period_counter["afternoon"] += 1
            elif 17 <= dt.hour < 22:
                time_period_counter["evening"] += 1
            else:
                time_period_counter["night"] += 1

    for entry in moods:
        if entry.get("mood"):
            mood_counter[entry["mood"]] += 1

    total = len(expenses)
    amounts = [float(e.get("amount", 0)) for e in expenses]
    return {
        "category_totals": category_totals,
        "mood_frequencies": dict(mood_counter),
        "impulse_count": impulse_count,
        "total_expenses": total,
        "weekend_spend_ratio": round(weekend_count / total, 2) if total else 0,
        "night_spend_ratio": round(night_count / total, 2) if total else 0,
        "avg_amount": round(sum(amounts) / total, 2) if total else 0,
        "routine_count": routine_count,
        "time_period_counts": dict(time_period_counter),
        "top_notes_keywords": [word for word, _ in notes_counter.most_common(8)],
    }


def _most_common_time_period(profile: dict) -> str | None:
    counts = profile.get("time_period_counts") or {}
    if not counts:
        return None
    return max(counts, key=counts.get)


def _reflection_insight(moods: list[dict], recent_expenses: list[dict]) -> dict:
    if not moods:
        return {
            "insight": None,
            "summary": None,
            "latest_mood": None,
            "latest_trigger": None,
        }
    latest = sorted(moods, key=lambda entry: entry.get("timestamp", ""), reverse=True)[0]
    summary = generate_reflection_summary(latest, recent_expenses)
    return {
        "insight": summary,
        "summary": summary,
        "latest_mood": latest.get("mood"),
        "latest_trigger": latest.get("triggers"),
    }


def _personality_confidence(total_expenses: int, ai_type: str) -> tuple[float, str]:
    confidence = min(0.95, round(0.28 + total_expenses * 0.0055, 2))
    if total_expenses < 5:
        return confidence, f"Exploring phase — {total_expenses} expenses logged so far."
    if total_expenses < 20:
        return confidence, f"Early patterns forming from {total_expenses} expenses."
    if ai_type == "forming":
        return confidence, f"Profile forming — {total_expenses} expenses give partial signal."
    if total_expenses >= 120:
        return min(0.95, confidence + 0.05), f"High-confidence read from {total_expenses} tracked expenses."
    if total_expenses >= 50:
        return confidence, f"Reliable pattern map from {total_expenses} expenses."
    return confidence, f"Personality detected from {total_expenses} expenses."


def _evolve_personality(total_expenses: int, personality: dict, profile: dict | None = None) -> dict:
    ai_type = personality.get("type") or "forming"
    confidence, confidence_reason = _personality_confidence(total_expenses, ai_type)
    updated_at = utc_now_iso()
    impulse_count = (profile or {}).get("impulse_count", 0)
    impulse_ratio = impulse_count / max(total_expenses, 1)

    if total_expenses < 5:
        display_type = "Exploring"
        description = "Your spending personality is still emerging. A few more logged moments will reveal your pattern."
    elif total_expenses < 20:
        display_type = "Exploring"
        description = personality.get("description") or "Patterns are beginning to appear across your recent spending."
    elif total_expenses >= 120 and ai_type != "forming":
        display_type = "Balanced Planner" if impulse_ratio <= 0.15 else ai_type
        description = personality.get("description") or "Your spending shows mature awareness across varied contexts."
    else:
        display_type = ai_type if ai_type != "forming" else "Exploring"
        description = personality.get("description") or "Your coach is reading the emotional layer behind your spending."

    return {
        **personality,
        "type": display_type,
        "personality_type": display_type,
        "description": description,
        "confidence": confidence,
        "confidence_reason": confidence_reason,
        "last_updated": updated_at,
    }


def _behavior_timeline(expenses: list[dict], days: int = 7) -> list[dict]:
    mood_labels = {
        "happy": ("😊", "Social"),
        "social": ("😊", "Social"),
        "stressed": ("😔", "Stress"),
        "bored": ("😐", "Bored"),
        "lonely": ("😔", "Stress"),
        "tired": ("😴", "Tired"),
        "low": ("😔", "Low"),
        "great": ("🙂", "Mindful"),
        "good": ("🙂", "Mindful"),
        "okay": ("🙂", "Steady"),
    }
    pattern_labels = {
        "comfort_spending": ("🛋", "Comfort"),
        "reward_seeking": ("🎉", "Reward"),
        "social_pressure": ("😊", "Social"),
        "impulse_buying": ("🛒", "Impulse"),
        "boredom_spending": ("😐", "Bored"),
        "habit_loop": ("🔁", "Habit"),
        "neutral": ("🙂", "Mindful"),
    }

    timeline = []
    today = utc_now().date()
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        day_key = day.isoformat()
        day_name = day.strftime("%A")
        day_expenses = [
            expense for expense in expenses
            if safe_iso_date(expense.get("date") or expense.get("timestamp")) == day_key
        ]
        if not day_expenses:
            timeline.append({
                "day": day_name,
                "date": day_key,
                "emoji": "·",
                "label": "No spend",
                "mood": None,
            })
            continue

        mood_counter = Counter()
        pattern_counter = Counter()
        for expense in day_expenses:
            if expense.get("mood"):
                mood_counter[expense["mood"]] += 1
            insight = expense.get("insight") or {}
            pattern = insight.get("pattern_tag") or "neutral"
            pattern_counter[pattern] += 1

        if pattern_counter:
            dominant_pattern = pattern_counter.most_common(1)[0][0]
            emoji, label = pattern_labels.get(dominant_pattern, ("🙂", "Mindful"))
        elif mood_counter:
            dominant_mood = mood_counter.most_common(1)[0][0]
            emoji, label = mood_labels.get(dominant_mood, ("🙂", "Steady"))
        else:
            emoji, label = "🙂", "Logged"

        timeline.append({
            "day": day_name,
            "date": day_key,
            "emoji": emoji,
            "label": label,
            "mood": mood_counter.most_common(1)[0][0] if mood_counter else None,
        })
    return timeline


def _behavior_evolution(expenses: list[dict]) -> str:
    if len(expenses) < 10:
        return "Behavior evolution will appear after more consistent logging."
    recent = sorted(expenses, key=lambda item: item.get("date", ""))[-10:]
    older = sorted(expenses, key=lambda item: item.get("date", ""))[:-10][-10:]
    if not older:
        return "Your recent spending is building the first chapter of your behavior story."

    def reactive_ratio(items: list[dict]) -> float:
        reactive = 0
        for expense in items:
            mood = expense.get("mood")
            insight = expense.get("insight") or {}
            if mood in {"stressed", "bored", "lonely", "tired"}:
                reactive += 1
            elif insight.get("spending_type") == "impulsive":
                reactive += 1
        return reactive / max(len(items), 1)

    recent_ratio = reactive_ratio(recent)
    older_ratio = reactive_ratio(older)
    if recent_ratio < older_ratio - 0.1:
        return "Reactive spending appears to be easing compared with your earlier pattern."
    if recent_ratio > older_ratio + 0.1:
        return "Recent days show more emotion-linked spending than your earlier baseline."
    return "Your spending rhythm looks relatively stable across recent weeks."


def _milestones(expenses: list[dict], moods: list[dict], personality: dict, triggers: list[dict], weekly: dict, mindfulness: int, prior_mindfulness: int | None = None) -> list[dict]:
    if not expenses:
        return []
    chronological = sorted(
        expenses,
        key=lambda e: (parse_utc_datetime(e.get("date") or e.get("timestamp")) or utc_now()).timestamp(),
    )
    first_date = safe_iso_date(chronological[0].get("date") or chronological[0].get("timestamp")) or utc_now_iso()
    milestones = [
        {
            "title": "Started Tracking",
            "date": first_date,
            "description": "You began turning spending moments into behavioral evidence.",
        },
        {
            "title": "First Expense",
            "date": first_date,
            "description": f"Your first logged purchase was ₹{chronological[0].get('amount', 0)} on {chronological[0].get('category', 'an expense')}.",
        },
    ]
    first_insight = next((expense for expense in chronological if expense.get("insight")), None)
    if first_insight:
        milestones.append({
            "title": "First Insight",
            "date": first_insight.get("date") or first_insight.get("timestamp"),
            "description": "Caayva generated its first behavioral read.",
        })
    if personality.get("type") and personality.get("type") not in {"forming", "Exploring"}:
        milestones.append({
            "title": "Personality Found",
            "date": utc_now_iso(),
            "description": f"Your current profile is {personality.get('type')}.",
        })
    if triggers and triggers[0].get("trigger") not in {"Insufficient data", "Keep logging", "Almost there"}:
        milestones.append({"title": "First Trigger", "date": utc_now_iso(), "description": triggers[0].get("trigger")})
    if weekly.get("headline"):
        milestones.append({"title": "Weekly Summary Generated", "date": utc_now_iso(), "description": weekly.get("headline")})
    for count in (30, 100):
        if len(expenses) >= count:
            milestones.append({"title": f"{count} Expenses", "date": utc_now_iso(), "description": "Your pattern map is becoming more reliable."})
    days = sorted({safe_iso_date(e.get("date") or e.get("timestamp")) for e in expenses if (e.get("date") or e.get("timestamp"))})
    days = [d for d in days if d]
    streak = 1
    best = 1 if days else 0
    for index in range(1, len(days)):
        prev_dt = parse_utc_datetime(days[index - 1])
        curr_dt = parse_utc_datetime(days[index])
        if prev_dt and curr_dt and (curr_dt.date() - prev_dt.date()).days == 1:
            streak += 1
            best = max(best, streak)
        else:
            streak = 1
    if best >= 7:
        milestones.append({"title": "7 Day Streak", "date": utc_now_iso(), "description": "You built a consistent awareness rhythm."})
    if moods:
        milestones.append({"title": "Reflection Added", "date": moods[0].get("timestamp") or moods[0].get("day") or utc_now_iso(), "description": "Reflection is now influencing your AI context."})
    if prior_mindfulness is not None and mindfulness > prior_mindfulness + 5:
        milestones.append({"title": "Mindfulness Improved", "date": utc_now_iso(), "description": f"Your mindfulness score moved toward {mindfulness}/100."})
    return milestones


# ---------------------------------------------------------------------
# Weekly aggregation (for bar charts)
# ---------------------------------------------------------------------
@router.get(
    "/analytics/weekly",
    summary="Weekly spending aggregation",
    description="Sums expenses by category for the past 7 days and groups totals by day "
                "(Mon–Sun), returning JSON shaped for the frontend's weekly bar chart.",
)
def analytics_weekly(authenticated_user_id: str = Depends(get_current_user_id)):
    user_id = authenticated_user_id
    expenses = _within_days(_user_expenses(user_id), 7)

    by_category: dict[str, float] = defaultdict(float)
    by_day: dict[str, float] = defaultdict(float)
    for e in expenses:
        by_category[e.get("category", "other")] += e.get("amount", 0)
        day_name = safe_day_name(e.get("date") or e.get("timestamp"), full=False)
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
def analytics_summary(authenticated_user_id: str = Depends(get_current_user_id)):
    user_id = authenticated_user_id
    expenses = _within_days(_user_expenses(user_id), 7)
    if not expenses:
        return {"total_this_week": 0, "top_category": None, "most_impulsive_day": None, "avg_daily_spend": 0}

    total = sum(e.get("amount", 0) for e in expenses)
    by_category: dict[str, float] = defaultdict(float)
    by_day: dict[str, float] = defaultdict(float)
    for e in expenses:
        by_category[e.get("category", "other")] += e.get("amount", 0)
        day_name = safe_day_name(e.get("date") or e.get("timestamp"), full=True)
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
def insights_weekly(
    request: Request,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    user_id = authenticated_user_id

    def compute():
        user_profile = load_profile_for_user(user_id)
        expenses = _within_days(_user_expenses(user_id), 7)
        mood_entries = _within_days_moods(_user_moods(user_id), 7)
        reflection_context = []
        for entry in mood_entries:
            note_parts = [entry.get("triggers"), entry.get("tomorrow")]
            note_text = " | ".join(part for part in note_parts if part)
            reflection_context.append({
                "amount": 0,
                "category": "reflection",
                "mood": entry.get("mood", "neutral"),
                "notes": note_text or "reflection",
                "date": entry.get("timestamp") or entry.get("day") or utc_now_iso(),
                "time_of_day": "evening",
            })
        summary = generate_weekly_summary(expenses + reflection_context, user_profile=user_profile)
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
def insights_personality(
    request: Request,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    user_id = authenticated_user_id

    def compute():
        expenses = _within_days(_user_expenses(user_id), 30)
        mood_entries = _within_days_moods(_user_moods(user_id), 30)
        profile = _profile_from_expenses(expenses, mood_entries)
        result = classify_personality(profile, user_profile=load_profile_for_user(user_id))
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
def insights_triggers(
    request: Request,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    user_id = authenticated_user_id
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
def nudges_current(
    request: Request,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    user_id = authenticated_user_id
    expenses = _within_days(_user_expenses(user_id), 30)
    triggers = detect_triggers(expenses)
    nudge = predict_nudge(user_id, utc_now(), triggers)
    return {"nudge": nudge}


@router.get(
    "/insights/journey",
    summary="Deterministic journey milestones",
    description="Returns deterministic journey milestones computed directly from user history without waiting for AI LLM generation.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def journey_milestones(
    request: Request,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    user_id = authenticated_user_id
    expenses = _user_expenses(user_id)
    moods = _user_moods(user_id)
    triggers = detect_triggers(_within_days(expenses, 30))
    mindfulness = _mindfulness_score(_within_days(expenses, 30), _within_days_moods(moods, 30))

    milestones = _milestones(
        expenses=expenses,
        moods=moods,
        personality={},
        triggers=triggers,
        weekly={},
        mindfulness=mindfulness,
    )
    return {"milestones": milestones}


@router.get(
    "/insights/coaching",
    summary="Unified AI coaching snapshot",
    description="Returns the shared AI-generated source of truth for Dashboard, DNA, Weekly, Journey, and Reflection.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
def coaching_snapshot(
    request: Request,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    user_id = authenticated_user_id

    def compute():
        user_profile = load_profile_for_user(user_id)
        expenses = _user_expenses(user_id)
        expenses.sort(key=lambda item: str(item.get("date") or item.get("timestamp") or ""), reverse=True)
        moods = _user_moods(user_id)
        recent_30 = _within_days(expenses, 30)
        recent_7 = _within_days(expenses, 7)
        mood_30 = _within_days_moods(moods, 30)
        mood_7 = _within_days_moods(moods, 7)
        reflection_context = []
        for entry in mood_7:
            note_text = " | ".join(part for part in [entry.get("triggers"), entry.get("tomorrow")] if part)
            reflection_context.append({
                "amount": 0,
                "category": "reflection",
                "mood": entry.get("mood", "neutral"),
                "notes": note_text or "reflection",
                "date": entry.get("timestamp") or entry.get("day") or utc_now_iso(),
                "time_of_day": "evening",
            })

        profile = _profile_from_expenses(recent_30, mood_30)
        triggers = detect_triggers(recent_30)

        # Parallel concurrent execution of independent AI tasks (Personality & Weekly Summary)
        with ThreadPoolExecutor(max_workers=2, thread_name_prefix="coaching_ai") as pool:
            future_personality = pool.submit(classify_personality, profile, user_profile=user_profile)
            future_weekly = pool.submit(generate_weekly_summary, recent_7 + reflection_context, user_profile=user_profile)
            raw_personality = future_personality.result()
            weekly = future_weekly.result()

        personality = _evolve_personality(len(expenses), raw_personality, profile)
        nudge_message = predict_nudge(user_id, utc_now(), triggers)
        nudge_payload = build_nudge_payload(nudge_message, triggers)
        mindfulness = _mindfulness_score(recent_30, mood_30)
        prior_mindfulness = None
        cached = db_client.get("ai_results", f"{user_id}_latest")
        if cached and cached.get("personality", {}).get("mindfulness_score") is not None:
            prior_mindfulness = cached["personality"]["mindfulness_score"]
        category_totals = _category_totals(expenses)
        favorite_category = max(category_totals, key=category_totals.get) if category_totals else None
        behavior_timeline = _behavior_timeline(recent_7)
        behavior_evolution = _behavior_evolution(expenses)

        hour_counter = Counter()
        for expense in recent_30:
            h = safe_hour(expense.get("date") or expense.get("timestamp"))
            if h is not None:
                hour_counter[h] += 1
        most_active_time = f"{hour_counter.most_common(1)[0][0]:02d}:00" if hour_counter else "evening"

        # Reuse already-computed personality — ZERO redundant LLM calls
        spend_dna = generate_spend_dna(
            {
                "profile": profile,
                "triggers": triggers,
                "most_impulsive_hour": most_active_time,
                "mindfulness_score": mindfulness,
                "behavior_evolution": behavior_evolution,
                "biggest_win": weekly.get("one_win"),
                "user_profile": user_profile,
            },
            personality=raw_personality,
        )

        dominant_mood = max(profile["mood_frequencies"], key=profile["mood_frequencies"].get) if profile.get("mood_frequencies") else None
        snapshot = {
            "stats": _expense_stats(expenses),
            "analytics": {
                "categories": category_totals,
                "trend": _day_totals(expenses),
            },
            "coach": {
                "headline": weekly.get("headline"),
                "behavior_insight": weekly.get("top_insight") or weekly.get("headline"),
                "detected_pattern": triggers[0].get("trigger") if triggers else None,
                "confidence": personality.get("confidence"),
                "today_prediction": nudge_payload.get("prediction"),
                "coach_suggestion": nudge_payload.get("suggested_action") or weekly.get("coach_recommendation") or weekly.get("one_win"),
            },
            "personality": {
                **personality,
                "strengths": spend_dna.get("strengths") or personality.get("traits", []),
                "growth_areas": spend_dna.get("growth_areas") or [],
                "dominant_trigger": triggers[0].get("trigger") if triggers else None,
                "favorite_category": favorite_category,
                "behavior_narrative": personality.get("description"),
                "mindfulness_score": mindfulness,
                "risk_level": spend_dna.get("risk_level"),
                "coach_advice": spend_dna.get("coach_advice"),
                "most_active_time": most_active_time,
                "behavior_evolution": behavior_evolution,
            },
            "trigger": {
                "top_trigger": triggers[0].get("trigger") if triggers else None,
                "today_trigger": triggers[0].get("trigger") if triggers else None,
                "most_frequent_trigger": triggers[0].get("trigger") if triggers else None,
                "mood_trigger": triggers[0].get("emotion") if triggers else dominant_mood,
                "time_trigger": _most_common_time_period(profile),
                "category_trigger": favorite_category,
                "weekend_trigger": "weekend" if profile.get("weekend_spend_ratio", 0) >= 0.35 else "weekday",
                "recurring_pattern": triggers[0].get("behavior") if triggers else None,
                "trigger_frequency": triggers[0].get("frequency") if triggers else None,
                "current_trigger_risk": nudge_payload.get("risk_level"),
                "most_common_time": _most_common_time_period(profile),
                "most_common_mood": max(profile["mood_frequencies"], key=profile["mood_frequencies"].get) if profile.get("mood_frequencies") else None,
                "triggers": triggers,
            },
            "nudge": nudge_payload,
            "weekly": {
                "weekly_narrative": weekly.get("headline"),
                "behavior_summary": weekly.get("headline"),
                "behavior_changes": weekly.get("emotional_trend"),
                "spending_pattern": weekly.get("top_insight"),
                "top_trigger": weekly.get("biggest_trigger"),
                "biggest_improvement": weekly.get("improvements") or weekly.get("one_win"),
                "improvements": weekly.get("improvements"),
                "regressions": weekly.get("regressions"),
                "trigger_changes": weekly.get("trigger_changes"),
                "mood_changes": weekly.get("mood_changes"),
                "category_trends": weekly.get("category_trends"),
                "personality_changes": weekly.get("personality_changes"),
                "coach_recommendation": weekly.get("coach_recommendation") or nudge_payload.get("suggested_action"),
                "one_win": weekly.get("one_win"),
                "coach_advice": weekly.get("coach_recommendation") or nudge_payload.get("suggested_action"),
            },
            "reflection": _reflection_insight(moods, recent_7),
            "journey": {
                "milestones": _milestones(expenses, moods, personality, triggers, weekly, mindfulness, prior_mindfulness),
            },
            "behavior_timeline": behavior_timeline,
            "spend_dna": spend_dna,
            "recent_expenses": expenses[:5],
        }
        db_client.add("ai_results", {"user_id": user_id, **snapshot, "updated_at": utc_now_iso()}, doc_id=f"{user_id}_latest")
        return snapshot

    return get_or_set(f"coaching:{user_id}", 10 * 60, compute)
