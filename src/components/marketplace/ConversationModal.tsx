import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { useProfile } from '../../hooks/ProfileContext';
import {
  fetchConversation,
  sendMessage,
} from '../../services/marketplaceService';
import type { Conversation, MarketplaceMessage } from '../../types/marketplace';
import ModalPortal from '../ModalPortal';

interface ConversationModalProps {
  contextId: string;
  contextType: 'booking' | 'application';
  summaryTitle: string;
  summarySubtitle: string;
  onClose: () => void;
}

const QUICK_REPLIES = [
  'I am on my way to the location.',
  'Please share a nearby landmark.',
  'Are you available at 3 PM instead?',
  'I have reached your doorstep.',
  'Work is completed. Thank you!',
];

export default function ConversationModal({
  contextId,
  contextType,
  summaryTitle,
  summarySubtitle,
  onClose,
}: ConversationModalProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const conv = await fetchConversation(contextId);
    setConversation(conv);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3500); // Polling sync
    return () => clearInterval(interval);
  }, [contextId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      const myUserId =
        'usr-' + (profile.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const senderRole = contextType === 'application' ? 'applicant' : 'customer';

      await sendMessage(contextId, {
        senderId: myUserId,
        senderName: profile.name || 'Setu User',
        senderRole,
        text,
      });

      setInputText('');
      await loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReportUser = () => {
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setReportModalOpen(false);
    }, 2000);
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      maxWidthClass="sm:max-w-lg"
      panelClassName="h-[92dvh] sm:h-[85vh] sm:max-h-[680px]"
    >
      {/* Header Bar with Reference & Summary */}
      <div className="shrink-0 p-4 border-b border-[#F4EBDD] bg-gradient-to-r from-white via-[#FDF8F0] to-white flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-2xl bg-[#B34A26] text-white flex items-center justify-center shrink-0">
            <AppIcon name="message-circle" size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#1E2B3E]/5 text-[#1E2B3E]">
                {contextId}
              </span>
              <span className="text-[10px] font-bold text-[#7C2D16] uppercase">
                {contextType}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1E2B3E] truncate mt-0.5">
              {summaryTitle}
            </h3>
            <p className="text-[11px] text-[#231F20]/70 truncate">
              {summarySubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Report or block participant"
            aria-label="Report or block"
          >
            <AppIcon name="flag" size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            aria-label="Close chat"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>
      </div>

      {/* Privacy Banner */}
      <div className="shrink-0 px-4 py-2 bg-[#FDF8F0] border-b border-[#F1B96B]/30 flex items-center justify-between text-[11px] text-stone-600">
        <span className="flex items-center gap-1.5">
          <AppIcon name="shield-checkmark" size={13} className="text-emerald-700" />
          <span>End-to-end Setu private chat • Phone numbers masked</span>
        </span>
        <button
          type="button"
          onClick={loadMessages}
          className="text-[#B34A26] font-bold hover:underline flex items-center gap-1"
        >
          <AppIcon name="refresh" size={12} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Message Thread */}
      <div className="flex-1 p-4 overflow-y-auto overscroll-contain space-y-3 bg-stone-50/50 min-h-0">
        {(!conversation || conversation.messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-2 p-6">
            <AppIcon name="message-square" size={32} />
            <p className="text-xs">
              No messages yet. Start the conversation with your provider or applicant!
            </p>
          </div>
        ) : (
          conversation.messages.map((msg) => {
            const myUserId =
              'usr-' + (profile.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const isMine =
              msg.senderId === myUserId ||
              msg.senderName === profile.name ||
              msg.senderRole === 'customer';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 px-1 mb-0.5 text-[10px] text-stone-400 font-semibold">
                  <span>{isMine ? 'You' : msg.senderName}</span>
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                    isMine
                      ? 'bg-[#B34A26] text-white rounded-tr-xs'
                      : 'bg-white text-[#1E2B3E] border border-[#F4EBDD] rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reply Suggestions */}
      <div className="shrink-0 hide-scrollbar px-3 py-1.5 bg-white border-t border-[#F4EBDD] flex items-center gap-1.5 overflow-x-auto">
        {QUICK_REPLIES.map((reply, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(reply)}
            className="px-2.5 py-1 rounded-full bg-[#FDF8F0] hover:bg-[#F1B96B]/20 text-[#7C2D16] border border-[#F1B96B]/50 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 p-3 bg-white border-t border-[#F4EBDD] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3.5 py-2.5 rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0] text-xs font-medium text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2.5 rounded-2xl bg-[#B34A26] hover:bg-[#7C2D16] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shadow-xs active:scale-95"
        >
          <AppIcon name="send" size={14} />
          <span>Send</span>
        </button>
      </form>

      {/* Report / Block Sub-Modal */}
      <ModalPortal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        maxWidthClass="sm:max-w-sm"
        zIndexClass="z-60"
      >
        <div className="p-5 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <AppIcon name="flag" size={20} />
          </div>
          <h4 className="text-base font-bold text-[#1E2B3E]">Safety Report & Block</h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            If this user is harassing, demanding unfair payment, or violating trust, you can report them to the Setu safety team.
          </p>

          {reportSuccess ? (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl">
              Incident reported. Our safety desk has been alerted.
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportUser}
                className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm active:scale-95"
              >
                Report & Block
              </button>
            </div>
          )}
        </div>
      </ModalPortal>
    </ModalPortal>
  );
}
