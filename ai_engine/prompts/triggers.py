""" SpendMind — detect_triggers() Identifies top 3 behavioral spending triggers from 30 days of expense data. Uses the router's reasoning provider for cross-expense pattern analysis. Called by Person B's GET /insights/triggers endpoint. """
from typing import Optional
from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.trigger_prompt import build_trigger_prompt, validate_triggers
from ai_engine.prompts.base import GRACEFUL_DEFAULTS


def detect_triggers(expenses_last_30_days: list) -> list:
    """ Detect top 3 behavioral spending triggers from 30 days of expense data.

    Args:
        expenses_last_30_days: list of expense dicts, ideally 20-30 entries.
        Each: {amount, category, mood, notes, date, time_of_day, day_of_week}

    Returns:
        list of 3 trigger dicts: [
            {
                "trigger": str,  # trigger name (5 words max)
                "behavior": str,  # specific spending behavior caused
                "frequency": str,  # how often it occurs
                "emotion": str  # primary emotion (1-2 words)
            },
            ...
        ]
    """
    if len(expenses_last_30_days) < 5:  # Not enough data for meaningful trigger detection
        return _insufficient_data_triggers()

    # Build prompt
    prompt, stats = build_trigger_prompt(expenses_last_30_days)

    # Route to the configured reasoning provider for pattern analysis
    result = route_prompt(task_type="reasoning", prompt=prompt)

    if not result["success"] or result["parsed"] is None:
        return GRACEFUL_DEFAULTS["triggers"]

    parsed = result["parsed"]

    # Validate response
    if not isinstance(parsed, list):
        return GRACEFUL_DEFAULTS["triggers"]

    is_valid, errors = validate_triggers(parsed)
    if not is_valid:
        parsed = _repair_triggers(parsed)

    return parsed


def _repair_triggers(triggers: list) -> list:
    """ Attempt to repair a partially valid trigger list. Fills missing fields with safe defaults. """
    repaired = []
    defaults = GRACEFUL_DEFAULTS["triggers"]

    for i, trigger in enumerate(triggers[:3]):
        repaired_trigger = {
            "trigger": trigger.get("trigger") or defaults[0]["trigger"],
            "behavior": trigger.get("behavior") or "Spending pattern detected",
            "frequency": trigger.get("frequency") or "occasional",
            "emotion": trigger.get("emotion") or "unknown"
        }
        repaired.append(repaired_trigger)

    # Pad to 3 if needed
    while len(repaired) < 3:
        repaired.append(defaults[0].copy())

    return repaired


def _insufficient_data_triggers() -> list:
    """Return informative placeholder triggers when data is insufficient."""
    return [
        {
            "trigger": "Insufficient data",
            "behavior": "Log at least 10 expenses to detect behavioral triggers",
            "frequency": "unknown",
            "emotion": "unknown"
        },
        {
            "trigger": "Keep logging",
            "behavior": "Your patterns will emerge after 2-3 weeks of consistent logging",
            "frequency": "unknown",
            "emotion": "unknown"
        },
        {
            "trigger": "Almost there",
            "behavior": "Add notes and mood tags for richer trigger detection",
            "frequency": "unknown",
            "emotion": "unknown"
        }
    ]
