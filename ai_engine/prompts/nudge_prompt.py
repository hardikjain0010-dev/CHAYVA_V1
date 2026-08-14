"""
SpendMind — Predictive Nudge Prompt
Predicts whether a spending nudge is relevant RIGHT NOW based on trigger patterns.
Model: Groq LLaMA 3 (fastest — nudges need real-time response under 1 second)
Temperature: 0.4 (some warmth, but consistent logic)
"""

from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT

# ─────────────────────────────────────────────────────────────────────────────
# NUDGE PHILOSOPHY
# ─────────────────────────────────────────────────────────────────────────────

NUDGE_PHILOSOPHY = """
NUDGE PHILOSOPHY:
- A nudge is a gentle, predictive observation — NOT a warning or restriction.
- It says "hey, I notice this pattern" — not "don't spend money."
- It should feel like a wise friend noticing something, not an app lecturing you.
- A nudge MUST be triggered by a specific pattern match — never send generic nudges.
- When in doubt, return should_nudge: false. Silence is better than irrelevance.
- Maximum 1 nudge per 3-hour window to avoid annoyance.
"""

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

NUDGE_PROMPT_TEMPLATE = """
{master_system}

{nudge_philosophy}

---

TASK: PREDICTIVE NUDGE DECISION

Decide whether to send a behavioral nudge RIGHT NOW based on the user's patterns.

CURRENT CONTEXT:
- Current time: {current_time} ({time_of_day_label})
- Current day: {current_day}
- Current hour: {current_hour}

USER'S TOP TRIGGER PATTERNS:
{trigger_patterns_formatted}

MATCHING INSTRUCTIONS:
1. Compare current time + day against each trigger pattern.
2. A match occurs when:
   - The current time falls within the trigger's typical time window (±1 hour), AND
   - The current day matches or is similar to the trigger's day pattern
3. If a match is found: set should_nudge = true and write a warm nudge message.
4. If NO match: set should_nudge = false and message = null.

NUDGE MESSAGE REQUIREMENTS (only when should_nudge = true):
- Exactly two sentences maximum — first sentence names the pattern warmly, second offers a gentle reflective question or observation.
- Must reference the SPECIFIC trigger that matched (use the trigger name from the pattern).
- Must be psychologically aware: acknowledge the emotion or need behind the pattern.
- Must be warm, supportive, and non-judgmental — like a caring friend noticing something.
- Must be predictive and observational, never prescriptive or restrictive.
- Maximum 120 characters total (to fit in push notifications).
- Can include 1 relevant emoji that matches the emotion or context.
- Must NOT sound like a warning, restriction, or financial advice.
- Avoid generic phrases like "be careful" or "think twice."

PSYCHOLOGICALLY AWARE NUDGE STRUCTURE:
1. Name the pattern with warmth: "It's [time of day] — your [trigger name] pattern may be active"
2. Add a gentle reflective nudge: "Intentional choice or autopilot?", "Worth checking in with yourself?", "Hope it's a conscious treat"

GOOD NUDGE EXAMPLES (warm, psychologically aware, two sentences max):
✓ "Late-night study mode 🌙 — stress often leads to food orders now. Intentional comfort or autopilot?"
✓ "Friday evening social energy ✨ — you tend to spend more with friends tonight. Hope it's a joyful choice."
✓ "Afternoon lull 🍵 — boredom sometimes triggers snack runs around now. Checking in: truly hungry or just needing a break?"
✓ "Post-exam relief time 🎉 — you often celebrate with a treat. Enjoy it mindfully."
✓ "Weekend wind-down 🌿 — evenings like this often bring comfort spending. Awareness is your superpower."

BAD NUDGE EXAMPLES (never generate these):
✗ "You're about to overspend again"
✗ "Stop yourself before you order food"
✗ "You have a spending problem at this time"
✗ "Warning: high-risk spending period"
✗ Generic: "You spend a lot. Be careful."
✗ Too brief: "Late night study 🍕" (lacks warmth and psychological awareness)
✗ Preachy: "Think about your financial goals before spending"

STRICT OUTPUT FORMAT — return ONLY one of these two JSON shapes, nothing else:

If nudge is relevant:
{{
  "should_nudge": true,
  "message": "warm, specific, psychologically aware nudge — max two sentences"
}}

If no pattern match:
{{
  "should_nudge": false,
  "message": null
}}

Return ONLY the JSON — no markdown, no explanation, no extra text.
"""


def build_nudge_prompt(
    current_time: str,
    current_day: str,
    trigger_patterns: list
) -> str:
    """
    Build the nudge decision prompt.

    Args:
        current_time: "21:30" format (24h)
        current_day: "Friday", "Monday", etc.
        trigger_patterns: list of trigger dicts from detect_triggers()
                          [{trigger, behavior, frequency, emotion}]

    Returns:
        Formatted prompt string
    """
    current_hour = int(current_time.split(":")[0]) if ":" in current_time else 20
    time_of_day_label = _get_time_of_day_label(current_hour)
    trigger_patterns_formatted = _format_trigger_patterns(trigger_patterns)

    return NUDGE_PROMPT_TEMPLATE.format(
        master_system=MASTER_SYSTEM_PROMPT.strip(),
        nudge_philosophy=NUDGE_PHILOSOPHY.strip(),
        current_time=current_time,
        time_of_day_label=time_of_day_label,
        current_day=current_day,
        current_hour=current_hour,
        trigger_patterns_formatted=trigger_patterns_formatted
    )


def _get_time_of_day_label(hour: int) -> str:
    """Convert hour to human-readable time-of-day label."""
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    elif 21 <= hour < 24:
        return "night"
    else:
        return "late night"



def _format_trigger_patterns(patterns: list) -> str:
    """Format trigger patterns into readable prompt section."""
    if not patterns:
        return "No trigger patterns available yet — user needs more logged expenses."

    lines = []
    for i, pattern in enumerate(patterns, 1):
        lines.append(f"TRIGGER {i}: {pattern.get('trigger', 'unknown')}")
        lines.append(f"  Behavior: {pattern.get('behavior', 'unknown')}")
        lines.append(f"  Frequency: {pattern.get('frequency', 'unknown')}")
        lines.append(f"  Emotion: {pattern.get('emotion', 'unknown')}")
        lines.append("")
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# PRE-MATCH LOGIC (fast Python check before hitting model)
# This saves API calls — if no pattern is plausibly active, skip the model call
# ─────────────────────────────────────────────────────────────────────────────

TIME_WINDOW_KEYWORDS = {
    "late_night": ["late night", "midnight", "after 10", "after 11", "11pm", "10pm"],
    "night": ["night", "late night", "after 9", "after 10", "after 11", "9pm", "10pm", "11pm"],
    "evening": ["evening", "7pm", "8pm", "9pm", "after dinner", "7-9"],
    "afternoon": ["afternoon", "2pm", "3pm", "4pm", "2-4", "post lunch"],
    "morning": ["morning", "breakfast", "9am", "10am"],
    "weekend": ["saturday", "sunday", "weekend"],
    "weekday": ["monday", "tuesday", "wednesday", "thursday", "friday", "weekday"],
}

DAY_KEYWORDS = {
    "Monday": ["monday", "weekday"],
    "Tuesday": ["tuesday", "weekday"],
    "Wednesday": ["wednesday", "weekday", "midweek"],
    "Thursday": ["thursday", "weekday"],
    "Friday": ["friday", "weekend", "end of week"],
    "Saturday": ["saturday", "weekend"],
    "Sunday": ["sunday", "weekend"],
}


def should_attempt_nudge(current_time: str, current_day: str, trigger_patterns: list) -> bool:
    """
    Fast Python pre-check — decides if it's even worth calling the model.
    Returns True if at least one trigger pattern might match current context.
    Saves ~90% of API calls when user is in a non-trigger period.

    Args:
        current_time: "21:30" format
        current_day: "Friday"
        trigger_patterns: list from detect_triggers()

    Returns:
        bool — True = call model, False = skip (return should_nudge: false immediately)
    """
    if not trigger_patterns:
        return False

    current_hour = int(current_time.split(":")[0]) if ":" in current_time else 0
    current_time_label = _get_time_of_day_label(current_hour)
    current_day_lower = current_day.lower()

    for pattern in trigger_patterns:
        frequency_lower = pattern.get("frequency", "").lower()
        trigger_lower = pattern.get("trigger", "").lower()
        behavior_lower = pattern.get("behavior", "").lower()
        combined = " ".join(part for part in [frequency_lower, trigger_lower, behavior_lower] if part)

        # Check time match
        time_keywords = TIME_WINDOW_KEYWORDS.get(current_time_label, [])
        time_match = any(kw in combined for kw in time_keywords)

        # Check day match
        day_keywords = DAY_KEYWORDS.get(current_day, [])
        day_match = any(kw in combined for kw in day_keywords)

        if time_match or day_match:
            return True

    return False


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE SCENARIOS
# ─────────────────────────────────────────────────────────────────────────────

NUDGE_EXAMPLES = [
    {
        "input": {
            "current_time": "21:45",
            "current_day": "Wednesday",
            "trigger_patterns": [
                {
                    "trigger": "Late-night exam stress",
                    "behavior": "Orders food delivery within 30 minutes of finishing study sessions after 10 PM",
                    "frequency": "4-5 times per week during exam periods",
                    "emotion": "stress, relief"
                }
            ]
        },
        "expected": {
            "should_nudge": True,
            "message": "Late-night mode 🌙 — you often order food around this time after studying"
        }
    },
    {
        "input": {
            "current_time": "14:30",
            "current_day": "Tuesday",
            "trigger_patterns": [
                {
                    "trigger": "Afternoon boredom",
                    "behavior": "Makes small impulse purchases between 2-4 PM on weekdays",
                    "frequency": "3-4 times per week",
                    "emotion": "boredom"
                }
            ]
        },
        "expected": {
            "should_nudge": True,
            "message": "Afternoon lull 🍵 — this is usually chai-and-snack time for you"
        }
    },
    {
        "input": {
            "current_time": "10:00",
            "current_day": "Monday",
            "trigger_patterns": [
                {
                    "trigger": "Weekend social outings",
                    "behavior": "Spends more on food and entertainment on Saturday evenings",
                    "frequency": "every Saturday evening",
                    "emotion": "social excitement"
                }
            ]
        },
        "expected": {
            "should_nudge": False,
            "message": None
        }
    }
]
