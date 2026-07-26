"""
SpendMind — Test Suite: classify_personality()
20 test cases.

Run: python -m pytest tests/test_personality.py -v
"""

import json
import pytest
from unittest.mock import patch

VALID_TYPES = {"Comfort Spender", "Impulse Buyer", "Reward Seeker", "Social Spender"}

def make_mock_result(parsed):
    return {"success": True, "raw_text": json.dumps(parsed), "parsed": parsed,
            "provider": "gemini", "model": "gemini-2.0-flash", "latency_ms": 150, "fallback_used": False}

def make_failed_result():
    return {"success": False, "raw_text": "", "parsed": None,
            "provider": "gemini", "model": "gemini-2.0-flash", "latency_ms": 50, "fallback_used": True}

# Sample profiles for each type
COMFORT_PROFILE = {
    "category_totals": {"food": 4200, "snacks": 800},
    "mood_frequencies": {"stressed": 10, "tired": 6, "lonely": 3},
    "impulse_count": 2, "total_expenses": 22,
    "weekend_spend_ratio": 0.25, "night_spend_ratio": 0.55,
    "avg_amount": 240, "top_notes_keywords": ["exam", "stressed", "needed"]
}
IMPULSE_PROFILE = {
    "category_totals": {"shopping": 3800, "food": 1200, "entertainment": 900},
    "mood_frequencies": {"bored": 8, "happy": 5, "excited": 4},
    "impulse_count": 12, "total_expenses": 25,
    "weekend_spend_ratio": 0.45, "night_spend_ratio": 0.3,
    "avg_amount": 380, "top_notes_keywords": ["saw it", "randomly", "on sale"]
}
SOCIAL_PROFILE = {
    "category_totals": {"food": 2800, "entertainment": 800},
    "mood_frequencies": {"happy": 9, "social": 7},
    "impulse_count": 3, "total_expenses": 20,
    "weekend_spend_ratio": 0.7, "night_spend_ratio": 0.2,
    "avg_amount": 320, "top_notes_keywords": ["friends", "outing", "group"]
}
REWARD_PROFILE = {
    "category_totals": {"dining": 3200, "shopping": 1800},
    "mood_frequencies": {"happy": 11, "proud": 5, "relieved": 4},
    "impulse_count": 4, "total_expenses": 18,
    "weekend_spend_ratio": 0.5, "night_spend_ratio": 0.2,
    "avg_amount": 350, "top_notes_keywords": ["finally", "deserved", "submitted"]
}


class TestPersonalityHappyPath:

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_01_comfort_spender_classification(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Comfort Spender",
            "description": "You reach for food and small comforts when stress peaks.",
            "traits": ["stress-triggered buyer", "food-dominant", "night spender"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(COMFORT_PROFILE)
        assert result["type"] == "Comfort Spender"

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_02_impulse_buyer_classification(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Impulse Buyer",
            "description": "Spontaneous purchases define your spending style.",
            "traits": ["spontaneous", "variety-seeking", "boredom-driven", "present-focused"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(IMPULSE_PROFILE)
        assert result["type"] == "Impulse Buyer"

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_03_social_spender_classification(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Social Spender",
            "description": "Your spending amplifies with your social energy.",
            "traits": ["weekend-heavy", "group-influenced", "experience-oriented"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(SOCIAL_PROFILE)
        assert result["type"] == "Social Spender"

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_04_reward_seeker_classification(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Reward Seeker",
            "description": "You spend as a reward after effort and achievement.",
            "traits": ["achievement-driven", "treats after effort", "motivated by reward"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(REWARD_PROFILE)
        assert result["type"] == "Reward Seeker"

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_05_all_required_fields_present(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Comfort Spender",
            "description": "A warm, personalized description.",
            "traits": ["trait 1", "trait 2", "trait 3"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(COMFORT_PROFILE)
        assert "type" in result
        assert "description" in result
        assert "traits" in result

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_06_traits_is_list(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Impulse Buyer",
            "description": "Description here.",
            "traits": ["spontaneous", "variety-seeker"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(IMPULSE_PROFILE)
        assert isinstance(result["traits"], list)

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_07_traits_count_valid(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Social Spender",
            "description": "Description.",
            "traits": ["t1", "t2", "t3", "t4"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(SOCIAL_PROFILE)
        assert 2 <= len(result["traits"]) <= 4

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_08_type_is_valid_enum(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Reward Seeker",
            "description": "Description.",
            "traits": ["achievement-oriented", "post-effort spender"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(REWARD_PROFILE)
        assert result["type"] in VALID_TYPES

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_09_meta_present(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Comfort Spender", "description": "D", "traits": ["t1"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(COMFORT_PROFILE)
        assert "_meta" in result

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_10_description_is_non_empty_string(self, mock_route):
        mock_route.return_value = make_mock_result({
            "type": "Impulse Buyer",
            "description": "You are a spontaneous buyer who acts on impulse.",
            "traits": ["spontaneous"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(IMPULSE_PROFILE)
        assert isinstance(result["description"], str)
        assert len(result["description"]) > 10


class TestPersonalityEdgeCases:

    def test_11_insufficient_data_returns_forming_state(self):
        """Under 15 expenses = personality still forming"""
        from ai_engine.prompts.personality import classify_personality
        low_data_profile = {**COMFORT_PROFILE, "total_expenses": 8}
        result = classify_personality(low_data_profile)
        assert result["type"] == "forming"
        assert "expenses_needed" in result

    def test_12_expenses_needed_is_correct(self):
        from ai_engine.prompts.personality import classify_personality
        profile = {**COMFORT_PROFILE, "total_expenses": 10}
        result = classify_personality(profile)
        assert result["expenses_needed"] == 5  # 15 - 10

    def test_13_zero_expenses_returns_forming(self):
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality({"total_expenses": 0})
        assert result["type"] == "forming"

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_14_invalid_type_gets_corrected(self, mock_route):
        """Model returns invalid type → corrected to valid default"""
        mock_route.return_value = make_mock_result({
            "type": "Frugal Hoarder",  # Invalid type
            "description": "Description.",
            "traits": ["t1"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(COMFORT_PROFILE)
        assert result["type"] in VALID_TYPES

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_15_empty_traits_gets_default(self, mock_route):
        """Model returns empty traits → gets default"""
        mock_route.return_value = make_mock_result({
            "type": "Social Spender",
            "description": "Description.",
            "traits": []  # Empty
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(SOCIAL_PROFILE)
        assert len(result["traits"]) >= 2

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_16_traits_capped_at_4(self, mock_route):
        """Model returns 8 traits → capped at 4"""
        mock_route.return_value = make_mock_result({
            "type": "Impulse Buyer",
            "description": "D.",
            "traits": ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(IMPULSE_PROFILE)
        assert len(result["traits"]) <= 4

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_17_short_description_gets_replaced(self, mock_route):
        """Model returns very short description → replaced"""
        mock_route.return_value = make_mock_result({
            "type": "Reward Seeker", "description": "OK", "traits": ["t1"]
        })
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(REWARD_PROFILE)
        assert len(result["description"]) > 10

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_18_profile_builder_works_with_expenses(self, mock_route):
        """build_spending_profile_from_expenses should return valid profile"""
        from ai_engine.prompts.personality import build_spending_profile_from_expenses
        expenses = [
            {"amount": 300, "category": "food", "mood": "stressed", "date": "2024-01-01",
             "time_of_day": "night", "day_of_week": "Monday", "notes": "exam stress"},
            {"amount": 500, "category": "shopping", "mood": "bored", "date": "2024-01-02",
             "time_of_day": "afternoon", "day_of_week": "Saturday", "notes": "browsing"},
        ]
        profile = build_spending_profile_from_expenses(expenses)
        assert "total_expenses" in profile
        assert profile["total_expenses"] == 2
        assert "category_totals" in profile

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_19_profile_builder_computes_weekend_ratio(self, mock_route):
        from ai_engine.prompts.personality import build_spending_profile_from_expenses
        expenses = [
            {"amount": 300, "category": "food", "mood": "neutral", "date": "2024-01-01",
             "time_of_day": "morning", "day_of_week": "Saturday", "notes": ""},
            {"amount": 200, "category": "food", "mood": "neutral", "date": "2024-01-02",
             "time_of_day": "morning", "day_of_week": "Monday", "notes": ""},
        ]
        profile = build_spending_profile_from_expenses(expenses)
        assert profile["weekend_spend_ratio"] == 0.5


class TestPersonalityFailureCases:

    @patch("ai_engine.prompts.personality.route_prompt")
    def test_20_api_failure_returns_graceful_default(self, mock_route):
        mock_route.return_value = make_failed_result()
        from ai_engine.prompts.personality import classify_personality
        result = classify_personality(COMFORT_PROFILE)
        assert result["type"] in VALID_TYPES
        assert result["_meta"]["fallback_used"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
