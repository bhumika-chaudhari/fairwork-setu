import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import { useProfile } from '../../hooks/ProfileContext';
import {
  fetchMyApplications,
  withdrawJobApplication,
  updateApplicationStatusEmployer,
  fetchBookings,
  actOnBooking,
} from '../../services/marketplaceService';
import type {
  JobApplication,
  JobApplicationStatus,
  BookingRequest,
  BookingStatus,
} from '../../types/marketplace';
import ConversationModal from './ConversationModal';
import ModalPortal from '../ModalPortal';

interface MyActivityDashboardProps {
  onDiscoverJobsClick?: () => void;
  onDiscoverServicesClick?: () => void;
}

type ActivityTab = 'applications' | 'incoming' | 'bookings' | 'completed';

const APP_STATUS_CONFIG: Record<
  JobApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-[#EFF7F8]',
    text: 'text-[#3A757D]',
    border: 'border-[#3A757D]/30',
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  interview_requested: {
    label: 'Interview Requested',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  accepted: {
    label: 'Offer Accepted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  not_selected: {
    label: 'Not Selected',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: 'bg-stone-100',
    text: 'text-stone-500',
    border: 'border-stone-200',
  },
};

const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  requested: {
    label: 'New Request',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  pending: {
    label: 'Pending Response',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  awaiting_worker_response: {
    label: 'Awaiting Provider',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  alternative_time_proposed: {
    label: 'New Time Proposed',
    bg: 'bg-[#FEF7EC]',
    text: 'text-[#7C2D16]',
    border: 'border-[#F1B96B]',
  },
  awaiting_customer_confirmation: {
    label: 'Awaiting Customer',
    bg: 'bg-[#FEF7EC]',
    text: 'text-[#7C2D16]',
    border: 'border-[#F1B96B]',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
  },
  declined: {
    label: 'Declined',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
  },
};

export default function MyActivityDashboard({
  onDiscoverJobsClick,
  onDiscoverServicesClick,
}: MyActivityDashboardProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const [activeTab, setActiveTab] = useState<ActivityTab>('applications');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [activeChatContext, setActiveChatContext] = useState<{
    id: string;
    type: 'booking' | 'application';
    title: string;
    subtitle: string;
  } | null>(null);

  const [appToWithdraw, setAppToWithdraw] = useState<JobApplication | null>(null);
  const [proposeTimeModalBooking, setProposeTimeModalBooking] = useState<BookingRequest | null>(null);
  const [proposedNewDate, setProposedNewDate] = useState('');
  const [proposedNewSlot, setProposedNewSlot] = useState('14:00 - 18:00');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const userId =
    'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apps, bList] = await Promise.all([
        fetchMyApplications(userId),
        fetchBookings({ workerId: userId, customerId: userId }),
      ]);
      setApplications(apps);
      setBookings(bList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleAppsChanged = () => loadData();
    const handleBookingsChanged = () => loadData();
    window.addEventListener('marketplace_applications_changed', handleAppsChanged);
    window.addEventListener('marketplace_bookings_changed', handleBookingsChanged);
    return () => {
      window.removeEventListener('marketplace_applications_changed', handleAppsChanged);
      window.removeEventListener('marketplace_bookings_changed', handleBookingsChanged);
    };
  }, [userId]);

  // Categorize bookings
  const incomingRequests = bookings.filter(
    (b) =>
      b.workerId === userId &&
      ['requested', 'awaiting_worker_response', 'alternative_time_proposed'].includes(b.status)
  );

  const confirmedBookings = bookings.filter((b) =>
    ['confirmed', 'in_progress'].includes(b.status)
  );

  const completedBookings = bookings.filter((b) => b.status === 'completed');

  // Handle Application Withdrawal
  const handleConfirmWithdraw = async () => {
    if (!appToWithdraw) return;
    try {
      await withdrawJobApplication(appToWithdraw.id);
      setAppToWithdraw(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Booking Actions
  const handleAcceptBooking = async (bookingId: string) => {
    setConflictError(null);
    try {
      await actOnBooking(bookingId, 'accept', { role: 'worker' });
      await loadData();
    } catch (err: any) {
      setConflictError(err.message || 'Unable to accept booking due to a scheduling conflict.');
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await actOnBooking(bookingId, 'decline', { role: 'worker' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProposeTime = async () => {
    if (!proposeTimeModalBooking) return;
    try {
      await actOnBooking(proposeTimeModalBooking.id, 'propose_time', {
        proposedDate: proposedNewDate,
        proposedTimeSlot: proposedNewSlot,
        role: 'worker',
      });
      setProposeTimeModalBooking(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmAlternative = async (bookingId: string) => {
    try {
      await actOnBooking(bookingId, 'confirm_proposed', { role: 'customer' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await actOnBooking(bookingId, 'complete', { role: 'worker' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Test simulation for employer review
  const handleSimulateStatus = async (appId: string, status: string) => {
    await updateApplicationStatusEmployer(appId, status, `Simulated employer response: ${status}`);
    await loadData();
  };

  return (
    <div className="space-y-5">
      {/* Dashboard Sub-navigation Tabs with Real Count Badges */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2B3E] font-serif">
            My Activity Dashboard
          </h2>
          <p className="text-xs text-[#231F20]/70 mt-0.5">
            Real-time tracking of your job applications, incoming customer service requests, and active bookings.
          </p>
        </div>
      </div>

      {conflictError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold flex items-start gap-2 shadow-sm">
          <AppIcon name="shield-alert" size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="block font-bold">Scheduling Conflict Detected</span>
            <span className="font-normal">{conflictError}</span>
          </div>
          <button
            onClick={() => setConflictError(null)}
            className="text-stone-400 hover:text-stone-600"
          >
            <AppIcon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Segmented Sub-Tabs */}
      <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto p-1 rounded-2xl bg-white border border-[#F4EBDD] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'applications'
              ? 'bg-[#B34A26] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#1E2B3E]'
          }`}
        >
          <AppIcon name="briefcase" size={14} />
          <span>My Applications</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'applications' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {applications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'incoming'
              ? 'bg-[#B34A26] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#1E2B3E]'
          }`}
        >
          <AppIcon name="construct-outline" size={14} />
          <span>Incoming Requests</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'incoming' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {incomingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-[#B34A26] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#1E2B3E]'
          }`}
        >
          <AppIcon name="calendar" size={14} />
          <span>Confirmed Bookings</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'bookings' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {confirmedBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-[#B34A26] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#1E2B3E]'
          }`}
        >
          <AppIcon name="file-check" size={14} />
          <span>Completed Work</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'completed' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {completedBookings.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. MY APPLICATIONS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                <AppIcon name="briefcase" size={24} />
              </div>
              <h3 className="text-base font-bold text-[#1E2B3E]">You haven't applied for any jobs yet</h3>
              <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                Browse open delivery partner, residential maintenance, and skilled trade openings in the Discover tab and apply in 1 tap with your Setu profile.
              </p>
              {onDiscoverJobsClick && (
                <button
                  type="button"
                  onClick={onDiscoverJobsClick}
                  className="px-5 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm"
                >
                  Discover Open Jobs
                </button>
              )}
            </div>
          ) : (
            applications.map((app) => {
              const statusCfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.submitted;
              return (
                <div
                  key={app.id}
                  className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
                >
                  {/* Top Bar: Title, Employer, Status, Reference */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#B34A26] bg-[#FDF8F0] px-2 py-0.5 rounded border border-[#F1B96B]/50">
                          {app.id}
                        </span>
                        <span className="text-xs font-semibold text-[#7C2D16]">
                          {app.employer}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1E2B3E] mt-1">
                        {app.jobTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Visual Status Progression Timeline */}
                  <div className="pt-2 pb-1 border-y border-[#F4EBDD]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                      Application Progress
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                      <div
                        className={`py-1 rounded-lg ${
                          ['submitted', 'in_review', 'shortlisted', 'accepted'].includes(app.status)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        1. Submitted
                      </div>
                      <div
                        className={`py-1 rounded-lg ${
                          ['in_review', 'shortlisted', 'accepted'].includes(app.status)
                            ? 'bg-[#3A757D] text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        2. In Review
                      </div>
                      <div
                        className={`py-1 rounded-lg ${
                          ['shortlisted', 'accepted'].includes(app.status)
                            ? 'bg-purple-600 text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        3. Shortlisted
                      </div>
                      <div
                        className={`py-1 rounded-lg ${
                          app.status === 'accepted'
                            ? 'bg-emerald-700 text-white'
                            : app.status === 'not_selected'
                            ? 'bg-red-600 text-white'
                            : app.status === 'withdrawn'
                            ? 'bg-stone-400 text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {app.status === 'not_selected' ? 'Declined' : app.status === 'withdrawn' ? 'Withdrawn' : '4. Decision'}
                      </div>
                    </div>
                  </div>

                  {/* Next Action Banner */}
                  <div className="p-3 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/40 text-xs text-[#231F20] flex items-start gap-2">
                    <AppIcon name="info" size={15} className="text-[#B34A26] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#7C2D16]">Next Action: </span>
                      <span>{app.nextAction || 'Awaiting employer update.'}</span>
                    </div>
                  </div>

                  {/* Dates & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-stone-500">
                      Applied on {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Open Chat */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveChatContext({
                            id: app.id,
                            type: 'application',
                            title: `Application for ${app.jobTitle}`,
                            subtitle: `Employer: ${app.employer}`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-[#1E2B3E] font-bold text-xs flex items-center gap-1.5"
                      >
                        <AppIcon name="message-circle" size={14} />
                        <span>Chat with Recruiter</span>
                      </button>

                      {/* Withdraw Action */}
                      {app.status !== 'withdrawn' && app.status !== 'accepted' && (
                        <button
                          type="button"
                          onClick={() => setAppToWithdraw(app)}
                          className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-red-600 text-xs font-semibold"
                        >
                          Withdraw
                        </button>
                      )}

                      {/* Simulation tool for demonstration/testing */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleSimulateStatus(app.id, e.target.value);
                        }}
                        defaultValue=""
                        className="text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded-lg border border-stone-200 cursor-pointer"
                        title="Simulate employer webhook action"
                      >
                        <option value="" disabled>Simulate Status</option>
                        <option value="in_review">In Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="accepted">Accepted / Offer</option>
                        <option value="not_selected">Not Selected</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. INCOMING REQUESTS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                <AppIcon name="construct-outline" size={24} />
              </div>
              <h3 className="text-base font-bold text-[#1E2B3E]">No new booking requests</h3>
              <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                When customers in your neighborhood request an electrician, plumbing, tailoring, or cleaning service from your profile, requests will appear here for your review and acceptance.
              </p>
            </div>
          ) : (
            incomingRequests.map((b) => {
              const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.requested;
              return (
                <div
                  key={b.id}
                  className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#B34A26] bg-[#FDF8F0] px-2 py-0.5 rounded border border-[#F1B96B]/50">
                          {b.id}
                        </span>
                        <span className="text-xs font-bold text-[#7C2D16] capitalize">
                          {b.serviceCategory}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1E2B3E] mt-1">
                        {b.customerName}
                      </h4>
                      <p className="text-xs text-stone-500">{b.locality}</p>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/40 text-xs text-[#231F20] space-y-1">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Problem Description</span>
                    <p className="font-medium">{b.taskDescription}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs border-y border-[#F4EBDD] py-2">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Preferred Slot</span>
                      <span className="font-bold text-[#1E2B3E]">{b.preferredDate} ({b.preferredTimeSlot})</span>
                    </div>
                    {b.proposedDate && (
                      <div>
                        <span className="text-stone-400 block text-[10px]">Proposed Alternative</span>
                        <span className="font-bold text-[#B34A26]">{b.proposedDate} ({b.proposedTimeSlot})</span>
                      </div>
                    )}
                    <div>
                      <span className="text-stone-400 block text-[10px]">Visit Fee</span>
                      <span className="font-bold text-[#7C2D16]">{formatInr(b.indicativePrice || 250)}</span>
                    </div>
                  </div>

                  {/* Worker Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveChatContext({
                          id: b.id,
                          type: 'booking',
                          title: `Booking: ${b.customerName}`,
                          subtitle: `${b.serviceCategory} • ${b.preferredDate} (${b.preferredTimeSlot})`,
                        })
                      }
                      className="px-3.5 py-2 rounded-xl border border-[#F4EBDD] text-xs font-bold text-[#1E2B3E] hover:bg-stone-50 flex items-center gap-1.5"
                    >
                      <AppIcon name="message-circle" size={14} />
                      <span>Ask a Question</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeclineBooking(b.id)}
                        className="px-3 py-2 rounded-xl text-stone-500 hover:text-red-600 text-xs font-semibold"
                      >
                        Decline
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProposeTimeModalBooking(b);
                          setProposedNewDate(b.preferredDate);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-[#F1B96B] bg-[#FDF8F0] text-[#7C2D16] hover:bg-[#F1B96B]/20 text-xs font-bold"
                      >
                        Suggest Other Time
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAcceptBooking(b.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
                      >
                        Accept Request
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CONFIRMED BOOKINGS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {confirmedBookings.length === 0 ? (
            <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                <AppIcon name="calendar" size={24} />
              </div>
              <h3 className="text-base font-bold text-[#1E2B3E]">You don't have any confirmed bookings yet</h3>
              <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                Accepted service requests and confirmed appointments will be organized here with exact addresses and direct messenger access.
              </p>
            </div>
          ) : (
            confirmedBookings.map((b) => {
              const isWorker = b.workerId === userId;
              return (
                <div
                  key={b.id}
                  className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          {b.id}
                        </span>
                        <span className="text-xs font-bold text-emerald-800">
                          Confirmed Booking
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1E2B3E] mt-1">
                        {isWorker ? `Service for ${b.customerName}` : `${b.workerName} (${b.workerTrade})`}
                      </h4>
                      <p className="text-xs text-stone-500">{b.exactAddress || b.locality}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block">Agreed Date</span>
                      <span className="text-xs font-bold text-[#1E2B3E]">{b.preferredDate}</span>
                      <span className="text-[11px] text-stone-600 block">{b.preferredTimeSlot}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    "{b.taskDescription}"
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F4EBDD]">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveChatContext({
                          id: b.id,
                          type: 'booking',
                          title: `Booking: ${isWorker ? b.customerName : b.workerName}`,
                          subtitle: `${b.preferredDate} (${b.preferredTimeSlot}) • ${b.locality}`,
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <AppIcon name="message-circle" size={14} />
                      <span>Open Direct Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCompleteBooking(b.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <AppIcon name="checkmark-circle" size={14} />
                      <span>Mark Work Completed</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. COMPLETED WORK TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedBookings.length === 0 ? (
            <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                <AppIcon name="file-check" size={24} />
              </div>
              <h3 className="text-base font-bold text-[#1E2B3E]">No completed jobs recorded yet</h3>
              <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                When you finish a service booking and mark it complete, your genuine completed-work history and client ratings will be tracked here.
              </p>
            </div>
          ) : (
            completedBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B34A26]">
                      {b.id}
                    </span>
                    <h4 className="text-base font-bold text-[#1E2B3E]">
                      {b.serviceCategory.toUpperCase()} Service Completed
                    </h4>
                    <p className="text-xs text-stone-500">
                      Client: {b.customerName} • {b.locality}
                    </p>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Completed
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F4EBDD]">
                  <span className="text-stone-500">
                    Concluded on {new Date(b.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="font-bold text-[#7C2D16]">
                    Settled Amount: {formatInr(b.indicativePrice || 250)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Propose Other Time Modal */}
      <ModalPortal
        isOpen={!!proposeTimeModalBooking}
        onClose={() => setProposeTimeModalBooking(null)}
        maxWidthClass="sm:max-w-md"
      >
        {proposeTimeModalBooking && (
          <>
            {/* Pinned Header */}
            <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-[#1E2B3E]">Suggest Alternative Time</h4>
                <p className="text-xs text-stone-500">Booking {proposeTimeModalBooking.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setProposeTimeModalBooking(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">Proposed Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={proposedNewDate}
                  onChange={(e) => setProposedNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] text-xs bg-white text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">Proposed Time Slot</label>
                <select
                  value={proposedNewSlot}
                  onChange={(e) => setProposedNewSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] text-xs bg-white text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                >
                  <option value="09:00 - 13:00">09:00 - 13:00 (Morning)</option>
                  <option value="14:00 - 18:00">14:00 - 18:00 (Afternoon)</option>
                  <option value="18:00 - 21:00">18:00 - 21:00 (Evening)</option>
                </select>
              </div>
            </div>

            {/* Pinned Action Footer */}
            <div className="shrink-0 px-6 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProposeTimeModalBooking(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProposeTime}
                className="px-5 py-2 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                Send Proposal to Customer
              </button>
            </div>
          </>
        )}
      </ModalPortal>

      {/* Withdraw Application Confirmation Modal */}
      <ModalPortal
        isOpen={!!appToWithdraw}
        onClose={() => setAppToWithdraw(null)}
        maxWidthClass="sm:max-w-sm"
      >
        {appToWithdraw && (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AppIcon name="trash" size={22} />
            </div>
            <h4 className="text-base font-bold text-[#1E2B3E]">Withdraw Application?</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to withdraw your application for <strong>{appToWithdraw.jobTitle}</strong>? You can reapply later if the listing remains open.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAppToWithdraw(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
              >
                Keep Application
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all"
              >
                Yes, Withdraw
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Conversation Messenger Modal */}
      {activeChatContext && (
        <ConversationModal
          contextId={activeChatContext.id}
          contextType={activeChatContext.type}
          summaryTitle={activeChatContext.title}
          summarySubtitle={activeChatContext.subtitle}
          onClose={() => setActiveChatContext(null)}
        />
      )}
    </div>
  );
}
