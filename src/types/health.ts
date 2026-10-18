export type SymptomCategory =
  | 'fever'
  | 'dizziness'
  | 'pain'
  | 'cough'
  | 'injury'
  | 'support'
  | 'other';

export interface SymptomCardOption {
  id: SymptomCategory;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export interface SymptomAssessment {
  category: SymptomCategory;
  onset: 'today' | '1-2_days' | '3+_days' | 'ongoing';
  severity: 'mild' | 'moderate' | 'severe';
  trend: 'improving' | 'same' | 'worsening';
  redFlags: string[];
  notes?: string;
}

export interface SymptomGuidance {
  category: SymptomCategory;
  isEmergency: boolean;
  emergencyReason?: string;
  summary: string;
  recommendations: string[];
  selfCareSteps: string[];
  redFlagWarning: string;
  suggestedFacilityType: 'hospital' | 'phc' | 'clinic' | 'pharmacy';
  suggestedQuestions: string[];
}

export type FacilityType = 'hospital' | 'phc' | 'chc' | 'clinic' | 'pharmacy';

export interface HealthFacility {
  id: string;
  name: string;
  nameKey?: string;
  type: FacilityType;
  categoryLabel: string;
  address: string;
  locality: string;
  city: string;
  distance: string;
  phone: string;
  timings: string;
  services: string[];
  servicesKey?: string;
  isGovernment: boolean;
  isVerified: boolean;
  is24x7: boolean;
  emergencyServices: boolean;
  lat?: number;
  lng?: number;
  directionsUrl: string;
}

export interface HealthScheme {
  id: string;
  name: string;
  hindiName?: string;
  shortDescription: string;
  targetBeneficiaries: string;
  benefits: string[];
  coverageAmount?: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  officialUrl: string;
  helplinePhone?: string;
  lastVerified: string;
  category: 'insurance' | 'wellness' | 'maternity' | 'accident' | 'medicine';
}

export interface HealthSafetyTip {
  id: string;
  title: string;
  category: 'delivery' | 'construction' | 'driving' | 'vendor' | 'general';
  categoryLabel: string;
  summary: string;
  tips: string[];
  helpfulCount: number;
}

export interface HealthChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: { title: string; url: string }[];
  isEmergency?: boolean;
}

export interface SavedHealthItem {
  id: string;
  type: 'facility' | 'scheme' | 'tip';
  title: string;
  subtitle: string;
  savedAt: string;
  data: any;
}
