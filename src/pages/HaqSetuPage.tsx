import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import ListenButton from '../components/ListenButton';
import LanguageSelector from '../components/LanguageSelector';
import AccountDeactivationWizard from '../components/haq/AccountDeactivationWizard';
import GrievanceTracker from '../components/haq/GrievanceTracker';
import LegalSourcesLibrary from '../components/haq/LegalSourcesLibrary';
import { useVoiceAssistant } from '../hooks/VoiceAssistantContext';
import ModalPortal from '../components/ModalPortal';
import { readTextAloud } from '../lib/speechSynthesis';
import type { SpeechTrack } from '../lib/speechSynthesisContext';

type HaqView = 'overview' | 'deactivation_wizard' | 'cases' | 'rights';

export default function HaqSetuPage() {
  const { t, i18n } = useTranslation();
  const { openAssistant } = useVoiceAssistant();
  const [currentView, setCurrentView] = useState<HaqView>('overview');
  const [missingPaymentModalOpen, setMissingPaymentModalOpen] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [somethingElseModalOpen, setSomethingElseModalOpen] = useState(false);

  // Exact primary heading and copy from instructions
  const headingText = "How can we help you today?";
  const supportingCopy =
    "Facing a work problem? Tell us what happened. We'll help you understand your options and take the next step.";

  const speechTrack: SpeechTrack = {
    id: 'haq-setu-intro',
    title: 'Haq Setu Overview',
    speech: `${headingText}. ${supportingCopy} You can report a deactivated account, missing payment, penalty, or speak directly to Setu.`,
    lang: i18n.language || 'en',
  };

  const handleListenCard = (title: string, desc: string) => {
    readTextAloud(`${title}. ${desc}`);
  };

  return (
    <div className="space-y-6 px-4 py-4 md:py-6 md:px-0">
      {/* Top Header matching all other main tabs */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-extrabold text-lg shadow-md border border-[#F1B96B]/40">
            <AppIcon name="shield-checkmark" size={22} className="text-white drop-shadow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E2B3E] font-serif">
              {t('tabs.haqSetu', 'Rights (Hak)')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ListenButton track={speechTrack} size="sm" />
          <div className="md:hidden">
            <LanguageSelector variant="icon" />
          </div>
        </div>
      </header>

      {/* Top Breadcrumb / Mode Bar if in Wizard */}
      {currentView === 'deactivation_wizard' ? (
        <AccountDeactivationWizard
          onBackToHaqHome={() => setCurrentView('overview')}
          onCaseSaved={(caseId: string) => {
            setCurrentView('cases');
          }}
        />
      ) : (
        <>
          {/* Main Hero Header */}
          <section className="relative overflow-hidden rounded-3xl border border-[#F4EBDD] bg-gradient-to-br from-white via-[#FDF8F0] to-[#F4EBDD]/60 p-6 md:p-8 shadow-sm">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 rounded-full bg-[#E5953E]/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-xl md:text-2xl font-bold text-[#1E2B3E] font-serif tracking-tight">
                  {t('haqSetu.heroTitle', headingText)}
                </h2>
                <p className="text-sm md:text-base text-[#231F20]/80 leading-relaxed font-normal">
                  {t('haqSetu.heroSubtitle', supportingCopy)}
                </p>
              </div>
            </div>

            {/* Quick Navigation Pills: Actions / My Cases / Legal Rights */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-[#F4EBDD]">
              <button
                type="button"
                onClick={() => setCurrentView('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  currentView === 'overview'
                    ? 'bg-[#B34A26] text-white shadow-sm'
                    : 'bg-white/80 border border-[#F4EBDD] text-[#1E2B3E] hover:bg-white'
                }`}
              >
                <AppIcon name="grid" size={14} />
                <span>Get Help & Actions</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('cases')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  currentView === 'cases'
                    ? 'bg-[#B34A26] text-white shadow-sm'
                    : 'bg-white/80 border border-[#F4EBDD] text-[#1E2B3E] hover:bg-white'
                }`}
              >
                <AppIcon name="document-text" size={14} />
                <span>My Saved Cases</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('rights')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  currentView === 'rights'
                    ? 'bg-[#B34A26] text-white shadow-sm'
                    : 'bg-white/80 border border-[#F4EBDD] text-[#1E2B3E] hover:bg-white'
                }`}
              >
                <AppIcon name="scale" size={14} />
                <span>Understand My Rights</span>
              </button>
            </div>
          </section>

          {/* VIEW: OVERVIEW (4 Action Cards + Prominent Voice CTA) */}
          {currentView === 'overview' && (
            <div className="space-y-6">
              {/* COMPACT VOICE ACTION PILL */}
              <section className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#F1B96B]/50 bg-gradient-to-r from-white via-[#FDF8F0] to-white shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-xs">
                    <AppIcon name="mic" size={18} className="text-white drop-shadow" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5953E] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E5953E]" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-[#1E2B3E] font-serif truncate">
                      Tell Setu what happened
                    </h2>
                    <p className="text-[11px] text-[#231F20]/70 truncate">
                      Speak or describe your issue in your own words
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAssistant()}
                  className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] hover:brightness-105 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                  aria-label="Talk to Setu"
                >
                  <AppIcon name="mic" size={13} />
                  <span>Talk to Setu</span>
                </button>
              </section>

              {/* 4 Accessible Action Cards */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#1E2B3E] font-serif">
                    Select your problem to begin
                  </h2>
                  <span className="text-xs text-[#231F20]/60">
                    Step-by-step guidance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: My account is deactivated */}
                  <div
                    onClick={() => setCurrentView('deactivation_wizard')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setCurrentView('deactivation_wizard');
                    }}
                    className="group relative rounded-3xl border-2 border-[#B34A26]/30 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#B34A26] transition-all cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/60 text-[#B34A26] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <AppIcon name="shield-alert" size={26} />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleListenCard('My account is deactivated', 'Get help with a blocked or suspended account.');
                          }}
                          className="p-1.5 rounded-lg border border-[#F4EBDD] text-[#7C2D16] hover:bg-[#FDF8F0]"
                          title="Listen aloud"
                        >
                          <AppIcon name="mic" size={14} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#1E2B3E] group-hover:text-[#B34A26] transition-colors">
                          My account is deactivated
                        </h3>
                        <p className="text-xs text-[#231F20]/75 mt-1 leading-relaxed">
                          Get help with a blocked or suspended account.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F4EBDD]">
                      <span className="text-xs font-bold text-[#B34A26] group-hover:underline">
                        Launch Recovery Wizard
                      </span>
                      <AppIcon name="arrow-forward" size={16} className="text-[#B34A26] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 2: My payment is missing */}
                  <div
                    onClick={() => setMissingPaymentModalOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setMissingPaymentModalOpen(true);
                    }}
                    className="group relative rounded-3xl border border-[#F4EBDD] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#E5953E] transition-all cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/60 text-[#E5953E] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <AppIcon name="wallet" size={26} />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleListenCard('My payment is missing', 'Understand payment issues and prepare a complaint.');
                          }}
                          className="p-1.5 rounded-lg border border-[#F4EBDD] text-[#7C2D16] hover:bg-[#FDF8F0]"
                          title="Listen aloud"
                        >
                          <AppIcon name="mic" size={14} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#1E2B3E] group-hover:text-[#B34A26] transition-colors">
                          My payment is missing
                        </h3>
                        <p className="text-xs text-[#231F20]/75 mt-1 leading-relaxed">
                          Understand payment issues and prepare a complaint.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F4EBDD]">
                      <span className="text-xs font-bold text-[#7C2D16] group-hover:underline">
                        Review Payment Checklist
                      </span>
                      <AppIcon name="arrow-forward" size={16} className="text-[#7C2D16] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 3: I received a penalty or complaint */}
                  <div
                    onClick={() => setPenaltyModalOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setPenaltyModalOpen(true);
                    }}
                    className="group relative rounded-3xl border border-[#F4EBDD] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#3A757D] transition-all cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FDF8F0] border border-[#F4EBDD] text-[#3A757D] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <AppIcon name="message-warning" size={26} />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleListenCard('I received a penalty or complaint', 'Organize evidence and understand your options.');
                          }}
                          className="p-1.5 rounded-lg border border-[#F4EBDD] text-[#7C2D16] hover:bg-[#FDF8F0]"
                          title="Listen aloud"
                        >
                          <AppIcon name="mic" size={14} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#1E2B3E] group-hover:text-[#B34A26] transition-colors">
                          I received a penalty or complaint
                        </h3>
                        <p className="text-xs text-[#231F20]/75 mt-1 leading-relaxed">
                          Organize evidence and understand your options.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F4EBDD]">
                      <span className="text-xs font-bold text-[#3A757D] group-hover:underline">
                        Contest Penalty / Deductions
                      </span>
                      <AppIcon name="arrow-forward" size={16} className="text-[#3A757D] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 4: Something else */}
                  <div
                    onClick={() => setSomethingElseModalOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSomethingElseModalOpen(true);
                    }}
                    className="group relative rounded-3xl border border-[#F4EBDD] bg-white p-6 shadow-sm hover:shadow-md hover:border-stone-400 transition-all cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FDF8F0] border border-[#F4EBDD] text-[#7C2D16] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <AppIcon name="message-circle" size={26} />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleListenCard('Something else', 'Tell us about another problem affecting your work.');
                          }}
                          className="p-1.5 rounded-lg border border-[#F4EBDD] text-[#7C2D16] hover:bg-[#FDF8F0]"
                          title="Listen aloud"
                        >
                          <AppIcon name="mic" size={14} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#1E2B3E] group-hover:text-[#B34A26] transition-colors">
                          Something else
                        </h3>
                        <p className="text-xs text-[#231F20]/75 mt-1 leading-relaxed">
                          Tell us about another problem affecting your work.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F4EBDD]">
                      <span className="text-xs font-bold text-[#231F20] group-hover:underline">
                        Describe Work Issue
                      </span>
                      <AppIcon name="arrow-forward" size={16} className="text-[#231F20] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Integrated Grievance Tracker Preview */}
              <section className="pt-4">
                <GrievanceTracker onStartNewCase={() => setCurrentView('deactivation_wizard')} />
              </section>
            </div>
          )}

          {/* VIEW: CASES */}
          {currentView === 'cases' && (
            <div className="space-y-4">
              <GrievanceTracker onStartNewCase={() => setCurrentView('deactivation_wizard')} />
            </div>
          )}

          {/* VIEW: RIGHTS */}
          {currentView === 'rights' && (
            <div className="space-y-4">
              <LegalSourcesLibrary />
            </div>
          )}
        </>
      )}

      {/* Missing Payment Guidance Modal */}
      <ModalPortal
        isOpen={missingPaymentModalOpen}
        onClose={() => setMissingPaymentModalOpen(false)}
        maxWidthClass="sm:max-w-lg"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-start justify-between px-5 pt-3 pb-3 border-b border-[#F4EBDD]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDF8F0] text-[#E5953E] flex items-center justify-center shrink-0">
              <AppIcon name="wallet" size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1E2B3E] font-serif leading-tight">
                Missing or Delayed Payment
              </h3>
              <p className="text-[11px] sm:text-xs text-[#231F20]/70">Action checklist & complaint guide</p>
            </div>
          </div>
          <button
            onClick={() => setMissingPaymentModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 text-xs text-[#231F20] leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/40 space-y-2">
            <h4 className="font-bold text-[#7C2D16] text-sm">3 Essential Steps to Take Now:</h4>
            <ol className="list-decimal pl-4 space-y-1.5 font-medium">
              <li><strong>Collect Trip & Order IDs:</strong> Note down specific delivery or ride IDs and the exact date/timestamp.</li>
              <li><strong>Check Weekly Payout Cutoff:</strong> Most platforms process cycle payments by Tuesday/Wednesday. Verify bank account IFSC accuracy in your app profile.</li>
              <li><strong>Submit a Wage Withholding Dispute:</strong> Under Indian labour standards, platforms cannot withhold undisputed earnings without written notice.</li>
            </ol>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2">
            <h4 className="font-bold text-[#1E2B3E]">Official Support Contacts:</h4>
            <ul className="space-y-1 text-stone-700">
              <li><strong>Zomato Rider Support:</strong> riderhelp@zomato.com</li>
              <li><strong>Swiggy Delivery Partner:</strong> delivery.support@swiggy.in</li>
              <li><strong>Rajasthan Welfare Board (Grievance Cell):</strong> 0141-2227181</li>
            </ul>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-2">
          <button
            onClick={() => setMissingPaymentModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-white"
          >
            Close
          </button>
          <button
            onClick={() => {
              setMissingPaymentModalOpen(false);
              setCurrentView('deactivation_wizard');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#B34A26] hover:bg-[#7C2D16] shadow-sm"
          >
            Draft Formal Dispute Appeal
          </button>
        </div>
      </ModalPortal>

      {/* Penalty Dispute Modal */}
      <ModalPortal
        isOpen={penaltyModalOpen}
        onClose={() => setPenaltyModalOpen(false)}
        maxWidthClass="sm:max-w-lg"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-start justify-between px-5 pt-3 pb-3 border-b border-[#F4EBDD]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDF8F0] text-[#3A757D] flex items-center justify-center shrink-0">
              <AppIcon name="message-warning" size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1E2B3E] font-serif leading-tight">
                Contest Penalty or Unfair Complaint
              </h3>
              <p className="text-[11px] sm:text-xs text-[#231F20]/70">Defend against automated deductions</p>
            </div>
          </div>
          <button
            onClick={() => setPenaltyModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 text-xs text-[#231F20] leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <h4 className="font-bold text-sm">Worker Protection Standard:</h4>
            <p>
              Automated penalties levied due to restaurant delays, severe weather, traffic jams, or false customer cancellation claims can be challenged. You have the right to request proof and review.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2">
            <h4 className="font-bold text-[#1E2B3E]">Evidence you should preserve:</h4>
            <ul className="list-disc pl-4 space-y-1 text-stone-700">
              <li>Screenshots of customer chat showing delay notifications</li>
              <li>GPS location history showing waiting at pickup spot</li>
              <li>Photos of delivered items at customer doorstep (if applicable)</li>
            </ul>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-2">
          <button
            onClick={() => setPenaltyModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-white"
          >
            Close
          </button>
          <button
            onClick={() => {
              setPenaltyModalOpen(false);
              setCurrentView('deactivation_wizard');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#B34A26] hover:bg-[#7C2D16] shadow-sm"
          >
            Start Penalty Appeal
          </button>
        </div>
      </ModalPortal>

      {/* Something Else / General Grievance Modal */}
      <ModalPortal
        isOpen={somethingElseModalOpen}
        onClose={() => setSomethingElseModalOpen(false)}
        maxWidthClass="sm:max-w-lg"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-start justify-between px-5 pt-3 pb-3 border-b border-[#F4EBDD]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDF8F0] text-[#7C2D16] flex items-center justify-center shrink-0">
              <AppIcon name="message-circle" size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1E2B3E] font-serif leading-tight">
                Tell Us About Your Work Issue
              </h3>
              <p className="text-[11px] sm:text-xs text-[#231F20]/70">Safety, harassment, app glitches, or health</p>
            </div>
          </div>
          <button
            onClick={() => setSomethingElseModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          <p className="text-xs text-[#231F20]/80 leading-relaxed">
            Setu is designed to protect your livelihood across every challenge. You can speak to Setu in Hindi, Marathi, or English, or use our general grievance wizard.
          </p>

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={() => {
                setSomethingElseModalOpen(false);
                openAssistant();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#B34A26] hover:bg-[#7C2D16] flex items-center justify-center gap-2 shadow-sm"
            >
              <AppIcon name="mic" size={16} />
              <span>Speak with Setu Voice Assistant</span>
            </button>
            <button
              onClick={() => {
                setSomethingElseModalOpen(false);
                setCurrentView('rights');
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#1E2B3E] border border-[#F4EBDD] bg-[#FDF8F0] hover:bg-[#F1B96B]/20 flex items-center justify-center gap-2"
            >
              <AppIcon name="scale" size={16} />
              <span>Browse Worker Rights & Acts</span>
            </button>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end">
          <button
            onClick={() => setSomethingElseModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-white"
          >
            Close
          </button>
        </div>
      </ModalPortal>
    </div>
  );
}
