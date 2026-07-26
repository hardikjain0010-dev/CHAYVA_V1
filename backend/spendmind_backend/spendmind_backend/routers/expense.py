from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from models.expense_model import ExpenseCreate, ExpenseOut
from services.firebase_service import db_client, now_iso
from services.ai_service import analyze_expense

router = APIRouter(prefix="/expenses", tags=["Expenses"])

COLLECTION = "expenses"


@router.post(
    "",
    response_model=ExpenseOut,
    summary="Create an expense",
    description="Saves a new expense to Firestore, runs it through the AI behavioral-insight "
                "pipeline, and returns the saved expense together with its insight.",
)
def create_expense(payload: ExpenseCreate):
    doc = payload.model_dump()
    doc["date"] = doc.get("date") or now_iso()
    doc["source"] = doc.get("source") or "manual"

    insight = None
    try:
        insight = analyze_expense(doc)
    except Exception:
        insight = None

    doc["insight"] = insight
    doc_id = db_client.add(COLLECTION, doc)
    return {**doc, "id": doc_id}


@router.get(
    "/{expense_id}",
    response_model=ExpenseOut,
    summary="Get a single expense",
    description="Fetches one expense document by its Firestore ID.",
)
def get_expense(expense_id: str):
    doc = db_client.get(COLLECTION, expense_id)
    if not doc:
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
    user_id: str = Query(..., description="Firebase UID to filter by"),
    category: str | None = Query(None, description="Filter by category, e.g. 'food'"),
    mood: str | None = Query(None, description="Filter by mood, e.g. 'stressed'"),
    date_from: str | None = Query(None, description="ISO date lower bound (inclusive)"),
    date_to: str | None = Query(None, description="ISO date upper bound (inclusive)"),
    sort_by: str = Query("date", description="'date' or 'amount' — always sorted descending"),
):
    results = db_client.query(COLLECTION, user_id=user_id, category=category, mood=mood)

    if date_from:
        results = [r for r in results if r.get("date", "") >= date_from]
    if date_to:
        results = [r for r in results if r.get("date", "") <= date_to]

    reverse = True
    key = "amount" if sort_by == "amount" else "date"
    results.sort(key=lambda r: r.get(key, 0), reverse=reverse)
    return results


@router.delete(
    "/{expense_id}",
    summary="Delete an expense",
    description="Permanently deletes an expense document by ID.",
)
def delete_expense(expense_id: str):
    deleted = db_client.delete(COLLECTION, expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "deleted", "id": expense_id}
