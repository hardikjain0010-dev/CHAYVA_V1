from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from core.datetime_utils import filter_within_days
from core.security import get_current_user_id
from routers.profile import load_profile_for_user
from services.ai_service import detect_triggers, generate_weekly_summary
from services.firebase_service import db_client
from services.pdf_service import generate_weekly_pdf, weekly_report_data

router = APIRouter(prefix="/report", tags=["PDF Reports"])

EXPENSE_COLLECTION = "expenses"


def _week_expenses(user_id: str) -> list[dict]:
    all_expenses = db_client.query(EXPENSE_COLLECTION, user_id=user_id)
    return filter_within_days(all_expenses, 7, date_keys=("date", "timestamp", "created_at"))


@router.get(
    "/weekly",
    summary="Download weekly PDF report",
    description="Generates a PDF containing the header, weekly spending table, AI insights "
                "section, and trigger summary, and returns it as a downloadable file.",
)
def report_weekly(authenticated_user_id: str = Depends(get_current_user_id)):
    user_id = authenticated_user_id
    expenses = _week_expenses(user_id)
    summary = generate_weekly_summary(expenses, user_profile=load_profile_for_user(user_id))
    triggers = detect_triggers(expenses)

    data = weekly_report_data(user_id, expenses, summary, triggers)
    pdf_path = generate_weekly_pdf(data)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"SpendMind_Weekly_Report_{user_id}.pdf",
    )
