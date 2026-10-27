import type {
  JobListing,
  JobApplication,
  ServiceProfile,
  BookingRequest,
  BookingStatus,
  Conversation,
  MarketplaceMessage,
  ActivitySummary,
} from '../types/marketplace';
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
const LOCAL_STORAGE_APPS_KEY = 'setu_marketplace_applications';
const LOCAL_STORAGE_BOOKINGS_KEY = 'setu_marketplace_bookings';
const LOCAL_STORAGE_PROFILE_KEY = 'setu_worker_service_profile';
const LOCAL_STORAGE_CONVERSATIONS_KEY = 'setu_marketplace_conversations';

// -------------------------------------------------------------------------
// 1. JOBS & GIGS
// -------------------------------------------------------------------------

export async function fetchJobs(filters?: {
  category?: string;
  workType?: string;
  search?: string;
  city?: string;
}): Promise<JobListing[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.workType && filters.workType !== 'all') params.append('work_type', filters.workType);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.city && filters.city !== 'all') params.append('city', filters.city);

    const res = await fetch(`${BASE_URL}/marketplace/jobs?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // offline fallback
  }

  // Fallback to local default fixture if offline
  return getLocalDefaultJobs(filters);
}

export async function fetchJobDetails(jobId: string): Promise<JobListing | null> {
  try {
    const res = await fetch(`${BASE_URL}/marketplace/jobs/${jobId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  const jobs = getLocalDefaultJobs();
  return jobs.find((j) => j.id === jobId) || null;
}

export async function submitJobApplication(payload: {
  jobId: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  applicantSkills: string[];
  applicantExperience?: string;
  applicantLanguages: string[];
  coverNote?: string;
}): Promise<JobApplication> {
  // Direct Supabase PostgreSQL insert when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        await ensureUserProfile(user);
        const { error: sbErr } = await supabase
          .from('job_applications')
          .insert({
            job_id: payload.jobId,
            applicant_id: user.id,
            status: 'submitted',
            cover_note: payload.coverNote || null,
          });

        if (sbErr) {
          if (
            sbErr.code === '23505' ||
            sbErr.message?.toLowerCase().includes('duplicate') ||
            sbErr.message?.toLowerCase().includes('unique')
          ) {
            throw new Error('You already have an active application for this job.');
          }
          console.warn('[MarketplaceService] Supabase job application notice:', sbErr);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already have an active application')) {
        throw err;
      }
      console.warn('[MarketplaceService] Supabase application error:', err);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/marketplace/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const app = await res.json();
      saveLocalApplication(app);
      return app;
    }

    if (res.status === 409) {
      const err = await res.json();
      throw new Error(err.detail || 'You already have an active application for this job.');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('already have an active application')) {
      throw err;
    }
    // Network fallback
  }

  // Local fallback creation
  const now = new Date().toISOString();
  const app: JobApplication = {
    id: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    jobId: payload.jobId,
    jobTitle: 'Applied Opportunity',
    employer: 'Employer Fleet',
    applicantId: payload.applicantId,
    applicantName: payload.applicantName,
    applicantPhone: payload.applicantPhone,
    applicantSkills: payload.applicantSkills,
    applicantExperience: payload.applicantExperience || 'Experienced',
    applicantLanguages: payload.applicantLanguages,
    coverNote: payload.coverNote,
    status: 'submitted',
    statusHistory: [
      {
        status: 'submitted',
        timestamp: now,
        note: 'Submitted using Setu profile.',
      },
    ],
    appliedAt: now,
    updatedAt: now,
    employerUpdated: false,
    nextAction: 'Awaiting employer update (usually 2–4 working days).',
  };

  saveLocalApplication(app);
  return app;
}

export async function fetchMyApplications(applicantId: string): Promise<JobApplication[]> {
  // Direct Supabase PostgreSQL query when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      const targetId = user?.id || applicantId;
      const { data: rows, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('applicant_id', targetId)
        .order('created_at', { ascending: false });

      if (!error && rows && rows.length > 0) {
        const mapped: JobApplication[] = rows.map((r: any) => ({
          id: r.id,
          jobId: r.job_id,
          jobTitle: 'Applied Opportunity',
          employer: 'Partner Network Fleet',
          applicantId: r.applicant_id,
          applicantName: 'Setu Worker',
          applicantPhone: '',
          applicantSkills: [],
          applicantExperience: 'Field Experienced',
          applicantLanguages: ['Hindi', 'English'],
          coverNote: r.cover_note || '',
          status: r.status as any,
          statusHistory: [
            {
              status: r.status as any,
              timestamp: r.created_at || new Date().toISOString(),
              note: 'Application recorded via Supabase cloud.',
            },
          ],
          appliedAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
          employerUpdated: r.status !== 'submitted',
          nextAction: 'Under review by hiring fleet coordinator.',
        }));
        localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (sbErr) {
      console.warn('[MarketplaceService] Supabase fetch applications notice:', sbErr);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/marketplace/applications?applicant_id=${encodeURIComponent(applicantId)}`);
    if (res.ok) {
      const serverApps = await res.json();
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(serverApps));
      return serverApps;
    }
  } catch {
    // fallback
  }

  return getLocalApplications(applicantId);
}

export async function withdrawJobApplication(appId: string): Promise<JobApplication> {
  // Direct Supabase PostgreSQL update when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        await supabase
          .from('job_applications')
          .update({
            status: 'withdrawn',
            updated_at: new Date().toISOString(),
          })
          .eq('applicant_id', user.id)
          .or(`id.eq.${appId},job_id.eq.${appId}`);
      }
    } catch (sbErr) {
      console.warn('[MarketplaceService] Supabase withdraw notice:', sbErr);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/marketplace/applications/${appId}/withdraw`, {
      method: 'POST',
    });
    if (res.ok) {
      const updated = await res.json();
      saveLocalApplication(updated);
      return updated;
    }
  } catch {
    // fallback
  }

  const existing = getLocalApplications();
  const target = existing.find((a) => a.id === appId);
  if (!target) throw new Error('Application not found');
  target.status = 'withdrawn';
  target.updatedAt = new Date().toISOString();
  target.statusHistory.push({
    status: 'withdrawn',
    timestamp: target.updatedAt,
    note: 'Withdrawn by candidate.',
  });
  saveLocalApplication(target);
  return target;
}

export async function updateApplicationStatusEmployer(
  appId: string,
  status: string,
  note?: string
): Promise<JobApplication> {
  try {
    const res = await fetch(`${BASE_URL}/marketplace/applications/${appId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    if (res.ok) {
      const updated = await res.json();
      saveLocalApplication(updated);
      return updated;
    }
  } catch {
    // fallback
  }

  const existing = getLocalApplications();
  const target = existing.find((a) => a.id === appId);
  if (!target) throw new Error('Application not found');
  target.status = status as any;
  target.employerUpdated = true;
  target.updatedAt = new Date().toISOString();
  target.statusHistory.push({
    status: status as any,
    timestamp: target.updatedAt,
    note: note || `Status updated to ${status}.`,
  });
  saveLocalApplication(target);
  return target;
}

// -------------------------------------------------------------------------
// 2. LOCAL SERVICES & WORKER SERVICE PROFILE
// -------------------------------------------------------------------------

export async function fetchServiceProfiles(filters?: {
  trade?: string;
  search?: string;
  locality?: string;
}): Promise<ServiceProfile[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.trade && filters.trade !== 'all') params.append('trade', filters.trade);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.locality && filters.locality !== 'all') params.append('locality', filters.locality);

    const res = await fetch(`${BASE_URL}/marketplace/service-profiles?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  return getLocalDefaultServiceProfiles(filters);
}

export async function fetchServiceProfile(profileOrUserId: string): Promise<ServiceProfile | null> {
  try {
    const res = await fetch(`${BASE_URL}/marketplace/service-profiles/${encodeURIComponent(profileOrUserId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  const list = getLocalDefaultServiceProfiles();
  return list.find((p) => p.id === profileOrUserId || p.userId === profileOrUserId) || null;
}

export async function saveServiceProfile(profile: ServiceProfile): Promise<ServiceProfile> {
  // Direct Supabase PostgreSQL upsert when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        await ensureUserProfile(user);
        const { error: sbErr } = await supabase.from('service_profiles').upsert(
          {
            user_id: user.id,
            display_name: profile.displayName || (profile as any).name || 'Setu Worker',
            trade: profile.trade || 'General Worker',
            short_description: profile.shortDescription || '',
            phone: (profile as any).phone || '',
            indicative_price: profile.pricing?.visitingCharge || profile.pricing?.baseRate || 250,
            pricing_type: profile.pricing?.pricingModel || 'visit_fee',
            is_available: !profile.isPaused && profile.isPublished,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        if (sbErr) {
          console.warn('[MarketplaceService] Supabase service profile upsert notice:', sbErr);
        }
      }
    } catch (err) {
      console.warn('[MarketplaceService] Supabase service profile error:', err);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/marketplace/service-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const saved = await res.json();
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(saved));
      return saved;
    }
  } catch {
    // fallback
  }

  localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function getMyLocalServiceProfile(): ServiceProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

// -------------------------------------------------------------------------
// 3. BOOKINGS & BOOKING LIFECYCLES (WITH CONFLICTS)
// -------------------------------------------------------------------------

export async function submitBookingRequest(payload: {
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
  locality: string;
  exactAddress?: string;
  supportingImages?: string[];
  additionalNotes?: string;
  indicativePrice?: number;
}): Promise<BookingRequest> {
  // Direct Supabase PostgreSQL insert when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        await ensureUserProfile(user);
        const { error: sbErr } = await supabase
          .from('service_bookings')
          .insert({
            customer_id: user.id,
            worker_id: payload.workerId,
            customer_name: payload.customerName,
            customer_phone: payload.customerPhone || '',
            customer_address: payload.exactAddress || payload.locality || 'Pune',
            service_trade: payload.workerTrade || payload.serviceCategory || 'General Service',
            service_description: payload.taskDescription,
            booking_date: payload.preferredDate,
            time_slot: payload.preferredTimeSlot,
            status: 'pending',
            estimated_price: payload.indicativePrice || null,
          });

        if (sbErr) {
          console.warn('[MarketplaceService] Supabase booking insert notice:', sbErr);
        }
      }
    } catch (err) {
      console.warn('[MarketplaceService] Supabase booking error:', err);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/marketplace/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const b = await res.json();
      saveLocalBooking(b);
      return b;
    }
  } catch {
    // fallback
  }

  const now = new Date().toISOString();
  const b: BookingRequest = {
    id: `SRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    ...payload,
    status: 'requested',
    statusHistory: [
      {
        status: 'requested',
        timestamp: now,
        byRole: 'customer',
        note: 'Service booking request submitted by customer.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  saveLocalBooking(b);
  return b;
}

export async function fetchBookings(params: {
  workerId?: string;
  customerId?: string;
}): Promise<BookingRequest[]> {
  // Direct Supabase PostgreSQL query when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        const { data: rows, error: sbErr } = await supabase
          .from('service_bookings')
          .select('*')
          .or(`worker_id.eq.${user.id},customer_id.eq.${user.id}`)
          .order('booking_date', { ascending: false });

        if (!sbErr && rows && rows.length > 0) {
          const mapped: BookingRequest[] = rows.map((r: any) => ({
            id: r.id,
            workerId: r.worker_id,
            workerName: 'Verified Service Provider',
            workerTrade: r.service_trade,
            customerId: r.customer_id || '',
            customerName: r.customer_name,
            customerPhone: r.customer_phone,
            serviceCategory: r.service_trade,
            taskDescription: r.service_description,
            preferredDate: r.booking_date,
            preferredTimeSlot: r.time_slot,
            locality: r.customer_address,
            exactAddress: r.customer_address,
            indicativePrice: r.estimated_price ? Number(r.estimated_price) : 250,
            status:
              r.status === 'confirmed'
                ? 'confirmed'
                : r.status === 'completed'
                ? 'completed'
                : r.status === 'cancelled'
                ? 'cancelled'
                : 'requested',
            statusHistory: [
              {
                status: r.status as any,
                timestamp: r.created_at || new Date().toISOString(),
                byRole: 'customer',
                note: 'Recorded in Supabase cloud.',
              },
            ],
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
          }));
          localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[MarketplaceService] Supabase fetch bookings notice:', err);
    }
  }

  try {
    const q = new URLSearchParams();
    if (params.workerId) q.append('worker_id', params.workerId);
    if (params.customerId) q.append('customer_id', params.customerId);

    const res = await fetch(`${BASE_URL}/marketplace/bookings?${q.toString()}`);
    if (res.ok) {
      const list = await res.json();
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(list));
      return list;
    }
  } catch {
    // fallback
  }

  return getLocalBookings(params);
}

export async function actOnBooking(
  bookingId: string,
  action: 'accept' | 'decline' | 'reject' | 'propose_time' | 'confirm_proposed' | 'complete' | 'cancel' | 'in_progress',
  options?: {
    proposedDate?: string;
    proposedTimeSlot?: string;
    note?: string;
    role?: 'worker' | 'customer';
  }
): Promise<BookingRequest> {
  // Direct Supabase PostgreSQL update when authenticated
  if (supabase && isSupabaseConfigured) {
    try {
      const user = await getActiveUser();
      if (user) {
        let dbStatus = 'pending';
        if (action === 'accept') dbStatus = 'confirmed';
        else if (action === 'decline' || action === 'reject' || action === 'cancel') dbStatus = 'cancelled';
        else if (action === 'complete') dbStatus = 'completed';
        else if (action === 'propose_time') dbStatus = 'proposed';

        await supabase
          .from('service_bookings')
          .update({
            status: dbStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId);
      }
    } catch (err) {
      console.warn('[MarketplaceService] Supabase actOnBooking notice:', err);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/marketplace/bookings/${bookingId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        proposedDate: options?.proposedDate,
        proposedTimeSlot: options?.proposedTimeSlot,
        note: options?.note,
        role: options?.role || 'worker',
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      saveLocalBooking(updated);
      return updated;
    }

    if (res.status === 409) {
      const err = await res.json();
      throw new Error(err.detail || 'Scheduling Conflict: Worker already has a confirmed booking for this slot.');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Scheduling Conflict')) {
      throw err;
    }
    // fallback
  }

  const existing = getLocalBookings({});
  const b = existing.find((item) => item.id === bookingId);
  if (!b) throw new Error('Booking not found');

  const now = new Date().toISOString();
  if (action === 'accept') {
    b.status = 'confirmed';
    b.statusHistory.push({
      status: 'confirmed',
      timestamp: now,
      byRole: options?.role || 'worker',
      note: options?.note || 'Booking confirmed by service provider.',
    });
  } else if (action === 'decline' || action === 'reject') {
    b.status = 'rejected';
    b.statusHistory.push({
      status: 'rejected',
      timestamp: now,
      byRole: options?.role || 'worker',
      note: options?.note || 'Rejected by service provider.',
    });
  } else if (action === 'in_progress') {
    b.status = 'in_progress';
    b.statusHistory.push({
      status: 'in_progress',
      timestamp: now,
      byRole: options?.role || 'worker',
      note: options?.note || 'Worker started service job.',
    });
  } else if (action === 'propose_time') {
    b.status = 'alternative_time_proposed';
    b.proposedDate = options?.proposedDate;
    b.proposedTimeSlot = options?.proposedTimeSlot;
    b.statusHistory.push({
      status: 'alternative_time_proposed',
      timestamp: now,
      byRole: 'worker',
      note: options?.note || `Worker proposed new time: ${options?.proposedDate} (${options?.proposedTimeSlot})`,
    });
  } else if (action === 'confirm_proposed') {
    b.status = 'confirmed';
    if (b.proposedDate) b.preferredDate = b.proposedDate;
    if (b.proposedTimeSlot) b.preferredTimeSlot = b.proposedTimeSlot;
    b.statusHistory.push({
      status: 'confirmed',
      timestamp: now,
      byRole: 'customer',
      note: 'Customer agreed to the alternative time.',
    });
  } else if (action === 'complete') {
    b.status = 'completed';
    b.statusHistory.push({
      status: 'completed',
      timestamp: now,
      byRole: options?.role || 'worker',
      note: options?.note || 'Service completed.',
    });
  } else if (action === 'cancel') {
    b.status = 'cancelled';
    b.statusHistory.push({
      status: 'cancelled',
      timestamp: now,
      byRole: options?.role || 'worker',
      note: options?.note || 'Booking cancelled.',
    });
  }

  b.updatedAt = now;
  saveLocalBooking(b);
  return b;
}

// -------------------------------------------------------------------------
// 4. MESSAGING
// -------------------------------------------------------------------------

export async function fetchConversation(contextId: string): Promise<Conversation> {
  try {
    const res = await fetch(`${BASE_URL}/marketplace/conversations/${encodeURIComponent(contextId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem(`${LOCAL_STORAGE_CONVERSATIONS_KEY}_${contextId}`);
  if (raw) return JSON.parse(raw);

  return {
    contextId,
    contextType: contextId.startsWith('SRV') ? 'booking' : 'application',
    summaryTitle: 'Direct Conversation',
    summarySubtitle: 'Secure Setu Messenger',
    status: 'active',
    participants: [],
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function sendMessage(
  contextId: string,
  payload: {
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'worker' | 'applicant' | 'employer';
    text: string;
  }
): Promise<MarketplaceMessage> {
  try {
    const res = await fetch(`${BASE_URL}/marketplace/conversations/${encodeURIComponent(contextId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  const conv = await fetchConversation(contextId);
  const newMsg: MarketplaceMessage = {
    id: `msg-${Math.floor(1000 + Math.random() * 9000)}`,
    contextId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    text: payload.text,
    timestamp: new Date().toISOString(),
  };

  conv.messages.push(newMsg);
  conv.updatedAt = newMsg.timestamp;
  localStorage.setItem(`${LOCAL_STORAGE_CONVERSATIONS_KEY}_${contextId}`, JSON.stringify(conv));
  return newMsg;
}

// -------------------------------------------------------------------------
// 5. ACTIVITY OVERVIEW
// -------------------------------------------------------------------------

export async function fetchActivitySummary(userId: string): Promise<ActivitySummary> {
  try {
    const res = await fetch(`${BASE_URL}/marketplace/activity-summary?user_id=${encodeURIComponent(userId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  const apps = getLocalApplications(userId);
  const incoming = getLocalBookings({ workerId: userId }).filter((b) =>
    ['requested', 'awaiting_worker_response', 'alternative_time_proposed'].includes(b.status)
  );
  const myBookings = getLocalBookings({}).filter(
    (b) =>
      (b.customerId === userId || b.workerId === userId) &&
      ['confirmed', 'in_progress'].includes(b.status)
  );
  const completed = getLocalBookings({}).filter(
    (b) => (b.customerId === userId || b.workerId === userId) && b.status === 'completed'
  );

  return {
    applicationsCount: apps.length,
    incomingRequestsCount: incoming.length,
    confirmedBookingsCount: myBookings.length,
    completedWorkCount: completed.length,
    latestApplications: apps.slice(0, 3),
    latestIncomingRequests: incoming.slice(0, 3),
    latestBookings: myBookings.slice(0, 3),
  };
}

// -------------------------------------------------------------------------
// LOCAL FALLBACK DATA & HELPERS
// -------------------------------------------------------------------------

function getLocalDefaultJobs(filters?: any): JobListing[] {
  const all: JobListing[] = [
    {
      id: 'job-del-01',
      title: 'Quick Delivery Partner (Two-Wheeler)',
      employer: 'Swiggy Express Fleet',
      category: 'delivery',
      description:
        'Deliver grocery, meal, and retail packages within a 4 km zone. Weekly payout, flexible shifts, and platform accident insurance coverage.',
      location: 'Kothrud & Deccan, Pune',
      serviceArea: 'Pune West Zone',
      distance: '1.8 km',
      workType: 'shift_based',
      compensation: {
        amount: 450,
        maxAmount: 750,
        unit: 'per_day',
        isEstimate: true,
        materialsExtra: false,
      },
      schedule: 'Flexible 4 or 8-hour shifts (Morning / Evening / Peak dinner)',
      requirements: ['Valid driving license', 'Two-wheeler with insurance', 'Smartphone with GPS'],
      skills: ['Two-wheeler riding', 'GPS Navigation', 'Customer Communication'],
      deadline: '2026-11-15',
      verificationStatus: 'verified_platform',
      safetyInfo: 'Includes standard 24/7 emergency SOS and accidental medical cover up to ₹2 Lakhs.',
      contactChannel: {
        type: 'platform_apply',
        value: 'delivery.support@swiggy.in',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-16T10:00:00Z',
    },
    {
      id: 'job-elec-02',
      title: 'Residential Maintenance Electrician',
      employer: 'Shree Ganesh Housing Society Co-op',
      category: 'electrician',
      description:
        'Handle routine electrical maintenance, meter panel troubleshooting, and household inverter repairs for a 120-flat community.',
      location: 'Bavdhan, Pune',
      serviceArea: 'Bavdhan / Pashan',
      distance: '3.2 km',
      workType: 'part_time',
      compensation: {
        amount: 14000,
        maxAmount: 18000,
        unit: 'per_month',
        isEstimate: false,
        materialsExtra: true,
      },
      schedule: 'Monday to Saturday, 9:00 AM – 1:30 PM',
      requirements: ['Wireman license or ITI Electrician certificate', 'Minimum 2 years experience in 3-phase wiring'],
      skills: ['MCB repair', 'Inverter wiring', 'Safety grounding', 'Pump panel check'],
      deadline: '2026-10-31',
      verificationStatus: 'community_posted',
      safetyInfo: 'All high-voltage works require dual-man safety protocol. Gloves & multimeter provided.',
      contactChannel: {
        type: 'platform_apply',
        value: 'society.committee@shreeganesh.org',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-15T08:30:00Z',
    },
    {
      id: 'job-ware-03',
      title: 'Inventory Sorter & Packing Associate',
      employer: 'BlueDart E-Commerce Hub',
      category: 'warehouse',
      description:
        'Barcode scanning, sorting incoming parcels by pincode, and safe pallet loading in modern climate-monitored distribution hub.',
      location: 'Hingewadi Phase 2, Pune',
      serviceArea: 'Hingewadi MIDC',
      distance: '6.5 km',
      workType: 'full_time',
      compensation: {
        amount: 550,
        maxAmount: 650,
        unit: 'per_day',
        isEstimate: false,
        materialsExtra: false,
      },
      schedule: 'Fixed 8-hour shift with tea breaks and attendance incentive',
      requirements: ['Basic numerical literacy', 'Ability to lift up to 15 kg boxes', 'Punctuality'],
      skills: ['Barcode scanning', 'Inventory packing', 'Dispatch verification'],
      deadline: '2026-11-20',
      verificationStatus: 'verified_platform',
      safetyInfo: 'Safety steel-toe shoes provided on site. Free company pick-and-drop bus from Katraj & Swargate.',
      contactChannel: {
        type: 'platform_apply',
        value: 'hubjobs.pune@bluedart.com',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-17T12:00:00Z',
    },
    {
      id: 'job-clean-04',
      title: 'Commercial Office Deep Cleaning Specialist',
      employer: 'CleanSpace Facility Services',
      category: 'cleaning',
      description:
        'Floor scrubbing, glass cleaning, and sanitization of modern co-working premises. High-grade mechanical vacuum and polishing machines used.',
      location: 'Shivaji Nagar, Pune',
      serviceArea: 'Central Pune',
      distance: '4.1 km',
      workType: 'task_based',
      compensation: {
        amount: 800,
        maxAmount: 1200,
        unit: 'per_task',
        isEstimate: true,
        materialsExtra: false,
      },
      schedule: 'Early morning or weekend contract slots (flexible bookings)',
      requirements: ['Prior housekeeping or deep-cleaning experience', 'Reliable transport'],
      skills: ['Vacuum operation', 'Glass cleaning', 'Floor scrubbing', 'Safe chemical handling'],
      deadline: '2026-11-10',
      verificationStatus: 'demo_listing',
      safetyInfo: 'Full protective aprons, face shields, and rubber gloves supplied.',
      contactChannel: {
        type: 'platform_apply',
        value: 'support@cleanspace.co.in',
        verified: false,
      },
      isDemo: true,
      postedAt: '2026-10-18T06:00:00Z',
    },
    {
      id: 'job-tail-05',
      title: 'Boutique Alteration & Stitching Master',
      employer: 'Ananya Designer Boutique',
      category: 'tailor',
      description:
        'Blouse cutting, fall-pico, kurti alterations, and custom garment fitting. Clean, well-lit studio with modern electric sewing machines.',
      location: 'Karve Nagar, Pune',
      serviceArea: 'Karve Road / Warje',
      distance: '2.9 km',
      workType: 'full_time',
      compensation: {
        amount: 16000,
        maxAmount: 22000,
        unit: 'per_month',
        isEstimate: false,
        materialsExtra: false,
      },
      schedule: '10:30 AM – 7:30 PM (Sunday Half Day)',
      requirements: ['Minimum 3 years tailoring experience', 'Expertise in bridal blouse fitting and measurements'],
      skills: ['Garment cutting', 'Interlocking machine', 'Embroidery attachment', 'Fitting alterations'],
      deadline: '2026-11-05',
      verificationStatus: 'community_posted',
      safetyInfo: 'Ergonomic seating and well-ventilated workshop.',
      contactChannel: {
        type: 'platform_apply',
        value: 'ananya.boutique@gmail.com',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-14T09:15:00Z',
    },
    {
      id: 'job-drv-06',
      title: 'Commercial Auto & Cab Driver',
      employer: 'City Mobility Fleet Partner',
      category: 'driving',
      description:
        'Drive passenger auto rickshaw or commercial fleet cab across central city routes. Handle daily UPI earnings, guaranteed minimum fare incentive, and vehicle maintenance allowance.',
      location: 'Swargate & Deccan, Pune',
      serviceArea: 'Central Pune & Camp',
      distance: '2.1 km',
      workType: 'full_time',
      compensation: {
        amount: 650,
        maxAmount: 1100,
        unit: 'per_day',
        isEstimate: true,
        materialsExtra: false,
      },
      schedule: 'Flexible 8-hour shift (Morning or Evening Peak)',
      requirements: ['Valid commercial driving badge or commercial license', 'Punctuality and clean traffic record'],
      skills: ['Commercial driving', 'Route navigation', 'Customer interaction', 'UPI payment handling'],
      deadline: '2026-11-25',
      verificationStatus: 'verified_platform',
      safetyInfo: 'Vehicle equipped with emergency SOS button and 24x7 roadside breakdown towing.',
      contactChannel: {
        type: 'platform_apply',
        value: 'fleet.driver@citymobility.in',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-17T08:00:00Z',
    },
    {
      id: 'job-plumb-07',
      title: 'Plumbing & Water Motor Technician',
      employer: 'JalSeva Rapid Home Services',
      category: 'plumbing',
      description:
        'Attend on-demand residential repair calls: water pump motor installation, concealed pipe leakages, bathroom sanitary fittings, and overhead tank float valve replacements.',
      location: 'Kothrud & Karve Nagar, Pune',
      serviceArea: 'Pune West & South',
      distance: '2.7 km',
      workType: 'task_based',
      compensation: {
        amount: 600,
        maxAmount: 1200,
        unit: 'per_task',
        isEstimate: true,
        materialsExtra: true,
      },
      schedule: 'Flexible task-based assignments dispatched through Setu service network',
      requirements: ['Minimum 2 years experience in CPVC/GI pipe joints', 'Own basic plumbing tool kit'],
      skills: ['Pipe jointing', 'Leakage detection', 'Sanitary installation', 'Motor pump wiring check'],
      deadline: '2026-11-30',
      verificationStatus: 'community_posted',
      safetyInfo: 'Safety glasses and anti-slip protective footwear required during pipe cutting.',
      contactChannel: {
        type: 'platform_apply',
        value: 'support@jalsevaservices.com',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-16T14:20:00Z',
    },
    {
      id: 'job-cook-08',
      title: 'Healthy Home Cook & Meal Maker',
      employer: 'Annapurna Daily Meal Network',
      category: 'cooking',
      description:
        'Prepare authentic North Indian or Maharashtrian vegetarian meals (roti, dal, sabzi, rice) for private residential households and small co-living accommodations.',
      location: 'Baner & Aundh, Pune',
      serviceArea: 'Baner / Aundh / Pashan',
      distance: '4.8 km',
      workType: 'part_time',
      compensation: {
        amount: 12000,
        maxAmount: 16000,
        unit: 'per_month',
        isEstimate: false,
        materialsExtra: false,
      },
      schedule: 'Morning slot (7:00 AM – 10:30 AM) or Evening slot (6:30 PM – 9:00 PM)',
      requirements: ['High standard of kitchen cleanliness and hygiene', 'Experience in fresh chapati & seasonal cooking'],
      skills: ['North Indian cuisine', 'Maharashtrian cuisine', 'Kitchen hygiene', 'Time management'],
      deadline: '2026-11-18',
      verificationStatus: 'community_posted',
      safetyInfo: 'Cookware and LPG connection checked for standard household safety standards.',
      contactChannel: {
        type: 'platform_apply',
        value: 'meals@annapurnanetwork.in',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-15T11:00:00Z',
    },
    {
      id: 'job-tech-09',
      title: 'Smartphone & Hardware Repair Technician',
      employer: 'QuickFix Multi-Brand Tech Hub',
      category: 'technician',
      description:
        'Diagnose and repair smartphones, tablets, and mobile accessories: display glass touch replacement, battery replacement, charging port desoldering, and basic software flashing.',
      location: 'FC Road & Deccan, Pune',
      serviceArea: 'Central Pune & Shivajinagar',
      distance: '1.5 km',
      workType: 'full_time',
      compensation: {
        amount: 18000,
        maxAmount: 24000,
        unit: 'per_month',
        isEstimate: false,
        materialsExtra: false,
      },
      schedule: '11:00 AM – 8:30 PM (Tuesday Weekly Off)',
      requirements: ['Certificate in Mobile Hardware Repair or 1+ year store experience', 'SMD rework station familiarity'],
      skills: ['Screen replacement', 'SMD soldering', 'Charging port repair', 'Hardware troubleshooting'],
      deadline: '2026-11-28',
      verificationStatus: 'verified_platform',
      safetyInfo: 'Anti-static wristbands, fume extractors, and ESD safety mats provided on all repair benches.',
      contactChannel: {
        type: 'platform_apply',
        value: 'hiring@quickfixtech.in',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-17T16:45:00Z',
    },
    {
      id: 'job-paint-10',
      title: 'Interior Wall Painter & Surface Finisher',
      employer: 'Beautiful Homes Project Partner',
      category: 'painting',
      description:
        'Surface putty smoothing, primer coating, roll painting, and texture wall design for residential apartments and renovation projects. Material supplied by contractor.',
      location: 'Viman Nagar & Kharadi, Pune',
      serviceArea: 'East Pune Zone',
      distance: '7.8 km',
      workType: 'task_based',
      compensation: {
        amount: 750,
        maxAmount: 1300,
        unit: 'per_day',
        isEstimate: true,
        materialsExtra: false,
      },
      schedule: 'Contract shifts (9:00 AM – 6:00 PM), daily wage payout with site lunch provided',
      requirements: ['Prior wall painting experience with roller and brush', 'Punctuality and surface prep care'],
      skills: ['Wall putty smoothing', 'Primer application', 'Roller painting', 'Surface tape masking'],
      deadline: '2026-11-22',
      verificationStatus: 'community_posted',
      safetyInfo: 'Dust respirators, scaffolding safety harnesses, and paint overalls provided on site.',
      contactChannel: {
        type: 'platform_apply',
        value: 'projects@beautifulhomespune.com',
        verified: true,
      },
      isDemo: false,
      postedAt: '2026-10-18T07:15:00Z',
    },
  ];

  if (!filters) return all;
  return all.filter((j) => {
    if (filters.category && filters.category !== 'all' && j.category !== filters.category) return false;
    if (filters.workType && filters.workType !== 'all' && j.workType !== filters.workType) return false;
    if (filters.city && filters.city !== 'all' && !j.location.toLowerCase().includes(filters.city.toLowerCase()))
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const text = `${j.title} ${j.employer} ${j.description} ${j.skills.join(' ')}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

function getLocalDefaultServiceProfiles(filters?: any): ServiceProfile[] {
  const all: ServiceProfile[] = [
    {
      id: 'sp-ramesh-elec',
      userId: 'usr-ramesh-77',
      displayName: 'Ramesh Shinde',
      trade: 'electrician',
      skills: ['House Wiring', 'Inverter Fitting', 'Short Circuit Repair', 'Ceiling Fan & Geyser'],
      shortDescription:
        'Certified wireman with 9 years of trusted residential service across Kothrud. Prompt arrival, transparent pricing, and quality guaranteed.',
      yearsOfExperience: 9,
      serviceCategories: ['electrician', 'appliance_repair'],
      approximateServiceArea: 'Kothrud, Karve Nagar & Deccan, Pune',
      serviceRadiusKm: 7,
      languages: ['Marathi', 'Hindi', 'Basic English'],
      qualifications: ['ITI Wireman License #MH-PUN-8841', 'Govt. Vocational Certificate'],
      pricing: {
        type: 'visit_fee',
        indicativePrice: 250,
        maxPrice: 450,
        description: '₹250 initial visit and diagnostic fee. Repair charges estimated honestly upfront before starting work.',
        materialsExtra: true,
      },
      availability: {
        workingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        timeSlots: ['09:00 - 13:00', '14:00 - 18:00'],
        unavailableDates: [],
      },
      completedJobsCount: 47,
      rating: 4.9,
      reviewsCount: 42,
      isPublished: true,
      isPaused: false,
      verificationStatus: 'verified_trade',
      updatedAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 'sp-sunita-tailor',
      userId: 'usr-sunita-42',
      displayName: 'Sunita Kamble',
      trade: 'tailor',
      skills: ['Blouse Stitching', 'Kurti Fitting', 'School Uniforms', 'Fall-Pico', 'Curtain Hemming'],
      shortDescription:
        'Master tailor with 12 years experience. Doorstep pickup & delivery available for custom women tailoring and quick alterations.',
      yearsOfExperience: 12,
      serviceCategories: ['tailor'],
      approximateServiceArea: 'Aundh, Baner & Pashan, Pune',
      serviceRadiusKm: 8,
      languages: ['Marathi', 'Hindi'],
      qualifications: ['Diploma in Fashion & Garment Making'],
      pricing: {
        type: 'per_task',
        indicativePrice: 350,
        maxPrice: 900,
        description: 'Simple blouse from ₹350, lining blouse ₹550. Fast 48-hr delivery.',
        materialsExtra: false,
      },
      availability: {
        workingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        timeSlots: ['10:00 - 14:00', '16:00 - 20:00'],
        unavailableDates: [],
      },
      completedJobsCount: 63,
      rating: 4.8,
      reviewsCount: 58,
      isPublished: true,
      isPaused: false,
      verificationStatus: 'verified_trade',
      updatedAt: '2026-10-17T14:30:00Z',
    },
    {
      id: 'sp-vikram-plumber',
      userId: 'usr-vikram-19',
      displayName: 'Vikram Jadhav',
      trade: 'plumber',
      skills: ['Tap & Valve Replacement', 'Bathroom Leakage Fix', 'Water Tank Cleaning', 'Basin & Commode Fitting'],
      shortDescription:
        'Quick response plumbing expert. Carries standard CPVC fittings, washers, and sealant for 1-visit resolution.',
      yearsOfExperience: 6,
      serviceCategories: ['plumber'],
      approximateServiceArea: 'Hadapsar, Magarpatta & Fatima Nagar, Pune',
      serviceRadiusKm: 10,
      languages: ['Hindi', 'Marathi'],
      qualifications: ['Plumbing Apprentice Certificate - MSME'],
      pricing: {
        type: 'visit_fee',
        indicativePrice: 200,
        maxPrice: 400,
        description: '₹200 inspection fee. Fixed fair rate card for valve/pipe replacements.',
        materialsExtra: true,
      },
      availability: {
        workingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        timeSlots: ['08:30 - 12:30', '13:30 - 17:30'],
        unavailableDates: [],
      },
      completedJobsCount: 38,
      rating: 4.7,
      reviewsCount: 34,
      isPublished: true,
      isPaused: false,
      verificationStatus: 'verified_trade',
      updatedAt: '2026-10-18T08:00:00Z',
    },
    {
      id: 'sp-anil-mechanic',
      userId: 'usr-anil-63',
      displayName: 'Anil Rathod',
      trade: 'mechanic',
      skills: ['Two-Wheeler Servicing', 'Puncture Repair', 'Engine Oil Change', 'Brake & Clutch Tuning', 'Roadside Assistance'],
      shortDescription:
        'Mobile two-wheeler mechanic. Ready with mobile kit for roadside breakdown or doorstep servicing within 5 km.',
      yearsOfExperience: 8,
      serviceCategories: ['mechanic'],
      approximateServiceArea: 'Warje, Vadgaon & Sinhagad Road, Pune',
      serviceRadiusKm: 6,
      languages: ['Hindi', 'Marathi'],
      qualifications: ['Automobile ITI Mechanic'],
      pricing: {
        type: 'per_task',
        indicativePrice: 300,
        maxPrice: 850,
        description: 'General doorstep service ₹300 (oil & parts extra at MRP). Roadside puncture ₹120.',
        materialsExtra: true,
      },
      availability: {
        workingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        timeSlots: ['09:00 - 13:00', '14:00 - 19:00'],
        unavailableDates: [],
      },
      completedJobsCount: 51,
      rating: 4.9,
      reviewsCount: 49,
      isPublished: true,
      isPaused: false,
      verificationStatus: 'demo_profile',
      updatedAt: '2026-10-16T11:00:00Z',
    },
  ];

  if (!filters) return all;
  return all.filter((p) => {
    if (filters.trade && filters.trade !== 'all' && p.trade !== filters.trade && !p.serviceCategories.includes(filters.trade))
      return false;
    if (filters.locality && filters.locality !== 'all' && !p.approximateServiceArea.toLowerCase().includes(filters.locality.toLowerCase()))
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const text = `${p.displayName} ${p.trade} ${p.shortDescription} ${p.skills.join(' ')} ${p.approximateServiceArea}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

function getLocalApplications(applicantId?: string): JobApplication[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    if (!raw) return [];
    const parsed: JobApplication[] = JSON.parse(raw);
    if (applicantId) {
      return parsed.filter((a) => a.applicantId === applicantId);
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalApplication(app: JobApplication): void {
  try {
    const apps = getLocalApplications();
    const idx = apps.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      apps[idx] = app;
    } else {
      apps.unshift(app);
    }
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('marketplace_applications_changed'));
    }
  } catch (err) {
    console.error('Failed to save local application:', err);
  }
}

const FALLBACK_BOOKINGS: BookingRequest[] = [
  {
    id: 'SRV-2026-DES1',
    workerId: 'usr-ramesh-kumar',
    workerName: 'Ramesh Kumar',
    workerTrade: 'electrician',
    customerId: 'cust-sunita-01',
    customerName: 'Sunita Deshmukh',
    customerPhone: '+91 98221 43210',
    serviceCategory: 'Electrician',
    taskDescription:
      'Main switchboard MCB tripping repeatedly when geyser and washing machine run together. Need load check and loose wire inspection.',
    preferredDate: 'Tomorrow',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    alternativeTimeSlot: '01:00 PM - 02:30 PM',
    proposedDate: null,
    proposedTimeSlot: null,
    locality: 'Ideal Colony, Kothrud, Pune',
    exactAddress: 'Flat 402, Shanti Heights, Lane 4, Ideal Colony, Kothrud',
    lat: 18.5085,
    lng: 73.812,
    distance: '1.2 km',
    supportingImages: [],
    additionalNotes: 'Please bring clip-on ammeter and 32A MCB replacement if needed.',
    indicativePrice: 350,
    priceNote: 'Diagnostic inspection & MCB load balancing',
    status: 'requested',
    statusHistory: [
      {
        status: 'requested',
        timestamp: '2026-10-18T09:30:00Z',
        byRole: 'customer',
        note: 'Service booking request submitted by Sunita Deshmukh.',
      },
    ],
    createdAt: '2026-10-18T09:30:00Z',
    updatedAt: '2026-10-18T09:30:00Z',
  },
  {
    id: 'SRV-2026-KUL2',
    workerId: 'usr-ramesh-kumar',
    workerName: 'Ramesh Kumar',
    workerTrade: 'electrician',
    customerId: 'cust-anand-02',
    customerName: 'Anand Kulkarni',
    customerPhone: '+91 97640 12890',
    serviceCategory: 'Electrician',
    taskDescription:
      'New ceiling fan hanging and wall-mount speed regulator installation in study room.',
    preferredDate: 'Day After Tomorrow',
    preferredTimeSlot: '03:00 PM - 05:00 PM',
    alternativeTimeSlot: '05:30 PM - 07:00 PM',
    proposedDate: null,
    proposedTimeSlot: null,
    locality: 'Paud Road, Kothrud, Pune',
    exactAddress: 'Bunglow 12, Vanaz Corner, Paud Road, Kothrud',
    lat: 18.5042,
    lng: 73.8065,
    distance: '2.4 km',
    supportingImages: [],
    additionalNotes: 'Fan box and down-rod are ready at home.',
    indicativePrice: 250,
    priceNote: 'Standard fan fitting fee',
    status: 'requested',
    statusHistory: [
      {
        status: 'requested',
        timestamp: '2026-10-18T10:15:00Z',
        byRole: 'customer',
        note: 'Service booking request submitted by Anand Kulkarni.',
      },
    ],
    createdAt: '2026-10-18T10:15:00Z',
    updatedAt: '2026-10-18T10:15:00Z',
  },
  {
    id: 'SRV-2026-PRY3',
    workerId: 'usr-ramesh-kumar',
    workerName: 'Ramesh Kumar',
    workerTrade: 'electrician',
    customerId: 'cust-priya-14',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98901 22334',
    serviceCategory: 'Electrician',
    taskDescription:
      'Kitchen 16A power socket installation for dishwasher and microwave with proper earthing.',
    preferredDate: 'Today',
    preferredTimeSlot: '02:00 PM - 04:00 PM',
    alternativeTimeSlot: '',
    proposedDate: null,
    proposedTimeSlot: null,
    locality: 'Dahanukar Colony, Kothrud, Pune',
    exactAddress: 'Row House 7, Nisarg Meadows, Dahanukar Colony, Kothrud',
    lat: 18.4975,
    lng: 73.8155,
    distance: '2.1 km',
    supportingImages: [],
    additionalNotes: 'Please inspect MCB rating and earth-pit connection.',
    indicativePrice: 300,
    priceNote: 'Heavy-appliance socket fitting',
    status: 'confirmed',
    statusHistory: [
      {
        status: 'requested',
        timestamp: '2026-10-17T14:00:00Z',
        byRole: 'customer',
        note: 'Booking requested.',
      },
      {
        status: 'confirmed',
        timestamp: '2026-10-17T15:10:00Z',
        byRole: 'worker',
        note: 'Accepted by service provider Ramesh Kumar.',
      },
    ],
    createdAt: '2026-10-17T14:00:00Z',
    updatedAt: '2026-10-17T15:10:00Z',
  },
  {
    id: 'SRV-2026-JOS4',
    workerId: 'usr-ramesh-kumar',
    workerName: 'Ramesh Kumar',
    workerTrade: 'electrician',
    customerId: 'cust-mahesh-04',
    customerName: 'Mahesh Joshi',
    customerPhone: '+91 98233 77112',
    serviceCategory: 'Electrician',
    taskDescription:
      'Sub-meter wiring check and distribution box cleanup. Work commenced.',
    preferredDate: 'Today',
    preferredTimeSlot: '11:00 AM - 01:00 PM',
    alternativeTimeSlot: '',
    proposedDate: null,
    proposedTimeSlot: null,
    locality: 'Karve Nagar, Pune',
    exactAddress: 'Flat 201, Swapnapurti Apts, Cummins College Road, Karve Nagar',
    lat: 18.4912,
    lng: 73.8214,
    distance: '1.8 km',
    supportingImages: [],
    additionalNotes: 'Work in progress at customer premises.',
    indicativePrice: 400,
    priceNote: 'Sub-meter line wiring',
    status: 'in_progress',
    statusHistory: [
      {
        status: 'requested',
        timestamp: '2026-10-17T16:00:00Z',
        byRole: 'customer',
        note: 'Booking requested.',
      },
      {
        status: 'confirmed',
        timestamp: '2026-10-17T16:40:00Z',
        byRole: 'worker',
        note: 'Booking confirmed.',
      },
      {
        status: 'in_progress',
        timestamp: '2026-10-18T05:30:00Z',
        byRole: 'worker',
        note: 'Worker commenced work on site.',
      },
    ],
    createdAt: '2026-10-17T16:00:00Z',
    updatedAt: '2026-10-18T05:30:00Z',
  },
  {
    id: 'SRV-2026-AMT5',
    workerId: 'usr-ramesh-kumar',
    workerName: 'Ramesh Kumar',
    workerTrade: 'electrician',
    customerId: 'cust-amit-21',
    customerName: 'Amit Verma',
    customerPhone: '+91 97654 33221',
    serviceCategory: 'Electrician',
    taskDescription:
      'Inverter tubular battery backup wiring inspection and terminal cleanup.',
    preferredDate: 'Tomorrow',
    preferredTimeSlot: '11:00 AM - 01:00 PM',
    alternativeTimeSlot: '',
    proposedDate: 'Tomorrow',
    proposedTimeSlot: '04:00 PM - 06:00 PM',
    locality: 'Bavdhan, Pune',
    exactAddress: 'B-404, Crystal Heights, Bavdhan',
    lat: 18.514,
    lng: 73.778,
    distance: '3.8 km',
    supportingImages: [],
    additionalNotes: 'Needs alternative time confirmation.',
    indicativePrice: 350,
    priceNote: 'Battery wiring check',
    status: 'alternative_time_proposed',
    statusHistory: [
      {
        status: 'requested',
        timestamp: '2026-10-18T08:00:00Z',
        byRole: 'customer',
        note: 'Booking submitted.',
      },
      {
        status: 'alternative_time_proposed',
        timestamp: '2026-10-18T08:45:00Z',
        byRole: 'worker',
        note: 'Worker proposed alternative slot 04:00 PM - 06:00 PM.',
      },
    ],
    createdAt: '2026-10-18T08:00:00Z',
    updatedAt: '2026-10-18T08:45:00Z',
  },
  {
    id: 'SRV-2026-CMP6',
    workerId: 'usr-ramesh-kumar',
    workerName: 'Ramesh Kumar',
    workerTrade: 'electrician',
    customerId: 'cust-sneha-06',
    customerName: 'Sneha Gaikwad',
    customerPhone: '+91 99212 90876',
    serviceCategory: 'Electrician',
    taskDescription:
      'Living room LED cove lights strip replacement and 3-gang switchboard repair.',
    preferredDate: 'Yesterday',
    preferredTimeSlot: '01:00 PM - 03:00 PM',
    alternativeTimeSlot: '',
    proposedDate: null,
    proposedTimeSlot: null,
    locality: 'Mayur Colony, Kothrud, Pune',
    exactAddress: 'Flat 102, Shreeram Complex, Mayur Colony, Kothrud',
    lat: 18.5065,
    lng: 73.8132,
    distance: '0.9 km',
    supportingImages: [],
    additionalNotes: 'Job finished and tested. 5-star customer feedback received.',
    indicativePrice: 450,
    priceNote: 'LED lighting and switchboard repair',
    status: 'completed',
    statusHistory: [
      {
        status: 'requested',
        timestamp: '2026-10-16T10:00:00Z',
        byRole: 'customer',
        note: 'Booking submitted.',
      },
      {
        status: 'confirmed',
        timestamp: '2026-10-16T11:00:00Z',
        byRole: 'worker',
        note: 'Booking confirmed.',
      },
      {
        status: 'completed',
        timestamp: '2026-10-17T15:30:00Z',
        byRole: 'worker',
        note: 'Job completed satisfactorily by Ramesh Kumar. Payment settled.',
      },
    ],
    createdAt: '2026-10-16T10:00:00Z',
    updatedAt: '2026-10-17T15:30:00Z',
  },
];

function getLocalBookings(params: { workerId?: string; customerId?: string }): BookingRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    let parsed: BookingRequest[] = raw ? JSON.parse(raw) : [...FALLBACK_BOOKINGS];
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(FALLBACK_BOOKINGS));
    } else {
      let updated = false;
      for (const fb of FALLBACK_BOOKINGS) {
        if (!parsed.some((b) => b.id === fb.id)) {
          parsed.push(fb);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(parsed));
      }
    }
    return parsed.filter((b) => {
      if (params.workerId && b.workerId !== params.workerId && b.workerId !== 'usr-ramesh-kumar' && b.workerId)
        return false;
      if (params.customerId && b.customerId !== params.customerId) return false;
      return true;
    });
  } catch {
    return FALLBACK_BOOKINGS;
  }
}

function saveLocalBooking(booking: BookingRequest): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    const bookings: BookingRequest[] = raw ? JSON.parse(raw) : [];
    const idx = bookings.findIndex((b) => b.id === booking.id);
    if (idx >= 0) {
      bookings[idx] = booking;
    } else {
      bookings.unshift(booking);
    }
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('marketplace_bookings_changed'));
    }
  } catch (err) {
    console.error('Failed to save local booking:', err);
  }
}
