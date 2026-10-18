/**
 * Haq Setu (Worker Rights & Account Recovery) Type Definitions
 * FairWork Setu Inclusive Worker Companion
 */

export type HaqCaseStatus =
  | 'draft'
  | 'ready_to_submit'
  | 'submitted'
  | 'awaiting_response'
  | 'follow_up_needed'
  | 'resolved'
  | 'closed';

export type HaqCaseCategory =
  | 'deactivation'
  | 'missing_payment'
  | 'penalty'
  | 'other';

export interface HaqCase {
  id: string; // e.g. "HAQ-1042"
  platform: string;
  category: HaqCaseCategory;
  title: string;
  dateOccurred: string;
  createdAt: string;
  updatedAt: string;
  status: HaqCaseStatus;
  ticketNumber?: string;
  followUpDate?: string;
  notes?: string;
  appealSubject?: string;
  appealBody?: string;
  outcomeRequested?: string;
  evidenceSummary?: string;
  hasEvidence?: boolean;
}

export type DeactivationProblemType =
  | 'permanently_deactivated'
  | 'temporarily_suspended'
  | 'cannot_login'
  | 'warning_penalty'
  | 'not_sure';

export type DeactivationReasonGiven =
  | 'yes_message'
  | 'no_reason'
  | 'not_sure';

export type RequestedOutcomeType =
  | 'clear_explanation'
  | 'fair_review'
  | 'correction_mistake'
  | 'reactivation';

export interface DeactivationWizardData {
  platform: 'Zomato' | 'Swiggy' | 'Other platform' | 'Not sure' | string;
  customPlatformName?: string;
  problemType: DeactivationProblemType;
  dateOccurred: string;
  dateNotRemembered: boolean;
  reasonGiven: DeactivationReasonGiven;
  reasonCategory?: string; // 'customer_complaint' | 'cancellation_rate' | 'kyc_document' | 'selfie_verification' | 'delivery_delay' | 'other'
  screenshotName?: string;
  screenshotPreviewUrl?: string; // Client-side memory URL, never logged or stored in localStorage
  screenshotSize?: number;
  pastedNoticeText?: string;
  userDescription?: string;
  hasContactedSupport: boolean;
  hasSubmittedAppeal: boolean;
  ticketNumber?: string;
  requestedOutcome: RequestedOutcomeType;
  workerName?: string;
  workerMaskedId?: string;
}

export interface LegalSource {
  id: string;
  jurisdiction: 'National (India)' | 'Rajasthan' | 'Karnataka' | 'Maharashtra' | 'Delhi';
  title: string;
  authority: string;
  officialUrl: string;
  relevantProvision: string;
  effectiveDate: string;
  lastVerifiedDate: string;
  reviewStatus: 'Verified by Legal Literacy Desk' | 'Gazette Published' | 'Draft Bill' | 'Official Portal';
  workerScope: string;
  summary: string;
  keyRights: string[];
}

export interface CaseAssessmentChecklistItem {
  step: number;
  title: string;
  detail: string;
  urgency: 'high' | 'medium' | 'standard';
}

export interface CaseAssessment {
  summaryWhatYouToldUs: string[];
  whatWeKnow: string[];
  whatNeedsConfirmation: string[];
  checklist: CaseAssessmentChecklistItem[];
  applicableRights: {
    title: string;
    source: string;
    url: string;
    provision: string;
  }[];
  estimatedShortfall?: {
    weeklyIncomeBaseline: number;
    daysImpacted: number;
    estimatedLoss: number;
    disclaimer: string;
  };
}

export interface AppealDraft {
  subject: string;
  recipient: string;
  body: string;
  bilingualExplanation?: string;
  targetSupportEmail?: string;
  targetSupportPortal?: string;
  language: string;
}

export interface PlatformSupportChannel {
  platform: string;
  supportEmail: string;
  grievanceDeskUrl: string;
  inAppPath: string;
  helpline?: string;
  notes: string;
}
