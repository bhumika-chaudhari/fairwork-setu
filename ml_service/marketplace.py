"""
Marketplace Router and Persistent Store for Setu Work.
Covers:
- Jobs & Gigs listings and applications
- Worker Service Profiles and local trade directory
- Customer Booking Requests & Booking Lifecycles
- Conflict-checked Availability Management
- Booking-linked and Application-linked Messaging
"""

import json
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

marketplace_router = APIRouter(prefix="/marketplace", tags=["marketplace"])

DATA_FILE = os.path.join(os.path.dirname(__file__), "marketplace_data.json")


# -------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------------------

class CompensationSchema(BaseModel):
    amount: float
    maxAmount: Optional[float] = None
    unit: str = "per_day"  # 'per_day' | 'per_month' | 'per_hour' | 'per_delivery' | 'per_task'
    isEstimate: bool = True
    materialsExtra: bool = False


class ContactChannelSchema(BaseModel):
    type: str = "platform_apply"  # 'platform_apply' | 'direct_phone' | 'email'
    value: Optional[str] = None
    verified: bool = False


class JobListingSchema(BaseModel):
    id: str
    title: str
    employer: str
    category: str
    description: str
    location: str
    serviceArea: Optional[str] = None
    distance: Optional[str] = "2.5 km"
    workType: str = "full_time"  # 'full_time' | 'part_time' | 'shift_based' | 'task_based'
    compensation: CompensationSchema
    schedule: str
    requirements: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    deadline: Optional[str] = None
    verificationStatus: str = "demo_listing"  # 'verified_platform' | 'community_posted' | 'demo_listing'
    safetyInfo: Optional[str] = None
    contactChannel: Optional[ContactChannelSchema] = None
    isDemo: bool = True
    postedAt: str


class ApplyJobPayload(BaseModel):
    jobId: str
    applicantId: str
    applicantName: str
    applicantPhone: str
    applicantSkills: List[str] = Field(default_factory=list)
    applicantExperience: Optional[str] = ""
    applicantLanguages: List[str] = Field(default_factory=list)
    coverNote: Optional[str] = ""


class ApplicationStatusUpdatePayload(BaseModel):
    status: str
    note: Optional[str] = None


class ServicePricingSchema(BaseModel):
    type: str = "visit_fee"  # 'visit_fee' | 'per_hour' | 'per_task' | 'custom_quote'
    indicativePrice: float = 250.0
    maxPrice: Optional[float] = None
    description: str = "Standard visit and diagnosis fee. Extra for replacement parts."
    materialsExtra: bool = True


class ServiceAvailabilitySchema(BaseModel):
    workingDays: List[str] = Field(default_factory=lambda: ["mon", "tue", "wed", "thu", "fri", "sat"])
    timeSlots: List[str] = Field(default_factory=lambda: ["09:00 - 13:00", "14:00 - 18:00"])
    unavailableDates: List[str] = Field(default_factory=list)


class ServiceProfileSchema(BaseModel):
    id: Optional[str] = None
    userId: str
    displayName: str
    trade: str
    skills: List[str] = Field(default_factory=list)
    shortDescription: str
    yearsOfExperience: int = 1
    serviceCategories: List[str] = Field(default_factory=list)
    approximateServiceArea: str
    serviceRadiusKm: int = 8
    languages: List[str] = Field(default_factory=lambda: ["Hindi", "English"])
    qualifications: List[str] = Field(default_factory=list)
    pricing: ServicePricingSchema
    availability: ServiceAvailabilitySchema
    completedJobsCount: int = 0
    rating: Optional[float] = None
    reviewsCount: int = 0
    isPublished: bool = True
    isPaused: bool = False
    verificationStatus: str = "demo_profile"
    updatedAt: Optional[str] = None


class BookingRequestPayload(BaseModel):
    workerId: str
    workerName: str
    workerTrade: str
    customerId: str
    customerName: str
    customerPhone: Optional[str] = None
    serviceCategory: str
    taskDescription: str
    preferredDate: str
    preferredTimeSlot: str
    alternativeTimeSlot: Optional[str] = None
    locality: str
    exactAddress: Optional[str] = None
    lat: Optional[float] = 18.5085
    lng: Optional[float] = 73.8120
    distance: Optional[str] = "1.4 km"
    supportingImages: List[str] = Field(default_factory=list)
    additionalNotes: Optional[str] = None
    indicativePrice: Optional[float] = None


class BookingActionPayload(BaseModel):
    action: str  # 'accept' | 'decline' | 'propose_time' | 'confirm_proposed' | 'complete' | 'cancel'
    proposedDate: Optional[str] = None
    proposedTimeSlot: Optional[str] = None
    note: Optional[str] = None
    role: str = "worker"  # 'worker' | 'customer'


class PostMessagePayload(BaseModel):
    senderId: str
    senderName: str
    senderRole: str  # 'customer' | 'worker' | 'applicant' | 'employer'
    text: str


# -------------------------------------------------------------------------
# PERSISTENCE HELPERS
# -------------------------------------------------------------------------

DEFAULT_JOBS: List[Dict[str, Any]] = [
    {
        "id": "job-del-01",
        "title": "Quick Delivery Partner (Two-Wheeler)",
        "employer": "Swiggy Express Fleet",
        "category": "delivery",
        "description": "Deliver grocery, meal, and retail packages within a 4 km zone. Weekly payout, flexible shifts, and platform accident insurance coverage.",
        "location": "Kothrud & Deccan, Pune",
        "serviceArea": "Pune West Zone",
        "distance": "1.8 km",
        "workType": "shift_based",
        "compensation": {
            "amount": 450,
            "maxAmount": 750,
            "unit": "per_day",
            "isEstimate": True,
            "materialsExtra": False
        },
        "schedule": "Flexible 4 or 8-hour shifts (Morning / Evening / Peak dinner)",
        "requirements": ["Valid driving license", "Two-wheeler with insurance", "Smartphone with GPS"],
        "skills": ["Two-wheeler riding", "GPS Navigation", "Customer Communication"],
        "deadline": "2026-11-15",
        "verificationStatus": "verified_platform",
        "safetyInfo": "Includes standard 24/7 emergency SOS and accidental medical cover up to ₹2 Lakhs.",
        "contactChannel": {
            "type": "platform_apply",
            "value": "delivery.support@swiggy.in",
            "verified": True
        },
        "isDemo": False,
        "postedAt": "2026-10-16T10:00:00Z"
    },
    {
        "id": "job-elec-02",
        "title": "Residential Maintenance Electrician",
        "employer": "Shree Ganesh Housing Society Co-op",
        "category": "electrician",
        "description": "Handle routine electrical maintenance, meter panel troubleshooting, and household inverter repairs for a 120-flat community.",
        "location": "Bavdhan, Pune",
        "serviceArea": "Bavdhan / Pashan",
        "distance": "3.2 km",
        "workType": "part_time",
        "compensation": {
            "amount": 14000,
            "maxAmount": 18000,
            "unit": "per_month",
            "isEstimate": False,
            "materialsExtra": True
        },
        "schedule": "Monday to Saturday, 9:00 AM – 1:30 PM",
        "requirements": ["Wireman license or ITI Electrician certificate", "Minimum 2 years experience in 3-phase wiring"],
        "skills": ["MCB repair", "Inverter wiring", "Safety grounding", "Pump panel check"],
        "deadline": "2026-10-31",
        "verificationStatus": "community_posted",
        "safetyInfo": "All high-voltage works require dual-man safety protocol. Gloves & multimeter provided.",
        "contactChannel": {
            "type": "platform_apply",
            "value": "society.committee@shreeganesh.org",
            "verified": True
        },
        "isDemo": False,
        "postedAt": "2026-10-15T08:30:00Z"
    },
    {
        "id": "job-ware-03",
        "title": "Inventory Sorter & Packing Associate",
        "employer": "BlueDart E-Commerce Hub",
        "category": "warehouse",
        "description": "Barcode scanning, sorting incoming parcels by pincode, and safe pallet loading in modern climate-monitored distribution hub.",
        "location": "Hingewadi Phase 2, Pune",
        "serviceArea": "Hingewadi MIDC",
        "distance": "6.5 km",
        "workType": "full_time",
        "compensation": {
            "amount": 550,
            "maxAmount": 650,
            "unit": "per_day",
            "isEstimate": False,
            "materialsExtra": False
        },
        "schedule": "Fixed 8-hour shift with tea breaks and attendance incentive",
        "requirements": ["Basic numerical literacy", "Ability to lift up to 15 kg boxes", "Punctuality"],
        "skills": ["Barcode scanning", "Inventory packing", "Dispatch verification"],
        "deadline": "2026-11-20",
        "verificationStatus": "verified_platform",
        "safetyInfo": "Safety steel-toe shoes provided on site. Free company pick-and-drop bus from Katraj & Swargate.",
        "contactChannel": {
            "type": "platform_apply",
            "value": "hubjobs.pune@bluedart.com",
            "verified": True
        },
        "isDemo": False,
        "postedAt": "2026-10-17T12:00:00Z"
    },
    {
        "id": "job-clean-04",
        "title": "Commercial Office Deep Cleaning Specialist",
        "employer": "CleanSpace Facility Services",
        "category": "cleaning",
        "description": "Floor scrubbing, glass cleaning, and sanitization of modern co-working premises. High-grade mechanical vacuum and polishing machines used.",
        "location": "Shivaji Nagar, Pune",
        "serviceArea": "Central Pune",
        "distance": "4.1 km",
        "workType": "task_based",
        "compensation": {
            "amount": 800,
            "maxAmount": 1200,
            "unit": "per_task",
            "isEstimate": True,
            "materialsExtra": False
        },
        "schedule": "Early morning or weekend contract slots (flexible bookings)",
        "requirements": ["Prior housekeeping or deep-cleaning experience", "Reliable transport"],
        "skills": ["Vacuum operation", "Glass cleaning", "Floor scrubbing", "Safe chemical handling"],
        "deadline": "2026-11-10",
        "verificationStatus": "demo_listing",
        "safetyInfo": "Full protective aprons, face shields, and rubber gloves supplied.",
        "contactChannel": {
            "type": "platform_apply",
            "value": "support@cleanspace.co.in",
            "verified": False
        },
        "isDemo": True,
        "postedAt": "2026-10-18T06:00:00Z"
    },
    {
        "id": "job-tail-05",
        "title": "Boutique Alteration & Stitching Master",
        "employer": "Ananya Designer Boutique",
        "category": "tailor",
        "description": "Blouse cutting, fall-pico, kurti alterations, and custom garment fitting. Clean, well-lit studio with modern electric sewing machines.",
        "location": "Karve Nagar, Pune",
        "serviceArea": "Karve Road / Warje",
        "distance": "2.9 km",
        "workType": "full_time",
        "compensation": {
            "amount": 16000,
            "maxAmount": 22000,
            "unit": "per_month",
            "isEstimate": False,
            "materialsExtra": False
        },
        "schedule": "10:30 AM – 7:30 PM (Sunday Half Day)",
        "requirements": ["Minimum 3 years tailoring experience", "Expertise in bridal blouse fitting and measurements"],
        "skills": ["Garment cutting", "Interlocking machine", "Embroidery attachment", "Fitting alterations"],
        "deadline": "2026-11-05",
        "verificationStatus": "community_posted",
        "safetyInfo": "Ergonomic seating and well-ventilated workshop.",
        "contactChannel": {
            "type": "platform_apply",
            "value": "ananya.boutique@gmail.com",
            "verified": True
        },
        "isDemo": False,
        "postedAt": "2026-10-14T09:15:00Z"
    }
]

DEFAULT_SERVICE_PROFILES: List[Dict[str, Any]] = [
    {
        "id": "sp-ramesh-elec",
        "userId": "usr-ramesh-77",
        "displayName": "Ramesh Shinde",
        "trade": "electrician",
        "skills": ["House Wiring", "Inverter Fitting", "Short Circuit Repair", "Ceiling Fan & Geyser"],
        "shortDescription": "Certified wireman with 9 years of trusted residential service across Kothrud. Prompt arrival, transparent pricing, and quality guaranteed.",
        "yearsOfExperience": 9,
        "serviceCategories": ["electrician", "appliance_repair"],
        "approximateServiceArea": "Kothrud, Karve Nagar & Deccan, Pune",
        "serviceRadiusKm": 7,
        "languages": ["Marathi", "Hindi", "Basic English"],
        "qualifications": ["ITI Wireman License #MH-PUN-8841", "Govt. Vocational Certificate"],
        "pricing": {
            "type": "visit_fee",
            "indicativePrice": 250,
            "maxPrice": 450,
            "description": "₹250 initial visit and diagnostic fee. Repair charges estimated honestly upfront before starting work.",
            "materialsExtra": True
        },
        "availability": {
            "workingDays": ["mon", "tue", "wed", "thu", "fri", "sat"],
            "timeSlots": ["09:00 - 13:00", "14:00 - 18:00"],
            "unavailableDates": []
        },
        "completedJobsCount": 47,
        "rating": 4.9,
        "reviewsCount": 42,
        "isPublished": True,
        "isPaused": False,
        "verificationStatus": "verified_trade",
        "updatedAt": "2026-10-18T10:00:00Z"
    },
    {
        "id": "sp-sunita-tailor",
        "userId": "usr-sunita-42",
        "displayName": "Sunita Kamble",
        "trade": "tailor",
        "skills": ["Blouse Stitching", "Kurti Fitting", "School Uniforms", "Fall-Pico", "Curtain Hemming"],
        "shortDescription": "Master tailor with 12 years experience. Doorstep pickup & delivery available for custom women's tailoring and quick alterations.",
        "yearsOfExperience": 12,
        "serviceCategories": ["tailor"],
        "approximateServiceArea": "Aundh, Baner & Pashan, Pune",
        "serviceRadiusKm": 8,
        "languages": ["Marathi", "Hindi"],
        "qualifications": ["Diploma in Fashion & Garment Making"],
        "pricing": {
            "type": "per_task",
            "indicativePrice": 350,
            "maxPrice": 900,
            "description": "Simple blouse from ₹350, lining blouse ₹550. Fast 48-hr delivery.",
            "materialsExtra": False
        },
        "availability": {
            "workingDays": ["mon", "tue", "wed", "thu", "fri", "sat"],
            "timeSlots": ["10:00 - 14:00", "16:00 - 20:00"],
            "unavailableDates": []
        },
        "completedJobsCount": 63,
        "rating": 4.8,
        "reviewsCount": 58,
        "isPublished": True,
        "isPaused": False,
        "verificationStatus": "verified_trade",
        "updatedAt": "2026-10-17T14:30:00Z"
    },
    {
        "id": "sp-vikram-plumber",
        "userId": "usr-vikram-19",
        "displayName": "Vikram Jadhav",
        "trade": "plumber",
        "skills": ["Tap & Valve Replacement", "Bathroom Leakage Fix", "Water Tank Cleaning", "Basin & Commode Fitting"],
        "shortDescription": "Quick response plumbing expert. Carries standard CPVC fittings, washers, and sealant for 1-visit resolution.",
        "yearsOfExperience": 6,
        "serviceCategories": ["plumber"],
        "approximateServiceArea": "Hadapsar, Magarpatta & Fatima Nagar, Pune",
        "serviceRadiusKm": 10,
        "languages": ["Hindi", "Marathi"],
        "qualifications": ["Plumbing Apprentice Certificate - MSME"],
        "pricing": {
            "type": "visit_fee",
            "indicativePrice": 200,
            "maxPrice": 400,
            "description": "₹200 inspection fee. Fixed fair rate card for valve/pipe replacements.",
            "materialsExtra": True
        },
        "availability": {
            "workingDays": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
            "timeSlots": ["08:30 - 12:30", "13:30 - 17:30"],
            "unavailableDates": []
        },
        "completedJobsCount": 38,
        "rating": 4.7,
        "reviewsCount": 34,
        "isPublished": True,
        "isPaused": False,
        "verificationStatus": "verified_trade",
        "updatedAt": "2026-10-18T08:00:00Z"
    },
    {
        "id": "sp-anil-mechanic",
        "userId": "usr-anil-63",
        "displayName": "Anil Rathod",
        "trade": "mechanic",
        "skills": ["Two-Wheeler Servicing", "Puncture Repair", "Engine Oil Change", "Brake & Clutch Tuning", "Roadside Assistance"],
        "shortDescription": "Mobile two-wheeler mechanic. Ready with mobile kit for roadside breakdown or doorstep servicing within 5 km.",
        "yearsOfExperience": 8,
        "serviceCategories": ["mechanic"],
        "approximateServiceArea": "Warje, Vadgaon & Sinhagad Road, Pune",
        "serviceRadiusKm": 6,
        "languages": ["Hindi", "Marathi"],
        "qualifications": ["Automobile ITI Mechanic"],
        "pricing": {
            "type": "per_task",
            "indicativePrice": 300,
            "maxPrice": 850,
            "description": "General doorstep service ₹300 (oil & parts extra at MRP). Roadside puncture ₹120.",
            "materialsExtra": True
        },
        "availability": {
            "workingDays": ["mon", "tue", "wed", "thu", "fri", "sat"],
            "timeSlots": ["09:00 - 13:00", "14:00 - 19:00"],
            "unavailableDates": []
        },
        "completedJobsCount": 51,
        "rating": 4.9,
        "reviewsCount": 49,
        "isPublished": True,
        "isPaused": False,
        "verificationStatus": "demo_profile",
        "updatedAt": "2026-10-16T11:00:00Z"
    }
]


DEFAULT_BOOKINGS = [
    {
        "id": "SRV-2026-RHL1",
        "workerId": "usr-ramesh-kumar",
        "workerName": "Ramesh Kumar",
        "workerTrade": "electrician",
        "customerId": "cust-rahul-09",
        "customerName": "Rahul S.",
        "customerPhone": "+91 98220 54321",
        "serviceCategory": "Electrician",
        "taskDescription": "Ceiling fan not working. Fan motor makes humming sound but blade does not rotate. Need repair or capacitor replacement.",
        "preferredDate": "Tomorrow",
        "preferredTimeSlot": "10:00 AM",
        "alternativeTimeSlot": "11:30 AM",
        "proposedDate": None,
        "proposedTimeSlot": None,
        "locality": "Mayur Colony, Kothrud, Pune",
        "exactAddress": "Flat 302, Sai Shraddha Apts, Ideal Colony Lane 3, Kothrud",
        "lat": 18.5085,
        "lng": 73.8120,
        "distance": "1.4 km",
        "supportingImages": [],
        "additionalNotes": "Please bring a test lamp and spare capacitor if possible.",
        "indicativePrice": 250,
        "priceNote": "Standard visit fee. Parts extra at MRP.",
        "status": "requested",
        "statusHistory": [
            {
                "status": "requested",
                "timestamp": "2026-10-18T09:30:00Z",
                "byRole": "customer",
                "note": "Service booking request submitted by Rahul S."
            }
        ],
        "createdAt": "2026-10-18T09:30:00Z",
        "updatedAt": "2026-10-18T09:30:00Z"
    },
    {
        "id": "SRV-2026-PRY2",
        "workerId": "usr-ramesh-kumar",
        "workerName": "Ramesh Kumar",
        "workerTrade": "electrician",
        "customerId": "cust-priya-14",
        "customerName": "Priya Sharma",
        "customerPhone": "+91 98901 22334",
        "serviceCategory": "Electrician",
        "taskDescription": "Kitchen main switchboard sparking when induction stove is turned on. Need immediate safety inspection.",
        "preferredDate": "2026-10-19",
        "preferredTimeSlot": "02:00 PM - 04:00 PM",
        "alternativeTimeSlot": "",
        "proposedDate": None,
        "proposedTimeSlot": None,
        "locality": "Dahanukar Colony, Kothrud, Pune",
        "exactAddress": "Row House 7, Nisarg Meadows, Dahanukar Colony, Kothrud",
        "lat": 18.4975,
        "lng": 73.8155,
        "distance": "2.1 km",
        "supportingImages": [],
        "additionalNotes": "Please inspect MCB trip rating as well.",
        "indicativePrice": 300,
        "priceNote": "Safety inspection & repair",
        "status": "confirmed",
        "statusHistory": [
            {
                "status": "requested",
                "timestamp": "2026-10-17T14:00:00Z",
                "byRole": "customer",
                "note": "Booking requested."
            },
            {
                "status": "confirmed",
                "timestamp": "2026-10-17T15:10:00Z",
                "byRole": "worker",
                "note": "Accepted by service provider."
            }
        ],
        "createdAt": "2026-10-17T14:00:00Z",
        "updatedAt": "2026-10-17T15:10:00Z"
    },
    {
        "id": "SRV-2026-AMT3",
        "workerId": "usr-ramesh-kumar",
        "workerName": "Ramesh Kumar",
        "workerTrade": "electrician",
        "customerId": "cust-amit-21",
        "customerName": "Amit Verma",
        "customerPhone": "+91 97654 33221",
        "serviceCategory": "Electrician",
        "taskDescription": "Inverter battery backup wiring inspection and terminal cleanup.",
        "preferredDate": "2026-10-20",
        "preferredTimeSlot": "11:00 AM - 01:00 PM",
        "alternativeTimeSlot": "",
        "proposedDate": "2026-10-20",
        "proposedTimeSlot": "04:00 PM - 06:00 PM",
        "locality": "Bavdhan, Pune",
        "exactAddress": "B-404, Crystal Heights, Bavdhan",
        "lat": 18.5140,
        "lng": 73.7780,
        "distance": "3.8 km",
        "supportingImages": [],
        "additionalNotes": "Needs alternative time confirmation.",
        "indicativePrice": 350,
        "priceNote": "Battery wiring check",
        "status": "alternative_time_proposed",
        "statusHistory": [
            {
                "status": "requested",
                "timestamp": "2026-10-18T08:00:00Z",
                "byRole": "customer",
                "note": "Booking submitted."
            },
            {
                "status": "alternative_time_proposed",
                "timestamp": "2026-10-18T08:45:00Z",
                "byRole": "worker",
                "note": "Worker proposed alternative slot 04:00 PM - 06:00 PM."
            }
        ],
        "createdAt": "2026-10-18T08:00:00Z",
        "updatedAt": "2026-10-18T08:45:00Z"
    }
]


def load_db() -> Dict[str, Any]:
    if not os.path.exists(DATA_FILE):
        initial_db = {
            "jobs": DEFAULT_JOBS,
            "service_profiles": DEFAULT_SERVICE_PROFILES,
            "applications": [],
            "bookings": DEFAULT_BOOKINGS,
            "conversations": {}
        }
        save_db(initial_db)
        return initial_db

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure bookings has seeded records if empty
            if not data.get("bookings"):
                data["bookings"] = DEFAULT_BOOKINGS
                save_db(data)
            return data
    except Exception as e:
        print(f"Error loading marketplace DB: {e}. Reinitializing.")
        return {
            "jobs": DEFAULT_JOBS,
            "service_profiles": DEFAULT_SERVICE_PROFILES,
            "applications": [],
            "bookings": DEFAULT_BOOKINGS,
            "conversations": {}
        }


def save_db(data: Dict[str, Any]) -> None:
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving marketplace DB: {e}")


# -------------------------------------------------------------------------
# 1. JOBS & GIGS ENDPOINTS
# -------------------------------------------------------------------------

@marketplace_router.get("/jobs")
def list_jobs(
    category: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    city: Optional[str] = Query(None)
):
    """
    Lists and filters job opportunities in the Setu livelihood marketplace.
    """
    db = load_db()
    jobs = db.get("jobs", [])

    filtered = []
    q = (search or "").strip().lower()
    cat = (category or "").strip().lower()
    wt = (work_type or "").strip().lower()
    ct = (city or "").strip().lower()

    for job in jobs:
        # Category filter
        if cat and cat != "all" and job.get("category", "").lower() != cat:
            continue

        # Work type filter
        if wt and wt != "all" and job.get("workType", "").lower() != wt:
            continue

        # City / area filter
        if ct and ct != "all":
            loc = job.get("location", "").lower()
            if ct not in loc:
                continue

        # Search query
        if q:
            haystack = f"{job.get('title', '')} {job.get('employer', '')} {job.get('description', '')} {' '.join(job.get('skills', []))}".lower()
            if q not in haystack:
                continue

        filtered.append(job)

    return filtered


@marketplace_router.get("/jobs/{job_id}")
def get_job(job_id: str):
    """
    Retrieves full details for a single job listing.
    """
    db = load_db()
    for job in db.get("jobs", []):
        if job["id"] == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job listing not found")


@marketplace_router.post("/applications")
def apply_for_job(payload: ApplyJobPayload):
    """
    Submits a job application using Setu profile.
    Checks for duplicate active applications to the same listing.
    """
    db = load_db()
    applications = db.setdefault("applications", [])

    # Find job
    job = next((j for j in db.get("jobs", []) if j["id"] == payload.jobId), None)
    if not job:
        raise HTTPException(status_code=404, detail="The listing you are applying to does not exist.")

    # Duplicate check: check if applicant has active application (not withdrawn)
    for existing in applications:
        if (
            existing.get("jobId") == payload.jobId
            and existing.get("applicantId") == payload.applicantId
            and existing.get("status") != "withdrawn"
        ):
            raise HTTPException(
                status_code=409,
                detail=f"You already have an active application ({existing.get('id')}) for this job. Check My Activity to view status."
            )

    now = datetime.utcnow().isoformat() + "Z"
    app_id = f"APP-2026-{uuid.uuid4().hex[:4].upper()}"

    new_app = {
        "id": app_id,
        "jobId": payload.jobId,
        "jobTitle": job.get("title", "Job Role"),
        "employer": job.get("employer", "Employer"),
        "applicantId": payload.applicantId,
        "applicantName": payload.applicantName,
        "applicantPhone": payload.applicantPhone,
        "applicantSkills": payload.applicantSkills,
        "applicantExperience": payload.applicantExperience or "Experienced worker",
        "applicantLanguages": payload.applicantLanguages or ["Hindi", "English"],
        "coverNote": payload.coverNote or "",
        "status": "submitted",
        "statusHistory": [
            {
                "status": "submitted",
                "timestamp": now,
                "note": "Application submitted with verified Setu worker profile."
            }
        ],
        "appliedAt": now,
        "updatedAt": now,
        "employerUpdated": False,
        "nextAction": "Awaiting employer review (usually 2–4 working days)."
    }

    applications.insert(0, new_app)
    save_db(db)

    # Initialize associated conversation for employer-applicant messaging
    conversations = db.setdefault("conversations", {})
    conversations[app_id] = {
        "contextId": app_id,
        "contextType": "application",
        "summaryTitle": f"Application for {job.get('title')}",
        "summarySubtitle": f"Employer: {job.get('employer')}",
        "status": "submitted",
        "participants": [
            {"id": payload.applicantId, "name": payload.applicantName, "role": "applicant"},
            {"id": job.get("employer", "employer"), "name": job.get("employer", "Employer"), "role": "employer"}
        ],
        "messages": [
            {
                "id": f"msg-{uuid.uuid4().hex[:6]}",
                "contextId": app_id,
                "senderId": "system",
                "senderName": "Setu Application Desk",
                "senderRole": "employer",
                "text": f"Application {app_id} received. The employer ({job.get('employer')}) has been notified.",
                "timestamp": now
            }
        ],
        "updatedAt": now
    }
    save_db(db)

    return new_app


@marketplace_router.get("/applications")
def list_applications(applicant_id: Optional[str] = Query(None)):
    """
    Lists applications for the current worker.
    """
    db = load_db()
    apps = db.get("applications", [])
    if applicant_id:
        return [a for a in apps if a.get("applicantId") == applicant_id]
    return apps


@marketplace_router.post("/applications/{app_id}/withdraw")
def withdraw_application(app_id: str):
    """
    Allows a worker to withdraw their application.
    """
    db = load_db()
    apps = db.get("applications", [])
    target = next((a for a in apps if a["id"] == app_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Application not found")

    if target.get("status") == "withdrawn":
        raise HTTPException(status_code=400, detail="Application is already withdrawn")

    now = datetime.utcnow().isoformat() + "Z"
    target["status"] = "withdrawn"
    target["updatedAt"] = now
    target["nextAction"] = "Application withdrawn by candidate."
    target.setdefault("statusHistory", []).append({
        "status": "withdrawn",
        "timestamp": now,
        "note": "Withdrawn by candidate."
    })

    save_db(db)
    return target


@marketplace_router.post("/applications/{app_id}/status")
def update_application_status(app_id: str, payload: ApplicationStatusUpdatePayload):
    """
    Authorized employer status update endpoint (simulates partner webhook / review portal).
    """
    db = load_db()
    apps = db.get("applications", [])
    target = next((a for a in apps if a["id"] == app_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Application not found")

    valid_statuses = [
        "submitted", "in_review", "shortlisted", "interview_requested",
        "accepted", "not_selected", "withdrawn"
    ]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    now = datetime.utcnow().isoformat() + "Z"
    target["status"] = payload.status
    target["updatedAt"] = now
    target["employerUpdated"] = True

    next_actions = {
        "in_review": "Application is being reviewed by hiring manager.",
        "shortlisted": "Candidate shortlisted! Expect communication within 48 hours.",
        "interview_requested": "Interview requested. Check messages to schedule.",
        "accepted": "Offer extended! Review start date and instructions.",
        "not_selected": "Candidate not selected for this opening.",
        "withdrawn": "Application withdrawn."
    }
    target["nextAction"] = next_actions.get(payload.status, "Status updated by employer.")

    target.setdefault("statusHistory", []).append({
        "status": payload.status,
        "timestamp": now,
        "note": payload.note or f"Status changed to {payload.status.replace('_', ' ')}."
    })

    save_db(db)
    return target


# -------------------------------------------------------------------------
# 2. LOCAL SERVICES & WORKER PROFILES ENDPOINTS
# -------------------------------------------------------------------------

@marketplace_router.get("/service-profiles")
def list_service_profiles(
    trade: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    locality: Optional[str] = Query(None)
):
    """
    Public directory of verified & published local trade service providers.
    Does not expose private addresses or phone numbers.
    """
    db = load_db()
    profiles = db.get("service_profiles", [])

    results = []
    t_filter = (trade or "").strip().lower()
    q = (search or "").strip().lower()
    loc_filter = (locality or "").strip().lower()

    for p in profiles:
        # Only show published and unpaused profiles
        if not p.get("isPublished", True) or p.get("isPaused", False):
            continue

        if t_filter and t_filter != "all" and p.get("trade", "").lower() != t_filter:
            # Check secondary categories
            categories = [c.lower() for c in p.get("serviceCategories", [])]
            if t_filter not in categories:
                continue

        if loc_filter and loc_filter != "all":
            area = p.get("approximateServiceArea", "").lower()
            if loc_filter not in area:
                continue

        if q:
            haystack = f"{p.get('displayName', '')} {p.get('trade', '')} {p.get('shortDescription', '')} {' '.join(p.get('skills', []))} {p.get('approximateServiceArea', '')}".lower()
            if q not in haystack:
                continue

        results.append(p)

    return results


@marketplace_router.get("/service-profiles/{profile_id}")
def get_service_profile(profile_id: str):
    """
    Retrieves full public service profile of a worker.
    """
    db = load_db()
    for p in db.get("service_profiles", []):
        if p.get("id") == profile_id or p.get("userId") == profile_id:
            return p
    raise HTTPException(status_code=404, detail="Service profile not found")


@marketplace_router.post("/service-profiles")
def create_or_update_service_profile(payload: ServiceProfileSchema):
    """
    Allows a worker to create, update, pause, or publish their own service profile.
    """
    db = load_db()
    profiles = db.setdefault("service_profiles", [])

    now = datetime.utcnow().isoformat() + "Z"
    existing_idx = next(
        (i for i, p in enumerate(profiles) if p.get("userId") == payload.userId or (payload.id and p.get("id") == payload.id)),
        -1
    )

    profile_id = payload.id or (profiles[existing_idx]["id"] if existing_idx >= 0 else f"sp-{uuid.uuid4().hex[:6]}")

    profile_dict = payload.dict()
    profile_dict["id"] = profile_id
    profile_dict["updatedAt"] = now

    if existing_idx >= 0:
        # Preserve genuine completed stats if previously recorded
        old = profiles[existing_idx]
        profile_dict["completedJobsCount"] = old.get("completedJobsCount", profile_dict.get("completedJobsCount", 0))
        profile_dict["rating"] = old.get("rating", profile_dict.get("rating"))
        profile_dict["reviewsCount"] = old.get("reviewsCount", profile_dict.get("reviewsCount", 0))
        profiles[existing_idx] = profile_dict
    else:
        profile_dict["completedJobsCount"] = 0
        profile_dict["rating"] = None
        profile_dict["reviewsCount"] = 0
        profiles.append(profile_dict)

    save_db(db)
    return profile_dict


# -------------------------------------------------------------------------
# 3. BOOKING REQUESTS & LIFECYCLE (WITH CONFLICT CHECKING)
# -------------------------------------------------------------------------

@marketplace_router.post("/bookings")
def create_booking_request(payload: BookingRequestPayload):
    """
    Customer requests a local service booking from a worker.
    """
    db = load_db()
    bookings = db.setdefault("bookings", [])

    # Validate worker exists
    worker = next((p for p in db.get("service_profiles", []) if p.get("userId") == payload.workerId or p.get("id") == payload.workerId), None)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker service profile not found")

    now = datetime.utcnow().isoformat() + "Z"
    booking_id = f"SRV-2026-{uuid.uuid4().hex[:4].upper()}"

    new_booking = {
        "id": booking_id,
        "workerId": payload.workerId,
        "workerName": worker.get("displayName", payload.workerName),
        "workerTrade": worker.get("trade", payload.workerTrade),
        "customerId": payload.customerId,
        "customerName": payload.customerName,
        "customerPhone": payload.customerPhone or "Shared upon confirmation",
        "serviceCategory": payload.serviceCategory or worker.get("trade", "Service"),
        "taskDescription": payload.taskDescription,
        "preferredDate": payload.preferredDate,
        "preferredTimeSlot": payload.preferredTimeSlot,
        "alternativeTimeSlot": payload.alternativeTimeSlot or "",
        "proposedDate": None,
        "proposedTimeSlot": None,
        "locality": payload.locality,
        "exactAddress": payload.exactAddress or "",
        "lat": payload.lat or 18.5085,
        "lng": payload.lng or 73.8120,
        "distance": payload.distance or "1.4 km",
        "supportingImages": payload.supportingImages,
        "additionalNotes": payload.additionalNotes or "",
        "indicativePrice": payload.indicativePrice or worker.get("pricing", {}).get("indicativePrice", 250),
        "priceNote": worker.get("pricing", {}).get("description", "Standard visit fee"),
        "status": "requested",
        "statusHistory": [
            {
                "status": "requested",
                "timestamp": now,
                "byRole": "customer",
                "note": "Service booking request submitted by customer."
            }
        ],
        "createdAt": now,
        "updatedAt": now
    }

    bookings.insert(0, new_booking)
    save_db(db)

    # Initialize conversation
    conversations = db.setdefault("conversations", {})
    conversations[booking_id] = {
        "contextId": booking_id,
        "contextType": "booking",
        "summaryTitle": f"{new_booking['serviceCategory'].capitalize()} with {new_booking['workerName']}",
        "summarySubtitle": f"Date: {new_booking['preferredDate']} ({new_booking['preferredTimeSlot']})",
        "status": "requested",
        "participants": [
            {"id": payload.customerId, "name": payload.customerName, "role": "customer"},
            {"id": payload.workerId, "name": new_booking['workerName'], "role": "worker"}
        ],
        "messages": [
            {
                "id": f"msg-{uuid.uuid4().hex[:6]}",
                "contextId": booking_id,
                "senderId": payload.customerId,
                "senderName": payload.customerName,
                "senderRole": "customer",
                "text": f"Booking request submitted for {payload.taskDescription} on {payload.preferredDate} ({payload.preferredTimeSlot}).",
                "timestamp": now
            }
        ],
        "updatedAt": now
    }
    save_db(db)

    return new_booking


@marketplace_router.get("/bookings")
def list_bookings(
    worker_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None)
):
    """
    Lists bookings filtered by workerId or customerId.
    Always includes default bookings for worker view.
    """
    db = load_db()
    bookings = db.get("bookings", [])
    if not bookings:
        bookings = DEFAULT_BOOKINGS
        db["bookings"] = DEFAULT_BOOKINGS
        save_db(db)

    if worker_id and customer_id:
        return [b for b in bookings if b.get("workerId") == worker_id or b.get("customerId") == customer_id]
    if worker_id:
        # Match workerId or default seeded worker or unassigned
        return [
            b for b in bookings
            if b.get("workerId") == worker_id
            or b.get("workerId") == "usr-ramesh-kumar"
            or not b.get("workerId")
        ]
    if customer_id:
        return [b for b in bookings if b.get("customerId") == customer_id]

    return bookings


@marketplace_router.post("/bookings/{booking_id}/action")
def handle_booking_action(booking_id: str, payload: BookingActionPayload):
    """
    Handles lifecycle actions for bookings:
    - 'accept': Worker accepts booking (performs backend conflict check against overlapping confirmed slots)
    - 'decline': Worker declines booking
    - 'propose_time': Worker suggests alternative date/time
    - 'confirm_proposed': Customer confirms worker's proposed alternative time
    - 'complete': Worker or customer confirms completion
    - 'cancel': Either party cancels
    """
    db = load_db()
    bookings = db.get("bookings", [])
    booking = next((b for b in bookings if b["id"] == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found")

    now = datetime.utcnow().isoformat() + "Z"
    action = payload.action.lower()

    if action == "accept":
        # CONFLICT CHECK: Verify worker does not already have an active/confirmed booking for the same date & time slot
        date_to_check = booking.get("proposedDate") or booking.get("preferredDate")
        slot_to_check = booking.get("proposedTimeSlot") or booking.get("preferredTimeSlot")
        worker_id = booking.get("workerId")

        for other in bookings:
            if other["id"] == booking_id:
                continue
            if other.get("workerId") == worker_id and other.get("status") in ["confirmed", "in_progress"]:
                other_date = other.get("proposedDate") or other.get("preferredDate")
                other_slot = other.get("proposedTimeSlot") or other.get("preferredTimeSlot")
                if other_date == date_to_check and other_slot == slot_to_check:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Scheduling Conflict: You already have confirmed booking {other['id']} for {date_to_check} at {slot_to_check}. Please propose an alternative time slot."
                    )

        booking["status"] = "confirmed"
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "confirmed",
            "timestamp": now,
            "byRole": payload.role,
            "note": payload.note or "Booking accepted and confirmed by service provider."
        })

    elif action in ("decline", "reject"):
        booking["status"] = "rejected"
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "rejected",
            "timestamp": now,
            "byRole": payload.role,
            "note": payload.note or "Service provider is currently unavailable for this request."
        })

    elif action in ("in_progress", "start_job"):
        booking["status"] = "in_progress"
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "in_progress",
            "timestamp": now,
            "byRole": payload.role,
            "note": payload.note or "Worker started service job at customer location."
        })

    elif action == "propose_time":
        if not payload.proposedDate or not payload.proposedTimeSlot:
            raise HTTPException(status_code=400, detail="Must provide proposedDate and proposedTimeSlot")

        booking["status"] = "alternative_time_proposed"
        booking["proposedDate"] = payload.proposedDate
        booking["proposedTimeSlot"] = payload.proposedTimeSlot
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "alternative_time_proposed",
            "timestamp": now,
            "byRole": payload.role,
            "note": payload.note or f"Worker proposed new time: {payload.proposedDate} ({payload.proposedTimeSlot}). Awaiting customer confirmation."
        })

    elif action == "confirm_proposed":
        # Customer confirms the worker's proposed alternative
        booking["preferredDate"] = booking.get("proposedDate", booking.get("preferredDate"))
        booking["preferredTimeSlot"] = booking.get("proposedTimeSlot", booking.get("preferredTimeSlot"))
        booking["status"] = "confirmed"
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "confirmed",
            "timestamp": now,
            "byRole": "customer",
            "note": "Customer agreed to the alternative time slot."
        })

    elif action == "complete":
        booking["status"] = "completed"
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "completed",
            "timestamp": now,
            "byRole": payload.role,
            "note": payload.note or "Service completed successfully."
        })

        # Increment worker completed jobs count
        profiles = db.get("service_profiles", [])
        worker_prof = next((p for p in profiles if p.get("userId") == booking.get("workerId") or p.get("id") == booking.get("workerId")), None)
        if worker_prof:
            worker_prof["completedJobsCount"] = worker_prof.get("completedJobsCount", 0) + 1

    elif action == "cancel":
        booking["status"] = "cancelled"
        booking["updatedAt"] = now
        booking.setdefault("statusHistory", []).append({
            "status": "cancelled",
            "timestamp": now,
            "byRole": payload.role,
            "note": payload.note or "Booking cancelled."
        })

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action '{action}'")

    save_db(db)
    return booking


# -------------------------------------------------------------------------
# 4. BOOKING & APPLICATION CONVERSATION MESSAGES
# -------------------------------------------------------------------------

@marketplace_router.get("/conversations/{context_id}")
def get_conversation(context_id: str):
    """
    Retrieves the conversation messages linked to a booking or job application.
    """
    db = load_db()
    conversations = db.get("conversations", {})
    if context_id in conversations:
        return conversations[context_id]

    # Return empty template if not yet initialized
    return {
        "contextId": context_id,
        "contextType": "booking" if "SRV" in context_id else "application",
        "summaryTitle": "Direct Communication",
        "summarySubtitle": "Setu Secure Messaging",
        "status": "active",
        "participants": [],
        "messages": [],
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }


@marketplace_router.post("/conversations/{context_id}/messages")
def post_conversation_message(context_id: str, payload: PostMessagePayload):
    """
    Appends a new message to the conversation.
    """
    db = load_db()
    conversations = db.setdefault("conversations", {})

    now = datetime.utcnow().isoformat() + "Z"
    conv = conversations.get(context_id)
    if not conv:
        conv = {
            "contextId": context_id,
            "contextType": "booking" if "SRV" in context_id else "application",
            "summaryTitle": "Direct Communication",
            "summarySubtitle": "Setu Secure Messaging",
            "status": "active",
            "participants": [],
            "messages": [],
            "updatedAt": now
        }
        conversations[context_id] = conv

    new_msg = {
        "id": f"msg-{uuid.uuid4().hex[:6]}",
        "contextId": context_id,
        "senderId": payload.senderId,
        "senderName": payload.senderName,
        "senderRole": payload.senderRole,
        "text": payload.text.strip(),
        "timestamp": now
    }

    conv["messages"].append(new_msg)
    conv["updatedAt"] = now

    save_db(db)
    return new_msg


# -------------------------------------------------------------------------
# 5. ACTIVITY SUMMARY
# -------------------------------------------------------------------------

@marketplace_router.get("/activity-summary")
def get_activity_summary(user_id: str = Query(...)):
    """
    Provides real counts and active items for My Activity overview.
    """
    db = load_db()
    apps = [a for a in db.get("applications", []) if a.get("applicantId") == user_id]
    incoming_bookings = [b for b in db.get("bookings", []) if b.get("workerId") == user_id and b.get("status") in ["requested", "awaiting_worker_response", "alternative_time_proposed"]]
    my_bookings = [b for b in db.get("bookings", []) if (b.get("customerId") == user_id or b.get("workerId") == user_id) and b.get("status") in ["confirmed", "in_progress"]]
    completed_bookings = [b for b in db.get("bookings", []) if (b.get("customerId") == user_id or b.get("workerId") == user_id) and b.get("status") == "completed"]

    return {
        "applicationsCount": len(apps),
        "incomingRequestsCount": len(incoming_bookings),
        "confirmedBookingsCount": len(my_bookings),
        "completedWorkCount": len(completed_bookings),
        "latestApplications": apps[:3],
        "latestIncomingRequests": incoming_bookings[:3],
        "latestBookings": my_bookings[:3]
    }
