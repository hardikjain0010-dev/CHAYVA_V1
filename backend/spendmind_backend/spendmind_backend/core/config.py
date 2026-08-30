"""
Central configuration for SpendMind backend.
All settings are loaded from environment variables (.env file).
Never hardcode secrets here.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from backend directory
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
env_file = backend_dir / ".env"
load_dotenv(env_file)


class Settings:
    # --- Firebase ---
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_CREDENTIALS_JSON: str = os.getenv("FIREBASE_CREDENTIALS_JSON", "")  # raw JSON, for hosts like Render

    # --- AI provider keys (used by services/ai_service.py) ---
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

     # --- Twilio (webhook verification / replies) ---
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")

    # --- App behavior ---
    ENV: str = os.getenv("ENV", "development")  # development | production
    
    @property
    def CORS_ORIGINS(self) -> list:
        """Get CORS origins, supporting production Vercel app and localhost dev."""
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://chayva-v1.vercel.app",
            "https://arthyne-v1.vercel.app",
            "https://arthyne.vercel.app",
        ]
        cors_env = os.getenv("CORS_ORIGINS", "").strip()
        if cors_env:
            custom = [o.strip() for o in cors_env.split(",") if o.strip()]
            for origin in custom:
                if origin not in defaults:
                    defaults.append(origin)
        return defaults

   # --- Rate limiting ---
    AI_CALLS_PER_HOUR: int = int(os.getenv("AI_CALLS_PER_HOUR", "30"))

    # --- Cache TTLs (seconds) ---
    WEEKLY_SUMMARY_TTL: int = 24 * 60 * 60       # 24 hours
    PERSONALITY_TTL: int = 7 * 24 * 60 * 60      # 7 days

    # --- Daily AI cost guardrail (INR) ---
    DAILY_COST_ALERT_THRESHOLD: float = float(os.getenv("DAILY_COST_ALERT_THRESHOLD", "50"))

    # --- Authentication (JWT & Google) ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fallback-secret-key-for-dev-only")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "placeholder-google-client-id")

    
settings = Settings()