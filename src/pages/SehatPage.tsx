import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SearchField from '../components/SearchField';
import Card from '../components/Card';
import DisclaimerText from '../components/DisclaimerText';
import LanguageSelector from '../components/LanguageSelector';
import { AppIcon } from '../lib/icons';
import ListenButton from '../components/ListenButton';
import { buildSchemeSpeechText } from '../lib/speechContextualContent';
import { getHealthResources } from '../services/healthService';
import { getWelfareSchemes } from '../services/workerService';
import { runRagSearch } from '../ai/models/ragSearch';

export default function SehatPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<{
    answer: string;
    sources: { title: string; url: string; relevance: number }[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  const resourcesQuery = useQuery({ queryKey: ['health'], queryFn: getHealthResources });
  const schemesQuery = useQuery({ queryKey: ['schemes'], queryFn: getWelfareSchemes });

  const allResources = resourcesQuery.data ?? [];
  const allSchemes = schemesQuery.data ?? [];

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allResources;
    return allResources.filter((r) =>
      `${t(r.nameKey)} ${t(r.typeKey)} ${t(r.servicesKey)}`.toLowerCase().includes(q)
    );
  }, [allResources, searchQuery, t]);

  const handleAskAi = async (promptText?: string) => {
    const queryToRun = promptText || aiQuestion;
    if (!queryToRun.trim()) return;

    setAiLoading(true);
    try {
      const res = await runRagSearch({ query: queryToRun });
      setAiResponse(res.output);
    } catch {
      // ignore
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Header bar matching reference Screen 7 */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white font-black text-base shadow-sm">
            S
          </div>
          <h1 className="text-xl font-extrabold text-deepEmerald">
            {t('sehat.title')}
          </h1>
        </div>
        <div className="md:hidden">
          <LanguageSelector variant="icon" />
        </div>
      </header>

      {/* Search Input matching reference Screen 7 */}
      <div>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('sehat.searchPlaceholder')}
        />
      </div>

      {/* SECTION: Nearby Health Resources matching reference Screen 7 */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-deepEmerald">
            {t('sehat.nearby')}
          </h2>
          <span className="text-xs font-bold text-primaryTeal hover:underline cursor-pointer">
            {t('common.seeAll')}
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              onClick={() => setSelectedResource(res)}
              className="mb-0 hover:border-mint/60 p-3.5 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6F7F2] text-primary">
                  <AppIcon name="medical" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-deepEmerald truncate">
                    {t(res.nameKey)}
                  </h3>
                  <p className="text-xs text-textSecondary mt-0.5">
                    {t(res.typeKey)} • {res.distance}
                  </p>
                  <p className="text-[11px] text-textMuted mt-0.5 truncate">
                    {t(res.servicesKey)} {res.timings ? `• ${res.timings}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-primaryTeal shrink-0">
                <span>{t('common.view')}</span>
                <AppIcon name="chevron-forward" size={14} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION: Emergency Numbers (3 cards side by side!) matching reference Screen 7 */}
      <div>
        <h2 className="text-sm font-extrabold text-deepEmerald mb-2.5">
          {t('sehat.emergencyNumbers')}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {/* 108 Ambulance */}
          <a
            href="tel:108"
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-white/95 via-[rgba(254,242,242,0.85)] to-[rgba(239,68,68,0.10)] p-3 text-center shadow-glass border border-[rgba(239,68,68,0.25)] hover:border-danger/40 active:scale-95 transition-all"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dangerSoft text-danger mb-1.5">
              <AppIcon name="medkit-outline" size={18} />
            </div>
            <span className="text-base font-black text-danger">108</span>
            <span className="text-[11px] font-semibold text-textSecondary mt-0.5">
              {t('sehat.ambulance')}
            </span>
          </a>

          {/* 112 Police / All Emergency */}
          <a
            href="tel:112"
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-white/95 via-[rgba(244,253,250,0.88)] to-[rgba(114,229,194,0.14)] p-3 text-center shadow-glass border border-[rgba(8,127,115,0.18)] hover:border-mint active:scale-95 transition-all"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarySoft text-primary mb-1.5">
              <AppIcon name="call" size={18} />
            </div>
            <span className="text-base font-black text-primary">112</span>
            <span className="text-[11px] font-semibold text-textSecondary mt-0.5">
              {t('sehat.police')}
            </span>
          </a>

          {/* 1098 Child Helpline */}
          <a
            href="tel:1098"
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-white/95 via-[rgba(254,243,199,0.82)] to-[rgba(244,181,68,0.12)] p-3 text-center shadow-glass border border-[rgba(244,181,68,0.30)] hover:border-accent active:scale-95 transition-all"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accentSoft text-[#D97706] mb-1.5">
              <AppIcon name="heart" size={18} />
            </div>
            <span className="text-base font-black text-[#D97706]">1098</span>
            <span className="text-[11px] font-semibold text-textSecondary mt-0.5">
              {t('sehat.childHelpline')}
            </span>
          </a>
        </div>
      </div>

      {/* SECTION: Welfare Schemes Cards matching reference Screen 7 */}
      <div>
        <h2 className="text-sm font-extrabold text-deepEmerald mb-2.5">
          {t('sehat.schemes')}
        </h2>
        <div className="space-y-3">
          {allSchemes.map((scheme) => (
            <Card key={scheme.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primarySoft text-primary mt-0.5">
                  <AppIcon name={scheme.icon} size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-deepEmerald">
                      {t(scheme.nameKey)}
                    </h3>
                    {(() => {
                      const schemeSpeech = buildSchemeSpeechText(scheme.id, i18n.language);
                      const schemeTrack = {
                        id: `scheme-${scheme.id}`,
                        title: schemeSpeech.title,
                        subtitle: t(scheme.nameKey),
                        speech: schemeSpeech.speech,
                        lang: i18n.language,
                      };
                      return <ListenButton track={schemeTrack} size="sm" />;
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-textSecondary leading-relaxed">
                    {t(scheme.descriptionKey)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                      ✓ {t(scheme.eligibilityKey)}
                    </span>
                    {scheme.sourceUrl && (
                      <a
                        href={scheme.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primaryTeal hover:underline"
                      >
                        {t('sehat.checkEligibility')} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION: Ask Setu AI & Semantic Search Q&A matching reference Screen 7 */}
      <Card className="bg-gradient-to-br from-white/95 via-[#EDFAF5]/90 to-[#E0F8F1]/80 border-mint/40 p-4 shadow-glass">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-gradient text-white">
            <AppIcon name="sparkles" size={14} />
          </div>
          <h3 className="text-sm font-extrabold text-deepEmerald">
            {t('sehat.askSetuAi')}
          </h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder={t('sehat.askSetuAiPlaceholder')}
            className="flex-1 rounded-xl border border-border/80 bg-white/95 px-3 py-2 text-xs font-medium text-textPrimary placeholder:text-textMuted focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleAskAi()}
            disabled={aiLoading}
            className="rounded-xl bg-emerald-gradient px-4 py-2 text-xs font-bold text-white shadow-clay hover:brightness-105 disabled:opacity-50"
          >
            {aiLoading ? t('sehat.thinking') : t('sehat.ask')}
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[
            'Where can I get free health checkup?',
            'How to apply for Ayushman card?',
            'Pension scheme for gig workers?',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setAiQuestion(prompt);
                handleAskAi(prompt);
              }}
              className="rounded-lg bg-white/80 px-2 py-1 text-[11px] font-semibold text-textSecondary hover:bg-white hover:text-deepEmerald border border-border/50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Answer & Source Citations Display */}
        {aiResponse && (
          <div className="mt-4 rounded-2xl bg-white p-3.5 border border-mint/40 space-y-2 animate-fade-in">
            <p className="text-xs text-textPrimary leading-relaxed">
              {aiResponse.answer}
            </p>
            <div className="border-t border-border/40 pt-2">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">
                {t('sehat.verifiedSources')}
              </span>
              <div className="flex flex-wrap gap-2">
                {aiResponse.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-primarySoft px-2 py-0.5 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <span>{src.title}</span>
                    <AppIcon name="open-outline" size={11} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Mandatory Medical Disclaimer */}
      <div className="pt-1">
        <DisclaimerText text={t('sehat.disclaimer')} variant="health" />
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedResource(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-lifted border border-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <h3 className="text-lg font-bold text-deepEmerald">
                {t(selectedResource.nameKey)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="text-textMuted hover:text-deepEmerald"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-textSecondary">
              <strong>{t('sehat.categoryLabel')}</strong> {t(selectedResource.typeKey)}
            </p>
            <p className="text-xs text-textSecondary mt-1">
              <strong>{t('sehat.distanceLabel')}</strong> {selectedResource.distance}
            </p>
            <p className="text-xs text-textSecondary mt-1">
              <strong>{t('sehat.servicesLabel')}</strong> {t(selectedResource.servicesKey)}
            </p>
            {selectedResource.timings && (
              <p className="text-xs text-textSecondary mt-1">
                <strong>{t('sehat.hoursLabel')}</strong> {selectedResource.timings}
              </p>
            )}
            {selectedResource.phone && (
              <a
                href={`tel:${selectedResource.phone}`}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-gradient font-bold text-white shadow-clay text-sm"
              >
                <AppIcon name="call" size={16} />
                <span>{t('sehat.callPhone', { phone: selectedResource.phone })}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
