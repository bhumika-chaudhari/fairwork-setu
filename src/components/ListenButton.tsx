import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSpeech, type SpeechTrack } from '../lib/speechSynthesisContext';
import { AppIcon } from '../lib/icons';

interface ListenButtonProps {
  track: SpeechTrack;
  className?: string;
  size?: 'sm' | 'md';
}

export default function ListenButton({ track, className = '', size = 'md' }: ListenButtonProps) {
  const { i18n } = useTranslation();
  const { state, activeId, toggle, stop } = useSpeech();

  const isThisActive = activeId === track.id;
  const isPlaying = isThisActive && state === 'playing';
  const isPaused = isThisActive && state === 'paused';

  // Strict localization requirement:
  // In English, replace "Suno" with "Listen".
  // Show "Suno" only for Hindi localization.
  // For Marathi localization, show "Aika".
  const lang = (i18n.language || 'en').toLowerCase();
  const getButtonLabel = () => {
    if (isPlaying) {
      if (lang.startsWith('hi')) return 'रोकें';
      if (lang.startsWith('mr')) return 'थांबवा';
      return 'Pause';
    }
    if (isPaused) {
      if (lang.startsWith('hi')) return 'जारी रखें';
      if (lang.startsWith('mr')) return 'सुरू करा';
      return 'Resume';
    }
    if (lang.startsWith('hi')) return 'सुनो';
    if (lang.startsWith('mr')) return 'ऐका';
    return 'Listen';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle({
      ...track,
      lang: lang.startsWith('hi') ? 'hi-IN' : lang.startsWith('mr') ? 'mr-IN' : 'en-IN',
    });
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${getButtonLabel()}: ${track.title}`}
        className={`group relative inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 active:scale-95 ${
          size === 'sm'
            ? 'px-2.5 py-1 text-[11px]'
            : 'px-3.5 py-1.5 text-xs'
        } ${
          isPlaying
            ? 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white shadow-clay ring-2 ring-mint/50'
            : isPaused
            ? 'bg-saffron/20 border border-saffron/50 text-[#854D0E]'
            : 'bg-white/80 hover:bg-white text-deepEmerald border border-[rgba(8,127,115,0.2)] shadow-xs hover:border-[rgba(8,127,115,0.4)]'
        } ${className}`}
        title={`${getButtonLabel()} audio explanation`}
      >
        {isPlaying ? (
          /* Animated sound wave bars when speaking */
          <span className="flex items-center gap-0.5" aria-hidden="true">
            <span className="h-3 w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] rounded-full bg-mint" />
            <span className="h-4 w-0.5 animate-[pulse_0.4s_ease-in-out_infinite_0.15s] rounded-full bg-white" />
            <span className="h-2.5 w-0.5 animate-[pulse_0.5s_ease-in-out_infinite_0.3s] rounded-full bg-mint" />
          </span>
        ) : isPaused ? (
          <AppIcon name="play" size={13} className="text-[#854D0E]" />
        ) : (
          <AppIcon name="volume-high" size={14} className="text-primaryTeal" />
        )}

        <span>{getButtonLabel()}</span>
      </button>

      {/* Stop button when active */}
      {isThisActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            stop();
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all text-xs"
          title="Stop speech"
          aria-label="Stop audio"
        >
          ✕
        </button>
      )}
    </div>
  );
}
