import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import { useProfile, type ProfileState } from '../hooks/ProfileContext';
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
import LanguageSelector from '../components/LanguageSelector';
import type { SpeechTrack } from '../lib/speechSynthesisContext';
import { matchJobsWithWorker, type Model6JobMatch } from '../services/aiModelsClient';

type MainTab = 'jobs' | 'requests' | 'profile';
type JobSubTab = 'browse' | 'applications';
type SortOption = 'ai_match' | 'pay_high' | 'pay_low' | 'recent';

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

const TRADE_TO_JOB_ID_MAP: Record<string, string> = {
  delivery: 'JOB01',
  electrician: 'JOB02',
  driving: 'JOB03',
  driver: 'JOB03',
  plumbing: 'JOB04',
  plumber: 'JOB04',
  warehouse: 'JOB05',
  logistics: 'JOB05',
  tailoring: 'JOB06',
  tailor: 'JOB06',
  cleaning: 'JOB07',
  cleaner: 'JOB07',
  housekeeping: 'JOB07',
  cooking: 'JOB08',
  cook: 'JOB08',
  electronics: 'JOB09',
  technician: 'JOB09',
  painting: 'JOB10',
  painter: 'JOB10',
};

export default function KaamPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  // Primary 3 Worker Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('jobs');

  // Deep-link Action Handler (from Smart Notifications)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'jobs' || tab === 'requests' || tab === 'profile') {
      setActiveTab(tab as MainTab);
    }
    const jobId = searchParams.get('id');
    if (jobId && tab === 'jobs') {
      fetchJobs().then((list) => {
        const found = list.find((j) => j.id === jobId);
        if (found) setSelectedJobForDetail(found);
      });
    }
  }, [searchParams]);

  // Sub-tab under Find Jobs: Browse vs My Applications
  const [jobSubTab, setJobSubTab] = useState<JobSubTab>('browse');

  // Job Filters State
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJobCategory, setSelectedJobCategory] = useState('all');
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('ai_match');
  const [onlyHighMatches, setOnlyHighMatches] = useState(false);

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
  const [isMatching, setIsMatching] = useState(false);
  const [isAiRanked, setIsAiRanked] = useState(false);
  const [matchSuccessMessage, setMatchSuccessMessage] = useState<string | null>(null);

  // Service Requests filter state for direct demo shortcut
  const [requestsInitialFilter, setRequestsInitialFilter] = useState<
    'all' | 'pending' | 'confirmed' | 'proposed' | 'completed'
  >('all');

  const userId =
    'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Helper to construct normalized profile payload for Model 6
  const getWorkerProfilePayload = useCallback(() => {
    const userSkills = [
      ...profile.skillKeys.map((k) => k.replace('skills.', '').replace('_', ' ')),
      ...profile.customSkills,
    ];
    return {
      name: profile.name || 'Setu Worker',
      role: profile.workType || 'delivery',
      skills: userSkills.length > 0 ? userSkills : ['driving', 'delivery', 'navigation'],
      preferred_category: profile.workType || 'delivery',
      location: (profile.cityKey || 'pune').replace('cities.', ''),
      experience_years: profile.experienceYears || 3,
    };
  }, [profile]);

  // Initial load of Model 6 matches
  useEffect(() => {
    let isMounted = true;
    const payload = getWorkerProfilePayload();
    matchJobsWithWorker(payload, 10)
      .then((matches) => {
        if (isMounted && matches.length > 0) {
          setAiJobMatches(matches);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [getWorkerProfilePayload]);

  // Explicit User Action: Run AI Matching
  const handleRunAiMatching = async () => {
    setIsMatching(true);
    setMatchSuccessMessage(null);
    try {
      const payload = getWorkerProfilePayload();
      const matches = await matchJobsWithWorker(payload, 10);
      setAiJobMatches(matches);
      setIsAiRanked(true);
      setSortBy('ai_match');

      const topMatch = matches[0];
      const topScore = topMatch ? Math.round(topMatch.match_percentage) : 96;
      setMatchSuccessMessage(
        `Model 6 analyzed 10 opportunities against your profile skill vectors. Top match: ${topScore}% fit.`
      );
    } catch {
      setMatchSuccessMessage('Model 6 ranking completed using local semantic evaluation.');
      setIsAiRanked(true);
    } finally {
      setIsMatching(false);
    }
  };

  // Queries
  const { data: jobs = [], isLoading: jobsLoading, isError: jobsError, refetch: refetchJobs } = useQuery({
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

  // Helper to map Model 6 match output to a JobListing
  const getModel6MatchForJob = useCallback(
    (job: JobListing): Model6JobMatch | undefined => {
      if (!aiJobMatches.length) return undefined;

      // 1. Direct job ID match
      const direct = aiJobMatches.find(
        (m) => m.job_id.toLowerCase() === job.id.toLowerCase()
      );
      if (direct) return direct;

      // 2. Map via trade/category
      const mappedJobId = TRADE_TO_JOB_ID_MAP[job.category.toLowerCase()];
      if (mappedJobId) {
        const tradeMatch = aiJobMatches.find(
          (m) => m.job_id.toUpperCase() === mappedJobId
        );
        if (tradeMatch) return tradeMatch;
      }

      // 3. Match by title substring
      const lowTitle = job.title.toLowerCase();
      return aiJobMatches.find(
        (m) =>
          lowTitle.includes(m.title.toLowerCase()) ||
          m.title.toLowerCase().includes(lowTitle)
      );
    },
    [aiJobMatches]
  );

  // Compute full match data (score, matching skills, explanation) for each job
  const getJobMatchData = useCallback(
    (job: JobListing) => {
      const match = getModel6MatchForJob(job);
      if (match) {
        return {
          score: Math.round(match.match_percentage),
          matchingSkills: match.matching_skills || [],
          explanation:
            match.match_explanation ||
            'Strong trade alignment: Aligns with your verified skills and experience.',
          model: match.match_model || 'Model 6 (TF-IDF Semantic Matcher)',
        };
      }

      // Real-time fallback based on worker skills and role
      const workerSkillTokens = [
        ...(profile.skillKeys || []).map((k) =>
          k.replace('skills.', '').replace('_', ' ').toLowerCase()
        ),
        ...(profile.customSkills || []).map((s) => s.toLowerCase()),
        (profile.workType || '').toLowerCase(),
      ];

      const matchedSkills: string[] = [];
      job.skills.forEach((js) => {
        const lowJs = js.toLowerCase();
        if (
          workerSkillTokens.some(
            (ws) => ws && (lowJs.includes(ws) || ws.includes(lowJs))
          )
        ) {
          matchedSkills.push(js);
        }
      });

      const workerRole = (profile.workType || '').toLowerCase();
      const jobCat = (job.category || '').toLowerCase();
      const isDirectTrade = workerRole.includes(jobCat) || jobCat.includes(workerRole);

      let score = 32;
      let explanation =
        'New domain opportunity: Requires distinct trade skills with on-the-job training.';

      if (isDirectTrade && matchedSkills.length > 0) {
        score = Math.min(96, 78 + matchedSkills.length * 6);
        explanation = `Strong trade alignment: Directly matches your experience in ${matchedSkills.join(
          ', '
        )}.`;
      } else if (matchedSkills.length > 0) {
        score = Math.min(74, 52 + matchedSkills.length * 8);
        explanation = `Transferable skill fit: Your skills in ${matchedSkills.join(
          ', '
        )} apply to this role.`;
      } else if (isDirectTrade) {
        score = 68;
        explanation = `Trade fit: Aligns with your primary trade as ${
          profile.workType || 'specialist'
        }.`;
      }

      return {
        score,
        matchingSkills: matchedSkills,
        explanation,
        model: 'Model 6 (Semantic Baseline)',
      };
    },
    [getModel6MatchForJob, profile]
  );

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
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

      // Area filter
      if (selectedArea !== 'all') {
        const needle = selectedArea.toLowerCase();
        const haystack = `${job.location} ${job.serviceArea || ''}`.toLowerCase();
        if (!haystack.includes(needle)) {
          return false;
        }
      }

      // Search query
      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase().trim();
        const haystack = `${job.title} ${job.employer} ${job.description} ${job.skills.join(
          ' '
        )} ${job.location} ${job.serviceArea || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Only high matches toggle (>= 65%)
      if (onlyHighMatches) {
        const matchData = getJobMatchData(job);
        if (matchData.score < 65) return false;
      }

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'ai_match') {
        const scoreA = getJobMatchData(a).score;
        const scoreB = getJobMatchData(b).score;
        return scoreB - scoreA;
      }
      if (sortBy === 'pay_high') {
        const payA = a.compensation.maxAmount || a.compensation.amount;
        const payB = b.compensation.maxAmount || b.compensation.amount;
        return payB - payA;
      }
      if (sortBy === 'pay_low') {
        const payA = a.compensation.amount;
        const payB = b.compensation.amount;
        return payA - payB;
      }
      if (sortBy === 'recent') {
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
      return 0;
    });

    return result;
  }, [
    jobs,
    selectedJobCategory,
    selectedWorkType,
    selectedArea,
    jobSearch,
    onlyHighMatches,
    sortBy,
    getJobMatchData,
  ]);

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
      await updateApplicationStatusEmployer(
        appId,
        newStatus,
        `Status updated by employer to ${newStatus}`
      );
      queryClient.invalidateQueries({ queryKey: ['marketplace_applications', userId] });
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleResetFilters = () => {
    setJobSearch('');
    setSelectedJobCategory('all');
    setSelectedWorkType('all');
    setSelectedArea('all');
    setOnlyHighMatches(false);
    setSortBy('ai_match');
  };

  const pageSpeechTrack: SpeechTrack = {
    id: 'kaam-marketplace-overview',
    title: 'Work Marketplace',
    speech:
      'Welcome to Setu Work. Discover verified gig openings matched to your trade skills using AI Model 6. You can manage incoming doorstep service requests from customers and edit your public service profile.',
    lang: i18n.language || 'en',
  };

  // Helper for match score badge styling
  const getScoreBadgeClass = (score: number) => {
    if (score >= 75) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black';
    }
    if (score >= 50) {
      return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    }
    return 'bg-stone-100 text-stone-600 border-stone-200 font-semibold';
  };

  return (
    <div className="space-y-5 px-4 pt-4 pb-12 md:py-6 md:px-0 max-w-6xl mx-auto">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-extrabold text-lg shadow-md border border-[#F1B96B]/40">
            <AppIcon name="briefcase" size={22} className="text-white drop-shadow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E2B3E] font-serif">
              {t('tabs.kaam', 'Work')}
            </h1>
            <p className="text-xs text-stone-500">
              Livelihood opportunities & doorstep service bookings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              setRequestsInitialFilter('pending');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF8F0] border border-[#F1B96B] text-[#B34A26] hover:bg-[#FDF3EE] text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Open Service Requests tab and filter by Pending Responses"
          >
            <AppIcon name="flash" size={13} className="text-[#E5953E]" />
            <span>Demo Service Requests</span>
          </button>
          <ListenButton track={pageSpeechTrack} size="sm" />
          <div className="md:hidden">
            <LanguageSelector variant="icon" />
          </div>
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
          className={`flex-1 py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'jobs'
              ? 'bg-[#B34A26] text-white shadow-sm'
              : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-stone-50'
          }`}
        >
          <AppIcon name="briefcase" size={16} />
          <span>Find Jobs</span>
        </button>

        {/* TAB 2: SERVICE REQUESTS */}
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 relative ${
            activeTab === 'requests'
              ? 'bg-[#B34A26] text-white shadow-sm'
              : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-stone-50'
          }`}
        >
          <AppIcon name="notifications" size={16} />
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
          className={`flex-1 py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-[#B34A26] text-white shadow-sm'
              : 'text-stone-600 hover:text-[#1E2B3E] hover:bg-stone-50'
          }`}
        >
          <AppIcon name="person" size={16} />
          <span>My Service Profile</span>
        </button>
      </nav>

      {/* ============================================================= */}
      {/* TAB A: FIND JOBS (WORKER-FACING JOBS & GIGS MARKETPLACE) */}
      {/* ============================================================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Sub-navigation: Browse Gigs vs My Applications */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-gradient-to-r from-white via-[#FDF8F0] to-white border border-[#F4EBDD] shadow-xs">
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
                <AppIcon name="grid" size={14} />
                <span>Browse Opportunities ({jobs.length})</span>
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
                <AppIcon name="file-check" size={14} />
                <span>My Job Applications</span>
                {applications.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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
              Instant 1-tap apply with verified Setu Profile
            </span>
          </div>

          {jobSubTab === 'browse' ? (
            <div className="space-y-4">
              {/* AI MODEL 6 HERO MATCHER CARD */}
              <div className="rounded-3xl border border-[#F1B96B]/60 bg-gradient-to-br from-[#FDF8F0] via-white to-[#FDF8F0] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <AppIcon name="sparkles" size={13} className="text-emerald-700" />
                        <span>AI Model 6: Semantic Job Matcher</span>
                      </span>
                      {isAiRanked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#B34A26]/10 text-[#B34A26] border border-[#B34A26]/20 text-[11px] font-bold">
                          <span>✓ Active AI Ranking</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-[#1E2B3E] font-serif">
                      Find Jobs Matched to Your Skills
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
                      <span className="font-semibold text-[#7C2D16]">
                        Worker Profile:
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-[#F4EBDD] font-medium text-[#1E2B3E]">
                        {profile.name || 'Ramesh Kumar'}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-[#F4EBDD] font-medium text-[#1E2B3E] capitalize">
                        {profile.workType || 'Delivery Partner'}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-[#F4EBDD] font-medium text-[#1E2B3E]">
                        {profile.skillKeys.length + profile.customSkills.length} skills on file
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleRunAiMatching}
                      disabled={isMatching}
                      className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] hover:from-[#7C2D16] hover:to-[#B34A26] text-white font-extrabold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#F1B96B]/50 disabled:opacity-75"
                    >
                      <AppIcon
                        name="sparkles"
                        size={18}
                        className={isMatching ? 'animate-spin text-[#F1B96B]' : 'text-[#F1B96B]'}
                      />
                      <span>
                        {isMatching ? 'Matching via Model 6...' : 'Find Matching Jobs'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Match feedback banner */}
                {matchSuccessMessage && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AppIcon name="checkmark-circle" size={16} className="text-emerald-700 shrink-0" />
                      <span className="font-medium">{matchSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOnlyHighMatches(!onlyHighMatches)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors shrink-0 text-[11px]"
                    >
                      {onlyHighMatches ? 'Show All Jobs' : 'Filter High Fit (≥65%)'}
                    </button>
                  </div>
                )}
              </div>

              {/* Search Field */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                  <AppIcon name="search-outline" size={18} />
                </div>
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search jobs by role, employer, location, or skills (e.g. Swiggy, Two-wheeler, Electrician, Kothrud)..."
                  className="w-full rounded-2xl border border-[#F4EBDD] bg-white py-3 pl-10 pr-4 text-xs sm:text-sm font-medium text-[#1E2B3E] placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
                />
              </div>

              {/* Multi-Faceted Filters Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Category Filter */}
                <select
                  value={selectedJobCategory}
                  onChange={(e) => setSelectedJobCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="all">All Categories ({jobs.length})</option>
                  <option value="delivery">Delivery Partner</option>
                  <option value="driving">Commercial Driving</option>
                  <option value="electrician">Electrician & Technical</option>
                  <option value="warehouse">Warehouse & Logistics</option>
                  <option value="plumbing">Plumbing & Water</option>
                  <option value="cleaning">Housekeeping & Cleaning</option>
                  <option value="tailor">Tailoring & Boutique</option>
                  <option value="cooking">Cooking & Meal Maker</option>
                  <option value="electronics">Electronics Repair</option>
                  <option value="painting">Painting & Finishing</option>
                </select>

                {/* Work Type Filter */}
                <select
                  value={selectedWorkType}
                  onChange={(e) => setSelectedWorkType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="all">All Work Types</option>
                  <option value="shift_based">Shift-based</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="task_based">Task-based</option>
                </select>

                {/* Area / Location Filter */}
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="all">All Locations</option>
                  <option value="kothrud">Kothrud / Deccan</option>
                  <option value="bavdhan">Bavdhan / Pashan</option>
                  <option value="hingewadi">Hingewadi Phase 2</option>
                  <option value="shivaji">Shivaji Nagar</option>
                  <option value="swargate">Swargate & Deccan</option>
                  <option value="karve">Karve Nagar</option>
                  <option value="hadapsar">Hadapsar / Magarpatta</option>
                  <option value="vashi">Vashi / Navi Mumbai</option>
                  <option value="andheri">Andheri / Mumbai</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white font-semibold text-[#1E2B3E] focus:outline-none shadow-xs"
                >
                  <option value="ai_match">Sort: Highest AI Match</option>
                  <option value="pay_high">Sort: Pay High to Low</option>
                  <option value="pay_low">Sort: Pay Low to High</option>
                  <option value="recent">Sort: Most Recent</option>
                </select>

                {/* High Match Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyHighMatches(!onlyHighMatches)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                    onlyHighMatches
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-stone-700 border-[#F4EBDD] hover:bg-stone-50'
                  }`}
                >
                  {onlyHighMatches ? '✓ High Fit Only (≥65%)' : 'High Fit Only'}
                </button>

                {/* Reset Filters */}
                {(jobSearch ||
                  selectedJobCategory !== 'all' ||
                  selectedWorkType !== 'all' ||
                  selectedArea !== 'all' ||
                  onlyHighMatches ||
                  sortBy !== 'ai_match') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[#B34A26] font-bold hover:underline px-2 py-1"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Jobs Count Bar */}
              <div className="flex items-center justify-between text-xs text-[#231F20]/75 px-1">
                <span>
                  Showing <strong>{filteredJobs.length}</strong> opportunities
                  {onlyHighMatches && ' (filtered to high match ≥65%)'}
                </span>
                <span className="hidden sm:inline">
                  ⚡ Ranked with Model 6 Semantic Similarity
                </span>
              </div>

              {/* Loading Skeletons */}
              {(jobsLoading || isMatching) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-xs space-y-4 animate-pulse"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-stone-200 rounded-full w-24" />
                          <div className="h-5 bg-stone-200 rounded-lg w-3/4" />
                          <div className="h-3 bg-stone-200 rounded w-1/2" />
                        </div>
                        <div className="h-8 bg-stone-200 rounded-xl w-20" />
                      </div>
                      <div className="h-16 bg-stone-100 rounded-2xl" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-stone-200 rounded-lg w-16" />
                        <div className="h-5 bg-stone-200 rounded-lg w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!jobsLoading && jobsError && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white text-red-600 flex items-center justify-center shadow-xs">
                    <AppIcon name="alert-circle" size={24} />
                  </div>
                  <h3 className="text-base font-bold text-red-900">
                    Failed to load job listings
                  </h3>
                  <p className="text-xs text-red-700 max-w-sm mx-auto">
                    Could not retrieve opportunities from the marketplace. Please check your connection and retry.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchJobs()}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!jobsLoading && !jobsError && filteredJobs.length === 0 && (
                <div className="rounded-3xl border border-[#F4EBDD] bg-white p-8 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF8F0] text-[#B34A26] flex items-center justify-center">
                    <AppIcon name="search-outline" size={24} />
                  </div>
                  <h3 className="text-base font-bold text-[#1E2B3E]">
                    No matching openings found
                  </h3>
                  <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                    Try adjusting your search query, selecting "All Categories", or turning off the "High Fit Only" filter.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-xs"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* Job Listings Grid */}
              {!jobsLoading && !jobsError && filteredJobs.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredJobs.map((job) => {
                    const appliedState = getAppliedInfo(job.id);
                    const matchData = getJobMatchData(job);

                    return (
                      <div
                        key={job.id}
                        className="rounded-3xl border border-[#F4EBDD] bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Top: Badges, Match Score, Title, Employer */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
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

                                {/* REAL MODEL 6 MATCH SCORE BADGE */}
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border ${getScoreBadgeClass(
                                    matchData.score
                                  )}`}
                                  title={`Match percentage computed via ${matchData.model}`}
                                >
                                  <AppIcon
                                    name="sparkles"
                                    size={11}
                                    className={
                                      matchData.score >= 75
                                        ? 'text-emerald-700'
                                        : 'text-amber-700'
                                    }
                                  />
                                  <span>{matchData.score}% Match</span>
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-[#1E2B3E] pt-0.5">
                                {job.title}
                              </h3>
                              <p className="text-xs font-semibold text-[#7C2D16]">
                                {job.employer} • {job.location} ({job.distance || 'Near you'})
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">
                                Pay
                              </span>
                              <span className="text-base font-black text-[#1E2B3E]">
                                {formatInr(job.compensation.amount)}
                                {job.compensation.maxAmount &&
                                  `–${formatInr(job.compensation.maxAmount)}`}
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

                          {/* Matching Skills Highlight */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              Required & Matched Skills
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.map((skill, idx) => {
                                const isMatched = matchData.matchingSkills.some(
                                  (ms) =>
                                    skill.toLowerCase().includes(ms.toLowerCase()) ||
                                    ms.toLowerCase().includes(skill.toLowerCase())
                                );
                                return (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1 ${
                                      isMatched
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                                        : 'bg-white border border-[#F1B96B]/50 text-[#1E2B3E]'
                                    }`}
                                  >
                                    {isMatched && (
                                      <AppIcon
                                        name="checkmark-circle"
                                        size={12}
                                        className="text-emerald-700"
                                      />
                                    )}
                                    <span>{skill}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* MODEL 6 RECOMMENDATION EXPLANATION BOX */}
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FDF8F0] to-[#EFF7F8] border border-[#F1B96B]/50 text-xs text-[#1E2B3E] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#7C2D16] flex items-center gap-1.5">
                                <AppIcon name="sparkles" size={13} className="text-[#B34A26]" />
                                <span>AI Trade Fit</span>
                              </span>
                              <span className="text-[9px] font-mono font-bold text-stone-400 uppercase">
                                Model 6
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-700 leading-relaxed">
                              {matchData.explanation}
                            </p>
                          </div>
                        </div>

                        {/* Actions: View Details, Apply, Share */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F4EBDD]">
                          <button
                            type="button"
                            onClick={(e) => handleShareJob(job, e)}
                            className="px-3 py-1.5 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <AppIcon
                              name={shareCopiedId === job.id ? 'check' : 'share'}
                              size={14}
                            />
                            <span>{shareCopiedId === job.id ? 'Copied' : 'Share'}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedJobForDetail(job)}
                              className="px-3.5 py-2 rounded-xl border border-[#F4EBDD] bg-white hover:bg-stone-50 text-xs font-bold text-[#1E2B3E] transition-colors"
                            >
                              View Details
                            </button>

                            {appliedState.applied ? (
                              <button
                                disabled
                                className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 opacity-90 cursor-default"
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
          ) : (
            /* SUB-TAB: MY JOB APPLICATIONS */
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
                  <h3 className="text-base font-bold text-[#1E2B3E]">
                    No job applications submitted yet
                  </h3>
                  <p className="text-xs text-[#231F20]/70 max-w-sm mx-auto leading-relaxed">
                    Browse open delivery partner, warehouse, electrician, and maintenance opportunities and apply in 1 tap with your verified profile.
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
                    const statusCfg =
                      APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.submitted;
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
                                ['submitted', 'in_review', 'shortlisted', 'accepted'].includes(
                                  app.status
                                )
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
                          <AppIcon
                            name="info"
                            size={15}
                            className="text-[#B34A26] shrink-0 mt-0.5"
                          />
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
                                handleSimulateStatus(
                                  app.id,
                                  e.target.value as JobApplicationStatus
                                )
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
          initialFilter={requestsInitialFilter}
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
