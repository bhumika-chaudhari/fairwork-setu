import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import JobCard from '../components/JobCard';
import SkillChip from '../components/SkillChip';
import EmptyState from '../components/EmptyState';
import SearchField from '../components/SearchField';
import DisclaimerText from '../components/DisclaimerText';
import LanguageSelector from '../components/LanguageSelector';
import { getJobs } from '../services/workService';
import { useProfile } from '../hooks/ProfileContext';
import { AppIcon } from '../lib/icons';

type SkillFilter = 'all' | 'delivery' | 'domestic' | 'warehouse' | 'electrician' | 'driving' | 'cleaning';
type AvailFilter = 'all' | 'today' | 'week';

export default function KaamPage() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [query, setQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillFilter>('all');
  const [selectedAvail, setSelectedAvail] = useState<AvailFilter>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const allJobs = jobsQuery.data ?? [];

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const q = query.trim().toLowerCase();
      const textHaystack = `${t(job.titleKey)} ${t(job.employerKey)} ${t(job.locationKey)} ${job.filterTags.join(' ')}`.toLowerCase();
      const matchesQuery = !q || textHaystack.includes(q);

      const matchesSkill =
        selectedSkill === 'all' ||
        job.filterTags.includes(selectedSkill) ||
        job.skillKeys.some((k) => k.toLowerCase().includes(selectedSkill));

      const matchesAvail =
        selectedAvail === 'all' || job.filterTags.includes(selectedAvail);

      const matchesCity =
        selectedCity === 'all' ||
        job.locationKey.toLowerCase().includes(selectedCity.toLowerCase());

      return matchesQuery && matchesSkill && matchesAvail && matchesCity;
    });
  }, [allJobs, query, selectedAvail, selectedCity, selectedSkill, t]);

  const clearAllFilters = () => {
    setQuery('');
    setSelectedSkill('all');
    setSelectedAvail('all');
    setSelectedCity('all');
  };

  const hasActiveFilters =
    query !== '' || selectedSkill !== 'all' || selectedAvail !== 'all' || selectedCity !== 'all';

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Header bar matching reference Screen 4 */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white font-black text-base shadow-sm">
            K
          </div>
          <h1 className="text-xl font-extrabold text-deepEmerald">
            {t('kaam.title')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#E4FAF2] border border-mint/60 px-3 py-1 text-xs font-bold text-deepEmerald">
            {filteredJobs.length} {t('kaam.sortDistance')}
          </span>
          <div className="md:hidden">
            <LanguageSelector variant="icon" />
          </div>
        </div>
      </header>

      {/* Search Input matching reference Screen 4 */}
      <div>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('kaam.searchPlaceholder')}
        />
      </div>

      {/* Filter Chips Bar (Skill v, City v, Availability v, Pay Range v) */}
      <div className="relative">
        <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-1">
          {/* Skill Filter Dropdown Button */}
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'skill' ? null : 'skill')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              selectedSkill !== 'all'
                ? 'bg-deepEmerald text-white shadow-xs'
                : 'bg-white/90 text-textSecondary border border-border/80 hover:bg-white'
            }`}
          >
            <span>{t('kaam.filterSkill')} {selectedSkill !== 'all' ? `(${selectedSkill})` : ''}</span>
            <span className="text-[10px]">▼</span>
          </button>

          {/* City Filter Dropdown Button */}
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'city' ? null : 'city')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              selectedCity !== 'all'
                ? 'bg-deepEmerald text-white shadow-xs'
                : 'bg-white/90 text-textSecondary border border-border/80 hover:bg-white'
            }`}
          >
            <span>{t('kaam.filterCity')} {selectedCity !== 'all' ? `(${selectedCity})` : ''}</span>
            <span className="text-[10px]">▼</span>
          </button>

          {/* Availability Filter Dropdown Button */}
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'avail' ? null : 'avail')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              selectedAvail !== 'all'
                ? 'bg-deepEmerald text-white shadow-xs'
                : 'bg-white/90 text-textSecondary border border-border/80 hover:bg-white'
            }`}
          >
            <span>{t('kaam.filterAvailability')} {selectedAvail !== 'all' ? `(${selectedAvail})` : ''}</span>
            <span className="text-[10px]">▼</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold text-danger hover:underline whitespace-nowrap px-2"
            >
              {t('kaam.clearFilters')} ✕
            </button>
          )}
        </div>

        {/* Dropdown Options Popup */}
        {activeDropdown === 'skill' && (
          <div className="absolute top-10 left-0 z-30 w-56 rounded-2xl bg-white p-2.5 shadow-lifted border border-border/60 animate-fade-in">
            <div className="text-xs font-bold text-textMuted uppercase mb-1 px-2">{t('kaam.filterSkill')}</div>
            {[
              { id: 'all', label: t('kaam.filterAll') },
              { id: 'domestic', label: t('workerTypes.domestic') },
              { id: 'delivery', label: t('workerTypes.delivery') },
              { id: 'warehouse', label: t('workerTypes.construction') },
              { id: 'electrician', label: t('workerTypes.electrician') },
              { id: 'driving', label: t('workerTypes.driver') },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedSkill(item.id as SkillFilter);
                  setActiveDropdown(null);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-left transition-colors ${
                  selectedSkill === item.id ? 'bg-primarySoft text-deepEmerald font-bold' : 'hover:bg-surfaceAlt text-textPrimary'
                }`}
              >
                <span>{item.label}</span>
                {selectedSkill === item.id && <span>✓</span>}
              </button>
            ))}
          </div>
        )}

        {activeDropdown === 'city' && (
          <div className="absolute top-10 left-16 z-30 w-44 rounded-2xl bg-white p-2.5 shadow-lifted border border-border/60 animate-fade-in">
            <div className="text-xs font-bold text-textMuted uppercase mb-1 px-2">{t('kaam.filterCity')}</div>
            {[
              { id: 'all', label: t('kaam.filterAll') },
              { id: 'Pune', label: t('cities.pune') },
              { id: 'Mumbai', label: t('cities.mumbai') },
              { id: 'Delhi', label: t('cities.delhi') },
              { id: 'Bengaluru', label: t('cities.bengaluru') },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCity(c.id);
                  setActiveDropdown(null);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-left transition-colors ${
                  selectedCity === c.id ? 'bg-primarySoft text-deepEmerald font-bold' : 'hover:bg-surfaceAlt text-textPrimary'
                }`}
              >
                <span>{c.label}</span>
                {selectedCity === c.id && <span>✓</span>}
              </button>
            ))}
          </div>
        )}

        {activeDropdown === 'avail' && (
          <div className="absolute top-10 left-36 z-30 w-44 rounded-2xl bg-white p-2.5 shadow-lifted border border-border/60 animate-fade-in">
            <div className="text-xs font-bold text-textMuted uppercase mb-1 px-2">{t('kaam.filterAvailability')}</div>
            {[
              { id: 'all', label: t('kaam.filterAll') },
              { id: 'today', label: t('availability.today') },
              { id: 'week', label: t('availability.weekdays') },
            ].map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  setSelectedAvail(av.id as AvailFilter);
                  setActiveDropdown(null);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-left transition-colors ${
                  selectedAvail === av.id ? 'bg-primarySoft text-deepEmerald font-bold' : 'hover:bg-surfaceAlt text-textPrimary'
                }`}
              >
                <span>{av.label}</span>
                {selectedAvail === av.id && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Trade Pills */}
      <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
        <SkillChip
          label={t('kaam.filterAll')}
          selected={selectedSkill === 'all'}
          onPress={() => setSelectedSkill('all')}
          size="sm"
        />
        <SkillChip
          label={t('workerTypes.domestic')}
          selected={selectedSkill === 'domestic'}
          onPress={() => setSelectedSkill(selectedSkill === 'domestic' ? 'all' : 'domestic')}
          size="sm"
        />
        <SkillChip
          label={t('workerTypes.delivery')}
          selected={selectedSkill === 'delivery'}
          onPress={() => setSelectedSkill(selectedSkill === 'delivery' ? 'all' : 'delivery')}
          size="sm"
        />
        <SkillChip
          label={t('workerTypes.construction')}
          selected={selectedSkill === 'warehouse'}
          onPress={() => setSelectedSkill(selectedSkill === 'warehouse' ? 'all' : 'warehouse')}
          size="sm"
        />
        <SkillChip
          label={t('workerTypes.electrician')}
          selected={selectedSkill === 'electrician'}
          onPress={() => setSelectedSkill(selectedSkill === 'electrician' ? 'all' : 'electrician')}
          size="sm"
        />
      </div>

      {/* Job Cards List matching reference Screen 4 */}
      <div className="space-y-3.5">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <EmptyState
            icon="briefcase"
            message={t('kaam.noJobs')}
            submessage={t('kaam.noJobsHint')}
            actionLabel={t('kaam.clearFilters')}
            onAction={clearAllFilters}
          />
        )}
      </div>

      {/* Informative Disclaimer */}
      <div className="pt-2">
        <DisclaimerText text={t('kaam.disclaimer')} variant="info" />
      </div>
    </div>
  );
}
