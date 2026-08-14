"""
SpendMind — Trigger Detection Prompt
Analyzes 30 days of expenses to identify top 3 behavioral spending triggers.
Model: router reasoning provider (best for cross-expense pattern analysis)
Temperature: 0.2 for maximum consistency across runs.
"""

from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT
from ai_engine.prompts.insight_context import format_history_for_prompt

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

TRIGGER_PROMPT_TEMPLATE = """
{master_system}

---

TASK: BEHAVIORAL SPENDING TRIGGER DETECTION

You are a behavioral psychologist analyzing 30 days of spending data to identify
the top 3 emotional and situational triggers that cause this user to spend.

A "trigger" is the underlying cue that INITIATES a spending behavior.
Triggers can be:
- Emotional: stress, loneliness, boredom, happiness, anxiety, excitement
- Situational: time of day, day of week, location, social context
- Event-based: after exams, after classes, payday, weekend, etc.

30-DAY EXPENSE DATA:
{expenses_formatted}

PATTERN SUMMARY:
- Total expenses: {total_count}
- Date range: {date_range}
- Top spending times: {top_times}
- Top spending days: {top_days}
- Mood distribution: {mood_distribution}

COMPUTED BEHAVIORAL EVIDENCE:
{behavioral_evidence}

ANALYSIS INSTRUCTIONS:
1. Look for CORRELATIONS across the entire 30 days:
   - Same mood + same category = emotional trigger
   - Same time of day + spending spike = situational trigger
   - Same context in notes = event-based trigger
   - Routine/necessary categories are not triggers unless they show unusual repetition, amount deviation, or explicit notes/mood support.

2. For each trigger found:
   - trigger: Name the trigger clearly (e.g., "Late-night stress", "Post-exam relief", "Weekend social outings")
   - behavior: Describe the specific spending behavior this trigger causes (e.g., "Orders food delivery within 30 minutes")
   - frequency: Describe frequency only as strongly as the data allows
   - emotion: The primary emotion associated with this trigger

3. Return EXACTLY 3 triggers, ranked by frequency (most frequent first).
   If fewer than 3 clear triggers exist, still return 3 — the 3rd may be lower confidence.

STRICT OUTPUT FORMAT — return ONLY this JSON array, nothing else:
[
  {{
    "trigger": "clear name of the trigger (5 words max)",
    "behavior": "specific spending behavior this causes (1 sentence)",
    "frequency": "how often this occurs (e.g. '3-4x per week')",
    "emotion": "primary emotion (1-2 words)"
  }},
  {{
    "trigger": "...",
    "behavior": "...",
    "frequency": "...",
    "emotion": "..."
  }},
  {{
    "trigger": "...",
    "behavior": "...",
    "frequency": "...",
    "emotion": "..."
  }}
]

FREQUENCY EVIDENCE RULES:
- Only use exact counts, ranges, "every Friday", or "2-3 times per week" if those values can be directly inferred from the supplied expense rows or computed summary.
- If the data shows a pattern but not a defensible exact rate, use qualitative wording: "appears occasionally", "appears repeatedly", "emerging pattern", or "seen in several logged expenses".
- If history is too thin for a trigger, use "insufficient history" for frequency.
- Never invent exact frequencies, percentages, probabilities, or trend strength.
- Do not turn "top spending times" or "top days" into a weekly rate unless dates support it.

CONSISTENCY RULES:
- Same input must produce same triggers across multiple runs
- trigger names must be specific, not generic ("Late-night stress ordering" not just "stress")
- behavior must describe what the user actually does (based on data), not generic advice
- frequency must be data-derived, not estimated; use qualitative wording when exact frequency is not supported
- emotions must come from mood, notes, or obvious context; otherwise use cautious wording
- Never use "late night" as a trigger from time alone; it needs repeated timing plus category/mood/notes evidence.
- Return ONLY the JSON array — no markdown, no explanation, no extra text
"""


def build_trigger_prompt(expenses: list) -> tuple[str, dict]:
    """
    Build trigger detection prompt from 30 days of expense data.

    Args:
        expenses: list of expense dicts with:
                  {amount, category, mood, notes, date, time_of_day, day_of_week}

    Returns:
        (prompt_string, computed_stats)
    """
    if not expenses:
        return _empty_trigger_prompt(), {}

    stats = _compute_trigger_stats(expenses)
    expenses_formatted = _format_expenses_for_trigger_analysis(expenses)
    behavioral_evidence = format_history_for_prompt(expenses)

    prompt = TRIGGER_PROMPT_TEMPLATE.format(
        master_system=MASTER_SYSTEM_PROMPT.strip(),
        expenses_formatted=expenses_formatted,
        total_count=stats["total_count"],
        date_range=stats["date_range"],
        top_times=stats["top_times"],
        top_days=stats["top_days"],
        mood_distribution=stats["mood_distribution"],
        behavioral_evidence=behavioral_evidence
    )

    return prompt, stats


def _compute_trigger_stats(expenses: list) -> dict:
    """Pre-compute pattern stats to give the model a head start."""
    from collections import Counter

    times = [e.get("time_of_day", "unknown") for e in expenses]
    days = [e.get("day_of_week", "unknown") for e in expenses]
    moods = [e.get("mood", "unknown") for e in expenses if e.get("mood")]
    dates = [e.get("date", "") for e in expenses if e.get("date")]

    time_counter = Counter(times)
    day_counter = Counter(days)
    mood_counter = Counter(moods)

    top_times = ", ".join(f"{t}({c}x)" for t, c in time_counter.most_common(3))
    top_days = ", ".join(f"{d}({c}x)" for d, c in day_counter.most_common(3))
    mood_dist = ", ".join(f"{m}:{c}" for m, c in mood_counter.most_common(5))

    sorted_dates = sorted(d for d in dates if d)
    date_range = f"{sorted_dates[0]} to {sorted_dates[-1]}" if sorted_dates else "unknown"

    return {
        "total_count": len(expenses),
        "date_range": date_range,
        "top_times": top_times or "unknown",
        "top_days": top_days or "unknown",
        "mood_distribution": mood_dist or "not logged"
    }


def _format_expenses_for_trigger_analysis(expenses: list) -> str:
    """Format expenses in a structured table for trigger analysis."""
    lines = ["#  | Date       | Amount | Category     | Mood        | Time     | Day       | Notes"]
    lines.append("-" * 90)
    for i, e in enumerate(expenses, 1):
        num = str(i).rjust(2)
        date = str(e.get("date", ""))[:10]
        amount = f"₹{e.get('amount', 0)}"
        category = str(e.get("category", ""))[:12]
        mood = str(e.get("mood", "—"))[:11]
        time_of_day = str(e.get("time_of_day", "—"))[:8]
        day = str(e.get("day_of_week", "—"))[:9]
        notes = str(e.get("notes", ""))[:25]
        lines.append(
            f"{num} | {date:<10} | {amount:<6} | {category:<12} | {mood:<11} | {time_of_day:<8} | {day:<9} | {notes}"
        )
    return "\n".join(lines)


def _empty_trigger_prompt() -> str:
    return """
Not enough expense data to detect triggers.
Return: [{{"trigger": "Insufficient data", "behavior": "Log more expenses to detect patterns", "frequency": "unknown", "emotion": "unknown"}}]
"""


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

TRIGGER_VALIDATION_RULES = {
    "required_count": 3,
    "required_fields": ["trigger", "behavior", "frequency", "emotion"],
    "trigger_max_words": 6,
    "behavior_max_chars": 120,
    "frequency_max_chars": 30,
    "emotion_max_words": 3
}


def validate_triggers(triggers: list) -> tuple[bool, list]:
    """
    Validate trigger detection output.

    Returns:
        (is_valid: bool, errors: list)
    """
    errors = []
    rules = TRIGGER_VALIDATION_RULES

    if not isinstance(triggers, list):
        return False, ["Response is not a list"]

    if len(triggers) != rules["required_count"]:
        errors.append(f"Expected {rules['required_count']} triggers, got {len(triggers)}")

    for i, trigger in enumerate(triggers):
        for field in rules["required_fields"]:
            if field not in trigger:
                errors.append(f"Trigger {i+1}: missing field '{field}'")
            elif not trigger[field]:
                errors.append(f"Trigger {i+1}: empty value for '{field}'")

        if "trigger" in trigger:
            word_count = len(str(trigger["trigger"]).split())
            if word_count > rules["trigger_max_words"]:
                errors.append(f"Trigger {i+1}: trigger name too long ({word_count} words)")

        if "emotion" in trigger:
            word_count = len(str(trigger["emotion"]).split())
            if word_count > rules["emotion_max_words"]:
                errors.append(f"Trigger {i+1}: emotion too long ({word_count} words)")

    return len(errors) == 0, errors


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE OUTPUT
# ─────────────────────────────────────────────────────────────────────────────

TRIGGER_EXAMPLE_OUTPUT = [
    {
        "trigger": "Late-night exam stress",
        "behavior": "Orders food delivery within 30 minutes of finishing study sessions after 10 PM",
        "frequency": "4-5 times per week during exam periods",
        "emotion": "stress, relief"
    },
    {
        "trigger": "Weekend social outings",
        "behavior": "Spends 2-3x average amount on food and entertainment when with friend groups",
        "frequency": "every Saturday evening",
        "emotion": "social excitement"
    },
    {
        "trigger": "Afternoon boredom",
        "behavior": "Makes small impulse purchases (chai, snacks) between 2-4 PM on weekdays",
        "frequency": "3-4 times per week",
        "emotion": "boredom"
    }
]
