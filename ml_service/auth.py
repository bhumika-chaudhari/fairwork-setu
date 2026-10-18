"""
Authentication & JWT Verification Middleware for FairWork Setu.
Validates Supabase Auth JWT tokens passed in the 'Authorization: Bearer <token>' header.
Derives user identity securely from token claims ('sub').
"""

import os
import logging
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

logger = logging.getLogger("setu.auth")

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()

# HTTPBearer scheme (auto_error=False allows optional auth)
security_scheme = HTTPBearer(auto_error=False)


def create_dev_token(user_id: str, email: str = "worker@setu.org", phone: str = "+919876543210") -> str:
    """Generates a test JWT token for local automated tests."""
    import time
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "phone": phone,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + 86400,
        "user_metadata": {"full_name": "Test Worker"}
    }
    secret = SUPABASE_JWT_SECRET or "dev-secret-key-12345678901234567890"
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_supabase_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a Supabase Auth JWT token.
    If SUPABASE_JWT_SECRET is configured, cryptographically verifies the HS256 signature.
    If SUPABASE_JWT_SECRET is not configured (dev mode), decodes payload without signature verification.
    """
    try:
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
        else:
            # Dev / fallback mode when JWT secret is not yet set in environment
            logger.warning("SUPABASE_JWT_SECRET is not set. Decoding JWT without signature verification (DEV ONLY).")
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True}
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user identifier (sub)."
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please sign in again."
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Enforces authentication. Requires a valid Bearer token.
    Raises 401 Unauthorized if missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token."
        )
    return decode_supabase_token(credentials.credentials)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency.
    Returns user payload if valid token provided; returns None if no token provided.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        return decode_supabase_token(credentials.credentials)
    except HTTPException:
        return None
