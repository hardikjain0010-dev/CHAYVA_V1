from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
import pytest
from fastapi.testclient import TestClient

from core.datetime_utils import (
    filter_within_days,
    is_within_days,
    parse_utc_datetime,
    safe_day_name,
    safe_hour,
    safe_iso_date,
    time_of_day_bucket,
    utc_now,
    utc_now_iso,
)
from main import app
from routers.insights import (
    _behavior_timeline,
    _day_totals,
    _evolve_personality,
    _expense_stats,
    _milestones,
    _profile_from_expenses,
    _within_days,
    _within_days_moods,
)


class MockFirestoreTimestamp:
    """Simulates Google Cloud Firestore Timestamp object."""
    def __init__(self, dt: datetime):
        self._dt = dt

    def to_datetime(self) -> datetime:
        return self._dt


# =====================================================================
# UNIT TESTS: Datetime Normalization & Resilience
# =====================================================================

def test_parse_utc_datetime_aware():
    dt_aware = datetime(2026, 8, 27, 12, 0, 0, tzinfo=timezone.utc)
    parsed = parse_utc_datetime(dt_aware)
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed == dt_aware


def test_parse_utc_datetime_naive():
    dt_naive = datetime(2026, 8, 27, 12, 0, 0)
    parsed = parse_utc_datetime(dt_naive)
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.year == 2026 and parsed.hour == 12


def test_parse_utc_datetime_firestore_timestamp():
    dt_aware = datetime(2026, 8, 27, 10, 30, tzinfo=timezone.utc)
    fs_ts = MockFirestoreTimestamp(dt_aware)
    parsed = parse_utc_datetime(fs_ts)
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 10 and parsed.minute == 30


def test_parse_utc_datetime_iso_with_z():
    parsed = parse_utc_datetime("2026-08-27T17:45:00.000Z")
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 17 and parsed.minute == 45


def test_parse_utc_datetime_iso_with_offset():
    parsed = parse_utc_datetime("2026-08-27T23:15:00+05:30")
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    # 23:15 +05:30 is 17:45 UTC
    assert parsed.hour == 17 and parsed.minute == 45


def test_parse_utc_datetime_iso_without_timezone():
    parsed = parse_utc_datetime("2026-08-27T14:20:00")
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 14 and parsed.minute == 20


def test_parse_utc_datetime_date_only():
    parsed = parse_utc_datetime("2026-08-27")
    assert parsed is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.year == 2026 and parsed.month == 8 and parsed.day == 27


def test_parse_utc_datetime_null_and_malformed():
    assert parse_utc_datetime(None) is None
    assert parse_utc_datetime("") is None
    assert parse_utc_datetime("invalid-date-string") is None


def test_is_within_days_never_raises_on_mixed_types():
    ref = datetime(2026, 8, 27, 12, 0, 0, tzinfo=timezone.utc)
    
    # 2 days ago in different formats
    assert is_within_days("2026-08-25T12:00:00Z", 7, reference_now=ref) is True
    assert is_within_days("2026-08-25T12:00:00", 7, reference_now=ref) is True
    assert is_within_days(datetime(2026, 8, 25, 12, 0), 7, reference_now=ref) is True
    assert is_within_days(datetime(2026, 8, 25, 12, 0, tzinfo=timezone.utc), 7, reference_now=ref) is True
    assert is_within_days(MockFirestoreTimestamp(datetime(2026, 8, 25, 12, 0)), 7, reference_now=ref) is True
    
    # 10 days ago
    assert is_within_days("2026-08-15T12:00:00Z", 7, reference_now=ref) is False
    assert is_within_days(None, 7, reference_now=ref) is False


def test_filter_within_days_with_mixed_historical_records():
    ref = datetime(2026, 8, 27, 12, 0, 0, tzinfo=timezone.utc)
    mixed_records = [
        {"id": "1", "date": "2026-08-26T10:00:00Z", "amount": 100}, # aware UTC (yesterday)
        {"id": "2", "date": "2026-08-25T10:00:00+05:30", "amount": 200}, # aware +05:30 (2 days ago)
        {"id": "3", "date": "2026-08-24T10:00:00", "amount": 300}, # naive string (3 days ago)
        {"id": "4", "timestamp": MockFirestoreTimestamp(datetime(2026, 8, 23, 10, 0)), "amount": 400}, # firestore TS (4 days ago)
        {"id": "5", "date": "2026-07-01T10:00:00Z", "amount": 500}, # 57 days ago
        {"id": "6", "date": None, "amount": 600}, # null date
        {"id": "7", "date": "invalid", "amount": 700}, # malformed date
    ]

    filtered_7 = filter_within_days(mixed_records, 7, reference_now=ref)
    assert len(filtered_7) == 4
    assert [r["id"] for r in filtered_7] == ["1", "2", "3", "4"]

    filtered_30 = filter_within_days(mixed_records, 30, reference_now=ref)
    assert len(filtered_30) == 4


# =====================================================================
# INTEGRATION TESTS: Insights Calculations with Mixed Records
# =====================================================================

def test_expense_stats_and_profile_with_mixed_datetimes():
    now_str = utc_now_iso()
    mixed_expenses = [
        {"amount": 100, "category": "Food", "mood": "happy", "date": now_str},
        {"amount": 250, "category": "Transport", "mood": "stressed", "date": "2026-08-25T14:30:00+05:30"},
        {"amount": 500, "category": "Food", "mood": "bored", "date": "2026-08-24T23:00:00"},
        {"amount": 50, "category": "Shopping", "mood": "happy", "date": MockFirestoreTimestamp(datetime.now(timezone.utc))},
        {"amount": 1000, "category": "Rent", "mood": "neutral", "date": "2026-01-01T10:00:00Z"},
    ]
    mixed_moods = [
        {"mood": "happy", "timestamp": now_str, "triggers": "work", "tomorrow": "gym"},
        {"mood": "tired", "timestamp": "2026-08-25T20:00:00+05:30", "triggers": "", "tomorrow": ""},
        {"mood": "bored", "day": "2026-08-24", "triggers": "idle", "tomorrow": ""},
    ]

    # Must not raise TypeError
    stats = _expense_stats(mixed_expenses)
    assert stats["total_spent"] == 1900.0
    assert stats["expense_count"] == 5

    profile = _profile_from_expenses(mixed_expenses, mixed_moods)
    assert profile["total_expenses"] == 5
    assert "Food" in profile["category_totals"]

    timeline = _behavior_timeline(mixed_expenses)
    assert len(timeline) == 7

    milestones = _milestones(
        expenses=mixed_expenses,
        moods=mixed_moods,
        personality={"type": "Mindful Spender", "description": "Good"},
        triggers=[{"trigger": "late_night_food"}],
        weekly={"headline": "Steady week"},
        mindfulness=85,
        prior_mindfulness=70,
    )
    assert len(milestones) >= 3


# =====================================================================
# API ENDPOINT REGRESSION TESTS
# =====================================================================

import uuid

@pytest.fixture
def auth_client():
    client = TestClient(app)
    uid_str = uuid.uuid4().hex[:8]
    email = f"dt_test_{uid_str}@example.com"
    signup = client.post("/auth/signup", json={"email": email, "password": "Password123!"})
    if signup.status_code == 200:
        token = signup.json().get("access_token")
    else:
        signin = client.post("/auth/signin", json={"email": email, "password": "Password123!"})
        token = signin.json().get("access_token")
    assert token, f"Could not acquire token for test client: {signup.text}"
    return client, {"Authorization": f"Bearer {token}"}


def test_coaching_endpoint_with_mixed_firestore_dates(auth_client):
    client, headers = auth_client

    # Add historical expenses with various datetime formats
    sample_dates = [
        utc_now_iso(),
        "2026-08-27T15:30:00+05:30",
        "2026-08-26T21:45:00Z",
        "2026-08-25T18:00:00",
        "2026-08-24",
    ]

    for i, date_val in enumerate(sample_dates):
        res = client.post(
            "/expenses",
            json={
                "amount": 200.0 + i * 50,
                "category": "Food",
                "mood": "happy",
                "notes": f"Test expense {i}",
                "date": date_val,
                "source": "manual",
            },
            headers=headers,
        )
        assert res.status_code == 200

    # Call /insights/coaching — must return 200 OK without 500 crash
    coaching_res = client.get("/insights/coaching", headers=headers)
    assert coaching_res.status_code == 200
    data = coaching_res.json()
    assert "stats" in data
    assert "weekly" in data
    assert "coach" in data
    assert data["stats"]["expense_count"] >= 5


def test_all_insights_endpoints_succeed(auth_client):
    client, headers = auth_client

    # /analytics/weekly
    w_res = client.get("/analytics/weekly", headers=headers)
    assert w_res.status_code == 200

    # /analytics/summary
    s_res = client.get("/analytics/summary", headers=headers)
    assert s_res.status_code == 200

    # /insights/personality
    p_res = client.get("/insights/personality", headers=headers)
    assert p_res.status_code == 200

    # /insights/triggers
    t_res = client.get("/insights/triggers", headers=headers)
    assert t_res.status_code == 200

    # /nudges/current
    n_res = client.get("/nudges/current", headers=headers)
    assert n_res.status_code == 200

    # /insights/spend-dna
    dna_res = client.get("/insights/spend-dna", headers=headers)
    assert dna_res.status_code == 200
