import uuid

from fastapi.testclient import TestClient

from core.security import verify_access_token
from main import app


client = TestClient(app)


def _signup(prefix: str):
    email = f"{prefix}-{uuid.uuid4()}@example.com"
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": "Release-pass-123"},
    )
    assert response.status_code == 200
    data = response.json()
    return email, data["user"], {"Authorization": f"Bearer {data['access_token']}"}


def test_release_auth_expenses_ai_and_user_isolation():
    email_a, user_a, headers_a = _signup("release-a")
    email_b, user_b, headers_b = _signup("release-b")

    signin_a = client.post(
        "/auth/signin",
        json={"email": email_a, "password": "Release-pass-123"},
    )
    assert signin_a.status_code == 200
    assert verify_access_token(signin_a.json()["access_token"]) == user_a["uid"]

    expense = client.post(
        "/expenses",
        json={
            "amount": 475.5,
            "category": "Food",
            "mood": "stressed",
            "notes": "Dinner after a long workday",
            "date": "2026-08-04T21:15:00",
        },
        headers=headers_a,
    )
    assert expense.status_code == 200
    expense_data = expense.json()
    assert expense_data["user_id"] == user_a["uid"]
    assert expense_data["insight"] is not None
    assert "behavior" in expense_data["insight"]

    assert client.get(f"/expenses/{expense_data['id']}", headers=headers_b).status_code == 404
    assert client.delete(f"/expenses/{expense_data['id']}", headers=headers_b).status_code == 404

    mood = client.post(
        "/mood",
        json={
            "mood": "stressed",
            "day_rating": 3,
            "triggers": "work pressure",
            "tomorrow": "pause before ordering food",
        },
        headers=headers_a,
    )
    assert mood.status_code == 200
    assert mood.json()["user_id"] == user_a["uid"]

    protected_gets = [
        "/expenses",
        "/moods",
        "/analytics/summary",
        "/analytics/weekly",
        "/insights/personality",
        "/insights/triggers",
        "/nudges/current",
        "/insights/coaching",
        "/insights/spend-dna",
    ]
    for path in protected_gets:
        response = client.get(path, headers=headers_a)
        assert response.status_code == 200, path

    weekly = client.post("/insights/weekly", headers=headers_a)
    assert weekly.status_code == 200

    b_expenses = client.get("/expenses", headers=headers_b)
    assert b_expenses.status_code == 200
    assert all(item["user_id"] == user_b["uid"] for item in b_expenses.json())


def test_release_protected_endpoints_reject_missing_or_invalid_jwt():
    protected_requests = [
        ("get", "/auth/me", None),
        ("get", "/expenses", None),
        ("post", "/expenses", {"amount": 1, "category": "Food"}),
        ("get", "/analytics/summary", None),
        ("get", "/analytics/weekly", None),
        ("post", "/mood", {"mood": "happy"}),
        ("get", "/moods", None),
        ("post", "/sms/import", {"sms_text": "Rs.50 debited"}),
        ("post", "/sms/import/confirm", {"amount": 50, "category": "Food"}),
        ("post", "/insights/weekly", None),
        ("get", "/insights/personality", None),
        ("get", "/insights/triggers", None),
        ("get", "/nudges/current", None),
        ("get", "/insights/coaching", None),
        ("get", "/insights/spend-dna", None),
    ]

    for method, path, body in protected_requests:
        request = getattr(client, method)
        response = request(path, json=body) if body is not None else request(path)
        assert response.status_code in (401, 403, 422), path

        response = (
            request(path, json=body, headers={"Authorization": "Bearer invalid"})
            if body is not None
            else request(path, headers={"Authorization": "Bearer invalid"})
        )
        assert response.status_code in (401, 403), path


def test_release_validation_and_not_found_responses():
    _, _, headers = _signup("release-validation")

    invalid_expense = client.post(
        "/expenses",
        json={"amount": -10, "category": "Food"},
        headers=headers,
    )
    assert invalid_expense.status_code == 422

    not_found = client.get("/expenses/does-not-exist", headers=headers)
    assert not_found.status_code == 404

    missing_google_credential = client.post("/auth/google", json={"credential": ""})
    assert missing_google_credential.status_code == 401
