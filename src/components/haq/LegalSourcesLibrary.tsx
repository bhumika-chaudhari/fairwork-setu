import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import type { LegalSource } from '../../types/haq';
import { VERIFIED_LEGAL_SOURCES } from '../../services/haqService';
import ListenButton from '../ListenButton';

export default function LegalSourcesLibrary() {
  const { t, i18n } = useTranslation();
  const [sources, setSources] = useState<LegalSource[]>(VERIFIED_LEGAL_SOURCES);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(sources[0]?.id || null);

  useEffect(() => {
    // Optionally fetch live verified legal sources
    fetch('http://127.0.0.1:8000/haq-setu/legal-sources')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSources(data);
        }
      })
      .catch(() => {
        // use bundled verified sources
      });
  }, []);

  const jurisdictions = ['All', 'National (India)', 'Rajasthan', 'Karnataka'];

  const filteredSources = sources.filter((item) => {
    const matchesJur =
      selectedJurisdiction === 'All' ||
      item.jurisdiction.toLowerCase().includes(selectedJurisdiction.toLowerCase());
    const matchesQuery =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.relevantProvision.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJur && matchesQuery;
  });

  const legalSpeechTrack = {
    id: 'haq-legal-library-overview',
    title: t('haqSetu.rightsTitle', 'Worker Rights & Legal Sources Library'),
    speech:
      'Setu legal library compiles verified Indian statutory protections, including the Rajasthan Platform Based Gig Workers Act 2023, the Code on Social Security 2020, and constitutional natural justice principles. This library provides legal literacy and verified government links.',
    lang: i18n.language,
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warmAmber/20 text-terracotta border border-warmAmber/40 shadow-xs">
              <AppIcon name="scale" size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-warmCocoa">
                {t('haqSetu.rightsTitle', 'Understand My Rights')}
              </h2>
              <p className="text-xs text-textSecondary">
                {t('haqSetu.rightsSubtitle', 'Verified statutory provisions and legal literacy for Indian gig workers.')}
              </p>
            </div>
          </div>
          <ListenButton track={legalSpeechTrack} size="sm" />
        </div>

        {/* Disclaimer Alert */}
        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-warmCream p-3 text-xs text-textSecondary border border-softBorder">
          <AppIcon name="information-circle-outline" size={17} className="shrink-0 text-terracotta mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-warmCocoa">Legal Literacy Notice:</strong>{' '}
            {t(
              'haqSetu.legalDisclaimer',
              'Setu provides informational legal literacy and verified official government links. It does not provide formal advocate legal counsel or guaranteed outcomes. Specific rights vary between state laws.'
            )}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {jurisdictions.map((jur) => (
            <button
              key={jur}
              type="button"
              onClick={() => setSelectedJurisdiction(jur)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                selectedJurisdiction === jur
                  ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm border border-saffronGold/40'
                  : 'bg-white/80 text-textSecondary border border-softBorder hover:bg-white'
              }`}
            >
              {jur}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {filteredSources.length === 0 ? (
          <div className="rounded-2xl bg-cleanWhite/90 border border-softBorder p-8 text-center text-textMuted text-xs">
            No legal provisions found matching your criteria.
          </div>
        ) : (
          filteredSources.map((source) => {
            const isExpanded = expandedId === source.id;
            return (
              <div
                key={source.id}
                className="overflow-hidden rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder shadow-glass transition-all hover:border-saffronGold/40"
              >
                {/* Header item */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : source.id)}
                  className="flex cursor-pointer items-start justify-between gap-3 p-4 select-none"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="rounded-full bg-deepNavy px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        {source.jurisdiction}
                      </span>
                      <span className="rounded-full bg-warmAmber/20 px-2 py-0.5 text-[10px] font-bold text-warmCocoa border border-saffronGold/40">
                        {source.reviewStatus}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-warmCocoa leading-snug">
                      {source.title}
                    </h3>
                    <p className="mt-1 text-xs text-terracotta font-semibold">
                      {source.relevantProvision}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-textMuted">
                    <span className="text-[11px] font-bold text-terracotta hidden sm:inline">
                      {isExpanded ? 'Hide' : 'Details'}
                    </span>
                    <AppIcon
                      name={isExpanded ? 'chevron-back' : 'chevron-forward'}
                      size={16}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-softBorder bg-warmCream/60 p-4 space-y-3 text-xs text-textSecondary animate-fadeIn">
                    <div>
                      <strong className="block text-warmCocoa mb-1">Authority & Origin:</strong>
                      <p className="leading-relaxed">{source.authority}</p>
                    </div>

                    <div>
                      <strong className="block text-warmCocoa mb-1">Scope & Applicability:</strong>
                      <p className="leading-relaxed">{source.workerScope}</p>
                    </div>

                    <div>
                      <strong className="block text-warmCocoa mb-1">Summary of Protection:</strong>
                      <p className="leading-relaxed">{source.summary}</p>
                    </div>

                    {source.keyRights && source.keyRights.length > 0 && (
                      <div>
                        <strong className="block text-warmCocoa mb-1.5">Key Worker Protections:</strong>
                        <ul className="space-y-1.5 pl-1">
                          {source.keyRights.map((right, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AppIcon name="shield-checkmark" size={14} className="shrink-0 text-terracotta mt-0.5" />
                              <span className="leading-relaxed">{right}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-softBorder text-[11px] text-textMuted">
                      <span>Verified: {source.lastVerifiedDate}</span>
                      {source.officialUrl && (
                        <a
                          href={source.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-terracotta hover:underline"
                        >
                          <span>Official Portal Link</span>
                          <AppIcon name="external-link" size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
