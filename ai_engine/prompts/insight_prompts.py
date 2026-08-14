"""
SpendMind — Insight Prompt
Analyzes a single expense for emotional/behavioral patterns.
Model: Gemini Flash (temperature=0.7)
"""

from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT
from ai_engine.prompts.insight_context import build_evidence_bundle, format_evidence_for_prompt

INSIGHT_PROMPT_TEMPLATE = """
{master_system}

---

TASK: SINGLE EXPENSE BEHAVIORAL ANALYSIS

You are analyzing ONE expense. Use ONLY the factual evidence below.
Do NOT assume late-night psychology unless the exact time period is Night AND other evidence supports it.
Do NOT diagnose the user. Do NOT shame. Do NOT call necessary expenses bad spending.

COMPUTED EVIDENCE (facts — cite these, do not invent others):
{evidence_block}

EXPENSE CLASSIFICATION VS BEHAVIOR:
- Expense classification answers what kind of spend this is: essential, routine, discretionary, or uncertain.
- Behavioral significance answers how much interpretation is warranted: low, moderate, high, or unknown.
- Discretionary does not mean bad. Essential does not mean good. These are not moral labels.
- Do not infer psychology from classification alone.

ANALYSIS APPROACH:
1. OBSERVATION — state only what the evidence shows (amount, category, time, notes, repetition counts).
2. INTERPRETATION — a cautious behavioral explanation using words like may, might, appears, seems.
   Skip interpretation when evidence is thin (e.g., first expense, necessary category, no mood/notes).
3. REFLECTION — one small awareness-oriented next step. Not a command. Not generic saving advice.

EVIDENCE HIERARCHY:
- Strongest: repeated category + repeated timing + mood/notes support.
- Medium: repeated category or amount deviation with some contextual support.
- Weak: one transaction, missing mood/notes, or time-only evidence.
- For routine_or_necessary spending, prefer neutral interpretation unless there is explicit contradictory evidence.
- If behavioral significance is low or unknown, keep interpretation minimal and uncertainty-forward.
- If behavioral significance is high, name the repeated evidence that makes it worth reflecting on.

TIME PERIOD GUIDANCE (use actual time period from evidence — never assume Night):
- Morning: commute, breakfast, routine, planned essentials
- Afternoon: college/work, lunch, errands, scheduled purchases
- Evening: social plans, transition after day, reward after effort
- Night: convenience, winding down, delivery — ONLY mention if time period is actually Night

CATEGORY GUIDANCE:
- Rent, utilities, groceries, transport/petrol, health, subscriptions are often necessary.
  Treat them as routine unless notes/mood/repetition suggest otherwise.
- Do not psychologize a necessary expense without specific evidence.
- Food and shopping can be routine, discretionary, or uncertain depending on history and context.

PATTERN TAG (pick ONE):
comfort_spending | reward_seeking | social_pressure | impulse_buying | boredom_spending | habit_loop | neutral

TAG RULES:
- Use neutral for necessary/routine expenses with thin emotional evidence.
- Use neutral for routine_or_necessary spending unless notes/mood/history clearly support a behavioral pattern.
- Use habit_loop only when repetition evidence exists in the computed facts.
- Lower confidence when mood/notes are missing or history is empty.
- Never tag based on time alone.

VARIETY RULE:
- Reference the specific category, notes, exact time, or repetition counts in your text.
- Do NOT reuse generic late-night food language unless this expense is actually Night food with supporting evidence.
- If two expenses differ in time period or notes, your wording must differ meaningfully.

STRICT OUTPUT FORMAT — return ONLY this JSON:
{{
  "observation": "1 sentence of factual observation from evidence only",
  "interpretation": "1 sentence cautious behavioral explanation, or empty string if evidence is too thin",
  "reflection": "1 short awareness-oriented suggestion, specific to this expense",
  "insight": "1-3 warm conversational sentences combining observation + interpretation for the UI",
  "pattern_tag": "one allowed tag",
  "intensity": <integer 1-5>,
  "confidence": <float 0.0-1.0>
}}

Return ONLY the JSON object — no markdown, no extra text.
"""


def build_insight_prompt(
    amount: float,
    category: str,
    mood: str,
    notes: str,
    time_of_day: str,
    last_5_expenses: list,
    date: str | None = None,
    classification_override: dict | None = None,
) -> str:
    evidence = build_evidence_bundle(
        amount=amount,
        category=category,
        mood=mood,
        notes=notes,
        date_value=date,
        recent_expenses=last_5_expenses,
        classification_override=classification_override,
    )
    if evidence["time_period"] == "Unknown" and time_of_day:
        legacy_map = {
            "morning": "Morning",
            "afternoon": "Afternoon",
            "evening": "Evening",
            "night": "Night",
            "late_night": "Night",
        }
        evidence["time_period"] = legacy_map.get(time_of_day.lower(), evidence["time_period"])

    evidence_block = format_evidence_for_prompt(evidence)

    return INSIGHT_PROMPT_TEMPLATE.format(
        master_system=MASTER_SYSTEM_PROMPT.strip(),
        evidence_block=evidence_block,
    )


INSIGHT_EXAMPLES = [
    {
        "input": {
            "amount": 350,
            "category": "food",
            "mood": "stressed",
            "notes": "ordered Swiggy after exam",
            "date": "2026-08-04T21:15:00",
            "last_5_expenses": [
                {"amount": 280, "category": "food", "mood": "stressed", "date": "2026-08-03T20:45:00"},
                {"amount": 400, "category": "food", "mood": "stressed", "date": "2026-08-01T21:30:00"},
            ],
        },
        "expected_pattern_tag": "comfort_spending",
    },
    {
        "input": {
            "amount": 12000,
            "category": "Rent",
            "mood": "",
            "notes": "monthly rent",
            "date": "2026-08-04T09:00:00",
            "last_5_expenses": [],
        },
        "expected_pattern_tag": "neutral",
    },
]

INSIGHT_EDGE_CASES = {
    "missing_mood": "Treat as 'not specified' — do not assume emotional state",
    "empty_notes": "Rely on category, exact time, and repetition evidence only",
    "empty_last_5": "Analyze only current expense — lower confidence",
    "very_small_amount": "₹10–₹50 may be habit/neutral — do not over-psychologize",
    "hindi_notes": "Detect Hindi in notes — respond in Hindi",
    "necessary_category": "Rent/groceries/transport default to neutral unless strong emotional evidence",
    "night_food": "Only interpret as comfort if Night + mood/notes/repetition support it",
}
