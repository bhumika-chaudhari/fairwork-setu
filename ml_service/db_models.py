"""
SQLAlchemy ORM Data Models for FairWork Setu.
Maps persistent entities for:
- User Profiles & Preferences
- Transactions (Income & Expenses with offline sync ID)
- Worker Service Marketplace Profiles & Bookings
- Job Applications
- Haq Setu Grievance Cases
- Saved Health Facilities & Schemes
- Notification Preferences
"""

import sys
import os
import uuid
from datetime import datetime

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if _CURRENT_DIR not in sys.path:
    sys.path.insert(0, _CURRENT_DIR)

try:
    from sqlalchemy import (
        Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, Index
    )
    from sqlalchemy.orm import relationship
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False
    def Column(*args, **kwargs): return None
    def String(*args, **kwargs): return None
    def Float(*args, **kwargs): return None
    def Integer(*args, **kwargs): return None
    def Boolean(*args, **kwargs): return None
    def DateTime(*args, **kwargs): return None
    def Text(*args, **kwargs): return None
    def ForeignKey(*args, **kwargs): return None
    def UniqueConstraint(*args, **kwargs): return None
    def Index(*args, **kwargs): return None
    def relationship(*args, **kwargs): return None

try:
    from database import Base
except ImportError:
    try:
        from ml_service.database import Base
    except ImportError:
        class Base:  # type: ignore
            metadata = None
            def __init__(self, *args, **kwargs):
                pass


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(64), primary_key=True)  # Supabase auth.users.id UUID string
    phone_number = Column(String(30), unique=True, nullable=True, index=True)
    email = Column(String(120), nullable=True, index=True)
    full_name = Column(String(120), nullable=False)
    avatar_url = Column(Text, nullable=True)
    gender = Column(String(30), nullable=True)
    city_key = Column(String(80), nullable=False, default="cities.pune")
    work_type = Column(String(60), nullable=False, default="driver")
    experience_years = Column(Integer, nullable=False, default=1)
    availability = Column(String(30), nullable=False, default="anytime")
    pay_min = Column(Float, default=400.0)
    pay_max = Column(Float, default=700.0)
    emergency_contact = Column(String(40), nullable=True)
    savings_goal = Column(Float, default=5000.0)
    weekly_save_goal = Column(Float, default=350.0)
    preferred_language = Column(String(10), default="hi")
    speech_rate = Column(Float, default=0.95)
    voice_silence_timeout = Column(Integer, default=5)
    privacy_mask_earnings = Column(Boolean, default=False)
    auto_readout = Column(Boolean, default=False)
    expense_alerts = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    service_profile = relationship("ServiceProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_worker = relationship("ServiceBooking", foreign_keys="ServiceBooking.worker_id", back_populates="worker")
    bookings_as_customer = relationship("ServiceBooking", foreign_keys="ServiceBooking.customer_id", back_populates="customer")
    applications = relationship("JobApplication", back_populates="applicant", cascade="all, delete-orphan")
    haq_cases = relationship("HaqCase", back_populates="user", cascade="all, delete-orphan")
    saved_health_items = relationship("SavedHealthItem", back_populates="user", cascade="all, delete-orphan")
    notification_preferences = relationship("NotificationPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "phoneNumber": self.phone_number,
            "email": self.email,
            "name": self.full_name,
            "avatarUrl": self.avatar_url or "",
            "gender": self.gender,
            "cityKey": self.city_key,
            "workType": self.work_type,
            "experienceYears": self.experience_years,
            "availability": self.availability,
            "payMin": self.pay_min,
            "payMax": self.pay_max,
            "emergencyContact": self.emergency_contact or "",
            "savingsGoal": self.savings_goal,
            "weeklySaveGoal": self.weekly_save_goal,
            "preferredLanguage": self.preferred_language,
            "speechRate": self.speech_rate,
            "voiceSilenceTimeout": self.voice_silence_timeout,
            "privacyMaskEarnings": self.privacy_mask_earnings,
            "autoReadout": self.auto_readout,
            "expenseAlerts": self.expense_alerts,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    client_tx_id = Column(String(80), nullable=True)  # Idempotency token from client (e.g. tx_1729000_abcde)
    type = Column(String(20), nullable=False)  # 'income' or 'expense'
    amount = Column(Float, nullable=False)
    category = Column(String(60), nullable=False, index=True)
    description = Column(Text, nullable=True, default="")
    work_ref = Column(String(120), nullable=True)
    source = Column(String(30), default="manual")  # 'manual', 'voice', 'quick'
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("Profile", back_populates="transactions")

    __table_args__ = (
        UniqueConstraint("user_id", "client_tx_id", name="uq_user_client_tx"),
        Index("idx_user_timestamp", "user_id", "timestamp"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "clientTxId": self.client_tx_id,
            "type": self.type,
            "amount": self.amount,
            "category": self.category,
            "description": self.description or "",
            "workRef": self.work_ref,
            "source": self.source,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "createdAt": int(self.created_at.timestamp() * 1000) if self.created_at else 0,
            "updatedAt": int(self.updated_at.timestamp() * 1000) if self.updated_at else 0,
        }


class ServiceProfile(Base):
    __tablename__ = "service_profiles"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_name = Column(String(120), nullable=False)
    trade = Column(String(80), nullable=False)
    short_description = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    indicative_price = Column(Float, default=250.0)
    pricing_type = Column(String(40), default="visit_fee")
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("Profile", back_populates="service_profile")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "displayName": self.display_name,
            "trade": self.trade,
            "shortDescription": self.short_description or "",
            "phone": self.phone or "",
            "indicativePrice": self.indicative_price,
            "pricingType": self.pricing_type,
            "isAvailable": self.is_available,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class ServiceBooking(Base):
    __tablename__ = "service_bookings"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    customer_id = Column(String(64), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    worker_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_name = Column(String(120), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    customer_address = Column(Text, nullable=False)
    service_trade = Column(String(80), nullable=False)
    service_description = Column(Text, nullable=False)
    booking_date = Column(String(30), nullable=False)
    time_slot = Column(String(60), nullable=False)
    status = Column(String(30), default="pending", index=True)  # 'pending', 'confirmed', 'proposed', 'completed', 'cancelled'
    estimated_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    worker = relationship("Profile", foreign_keys=[worker_id], back_populates="bookings_as_worker")
    customer = relationship("Profile", foreign_keys=[customer_id], back_populates="bookings_as_customer")

    def to_dict(self):
        return {
            "id": self.id,
            "customerId": self.customer_id,
            "workerId": self.worker_id,
            "customerName": self.customer_name,
            "customerPhone": self.customer_phone,
            "customerAddress": self.customer_address,
            "serviceTrade": self.service_trade,
            "serviceDescription": self.service_description,
            "bookingDate": self.booking_date,
            "timeSlot": self.time_slot,
            "status": self.status,
            "estimatedPrice": self.estimated_price,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    job_id = Column(String(80), nullable=False, index=True)
    applicant_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="submitted")
    cover_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = relationship("Profile", back_populates="applications")

    __table_args__ = (
        UniqueConstraint("applicant_id", "job_id", name="uq_applicant_job"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "jobId": self.job_id,
            "applicantId": self.applicant_id,
            "status": self.status,
            "coverNote": self.cover_note or "",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class HaqCase(Base):
    __tablename__ = "haq_cases"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    case_number = Column(String(60), unique=True, nullable=False)
    platform_name = Column(String(80), nullable=False)
    deactivation_reason = Column(String(120), nullable=True)
    status = Column(String(30), default="draft")
    incident_date = Column(String(30), nullable=True)
    loss_of_income_est = Column(Float, nullable=True)
    appeal_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("Profile", back_populates="haq_cases")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "caseNumber": self.case_number,
            "platformName": self.platform_name,
            "deactivationReason": self.deactivation_reason or "",
            "status": self.status,
            "incidentDate": self.incident_date,
            "lossOfIncomeEst": self.loss_of_income_est,
            "appealText": self.appeal_text or "",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class SavedHealthItem(Base):
    __tablename__ = "saved_health_items"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(String(100), nullable=False)
    item_type = Column(String(40), nullable=False)
    title = Column(String(180), nullable=False)
    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("Profile", back_populates="saved_health_items")

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_user_health_item"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "itemId": self.item_id,
            "itemType": self.item_type,
            "title": self.title,
            "notes": self.notes or "",
            "savedAt": self.saved_at.isoformat() if self.saved_at else None,
        }


class NotificationPreferences(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(String(64), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    in_app_enabled = Column(Boolean, default=True)
    browser_push_enabled = Column(Boolean, default=False)
    android_native_enabled = Column(Boolean, default=True)
    sound_enabled = Column(Boolean, default=True)
    vibration_enabled = Column(Boolean, default=True)
    quiet_hours_enabled = Column(Boolean, default=True)
    quiet_hours_start = Column(String(10), default="22:00")
    quiet_hours_end = Column(String(10), default="07:00")
    category_money = Column(Boolean, default=True)
    category_work = Column(Boolean, default=True)
    category_health = Column(Boolean, default=True)
    category_skills = Column(Boolean, default=True)
    category_rights = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("Profile", back_populates="notification_preferences")

    def to_dict(self):
        return {
            "userId": self.user_id,
            "inAppEnabled": self.in_app_enabled,
            "browserPushEnabled": self.browser_push_enabled,
            "androidNativeEnabled": self.android_native_enabled,
            "soundEnabled": self.sound_enabled,
            "vibrationEnabled": self.vibration_enabled,
            "quietHoursEnabled": self.quiet_hours_enabled,
            "quietHoursStart": self.quiet_hours_start,
            "quietHoursEnd": self.quiet_hours_end,
            "categories": {
                "money": self.category_money,
                "work": self.category_work,
                "health": self.category_health,
                "skills": self.category_skills,
                "rights": self.category_rights,
            },
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
