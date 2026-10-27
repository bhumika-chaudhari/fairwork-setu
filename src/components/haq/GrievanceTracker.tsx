import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import type { HaqCase, HaqCaseStatus } from '../../types/haq';
import {
  getSavedCases,
  syncHaqCasesWithCloud,
  updateHaqCase,
  deleteHaqCase,
} from '../../services/haqService';
import { readTextAloud, stopSpeaking } from '../../lib/speechSynthesis';
import ModalPortal from '../ModalPortal';

interface GrievanceTrackerProps {
  onStartNewCase?: () => void;
  onOpenAppeal?: (caseItem: HaqCase) => void;
}

const STATUS_CONFIG: Record<
  HaqCaseStatus,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  draft: {
    label: 'Draft Appeal',
    bg: 'bg-[#FDF8F0]',
    text: 'text-[#B34A26]',
    border: 'border-[#F1B96B]',
    desc: 'Work in progress. Not submitted yet.',
  },
  ready_to_submit: {
    label: 'Ready to Submit',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    desc: 'Appeal generated. Ready to send to platform.',
  },
  submitted: {
    label: 'Submitted by Worker',
    bg: 'bg-[#3A757D]/10',
    text: 'text-[#3A757D]',
    border: 'border-[#3A757D]/30',
    desc: 'Sent via email/support ticket.',
  },
  awaiting_response: {
    label: 'Awaiting Response',
    bg: 'bg-[#FEF7EC]',
    text: 'text-[#7C2D16]',
    border: 'border-[#F1B96B]',
    desc: 'Waiting for platform support review (usually 48–72 hrs).',
  },
  follow_up_needed: {
    label: 'Follow-Up Needed',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    desc: 'Deadline passed without resolution. Escalate or follow up.',
  },
  resolved: {
    label: 'Resolved / Reactivated',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    desc: 'Account reinstated or grievance settled.',
  },
  closed: {
    label: 'Closed',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
    desc: 'Case concluded.',
  },
};

export default function GrievanceTracker({
  onStartNewCase,
  onOpenAppeal,
}: GrievanceTrackerProps) {
  const { t } = useTranslation();
  const [cases, setCases] = useState<HaqCase[]>([]);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<HaqCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<HaqCase | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketInput, setTicketInput] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

  const loadCases = () => {
    setCases(getSavedCases());
  };

  useEffect(() => {
    loadCases();
    syncHaqCasesWithCloud().then((synced) => {
      if (synced && synced.length > 0) {
        setCases(synced);
      }
    }).catch(() => {});

    const handleStorageChange = () => loadCases();
    window.addEventListener('haq_cases_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('haq_cases_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      stopSpeaking();
    };
  }, []);

  const handleStatusChange = (caseId: string, newStatus: HaqCaseStatus) => {
    updateHaqCase(caseId, { status: newStatus });
    loadCases();
  };

  const handleSaveTicket = (caseId: string) => {
    updateHaqCase(caseId, { ticketNumber: ticketInput.trim() });
    setEditingTicketId(null);
    setTicketInput('');
    loadCases();
  };

  const handleSaveNotes = (caseId: string) => {
    updateHaqCase(caseId, { notes: notesInput.trim() });
    setEditingNotesId(null);
    setNotesInput('');
    loadCases();
  };

  const confirmDelete = () => {
    if (!caseToDelete) return;
    deleteHaqCase(caseToDelete.id);
    setCaseToDelete(null);
    if (selectedCaseForDetails?.id === caseToDelete.id) {
      setSelectedCaseForDetails(null);
    }
    loadCases();
  };

  const copyAppealToClipboard = async (caseItem: HaqCase) => {
    const text = `Subject: ${caseItem.appealSubject || caseItem.title}\n\n${caseItem.appealBody || ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaseId(caseItem.id);
      setTimeout(() => setCopiedCaseId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleListenCase = (c: HaqCase) => {
    const speech = `Case ${c.id} for ${c.platform}. Status: ${STATUS_CONFIG[c.status].label}. Occurred on ${c.dateOccurred}. ${c.ticketNumber ? `Support Ticket number is ${c.ticketNumber}.` : 'No ticket number recorded yet.'}`;
    readTextAloud(speech);
  };

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2B3E] font-serif">
            My Saved Cases & Grievances
          </h2>
          <p className="text-xs text-[#231F20]/70 mt-0.5">
            Track appeals, support ticket numbers, and follow-up deadlines securely on your device.
          </p>
        </div>
        {cases.length > 0 && onStartNewCase && (
          <button
            onClick={onStartNewCase}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#B34A26] hover:bg-[#7C2D16] transition-all shadow-sm flex items-center gap-1.5"
          >
            <AppIcon name="create-outline" size={14} />
            <span>New Case</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {cases.length === 0 ? (
        <div className="rounded-2xl border border-[#F4EBDD] bg-white p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FDF8F0] border border-[#F1B96B]/50 flex items-center justify-center text-[#B34A26] mb-4">
            <AppIcon name="shield-checkmark" size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#1E2B3E] font-serif">
            No Saved Cases Yet
          </h3>
          <p className="text-sm text-[#231F20]/70 max-w-md mx-auto mt-2 leading-relaxed">
            When you complete an account deactivation appeal, missing payment inquiry, or penalty dispute, your draft and status will be saved here so you never lose your progress.
          </p>
          {onStartNewCase && (
            <button
              onClick={onStartNewCase}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#B34A26] hover:bg-[#7C2D16] transition-all shadow-md active:scale-95"
            >
              <AppIcon name="shield-alert" size={16} />
              <span>Report an Account Issue</span>
            </button>
          )}
        </div>
      ) : (
        /* Case Cards List */
        <div className="space-y-4">
          {cases.map((c) => {
            const statusInfo = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
            const isEditingTicket = editingTicketId === c.id;
            const isEditingNotes = editingNotesId === c.id;

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-[#F4EBDD] bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Case ID, Platform, Status, Speech */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FDF8F0] border border-[#F4EBDD] flex items-center justify-center text-[#B34A26] font-bold text-xs">
                      <AppIcon name="shield" size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1E2B3E]/5 text-[#1E2B3E]">
                          {c.id}
                        </span>
                        <span className="text-xs font-semibold text-[#7C2D16]">
                          {c.platform}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1E2B3E] mt-0.5">
                        {c.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleListenCase(c)}
                      aria-label="Listen to case status aloud"
                      className="p-1.5 rounded-lg border border-[#F4EBDD] text-[#7C2D16] hover:bg-[#FDF8F0] transition-colors"
                      title="Read case summary aloud"
                    >
                      <AppIcon name="mic" size={16} />
                    </button>
                    {/* Status Dropdown */}
                    <div className="relative inline-block">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as HaqCaseStatus)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none transition-colors ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        <option value="draft">Draft Appeal</option>
                        <option value="ready_to_submit">Ready to Submit</option>
                        <option value="submitted">Submitted to Platform</option>
                        <option value="awaiting_response">Awaiting Response</option>
                        <option value="follow_up_needed">Follow-Up Needed</option>
                        <option value="resolved">Resolved / Reactivated</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sub details: Dates & Outcomes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-2 border-y border-[#F4EBDD] text-xs">
                  <div>
                    <span className="text-[#231F20]/60 block text-[11px]">Occurred On</span>
                    <span className="font-medium text-[#1E2B3E]">{c.dateOccurred || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[#231F20]/60 block text-[11px]">Created</span>
                    <span className="font-medium text-[#1E2B3E]">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#231F20]/60 block text-[11px]">Evidence Attached</span>
                    <span className="font-medium text-[#1E2B3E]">
                      {c.hasEvidence ? 'Yes (Local Preview)' : 'No (Written facts only)'}
                    </span>
                  </div>
                </div>

                {/* Ticket Number & Follow-Up Section */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1E2B3E]">
                      Support Ticket / Grievance ID:
                    </span>
                    {!isEditingTicket && (
                      <button
                        onClick={() => {
                          setEditingTicketId(c.id);
                          setTicketInput(c.ticketNumber || '');
                        }}
                        className="text-[#B34A26] hover:underline flex items-center gap-1 font-medium"
                      >
                        <AppIcon name="pencil" size={12} />
                        <span>{c.ticketNumber ? 'Edit' : '+ Add Ticket ID'}</span>
                      </button>
                    )}
                  </div>
                  {isEditingTicket ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ticketInput}
                        onChange={(e) => setTicketInput(e.target.value)}
                        placeholder="e.g. ZOM-782910 or GIG-RJ-2024-912"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#F1B96B] bg-[#FDF8F0] text-xs text-[#231F20] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveTicket(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#B34A26] hover:bg-[#7C2D16]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTicketId(null)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium text-[#231F20]/70 hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-stone-700 bg-[#FDF8F0]/70 px-3 py-1.5 rounded-lg font-mono text-[11px]">
                      {c.ticketNumber || 'No ticket number linked yet. Add your complaint number once received.'}
                    </p>
                  )}
                </div>

                {/* Follow-up Notes Section */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1E2B3E]">Worker Notes & Response:</span>
                    {!isEditingNotes && (
                      <button
                        onClick={() => {
                          setEditingNotesId(c.id);
                          setNotesInput(c.notes || '');
                        }}
                        className="text-[#B34A26] hover:underline flex items-center gap-1 font-medium"
                      >
                        <AppIcon name="pencil" size={12} />
                        <span>{c.notes ? 'Edit Notes' : '+ Add Note'}</span>
                      </button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="e.g. Called team leader on Monday, they said senior desk will reply in 48 hours..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-[#F1B96B] bg-[#FDF8F0] text-xs text-[#231F20] focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveNotes(c.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#B34A26] hover:bg-[#7C2D16]"
                        >
                          Save Notes
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-2 py-1.5 rounded-lg text-xs font-medium text-[#231F20]/70 hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    c.notes && (
                      <p className="text-stone-700 bg-stone-50 border border-stone-200 p-2.5 rounded-lg text-xs italic">
                        "{c.notes}"
                      </p>
                    )
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {c.appealBody && (
                      <button
                        onClick={() => setSelectedCaseForDetails(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#F4EBDD] bg-[#FDF8F0] text-xs font-semibold text-[#7C2D16] hover:bg-[#F1B96B]/20 transition-colors"
                      >
                        <AppIcon name="document-text" size={14} />
                        <span>View Appeal Draft</span>
                      </button>
                    )}
                    {c.appealBody && (
                      <button
                        onClick={() => copyAppealToClipboard(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] hover:bg-stone-50 transition-colors"
                      >
                        <AppIcon name={copiedCaseId === c.id ? 'check' : 'copy'} size={14} />
                        <span>{copiedCaseId === c.id ? 'Copied!' : 'Copy Letter'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setCaseToDelete(c)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete case"
                    aria-label="Delete this case"
                  >
                    <AppIcon name="trash" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appeal Details Modal */}
      <ModalPortal
        isOpen={!!selectedCaseForDetails}
        onClose={() => setSelectedCaseForDetails(null)}
        maxWidthClass="sm:max-w-xl"
      >
        {selectedCaseForDetails && (
          <>
            {/* Pinned Header */}
            <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[#F4EBDD] flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#B34A26]">
                  {selectedCaseForDetails.id}
                </span>
                <h3 className="text-lg font-bold text-[#1E2B3E] font-serif">
                  Appeal Letter Draft ({selectedCaseForDetails.platform})
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseForDetails(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
              {selectedCaseForDetails.appealSubject && (
                <div className="rounded-xl bg-[#FDF8F0] p-3 border border-[#F1B96B]/40 text-xs">
                  <span className="font-bold text-[#7C2D16] block">Subject:</span>
                  <span className="font-medium text-[#1E2B3E]">
                    {selectedCaseForDetails.appealSubject}
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs font-mono whitespace-pre-wrap text-[#231F20] leading-relaxed max-h-72 overflow-y-auto">
                {selectedCaseForDetails.appealBody}
              </div>
            </div>

            {/* Pinned Action Footer */}
            <div className="shrink-0 px-6 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-3">
              <button
                onClick={() => copyAppealToClipboard(selectedCaseForDetails)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#B34A26] hover:bg-[#7C2D16] transition-all shadow-sm active:scale-95"
              >
                <AppIcon name={copiedCaseId === selectedCaseForDetails.id ? 'check' : 'copy'} size={14} />
                <span>{copiedCaseId === selectedCaseForDetails.id ? 'Copied' : 'Copy Full Text'}</span>
              </button>
              <button
                onClick={() => setSelectedCaseForDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                Close
              </button>
            </div>
          </>
        )}
      </ModalPortal>

      {/* Delete Confirmation Modal */}
      <ModalPortal
        isOpen={!!caseToDelete}
        onClose={() => setCaseToDelete(null)}
        maxWidthClass="sm:max-w-sm"
      >
        {caseToDelete && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AppIcon name="trash" size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1E2B3E]">
                Delete Case {caseToDelete.id}?
              </h4>
              <p className="text-xs text-[#231F20]/70 mt-1 leading-relaxed">
                This will remove this case and appeal draft from your device. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCaseToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                Keep Case
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
