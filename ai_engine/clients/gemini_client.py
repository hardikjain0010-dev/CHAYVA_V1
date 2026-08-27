"""
clients/gemini_client.py
────────────────────────
Wraps the Google Gemini Flash API for SpendMind.

Gemini Flash is our PRIMARY model for behavioral psychology insights.
It is chosen because:
  • Strong reasoning about human emotion and behavior
  • Good Hindi support
  • Fast enough for real-time expense insights
  • Generous free tier on Google AI Studio

Day 9 task: test this file, time the response, save to gemini_test.json.
"""

import os
import time
import json
from typing import Any, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

from google import genai
from dotenv import load_dotenv

from ai_engine.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


# ── Module-level client (created once, reused across calls) ──────────────────
def _get_optional_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    return value.strip()


def _build_client() -> genai.Client | None:
    """Configure the Gemini SDK and return a ready-to-use client, or None if API key is missing."""
    api_key = _get_optional_env("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured - Gemini provider unavailable")
        return None
    logger.info("Gemini client initialised")
    return genai.Client(api_key=api_key)


# Lazy singleton — client is created only on first actual call
_client: Optional[genai.Client] = None


def _get_client() -> genai.Client | None:
    global _client
    if _client is None:
        _client = _build_client()
    return _client


# ── Public function ──────────────────────────────────────────────────────────

def call_gemini(
    system_prompt: str,
    user_prompt: str,
    model: Optional[str] = None,
    max_retries: int = 3,
    retry_delay: float = 2.0,
    timeout_ms: int = 30000,
) -> dict:
    """
    Send a prompt to Gemini Flash and return a structured response dict.
    """
    client = _get_client()
    if client is None:
        logger.warning("Gemini provider unavailable - API key not configured")
        return {
            "text": "",
            "model": model or "unknown",
            "provider": "gemini",
            "latency_ms": 0,
            "success": False,
            "error": "Provider unavailable - API key not configured"
        }

    model_name = (model or _get_optional_env("GEMINI_MODEL") or "gemini-3.6-flash").strip()
    if model_name in ("gemini-2.0-flash-exp", "gemini-1.5-flash-latest", "gemini-2.0-flash"):
        model_name = "gemini-3.6-flash"

    # Combine system + user prompt (Gemini SDK style)
    full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Gemini call attempt {attempt}/{max_retries}")
            start = time.time()

            executor = ThreadPoolExecutor(max_workers=1)
            future = executor.submit(
                client.models.generate_content,
                model=model_name,
                contents=full_prompt,
            )
            try:
                response = future.result(timeout=timeout_ms / 1000.0)
            except FutureTimeoutError:
                latency_ms = int((time.time() - start) * 1000)
                logger.error(f"Gemini timeout after {latency_ms}ms (enforced non-blocking)")
                executor.shutdown(wait=False, cancel_futures=True)
                return {
                    "text": "",
                    "model": model_name,
                    "provider": "gemini",
                    "latency_ms": latency_ms,
                    "success": False,
                    "error": "Request timeout"
                }
            finally:
                executor.shutdown(wait=False, cancel_futures=True)

            latency_ms = int((time.time() - start) * 1000)
            text = _extract_text(response)

            logger.info(f"Gemini success — {latency_ms}ms — {len(text)} chars")

            return {
                "text":       text,
                "model":      model_name,
                "provider":   "gemini",
                "latency_ms": latency_ms,
                "success":    True,
                "error":      None,
            }

        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            logger.warning(f"Gemini attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(retry_delay)

    # All retries exhausted
    logger.error("Gemini: all retries failed")
    return {
        "text":       "",
        "model":      model_name,
        "provider":   "gemini",
        "latency_ms": 0,
        "success":    False,
        "error":      "All retries failed",
    }


def _extract_text(response: Any) -> str:
    """Extract text from a google-genai GenerateContentResponse."""
    return (getattr(response, "text", "") or "").strip()


# ── Day 9 manual test ────────────────────────────────────────────────────────
if __name__ == "__main__":
    """
    Run this directly to test Gemini and save the response to gemini_test.json.
    Command: python clients/gemini_client.py
    """
    SYSTEM = (
        "You are a warm, non-judgmental behavioral finance coach for Indian "
        "college students. Never shame the user. Always explain WHY they might "
        "be spending, not just WHAT they spent. Keep your response to 2-3 sentences."
    )

    USER = (
        "Expense: ₹350 on Swiggy at 11:30 PM on a Tuesday. "
        "Mood: stressed. Category: food. Notes: had an exam tomorrow."
    )

    print("─" * 60)
    print("Testing Gemini Flash…")
    print("─" * 60)

    result = call_gemini(SYSTEM, USER)

    # Pretty print to terminal
    print(f"Provider : {result['provider']}")
    print(f"Model    : {result['model']}")
    print(f"Latency  : {result['latency_ms']} ms")
    print(f"Success  : {result['success']}")
    print(f"\nResponse :\n{result['text']}")

    # Save to file so you can study the raw structure
    with open("gemini_test.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("\n✅ Saved to gemini_test.json")
