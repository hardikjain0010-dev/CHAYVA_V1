from fastapi import APIRouter, Query

from models.expense_model import MoodLog
from services.firebase_service import db_client, now_iso

router = APIRouter(prefix="/mood", tags=["Mood"])
router_plural = APIRouter(prefix="/moods", tags=["Mood"])

COLLECTION = "moods"


@router.post(
    "",
    summary="Log a mood entry",
    description="Records a standalone mood entry (separate from an expense), timestamped for "
                "later correlation with spending patterns.",
)
def log_mood(payload: MoodLog):
    doc = payload.model_dump()
    doc["timestamp"] = doc.get("timestamp") or now_iso()
    doc_id = db_client.add(COLLECTION, doc)
    return {**doc, "id": doc_id}


@router_plural.get(
    "",
    summary="List mood entries",
    description="Lists mood entries for a user. Pass week='current' to note the intent of "
                "fetching the current week (filtering by date range can be layered on the "
                "returned list client-side, or extended here with date_from/date_to params).",
)
def list_moods(user_id: str = Query(...), week: str | None = Query(None)):
    results = db_client.query(COLLECTION, user_id=user_id)
    results.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return results
