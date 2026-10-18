"""
Health & Wellbeing Service for FairWork Setu.
Provides:
- Verified government and public healthcare facility directory
- Verified central and state welfare health schemes
- Symptom triage and evidence-informed guidance with emergency escalation
- AI Health Assistant with safe guidance, citations, and disclaimer
- Gig-worker occupational health and workplace safety guidance
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

health_router = APIRouter(prefix="/health-service", tags=["health"])

# -------------------------------------------------------------------------
# 1. VERIFIED HEALTHCARE FACILITIES
# -------------------------------------------------------------------------

VERIFIED_FACILITIES = [
    {
        "id": "fac-sassoon-pune",
        "name": "Sassoon General Hospital & B.J. Govt Medical College",
        "type": "hospital",
        "categoryLabel": "Government Teaching Hospital",
        "address": "Station Road, Near Pune Railway Station",
        "locality": "Station / Camp",
        "city": "Pune",
        "distance": "2.4 km",
        "phone": "020-26128000",
        "timings": "Open 24x7 (Emergency & Casualty)",
        "services": [
            "Emergency 24x7",
            "Casualty & Trauma Care",
            "Free OPD",
            "Ayushman PM-JAY Empanelled",
            "Blood Bank",
            "Free Essential Medicines"
        ],
        "isGovernment": True,
        "isVerified": True,
        "is24x7": True,
        "emergencyServices": True,
        "lat": 18.5283,
        "lng": 73.8743,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Sassoon+General+Hospital+Pune"
    },
    {
        "id": "fac-aundh-civil-pune",
        "name": "Aundh District Civil Hospital",
        "type": "hospital",
        "categoryLabel": "District Civil Hospital",
        "address": "Chest Hospital Road, Near Parihar Chowk, Aundh",
        "locality": "Aundh",
        "city": "Pune",
        "distance": "4.1 km",
        "phone": "020-27298155",
        "timings": "Open 24x7 (Emergency)",
        "services": [
            "24x7 Emergency",
            "General Medicine OPD",
            "Orthopedic Clinic",
            "MJPJAY & PM-JAY Cashless",
            "Free Diagnostic Laboratory",
            "Maternity & Child Ward"
        ],
        "isGovernment": True,
        "isVerified": True,
        "is24x7": True,
        "emergencyServices": True,
        "lat": 18.5621,
        "lng": 73.8078,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Aundh+District+Hospital+Pune"
    },
    {
        "id": "fac-kothrud-phc",
        "name": "Kothrud Urban Primary Health Centre (UPHC)",
        "type": "phc",
        "categoryLabel": "Urban Primary Health Centre (PMC)",
        "address": "Near Shivaji Statue, Paud Road, Kothrud",
        "locality": "Kothrud",
        "city": "Pune",
        "distance": "1.2 km",
        "phone": "020-25381240",
        "timings": "08:30 AM - 04:30 PM (Mon-Sat)",
        "services": [
            "General Consultation",
            "Free Fever & Cold Medicines",
            "Blood Sugar & BP Screening",
            "Maternal & Child Immunization",
            "DOTS TB Screening",
            "Referral to Civil Hospital"
        ],
        "isGovernment": True,
        "isVerified": True,
        "is24x7": False,
        "emergencyServices": False,
        "lat": 18.5074,
        "lng": 73.8077,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Urban+Health+Centre+Kothrud+Pune"
    },
    {
        "id": "fac-arogya-mandir-shivaji",
        "name": "Ayushman Arogya Mandir (Health & Wellness Centre)",
        "type": "clinic",
        "categoryLabel": "Govt Health & Wellness Centre",
        "address": "Municipal Dispensary, Ghole Road, Shivajinagar",
        "locality": "Shivajinagar",
        "city": "Pune",
        "distance": "2.8 km",
        "phone": "1800-111-565",
        "timings": "09:00 AM - 05:00 PM",
        "services": [
            "Preventive Health Checkup",
            "Free Non-Communicable Disease Screening",
            "Tele-consultation (e-Sanjeevani)",
            "Free Essential Generic Drugs",
            "Wellness & Physiotherapy Guidance"
        ],
        "isGovernment": True,
        "isVerified": True,
        "is24x7": False,
        "emergencyServices": False,
        "lat": 18.5314,
        "lng": 73.8446,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Ayushman+Arogya+Mandir+Shivajinagar+Pune"
    },
    {
        "id": "fac-jan-aushadhi-kothrud",
        "name": "Pradhan Mantri Jan Aushadhi Kendra",
        "type": "pharmacy",
        "categoryLabel": "Government Generic Pharmacy (PMBJP)",
        "address": "Shop 4, Near Kothrud Bus Stand, Karve Road",
        "locality": "Kothrud",
        "city": "Pune",
        "distance": "1.5 km",
        "phone": "1800-180-8080",
        "timings": "09:00 AM - 09:00 PM (Daily)",
        "services": [
            "50% to 90% Discounted Generic Medicines",
            "Affordable Pain Relievers & Paracetamol",
            "Oral Rehydration Salts (ORS)",
            "First Aid Kits & Bandages",
            "Blood Pressure & Glucometer Strips"
        ],
        "isGovernment": True,
        "isVerified": True,
        "is24x7": False,
        "emergencyServices": False,
        "lat": 18.4988,
        "lng": 73.8189,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Jan+Aushadhi+Kendra+Kothrud+Pune"
    },
    {
        "id": "fac-kem-mumbai",
        "name": "KEM Hospital & Seth G.S. Medical College",
        "type": "hospital",
        "categoryLabel": "Municipal Corporation Teaching Hospital",
        "address": "Acharya Donde Marg, Parel",
        "locality": "Parel",
        "city": "Mumbai",
        "distance": "2.1 km",
        "phone": "022-24107000",
        "timings": "Open 24x7 (Casualty & Trauma)",
        "services": [
            "24x7 Trauma & Critical Care",
            "Free & Subsidized Emergency Surgery",
            "PM-JAY & MJPJAY Helpdesk",
            "Cardiac & Stroke Rapid Response",
            "In-house Blood Bank"
        ],
        "isGovernment": True,
        "isVerified": True,
        "is24x7": True,
        "emergencyServices": True,
        "lat": 19.0024,
        "lng": 72.8427,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=KEM+Hospital+Parel+Mumbai"
    },
    {
        "id": "fac-medplus-247-pune",
        "name": "MedPlus 24x7 Pharmacy & First Aid",
        "type": "pharmacy",
        "categoryLabel": "Licensed 24x7 Pharmacy",
        "address": "Plot 12, Paud Road, Opposite Kinara Hotel",
        "locality": "Kothrud",
        "city": "Pune",
        "distance": "0.9 km",
        "phone": "020-25458920",
        "timings": "Open 24x7",
        "services": [
            "24x7 Night Medicine Dispensing",
            "Emergency Inhalers & Antihistamines",
            "Burn Ointments & Bandages",
            "Instant Digital Thermometers",
            "Home Delivery in 2 km"
        ],
        "isGovernment": False,
        "isVerified": True,
        "is24x7": True,
        "emergencyServices": False,
        "lat": 18.5034,
        "lng": 73.8122,
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=MedPlus+Pharmacy+Paud+Road+Kothrud"
    }
]


# -------------------------------------------------------------------------
# 2. VERIFIED WELFARE & HEALTH SCHEMES
# -------------------------------------------------------------------------

VERIFIED_SCHEMES = [
    {
        "id": "sch-pmjay",
        "name": "Ayushman Bharat PM-JAY",
        "hindiName": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना",
        "shortDescription": "India's flagship cashless public health assurance scheme covering hospitalization costs.",
        "targetBeneficiaries": "Economically vulnerable families, gig workers, and SECC eligible households.",
        "benefits": [
            "Cashless hospital treatment up to ₹5,00,000 per family per year",
            "Covers 1,900+ medical and surgical procedures",
            "Includes pre-hospitalization (3 days) and post-hospitalization (15 days) medication",
            "Accepted across 28,000+ public and private empanelled hospitals nationwide"
        ],
        "coverageAmount": "₹5,00,000 / year",
        "eligibilityCriteria": [
            "Household listed under SECC 2011 or NFSA ration card",
            "Active Ayushman Card / Golden Card",
            "No formal employer health insurance"
        ],
        "requiredDocuments": [
            "Aadhaar Card with linked phone",
            "Ration Card (Orange, Yellow, or Antyodaya)",
            "Active mobile number"
        ],
        "officialUrl": "https://pmjay.gov.in",
        "helplinePhone": "14555",
        "lastVerified": "2026-10-01",
        "category": "insurance"
    },
    {
        "id": "sch-mjpjay",
        "name": "Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)",
        "hindiName": "महात्मा ज्योतिराव फुले जन आरोग्य योजना (महाराष्ट्र)",
        "shortDescription": "Maharashtra State flagship cashless health insurance for all state residents holding valid ration cards.",
        "targetBeneficiaries": "All families holding Yellow, Orange, White Ration Cards or Antyodaya cards in Maharashtra.",
        "benefits": [
            "Cashless coverage up to ₹5,00,000 per family per year across Maharashtra",
            "Covers 1,356 medical therapies, surgeries, and specialized ICU treatments",
            "Dedicated Arogyamitra at every empanelled hospital to help workers without paperwork friction"
        ],
        "coverageAmount": "₹5,00,000 / year",
        "eligibilityCriteria": [
            "Permanent resident of Maharashtra state",
            "Possession of any valid Ration Card (Yellow, Orange, or White) or Annapurna card"
        ],
        "requiredDocuments": [
            "Ration Card copy",
            "Aadhaar Card / Voter ID"
        ],
        "officialUrl": "https://www.jeevandayee.gov.in",
        "helplinePhone": "1800-120-8040",
        "lastVerified": "2026-10-05",
        "category": "insurance"
    },
    {
        "id": "sch-arogya-mandir",
        "name": "Ayushman Arogya Mandir (Health & Wellness Centres)",
        "hindiName": "आयुष्मान आरोग्य मंदिर",
        "shortDescription": "Neighborhood primary healthcare centres providing free consultations, medicines, and screening tests.",
        "targetBeneficiaries": "Every citizen, informal worker, and local neighborhood resident.",
        "benefits": [
            "100% Free primary doctor consultation and maternal care",
            "Free essential generic medications for fever, cold, blood pressure, and diabetes",
            "Free diagnostic blood & urine lab tests (14+ basic tests)",
            "Tele-consultation with specialist doctors via e-Sanjeevani"
        ],
        "coverageAmount": "100% Free at Point of Care",
        "eligibilityCriteria": [
            "Open to all citizens without any income or documentation barrier"
        ],
        "requiredDocuments": [
            "Any photo ID or ABHA ID (optional, but speeds up digital registration)"
        ],
        "officialUrl": "https://ab-hwc.nhp.gov.in",
        "helplinePhone": "1800-111-565",
        "lastVerified": "2026-09-28",
        "category": "wellness"
    },
    {
        "id": "sch-pmsby-eshram",
        "name": "e-Shram Accidental Death & Disability Cover (PMSBY)",
        "hindiName": "ई-श्रम दुर्घटना बीमा योजना",
        "shortDescription": "Government accident coverage for registered gig workers, platform delivery partners, and daily-wage labourers.",
        "targetBeneficiaries": "Unorganised and gig workers between 18 and 59 years registered on e-Shram.",
        "benefits": [
            "₹2,00,000 financial support in case of accidental death while working or traveling",
            "₹2,00,000 for total and permanent disability (loss of both eyes or both limbs)",
            "₹1,00,000 for partial permanent disability (loss of one eye or one limb)"
        ],
        "coverageAmount": "₹2,00,000 accidental cover",
        "eligibilityCriteria": [
            "Registered on e-Shram portal with valid UAN (Universal Account Number)",
            "Age between 18 and 59 years",
            "Not an income tax payer and not covered under EPFO/ESIC"
        ],
        "requiredDocuments": [
            "e-Shram Card (UAN Number)",
            "Aadhaar Card",
            "Bank passbook copy for direct DBT transfer"
        ],
        "officialUrl": "https://eshram.gov.in",
        "helplinePhone": "14434",
        "lastVerified": "2026-10-10",
        "category": "accident"
    },
    {
        "id": "sch-pmmbjp",
        "name": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)",
        "hindiName": "प्रधानमंत्री भारतीय जनऔषधि परियोजना",
        "shortDescription": "Dedicated government pharmacy network providing high-quality generic medicines at 50% to 90% lower prices.",
        "targetBeneficiaries": "All citizens, especially workers managing chronic diabetes, BP, or acute health expenses.",
        "benefits": [
            "Quality generic medicines available at 50% to 90% cheaper than commercial branded equivalents",
            "Over 1,800 medicines and 290 surgical consumables available",
            "Quality tested in NABL-accredited laboratories for guaranteed potency"
        ],
        "coverageAmount": "Up to 90% savings on prescriptions",
        "eligibilityCriteria": [
            "Open to all walk-in patients with a valid doctor prescription or for over-the-counter essentials"
        ],
        "requiredDocuments": [
            "Doctor prescription for prescription-only medicines (none required for OTC first aid/ORS)"
        ],
        "officialUrl": "https://janaushadhi.gov.in",
        "helplinePhone": "1800-180-8080",
        "lastVerified": "2026-10-02",
        "category": "medicine"
    },
    {
        "id": "sch-pmmvy",
        "name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        "hindiName": "प्रधानमंत्री मातृ वंदना योजना",
        "shortDescription": "Maternity benefit scheme providing direct cash assistance to pregnant and lactating female informal workers.",
        "targetBeneficiaries": "Pregnant women and lactating mothers working in the informal sector.",
        "benefits": [
            "₹5,000 cash incentive in direct bank installments for the first child",
            "Additional ₹6,000 incentive if the second child is a girl child",
            "Compensates for wage loss during pregnancy and encourages institutional hospital delivery"
        ],
        "coverageAmount": "₹5,000 - ₹6,000 DBT",
        "eligibilityCriteria": [
            "Pregnant woman aged 19 years or above",
            "Must register pregnancy at an Anganwadi Centre or Government Health Centre within 570 days"
        ],
        "requiredDocuments": [
            "Mother-Child Protection (MCP) card",
            "Aadhaar card of mother and husband",
            "Bank passbook of the mother"
        ],
        "officialUrl": "https://pmmvy.wcd.gov.in",
        "helplinePhone": "1098 / 011-23382393",
        "lastVerified": "2026-09-15",
        "category": "maternity"
    }
]


# -------------------------------------------------------------------------
# 3. WORKPLACE HEALTH & SAFETY TIPS
# -------------------------------------------------------------------------

WORKPLACE_SAFETY_TIPS = [
    {
        "id": "tip-heat-hydration",
        "title": "Beat the Heat: Hydration on Two Wheels",
        "category": "delivery",
        "categoryLabel": "Delivery & Gig Couriers",
        "summary": "Outdoor heat can cause sudden dizzy spells, slow reaction times, and road accidents. Preventive hydration is vital.",
        "tips": [
            "Drink at least 250 ml of water every 45 minutes, even before you feel thirsty.",
            "Carry an ORS packet (Electral or Jan Aushadhi ORS ₹4) and mix in water if feeling fatigued or sweating heavily.",
            "Park under tree shade or building awnings during order wait times rather than sitting directly under the afternoon sun.",
            "Wear a lightweight, light-colored cotton scarf under your helmet to absorb sweat and protect your neck from direct sunburn."
        ],
        "helpfulCount": 428
    },
    {
        "id": "tip-lifting-back",
        "title": "Safe Lifting Technique for Heavy Loads",
        "category": "construction",
        "categoryLabel": "Construction & Warehouse Helpers",
        "summary": "Prevent permanent lumbar spine injury by lifting with your thighs and leg muscles, never bending from the waist.",
        "tips": [
            "Bend your knees and squat down close to the parcel or cement bag — keep your back straight.",
            "Hold the load firmly against your chest or core before straightening your legs to stand up.",
            "Never twist your torso while carrying a heavy weight; pivot your feet instead.",
            "If a bag weighs more than 25 kg, always ask a co-worker for a team lift."
        ],
        "helpfulCount": 312
    },
    {
        "id": "tip-driving-stretches",
        "title": "Prevent Back Stiffness During Long Driving Shifts",
        "category": "driving",
        "categoryLabel": "Auto, Cab & Truck Drivers",
        "summary": "Prolonged sitting causes poor blood circulation, lower back compression, and highway drowsiness.",
        "tips": [
            "Take a 5-minute movement break every 2 hours: step out of the cab, stretch your hamstrings, and do gentle shoulder rolls.",
            "Adjust your seat angle to 100–110 degrees rather than slouching forward or leaning too far back.",
            "Place a small rolled towel or cushion behind your lower back to maintain natural lumbar curvature.",
            "Wash your face with cold water at traffic hubs to stay alert and avoid drowsy driving."
        ],
        "helpfulCount": 279
    },
    {
        "id": "tip-vendor-hygiene",
        "title": "Safe Food Handling & Heat Protection for Street Vendors",
        "category": "vendor",
        "categoryLabel": "Street Vendors & Food Stalls",
        "summary": "Protects your health, prevents food spoilage in hot weather, and builds customer trust.",
        "tips": [
            "Wash hands thoroughly with soap or keep alcohol sanitizer handy between handling currency and food items.",
            "Keep cut vegetables, dairy, and cooked food strictly covered with clean mesh or stainless steel lids to prevent fly infestation.",
            "Set up a sunshade or umbrella over your cart to keep your working space 4–5 degrees cooler.",
            "Wear comfortable rubber-soled slippers or shoes to prevent leg swelling from standing for 8+ hours."
        ],
        "helpfulCount": 195
    }
]


# -------------------------------------------------------------------------
# 4. REQUEST SCHEMAS
# -------------------------------------------------------------------------

class SymptomTriagePayload(BaseModel):
    category: str
    onset: str = "today"  # 'today' | '1-2_days' | '3+_days' | 'ongoing'
    severity: str = "moderate"  # 'mild' | 'moderate' | 'severe'
    trend: str = "same"  # 'improving' | 'same' | 'worsening'
    redFlags: List[str] = Field(default_factory=list)
    notes: Optional[str] = ""


class AskHealthPayload(BaseModel):
    question: str
    language: Optional[str] = "en"
    userRole: Optional[str] = "worker"


# -------------------------------------------------------------------------
# 5. ENDPOINTS
# -------------------------------------------------------------------------

@health_router.get("/facilities")
def get_facilities(
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    city: Optional[str] = Query(None)
):
    """
    Returns verified healthcare facilities filtered by category, search term, or locality.
    """
    results = VERIFIED_FACILITIES

    t_filter = (type or "").strip().lower()
    if t_filter and t_filter != "all":
        results = [f for f in results if f["type"] == t_filter]

    c_filter = (city or "").strip().lower()
    if c_filter and c_filter != "all":
        results = [f for f in results if f["city"].lower() == c_filter]

    loc_filter = (locality or "").strip().lower()
    if loc_filter and loc_filter != "all":
        results = [f for f in results if loc_filter in f["locality"].lower() or loc_filter in f["address"].lower()]

    q = (search or "").strip().lower()
    if q:
        results = [
            f for f in results
            if q in f["name"].lower()
            or q in f["categoryLabel"].lower()
            or q in f["address"].lower()
            or any(q in s.lower() for s in f["services"])
        ]

    return results


@health_router.get("/schemes")
def get_schemes(category: Optional[str] = Query(None)):
    """
    Returns verified welfare and health schemes.
    """
    if not category or category == "all":
        return VERIFIED_SCHEMES
    return [s for s in VERIFIED_SCHEMES if s["category"] == category.lower()]


@health_router.get("/safety-tips")
def get_safety_tips(category: Optional[str] = Query(None)):
    """
    Returns occupational safety and health guidance.
    """
    if not category or category == "all":
        return WORKPLACE_SAFETY_TIPS
    return [t for t in WORKPLACE_SAFETY_TIPS if t["category"] == category.lower()]


@health_router.post("/triage")
def triage_symptoms(payload: SymptomTriagePayload):
    """
    Evidence-informed health guidance based on reported concerns.
    Strict medical safety:
    - Never generates confident clinical diagnoses or prescriptions.
    - Escalates severe chest pain, shortness of breath, sudden weakness, or heavy bleeding directly to emergency services (112/108).
    """
    cat = payload.category.lower()
    sev = payload.severity.lower()
    flags = [f.lower() for f in payload.redFlags]

    # Check for critical medical emergencies
    emergency_indicators = [
        "chest pain", "pressure in chest", "shortness of breath", "severe breathing difficulty",
        "unconscious", "fainting", "severe bleeding", "sudden paralysis", "slurred speech",
        "coughing blood", "high fever above 104", "severe head injury", "broken bone"
    ]

    has_emergency = (
        sev == "severe" and any(ind in f for ind in emergency_indicators for f in flags)
    ) or any("chest" in f or "breathing" in f or "unconscious" in f or "bleeding" in f for f in flags)

    if has_emergency:
        return {
            "category": cat,
            "isEmergency": True,
            "emergencyReason": "Your reported symptoms include potential warning signs requiring immediate emergency medical attention. Please do not wait or attempt self-treatment.",
            "summary": "Urgent Medical Attention Required",
            "recommendations": [
                "Call 112 or 108 immediately for emergency ambulance dispatch.",
                "Have someone stay with you and sit down in a safe, shaded, or well-ventilated location.",
                "Do not drive a vehicle or ride a motorcycle yourself in this condition.",
                "Proceed to the nearest 24x7 government hospital or casualty department immediately."
            ],
            "selfCareSteps": [
                "Loosen any tight clothing around your collar, chest, or waist.",
                "Sit upright with back support if having breathing difficulty; lie flat with feet slightly elevated if feeling faint.",
                "Keep your phone active and emergency contacts informed."
            ],
            "redFlagWarning": "EMERGENCY: Do not delay seeking care. Setu cannot diagnose or treat life-threatening conditions.",
            "suggestedFacilityType": "hospital",
            "suggestedQuestions": [
                "Where is the nearest 24x7 emergency hospital?",
                "What is the ambulance number in Pune / Mumbai?",
                "How to tell someone I need emergency help?"
            ]
        }

    # Standard evidence-informed category guidance
    if cat == "fever":
        return {
            "category": cat,
            "isEmergency": False,
            "summary": "Fever or feeling feverish is your body's immune reaction, commonly triggered by viral infections, seasonal changes, or exhaustion.",
            "recommendations": [
                "Rest in a cool, well-ventilated room and drink plenty of clean fluids (water, ORS, lemon water, thin dal).",
                "Take simple paracetamol 500mg if advised by a pharmacist, avoiding self-medicating with antibiotics.",
                "Visit your neighborhood Primary Health Centre (PHC) if fever stays above 101°F for more than 48 hours or is accompanied by chills and shivering.",
                "Get a rapid malaria and dengue blood test at a government dispensary if fever occurs during monsoon or post-rainy season."
            ],
            "selfCareSteps": [
                "Apply a clean cloth soaked in normal tap water (not cold ice water) on forehead to reduce temperature.",
                "Wear loose, breathable cotton clothing.",
                "Avoid skipping meals; consume light foods like khichdi, porridge, and seasonal fruits."
            ],
            "redFlagWarning": "Seek urgent medical care if accompanied by stiff neck, confusion, rash, persistent vomiting, or breathing difficulty.",
            "suggestedFacilityType": "phc",
            "suggestedQuestions": [
                "Where can I get free fever medicine near me?",
                "How much does a fever checkup cost at a government clinic?",
                "Can I take paracetamol during my delivery shift?"
            ]
        }

    elif cat == "dizziness":
        return {
            "category": cat,
            "isEmergency": False,
            "summary": "Dizziness or feeling weak is often linked to dehydration, prolonged sun exposure, skipping breakfast, or a temporary drop in blood pressure.",
            "recommendations": [
                "Stop work immediately, pull over your vehicle safely, and sit or lie down in the shade.",
                "Sip water mixed with an ORS packet or a pinch of salt and sugar slowly.",
                "Eat a quick source of energy such as a banana, biscuits, or a cup of warm tea.",
                "If dizziness continues after resting 20 minutes, visit a nearby clinic or Arogya Mandir to check blood pressure and blood sugar."
            ],
            "selfCareSteps": [
                "Do not stand up suddenly; rise slowly from sitting positions.",
                "Avoid heavy lifting or driving until you feel completely balanced.",
                "Aim for 7 to 8 hours of uninterrupted sleep."
            ],
            "redFlagWarning": "Go to an emergency centre if dizziness is accompanied by chest tightness, slurred speech, sudden numbness in arms or legs, or fainting.",
            "suggestedFacilityType": "clinic",
            "suggestedQuestions": [
                "Why do I get dizzy during afternoon deliveries?",
                "Where can I get an ORS packet nearby?",
                "How to check blood pressure for free at a PHC?"
            ]
        }

    elif cat == "pain":
        return {
            "category": cat,
            "isEmergency": False,
            "summary": "Body ache, back strain, or joint pain is very common among physical labourers, riders, and drivers due to repetitive strain and poor posture.",
            "recommendations": [
                "Rest the affected muscle group; avoid lifting heavy loads or prolonged awkward postures for the next 24 hours.",
                "Apply warm compress or a hot water bottle for chronic back stiffness; use cold ice pack for fresh sprains (first 24 hours).",
                "Gentle hamstring and lower back stretching can relieve driving stiffness.",
                "Visit a Primary Health Centre or district hospital orthopedic OPD if pain persists beyond 3 days or shoots down your leg."
            ],
            "selfCareSteps": [
                "Use ergonomic lifting: bend at the knees, not the waist.",
                "Use a supportive lumbar cushion on your seat.",
                "Over-the-counter pain balm or generic paracetamol from Jan Aushadhi Kendra (₹5–10) can provide temporary relief."
            ],
            "redFlagWarning": "Urgent care needed if pain follows a high-impact fall, severe vehicle collision, or is accompanied by inability to move limbs.",
            "suggestedFacilityType": "clinic",
            "suggestedQuestions": [
                "Exercises for lower back pain from long bike riding?",
                "Which government hospital has an orthopedic doctor?",
                "How to claim accidental insurance under e-Shram?"
            ]
        }

    elif cat == "cough":
        return {
            "category": cat,
            "isEmergency": False,
            "summary": "Cough, cold, or throat irritation is frequently caused by seasonal viral flu, weather shifts, or chronic road dust and diesel exhaust exposure.",
            "recommendations": [
                "Wear an N95 or clean 3-ply mask while on heavy traffic corridors to filter vehicular soot and dust.",
                "Gargle with warm salt water twice daily to soothe throat irritation.",
                "Steam inhalation for 5 to 10 minutes helps clear blocked nasal passages and chest congestion.",
                "If a cough persists for more than 2 weeks, visit a government dispensary for a free sputum test to rule out tuberculosis (Nikshay program provides ₹500/month nutritional support)."
            ],
            "selfCareSteps": [
                "Drink warm water, herbal kadha, or ginger-tulsi tea throughout the day.",
                "Avoid cold drinks, direct blast of AC right after sweating in traffic, and smoking.",
                "Keep windows cracked open for cross-ventilation."
            ],
            "redFlagWarning": "Seek immediate hospital care if you experience blue lips, gasping for breath, high fever, or coughing blood.",
            "suggestedFacilityType": "phc",
            "suggestedQuestions": [
                "Where can I get tested if cough lasts 2 weeks?",
                "What mask is best for dust during outdoor work?",
                "Are asthma inhalers covered under Ayushman Bharat?"
            ]
        }

    elif cat == "injury":
        return {
            "category": cat,
            "isEmergency": False,
            "summary": "Minor cuts, scrapes, burns, or bruises require prompt hygiene to prevent bacterial infection and tetanus complications.",
            "recommendations": [
                "Wash the wound immediately under clean running tap water and mild soap for at least 3 minutes to remove dirt.",
                "Apply antiseptic liquid (Povidone-iodine or Betadine) and cover with a clean sterile bandage.",
                "Get a Tetanus Toxoid (TT) injection at a nearby PHC or pharmacy within 24 hours if you have not had one in the past 5 years.",
                "If the cut is deep, gaping, or bleeding steadily after 5 minutes of firm pressure, visit a hospital casualty for stitches."
            ],
            "selfCareSteps": [
                "Keep the wound dry during bathing or dirty physical work; change bandage daily.",
                "Do not apply unverified home remedies like mud, ash, or cow dung on open cuts.",
                "Watch for signs of infection: increased redness, swelling, warmth, or yellow pus."
            ],
            "redFlagWarning": "Seek urgent care if you suspect a fracture (cannot put weight on limb, visible bone deformity, severe swelling) or deep puncture from rusty metal.",
            "suggestedFacilityType": "hospital",
            "suggestedQuestions": [
                "Where can I get a Tetanus (TT) injection nearby?",
                "Does e-Shram cover workplace injuries?",
                "How much does a basic X-ray cost at a civil hospital?"
            ]
        }

    else:
        return {
            "category": cat,
            "isEmergency": False,
            "summary": "General wellbeing guidance for maintaining strength, endurance, and peace of mind during demanding work schedules.",
            "recommendations": [
                "Your physical and mental health is your biggest asset for earning a livelihood.",
                "Take advantage of free annual health checkups at government Ayushman Arogya Mandirs.",
                "Connect with worker peer groups or call the National Tele-MANAS mental health helpline (14416) if feeling overwhelmed, anxious, or burnt out.",
                "Ensure your family is registered on an Ayushman card (PM-JAY) or state health card so medical emergencies never lead to debt."
            ],
            "selfCareSteps": [
                "Eat balanced meals with lentils, seasonal vegetables, and clean water.",
                "Set aside 15 minutes a day for quiet rest, deep breathing, or prayer.",
                "Avoid excessive alcohol and tobacco consumption as stress relievers."
            ],
            "redFlagWarning": "If you ever feel in severe physical distress or despair, reach out to emergency services 112 or Tele-MANAS 14416 immediately.",
            "suggestedFacilityType": "clinic",
            "suggestedQuestions": [
                "How can I get an Ayushman Bharat card made?",
                "What is the Tele-MANAS mental health helpline?",
                "Where is the nearest primary health centre?"
            ]
        }


@health_router.post("/ask")
def ask_health_assistant(payload: AskHealthPayload):
    """
    Empathetic, evidence-informed health assistant for informal workers.
    Features:
    - Clear distinction between general information and clinical diagnoses.
    - Automatic detection of dangerous warning signs and instant emergency escalation.
    - Verified government schemes & clinic citations.
    """
    q = payload.question.strip().lower()

    # Emergency keyword check
    emergency_triggers = [
        "heart attack", "chest pain", "can't breathe", "cannot breathe", "breathless",
        "unconscious", "fainted", "heavy bleeding", "poison", "stroke", "paralysis",
        "dying", "suicide", "broken head", "severe crash"
    ]

    for trigger in emergency_triggers:
        if trigger in q:
            return {
                "answer": "⚠️ WARNING: This sounds like a possible medical emergency. Please do NOT wait or try self-treatment at home.\n\n1. Immediately call 112 (National Emergency) or 108 (Ambulance).\n2. If someone is with you, have them stay close and guide emergency services to your location.\n3. Proceed directly to the nearest hospital emergency/casualty department.",
                "isEmergency": True,
                "sources": [
                    {"title": "National Emergency Service (112)", "url": "tel:112"},
                    {"title": "National Ambulance Helpline (108)", "url": "tel:108"}
                ],
                "disclaimer": "Setu provides livelihood health information and navigation only. It is not a diagnostic tool and cannot replace emergency medical services."
            }

    # Curated knowledge retrieval
    if "dizzy" in q or "dizziness" in q or "faint" in q:
        return {
            "answer": "Dizziness during long outdoor shifts is commonly caused by dehydration, electrolyte loss from heavy sweating, or a temporary dip in blood sugar.\n\nKey steps to take right now:\n1. Stop what you are doing, park safely in the shade, and sit down.\n2. Drink clean water mixed with an ORS packet (Electral / Jan Aushadhi ORS) slowly.\n3. Eat something light with quick sugar (like a banana, jaggery, or biscuits).\n\nIf you feel confused, have chest tightness, or the dizziness does not improve in 20 minutes, please have someone take you to the nearest clinic or call 112.",
            "isEmergency": False,
            "sources": [
                {"title": "National Health Mission - Heat & Hydration Guidelines", "url": "https://nhm.gov.in"},
                {"title": "Jan Aushadhi ORS & Essentials", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "This information is for educational purposes and should not replace advice from a qualified healthcare professional."
        }

    elif "ayushman" in q or "card" in q or "pmjay" in q or "scheme" in q:
        return {
            "answer": "Under Ayushman Bharat PM-JAY and Maharashtra's MJPJAY scheme, eligible families receive up to ₹5 Lakh per year for cashless hospital treatment.\n\nHow to get support:\n1. Check if your family has an active Ration Card (Yellow, Orange, or Antyodaya).\n2. Visit your nearest Ayushman Arogya Mandir or government hospital with your Aadhaar Card and Ration Card to create an Ayushman Card (Golden Card).\n3. You can also call the national toll-free helpline at 14555 to verify your name in the beneficiary list.",
            "isEmergency": False,
            "sources": [
                {"title": "PM-JAY Official Portal", "url": "https://pmjay.gov.in"},
                {"title": "National Health Authority Helpline (14555)", "url": "tel:14555"}
            ],
            "disclaimer": "Eligibility verification is conducted by authorized government portals and hospital Arogyamitra desks."
        }

    elif "hospital" in q or "doctor" in q or "phc" in q or "clinic" in q:
        return {
            "answer": "Public government hospitals (such as Sassoon General Hospital and Aundh Civil Hospital in Pune, or KEM Hospital in Mumbai) provide free or highly subsidized consultations, diagnostic tests, and 24x7 casualty care.\n\nFor everyday problems like fever, cold, or minor cuts, your neighborhood Urban Primary Health Centre (UPHC) or Ayushman Arogya Mandir is faster and provides free essential medicines without long hospital queues.",
            "isEmergency": False,
            "sources": [
                {"title": "Maharashtra Public Health Department", "url": "https://arogya.maharashtra.gov.in"},
                {"title": "National Health Portal Directory", "url": "https://nhp.gov.in"}
            ],
            "disclaimer": "Facility timings and doctor availability may vary. Please confirm directly with the centre."
        }

    elif "medicine" in q or "generic" in q or "pharmacy" in q or "discount" in q:
        return {
            "answer": "You can get verified quality generic medicines at 50% to 90% cheaper prices at Pradhan Mantri Jan Aushadhi Kendras.\n\nExamples:\n- Paracetamol 500mg strip: ₹5 to ₹10\n- ORS packet: ₹4 to ₹5\n- Antacid / Gastric tablets: ₹8 to ₹12\n\nThere are over 10,000 Jan Aushadhi stores across India. Look for the orange-green storefront near major bus stands and government hospitals.",
            "isEmergency": False,
            "sources": [
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"},
                {"title": "Jan Aushadhi Helpline (1800-180-8080)", "url": "tel:18001808080"}
            ],
            "disclaimer": "Prescription medicines require a valid doctor prescription."
        }

    else:
        # Ground with Model 8 Health & Welfare RAG
        try:
            from ai_models_service import ai_models_service
            rag_res = ai_models_service.search_health_welfare_rag(payload.question, top_k=2)
            passages = rag_res.get("passages", [])
            if passages and passages[0].get("similarity_score", 0) > 0.40:
                top_p = passages[0]
                src = top_p.get("source", "verified_scheme.md")
                clean_text = top_p.get("text", "").replace("#", "").strip()[:400]
                return {
                    "answer": f"Based on verified government policy ({src}):\n\n{clean_text}...\n\nFor personalized verification, visit your nearest Primary Health Centre (PHC) or empanelled hospital with your Aadhaar and Ration Card.",
                    "isEmergency": False,
                    "sources": [
                        {"title": f"Verified Document: {src} (Score: {top_p.get('similarity_score')})", "url": "https://pmjay.gov.in"},
                        {"title": "National Health Authority Helpline (14555)", "url": "tel:14555"}
                    ],
                    "disclaimer": "Retrieved via Setu Model 8 Health & Welfare RAG. Informational only; consult licensed health professionals."
                }
        except Exception:
            pass

        return {
            "answer": f"Thank you for asking Setu. Regarding '{payload.question}':\n\nFor non-emergency health concerns, we recommend visiting your nearest Urban Primary Health Centre or Ayushman Arogya Mandir for a free checkup with a licensed medical officer. If this relates to workplace fatigue or dehydration, please remember to take shade breaks and drink water with electrolytes.\n\nIf you are experiencing severe pain, difficulty breathing, or sudden weakness, please seek immediate medical care at a hospital casualty or call 112.",
            "isEmergency": False,
            "sources": [
                {"title": "National Health Mission Health Guidance", "url": "https://nhm.gov.in"},
                {"title": "Ayushman Bharat National Portal", "url": "https://pmjay.gov.in"}
            ],
            "disclaimer": "Setu provides health navigation and welfare guidance only. Always consult a qualified medical professional for health diagnoses and treatment."
        }

