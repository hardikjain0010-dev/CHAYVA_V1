import uuid

from fastapi.testclient import TestClient

from core.security import create_access_token
from main import app
from services.firebase_service import db_client


client = TestClient(app)


def _headers(user_id: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token({'sub': user_id})}"}


def test_get_profile_for_existing_user_without_profile_returns_empty_shape():
    user_id = f"profile-empty-{uuid.uuid4()}"

    resp = client.get("/profile", headers=_headers(user_id))

    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id
    assert data["display_name"] is None
    assert data["spending_priorities"] == []
    assert data["self_reported_spending_triggers"] == []
    assert data["self_reported_spending_contexts"] == []
    assert data["onboarding_completed"] is False


def test_profile_create_and_update_are_owned_by_authenticated_user():
    user_id = f"profile-owner-{uuid.uuid4()}"

    create_resp = client.put(
        "/profile",
        json={
            "display_name": "Hardik",
            "life_stage": "student",
            "preferred_language": "english",
            "typical_daily_schedule": "College 9 AM to 4 PM",
            "financial_goals": ["understand impulse spending"],
            "preferred_ai_tone": "gentle",
        },
        headers=_headers(user_id),
    )
    assert create_resp.status_code == 200
    created = create_resp.json()
    assert created["user_id"] == user_id
    assert created["display_name"] == "Hardik"

    patch_resp = client.patch(
        "/profile",
        json={"preferred_language": "hinglish"},
        headers=_headers(user_id),
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["display_name"] == "Hardik"
    assert updated["preferred_language"] == "hinglish"

    stored = db_client.get("profiles", user_id)
    assert stored["user_id"] == user_id


def test_onboarding_payload_populates_existing_profile_fields():
    user_id = f"profile-onboarding-{uuid.uuid4()}"

    resp = client.patch(
        "/profile",
        json={
            "life_stage": "student_working",
            "college_or_work_context": "College with commute",
            "typical_daily_schedule": "College days usually include a commute.",
            "self_reported_spending_triggers": ["stress", "convenience"],
            "self_reported_spending_contexts": ["after_college_or_work", "online_scrolling"],
            "spending_priorities": ["Food", "Travel / petrol"],
            "financial_goals": ["Where my money usually goes"],
            "preferred_ai_tone": "friendly",
            "preferred_language": "hinglish",
            "onboarding_completed": True,
        },
        headers=_headers(user_id),
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id
    assert data["life_stage"] == "student_working"
    assert data["self_reported_spending_triggers"] == ["stress", "convenience"]
    assert data["self_reported_spending_contexts"] == ["after_college_or_work", "online_scrolling"]
    assert data["financial_goals"] == ["Where my money usually goes"]
    assert data["preferred_ai_tone"] == "friendly"
    assert data["preferred_language"] == "hinglish"
    assert data["onboarding_completed"] is True


def test_put_update_does_not_reset_existing_onboarding_completion_when_omitted():
    user_id = f"profile-put-preserve-{uuid.uuid4()}"
    headers = _headers(user_id)

    completed = client.patch(
        "/profile",
        json={
            "life_stage": "student",
            "self_reported_spending_triggers": ["stress"],
            "self_reported_spending_contexts": ["evening"],
            "spending_priorities": ["Food"],
            "financial_goals": ["Understand spending"],
            "preferred_ai_tone": "gentle",
            "preferred_language": "english",
            "onboarding_completed": True,
        },
        headers=headers,
    )
    assert completed.status_code == 200
    assert completed.json()["onboarding_completed"] is True

    updated = client.put(
        "/profile",
        json={
            "display_name": "Updated Name",
            "preferred_language": "hinglish",
        },
        headers=headers,
    )

    assert updated.status_code == 200
    assert updated.json()["display_name"] == "Updated Name"
    assert updated.json()["onboarding_completed"] is True


def test_incomplete_onboarding_state_is_persisted_without_marking_complete():
    user_id = f"profile-incomplete-{uuid.uuid4()}"

    resp = client.patch(
        "/profile",
        json={"onboarding_completed": False},
        headers=_headers(user_id),
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id
    assert data["onboarding_completed"] is False
    assert db_client.get("profiles", user_id)["onboarding_completed"] is False


def test_onboarding_rejects_invalid_self_reported_values_and_oversized_lists():
    user_id = f"profile-onboarding-invalid-{uuid.uuid4()}"

    invalid_value = client.patch(
        "/profile",
        json={"self_reported_spending_triggers": ["stress_spender"]},
        headers=_headers(user_id),
    )
    assert invalid_value.status_code == 422

    too_many = client.patch(
        "/profile",
        json={
            "self_reported_spending_triggers": [
                "stress",
                "boredom",
                "social_situations",
                "convenience",
                "unknown",
            ]
        },
        headers=_headers(user_id),
    )
    assert too_many.status_code == 422


def test_legacy_profile_with_context_is_treated_as_completed():
    user_id = f"profile-legacy-{uuid.uuid4()}"
    db_client.add("profiles", {"user_id": user_id, "life_stage": "student"}, doc_id=user_id)

    resp = client.get("/profile", headers=_headers(user_id))

    assert resp.status_code == 200
    assert resp.json()["onboarding_completed"] is True


def test_profile_rejects_invalid_values_and_requires_auth():
    no_auth = client.get("/profile")
    assert no_auth.status_code == 401

    invalid = client.put(
        "/profile",
        json={"display_name": "x" * 100, "preferred_language": "klingon"},
        headers=_headers(f"profile-invalid-{uuid.uuid4()}"),
    )
    assert invalid.status_code == 422


def test_user_cannot_access_another_users_profile_by_payload_user_id():
    user_a = f"profile-a-{uuid.uuid4()}"
    user_b = f"profile-b-{uuid.uuid4()}"

    resp = client.put(
        "/profile",
        json={"display_name": "User A", "user_id": user_b},
        headers=_headers(user_a),
    )

    assert resp.status_code == 200
    assert resp.json()["user_id"] == user_a
    assert db_client.get("profiles", user_a)["display_name"] == "User A"
    assert db_client.get("profiles", user_b) is None


def test_expense_analysis_receives_relevant_profile_context():
    user_id = f"profile-expense-{uuid.uuid4()}"
    headers = _headers(user_id)
    client.put(
        "/profile",
        json={
            "display_name": "Hardik",
            "life_stage": "student",
            "preferred_language": "hinglish",
            "typical_daily_schedule": "College 9 AM to 4 PM",
            "financial_goals": ["understand impulse spending"],
        },
        headers=headers,
    )

    resp = client.post(
        "/expenses",
        json={
            "amount": 450,
            "category": "food",
            "mood": "tired",
            "notes": "delivery after college",
            "date": "2026-08-10T20:30:00",
        },
        headers=headers,
    )

    assert resp.status_code == 200
    insight = resp.json()["insight"]
    assert insight["personal_context"]["name"] == "Hardik"
    assert insight["personal_context"]["preferred_language"] == "Hinglish"
    assert any("schedule context" in item for item in insight["personal_context"]["relevant_context"])
    assert resp.json()["expense_classification"]["classification"] in {"essential", "routine", "discretionary", "uncertain"}
