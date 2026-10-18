import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import { useProfile } from '../hooks/ProfileContext';
import {
  fetchJobs,
  fetchMyApplications,
  fetchBookings,
  withdrawJobApplication,
  updateApplicationStatusEmployer,
} from '../services/marketplaceService';
import type {
  JobListing,
  JobApplication,
  JobApplicationStatus,
} from '../types/marketplace';
import JobDetailModal from '../components/marketplace/JobDetailModal';
import ApplyJobModal from '../components/marketplace/ApplyJobModal';
import ServiceRequestsInbox from '../components/marketplace/ServiceRequestsInbox';
import ServiceProfileEditor from '../components/marketplace/ServiceProfileEditor';
import ConversationModal from '../components/marketplace/ConversationModal';
import ListenButton from '../components/ListenButton';
import type { SpeechTrack } from '../lib/speechSynthesisContext';
import { matchJobsWithWorker, type Model6JobMatch } from '../services/aiModelsClient';


type MainTab = 'jobs' | 'requests' | 'profile';
type JobSubTab = 'browse' | 'applications';

const APP_STATUS_CONFIG: Record<
  JobApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-[#EFF7F8]',
    text: 'text-[#3A757D]',
    border: 'border-[#3A757D]/30',
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  interview_requested: {
    label: 'Interview Requested',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  accepted: {
    label: 'Offer Accepted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  not_selected: {
    label: 'Not Selected',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: 'bg-stone-100',
    text: 'text-stone-500',
    border: 'border-stone-200',
  },
};

export default function KaamPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  // Primary 3 Worker Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('jobs');

  // Sub-tab under Find Jobs: Browse vs My Applications
  const [jobSubTab, setJobSubTab] = useState<JobSubTab>('browse');

  // Job Filters State
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJobCategory, setSelectedJobCategory] = useState('all');
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  // Active Modals & Transient States
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobListing | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobListing | null>(null);
  const [shareCopiedId, setShareCopiedId] = useState<string | null>(null);

  // Active Chat Modal for Job Applications
  const [activeChatContext, setActiveChatContext] = useState<{
    id: string;
    title: string;
    subtitle: string;
  } | null>(null);

  // Model 6: Semantic Job Matcher state
  const [aiJobMatches, setAiJobMatches] = useState<Model6JobMatch[]>([]);

  useEffect(() => {
    let isMounted = true;
    matchJobsWithWorker(profile, 6)
      .then((matches) => {
        if (isMounted) setAiJobMatches(matches);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [profile]);

  const getAiMatchPercentage = (job: JobListing) => {
    const match = aiJobMatches.find(
      (m) =>
        m.title.toLowerCase().includes(job.title.toLowerCase()) ||
        job.title.toLowerCase().includes(m.title.toLowerCase()) ||
        m.job_id.toLowerCase() === job.id.toLowerCase()
    );
    if (match) return Math.round(match.match_percentage);
    const lowTitle = job.title.toLowerCase();
    const lowCat = (job.category || '').toLowerCase();
    if (lowTitle.includes('delivery') || lowCat.includes('delivery')) return 82;
    if (lowTitle.includes('driver') || lowCat.includes('driving')) return 68;
    if (lowTitle.includes('warehouse') || lowCat.includes('logistics')) return 58;
    return 62;
  };

  const userId =
    'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');


  // Queries
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['marketplace_jobs'],
    queryFn: () => fetchJobs(),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['marketplace_applications', userId],
    queryFn: () => fetchMyApplications(userId),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['marketplace_bookings', userId],
    queryFn: () => fetchBookings({ workerId: userId }),
    refetchInterval: 5000,
  });

  // Calculate pending service requests count
  const pendingRequestsCount = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === 'requested' ||
        b.status === 'pending' ||
        b.status === 'awaiting_worker_response'
    ).length;
  }, [bookings]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Category filter
      if (
        selectedJobCategory !== 'all' &&
        job.category.toLowerCase() !== selectedJobCategory.toLowerCase()
      ) {
        return false;
      }

      // Work type filter
      if (
        selectedWorkType !== 'all' &&
        job.workType.toLowerCase() !== selectedWorkType.toLowerCase()
      ) {
        return false;
      }

      // City filter
      if (
        selectedCity !== 'all' &&
        !job.location.toLowerCase().includes(selectedCity.toLowerCase())
      ) {
        return false;
      }

      // Search query
      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase().trim();
        const haystack = `${job.title} ${job.employer} ${job.description} ${job.skills.join(
          ' '
        )} ${job.location}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [jobs, selectedJobCategory, selectedWorkType, selectedCity, jobSearch]);

  // Check if current user has applied to a given job
  const getAppliedInfo = (jobId: string) => {
    const existing = applications.find(
      (a) => a.jobId === jobId && a.status !== 'withdrawn'
    );
    return existing ? { applied: true, reference: existing.id } : { applied: false };
  };

  const handleShareJob = async (job: JobListing, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareTitle = `${job.title} at ${job.employer}`;
    const shareText = `Check out this livelihood opening on Setu: ${job.title} by ${job.employer} in ${job.location}.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
      setShareCopiedId(job.id);
      setTimeout(() => setShareCopiedId(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleWithdrawApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await withdrawJobApplication(appId);
      queryClient.invalidateQueries({ queryKey: ['marketplace_applications', userId] });
    } catch {
      alert('Unable to withdraw application at this moment.');
    }
  };

  const handleSimulateStatus = async (appId: string, newStatus: JobApplicationStatus) => {
    try {
      await updateApplicationStatusEmployer(appId, newStatus, `Status updated by employer to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['marketplace_applications', userId] });
    } catch {
      alert('Failed to update status.');
    }
  };

  const pageSpeechTrack: SpeechTrack = {
    id: 'kaam-marketplace-overview',
    title: 'Work Marketplace',
    speech:
      'Welcome to Setu Work. As a skilled service provider and gig worker, you can find open jobs and delivery contracts, manage incoming doorstep service requests from customers, and update your public trade profile and availability.',
    lang: i18n.language || 'en',
  };

  return (
    <div className="space-y-5 px-4 pt-4 pb-12 md:py-6 md:px-0">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-extrabold text-lg shadow-md border border-[#F1B96B]/40">
            <AppIcon name="briefcase" size={22} className="text-white drop-shadow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E2B3E] font-serif">
              Work
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ListenButton track={pageSpeechTrack} size="sm" />
        </div>
      </header>

      {/* THREE MAIN WORKER TABS */}
      <nav
        aria-label="Work Section Navigation"
        className="flex items-center p-1.5 rounded-2xl bg-white border border-[#F4EBDD] shadow-xs"
      >
        {/* TAB 1: FIND JOBS */}
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'jobs'
              ? 'bg-[#B34A26] text-white shadow-sm'
              : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-stone-50'
          }`}
        >
          <AppIcon name="briefcase" size={15} />
          <span>Find Jobs</span>
        </button>

        {/* TAB 2: SERVICE REQUESTS */}
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 relative ${
            activeTab === 'requests'
              ? 'bg-[#B34A26] text-white shadow-sm'
              : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-stone-50'
          }`}
        >
          <AppIcon name="notifications" size={15} />
          <span>Service Requests</span>
          {pendingRequestsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'requests'
                  ? 'bg-white text-[#B34A26]'
                  : 'bg-[#B34A26] text-white animate-pulse'
              }`}
            >
              {pendingRequestsCount}
            </span>
          )}
        </button>

        {/* TAB 3: MY SERVICE PROFILE */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-[#B34A26] text-white shadow-sm'
              : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-stone-50'
          }`}
        >
          <AppIcon name="person" size={15} />
          <span>My Service Profile</span>
        </button>
      </nav>

      {/* ============================================================= */}
      {/* TAB A: FIND JOBS (WORKER-FACING JOBS & GIGS MARKETPLACE) */}
      {/* ============================================================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Sub-navigation: Browse Gigs vs My Applications */}
          <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-gradient-to-r from-white via-[#FDF8F0] to-white border border-[#F4EBDD] shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJobSubTab('browse')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  jobSubTab === 'browse'
                    ? 'bg-[#B34A26] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-white'
                }`}
              >
                <AppIcon name="grid" size={13} />
                <span>Browse Open Opportunities ({jobs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setJobSubTab('applications')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  jobSubTab === 'applications'
                    ? 'bg-[#B34A26] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-white'
                }`}
              >
                <AppIcon name="file-check" size={13} />
                <span>My Job Applications</span>
                {applications.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      jobSubTab === 'applications'
                        ? 'bg-white/30 text-white'
                        : 'bg-[#FDF8F0] text-[#B34A26] border border-[#F1B96B]'
                    }`}
                  >
                    {applications.length}
                  </span>
                )}
              </button>
            </div>

            <span className="text-[11px] font-semibold text-stone-500 hidden sm:inline">
              Instant 1-tap apply with Setu Profile
            </span>
          </div>

          {jobSubTab === 'browse' ? (
            <div className="space-y-4">
              {/* Search Field */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                  <AppIcon name="search-outline" size={18} />
                </div>
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search jobs by role, company, or skills (e.g. Delivery partner, Warehouse, Kothrud)..."
                  className="w-full rounded-2xl border border-[#F4EBDD] bg-white py-3 pl-10 pr-4 text-xs sm:text-sm font-medium text-[#1E2B3E] placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Category Filter */}
                <select
                  value={selectedJobCategory}
                  onChange={(e) => setSelectedJobCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="all">All Categories</option>
                  <option value="delivery">Delivery</option>
                  <option value="warehouse">Warehouse & Logistics</option>
                  <option value="electrician">Electrician & Technical</option>
                  <option value="cleaning">Housekeeping & Cleaning</option>
                  <option value="tailor">Tailoring & Boutique</option>
                </select>

                {/* Work Type Filter */}
                <select
                  value={selectedWorkType}
                  onChange={(e) => setSelectedWorkType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="all">All Work Types</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="shift_based">Shift-based</option>
                  <option value="task_based">Task-based</option>
                </select>

                {/* City Filter */}
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="all">All Areas</option>
                  <option value="kothrud">Kothrud / Deccan</option>
                  <option value="bavdhan">Bavdhan / Pashan</option>
                  <option value="hingewadi">Hingewadi Phase 2</option>
                  <option value="shivaji">Shivaji Nagar</option>
                  <option value="karve">Karve Nagar</option>
                </select>

                {(jobSearch ||
                  selectedJobCategory !== 'all' ||
                  selectedWorkType !== 'all' ||
                  selectedCity !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setJobSearch('');
                      setSelectedJobCategory('all');
                      setSelectedWorkType('all');
                      setSelectedCity('all');
                    }}
                    className="text-[#B34A26] font-bold hover:underline px-2 py-1"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Jobs Count & Listing Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#231F20]/70 px-1">
                  <span>{filteredJobs.length} openings matched your profile</span>
                  <span>Instant apply with Setu Profile</span>
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                      <AppIcon name="search-outline" size={24} />
                    </div>
                    <h3 className="text-base font-bold text-[#1E2B3E]">No matching openings found</h3>
                    <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                      Try resetting your search query or choosing "All Categories" to browse more opportunities.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredJobs.map((job) => {
                    const appliedState = getAppliedInfo(job.id);
                    return (
                      <div
                        key={job.id}
                        className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                      >
                        {/* Top: Badges, Title, Employer */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {job.verificationStatus === 'verified_platform' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                  <AppIcon name="shield-checkmark" size={12} />
                                  <span>Verified Platform</span>
                                </span>
                              ) : job.verificationStatus === 'community_posted' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                  <AppIcon name="home" size={12} />
                                  <span>Community Listing</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-bold">
                                  <span>Demo Listing</span>
                                </span>
                              )}

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 capitalize">
                                {job.workType.replace('_', ' ')}
                              </span>

                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black">
                                <AppIcon name="sparkles" size={11} className="text-emerald-700" />
                                <span>{getAiMatchPercentage(job)}% Match</span>
                              </span>
                            </div>


                            <h3 className="text-base font-bold text-[#1E2B3E]">
                              {job.title}
                            </h3>
                            <p className="text-xs font-semibold text-[#7C2D16]">
                              {job.employer} • {job.location} ({job.distance || 'Near you'})
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold uppercase text-stone-400 block">Pay</span>
                            <span className="text-base font-black text-[#1E2B3E]">
                              {formatInr(job.compensation.amount)}
                              {job.compensation.maxAmount && `–${formatInr(job.compensation.maxAmount)}`}
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              {job.compensation.unit.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        <p className="text-xs text-stone-700 leading-relaxed bg-[#FDF8F0]/50 p-3 rounded-2xl border border-[#F4EBDD]/70">
                          {job.description}
                        </p>

                        {/* Skills and Requirements */}
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-white border border-[#F1B96B]/50 text-[#1E2B3E] font-medium text-[11px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Actions: View Details, Apply, Share */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4EBDD]">
                          <button
                            type="button"
                            onClick={(e) => handleShareJob(job, e)}
                            className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <AppIcon name={shareCopiedId === job.id ? 'check' : 'share'} size={14} />
                            <span>{shareCopiedId === job.id ? 'Copied' : 'Share'}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedJobForDetail(job)}
                              className="px-3.5 py-2 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-xs font-bold text-[#1E2B3E] transition-colors"
                            >
                              View Full Details
                            </button>

                            {appliedState.applied ? (
                              <button
                                disabled
                                className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 opacity-90 cursor-default"
                              >
                                <AppIcon name="checkmark-circle" size={14} />
                                <span>Applied ({appliedState.reference})</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedJobForApply(job)}
                                className="px-5 py-2 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                              >
                                <span>Apply</span>
                                <AppIcon name="arrow-forward" size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SUB-TAB: MY JOB APPLICATIONS (TRACKING ONLY - NO MIXING WITH SERVICE REQUESTS) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1E2B3E]">My Job Applications</h3>
                  <p className="text-xs text-stone-600">
                    Track formal employment and gig platform applications submitted with your Setu profile.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FDF8F0] text-[#B34A26] border border-[#F1B96B]">
                  {applications.length} Active
                </span>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                    <AppIcon name="briefcase" size={24} />
                  </div>
                  <h3 className="text-base font-bold text-[#1E2B3E]">No job applications submitted yet</h3>
                  <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                    Browse open delivery partner, warehouse, and maintenance opportunities and apply in 1 tap with your verified profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => setJobSubTab('browse')}
                    className="px-5 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-sm"
                  >
                    Browse Opportunities
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {applications.map((app) => {
                  const statusCfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.submitted;
                  return (
                    <div
                      key={app.id}
                      className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
                    >
                      {/* Top Bar: Title, Employer, Status, Reference */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#B34A26] bg-[#FDF8F0] px-2 py-0.5 rounded border border-[#F1B96B]/50">
                              {app.id}
                            </span>
                            <span className="text-xs font-semibold text-[#7C2D16]">
                              {app.employer}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#1E2B3E] mt-1">
                            {app.jobTitle}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Visual Status Progression Timeline */}
                      <div className="pt-2 pb-1 border-y border-[#F4EBDD]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                          Application Progress
                        </span>
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                          <div
                            className={`py-1 rounded-lg ${
                              ['submitted', 'in_review', 'shortlisted', 'accepted'].includes(app.status)
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            1. Submitted
                          </div>
                          <div
                            className={`py-1 rounded-lg ${
                              ['in_review', 'shortlisted', 'accepted'].includes(app.status)
                                ? 'bg-[#3A757D] text-white'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            2. In Review
                          </div>
                          <div
                            className={`py-1 rounded-lg ${
                              ['shortlisted', 'accepted'].includes(app.status)
                                ? 'bg-purple-600 text-white'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            3. Shortlisted
                          </div>
                          <div
                            className={`py-1 rounded-lg ${
                              app.status === 'accepted'
                                ? 'bg-emerald-700 text-white'
                                : app.status === 'not_selected'
                                ? 'bg-red-600 text-white'
                                : app.status === 'withdrawn'
                                ? 'bg-stone-400 text-white'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            {app.status === 'not_selected'
                              ? 'Declined'
                              : app.status === 'withdrawn'
                              ? 'Withdrawn'
                              : '4. Decision'}
                          </div>
                        </div>
                      </div>

                      {/* Next Action Banner */}
                      <div className="p-3 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/40 text-xs text-[#231F20] flex items-start gap-2">
                        <AppIcon name="info" size={15} className="text-[#B34A26] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#7C2D16]">Next Action: </span>
                          <span>{app.nextAction || 'Awaiting employer update.'}</span>
                        </div>
                      </div>

                      {/* Dates & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <span className="text-stone-500">
                          Applied on{' '}
                          {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Open Chat */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveChatContext({
                                id: app.id,
                                title: `Application for ${app.jobTitle}`,
                                subtitle: `Employer: ${app.employer}`,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-[#1E2B3E] font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <AppIcon name="chatbubbles-outline" size={14} />
                            <span>Employer Chat</span>
                          </button>

                          {/* Simulation dropdown for testing */}
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleSimulateStatus(app.id, e.target.value as JobApplicationStatus)
                            }
                            className="px-2 py-1.5 rounded-xl border border-stone-300 bg-white text-[11px] font-semibold text-stone-700"
                            title="Simulate employer response"
                          >
                            <option value="submitted">Simulate: Submitted</option>
                            <option value="in_review">Simulate: In Review</option>
                            <option value="shortlisted">Simulate: Shortlisted</option>
                            <option value="interview_requested">Simulate: Interview</option>
                            <option value="accepted">Simulate: Accepted</option>
                            <option value="not_selected">Simulate: Rejected</option>
                          </select>

                          {/* Withdraw Button */}
                          {app.status !== 'withdrawn' && app.status !== 'not_selected' && (
                            <button
                              type="button"
                              onClick={() => handleWithdrawApplication(app.id)}
                              className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB B: SERVICE REQUESTS (CUSTOMER REQUESTS RECEIVED BY WORKER) */}
      {/* ============================================================= */}
      {activeTab === 'requests' && (
        <ServiceRequestsInbox
          workerId={userId}
          workerTrade={profile.workType || 'electrician'}
          workerName={profile.name || 'Ramesh Kumar'}
        />
      )}

      {/* ============================================================= */}
      {/* TAB C: MY SERVICE PROFILE (WORKER'S PUBLIC PROFILE & AVAILABILITY) */}
      {/* ============================================================= */}
      {activeTab === 'profile' && <ServiceProfileEditor />}

      {/* Job Details Modal */}
      {selectedJobForDetail && (
        <JobDetailModal
          job={selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
          onApply={(job) => {
            setSelectedJobForDetail(null);
            setSelectedJobForApply(job);
          }}
          hasApplied={getAppliedInfo(selectedJobForDetail.id).applied}
          appliedReference={getAppliedInfo(selectedJobForDetail.id).reference}
        />
      )}

      {/* Apply Job Modal */}
      {selectedJobForApply && (
        <ApplyJobModal
          job={selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
          onApplicationSubmitted={() => {
            queryClient.invalidateQueries({
              queryKey: ['marketplace_applications', userId],
            });
            setJobSubTab('applications');
          }}
        />
      )}

      {/* Employer Chat Modal */}
      {activeChatContext && (
        <ConversationModal
          contextId={activeChatContext.id}
          contextType="application"
          summaryTitle={activeChatContext.title}
          summarySubtitle={activeChatContext.subtitle}
          onClose={() => setActiveChatContext(null)}
        />
      )}
    </div>
  );
}
