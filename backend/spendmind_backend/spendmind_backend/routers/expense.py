from fastapi import APIRouter, Depends, HTTPException, Query

from core.datetime_utils import parse_utc_datetime, utc_now
from core.security import get_current_user_id
from models.expense_model import ExpenseCreate, ExpenseOut
from routers.profile import load_profile_for_user
from services.ai_service import analyze_expense, apply_classification_fields
from services.cache_service import delete as delete_cache
from services.firebase_service import db_client, now_iso

router = APIRouter(prefix="/expenses", tags=["Expenses"])

COLLECTION = "expenses"


@router.post(
    "",
    response_model=ExpenseOut,
    summary="Create an expense",
    description="Saves a new expense to Firestore, runs it through the AI behavioral-insight "
                "pipeline, and returns the saved expense together with its insight.",
)
def create_expense(
    payload: ExpenseCreate,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    doc = payload.model_dump()
    doc["user_id"] = authenticated_user_id
    doc["date"] = doc.get("date") or now_iso()
    doc["source"] = doc.get("source") or "manual"

    insight = None
    try:
        recent = db_client.query(COLLECTION, user_id=doc["user_id"])
        recent.sort(
            key=lambda r: (parse_utc_datetime(r.get("date") or r.get("timestamp")) or utc_now()).timestamp(),
            reverse=True,
        )
        doc["recent_expenses"] = recent[:30]
        insight = analyze_expense(doc, user_profile=load_profile_for_user(authenticated_user_id))
    except Exception:
        insight = None

    doc["insight"] = insight
    apply_classification_fields(doc, insight)
    doc.pop("last_5_expenses", None)
    doc.pop("recent_expenses", None)
    doc_id = db_client.add(COLLECTION, doc)
    _invalidate_user_ai(doc["user_id"])
    return {**doc, "id": doc_id}


@router.get(
    "/{expense_id}",
    response_model=ExpenseOut,
    summary="Get a single expense",
    description="Fetches one expense document by its Firestore ID.",
)
def get_expense(
    expense_id: str,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    doc = db_client.get(COLLECTION, expense_id)
    if not doc or doc.get("user_id") != authenticated_user_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    return doc


@router.get(
    "",
    response_model=list[ExpenseOut],
    summary="List / filter expenses",
    description="Lists expenses for a user, with optional filtering by category, mood, and "
                "date range, and optional sorting by date or amount (descending).",
)
def list_expenses(
    authenticated_user_id: str = Depends(get_current_user_id),
    category: str | None = Query(None, description="Filter by category, e.g. 'food'"),
    mood: str | None = Query(None, description="Filter by mood, e.g. 'stressed'"),
    date_from: str | None = Query(None, description="ISO date lower bound (inclusive)"),
    date_to: str | None = Query(None, description="ISO date upper bound (inclusive)"),
    sort_by: str = Query("date", description="'date' or 'amount' — always sorted descending"),
):
    results = db_client.query(COLLECTION, user_id=authenticated_user_id, category=category, mood=mood)

    if date_from:
        df = parse_utc_datetime(date_from)
        if df is not None:
            results = [r for r in results if (parse_utc_datetime(r.get("date") or r.get("timestamp")) or df) >= df]
        else:
            results = [r for r in results if str(r.get("date", "")) >= date_from]
    if date_to:
        dt = parse_utc_datetime(date_to)
        if dt is not None:
            results = [r for r in results if (parse_utc_datetime(r.get("date") or r.get("timestamp")) or dt) <= dt]
        else:
            results = [r for r in results if str(r.get("date", "")) <= date_to]

    if sort_by == "amount":
        results.sort(key=lambda r: float(r.get("amount") or 0), reverse=True)
    else:
        results.sort(
            key=lambda r: (parse_utc_datetime(r.get("date") or r.get("timestamp")) or utc_now()).timestamp(),
            reverse=True,
        )
    return results


@router.delete(
    "/{expense_id}",
    summary="Delete an expense",
    description="Permanently deletes an expense document by ID.",
)
def delete_expense(
    expense_id: str,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    doc = db_client.get(COLLECTION, expense_id)
    if not doc or doc.get("user_id") != authenticated_user_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    deleted = db_client.delete(COLLECTION, expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    if doc and doc.get("user_id"):
        _invalidate_user_ai(doc["user_id"])
    return {"message": "deleted", "id": expense_id}


def _invalidate_user_ai(user_id: str) -> None:
    for key in (
        f"weekly_summary:{user_id}",
        f"personality:{user_id}",
        f"coaching:{user_id}",
    ):
        delete_cache(key)
