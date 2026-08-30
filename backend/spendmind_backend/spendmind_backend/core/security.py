from datetime import datetime, timedelta, timezone
import hashlib
from typing import Any


from fastapi import Header, HTTPException, status

from google.auth.transport import requests

from google.oauth2 import id_token

from jose import JWTError, jwt

from passlib.context import CryptContext



from core.config import settings





__all__ = [

    "hash_password",

    "verify_password",

    "needs_rehash",

    "create_access_token",

    "verify_access_token",

    "verify_google_token",

    "get_current_user_id",

]





pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt", "pbkdf2_sha256", "argon2"],
    deprecated=["bcrypt", "pbkdf2_sha256", "argon2"],
)




def hash_password(password: str) -> str:
    """Hash a password using the primary scheme (bcrypt_sha256)."""
    return pwd_context.hash(password)





def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Safely verify a password against stored hash across all supported schemes.
    
    Catches UnknownHashError, ValueError, TypeError to prevent 500 crashes
    on malformed, unknown, or corrupted hashes.
    """
    if not plain_password or not hashed_password or not isinstance(hashed_password, str):
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def needs_rehash(hashed_password: str | None) -> bool:
    """Check if hash was generated with a deprecated scheme and should be upgraded."""
    if not hashed_password or not isinstance(hashed_password, str):
        return False
    try:
        return pwd_context.needs_update(hashed_password)
    except Exception:
        return False





def create_access_token(data: dict[str, Any]) -> str:

    to_encode = data.copy()

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode.update({"exp": expire})

    return jwt.encode(

        to_encode,

        settings.JWT_SECRET_KEY,

        algorithm=settings.JWT_ALGORITHM,

    )





def verify_access_token(token: str) -> str:
    credentials_exception = HTTPException(

        status_code=status.HTTP_401_UNAUTHORIZED,

        detail="Could not validate credentials",

        headers={"WWW-Authenticate": "Bearer"},

    )



    try:

        payload = jwt.decode(

            token,

            settings.JWT_SECRET_KEY,

            algorithms=[settings.JWT_ALGORITHM],

        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str) or not user_id:

            raise credentials_exception

        return user_id

    except JWTError as exc:
        raise credentials_exception from exc


def verify_id_token(token: str) -> str:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
        )

    try:
        return verify_access_token(token)
    except HTTPException as exc:
        if settings.ENV != "development":
            raise exc

    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]
    return f"dev-{digest}"


def verify_google_token(credential: str) -> dict[str, Any]:
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Google credential",
        )

    if settings.ENV == "production" and settings.GOOGLE_CLIENT_ID == "placeholder-google-client-id":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Sign-In is not configured",
        )

    try:
        token_info = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
        if token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise ValueError("Google token audience does not match this app")
        if token_info.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
            raise ValueError("Google token issuer is invalid")
        return token_info
    except ValueError as exc:
        if settings.ENV == "development" and settings.GOOGLE_CLIENT_ID == "placeholder-google-client-id":
            try:
                from jose import jwt as jose_jwt
                token_info = jose_jwt.get_unverified_claims(credential)
                if token_info and isinstance(token_info, dict) and "email" in token_info:
                    return token_info
            except Exception:

                pass

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid Google token",

        ) from exc

    

async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:

    if not authorization or not authorization.startswith("Bearer "):

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Missing Authorization: Bearer <token> header",

            headers={"WWW-Authenticate": "Bearer"},

        )

    

    token = authorization.removeprefix("Bearer ").strip()

    if not token:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Missing bearer token",

            headers={"WWW-Authenticate": "Bearer"},

        )

    

    return verify_access_token(token)



