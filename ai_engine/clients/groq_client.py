"""
clients/groq_client.py
──────────────────────
Wraps the Groq API (LLaMA 3) for SpendMind.

Groq is our FAST model for:
  • WhatsApp message parsing  (needs instant feel — under 1s)
  • Predictive nudges         (real-time triggers)
  • Any "fast" classified task

Why Groq?
  Groq runs LLaMA 3 on custom LPU hardware.
  It's consistently 5-10x faster than other providers.
  Free tier is generous for a prototype.

Day 10 task: test this file, compare latency with Gemini.
"""

import os
import time
from typing import Optional

from groq import Groq
from dotenv import load_dotenv

from ai_engine.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


# ── Lazy singleton ────────────────────────────────────────────────────────────
_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GROQ_API_KEY not found. Add it to your .env file."
            )
        _client = Groq(api_key=api_key)
        logger.info("Groq client initialised")
    return _client


# ── Public function ───────────────────────────────────────────────────────────

def call_groq(
    system_prompt: str,
    user_prompt: str,
    max_retries: int = 3,
    retry_delay: float = 2.0,
) -> dict:
    """
    Send a prompt to Groq (LLaMA 3) and return a structured response dict.

    Args:
        system_prompt: Persona and rules for the AI.
        user_prompt:   The expense data or question.
        max_retries:   Retry attempts on transient errors.
        retry_delay:   Seconds between retries.

    Returns:
        {
            "text":          str,
            "model":         str,
            "provider":      str,   # "groq"
            "latency_ms":    int,
            "success":       bool,
            "error":         str | None
        }

    Design note:
        Groq uses the OpenAI-compatible chat completions format, so we send
        system and user as separate message objects — cleaner than Gemini's
        combined prompt approach.
    """
    client = _get_client()
    model_name = os.getenv("GROQ_MODEL", "llama3-8b-8192")

    messages = [
        {"role": "system",  "content": system_prompt},
        {"role": "user",    "content": user_prompt},
    ]

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Groq call attempt {attempt}/{max_retries}")
            start = time.time()

            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,      # Slightly creative but consistent
                max_tokens=512,       # Nudges and WhatsApp replies are short
            )

            latency_ms = int((time.time() - start) * 1000)
            text = completion.choices[0].message.content.strip()

            logger.info(f"Groq success — {latency_ms}ms — {len(text)} chars")

            return {
                "text":       text,
                "model":      model_name,
                "provider":   "groq",
                "latency_ms": latency_ms,
                "success":    True,
                "error":      None,
            }

        except Exception as e:
            logger.warning(f"Groq attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(retry_delay)

    logger.error("Groq: all retries failed")
    return {
        "text":       "",
        "model":      model_name,
        "provider":   "groq",
        "latency_ms": 0,
        "success":    False,
        "error":      "All retries failed",
    }


# ── Day 10 manual test ────────────────────────────────────────────────────────
if __name__ == "__main__":
    """
    Run: python clients/groq_client.py
    Compare the latency number with Gemini's latency from gemini_test.json.
    """
    SYSTEM = (
        "You are a fast, warm spending coach for Indian students. "
        "Parse the expense and give a one-sentence insight. Be brief."
    )

    USER = (
        "Expense: ₹350 on Swiggy at 11:30 PM on a Tuesday. "
        "Mood: stressed. Category: food. Notes: had an exam tomorrow."
    )

    print("─" * 60)
    print("Testing Groq LLaMA 3…")
    print("─" * 60)

    result = call_groq(SYSTEM, USER)

    print(f"Provider : {result['provider']}")
    print(f"Model    : {result['model']}")
    print(f"Latency  : {result['latency_ms']} ms  ← compare with Gemini!")
    print(f"Success  : {result['success']}")
    print(f"\nResponse :\n{result['text']}")