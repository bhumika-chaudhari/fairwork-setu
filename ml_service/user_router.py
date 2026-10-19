"""
User Profile, Preferences, and Saved Items Router for FairWork Setu.
Enforces authentication on all endpoints, deriving identity strictly from token claims ('sub').
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from db_models import Profile, SavedHealthItem, NotificationPreferences

logger = logging.getLogger("setu.user_router")

user_router = APIRouter(prefix="/api/user", tags=["user"])


# ---------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------------------------

class ProfileSyncPayload(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    phoneNumber: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    avatarUrl: Optional[str] = ""
    avatar_url: Optional[str] = ""
    gender: Optional[str] = None
    cityKey: Optional[str] = None
    city_key: Optional[str] = None
    workType: Optional[str] = None
    work_type: Optional[str] = None
    skills: Optional[str] = ""
    customSkills: Optional[str] = ""
    custom_skills: Optional[str] = ""
    experienceYears: Optional[int] = None
    experience_years: Optional[int] = None
    availability: Optional[str] = None
    payMin: Optional[float] = None
    pay_min: Optional[float] = None
    payMax: Optional[float] = None
    pay_max: Optional[float] = None
    emergencyContact: Optional[str] = None
    emergency_contact: Optional[str] = None
    savingsGoal: Optional[float] = None
    savings_goal: Optional[float] = None
    weeklySaveGoal: Optional[float] = None
    weekly_save_goal: Optional[float] = None
    preferredLanguage: Optional[str] = None
    preferred_language: Optional[str] = None
    speechRate: Optional[float] = None
    speech_rate: Optional[float] = None
    voiceSilenceTimeout: Optional[int] = None
    voice_silence_timeout: Optional[int] = None
    privacyMaskEarnings: Optional[bool] = None
    privacy_mask_earnings: Optional[bool] = None
    autoReadout: Optional[bool] = None
    auto_readout: Optional[bool] = None
    expenseAlerts: Optional[bool] = None
    expense_alerts: Optional[bool] = None


class SavedHealthItemPayload(BaseModel):
    itemId: str
    itemType: str
    title: str
    notes: Optional[str] = ""


class NotificationPrefsPayload(BaseModel):
    inAppEnabled: Optional[bool] = True
    browserPushEnabled: Optional[bool] = False
    androidNativeEnabled: Optional[bool] = True
    soundEnabled: Optional[bool] = True
    vibrationEnabled: Optional[bool] = True
    quietHoursEnabled: Optional[bool] = True
    quietHoursStart: Optional[str] = "22:00"
    quietHoursEnd: Optional[str] = "07:00"
    categories: Optional[Dict[str, bool]] = None


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@user_router.get("/profile")
def get_user_profile(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches the authenticated user's profile."""
    user_id = user["sub"]
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        # If user exists in Auth but not in public.profiles, create default profile
        email = user.get("email")
        phone = user.get("phone")
        metadata = user.get("user_metadata", {})
        full_name = metadata.get("full_name") or metadata.get("name") or (email.split("@")[0] if email else "Setu Worker")
        
        if phone:
            existing_phone = db.query(Profile).filter(Profile.phone_number == phone).first()
            if existing_phone:
                phone = None
        if email:
            existing_email = db.query(Profile).filter(Profile.email == email).first()
            if existing_email:
                email = None

        profile = Profile(
            id=user_id,
            email=email,
            phone_number=phone,
            full_name=full_name,
            city_key="cities.pune",
            work_type="driver"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)


    return {"status": "success", "profile": profile.to_dict()}


@user_router.post("/sync-profile")
@user_router.put("/profile")
def sync_or_update_profile(
    payload: ProfileSyncPayload,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upserts or updates the authenticated user's profile."""
    user_id = user["sub"]
    profile = db.query(Profile).filter(Profile.id == user_id).first()

    phone = payload.phoneNumber or payload.phone_number or user.get("phone")
    email = payload.email or user.get("email")
    full_name = payload.name or payload.full_name or "Worker"
    city_key = payload.cityKey or payload.city_key or "cities.pune"
    work_type = payload.workType or payload.work_type or "driver"
    skills_val = payload.skills or ""
    custom_skills_val = payload.customSkills or payload.custom_skills or ""
    exp_years = payload.experienceYears if payload.experienceYears is not None else (payload.experience_years or 1)
    emergency_contact = payload.emergencyContact or payload.emergency_contact
    savings_goal = payload.savingsGoal if payload.savingsGoal is not None else (payload.savings_goal or 5000.0)
    weekly_save_goal = payload.weeklySaveGoal if payload.weeklySaveGoal is not None else (payload.weekly_save_goal or 350.0)
    preferred_language = payload.preferredLanguage or payload.preferred_language or "hi"
    avatar_url = payload.avatarUrl or payload.avatar_url or ""

    if not profile:
        profile = Profile(
            id=user_id,
            phone_number=phone,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            gender=payload.gender,
            city_key=city_key,
            work_type=work_type,
            skills=skills_val,
            custom_skills=custom_skills_val,
            experience_years=exp_years,
            availability=payload.availability or "anytime",
            pay_min=payload.payMin if payload.payMin is not None else (payload.pay_min or 400.0),
            pay_max=payload.payMax if payload.payMax is not None else (payload.pay_max or 700.0),
            emergency_contact=emergency_contact,
            savings_goal=savings_goal,
            weekly_save_goal=weekly_save_goal,
            preferred_language=preferred_language,
            speech_rate=payload.speechRate if payload.speechRate is not None else (payload.speech_rate or 0.95),
            voice_silence_timeout=payload.voiceSilenceTimeout if payload.voiceSilenceTimeout is not None else (payload.voice_silence_timeout or 5),
            privacy_mask_earnings=payload.privacyMaskEarnings if payload.privacyMaskEarnings is not None else (payload.privacy_mask_earnings or False),
            auto_readout=payload.autoReadout if payload.autoReadout is not None else (payload.auto_readout or False),
            expense_alerts=payload.expenseAlerts if payload.expenseAlerts is not None else (payload.expense_alerts if payload.expense_alerts is not None else True),
        )
        db.add(profile)
    else:
        if payload.name or payload.full_name:
            profile.full_name = payload.name or payload.full_name
        if phone:
            profile.phone_number = phone
        if email:
            profile.email = email
        if payload.avatarUrl is not None or payload.avatar_url is not None:
            profile.avatar_url = payload.avatarUrl or payload.avatar_url
        if payload.gender is not None:
            profile.gender = payload.gender
        if payload.cityKey or payload.city_key:
            profile.city_key = payload.cityKey or payload.city_key
        if payload.workType or payload.work_type:
            profile.work_type = payload.workType or payload.work_type
        if payload.skills is not None:
            profile.skills = payload.skills
        if payload.customSkills is not None or payload.custom_skills is not None:
            profile.custom_skills = payload.customSkills or payload.custom_skills
        if payload.experienceYears is not None or payload.experience_years is not None:
            profile.experience_years = payload.experienceYears if payload.experienceYears is not None else payload.experience_years
        if payload.availability:
            profile.availability = payload.availability
        if payload.payMin is not None or payload.pay_min is not None:
            profile.pay_min = payload.payMin if payload.payMin is not None else payload.pay_min
        if payload.payMax is not None or payload.pay_max is not None:
            profile.pay_max = payload.payMax if payload.payMax is not None else payload.pay_max
        if emergency_contact is not None:
            profile.emergency_contact = emergency_contact
        if payload.savingsGoal is not None or payload.savings_goal is not None:
            profile.savings_goal = payload.savingsGoal if payload.savingsGoal is not None else payload.savings_goal
        if payload.weeklySaveGoal is not None or payload.weekly_save_goal is not None:
            profile.weekly_save_goal = payload.weeklySaveGoal if payload.weeklySaveGoal is not None else payload.weekly_save_goal
        if payload.preferredLanguage or payload.preferred_language:
            profile.preferred_language = payload.preferredLanguage or payload.preferred_language
        if payload.speechRate is not None or payload.speech_rate is not None:
            profile.speech_rate = payload.speechRate if payload.speechRate is not None else payload.speech_rate
        if payload.voiceSilenceTimeout is not None or payload.voice_silence_timeout is not None:
            profile.voice_silence_timeout = payload.voiceSilenceTimeout if payload.voiceSilenceTimeout is not None else payload.voice_silence_timeout
        if payload.privacyMaskEarnings is not None or payload.privacy_mask_earnings is not None:
            profile.privacy_mask_earnings = payload.privacyMaskEarnings if payload.privacyMaskEarnings is not None else payload.privacy_mask_earnings
        if payload.autoReadout is not None or payload.auto_readout is not None:
            profile.auto_readout = payload.autoReadout if payload.autoReadout is not None else payload.auto_readout
        if payload.expenseAlerts is not None or payload.expense_alerts is not None:
            profile.expense_alerts = payload.expenseAlerts if payload.expenseAlerts is not None else payload.expense_alerts
        profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)
    return {"status": "success", "profile": profile.to_dict()}


# ---------------------------------------------------------------------------
# SAVED HEALTH ITEMS
# ---------------------------------------------------------------------------

@user_router.get("/health-saved")
def get_saved_health_items(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    items = db.query(SavedHealthItem).filter(SavedHealthItem.user_id == user_id).order_by(SavedHealthItem.saved_at.desc()).all()
    return {"status": "success", "items": [i.to_dict() for i in items]}


@user_router.post("/health-saved")
def save_health_item(
    payload: SavedHealthItemPayload,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    existing = db.query(SavedHealthItem).filter(
        SavedHealthItem.user_id == user_id,
        SavedHealthItem.item_id == payload.itemId
    ).first()
    if existing:
        return {"status": "already_saved", "item": existing.to_dict()}

    new_item = SavedHealthItem(
        user_id=user_id,
        item_id=payload.itemId,
        item_type=payload.itemType,
        title=payload.title,
        notes=payload.notes or "",
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"status": "success", "item": new_item.to_dict()}


@user_router.delete("/health-saved/{item_id}")
def delete_saved_health_item(
    item_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    deleted = db.query(SavedHealthItem).filter(
        SavedHealthItem.user_id == user_id,
        SavedHealthItem.item_id == item_id
    ).delete()
    db.commit()
    return {"status": "success", "deleted": deleted > 0}


# ---------------------------------------------------------------------------
# NOTIFICATION PREFERENCES
# ---------------------------------------------------------------------------

@user_router.get("/notification-prefs")
def get_notification_preferences(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    prefs = db.query(NotificationPreferences).filter(NotificationPreferences.user_id == user_id).first()
    if not prefs:
        prefs = NotificationPreferences(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return {"status": "success", "preferences": prefs.to_dict()}


@user_router.put("/notification-prefs")
def update_notification_preferences(
    payload: NotificationPrefsPayload,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    prefs = db.query(NotificationPreferences).filter(NotificationPreferences.user_id == user_id).first()
    if not prefs:
        prefs = NotificationPreferences(user_id=user_id)
        db.add(prefs)

    if payload.inAppEnabled is not None:
        prefs.in_app_enabled = payload.inAppEnabled
    if payload.browserPushEnabled is not None:
        prefs.browser_push_enabled = payload.browserPushEnabled
    if payload.androidNativeEnabled is not None:
        prefs.android_native_enabled = payload.androidNativeEnabled
    if payload.soundEnabled is not None:
        prefs.sound_enabled = payload.soundEnabled
    if payload.vibrationEnabled is not None:
        prefs.vibration_enabled = payload.vibrationEnabled
    if payload.quietHoursEnabled is not None:
        prefs.quiet_hours_enabled = payload.quietHoursEnabled
    if payload.quietHoursStart:
        prefs.quiet_hours_start = payload.quietHoursStart
    if payload.quietHoursEnd:
        prefs.quiet_hours_end = payload.quietHoursEnd
    if payload.categories:
        if "money" in payload.categories:
            prefs.category_money = payload.categories["money"]
        if "work" in payload.categories:
            prefs.category_work = payload.categories["work"]
        if "health" in payload.categories:
            prefs.category_health = payload.categories["health"]
        if "skills" in payload.categories:
            prefs.category_skills = payload.categories["skills"]
        if "rights" in payload.categories:
            prefs.category_rights = payload.categories["rights"]
    prefs.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(prefs)
    return {"status": "success", "preferences": prefs.to_dict()}
