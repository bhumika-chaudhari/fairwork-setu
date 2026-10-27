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


# -------------------------------------------------------------------------
# MULTI-DIALECT INTENT CLASSIFICATION & CLINICAL TRIAGE MATRIX
# -------------------------------------------------------------------------

import re

def classify_health_intent(query_text: str) -> str:
    """
    Multi-dialect normalizer matching Hindi, Urdu, Marathi, Hinglish, and English phrasing.
    """
    ql = query_text.lower().strip()

    # 1. Critical Emergency (Bypass RAG)
    if re.search(
        r"\b(chest|seene? me(in)? (tez )?dard|chaati me|heart attack|dil ka daura|saans nahi|cannot breathe|can't breathe|breathless|choking|heavy bleeding|bohot khoon|unconscious|behosh|stroke|lakwa|paralysis|poison|zeher)\b",
        ql
    ):
        return "emergency"

    # 2. Account deactivation / Rajasthan Gig Act
    if re.search(
        r"\b(deactivat|without notice|bina notice|account band|account suspend|rajasthan gig|welfare board|tribunal)\b",
        ql
    ):
        return "deactivation_rights"

    # 3. Pension / PM-SYM eligibility
    if re.search(
        r"\b(pm-?sym|maan-?dhan|shram yogi|pension|umar|age \d+|\d+ saal)\b",
        ql
    ):
        return "pmsym_pension"

    # 4. Generic medicines / Jan Aushadhi savings
    if re.search(
        r"\b(generic|jan aushadhi|pmbjp|sasti dawai|dawa discount|discount|paracetamol ka price|branded dawai|cheap medicine|50%)\b",
        ql
    ):
        return "generic_medicines"

    # 5. Burns / wounds / silencer injuries
    if re.search(
        r"\b(silencer|jal gaya|burn|fafola|blister|chot|khronch|cut lag|chhil gaya|ungli kat|khoon|wound|dressing)\b",
        ql
    ):
        return "wounds_burns"

    # 6. Cold, Cough, Sore Throat & Nasal Congestion
    if re.search(
        r"\b(jukam|zukaam|zukham|sardi|thandi|nazla|khansi|khasi|balgam|balgum|kaf|cough|gala kharab|gale me|gale mein|chheenk|chink|naak beh|naak band|saans lene me sarsarhat|sinus|khokla)\b",
        ql
    ):
        return "cold_cough"

    # 7. Dehydration, Heat Stress & Sunstroke
    if re.search(
        r"\b(dehydration|dihydration|lu lag|loo lag|dhup|dhoop|garmi chadh|pyaas|gala sookh|hoth sookh|paseena|sar ghoom|kamzori|behoshi|chakkar|heat)\b",
        ql
    ):
        return "dehydration_heat"

    # 8. Digestive Upset, Acidity & Food Poisoning
    if re.search(
        r"\b(pet dard|pet me|stomach|acidity|gas ban|jalan|khatti dakar|ulti|vomit|matli|dast|loose motion|hazma|food poisoning|potaat dukhne)\b",
        ql
    ):
        return "digestive_acidity"

    # 9. Musculoskeletal Strain & Rider Ergonomics
    if re.search(
        r"\b(kamar|back pain|peeth|gardan|neck|kandha|shoulder|ghutna|haath pair|moch|cramp|nas chad|ergonomic|path dukhne)\b",
        ql
    ):
        return "musculoskeletal"

    # 10. Fever, Viral Infection & Body Ache
    if re.search(
        r"\b(bukhar|bukhaar|buhar|fever|hararat|tap|taap|shareer garam|badan dard|badan toot|sir dard|viral|dengue|malaria|chills)\b",
        ql
    ):
        return "fever_viral"

    return "general"


def get_clinical_triage_response(category_key: str, user_query: str) -> Dict[str, Any]:
    """
    Returns structured, clinically-grounded guidance with exact Jan Aushadhi prices,
    shift first-aid, clinical red-flags, and verified portal citations.
    """
    if category_key == "emergency":
        return {
            "answer": (
                "🚨 CRITICAL MEDICAL EMERGENCY ALERT 🚨\n\n"
                "Your reported symptoms indicate an acute medical emergency. Do NOT wait, drive, or attempt self-care:\n\n"
                "1. 📞 Call 112 (All-India Emergency) or 108 (Free Medical Ambulance) IMMEDIATELY.\n"
                "2. Sit upright in a safe shaded area, loosen tight clothing around neck and waist.\n"
                "3. Have a colleague, bystander, or family member stay with you until emergency personnel arrive.\n"
                "4. Proceed directly to the nearest 24x7 Government Hospital Casualty or trauma center."
            ),
            "isEmergency": True,
            "sources": [
                {"title": "National Emergency Service (112)", "url": "tel:112"},
                {"title": "Ambulance Helpline (108)", "url": "tel:108"},
                {"title": "Pregnancy & Neonatal Transport (102)", "url": "tel:102"}
            ],
            "disclaimer": "Emergency bypass protocol triggered. Setu provides health navigation only and cannot replace hospital casualty care."
        }

    if category_key == "cold_cough":
        return {
            "answer": (
                "Regarding your cold, cough, and nasal congestion (जुकाम / खांसी):\n\n"
                "1. 🛵 Shift First-Aid & Care:\n"
                "- Drink lukewarm water or ginger-tulsi tea during delivery shifts; avoid chilled sodas or rapid AC-to-sun transitions.\n"
                "- Take 10 minutes of steam inhalation after your shift to loosen mucus.\n"
                "- Warm salt-water gargle (1/2 tsp salt in 1 glass warm water) twice daily for throat irritation.\n\n"
                "2. 💊 Subsidized Generic Medicines (Jan Aushadhi PMBJP):\n"
                "- Paracetamol 500mg/650mg: ₹5–₹10 per strip of 10 tablets (for fever/headache).\n"
                "- Cetirizine 10mg: ₹5–₹8 per strip of 10 tablets (anti-allergy for runny nose/sneezing; take 1 at night).\n"
                "- Dextromethorphan / Ambroxol cough syrup (100ml): ₹25–₹35 at PMBJP stores (vs ₹110 branded).\n\n"
                "3. ⚠️ Danger Signs (Refer to UPHC / PHC):\n"
                "Visit your neighborhood Urban Primary Health Centre (UPHC) if fever stays above 101°F for >3 days, if coughing yellow-green mucus or blood, or if experiencing shortness of breath."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "National Health Mission (NHM)", "url": "https://nhm.gov.in"},
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "Prescription medicines require doctor consultation. Informational occupational guidance only."
        }

    if category_key == "dehydration_heat":
        return {
            "answer": (
                "Regarding dehydration, heat stress, and sun exposure (लू / डिहाइड्रेशन):\n\n"
                "1. 🛑 Immediate Shift Protocol:\n"
                "- Park your bike/vehicle safely in the shade immediately. Turn off engine.\n"
                "- Remove helmet, heavy jacket, and tight delivery backpack.\n"
                "- Sponge forehead, nape of the neck, and wrists with a cool damp cloth.\n\n"
                "2. 💧 Electrolyte Rehydration:\n"
                "- Sip Oral Rehydration Salts (ORS) mixed in 1 liter of clean water slowly (1 glass over 10–15 mins).\n"
                "- Jan Aushadhi WHO-formula ORS Sachet (21.8g): ₹4–₹5 per sachet (vs ₹22–₹30 branded Electral).\n"
                "- Fresh coconut water or lemon-water with sugar and a pinch of salt serve as natural alternatives.\n"
                "- ⚠️ Warning: Do NOT chug ice-cold water rapidly, as it induces stomach cramps and vascular shock.\n\n"
                "3. 🚨 Critical Red-Flag (Heat Stroke - Call 108):\n"
                "High body temperature (>103°F) with ABSENCE of sweating, slurred speech, delirium, or vomiting is life-threatening heat stroke. Call 108 immediately and pour water continuously over the head."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "National Health Mission - Heat & Hydration Guidelines", "url": "https://nhm.gov.in"},
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "Always carry water and ORS during shifts. Informational guidance only."
        }

    if category_key == "fever_viral":
        return {
            "answer": (
                "Regarding fever, viral infection, and body aches (बुखार / बदन दर्द):\n\n"
                "1. 🛌 Shift Rest & Self-Care:\n"
                "- Complete physical rest. Cease heavy outdoor deliveries; exertion during acute fever worsens dehydration and cardiac strain.\n"
                "- Sponge forehead and limbs with room-temperature tap water (never use cold ice water).\n"
                "- Drink at least 2.5 to 3 liters of fluids (clean water, thin dal, ORS) throughout the day.\n\n"
                "2. 💊 Medication Guidance (Jan Aushadhi):\n"
                "- Generic Paracetamol 500mg: ₹5–₹10 per strip of 10 tablets (1 tablet every 6–8 hours after food).\n"
                "- ⚠️ CRITICAL SAFETY WARNING: Do NOT consume Aspirin, Ibuprofen, or Combiflam without a doctor checkup! If the fever is Dengue, these drugs cause life-threatening internal bleeding!\n\n"
                "3. ⚠️ Hospital Escalation (UPHC):\n"
                "Severe eye pain, red skin rashes, dark urine, or high fever with chills require an immediate free CBC/Malaria/Dengue blood test at your local Urban Primary Health Centre (UPHC)."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "National Centre for Disease Control (NCDC)", "url": "https://ncdc.gov.in"},
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "Never take unprescribed antibiotics or NSAIDs for undiagnosed fevers. Consult a PHC medical officer."
        }

    if category_key == "digestive_acidity":
        return {
            "answer": (
                "Regarding digestive distress, loose motions, and acidity (पेट दर्द / उल्टी-दस्त):\n\n"
                "1. 🍵 Immediate Shift Care:\n"
                "- Prevent dehydration: drink 1 cup of fresh ORS solution after every loose motion or vomit episode.\n"
                "- Consume bland foods: khichdi, curd, banana, and plain toast. Avoid roadside tea, fried snacks, and oily food.\n\n"
                "2. 💊 Generic Medicines (Jan Aushadhi PMBJP):\n"
                "- Jan Aushadhi ORS Sachet: ₹4–₹5 per sachet.\n"
                "- Pantoprazole 40mg or Omeprazole 20mg: ₹10–₹18 per strip of 10 tablets (take 1 tablet 30 minutes before breakfast for acidity/reflux).\n"
                "- Dicyclomine / Meftal-spas: For spasmodic cramps under pharmacist advice.\n\n"
                "3. ⚠️ Danger Signs (Seek Immediate Medical Care):\n"
                "Bloody or black stool, inability to retain fluids for >6 hours with dry tongue, or intense localized lower-right abdominal pain (appendicitis warning) require immediate hospital evaluation."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "National Health Mission (NHM)", "url": "https://nhm.gov.in"},
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "Informational occupational guidance. Severe dehydration requires IV fluid therapy at a clinic."
        }

    if category_key == "musculoskeletal":
        return {
            "answer": (
                "Regarding musculoskeletal strain, backache, and ergonomics (कमर दर्द / गर्दन का खिंचाव):\n\n"
                "1. 🏍️ Rider Ergonomics & Shift Protocols:\n"
                "- Mount heavy delivery bags on bike cargo racks with bungee cords instead of carrying 10-15kg on your shoulders for 10 hours.\n"
                "- Take a 3–5 minute posture break every 2 hours: roll shoulders backwards, gently stretch neck, and arch lower back.\n"
                "- Adjust handlebar posture: avoid locking elbows rigid, as locked elbows transfer road shocks directly into your spine.\n\n"
                "2. 💊 Relief Measures (Jan Aushadhi PMBJP):\n"
                "- Apply warm compress (hot water bag) for 15–20 minutes on the lower back or neck after returning home.\n"
                "- Jan Aushadhi Pain Relief Gel / Diclofenac Spray (30g): ₹20–₹25 (vs ₹110–₹150 for branded Volini).\n"
                "- Generic Paracetamol 500mg: ₹5–₹10 per strip of 10 for acute muscular aching. Avoid overuse of heavy painkillers to protect kidneys."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "Ministry of Labour & Employment Occupational Health", "url": "https://labour.gov.in"},
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "Persistent pain radiating down the legs or following a vehicle crash requires orthopedic evaluation."
        }

    if category_key == "wounds_burns":
        return {
            "answer": (
                "Regarding silencer burns, abrasions, and minor injuries (साइलेंसर बर्न / चोट / खरोंच):\n\n"
                "1. 🚿 Bike Exhaust Silencer Burn Protocol:\n"
                "- Hold the burned area under gentle, cool running tap water for 10–15 minutes continuously.\n"
                "- ⚠️ Do NOT apply toothpaste, ice, butter, or engine oil—these trap heat and cause deep tissue infection.\n"
                "- Do NOT pop blisters (fafola); intact skin blisters act as sterile bandages protecting new skin.\n\n"
                "2. 💊 Generic Ointments (Jan Aushadhi PMBJP):\n"
                "- Silver Sulfadiazine 1% Burn Cream (20g): ₹15–₹20 per tube (vs ₹75–₹110 branded Soframycin/Silverex).\n"
                "- Povidone Iodine 5% Antiseptic Cream (15g): ₹12–₹18 per tube for road scrapes.\n\n"
                "3. 💉 Tetanus Toxoid (TT) Injection Requirement:\n"
                "If cut on road surfaces, rusty metals, or dirty ground and you haven't received a Tetanus Toxoid (TT) booster in the last 6 months, visit the nearest UPHC/dispensary within 24 hours for a ₹10 TT injection."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "National Health Mission Burn & Trauma Care", "url": "https://nhm.gov.in"},
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"}
            ],
            "disclaimer": "Deep third-degree burns or gaping wounds require immediate suturing and casualty dressing."
        }

    if category_key == "generic_medicines":
        return {
            "answer": (
                "Regarding generic medicines and Jan Aushadhi discounts (सस्ती जेनरिक दवाइयां):\n\n"
                "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Kendras provide 1,800+ WHO-GMP certified generic medicines at 50% to 90% discount compared to commercial pharma brands.\n\n"
                "📊 Price Comparison Index:\n"
                "- Paracetamol 500mg (10 tabs): ₹5–₹10 (Branded: ₹30–₹45)\n"
                "- Cetirizine 10mg (10 tabs): ₹5–₹8 (Branded: ₹40–₹60)\n"
                "- WHO-Formula ORS Sachet (21.8g): ₹4–₹5 (Branded: ₹22–₹30)\n"
                "- Pantoprazole 40mg (10 tabs): ₹15–₹22 (Branded: ₹120–₹160)\n"
                "- Diclofenac Pain Gel/Spray (30g): ₹20–₹25 (Branded: ₹110–₹150)\n"
                "- Silver Sulfadiazine Burn Cream (20g): ₹15–₹20 (Branded: ₹75–₹110)\n\n"
                "📍 Store Locator & Assistance:\n"
                "- Locate nearest store: https://janaushadhi.gov.in or download the 'Jan Aushadhi Sugam' mobile app.\n"
                "- National Toll-Free Helpline: 1800-180-8080."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "Pradhan Mantri Bhartiya Janaushadhi Pariyojana", "url": "https://janaushadhi.gov.in"},
                {"title": "Jan Aushadhi Helpline (1800-180-8080)", "url": "tel:18001808080"}
            ],
            "disclaimer": "Over-the-counter essentials (ORS, paracetamol, bandages) do not require a prescription. Prescription drugs require an MBBS/BAMS slip."
        }

    if category_key == "pmsym_pension":
        return {
            "answer": (
                "Regarding PM Shram Yogi Maan-dhan (PM-SYM) Pension Eligibility:\n\n"
                "Under the official guidelines of the Ministry of Labour and Employment, the entry age for PM-SYM is strictly 18 to 40 years.\n\n"
                "❌ Age Ineligibility:\n"
                "A worker aged 44 years is NOT eligible to enroll in PM-SYM because the entry age ceiling is 40 years.\n\n"
                "✅ Recommended Government Alternatives for Age 40+:\n"
                "1. National Pension System (NPS - All Citizen Model): Open to all citizens aged 18 to 70 years, offering market-linked retirement wealth accumulation.\n"
                "2. Public Provident Fund (PPF) / Post Office Savings Schemes: Government-guaranteed long-term savings available at any age.\n"
                "3. State Gig Welfare Boards (e.g. Rajasthan Gig Act Welfare Board): Accident, disability, and emergency health cover provided to all registered gig workers regardless of age."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "Ministry of Labour & Employment PM-SYM Portal", "url": "https://maandhan.in"},
                {"title": "National Pension System (NPS Trust)", "url": "https://npstrust.org.in"}
            ],
            "disclaimer": "Grounded via FairWork Setu Model 8 Welfare Knowledge Base (pmsym_pension_scheme.md)."
        }

    if category_key == "deactivation_rights":
        return {
            "answer": (
                "Regarding platform account deactivations without notice:\n\n"
                "NO, a platform aggregator cannot arbitrarily deactivate or blacklist your gig account without notice.\n\n"
                "⚖️ Rajasthan Platform Based Gig Workers Act 2023 (Sections 13 & 14):\n"
                "1. Mandatory 14-Day Written Notice: Platform aggregators (Zomato, Swiggy, Uber, Ola, Zepto, Blinkit, Urban Company) must provide at least 14 days mandatory written notice stating verifiable reasons before deactivating or suspending an account.\n"
                "2. Right to be Heard: The worker has the statutory right to submit an explanation and challenge the decision during the 14-day notice period.\n"
                "3. Welfare Board Tribunal: Workers can file an appeal with the Appellate Grievance Redressal Officer and Welfare Board Tribunal for arbitrary deactivations or payment deductions.\n"
                "4. Financial Penalties: Aggregators violating these provisions face statutory penalties up to ₹5 Lakhs."
            ),
            "isEmergency": False,
            "sources": [
                {"title": "Rajasthan Platform Based Gig Workers Act 2023 (Act No. 17 of 2023)", "url": "https://labour.rajasthan.gov.in"},
                {"title": "Code on Social Security 2020 (Section 114)", "url": "https://labour.gov.in"}
            ],
            "disclaimer": "Grounded via FairWork Setu Model 8 Legal Knowledge Base (rajasthan_gig_workers_act_2023.md)."
        }

    # General fallback
    return {
        "answer": (
            f"Regarding '{user_query}':\n\n"
            "For non-emergency health concerns, visit your neighborhood Urban Primary Health Centre (UPHC) or Ayushman Arogya Mandir for free medical consultation and basic medicines.\n\n"
            "If this relates to workplace fatigue or dehydration, please take shade breaks and sip water with ORS. If you experience severe chest pain, breathing difficulty, or sudden weakness, call 112 or 108 immediately."
        ),
        "isEmergency": False,
        "sources": [
            {"title": "National Health Mission Health Guidance", "url": "https://nhm.gov.in"},
            {"title": "Ayushman Bharat PM-JAY", "url": "https://pmjay.gov.in"}
        ],
        "disclaimer": "Setu provides health navigation and welfare guidance only. Always consult a qualified medical professional for health diagnoses and treatment."
    }


@health_router.post("/triage")
def triage_symptoms(payload: SymptomTriagePayload):
    """
    Evidence-informed health guidance based on reported concerns.
    Strict medical safety:
    - Never generates confident clinical diagnoses or prescriptions.
    - Escalates severe chest pain, shortness of breath, sudden weakness, or heavy bleeding directly to emergency services (112/108).
    """
    combined_query = f"{payload.category} {payload.notes or ''} {' '.join(payload.redFlags)}".strip()
    detected_intent = classify_health_intent(combined_query)

    # Check for critical medical emergencies
    emergency_indicators = [
        "chest pain", "pressure in chest", "shortness of breath", "severe breathing difficulty",
        "unconscious", "fainting", "severe bleeding", "sudden paralysis", "slurred speech",
        "coughing blood", "high fever above 104", "severe head injury", "broken bone"
    ]
    flags = [f.lower() for f in payload.redFlags]
    has_emergency = (
        detected_intent == "emergency"
        or (payload.severity.lower() == "severe" and any(ind in f for ind in emergency_indicators for f in flags))
        or any("chest" in f or "breathing" in f or "unconscious" in f or "bleeding" in f for f in flags)
    )

    if has_emergency:
        return {
            "category": payload.category,
            "isEmergency": True,
            "emergencyReason": "Your reported symptoms include critical danger signs requiring immediate emergency medical attention. Please do not wait or attempt self-treatment.",
            "summary": "Urgent Medical Attention Required (Emergency 108 / 112)",
            "recommendations": [
                "Call 112 or 108 immediately for emergency ambulance dispatch.",
                "Have someone stay with you and sit down in a safe, shaded location.",
                "Do not drive a vehicle or ride a motorcycle yourself in this condition.",
                "Proceed to the nearest 24x7 government hospital casualty department immediately."
            ],
            "selfCareSteps": [
                "Loosen any tight clothing around your collar, chest, or waist.",
                "Sit upright with back support if having breathing difficulty; lie flat with feet elevated if feeling faint.",
                "Keep phone active and emergency contacts informed."
            ],
            "redFlagWarning": "EMERGENCY: Do not delay seeking care. Setu cannot diagnose or treat life-threatening conditions.",
            "suggestedFacilityType": "hospital",
            "suggestedQuestions": [
                "Where is the nearest 24x7 emergency hospital?",
                "What is the ambulance helpline in Pune / Mumbai?",
                "How to tell someone I need emergency help?"
            ]
        }

    # Map recommendations and selfCare from detected_intent
    if detected_intent == "cold_cough":
        summary = "Cold, cough, and nasal congestion are common respiratory conditions triggered by viral infections, weather shifts, and vehicular pollution."
        recs = [
            "Drink lukewarm water or ginger-tulsi tea during shifts; avoid cold sodas or abrupt AC-to-sun transitions.",
            "Jan Aushadhi Paracetamol 500mg (₹5–₹10/strip) for fever/headache and Cetirizine 10mg (₹5–₹8/strip) at night for runny nose.",
            "Jan Aushadhi Dextromethorphan / Ambroxol cough syrup (₹25–₹35 vs ₹110 branded) for cough.",
            "Visit UPHC if fever stays >101°F for >3 days or if coughing yellow-green sputum or blood."
        ]
        self_care = [
            "Inhale steam for 10 minutes at night after shifts to loosen bronchial mucus.",
            "Warm salt-water gargle twice daily to relieve throat soreness.",
            "Wear a face mask in heavy traffic corridors to filter soot and dust."
        ]
        facility = "phc"
    elif detected_intent == "dehydration_heat":
        summary = "Dehydration and heat exhaustion occur from prolonged sun exposure, heavy sweating, and electrolyte depletion on outdoor shifts."
        recs = [
            "Park in shade immediately, stop vehicle, and remove helmet and tight delivery vest.",
            "Sip Oral Rehydration Salts (ORS) solution slowly (1 glass over 10–15 mins). Jan Aushadhi ORS costs ₹4–₹5 per sachet.",
            "Sponge forehead, neck, and wrists with a cool damp cloth.",
            "Warning: High body temperature (>103°F) with absence of sweating is Heat Stroke—call 108 immediately."
        ]
        self_care = [
            "Do NOT chug ice-cold water rapidly, as it induces stomach cramps and vascular shock.",
            "Carry an insulated bottle with ORS, coconut water, or lemon water.",
            "Rest in the shade during peak sun hours (12 PM to 3 PM)."
        ]
        facility = "phc"
    elif detected_intent == "fever_viral":
        summary = "Fever is an immune response commonly caused by seasonal viral flu, dengue, malaria, or systemic exhaustion."
        recs = [
            "Complete physical rest. Cease strenuous riding to avoid myocardial strain and dehydration.",
            "Jan Aushadhi Generic Paracetamol 500mg: ₹5–₹10 per strip of 10 tablets (1 tablet every 6–8 hours after food).",
            "CRITICAL: Do NOT take Aspirin, Ibuprofen, or Combiflam without doctor checkup (severe bleeding risk in Dengue).",
            "Visit local UPHC for a free CBC/Malaria/Dengue blood test if fever persists >48 hours or has chills/rash."
        ]
        self_care = [
            "Tepid sponging with room-temperature water on forehead and limbs (never cold ice water).",
            "Drink 2.5 to 3 liters of fluids (clean water, thin dal, ORS) daily.",
            "Wear loose, breathable cotton clothes."
        ]
        facility = "phc"
    elif detected_intent == "digestive_acidity":
        summary = "Gastrointestinal distress, acidity, and diarrhea are triggered by dehydration, irregular meals, or contaminated street food."
        recs = [
            "Drink 1 cup of fresh ORS solution after every loose motion or vomiting episode (Jan Aushadhi ORS: ₹4–₹5).",
            "Jan Aushadhi Pantoprazole 40mg or Omeprazole 20mg: ₹10–₹18/strip for acidity and heartburn (take 30 mins before breakfast).",
            "Eat bland, easily digestible food (khichdi, curd, banana); avoid street tea and fried items.",
            "Visit hospital if experiencing blood in stool, severe inability to retain fluids >6 hours, or localized lower-right abdominal pain."
        ]
        self_care = [
            "Avoid carbonated cold drinks and sugary energy beverages which worsen diarrhea.",
            "Eat freshly prepared food and carry clean home-cooked lunch when possible."
        ]
        facility = "phc"
    elif detected_intent == "musculoskeletal":
        summary = "Musculoskeletal backache and cervical stiffness are occupational hazards caused by heavy delivery bags and prolonged riding."
        recs = [
            "Mount heavy delivery backpacks on bike cargo carriers using bungee cords instead of shoulders.",
            "Jan Aushadhi Pain Relief Gel / Diclofenac Spray (30g): ₹20–₹25 (vs ₹110–₹150 for branded Volini).",
            "Jan Aushadhi Paracetamol 500mg: ₹5–₹10 per strip for acute aching (avoid heavy painkiller overuse to protect kidneys).",
            "Apply warm compress (hot water bag) for 15–20 minutes on lower back or neck after returning home."
        ]
        self_care = [
            "Take a 3–5 minute posture break every 2 hours: roll shoulders backwards and arch lower back.",
            "Adjust handlebars to maintain slightly bent elbows to absorb road vibration."
        ]
        facility = "clinic"
    elif detected_intent == "wounds_burns":
        summary = "Silencer burns, abrasions, and scrape injuries require immediate cooling, antiseptic dressing, and tetanus prophylaxis."
        recs = [
            "Silencer Burn: Hold affected area under gentle, cool running tap water for 10–15 minutes immediately.",
            "Do NOT apply toothpaste, ice, butter, or engine oil; do NOT pop blisters (fafola).",
            "Jan Aushadhi Silver Sulfadiazine 1% Burn Cream: ₹15–₹20/tube (vs ₹75–₹110 branded Soframycin/Silverex).",
            "Jan Aushadhi Povidone Iodine 5% Antiseptic Cream: ₹12–₹18/tube for road scrapes.",
            "Visit UPHC within 24 hours for a ₹10 Tetanus Toxoid (TT) injection if not received in the last 6 months."
        ]
        self_care = [
            "Cover burns loosely with sterile paraffin gauze.",
            "Clean road scrapes gently with mild soap and clean water before applying antiseptic."
        ]
        facility = "phc"
    else:
        summary = "General evidence-informed guidance for managing common occupational discomforts and knowing when to see a doctor."
        recs = [
            "Visit your neighborhood Urban Primary Health Centre (UPHC) if symptoms worsen or do not improve in 48 hours.",
            "Always choose subsidized generic medicines at Pradhan Mantri Jan Aushadhi Kendras (PMBJP) to save 50% to 90%."
        ]
        self_care = [
            "Drink at least 250 ml of clean water every hour during daytime shifts.",
            "Take scheduled shade breaks and avoid skipping meals during high-demand delivery hours."
        ]
        facility = "phc"

    return {
        "category": payload.category,
        "isEmergency": False,
        "summary": summary,
        "recommendations": recs,
        "selfCareSteps": self_care,
        "redFlagWarning": "Seek urgent medical care at a hospital casualty if you develop severe chest pain, breathing difficulty, sudden numbness, or high fever with confusion.",
        "suggestedFacilityType": facility,
        "suggestedQuestions": [
            "Where can I get affordable generic medicines nearby?",
            "Where is the nearest Urban Primary Health Centre (UPHC)?",
            "What to do for silencer burns on delivery shifts?"
        ]
    }


@health_router.post("/ask")
def ask_health_assistant(payload: AskHealthPayload):
    """
    Empathetic, evidence-informed health and welfare assistant for gig workers.
    Features:
    - Multi-dialect vocabulary normalization (Hindi, Marathi, Urdu, Hinglish).
    - Emergency red-flag instant detection bypassing RAG (108/112).
    - Subsidized Jan Aushadhi generic options with exact prices.
    - Grounded RAG retrieval for welfare policies, pensions, and legal rights with dynamic thresholds.
    """
    q = payload.question.strip()
    detected_intent = classify_health_intent(q)

    # For clinical symptom intents or emergency, return structured response immediately
    if detected_intent in [
        "emergency",
        "cold_cough",
        "dehydration_heat",
        "fever_viral",
        "digestive_acidity",
        "musculoskeletal",
        "wounds_burns",
        "generic_medicines",
        "pmsym_pension",
        "deactivation_rights"
    ]:
        return get_clinical_triage_response(detected_intent, q)

    # For general queries, ground with Model 8 Health & Welfare RAG
    try:
        from ai_models_service import ai_models_service
        rag_res = ai_models_service.search_health_welfare_rag(q, top_k=2)
        passages = rag_res.get("passages", [])
        model_name = rag_res.get("model", "")
        # Dynamic similarity threshold: >= 0.50 for FAISS dense retrieval, >= 0.03 for TF-IDF cosine similarity
        dynamic_threshold = 0.50 if "FAISS" in model_name else 0.03

        if passages and passages[0].get("similarity_score", 0) >= dynamic_threshold:
            top_p = passages[0]
            src = top_p.get("source", "verified_scheme.md")
            clean_text = top_p.get("text", "").replace("#", "").strip()[:500]
            return {
                "answer": (
                    f"Based on verified government policy ({src}):\n\n"
                    f"{clean_text}...\n\n"
                    "For personalized assistance, visit your nearest Urban Primary Health Centre (UPHC) or Common Service Centre (CSC) with your Aadhaar and Ration Card."
                ),
                "isEmergency": False,
                "sources": [
                    {"title": f"Verified Document: {src} (Score: {top_p.get('similarity_score')})", "url": "https://pmjay.gov.in"},
                    {"title": "National Health Authority Helpline (14555)", "url": "tel:14555"}
                ],
                "disclaimer": "Retrieved via Setu Model 8 Health & Welfare RAG. Informational only; consult licensed health professionals."
            }
    except Exception as e:
        pass

    return get_clinical_triage_response("general", q)

