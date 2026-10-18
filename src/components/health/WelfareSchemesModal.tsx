import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '../../lib/icons';
import type { HealthScheme } from '../../types/health';
import {
  fetchHealthSchemes,
  saveHealthItem,
  removeSavedHealthItem,
  isHealthItemSaved,
} from '../../services/healthService';
import ModalPortal from '../ModalPortal';

interface WelfareSchemesModalProps {
  onClose: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Schemes' },
  { id: 'insurance', label: 'Cashless Hospital Cover' },
  { id: 'wellness', label: 'Free Primary Care' },
  { id: 'accident', label: 'Accident Insurance' },
  { id: 'medicine', label: 'Discount Medicines' },
  { id: 'maternity', label: 'Maternity Benefits' },
];

export default function WelfareSchemesModal({ onClose }: WelfareSchemesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState<HealthScheme | null>(null);
  const [isEligibilityFlowOpen, setIsEligibilityFlowOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  // Eligibility Flow State
  const [rationCardType, setRationCardType] = useState('orange');
  const [hasEshram, setHasEshram] = useState('yes');
  const [stateResidency, setStateResidency] = useState('maharashtra');
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ['welfare_health_schemes', selectedCategory],
    queryFn: () => fetchHealthSchemes(selectedCategory),
  });

  const handleToggleSave = (scheme: HealthScheme, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHealthItemSaved(scheme.id)) {
      removeSavedHealthItem(scheme.id);
      setSavedIds((prev) => ({ ...prev, [scheme.id]: false }));
    } else {
      saveHealthItem({
        id: scheme.id,
        type: 'scheme',
        title: scheme.name,
        subtitle: scheme.coverageAmount || scheme.shortDescription,
        data: scheme,
      });
      setSavedIds((prev) => ({ ...prev, [scheme.id]: true }));
    }
  };

  const handleRunEligibilityCheck = () => {
    const eligibleSchemes: string[] = [];

    // Ayushman Bharat PM-JAY & MJPJAY Check
    if (rationCardType === 'yellow' || rationCardType === 'orange' || rationCardType === 'antyodaya') {
      eligibleSchemes.push('Ayushman Bharat PM-JAY (₹5 Lakh cover)');
      if (stateResidency === 'maharashtra') {
        eligibleSchemes.push('MJPJAY Maharashtra (₹5 Lakh cashless hospital cover)');
      }
    }

    // e-Shram Accidental Cover
    if (hasEshram === 'yes') {
      eligibleSchemes.push('e-Shram Accidental Insurance (₹2 Lakh accidental cover)');
    }

    // Universal public benefits
    eligibleSchemes.push('Ayushman Arogya Mandirs (100% Free primary care & generic tests)');
    eligibleSchemes.push('Jan Aushadhi Generic Medicines (50%–90% price relief)');

    setEligibilityResult({
      eligibleSchemes,
      hasRationCard: rationCardType !== 'none',
      hasEshram: hasEshram === 'yes',
      nextSteps: [
        'Carry your original Aadhaar Card and Ration Card to the nearest Arogyamitra desk at any government district hospital.',
        'If not yet registered on e-Shram, visit eshram.gov.in or any Common Service Centre (CSC) to get your free UAN card.',
        'Download your Ayushman Golden Card via the Ayushman App or pmjay.gov.in.',
      ],
    });
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E5953E] text-white shadow-xs">
                <AppIcon name="hand-heart" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1E2B3E] font-serif">
                  Health Benefits & Welfare Schemes
                </h3>
                <p className="text-xs text-[#231F20]/75">
                  Verified government health protection for informal and gig workers.
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

        {/* Guided Eligibility Checker Banner CTA & Filter Bar */}
        <div className="px-5 pt-3 shrink-0 space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-[#FDF8F0] border border-[#F1B96B]/50 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <h4 className="text-xs font-black text-[#7C2D16]">
                Not sure which scheme you qualify for?
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Answer 3 simple questions to check your probable eligibility for ₹5 Lakh health cover.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEligibilityFlowOpen(true);
                setEligibilityResult(null);
              }}
              className="py-1.5 px-3 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-all"
            >
              Check Eligibility
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-[#B34A26] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-stone-500">
              Loading verified government schemes...
            </div>
          ) : (
            schemes.map((scheme) => {
              const isSaved = savedIds[scheme.id] ?? isHealthItemSaved(scheme.id);
              return (
                <div
                  key={scheme.id}
                  onClick={() => setSelectedSchemeDetail(scheme)}
                  className="rounded-2xl border border-[#F4EBDD] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#B34A26]/40 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {scheme.coverageAmount && (
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {scheme.coverageAmount}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-stone-500">
                          Verified: {scheme.lastVerified}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-[#1E2B3E] mt-1">
                        {scheme.name}
                      </h4>
                      {scheme.hindiName && (
                        <p className="text-[11px] text-stone-500 font-medium font-serif">
                          {scheme.hindiName}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(scheme, e)}
                      className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-[#B34A26] transition-all"
                      title={isSaved ? 'Saved in My Resources' : 'Save this scheme'}
                    >
                      <AppIcon
                        name={isSaved ? 'bookmark-check' : 'bookmark'}
                        size={18}
                        className={isSaved ? 'text-[#B34A26]' : 'text-stone-400'}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {scheme.shortDescription}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                    <span className="text-[11px] font-semibold text-stone-500">
                      Target: {scheme.targetBeneficiaries}
                    </span>
                    <span className="font-bold text-[#B34A26] hover:underline flex items-center gap-1">
                      <span>View benefits & criteria</span>
                      <AppIcon name="arrow-forward" size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SCHEME DETAIL MODAL SHEET */}
        <ModalPortal
          isOpen={Boolean(selectedSchemeDetail)}
          onClose={() => setSelectedSchemeDetail(null)}
          zIndexClass="z-60"
          maxWidthClass="sm:max-w-lg"
        >
          {selectedSchemeDetail && (
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[85vh]">
              <div className="flex items-start justify-between border-b border-stone-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#B34A26] bg-[#B34A26]/10 px-2 py-0.5 rounded">
                    Official Government Scheme
                  </span>
                  <h4 className="text-base font-extrabold text-[#1E2B3E] mt-1">
                    {selectedSchemeDetail.name}
                  </h4>
                  {selectedSchemeDetail.hindiName && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      {selectedSchemeDetail.hindiName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSchemeDetail(null)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>

              {/* Coverage Highlight */}
              {selectedSchemeDetail.coverageAmount && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Financial Protection
                  </span>
                  <span className="text-sm font-black text-emerald-900">
                    {selectedSchemeDetail.coverageAmount}
                  </span>
                </div>
              )}

              {/* Benefits */}
              <div>
                <h5 className="text-xs font-extrabold text-[#1E2B3E] mb-1.5">
                  Key Benefits & Support:
                </h5>
                <ul className="space-y-1">
                  {selectedSchemeDetail.benefits.map((b, idx) => (
                    <li key={idx} className="text-xs text-stone-700 flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Eligibility Criteria */}
              <div>
                <h5 className="text-xs font-extrabold text-[#1E2B3E] mb-1.5">
                  Eligibility Criteria:
                </h5>
                <ul className="space-y-1">
                  {selectedSchemeDetail.eligibilityCriteria.map((c, idx) => (
                    <li key={idx} className="text-xs text-stone-700 flex items-start gap-1.5">
                      <span className="text-[#B34A26]">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Documents */}
              <div>
                <h5 className="text-xs font-extrabold text-[#1E2B3E] mb-1.5">
                  Required Documents:
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSchemeDetail.requiredDocuments.map((doc, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200"
                    >
                      📄 {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Official Links & Phone */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-stone-200">
                <a
                  href={selectedSchemeDetail.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <AppIcon name="external-link" size={14} />
                  <span>Official Application Portal</span>
                </a>

                {selectedSchemeDetail.helplinePhone && (
                  <a
                    href={`tel:${selectedSchemeDetail.helplinePhone.replace(/[^0-9]/g, '')}`}
                    className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <AppIcon name="call" size={14} />
                    <span>Call Helpline: {selectedSchemeDetail.helplinePhone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </ModalPortal>

        {/* GUIDED ELIGIBILITY CHECKER MODAL */}
        <ModalPortal
          isOpen={isEligibilityFlowOpen}
          onClose={() => setIsEligibilityFlowOpen(false)}
          zIndexClass="z-60"
          maxWidthClass="sm:max-w-lg"
        >
          {isEligibilityFlowOpen && (
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div>
                  <h4 className="text-base font-extrabold text-[#1E2B3E]">
                    Guided Scheme Eligibility Check
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Informational check based on official government guidelines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEligibilityFlowOpen(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>

              {!eligibilityResult ? (
                <div className="space-y-4">
                  {/* Q1: Ration Card */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B3E] mb-1.5">
                      1. Which Ration Card does your family hold?
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'yellow', label: 'Yellow (BPL / Antyodaya)' },
                        { id: 'orange', label: 'Orange (State NFSA / Priority)' },
                        { id: 'white', label: 'White (Above Poverty Line)' },
                        { id: 'none', label: 'Do not have a ration card' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRationCardType(item.id)}
                          className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                            rationCardType === item.id
                              ? 'bg-[#B34A26] text-white border-[#B34A26]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: e-Shram */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B3E] mb-1.5">
                      2. Are you registered on the e-Shram portal with a UAN number?
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'yes', label: 'Yes, registered' },
                        { id: 'no', label: 'No' },
                        { id: 'unsure', label: 'Not sure' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHasEshram(item.id)}
                          className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                            hasEshram === item.id
                              ? 'bg-[#B34A26] text-white border-[#B34A26]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: State */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B3E] mb-1.5">
                      3. Where is your primary work and residence?
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'maharashtra', label: 'Maharashtra' },
                        { id: 'other', label: 'Other State in India' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setStateResidency(item.id)}
                          className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                            stateResidency === item.id
                              ? 'bg-[#B34A26] text-white border-[#B34A26]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunEligibilityCheck}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white font-bold text-xs shadow-md mt-2"
                  >
                    Assess My Eligibility
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      Evaluation Outcome
                    </span>
                    <h5 className="text-sm font-extrabold text-emerald-950 mt-0.5">
                      You are likely eligible for these schemes:
                    </h5>
                    <ul className="mt-2 space-y-1">
                      {eligibilityResult.eligibleSchemes.map((s: string, idx: number) => (
                        <li key={idx} className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <span>✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-extrabold text-[#1E2B3E] mb-1">
                      Recommended Next Steps to Claim:
                    </h5>
                    <ul className="space-y-1">
                      {eligibilityResult.nextSteps.map((step: string, idx: number) => (
                        <li key={idx} className="text-xs text-stone-700 flex items-start gap-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                          <span className="font-bold text-[#B34A26]">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[10px] text-stone-400 leading-tight">
                    * Disclaimer: This guided check is informational only and does not constitute official approval. Final enrollment is conducted by authorized government portal authorities.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEligibilityResult(null)}
                      className="py-2 px-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                    >
                      Change Answers
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEligibilityFlowOpen(false)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#B34A26] text-white text-xs font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalPortal>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-between text-xs text-stone-500">
          <span>Authoritative government portals</span>
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
