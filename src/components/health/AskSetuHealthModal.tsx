import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '../../lib/icons';
import type { HealthChatMessage } from '../../types/health';
import { askHealthAssistant } from '../../services/healthService';
import { isWebSpeechAvailable, createSpeechRecognizer } from '../../ai/models/speechToText';

interface AskSetuHealthModalProps {
  initialQuery?: string;
  onClose: () => void;
  onOpenEmergency: () => void;
}

const SUGGESTED_PROMPTS = [
  'How can a gig worker get 5 lakh hospital treatment under Ayushman Bharat?',
  'What sickness cash benefits are provided by ESIC for injured workers?',
  'What should I do if I feel dizzy in the afternoon heat?',
  'Where is the nearest 24x7 government hospital in Pune?',
  'How can I get generic medicines at 50% discount?',
  'What is the PM-SYM 3,000 rupees monthly pension scheme?',
];


export default function AskSetuHealthModal({
  initialQuery = '',
  onClose,
  onOpenEmergency,
}: AskSetuHealthModalProps) {
  const [messages, setMessages] = useState<HealthChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am Setu Health Assistant. How can I support your health and wellbeing today? You can ask about feeling unwell on shift, nearby government hospitals, or welfare schemes.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

  useEffect(() => {
    if (initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, []);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: HealthChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await askHealthAssistant(textToSend);
      const assistantMsg: HealthChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.sources,
        isEmergency: res.isEmergency,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: HealthChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I could not connect right now, but please remember: for urgent emergencies, call 112 or 108 immediately. For everyday care, visit your nearest Urban Primary Health Centre (UPHC).',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!isWebSpeechAvailable()) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const recognizer = createSpeechRecognizer({
      language: 'hi-IN',
      onResult: (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal) {
          setIsListening(false);
          handleSend(transcript);
        }
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-[#1E2B3E]/60 backdrop-blur-xs sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Setu Health Assistant"
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#F4EBDD] flex flex-col max-h-[92dvh] sm:max-h-[88vh] h-[92dvh] sm:h-[650px] overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] bg-white">
          <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-2 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3A757D] to-[#1E2B3E] text-white shadow-xs">
                <AppIcon name="ai" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#1E2B3E] font-serif">
                    Ask Setu — Health Assistant
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Livelihood health information, welfare schemes & clinic guidance.
                </p>
              </div>
            </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'reset',
                    sender: 'assistant',
                    text: 'Conversation cleared. How can I help you today?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="p-1.5 text-stone-400 hover:text-stone-700 text-xs rounded-lg hover:bg-stone-100"
              title="Clear conversation"
            >
              <AppIcon name="refresh" size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
              aria-label="Close"
            >
              <AppIcon name="close" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-5 pt-2.5 pb-1 shrink-0 scrollbar-none">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-full py-1 px-3 whitespace-nowrap transition-all shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-3 px-5 py-3">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white rounded-br-xs'
                      : msg.isEmergency
                      ? 'bg-red-50 text-red-950 border-2 border-red-300 rounded-bl-xs'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Emergency Trigger Button inside message */}
                  {msg.isEmergency && (
                    <div className="mt-3 pt-2 border-t border-red-200 flex items-center gap-2">
                      <a
                        href="tel:112"
                        className="py-1.5 px-3 rounded-lg bg-red-600 text-white font-black text-xs flex items-center gap-1 shadow-sm"
                      >
                        <AppIcon name="call" size={13} />
                        <span>Call 112 Now</span>
                      </a>
                      <a
                        href="tel:108"
                        className="py-1.5 px-3 rounded-lg bg-[#B34A26] text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <AppIcon name="heart-pulse" size={13} />
                        <span>Call 108</span>
                      </a>
                    </div>
                  )}

                  {/* Verified Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                        Verified Sources:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3A757D] hover:underline bg-[#3A757D]/10 px-2 py-0.5 rounded-md"
                          >
                            <span>{c.title}</span>
                            <AppIcon name="external-link" size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-stone-200 max-w-[50%]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3A757D] border-t-transparent" />
              <span className="text-xs text-stone-500 font-medium">Setu is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Input Bar */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... Speak in Hindi, Marathi, or English'
                    : 'Ask about symptoms, clinics, schemes, or hydration...'
                }
                className={`w-full rounded-2xl border py-2.5 pl-3.5 pr-10 text-xs font-medium text-[#1E2B3E] placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
                  isListening
                    ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-400'
                    : 'border-stone-300 bg-white focus:ring-[#3A757D]/30'
                }`}
              />

              <button
                type="button"
                onClick={toggleVoice}
                className={`absolute right-2.5 top-2 p-1 rounded-full transition-all ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-stone-400 hover:text-[#3A757D] hover:bg-stone-100'
                }`}
                title="Speak question"
              >
                <AppIcon name="mic" size={17} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="py-2.5 px-4 rounded-2xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
            >
              <span>Ask</span>
              <AppIcon name="send" size={13} />
            </button>
          </form>

          {/* Medical Disclaimer */}
          <p className="text-[10px] text-stone-400 text-center mt-2 leading-tight">
            * Setu provides educational health guidance and navigation. In an emergency, call 112 immediately.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
