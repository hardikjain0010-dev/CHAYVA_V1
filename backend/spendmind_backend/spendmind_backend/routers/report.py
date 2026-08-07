from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from services.firebase_service import db_client
from services.ai_service import generate_weekly_summary, detect_triggers
from services.pdf_service import weekly_report_data, generate_weekly_pdf
from core.security import get_current_user_id

router = APIRouter(prefix="/report", tags=["PDF Reports"])

EXPENSE_COLLECTION = "expenses"


def _week_expenses(user_id: str) -> list[dict]:
    cutoff = datetime.utcnow() - timedelta(days=7)
    all_expenses = db_client.query(EXPENSE_COLLECTION, user_id=user_id)
    out = []
    for e in all_expenses:
        try:
            if datetime.fromisoformat(e.get("date", "")) >= cutoff:
                out.append(e)
        except Exception:
            continue
    return out


@router.get(
    "/weekly",
    summary="Download weekly PDF report",
    description="Generates a PDF containing the header, weekly spending table, AI insights "
                "section, and trigger summary, and returns it as a downloadable file.",
)
def report_weekly(authenticated_user_id: str = Depends(get_current_user_id)):
    user_id = authenticated_user_id
    expenses = _week_expenses(user_id)
    summary = generate_weekly_summary(expenses)
    triggers = detect_triggers(expenses)

    data = weekly_report_data(user_id, expenses, summary, triggers)
    pdf_path = generate_weekly_pdf(data)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"SpendMind_Weekly_Report_{user_id}.pdf",
    )
