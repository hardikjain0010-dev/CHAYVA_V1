"""
SpendMind — Test Suite: detect_triggers()
20 test cases.

Run: python -m pytest tests/test_trigger.py -v
"""

import json
import pytest
from unittest.mock import patch

REQUIRED_FIELDS = ["trigger", "behavior", "frequency", "emotion"]

def make_mock_result(parsed):
    return {"success": True, "raw_text": json.dumps(parsed), "parsed": parsed,
            "provider": "groq", "model": "llama-3.3-70b-versatile", "latency_ms": 300, "fallback_used": False}

def make_failed_result():
    return {"success": False, "raw_text": "", "parsed": None,
            "provider": "groq", "model": "llama-3.3-70b-versatile", "latency_ms": 50, "fallback_used": True}

VALID_TRIGGERS = [
    {"trigger": "Late-night exam stress", "behavior": "Orders food delivery after 10PM study sessions",
     "frequency": "4-5 times per week", "emotion": "stress"},
    {"trigger": "Weekend social outings", "behavior": "Spends 2-3x average on food and entertainment with friends",
     "frequency": "every Saturday evening", "emotion": "social excitement"},
    {"trigger": "Afternoon boredom", "behavior": "Makes small purchases between 2-4 PM on weekdays",
     "frequency": "3-4 times per week", "emotion": "boredom"}
]

SAMPLE_30_DAYS = [
    {"amount": a, "category": c, "mood": m, "notes": n,
     "date": f"2024-01-{str(i+1).zfill(2)}", "time_of_day": t, "day_of_week": d}
    for i, (a, c, m, n, t, d) in enumerate([
        (350, "food", "stressed", "exam night", "night", "Monday"),
        (280, "food", "stressed", "Swiggy after study", "night", "Tuesday"),
        (50, "food", "bored", "chai", "afternoon", "Wednesday"),
        (600, "food", "social", "dinner friends", "evening", "Saturday"),
        (120, "transport", "neutral", "auto", "morning", "Thursday"),
        (320, "food", "stressed", "ordered again", "night", "Monday"),
        (800, "shopping", "happy", "treated myself", "afternoon", "Friday"),
        (50, "food", "bored", "canteen snack", "afternoon", "Tuesday"),
        (450, "food", "stressed", "late night order", "late_night", "Wednesday"),
        (200, "entertainment", "social", "movie with friends", "evening", "Saturday"),
        (300, "food", "stressed", "post exam food", "night", "Thursday"),
        (50, "food", "bored", "chai again", "afternoon", "Monday"),
        (700, "food", "social", "group dinner", "evening", "Sunday"),
        (150, "food", "tired", "canteen", "afternoon", "Friday"),
        (400, "food", "stressed", "night cravings", "night", "Tuesday"),
    ] * 2)
]


class TestTriggerDetectionHappyPath:

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_01_returns_list(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        assert isinstance(result, list)

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_02_returns_exactly_3_triggers(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        assert len(result) == 3

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_03_all_triggers_have_required_fields(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for i, trigger in enumerate(result):
            for field in REQUIRED_FIELDS:
                assert field in trigger, f"Trigger {i+1} missing field: {field}"

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_04_trigger_names_are_non_empty(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            assert len(t["trigger"].strip()) > 0

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_05_behavior_is_descriptive(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            assert len(t["behavior"]) > 10

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_06_frequency_is_non_empty(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            assert len(t["frequency"].strip()) > 0

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_07_emotion_is_non_empty(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            assert len(t["emotion"].strip()) > 0

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_08_trigger_name_not_too_long(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            word_count = len(t["trigger"].split())
            assert word_count <= 7, f"Trigger name too long: {t['trigger']}"

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_09_triggers_are_specific_not_generic(self, mock_route):
        """Triggers should mention specific patterns, not 'unknown'"""
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            assert t["trigger"].lower() != "unknown"

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_10_first_trigger_is_most_frequent(self, mock_route):
        """First trigger should reflect the most frequent pattern in data"""
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        # First trigger should relate to the most common pattern (stress+food+night)
        first_trigger = result[0]["trigger"].lower() + result[0]["emotion"].lower()
        assert any(word in first_trigger for word in ["stress", "exam", "night", "food"])


class TestTriggerDetectionEdgeCases:

    def test_11_insufficient_data_returns_placeholder(self):
        """Less than 5 expenses = insufficient data triggers"""
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers([SAMPLE_30_DAYS[0], SAMPLE_30_DAYS[1]])
        assert isinstance(result, list)
        assert len(result) == 3
        assert "Insufficient" in result[0]["trigger"] or "data" in result[0]["trigger"].lower()

    def test_12_empty_list_returns_placeholder(self):
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers([])
        assert isinstance(result, list)

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_13_too_many_triggers_capped_at_3(self, mock_route):
        """If model returns 5 triggers, we still use only 3"""
        five_triggers = VALID_TRIGGERS + [
            {"trigger": "Morning coffee run", "behavior": "Buys coffee every morning",
             "frequency": "daily", "emotion": "habit"},
            {"trigger": "Payday splurge", "behavior": "Spends heavily on payday",
             "frequency": "monthly", "emotion": "excitement"}
        ]
        mock_route.return_value = make_mock_result(five_triggers)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        assert len(result) == 3

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_14_missing_field_gets_repaired(self, mock_route):
        """Trigger missing a field should be repaired, not crash"""
        broken_triggers = [
            {"trigger": "Stress eating", "behavior": "Orders food when stressed"},
            # missing frequency and emotion
            {"trigger": "Weekend fun", "behavior": "Spends on outings", "frequency": "weekly", "emotion": "joy"},
            {"trigger": "Boredom buys", "behavior": "Small purchases", "frequency": "3x week", "emotion": "boredom"},
        ]
        mock_route.return_value = make_mock_result(broken_triggers)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        assert isinstance(result, list)
        assert len(result) == 3
        for t in result:
            for field in REQUIRED_FIELDS:
                assert field in t

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_15_all_fields_are_strings(self, mock_route):
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        for t in result:
            for field in REQUIRED_FIELDS:
                assert isinstance(t[field], str), f"{field} is not a string"

    def test_16_validation_function_passes_on_valid(self):
        from ai_engine.prompts.trigger_prompt import validate_triggers
        is_valid, errors = validate_triggers(VALID_TRIGGERS)
        assert is_valid is True
        assert len(errors) == 0

    def test_17_validation_catches_missing_fields(self):
        from ai_engine.prompts.trigger_prompt import validate_triggers
        bad_triggers = [
            {"trigger": "t1"},  # missing behavior, frequency, emotion
            {"trigger": "t2", "behavior": "b", "frequency": "f", "emotion": "e"},
            {"trigger": "t3", "behavior": "b", "frequency": "f", "emotion": "e"},
        ]
        is_valid, errors = validate_triggers(bad_triggers)
        assert is_valid is False
        assert len(errors) > 0

    def test_18_validation_catches_wrong_count(self):
        from ai_engine.prompts.trigger_prompt import validate_triggers
        only_two = VALID_TRIGGERS[:2]
        is_valid, errors = validate_triggers(only_two)
        assert is_valid is False

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_19_stats_pre_computed_correctly(self, mock_route):
        """Stats dict should reflect actual data patterns"""
        mock_route.return_value = make_mock_result(VALID_TRIGGERS)
        from ai_engine.prompts.trigger_prompt import build_trigger_prompt
        _, stats = build_trigger_prompt(SAMPLE_30_DAYS)
        assert stats["total_count"] == len(SAMPLE_30_DAYS)
        assert "night" in stats["top_times"].lower() or "afternoon" in stats["top_times"].lower()


class TestTriggerFailureCases:

    @patch("ai_engine.prompts.triggers.route_prompt")
    def test_20_api_failure_returns_graceful_default(self, mock_route):
        mock_route.return_value = make_failed_result()
        from ai_engine.prompts.triggers import detect_triggers
        result = detect_triggers(SAMPLE_30_DAYS)
        assert isinstance(result, list)
        assert len(result) >= 1
        for t in result:
            for field in REQUIRED_FIELDS:
                assert field in t


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
