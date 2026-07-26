"""
SpendMind — Insight Prompt
Analyzes a single expense for emotional/behavioral patterns.
Model: Gemini Flash (temperature=0.3 for consistent JSON)
"""

from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

INSIGHT_PROMPT_TEMPLATE = """
{master_system}

---

TASK: SINGLE EXPENSE BEHAVIORAL ANALYSIS

You are analyzing ONE expense to detect its emotional and psychological driver.

EXPENSE DATA:
- Amount: ₹{amount}
- Category: {category}
- Mood at time of purchase: {mood}
- User notes: {notes}
- Time of day: {time_of_day}
- Last 5 expenses (for pattern context): {last_5_expenses}

ANALYSIS INSTRUCTIONS:
1. Look at the mood + category + time combination first.
2. Check if last_5_expenses reveal a repeated pattern (e.g., always orders food when stressed).
3. Identify the psychological driver from this list:
   - comfort_spending (spending to soothe stress, anxiety, loneliness, tiredness, burnout, or late-night emotional hunger)
   - reward_seeking (self-reward after achievement, celebration, salary/income received, finishing a project, birthday, or earned relief)
   - social_pressure (spending due to friends, peer pressure, group plans, or wanting to belong)
   - impulse_buying (unplanned, desire-driven)
   - boredom_spending (purchasing to fill empty time)
   - habit_loop (automatic, situational habit)
   - neutral (no clear emotional driver)

4. intensity = how emotionally charged this purchase was (1=low, 5=high)
5. confidence = how confident you are in the pattern tag (0.0 to 1.0)

PATTERN TAG DECISION RULES:
- Stress, exam anxiety, loneliness, burnout, tiredness, sad mood, late-night emotional eating, or notes like "needed comfort" -> comfort_spending.
- Celebration, achievement, salary received, finished project, birthday, "treated myself", "deserved it", proud/relieved/happy after effort -> reward_seeking.
- Friends, peer pressure, group outing, splitting bills, everyone ordering, social mood -> social_pressure.
- Repeated similar purchases in the same context, especially small repeated food/chai/snack purchases -> habit_loop.
- Shopping or buying without planning, sudden desire, "saw it and bought it", random purchase -> impulse_buying.
- Bored mood with snack/scrolling/time-filling context -> boredom_spending unless it is clearly a repeated routine, then habit_loop.
- Do not label stress relief as reward_seeking unless the notes clearly show achievement or celebration.
- Do not infer emotions that are not in mood, notes, time, category, or recent expenses. If evidence is thin, lower confidence and use "may", "might", or "appears".

STRICT OUTPUT FORMAT — return ONLY this JSON, nothing else:
{{
  "insight": "1-2 warm, non-judgmental sentences explaining the WHY behind this expense",
  "pattern_tag": "one of: comfort_spending | reward_seeking | social_pressure | impulse_buying | boredom_spending | habit_loop | neutral",
  "intensity": <integer 1-5>,
  "confidence": <float 0.0-1.0>
}}

RULES:
- insight must be warm and human, never shaming
- insight must explain psychology, not just describe the purchase
- insight must not invent facts, exact frequencies, counts, percentages, or unsupported emotions
- avoid therapy jargon, saving advice, motivational quotes, and robotic wording
- If notes/category are in Hindi, write the insight in Hindi
- Return ONLY the JSON object — no markdown, no explanation, no extra text
"""


def build_insight_prompt(
    amount: float,
    category: str,
    mood: str,
    notes: str,
    time_of_day: str,
    last_5_expenses: list
) -> str:
    """
    Build the final insight prompt string ready to send to the model.

    Args:
        amount: expense amount in INR
        category: food, transport, shopping, entertainment, etc.
        mood: stressed, bored, happy, lonely, social, tired
        notes: user's free-text note about the expense
        time_of_day: morning | afternoon | evening | night | late_night
        last_5_expenses: list of dicts [{amount, category, mood, date}]

    Returns:
        Formatted prompt string
    """
    notes_clean = notes.strip() if notes else "No notes provided"
    mood_clean = mood.strip() if mood else "not specified"

    last_5_str = _format_last_5(last_5_expenses)

    return INSIGHT_PROMPT_TEMPLATE.format(
        master_system=MASTER_SYSTEM_PROMPT.strip(),
        amount=amount,
        category=category,
        mood=mood_clean,
        notes=notes_clean,
        time_of_day=time_of_day,
        last_5_expenses=last_5_str
    )


def _format_last_5(expenses: list) -> str:
    """Format last 5 expenses into readable context string."""
    if not expenses:
        return "No previous expenses available."

    lines = []
    for i, exp in enumerate(expenses[-5:], 1):
        amount = exp.get("amount", "?")
        category = exp.get("category", "unknown")
        mood = exp.get("mood", "not logged")
        date = exp.get("date", "recent")
        lines.append(f"  {i}. ₹{amount} on {category} | mood: {mood} | {date}")

    return "\n" + "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE INPUTS AND EXPECTED OUTPUTS (for testing reference)
# ─────────────────────────────────────────────────────────────────────────────

INSIGHT_EXAMPLES = [
    {
        "input": {
            "amount": 350,
            "category": "food",
            "mood": "stressed",
            "notes": "ordered Swiggy after exam",
            "time_of_day": "night",
            "last_5_expenses": [
                {"amount": 280, "category": "food", "mood": "stressed", "date": "2 days ago"},
                {"amount": 120, "category": "transport", "mood": "neutral", "date": "3 days ago"},
                {"amount": 400, "category": "food", "mood": "stressed", "date": "5 days ago"},
            ]
        },
        "expected_pattern_tag": "comfort_spending",
        "expected_intensity_range": [3, 5],
        "expected_insight_keywords": ["stress", "comfort", "exam", "pattern"]
    },
    {
        "input": {
            "amount": 1200,
            "category": "shopping",
            "mood": "happy",
            "notes": "treated myself after getting internship offer",
            "time_of_day": "afternoon",
            "last_5_expenses": []
        },
        "expected_pattern_tag": "reward_seeking",
        "expected_intensity_range": [2, 4],
        "expected_insight_keywords": ["reward", "celebrate", "achievement"]
    },
    {
        "input": {
            "amount": 600,
            "category": "food",
            "mood": "social",
            "notes": "went out with friends, everyone was ordering",
            "time_of_day": "evening",
            "last_5_expenses": []
        },
        "expected_pattern_tag": "social_pressure",
        "expected_intensity_range": [2, 4],
        "expected_insight_keywords": ["social", "friends", "group"]
    },
    {
        "input": {
            "amount": 50,
            "category": "food",
            "mood": "bored",
            "notes": "chai from canteen",
            "time_of_day": "afternoon",
            "last_5_expenses": [
                {"amount": 50, "category": "food", "mood": "bored", "date": "yesterday"},
                {"amount": 50, "category": "food", "mood": "neutral", "date": "2 days ago"},
            ]
        },
        "expected_pattern_tag": "habit_loop",
        "expected_intensity_range": [1, 2],
        "expected_insight_keywords": ["habit", "routine", "automatic"]
    },
    {
        "input": {
            "amount": 30,
            "category": "food",
            "mood": "neutral",
            "notes": "",
            "time_of_day": "morning",
            "last_5_expenses": []
        },
        "expected_pattern_tag": "neutral",
        "expected_intensity_range": [1, 2],
        "expected_insight_keywords": []
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# EDGE CASE HANDLING RULES (documented for prompt tuning reference)
# ─────────────────────────────────────────────────────────────────────────────

INSIGHT_EDGE_CASES = {
    "missing_mood": "Treat as 'not specified' — do not assume emotional state",
    "empty_notes": "Rely on category + time_of_day + last_5 for pattern detection",
    "empty_last_5": "Analyze only current expense — lower confidence score expected",
    "very_small_amount": "₹10–₹50 likely habit/neutral — do not over-psychologize",
    "hindi_notes": "Detect Hindi in notes field — respond insight in Hindi",
    "contradictory_mood": "e.g., mood=happy but category=medicine — trust category over mood for pattern",
    "late_night_food": "time_of_day=late_night + food = strong comfort_spending signal regardless of mood",
    "high_amount_impulse": "amount > ₹2000 + no notes + mood=bored = strong impulse_buying signal"
}
