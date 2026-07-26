from fastapi import APIRouter, Request, Response

from services.firebase_service import db_client, now_iso
from services.ai_service import parse_whatsapp_message, analyze_expense, get_whatsapp_reply

router = APIRouter(prefix="/webhook", tags=["WhatsApp Webhook"])

EXPENSE_COLLECTION = "expenses"
LOG_COLLECTION = "whatsapp_logs"


def _twiml_reply(message: str) -> str:
    # Minimal TwiML — avoids requiring the twilio SDK just to build a reply.
    escaped = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{escaped}</Message></Response>'


@router.post(
    "/whatsapp",
    summary="Twilio WhatsApp inbound webhook",
    description="Receives incoming WhatsApp messages from Twilio (Body = message text, "
                "From = sender's phone number), parses them into an expense via the AI "
                "pipeline, saves it, and replies with a confirmation + insight via TwiML.",
)
async def whatsapp_webhook(request: Request):
    form = await request.form()
    body_text = form.get("Body", "")
    from_number = form.get("From", "unknown")

    log_entry = {"from": from_number, "body": body_text, "timestamp": now_iso(), "outcome": None}

    try:
        parsed = parse_whatsapp_message(body_text)
        if parsed.get("amount") is None:
            reply = "I couldn't find an amount in that message — try something like '200 on chai' 🙂"
            log_entry["outcome"] = "no_amount_found"
            db_client.add(LOG_COLLECTION, log_entry)
            return Response(content=_twiml_reply(reply), media_type="application/xml")

        expense_doc = {
            "user_id": from_number,
            "amount": parsed["amount"],
            "category": parsed.get("category", "general"),
            "notes": parsed.get("notes"),
            "date": now_iso(),
            "source": "whatsapp",
        }

        insight = analyze_expense(expense_doc) or {}
        expense_doc["insight"] = insight
        expense_id = db_client.add(EXPENSE_COLLECTION, expense_doc)

        reply = get_whatsapp_reply(expense_doc, insight)
        log_entry["outcome"] = f"saved:{expense_id}"
        db_client.add(LOG_COLLECTION, log_entry)
        return Response(content=_twiml_reply(reply), media_type="application/xml")

    except Exception as e:
        # Never crash the webhook — always send a friendly fallback reply.
        log_entry["outcome"] = f"error:{e}"
        db_client.add(LOG_COLLECTION, log_entry)
        reply = "Something went wrong on my end logging that — mind trying again in a moment?"
        return Response(content=_twiml_reply(reply), media_type="application/xml")
