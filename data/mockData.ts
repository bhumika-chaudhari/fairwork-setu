/**
 * Setu — Mock data. User-visible copy lives in translation files.
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

export interface HealthResource {
  id: string;
  nameKey: string;
  typeKey: string;
  distance: string;
  servicesKey: string;
  phone?: string;
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
  'skills.wiring',
  'skills.fanRepair',
  'skills.switchboard',
  'skills.led',
  'skills.electrical',
  'skills.driving',
  'skills.delivery',
] as const;

export const workerTypeOptions: WorkerTypeOption[] = [
  { type: 'driver', labelKey: 'workerTypes.driver', icon: 'car-outline' },
  { type: 'delivery', labelKey: 'workerTypes.delivery', icon: 'bicycle-outline' },
  { type: 'construction', labelKey: 'workerTypes.construction', icon: 'hammer-outline' },
  { type: 'domestic', labelKey: 'workerTypes.domestic', icon: 'home-outline' },
  { type: 'vendor', labelKey: 'workerTypes.vendor', icon: 'storefront-outline' },
  { type: 'electrician', labelKey: 'workerTypes.electrician', icon: 'flash-outline' },
  { type: 'plumber', labelKey: 'workerTypes.plumber', icon: 'water-outline' },
  { type: 'tailor', labelKey: 'workerTypes.tailor', icon: 'cut-outline' },
  { type: 'other', labelKey: 'workerTypes.other', icon: 'ellipsis-horizontal-outline' },
];

export const mockJobs: Job[] = [
  {
    id: 'j001',
    titleKey: 'jobs.j001.title',
    locationKey: 'jobs.j001.location',
    employerKey: 'jobs.j001.employer',
    distance: '2.4 km',
    payMin: 700,
    payMax: 900,
    payTypeKey: 'jobs.j001.payType',
    skillMatch: 92,
    workTypeKey: 'jobs.j001.workType',
    postedAgoKey: 'jobs.j001.postedAgo',
    skillKeys: ['skills.wiring', 'skills.electrical'],
    filterTags: ['wiring'],
    workIcon: 'flash-outline',
  },
  {
    id: 'j002',
    titleKey: 'jobs.j002.title',
    locationKey: 'jobs.j002.location',
    employerKey: 'jobs.j002.employer',
    distance: '4.1 km',
    payMin: 500,
    payMax: 700,
    payTypeKey: 'jobs.j002.payType',
    skillMatch: 88,
    workTypeKey: 'jobs.j002.workType',
    postedAgoKey: 'jobs.j002.postedAgo',
    skillKeys: ['skills.fanRepair'],
    filterTags: ['installation'],
    workIcon: 'construct-outline',
  },
  {
    id: 'j003',
    titleKey: 'jobs.j003.title',
    locationKey: 'jobs.j003.location',
    employerKey: 'jobs.j003.employer',
    distance: '6.5 km',
    payMin: 1000,
    payMax: 1500,
    payTypeKey: 'jobs.j003.payType',
    skillMatch: 85,
    workTypeKey: 'jobs.j003.workType',
    postedAgoKey: 'jobs.j003.postedAgo',
    skillKeys: ['skills.switchboard', 'skills.electrical'],
    filterTags: ['repair'],
    workIcon: 'build-outline',
  },
  {
    id: 'j004',
    titleKey: 'jobs.j004.title',
    locationKey: 'jobs.j004.location',
    employerKey: 'jobs.j004.employer',
    distance: '5.0 km',
    payMin: 600,
    payMax: 900,
    payTypeKey: 'jobs.j004.payType',
    skillMatch: 78,
    workTypeKey: 'jobs.j004.workType',
    postedAgoKey: 'jobs.j004.postedAgo',
    skillKeys: ['skills.led'],
    filterTags: ['installation'],
    workIcon: 'bulb-outline',
  },
  {
    id: 'j005',
    titleKey: 'jobs.j005.title',
    locationKey: 'jobs.j005.location',
    employerKey: 'jobs.j005.employer',
    distance: '8.2 km',
    payMin: 1200,
    payMax: 1800,
    payTypeKey: 'jobs.j005.payType',
    skillMatch: 72,
    workTypeKey: 'jobs.j005.workType',
    postedAgoKey: 'jobs.j005.postedAgo',
    skillKeys: ['skills.wiring', 'skills.electrical'],
    filterTags: ['wiring'],
    workIcon: 'business-outline',
  },
];

export const weeklyIncome: DailyIncome[] = [
  { dayKey: 'days.mon', amount: 850, date: '2024-01-08' },
  { dayKey: 'days.tue', amount: 1200, date: '2024-01-09' },
  { dayKey: 'days.wed', amount: 0, date: '2024-01-10' },
  { dayKey: 'days.thu', amount: 950, date: '2024-01-11' },
  { dayKey: 'days.fri', amount: 1100, date: '2024-01-12' },
  { dayKey: 'days.sat', amount: 750, date: '2024-01-13' },
  { dayKey: 'days.sun', amount: 0, date: '2024-01-14' },
];

export const expenseCategories: Expense[] = [
  { categoryKey: 'expenses.travel', amount: 450, icon: 'car-outline', colorToken: 'warning' },
  { categoryKey: 'expenses.food', amount: 350, icon: 'restaurant-outline', colorToken: 'accent' },
  { categoryKey: 'expenses.rent', amount: 0, icon: 'home-outline', colorToken: 'health' },
  { categoryKey: 'expenses.tools', amount: 200, icon: 'construct-outline', colorToken: 'primary' },
  { categoryKey: 'expenses.medical', amount: 0, icon: 'medkit-outline', colorToken: 'danger' },
  { categoryKey: 'expenses.other', amount: 150, icon: 'ellipsis-horizontal-circle-outline', colorToken: 'textSecondary' },
];

export const healthResources: HealthResource[] = [
  {
    id: 'h001',
    nameKey: 'healthResources.h001.name',
    typeKey: 'healthResources.h001.type',
    distance: '1.8 km',
    servicesKey: 'healthResources.h001.services',
    phone: '020-26127000',
    isGovernment: true,
  },
  {
    id: 'h002',
    nameKey: 'healthResources.h002.name',
    typeKey: 'healthResources.h002.type',
    distance: '3.2 km',
    servicesKey: 'healthResources.h002.services',
    isGovernment: true,
  },
  {
    id: 'h003',
    nameKey: 'healthResources.h003.name',
    typeKey: 'healthResources.h003.type',
    distance: '0.8 km',
    servicesKey: 'healthResources.h003.services',
    isGovernment: true,
  },
];

export const skillCourses: SkillCourse[] = [
  {
    id: 'sc001',
    titleKey: 'courses.sc001.title',
    provider: 'NSDC',
    durationKey: 'courses.sc001.duration',
    levelKey: 'courses.sc001.level',
    icon: 'sunny-outline',
    isFree: true,
  },
  {
    id: 'sc002',
    titleKey: 'courses.sc002.title',
    provider: 'Skill India',
    durationKey: 'courses.sc002.duration',
    levelKey: 'courses.sc002.level',
    icon: 'bulb-outline',
    isFree: true,
  },
  {
    id: 'sc003',
    titleKey: 'courses.sc003.title',
    provider: 'PMKVY',
    durationKey: 'courses.sc003.duration',
    levelKey: 'courses.sc003.level',
    icon: 'flash-outline',
    isFree: true,
  },
];

export const welfareSchemes: WelfareScheme[] = [
  {
    id: 'ws001',
    nameKey: 'schemes.ws001.name',
    descriptionKey: 'schemes.ws001.description',
    eligibilityKey: 'schemes.ws001.eligibility',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'ws002',
    nameKey: 'schemes.ws002.name',
    descriptionKey: 'schemes.ws002.description',
    eligibilityKey: 'schemes.ws002.eligibility',
    icon: 'card-outline',
  },
];

export const todayIncome = 750;
export const weekIncomeDelta = 120;
export const emergencySaved = 1250;
export const emergencyTarget = 5000;
export const todaySaveSuggestion = 50;
export const weeklySavingsSaved = 3800;
export const weeklySavingsTarget = 10000;
export const nextWeekMin = 4200;
export const nextWeekMax = 5000;
export const stabilityScore = 62;
export const voiceIncome = 800;
export const voiceExpense = 150;
export const completedJobs = 142;
export const rating = 4.5;
