"""
Wraps all Firestore access behind a small interface so the rest of the app
never touches firebase_admin directly.

If no Firebase credentials are configured (FIREBASE_CREDENTIALS_PATH /
FIREBASE_CREDENTIALS_JSON both empty), this module transparently falls back
to an in-memory store. That means the whole API is runnable and testable
out of the box with zero external setup -- swap in real credentials later
and nothing else in the codebase needs to change.
"""
import json
import uuid
import threading
from datetime import datetime
from typing import Any, Optional

from core.config import settings

_lock = threading.Lock()


class _InMemoryDB:
    """Very small Firestore-like emulator: collections of dict documents."""

    def __init__(self):
        self._data: dict[str, dict[str, dict]] = {}

    def _collection(self, name: str) -> dict:
        return self._data.setdefault(name, {})

    def add(self, collection: str, doc: dict, doc_id: Optional[str] = None) -> str:
        with _lock:
            doc_id = doc_id or str(uuid.uuid4())
            col = self._collection(collection)
            col[doc_id] = {**doc, "id": doc_id}
            return doc_id

    def get(self, collection: str, doc_id: str) -> Optional[dict]:
        return self._collection(collection).get(doc_id)

    def update(self, collection: str, doc_id: str, updates: dict) -> Optional[dict]:
        with _lock:
            col = self._collection(collection)
            if doc_id not in col:
                return None
            col[doc_id].update(updates)
            return col[doc_id]

    def delete(self, collection: str, doc_id: str) -> bool:
        with _lock:
            col = self._collection(collection)
            return col.pop(doc_id, None) is not None

    def query(self, collection: str, **filters) -> list[dict]:
        col = self._collection(collection)
        results = list(col.values())
        for key, value in filters.items():
            if value is None:
                continue
            results = [d for d in results if d.get(key) == value]
        return results


class FirestoreClient:
    """
    Real Firestore-backed client. Only instantiated when credentials exist.
    Mirrors the interface of _InMemoryDB so callers are agnostic.
    """

    def __init__(self):
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            if settings.FIREBASE_CREDENTIALS_JSON:
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                cred = credentials.Certificate(cred_dict)
            else:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)

        self.db = firestore.client()

    def add(self, collection: str, doc: dict, doc_id: Optional[str] = None) -> str:
        col_ref = self.db.collection(collection)
        if doc_id:
            col_ref.document(doc_id).set(doc)
            return doc_id
        _, ref = col_ref.add(doc)
        return ref.id

    def get(self, collection: str, doc_id: str) -> Optional[dict]:
        snap = self.db.collection(collection).document(doc_id).get()
        if not snap.exists:
            return None
        data = snap.to_dict()
        data["id"] = snap.id
        return data

    def update(self, collection: str, doc_id: str, updates: dict) -> Optional[dict]:
        ref = self.db.collection(collection).document(doc_id)
        if not ref.get().exists:
            return None
        ref.update(updates)
        return self.get(collection, doc_id)

    def delete(self, collection: str, doc_id: str) -> bool:
        ref = self.db.collection(collection).document(doc_id)
        if not ref.get().exists:
            return False
        ref.delete()
        return True

    def query(self, collection: str, **filters) -> list[dict]:
        query = self.db.collection(collection)
        for key, value in filters.items():
            if value is None:
                continue
            query = query.where(key, "==", value)
        docs = query.stream()
        out = []
        for d in docs:
            data = d.to_dict()
            data["id"] = d.id
            out.append(data)
        return out


def _build_client():
    has_creds = bool(settings.FIREBASE_CREDENTIALS_PATH or settings.FIREBASE_CREDENTIALS_JSON)
    if has_creds:
        try:
            return FirestoreClient()
        except Exception as e:
            print(f"[firebase_service] Falling back to in-memory DB — Firestore init failed: {e}")
            return _InMemoryDB()
    print("[firebase_service] No Firebase credentials configured — using in-memory DB (dev mode).")
    return _InMemoryDB()


db_client = _build_client()


# ---- convenience helpers used throughout the routers/services ----

def now_iso() -> str:
    return datetime.utcnow().isoformat()
