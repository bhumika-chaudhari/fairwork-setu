import type {
  HealthFacility,
  HealthScheme,
  HealthSafetyTip,
  SymptomAssessment,
  SymptomGuidance,
  SavedHealthItem,
} from '../types/health';
import {
  supabase,
  isSupabaseConfigured,
  getActiveUser,
  ensureUserProfile,
} from '../lib/supabaseClient';

const BASE_URL = (
  import.meta.env.VITE_ML_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : '')
).replace(/\/$/, '');

const API_BASE = `${BASE_URL}/health-service`;


// -------------------------------------------------------------------------
// LOCAL FALLBACK DATA (Guarantees 100% offline & demo reliability)
// -------------------------------------------------------------------------

const FALLBACK_FACILITIES: HealthFacility[] = [
  {
    id: 'fac-sassoon-pune',
    name: 'Sassoon General Hospital & B.J. Govt Medical College',
    type: 'hospital',
    categoryLabel: 'Government Teaching Hospital',
    address: 'Station Road, Near Pune Railway Station',
    locality: 'Station / Camp',
    city: 'Pune',
    distance: '2.4 km',
    phone: '020-26128000',
    timings: 'Open 24x7 (Emergency & Casualty)',
    services: [
      'Emergency 24x7',
      'Casualty & Trauma Care',
      'Free OPD',
      'Ayushman PM-JAY Empanelled',
      'Blood Bank',
      'Free Essential Medicines',
    ],
    isGovernment: true,
    isVerified: true,
    is24x7: true,
    emergencyServices: true,
    lat: 18.5283,
    lng: 73.8743,
    directionsUrl: 'https://www.google.com/maps/search/?api=1&query=Sassoon+General+Hospital+Pune',
  },
  {
    id: 'fac-aundh-civil-pune',
    name: 'Aundh District Civil Hospital',
    type: 'hospital',
    categoryLabel: 'District Civil Hospital',
    address: 'Chest Hospital Road, Near Parihar Chowk, Aundh',
    locality: 'Aundh',
    city: 'Pune',
    distance: '4.1 km',
    phone: '020-27298155',
    timings: 'Open 24x7 (Emergency)',
    services: [
      '24x7 Emergency',
      'General Medicine OPD',
      'Orthopedic Clinic',
      'MJPJAY & PM-JAY Cashless',
      'Free Diagnostic Laboratory',
      'Maternity & Child Ward',
    ],
    isGovernment: true,
    isVerified: true,
    is24x7: true,
    emergencyServices: true,
    lat: 18.5621,
    lng: 73.8078,
    directionsUrl: 'https://www.google.com/maps/search/?api=1&query=Aundh+District+Hospital+Pune',
  },
  {
    id: 'fac-kothrud-phc',
    name: 'Kothrud Urban Primary Health Centre (UPHC)',
    type: 'phc',
    categoryLabel: 'Urban Primary Health Centre (PMC)',
    address: 'Near Shivaji Statue, Paud Road, Kothrud',
    locality: 'Kothrud',
    city: 'Pune',
    distance: '1.2 km',
    phone: '020-25381240',
    timings: '08:30 AM - 04:30 PM (Mon-Sat)',
    services: [
      'General Consultation',
      'Free Fever & Cold Medicines',
      'Blood Sugar & BP Screening',
      'Maternal & Child Immunization',
      'DOTS TB Screening',
      'Referral to Civil Hospital',
    ],
    isGovernment: true,
    isVerified: true,
    is24x7: false,
    emergencyServices: false,
    lat: 18.5074,
    lng: 73.8077,
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=Urban+Health+Centre+Kothrud+Pune',
  },
  {
    id: 'fac-arogya-mandir-shivaji',
    name: 'Ayushman Arogya Mandir (Health & Wellness Centre)',
    type: 'clinic',
    categoryLabel: 'Govt Health & Wellness Centre',
    address: 'Municipal Dispensary, Ghole Road, Shivajinagar',
    locality: 'Shivajinagar',
    city: 'Pune',
    distance: '2.8 km',
    phone: '1800-111-565',
    timings: '09:00 AM - 05:00 PM',
    services: [
      'Preventive Health Checkup',
      'Free Non-Communicable Disease Screening',
      'Tele-consultation (e-Sanjeevani)',
      'Free Essential Generic Drugs',
      'Wellness & Physiotherapy Guidance',
    ],
    isGovernment: true,
    isVerified: true,
    is24x7: false,
    emergencyServices: false,
    lat: 18.5314,
    lng: 73.8446,
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=Ayushman+Arogya+Mandir+Shivajinagar+Pune',
  },
  {
    id: 'fac-jan-aushadhi-kothrud',
    name: 'Pradhan Mantri Jan Aushadhi Kendra',
    type: 'pharmacy',
    categoryLabel: 'Government Generic Pharmacy (PMBJP)',
    address: 'Shop 4, Near Kothrud Bus Stand, Karve Road',
    locality: 'Kothrud',
    city: 'Pune',
    distance: '1.5 km',
    phone: '1800-180-8080',
    timings: '09:00 AM - 09:00 PM (Daily)',
    services: [
      '50% to 90% Discounted Generic Medicines',
      'Affordable Pain Relievers & Paracetamol',
      'Oral Rehydration Salts (ORS)',
      'First Aid Kits & Bandages',
      'Blood Pressure & Glucometer Strips',
    ],
    isGovernment: true,
    isVerified: true,
    is24x7: false,
    emergencyServices: false,
    lat: 18.4988,
    lng: 73.8189,
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=Jan+Aushadhi+Kendra+Kothrud+Pune',
  },
  {
    id: 'fac-kem-mumbai',
    name: 'KEM Hospital & Seth G.S. Medical College',
    type: 'hospital',
    categoryLabel: 'Municipal Corporation Teaching Hospital',
    address: 'Acharya Donde Marg, Parel',
    locality: 'Parel',
    city: 'Mumbai',
    distance: '2.1 km',
    phone: '022-24107000',
    timings: 'Open 24x7 (Casualty & Trauma)',
    services: [
      '24x7 Trauma & Critical Care',
      'Free & Subsidized Emergency Surgery',
      'PM-JAY & MJPJAY Helpdesk',
      'Cardiac & Stroke Rapid Response',
      'In-house Blood Bank',
    ],
    isGovernment: true,
    isVerified: true,
    is24x7: true,
    emergencyServices: true,
    lat: 19.0024,
    lng: 72.8427,
    directionsUrl: 'https://www.google.com/maps/search/?api=1&query=KEM+Hospital+Parel+Mumbai',
  },
  {
    id: 'fac-medplus-247-pune',
    name: 'MedPlus 24x7 Pharmacy & First Aid',
    type: 'pharmacy',
    categoryLabel: 'Licensed 24x7 Pharmacy',
    address: 'Plot 12, Paud Road, Opposite Kinara Hotel',
    locality: 'Kothrud',
    city: 'Pune',
    distance: '0.9 km',
    phone: '020-25458920',
    timings: 'Open 24x7',
    services: [
      '24x7 Night Medicine Dispensing',
      'Emergency Inhalers & Antihistamines',
      'Burn Ointments & Bandages',
      'Instant Digital Thermometers',
      'Home Delivery in 2 km',
    ],
    isGovernment: false,
    isVerified: true,
    is24x7: true,
    emergencyServices: false,
    lat: 18.5034,
    lng: 73.8122,
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=MedPlus+Pharmacy+Paud+Road+Kothrud',
  },
];

const FALLBACK_SCHEMES: HealthScheme[] = [
  {
    id: 'sch-pmjay',
    name: 'Ayushman Bharat PM-JAY',
    hindiName: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना',
    shortDescription:
      "India's flagship cashless public health assurance scheme covering hospitalization costs.",
    targetBeneficiaries:
      'Economically vulnerable families, gig workers, and SECC eligible households.',
    benefits: [
      'Cashless hospital treatment up to ₹5,00,000 per family per year',
      'Covers 1,900+ medical and surgical procedures',
      'Includes pre-hospitalization (3 days) and post-hospitalization (15 days) medication',
      'Accepted across 28,000+ public and private empanelled hospitals nationwide',
    ],
    coverageAmount: '₹5,00,000 / year',
    eligibilityCriteria: [
      'Household listed under SECC 2011 or NFSA ration card',
      'Active Ayushman Card / Golden Card',
      'No formal employer health insurance',
    ],
    requiredDocuments: [
      'Aadhaar Card with linked phone',
      'Ration Card (Orange, Yellow, or Antyodaya)',
      'Active mobile number',
    ],
    officialUrl: 'https://pmjay.gov.in',
    helplinePhone: '14555',
    lastVerified: '2026-10-01',
    category: 'insurance',
  },
  {
    id: 'sch-mjpjay',
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    hindiName: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना (महाराष्ट्र)',
    shortDescription:
      'Maharashtra State flagship cashless health insurance for all state residents holding valid ration cards.',
    targetBeneficiaries:
      'All families holding Yellow, Orange, White Ration Cards or Antyodaya cards in Maharashtra.',
    benefits: [
      'Cashless coverage up to ₹5,00,000 per family per year across Maharashtra',
      'Covers 1,356 medical therapies, surgeries, and specialized ICU treatments',
      'Dedicated Arogyamitra at every empanelled hospital to help workers without paperwork friction',
    ],
    coverageAmount: '₹5,00,000 / year',
    eligibilityCriteria: [
      'Permanent resident of Maharashtra state',
      'Possession of any valid Ration Card (Yellow, Orange, or White) or Annapurna card',
    ],
    requiredDocuments: ['Ration Card copy', 'Aadhaar Card / Voter ID'],
    officialUrl: 'https://www.jeevandayee.gov.in',
    helplinePhone: '1800-120-8040',
    lastVerified: '2026-10-05',
    category: 'insurance',
  },
  {
    id: 'sch-arogya-mandir',
    name: 'Ayushman Arogya Mandir (Health & Wellness Centres)',
    hindiName: 'आयुष्मान आरोग्य मंदिर',
    shortDescription:
      'Neighborhood primary healthcare centres providing free consultations, medicines, and screening tests.',
    targetBeneficiaries: 'Every citizen, informal worker, and local neighborhood resident.',
    benefits: [
      '100% Free primary doctor consultation and maternal care',
      'Free essential generic medications for fever, cold, blood pressure, and diabetes',
      'Free diagnostic blood & urine lab tests (14+ basic tests)',
      'Tele-consultation with specialist doctors via e-Sanjeevani',
    ],
    coverageAmount: '100% Free at Point of Care',
    eligibilityCriteria: [
      'Open to all citizens without any income or documentation barrier',
    ],
    requiredDocuments: [
      'Any photo ID or ABHA ID (optional, but speeds up digital registration)',
    ],
    officialUrl: 'https://ab-hwc.nhp.gov.in',
    helplinePhone: '1800-111-565',
    lastVerified: '2026-09-28',
    category: 'wellness',
  },
  {
    id: 'sch-pmsby-eshram',
    name: 'e-Shram Accidental Death & Disability Cover (PMSBY)',
    hindiName: 'ई-श्रम दुर्घटना बीमा योजना',
    shortDescription:
      'Government accident coverage for registered gig workers, platform delivery partners, and daily-wage labourers.',
    targetBeneficiaries:
      'Unorganised and gig workers between 18 and 59 years registered on e-Shram.',
    benefits: [
      '₹2,00,000 financial support in case of accidental death while working or traveling',
      '₹2,00,000 for total and permanent disability (loss of both eyes or both limbs)',
      '₹1,00,000 for partial permanent disability (loss of one eye or one limb)',
    ],
    coverageAmount: '₹2,00,000 accidental cover',
    eligibilityCriteria: [
      'Registered on e-Shram portal with valid UAN (Universal Account Number)',
      'Age between 18 and 59 years',
      'Not an income tax payer and not covered under EPFO/ESIC',
    ],
    requiredDocuments: [
      'e-Shram Card (UAN Number)',
      'Aadhaar Card',
      'Bank passbook copy for direct DBT transfer',
    ],
    officialUrl: 'https://eshram.gov.in',
    helplinePhone: '14434',
    lastVerified: '2026-10-10',
    category: 'accident',
  },
  {
    id: 'sch-pmmbjp',
    name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
    hindiName: 'प्रधानमंत्री भारतीय जनऔषधि परियोजना',
    shortDescription:
      'Dedicated government pharmacy network providing high-quality generic medicines at 50% to 90% lower prices.',
    targetBeneficiaries:
      'All citizens, especially workers managing chronic diabetes, BP, or acute health expenses.',
    benefits: [
      'Quality generic medicines available at 50% to 90% cheaper than commercial branded equivalents',
      'Over 1,800 medicines and 290 surgical consumables available',
      'Quality tested in NABL-accredited laboratories for guaranteed potency',
    ],
    coverageAmount: 'Up to 90% savings on prescriptions',
    eligibilityCriteria: [
      'Open to all walk-in patients with a valid doctor prescription or for over-the-counter essentials',
    ],
    requiredDocuments: [
      'Doctor prescription for prescription-only medicines (none required for OTC first aid/ORS)',
    ],
    officialUrl: 'https://janaushadhi.gov.in',
    helplinePhone: '1800-180-8080',
    lastVerified: '2026-10-02',
    category: 'medicine',
  },
  {
    id: 'sch-pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    hindiName: 'प्रधानमंत्री मातृ वंदना योजना',
    shortDescription:
      'Maternity benefit scheme providing direct cash assistance to pregnant and lactating female informal workers.',
    targetBeneficiaries:
      'Pregnant women and lactating mothers working in the informal sector.',
    benefits: [
      '₹5,00,000 cash incentive in direct bank installments for the first child',
      'Additional ₹6,000 incentive if the second child is a girl child',
      'Compensates for wage loss during pregnancy and encourages institutional hospital delivery',
    ],
    coverageAmount: '₹5,000 - ₹6,000 DBT',
    eligibilityCriteria: [
      'Pregnant woman aged 19 years or above',
      'Must register pregnancy at an Anganwadi Centre or Government Health Centre within 570 days',
    ],
    requiredDocuments: [
      'Mother-Child Protection (MCP) card',
      'Aadhaar card of mother and husband',
      'Bank passbook of the mother',
    ],
    officialUrl: 'https://pmmvy.wcd.gov.in',
    helplinePhone: '1098 / 011-23382393',
    lastVerified: '2026-09-15',
    category: 'maternity',
  },
];

const FALLBACK_TIPS: HealthSafetyTip[] = [
  {
    id: 'tip-heat-hydration',
    title: 'Beat the Heat: Hydration on Two Wheels',
    category: 'delivery',
    categoryLabel: 'Delivery & Gig Couriers',
    summary:
      'Outdoor heat can cause sudden dizzy spells, slow reaction times, and road accidents. Preventive hydration is vital.',
    tips: [
      'Drink at least 250 ml of water every 45 minutes, even before you feel thirsty.',
      'Carry an ORS packet (Electral or Jan Aushadhi ORS ₹4) and mix in water if feeling fatigued or sweating heavily.',
      'Park under tree shade or building awnings during order wait times rather than sitting directly under the afternoon sun.',
      'Wear a lightweight, light-colored cotton scarf under your helmet to absorb sweat and protect your neck from direct sunburn.',
    ],
    helpfulCount: 428,
  },
  {
    id: 'tip-lifting-back',
    title: 'Safe Lifting Technique for Heavy Loads',
    category: 'construction',
    categoryLabel: 'Construction & Warehouse Helpers',
    summary:
      'Prevent permanent lumbar spine injury by lifting with your thighs and leg muscles, never bending from the waist.',
    tips: [
      'Bend your knees and squat down close to the parcel or cement bag — keep your back straight.',
      'Hold the load firmly against your chest or core before straightening your legs to stand up.',
      'Never twist your torso while carrying a heavy weight; pivot your feet instead.',
      'If a bag weighs more than 25 kg, always ask a co-worker for a team lift.',
    ],
    helpfulCount: 312,
  },
  {
    id: 'tip-driving-stretches',
    title: 'Prevent Back Stiffness During Long Driving Shifts',
    category: 'driving',
    categoryLabel: 'Auto, Cab & Truck Drivers',
    summary:
      'Prolonged sitting causes poor blood circulation, lower back compression, and highway drowsiness.',
    tips: [
      'Take a 5-minute movement break every 2 hours: step out of the cab, stretch your hamstrings, and do gentle shoulder rolls.',
      'Adjust your seat angle to 100–110 degrees rather than slouching forward or leaning too far back.',
      'Place a small rolled towel or cushion behind your lower back to maintain natural lumbar curvature.',
      'Wash your face with cold water at traffic hubs to stay alert and avoid drowsy driving.',
    ],
    helpfulCount: 279,
  },
  {
    id: 'tip-vendor-hygiene',
    title: 'Safe Food Handling & Heat Protection for Street Vendors',
    category: 'vendor',
    categoryLabel: 'Street Vendors & Food Stalls',
    summary:
      'Protects your health, prevents food spoilage in hot weather, and builds customer trust.',
    tips: [
      'Wash hands thoroughly with soap or keep alcohol sanitizer handy between handling currency and food items.',
      'Keep cut vegetables, dairy, and cooked food strictly covered with clean mesh or stainless steel lids to prevent fly infestation.',
      'Set up a sunshade or umbrella over your cart to keep your working space 4–5 degrees cooler.',
      'Wear comfortable rubber-soled slippers or shoes to prevent leg swelling from standing for 8+ hours.',
    ],
    helpfulCount: 195,
  },
];

// -------------------------------------------------------------------------
// SERVICE API METHODS
// -------------------------------------------------------------------------

export async function fetchHealthFacilities(params?: {
  type?: string;
  search?: string;
  locality?: string;
  city?: string;
}): Promise<HealthFacility[]> {
  try {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.locality && params.locality !== 'all') query.set('locality', params.locality);
    if (params?.city && params.city !== 'all') query.set('city', params.city);

    const res = await fetch(`${API_BASE}/facilities?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Local filter
  let results = [...FALLBACK_FACILITIES];
  if (params?.type && params.type !== 'all') {
    results = results.filter((f) => f.type === params.type);
  }
  if (params?.city && params.city !== 'all') {
    results = results.filter((f) => f.city.toLowerCase() === params.city?.toLowerCase());
  }
  if (params?.locality && params.locality !== 'all') {
    const loc = params.locality.toLowerCase();
    results = results.filter(
      (f) => f.locality.toLowerCase().includes(loc) || f.address.toLowerCase().includes(loc)
    );
  }
  if (params?.search) {
    const q = params.search.toLowerCase().trim();
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.categoryLabel.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.services.some((s) => s.toLowerCase().includes(q))
    );
  }
  return results;
}

export async function fetchHealthSchemes(category?: string): Promise<HealthScheme[]> {
  try {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE}/schemes${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  if (category && category !== 'all') {
    return FALLBACK_SCHEMES.filter((s) => s.category === category);
  }
  return FALLBACK_SCHEMES;
}

export async function fetchSafetyTips(category?: string): Promise<HealthSafetyTip[]> {
  try {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE}/safety-tips${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  if (category && category !== 'all') {
    return FALLBACK_TIPS.filter((t) => t.category === category);
  }
  return FALLBACK_TIPS;
}

export async function getSymptomGuidance(
  assessment: SymptomAssessment
): Promise<SymptomGuidance> {
  try {
    const res = await fetch(`${API_BASE}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Deterministic local triage fallback
  const isSevere = assessment.severity === 'severe';
  const hasChestOrBreath = assessment.redFlags.some(
    (f) =>
      f.toLowerCase().includes('chest') ||
      f.toLowerCase().includes('breath') ||
      f.toLowerCase().includes('bleed') ||
      f.toLowerCase().includes('unconscious')
  );

  if (isSevere && hasChestOrBreath) {
    return {
      category: assessment.category,
      isEmergency: true,
      emergencyReason:
        'Your reported symptoms include potential danger signs requiring immediate emergency medical attention. Please do not wait or attempt self-treatment.',
      summary: 'Urgent Medical Attention Required',
      recommendations: [
        'Call 112 or 108 immediately for emergency ambulance dispatch.',
        'Sit down in a safe, shaded location and have someone stay with you.',
        'Do not operate a motorcycle or drive yourself in this condition.',
        'Head to the nearest 24x7 government hospital casualty department immediately.',
      ],
      selfCareSteps: [
        'Loosen any tight clothing around your collar or waist.',
        'Sit upright with back support if having breathing difficulty.',
        'Keep phone active and emergency contact informed.',
      ],
      redFlagWarning:
        'EMERGENCY: Do not delay seeking care. Setu cannot diagnose or treat life-threatening conditions.',
      suggestedFacilityType: 'hospital',
      suggestedQuestions: [
        'Where is the nearest 24x7 emergency hospital?',
        'What is the ambulance helpline number?',
      ],
    };
  }

  return {
    category: assessment.category,
    isEmergency: false,
    summary:
      'General evidence-informed guidance for managing common discomforts and knowing when to see a doctor.',
    recommendations: [
      'Rest in a cool, well-ventilated space and stay adequately hydrated with clean water and ORS.',
      'Visit your neighborhood Primary Health Centre (PHC) if symptoms persist beyond 48 hours.',
      'Avoid unprescribed antibiotics; use generic paracetamol or ORS from Jan Aushadhi Kendras if needed.',
      'Have a doctor or licensed healthcare worker evaluate persistent or worsening conditions.',
    ],
    selfCareSteps: [
      'Drink at least 250 ml of water every hour during daytime shifts.',
      'Wear loose, breathable cotton clothes and avoid skipping meals.',
      'Take regular shade breaks away from direct afternoon sun and traffic fumes.',
    ],
    redFlagWarning:
      'Visit a hospital casualty immediately if you experience severe chest pain, breathing difficulty, sudden weakness, or high fever with confusion.',
    suggestedFacilityType: 'phc',
    suggestedQuestions: [
      'Where is the nearest primary health centre?',
      'How to get affordable generic medicines nearby?',
      'Can I take ORS during delivery shifts?',
    ],
  };
}

export async function askHealthAssistant(
  question: string,
  language = 'en'
): Promise<{
  answer: string;
  isEmergency?: boolean;
  sources?: { title: string; url: string }[];
  disclaimer: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Offline deterministic fallback
  const q = question.toLowerCase();
  if (
    q.includes('chest') ||
    q.includes('breathe') ||
    q.includes('heart') ||
    q.includes('unconscious') ||
    q.includes('bleed')
  ) {
    return {
      answer:
        '⚠️ WARNING: This sounds like a potential medical emergency. Please call 112 (National Emergency) or 108 (Ambulance) immediately and proceed to the nearest hospital casualty.',
      isEmergency: true,
      sources: [
        { title: 'National Emergency Service (112)', url: 'tel:112' },
        { title: 'Ambulance Helpline (108)', url: 'tel:108' },
      ],
      disclaimer:
        'Setu provides livelihood health information and navigation only. It is not a diagnostic tool.',
    };
  }

  return {
    answer: `Regarding "${question}": For non-emergency symptoms, visit your local Primary Health Centre (PHC) or Ayushman Arogya Mandir for free consultation and medicines. Remember to stay hydrated with ORS during work shifts. If pain or dizziness worsens, consult a qualified physician promptly.`,
    isEmergency: false,
    sources: [
      { title: 'National Health Mission (NHM)', url: 'https://nhm.gov.in' },
      { title: 'Ayushman Bharat PM-JAY', url: 'https://pmjay.gov.in' },
    ],
    disclaimer:
      'Setu provides health navigation only. Always consult a qualified medical professional for diagnosis.',
  };
}

// -------------------------------------------------------------------------
// PRIVACY-PRESERVING SAVED HEALTH ITEMS (Local to device, clearable)
// -------------------------------------------------------------------------

const SAVED_ITEMS_KEY = 'setu_saved_health_items_v1';

export function getSavedHealthItems(): SavedHealthItem[] {
  try {
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function syncHealthItemsWithCloud(): Promise<SavedHealthItem[]> {
  const local = getSavedHealthItems();
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        const { data: rows, error } = await supabase
          .from('saved_health_items')
          .select('*')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false });

        if (!error && rows && rows.length > 0) {
          const mapped: SavedHealthItem[] = rows.map((r: any) => ({
            id: r.item_id,
            type: r.item_type,
            title: r.title,
            notes: r.notes || undefined,
            savedAt: r.saved_at || new Date().toISOString(),
          }));
          localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[HealthService] Supabase sync health items notice:', err);
    }
  }
  return local;
}

export function saveHealthItem(item: Omit<SavedHealthItem, 'savedAt'>): SavedHealthItem[] {
  try {
    const current = getSavedHealthItems();
    let updated = current;
    if (!current.some((i) => i.id === item.id)) {
      updated = [
        { ...item, savedAt: new Date().toISOString() },
        ...current,
      ];
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(updated));
    }

    // Direct Supabase PostgreSQL upsert when authenticated
    if (supabase && isSupabaseConfigured) {
      getActiveUser().then(async (user) => {
        if (user) {
          try {
            await ensureUserProfile(user);
            await supabase.from('saved_health_items').upsert(
              {
                user_id: user.id,
                item_id: item.id,
                item_type: item.type,
                title: item.title,
                notes: item.notes || null,
                saved_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,item_id' }
            );
          } catch (err) {
            console.warn('[HealthService] Supabase save health item notice:', err);
          }
        }
      });
    }

    return updated;
  } catch {
    return [];
  }
}

export function removeSavedHealthItem(id: string): SavedHealthItem[] {
  try {
    const current = getSavedHealthItems();
    const updated = current.filter((i) => i.id !== id);
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(updated));

    // Direct Supabase PostgreSQL delete when authenticated
    if (supabase && isSupabaseConfigured) {
      getActiveUser().then(async (user) => {
        if (user) {
          try {
            await supabase
              .from('saved_health_items')
              .delete()
              .eq('user_id', user.id)
              .eq('item_id', id);
          } catch (err) {
            console.warn('[HealthService] Supabase remove health item notice:', err);
          }
        }
      });
    }

    return updated;
  } catch {
    return [];
  }
}

export function isHealthItemSaved(id: string): boolean {
  const current = getSavedHealthItems();
  return current.some((i) => i.id === id);
}

// Helper for backward compatibility
export async function getHealthResources() {
  return fetchHealthFacilities();
}
