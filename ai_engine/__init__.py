"""SpendMind AI Engine public API."""

from ai_engine.prompts.analyze import analyze_expense
from ai_engine.prompts.nudge import predict_nudge
from ai_engine.prompts.personality import (
    build_spending_profile_from_expenses,
    classify_personality,
)
from ai_engine.prompts.summarize import generate_weekly_summary
from ai_engine.prompts.triggers import detect_triggers

__all__ = [
    "analyze_expense",
    "build_spending_profile_from_expenses",
    "classify_personality",
    "detect_triggers",
    "generate_weekly_summary",
    "predict_nudge",
]
