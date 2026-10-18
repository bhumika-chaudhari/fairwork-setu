import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '../../lib/icons';
import type { SymptomCategory, SymptomAssessment, SymptomGuidance } from '../../types/health';
import { getSymptomGuidance } from '../../services/healthService';

interface SymptomFollowUpModalProps {
  category: SymptomCategory;
  categoryTitle: string;
  categoryIcon: string;
  onClose: () => void;
  onOpenFacilities: (suggestedType?: string) => void;
  onOpenAssistant: (initialQuery?: string) => void;
  onOpenEmergency: () => void;
}

const RED_FLAG_OPTIONS: Record<SymptomCategory, { id: string; label: string; isDanger: boolean }[]> = {
  fever: [
    { id: 'stiff_neck', label: 'Stiff neck or severe confusion', isDanger: true },
    { id: 'rash', label: 'Sudden dark purple skin rash', isDanger: true },
    { id: 'shivering', label: 'Extreme shivering or chills', isDanger: false },
    { id: 'vomiting', label: 'Unable to keep any water down', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
  dizziness: [
    { id: 'chest_pain', label: 'Chest pain or pressure in chest', isDanger: true },
    { id: 'slurred_speech', label: 'Slurred speech or face drooping', isDanger: true },
    { id: 'fainting', label: 'Passed out or collapsed', isDanger: true },
    { id: 'heavy_sweating', label: 'Cold sweat and extreme thirst', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
  pain: [
    { id: 'chest_left_arm', label: 'Pain spreading to left arm or jaw', isDanger: true },
    { id: 'severe_fall', label: 'Followed a heavy fall or road collision', isDanger: true },
    { id: 'numb_legs', label: 'Numbness or loss of feeling in legs', isDanger: true },
    { id: 'muscle_stiffness', label: 'Stiff muscles from heavy lifting', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
  cough: [
    { id: 'blue_lips', label: 'Struggling to breathe or gasping for air', isDanger: true },
    { id: 'cough_blood', label: 'Coughing up blood or dark phlegm', isDanger: true },
    { id: 'high_fever', label: 'High fever lasting more than 3 days', isDanger: false },
    { id: 'traffic_soot', label: 'Irritation from vehicle dust & smoke', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
  injury: [
    { id: 'gushing_blood', label: 'Heavy bleeding that will not stop after 5 mins pressure', isDanger: true },
    { id: 'bone_deformity', label: 'Visible bone deformity or inability to stand', isDanger: true },
    { id: 'head_drowsy', label: 'Hit head and feeling sleepy or vomiting', isDanger: true },
    { id: 'minor_scrape', label: 'Surface scrape, burn, or shallow cut', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
  support: [
    { id: 'harm_thoughts', label: 'Feeling overwhelmed or thoughts of self-harm', isDanger: true },
    { id: 'panic_racing', label: 'Racing heart and feeling panicky', isDanger: false },
    { id: 'exhaustion', label: 'Severe fatigue and burnout from shifts', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
  other: [
    { id: 'breathing_trouble', label: 'Difficulty breathing', isDanger: true },
    { id: 'chest_discomfort', label: 'Chest discomfort or pressure', isDanger: true },
    { id: 'general_unwell', label: 'General weakness or seasonal fatigue', isDanger: false },
    { id: 'none', label: 'None of the above', isDanger: false },
  ],
};

export default function SymptomFollowUpModal({
  category,
  categoryTitle,
  categoryIcon,
  onClose,
  onOpenFacilities,
  onOpenAssistant,
  onOpenEmergency,
}: SymptomFollowUpModalProps) {
  const [step, setStep] = useState<'questions' | 'guidance'>('questions');
  const [onset, setOnset] = useState<'today' | '1-2_days' | '3+_days' | 'ongoing'>('today');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [trend, setTrend] = useState<'improving' | 'same' | 'worsening'>('same');
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [guidance, setGuidance] = useState<SymptomGuidance | null>(null);
  const [loading, setLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever changing steps
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

  const availableRedFlags = RED_FLAG_OPTIONS[category] || RED_FLAG_OPTIONS.other;

  const toggleFlag = (flagId: string) => {
    if (flagId === 'none') {
      setSelectedFlags(['none']);
      return;
    }
    const filtered = selectedFlags.filter((f) => f !== 'none');
    if (filtered.includes(flagId)) {
      setSelectedFlags(filtered.filter((f) => f !== flagId));
    } else {
      setSelectedFlags([...filtered, flagId]);
    }
  };

  const handleCalculateGuidance = async () => {
    setLoading(true);
    const assessment: SymptomAssessment = {
      category,
      onset,
      severity,
      trend,
      redFlags: selectedFlags,
    };

    try {
      const res = await getSymptomGuidance(assessment);
      setGuidance(res);
      setStep('guidance');
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-[#1E2B3E]/60 backdrop-blur-xs sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryTitle} Check-In`}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#F4EBDD] flex flex-col max-h-[92dvh] sm:max-h-[88vh] h-[92dvh] sm:h-auto overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] bg-white">
          {/* Mobile Handle indicator */}
          <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-2 sm:hidden" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#3A757D]/15 text-[#3A757D] border border-[#3A757D]/25 shadow-xs">
                <AppIcon name={categoryIcon} size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3A757D] block">
                  {step === 'questions' ? 'Health Check-In' : 'Assessment Result'}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1E2B3E] font-serif truncate">
                  {categoryTitle}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {step === 'guidance' && (
                <button
                  type="button"
                  onClick={() => setStep('questions')}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#B34A26] bg-[#FDF8F0] border border-[#F1B96B]/50 hover:bg-[#FDF3EE] transition-all"
                >
                  Edit Answers
                </button>
              )}
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
        </div>

        {/* Scrollable Content Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4"
        >
          {step === 'questions' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#FDF8F0] p-3 border border-[#F1B96B]/40">
                <p className="text-xs text-[#231F20]/80 leading-relaxed font-medium">
                  Answer 4 quick questions so Setu can provide safe, evidence-informed guidance tailored to your work day.
                </p>
              </div>

              {/* 1. Onset */}
              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1.5">
                  1. When did this symptom start?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: '1-2_days', label: '1–2 days ago' },
                    { id: '3+_days', label: '3+ days ago' },
                    { id: 'ongoing', label: 'Ongoing' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOnset(item.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center min-h-[42px] ${
                        onset === item.id
                          ? 'bg-[#B34A26] text-white border-[#B34A26] shadow-xs'
                          : 'bg-white text-stone-700 border-[#F4EBDD] hover:bg-stone-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Severity */}
              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1.5">
                  2. How severe does it feel?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mild', label: 'Mild', desc: 'Can continue shift' },
                    { id: 'moderate', label: 'Moderate', desc: 'Need frequent rest' },
                    { id: 'severe', label: 'Severe', desc: 'Cannot work safely' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSeverity(item.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col justify-center min-h-[58px] ${
                        severity === item.id
                          ? 'bg-[#B34A26] text-white border-[#B34A26] shadow-xs'
                          : 'bg-white text-stone-700 border-[#F4EBDD] hover:bg-stone-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`text-[10px] font-normal mt-0.5 leading-tight ${
                          severity === item.id ? 'text-white/85' : 'text-stone-500'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Trend */}
              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1.5">
                  3. Is it getting better or worse?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'improving', label: 'Improving' },
                    { id: 'same', label: 'About the same' },
                    { id: 'worsening', label: 'Worsening' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTrend(item.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center min-h-[42px] ${
                        trend === item.id
                          ? 'bg-[#B34A26] text-white border-[#B34A26] shadow-xs'
                          : 'bg-white text-stone-700 border-[#F4EBDD] hover:bg-stone-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Red Flag Warning Signs Check */}
              <div>
                <label className="block text-xs font-bold text-[#1E2B3E] mb-1">
                  4. Do you have any of these warning signs?
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Select any that apply to check for urgent medical conditions:
                </p>
                <div className="space-y-1.5">
                  {availableRedFlags.map((flag) => {
                    const isChecked = selectedFlags.includes(flag.id);
                    return (
                      <button
                        key={flag.id}
                        type="button"
                        onClick={() => toggleFlag(flag.id)}
                        className={`w-full text-left p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-all ${
                          isChecked
                            ? flag.isDanger
                              ? 'bg-red-50 border-red-300 text-red-950 font-bold'
                              : 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                            : 'bg-white border-[#F4EBDD] text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              isChecked
                                ? 'bg-[#B34A26] border-[#B34A26] text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isChecked && <AppIcon name="check" size={11} />}
                          </span>
                          <span className="leading-tight">{flag.label}</span>
                        </span>
                        {flag.isDanger && (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded shrink-0">
                            Urgent
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EVIDENCE-INFORMED GUIDANCE */}
          {step === 'guidance' && guidance && (
            <div className="space-y-4">
              {/* Critical Emergency Banner if triggered */}
              {guidance.isEmergency ? (
                <div className="rounded-2xl bg-red-50 border-2 border-red-300 p-4 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                      <AppIcon name="siren" size={22} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-red-900 uppercase tracking-wide">
                        Urgent Medical Attention Advised
                      </h4>
                      <p className="text-xs text-red-800 font-medium mt-0.5 leading-relaxed">
                        {guidance.emergencyReason}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href="tel:112"
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                    >
                      <AppIcon name="call" size={16} />
                      <span>Call 112</span>
                    </a>
                    <a
                      href="tel:108"
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                    >
                      <AppIcon name="heart" size={16} />
                      <span>Call 108</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#EBF5F3] border border-[#C6E2D8] p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3A757D] text-white shadow-xs">
                      <AppIcon name="heart-pulse" size={14} />
                    </div>
                    <h4 className="text-xs font-extrabold text-[#1E2B3E]">
                      What this means for your shift
                    </h4>
                  </div>
                  <p className="text-xs text-[#231F20]/85 leading-relaxed font-medium">
                    {guidance.summary}
                  </p>
                </div>
              )}

              {/* Recommended Next Steps */}
              <div>
                <h5 className="text-xs font-extrabold text-[#1E2B3E] mb-2 flex items-center gap-1.5">
                  <AppIcon name="checkmark-circle" size={15} className="text-[#3A757D]" />
                  <span>Recommended Next Steps:</span>
                </h5>
                <ul className="space-y-1.5">
                  {guidance.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-stone-800 flex items-start gap-2 bg-[#FDF8F0] p-2.5 rounded-xl border border-[#F4EBDD]"
                    >
                      <span className="font-bold text-[#B34A26] shrink-0">{idx + 1}.</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Practical Self-Care Tips */}
              <div>
                <h5 className="text-xs font-extrabold text-[#1E2B3E] mb-2 flex items-center gap-1.5">
                  <AppIcon name="sparkles" size={14} className="text-[#E5953E]" />
                  <span>Self-Care on Shift:</span>
                </h5>
                <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3 space-y-1.5">
                  {guidance.selfCareSteps.map((stepItem, idx) => (
                    <p key={idx} className="text-xs text-amber-950 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-[#B34A26] font-bold">•</span>
                      <span>{stepItem}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Red Flag Warning */}
              <div className="rounded-2xl bg-stone-100 p-3 border border-stone-200">
                <p className="text-[11px] font-semibold text-stone-700 flex items-start gap-1.5 leading-relaxed">
                  <AppIcon name="information-circle-outline" size={14} className="text-stone-500 shrink-0 mt-0.5" />
                  <span>{guidance.redFlagWarning}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Sticky Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] space-y-2">
          {step === 'questions' ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-stone-600 hover:bg-white border border-stone-200 transition-all active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCalculateGuidance}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#B34A26] to-[#7C2D16] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>{loading ? 'Evaluating answers...' : 'Continue & View Guidance'}</span>
                <AppIcon name="arrow-forward" size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFacilities(guidance?.suggestedFacilityType);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold text-white bg-[#3A757D] hover:bg-[#2A5960] shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
              >
                <AppIcon name="hospital" size={14} />
                <span>Find Nearby {guidance?.suggestedFacilityType?.toUpperCase() || 'CARE'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssistant(`I have ${categoryTitle.toLowerCase()}. What precautions should I take?`);
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#1E2B3E] bg-white hover:bg-stone-50 border border-stone-300 flex items-center justify-center gap-1.5 active:scale-98"
              >
                <AppIcon name="ai" size={14} />
                <span>Ask Setu AI</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 border border-stone-200"
              >
                Done
              </button>
            </div>
          )}

          <p className="text-[10px] text-stone-400 text-center leading-tight">
            FairWork Setu provides evidence-informed health guidance, not clinical medical diagnosis.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
