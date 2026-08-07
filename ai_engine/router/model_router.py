"""
SpendMind — Model Router
The ONLY entry point for all AI calls. Person B's backend calls route_prompt() exclusively.

Routing table:
  insight    → Gemini Flash (psychology depth, warm tone)
  summary    → Gemini Flash (narrative generation)
  personality → Gemini Flash (classification, deterministic)
  hindi      → Gemini Flash (Hindi-language prompts)
  reasoning  → OpenRouter (reasoning model from environment)
  fast       → Groq LLaMA 3.3 70B (nudges, WhatsApp replies, real-time)
  backup     → OpenRouter (backup model from environment)

Temperature:
  0.7 → insight, summary (warmth + natural language)
  0.3 → personality, reasoning (deterministic classification/JSON)
  0.4 → fast/nudge (some warmth, consistent logic)
"""

import json
import os
import time
from contextvars import ContextVar
from typing import Any, Optional

from dotenv import load_dotenv

from ai_engine.clients.gemini_client import call_gemini
from ai_engine.clients.groq_client import call_groq
from ai_engine.clients.openrouter_client import call_openrouter

load_dotenv()


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        raise EnvironmentError(f"{name} not found in environment.")
    value = str(value).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1].strip()
    if not value:
        raise EnvironmentError(f"{name} not found in environment.")
    return value


GEMINI_MODEL_NAME = _get_required_env("GEMINI_MODEL")
GROQ_MODEL_NAME = _get_required_env("GROQ_MODEL")
OPENROUTER_REASONING_MODEL_NAME = _get_required_env("OPENROUTER_REASONING_MODEL")
OPENROUTER_SUMMARY_MODEL_NAME = _get_required_env("OPENROUTER_SUMMARY_MODEL")

# ─────────────────────────────────────────────────────────────────────────────
# LAZY SINGLETON CLIENTS
# Initialized once at module load, not per call.
# ─────────────────────────────────────────────────────────────────────────────

_gemini_client = None
_groq_client = None
_openrouter_client = None
_LAST_ROUTE_META: ContextVar[Optional[dict]] = ContextVar("last_route_meta", default=None)


def _record_route_result(result: dict) -> dict:
    """Store metadata for developer tooling without changing feature outputs."""
    _LAST_ROUTE_META.set(
        {
            "provider": result.get("provider", "unknown"),
            "model": result.get("model", "unknown"),
            "latency_ms": result.get("latency_ms", 0),
            "fallback_used": result.get("fallback_used", False),
            "backup_model_used": result.get("backup_model_used", False),
        }
    )
    return result


def get_last_route_meta() -> dict:
    """Return metadata from the most recent route_prompt() call in this context."""
    return (_LAST_ROUTE_META.get() or {}).copy()


def clear_last_route_meta() -> None:
    """Clear route metadata before an isolated developer-runner feature call."""
    _LAST_ROUTE_META.set(None)


def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = "gemini"
    return _gemini_client


def _get_groq():
    global _groq_client
    if _groq_client is None:
        _groq_client = "groq"
    return _groq_client


def _get_openrouter():
    global _openrouter_client
    if _openrouter_client is None:
        _openrouter_client = "openrouter"
    return _openrouter_client


# ─────────────────────────────────────────────────────────────────────────────
# ROUTING TABLE
# ─────────────────────────────────────────────────────────────────────────────

ROUTING_TABLE = {
    "insight": {"provider": "gemini", "model": GEMINI_MODEL_NAME, "temperature": 0.7},
    "summary": {"provider": "openrouter", "model": OPENROUTER_REASONING_MODEL_NAME, "temperature": 0.7},
    "personality": {"provider": "openrouter", "model": OPENROUTER_SUMMARY_MODEL_NAME, "temperature": 0.3},
    "hindi": {"provider": "gemini", "model": GEMINI_MODEL_NAME, "temperature": 0.7},
    "reasoning": {"provider": "groq", "model": GROQ_MODEL_NAME, "temperature": 0.2},
    "fast": {"provider": "groq", "model": GROQ_MODEL_NAME, "temperature": 0.4},
}

# Fallback chain per provider: if primary fails, try these in order
FALLBACK_CHAIN = {
    "gemini": ["groq", "openrouter"],
    "groq": ["gemini", "openrouter"],
    "openrouter": [],
}


# ─────────────────────────────────────────────────────────────────────────────
# CORE ROUTER FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def route_prompt(
    task_type: str,
    prompt: str,
    system_override: Optional[str] = None,
    max_retries: int = 2
) -> dict:
    """
    THE SINGLE ENTRY POINT for all AI calls in SpendMind.
    Person B's backend calls this function exclusively.

    Args:
        task_type: one of "insight" | "summary" | "personality" | "reasoning" | "fast" | "backup"
        prompt: the full formatted prompt string (use builder functions from prompts/)
        system_override: optional system prompt override (rarely needed)
        max_retries: number of fallback attempts before returning graceful default

    Returns:
        {
            "success": bool,
            "raw_text": str,       # raw model response
            "parsed": dict | list, # JSON-parsed response (if parseable)
            "provider": str,       # which provider was actually used
            "model": str,          # which model was used
            "latency_ms": int,     # response time in milliseconds
            "fallback_used": bool  # True only when graceful defaults are needed
            "backup_model_used": bool  # True if an OpenRouter backup model produced the AI response
        }
    """
    if task_type not in ROUTING_TABLE:
        raise ValueError(f"Unknown AI task_type: {task_type}")

    config = ROUTING_TABLE[task_type]
    provider = config["provider"]

    # Try primary provider
    result = _call_provider(
        provider=provider,
        model=config["model"],
        prompt=prompt,
        temperature=config["temperature"],
        system_override=system_override
    )

    if result["success"]:
        result["fallback_used"] = False
        result["backup_model_used"] = False
        return _record_route_result(result)

    # Primary failed — try fallback chain
    # All providers failed — return structured failure
    return _record_route_result({
        "success": False,
        "raw_text": "",
        "parsed": None,
        "provider": provider,
        "model": config["model"],
        "latency_ms": result.get("latency_ms", 0),
        "fallback_used": True,
        "backup_model_used": False,
        "error": result.get("error", "Provider failed")
    })


def _call_provider(
    provider: str,
    model: str,
    prompt: str,
    temperature: float,
    system_override: Optional[str] = None
) -> dict:
    """
    Call a specific provider and return standardized result dict.
    """
    start = time.time()

    try:
        if provider == "gemini":
            raw_text = _call_gemini(model, prompt, temperature)
        elif provider == "groq":
            raw_text = _call_groq(model, prompt, temperature, system_override)
        elif provider == "openrouter":
            raw_text = _call_openrouter(model, prompt, temperature, system_override)
        else:
            return {"success": False, "error": f"Unknown provider: {provider}"}

        latency_ms = int((time.time() - start) * 1000)
        parsed = _try_parse_json(raw_text)

        return {
            "success": True,
            "raw_text": raw_text,
            "parsed": parsed,
            "provider": provider,
            "model": model,
            "latency_ms": latency_ms,
        }

    except Exception as e:
        latency_ms = int((time.time() - start) * 1000)
        print(f"[SpendMind Router] {provider} failed: {e}")
        return {
            "success": False,
            "raw_text": "",
            "parsed": None,
            "provider": provider,
            "model": model,
            "latency_ms": latency_ms,
            "error": str(e)
        }


# ─────────────────────────────────────────────────────────────────────────────
# PROVIDER-SPECIFIC CALLERS
# ─────────────────────────────────────────────────────────────────────────────

def _call_gemini(model: str, prompt: str, temperature: float) -> str:
    """Call Gemini Flash via the dedicated client module."""
    result = call_gemini(
        system_prompt="You are a helpful expense insight assistant.",
        user_prompt=prompt,
        model=model,
        max_retries=1,
        retry_delay=0.0,
    )
    if not result.get("success", False):
        raise RuntimeError(result.get("error") or "Gemini call failed")
    return result.get("text", "")


def _call_groq(model: str, prompt: str, temperature: float, system_override: Optional[str]) -> str:
    """Call Groq via the dedicated client module."""
    result = call_groq(
        system_prompt=system_override or "You are a helpful expense insight assistant.",
        user_prompt=prompt,
        model=model,
        max_retries=1,
        retry_delay=0.0,
    )
    if not result.get("success", False):
        raise RuntimeError(result.get("error") or "Groq call failed")
    return result.get("text", "")


def _call_openrouter(model: str, prompt: str, temperature: float, system_override: Optional[str]) -> str:
    """Call OpenRouter via the dedicated client module."""
    result = call_openrouter(
        system_prompt=system_override or "You are a helpful expense insight assistant.",
        user_prompt=prompt,
        model=model,
        max_retries=1,
        retry_delay=0.0,
    )
    if not result.get("success", False):
        raise RuntimeError(result.get("error") or "OpenRouter call failed")
    return result.get("text", "")


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

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
            if key in value:
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


def _extract_text_from_response(response: Any) -> str:
    """Extract text from common OpenAI/Gemini/OpenRouter response objects."""
    if response is None:
        return ""

    for attr in ("output_text", "text"):
        value = getattr(response, attr, None)
        if value is not None:
            text = _coerce_text(value)
            if text:
                return text

    choices = getattr(response, "choices", None)
    if choices:
        first_choice = choices[0]
        message = getattr(first_choice, "message", None)
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

    return ""


def _try_parse_json(text: str) -> Optional[dict | list]:
    """
    Attempt to parse JSON from model response.
    Accepts plain JSON, fenced JSON, or JSON surrounded by explanatory text.
    Returns None if parsing fails.
    """
    if not text:
        return None

    cleaned = text.strip()
    candidates = [cleaned]

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        candidates.append("\n".join(lines).strip())

    decoder = json.JSONDecoder()
    for candidate in candidates:
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

        for index, char in enumerate(candidate):
            if char not in "{[":
                continue
            try:
                parsed, _ = decoder.raw_decode(candidate[index:])
                return parsed
            except json.JSONDecodeError:
                continue

    return None


def get_routing_info() -> dict:
    """Returns the current routing table (for debugging/logging)."""
    return ROUTING_TABLE


if __name__ == "__main__":
    sample_prompt = (
        "You are a helpful expense insight assistant. "
        "Reply with a short, warm insight about an expense."
    )
    sample_user_prompt = (
        "Expense: ₹350 on Swiggy at 11:30 PM. Mood: stressed. "
        "Category: food. Notes: had an exam tomorrow."
    )

    result = route_prompt(
        task_type="insight",
        prompt=sample_user_prompt,
        system_override=sample_prompt,
    )
    print(result)
