"""Deterministic behavioral evidence builders for Arthyne AI prompts.

This module deliberately does factual/statistical work before the LLM is
called. The model should interpret and communicate evidence, not invent it.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from statistics import median
from typing import Any, Optional


NECESSARY_CATEGORIES = {
    "rent", "utilities", "groceries", "transport", "health",
    "subscriptions", "education", "tuition", "college", "petrol", "fuel",
    "gas", "medicine", "medical", "fees", "commute",
}
ESSENTIAL_PRIOR_CATEGORIES = {
    "rent", "utilities", "health", "medicine", "medical", "education",
    "tuition", "college", "fees",
}
ROUTINE_PRIOR_CATEGORIES = {
    "groceries", "transport", "commute", "petrol", "fuel", "gas", "subscriptions",
}
AMBIGUOUS_CATEGORIES = {"food", "other", "travel", "shopping"}
DISCRETIONARY_PRIOR_CATEGORIES = {
    "shopping", "entertainment", "dining", "delivery", "snacks",
}

TIME_PERIODS = ("Morning", "Afternoon", "Evening", "Night")
REACTIVE_MOODS = {"stressed", "bored", "lonely", "tired", "low"}
POSITIVE_MOODS = {"happy", "great", "good", "social"}
DISCRETIONARY_CATEGORIES = {
    "food", "shopping", "entertainment", "travel", "snacks", "dining",
    "delivery", "other",
}
RECURRING_KEYWORDS = {
    "monthly", "weekly", "daily", "rent", "fees", "bill", "emi",
    "subscription", "pass", "recharge",
}
ESSENTIAL_NOTE_KEYWORDS = {
    "medicine", "doctor", "hospital", "tuition", "fees", "rent", "bill",
    "electricity", "water", "gas", "petrol", "fuel",
}
DISCRETIONARY_NOTE_KEYWORDS = {
    "swiggy", "zomato", "delivery", "movie", "friends", "outing",
    "treat", "treated", "online", "random", "sale", "party", "netflix",
    "prime", "spotify", "streaming",
}


from ai_engine.utils.datetime_utils import is_within_days, parse_utc_datetime, utc_now


def parse_expense_datetime(value: Any) -> Optional[datetime]:
    return parse_utc_datetime(value)


def has_recorded_time(value: Any) -> bool:
    if isinstance(value, datetime):
        return True
    if not value:
        return False
    text = str(value).strip()
    return "T" in text or (":" in text and " " in text)


def classify_time_period(dt: Optional[datetime], has_time: bool = True) -> str:
    """Classify into Morning / Afternoon / Evening / Night using the actual timestamp."""
    if dt is None or not has_time:
        return "Unknown"
    hour = dt.hour
    if 5 <= hour < 12:
        return "Morning"
    if 12 <= hour < 17:
        return "Afternoon"
    if 17 <= hour < 22:
        return "Evening"
    return "Night"


def format_exact_time(dt: Optional[datetime], has_time: bool = True) -> str:
    if dt is None or not has_time:
        return "time not recorded"
    return dt.strftime("%I:%M %p").lstrip("0")


def is_necessary_category(category: str) -> bool:
    normalized = (category or "").strip().lower()
    return normalized in NECESSARY_CATEGORIES or normalized in {"petrol", "gas", "fuel"}


def _confidence_label(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.5:
        return "medium"
    return "low"


def _normalize_expense(expense: dict) -> dict:
    date_value = expense.get("date") or expense.get("timestamp")
    dt = parse_expense_datetime(date_value)
    recorded_time = has_recorded_time(date_value)
    period = classify_time_period(dt, recorded_time)
    return {
        "amount": float(expense.get("amount") or 0),
        "category": expense.get("category") or "other",
        "mood": expense.get("mood") or "",
        "notes": expense.get("notes") or expense.get("merchant") or "",
        "date": dt.isoformat() if dt else expense.get("date"),
        "time_period": period,
        "exact_time": format_exact_time(dt, recorded_time),
        "day_of_week": dt.strftime("%A") if dt else "",
        "insight": expense.get("insight") or {},
    }


def _category_key(category: str) -> str:
    return (category or "other").strip().lower()


def _safe_amounts(expenses: list[dict]) -> list[float]:
    return [float(item.get("amount") or 0) for item in expenses if float(item.get("amount") or 0) > 0]


def _confidence_from_count(count: int) -> str:
    if count >= 6:
        return "established"
    if count >= 3:
        return "emerging"
    if count >= 1:
        return "weak"
    return "insufficient"


def _amount_baseline(amount: float, expenses: list[dict], category: str | None = None) -> dict[str, Any]:
    pool = expenses
    if category:
        key = _category_key(category)
        pool = [item for item in expenses if _category_key(item.get("category")) == key]
    amounts = _safe_amounts(pool)
    if not amounts:
        return {
            "typical_amount": None,
            "median_amount": None,
            "sample_size": 0,
            "amount_ratio": None,
            "deviation": "unknown",
        }
    avg = round(sum(amounts) / len(amounts), 2)
    med = round(median(amounts), 2)
    ratio = round(float(amount or 0) / avg, 2) if avg else None
    if ratio is None:
        deviation = "unknown"
    elif ratio >= 1.75 and len(amounts) >= 3:
        deviation = "above baseline"
    elif ratio <= 0.55 and len(amounts) >= 3:
        deviation = "below baseline"
    else:
        deviation = "near baseline"
    return {
        "typical_amount": avg,
        "median_amount": med,
        "sample_size": len(amounts),
        "amount_ratio": ratio,
        "deviation": deviation,
    }


def build_behavioral_history(expenses: Optional[list[dict]]) -> dict[str, Any]:
    """Summarize recent user history into factual behavioral evidence."""
    normalized = [_normalize_expense(item) for item in (expenses or [])]
    normalized.sort(key=lambda item: item.get("date") or "", reverse=True)

    category_counts = Counter(_category_key(item["category"]) for item in normalized)
    time_counts = Counter(item["time_period"] for item in normalized if item["time_period"] != "Unknown")
    day_type_counts = Counter("weekend" if _is_weekend(item.get("date")) else "weekday" for item in normalized if item.get("date"))
    mood_counts = Counter((item["mood"] or "").strip().lower() for item in normalized if item["mood"])
    category_time_counts = Counter(
        (_category_key(item["category"]), item["time_period"])
        for item in normalized
        if item["time_period"] != "Unknown"
    )
    category_mood_counts = Counter(
        (_category_key(item["category"]), (item["mood"] or "").strip().lower())
        for item in normalized
        if item["mood"]
    )

    category_amounts: dict[str, list[float]] = defaultdict(list)
    for item in normalized:
        if item["amount"] > 0:
            category_amounts[_category_key(item["category"])].append(item["amount"])

    category_baselines = {
        category: {
            "count": len(amounts),
            "typical_amount": round(sum(amounts) / len(amounts), 2),
            "median_amount": round(median(amounts), 2),
        }
        for category, amounts in category_amounts.items()
    }

    patterns = _derive_history_patterns(
        normalized,
        category_counts,
        time_counts,
        category_time_counts,
        category_mood_counts,
    )

    return {
        "total_expenses": len(normalized),
        "overall_baseline": _amount_baseline(0, normalized),
        "category_counts": dict(category_counts),
        "category_baselines": category_baselines,
        "time_period_counts": dict(time_counts),
        "weekday_weekend_counts": dict(day_type_counts),
        "mood_counts": dict(mood_counts),
        "strongest_patterns": patterns,
        "recent_expenses": normalized[:10],
    }


def _derive_history_patterns(
    expenses: list[dict],
    category_counts: Counter,
    time_counts: Counter,
    category_time_counts: Counter,
    category_mood_counts: Counter,
) -> list[dict[str, Any]]:
    patterns: list[dict[str, Any]] = []

    for (category, period), count in category_time_counts.most_common(6):
        if count >= 3:
            patterns.append({
                "signal": f"{period.lower()} {category} repetition",
                "evidence_count": count,
                "confidence": _confidence_from_count(count),
                "evidence": f"{count} {category} expenses happened in the {period.lower()}",
            })

    for (category, mood), count in category_mood_counts.most_common(6):
        if count >= 3 and mood:
            patterns.append({
                "signal": f"{mood} {category} link",
                "evidence_count": count,
                "confidence": _confidence_from_count(count),
                "evidence": f"{count} {category} expenses were logged with mood '{mood}'",
            })

    for category, count in category_counts.most_common(5):
        if count >= 5 and is_necessary_category(category):
            patterns.append({
                "signal": f"routine {category}",
                "evidence_count": count,
                "confidence": _confidence_from_count(count),
                "evidence": f"{category} appears {count} times and is usually routine/necessary",
            })

    for period, count in time_counts.most_common(4):
        if count >= 5:
            patterns.append({
                "signal": f"{period.lower()} spending window",
                "evidence_count": count,
                "confidence": _confidence_from_count(count),
                "evidence": f"{count} expenses happened in the {period.lower()}",
            })

    patterns.sort(key=lambda item: item["evidence_count"], reverse=True)
    return patterns[:8]


def _is_weekend(date_value: Any) -> bool:
    dt = parse_expense_datetime(date_value)
    return bool(dt and dt.weekday() >= 5)


def build_evidence_bundle(
    amount: float,
    category: str,
    mood: str,
    notes: str,
    date_value: Any,
    recent_expenses: Optional[list[dict]] = None,
    classification_override: Any = None,
) -> dict[str, Any]:
    """Build factual evidence from current expense + recent history. No inference."""
    dt = parse_expense_datetime(date_value)
    recorded_time = has_recorded_time(date_value)
    time_period = classify_time_period(dt, recorded_time)
    recent = [_normalize_expense(item) for item in (recent_expenses or [])]
    history = build_behavioral_history(recent)
    category_key = (category or "other").strip().lower()
    mood_clean = (mood or "").strip().lower()

    same_category = [item for item in recent if item["category"].strip().lower() == category_key]
    same_period = [
        item for item in recent
        if time_period != "Unknown" and item["time_period"] == time_period
    ]
    same_category_period = [
        item for item in recent
        if (
            time_period != "Unknown"
            and item["category"].strip().lower() == category_key
            and item["time_period"] == time_period
        )
    ]
    same_mood = [item for item in recent if item["mood"].strip().lower() == mood_clean] if mood_clean else []
    same_category_mood = [
        item for item in recent
        if mood_clean and item["category"].strip().lower() == category_key and item["mood"].strip().lower() == mood_clean
    ]
    same_weekday_type = [
        item for item in recent
        if dt and parse_expense_datetime(item.get("date")) and _is_weekend(item.get("date")) == (dt.weekday() >= 5)
    ]

    previous_tags = Counter()
    for item in recent:
        tag = (item.get("insight") or {}).get("pattern_tag")
        if tag:
            previous_tags[tag] += 1

    week_same_category = 0
    for item in recent:
        if is_within_days(item.get("date"), 7) and str(item.get("category", "")).strip().lower() == category_key:
            week_same_category += 1

    overall_baseline = _amount_baseline(float(amount or 0), recent)
    category_baseline = _amount_baseline(float(amount or 0), recent, category)
    evidence_count = max(len(same_category), len(same_category_period), len(same_mood))
    classification = classify_expense(
        amount=float(amount or 0),
        category=category,
        notes=notes,
        mood=mood,
        same_category=same_category,
        same_category_period=same_category_period,
        same_category_mood=same_category_mood,
        category_baseline=category_baseline,
        classification_override=classification_override,
    )
    behavioral_significance = classify_behavioral_significance(
        classification=classification,
        category_baseline=category_baseline,
        same_category=same_category,
        same_category_period=same_category_period,
        same_category_mood=same_category_mood,
        mood=mood,
    )
    spending_nature = _legacy_spending_nature(classification, behavioral_significance)

    return {
        "amount": round(float(amount or 0), 2),
        "category": category or "other",
        "mood": mood or "not specified",
        "notes": notes.strip() if notes else "none",
        "date": dt.date().isoformat() if dt else "not recorded",
        "exact_time": format_exact_time(dt, recorded_time),
        "time_period": time_period,
        "day_of_week": dt.strftime("%A") if dt else "unknown",
        "is_necessary_category": is_necessary_category(category),
        "recent_expense_count": len(recent),
        "same_category_recent_count": len(same_category),
        "same_time_period_recent_count": len(same_period),
        "same_category_time_period_count": len(same_category_period),
        "same_mood_recent_count": len(same_mood),
        "same_category_mood_count": len(same_category_mood),
        "same_weekday_type_recent_count": len(same_weekday_type),
        "week_same_category_count": week_same_category,
        "overall_amount_baseline": overall_baseline,
        "category_amount_baseline": category_baseline,
        "expense_classification": classification,
        "behavioral_significance": behavioral_significance,
        "spending_nature": spending_nature,
        "evidence_strength": _confidence_from_count(evidence_count),
        "history": history,
        "previous_pattern_tags": dict(previous_tags),
        "recent_expenses": recent[:5],
    }


def classify_expense(
    amount: float,
    category: str,
    notes: str,
    mood: str,
    same_category: list[dict],
    same_category_period: list[dict],
    same_category_mood: list[dict],
    category_baseline: dict[str, Any],
    classification_override: Any = None,
) -> dict[str, Any]:
    """Classify the expense type without making psychological claims."""
    override = _normalize_classification_override(classification_override)
    if override:
        return override

    normalized = _category_key(category)
    lower_notes = (notes or "").lower()
    note_tokens = set(lower_notes.replace(",", " ").replace(".", " ").split())
    recurring_note = bool(note_tokens & RECURRING_KEYWORDS)
    essential_note = bool(note_tokens & ESSENTIAL_NOTE_KEYWORDS)
    discretionary_note = bool(note_tokens & DISCRETIONARY_NOTE_KEYWORDS)
    evidence_count = len(same_category)
    repeated_near_baseline = evidence_count >= 3 and category_baseline.get("deviation") == "near baseline"
    repeated_same_context = len(same_category_period) >= 3 or len(same_category_mood) >= 3

    signals: list[str] = []
    if normalized in ESSENTIAL_PRIOR_CATEGORIES:
        signals.append(f"category prior: {normalized} is usually essential")
    if normalized in ROUTINE_PRIOR_CATEGORIES:
        signals.append(f"category prior: {normalized} is usually routine")
    if normalized in DISCRETIONARY_PRIOR_CATEGORIES:
        signals.append(f"category prior: {normalized} is usually discretionary")
    if normalized in AMBIGUOUS_CATEGORIES:
        signals.append(f"category prior: {normalized} is ambiguous")
    if recurring_note:
        signals.append("notes indicate a recurring obligation or regular cadence")
    if essential_note:
        signals.append("notes contain essential-spend language")
    if discretionary_note:
        signals.append("notes contain discretionary-context language")
    if repeated_near_baseline:
        signals.append(f"{evidence_count} similar expenses are near the user's category baseline")
    if repeated_same_context:
        signals.append("similar expenses repeat in the same context")
    if category_baseline.get("deviation") == "above baseline":
        signals.append("amount is above the user's category baseline")

    if normalized in ESSENTIAL_PRIOR_CATEGORIES or essential_note:
        classification = "essential"
        confidence = 0.86 if (recurring_note or evidence_count) else 0.76
        reason = "category or notes point to a necessary obligation"
    elif discretionary_note and normalized not in ROUTINE_PRIOR_CATEGORIES:
        classification = "discretionary"
        confidence = 0.68 if evidence_count else 0.58
        reason = "notes point to an optional or experience-oriented context"
    elif normalized in ROUTINE_PRIOR_CATEGORIES or recurring_note:
        classification = "routine"
        confidence = 0.78 if (recurring_note or evidence_count) else 0.68
        reason = "category, notes, or history point to regular life spending"
    elif repeated_near_baseline:
        classification = "routine"
        confidence = 0.66
        reason = "history shows a repeated expense near the user's normal baseline"
    elif normalized in DISCRETIONARY_PRIOR_CATEGORIES:
        classification = "discretionary"
        confidence = 0.62
        reason = "category leans discretionary, but history still matters"
    elif normalized in {"food", "other"} and not same_category:
        classification = "uncertain"
        confidence = 0.34
        reason = "this category is ambiguous and there is not enough user history yet"
    elif normalized in DISCRETIONARY_CATEGORIES:
        classification = "discretionary"
        confidence = 0.52
        reason = "category leans discretionary, but evidence is still limited"
    else:
        classification = "uncertain"
        confidence = 0.35
        reason = "available signals do not support a confident classification"

    return {
        "classification": classification,
        "confidence": round(confidence, 2),
        "confidence_label": _confidence_label(confidence),
        "reason": reason,
        "signals": signals or ["insufficient evidence"],
        "evidence_count": evidence_count,
        "source": "deterministic",
        "user_override": False,
    }


def _normalize_classification_override(value: Any) -> dict[str, Any] | None:
    if not value:
        return None
    if isinstance(value, str):
        requested = value.strip().lower()
        reason = "user corrected this expense classification"
    elif isinstance(value, dict):
        requested = str(value.get("classification") or value.get("type") or "").strip().lower()
        reason = str(value.get("reason") or "user corrected this expense classification")
    else:
        return None
    if requested not in {"essential", "routine", "discretionary", "uncertain"}:
        return None
    return {
        "classification": requested,
        "confidence": 1.0,
        "confidence_label": "high",
        "reason": reason,
        "signals": ["user override"],
        "evidence_count": 0,
        "source": "user_override",
        "user_override": True,
    }


def classify_behavioral_significance(
    classification: dict[str, Any],
    category_baseline: dict[str, Any],
    same_category: list[dict],
    same_category_period: list[dict],
    same_category_mood: list[dict],
    mood: str,
) -> dict[str, Any]:
    """Estimate how much behavioral interpretation is warranted."""
    signals: list[str] = []
    repeated_context = len(same_category_period) >= 3
    repeated_mood = len(same_category_mood) >= 3
    repeated_category = len(same_category) >= 3
    above_baseline = category_baseline.get("deviation") == "above baseline"
    reactive_mood = (mood or "").strip().lower() in REACTIVE_MOODS

    if repeated_context:
        signals.append("repeated category + time context")
    if repeated_mood:
        signals.append("repeated category + mood context")
    if above_baseline:
        signals.append("amount above category baseline")
    if repeated_category:
        signals.append("category recurrence")
    if reactive_mood:
        signals.append("current mood is reactive, but mood alone is not enough")

    expense_type = classification.get("classification")
    repeated_mood_significant = repeated_mood and reactive_mood

    if expense_type in {"essential", "routine"} and not (repeated_mood_significant or above_baseline):
        level = "low"
        confidence = 0.72
        reason = "the expense looks regular or necessary and lacks anomaly evidence"
    elif repeated_context and repeated_mood_significant:
        level = "high"
        confidence = 0.82
        reason = "the same category repeats with both timing and reactive mood evidence"
    elif repeated_context or repeated_mood_significant or above_baseline:
        level = "moderate"
        confidence = 0.66
        reason = "there is some evidence worth reflecting on, but not enough for a strong claim"
    elif expense_type == "uncertain":
        level = "unknown"
        confidence = 0.32
        reason = "classification and behavioral evidence are both thin"
    else:
        level = "low"
        confidence = 0.48
        reason = "this may be discretionary, but there is little behavioral evidence yet"

    return {
        "level": level,
        "confidence": round(confidence, 2),
        "confidence_label": _confidence_label(confidence),
        "reason": reason,
        "signals": signals or ["no strong behavioral signal"],
    }


def _legacy_spending_nature(classification: dict[str, Any], significance: dict[str, Any]) -> dict[str, Any]:
    expense_type = classification.get("classification")
    if expense_type == "essential":
        label = "routine_or_necessary"
    elif expense_type == "routine":
        label = "routine_or_necessary" if significance.get("level") == "low" else "routine_discretionary"
    elif expense_type == "discretionary":
        label = "discretionary_behavioral"
    else:
        label = "unclear"
    return {
        "label": label,
        "reason": classification.get("reason", ""),
        "evidence_count": classification.get("evidence_count", 0),
        "confidence": classification.get("confidence_label", "low"),
    }


def format_evidence_for_prompt(evidence: dict[str, Any]) -> str:
    lines = [
        f"- Amount: ₹{evidence['amount']}",
        f"- Category: {evidence['category']}",
        f"- Mood: {evidence['mood']}",
        f"- Notes/merchant: {evidence['notes']}",
        f"- Date: {evidence['date']} ({evidence['day_of_week']})",
        f"- Exact time: {evidence['exact_time']}",
        f"- Time period: {evidence['time_period']}",
        f"- Category type: {'routine/necessary' if evidence['is_necessary_category'] else 'discretionary/other'}",
        f"- Same category in recent history: {evidence['same_category_recent_count']} of last {evidence['recent_expense_count']}",
        f"- Same time period in recent history: {evidence['same_time_period_recent_count']} of last {evidence['recent_expense_count']}",
        f"- Same category + time period in recent history: {evidence['same_category_time_period_count']}",
        f"- Same mood in recent history: {evidence['same_mood_recent_count']}",
        f"- Same category + mood in recent history: {evidence['same_category_mood_count']}",
        f"- Same weekday/weekend type in recent history: {evidence['same_weekday_type_recent_count']}",
        f"- Same category in last 7 days (including recent list): {evidence['week_same_category_count']}",
        (
            "- Expense classification: "
            f"{evidence['expense_classification']['classification']} "
            f"(confidence {evidence['expense_classification']['confidence']}; "
            f"{evidence['expense_classification']['reason']})"
        ),
        (
            "- Behavioral significance: "
            f"{evidence['behavioral_significance']['level']} "
            f"(confidence {evidence['behavioral_significance']['confidence']}; "
            f"{evidence['behavioral_significance']['reason']})"
        ),
        f"- Spending nature: {evidence['spending_nature']['label']} ({evidence['spending_nature']['reason']})",
        f"- Evidence strength: {evidence['evidence_strength']}",
    ]
    overall = evidence["overall_amount_baseline"]
    category = evidence["category_amount_baseline"]
    lines.append(
        "- Overall amount baseline: "
        f"{overall['deviation']} | typical: {overall['typical_amount']} | sample: {overall['sample_size']}"
    )
    lines.append(
        "- Category amount baseline: "
        f"{category['deviation']} | typical: {category['typical_amount']} | sample: {category['sample_size']}"
    )

    patterns = evidence.get("history", {}).get("strongest_patterns", [])
    if patterns:
        lines.append("- Established/emerging history patterns:")
        for pattern in patterns[:5]:
            lines.append(
                f"  - {pattern['signal']} | {pattern['confidence']} | {pattern['evidence']}"
            )
    else:
        lines.append("- Established/emerging history patterns: none yet")

    if evidence["previous_pattern_tags"]:
        tags = ", ".join(f"{tag} ({count})" for tag, count in evidence["previous_pattern_tags"].items())
        lines.append(f"- Previous pattern tags in recent expenses: {tags}")
    else:
        lines.append("- Previous pattern tags in recent expenses: none yet")

    if evidence["recent_expenses"]:
        lines.append("- Recent expenses:")
        for index, item in enumerate(evidence["recent_expenses"], 1):
            prior_tag = (item.get("insight") or {}).get("pattern_tag") or "unknown"
            lines.append(
                f"  {index}. ₹{item['amount']} {item['category']} at {item['exact_time']} "
                f"({item['time_period']}) | mood: {item['mood'] or 'not logged'} | "
                f"notes: {item['notes'] or 'none'} | prior tag: {prior_tag}"
            )
    else:
        lines.append("- Recent expenses: none available")

    return "\n".join(lines)


def format_history_for_prompt(expenses: list[dict]) -> str:
    """Format 7-30 day history as compact evidence for multi-expense prompts."""
    history = build_behavioral_history(expenses)
    lines = [
        f"- Total expenses analyzed: {history['total_expenses']}",
        f"- Category counts: {_format_counter_dict(history['category_counts'])}",
        f"- Time period counts: {_format_counter_dict(history['time_period_counts'])}",
        f"- Weekday/weekend counts: {_format_counter_dict(history['weekday_weekend_counts'])}",
        f"- Mood counts: {_format_counter_dict(history['mood_counts'])}",
    ]
    if history["category_baselines"]:
        lines.append("- Category baselines:")
        for category, stats in sorted(
            history["category_baselines"].items(),
            key=lambda item: item[1]["count"],
            reverse=True,
        )[:8]:
            nature = "routine/necessary" if is_necessary_category(category) else "discretionary/other"
            lines.append(
                f"  - {category}: {stats['count']}x, typical Rs {stats['typical_amount']} ({nature})"
            )
    if history["strongest_patterns"]:
        lines.append("- Behavioral signals:")
        for pattern in history["strongest_patterns"]:
            lines.append(f"  - {pattern['evidence']} ({pattern['confidence']})")
    else:
        lines.append("- Behavioral signals: none strong enough yet")
    return "\n".join(lines)


def _format_counter_dict(values: dict[str, Any]) -> str:
    if not values:
        return "none"
    return ", ".join(f"{key}: {value}" for key, value in values.items())


def deterministic_insight_from_evidence(evidence: dict[str, Any]) -> dict[str, Any]:
    """Fallback insight grounded in evidence when model providers are unavailable."""
    category = evidence["category"]
    amount = evidence["amount"]
    period = evidence["time_period"]
    nature = evidence["spending_nature"]["label"]
    classification = evidence["expense_classification"]["classification"]
    significance = evidence["behavioral_significance"]["level"]
    same_category = evidence["same_category_recent_count"]
    same_category_period = evidence["same_category_time_period_count"]
    same_category_mood = evidence["same_category_mood_count"]
    mood = evidence["mood"]
    deviation = evidence["category_amount_baseline"]["deviation"]

    time_phrase = f"in the {period.lower()}" if period != "Unknown" else "with no recorded time"
    observation = f"You logged Rs {amount:g} on {category} {time_phrase}."
    if same_category:
        observation += f" There are {same_category} similar {category} expenses in your recent history."

    if classification in {"essential", "routine"} and significance == "low":
        interpretation = "This looks like routine or essential normal life spending, with no strong behavioral anomaly in the current evidence."
        pattern_tag = "neutral"
        confidence = 0.68 if same_category else 0.55
    elif classification == "uncertain":
        interpretation = "There is not enough history yet to say whether this is routine or discretionary."
        pattern_tag = "neutral"
        confidence = 0.34
    elif same_category_period >= 3:
        interpretation = f"The repeated {period.lower()} timing may point to a habit loop, but the data supports timing more than emotion."
        pattern_tag = "habit_loop"
        confidence = 0.72
    elif mood in REACTIVE_MOODS and same_category_mood >= 2:
        interpretation = f"Because this category appears with {mood} more than once, it may be serving a comfort or reset role."
        pattern_tag = "comfort_spending" if mood != "bored" else "boredom_spending"
        confidence = 0.66
    elif deviation == "above baseline":
        interpretation = "The amount is above this category's recent baseline, so it is worth noticing what made this one different."
        pattern_tag = "impulse_buying"
        confidence = 0.58
    else:
        interpretation = "There is not enough repeated evidence yet to attach a strong behavioral meaning to it."
        pattern_tag = "neutral"
        confidence = 0.38

    reflection = (
        "A useful note next time: what was happening right before this spend?"
        if pattern_tag != "neutral"
        else "Keep logging mood and notes so Arthyne can separate routine from real patterns."
    )
    insight = f"{observation} {interpretation}"

    return {
        "observation": observation,
        "interpretation": interpretation,
        "reflection": reflection,
        "insight": insight,
        "pattern_tag": pattern_tag,
        "intensity": 1 if pattern_tag == "neutral" else 3,
        "confidence": confidence,
    }


def format_recent_expenses_for_prompt(recent_expenses: list[dict]) -> str:
    evidence = build_evidence_bundle(0, "other", "", "", None, recent_expenses)
    return format_evidence_for_prompt(evidence)
