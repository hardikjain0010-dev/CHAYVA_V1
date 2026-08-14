"""Compact, relevance-aware profile context for AI prompts."""

from __future__ import annotations

from typing import Any


ALLOWED_LANGUAGES = {
    "english": "English",
    "hindi": "Hindi",
    "hinglish": "Hinglish",
}

TRIGGER_LABELS = {
    "stress": "stress",
    "boredom": "boredom",
    "social_situations": "social situations",
    "seeing_something_i_want": "seeing something they want",
    "treating_or_rewarding_myself": "treating or rewarding themself",
    "convenience": "convenience",
    "unknown": "not being sure what triggers it",
    "other": "another trigger",
}

CONTEXT_LABELS = {
    "morning": "morning",
    "during_college_or_work": "during college/work",
    "after_college_or_work": "after college/work",
    "evening": "evening",
    "late_night": "late night",
    "weekends": "weekends",
    "with_friends": "being with friends",
    "online_scrolling": "scrolling online",
    "it_depends": "variable contexts",
}


def build_personal_context(
    profile: dict[str, Any] | None,
    evidence: dict[str, Any] | None = None,
    task: str = "expense_analysis",
) -> dict[str, Any]:
    """Select only profile facts that are relevant to the current AI task."""
    if not isinstance(profile, dict) or not profile:
        return {"available": False, "relevant_context": []}

    context: dict[str, Any] = {
        "available": True,
        "relevant_context": [],
    }
    name = _clean(profile.get("display_name"), 40)
    if name:
        context["name"] = name

    language = _language_label(profile.get("preferred_language"))
    if language:
        context["preferred_language"] = language
        context["relevant_context"].append(f"User prefers responses in {language}.")

    life_stage = _clean(profile.get("life_stage"), 40)
    if life_stage and task in {"expense_analysis", "weekly_summary", "personality"}:
        context["life_stage"] = life_stage
        context["relevant_context"].append(f"User describes their life stage as {life_stage}.")

    schedule = _clean(profile.get("typical_daily_schedule"), 160)
    if schedule and _schedule_is_relevant(schedule, evidence, task):
        context["relevant_context"].append(f"User-provided schedule context: {schedule}.")

    work_context = _clean(profile.get("college_or_work_context"), 120)
    if work_context and task in {"expense_analysis", "weekly_summary", "personality"}:
        context["relevant_context"].append(f"User-provided work/study context: {work_context}.")

    priorities = _clean_list(profile.get("spending_priorities"), 3, 40)
    if priorities and task in {"weekly_summary", "personality"}:
        context["relevant_context"].append("Spending priorities: " + ", ".join(priorities) + ".")

    goals = _clean_list(profile.get("financial_goals"), 3, 60)
    if goals and _goals_are_relevant(evidence, task):
        context["relevant_context"].append("User goals: " + ", ".join(goals) + ".")

    triggers = _label_list(profile.get("self_reported_spending_triggers"), TRIGGER_LABELS, 4)
    if triggers and _self_reported_context_is_relevant(evidence, task):
        context["self_reported_spending_triggers"] = triggers
        context["relevant_context"].append(
            "User-reported possible spending triggers, not observed proof: "
            + ", ".join(triggers)
            + "."
        )

    spending_contexts = _label_list(profile.get("self_reported_spending_contexts"), CONTEXT_LABELS, 5)
    if spending_contexts and _self_reported_context_is_relevant(evidence, task):
        context["self_reported_spending_contexts"] = spending_contexts
        context["relevant_context"].append(
            "User-reported unexpected-spending situations, not timestamp evidence: "
            + ", ".join(spending_contexts)
            + "."
        )

    tone = _clean(profile.get("preferred_ai_tone"), 40)
    if tone:
        context["preferred_tone"] = tone
        context["relevant_context"].append(f"Preferred AI tone: {tone}.")

    if not context["relevant_context"]:
        context["available"] = False
    return context


def format_personal_context_for_prompt(context: dict[str, Any] | None) -> str:
    if not isinstance(context, dict) or not context.get("relevant_context"):
        return "- No user-provided profile context is relevant for this request."

    lines = [
        "- Use profile facts only as user-provided context, never as behavioral proof.",
        "- Observed transaction/history evidence is stronger than profile context.",
    ]
    if context.get("name"):
        lines.append(f"- Name available for occasional natural personalization: {context['name']}")
    for item in context.get("relevant_context", [])[:6]:
        lines.append(f"- {item}")
    return "\n".join(lines)


def _schedule_is_relevant(schedule: str, evidence: dict[str, Any] | None, task: str) -> bool:
    if task in {"weekly_summary", "personality"}:
        return True
    if not evidence:
        return False
    period = evidence.get("time_period")
    significance = (evidence.get("behavioral_significance") or {}).get("level")
    same_period = int(evidence.get("same_category_time_period_count") or 0)
    if period in {"Afternoon", "Evening", "Night"} and (same_period >= 1 or significance in {"moderate", "high"}):
        return True
    schedule_lower = schedule.lower()
    category = str(evidence.get("category") or "").lower()
    notes = str(evidence.get("notes") or "").lower()
    note_tokens = {
        token.strip(".,!?;:()[]")
        for token in notes.split()
        if len(token.strip(".,!?;:()[]")) >= 4
    }
    return category in schedule_lower or any(token in schedule_lower for token in note_tokens)


def _goals_are_relevant(evidence: dict[str, Any] | None, task: str) -> bool:
    if task in {"weekly_summary", "personality"}:
        return True
    if not evidence:
        return False
    classification = (evidence.get("expense_classification") or {}).get("classification")
    significance = (evidence.get("behavioral_significance") or {}).get("level")
    return classification in {"discretionary", "uncertain"} or significance in {"moderate", "high", "unknown"}


def _self_reported_context_is_relevant(evidence: dict[str, Any] | None, task: str) -> bool:
    if task in {"weekly_summary", "personality"}:
        return True
    if not evidence:
        return False
    classification = (evidence.get("expense_classification") or {}).get("classification")
    significance = (evidence.get("behavioral_significance") or {}).get("level")
    return classification in {"discretionary", "uncertain"} or significance in {"moderate", "high", "unknown"}


def _language_label(value: Any) -> str | None:
    key = str(value or "").strip().lower()
    return ALLOWED_LANGUAGES.get(key)


def _clean(value: Any, max_len: int) -> str | None:
    if value is None:
        return None
    text = " ".join(str(value).replace("\n", " ").split())
    if not text:
        return None
    return text[:max_len]


def _clean_list(value: Any, max_items: int, max_len: int) -> list[str]:
    if not isinstance(value, list):
        return []
    out = []
    for item in value:
        cleaned = _clean(item, max_len)
        if cleaned:
            out.append(cleaned)
        if len(out) >= max_items:
            break
    return out


def _label_list(value: Any, labels: dict[str, str], max_items: int) -> list[str]:
    if not isinstance(value, list):
        return []
    out = []
    for item in value:
        key = str(item or "").strip().lower()
        label = labels.get(key)
        if label:
            out.append(label)
        if len(out) >= max_items:
            break
    return out
