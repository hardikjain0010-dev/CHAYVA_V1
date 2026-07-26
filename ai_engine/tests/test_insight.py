"""
SpendMind — Test Suite: analyze_expense()
20 test cases covering happy paths, edge cases, and failure scenarios.

Run from ai-engine directory:
    python -m pytest tests/test_insight.py -v
"""

import json
import pytest
from unittest.mock import patch, MagicMock


# ─── Mock route_prompt to avoid real API calls in unit tests ───────────────
def make_mock_result(parsed: dict) -> dict:
    return {
        "success": True,
        "raw_text": json.dumps(parsed),
        "parsed": parsed,
        "provider": "gemini",
        "model": "gemini-2.0-flash",
        "latency_ms": 120,
        "fallback_used": False
    }

def make_failed_result() -> dict:
    return {
        "success": False,
        "raw_text": "",
        "parsed": None,
        "provider": "gemini",
        "model": "gemini-2.0-flash",
        "latency_ms": 50,
        "fallback_used": True,
        "error": "API timeout"
    }


VALID_TAGS = {
    "comfort_spending", "reward_seeking", "social_pressure",
    "impulse_buying", "boredom_spending", "habit_loop", "neutral"
}

# ─────────────────────────────────────────────────────────────────────────────
# TEST CASES
# ─────────────────────────────────────────────────────────────────────────────

class TestAnalyzeExpenseHappyPath:

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_01_stress_food_comfort_spending(self, mock_route):
        """Stress + food at night = comfort_spending"""
        mock_route.return_value = make_mock_result({
            "insight": "This looks like stress-driven comfort eating after a long day.",
            "pattern_tag": "comfort_spending",
            "intensity": 4,
            "confidence": 0.85
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(350, "food", "stressed", "ordered after exam", "night")

        assert result["pattern_tag"] == "comfort_spending"
        assert result["intensity"] == 4
        assert result["confidence"] == 0.85
        assert len(result["insight"]) > 10
        assert "_meta" in result

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_02_reward_after_achievement(self, mock_route):
        """Happy + shopping + achievement notes = reward_seeking"""
        mock_route.return_value = make_mock_result({
            "insight": "Treating yourself after achieving something is a healthy reward loop.",
            "pattern_tag": "reward_seeking",
            "intensity": 3,
            "confidence": 0.9
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(1200, "shopping", "happy", "got internship, treated myself", "afternoon")

        assert result["pattern_tag"] == "reward_seeking"
        assert result["confidence"] >= 0.8

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_03_social_outing(self, mock_route):
        """Social mood + food + evening = social_pressure"""
        mock_route.return_value = make_mock_result({
            "insight": "Group settings amplify spending — being social has a cost that's worth naming.",
            "pattern_tag": "social_pressure",
            "intensity": 2,
            "confidence": 0.78
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(600, "food", "social", "dinner with friends", "evening")

        assert result["pattern_tag"] == "social_pressure"

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_04_bored_impulse_purchase(self, mock_route):
        """Bored + shopping + no notes = impulse_buying"""
        mock_route.return_value = make_mock_result({
            "insight": "Boredom is a powerful spending trigger — the purchase fills a momentary gap.",
            "pattern_tag": "impulse_buying",
            "intensity": 3,
            "confidence": 0.7
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(800, "shopping", "bored", "", "afternoon")

        assert result["pattern_tag"] == "impulse_buying"

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_05_daily_chai_habit(self, mock_route):
        """Small amount + canteen + repeated pattern = habit_loop"""
        mock_route.return_value = make_mock_result({
            "insight": "This is a comfortable habit — automatic and low-stakes.",
            "pattern_tag": "habit_loop",
            "intensity": 1,
            "confidence": 0.92
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(
            50, "food", "neutral", "chai from canteen", "afternoon",
            last_5_expenses=[
                {"amount": 50, "category": "food", "mood": "neutral", "date": "yesterday"},
                {"amount": 50, "category": "food", "mood": "bored", "date": "2 days ago"},
            ]
        )
        assert result["pattern_tag"] == "habit_loop"
        assert result["intensity"] <= 2

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_06_neutral_basic_expense(self, mock_route):
        """No emotional signals = neutral"""
        mock_route.return_value = make_mock_result({
            "insight": "This appears to be a straightforward everyday expense.",
            "pattern_tag": "neutral",
            "intensity": 1,
            "confidence": 0.6
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(30, "transport", "neutral", "auto fare", "morning")

        assert result["pattern_tag"] == "neutral"
        assert result["intensity"] == 1

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_07_hindi_notes_detection(self, mock_route):
        """Hindi notes should still return valid structured output"""
        mock_route.return_value = make_mock_result({
            "insight": "Yeh stress se related kharcha lagta hai — exam ke baad relief milne ka tarika.",
            "pattern_tag": "comfort_spending",
            "intensity": 3,
            "confidence": 0.8
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(200, "food", "stressed", "exam ke baad khaana mangwaya", "night")

        assert result["pattern_tag"] in VALID_TAGS
        assert len(result["insight"]) > 10

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_08_late_night_food_high_intensity(self, mock_route):
        """Late-night food = high intensity comfort spending signal"""
        mock_route.return_value = make_mock_result({
            "insight": "Late-night food orders are often emotional, not physical hunger.",
            "pattern_tag": "comfort_spending",
            "intensity": 5,
            "confidence": 0.88
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(450, "food", "stressed", "", "late_night")

        assert result["pattern_tag"] == "comfort_spending"
        assert result["intensity"] >= 4

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_09_last_5_expenses_context_used(self, mock_route):
        """With last_5_expenses provided, confidence should be higher"""
        mock_route.return_value = make_mock_result({
            "insight": "A clear pattern: you order food when stressed, consistently.",
            "pattern_tag": "comfort_spending",
            "intensity": 4,
            "confidence": 0.95
        })
        from ai_engine.prompts.analyze import analyze_expense
        last_5 = [
            {"amount": 300, "category": "food", "mood": "stressed", "date": "1d ago"},
            {"amount": 280, "category": "food", "mood": "stressed", "date": "3d ago"},
            {"amount": 320, "category": "food", "mood": "stressed", "date": "5d ago"},
        ]
        result = analyze_expense(350, "food", "stressed", "stressed again", "night", last_5)

        assert result["confidence"] >= 0.9

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_10_response_has_all_required_fields(self, mock_route):
        """Response must always contain all required fields"""
        mock_route.return_value = make_mock_result({
            "insight": "Normal daily expense.",
            "pattern_tag": "neutral",
            "intensity": 1,
            "confidence": 0.5
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(100, "food", "neutral", "", "morning")

        assert "insight" in result
        assert "pattern_tag" in result
        assert "intensity" in result
        assert "confidence" in result
        assert "_meta" in result


class TestAnalyzeExpenseEdgeCases:

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_11_missing_mood(self, mock_route):
        """Missing mood should not crash — model handles gracefully"""
        mock_route.return_value = make_mock_result({
            "insight": "Without mood context, this appears to be a routine purchase.",
            "pattern_tag": "neutral",
            "intensity": 1,
            "confidence": 0.4
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(200, "food", "", "", "afternoon")

        assert result["pattern_tag"] in VALID_TAGS

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_12_empty_notes(self, mock_route):
        """Empty notes should not crash"""
        mock_route.return_value = make_mock_result({
            "insight": "A quiet purchase without much context.",
            "pattern_tag": "neutral",
            "intensity": 1,
            "confidence": 0.3
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(150, "shopping", "happy", "", "morning")

        assert isinstance(result["insight"], str)

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_13_empty_last_5_expenses(self, mock_route):
        """No history should still work — just lower confidence"""
        mock_route.return_value = make_mock_result({
            "insight": "One data point. Your pattern will emerge with more entries.",
            "pattern_tag": "neutral",
            "intensity": 1,
            "confidence": 0.3
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(500, "shopping", "bored", "just browsed", "afternoon", last_5_expenses=[])

        assert result["confidence"] <= 0.5

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_14_very_small_amount(self, mock_route):
        """Tiny amounts (₹10-30) should have low intensity"""
        mock_route.return_value = make_mock_result({
            "insight": "Small routine purchase — part of the daily rhythm.",
            "pattern_tag": "habit_loop",
            "intensity": 1,
            "confidence": 0.5
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(15, "food", "neutral", "nimbu paani", "morning")

        assert result["intensity"] <= 2

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_15_large_amount_no_notes(self, mock_route):
        """Large amount + no notes + bored mood = strong impulse signal"""
        mock_route.return_value = make_mock_result({
            "insight": "A large unplanned purchase with no context — classic impulse territory.",
            "pattern_tag": "impulse_buying",
            "intensity": 4,
            "confidence": 0.75
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(3500, "shopping", "bored", "", "evening")

        assert result["pattern_tag"] == "impulse_buying"
        assert result["intensity"] >= 3

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_16_intensity_clamped_to_valid_range(self, mock_route):
        """Intensity must always be 1-5 regardless of model output"""
        mock_route.return_value = make_mock_result({
            "insight": "Strong emotional purchase.",
            "pattern_tag": "comfort_spending",
            "intensity": 99,  # Model returned invalid value
            "confidence": 0.8
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(300, "food", "stressed", "", "night")

        assert 1 <= result["intensity"] <= 5

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_17_confidence_clamped_to_valid_range(self, mock_route):
        """Confidence must always be 0.0-1.0"""
        mock_route.return_value = make_mock_result({
            "insight": "Good insight.",
            "pattern_tag": "neutral",
            "intensity": 2,
            "confidence": 1.5  # Model returned invalid value
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(100, "food", "neutral", "", "morning")

        assert 0.0 <= result["confidence"] <= 1.0

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_18_invalid_pattern_tag_gets_neutral(self, mock_route):
        """Invalid pattern_tag from model should be replaced with 'neutral'"""
        mock_route.return_value = make_mock_result({
            "insight": "An insight.",
            "pattern_tag": "INVALID_TAG_XYZ",  # Model hallucinated
            "intensity": 2,
            "confidence": 0.5
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(200, "food", "neutral", "", "morning")

        assert result["pattern_tag"] == "neutral"

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_19_forbidden_phrase_replaced(self, mock_route):
        """Shaming phrases in insight must be replaced with graceful default"""
        mock_route.return_value = make_mock_result({
            "insight": "You overspent this week. Bad habit detected.",  # Should be replaced
            "pattern_tag": "comfort_spending",
            "intensity": 3,
            "confidence": 0.7
        })
        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(300, "food", "stressed", "", "night")

        assert "overspent" not in result["insight"].lower()
        assert "bad habit" not in result["insight"].lower()


class TestAnalyzeExpenseFailureCases:

    @patch("ai_engine.prompts.analyze.route_prompt")
    def test_20_api_failure_returns_graceful_default(self, mock_route):
        """When all models fail, return graceful default — never crash"""
        mock_route.return_value = make_failed_result()

        from ai_engine.prompts.analyze import analyze_expense
        result = analyze_expense(300, "food", "stressed", "", "night")

        assert "insight" in result
        assert "pattern_tag" in result
        assert result["pattern_tag"] in VALID_TAGS
        assert "_meta" in result
        assert result["_meta"]["fallback_used"] is True


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT BUILDER TESTS (no API needed)
# ─────────────────────────────────────────────────────────────────────────────

class TestInsightPromptBuilder:

    def test_prompt_contains_amount(self):
        from ai_engine.prompts.insight_prompts import build_insight_prompt
        prompt = build_insight_prompt(350, "food", "stressed", "exam stress", "night", [])
        assert "350" in prompt

    def test_prompt_contains_category(self):
        from ai_engine.prompts.insight_prompts import build_insight_prompt
        prompt = build_insight_prompt(350, "food", "stressed", "exam stress", "night", [])
        assert "food" in prompt

    def test_prompt_contains_mood(self):
        from ai_engine.prompts.insight_prompts import build_insight_prompt
        prompt = build_insight_prompt(350, "food", "stressed", "exam stress", "night", [])
        assert "stressed" in prompt

    def test_prompt_with_last_5_formatted(self):
        from ai_engine.prompts.insight_prompts import build_insight_prompt
        last_5 = [{"amount": 200, "category": "food", "mood": "stressed", "date": "yesterday"}]
        prompt = build_insight_prompt(350, "food", "stressed", "", "night", last_5)
        assert "200" in prompt


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
