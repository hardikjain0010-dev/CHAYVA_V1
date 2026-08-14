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
