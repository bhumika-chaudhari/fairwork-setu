import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import type { DeactivationWizardData, AppealDraft, PlatformSupportChannel } from '../../types/haq';
import {
  generateDeactivationAppeal,
  PLATFORM_SUPPORT_DIRECTORY,
  saveHaqCase,
} from '../../services/haqService';
import { readTextAloud, stopSpeaking } from '../../lib/speechSynthesis';

interface AppealGeneratorProps {
  wizardData: DeactivationWizardData;
  onBackToPlan?: () => void;
  onCaseSaved?: (caseId: string) => void;
}

export default function AppealGenerator({
  wizardData,
  onBackToPlan,
  onCaseSaved,
}: AppealGeneratorProps) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState<AppealDraft | null>(null);
  const [editableBody, setEditableBody] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [isBilingual, setIsBilingual] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const effectivePlatform =
    wizardData.platform === 'Other platform'
      ? wizardData.customPlatformName || 'Platform Support'
      : wizardData.platform;

  const currentChannel: PlatformSupportChannel =
    PLATFORM_SUPPORT_DIRECTORY.find((p) =>
      p.platform.toLowerCase().includes(effectivePlatform.toLowerCase())
    ) || PLATFORM_SUPPORT_DIRECTORY[2];

  const loadDraft = async (bilingualMode = isBilingual) => {
    const res = await generateDeactivationAppeal(wizardData, i18n.language, bilingualMode);
    setDraft(res);
    setEditableSubject(res.subject);
    setEditableBody(res.body);
  };

  useEffect(() => {
    loadDraft(isBilingual);
    return () => {
      stopSpeaking();
    };
  }, [wizardData, i18n.language]);

  const handleCopy = async () => {
    try {
      const fullText = `Subject: ${editableSubject}\n\n${editableBody}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleToggleListen = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToRead = isBilingual && draft?.bilingualExplanation
        ? `${draft.bilingualExplanation}\n\n${editableBody}`
        : editableBody;
      const success = readTextAloud(textToRead, i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN', () => {
        setIsSpeaking(false);
      });
      if (success) setIsSpeaking(true);
    }
  };

  const handleDownload = () => {
    const fullText = `OFFICIAL SETU APPEAL DRAFT\nGenerated: ${new Date().toLocaleString()}\nPlatform: ${effectivePlatform}\n\nSubject: ${editableSubject}\n\n${editableBody}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Appeal_${effectivePlatform.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveCase = (status: 'draft' | 'submitted') => {
    const saved = saveHaqCase({
      platform: effectivePlatform,
      category: 'deactivation',
      title: `Account Deactivation Appeal (${effectivePlatform})`,
      dateOccurred: wizardData.dateNotRemembered ? 'Recent days' : wizardData.dateOccurred,
      status,
      ticketNumber: wizardData.ticketNumber,
      appealSubject: editableSubject,
      appealBody: editableBody,
      outcomeRequested: wizardData.requestedOutcome,
      evidenceSummary: wizardData.screenshotName
        ? `Screenshot (${wizardData.screenshotName})`
        : wizardData.pastedNoticeText
        ? 'Pasted notice text'
        : 'Factual statement',
      hasEvidence: Boolean(wizardData.screenshotName || wizardData.pastedNoticeText),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onCaseSaved) {
      onCaseSaved(saved.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full bg-warmAmber/20 px-2 py-0.5 text-[10px] font-bold text-warmCocoa border border-saffronGold/40">
              Step 5 • Ready to Submit
            </span>
            <h2 className="text-xl font-extrabold text-warmCocoa mt-1">
              {t('haqSetu.appealTitle', "Let's prepare your appeal")}
            </h2>
            <p className="text-xs text-textSecondary">
              {t(
                'haqSetu.appealSubtitle',
                'Polite, factual, and based strictly on the details you reported.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleListen}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm'
                  : 'bg-white/80 text-warmCocoa border border-softBorder hover:bg-white'
              }`}
            >
              <AppIcon name="volume-high" size={15} />
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Aloud'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextState = !isBilingual;
                setIsBilingual(nextState);
                loadDraft(nextState);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                isBilingual
                  ? 'bg-deepNavy text-white shadow-xs'
                  : 'bg-white/80 text-textSecondary border border-softBorder'
              }`}
            >
              Bilingual Mode {isBilingual ? '✓' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Bilingual Explanation Card for Worker */}
      {isBilingual && draft?.bilingualExplanation && (
        <div className="rounded-2xl bg-warmCream border border-softBorder p-4 shadow-glass space-y-1.5">
          <div className="flex items-center gap-2 text-warmCocoa font-extrabold text-xs">
            <AppIcon name="information-circle-outline" size={16} className="text-terracotta" />
            <span>Worker Reference & Summary (आपकी जानकारी के लिए):</span>
          </div>
          <pre className="font-sans text-xs text-textSecondary whitespace-pre-wrap leading-relaxed">
            {draft.bilingualExplanation}
          </pre>
        </div>
      )}

      {/* Appeal Email Form */}
      <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass space-y-3">
        {/* Recipient */}
        <div>
          <label className="block text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">
            Send To Official Support Email:
          </label>
          <div className="flex items-center justify-between rounded-xl bg-warmCream/70 border border-softBorder px-3 py-2 text-xs font-bold text-warmCocoa">
            <span>{currentChannel.supportEmail}</span>
            <span className="text-[10px] text-terracotta bg-warmAmber/20 px-2 py-0.5 rounded-full font-bold">
              Official Desk
            </span>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">
            Subject Line:
          </label>
          <input
            type="text"
            value={editableSubject}
            onChange={(e) => setEditableSubject(e.target.value)}
            className="w-full rounded-xl border border-softBorder bg-white/95 px-3 py-2.5 text-xs font-bold text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
          />
        </div>

        {/* Letter Body */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
              Formal Letter Content (You can edit directly):
            </label>
            <span className="text-[10px] text-textMuted">Tap text to edit</span>
          </div>
          <textarea
            rows={15}
            value={editableBody}
            onChange={(e) => setEditableBody(e.target.value)}
            className="w-full rounded-xl border border-softBorder bg-white/95 p-3.5 text-xs font-medium text-textPrimary shadow-inner leading-relaxed focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-softBorder">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="emerald-gradient-btn flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-warm active:scale-95 transition-all"
            >
              <AppIcon name={copied ? 'check' : 'copy'} size={14} />
              <span>{copied ? 'Copied to Clipboard! ✓' : 'Copy Full Appeal'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-full bg-white/90 border border-softBorder px-3.5 py-2 text-xs font-bold text-warmCocoa hover:bg-white shadow-xs active:scale-95 transition-all"
            >
              <AppIcon name="download-outline" size={14} />
              <span>Download Text File</span>
            </button>

            <button
              type="button"
              onClick={() => loadDraft(isBilingual)}
              className="flex items-center gap-1 rounded-full bg-white/80 border border-softBorder px-3 py-2 text-xs font-semibold text-textMuted hover:text-warmCocoa active:scale-95 transition-all"
              title="Reset to original template"
            >
              <AppIcon name="refresh" size={13} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveCase('draft')}
              className="rounded-full bg-white/90 border border-softBorder px-3.5 py-2 text-xs font-bold text-warmCocoa hover:bg-white shadow-xs active:scale-95 transition-all"
            >
              {savedSuccess ? 'Saved ✓' : 'Save as Draft Case'}
            </button>

            <button
              type="button"
              onClick={() => handleSaveCase('submitted')}
              className="rounded-full bg-deepNavy text-white px-3.5 py-2 text-xs font-bold shadow-xs hover:brightness-110 active:scale-95 transition-all"
            >
              Mark as Submitted by Me
            </button>
          </div>
        </div>
      </div>

      {/* Official Platform Instructions */}
      <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-warmCocoa">
          Official Support Channel Guidance for {effectivePlatform}:
        </h3>
        <p className="text-xs text-textSecondary leading-relaxed">
          <strong className="text-warmCocoa">How to submit:</strong> Paste this appeal into an email to{' '}
          <a
            href={`mailto:${currentChannel.supportEmail}?subject=${encodeURIComponent(editableSubject)}`}
            className="text-terracotta font-bold underline"
          >
            {currentChannel.supportEmail}
          </a>
          , or submit it through:
        </p>
        <p className="rounded-xl bg-warmCream p-2.5 text-xs text-textSecondary font-medium border border-softBorder">
          📍 {currentChannel.inAppPath}
        </p>
        <p className="text-[11px] text-textMuted">
          <strong>Important:</strong> Setu does not directly send messages to delivery platforms on your behalf. Always keep your sent email and save the ticket reference number you receive in reply.
        </p>
      </div>

      {onBackToPlan && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onBackToPlan}
            className="flex items-center gap-1.5 text-xs font-bold text-terracotta hover:underline"
          >
            <AppIcon name="arrow-back" size={14} />
            <span>Back to Action Plan Checklist</span>
          </button>
        </div>
      )}
    </div>
  );
}
