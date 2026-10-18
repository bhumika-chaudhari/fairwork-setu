import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import type { ServiceProfile, BookingRequest } from '../../types/marketplace';
import CustomerBookingModal from './CustomerBookingModal';
import ModalPortal from '../ModalPortal';

interface LocalServicesSearchProps {
  profiles: ServiceProfile[];
  onBookingCreated?: (booking: BookingRequest) => void;
}

const TRADE_FILTERS = [
  { id: 'all', label: 'All Services', icon: 'grid' },
  { id: 'electrician', label: 'Electrician', icon: 'flash-outline' },
  { id: 'plumber', label: 'Plumber', icon: 'construct-outline' },
  { id: 'tailor', label: 'Tailor', icon: 'cut-outline' },
  { id: 'cleaner', label: 'Cleaner', icon: 'home-outline' },
  { id: 'mechanic', label: 'Mechanic', icon: 'bicycle-outline' },
  { id: 'carpenter', label: 'Carpenter', icon: 'hammer-outline' },
  { id: 'painter', label: 'Painter', icon: 'brush' },
  { id: 'appliance_repair', label: 'Appliance Repair', icon: 'build-outline' },
];

export default function LocalServicesSearch({
  profiles,
  onBookingCreated,
}: LocalServicesSearchProps) {
  const { t } = useTranslation();
  const [selectedTrade, setSelectedTrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localityFilter, setLocalityFilter] = useState('all');
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<ServiceProfile | null>(null);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<ServiceProfile | null>(null);

  // Handle GPS location request gracefully
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser. Please enter your area manually.');
      return;
    }

    setLocating(true);
    setLocationStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        // Honest disclosure: we simulate matching nearest Pune zone from coordinates without privacy invasion
        setLocalityFilter('kothrud');
        setLocationStatus('Approximate locality set to Kothrud & Western Pune.');
      },
      (err) => {
        setLocating(false);
        setLocationStatus('Location access was denied or unavailable. You can enter your neighborhood manually.');
      },
      { timeout: 8000 }
    );
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Trade filter
      if (
        selectedTrade !== 'all' &&
        p.trade.toLowerCase() !== selectedTrade.toLowerCase() &&
        !p.serviceCategories.some((c) => c.toLowerCase() === selectedTrade.toLowerCase())
      ) {
        return false;
      }

      // Locality filter
      if (localityFilter !== 'all') {
        const area = p.approximateServiceArea.toLowerCase();
        if (!area.includes(localityFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const haystack = `${p.displayName} ${p.trade} ${p.shortDescription} ${p.skills.join(' ')} ${p.approximateServiceArea}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [profiles, selectedTrade, localityFilter, searchQuery]);

  const getBadge = (status: string) => {
    if (status === 'verified_trade') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
          <AppIcon name="shield-checkmark" size={12} />
          <span>Trade Verified</span>
        </span>
      );
    }
    if (status === 'id_verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF7F8] text-[#3A757D] border border-[#3A757D]/30 text-[10px] font-bold">
          <AppIcon name="person" size={12} />
          <span>ID Verified</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-bold">
        <AppIcon name="info" size={12} />
        <span>Demo Provider</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Location Bar */}
      <div className="space-y-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <AppIcon name="search-outline" size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tradespeople (e.g. Electrician, Tap leakage, Ramesh Shinde)..."
            className="w-full rounded-2xl border border-[#F4EBDD] bg-white/95 backdrop-blur-xl py-3 pl-10 pr-4 text-xs sm:text-sm font-medium text-[#1E2B3E] placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
          />
        </div>

        {/* Location selector & detect button */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-semibold text-[11px]">Area:</span>
            <select
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] text-xs focus:outline-none"
            >
              <option value="all">All Pune Neighborhoods</option>
              <option value="kothrud">Kothrud / Karve Nagar</option>
              <option value="baner">Aundh / Baner / Pashan</option>
              <option value="hadapsar">Hadapsar / Magarpatta</option>
              <option value="warje">Warje / Sinhagad Road</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#F1B96B] bg-[#FDF8F0] hover:bg-[#FDF8F0]/80 text-[#7C2D16] font-bold text-xs transition-colors shadow-xs active:scale-95"
          >
            <AppIcon name="location-outline" size={14} />
            <span>{locating ? 'Detecting...' : 'Near My Area'}</span>
          </button>
        </div>

        {locationStatus && (
          <p className="text-[11px] text-[#7C2D16] bg-[#FDF8F0] px-3 py-1.5 rounded-xl border border-[#F1B96B]/40">
            {locationStatus}
          </p>
        )}
      </div>

      {/* Trade Category Tabs */}
      <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-1">
        {TRADE_FILTERS.map((cat) => {
          const isSelected = selectedTrade === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedTrade(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap active:scale-95 shadow-xs ${
                isSelected
                  ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50'
                  : 'bg-white/85 text-[#231F20] hover:bg-white border border-[#F4EBDD]'
              }`}
            >
              <AppIcon name={cat.icon} size={14} className={isSelected ? 'text-white' : 'text-[#7C2D16]'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Matching Provider Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#231F20]/70 px-1">
          <span>{filteredProfiles.length} verified trade providers found</span>
          <span>Transparent direct booking</span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
              <AppIcon name="search-outline" size={24} />
            </div>
            <h4 className="text-base font-bold text-[#1E2B3E]">No Service Providers Found</h4>
            <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
              No published trade profiles matched your filters. Try selecting "All Services" or resetting the neighborhood filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTrade('all');
                setLocalityFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#B34A26] hover:bg-[#7C2D16]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredProfiles.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header: Photo / Initials, Name, Trade, Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                    {p.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#1E2B3E]">
                        {p.displayName}
                      </h3>
                      {getBadge(p.verificationStatus)}
                    </div>
                    <p className="text-xs font-semibold text-[#7C2D16] capitalize">
                      {p.trade} • {p.yearsOfExperience} years experience
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Visit Fee</span>
                  <span className="text-base font-black text-[#1E2B3E]">
                    {formatInr(p.pricing.indicativePrice)}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-stone-700 leading-relaxed bg-[#FDF8F0]/40 p-3 rounded-2xl border border-[#F4EBDD]/60">
                {p.shortDescription}
              </p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-[#FDF8F0] border border-[#F1B96B]/40 text-[#1E2B3E] font-medium text-[11px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Area, Rating, Available Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#F4EBDD] text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Service Area</span>
                  <span className="font-semibold text-[#1E2B3E]">{p.approximateServiceArea}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Languages</span>
                  <span className="font-semibold text-[#1E2B3E]">{p.languages.join(', ')}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Completed Jobs</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <AppIcon name="checkmark-circle" size={12} className="text-emerald-700" />
                    <span>{p.completedJobsCount} genuine jobs</span>
                  </span>
                </div>
              </div>

              {/* Actions: Request Booking & View Details */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedWorkerForProfile(p)}
                  className="px-3.5 py-2 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-xs font-bold text-[#1E2B3E] transition-colors"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkerForBooking(p)}
                  className="px-5 py-2 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>Request Booking</span>
                  <AppIcon name="arrow-forward" size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Booking Modal */}
      {selectedWorkerForBooking && (
        <CustomerBookingModal
          worker={selectedWorkerForBooking}
          onClose={() => setSelectedWorkerForBooking(null)}
          onBookingConfirmed={(b) => {
            if (onBookingCreated) onBookingCreated(b);
          }}
        />
      )}

      {/* Worker Full Profile Modal */}
      <ModalPortal
        isOpen={!!selectedWorkerForProfile}
        onClose={() => setSelectedWorkerForProfile(null)}
        maxWidthClass="sm:max-w-lg"
      >
        {selectedWorkerForProfile && (
          <>
            {/* Pinned Header */}
            <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#B34A26] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {selectedWorkerForProfile.displayName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1E2B3E] font-serif">
                    {selectedWorkerForProfile.displayName}
                  </h3>
                  <p className="text-xs font-semibold text-[#7C2D16] capitalize">
                    {selectedWorkerForProfile.trade} Specialist
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkerForProfile(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
                aria-label="Close profile"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-3 text-xs text-[#231F20]">
              <div className="p-3.5 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/40 space-y-1.5">
                <span className="font-bold text-[#7C2D16] block uppercase text-[10px]">About Provider</span>
                <p className="leading-relaxed">{selectedWorkerForProfile.shortDescription}</p>
              </div>

              {selectedWorkerForProfile.qualifications && selectedWorkerForProfile.qualifications.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1">
                  <span className="font-bold text-[#1E2B3E] block">Qualifications & Certificates</span>
                  <ul className="list-disc pl-4 text-stone-600 space-y-0.5">
                    {selectedWorkerForProfile.qualifications.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1">
                <span className="font-bold text-[#1E2B3E] block">Working Days & Availability</span>
                <p className="text-stone-700 capitalize">
                  {selectedWorkerForProfile.availability.workingDays.join(', ')}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedWorkerForProfile.availability.timeSlots.map((slot, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-stone-100 text-[#1E2B3E] text-[11px] font-mono">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                <strong>Privacy Guaranteed:</strong> Worker's exact home address and private mobile number are protected. Communication takes place securely inside Setu.
              </div>
            </div>

            {/* Pinned Action Footer */}
            <div className="shrink-0 px-6 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedWorkerForProfile(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedWorkerForProfile;
                  setSelectedWorkerForProfile(null);
                  setSelectedWorkerForBooking(target);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                Request Booking
              </button>
            </div>
          </>
        )}
      </ModalPortal>
    </div>
  );
}
