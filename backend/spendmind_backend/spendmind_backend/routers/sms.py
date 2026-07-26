from fastapi import APIRouter, HTTPException

from models.expense_model import SMSImportRequest, SMSImportConfirm
from services.sms_parser import parse_sms
from services.firebase_service import db_client, now_iso
from services.ai_service import analyze_expense

router = APIRouter(prefix="/sms", tags=["SMS Import"])

EXPENSE_COLLECTION = "expenses"


def _is_duplicate(user_id: str, amount: float, merchant: str | None, date: str | None) -> bool:
    existing = db_client.query(EXPENSE_COLLECTION, user_id=user_id)
    for e in existing:
        if e.get("amount") == amount and e.get("notes") == merchant and e.get("date") == date:
            return True
    return False


@router.post(
    "/import",
    summary="Preview an SMS import",
    description="Parses a bank/UPI SMS into a structured expense preview (amount, merchant, "
                "guessed category) for the user to confirm before saving. Detects duplicates "
                "and skips reversed/failed transactions.",
)
def sms_import_preview(payload: SMSImportRequest):
    parsed = parse_sms(payload.sms_text)

    if parsed.get("transaction_type") == "reversed_or_failed":
        raise HTTPException(status_code=422, detail="This looks like a reversed or failed transaction — not imported.")

    if parsed.get("amount") is None:
        raise HTTPException(status_code=422, detail="Could not extract an amount from this SMS.")

    duplicate = _is_duplicate(payload.user_id, parsed["amount"], parsed.get("merchant"), parsed.get("date"))
    parsed["duplicate"] = duplicate
    return parsed


@router.post(
    "/import/confirm",
    summary="Confirm and save an SMS-imported expense",
    description="Saves a user-confirmed SMS-parsed expense to Firestore, tagging its source "
                "as 'sms' so it can be distinguished from manual entries.",
)
def sms_import_confirm(payload: SMSImportConfirm):
    doc = payload.model_dump()
    doc["date"] = doc.get("date") or now_iso()
    doc["source"] = "sms"

    if _is_duplicate(doc["user_id"], doc["amount"], doc.get("merchant"), doc.get("date")):
        raise HTTPException(status_code=409, detail="This expense appears to already be imported.")

    doc["notes"] = doc.get("merchant") or doc.get("notes")
    insight = None
    try:
        insight = analyze_expense(doc)
    except Exception:
        insight = None
    doc["insight"] = insight

    doc_id = db_client.add(EXPENSE_COLLECTION, doc)
    return {**doc, "id": doc_id}
