from typing import Literal

from pydantic import BaseModel, Field, field_validator


LifeStage = Literal["student", "working", "freelancer", "homemaker", "other"]
PreferredLanguage = Literal["english", "hindi", "hinglish"]
PreferredAITone = Literal["gentle", "direct", "encouraging", "analytical"]


class UserProfileBase(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=60)
    life_stage: LifeStage | None = None
    college_or_work_context: str | None = Field(None, max_length=160)
    preferred_language: PreferredLanguage | None = None
    typical_daily_schedule: str | None = Field(None, max_length=240)
    spending_priorities: list[str] = Field(default_factory=list, max_length=5)
    financial_goals: list[str] = Field(default_factory=list, max_length=5)
    preferred_ai_tone: PreferredAITone | None = None

    @field_validator(
        "display_name",
        "college_or_work_context",
        "typical_daily_schedule",
        mode="before",
    )
    @classmethod
    def clean_text(cls, value):
        if value is None:
            return None
        text = " ".join(str(value).replace("\n", " ").split()).strip()
        return text or None

    @field_validator("spending_priorities", "financial_goals", mode="before")
    @classmethod
    def clean_list(cls, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("must be a list")
        cleaned = []
        for item in value[:5]:
            text = " ".join(str(item).replace("\n", " ").split()).strip()
            if text:
                cleaned.append(text[:80])
        return cleaned


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileOut(UserProfileBase):
    user_id: str
    created_at: str | None = None
    updated_at: str | None = None
