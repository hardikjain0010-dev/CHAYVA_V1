from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional


def utc_now() -> datetime:
    """Return the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def utc_now_iso() -> str:
    """Return the current timezone-aware UTC datetime as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def parse_utc_datetime(value: Any) -> Optional[datetime]:
    """
    Safely parse any datetime-like representation into a timezone-aware UTC datetime.

    Supports:
    - timezone-aware datetime (converted to UTC)
    - timezone-naive datetime (assumed UTC)
    - Firestore Timestamp or objects with .to_datetime()
    - ISO 8601 strings (with or without 'Z', with or without offsets)
    - Date-only strings ('YYYY-MM-DD')
    - Timestamp strings ('YYYY-MM-DD HH:MM:SS')
    - Epoch timestamps (int / float)
    - None / malformed / empty values (returns None without raising)
    """
    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    # Handle Firestore Timestamp / DatetimeWithNanoseconds
    if hasattr(value, "to_datetime") and callable(value.to_datetime):
        try:
            dt = value.to_datetime()
            if isinstance(dt, datetime):
                if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
                    return dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc)
        except Exception:
            pass

    # Handle numeric epoch timestamp
    if isinstance(value, (int, float)):
        try:
            # Handle millisecond vs second timestamps
            ts = value / 1000.0 if value > 1e11 else float(value)
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        except Exception:
            return None

    # Handle string parsing
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None

        # Normalize trailing Z to +00:00 for ISO parsing compatibility
        normalized = text
        if normalized.endswith("Z") or normalized.endswith("z"):
            normalized = normalized[:-1] + "+00:00"

        try:
            dt = datetime.fromisoformat(normalized)
            if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except (ValueError, TypeError):
            pass

        # Try common datetime formats
        for fmt in (
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
        ):
            try:
                dt = datetime.strptime(text, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                continue

    return None


def is_within_days(
    value: Any,
    days: int,
    reference_now: Optional[Any] = None,
) -> bool:
    """
    Check if a datetime-like value falls within the last `days` days relative to `reference_now`.
    Both sides are strictly compared as timezone-aware UTC datetimes.
    """
    dt = parse_utc_datetime(value)
    if dt is None:
        return False

    ref_dt = parse_utc_datetime(reference_now) or utc_now()
    cutoff = ref_dt - timedelta(days=days)
    return dt >= cutoff


def filter_within_days(
    items: list[dict[str, Any]],
    days: int,
    date_keys: tuple[str, ...] = ("date", "timestamp", "day", "created_at"),
    reference_now: Optional[Any] = None,
) -> list[dict[str, Any]]:
    """
    Filter a list of record dicts where any matching date_key falls within `days` days.
    Guaranteed to never raise TypeError on mixed naive/aware/malformed datetimes.
    """
    out: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        for key in date_keys:
            val = item.get(key)
            if val is not None and is_within_days(val, days, reference_now=reference_now):
                out.append(item)
                break
    return out


def safe_iso_date(value: Any) -> str:
    """Extract YYYY-MM-DD safely in UTC."""
    dt = parse_utc_datetime(value)
    if dt is not None:
        return dt.date().isoformat()
    # Fallback to string prefix if valid date shape
    text = str(value or "").strip()[:10]
    return text if len(text) == 10 and text.count("-") == 2 else ""


def safe_day_name(value: Any, full: bool = False) -> str:
    """Extract weekday name ('Mon' or 'Monday') safely."""
    dt = parse_utc_datetime(value)
    if dt is not None:
        return dt.strftime("%A" if full else "%a")
    return "Unknown"


def safe_hour(value: Any) -> Optional[int]:
    """Extract hour (0-23) safely in UTC."""
    dt = parse_utc_datetime(value)
    return dt.hour if dt is not None else None


def time_of_day_bucket(value: Any) -> str:
    """Classify into morning, afternoon, evening, or night."""
    h = safe_hour(value)
    if h is None:
        return "unknown"
    if 5 <= h < 12:
        return "morning"
    if 12 <= h < 17:
        return "afternoon"
    if 17 <= h < 22:
        return "evening"
    return "night"
