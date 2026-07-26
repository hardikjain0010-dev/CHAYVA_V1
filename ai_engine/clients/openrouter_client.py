"""
OpenRouter client for SpendMind.

This module wraps OpenRouter through the OpenAI-compatible SDK and returns a
structured response payload that matches the router interface used by the other
providers.
"""

import os
import time
from typing import Any, Optional

from dotenv import load_dotenv
from openai import OpenAI

from ai_engine.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


def _get_env_model(name: str, default: str) -> str:
    value = os.getenv(name, default)
    if value is None:
        return default
    value = str(value).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1].strip()
    return value or default


# ── Lazy singleton ────────────────────────────────────────────────────────────
_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "OPENROUTER_API_KEY not found. Add it to your .env file."
            )

        _client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        logger.info("OpenRouter client initialised")
    return _client


def _coerce_text(value: Any) -> str:
    """Best-effort conversion of OpenAI/OpenRouter response payloads into text."""
    if value is None:
        return ""

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, (list, tuple)):
        parts = []
        for item in value:
            text = _coerce_text(item)
            if text:
                parts.append(text)
        return "\n".join(parts).strip()

    if isinstance(value, dict):
        for key in ("text", "content", "value"):
            if key in value and value[key] is not None:
                text = _coerce_text(value[key])
                if text:
                    return text
        if value.get("type") == "text":
            return _coerce_text(value.get("text", ""))
        return ""

    if hasattr(value, "text") and getattr(value, "text") is not None:
        return _coerce_text(getattr(value, "text"))

    if hasattr(value, "content") and getattr(value, "content") is not None:
        return _coerce_text(getattr(value, "content"))

    if hasattr(value, "value") and getattr(value, "value") is not None:
        return _coerce_text(getattr(value, "value"))

    return str(value).strip()


def _extract_text_from_completion(completion: Any) -> str:
    """Extract text from various OpenAI-compatible completion objects."""
    if completion is None:
        return ""

    for attr in ("output_text", "text"):
        value = getattr(completion, attr, None)
        if value is not None:
            text = _coerce_text(value)
            if text:
                return text

    choices = getattr(completion, "choices", None)
    if choices:
        first_choice = choices[0]
        message = getattr(first_choice, "message", None)
        if message is None:
            message = getattr(first_choice, "delta", None)

        if message is not None:
            text = _coerce_text(getattr(message, "content", None))
            if text:
                return text

            for attr in ("reasoning", "reasoning_content", "refusal"):
                value = getattr(message, attr, None)
                if value is not None:
                    text = _coerce_text(value)
                    if text:
                        return text

    for attr in ("reasoning", "reasoning_content", "refusal"):
        value = getattr(completion, attr, None)
        if value is not None:
            text = _coerce_text(value)
            if text:
                return text

    return ""


# ── Public function ───────────────────────────────────────────────────────────

def call_openrouter(
    system_prompt: str,
    user_prompt: str,
    model: Optional[str] = None,
    max_retries: int = 3,
    retry_delay: float = 2.0,
) -> dict:
    """
    Send a prompt to OpenRouter and return a structured response dict.

    Args:
        system_prompt: Persona and rules.
        user_prompt:   The expense data or question.
        model:         Override model string. Defaults to OPENROUTER_REASONING_MODEL from .env.
        max_retries:   Retry attempts.
        retry_delay:   Seconds between retries.

    Returns:
        {
            "text":          str,
            "model":         str,
            "provider":      str,   # "openrouter"
            "latency_ms":    int,
            "success":       bool,
            "error":         str | None
        }
    """
    model_name = (
        model
        or _get_env_model("OPENROUTER_REASONING_MODEL", "openai/gpt-oss-120b:free")
        or _get_env_model("OPENROUTER_MODEL", "")
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_error: Optional[str] = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                "OpenRouter call attempt %s/%s using model: %s",
                attempt,
                max_retries,
                model_name,
            )
            logger.info("OpenRouter latency will be measured for model: %s", model_name)
            start = time.time()

            client = _get_client()
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
            )

            latency_ms = int((time.time() - start) * 1000)
            text = _extract_text_from_completion(completion)

            logger.info(
                "OpenRouter success — %sms — %s chars",
                latency_ms,
                len(text),
            )

            return {
                "text": text,
                "model": model_name,
                "provider": "openrouter",
                "latency_ms": latency_ms,
                "success": True,
                "error": None,
            }

        except Exception as exc:
            last_error = f"{type(exc).__name__}: {exc}"
            logger.warning(
                "OpenRouter attempt %s/%s failed for model %s: %s",
                attempt,
                max_retries,
                model_name,
                last_error,
            )
            if attempt < max_retries:
                time.sleep(retry_delay)

    logger.error("OpenRouter: all retries failed for model %s", model_name)
    return {
        "text": "",
        "model": model_name,
        "provider": "openrouter",
        "latency_ms": 0,
        "success": False,
        "error": last_error or "All retries failed",
    }


# ── Manual test ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    """
    Run: python openrouter_client.py
    """
    SYSTEM = (
        "You are a warm behavioral finance coach for Indian students. "
        "Give a 2-sentence insight about why this person spent money. "
        "Never shame them."
    )
    USER = (
        "Expense: ₹350 on Swiggy at 11:30 PM on a Tuesday. "
        "Mood: stressed. Category: food. Notes: had an exam tomorrow."
    )

    model_name = (
        _get_env_model("OPENROUTER_REASONING_MODEL", "openai/gpt-oss-120b:free")
        or _get_env_model("OPENROUTER_MODEL", "")
    )

    print("─" * 60)
    print(f"Testing OpenRouter with: {model_name}")
    print("─" * 60)

    result = call_openrouter(SYSTEM, USER, model=model_name)

    print(f"Latency  : {result['latency_ms']} ms")
    print(f"Success  : {result['success']}")
    print(f"Response : {result['text']}")
    print()
