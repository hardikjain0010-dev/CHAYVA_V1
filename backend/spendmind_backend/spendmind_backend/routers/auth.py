import uuid
import re
from fastapi import APIRouter, HTTPException, status, Depends
from models.expense_model import AuthVerifyRequest
from core.security import verify_id_token
from models.expense_model import (
    AuthSignupRequest,
    AuthSigninRequest,
    AuthGoogleRequest,
    TokenOut,
    UserOut
)
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_token,
    get_current_user_id
)
from services.firebase_service import db_client, now_iso
router = APIRouter(prefix="/auth", tags=["Auth"])

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength. Returns (is_valid, error_message)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number."
    return True, ""

@router.post("/signup", response_model=TokenOut)
def signup(payload: AuthSignupRequest):
    # Normalize email
    email = payload.email.strip().lower()

    # Validate password strength
    is_valid, error_msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # Check duplicate email (case-insensitive query)
    existing = db_client.query("users", email=email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered. Please sign in instead."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(payload.password)
    timestamp = now_iso()

    user_doc = {
        "uid": user_id,
        "email": email,
        "provider": "password",
        "password_hash": hashed_pwd,
        "created_at": timestamp,
        "last_login": timestamp,
        "email_verified": False,
        "display_name": None,
        "photo_url": None,
    }

    db_client.add("users", user_doc, doc_id=user_id)

    # Initialize empty profile for new user so profile state is consistently in Firestore
    profile_doc = {
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
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    db_client.add("profiles", profile_doc, doc_id=user_id)

    user_out = UserOut(**user_doc)
    token = create_access_token(data={"sub": user_id})

    return {"access_token": token, "token_type": "bearer", "user": user_out}
@router.post(
    "/verify",
    summary="Verify a Firebase ID token",
    description="Verifies a Firebase Authentication ID token and returns the associated uid. "
                "Used by the frontend to confirm a login session is valid.",
)
def verify(payload: AuthVerifyRequest):
    uid = verify_id_token(payload.id_token)
    return {"valid": True, "uid": uid}
@router.post("/signin", response_model=TokenOut)
def signin(payload: AuthSigninRequest):
    email = payload.email.strip().lower()
    print(f"[DEBUG] Signin attempt for email: {email}")
    users = db_client.query("users", email=email)
    print(f"[DEBUG] Found users: {len(users) if users else 0}")
    if not users:
        print(f"[DEBUG] No user found, raising 401")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user = users[0]
    print(f"[DEBUG] User provider: {user.get('provider')}")

    if user.get("provider") != "password":
        print(f"[DEBUG] Provider mismatch, raising 400")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please sign in with Google")

    if not verify_password(payload.password, user.get("password_hash", "")):
        print(f"[DEBUG] Password verification failed, raising 401")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    doc_id = user.get("id") or user.get("uid")
    if doc_id:
        db_client.update("users", doc_id, {"last_login": now_iso()})

    user_out = UserOut(**user)
    token = create_access_token(data={"sub": user["uid"]})

    print(f"[DEBUG] Signin successful for: {email}")
    return {"access_token": token, "token_type": "bearer", "user": user_out}
@router.post("/google", response_model=TokenOut)
def google_signin(payload: AuthGoogleRequest):
    google_data = verify_google_token(payload.credential)
    raw_email = google_data.get("email")
    if not raw_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing email")
    email = raw_email.strip().lower()
    users = db_client.query("users", email=email)
    
    if users:
        user = users[0]
        doc_id = user.get("id") or user.get("uid")
        db_client.update("users", doc_id, {"last_login": now_iso()})
    else:
        # Create user
        user_id = str(uuid.uuid4())
        timestamp = now_iso()
        user = {
            "uid": user_id,
            "email": email,
            "provider": "google",
            "display_name": google_data.get("name"),
            "photo_url": google_data.get("picture"),
            "created_at": timestamp,
            "last_login": timestamp,
            "email_verified": google_data.get("email_verified", False)
        }
        db_client.add("users", user, doc_id=user_id)
        
        # Initialize empty profile for new Google user (inline to avoid circular import)
        profile_doc = {
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
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        db_client.add("profiles", profile_doc, doc_id=user_id)
        
    user_out = UserOut(**user)
    token = create_access_token(data={"sub": user["uid"]})
    
    return {"access_token": token, "token_type": "bearer", "user": user_out}
@router.get("/me", response_model=UserOut)
def get_current_user(user_id: str = Depends(get_current_user_id)):
    user = db_client.get("users", user_id)
    if not user:
        # Check if they are querying by uid field instead of doc_id
        users = db_client.query("users", uid=user_id)
        if not users:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user = users[0]
        
    return UserOut(**user)
@router.post(
    "/logout",
    summary="Logout (client-side token invalidation)",
    description="JWT tokens are stateless — this endpoint exists as a clean extension point "
                "and for clients that call it. The actual token invalidation happens client-side "
                "by removing the token from localStorage.",
)
def logout():
    # JWT is stateless: the server cannot invalidate a token without a deny-list.
    # The client removes the token from localStorage — that is the logout mechanism.
    # This endpoint is intentionally a no-op on the server side.
    return {"message": "Logged out successfully"}

