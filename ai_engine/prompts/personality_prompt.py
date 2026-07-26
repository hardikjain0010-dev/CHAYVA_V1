"""
SpendMind — Personality Classification Prompt
Classifies user into 1 of 4 spending personality types.
Triggers after 15–20 logged expenses.
Model: Gemini Flash (temperature=0.3 for consistent classification)
"""

from ai_engine.prompts.base import MASTER_SYSTEM_PROMPT

# ─────────────────────────────────────────────────────────────────────────────
# PERSONALITY TYPE DEFINITIONS (ground truth for classification)
# ─────────────────────────────────────────────────────────────────────────────

PERSONALITY_TYPES = {
    "Comfort Spender": {
        "core_driver": "Emotional regulation — spending reduces negative emotions",
        "signals": [
            "high frequency of food/beverage purchases when mood is stressed or lonely",
            "purchases cluster around stressful events (exams, deadlines)",
            "late-night orders common",
            "notes mention tiredness, stress, need to decompress",
            "categories: food delivery, snacks, chai, comfort items"
        ],
        "description_template": "You tend to reach for small purchases when emotions run high — and that's deeply human. Food, treats, and small comforts are your way of regulating stress.",
        "traits": ["emotionally aware", "uses spending as self-soothing", "stress-triggered buyer", "food and comfort categories dominate"]
    },
    "Impulse Buyer": {
        "core_driver": "Momentary desire — purchases are unplanned and desire-driven",
        "signals": [
            "high variance in purchase categories (no clear pattern)",
            "large purchases with no notes or context",
            "purchases happen at irregular times",
            "mood is often 'bored' or 'happy' (not necessarily stressed)",
            "categories: shopping, entertainment, random small purchases"
        ],
        "description_template": "Your purchases often happen in the moment — something catches your eye or a feeling strikes, and you act. This spontaneity can feel exciting but sometimes leaves you wondering why you bought it.",
        "traits": ["spontaneous", "variety-seeking", "present-focused", "responds to stimulation and novelty"]
    },
    "Reward Seeker": {
        "core_driver": "Self-reward — spending as celebration or deserved treat after effort",
        "signals": [
            "purchases follow achievement events (exam done, project submitted)",
            "mood is often 'happy' or notes mention accomplishment",
            "purchases tend to be slightly higher value than usual",
            "notes mention 'deserved', 'treated myself', 'finally done'",
            "categories: dining out, shopping, experiences"
        ],
        "description_template": "You use spending as a reward system — and you work hard for it. Purchases tend to follow effort and achievement. This is healthy as long as the rewards stay proportional.",
        "traits": ["achievement-driven", "uses spending as motivation", "treat-yourself mentality", "spending tied to accomplishment"]
    },
    "Social Spender": {
        "core_driver": "Social context — spending driven by group presence and peer dynamics",
        "signals": [
            "purchases cluster on weekends or evenings with friends",
            "mood is often 'social' or notes mention friends/group",
            "spending amount is higher when in group settings",
            "categories: dining out, events, activities, group orders",
            "notes mention peer names, outings, group activities"
        ],
        "description_template": "Your spending is deeply tied to your social world — you spend more when you're with people you enjoy. Social experiences are genuinely valuable, and this pattern reflects how much you value connection.",
        "traits": ["social and relationship-oriented", "spending amplified by group", "weekend spender", "experiences over things"]
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

PERSONALITY_PROMPT_TEMPLATE = """
{master_system}

---

TASK: SPENDING PERSONALITY CLASSIFICATION

You are classifying a user's spending personality based on 30 days of expense data.
You must choose EXACTLY ONE of these four personality types — no custom types allowed:
1. Comfort Spender
2. Impulse Buyer
3. Reward Seeker
4. Social Spender

SPENDING PROFILE DATA:
{spending_profile_formatted}

PERSONALITY TYPE DEFINITIONS:

1. COMFORT SPENDER
   Driver: Emotional regulation — spending reduces negative emotions
   Key signals: stress-triggered food orders, late-night purchases, comfort categories dominate, mood often stressed/lonely

2. IMPULSE BUYER
   Driver: Momentary desire — unplanned, spontaneous purchases
   Key signals: high category variance, purchases with no context, irregular timing, bored/excited mood, large amounts with no notes

3. REWARD SEEKER
   Driver: Self-reward after achievement or effort
   Key signals: purchases follow accomplishments, mood=happy, notes mention achievement, slightly higher amounts than usual

4. SOCIAL SPENDER
   Driver: Group presence and peer dynamics
   Key signals: weekend/evening clustering, social mood, higher spend in group settings, food/experience categories

CLASSIFICATION INSTRUCTIONS:
1. Analyze the spending profile data above.
2. Score each personality type 0–10 based on how well the signals match.
3. Select the personality type with the HIGHEST score.
4. Write a description that feels personally relevant to THIS user's specific patterns.
5. List 3–4 traits that are true for this user (from the pattern data, not generic).

IMPORTANT: If the data shows mixed signals, pick the DOMINANT pattern (highest frequency/amount).
Minimum 15 expenses required for reliable classification — note this in confidence if under 15.

STRICT OUTPUT FORMAT — return ONLY this JSON, nothing else:
EVIDENCE RULES:
- Sound like a behavioral psychologist noticing patterns, not a financial advisor giving money advice.
- Never invent percentages, counts, ratios, rankings, or trend claims in the description.
- You may mention a number only if it appears in SPENDING PROFILE DATA exactly as a computed value.
- Prefer qualitative language such as "often", "seems", "leans toward", "shows up around", or "appears tied to" when explaining patterns.
- Do not state that a mood or motive is certain unless the data directly supports it.
- Explain why the personality type fits emotionally and behaviorally.

{{
  "type": "one of: Comfort Spender | Impulse Buyer | Reward Seeker | Social Spender",
  "description": "2–3 sentences, warm and specific to this user's actual patterns",
  "traits": ["trait 1", "trait 2", "trait 3", "trait 4"]
}}

RULES:
- type must be EXACTLY one of the four allowed values (case-sensitive)
- description must reference the user's actual data, not be generic
- traits must be 3–4 items, each under 8 words
- Never use negative framing ("bad spender", "you can't control yourself")
- Never fabricate statistics or exact shares in the description
- Avoid therapy jargon, saving advice, and corporate tone
- Return ONLY the JSON — no markdown, no explanation
"""


def build_personality_prompt(spending_profile: dict) -> str:
    """
    Build personality classification prompt from a spending profile dict.

    Args:
        spending_profile: {
            "category_totals": {"food": 3200, "shopping": 1400, ...},
            "mood_frequencies": {"stressed": 8, "happy": 4, "bored": 3, ...},
            "impulse_count": 5,
            "total_expenses": 24,
            "weekend_spend_ratio": 0.6,
            "night_spend_ratio": 0.4,
            "avg_amount": 280,
            "top_notes_keywords": ["exam", "friends", "stressed", "treated"]
        }

    Returns:
        Formatted prompt string
    """
    profile_formatted = _format_spending_profile(spending_profile)

    return PERSONALITY_PROMPT_TEMPLATE.format(
        master_system=MASTER_SYSTEM_PROMPT.strip(),
        spending_profile_formatted=profile_formatted
    )


def _format_spending_profile(profile: dict) -> str:
    """Format spending profile dict into readable prompt section."""
    lines = []

    total = profile.get("total_expenses", 0)
    lines.append(f"Total expenses analyzed: {total}")
    lines.append(f"Average transaction amount: ₹{profile.get('avg_amount', 'unknown')}")
    lines.append(f"Impulse purchases detected: {profile.get('impulse_count', 0)}")
    lines.append(f"Weekend spending ratio: {profile.get('weekend_spend_ratio', 0):.0%} of all spending")
    lines.append(f"Night-time spending ratio: {profile.get('night_spend_ratio', 0):.0%} of all spending")
    lines.append("")

    category_totals = profile.get("category_totals", {})
    if category_totals:
        lines.append("SPENDING BY CATEGORY:")
        sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        for cat, total_amt in sorted_cats:
            lines.append(f"  {cat}: ₹{total_amt}")
    lines.append("")

    mood_freqs = profile.get("mood_frequencies", {})
    if mood_freqs:
        lines.append("MOOD FREQUENCIES DURING PURCHASES:")
        sorted_moods = sorted(mood_freqs.items(), key=lambda x: x[1], reverse=True)
        for mood, count in sorted_moods:
            lines.append(f"  {mood}: {count} times")
    lines.append("")

    keywords = profile.get("top_notes_keywords", [])
    if keywords:
        lines.append(f"COMMON NOTES KEYWORDS: {', '.join(keywords)}")

    return "\n".join(lines)


def get_minimum_expense_count() -> int:
    """Returns minimum expenses needed for reliable personality classification."""
    return 15


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE PROFILES AND EXPECTED CLASSIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────

PERSONALITY_EXAMPLES = [
    {
        "profile": {
            "category_totals": {"food": 4200, "snacks": 800, "medicine": 200},
            "mood_frequencies": {"stressed": 10, "tired": 6, "lonely": 3},
            "impulse_count": 2,
            "total_expenses": 22,
            "weekend_spend_ratio": 0.25,
            "night_spend_ratio": 0.55,
            "avg_amount": 240,
            "top_notes_keywords": ["exam", "stressed", "needed something", "couldn't sleep"]
        },
        "expected_type": "Comfort Spender"
    },
    {
        "profile": {
            "category_totals": {"shopping": 3800, "food": 1200, "entertainment": 900, "gadgets": 600},
            "mood_frequencies": {"bored": 8, "happy": 5, "excited": 4},
            "impulse_count": 12,
            "total_expenses": 25,
            "weekend_spend_ratio": 0.45,
            "night_spend_ratio": 0.3,
            "avg_amount": 380,
            "top_notes_keywords": ["saw it online", "looked nice", "randomly", "on sale"]
        },
        "expected_type": "Impulse Buyer"
    },
    {
        "profile": {
            "category_totals": {"food": 2800, "shopping": 1600, "entertainment": 800},
            "mood_frequencies": {"happy": 9, "social": 7, "excited": 4},
            "impulse_count": 3,
            "total_expenses": 20,
            "weekend_spend_ratio": 0.7,
            "night_spend_ratio": 0.2,
            "avg_amount": 320,
            "top_notes_keywords": ["friends", "outing", "everyone was there", "group dinner"]
        },
        "expected_type": "Social Spender"
    },
    {
        "profile": {
            "category_totals": {"dining": 3200, "shopping": 1800, "entertainment": 600},
            "mood_frequencies": {"happy": 11, "proud": 5, "relieved": 4},
            "impulse_count": 4,
            "total_expenses": 18,
            "weekend_spend_ratio": 0.5,
            "night_spend_ratio": 0.2,
            "avg_amount": 350,
            "top_notes_keywords": ["finally done", "deserved it", "submitted project", "treated myself"]
        },
        "expected_type": "Reward Seeker"
    }
]
