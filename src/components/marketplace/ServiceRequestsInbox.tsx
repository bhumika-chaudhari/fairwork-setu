import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import type { BookingRequest, BookingStatus } from '../../types/marketplace';
import {
  fetchBookings,
  actOnBooking,
  submitBookingRequest,
} from '../../services/marketplaceService';
import ConversationModal from './ConversationModal';
import ModalPortal from '../ModalPortal';

interface ServiceRequestsInboxProps {
  workerId: string;
  workerTrade?: string;
  workerName?: string;
}

type SubTab = 'all' | 'pending' | 'confirmed' | 'proposed' | 'completed';

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  requested: {
    label: 'Pending Response',
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
    label: 'Pending Response',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  alternative_time_proposed: {
    label: 'Alternative Time Proposed',
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
    label: 'Confirmed Booking',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-[#EFF7F8]',
    text: 'text-[#1E2B3E]',
    border: 'border-[#3A757D]/40',
  },
  completed: {
    label: 'Completed Work',
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  declined: {
    label: 'Rejected',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-stone-100',
    text: 'text-stone-500',
    border: 'border-stone-300',
  },
};

export default function ServiceRequestsInbox({
  workerId,
  workerTrade = 'electrician',
  workerName = 'Ramesh Kumar',
}: ServiceRequestsInboxProps) {
  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('all');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals state
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<BookingRequest | null>(null);
  const [proposingTimeForBooking, setProposingTimeForBooking] = useState<BookingRequest | null>(null);
  const [proposedDateInput, setProposedDateInput] = useState('');
  const [proposedSlotInput, setProposedSlotInput] = useState('02:00 PM - 04:00 PM');
  const [proposedNoteInput, setProposedNoteInput] = useState('');

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Simulator state
  const [simCustomerName, setSimCustomerName] = useState('Rahul S.');
  const [simTask, setSimTask] = useState('Ceiling fan not working. Fan motor makes humming sound.');
  const [simDate, setSimDate] = useState('Tomorrow');
  const [simSlot, setSimSlot] = useState('10:00 AM');
  const [simLocality, setSimLocality] = useState('Mayur Colony, Kothrud, Pune');

  // Load bookings
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchBookings({ workerId });
      setBookings(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workerId]);

  // Counts
  const counts = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let proposed = 0;
    let completed = 0;

    bookings.forEach((b) => {
      if (b.status === 'requested' || b.status === 'pending' || b.status === 'awaiting_worker_response') {
        pending++;
      } else if (b.status === 'confirmed' || b.status === 'in_progress') {
        confirmed++;
      } else if (b.status === 'alternative_time_proposed' || b.status === 'awaiting_customer_confirmation') {
        proposed++;
      } else if (b.status === 'completed') {
        completed++;
      }
    });

    return { total: bookings.length, pending, confirmed, proposed, completed };
  }, [bookings]);

  // Filtered List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeSubTab === 'pending') {
        return b.status === 'requested' || b.status === 'pending' || b.status === 'awaiting_worker_response';
      }
      if (activeSubTab === 'confirmed') {
        return b.status === 'confirmed' || b.status === 'in_progress';
      }
      if (activeSubTab === 'proposed') {
        return b.status === 'alternative_time_proposed' || b.status === 'awaiting_customer_confirmation';
      }
      if (activeSubTab === 'completed') {
        return b.status === 'completed';
      }
      return true;
    });
  }, [bookings, activeSubTab]);

  // Worker Action Handlers
  const handleAccept = async (booking: BookingRequest) => {
    setActionError(null);
    try {
      const updated = await actOnBooking(booking.id, 'accept', {
        role: 'worker',
        note: `Accepted by ${workerName}. Scheduled for ${booking.preferredDate} (${booking.preferredTimeSlot}).`,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (selectedBookingForDetail?.id === updated.id) {
        setSelectedBookingForDetail(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept booking. Check for schedule conflicts.');
    }
  };

  const handleReject = async (booking: BookingRequest) => {
    setActionError(null);
    const reason = prompt('Please enter reason for rejecting (optional):', 'Currently booked for another commitment');
    if (reason === null) return; // user cancelled prompt

    try {
      const updated = await actOnBooking(booking.id, 'reject', {
        role: 'worker',
        note: reason || 'Service provider is unavailable for requested slot.',
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (selectedBookingForDetail?.id === updated.id) {
        setSelectedBookingForDetail(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject booking.');
    }
  };

  const handleOpenProposeTime = (booking: BookingRequest) => {
    setProposingTimeForBooking(booking);
    setProposedDateInput(booking.preferredDate || 'Tomorrow');
    setProposedSlotInput('02:00 PM - 04:00 PM');
    setProposedNoteInput('I have another job in the morning. Can I come between 2 PM and 4 PM?');
  };

  const handleSubmitProposeTime = async () => {
    if (!proposingTimeForBooking) return;
    setActionError(null);

    try {
      const updated = await actOnBooking(proposingTimeForBooking.id, 'propose_time', {
        proposedDate: proposedDateInput,
        proposedTimeSlot: proposedSlotInput,
        note: proposedNoteInput,
        role: 'worker',
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setProposingTimeForBooking(null);
      if (selectedBookingForDetail?.id === updated.id) {
        setSelectedBookingForDetail(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to propose alternative time.');
    }
  };

  const handleCustomerConfirmProposed = async (booking: BookingRequest) => {
    setActionError(null);
    try {
      const updated = await actOnBooking(booking.id, 'confirm_proposed', {
        role: 'customer',
        note: `Customer ${booking.customerName} agreed to alternative slot: ${booking.proposedDate} (${booking.proposedTimeSlot}).`,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (selectedBookingForDetail?.id === updated.id) {
        setSelectedBookingForDetail(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm proposed time.');
    }
  };

  const handleStartJob = async (booking: BookingRequest) => {
    try {
      const updated = await actOnBooking(booking.id, 'in_progress', {
        role: 'worker',
        note: `Work commenced by ${workerName}.`,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (selectedBookingForDetail?.id === updated.id) {
        setSelectedBookingForDetail(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update job status.');
    }
  };

  const handleCompleteJob = async (booking: BookingRequest) => {
    if (!confirm('Mark this service booking as successfully completed?')) return;
    try {
      const updated = await actOnBooking(booking.id, 'complete', {
        role: 'worker',
        note: `Job completed satisfactorily by ${workerName}. Payment settled.`,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (selectedBookingForDetail?.id === updated.id) {
        setSelectedBookingForDetail(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete job.');
    }
  };

  // Simulate new customer request
  const handleSimulateNewCustomerRequest = async () => {
    try {
      const newReq = await submitBookingRequest({
        workerId,
        workerName,
        workerTrade,
        customerId: `cust-${Date.now().toString().slice(-4)}`,
        customerName: simCustomerName,
        customerPhone: '+91 98220 54321',
        serviceCategory: workerTrade.charAt(0).toUpperCase() + workerTrade.slice(1),
        taskDescription: simTask,
        preferredDate: simDate,
        preferredTimeSlot: simSlot,
        locality: simLocality,
        exactAddress: `Flat 401, Galaxy Enclave, ${simLocality}`,
        indicativePrice: 250,
      });

      setBookings((prev) => [newReq, ...prev]);
      setIsSimulateModalOpen(false);
      setActiveSubTab('pending');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Controls: Status & Simulator CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#F4EBDD] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#1E2B3E]">
            {workerTrade.toUpperCase()} INBOX • {counts.pending} PENDING REQUEST{counts.pending !== 1 ? 'S' : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsSimulateModalOpen(true)}
          className="py-1.5 px-3 rounded-xl bg-[#FDF8F0] border border-[#F1B96B] text-[#B34A26] text-xs font-bold hover:bg-[#FDF3EE] transition-all active:scale-95 shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <AppIcon name="sparkles" size={13} className="text-[#E5953E]" />
          <span>+ Simulate Request</span>
        </button>
      </div>

      {/* Error Alert if any action conflicts */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-900 flex items-start justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AppIcon name="alert-triangle" size={16} className="text-red-600 shrink-0" />
            <span className="font-bold">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <nav
        aria-label="Service Requests Filter"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'all'
              ? 'bg-[#1E2B3E] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span>All Requests</span>
          <span className="text-[10px] opacity-80">({counts.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pending')}
          className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'pending'
              ? 'bg-[#B34A26] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          {counts.pending > 0 && <span className="h-2 w-2 rounded-full bg-amber-400" />}
          <span>Pending Response</span>
          <span className="text-[10px] opacity-80">({counts.pending})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('confirmed')}
          className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'confirmed'
              ? 'bg-[#3A757D] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span>Confirmed Bookings</span>
          <span className="text-[10px] opacity-80">({counts.confirmed})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('proposed')}
          className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'proposed'
              ? 'bg-[#E5953E] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span>Alternative Proposed</span>
          <span className="text-[10px] opacity-80">({counts.proposed})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('completed')}
          className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span>Completed</span>
          <span className="text-[10px] opacity-80">({counts.completed})</span>
        </button>
      </nav>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B34A26] border-t-transparent" />
            <span>Loading incoming service requests...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-14 text-center rounded-3xl bg-white border border-[#F4EBDD] p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-[#B34A26] mx-auto mb-3">
              <AppIcon name="clock" size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#1E2B3E]">No service requests in this view</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {activeSubTab === 'pending'
                ? 'Great job! You have responded to all incoming customer requests.'
                : 'Customer service bookings for your profile will appear here.'}
            </p>
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="mt-3 py-2 px-4 rounded-xl bg-stone-100 text-[#B34A26] hover:bg-stone-200 text-xs font-bold inline-flex items-center gap-1"
            >
              <span>Simulate Customer Request (e.g. from Rahul S.)</span>
            </button>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusMeta = STATUS_CONFIG[booking.status] || STATUS_CONFIG.requested;
            const isPending =
              booking.status === 'requested' ||
              booking.status === 'pending' ||
              booking.status === 'awaiting_worker_response';
            const isConfirmed = booking.status === 'confirmed' || booking.status === 'in_progress';
            const isProposed =
              booking.status === 'alternative_time_proposed' ||
              booking.status === 'awaiting_customer_confirmation';

            return (
              <div
                key={booking.id}
                className="rounded-3xl border border-[#F4EBDD] bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
              >
                {/* Header: Customer Info & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E2B3E] to-[#3A757D] text-white font-extrabold text-sm shadow-xs">
                      {booking.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-extrabold text-[#1E2B3E] truncate">
                          Customer: {booking.customerName}
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Verified Customer
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Booking Ref: <strong className="text-stone-700">{booking.id}</strong> • Requested {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border} shrink-0`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {/* Service & Issue Details */}
                <div className="p-3.5 rounded-2xl bg-[#FDF8F0]/80 border border-[#F4EBDD] space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="font-extrabold text-[#B34A26] flex items-center gap-1.5">
                      <AppIcon name="flash-outline" size={14} />
                      <span>Service: {booking.serviceCategory}</span>
                    </span>

                    <span className="font-black text-[#1E2B3E] bg-white px-2.5 py-0.5 rounded-lg border border-stone-200 shadow-xs">
                      Indicative Fee: {formatInr(booking.indicativePrice || 250)}
                    </span>
                  </div>

                  <p className="text-xs text-[#231F20] font-semibold leading-relaxed">
                    Issue: <span className="font-normal text-stone-700">{booking.taskDescription}</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-200/60">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <AppIcon name="calendar" size={14} className="text-[#3A757D] shrink-0" />
                      <span>
                        Requested: <strong>{booking.preferredDate}</strong> ({booking.preferredTimeSlot})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-stone-600">
                      <AppIcon name="location-outline" size={14} className="text-[#B34A26] shrink-0" />
                      <span className="truncate">
                        Location: <strong>{booking.locality}</strong> {booking.distance ? `(${booking.distance})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Proposed Alternative Time Display */}
                  {isProposed && booking.proposedDate && (
                    <div className="p-2.5 rounded-xl bg-[#FEF7EC] border border-[#F1B96B] text-xs text-[#7C2D16] flex items-start justify-between gap-2 shadow-xs">
                      <div>
                        <span className="font-extrabold block">Alternative Slot Proposed by You:</span>
                        <span>
                          {booking.proposedDate} at <strong>{booking.proposedTimeSlot}</strong>
                        </span>
                        <p className="text-[11px] text-[#7C2D16]/80 mt-0.5">
                          Awaiting customer acceptance.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCustomerConfirmProposed(booking)}
                        className="py-1 px-2.5 rounded-lg bg-[#E5953E] hover:bg-[#D5852E] text-white font-bold text-[11px] shrink-0 shadow-xs active:scale-95 transition-all"
                        title="Simulate customer clicking Accept on their phone"
                      >
                        ✓ Customer Confirms
                      </button>
                    </div>
                  )}

                  {/* Confirmed Booking Location Details & Directions */}
                  {isConfirmed && booking.exactAddress && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-900">
                          Customer Doorstep Address:
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            booking.exactAddress + ', ' + booking.locality
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#3A757D] hover:underline flex items-center gap-1"
                        >
                          <AppIcon name="navigation" size={12} />
                          <span>Google Maps Directions</span>
                        </a>
                      </div>
                      <p className="font-medium text-emerald-900">
                        {booking.exactAddress}
                      </p>
                    </div>
                  )}
                </div>

                {/* MAP & LOCATION SNIPPET PREVIEW */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* SVG Map Graphic */}
                    <div className="relative h-14 w-20 rounded-xl bg-emerald-100/60 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {/* Grid road lines */}
                      <svg viewBox="0 0 80 50" className="w-full h-full opacity-60">
                        <line x1="0" y1="20" x2="80" y2="20" stroke="#CBD5E1" strokeWidth="4" />
                        <line x1="40" y1="0" x2="40" y2="50" stroke="#CBD5E1" strokeWidth="4" />
                        <line x1="10" y1="40" x2="70" y2="10" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3,3" />
                      </svg>
                      {/* Customer Pin */}
                      <div className="absolute flex flex-col items-center top-2 left-6">
                        <div className="h-5 w-5 rounded-full bg-[#B34A26] text-white flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white animate-bounce">
                          📍
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                        Customer Service Area:
                      </span>
                      <p className="text-xs font-bold text-[#1E2B3E] truncate">
                        {booking.locality}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Estimated distance: <strong className="text-[#B34A26]">{booking.distance || '1.4 km'}</strong> from your location
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        booking.locality
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-[#1E2B3E] text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <AppIcon name="navigation" size={13} />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>

                {/* WORKER ACTION BUTTONS BAR */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForDetail(booking)}
                      className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                    >
                      View Request
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveConversationId(booking.id)}
                      className="py-2 px-3 rounded-xl bg-[#3A757D]/10 hover:bg-[#3A757D]/20 text-[#3A757D] text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <AppIcon name="message-circle" size={14} />
                      <span>Chat with {booking.customerName}</span>
                    </button>
                  </div>

                  {/* Actions for PENDING status */}
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(booking)}
                        className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-600 text-xs font-bold transition-all"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenProposeTime(booking)}
                        className="py-2 px-3 rounded-xl bg-[#FDF8F0] hover:bg-[#FDF3EE] text-[#7C2D16] text-xs font-bold transition-all border border-[#F1B96B]"
                      >
                        Propose Another Time
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(booking)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                      >
                        Accept Request
                      </button>
                    </div>
                  )}

                  {/* Actions for CONFIRMED status */}
                  {isConfirmed && (
                    <div className="flex items-center gap-2">
                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleStartJob(booking)}
                          className="py-2 px-3.5 rounded-xl bg-[#3A757D] hover:bg-[#2A5960] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                        >
                          Start Job
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCompleteJob(booking)}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <AppIcon name="checkmark-circle" size={14} />
                        <span>Mark as Completed</span>
                      </button>
                    </div>
                  )}

                  {/* When status is Completed */}
                  {booking.status === 'completed' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <AppIcon name="checkmark-circle" size={14} />
                      <span>Service Delivered & Verified</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PROPOSE ALTERNATIVE TIME MODAL */}
      <ModalPortal
        isOpen={!!proposingTimeForBooking}
        onClose={() => setProposingTimeForBooking(null)}
        maxWidthClass="sm:max-w-md"
      >
        {proposingTimeForBooking && (
          <>
            {/* Pinned Header */}
            <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#7C2D16]">
                  Suggest Alternative Slot
                </span>
                <h4 className="text-base font-extrabold text-[#1E2B3E]">
                  Propose Time to {proposingTimeForBooking.customerName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setProposingTimeForBooking(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
              <p className="text-xs text-stone-600">
                Customer requested: <strong>{proposingTimeForBooking.preferredDate}</strong> ({proposingTimeForBooking.preferredTimeSlot}). Propose another slot when you are free:
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1">
                  Proposed Date:
                </label>
                <input
                  type="text"
                  value={proposedDateInput}
                  onChange={(e) => setProposedDateInput(e.target.value)}
                  placeholder="e.g. Tomorrow or 2026-10-19"
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1">
                  Proposed Time Slot:
                </label>
                <select
                  value={proposedSlotInput}
                  onChange={(e) => setProposedSlotInput(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                  <option value="11:30 AM - 01:30 PM">11:30 AM - 01:30 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                  <option value="04:30 PM - 06:30 PM">04:30 PM - 06:30 PM (Evening)</option>
                  <option value="07:00 PM - 09:00 PM">07:00 PM - 09:00 PM (Late slot)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1">
                  Note to Customer:
                </label>
                <textarea
                  rows={2}
                  value={proposedNoteInput}
                  onChange={(e) => setProposedNoteInput(e.target.value)}
                  placeholder="Explain why this slot works better for you..."
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>
            </div>

            {/* Pinned Action Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex gap-2">
              <button
                type="button"
                onClick={() => setProposingTimeForBooking(null)}
                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitProposeTime}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                Send Proposal to Customer
              </button>
            </div>
          </>
        )}
      </ModalPortal>

      {/* VIEW FULL REQUEST DETAIL MODAL */}
      <ModalPortal
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        maxWidthClass="sm:max-w-lg"
      >
        {selectedBookingForDetail && (
          <>
            {/* Pinned Header */}
            <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#B34A26]">
                  Service Request Record • {selectedBookingForDetail.id}
                </span>
                <h4 className="text-base font-extrabold text-[#1E2B3E] mt-0.5">
                  Customer: {selectedBookingForDetail.customerName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetail(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Scrollable Details Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 text-xs text-stone-700">
              <p>
                <strong>Service Required:</strong> {selectedBookingForDetail.serviceCategory}
              </p>
              <p>
                <strong>Task Description:</strong> {selectedBookingForDetail.taskDescription}
              </p>
              <p>
                <strong>Customer Contact:</strong>{' '}
                {selectedBookingForDetail.status === 'confirmed' || selectedBookingForDetail.status === 'in_progress' ? (
                  <a
                    href={`tel:${selectedBookingForDetail.customerPhone}`}
                    className="text-[#B34A26] font-bold underline"
                  >
                    {selectedBookingForDetail.customerPhone || '+91 98220 54321'}
                  </a>
                ) : (
                  <span className="text-stone-400 italic">Shared upon confirmation</span>
                )}
              </p>
              <p>
                <strong>Service Location:</strong> {selectedBookingForDetail.locality}
              </p>
              {selectedBookingForDetail.exactAddress && (
                <p>
                  <strong>Exact Doorstep Address:</strong> {selectedBookingForDetail.exactAddress}
                </p>
              )}
              <p>
                <strong>Requested Schedule:</strong> {selectedBookingForDetail.preferredDate} ({selectedBookingForDetail.preferredTimeSlot})
              </p>
              {selectedBookingForDetail.additionalNotes && (
                <p>
                  <strong>Customer Instructions:</strong> {selectedBookingForDetail.additionalNotes}
                </p>
              )}

              {/* Status History Timeline */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 mt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                  Booking Activity History:
                </span>
                {selectedBookingForDetail.statusHistory.map((h, i) => (
                  <div key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                    <span className="text-stone-400">•</span>
                    <span>
                      <strong>{h.status.replace('_', ' ').toUpperCase()}</strong> ({new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}): {h.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0]">
              <button
                type="button"
                onClick={() => setSelectedBookingForDetail(null)}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </>
        )}
      </ModalPortal>

      {/* SIMULATE CUSTOMER REQUEST MODAL */}
      <ModalPortal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        maxWidthClass="sm:max-w-md"
      >
        {/* Pinned Header */}
        <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#B34A26]">
              Testing & Simulation Tool
            </span>
            <h4 className="text-base font-extrabold text-[#1E2B3E]">
              Simulate New Customer Request
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsSimulateModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            aria-label="Close"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3.5 text-xs">
          <p className="text-stone-600 leading-relaxed">
            This simulates a customer (like Rahul S.) discovering your electrician profile and submitting a doorstep booking request for your review.
          </p>

          <div>
            <label className="block font-bold text-[#1E2B3E] mb-1">Customer Name:</label>
            <input
              type="text"
              value={simCustomerName}
              onChange={(e) => setSimCustomerName(e.target.value)}
              className="w-full rounded-xl border border-stone-300 p-2 text-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E2B3E] mb-1">Issue / Task:</label>
            <textarea
              rows={2}
              value={simTask}
              onChange={(e) => setSimTask(e.target.value)}
              className="w-full rounded-xl border border-stone-300 p-2 text-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">Requested Date:</label>
              <input
                type="text"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-2 text-stone-800"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">Requested Slot:</label>
              <input
                type="text"
                value={simSlot}
                onChange={(e) => setSimSlot(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-2 text-stone-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1E2B3E] mb-1">Customer Locality:</label>
            <input
              type="text"
              value={simLocality}
              onChange={(e) => setSimLocality(e.target.value)}
              className="w-full rounded-xl border border-stone-300 p-2 text-stone-800"
            />
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex gap-2">
          <button
            type="button"
            onClick={() => setIsSimulateModalOpen(false)}
            className="py-2.5 px-3 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSimulateNewCustomerRequest}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            Submit Request to My Inbox
          </button>
        </div>
      </ModalPortal>

      {/* CONTEXTUAL CHAT MODAL */}
      {activeConversationId && (
        <ConversationModal
          contextId={activeConversationId}
          contextType="booking"
          summaryTitle="Customer Communication"
          summarySubtitle={`Direct chat between ${workerName} and Customer`}
          onClose={() => setActiveConversationId(null)}
        />
      )}
    </div>
  );
}
