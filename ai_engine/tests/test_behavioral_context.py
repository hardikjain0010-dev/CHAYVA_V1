from ai_engine.prompts.insight_context import (
    build_evidence_bundle,
    deterministic_insight_from_evidence,
    format_history_for_prompt,
)


def test_petrol_is_routine_not_emotional_from_time_alone():
    evidence = build_evidence_bundle(
        amount=1200,
        category="petrol",
        mood="",
        notes="weekly fuel",
        date_value="2026-08-10T22:30:00",
        recent_expenses=[
            {"amount": 1150, "category": "petrol", "date": "2026-08-03T08:30:00"},
            {"amount": 1250, "category": "petrol", "date": "2026-07-27T08:45:00"},
        ],
    )

    insight = deterministic_insight_from_evidence(evidence)

    assert evidence["time_period"] == "Night"
    assert evidence["spending_nature"]["label"] == "routine_or_necessary"
    assert insight["pattern_tag"] == "neutral"
    assert "routine or essential" in insight["interpretation"].lower()


def test_repeated_late_food_needs_history_not_time_only():
    no_history = build_evidence_bundle(
        amount=350,
        category="food",
        mood="",
        notes="delivery",
        date_value="2026-08-10T23:15:00",
        recent_expenses=[],
    )
    repeated = build_evidence_bundle(
        amount=350,
        category="food",
        mood="tired",
        notes="delivery after study",
        date_value="2026-08-10T23:15:00",
        recent_expenses=[
            {"amount": 310, "category": "food", "mood": "tired", "notes": "late delivery", "date": "2026-08-08T23:05:00"},
            {"amount": 330, "category": "food", "mood": "tired", "notes": "after study", "date": "2026-08-06T22:40:00"},
            {"amount": 290, "category": "food", "mood": "tired", "notes": "delivery", "date": "2026-08-04T23:20:00"},
        ],
    )

    assert deterministic_insight_from_evidence(no_history)["pattern_tag"] == "neutral"
    assert repeated["same_category_time_period_count"] == 3
    assert deterministic_insight_from_evidence(repeated)["pattern_tag"] in {"habit_loop", "comfort_spending"}


def test_large_category_deviation_is_flagged_with_baseline():
    evidence = build_evidence_bundle(
        amount=2200,
        category="shopping",
        mood="happy",
        notes="saw it online",
        date_value="2026-08-10T16:00:00",
        recent_expenses=[
            {"amount": 500, "category": "shopping", "date": "2026-08-01T15:00:00"},
            {"amount": 650, "category": "shopping", "date": "2026-08-03T14:00:00"},
            {"amount": 550, "category": "shopping", "date": "2026-08-05T18:00:00"},
        ],
    )

    assert evidence["category_amount_baseline"]["deviation"] == "above baseline"
    assert deterministic_insight_from_evidence(evidence)["pattern_tag"] == "impulse_buying"


def test_history_prompt_contains_computed_patterns_and_time_counts():
    prompt_block = format_history_for_prompt([
        {"amount": 300, "category": "food", "mood": "stressed", "date": "2026-08-01T22:30:00"},
        {"amount": 320, "category": "food", "mood": "stressed", "date": "2026-08-03T22:40:00"},
        {"amount": 310, "category": "food", "mood": "stressed", "date": "2026-08-05T23:10:00"},
        {"amount": 1200, "category": "rent", "date": "2026-08-01T09:00:00"},
    ])

    assert "Time period counts" in prompt_block
    assert "3 food expenses happened in the night" in prompt_block
    assert "routine/necessary" in prompt_block


def test_date_only_input_does_not_become_night_signal():
    evidence = build_evidence_bundle(
        amount=180,
        category="food",
        mood="",
        notes="canteen",
        date_value="2026-08-10",
        recent_expenses=[
            {"amount": 170, "category": "food", "date": "2026-08-08"},
            {"amount": 190, "category": "food", "date": "2026-08-06"},
        ],
    )

    assert evidence["exact_time"] == "time not recorded"
    assert evidence["time_period"] == "Unknown"
    assert evidence["same_time_period_recent_count"] == 0
    assert "no recorded time" in deterministic_insight_from_evidence(evidence)["observation"]


def test_reactive_mood_claim_requires_same_category_mood_history():
    evidence = build_evidence_bundle(
        amount=80,
        category="food",
        mood="bored",
        notes="chai break",
        date_value="2026-08-10T15:30:00",
        recent_expenses=[
            {"amount": 310, "category": "food", "mood": "tired", "date": "2026-08-08T23:05:00"},
            {"amount": 330, "category": "food", "mood": "tired", "date": "2026-08-06T22:40:00"},
            {"amount": 290, "category": "food", "mood": "tired", "date": "2026-08-04T23:20:00"},
        ],
    )

    insight = deterministic_insight_from_evidence(evidence)

    assert evidence["same_category_recent_count"] == 3
    assert evidence["same_category_mood_count"] == 0
    assert insight["pattern_tag"] == "neutral"
    assert "bored" not in insight["interpretation"].lower()
