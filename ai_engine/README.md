# SpendMind — AI Engine

## Architecture

```
User
 ↓
Frontend (React)
 ↓
Backend (FastAPI — Person B)
 ↓  calls route_prompt() ONLY
AI Layer (ai-engine/)
 ↓
model_router.py  ←  single entry point
 ↓
 ├── insight / summary / personality  →  Gemini Flash
 ├── reasoning / triggers             →  Groq LLaMA 3.3 70B
 ├── fast / nudge / whatsapp          →  Groq LLaMA 3.3 70B
 └── all fallbacks                    →  OpenRouter (free)
```

## Model Routing Table

| Task Type   | Primary Model      | Temperature | Use Case                        |
|-------------|-------------------|-------------|---------------------------------|
| insight     | Gemini Flash      | 0.7         | Single expense behavioral analysis |
| summary     | Gemini Flash      | 0.7         | 7-day weekly recap              |
| personality | Gemini Flash      | 0.3         | Spending type classification    |
| reasoning   | Groq LLaMA 3.3 70B| 0.2         | 30-day trigger pattern analysis |
| fast        | Groq LLaMA 3.3 70B| 0.4         | Nudges, WhatsApp replies        |
| backup      | OpenRouter free   | 0.5         | Fallback for all tasks          |

## Fallback Chain

```
gemini   fails → groq → openrouter
groq     fails → gemini → openrouter
```

## File Structure

```
ai-engine/
├── model_router.py          # ONLY entry point — all AI calls go here
├── analyze.py               # analyze_expense()
├── summarize.py             # generate_weekly_summary()
├── personality.py           # classify_personality()
├── triggers.py              # detect_triggers()
├── nudge.py                 # predict_nudge()
├── requirements.txt
│
├── prompts/
│   ├── __init__.py
│   ├── base.py              # MASTER_SYSTEM_PROMPT + GRACEFUL_DEFAULTS
│   ├── insight_prompts.py   # build_insight_prompt()
│   ├── summary_prompt.py    # build_weekly_summary_prompt() + validate_weekly_summary()
│   ├── personality_prompt.py# build_personality_prompt()
│   ├── trigger_prompt.py    # build_trigger_prompt() + validate_triggers()
│   └── nudge_prompt.py      # build_nudge_prompt() + should_attempt_nudge()
│
└── tests/
    ├── __init__.py
    ├── test_insight.py      # 20 tests for analyze_expense()
    ├── test_weekly.py       # 20 tests for generate_weekly_summary()
    ├── test_personality.py  # 20 tests for classify_personality()
    ├── test_trigger.py      # 20 tests for detect_triggers()
    └── test_nudge.py        # 20 tests for predict_nudge()
```

## .env File (required)

Create `ai-engine/.env`:

```
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

## How Person B Calls the AI Layer

```python
# In ai_service.py (Person B's backend)
from ai_engine.router.model_router import route_prompt
from ai_engine.prompts.insight_prompts import build_insight_prompt

# 1. Build prompt
prompt = build_insight_prompt(
    amount=350,
    category="food",
    mood="stressed",
    notes="ordered after exam",
    time_of_day="night",
    last_5_expenses=[]
)

# 2. Route to model — that's it
result = route_prompt(task_type="insight", prompt=prompt)

# 3. Use the result
if result["success"]:
    insight_data = result["parsed"]  # already parsed JSON dict
```

Or use the high-level functions directly:

```python
from ai_engine.prompts.analyze import analyze_expense
from ai_engine.prompts.summarize import generate_weekly_summary
from ai_engine.prompts.personality import classify_personality
from ai_engine.prompts.triggers import detect_triggers
from ai_engine.prompts.nudge import predict_nudge
```

## Run Tests

```powershell
# From ai-engine directory
cd D:\spendmind-v1\spendmind-v1\ai-engine

# Run all tests
python -m pytest tests/ -v

# Run one file
python -m pytest tests/test_insight.py -v

# Run with coverage
python -m pytest tests/ -v --tb=short
```

## Graceful Defaults

Every AI function returns a safe fallback when all models fail.
The frontend will NEVER see a blank screen or crash from AI failure.
All fallbacks are non-judgmental and written in SpendMind's voice.

## Personality Classification Rules

- Minimum **15 expenses** required before classification runs
- Below 15: returns `{"type": "forming", "expenses_needed": N}`
- Frontend shows a "personality forming" state until threshold is met
- Recalculate weekly — cache result in Firestore

## Nudge Cost Optimization

The `should_attempt_nudge()` pre-check in `nudge_prompt.py` runs in Python
with zero API calls. It skips the model entirely when no trigger pattern
matches the current time/day. This saves ~80-90% of nudge API costs.
