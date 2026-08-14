import os
import tempfile

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request

from services.ai_service import voice_to_expense, analyze_expense, apply_classification_fields
from services.firebase_service import db_client, now_iso
from services.cache_service import delete as delete_cache
from core.config import settings
from core.limiter import limiter
from core.security import get_current_user_id
from routers.profile import load_profile_for_user

router = APIRouter(prefix="/voice", tags=["Voice Logging"])

EXPENSE_COLLECTION = "expenses"


@router.post(
    "/transcribe",
    summary="Transcribe voice note into an expense",
    description="Accepts an uploaded audio file, transcribes it (Whisper), parses the "
                "transcript into an expense, saves it, and returns the transcript, parsed "
                "expense, and behavioral insight.",
)
@limiter.limit(f"{settings.AI_CALLS_PER_HOUR}/hour")
async def voice_transcribe(
    request: Request,
    audio: UploadFile = File(..., description="Audio file (wav/mp3/m4a)"),
    authenticated_user_id: str = Depends(get_current_user_id),
):
    suffix = os.path.splitext(audio.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        parsed = voice_to_expense(tmp_path)
    finally:
        os.remove(tmp_path)

    if parsed.get("amount") is None:
        raise HTTPException(status_code=422, detail="Could not extract an expense amount from the recording.")

    expense_doc = {
        "user_id": authenticated_user_id,
        "amount": parsed["amount"],
        "category": parsed.get("category", "general"),
        "notes": parsed.get("notes"),
        "date": now_iso(),
        "source": "voice",
    }
    recent = db_client.query(EXPENSE_COLLECTION, user_id=expense_doc["user_id"])
    recent.sort(key=lambda r: r.get("date", ""), reverse=True)
    expense_doc["recent_expenses"] = recent[:30]
    insight = analyze_expense(expense_doc, user_profile=load_profile_for_user(authenticated_user_id)) or {}
    expense_doc["insight"] = insight
    apply_classification_fields(expense_doc, insight)
    expense_doc.pop("recent_expenses", None)
    expense_id = db_client.add(EXPENSE_COLLECTION, expense_doc)
    _invalidate_user_ai(authenticated_user_id)

    return {
        "transcript": parsed.get("transcript"),
        "expense_parsed": {**expense_doc, "id": expense_id},
        "insight": insight,
    }


def _invalidate_user_ai(user_id: str) -> None:
    for key in (
        f"weekly_summary:{user_id}",
        f"personality:{user_id}",
        f"coaching:{user_id}",
    ):
        delete_cache(key)
