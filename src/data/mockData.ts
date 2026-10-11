/**
 * Setu — Mock Data and Type Definitions
 * Replicates the visual source of truth from Emerald Glass Light Theme reference screens.
 */

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

export type Availability = 'anytime' | 'today' | 'weekdays' | 'weekends';

export interface Job {
  id: string;
  titleKey: string;
  locationKey: string;
  employerKey: string;
  distance: string;
  payMin: number;
  payMax: number;
  payTypeKey: string;
  skillMatch: number;
  workTypeKey: string;
  postedAgoKey: string;
  skillKeys: string[];
  filterTags: string[];
  workIcon: string;
}

export interface DailyIncome {
  dayKey: string;
  amount: number;
  date: string;
}

export interface Expense {
  categoryKey: string;
  amount: number;
  icon: string;
  colorToken: 'warning' | 'accent' | 'health' | 'primary' | 'danger' | 'textSecondary';
}

export interface RecentExpense {
  id: string;
  categoryKey: string;
  name: string;
  amount: number;
  date: string;
  icon: string;
}

export interface HealthResource {
  id: string;
  nameKey: string;
  typeKey: string;
  distance: string;
  servicesKey: string;
  timings?: string;
  phone?: string;
  sourceUrl?: string;
  isGovernment: boolean;
}

export interface SkillCourse {
  id: string;
  titleKey: string;
  provider: string;
  durationKey: string;
  levelKey: string;
  icon: string;
  isFree: boolean;
}

export interface WelfareScheme {
  id: string;
  nameKey: string;
  descriptionKey: string;
  eligibilityKey: string;
  benefitsKey?: string;
  sourceUrl?: string;
  icon: string;
}

export interface WorkerTypeOption {
  type: WorkerType;
  labelKey: string;
  icon: string;
}

export const CITY_KEYS = [
  'cities.pune',
  'cities.mumbai',
  'cities.delhi',
  'cities.bengaluru',
  'cities.hyderabad',
  'cities.chennai',
  'cities.kolkata',
  'cities.ahmedabad',
] as const;

export const SUGGESTED_SKILL_KEYS = [
  'skills.driving',
  'skills.cleaning',
  'skills.cooking',
  'skills.sweepingMopping',
  'skills.dishwashing',
  'skills.laundry',
  'skills.caregiving',
  'skills.electrician',
  'skills.plumbing',
  'skills.tailoring',
  'skills.loading',
  'skills.other',
] as const;

export interface GenderOption {
  id: 'woman' | 'man' | 'non_binary' | 'prefer_not_to_say';
  labelKey: string;
  icon: string;
}

export const genderOptions: GenderOption[] = [
  { id: 'woman', labelKey: 'gender.woman', icon: 'person' },
  { id: 'man', labelKey: 'gender.man', icon: 'person' },
  { id: 'non_binary', labelKey: 'gender.nonBinary', icon: 'person' },
  { id: 'prefer_not_to_say', labelKey: 'gender.preferNotToSay', icon: 'shield-checkmark-outline' },
];

export const workerTypeOptions: WorkerTypeOption[] = [
  { type: 'driver', labelKey: 'workerTypes.driver', icon: 'car-outline' },
  { type: 'delivery', labelKey: 'workerTypes.delivery', icon: 'bicycle-outline' },
  { type: 'construction', labelKey: 'workerTypes.construction', icon: 'hammer-outline' },
  { type: 'domestic', labelKey: 'workerTypes.domestic', icon: 'home-outline' },
  { type: 'vendor', labelKey: 'workerTypes.vendor', icon: 'storefront-outline' },
  { type: 'electrician', labelKey: 'workerTypes.electrician', icon: 'flash-outline' },
  { type: 'other', labelKey: 'workerTypes.other', icon: 'ellipsis-horizontal-outline' },
];

export const mockJobs: Job[] = [
  {
    id: 'j001',
    titleKey: 'jobs.deliveryPartner.title',
    locationKey: 'jobs.deliveryPartner.location',
    employerKey: 'jobs.deliveryPartner.employer',
    distance: '2.4 km',
    payMin: 300,
    payMax: 450,
    payTypeKey: 'jobs.deliveryPartner.payType',
    skillMatch: 92,
    workTypeKey: 'jobs.deliveryPartner.workType',
    postedAgoKey: 'jobs.deliveryPartner.postedAgo',
    skillKeys: ['skills.driving', 'skills.delivery'],
    filterTags: ['delivery', 'driving', 'today'],
    workIcon: 'bicycle-outline',
  },
  {
    id: 'j002',
    titleKey: 'jobs.warehouseHelper.title',
    locationKey: 'jobs.warehouseHelper.location',
    employerKey: 'jobs.warehouseHelper.employer',
    distance: '3.1 km',
    payMin: 350,
    payMax: 500,
    payTypeKey: 'jobs.warehouseHelper.payType',
    skillMatch: 88,
    workTypeKey: 'jobs.warehouseHelper.workType',
    postedAgoKey: 'jobs.warehouseHelper.postedAgo',
    skillKeys: ['skills.loading', 'skills.other'],
    filterTags: ['warehouse', 'loading', 'all'],
    workIcon: 'build-outline',
  },
  {
    id: 'j003',
    titleKey: 'jobs.houseHelp.title',
    locationKey: 'jobs.houseHelp.location',
    employerKey: 'jobs.houseHelp.employer',
    distance: '2.8 km',
    payMin: 400,
    payMax: 650,
    payTypeKey: 'jobs.houseHelp.payType',
    skillMatch: 94,
    workTypeKey: 'jobs.houseHelp.workType',
    postedAgoKey: 'jobs.houseHelp.postedAgo',
    skillKeys: ['skills.cleaning', 'skills.cooking'],
    filterTags: ['domestic', 'cleaning', 'cooking', 'today'],
    workIcon: 'home-outline',
  },
  {
    id: 'j004',
    titleKey: 'jobs.domesticCaregiver.title',
    locationKey: 'jobs.domesticCaregiver.location',
    employerKey: 'jobs.domesticCaregiver.employer',
    distance: '3.5 km',
    payMin: 600,
    payMax: 900,
    payTypeKey: 'jobs.domesticCaregiver.payType',
    skillMatch: 91,
    workTypeKey: 'jobs.domesticCaregiver.workType',
    postedAgoKey: 'jobs.domesticCaregiver.postedAgo',
    skillKeys: ['skills.cleaning', 'skills.other'],
    filterTags: ['domestic', 'caregiving', 'week'],
    workIcon: 'heart-outline',
  },
  {
    id: 'j005',
    titleKey: 'jobs.electricianService.title',
    locationKey: 'jobs.electricianService.location',
    employerKey: 'jobs.electricianService.employer',
    distance: '4.2 km',
    payMin: 700,
    payMax: 1200,
    payTypeKey: 'jobs.electricianService.payType',
    skillMatch: 86,
    workTypeKey: 'jobs.electricianService.workType',
    postedAgoKey: 'jobs.electricianService.postedAgo',
    skillKeys: ['skills.wiring', 'skills.electrician'],
    filterTags: ['electrician', 'wiring', 'repair'],
    workIcon: 'flash-outline',
  },
  {
    id: 'j006',
    titleKey: 'jobs.privateDriver.title',
    locationKey: 'jobs.privateDriver.location',
    employerKey: 'jobs.privateDriver.employer',
    distance: '5.0 km',
    payMin: 600,
    payMax: 900,
    payTypeKey: 'jobs.privateDriver.payType',
    skillMatch: 90,
    workTypeKey: 'jobs.privateDriver.workType',
    postedAgoKey: 'jobs.privateDriver.postedAgo',
    skillKeys: ['skills.driving'],
    filterTags: ['driver', 'driving', 'week'],
    workIcon: 'car-outline',
  },
  {
    id: 'j007',
    titleKey: 'jobs.homeCleaner.title',
    locationKey: 'jobs.homeCleaner.location',
    employerKey: 'jobs.homeCleaner.employer',
    distance: '1.8 km',
    payMin: 500,
    payMax: 800,
    payTypeKey: 'jobs.homeCleaner.payType',
    skillMatch: 95,
    workTypeKey: 'jobs.homeCleaner.workType',
    postedAgoKey: 'jobs.homeCleaner.postedAgo',
    skillKeys: ['skills.sweepingMopping', 'skills.dishwashing', 'skills.cleaning'],
    filterTags: ['domestic', 'cleaning', 'today'],
    workIcon: 'sparkles',
  },
];

export const weeklyIncome: DailyIncome[] = [
  { dayKey: 'days.mon', amount: 750, date: '2025-10-06' },
  { dayKey: 'days.tue', amount: 820, date: '2025-10-07' },
  { dayKey: 'days.wed', amount: 650, date: '2025-10-08' },
  { dayKey: 'days.thu', amount: 900, date: '2025-10-09' },
  { dayKey: 'days.fri', amount: 1100, date: '2025-10-10' },
  { dayKey: 'days.sat', amount: 750, date: '2025-10-11' },
  { dayKey: 'days.sun', amount: 280, date: '2025-10-12' },
];

export const expenseCategories: Expense[] = [
  { categoryKey: 'expenses.travel', amount: 450, icon: 'car-outline', colorToken: 'warning' },
  { categoryKey: 'expenses.food', amount: 350, icon: 'restaurant-outline', colorToken: 'accent' },
  { categoryKey: 'expenses.rent', amount: 1500, icon: 'home-outline', colorToken: 'health' },
  { categoryKey: 'expenses.tools', amount: 200, icon: 'construct-outline', colorToken: 'primary' },
  { categoryKey: 'expenses.medical', amount: 150, icon: 'medkit-outline', colorToken: 'danger' },
  { categoryKey: 'expenses.other', amount: 120, icon: 'ellipsis-horizontal-circle-outline', colorToken: 'textSecondary' },
];

export const recentExpensesList: RecentExpense[] = [
  { id: 'exp1', categoryKey: 'expenses.food', name: 'Food', amount: 120, date: '12 Oct', icon: 'restaurant-outline' },
  { id: 'exp2', categoryKey: 'expenses.travel', name: 'Travel', amount: 90, date: '11 Oct', icon: 'car-outline' },
  { id: 'exp3', categoryKey: 'expenses.tools', name: 'Tools', amount: 250, date: '10 Oct', icon: 'construct-outline' },
];

export const healthResources: HealthResource[] = [
  {
    id: 'h001',
    nameKey: 'healthResources.cityHospital.name',
    typeKey: 'healthResources.cityHospital.type',
    distance: '2.1 km',
    servicesKey: 'healthResources.cityHospital.services',
    timings: 'Open 24x7',
    phone: '020-26127000',
    sourceUrl: 'https://arogya.maharashtra.gov.in',
    isGovernment: true,
  },
  {
    id: 'h002',
    nameKey: 'healthResources.janArogya.name',
    typeKey: 'healthResources.janArogya.type',
    distance: '3.5 km',
    servicesKey: 'healthResources.janArogya.services',
    timings: 'Open 9 AM - 5 PM',
    phone: '1800-111-565',
    sourceUrl: 'https://pmjay.gov.in',
    isGovernment: true,
  },
  {
    id: 'h003',
    nameKey: 'healthResources.wellnessClinic.name',
    typeKey: 'healthResources.wellnessClinic.type',
    distance: '4.5 km',
    servicesKey: 'healthResources.wellnessClinic.services',
    timings: 'Open 10 AM - 8 PM',
    phone: '020-25441234',
    sourceUrl: 'https://abdm.gov.in',
    isGovernment: false,
  },
];

export const welfareSchemes: WelfareScheme[] = [
  {
    id: 'ws001',
    nameKey: 'schemes.ayushmanBharat.name',
    descriptionKey: 'schemes.ayushmanBharat.description',
    eligibilityKey: 'schemes.ayushmanBharat.eligibility',
    benefitsKey: 'Free secondary and tertiary care hospitalization up to ₹5 Lakh/family/year.',
    sourceUrl: 'https://pmjay.gov.in',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'ws002',
    nameKey: 'schemes.pmShramYogi.name',
    descriptionKey: 'schemes.pmShramYogi.description',
    eligibilityKey: 'schemes.pmShramYogi.eligibility',
    benefitsKey: 'Assured minimum pension of ₹3,000/month after attaining age 60.',
    sourceUrl: 'https://eshram.gov.in',
    icon: 'card-outline',
  },
  {
    id: 'ws003',
    nameKey: 'schemes.pmjjby.name',
    descriptionKey: 'schemes.pmjjby.description',
    eligibilityKey: 'schemes.pmjjby.eligibility',
    benefitsKey: '₹2 Lakh life risk cover for ₹436/year.',
    sourceUrl: 'https://financialservices.gov.in',
    icon: 'heart-outline',
  },
];

export const skillCourses: SkillCourse[] = [
  {
    id: 'sc001',
    titleKey: 'courses.advancedDriving.title',
    provider: 'NSDC',
    durationKey: 'courses.advancedDriving.duration',
    levelKey: 'courses.advancedDriving.level',
    icon: 'car-outline',
    isFree: true,
  },
  {
    id: 'sc002',
    titleKey: 'courses.customerService.title',
    provider: 'Skill India',
    durationKey: 'courses.customerService.duration',
    levelKey: 'courses.customerService.level',
    icon: 'bulb-outline',
    isFree: true,
  },
  {
    id: 'sc003',
    titleKey: 'courses.digitalPayments.title',
    provider: 'PMKVY',
    durationKey: 'courses.digitalPayments.duration',
    levelKey: 'courses.digitalPayments.level',
    icon: 'flash-outline',
    isFree: true,
  },
];

export const todayIncome = 750;
export const weekIncomeDelta = 120;
export const emergencySaved = 1260;
export const emergencyTarget = 4200;
export const todaySaveSuggestion = 50;
export const weeklySavingsSaved = 1260;
export const weeklySavingsTarget = 4200;
export const nextWeekMin = 5800;
export const nextWeekMax = 6400;
export const stabilityScore = 348;
export const voiceIncome = 500;
export const voiceExpense = 150;
export const completedJobs = 48;
export const rating = 4.8;
