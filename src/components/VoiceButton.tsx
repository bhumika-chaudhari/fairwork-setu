import { AppIcon } from '../lib/icons';

export default function VoiceButton({
  onPress,
  size = 72,
  isListening = false,
  className = '',
}: {
  onPress: () => void;
  size?: number;
  isListening?: boolean;
  className?: string;
}) {
  const dimension = Math.max(size, 48);
  const ringSize = dimension + 20;
  const outerRingSize = dimension + 40;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer pulsing ambient rings */}
      <div
        className={`absolute rounded-full border border-mint/60 bg-gradient-to-br from-mint/25 to-primaryTeal/15 backdrop-blur-xl transition-all duration-700 shadow-glow ${
          isListening ? 'animate-pulse-ring' : 'scale-100 opacity-80'
        }`}
        style={{ width: outerRingSize, height: outerRingSize }}
      />
      <div
        className="absolute rounded-full border border-white/80 bg-white/30 backdrop-blur-md shadow-xs"
        style={{ width: ringSize, height: ringSize }}
      />

      {/* Main button */}
      <button
        type="button"
        onClick={onPress}
        className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#087F73] via-[#073B3A] to-[#042423] text-white shadow-[0_12px_32px_rgba(8,127,115,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.6)] border border-mint/50 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-glow"
        style={{ width: dimension, height: dimension }}
        aria-label="Voice entry"
      >
        <AppIcon name="mic" size={dimension * 0.44} className="text-white drop-shadow" />
      </button>
    </div>
  );
}
