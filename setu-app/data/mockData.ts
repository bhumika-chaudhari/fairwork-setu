/**
 * Setu — Mock Data
 * All local demo data for the app.
 */

// ─── Types ──────────────────────────────────────────────────

export type WorkerType =
  | 'driver'
  | 'delivery'
  | 'construction'
  | 'domestic'
  | 'vendor'
  | 'electrician'
  | 'plumber'
  | 'tailor'
  | 'other';

export interface WorkerProfile {
  id: string;
  name: string;
  occupation: string;
  occupationType: WorkerType;
  city: string;
  skills: string[];
  experience: string;
  languages: string[];
  phone: string;
  rating: number;
  completedJobs: number;
}

export interface Job {
  id: string;
  title: string;
  titleHi: string;
  location: string;
  distance: string;
  payMin: number;
  payMax: number;
  payType: string;
  payTypeHi: string;
  skillMatch: number;
  workType: string;
  workTypeHi: string;
  postedAgo: string;
  postedAgoHi: string;
  skills: string[];
}

export interface DailyIncome {
  day: string;
  dayHi: string;
  amount: number;
  date: string;
}

export interface Expense {
  category: string;
  categoryHi: string;
  amount: number;
  icon: string;
}

export interface HealthResource {
  id: string;
  name: string;
  type: string;
  typeHi: string;
  distance: string;
  services: string[];
  servicesHi: string[];
  phone?: string;
  isGovernment: boolean;
}

export interface SkillCourse {
  id: string;
  title: string;
  titleHi: string;
  provider: string;
  duration: string;
  durationHi: string;
  level: string;
  levelHi: string;
  icon: string;
  isFree: boolean;
}

export interface WelfareScheme {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  eligibility: string;
  eligibilityHi: string;
  icon: string;
}

// ─── Worker Profile ─────────────────────────────────────────

export const workerProfile: WorkerProfile = {
  id: 'w001',
  name: 'रमेश कुमार',
  occupation: 'इलेक्ट्रिशियन',
  occupationType: 'electrician',
  city: 'पुणे',
  skills: ['वायरिंग', 'पंखा रिपेयर', 'स्विचबोर्ड रिपेयर', 'LED इंस्टालेशन'],
  experience: '8 साल',
  languages: ['हिंदी', 'मराठी'],
  phone: '+91 98XXX XXXXX',
  rating: 4.5,
  completedJobs: 142,
};

// ─── Jobs ───────────────────────────────────────────────────

export const mockJobs: Job[] = [
  {
    id: 'j001',
    title: 'Home Wiring',
    titleHi: 'घर की वायरिंग',
    location: 'कोथरूड, पुणे',
    distance: '2.3 km',
    payMin: 800,
    payMax: 1200,
    payType: 'per day',
    payTypeHi: 'प्रति दिन',
    skillMatch: 92,
    workType: 'Contract',
    workTypeHi: 'ठेका',
    postedAgo: '2 hours ago',
    postedAgoHi: '2 घंटे पहले',
    skills: ['वायरिंग', 'इलेक्ट्रिकल'],
  },
  {
    id: 'j002',
    title: 'Fan Installation',
    titleHi: 'पंखा लगाना',
    location: 'हडपसर, पुणे',
    distance: '4.1 km',
    payMin: 500,
    payMax: 700,
    payType: 'per job',
    payTypeHi: 'प्रति काम',
    skillMatch: 88,
    workType: 'One-time',
    workTypeHi: 'एक बार',
    postedAgo: '5 hours ago',
    postedAgoHi: '5 घंटे पहले',
    skills: ['पंखा रिपेयर'],
  },
  {
    id: 'j003',
    title: 'Office Switchboard Repair',
    titleHi: 'ऑफिस स्विचबोर्ड रिपेयर',
    location: 'विमान नगर, पुणे',
    distance: '6.5 km',
    payMin: 1000,
    payMax: 1500,
    payType: 'per day',
    payTypeHi: 'प्रति दिन',
    skillMatch: 85,
    workType: 'Contract',
    workTypeHi: 'ठेका',
    postedAgo: '1 day ago',
    postedAgoHi: '1 दिन पहले',
    skills: ['स्विचबोर्ड रिपेयर', 'इलेक्ट्रिकल'],
  },
  {
    id: 'j004',
    title: 'LED Light Installation',
    titleHi: 'LED लाइट लगाना',
    location: 'बालेवाड़ी, पुणे',
    distance: '5.0 km',
    payMin: 600,
    payMax: 900,
    payType: 'per job',
    payTypeHi: 'प्रति काम',
    skillMatch: 78,
    workType: 'One-time',
    workTypeHi: 'एक बार',
    postedAgo: '3 hours ago',
    postedAgoHi: '3 घंटे पहले',
    skills: ['LED इंस्टालेशन'],
  },
  {
    id: 'j005',
    title: 'Construction Site Electrician',
    titleHi: 'कंस्ट्रक्शन साइट इलेक्ट्रिशियन',
    location: 'वाकड, पुणे',
    distance: '8.2 km',
    payMin: 1200,
    payMax: 1800,
    payType: 'per day',
    payTypeHi: 'प्रति दिन',
    skillMatch: 72,
    workType: 'Weekly',
    workTypeHi: 'साप्ताहिक',
    postedAgo: '6 hours ago',
    postedAgoHi: '6 घंटे पहले',
    skills: ['वायरिंग', 'इलेक्ट्रिकल'],
  },
];

// ─── Income Data ────────────────────────────────────────────

export const weeklyIncome: DailyIncome[] = [
  { day: 'Mon', dayHi: 'सोम', amount: 850, date: '2024-01-08' },
  { day: 'Tue', dayHi: 'मंगल', amount: 1200, date: '2024-01-09' },
  { day: 'Wed', dayHi: 'बुध', amount: 0, date: '2024-01-10' },
  { day: 'Thu', dayHi: 'गुरु', amount: 950, date: '2024-01-11' },
  { day: 'Fri', dayHi: 'शुक्र', amount: 1100, date: '2024-01-12' },
  { day: 'Sat', dayHi: 'शनि', amount: 750, date: '2024-01-13' },
  { day: 'Sun', dayHi: 'रवि', amount: 0, date: '2024-01-14' },
];

export const expenseCategories: Expense[] = [
  { category: 'Travel', categoryHi: 'यात्रा', amount: 450, icon: 'car-outline' },
  { category: 'Food', categoryHi: 'खाना', amount: 350, icon: 'restaurant-outline' },
  { category: 'Rent', categoryHi: 'किराया', amount: 0, icon: 'home-outline' },
  { category: 'Tools', categoryHi: 'औजार', amount: 200, icon: 'construct-outline' },
  { category: 'Medical', categoryHi: 'मेडिकल', amount: 0, icon: 'medkit-outline' },
  { category: 'Other', categoryHi: 'अन्य', amount: 150, icon: 'ellipsis-horizontal-circle-outline' },
];

// ─── Health Resources ───────────────────────────────────────

export const healthResources: HealthResource[] = [
  {
    id: 'h001',
    name: 'ससून अस्पताल',
    type: 'Government Hospital',
    typeHi: 'सरकारी अस्पताल',
    distance: '1.8 km',
    services: ['Emergency', 'OPD', 'Lab Tests'],
    servicesHi: ['इमरजेंसी', 'ओपीडी', 'लैब टेस्ट'],
    phone: '020-26127000',
    isGovernment: true,
  },
  {
    id: 'h002',
    name: 'PHC कोथरूड',
    type: 'Primary Health Center',
    typeHi: 'प्राथमिक स्वास्थ्य केंद्र',
    distance: '3.2 km',
    services: ['General Checkup', 'Vaccination', 'First Aid'],
    servicesHi: ['सामान्य जांच', 'टीकाकरण', 'प्राथमिक उपचार'],
    isGovernment: true,
  },
  {
    id: 'h003',
    name: 'जन औषधि केंद्र',
    type: 'Jan Aushadhi',
    typeHi: 'जन औषधि केंद्र',
    distance: '0.8 km',
    services: ['Affordable Medicines', 'Generic Drugs'],
    servicesHi: ['सस्ती दवाइयाँ', 'जेनेरिक दवाइयाँ'],
    isGovernment: true,
  },
];

// ─── Skill Courses ──────────────────────────────────────────

export const skillCourses: SkillCourse[] = [
  {
    id: 'sc001',
    title: 'Solar Panel Installation',
    titleHi: 'सोलर पैनल इंस्टालेशन',
    provider: 'NSDC',
    duration: '2 weeks',
    durationHi: '2 हफ्ते',
    level: 'Intermediate',
    levelHi: 'मध्यम',
    icon: 'sunny-outline',
    isFree: true,
  },
  {
    id: 'sc002',
    title: 'Smart Home Wiring',
    titleHi: 'स्मार्ट होम वायरिंग',
    provider: 'Skill India',
    duration: '1 month',
    durationHi: '1 महीना',
    level: 'Advanced',
    levelHi: 'उन्नत',
    icon: 'bulb-outline',
    isFree: true,
  },
  {
    id: 'sc003',
    title: 'EV Charger Setup',
    titleHi: 'EV चार्जर सेटअप',
    provider: 'PMKVY',
    duration: '3 weeks',
    durationHi: '3 हफ्ते',
    level: 'Advanced',
    levelHi: 'उन्नत',
    icon: 'flash-outline',
    isFree: true,
  },
];

// ─── Welfare Schemes ────────────────────────────────────────

export const welfareSchemes: WelfareScheme[] = [
  {
    id: 'ws001',
    name: 'PM-SYM',
    nameHi: 'प्रधानमंत्री श्रम योगी मान-धन',
    description: 'Pension scheme for unorganised workers',
    descriptionHi: 'असंगठित श्रमिकों के लिए पेंशन योजना',
    eligibility: '18-40 years, income < ₹15,000/month',
    eligibilityHi: '18-40 साल, आय < ₹15,000/महीना',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'ws002',
    name: 'e-Shram',
    nameHi: 'ई-श्रम कार्ड',
    description: 'Identity card for unorganised workers',
    descriptionHi: 'असंगठित श्रमिकों के लिए पहचान पत्र',
    eligibility: 'All unorganised workers',
    eligibilityHi: 'सभी असंगठित श्रमिक',
    icon: 'card-outline',
  },
];

// ─── Worker type options ────────────────────────────────────

export interface WorkerTypeOption {
  type: WorkerType;
  labelHi: string;
  labelEn: string;
  icon: string;
}

export const workerTypeOptions: WorkerTypeOption[] = [
  { type: 'driver', labelHi: 'ड्राइवर', labelEn: 'Driver', icon: 'car-outline' },
  { type: 'delivery', labelHi: 'डिलीवरी', labelEn: 'Delivery', icon: 'bicycle-outline' },
  { type: 'construction', labelHi: 'मज़दूर', labelEn: 'Construction', icon: 'hammer-outline' },
  { type: 'domestic', labelHi: 'घरेलू काम', labelEn: 'Domestic Work', icon: 'home-outline' },
  { type: 'vendor', labelHi: 'दुकानदार', labelEn: 'Vendor', icon: 'storefront-outline' },
  { type: 'electrician', labelHi: 'इलेक्ट्रिशियन', labelEn: 'Electrician', icon: 'flash-outline' },
  { type: 'other', labelHi: 'अन्य', labelEn: 'Other', icon: 'ellipsis-horizontal-outline' },
];
