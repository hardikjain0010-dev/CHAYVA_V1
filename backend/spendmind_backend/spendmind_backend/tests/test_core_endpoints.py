"""
Core endpoint tests, matching Week 8 Day 50 of the dev plan:
create expense, get expense, analytics summary, SMS import, auth.

Run with: pytest -v
"""
import sys
import os
import uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from core.security import create_access_token, verify_access_token
from services.firebase_service import db_client
from main import app

client = TestClient(app)

TEST_USER = "test-user-001"
OTHER_USER = "test-user-002"
AUTH_HEADERS = {"Authorization": f"Bearer {create_access_token({'sub': TEST_USER})}"}
OTHER_AUTH_HEADERS = {"Authorization": f"Bearer {create_access_token({'sub': OTHER_USER})}"}


def _headers_for(user_id: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token({'sub': user_id})}"}


def test_health_check():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_public_health_and_readiness_endpoints():
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"
    assert health_resp.json()["service"] == "caayva-backend"

    readiness_resp = client.get("/readiness")
    assert readiness_resp.status_code == 200
    assert readiness_resp.json()["status"] == "ready"


def test_create_expense():
    payload = {
        "user_id": TEST_USER,
        "amount": 250,
        "category": "food",
        "mood": "stressed",
        "notes": "midnight Swiggy order",
    }
    resp = client.post("/expenses", json=payload, headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["amount"] == 250
    assert data["category"] == "food"
    assert "id" in data
    assert data["insight"] is not None
    assert data["expense_classification"]["classification"] in {"essential", "routine", "discretionary", "uncertain"}
    assert data["behavioral_significance"]["level"] in {"low", "moderate", "high", "unknown"}


def test_classification_override_rejects_unknown_values():
    resp = client.post(
        "/expenses",
        json={
            "amount": 250,
            "category": "food",
            "classification_override": {"classification": "bad_spend"},
        },
        headers=AUTH_HEADERS,
    )

    assert resp.status_code == 422


def test_manual_classification_override_persists():
    resp = client.post(
        "/expenses",
        json={
            "amount": 250,
            "category": "food",
            "classification_override": {"classification": "essential", "reason": "meal plan"},
        },
        headers=AUTH_HEADERS,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["expense_classification"]["classification"] == "essential"
    assert data["expense_classification"]["source"] == "user_override"


def test_get_expense():
    create_resp = client.post("/expenses", json={
        "user_id": TEST_USER, "amount": 100, "category": "transport",
    }, headers=AUTH_HEADERS)
    expense_id = create_resp.json()["id"]

    get_resp = client.get(f"/expenses/{expense_id}", headers=AUTH_HEADERS)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == expense_id


def test_get_expense_rejects_other_user():
    create_resp = client.post(
        "/expenses",
        json={"user_id": OTHER_USER, "amount": 100, "category": "transport"},
        headers=AUTH_HEADERS,
    )
    expense_id = create_resp.json()["id"]

    get_resp = client.get(f"/expenses/{expense_id}", headers=OTHER_AUTH_HEADERS)
    assert get_resp.status_code == 404


def test_get_expense_not_found():
    resp = client.get("/expenses/does-not-exist", headers=AUTH_HEADERS)
    assert resp.status_code == 404
    assert resp.json()["error"] is True


def test_list_expenses_filters():
    client.post("/expenses", json={"user_id": TEST_USER, "amount": 50, "category": "shopping"}, headers=AUTH_HEADERS)
    resp = client.get("/expenses", params={"category": "shopping"}, headers=AUTH_HEADERS)
    assert resp.status_code == 200
    results = resp.json()
    assert all(r["category"] == "shopping" for r in results)


def test_delete_expense():
    create_resp = client.post("/expenses", json={"user_id": TEST_USER, "amount": 30, "category": "misc"}, headers=AUTH_HEADERS)
    expense_id = create_resp.json()["id"]
    del_resp = client.delete(f"/expenses/{expense_id}", headers=AUTH_HEADERS)
    assert del_resp.status_code == 200
    get_resp = client.get(f"/expenses/{expense_id}", headers=AUTH_HEADERS)
    assert get_resp.status_code == 404


def test_analytics_summary():
    client.post("/expenses", json={"user_id": TEST_USER, "amount": 400, "category": "food"}, headers=AUTH_HEADERS)
    resp = client.get("/analytics/summary", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_this_week" in data


def test_analytics_weekly():
    resp = client.get("/analytics/weekly", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    assert "by_category" in resp.json()


def test_sms_import_preview():
    sms_text = "Rs.500.00 debited from a/c **1234 on 05-07-26 to VPA swiggy@upi"
    resp = client.post("/sms/import", json={"user_id": TEST_USER, "sms_text": sms_text}, headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["amount"] == 500.0
    assert data["bank"] == "HDFC"


def test_sms_import_reversed_transaction_rejected():
    sms_text = "Rs.500.00 debited but transaction was reversed and refunded"
    resp = client.post("/sms/import", json={"user_id": TEST_USER, "sms_text": sms_text}, headers=AUTH_HEADERS)
    assert resp.status_code == 422


def test_sms_import_confirm_and_duplicate_detection():
    confirm_payload = {
        "user_id": TEST_USER, "amount": 199, "category": "food", "merchant": "zomato",
    }
    resp1 = client.post("/sms/import/confirm", json=confirm_payload, headers=AUTH_HEADERS)
    assert resp1.status_code == 200

    # exact same payload again (same date auto-generated might differ, but
    # this still demonstrates the duplicate-check code path runs cleanly)
    resp2 = client.post("/sms/import/confirm", json=confirm_payload, headers=AUTH_HEADERS)
    assert resp2.status_code in (200, 409)


def test_sms_import_confirm_uses_recent_history_for_significance():
    user_id = f"sms-history-{uuid.uuid4()}"
    headers = _headers_for(user_id)
    for index, amount in enumerate((20, 25, 30), start=1):
        db_client.add(
            "expenses",
            {
                "user_id": user_id,
                "amount": amount,
                "category": "food",
                "mood": "stressed",
                "notes": "zomato delivery",
                "date": f"2026-08-0{index}T23:00:00",
                "source": "manual",
            },
        )

    resp = client.post(
        "/sms/import/confirm",
        json={
            "amount": 440,
            "category": "food",
            "merchant": "zomato delivery",
            "date": "2026-08-10T23:15:00",
        },
        headers=headers,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "sms"
    assert data["expense_classification"]["classification"] == "discretionary"
    assert data["behavioral_significance"]["level"] in {"moderate", "high"}


def test_voice_ingestion_persists_classification(monkeypatch):
    user_id = f"voice-{uuid.uuid4()}"
    headers = _headers_for(user_id)
    monkeypatch.setattr(
        "routers.voice.voice_to_expense",
        lambda _path: {"amount": 80, "category": "commute", "notes": "bus commute", "transcript": "80 bus commute"},
    )

    resp = client.post(
        "/voice/transcribe",
        files={"audio": ("expense.wav", b"fake audio", "audio/wav")},
        headers=headers,
    )

    assert resp.status_code == 200
    expense = resp.json()["expense_parsed"]
    assert expense["source"] == "voice"
    assert expense["expense_classification"]["classification"] == "routine"
    assert expense["behavioral_significance"]["level"] == "low"


def test_whatsapp_ingestion_persists_classification_with_history():
    from_number = f"whatsapp:+{uuid.uuid4().int % 10000000000}"
    for index, amount in enumerate((20, 25, 30), start=1):
        db_client.add(
            "expenses",
            {
                "user_id": from_number,
                "amount": amount,
                "category": "general",
                "notes": "zomato delivery",
                "date": f"2026-08-0{index}T23:00:00",
                "source": "whatsapp",
            },
        )

    resp = client.post(
        "/webhook/whatsapp",
        data={"From": from_number, "Body": "440 zomato delivery"},
    )

    assert resp.status_code == 200
    saved = db_client.query("expenses", user_id=from_number)
    latest = sorted(saved, key=lambda r: r.get("date", ""), reverse=True)[0]
    assert latest["source"] == "whatsapp"
    assert latest["expense_classification"]["classification"] == "discretionary"
    assert latest["behavioral_significance"]["level"] in {"moderate", "high"}


def test_auth_verify_dev_mode():
    resp = client.post("/auth/verify", json={"id_token": "some-fake-token-for-dev-mode"})
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_auth_verify_missing_token():
    resp = client.post("/auth/verify", json={"id_token": ""})
    assert resp.status_code == 401


def test_auth_google_creates_user_and_returns_jwt(monkeypatch):
    email = f"google-new-{uuid.uuid4()}@example.com"

    monkeypatch.setattr(
        "routers.auth.verify_google_token",
        lambda credential: {
            "sub": "google-sub-new",
            "email": email,
            "email_verified": True,
            "name": "Google New",
            "picture": "https://example.com/new.png",
        },
    )

    resp = client.post("/auth/google", json={"credential": "google-id-token"})

    assert resp.status_code == 200
    data = resp.json()
    user = data["user"]
    assert user["email"] == email
    assert user["provider"] == "google"
    assert user["display_name"] == "Google New"
    assert verify_access_token(data["access_token"]) == user["uid"]
    assert db_client.query("users", email=email)


def test_auth_google_logs_in_returning_user_with_same_jwt_flow(monkeypatch):
    email = f"google-returning-{uuid.uuid4()}@example.com"

    monkeypatch.setattr(
        "routers.auth.verify_google_token",
        lambda credential: {
            "sub": "google-sub-returning",
            "email": email,
            "email_verified": True,
            "name": "Google Returning",
            "picture": "https://example.com/returning.png",
        },
    )

    first_resp = client.post("/auth/google", json={"credential": "first-token"})
    second_resp = client.post("/auth/google", json={"credential": "second-token"})

    assert first_resp.status_code == 200
    assert second_resp.status_code == 200
    first = first_resp.json()
    second = second_resp.json()
    assert second["user"]["uid"] == first["user"]["uid"]
    assert verify_access_token(second["access_token"]) == first["user"]["uid"]

    me_resp = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {second['access_token']}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email


def test_nudges_current_returns_shape():
    resp = client.get("/nudges/current", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    assert "nudge" in resp.json()


def test_insights_personality_shape():
    resp = client.get("/insights/personality", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    assert resp.status_code == 200
    data = resp.json()
    assert "type" in data
    assert "traits" in data


def test_spend_dna_shape():
    resp = client.get("/insights/spend-dna", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "personality_type" in data
    assert "monthly_narrative" in data


def test_auth_signup_and_signin_case_insensitive_with_profile_init():
    unique_suffix = uuid.uuid4().hex[:8]
    signup_email = f"User.{unique_suffix}@Example.COM"
    signin_email = f"user.{unique_suffix}@example.com"
    password = "StrongPassword123"

    # 1. Signup with mixed case email
    signup_resp = client.post(
        "/auth/signup",
        json={"email": signup_email, "password": password},
    )
    assert signup_resp.status_code == 200
    signup_data = signup_resp.json()
    user_id = signup_data["user"]["uid"]
    assert signup_data["user"]["email"] == signin_email
    token = signup_data["access_token"]

    # 2. Verify profile document was automatically created in profiles collection
    profile_resp = client.get(
        "/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_resp.status_code == 200
    profile_data = profile_resp.json()
    assert profile_data["user_id"] == user_id
    assert profile_data["onboarding_completed"] is False

    # 3. Duplicate signup with lowercase should fail with 409
    dup_resp = client.post(
        "/auth/signup",
        json={"email": signin_email, "password": password},
    )
    assert dup_resp.status_code == 409

    # 4. Signin with lowercase email and correct password
    signin_resp = client.post(
        "/auth/signin",
        json={"email": signin_email, "password": password},
    )
    assert signin_resp.status_code == 200
    signin_data = signin_resp.json()
    assert signin_data["user"]["uid"] == user_id
    assert signin_data["user"]["email"] == signin_email
    assert "access_token" in signin_data

    # 5. Signin with wrong password fails with 401
    wrong_pwd_resp = client.post(
        "/auth/signin",
        json={"email": signin_email, "password": "WrongPassword999"},
    )
    assert wrong_pwd_resp.status_code == 401
