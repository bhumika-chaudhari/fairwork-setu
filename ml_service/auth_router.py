"""
Authentication & Account Verification Router for FairWork Setu.
Provides secure pre-flight verification endpoints for Login and Sign Up.
Never exposes sensitive tokens, passwords, or Supabase service-role keys.
"""

import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from database import get_db
from db_models import Profile

logger = logging.getLogger("setu.auth_router")

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


class CheckAccountPayload(BaseModel):
    email: str


class CheckAccountResponse(BaseModel):
    email: str
    exists: bool
    registered: bool


# Authorized demo accounts list
DEMO_EMAILS = {
    "sadia.sakharkar@cumminscollege.in",
    "worker@setu.org",
}


@auth_router.post("/check-account", response_model=CheckAccountResponse)
def check_account_endpoint(payload: CheckAccountPayload, db: Optional[Session] = Depends(get_db)):
    """
    Checks if an email is registered in the database, Supabase Auth, or demo accounts.
    Returns: {"email": str, "exists": bool, "registered": bool}
    Safe public preflight check: does not expose credentials, IDs, or secrets.
    """
    raw_email = (payload.email or "").strip().lower()
    if not raw_email or "@" not in raw_email:
        return CheckAccountResponse(email=raw_email, exists=False, registered=False)

    # 1. Check known authorized demo accounts
    if raw_email in DEMO_EMAILS:
        return CheckAccountResponse(email=raw_email, exists=True, registered=True)

    # 2. Check local database profiles table if db is available
    if db is not None:
        try:
            profile = db.query(Profile).filter(func.lower(Profile.email) == raw_email).first()
            if profile:
                return CheckAccountResponse(email=raw_email, exists=True, registered=True)
        except Exception as e:
            logger.warning(f"Error querying profiles table for email {raw_email}: {e}")

        # 3. If connected to PostgreSQL/Supabase, check auth.users table
        try:
            row = db.execute(
                text("SELECT 1 FROM auth.users WHERE LOWER(email) = :email LIMIT 1"),
                {"email": raw_email}
            ).fetchone()
            if row:
                return CheckAccountResponse(email=raw_email, exists=True, registered=True)
        except Exception:
            # Table auth.users does not exist in SQLite or permission restricted
            pass

    # 4. If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in server environment,
    # optionally query Supabase Admin API without exposing keys to client
    supabase_url = os.getenv("SUPABASE_URL", "").strip() or os.getenv("VITE_SUPABASE_URL", "").strip()
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if supabase_url and supabase_service_key:
        try:
            import urllib.request
            import json

            api_url = f"{supabase_url.rstrip('/')}/auth/v1/admin/users"
            req = urllib.request.Request(
                api_url,
                headers={
                    "apikey": supabase_service_key,
                    "Authorization": f"Bearer {supabase_service_key}",
                }
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    users = data.get("users", [])
                    for u in users:
                        if (u.get("email") or "").strip().lower() == raw_email:
                            return CheckAccountResponse(email=raw_email, exists=True, registered=True)
        except Exception as e:
            logger.warning(f"Supabase Admin API check encountered an issue: {e}")

    return CheckAccountResponse(email=raw_email, exists=False, registered=False)
