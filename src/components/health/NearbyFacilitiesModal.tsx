import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '../../lib/icons';
import type { HealthFacility } from '../../types/health';
import {
  fetchHealthFacilities,
  saveHealthItem,
  removeSavedHealthItem,
  isHealthItemSaved,
} from '../../services/healthService';
import ModalPortal from '../ModalPortal';

interface NearbyFacilitiesModalProps {
  initialType?: string;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Centres' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'phc', label: 'PHCs' },
  { id: 'clinic', label: 'Clinics' },
  { id: 'pharmacy', label: 'Pharmacies' },
];

const LOCALITY_OPTIONS = [
  { id: 'all', label: 'All Pune Zones' },
  { id: 'kothrud', label: 'Kothrud & Paud Rd' },
  { id: 'station', label: 'Station & Camp' },
  { id: 'aundh', label: 'Aundh & Baner' },
  { id: 'shivajinagar', label: 'Shivajinagar' },
  { id: 'mumbai', label: 'Mumbai (Parel / Central)' },
];

export default function NearbyFacilitiesModal({
  initialType = 'all',
  onClose,
}: NearbyFacilitiesModalProps) {
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState<HealthFacility | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const { data: facilities = [], isLoading, refetch } = useQuery({
    queryKey: ['health_facilities_modal', selectedType, selectedLocality, searchQuery],
    queryFn: () =>
      fetchHealthFacilities({
        type: selectedType,
        locality: selectedLocality,
        search: searchQuery,
      }),
  });

  const handleToggleSave = (facility: HealthFacility, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHealthItemSaved(facility.id)) {
      removeSavedHealthItem(facility.id);
      setSavedIds((prev) => ({ ...prev, [facility.id]: false }));
    } else {
      saveHealthItem({
        id: facility.id,
        type: 'facility',
        title: facility.name,
        subtitle: `${facility.categoryLabel} • ${facility.distance}`,
        data: facility,
      });
      setSavedIds((prev) => ({ ...prev, [facility.id]: true }));
    }
  };

  return (
    <>
      <ModalPortal
        isOpen={true}
        onClose={onClose}
        maxWidthClass="sm:max-w-2xl"
        panelClassName="h-[92dvh] sm:h-[650px]"
      >
        {/* Pinned Header */}
        <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-xs">
                <AppIcon name="hospital" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-deepEmerald font-serif">
                  Verified Nearby Healthcare
                </h3>
                <p className="text-xs text-textSecondary">
                  Government hospitals, primary health centres, and generic pharmacies.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all active:scale-95"
              aria-label="Close"
            >
              <AppIcon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Search & Location Filter Bar */}
        <div className="space-y-2.5 px-5 pt-3 mb-2 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search facility name, OPD service, or address..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-8 text-xs font-medium text-[#231F20] placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E5953E]/35"
              />
              <span className="absolute left-3 top-2.5 text-stone-400">
                <AppIcon name="search-outline" size={15} />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs font-semibold text-[#231F20] focus:outline-none"
            >
              {LOCALITY_OPTIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedType(cat.id)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === cat.id
                    ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facilities List (Scrollable) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B34A26] border-t-transparent" />
              <span>Locating verified healthcare centres...</span>
            </div>
          ) : facilities.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-stone-50 border border-stone-200 p-4">
              <AppIcon name="hospital" size={32} className="mx-auto text-stone-400 mb-2" />
              <p className="text-xs font-bold text-stone-700">No healthcare centres found</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Try selecting "All Pune Zones" or clearing your search term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('all');
                  setSelectedLocality('all');
                  setSearchQuery('');
                  refetch();
                }}
                className="mt-3 py-1.5 px-3 rounded-xl bg-white border border-stone-300 text-xs font-bold text-[#B34A26]"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            facilities.map((facility) => {
              const isSaved = savedIds[facility.id] ?? isHealthItemSaved(facility.id);
              return (
                <div
                  key={facility.id}
                  onClick={() => setSelectedFacilityDetail(facility)}
                  className="rounded-2xl border border-[#F4EBDD] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#E5953E]/60 transition-all cursor-pointer space-y-2.5"
                >
                  {/* Top Bar: Title, badges, and bookmark */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B34A26] bg-[#FEF4E8] px-2 py-0.5 rounded-md border border-[#E5953E]/30">
                          {facility.categoryLabel}
                        </span>
                        {facility.is24x7 && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            24x7 Open
                          </span>
                        )}
                        {facility.emergencyServices && (
                          <span className="text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            Casualty & Trauma
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-deepEmerald mt-1 truncate">
                        {facility.name}
                      </h4>

                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                        <AppIcon name="location-outline" size={13} className="shrink-0 text-stone-400" />
                        <span className="truncate">{facility.address}</span>
                        <span className="shrink-0 font-bold text-[#B34A26]">({facility.distance})</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(facility, e)}
                      className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-[#B34A26] transition-all"
                      title={isSaved ? 'Saved in My Resources' : 'Save this facility'}
                    >
                      <AppIcon
                        name={isSaved ? 'bookmark-check' : 'bookmark'}
                        size={18}
                        className={isSaved ? 'text-[#B34A26]' : 'text-stone-400'}
                      />
                    </button>
                  </div>

                  {/* Services Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {facility.services.slice(0, 3).map((serv, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md"
                      >
                        ✓ {serv}
                      </span>
                    ))}
                    {facility.services.length > 3 && (
                      <span className="text-[10px] font-semibold text-stone-400 py-0.5">
                        +{facility.services.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Direct Actions: Call & Directions */}
                  <div className="pt-2 flex items-center justify-between border-t border-stone-100 gap-2">
                    <span className="text-[11px] font-medium text-stone-500">
                      🕒 {facility.timings}
                    </span>

                    <div className="flex items-center gap-2">
                      {facility.phone && (
                        <a
                          href={`tel:${facility.phone.replace(/[^0-9]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="py-1 px-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#B34A26] to-[#7C2D16] hover:brightness-105 flex items-center gap-1 shadow-xs"
                        >
                          <AppIcon name="call" size={12} />
                          <span>Call</span>
                        </a>
                      )}

                      <a
                        href={facility.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-2.5 rounded-lg text-xs font-bold text-[#B34A26] bg-[#FEF4E8] hover:bg-[#FEF4E8]/80 flex items-center gap-1 border border-[#E5953E]/30"
                      >
                        <AppIcon name="navigation" size={12} />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Facility Detail Modal Sheet */}
        <ModalPortal
          isOpen={Boolean(selectedFacilityDetail)}
          onClose={() => setSelectedFacilityDetail(null)}
          zIndexClass="z-60"
          maxWidthClass="sm:max-w-md"
        >
          {selectedFacilityDetail && (
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between border-b border-stone-200 pb-2.5">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#B34A26] bg-[#FEF4E8] px-2 py-0.5 rounded border border-[#E5953E]/30">
                    {selectedFacilityDetail.categoryLabel}
                  </span>
                  <h4 className="text-base font-extrabold text-deepEmerald mt-1">
                    {selectedFacilityDetail.name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFacilityDetail(null)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-stone-700">
                <p>
                  <strong>Address:</strong> {selectedFacilityDetail.address}
                </p>
                <p>
                  <strong>Distance:</strong> {selectedFacilityDetail.distance}
                </p>
                <p>
                  <strong>Operating Timings:</strong> {selectedFacilityDetail.timings}
                </p>
                <p>
                  <strong>Verified Contact:</strong>{' '}
                  <a
                    href={`tel:${selectedFacilityDetail.phone}`}
                    className="text-[#B34A26] font-bold underline"
                  >
                    {selectedFacilityDetail.phone}
                  </a>
                </p>
              </div>

              <div>
                <strong className="block text-xs text-deepEmerald mb-1">
                  Available Facilities & Services:
                </strong>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedFacilityDetail.services.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-stone-700 bg-stone-50 p-1.5 rounded-lg border border-stone-200"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`tel:${selectedFacilityDetail.phone.replace(/[^0-9]/g, '')}`}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <AppIcon name="call" size={14} />
                  <span>Call {selectedFacilityDetail.phone}</span>
                </a>
                <a
                  href={selectedFacilityDetail.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#FEF4E8] text-[#B34A26] border border-[#E5953E]/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#FEF4E8]/80"
                >
                  <AppIcon name="navigation" size={14} />
                  <span>Open Maps</span>
                </a>
              </div>
            </div>
          )}
        </ModalPortal>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-between text-xs text-stone-500">
          <span>Official government & empanelled centres</span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </ModalPortal>
    </>
  );
}
