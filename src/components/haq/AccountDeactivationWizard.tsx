import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon } from '../../lib/icons';
import type { DeactivationWizardData, CaseAssessment } from '../../types/haq';
import { assessDeactivationCase } from '../../services/haqService';
import { useTransactions } from '../../hooks/TransactionContext';
import { formatInr } from '../../localization';
import AppealGenerator from './AppealGenerator';

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface AccountDeactivationWizardProps {
  onCancel?: () => void;
  onBackToHaqHome?: () => void;
  onFinishCase?: (caseId: string) => void;
  onCaseSaved?: (caseId: string) => void;
}

export default function AccountDeactivationWizard({
  onCancel,
  onBackToHaqHome,
  onFinishCase,
  onCaseSaved,
}: AccountDeactivationWizardProps) {
  const handleExit = onCancel || onBackToHaqHome;
  const handleComplete = onFinishCase || onCaseSaved;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { summary } = useTransactions();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [assessment, setAssessment] = useState<CaseAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [showAppealGenerator, setShowAppealGenerator] = useState(false);

  // Form State
  const [data, setData] = useState<DeactivationWizardData>({
    platform: 'Zomato',
    customPlatformName: '',
    problemType: 'permanently_deactivated',
    dateOccurred: new Date().toISOString().split('T')[0],
    dateNotRemembered: false,
    reasonGiven: 'yes_message',
    reasonCategory: 'customer_complaint',
    screenshotName: undefined,
    screenshotPreviewUrl: undefined,
    screenshotSize: undefined,
    pastedNoticeText: '',
    userDescription: '',
    hasContactedSupport: false,
    hasSubmittedAppeal: false,
    ticketNumber: '',
    requestedOutcome: 'reactivation',
    workerName: '',
    workerMaskedId: '',
  });

  const [fileError, setFileError] = useState<string | null>(null);

  // Compute average daily earnings from recorded transactions or fallback to ₹850
  const avgDailyIncome =
    summary.totalIncome > 0 && summary.activeDaysCount > 0
      ? summary.avgDailyIncome || Math.round(summary.totalIncome / Math.max(1, summary.activeDaysCount))
      : 850;

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (data.screenshotPreviewUrl) {
        URL.revokeObjectURL(data.screenshotPreviewUrl);
      }
    };
  }, [data.screenshotPreviewUrl]);

  // When reaching Step 5, run the assessment engine
  useEffect(() => {
    if (currentStep === 5) {
      setIsAssessing(true);
      assessDeactivationCase(data, avgDailyIncome)
        .then((res) => {
          setAssessment(res);
        })
        .finally(() => {
          setIsAssessing(false);
        });
    }
  }, [currentStep, data, avgDailyIncome]);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFileError('Unsupported file type. Please select a PNG, JPEG, or WebP image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFileError('File exceeds 8 MB limit. Please select a smaller screenshot.');
      return;
    }

    if (data.screenshotPreviewUrl) {
      URL.revokeObjectURL(data.screenshotPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setData((prev) => ({
      ...prev,
      screenshotName: file.name,
      screenshotPreviewUrl: previewUrl,
      screenshotSize: file.size,
    }));
  };

  const handleRemoveImage = () => {
    if (data.screenshotPreviewUrl) {
      URL.revokeObjectURL(data.screenshotPreviewUrl);
    }
    setData((prev) => ({
      ...prev,
      screenshotName: undefined,
      screenshotPreviewUrl: undefined,
      screenshotSize: undefined,
    }));
    setFileError(null);
  };

  if (showAppealGenerator) {
    return (
      <AppealGenerator
        wizardData={data}
        onBackToPlan={() => setShowAppealGenerator(false)}
        onCaseSaved={(id) => {
          if (handleComplete) handleComplete(id);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Step Progress Header */}
      <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4);
                } else if (handleExit) {
                  handleExit();
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-softBorder text-warmCocoa hover:bg-cleanWhite shadow-xs active:scale-95 transition-all"
              aria-label="Back"
            >
              <AppIcon name="arrow-back" size={16} />
            </button>
            <span className="text-xs font-black text-warmCocoa uppercase tracking-wider">
              Account Recovery Wizard
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-terracotta">
              Step {currentStep} of 5
            </span>
          </div>
        </div>

        {/* Wizard Step Bar */}
        <div className="h-1.5 w-full bg-warmAmber/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B34A26] to-[#7C2D16] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step Label indicators */}
        <div className="mt-2.5 flex justify-between text-[10px] font-bold text-textMuted px-1">
          <span className={currentStep >= 1 ? 'text-warmCocoa font-black' : ''}>1. Platform</span>
          <span className={currentStep >= 2 ? 'text-warmCocoa font-black' : ''}>2. Problem</span>
          <span className={currentStep >= 3 ? 'text-warmCocoa font-black' : ''}>3. Evidence</span>
          <span className={currentStep >= 4 ? 'text-warmCocoa font-black' : ''}>4. Details</span>
          <span className={currentStep >= 5 ? 'text-warmCocoa font-black' : ''}>5. Action Plan</span>
        </div>
      </div>

      {/* Step Content Container */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* STEP 1: SELECT PLATFORM */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-5 shadow-glass space-y-4"
          >
            <div>
              <h2 className="text-lg font-extrabold text-warmCocoa">
                Which platform is affected?
              </h2>
              <p className="text-xs text-textSecondary mt-0.5">
                Select the delivery or mobility app where your account has been blocked or suspended.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['Zomato', 'Swiggy', 'Other platform', 'Not sure'].map((plat) => {
                const isSelected = data.platform === plat;
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setData((p) => ({ ...p, platform: plat }))}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-warmAmber/20 border-2 border-terracotta shadow-warm scale-[1.02]'
                        : 'bg-white/80 border-softBorder hover:bg-white text-textPrimary'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl mb-2 transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-xs'
                          : 'bg-warmCream text-terracotta'
                      }`}
                    >
                      <AppIcon name={plat === 'Zomato' ? 'restaurant-outline' : plat === 'Swiggy' ? 'bicycle-outline' : 'briefcase'} size={22} />
                    </div>
                    <span className="text-xs font-bold leading-tight text-warmCocoa">
                      {plat}
                    </span>
                  </button>
                );
              })}
            </div>

            {data.platform === 'Other platform' && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  Specify Platform Name:
                </label>
                <input
                  type="text"
                  value={data.customPlatformName || ''}
                  onChange={(e) => setData((p) => ({ ...p, customPlatformName: e.target.value }))}
                  placeholder="e.g. Uber, Ola, Urban Company, Porter, Dunzo"
                  className="w-full rounded-xl border border-softBorder bg-white/95 px-3.5 py-2.5 text-xs font-medium text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>
            )}

            {/* Non-Affiliation Notice */}
            <div className="flex items-start gap-2 rounded-xl bg-warmCream p-3 text-[11px] text-textMuted border border-softBorder">
              <AppIcon name="information-circle-outline" size={15} className="shrink-0 text-terracotta mt-0.5" />
              <p>
                Setu is an independent worker-rights companion. We are not affiliated with, endorsed by, or acting on behalf of Zomato, Swiggy, or any other company.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-softBorder">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="emerald-gradient-btn flex items-center gap-2 rounded-full px-7 py-2.5 text-xs font-bold text-white shadow-warm active:scale-95 transition-all"
              >
                <span>Continue</span>
                <AppIcon name="arrow-forward" size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: UNDERSTAND ACCOUNT PROBLEM */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-5 shadow-glass space-y-4"
          >
            <div>
              <h2 className="text-lg font-extrabold text-warmCocoa">
                What happened to your account?
              </h2>
              <p className="text-xs text-textSecondary mt-0.5">
                Select the option that best describes the issue you are experiencing.
              </p>
            </div>

            {/* Problem Type Options */}
            <div className="space-y-2">
              {[
                { id: 'permanently_deactivated', label: 'My account is permanently deactivated.', sub: 'Received a permanent termination notice or account was deleted.' },
                { id: 'temporarily_suspended', label: 'My account is temporarily suspended.', sub: 'Account blocked for a fixed number of days or hours.' },
                { id: 'cannot_login', label: 'I cannot log in or access my account.', sub: 'App shows error, otp failure, or security lockout.' },
                { id: 'warning_penalty', label: 'I received a warning or penalty.', sub: 'Account is active, but earnings deducted or warning flag placed.' },
                { id: 'not_sure', label: 'I am not sure.', sub: 'App stopped assigning orders without clear reason.' },
              ].map((opt) => {
                const isSelected = data.problemType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setData((p) => ({ ...p, problemType: opt.id as any }))}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'bg-warmAmber/20 border-terracotta shadow-xs ring-1 ring-terracotta/40'
                        : 'bg-white/80 border-softBorder hover:bg-white'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 mt-0.5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-terracotta bg-terracotta' : 'border-textMuted'
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-warmCocoa block">{opt.label}</span>
                      <span className="text-[11px] text-textSecondary">{opt.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* When did it happen? */}
            <div className="pt-2 border-t border-softBorder space-y-2">
              <label className="block text-xs font-bold text-warmCocoa">
                When did this problem occur?
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  disabled={data.dateNotRemembered}
                  value={data.dateOccurred}
                  onChange={(e) => setData((p) => ({ ...p, dateOccurred: e.target.value }))}
                  className={`rounded-xl border border-softBorder px-3 py-2 text-xs font-medium text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30 ${
                    data.dateNotRemembered ? 'opacity-40 bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-textSecondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={data.dateNotRemembered}
                    onChange={(e) => setData((p) => ({ ...p, dateNotRemembered: e.target.checked }))}
                    className="rounded accent-terracotta h-4 w-4"
                  />
                  <span>I don't remember the exact date</span>
                </label>
              </div>
            </div>

            {/* Did platform provide a reason? */}
            <div className="pt-2 border-t border-softBorder space-y-2">
              <label className="block text-xs font-bold text-warmCocoa">
                Did the platform provide a specific reason?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'yes_message', label: 'Yes, I received a notice/SMS' },
                  { id: 'no_reason', label: 'No reason was given' },
                  { id: 'not_sure', label: 'I am not sure' },
                ].map((r) => {
                  const isSelected = data.reasonGiven === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setData((p) => ({ ...p, reasonGiven: r.id as any }))}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm border-saffronGold/40'
                          : 'bg-white/80 border-softBorder text-textSecondary hover:bg-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-softBorder">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-textMuted hover:text-warmCocoa"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="emerald-gradient-btn flex items-center gap-2 rounded-full px-7 py-2.5 text-xs font-bold text-white shadow-warm active:scale-95 transition-all"
              >
                <span>Continue</span>
                <AppIcon name="arrow-forward" size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: EVIDENCE UPLOAD & MESSAGE INPUT */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-5 shadow-glass space-y-4"
          >
            <div>
              <span className="rounded-full bg-warmAmber/20 px-2.5 py-0.5 text-[10px] font-bold text-warmCocoa border border-saffronGold/40">
                Optional Step
              </span>
              <h2 className="text-lg font-extrabold text-warmCocoa mt-1">
                Do you have a message or screenshot?
              </h2>
              <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">
                Share the notice you received, or describe what happened. This can help you prepare a clearer appeal. You can also skip this step.
              </p>
            </div>

            {/* Privacy Alert Banner */}
            <div className="rounded-xl bg-warmCream border border-softBorder p-3 space-y-1.5 text-xs text-textSecondary">
              <div className="flex items-center gap-2 font-bold text-warmCocoa">
                <AppIcon name="shield-checkmark" size={16} className="text-terracotta" />
                <span>Privacy & Security Notice:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-textMuted space-y-1">
                <li><strong>Never share passwords, OTPs, or UPI PINs</strong> — Setu will never ask for them.</li>
                <li>Screenshots may contain personal phone numbers. Review before sharing.</li>
                <li>Your preview is processed locally on your phone and is not stored or shared without your permission.</li>
              </ul>
            </div>

            {/* Option A: Image Upload */}
            <div className="rounded-xl border border-softBorder bg-white/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-warmCocoa flex items-center gap-1.5">
                  <AppIcon name="camera-outline" size={16} className="text-terracotta" />
                  <span>A. Upload a screenshot or photo of notice</span>
                </label>
                <span className="text-[10px] text-textMuted">PNG, JPG, WebP (Max 8 MB)</span>
              </div>

              {data.screenshotPreviewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-warmCream p-3 border border-softBorder">
                  <img
                    src={data.screenshotPreviewUrl}
                    alt="Notice Preview"
                    className="h-28 w-28 rounded-lg object-cover border border-softBorder shadow-xs"
                  />
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <p className="text-xs font-bold text-warmCocoa truncate max-w-xs">
                      {data.screenshotName}
                    </p>
                    <p className="text-[11px] text-textMuted">
                      Size: {data.screenshotSize ? `${(data.screenshotSize / 1024).toFixed(1)} KB` : 'Attached'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <label
                        htmlFor="replace-screenshot-input"
                        className="cursor-pointer rounded-full bg-white px-3 py-1 text-[11px] font-bold text-terracotta border border-softBorder hover:bg-cleanWhite shadow-xs"
                      >
                        Replace Image
                      </label>
                      <input
                        id="replace-screenshot-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-danger border border-rose-200 hover:bg-rose-100 shadow-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="haq-screenshot-input"
                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-softBorder rounded-xl cursor-pointer bg-warmCream/40 hover:bg-warmCream/80 transition-all text-center group"
                  >
                    <AppIcon name="upload" size={24} className="text-terracotta group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-bold text-warmCocoa">Tap to choose screenshot or photo</span>
                    <span className="text-[11px] text-textMuted mt-0.5">Capture camera photo or select from gallery</span>
                  </label>
                  <input
                    id="haq-screenshot-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {fileError && (
                <p className="text-[11px] font-bold text-danger">{fileError}</p>
              )}
            </div>

            {/* Option B: Paste Notice Message */}
            <div className="rounded-xl border border-softBorder bg-white/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-warmCocoa flex items-center gap-1.5">
                  <AppIcon name="message-square" size={15} className="text-terracotta" />
                  <span>B. Or paste the message text / SMS you received</span>
                </label>
                {data.pastedNoticeText && (
                  <button
                    type="button"
                    onClick={() => setData((p) => ({ ...p, pastedNoticeText: '' }))}
                    className="text-[11px] font-bold text-danger hover:underline"
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={data.pastedNoticeText || ''}
                onChange={(e) => setData((p) => ({ ...p, pastedNoticeText: e.target.value }))}
                placeholder="Paste the SMS, email, or in-app notice message here..."
                className="w-full rounded-xl border border-softBorder bg-white/95 p-3 text-xs font-medium text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              />
            </div>

            {/* Option C: Describe in own words */}
            <div className="rounded-xl border border-softBorder bg-white/80 p-4 space-y-2">
              <label className="text-xs font-bold text-warmCocoa flex items-center gap-1.5">
                <AppIcon name="pencil" size={15} className="text-terracotta" />
                <span>C. Tell us what happened in your own words</span>
              </label>
              <textarea
                rows={3}
                value={data.userDescription || ''}
                onChange={(e) => setData((p) => ({ ...p, userDescription: e.target.value }))}
                placeholder="Tell us what happened in your own words (e.g. 'I went to drop the delivery, customer cancelled, and my ID was blocked...')"
                className="w-full rounded-xl border border-softBorder bg-white/95 p-3 text-xs font-medium text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-softBorder">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold text-textMuted hover:text-warmCocoa"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-textSecondary border border-softBorder hover:bg-white"
                >
                  Continue Without Evidence
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="emerald-gradient-btn flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-warm active:scale-95 transition-all"
                >
                  <span>Continue</span>
                  <AppIcon name="arrow-forward" size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: ADDITIONAL DETAILS & OUTCOME */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-5 shadow-glass space-y-4"
          >
            <div>
              <h2 className="text-lg font-extrabold text-warmCocoa">
                Additional Details & Desired Outcome
              </h2>
              <p className="text-xs text-textSecondary mt-0.5">
                These details help tailor your action plan and customize your appeal.
              </p>
            </div>

            {/* Reason Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-warmCocoa">
                Did the platform cite any of these reasons?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'customer_complaint', label: 'Customer Complaint / Dispute' },
                  { id: 'cancellation_rate', label: 'Order Cancellation Rate' },
                  { id: 'kyc_document', label: 'Expired Document / KYC Issue' },
                  { id: 'selfie_verification', label: 'Selfie / ID Mismatch' },
                  { id: 'delivery_delay', label: 'GPS / Delivery Time Delay' },
                  { id: 'other', label: 'No Specific Reason Given' },
                ].map((item) => {
                  const isSelected = data.reasonCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setData((p) => ({ ...p, reasonCategory: item.id }))}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-warmAmber/20 border-terracotta text-warmCocoa shadow-xs'
                          : 'bg-white/80 border-softBorder text-textSecondary hover:bg-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Support Contact Status */}
            <div className="pt-2 border-t border-softBorder grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-softBorder p-3 bg-white/80 space-y-1.5">
                <span className="text-xs font-bold text-warmCocoa block">
                  Have you already contacted platform support?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setData((p) => ({ ...p, hasContactedSupport: true }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      data.hasContactedSupport
                        ? 'bg-deepNavy text-white'
                        : 'bg-warmCream text-textSecondary'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setData((p) => ({ ...p, hasContactedSupport: false }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      !data.hasContactedSupport
                        ? 'bg-deepNavy text-white'
                        : 'bg-warmCream text-textSecondary'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-softBorder p-3 bg-white/80 space-y-1.5">
                <span className="text-xs font-bold text-warmCocoa block">
                  Do you have a Ticket / Reference Number?
                </span>
                <input
                  type="text"
                  value={data.ticketNumber || ''}
                  onChange={(e) => setData((p) => ({ ...p, ticketNumber: e.target.value }))}
                  placeholder="e.g. #CAS-9842 (Optional)"
                  className="w-full rounded-lg border border-softBorder bg-white px-2.5 py-1.5 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>
            </div>

            {/* Requested Outcome */}
            <div className="pt-2 border-t border-softBorder space-y-1.5">
              <label className="block text-xs font-bold text-warmCocoa">
                What outcome are you requesting?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'reactivation', label: 'Immediate Account Reactivation', sub: 'Restore delivery ID and allow resuming work' },
                  { id: 'fair_review', label: 'Fair Human Review by Grievance Officer', sub: 'Re-evaluate case with human discretion' },
                  { id: 'correction_mistake', label: 'Correction of Technical / KYC Mistake', sub: 'Resolve system error or re-verify documents' },
                  { id: 'clear_explanation', label: 'Clear Written Explanation & Evidence', sub: 'Request cited policy clause and incident proof' },
                ].map((out) => {
                  const isSelected = data.requestedOutcome === out.id;
                  return (
                    <button
                      key={out.id}
                      type="button"
                      onClick={() => setData((p) => ({ ...p, requestedOutcome: out.id as any }))}
                      className={`p-3 rounded-xl border text-left transition-all active:scale-[0.99] ${
                        isSelected
                          ? 'bg-warmAmber/20 border-terracotta shadow-xs'
                          : 'bg-white/80 border-softBorder hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-warmCocoa block">{out.label}</span>
                      <span className="text-[11px] text-textSecondary">{out.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Worker Identifier for draft */}
            <div className="pt-2 border-t border-softBorder grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  Your Name (Optional, for draft letter):
                </label>
                <input
                  type="text"
                  value={data.workerName || ''}
                  onChange={(e) => setData((p) => ({ ...p, workerName: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-softBorder bg-white px-3 py-2 text-xs text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  Partner ID or Contact (Optional, never enter password):
                </label>
                <input
                  type="text"
                  value={data.workerMaskedId || ''}
                  onChange={(e) => setData((p) => ({ ...p, workerMaskedId: e.target.value }))}
                  placeholder="e.g. 9876543210 / RIDER-4592"
                  className="w-full rounded-xl border border-softBorder bg-white px-3 py-2 text-xs text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-softBorder">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-textMuted hover:text-warmCocoa"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="emerald-gradient-btn flex items-center gap-2 rounded-full px-7 py-2.5 text-xs font-bold text-white shadow-warm active:scale-95 transition-all"
              >
                <span>Generate Action Plan</span>
                <AppIcon name="arrow-forward" size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: PERSONALIZED ACTION PLAN & INTEGRATION */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-5 shadow-glass">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <span className="rounded-full bg-saffronGold px-2.5 py-0.5 text-[10px] font-black text-deepNavy">
                    Personalized Action Plan
                  </span>
                  <h2 className="text-xl font-extrabold text-warmCocoa mt-1">
                    Your Case Assessment & Recommended Next Steps
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAppealGenerator(true)}
                  className="emerald-gradient-btn flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-warm active:scale-95 transition-all"
                >
                  <AppIcon name="file-check" size={16} />
                  <span>Prepare Formal Appeal Now</span>
                </button>
              </div>
              <p className="text-xs text-textSecondary leading-relaxed">
                Based on your reported situation on <strong>{data.platform === 'Other platform' ? data.customPlatformName || 'Other Platform' : data.platform}</strong>, here is a structured breakdown and prioritized checklist.
              </p>
            </div>

            {isAssessing ? (
              <div className="rounded-2xl bg-cleanWhite/90 border border-softBorder p-10 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-terracotta border-t-transparent mx-auto mb-3" />
                <p className="text-xs font-bold text-warmCocoa">Analyzing your case and assembling relevant rights provisions...</p>
              </div>
            ) : assessment ? (
              <div className="space-y-4">
                {/* 1. What you told us */}
                <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-warmCocoa flex items-center gap-2">
                    <AppIcon name="document-text" size={15} className="text-terracotta" />
                    <span>What You Told Us</span>
                  </h3>
                  <ul className="space-y-1.5 pl-1 text-xs text-textSecondary">
                    {assessment.summaryWhatYouToldUs.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-terracotta font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. What we know vs What needs confirmation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-cleanWhite/90 border border-softBorder p-4 shadow-glass space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-success flex items-center gap-2">
                      <AppIcon name="checkmark-circle" size={15} className="text-success" />
                      <span>What We Know (Factual Grounds)</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-textSecondary">
                      {assessment.whatWeKnow.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-success font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-cleanWhite/90 border border-softBorder p-4 shadow-glass space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-warmAmber flex items-center gap-2">
                      <AppIcon name="help-circle-outline" size={15} className="text-terracotta" />
                      <span>What Still Needs Confirmation</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-textSecondary">
                      {assessment.whatNeedsConfirmation.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-terracotta font-bold">?</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Recommended Next Steps (Checklist) */}
                <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-xl border border-softBorder p-4 shadow-glass space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-warmCocoa flex items-center gap-2">
                    <AppIcon name="sparkles" size={16} className="text-terracotta" />
                    <span>Recommended Next Steps Checklist</span>
                  </h3>
                  <div className="space-y-2.5">
                    {assessment.checklist.map((item) => (
                      <div
                        key={item.step}
                        className="flex items-start gap-3 rounded-xl bg-warmCream/70 border border-softBorder p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-xs font-black text-white shadow-xs">
                          {item.step}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-warmCocoa">{item.title}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                item.urgency === 'high'
                                  ? 'bg-danger/15 text-danger'
                                  : item.urgency === 'medium'
                                  ? 'bg-warmAmber/20 text-warmCocoa'
                                  : 'bg-white text-textMuted'
                              }`}
                            >
                              {item.urgency === 'high' ? 'High Priority' : 'Standard'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-textSecondary leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Financial & Work Integration Card */}
                {assessment.estimatedShortfall && (
                  <div className="rounded-2xl bg-cleanWhite/90 border border-softBorder p-4 shadow-glass space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">
                          Financial Impact Protection
                        </span>
                        <h4 className="text-sm font-extrabold text-warmCocoa">
                          Estimated Weekly Cash-Flow Interruption
                        </h4>
                      </div>
                      <span className="text-base font-black text-danger">
                        −{t('common.currency', { amount: formatInr(assessment.estimatedShortfall.estimatedLoss) })}
                      </span>
                    </div>

                    <p className="text-xs text-textSecondary leading-relaxed">
                      Based on your recorded baseline of ₹{formatInr(assessment.estimatedShortfall.weeklyIncomeBaseline)}/day, a 7-day deactivation risks an earnings shortfall. Setu can help you manage this gap:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate('/kaam')}
                        className="flex items-center justify-center gap-2 rounded-xl bg-warmAmber/20 border border-warmAmber/50 p-2.5 text-xs font-bold text-warmCocoa hover:bg-warmAmber/30 active:scale-95 transition-all"
                      >
                        <AppIcon name="briefcase" size={15} className="text-terracotta" />
                        <span>Find Alternative Shifts on Kaam</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/dhan')}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white border border-softBorder p-2.5 text-xs font-bold text-warmCocoa hover:bg-cleanWhite active:scale-95 transition-all"
                      >
                        <AppIcon name="wallet" size={15} className="text-terracotta" />
                        <span>Review Emergency Savings on Dhan</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-textMuted leading-tight pt-1">
                      {assessment.estimatedShortfall.disclaimer}
                    </p>
                  </div>
                )}

                {/* Bottom CTA to prepare appeal */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-xs font-bold text-textMuted hover:text-warmCocoa"
                  >
                    Edit Answers
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAppealGenerator(true)}
                    className="emerald-gradient-btn flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-white shadow-warm active:scale-95 transition-all"
                  >
                    <AppIcon name="file-check" size={17} />
                    <span>Proceed to Let's Prepare Your Appeal</span>
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
