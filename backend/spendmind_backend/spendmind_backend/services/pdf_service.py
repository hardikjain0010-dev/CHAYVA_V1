"""
Builds the weekly PDF report using ReportLab (Platypus).
"""
import os
import tempfile
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
)


from core.datetime_utils import utc_now


def weekly_report_data(user_id: str, expenses: list[dict], summary: dict, triggers: list[dict]) -> dict:
    """
    Gathers everything needed for the PDF: weekly totals, top categories,
    key AI insights, and behavior trends.
    """
    total = sum(e.get("amount", 0) for e in expenses)
    by_category: dict[str, float] = {}
    for e in expenses:
        cat = e.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + e.get("amount", 0)

    top_categories = sorted(by_category.items(), key=lambda kv: kv[1], reverse=True)[:5]

    return {
        "user_id": user_id,
        "generated_at": utc_now().strftime("%d %b %Y, %H:%M UTC"),
        "total_spent": total,
        "expense_count": len(expenses),
        "top_categories": top_categories,
        "summary": summary,
        "triggers": triggers,
        "expenses": expenses,
    }


def generate_weekly_pdf(report_data: dict) -> str:
    """
    Renders `report_data` (from weekly_report_data) into a PDF file and
    returns the file path. Caller is responsible for cleanup after sending.
    """
    tmp_dir = tempfile.gettempdir()
    file_path = os.path.join(tmp_dir, f"spendmind_report_{report_data['user_id']}_{int(utc_now().timestamp())}.pdf")

    doc = SimpleDocTemplate(file_path, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#065F46"))
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#047857"))
    body_style = styles["BodyText"]

    story = []
    story.append(Paragraph("SpendMind — Weekly Report", title_style))
    story.append(Paragraph(f"Generated {report_data['generated_at']}", body_style))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Summary", heading_style))
    story.append(Paragraph(report_data["summary"].get("headline", ""), body_style))
    story.append(Paragraph(report_data["summary"].get("top_insight", ""), body_style))
    story.append(Paragraph(f"One win this week: {report_data['summary'].get('one_win', '')}", body_style))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Spending Table", heading_style))
    table_data = [["Category", "Amount (₹)"]]
    for cat, amt in report_data["top_categories"]:
        table_data.append([cat.title(), f"{amt:.2f}"])
    table_data.append(["Total", f"{report_data['total_spent']:.2f}"])

    table = Table(table_data, colWidths=[8 * cm, 6 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFDF5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#065F46")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E7E5E4")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#FAFAF9")]),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Behavioral Triggers", heading_style))
    if report_data["triggers"]:
        for t in report_data["triggers"]:
            story.append(Paragraph(f"• {t.get('trigger', 'Unknown')} — seen {t.get('frequency', 0)} times", body_style))
    else:
        story.append(Paragraph("Not enough data yet to detect triggers.", body_style))

    doc.build(story)
    return file_path
