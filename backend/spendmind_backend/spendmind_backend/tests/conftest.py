import os

import pytest


os.environ["ENV"] = "development"
os.environ["FIREBASE_CREDENTIALS_PATH"] = ""
os.environ["FIREBASE_CREDENTIALS_JSON"] = ""


def _mock_route_prompt(task_type: str, prompt: str, system_override=None, max_retries: int = 2):
    parsed_by_task = {
        "insight": {
            "observation": "This expense was logged with the supplied details.",
            "interpretation": "Patterns will become clearer as more history is available.",
            "reflection": "Keep adding mood and notes for sharper reads.",
            "insight": "This expense is logged. Chayva will connect it to your patterns as more history builds.",
            "pattern_tag": "neutral",
            "intensity": 1,
            "confidence": 0.4,
        },
        "summary": {
            "headline": "A regular week of spending.",
            "top_insight": "Patterns are still forming from the current logged expenses.",
            "biggest_trigger": "patterns forming",
            "emotional_trend": "Not enough mood history yet.",
            "one_win": "You kept tracking, which builds useful awareness.",
            "improvements": "Tracking consistency improved.",
            "regressions": "No clear regression detected.",
            "trigger_changes": "Trigger patterns are still forming.",
            "mood_changes": "Mood patterns are still forming.",
            "category_trends": "Category trends need more logged data.",
            "personality_changes": "Personality signals are still evolving.",
            "coach_recommendation": "Add a short note when a spend feels emotionally driven.",
        },
        "personality": {
            "type": "Comfort Spender",
            "description": "Your current profile is still early, with emotional context beginning to appear.",
            "traits": ["building awareness", "context-aware"],
        },
        "reasoning": [
            {
                "trigger": "Insufficient data",
                "behavior": "Log more expenses to detect patterns",
                "frequency": "unknown",
                "emotion": "unknown",
            },
            {
                "trigger": "Keep logging",
                "behavior": "Mood and notes will sharpen this map",
                "frequency": "unknown",
                "emotion": "unknown",
            },
            {
                "trigger": "Almost there",
                "behavior": "More history will reveal repeated cues",
                "frequency": "unknown",
                "emotion": "unknown",
            },
        ],
        "fast": {"should_nudge": False, "message": None},
    }
    parsed = parsed_by_task.get(task_type, parsed_by_task["insight"])
    return {
        "success": True,
        "raw_text": "",
        "parsed": parsed,
        "provider": "test",
        "model": "mock",
        "latency_ms": 0,
        "fallback_used": False,
    }


@pytest.fixture(autouse=True)
def mock_ai_routing(monkeypatch):
    monkeypatch.setattr("ai_engine.prompts.analyze.route_prompt", _mock_route_prompt)
    monkeypatch.setattr("ai_engine.prompts.summarize.route_prompt", _mock_route_prompt)
    monkeypatch.setattr("ai_engine.prompts.personality.route_prompt", _mock_route_prompt)
    monkeypatch.setattr("ai_engine.prompts.triggers.route_prompt", _mock_route_prompt)
    monkeypatch.setattr("ai_engine.prompts.nudge.route_prompt", _mock_route_prompt)
    monkeypatch.setattr("backend.spendmind_backend.spendmind_backend.services.ai_service.route_prompt", _mock_route_prompt, raising=False)
