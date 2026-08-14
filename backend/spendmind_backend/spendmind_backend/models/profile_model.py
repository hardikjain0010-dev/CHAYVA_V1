from typing import Literal

from pydantic import BaseModel, Field, field_validator


LifeStage = Literal["student", "working", "student_working", "freelancer", "homemaker", "other"]
PreferredLanguage = Literal["english", "hindi", "hinglish"]
PreferredAITone = Literal["gentle", "direct", "encouraging", "analytical", "friendly"]
SelfReportedSpendingTrigger = Literal[
    "stress",
    "boredom",
    "social_situations",
    "seeing_something_i_want",
    "treating_or_rewarding_myself",
    "convenience",
    "unknown",
    "other",
]
SelfReportedSpendingContext = Literal[
    "morning",
    "during_college_or_work",
    "after_college_or_work",
    "evening",
    "late_night",
    "weekends",
    "with_friends",
    "online_scrolling",
    "it_depends",
]


class UserProfileBase(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=60)
    life_stage: LifeStage | None = None
    college_or_work_context: str | None = Field(None, max_length=160)
    preferred_language: PreferredLanguage | None = None
    typical_daily_schedule: str | None = Field(None, max_length=240)
    spending_priorities: list[str] = Field(default_factory=list, max_length=5)
    financial_goals: list[str] = Field(default_factory=list, max_length=5)
    preferred_ai_tone: PreferredAITone | None = None
    self_reported_spending_triggers: list[SelfReportedSpendingTrigger] = Field(default_factory=list, max_length=4)
    self_reported_spending_contexts: list[SelfReportedSpendingContext] = Field(default_factory=list, max_length=5)
    onboarding_completed: bool = False

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

    @field_validator(
        "spending_priorities",
        "financial_goals",
        "self_reported_spending_triggers",
        "self_reported_spending_contexts",
        mode="before",
    )
    @classmethod
    def clean_list(cls, value, info):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("must be a list")
        max_items = 4 if info.field_name == "self_reported_spending_triggers" else 5
        if len(value) > max_items:
            raise ValueError(f"must include at most {max_items} items")
        cleaned = []
        for item in value:
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
