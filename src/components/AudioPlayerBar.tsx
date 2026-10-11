import { useSpeech } from '../lib/speechSynthesisContext';
import { AppIcon } from '../lib/icons';

export default function AudioPlayerBar() {
  const { state, currentTrack, pause, resume, stop, errorMessage } = useSpeech();

  if (state === 'idle' && !errorMessage) {
    return null;
  }

  const isPlaying = state === 'playing';
  const isPaused = state === 'paused';

  return (
    <aside
      role="region"
      aria-label="Audio player controls"
      aria-live="polite"
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg transition-all duration-300"
    >
      <div className="relative overflow-hidden rounded-[26px] bg-white/80 backdrop-blur-3xl border border-white/90 p-3 shadow-dock flex items-center justify-between gap-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
        {/* Left: Speaker icon + Sound waves or error */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              errorMessage
                ? 'bg-danger/15 text-danger border border-danger/30'
                : 'bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white shadow-dockActive border border-mint/40'
            }`}
          >
            {errorMessage ? (
              <AppIcon name="alert-circle" size={20} />
            ) : isPlaying ? (
              <div className="flex items-center gap-0.5" aria-hidden="true">
                <span className="h-3 w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] rounded-full bg-mint" />
                <span className="h-5 w-0.5 animate-[pulse_0.4s_ease-in-out_infinite_0.15s] rounded-full bg-white" />
                <span className="h-2.5 w-0.5 animate-[pulse_0.5s_ease-in-out_infinite_0.3s] rounded-full bg-mint" />
              </div>
            ) : (
              <AppIcon name="volume-medium" size={18} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primaryTeal">
                {errorMessage ? 'Audio Notice' : isPlaying ? 'Explaining Now' : 'Audio Paused'}
              </span>
              {currentTrack?.lang && !errorMessage && (
                <span className="rounded-full bg-mint/30 px-1.5 py-0.2 text-[9px] font-bold text-deepEmerald">
                  {currentTrack.lang.startsWith('hi')
                    ? 'हिन्दी'
                    : currentTrack.lang.startsWith('mr')
                    ? 'मराठी'
                    : 'English'}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-deepEmerald truncate">
              {errorMessage || currentTrack?.title || 'Speech Explainer'}
            </p>
          </div>
        </div>

        {/* Right: Controls (Play/Pause, Stop) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!errorMessage && (
            <button
              type="button"
              onClick={isPlaying ? pause : resume}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-page border border-border/70 text-deepEmerald hover:bg-white transition-all active:scale-95 shadow-xs"
              title={isPlaying ? 'Pause' : 'Resume'}
              aria-label={isPlaying ? 'Pause audio' : 'Resume audio'}
            >
              <AppIcon name={isPlaying ? 'pause' : 'play'} size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={stop}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all active:scale-95"
            title="Stop audio"
            aria-label="Stop audio"
          >
            <AppIcon name="close" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
