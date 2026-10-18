/**
 * Setu Marketplace & Livelihood Platform Type Definitions
 * Covers Jobs & Gigs, Local Service Profiles, Booking Lifecycles, and Conversations.
 */

export interface Compensation {
  amount: number;
  maxAmount?: number;
  unit: 'per_day' | 'per_month' | 'per_hour' | 'per_delivery' | 'per_task';
  isEstimate: boolean;
  materialsExtra?: boolean;
}

export interface ContactChannel {
  type: 'platform_apply' | 'direct_phone' | 'email';
  value?: string;
  verified: boolean;
}

export interface JobListing {
  id: string;
  title: string;
  employer: string;
  category: string;
  description: string;
  location: string;
  serviceArea?: string;
  distance?: string;
  workType: 'full_time' | 'part_time' | 'shift_based' | 'task_based';
  compensation: Compensation;
  schedule: string;
  requirements: string[];
  skills: string[];
  deadline?: string;
  verificationStatus: 'verified_platform' | 'community_posted' | 'demo_listing';
  safetyInfo?: string;
  contactChannel?: ContactChannel;
  isDemo?: boolean;
  postedAt: string;
}

export type JobApplicationStatus =
  | 'submitted'
  | 'in_review'
  | 'shortlisted'
  | 'interview_requested'
  | 'accepted'
  | 'not_selected'
  | 'withdrawn';

export interface ApplicationStatusHistory {
  status: JobApplicationStatus;
  timestamp: string;
  note?: string;
}

export interface JobApplication {
  id: string; // e.g. "APP-2026-8812"
  jobId: string;
  jobTitle: string;
  employer: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  applicantSkills: string[];
  applicantExperience?: string;
  applicantLanguages: string[];
  coverNote?: string;
  status: JobApplicationStatus;
  statusHistory: ApplicationStatusHistory[];
  appliedAt: string;
  updatedAt: string;
  employerUpdated: boolean;
  nextAction?: string;
}

export interface ServicePricing {
  type: 'visit_fee' | 'per_hour' | 'per_task' | 'custom_quote';
  indicativePrice: number;
  maxPrice?: number;
  description: string;
  materialsExtra: boolean;
}

export interface ServiceAvailability {
  workingDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  timeSlots: string[];
  unavailableDates?: string[];
}

export interface ServiceProfile {
  id: string;
  userId: string;
  displayName: string;
  trade: string;
  skills: string[];
  shortDescription: string;
  yearsOfExperience: number;
  serviceCategories: string[];
  approximateServiceArea: string;
  serviceRadiusKm: number;
  languages: string[];
  qualifications?: string[];
  pricing: ServicePricing;
  availability: ServiceAvailability;
  completedJobsCount: number;
  rating?: number;
  reviewsCount: number;
  isPublished: boolean;
  isPaused: boolean;
  verificationStatus: 'verified_trade' | 'id_verified' | 'unverified' | 'demo_profile';
  updatedAt?: string;
}

export type BookingStatus =
  | 'requested'
  | 'pending'
  | 'awaiting_worker_response'
  | 'alternative_time_proposed'
  | 'awaiting_customer_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'declined'
  | 'rejected';

export interface BookingStatusHistory {
  status: BookingStatus;
  timestamp: string;
  byRole: 'customer' | 'worker' | 'system';
  note?: string;
}

export interface BookingRequest {
  id: string; // e.g. "SRV-2026-9042"
  workerId: string;
  workerName: string;
  workerTrade: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  serviceCategory: string;
  taskDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  alternativeTimeSlot?: string;
  proposedDate?: string | null;
  proposedTimeSlot?: string | null;
  locality: string;
  exactAddress?: string;
  lat?: number;
  lng?: number;
  distance?: string;
  supportingImages?: string[];
  additionalNotes?: string;
  indicativePrice?: number;
  priceNote?: string;
  status: BookingStatus;
  statusHistory: BookingStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceMessage {
  id: string;
  contextId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'worker' | 'applicant' | 'employer';
  text: string;
  timestamp: string;
}

export interface Conversation {
  contextId: string;
  contextType: 'booking' | 'application';
  summaryTitle: string;
  summarySubtitle: string;
  status: string;
  participants: {
    id: string;
    name: string;
    role: string;
  }[];
  messages: MarketplaceMessage[];
  updatedAt: string;
}

export interface ActivitySummary {
  applicationsCount: number;
  incomingRequestsCount: number;
  confirmedBookingsCount: number;
  completedWorkCount: number;
  latestApplications: JobApplication[];
  latestIncomingRequests: BookingRequest[];
  latestBookings: BookingRequest[];
}
