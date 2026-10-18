"""
Idempotent Seeder for Authorized FairWork Setu Test/Demo Accounts.

Provisions database-backed records for the 4 authorized test users:
1. Sadia Sakharkar  (+918055440700, sadia.sakharkar@cumminscollege.in)
2. Bhumika Chaudhari (+919766236307, Email: None - Strictly not provided)
3. Nouf Bamne       (+917028403043, Email: None - Syntax error 'nouf.bamne.cumminscollege.in' flagged)
4. Aboli Gaikwad    (+918263935704, Email: None - Strictly not provided)

Strict Rules Enforced:
- No invented emails or unauthorized impersonation.
- Deterministic UUIDs (UUID5 based on DNS namespace + phone number) ensuring exact repeatability.
- Complete idempotency: Running once or multiple times updates existing records without duplication.
- Populates distinct profiles, occupations, transactions, service profiles, bookings, grievances, and preferences.
"""

import os
import sys
import uuid
import logging
from datetime import datetime, timedelta

# Add ml_service to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from database import SessionLocal, init_db
import db_models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("setu.seed")


def deterministic_uuid(phone: str) -> str:
    """Derives a reproducible, deterministic UUID5 from phone number."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"setu.demo.{phone}"))


# ---------------------------------------------------------------------------
# AUTHORIZED TEST USER DEFINITIONS
# ---------------------------------------------------------------------------
DEMO_USERS = [
    {
        "phone": "+918055440700",
        "email": "sadia.sakharkar@cumminscollege.in",
        "name": "Sadia Sakharkar",
        "gender": "female",
        "city_key": "cities.pune",
        "work_type": "domestic_worker",
        "experience_years": 4,
        "availability": "morning",
        "pay_min": 450.0,
        "pay_max": 850.0,
        "emergency_contact": "+919822000001",
        "savings_goal": 8000.0,
        "weekly_save_goal": 600.0,
        "preferred_language": "mr",
        "transactions": [
            {
                "cid": "demo_seed_8055440700_1",
                "type": "income",
                "amount": 6500.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Society Cooking & Monthly Domestic Retainer",
                "work_ref": "Karvenagar Housing Society",
                "source": "manual",
                "days_ago": 4,
                "hour": 10,
            },
            {
                "cid": "demo_seed_8055440700_2",
                "type": "expense",
                "amount": 1450.0,
                "category": "food",
                "description": "[Demo Seed] Household Groceries & Fresh Produce",
                "work_ref": None,
                "source": "manual",
                "days_ago": 3,
                "hour": 16,
            },
            {
                "cid": "demo_seed_8055440700_3",
                "type": "income",
                "amount": 1200.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Festival Kitchen Deep-Cleaning Gig",
                "work_ref": "Kothrud Bungalow Service",
                "source": "manual",
                "days_ago": 2,
                "hour": 14,
            },
            {
                "cid": "demo_seed_8055440700_4",
                "type": "expense",
                "amount": 600.0,
                "category": "tools",
                "description": "[Demo Seed] Sanitization Supplies & Cleaning Utensils",
                "work_ref": None,
                "source": "manual",
                "days_ago": 2,
                "hour": 17,
            },
            {
                "cid": "demo_seed_8055440700_5",
                "type": "income",
                "amount": 800.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Weekend Private Catering Assistant",
                "work_ref": "Baner Event Planners",
                "source": "quick",
                "days_ago": 1,
                "hour": 19,
            },
            {
                "cid": "demo_seed_8055440700_6",
                "type": "expense",
                "amount": 250.0,
                "category": "travel_fuel",
                "description": "[Demo Seed] Auto-Rickshaw Shared Transit",
                "work_ref": None,
                "source": "quick",
                "days_ago": 0,
                "hour": 8,
            },
        ],
        "service_profile": {
            "display_name": "Sadia's Home Culinary & Domestic Care",
            "trade": "Domestic Services / Home Chef",
            "short_description": "Specialized in authentic Maharashtrian cuisine, healthy daily family meals, and comprehensive household upkeep.",
            "indicative_price": 500.0,
            "pricing_type": "visit_fee",
            "is_available": True,
        },
        "bookings": [
            {
                "customer_name": "Pooja Deshmukh",
                "customer_phone": "+919822111111",
                "customer_address": "Flat 302, Nisarg Heights, Karvenagar, Pune",
                "service_trade": "Domestic Services / Home Chef",
                "service_description": "Festive multi-course dinner preparation for 8 family guests.",
                "booking_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "09:00 - 13:00",
                "status": "confirmed",
                "estimated_price": 750.0,
            },
            {
                "customer_name": "Rajesh Kulkarni",
                "customer_phone": "+919822222222",
                "customer_address": "Mayur Colony, Kothrud, Pune",
                "service_trade": "Domestic Services / Home Chef",
                "service_description": "Deep sanitization and cabinet reorganization of modular kitchen.",
                "booking_date": (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "time_slot": "14:00 - 17:00",
                "status": "pending",
                "estimated_price": 600.0,
            },
        ],
        "haq_case": {
            "case_number": "HAQ-PUN-2026-001",
            "platform_name": "Urban Company Partner",
            "deactivation_reason": "Unjust rating penalty following app geolocation outage during rainstorm",
            "status": "in_review",
            "incident_date": (datetime.utcnow() - timedelta(days=6)).strftime("%Y-%m-%d"),
            "loss_of_income_est": 1500.0,
            "appeal_text": "Monsoon downpour on Oct 12 caused carrier network dropout, falsely flagging arrival as late. Requesting rating neutralization and fee reinstatement.",
        },
        "health_item": {
            "item_id": "facility-pmjay-pune-01",
            "item_type": "clinic",
            "title": "Ayushman Bharat PM-JAY Empanelled Health Centre - Karvenagar",
            "notes": "Free OPD consultations and subsidized diagnostic blood panel for informal workers.",
        },
    },
    {
        "phone": "+919766236307",
        "email": None,  # Strictly None: Email not provided
        "name": "Bhumika Chaudhari",
        "gender": "female",
        "city_key": "cities.pune",
        "work_type": "delivery",
        "experience_years": 2,
        "availability": "flexible",
        "pay_min": 500.0,
        "pay_max": 950.0,
        "emergency_contact": "+919822000002",
        "savings_goal": 6000.0,
        "weekly_save_goal": 500.0,
        "preferred_language": "hi",
        "transactions": [
            {
                "cid": "demo_seed_9766236307_1",
                "type": "income",
                "amount": 2100.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Weekend Express Delivery Surge Batch",
                "work_ref": "Zomato / Blinkit Partner",
                "source": "manual",
                "days_ago": 4,
                "hour": 21,
            },
            {
                "cid": "demo_seed_9766236307_2",
                "type": "expense",
                "amount": 450.0,
                "category": "travel_fuel",
                "description": "[Demo Seed] Petrol Fuel Refill at Indian Oil Hinjawadi",
                "work_ref": None,
                "source": "manual",
                "days_ago": 3,
                "hour": 11,
            },
            {
                "cid": "demo_seed_9766236307_3",
                "type": "income",
                "amount": 1450.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Weekday Quick Commerce Grocery Drops",
                "work_ref": "Zepto Delivery Partner",
                "source": "manual",
                "days_ago": 2,
                "hour": 15,
            },
            {
                "cid": "demo_seed_9766236307_4",
                "type": "expense",
                "amount": 350.0,
                "category": "tools",
                "description": "[Demo Seed] Scooter Engine Oil Top-Up & Brake Pad Check",
                "work_ref": None,
                "source": "manual",
                "days_ago": 2,
                "hour": 18,
            },
            {
                "cid": "demo_seed_9766236307_5",
                "type": "income",
                "amount": 450.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Customer App Tips & Rain Surge Bonus",
                "work_ref": "Delivery Payout Hub",
                "source": "quick",
                "days_ago": 1,
                "hour": 22,
            },
            {
                "cid": "demo_seed_9766236307_6",
                "type": "expense",
                "amount": 120.0,
                "category": "food",
                "description": "[Demo Seed] Tea & Evening Meal During Shift",
                "work_ref": None,
                "source": "quick",
                "days_ago": 0,
                "hour": 17,
            },
        ],
        "service_profile": {
            "display_name": "Bhumika Express Courier & Logistics",
            "trade": "Delivery & Logistics",
            "short_description": "Rapid, trusted parcel and document transit across Hinjawadi IT Park, Wakad, and Baner corridor.",
            "indicative_price": 250.0,
            "pricing_type": "per_trip",
            "is_available": True,
        },
        "bookings": [
            {
                "customer_name": "Rohan Mehta",
                "customer_phone": "+919822333333",
                "customer_address": "Tech Park Tower B, Phase 1 Hinjawadi, Pune",
                "service_trade": "Delivery & Logistics",
                "service_description": "Urgent signed legal contracts dispatch to Baner corporate branch.",
                "booking_date": (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "11:00 - 12:30",
                "status": "completed",
                "estimated_price": 300.0,
            },
            {
                "customer_name": "Dr. Sneha Patil",
                "customer_phone": "+919822444444",
                "customer_address": "Blue Ridge Township, Phase 2 Hinjawadi, Pune",
                "service_trade": "Delivery & Logistics",
                "service_description": "Urgent temperature-controlled prescription medication delivery.",
                "booking_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "09:30 - 10:30",
                "status": "confirmed",
                "estimated_price": 250.0,
            },
        ],
        "job_application": {
            "job_id": "job_ecom_delivery_pune_02",
            "status": "under_review",
            "cover_note": "2 years dedicated experience navigating high-density delivery routes in Hinjawadi IT parks with an unblemished on-time record.",
        },
    },
    {
        "phone": "+917028403043",
        "email": None,  # Strictly None: User input 'nouf.bamne.cumminscollege.in' lacks '@' (RFC invalid). Flagged for authorization.
        "name": "Nouf Bamne",
        "gender": "female",
        "city_key": "cities.pune",
        "work_type": "electrician",
        "experience_years": 3,
        "availability": "daytime",
        "pay_min": 600.0,
        "pay_max": 1200.0,
        "emergency_contact": "+919822000003",
        "savings_goal": 10000.0,
        "weekly_save_goal": 800.0,
        "preferred_language": "en",
        "transactions": [
            {
                "cid": "demo_seed_7028403043_1",
                "type": "income",
                "amount": 2800.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Dual Inverter Backup & MCB Distribution Rewiring",
                "work_ref": "Shivajinagar Commercial Complex",
                "source": "manual",
                "days_ago": 4,
                "hour": 16,
            },
            {
                "cid": "demo_seed_7028403043_2",
                "type": "expense",
                "amount": 850.0,
                "category": "tools",
                "description": "[Demo Seed] Digital Clamp Multimeter & Insulated Wire Strippers",
                "work_ref": None,
                "source": "manual",
                "days_ago": 3,
                "hour": 12,
            },
            {
                "cid": "demo_seed_7028403043_3",
                "type": "income",
                "amount": 1500.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Showroom LED Track Lighting & Safety Load Audit",
                "work_ref": "FC Road Retail Store",
                "source": "manual",
                "days_ago": 2,
                "hour": 15,
            },
            {
                "cid": "demo_seed_7028403043_4",
                "type": "expense",
                "amount": 380.0,
                "category": "tools",
                "description": "[Demo Seed] Copper Wire Spools, Cartridge Fuses & PVC Tape",
                "work_ref": None,
                "source": "manual",
                "days_ago": 2,
                "hour": 17,
            },
            {
                "cid": "demo_seed_7028403043_5",
                "type": "income",
                "amount": 850.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Apartment Trip Switch Replacement & Earthing Fix",
                "work_ref": "Model Colony Society",
                "source": "quick",
                "days_ago": 1,
                "hour": 11,
            },
            {
                "cid": "demo_seed_7028403043_6",
                "type": "expense",
                "amount": 200.0,
                "category": "travel_fuel",
                "description": "[Demo Seed] Pune Metro Card Smart Transit Recharge",
                "work_ref": None,
                "source": "quick",
                "days_ago": 0,
                "hour": 9,
            },
        ],
        "service_profile": {
            "display_name": "Nouf Electrical Solutions & Wiring",
            "trade": "Electrical & Appliance Repair",
            "short_description": "Licensed electrical technician certified in domestic switchboards, inverter wiring, and industrial safety load audits.",
            "indicative_price": 400.0,
            "pricing_type": "visit_fee",
            "is_available": True,
        },
        "bookings": [
            {
                "customer_name": "Amit Shinde",
                "customer_phone": "+919822555555",
                "customer_address": "Deccan Gymkhana, Shivajinagar, Pune",
                "service_trade": "Electrical & Appliance Repair",
                "service_description": "Complete diagnostic inspection of inverter battery backup and load shedding switchover.",
                "booking_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "10:00 - 12:00",
                "status": "confirmed",
                "estimated_price": 500.0,
            },
            {
                "customer_name": "Priya Joshi",
                "customer_phone": "+919822666666",
                "customer_address": "Bhandarkar Road, Shivajinagar, Pune",
                "service_trade": "Electrical & Appliance Repair",
                "service_description": "Kitchen high-amp appliance circuit tripping investigation.",
                "booking_date": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "time_slot": "15:00 - 17:00",
                "status": "pending",
                "estimated_price": 650.0,
            },
        ],
        "health_item": {
            "item_id": "facility-pmjay-pune-02",
            "item_type": "hospital",
            "title": "Sancheti Hospital Informal Worker Occupational Health Desk",
            "notes": "Ergonomic strain screenings and preventive musculoskeletal checkups for technicians.",
        },
    },
    {
        "phone": "+918263935704",
        "email": None,  # Strictly None: Email not provided
        "name": "Aboli Gaikwad",
        "gender": "female",
        "city_key": "cities.pune",
        "work_type": "driver",
        "experience_years": 5,
        "availability": "flexible",
        "pay_min": 800.0,
        "pay_max": 1500.0,
        "emergency_contact": "+919822000004",
        "savings_goal": 12000.0,
        "weekly_save_goal": 1000.0,
        "preferred_language": "mr",
        "transactions": [
            {
                "cid": "demo_seed_8263935704_1",
                "type": "income",
                "amount": 3200.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Outstation Pune-Mumbai Expressway Passenger Trip",
                "work_ref": "Inter-City Taxi Hub",
                "source": "manual",
                "days_ago": 4,
                "hour": 18,
            },
            {
                "cid": "demo_seed_8263935704_2",
                "type": "expense",
                "amount": 950.0,
                "category": "travel_fuel",
                "description": "[Demo Seed] CNG Cylinder Complete Fill at Viman Nagar Pump",
                "work_ref": None,
                "source": "manual",
                "days_ago": 3,
                "hour": 8,
            },
            {
                "cid": "demo_seed_8263935704_3",
                "type": "income",
                "amount": 1800.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Early Morning Airport Surge Transfers",
                "work_ref": "Pune Airport (PNQ) Rides",
                "source": "manual",
                "days_ago": 2,
                "hour": 7,
            },
            {
                "cid": "demo_seed_8263935704_4",
                "type": "expense",
                "amount": 360.0,
                "category": "travel_fuel",
                "description": "[Demo Seed] FASTag Highway Electronic Toll Debits",
                "work_ref": None,
                "source": "manual",
                "days_ago": 2,
                "hour": 12,
            },
            {
                "cid": "demo_seed_8263935704_5",
                "type": "income",
                "amount": 1100.0,
                "category": "work_earnings",
                "description": "[Demo Seed] Evening Corporate Park Commute Rides",
                "work_ref": "Kalyani Nagar / EON Hub",
                "source": "quick",
                "days_ago": 1,
                "hour": 20,
            },
            {
                "cid": "demo_seed_8263935704_6",
                "type": "expense",
                "amount": 200.0,
                "category": "tools",
                "description": "[Demo Seed] High-Pressure Vehicle Wash & Interior Sanitization",
                "work_ref": None,
                "source": "quick",
                "days_ago": 0,
                "hour": 14,
            },
        ],
        "service_profile": {
            "display_name": "Aboli Safe Transit & Airport Escort",
            "trade": "Commercial Chauffeur & Cab Driver",
            "short_description": "5-star rated commercial driver offering safe airport transfers, outstation cab journeys, and verified corporate carpools.",
            "indicative_price": 650.0,
            "pricing_type": "per_trip",
            "is_available": True,
        },
        "bookings": [
            {
                "customer_name": "Vikram Rao",
                "customer_phone": "+919822777777",
                "customer_address": "Konark Nagar, Viman Nagar, Pune",
                "service_trade": "Commercial Chauffeur & Cab Driver",
                "service_description": "Pre-dawn airport drop to Pune International Airport (PNQ) Terminal 2.",
                "booking_date": (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "04:30 - 05:45",
                "status": "completed",
                "estimated_price": 700.0,
            },
            {
                "customer_name": "Neha Saxena",
                "customer_phone": "+919822888888",
                "customer_address": "Cerebrum IT Park, Kalyani Nagar, Pune",
                "service_trade": "Commercial Chauffeur & Cab Driver",
                "service_description": "Evening commute transit from EON Kharadi to Kalyani Nagar.",
                "booking_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "18:30 - 19:45",
                "status": "confirmed",
                "estimated_price": 550.0,
            },
        ],
        "haq_case": {
            "case_number": "HAQ-PUN-2026-002",
            "platform_name": "Uber Driver Partner",
            "deactivation_reason": "Arbitrary toll fee reimbursement deduction",
            "status": "resolved",
            "incident_date": (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d"),
            "loss_of_income_est": 360.0,
            "appeal_text": "FASTag statement attached proving ₹360 toll paid on Talegaon toll plaza, which was missing in weekly settlement. Settlement now credited.",
        },
    },
]


def seed_demo_accounts() -> dict:
    """
    Executes idempotent seeding of authorized demo accounts.
    Returns summary statistics.
    """
    init_db()
    db = SessionLocal()
    stats = {
        "profiles_created": 0,
        "profiles_updated": 0,
        "transactions_seeded": 0,
        "service_profiles_seeded": 0,
        "bookings_seeded": 0,
        "haq_cases_seeded": 0,
        "health_items_seeded": 0,
        "job_applications_seeded": 0,
    }

    try:
        now = datetime.utcnow()

        for user_data in DEMO_USERS:
            phone = user_data["phone"]
            user_id = deterministic_uuid(phone)

            # 1. PROFILE (Upsert by phone_number or user_id)
            profile = db.query(db_models.Profile).filter(
                (db_models.Profile.id == user_id) | (db_models.Profile.phone_number == phone)
            ).first()

            if not profile:
                profile = db_models.Profile(
                    id=user_id,
                    phone_number=phone,
                    email=user_data["email"],
                    full_name=user_data["name"],
                    gender=user_data["gender"],
                    city_key=user_data["city_key"],
                    work_type=user_data["work_type"],
                    experience_years=user_data["experience_years"],
                    availability=user_data["availability"],
                    pay_min=user_data["pay_min"],
                    pay_max=user_data["pay_max"],
                    emergency_contact=user_data["emergency_contact"],
                    savings_goal=user_data["savings_goal"],
                    weekly_save_goal=user_data["weekly_save_goal"],
                    preferred_language=user_data["preferred_language"],
                    created_at=now,
                    updated_at=now,
                )
                db.add(profile)
                stats["profiles_created"] += 1
                logger.info(f"Created profile for {user_data['name']} (UUID: {user_id})")
            else:
                user_id = profile.id  # Use existing UUID if already present
                profile.full_name = user_data["name"]
                profile.email = user_data["email"]
                profile.gender = user_data["gender"]
                profile.city_key = user_data["city_key"]
                profile.work_type = user_data["work_type"]
                profile.experience_years = user_data["experience_years"]
                profile.availability = user_data["availability"]
                profile.pay_min = user_data["pay_min"]
                profile.pay_max = user_data["pay_max"]
                profile.emergency_contact = user_data["emergency_contact"]
                profile.savings_goal = user_data["savings_goal"]
                profile.weekly_save_goal = user_data["weekly_save_goal"]
                profile.preferred_language = user_data["preferred_language"]
                profile.updated_at = now
                stats["profiles_updated"] += 1
                logger.info(f"Updated existing profile for {user_data['name']} (UUID: {user_id})")

            db.commit()

            # 2. NOTIFICATION PREFERENCES (Upsert)
            notif_prefs = db.query(db_models.NotificationPreferences).filter(
                db_models.NotificationPreferences.user_id == user_id
            ).first()
            if not notif_prefs:
                notif_prefs = db_models.NotificationPreferences(
                    user_id=user_id,
                    in_app_enabled=True,
                    sound_enabled=True,
                    vibration_enabled=True,
                    category_money=True,
                    category_work=True,
                    category_health=True,
                    category_skills=True,
                    category_rights=True,
                )
                db.add(notif_prefs)

            # 3. TRANSACTIONS (Upsert by client_tx_id)
            for tx_info in user_data["transactions"]:
                cid = tx_info["cid"]
                tx_date = now - timedelta(days=tx_info["days_ago"])
                tx_timestamp = tx_date.replace(hour=tx_info["hour"], minute=15, second=0, microsecond=0)

                existing_tx = db.query(db_models.Transaction).filter(
                    db_models.Transaction.user_id == user_id,
                    db_models.Transaction.client_tx_id == cid
                ).first()

                if not existing_tx:
                    new_tx = db_models.Transaction(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        client_tx_id=cid,
                        type=tx_info["type"],
                        amount=tx_info["amount"],
                        category=tx_info["category"],
                        description=tx_info["description"],
                        work_ref=tx_info["work_ref"],
                        source=tx_info["source"],
                        timestamp=tx_timestamp,
                        created_at=tx_timestamp,
                        updated_at=tx_timestamp,
                    )
                    db.add(new_tx)
                    stats["transactions_seeded"] += 1
                else:
                    existing_tx.amount = tx_info["amount"]
                    existing_tx.category = tx_info["category"]
                    existing_tx.description = tx_info["description"]
                    existing_tx.work_ref = tx_info["work_ref"]
                    existing_tx.timestamp = tx_timestamp
                    existing_tx.updated_at = now

            # 4. SERVICE PROFILE (Upsert by user_id)
            sp_data = user_data["service_profile"]
            existing_sp = db.query(db_models.ServiceProfile).filter(
                db_models.ServiceProfile.user_id == user_id
            ).first()
            if not existing_sp:
                new_sp = db_models.ServiceProfile(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    display_name=sp_data["display_name"],
                    trade=sp_data["trade"],
                    short_description=sp_data["short_description"],
                    phone=phone,
                    indicative_price=sp_data["indicative_price"],
                    pricing_type=sp_data["pricing_type"],
                    is_available=sp_data["is_available"],
                    created_at=now,
                    updated_at=now,
                )
                db.add(new_sp)
                stats["service_profiles_seeded"] += 1
            else:
                existing_sp.display_name = sp_data["display_name"]
                existing_sp.trade = sp_data["trade"]
                existing_sp.short_description = sp_data["short_description"]
                existing_sp.indicative_price = sp_data["indicative_price"]
                existing_sp.pricing_type = sp_data["pricing_type"]
                existing_sp.is_available = sp_data["is_available"]
                existing_sp.updated_at = now

            # 5. SERVICE BOOKINGS (Upsert by worker_id + customer_name + booking_date)
            for bk in user_data["bookings"]:
                existing_bk = db.query(db_models.ServiceBooking).filter(
                    db_models.ServiceBooking.worker_id == user_id,
                    db_models.ServiceBooking.customer_name == bk["customer_name"],
                    db_models.ServiceBooking.booking_date == bk["booking_date"],
                ).first()

                if not existing_bk:
                    new_bk = db_models.ServiceBooking(
                        id=str(uuid.uuid4()),
                        worker_id=user_id,
                        customer_name=bk["customer_name"],
                        customer_phone=bk["customer_phone"],
                        customer_address=bk["customer_address"],
                        service_trade=bk["service_trade"],
                        service_description=bk["service_description"],
                        booking_date=bk["booking_date"],
                        time_slot=bk["time_slot"],
                        status=bk["status"],
                        estimated_price=bk["estimated_price"],
                        created_at=now,
                        updated_at=now,
                    )
                    db.add(new_bk)
                    stats["bookings_seeded"] += 1
                else:
                    existing_bk.status = bk["status"]
                    existing_bk.estimated_price = bk["estimated_price"]
                    existing_bk.updated_at = now

            # 6. HAQ GRIEVANCE CASE (If present)
            if "haq_case" in user_data:
                hc = user_data["haq_case"]
                existing_hc = db.query(db_models.HaqCase).filter(
                    db_models.HaqCase.case_number == hc["case_number"]
                ).first()
                if not existing_hc:
                    new_hc = db_models.HaqCase(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        case_number=hc["case_number"],
                        platform_name=hc["platform_name"],
                        deactivation_reason=hc["deactivation_reason"],
                        status=hc["status"],
                        incident_date=hc["incident_date"],
                        loss_of_income_est=hc["loss_of_income_est"],
                        appeal_text=hc["appeal_text"],
                        created_at=now,
                        updated_at=now,
                    )
                    db.add(new_hc)
                    stats["haq_cases_seeded"] += 1

            # 7. HEALTH ITEM (If present)
            if "health_item" in user_data:
                hi = user_data["health_item"]
                existing_hi = db.query(db_models.SavedHealthItem).filter(
                    db_models.SavedHealthItem.user_id == user_id,
                    db_models.SavedHealthItem.item_id == hi["item_id"],
                ).first()
                if not existing_hi:
                    new_hi = db_models.SavedHealthItem(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        item_id=hi["item_id"],
                        item_type=hi["item_type"],
                        title=hi["title"],
                        notes=hi["notes"],
                        saved_at=now,
                    )
                    db.add(new_hi)
                    stats["health_items_seeded"] += 1

            # 8. JOB APPLICATION (If present)
            if "job_application" in user_data:
                ja = user_data["job_application"]
                existing_ja = db.query(db_models.JobApplication).filter(
                    db_models.JobApplication.applicant_id == user_id,
                    db_models.JobApplication.job_id == ja["job_id"],
                ).first()
                if not existing_ja:
                    new_ja = db_models.JobApplication(
                        id=str(uuid.uuid4()),
                        job_id=ja["job_id"],
                        applicant_id=user_id,
                        status=ja["status"],
                        cover_note=ja["cover_note"],
                        created_at=now,
                        updated_at=now,
                    )
                    db.add(new_ja)
                    stats["job_applications_seeded"] += 1

            db.commit()

        logger.info(f"Seeding completed successfully: {stats}")
        return stats

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    result = seed_demo_accounts()
    print("Seeding finished with stats:", result)
