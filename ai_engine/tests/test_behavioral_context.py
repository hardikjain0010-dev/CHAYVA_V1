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


def _classification_for(amount, category, notes="", mood="", recent=None, date="2026-08-10T14:00:00", override=None):
    evidence = build_evidence_bundle(
        amount=amount,
        category=category,
        mood=mood,
        notes=notes,
        date_value=date,
        recent_expenses=recent or [],
        classification_override=override,
    )
    return evidence["expense_classification"], evidence["behavioral_significance"], deterministic_insight_from_evidence(evidence)


def test_task2_necessary_and_routine_expenses_stay_low_significance():
    regular_lunch_history = [
        {"amount": 80, "category": "food", "notes": "college lunch", "date": "2026-08-07T13:00:00"},
        {"amount": 90, "category": "food", "notes": "college lunch", "date": "2026-08-08T13:10:00"},
        {"amount": 85, "category": "food", "notes": "college lunch", "date": "2026-08-09T13:05:00"},
    ]
    cases = [
        (15000, "rent", "monthly rent", [], "essential"),
        (1200, "petrol", "weekly fuel", [], "essential"),
        (1800, "groceries", "weekly groceries", [], "routine"),
        (40, "commute", "bus commute", [], "routine"),
        (700, "medical", "doctor medicine", [], "essential"),
        (3000, "education", "tuition fees", [], "essential"),
        (85, "food", "college lunch", regular_lunch_history, "routine"),
    ]

    for amount, category, notes, recent, expected in cases:
        classification, significance, insight = _classification_for(
            amount, category, notes, recent=recent, date="2026-08-10T23:00:00"
        )
        assert classification["classification"] == expected
        assert significance["level"] == "low"
        assert insight["pattern_tag"] == "neutral"
        assert "normal life spending" in insight["interpretation"]


def test_task2_discretionary_does_not_mean_problematic_without_evidence():
    cases = [
        (1500, "shopping", "online sale"),
        (500, "entertainment", "movie"),
        (450, "food", "zomato delivery"),
        (900, "dining", "social dinner with friends"),
        (499, "entertainment", "netflix subscription"),
    ]

    for amount, category, notes in cases:
        classification, significance, insight = _classification_for(amount, category, notes)
        assert classification["classification"] == "discretionary"
        assert significance["level"] == "low"
        assert insight["pattern_tag"] == "neutral"


def test_task2_first_ever_ambiguous_expense_remains_uncertain():
    classification, significance, insight = _classification_for(500, "food")

    assert classification["classification"] == "uncertain"
    assert classification["confidence_label"] == "low"
    assert significance["level"] == "unknown"
    assert insight["pattern_tag"] == "neutral"


def test_task2_history_can_raise_behavioral_significance_independently():
    repeated_late_stress_delivery = [
        {"amount": 420, "category": "food", "mood": "stressed", "notes": "delivery", "date": "2026-08-04T23:00:00"},
        {"amount": 460, "category": "food", "mood": "stressed", "notes": "zomato", "date": "2026-08-06T23:10:00"},
        {"amount": 440, "category": "food", "mood": "stressed", "notes": "delivery", "date": "2026-08-08T22:45:00"},
    ]

    classification, significance, insight = _classification_for(
        450,
        "food",
        "delivery after stressful day",
        mood="stressed",
        recent=repeated_late_stress_delivery,
        date="2026-08-10T23:15:00",
    )

    assert classification["classification"] == "discretionary"
    assert significance["level"] == "high"
    assert insight["pattern_tag"] == "habit_loop"


def test_task2_amount_deviation_is_significant_without_moralizing_happy_spend():
    recent = [
        {"amount": 500, "category": "shopping", "date": "2026-08-01T15:00:00"},
        {"amount": 650, "category": "shopping", "date": "2026-08-03T14:00:00"},
        {"amount": 550, "category": "shopping", "date": "2026-08-05T18:00:00"},
    ]

    classification, significance, insight = _classification_for(
        2200, "shopping", "planned purchase", mood="happy", recent=recent
    )

    assert classification["classification"] == "discretionary"
    assert significance["level"] == "moderate"
    assert insight["pattern_tag"] == "impulse_buying"


def test_task2_user_classification_override_is_validated_and_propagated():
    classification, significance, _ = _classification_for(
        500,
        "food",
        override={"classification": "essential", "reason": "meal plan"},
    )

    assert classification["classification"] == "essential"
    assert classification["source"] == "user_override"
    assert classification["user_override"] is True
    assert significance["level"] == "low"

    invalid, _, _ = _classification_for(
        500,
        "food",
        override={"classification": "bad_spend"},
    )
    assert invalid["classification"] == "uncertain"
