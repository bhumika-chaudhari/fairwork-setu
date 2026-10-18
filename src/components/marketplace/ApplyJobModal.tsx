import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { useProfile } from '../../hooks/ProfileContext';
import { submitJobApplication } from '../../services/marketplaceService';
import type { JobListing, JobApplication } from '../../types/marketplace';
import ModalPortal from '../ModalPortal';

interface ApplyJobModalProps {
  job: JobListing | null;
  onClose: () => void;
  onApplicationSubmitted: (application: JobApplication) => void;
}

export default function ApplyJobModal({
  job,
  onClose,
  onApplicationSubmitted,
}: ApplyJobModalProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const [phone, setPhone] = useState(profile.emergencyContact || '9876543210');
  const [experience, setExperience] = useState(
    profile.workType
      ? `${profile.workType} with ${profile.experienceYears || 3} years verified field experience`
      : '3 years field experience'
  );
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<JobApplication | null>(null);

  if (!job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phone.trim()) {
      setErrorMessage('Please provide a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const applicantId =
        'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const userSkills = [
        ...profile.skillKeys.map((k) => k.replace('skills.', '')),
        ...profile.customSkills,
      ];
      const app = await submitJobApplication({
        jobId: job.id,
        applicantId,
        applicantName: profile.name || 'Setu Worker',
        applicantPhone: phone.trim(),
        applicantSkills: userSkills.length > 0 ? userSkills : job.skills,
        applicantExperience: experience.trim(),
        applicantLanguages: ['Hindi', 'Marathi', 'English'],
        coverNote: coverNote.trim(),
      });

      setSubmittedApp(app);
      onApplicationSubmitted(app);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit application. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal
      isOpen={!!job}
      onClose={onClose}
      maxWidthClass="sm:max-w-lg"
    >
      {submittedApp ? (
        /* Success Screen */
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-sm">
              <AppIcon name="checkmark-circle" size={36} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#B34A26] px-3 py-1 rounded-full bg-[#FDF8F0] border border-[#F1B96B]">
                Reference: {submittedApp.id}
              </span>
              <h3 className="text-xl font-bold text-[#1E2B3E] font-serif pt-2">
                Application Submitted Successfully!
              </h3>
              <p className="text-xs text-[#231F20]/75 max-w-md mx-auto leading-relaxed">
                Your Setu profile has been shared with <strong>{job.employer}</strong> for the <strong>{job.title}</strong> opening.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0] p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Current Status:</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full capitalize">
                  {submittedApp.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Expected Update:</span>
                <span className="font-semibold text-[#1E2B3E]">2–4 working days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Contact Provided:</span>
                <span className="font-mono text-[#1E2B3E]">{submittedApp.applicantPhone}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#231F20]/60 italic">
              You can track real updates or withdraw this application anytime in the <strong>My Activity</strong> tab.
            </p>
          </div>

          <div className="shrink-0 px-6 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Done & View Applications
            </button>
          </div>
        </div>
      ) : (
        /* Form / Review Screen */
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Pinned Header */}
          <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#7C2D16] uppercase tracking-wider block">
                Apply with Setu Profile
              </span>
              <h3 className="text-lg font-bold text-[#1E2B3E] font-serif">
                {job.title}
              </h3>
              <p className="text-xs text-[#231F20]/70">{job.employer} • {job.location}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              aria-label="Close"
            >
              <AppIcon name="close" size={18} />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AppIcon name="shield-alert" size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Profile Overview (Read-Only Verified Info) */}
            <div className="rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0]/70 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-[#7C2D16] block text-[11px] uppercase">
                Information Shared from Your Profile:
              </span>
              <div className="grid grid-cols-2 gap-2 text-stone-700">
                <div>
                  <span className="text-stone-400 block text-[10px]">Candidate Name</span>
                  <span className="font-bold text-[#1E2B3E]">{profile.name || 'Setu Worker'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Primary Trade</span>
                  <span className="font-bold text-[#1E2B3E] capitalize">{profile.workType || 'General Worker'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Languages</span>
                  <span className="font-medium text-[#1E2B3E]">Hindi, Marathi, English</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">City / Locality</span>
                  <span className="font-medium text-[#1E2B3E]">
                    {profile.cityKey ? profile.cityKey.replace('cities.', '').replace(/^./, (c) => c.toUpperCase()) : 'Pune'}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Contact & Experience */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-[#F1B96B] bg-[#FDF8F0] text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Experience & Background Summary
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2 years two-wheeler courier in Kothrud area"
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2B3E] mb-1">
                  Optional Note to Hiring Team
                </label>
                <textarea
                  rows={2}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="e.g. Available for immediate morning shifts. I have an active vehicle and smartphone."
                  className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>
            </div>

            {/* Strict Privacy Shield Notice */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
              <AppIcon name="shield-checkmark" size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>Setu Privacy Shield:</strong> Your private financial transactions, Dhan earnings data, Sehat health records, and Haq Setu cases are <strong>NEVER</strong> shared with any employer.
              </div>
            </div>
          </div>

          {/* Pinned Action Footer */}
          <div className="shrink-0 px-6 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Confirm & Submit Application</span>
                  <AppIcon name="arrow-forward" size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </ModalPortal>
  );
}
