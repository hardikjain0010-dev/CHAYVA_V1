from fastapi import APIRouter, Depends, Query

from models.expense_model import MoodLog
from services.firebase_service import db_client, now_iso
from services.cache_service import delete as delete_cache
from core.security import get_current_user_id

router = APIRouter(prefix="/mood", tags=["Mood"])
router_plural = APIRouter(prefix="/moods", tags=["Mood"])

COLLECTION = "moods"


@router.post(
    "",
    summary="Log a mood entry",
    description="Records a standalone mood entry (separate from an expense), timestamped for "
                "later correlation with spending patterns.",
)
def log_mood(
    payload: MoodLog,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    doc = payload.model_dump()
    doc["user_id"] = authenticated_user_id
    doc["timestamp"] = doc.get("timestamp") or now_iso()
    doc["day"] = doc.get("day") or doc["timestamp"][:10]
    doc_id = db_client.add(COLLECTION, doc)
    for key in (
        f"weekly_summary:{doc['user_id']}",
        f"personality:{doc['user_id']}",
        f"coaching:{doc['user_id']}",
    ):
        delete_cache(key)
    return {**doc, "id": doc_id}


@router_plural.get(
    "",
    summary="List mood entries",
    description="Lists mood entries for a user. Pass week='current' to note the intent of "
                "fetching the current week (filtering by date range can be layered on the "
                "returned list client-side, or extended here with date_from/date_to params).",
)
def list_moods(
    authenticated_user_id: str = Depends(get_current_user_id),
    week: str | None = Query(None),
):
    results = db_client.query(COLLECTION, user_id=authenticated_user_id)
    results.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return results
