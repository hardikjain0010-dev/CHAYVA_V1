# SpendMind Backend

Full FastAPI backend for SpendMind, covering the "Backend Developer" scope
from the dev plan: expense CRUD, Firebase Auth, analytics, AI-bridged
behavioral insights, SMS import, WhatsApp webhook, voice upload endpoint,
weekly PDF reports, caching, rate limiting, and error handling.

**Runs out of the box with zero external setup** — no Firebase project, no
AI API keys needed to try it. See "Dev mode" below.

## Quickstart

```bash
pip install -r requirements.txt
cp .env.example .env      # optional — defaults work without any keys
uvicorn main:app --reload
```

Open http://localhost:8000/docs for interactive Swagger UI.

Run tests:
```bash
pytest -v
```

## Dev mode (no credentials required)

- **No Firebase configured?** `services/firebase_service.py` automatically
  falls back to an in-memory database. Data resets when the server restarts,
  but every endpoint works normally.
- **No Firebase Auth configured?** `core/security.py` accepts any non-empty
  bearer token in "dev mode" and derives a fake uid from it, so `/auth/verify`
  and any auth-protected route still work for local testing.
- **No AI API keys configured?** `services/ai_service.py` uses deterministic
  rule-based logic instead of calling Gemini/Groq/OpenRouter, so
  every insight, summary, personality, trigger, and nudge endpoint returns
  real, sensible-looking data immediately.

To go to production: add real Firebase credentials and AI API keys to `.env`
— nothing else in the code needs to change.

## Project structure

```
main.py                    FastAPI app, routers, CORS, rate limiter, exception handlers
core/
  config.py                Environment-based settings
  security.py               Firebase Auth token verification (+ dev-mode fallback)
  limiter.py                Shared slowapi rate limiter instance
  exceptions.py             Consistent {error, message, code} error responses
models/
  expense_model.py          All Pydantic request/response schemas
routers/
  expense.py                POST/GET/DELETE /expenses (CRUD)
  mood.py                    POST /mood, GET /moods
  insights.py                /analytics/weekly, /analytics/summary,
                              /insights/weekly, /insights/personality,
                              /insights/triggers, /nudges/current
  spend_dna.py               /insights/spend-dna (viral share card data)
  auth.py                    POST /auth/verify
  sms.py                     POST /sms/import, /sms/import/confirm
  webhook.py                 POST /webhook/whatsapp (Twilio)
  voice.py                   POST /voice/transcribe
  report.py                  GET /report/weekly (PDF download)
services/
  firebase_service.py       Firestore wrapper + in-memory fallback
  ai_service.py              THE AI BRIDGE — every function Person C's AI
                              pipeline plugs into (see below)
  sms_parser.py              Regex-based Indian bank/UPI SMS parser
  cache_service.py           TTL cache for expensive data queries
  pdf_service.py             ReportLab weekly PDF report builder
tests/
  test_core_endpoints.py     16 tests covering all core flows
```

## Wiring up real AI models

`services/ai_service.py` is the **single file** where AI providers are
called. Every function already has the exact input/output contract the
routers expect, plus a rule-based fallback. To connect real models:

1. Add API keys to `.env` (`GEMINI_API_KEY`, `GROQ_API_KEY`, etc.)
2. In each function (`analyze_expense`, `generate_weekly_summary`,
   `classify_personality`, `detect_triggers`, `predict_nudge`,
   `parse_whatsapp_message`, `voice_to_expense`, `generate_spend_dna`),
   replace the `# --- REAL MODEL CALL ... ---` block with an actual SDK call,
   parsing the model's JSON response into the same dict shape already
   returned by the fallback.
3. Nothing in `routers/` or `main.py` needs to change.

For voice transcription, install the optional heavy dependency:
```bash
pip install openai-whisper
```

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/expenses` | Create expense + get AI insight |
| GET | `/expenses/{id}` | Get one expense |
| GET | `/expenses` | List/filter expenses (category, mood, date range) |
| DELETE | `/expenses/{id}` | Delete expense |
| POST | `/mood` | Log a mood entry |
| GET | `/moods` | List mood entries |
| GET | `/analytics/weekly` | Weekly totals by category/day (for charts) |
| GET | `/analytics/summary` | Total, top category, most impulsive day |
| POST | `/insights/weekly` | AI weekly narrative summary (24h cache) |
| GET | `/insights/personality` | Spending personality type (7d cache) |
| GET | `/insights/triggers` | Top 3 behavioral triggers |
| GET | `/nudges/current` | Predictive nudge for right now |
| GET | `/insights/spend-dna` | Viral "Spend DNA" share card data |
| POST | `/auth/verify` | Verify Firebase ID token |
| POST | `/sms/import` | Preview a parsed bank SMS |
| POST | `/sms/import/confirm` | Confirm + save SMS-imported expense |
| POST | `/webhook/whatsapp` | Twilio inbound WhatsApp webhook |
| POST | `/voice/transcribe` | Upload audio → transcribed expense |
| GET | `/report/weekly` | Download weekly PDF report |

## Rate limiting

AI-touching endpoints (`/insights/*`, `/nudges/current`, `/voice/transcribe`)
are capped at `AI_CALLS_PER_HOUR` (default 30) per client, returning HTTP 429
with a friendly message when exceeded.

## Deployment (Render)

1. Push this repo to GitHub (`.env` is gitignored — never commit secrets).
2. Create a Web Service on render.com, connect the repo.
3. Environment: Python. Start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Add all `.env` variables in Render's dashboard.
