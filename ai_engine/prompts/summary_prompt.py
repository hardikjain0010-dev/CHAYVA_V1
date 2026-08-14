"""
SpendMind — Weekly Summary Prompt
Generates a 7-day behavioral spending recap.
Model: Gemini Flash (temperature=0.7 for narrative warmth)
"""

from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT
from ai_engine.prompts.insight_context import format_history_for_prompt

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

WEEKLY_SUMMARY_PROMPT_TEMPLATE = """
{master_system}

---

TASK: 7-DAY BEHAVIORAL SPENDING SUMMARY

You are generating a warm, psychologically-aware weekly spending recap for a college student.
This is NOT a financial report. It is an emotional and behavioral mirror.

WEEK'S EXPENSE DATA:
{expenses_formatted}

SUMMARY STATS:
- Total spent this week: ₹{total_amount}
- Number of transactions: {transaction_count}
- Most common category: {top_category}
- Most common mood: {top_mood}
- Days with most spending: {peak_days}

COMPUTED BEHAVIORAL EVIDENCE:
{behavioral_evidence}

GENERATION INSTRUCTIONS:
1. headline: A single warm sentence capturing the emotional theme of the week (not financial).
   Example: "This was a week of comfort-seeking through food and small treats."
   NOT: "You spent ₹3200 this week."

2. top_insight: The most important behavioral pattern you noticed across all 7 days.
   Should name a specific pattern (e.g., "Evening stress consistently led to food orders").
   1–2 sentences. Warm, curious tone.

3. biggest_trigger: The single clearest emotional or situational trigger across the week.
   Examples: "exam stress", "evening boredom", "social outings on weekends"
   Keep it short — 3–5 words max.

4. emotional_trend: Describe how the user's emotional state evolved across the week.
   Examples: "Started stressed, ended more relaxed", "Consistent weekend social energy"
   1 sentence.

5. one_win: Find ONE genuine positive behavioral observation. Even small.
   Examples: "You spent mindfully on Tuesday with zero impulse purchases."
   Must be authentic — do NOT fabricate a win if the data doesn't support it.
   If no clear win exists: "You tracked your spending all week. That awareness is the first step."

6. improvements: One specific behavioral improvement compared to earlier in the week (1 sentence).
7. regressions: One pattern that worsened or repeated unhelpfully — warm tone, no shame (1 sentence).
8. trigger_changes: How triggers shifted across the week (1 sentence).
9. mood_changes: How moods around spending evolved (1 sentence).
10. category_trends: Which categories rose or fell and why behaviorally (1 sentence).
11. personality_changes: Whether spending personality signals shifted this week (1 sentence).
12. coach_recommendation: One gentle, actionable coaching tip for next week (1 sentence).

STRICT OUTPUT FORMAT — return ONLY this JSON, nothing else:
{{
  "headline": "...",
  "top_insight": "...",
  "biggest_trigger": "...",
  "emotional_trend": "...",
  "one_win": "...",
  "improvements": "...",
  "regressions": "...",
  "trigger_changes": "...",
  "mood_changes": "...",
  "category_trends": "...",
  "personality_changes": "...",
  "coach_recommendation": "..."
}}

RULES:
- No financial judgment (no "you overspent")
- No comparisons to others
- Do not turn routine/necessary categories into emotional problems.
- Do not claim a time-based trigger unless computed evidence shows repeated timing.
- All fields must be filled — never return null or empty string
- If data is sparse (<5 transactions): lower confidence tone ("patterns are beginning to form")
- Return ONLY the JSON object — no markdown, no preamble, no extra text
"""


def build_weekly_summary_prompt(expenses: list) -> tuple[str, dict]:
    """
    Build the weekly summary prompt from a list of expense dicts.

    Args:
        expenses: list of expense dicts, each containing:
                  {amount, category, mood, notes, date, time_of_day}

    Returns:
        (prompt_string, stats_dict) — stats for logging/debugging
    """
    if not expenses:
        return _empty_week_prompt(), {}

    stats = _compute_weekly_stats(expenses)
    expenses_formatted = _format_expenses_for_prompt(expenses)
    behavioral_evidence = format_history_for_prompt(expenses)

    prompt = WEEKLY_SUMMARY_PROMPT_TEMPLATE.format(
        master_system=MASTER_SYSTEM_PROMPT.strip(),
        expenses_formatted=expenses_formatted,
        total_amount=stats["total_amount"],
        transaction_count=stats["transaction_count"],
        top_category=stats["top_category"],
        top_mood=stats["top_mood"],
        peak_days=stats["peak_days"],
        behavioral_evidence=behavioral_evidence
    )

    return prompt, stats


def _compute_weekly_stats(expenses: list) -> dict:
    """Compute summary statistics from expense list."""
    from collections import Counter

    total = sum(float(e.get("amount", 0)) for e in expenses)
    categories = [e.get("category", "unknown") for e in expenses]
    moods = [e.get("mood", "unknown") for e in expenses if e.get("mood")]
    days = [e.get("date", "unknown") for e in expenses]

    category_counter = Counter(categories)
    mood_counter = Counter(moods)
    day_counter = Counter(days)

    top_category = category_counter.most_common(1)[0][0] if category_counter else "unknown"
    top_mood = mood_counter.most_common(1)[0][0] if mood_counter else "not logged"

    # Find top 2 peak spending days
    peak_days_list = [day for day, _ in day_counter.most_common(2)]
    peak_days = ", ".join(peak_days_list) if peak_days_list else "spread evenly"

    return {
        "total_amount": round(total, 2),
        "transaction_count": len(expenses),
        "top_category": top_category,
        "top_mood": top_mood,
        "peak_days": peak_days
    }


def _format_expenses_for_prompt(expenses: list) -> str:
    """Format expense list into readable table for the prompt."""
    lines = ["Date        | Amount | Category      | Mood       | Notes"]
    lines.append("-" * 70)
    for e in expenses:
        date = e.get("date", "unknown")[:10]
        amount = f"₹{e.get('amount', 0)}"
        category = e.get("category", "unknown")[:13]
        mood = e.get("mood", "—")[:10]
        notes = e.get("notes", "")[:30]
        lines.append(f"{date:<12}| {amount:<7}| {category:<14}| {mood:<11}| {notes}")
    return "\n".join(lines)


def _empty_week_prompt() -> str:
    """Fallback prompt when no expenses exist for the week."""
    return f"""
{MASTER_SYSTEM_PROMPT.strip()}

TASK: WEEKLY SUMMARY — NO DATA

The user has no expenses logged this week.

Return ONLY this JSON:
{{
  "headline": "No expenses logged this week.",
  "top_insight": "Start logging your expenses to unlock behavioral insights.",
  "biggest_trigger": "unknown",
  "emotional_trend": "No data available",
  "one_win": "Ready to start tracking? Every expense tells a story.",
  "improvements": "Showing up to track is the first improvement.",
  "regressions": "No regressions to report without expense data.",
  "trigger_changes": "Triggers will appear once you log expenses.",
  "mood_changes": "Mood patterns need expense context.",
  "category_trends": "Category trends need logged purchases.",
  "personality_changes": "Personality forms after consistent logging.",
  "coach_recommendation": "Log one expense today with your mood attached."
}}
"""


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION RULES
# ─────────────────────────────────────────────────────────────────────────────

WEEKLY_SUMMARY_VALIDATION = {
    "required_fields": [
        "headline", "top_insight", "biggest_trigger", "emotional_trend", "one_win",
        "improvements", "regressions", "trigger_changes", "mood_changes",
        "category_trends", "personality_changes", "coach_recommendation",
    ],
    "no_empty_strings": True,
    "no_null_values": True,
    "headline_max_chars": 120,
    "top_insight_max_chars": 200,
    "biggest_trigger_max_words": 6,
    "emotional_trend_max_chars": 150,
    "one_win_max_chars": 180,
    "forbidden_phrases": [
        "overspent", "wasted", "irresponsible", "bad habit",
        "you need to save", "cut down", "stop spending"
    ]
}


def validate_weekly_summary(response: dict) -> tuple[bool, list]:
    """
    Validate a weekly summary response against quality rules.

    Returns:
        (is_valid: bool, errors: list of error strings)
    """
    errors = []
    rules = WEEKLY_SUMMARY_VALIDATION

    for field in rules["required_fields"]:
        if field not in response:
            errors.append(f"Missing required field: {field}")
        elif not response[field]:
            errors.append(f"Empty value for field: {field}")

    if "headline" in response and len(response["headline"]) > rules["headline_max_chars"]:
        errors.append(f"headline too long: {len(response['headline'])} chars")

    if "biggest_trigger" in response:
        word_count = len(response["biggest_trigger"].split())
        if word_count > rules["biggest_trigger_max_words"]:
            errors.append(f"biggest_trigger too long: {word_count} words (max {rules['biggest_trigger_max_words']})")

    full_text = " ".join(str(v) for v in response.values()).lower()
    for phrase in rules["forbidden_phrases"]:
        if phrase in full_text:
            errors.append(f"Forbidden phrase detected: '{phrase}'")

    return len(errors) == 0, errors


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE OUTPUT (for testing reference)
# ─────────────────────────────────────────────────────────────────────────────

WEEKLY_SUMMARY_EXAMPLE_OUTPUT = {
    "headline": "This was a week where stress found its outlet in food and late-night orders.",
    "top_insight": "Evening food orders spiked on days following high-stress academic events, suggesting food is your primary comfort mechanism.",
    "biggest_trigger": "exam stress",
    "emotional_trend": "High stress mid-week that eased into social spending over the weekend.",
    "one_win": "You had zero impulse purchases on Monday and Tuesday — two genuinely mindful days."
}
