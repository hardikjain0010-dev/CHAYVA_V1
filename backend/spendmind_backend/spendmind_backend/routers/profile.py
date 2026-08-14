from fastapi import APIRouter, Depends

from core.security import get_current_user_id
from models.profile_model import UserProfileOut, UserProfileUpdate
from services.cache_service import delete as delete_cache
from services.firebase_service import db_client, now_iso


router = APIRouter(prefix="/profile", tags=["Profile"])

COLLECTION = "profiles"


@router.get("", response_model=UserProfileOut)
def get_profile(authenticated_user_id: str = Depends(get_current_user_id)):
    profile = db_client.get(COLLECTION, authenticated_user_id)
    if profile:
        return _normalize_profile(profile, authenticated_user_id)
    return _empty_profile(authenticated_user_id)


@router.put("", response_model=UserProfileOut)
def replace_profile(
    payload: UserProfileUpdate,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    existing = db_client.get(COLLECTION, authenticated_user_id)
    updates = payload.model_dump()
    provided_updates = payload.model_dump(exclude_unset=True)
    if existing and "onboarding_completed" not in provided_updates:
        updates["onboarding_completed"] = _normalize_profile(existing, authenticated_user_id)["onboarding_completed"]
    timestamp = now_iso()
    doc = {
        **updates,
        "user_id": authenticated_user_id,
        "created_at": existing.get("created_at") if existing else timestamp,
        "updated_at": timestamp,
    }
    if existing:
        db_client.update(COLLECTION, authenticated_user_id, doc)
    else:
        db_client.add(COLLECTION, doc, doc_id=authenticated_user_id)
    _invalidate_user_ai(authenticated_user_id)
    return db_client.get(COLLECTION, authenticated_user_id) or doc


@router.patch("", response_model=UserProfileOut)
def update_profile(
    payload: UserProfileUpdate,
    authenticated_user_id: str = Depends(get_current_user_id),
):
    existing = db_client.get(COLLECTION, authenticated_user_id) or _empty_profile(authenticated_user_id)
    updates = payload.model_dump(exclude_unset=True)
    timestamp = now_iso()
    doc = {
        **existing,
        **updates,
        "user_id": authenticated_user_id,
        "created_at": existing.get("created_at") or timestamp,
        "updated_at": timestamp,
    }
    if db_client.get(COLLECTION, authenticated_user_id):
        db_client.update(COLLECTION, authenticated_user_id, doc)
    else:
        db_client.add(COLLECTION, doc, doc_id=authenticated_user_id)
    _invalidate_user_ai(authenticated_user_id)
    return db_client.get(COLLECTION, authenticated_user_id) or doc


def load_profile_for_user(user_id: str) -> dict:
    profile = db_client.get(COLLECTION, user_id)
    return _normalize_profile(profile, user_id) if profile else {}


def _empty_profile(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "display_name": None,
        "life_stage": None,
        "college_or_work_context": None,
        "preferred_language": None,
        "typical_daily_schedule": None,
        "spending_priorities": [],
        "financial_goals": [],
        "preferred_ai_tone": None,
        "self_reported_spending_triggers": [],
        "self_reported_spending_contexts": [],
        "onboarding_completed": False,
        "created_at": None,
        "updated_at": None,
    }


def _normalize_profile(profile: dict, user_id: str) -> dict:
    legacy_profile_has_context = any(
        profile.get(field)
        for field in (
            "display_name",
            "life_stage",
            "college_or_work_context",
            "preferred_language",
            "typical_daily_schedule",
            "spending_priorities",
            "financial_goals",
            "preferred_ai_tone",
        )
    )
    return {
        **_empty_profile(user_id),
        **profile,
        "user_id": user_id,
        "spending_priorities": profile.get("spending_priorities") or [],
        "financial_goals": profile.get("financial_goals") or [],
        "self_reported_spending_triggers": profile.get("self_reported_spending_triggers") or [],
        "self_reported_spending_contexts": profile.get("self_reported_spending_contexts") or [],
        "onboarding_completed": bool(profile.get("onboarding_completed", legacy_profile_has_context)),
    }


def _invalidate_user_ai(user_id: str) -> None:
    for key in (
        f"weekly_summary:{user_id}",
        f"personality:{user_id}",
        f"coaching:{user_id}",
    ):
        delete_cache(key)
