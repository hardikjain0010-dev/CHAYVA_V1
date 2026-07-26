import os
import tempfile

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request

from services.ai_service import voice_to_expense, analyze_expense
from services.firebase_service import db_client, now_iso
from core.config import settings
from core.limiter import limiter

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
    user_id: str = Form(..., description="Firebase UID of the user"),
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
        "user_id": user_id,
        "amount": parsed["amount"],
        "category": parsed.get("category", "general"),
        "notes": parsed.get("notes"),
        "date": now_iso(),
        "source": "voice",
    }
    insight = analyze_expense(expense_doc) or {}
    expense_doc["insight"] = insight
    expense_id = db_client.add(EXPENSE_COLLECTION, expense_doc)

    return {
        "transcript": parsed.get("transcript"),
        "expense_parsed": {**expense_doc, "id": expense_id},
        "insight": insight,
    }
