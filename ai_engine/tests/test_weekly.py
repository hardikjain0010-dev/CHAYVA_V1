"""
SpendMind — Test Suite: generate_weekly_summary()
20 test cases covering all scenarios.

Run: python -m pytest tests/test_weekly.py -v
"""

import json
import pytest
from unittest.mock import patch


def make_mock_result(parsed):
    return {"success": True, "raw_text": json.dumps(parsed), "parsed": parsed,
            "provider": "gemini", "model": "gemini-2.0-flash", "latency_ms": 200, "fallback_used": False}

def make_failed_result():
    return {"success": False, "raw_text": "", "parsed": None,
            "provider": "gemini", "model": "gemini-2.0-flash", "latency_ms": 50, "fallback_used": True, "error": "timeout"}

SAMPLE_WEEK = [
    {"amount": 350, "category": "food", "mood": "stressed", "notes": "ordered after exam", "date": "2024-01-01", "time_of_day": "night"},
    {"amount": 120, "category": "transport", "mood": "neutral", "notes": "auto", "date": "2024-01-02", "time_of_day": "morning"},
    {"amount": 280, "category": "food", "mood": "stressed", "notes": "Swiggy again", "date": "2024-01-02", "time_of_day": "night"},
    {"amount": 600, "category": "food", "mood": "social", "notes": "dinner with friends", "date": "2024-01-06", "time_of_day": "evening"},
    {"amount": 50, "category": "food", "mood": "bored", "notes": "chai", "date": "2024-01-03", "time_of_day": "afternoon"},
    {"amount": 800, "category": "shopping", "mood": "happy", "notes": "treated myself", "date": "2024-01-05", "time_of_day": "afternoon"},
    {"amount": 150, "category": "food", "mood": "tired", "notes": "canteen", "date": "2024-01-04", "time_of_day": "afternoon"},
]

VALID_SUMMARY = {
    "headline": "A stress-heavy week with weekend relief.",
    "top_insight": "Exam stress consistently triggered late-night food orders on weeknights.",
    "biggest_trigger": "exam stress",
    "emotional_trend": "High stress mid-week, eased into social spending on Saturday.",
    "one_win": "Monday had zero impulse purchases — a genuinely mindful day."
}

REQUIRED_FIELDS = ["headline", "top_insight", "biggest_trigger", "emotional_trend", "one_win"]
FORBIDDEN_PHRASES = ["overspent", "wasted", "bad habit", "irresponsible", "cut down", "stop spending"]


class TestWeeklySummaryHappyPath:

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_01_returns_all_required_fields(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        for field in REQUIRED_FIELDS:
            assert field in result, f"Missing field: {field}"

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_02_headline_is_non_empty_string(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert isinstance(result["headline"], str) and len(result["headline"]) > 5

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_03_biggest_trigger_is_short(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        word_count = len(result["biggest_trigger"].split())
        assert word_count <= 8, f"biggest_trigger too long: {word_count} words"

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_04_no_forbidden_phrases_in_any_field(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        all_text = " ".join(str(v) for v in result.values()).lower()
        for phrase in FORBIDDEN_PHRASES:
            assert phrase not in all_text, f"Forbidden phrase found: '{phrase}'"

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_05_meta_present(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert "_meta" in result

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_06_one_win_is_genuine_positive(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert len(result["one_win"]) > 10

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_07_emotional_trend_is_meaningful(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert len(result["emotional_trend"]) > 5

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_08_top_insight_describes_pattern(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert len(result["top_insight"]) > 20

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_09_works_with_single_expense(self, mock_route):
        """Should work even with minimal data"""
        mock_route.return_value = make_mock_result({
            "headline": "A quiet week with one logged expense.",
            "top_insight": "Only one data point — patterns form with more logging.",
            "biggest_trigger": "unknown",
            "emotional_trend": "Insufficient data",
            "one_win": "You started tracking. That awareness is step one."
        })
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary([SAMPLE_WEEK[0]])
        assert "headline" in result

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_10_headline_not_financial_statement(self, mock_route):
        """Headline should not be a raw financial number"""
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        headline = result["headline"]
        # Should not start with "You spent ₹" pattern
        assert not headline.startswith("You spent ₹")


class TestWeeklySummaryEdgeCases:

    def test_11_empty_expenses_returns_default(self):
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary([])
        assert "headline" in result
        assert result["_meta"]["fallback_used"] is True

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_12_missing_headline_gets_repaired(self, mock_route):
        """Missing field should be filled with graceful default"""
        incomplete = {
            "top_insight": "Some insight.",
            "biggest_trigger": "stress",
            "emotional_trend": "Stable",
            "one_win": "Good job."
            # headline is missing
        }
        mock_route.return_value = make_mock_result(incomplete)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert "headline" in result
        assert result["headline"]

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_13_forbidden_phrase_triggers_repair(self, mock_route):
        """Response with forbidden phrases should be repaired"""
        bad_summary = VALID_SUMMARY.copy()
        bad_summary["top_insight"] = "You overspent on food this week."
        mock_route.return_value = make_mock_result(bad_summary)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert "overspent" not in result["top_insight"].lower()

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_14_stats_included_in_meta(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert "stats" in result["_meta"]

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_15_stats_total_amount_correct(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        expected_total = sum(e["amount"] for e in SAMPLE_WEEK)
        assert result["_meta"]["stats"]["total_amount"] == expected_total

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_16_stats_transaction_count_correct(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        assert result["_meta"]["stats"]["transaction_count"] == len(SAMPLE_WEEK)

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_17_all_string_fields_are_strings(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        for field in REQUIRED_FIELDS:
            assert isinstance(result[field], str), f"{field} is not a string"

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_18_large_expense_list_handled(self, mock_route):
        """Should handle more than 7 days gracefully"""
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        large_list = SAMPLE_WEEK * 4  # 28 expenses
        result = generate_weekly_summary(large_list)
        assert "headline" in result

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_19_no_mood_data_handled(self, mock_route):
        """Week with no mood data should still work"""
        mock_route.return_value = make_mock_result(VALID_SUMMARY)
        from ai_engine.prompts.summarize import generate_weekly_summary
        no_mood_week = [{"amount": 200, "category": "food", "notes": "", "date": "2024-01-01", "time_of_day": "morning"}]
        result = generate_weekly_summary(no_mood_week)
        assert "headline" in result


class TestWeeklySummaryFailureCases:

    @patch("ai_engine.prompts.summarize.route_prompt")
    def test_20_api_failure_returns_graceful_default(self, mock_route):
        mock_route.return_value = make_failed_result()
        from ai_engine.prompts.summarize import generate_weekly_summary
        result = generate_weekly_summary(SAMPLE_WEEK)
        for field in REQUIRED_FIELDS:
            assert field in result
        assert result["_meta"]["fallback_used"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
