import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import type { JobListing } from '../../types/marketplace';
import ModalPortal from '../ModalPortal';

interface JobDetailModalProps {
  job: JobListing | null;
  onClose: () => void;
  onApply: (job: JobListing) => void;
  hasApplied?: boolean;
  appliedReference?: string;
}

export default function JobDetailModal({
  job,
  onClose,
  onApply,
  hasApplied = false,
  appliedReference,
}: JobDetailModalProps) {
  const { t } = useTranslation();
  const [copiedShare, setCopiedShare] = useState(false);

  if (!job) return null;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${job.title} at ${job.employer}`;
    const shareText = `Check out this livelihood opportunity on Setu: ${job.title} by ${job.employer} in ${job.location} (${job.compensation.amount} ${job.compensation.unit.replace('_', ' ')}).`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // user cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // ignore
    }
  };

  const formatUnit = (unit: string) => {
    switch (unit) {
      case 'per_day':
        return '/ day';
      case 'per_month':
        return '/ month';
      case 'per_hour':
        return '/ hr';
      case 'per_delivery':
        return '/ order';
      case 'per_task':
        return '/ task';
      default:
        return '';
    }
  };

  const getVerificationBadge = () => {
    if (job.verificationStatus === 'verified_platform') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
          <AppIcon name="shield-checkmark" size={13} />
          <span>Verified Platform</span>
        </span>
      );
    }
    if (job.verificationStatus === 'community_posted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
          <AppIcon name="home" size={13} />
          <span>Community Listing</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-bold">
        <AppIcon name="info" size={13} />
        <span>Demo Listing</span>
      </span>
    );
  };

  return (
    <ModalPortal
      isOpen={!!job}
      onClose={onClose}
      maxWidthClass="sm:max-w-xl"
    >
      {/* Header bar */}
      <div className="shrink-0 px-6 pt-4 pb-4 border-b border-[#F4EBDD] flex items-start justify-between">
        <div className="space-y-1 pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getVerificationBadge()}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1E2B3E]/5 text-[#1E2B3E] capitalize">
              {job.workType.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1E2B3E] font-serif mt-1">
            {job.title}
          </h2>
          <p className="text-sm font-semibold text-[#7C2D16]">
            {job.employer} • {job.location} ({job.distance || 'Near you'})
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          aria-label="Close details"
        >
          <AppIcon name="close" size={20} />
        </button>
      </div>

      {/* Scrollable details body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
        {/* Compensation Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#FDF8F0] via-white to-[#FDF8F0] border border-[#F1B96B]/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C2D16] block">
              Expected Compensation
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-[#1E2B3E]">
                {formatInr(job.compensation.amount)}
                {job.compensation.maxAmount && ` – ${formatInr(job.compensation.maxAmount)}`}
              </span>
              <span className="text-xs font-bold text-[#231F20]/70">
                {formatUnit(job.compensation.unit)}
              </span>
            </div>
            <p className="text-[11px] text-[#231F20]/65 mt-0.5">
              {job.compensation.isEstimate
                ? 'Estimated earnings based on standard shift targets.'
                : 'Fixed base compensation.'}{' '}
              {job.compensation.materialsExtra && 'Fuel & parts billed extra.'}
            </p>
          </div>

          <div className="shrink-0 bg-white px-3 py-2 rounded-xl border border-[#F4EBDD] text-right">
            <span className="text-[10px] font-bold uppercase text-[#231F20]/60 block">Work Schedule</span>
            <span className="text-xs font-semibold text-[#1E2B3E]">{job.schedule}</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 text-xs text-[#231F20] leading-relaxed">
          <h4 className="font-bold text-sm text-[#1E2B3E] font-serif">Job Description</h4>
          <p className="text-stone-700 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-100">
            {job.description}
          </p>
        </div>

        {/* Requirements & Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2 rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0]/50 p-3.5">
            <h4 className="font-bold text-[#7C2D16] flex items-center gap-1.5">
              <AppIcon name="file-check" size={14} />
              <span>Eligibility & Requirements</span>
            </h4>
            <ul className="space-y-1 list-disc pl-4 text-stone-700">
              {job.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0]/50 p-3.5">
            <h4 className="font-bold text-[#7C2D16] flex items-center gap-1.5">
              <AppIcon name="school" size={14} />
              <span>Skills Matched</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#F1B96B]/50 text-[#1E2B3E] font-semibold text-[11px]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Support Information */}
        {job.safetyInfo && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
              <AppIcon name="shield" size={14} />
              <span>Worker Safety & Protection</span>
            </span>
            <p className="leading-relaxed">{job.safetyInfo}</p>
          </div>
        )}

        {/* Verified Alternative Contact Channel */}
        {job.contactChannel && job.contactChannel.value && (
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border border-[#F4EBDD] bg-white">
            <span className="text-[#231F20]/70">Official Employer Contact:</span>
            <span className="font-mono font-bold text-[#1E2B3E]">{job.contactChannel.value}</span>
          </div>
        )}
      </div>

      {/* Bottom CTA Row (Pinned Footer) */}
      <div className="shrink-0 px-6 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="px-4 py-2.5 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-[#1E2B3E] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
        >
          <AppIcon name={copiedShare ? 'check' : 'share'} size={15} />
          <span>{copiedShare ? 'Link Copied!' : 'Share Listing'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-100"
          >
            Back
          </button>

          {hasApplied ? (
            <button
              disabled
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 opacity-90 cursor-default"
            >
              <AppIcon name="checkmark-circle" size={15} />
              <span>Applied ({appliedReference || 'Submitted'})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApply(job)}
              className="px-6 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>Apply with Setu Profile</span>
              <AppIcon name="arrow-forward" size={14} />
            </button>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
