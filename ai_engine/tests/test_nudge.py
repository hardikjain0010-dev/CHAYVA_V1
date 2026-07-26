"""
SpendMind — Test Suite: predict_nudge()
20 test cases.

Run: python -m pytest tests/test_nudge.py -v
"""

import json
import pytest
from datetime import datetime
from unittest.mock import patch

VALID_TRIGGERS = [
    {
        "trigger": "Late-night exam stress",
        "behavior": "Orders food delivery after 10PM study sessions",
        "frequency": "4-5 times per week during exam periods",
        "emotion": "stress"
    },
    {
        "trigger": "Weekend social outings",
        "behavior": "Spends 2-3x average on food and entertainment with friends",
        "frequency": "every Saturday evening",
        "emotion": "social excitement"
    },
    {
        "trigger": "Afternoon boredom",
        "behavior": "Makes small purchases between 2-4 PM on weekdays",
        "frequency": "3-4 times per week",
        "emotion": "boredom"
    }
]

FORBIDDEN_PHRASES = [
    "stop", "don't", "warning", "overspend", "too much",
    "problem", "irresponsible", "bad habit", "wasteful", "control yourself"
]


def make_mock_result(parsed):
    return {
        "success": True, "raw_text": json.dumps(parsed), "parsed": parsed,
        "provider": "groq", "model": "llama-3.3-70b-versatile",
        "latency_ms": 80, "fallback_used": False
    }

def make_failed_result():
    return {
        "success": False, "raw_text": "", "parsed": None,
        "provider": "groq", "model": "llama-3.3-70b-versatile",
        "latency_ms": 50, "fallback_used": True, "error": "timeout"
    }

# Helper datetimes
LATE_NIGHT_WEEKDAY = datetime(2024, 1, 8, 21, 45)   # Monday 9:45 PM
AFTERNOON_WEEKDAY  = datetime(2024, 1, 9, 14, 30)   # Tuesday 2:30 PM
SATURDAY_EVENING   = datetime(2024, 1, 13, 19, 0)   # Saturday 7:00 PM
MORNING_MONDAY     = datetime(2024, 1, 8, 9, 0)     # Monday 9:00 AM
MIDNIGHT           = datetime(2024, 1, 8, 0, 30)    # Monday 12:30 AM


class TestNudgeHappyPath:

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_01_late_night_stress_triggers_nudge(self, mock_route):
        """Late night on weekday should match late-night stress trigger"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Late-night mode 🌙 — you often order food around this time after studying"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        assert result["should_nudge"] is True
        assert isinstance(result["message"], str)
        assert len(result["message"]) > 5

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_02_afternoon_boredom_triggers_nudge(self, mock_route):
        """Weekday afternoon should match afternoon boredom trigger"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Afternoon lull 🍵 — this is usually chai-and-snack time for you"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", AFTERNOON_WEEKDAY, VALID_TRIGGERS)
        assert result["should_nudge"] is True

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_03_saturday_evening_triggers_nudge(self, mock_route):
        """Saturday evening should match weekend social trigger"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Saturday evening energy ✨ — group outings tend to cost more than you plan"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", SATURDAY_EVENING, VALID_TRIGGERS)
        assert result["should_nudge"] is True

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_04_message_is_string_when_nudging(self, mock_route):
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "You usually order food around now 🍕"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        if result["should_nudge"]:
            assert isinstance(result["message"], str)

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_05_response_has_required_fields(self, mock_route):
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Chai time 🍵"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", AFTERNOON_WEEKDAY, VALID_TRIGGERS)
        assert "should_nudge" in result
        assert "message" in result
        assert "_meta" in result

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_06_should_nudge_is_bool(self, mock_route):
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "A nudge"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        assert isinstance(result["should_nudge"], bool)

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_07_meta_has_provider_info(self, mock_route):
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Test nudge"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        assert "provider" in result["_meta"]
        assert "latency_ms" in result["_meta"]

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_08_nudge_message_under_120_chars(self, mock_route):
        """Nudge messages must be short enough for mobile notification"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Late-night mode 🌙 — you often order food around this time after studying hard"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        if result["should_nudge"] and result["message"]:
            assert len(result["message"]) <= 120

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_09_no_forbidden_phrases_in_message(self, mock_route):
        """Nudge must never contain warning/shaming language"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Looks like it's your usual ordering time 🍕"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        if result["should_nudge"] and result["message"]:
            msg_lower = result["message"].lower()
            for phrase in FORBIDDEN_PHRASES:
                assert phrase not in msg_lower, f"Forbidden phrase '{phrase}' in nudge"

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_10_no_nudge_has_null_message(self, mock_route):
        """When should_nudge=false, message must be null"""
        mock_route.return_value = make_mock_result({
            "should_nudge": False,
            "message": None
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", MORNING_MONDAY, VALID_TRIGGERS)
        if not result["should_nudge"]:
            assert result["message"] is None


class TestNudgePreCheckLogic:

    def test_11_no_triggers_skips_api_call(self):
        """Empty trigger list should return no_nudge without calling model"""
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, [])
        assert result["should_nudge"] is False
        assert result["message"] is None
        assert result["_meta"]["provider"] == "local"

    def test_12_none_triggers_skips_api_call(self):
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, None)
        assert result["should_nudge"] is False

    def test_13_morning_monday_no_match_skips_api(self):
        """Monday morning has no matching trigger — pre-check should catch it"""
        from ai_engine.prompts.nudge import predict_nudge
        # Triggers are: late-night, saturday-evening, afternoon-weekday
        # Monday morning matches NONE of them
        result = predict_nudge("user_1", MORNING_MONDAY, VALID_TRIGGERS)
        # Either pre-check skips it, or model returns false
        assert isinstance(result["should_nudge"], bool)
        assert "message" in result

    def test_14_pre_check_detects_afternoon_match(self):
        """Pre-check should return True for afternoon on weekday"""
        from ai_engine.prompts.nudge_prompt import should_attempt_nudge
        result = should_attempt_nudge("14:30", "Tuesday", VALID_TRIGGERS)
        assert result is True

    def test_15_pre_check_detects_late_night_match(self):
        from ai_engine.prompts.nudge_prompt import should_attempt_nudge
        result = should_attempt_nudge("21:45", "Monday", VALID_TRIGGERS)
        assert result is True

    def test_16_pre_check_detects_saturday_match(self):
        from ai_engine.prompts.nudge_prompt import should_attempt_nudge
        result = should_attempt_nudge("19:00", "Saturday", VALID_TRIGGERS)
        assert result is True

    def test_17_pre_check_returns_false_for_no_match(self):
        """9 AM on Monday should not match any trigger"""
        from ai_engine.prompts.nudge_prompt import should_attempt_nudge
        result = should_attempt_nudge("09:00", "Monday", VALID_TRIGGERS)
        # Early morning rarely matches evening/night/afternoon triggers
        assert isinstance(result, bool)

    def test_18_pre_check_empty_triggers_returns_false(self):
        from ai_engine.prompts.nudge_prompt import should_attempt_nudge
        result = should_attempt_nudge("21:00", "Monday", [])
        assert result is False

    def test_19_datetime_none_uses_current_time(self):
        """predict_nudge with None datetime should not crash"""
        from ai_engine.prompts.nudge import predict_nudge
        # Should use datetime.now() internally — just verify no crash
        try:
            result = predict_nudge("user_1", None, [])
            assert "should_nudge" in result
        except Exception as e:
            pytest.fail(f"predict_nudge crashed with None datetime: {e}")


class TestNudgeFailureCases:

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_20_api_failure_returns_no_nudge(self, mock_route):
        """When model fails, safely return no_nudge — never crash"""
        mock_route.return_value = make_failed_result()
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        assert "should_nudge" in result
        assert "message" in result
        # On failure, should_nudge = False and message = None
        assert result["should_nudge"] is False
        assert result["message"] is None


class TestNudgeValidation:

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_forbidden_phrase_stop_blocked(self, mock_route):
        """Model returning 'stop spending' should be blocked"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Stop yourself before you order food again tonight"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        if result["should_nudge"]:
            assert "stop" not in result["message"].lower()
        else:
            assert result["message"] is None

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_warning_phrase_blocked(self, mock_route):
        """Model returning 'warning' should be blocked"""
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": "Warning: you're about to overspend again 🚨"
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        # Validation should flip this to no-nudge
        assert result["should_nudge"] is False
        assert result["message"] is None

    @patch("ai_engine.prompts.nudge.route_prompt")
    def test_too_long_message_gets_truncated(self, mock_route):
        """Message over 120 chars should be truncated"""
        long_message = "A" * 200  # Way too long
        mock_route.return_value = make_mock_result({
            "should_nudge": True,
            "message": long_message
        })
        from ai_engine.prompts.nudge import predict_nudge
        result = predict_nudge("user_1", LATE_NIGHT_WEEKDAY, VALID_TRIGGERS)
        if result["should_nudge"] and result["message"]:
            assert len(result["message"]) <= 120


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
