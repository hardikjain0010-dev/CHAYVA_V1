from fastapi import APIRouter, HTTPException
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
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
@router.post("/signup", response_model=TokenOut)
def signup(payload: AuthSignupRequest):
    # Check duplicate email
    existing = db_client.query("users", email=payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(payload.password)
    
    user_doc = {
        "uid": user_id,
        "email": payload.email,
        "provider": "password",
        "password_hash": hashed_pwd,
        "created_at": now_iso(),
        "last_login": now_iso(),
        "email_verified": False,
        "display_name": None,
        "photo_url": None,
    }
    
    db_client.add("users", user_doc, doc_id=user_id)
    
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
    users = db_client.query("users", email=payload.email)
    if not users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    user = users[0]
    
    if user.get("provider") != "password":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please sign in with Google")
        
    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    db_client.update("users", user["id"], {"last_login": now_iso()})
    
    user_out = UserOut(**user)
    token = create_access_token(data={"sub": user["uid"]})
    
    return {"access_token": token, "token_type": "bearer", "user": user_out}
@router.post("/google", response_model=TokenOut)
def google_signin(payload: AuthGoogleRequest):
    google_data = verify_google_token(payload.credential)
    email = google_data.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing email")
    users = db_client.query("users", email=email)
    
    if users:
        user = users[0]
        if user.get("provider") != "google":
            # Upgrade or reject? Reject for simplicity, or just log them in? 
            # The prompt doesn't specify, but usually we reject or merge. We will reject if they have a password.
            # But the prompt says "Both methods must produce the SAME JWT authentication flow." Let's update provider to google if they signed in with google, or just let them in.
            pass # We'll allow it for now, just update last login
        db_client.update("users", user["id"], {"last_login": now_iso()})
    else:
        # Create user
        user_id = str(uuid.uuid4())
        user = {
            "uid": user_id,
            "email": email,
            "provider": "google",
            "display_name": google_data.get("name"),
            "photo_url": google_data.get("picture"),
            "created_at": now_iso(),
            "last_login": now_iso(),
            "email_verified": google_data.get("email_verified", False)
        }
        db_client.add("users", user, doc_id=user_id)
        
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

