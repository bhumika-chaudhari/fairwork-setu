import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { askHaqAssistant, type HaqAssistantResponse } from '../../services/haqService';
import { readTextAloud } from '../../lib/speechSynthesis';

interface HaqAssistantCardProps {
  onLaunchAppealWizard?: () => void;
}

const SAMPLE_QUERIES = [
  {
    label: 'ID Deactivation / बिना नोटिस आईडी बंद',
    query: 'Company ne bina notice meri ID block kar di, ab main kya karu?',
  },
  {
    label: 'Withheld Payout / पैसा रोक लिया',
    query: 'The platform deducted ₹2,000 fake penalty from my payout',
  },
  {
    label: 'Accident Claim / दुर्घटना बीमा',
    query: 'Delivery ke time bike ka accident hua, claim kaise milega?',
  },
  {
    label: 'Elevator Ban / लिफ्ट में रोका',
    query: 'Gated society security guard assaulted me and banned the elevator',
  },
  {
    label: 'Missing PF / पीएफ गबन',
    query: 'Contractor deducted PF but it is missing from my EPFO account',
  },
  {
    label: 'e-Shram Benefits / ई-श्रम लाभ',
    query: 'What are the benefits of e-Shram card for gig delivery riders?',
  },
  {
    label: 'Draft Reinstatement / अपील विज़ार्ड',
    query: 'Help me draft a legal notice to reinstate my blocked ID',
  },
];

export default function HaqAssistantCard({ onLaunchAppealWizard }: HaqAssistantCardProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<HaqAssistantResponse | null>(null);
  const [isListening, setIsListening] = useState(false);

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || query).trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await askHaqAssistant(q, i18n.language || 'en');
      setResponse(res);
    } catch (err) {
      console.error('Haq Assistant Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleAsk(transcript);
    };

    recognition.start();
  };

  const handleListenAloud = () => {
    if (!response) return;
    readTextAloud(response.answer, i18n.language === 'hi' ? 'hi' : 'en');
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#F1B96B]/60 bg-gradient-to-br from-white via-[#FDF8F0] to-[#F4EBDD]/50 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F4EBDD]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-md">
            <AppIcon name="scale" size={24} className="text-white drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-[#1E2B3E] font-serif">
                Ask Haq Setu (हक सहायक)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#B34A26] text-white tracking-wider uppercase">
                Statutory AI
              </span>
            </div>
            <p className="text-xs text-[#231F20]/75">
              Bilingual Statutory Labor Rights & Dispute Resolution Assistant (English, Hindi & Hinglish)
            </p>
          </div>
        </div>

        <div className="text-xs text-[#7C2D16] font-medium bg-[#FDF8F0] px-3 py-1.5 rounded-xl border border-[#F1B96B]/50 flex items-center gap-1.5 self-start md:self-auto">
          <AppIcon name="shield-checkmark" size={14} className="text-[#B34A26]" />
          <span>Grounded in Rajasthan Gig Act 2023 & Central Codes</span>
        </div>
      </div>

      {/* Query Input Box */}
      <div className="mt-5 space-y-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="Type your issue (e.g. 'Company ne bina notice ID block kar di' or 'Accident claim')..."
            className="w-full rounded-2xl border-2 border-[#F1B96B]/60 bg-white px-4 py-3.5 pr-24 text-sm text-[#1E2B3E] placeholder-[#231F20]/40 focus:border-[#B34A26] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/20 transition-all shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleVoiceInput}
              title="Speak Query"
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-[#FDF8F0] text-[#7C2D16] hover:bg-[#F4EBDD] border border-[#F1B96B]/40'
              }`}
            >
              <AppIcon name="mic" size={16} />
            </button>

            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Ask / पूछें'}
            </button>
          </div>
        </div>

        {/* Quick Sample Questions */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7C2D16]">
            <AppIcon name="flash" size={12} />
            <span>Common Worker Grievances / त्वरित प्रश्न:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUERIES.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sq.query);
                  handleAsk(sq.query);
                }}
                className="px-2.5 py-1 rounded-lg border border-[#F1B96B]/50 bg-white/90 hover:bg-white text-[11px] font-medium text-[#1E2B3E] hover:border-[#B34A26] transition-all shadow-2xs"
              >
                {sq.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Legal Response Display */}
      {response && (
        <div className="mt-6 rounded-2xl border-2 border-[#B34A26]/40 bg-white p-5 md:p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F4EBDD]">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#B34A26]/10 text-[#B34A26] border border-[#B34A26]/30">
                {response.detectedCategory}
              </span>
              {response.isEmergency && (
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse flex items-center gap-1">
                  <AppIcon name="warning" size={12} />
                  Emergency Protection
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleListenAloud}
              className="flex items-center gap-1.5 text-xs font-bold text-[#7C2D16] hover:text-[#B34A26] self-start sm:self-auto bg-[#FDF8F0] px-3 py-1.5 rounded-lg border border-[#F1B96B]/50"
            >
              <AppIcon name="mic" size={14} />
              <span>Listen Aloud / बोलकर सुनें</span>
            </button>
          </div>

          {/* Formatted Answer */}
          <div className="text-sm text-[#1E2B3E] leading-relaxed whitespace-pre-line font-normal">
            {response.answer}
          </div>

          {/* Citations */}
          {response.citations && response.citations.length > 0 && (
            <div className="rounded-xl bg-[#FDF8F0] border border-[#F1B96B]/50 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C2D16]">
                <AppIcon name="document-text" size={14} />
                <span>Statutory Authority & Legal Citations:</span>
              </div>
              <ul className="text-xs text-[#231F20]/80 space-y-1 list-disc list-inside">
                {response.citations.map((cite, i) => (
                  <li key={i} className="font-mono text-[11px]">
                    {cite}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button & Escalation */}
          {response.action && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              {response.action.type === 'route' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (response.action?.route?.includes('appeal-wizard') && onLaunchAppealWizard) {
                      onLaunchAppealWizard();
                    } else if (response.action?.route) {
                      window.location.hash = response.action.route;
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <AppIcon name="arrow-forward" size={14} />
                  <span>{response.action.label}</span>
                </button>
              ) : response.action.type === 'url' ? (
                <a
                  href={response.action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#1E2B3E] text-white font-bold text-xs shadow-md hover:bg-[#2A3B54] active:scale-95 transition-all flex items-center gap-2"
                >
                  <AppIcon name="open" size={14} />
                  <span>{response.action.label}</span>
                </a>
              ) : response.action.type === 'tel' ? (
                <a
                  href={response.action.url}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 animate-bounce"
                >
                  <AppIcon name="call" size={14} />
                  <span>{response.action.label}</span>
                </a>
              ) : null}

              <p className="text-[11px] text-[#231F20]/60 italic">
                {response.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
