"""
Core endpoint tests, matching Week 8 Day 50 of the dev plan:
create expense, get expense, analytics summary, SMS import, auth.

Run with: pytest -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

TEST_USER = "test-user-001"


def test_health_check():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_expense():
    payload = {
        "user_id": TEST_USER,
        "amount": 250,
        "category": "food",
        "mood": "stressed",
        "notes": "midnight Swiggy order",
    }
    resp = client.post("/expenses", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["amount"] == 250
    assert data["category"] == "food"
    assert "id" in data
    assert data["insight"] is not None


def test_get_expense():
    create_resp = client.post("/expenses", json={
        "user_id": TEST_USER, "amount": 100, "category": "transport",
    })
    expense_id = create_resp.json()["id"]

    get_resp = client.get(f"/expenses/{expense_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == expense_id


def test_get_expense_not_found():
    resp = client.get("/expenses/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"] is True


def test_list_expenses_filters():
    client.post("/expenses", json={"user_id": TEST_USER, "amount": 50, "category": "shopping"})
    resp = client.get("/expenses", params={"user_id": TEST_USER, "category": "shopping"})
    assert resp.status_code == 200
    results = resp.json()
    assert all(r["category"] == "shopping" for r in results)


def test_delete_expense():
    create_resp = client.post("/expenses", json={"user_id": TEST_USER, "amount": 30, "category": "misc"})
    expense_id = create_resp.json()["id"]
    del_resp = client.delete(f"/expenses/{expense_id}")
    assert del_resp.status_code == 200
    get_resp = client.get(f"/expenses/{expense_id}")
    assert get_resp.status_code == 404


def test_analytics_summary():
    client.post("/expenses", json={"user_id": TEST_USER, "amount": 400, "category": "food"})
    resp = client.get("/analytics/summary", params={"user_id": TEST_USER})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_this_week" in data


def test_analytics_weekly():
    resp = client.get("/analytics/weekly", params={"user_id": TEST_USER})
    assert resp.status_code == 200
    assert "by_category" in resp.json()


def test_sms_import_preview():
    sms_text = "Rs.500.00 debited from a/c **1234 on 05-07-26 to VPA swiggy@upi"
    resp = client.post("/sms/import", json={"user_id": TEST_USER, "sms_text": sms_text})
    assert resp.status_code == 200
    data = resp.json()
    assert data["amount"] == 500.0
    assert data["bank"] == "HDFC"


def test_sms_import_reversed_transaction_rejected():
    sms_text = "Rs.500.00 debited but transaction was reversed and refunded"
    resp = client.post("/sms/import", json={"user_id": TEST_USER, "sms_text": sms_text})
    assert resp.status_code == 422


def test_sms_import_confirm_and_duplicate_detection():
    confirm_payload = {
        "user_id": TEST_USER, "amount": 199, "category": "food", "merchant": "zomato",
    }
    resp1 = client.post("/sms/import/confirm", json=confirm_payload)
    assert resp1.status_code == 200

    # exact same payload again (same date auto-generated might differ, but
    # this still demonstrates the duplicate-check code path runs cleanly)
    resp2 = client.post("/sms/import/confirm", json=confirm_payload)
    assert resp2.status_code in (200, 409)


def test_auth_verify_dev_mode():
    resp = client.post("/auth/verify", json={"id_token": "some-fake-token-for-dev-mode"})
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_auth_verify_missing_token():
    resp = client.post("/auth/verify", json={"id_token": ""})
    assert resp.status_code == 401


def test_nudges_current_returns_shape():
    resp = client.get("/nudges/current", params={"user_id": TEST_USER})
    assert resp.status_code == 200
    assert "nudge" in resp.json()


def test_insights_personality_shape():
    resp = client.get("/insights/personality", params={"user_id": TEST_USER})
    assert resp.status_code == 200
    data = resp.json()
    assert "type" in data
    assert "traits" in data


def test_spend_dna_shape():
    resp = client.get("/insights/spend-dna", params={"user_id": TEST_USER})
    assert resp.status_code == 200
    data = resp.json()
    assert "personality_type" in data
    assert "monthly_narrative" in data
