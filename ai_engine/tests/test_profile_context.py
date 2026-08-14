from ai_engine.prompts.insight_context import build_evidence_bundle
from ai_engine.prompts.profile_context import build_personal_context, format_personal_context_for_prompt


RICH_PROFILE = {
    "display_name": "Hardik",
    "life_stage": "student",
    "preferred_language": "hinglish",
    "typical_daily_schedule": "College from 9 AM to 4 PM, study in the evening.",
    "college_or_work_context": "Commutes to college by bike.",
    "spending_priorities": ["food", "commute"],
    "financial_goals": ["understand impulse spending"],
    "preferred_ai_tone": "gentle",
}


def test_empty_profile_returns_no_context():
    context = build_personal_context({}, task="expense_analysis")

    assert context["available"] is False
    assert context["relevant_context"] == []


def test_name_and_language_are_compact_context():
    context = build_personal_context(RICH_PROFILE, task="expense_analysis")
    prompt_block = format_personal_context_for_prompt(context)

    assert context["name"] == "Hardik"
    assert context["preferred_language"] == "Hinglish"
    assert "Hardik" in prompt_block
    assert "responses in Hinglish" in prompt_block


def test_schedule_included_when_expense_timing_makes_it_relevant():
    evidence = build_evidence_bundle(
        amount=450,
        category="food",
        mood="tired",
        notes="delivery after college",
        date_value="2026-08-10T20:30:00",
        recent_expenses=[
            {"amount": 420, "category": "food", "date": "2026-08-08T20:15:00"},
        ],
    )

    context = build_personal_context(RICH_PROFILE, evidence=evidence, task="expense_analysis")

    assert any("schedule context" in item for item in context["relevant_context"])


def test_irrelevant_lists_excluded_from_single_expense_context():
    evidence = build_evidence_bundle(
        amount=1200,
        category="petrol",
        mood="",
        notes="weekly fuel",
        date_value="2026-08-10T09:00:00",
        recent_expenses=[],
    )

    context = build_personal_context(RICH_PROFILE, evidence=evidence, task="expense_analysis")
    combined = " ".join(context["relevant_context"])

    assert "Spending priorities" not in combined
    assert "User goals" not in combined


def test_profile_context_does_not_change_behavioral_evidence():
    recent = [
        {"amount": 1000, "category": "petrol", "notes": "weekly fuel", "date": "2026-08-03T09:00:00"},
        {"amount": 1100, "category": "petrol", "notes": "weekly fuel", "date": "2026-08-10T09:00:00"},
    ]
    without_profile = build_evidence_bundle(1050, "petrol", "", "weekly fuel", "2026-08-14T09:00:00", recent)
    with_profile = build_evidence_bundle(1050, "petrol", "", "weekly fuel", "2026-08-14T09:00:00", recent)
    build_personal_context(RICH_PROFILE, evidence=with_profile, task="expense_analysis")

    assert with_profile["expense_classification"] == without_profile["expense_classification"]
    assert with_profile["behavioral_significance"] == without_profile["behavioral_significance"]
