import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import { useProfile } from '../../hooks/ProfileContext';
import { submitBookingRequest } from '../../services/marketplaceService';
import type { ServiceProfile, BookingRequest } from '../../types/marketplace';
import ModalPortal from '../ModalPortal';

interface CustomerBookingModalProps {
  worker: ServiceProfile | null;
  onClose: () => void;
  onBookingConfirmed: (booking: BookingRequest) => void;
}

export default function CustomerBookingModal({
  worker,
  onClose,
  onBookingConfirmed,
}: CustomerBookingModalProps) {
  const { t } = useTranslation();
  const { user, profile } = useProfile();

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [taskDescription, setTaskDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [preferredSlot, setPreferredSlot] = useState(
    worker?.availability.timeSlots[0] || '09:00 - 13:00'
  );
  const [alternativeSlot, setAlternativeSlot] = useState('');
  const [locality, setLocality] = useState(
    profile.cityKey
      ? `${profile.cityKey.replace('cities.', '').replace(/^./, (c) => c.toUpperCase())}, Pune`
      : 'Kothrud, Pune'
  );
  const [exactAddress, setExactAddress] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingRequest | null>(null);

  if (!worker) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be under 5 MB');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) {
      setErrorMessage('Please describe the problem or service needed.');
      return;
    }
    if (!locality.trim()) {
      setErrorMessage('Please specify your locality or area.');
      return;
    }
    setErrorMessage(null);
    setStep('review');
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const customerId =
        user?.id || 'cust-' + (profile.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const booking = await submitBookingRequest({
        workerId: worker.id,
        workerName: worker.displayName,
        workerTrade: worker.trade,
        customerId,
        customerName: profile.name || 'Customer',
        customerPhone: profile.emergencyContact || '9876543210',
        serviceCategory: worker.trade,
        taskDescription: taskDescription.trim(),
        preferredDate,
        preferredTimeSlot: preferredSlot,
        alternativeTimeSlot: alternativeSlot || undefined,
        locality: locality.trim(),
        exactAddress: exactAddress.trim() || locality.trim(),
        supportingImages: photoPreview ? ['image_attached_locally'] : [],
        additionalNotes: additionalNotes.trim() || undefined,
        indicativePrice: worker.pricing.indicativePrice,
      });

      setCreatedBooking(booking);
      setStep('confirmed');
      onBookingConfirmed(booking);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit booking request.');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!worker) return null;

  return (
    <ModalPortal isOpen={Boolean(worker)} onClose={onClose} maxWidthClass="sm:max-w-lg">
      {step === 'confirmed' && createdBooking ? (
        /* Confirmation View */
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Pinned Header */}
          <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ✓ Request Delivered
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <AppIcon name="close" size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-sm">
              <AppIcon name="checkmark-circle" size={36} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#B34A26] px-3 py-1 rounded-full bg-[#FDF8F0] border border-[#F1B96B]">
                Booking ID: {createdBooking.id}
              </span>
              <h3 className="text-xl font-bold text-[#1E2B3E] font-serif pt-2">
                Booking Request Sent!
              </h3>
              <p className="text-xs text-[#231F20]/75 max-w-md mx-auto leading-relaxed">
                Your request has been delivered to <strong>{worker.displayName}</strong>. You will be notified as soon as they confirm or propose a slot.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0] p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Service:</span>
                <span className="font-bold text-[#1E2B3E] capitalize">{worker.trade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Scheduled Date:</span>
                <span className="font-semibold text-[#1E2B3E]">
                  {createdBooking.preferredDate} ({createdBooking.preferredTimeSlot})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Service Area:</span>
                <span className="font-semibold text-[#1E2B3E]">{createdBooking.locality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Indicative Visit Fee:</span>
                <span className="font-bold text-[#7C2D16]">
                  {formatInr(createdBooking.indicativePrice || worker.pricing.indicativePrice)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#231F20]/60 italic">
              Track this request and message the provider directly in your <strong>My Activity</strong> dashboard.
            </p>
          </div>

          {/* Pinned Footer */}
          <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              Done & View Bookings
            </button>
          </div>
        </div>
      ) : step === 'review' ? (
        /* Review View */
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Pinned Header */}
          <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#7C2D16] uppercase tracking-wider block">
                Confirm Booking Request
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#1E2B3E] font-serif leading-tight">
                {worker.displayName} ({worker.trade.toUpperCase()})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <AppIcon name="arrow-back" size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
            <div className="rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0] p-4 text-xs space-y-3">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Problem Description</span>
                <p className="font-medium text-[#1E2B3E] mt-0.5">{taskDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F1B96B]/30">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Preferred Slot</span>
                  <p className="font-semibold text-[#1E2B3E] mt-0.5">{preferredDate} ({preferredSlot})</p>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Service Area</span>
                  <p className="font-semibold text-[#1E2B3E] mt-0.5">{locality}</p>
                </div>
              </div>

              {exactAddress && (
                <div className="pt-2 border-t border-[#F1B96B]/30">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Service Address</span>
                  <p className="font-medium text-[#1E2B3E] mt-0.5">{exactAddress}</p>
                  <span className="text-[10px] text-stone-500 italic block mt-0.5">
                    (Visible only to {worker.displayName} once they accept this booking)
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#F1B96B]/30 flex justify-between items-center">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Estimated Visit Fee</span>
                  <span className="text-sm font-black text-[#7C2D16]">
                    {formatInr(worker.pricing.indicativePrice)}
                  </span>
                </div>
                <span className="text-[11px] text-stone-600 bg-white px-2 py-1 rounded-lg border border-[#F4EBDD]">
                  Pay directly upon service
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Fair Pricing Note:</strong> Setu does not process card or wallet payments. This visit fee covers inspection and diagnosis. If replacement materials are needed, agree on the total cost with the worker before work begins.
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep('form')}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-white"
            >
              Edit Details
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Sending Request...</span>
              ) : (
                <>
                  <span>Confirm & Send Request</span>
                  <AppIcon name="arrow-forward" size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Initial Form View */
        <form onSubmit={handleReview} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Pinned Header */}
          <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FDF8F0] border border-[#F1B96B]/50 flex items-center justify-center text-[#B34A26] font-bold text-base shrink-0">
                <AppIcon name="construct-outline" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2B3E] font-serif leading-tight">
                  Request a Service Booking
                </h3>
                <p className="text-[11px] sm:text-xs text-[#231F20]/70">
                  Booking with {worker.displayName} • {worker.approximateServiceArea}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <AppIcon name="close" size={18} />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AppIcon name="shield-alert" size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Task Description */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-[#1E2B3E]">
                What problem do you need help with? *
              </label>
              <textarea
                required
                rows={3}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="e.g. Kitchen tap is leaking heavily from the neck; also need washing machine inlet connection checked."
                className="w-full px-3 py-2 rounded-xl border border-[#F1B96B] bg-[#FDF8F0] text-xs text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
              />
            </div>

            {/* Date & Time Slot selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Available Time Slot *
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                >
                  {worker.availability.timeSlots.map((slot, idx) => (
                    <option key={idx} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Locality & Address */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Locality / Neighborhood *
                </label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Kothrud, near Paud Road"
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Exact Flat / Building Address (Optional until confirmed)
                </label>
                <input
                  type="text"
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Meghsparsh Apartments, Lane 4"
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  Shared only with {worker.displayName} after they confirm your booking.
                </span>
              </div>
            </div>

            {/* Optional Photo Attachment */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-[#1E2B3E]">
                Add a Photo of the Problem (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-3.5 py-2 rounded-xl border border-dashed border-[#B34A26] bg-[#FDF8F0] hover:bg-[#FDF8F0]/80 text-[#B34A26] font-semibold text-xs flex items-center gap-1.5 transition-colors">
                  <AppIcon name="camera-outline" size={16} />
                  <span>{photoPreview ? 'Change Photo' : 'Attach Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                    >
                      <AppIcon name="close" size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Price disclosure card */}
            <div className="rounded-2xl bg-gradient-to-r from-[#FDF8F0] to-white border border-[#F1B96B]/50 p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#7C2D16] block">
                  Indicative Visit & Inspection Fee
                </span>
                <span className="text-base font-black text-[#1E2B3E]">
                  {formatInr(worker.pricing.indicativePrice)}
                </span>
              </div>
              <span className="text-[11px] text-stone-600 font-medium">
                {worker.pricing.description}
              </span>
            </div>
          </div>

          {/* Pinned Form Footer */}
          <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Review Request</span>
              <AppIcon name="arrow-forward" size={14} />
            </button>
          </div>
        </form>
      )}
    </ModalPortal>
  );
}
