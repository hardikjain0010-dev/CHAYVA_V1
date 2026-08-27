"""
Wraps all Firestore access behind a small interface so the rest of the app
never touches firebase_admin directly.

If no Firebase credentials are configured in development, this module falls
back to a small file-backed local store. In production it fails fast instead
of silently accepting temporary storage.
"""
import json
import os
import uuid
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from core.config import settings

_lock = threading.Lock()


class _InMemoryDB:
    """Very small Firestore-like emulator with durable JSON persistence."""

    def __init__(self):
        self._data: dict[str, dict[str, dict]] = {}
        self._storage_path = Path(__file__).resolve().parent / ".local_db.json"
        self._load()

    def _collection(self, name: str) -> dict:
        return self._data.setdefault(name, {})

    def _load(self) -> None:
        if not self._storage_path.exists():
            return
        try:
            with self._storage_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
                if isinstance(payload, dict):
                    self._data = payload
        except Exception:
            self._data = {}

    def _persist(self) -> None:
        try:
            with self._storage_path.open("w", encoding="utf-8") as handle:
                json.dump(self._data, handle, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def add(self, collection: str, doc: dict, doc_id: Optional[str] = None) -> str:
        with _lock:
            doc_id = doc_id or str(uuid.uuid4())
            col = self._collection(collection)
            col[doc_id] = {**doc, "id": doc_id}
            self._persist()
            return doc_id

    def get(self, collection: str, doc_id: str) -> Optional[dict]:
        return self._collection(collection).get(doc_id)

    def update(self, collection: str, doc_id: str, updates: dict) -> Optional[dict]:
        with _lock:
            col = self._collection(collection)
            if doc_id not in col:
                return None
            col[doc_id].update(updates)
            self._persist()
            return col[doc_id]

    def delete(self, collection: str, doc_id: str) -> bool:
        with _lock:
            col = self._collection(collection)
            removed = col.pop(doc_id, None)
            if removed is not None:
                self._persist()
            return removed is not None

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
            cred = None
            
            # Priority 1: Use FIREBASE_CREDENTIALS_JSON from environment (Render/production)
            firebase_json = os.environ.get("FIREBASE_CREDENTIALS_JSON", "").strip()
            if firebase_json:
                try:
                    cred_dict = json.loads(firebase_json)
                    # Validate required fields
                    required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email"]
                    missing_fields = [field for field in required_fields if field not in cred_dict]
                    if missing_fields:
                        raise ValueError(
                            f"Firebase credentials JSON missing required fields: {', '.join(missing_fields)}"
                        )
                    cred = credentials.Certificate(cred_dict)
                except json.JSONDecodeError as e:
                    raise RuntimeError(
                        f"Failed to parse FIREBASE_CREDENTIALS_JSON as JSON: {e}. "
                        "Ensure the environment variable contains valid JSON."
                    ) from e
                except ValueError as e:
                    raise RuntimeError(
                        f"Invalid Firebase credentials JSON: {e}"
                    ) from e
            
            # Priority 2: Use FIREBASE_CREDENTIALS_PATH (local development)
            elif settings.FIREBASE_CREDENTIALS_PATH:
                cred_path = Path(settings.FIREBASE_CREDENTIALS_PATH)
                if not cred_path.exists():
                    raise RuntimeError(
                        f"FIREBASE_CREDENTIALS_PATH points to non-existent file: {cred_path}"
                    )
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            
            else:
                raise RuntimeError(
                    "No Firebase credentials provided. "
                    "Set either FIREBASE_CREDENTIALS_JSON (environment variable) or "
                    "FIREBASE_CREDENTIALS_PATH (file path)."
                )
            
            try:
                firebase_admin.initialize_app(cred)
            except Exception as e:
                raise RuntimeError(
                    f"Firebase initialization failed: {e}"
                ) from e

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
            if settings.ENV == "production":
                raise RuntimeError(f"Firestore initialization failed in production: {e}") from e
            print(f"[firebase_service] Falling back to in-memory DB — Firestore init failed: {e}")
            return _InMemoryDB()
    if settings.ENV == "production":
        raise RuntimeError(
            "Firebase credentials are required in production. Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON."
        )
    print("[firebase_service] No Firebase credentials configured — using in-memory DB (dev mode).")
    return _InMemoryDB()


db_client = _build_client()


from core.datetime_utils import utc_now_iso


def now_iso() -> str:
    return utc_now_iso()
