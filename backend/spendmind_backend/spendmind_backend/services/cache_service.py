"""
Lightweight TTL cache for expensive *data queries* (not AI output caching --
that's owned by the AI engineer's response-caching layer).

Used for:
  - weekly summary per user (24hr TTL)
  - personality type per user (7 day TTL)

Backed by a plain dict + timestamps. Swap for Redis later without changing
the call sites if the app needs to scale across multiple server instances.
"""
import time
import threading
from typing import Any, Optional, Callable

_store: dict[str, tuple[float, Any]] = {}
_lock = threading.Lock()


def get(key: str) -> Optional[Any]:
    with _lock:
        entry = _store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            del _store[key]
            return None
        return value


def set(key: str, value: Any, ttl_seconds: int) -> None:
    with _lock:
        _store[key] = (time.time() + ttl_seconds, value)


def delete(key: str) -> None:
    with _lock:
        _store.pop(key, None)


def get_or_set(key: str, ttl_seconds: int, compute_fn: Callable[[], Any]) -> Any:
    cached = get(key)
    if cached is not None:
        return cached
    value = compute_fn()
    set(key, value, ttl_seconds)
    return value
