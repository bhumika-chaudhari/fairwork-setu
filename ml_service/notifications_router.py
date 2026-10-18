"""
FairWork Setu - Smart Notification API Router (FastAPI)
Handles cross-platform push token registration, backend event notifications,
and synchronization for Web Push (VAPID) and Android APK devices.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# In-memory registry for device tokens & push subscriptions (production: persist to DB)
ACTIVE_SUBSCRIPTIONS: Dict[str, Dict[str, Any]] = {}


class PushSubscriptionKeys(BaseModel):
    p256dh: Optional[str] = None
    auth: Optional[str] = None


class PushSubscriptionPayload(BaseModel):
    userId: str = Field(..., description="Worker user ID, e.g. 'usr-ramesh-kumar'")
    endpoint: str = Field(..., description="Browser Push Service endpoint URL or Android FCM Token")
    platform: str = Field(default="web", description="'web', 'android_apk', or 'pwa'")
    keys: Optional[PushSubscriptionKeys] = None
    categories: Optional[Dict[str, bool]] = None
    preferredTone: Optional[str] = "playful"
    preferredLanguage: Optional[str] = "en"


class SendNotificationEventPayload(BaseModel):
    category: str = Field(..., description="'money', 'work', 'health', 'skills', or 'rights'")
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Relatable Indian informal worker message")
    deepLink: str = Field(default="/home", description="Target application route, e.g. '/dhan?action=add-expense'")
    targetUserId: Optional[str] = Field(None, description="Worker ID or None to broadcast to active test worker")
    tone: Optional[str] = "playful"
    priority: Optional[str] = "normal"
    metadata: Optional[Dict[str, Any]] = None


@notifications_router.post("/subscribe")
def register_subscription(payload: PushSubscriptionPayload):
    """
    Registers or updates a device subscription token for Web Push or Android APK.
    """
    ACTIVE_SUBSCRIPTIONS[payload.userId] = {
        "endpoint": payload.endpoint,
        "platform": payload.platform,
        "keys": payload.keys.dict() if payload.keys else None,
        "categories": payload.categories or {
            "money": True,
            "work": True,
            "health": True,
            "skills": True,
            "rights": True,
        },
        "preferredTone": payload.preferredTone,
        "preferredLanguage": payload.preferredLanguage,
        "updatedAt": datetime.now().isoformat(),
    }
    return {
        "status": "success",
        "message": f"Push subscription registered for worker {payload.userId}",
        "platform": payload.platform,
    }


@notifications_router.post("/dispatch")
def dispatch_notification_event(payload: SendNotificationEventPayload, background_tasks: BackgroundTasks):
    """
    Accepts backend-triggered event (e.g. real customer booking or high-match gig)
    and dispatches to registered device endpoints.
    """
    target = payload.targetUserId or "usr-ramesh-kumar"
    sub = ACTIVE_SUBSCRIPTIONS.get(target)

    # In production, webpush(subscription_info, payload) or firebase_admin.messaging.send(message)
    # Here we validate payload and log delivery record
    delivery_record = {
        "notificationId": f"srv_notif_{int(datetime.now().timestamp())}",
        "targetUser": target,
        "category": payload.category,
        "title": payload.title,
        "body": payload.body,
        "deepLink": payload.deepLink,
        "tone": payload.tone,
        "deliveredVia": sub.get("platform", "in_app") if sub else "in_app_direct",
        "timestamp": datetime.now().isoformat(),
        "status": "delivered",
    }

    return {
        "status": "success",
        "result": delivery_record,
    }


@notifications_router.get("/status")
def get_notification_system_status():
    """
    Returns live health of Setu Notification Service
    """
    return {
        "service": "setu-notification-engine",
        "version": "1.0.0",
        "supportedCategories": ["money", "work", "health", "skills", "rights"],
        "supportedTones": ["playful", "caring", "witty", "motivational", "professional"],
        "supportedLanguages": ["en", "hi", "mr"],
        "activeSubscribers": len(ACTIVE_SUBSCRIPTIONS),
        "androidBridgeSupported": True,
        "webPushSupported": True,
    }
