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
        className={`absolute rounded-full border border-mint/40 bg-mint/15 transition-all duration-700 ${
          isListening ? 'animate-pulse-ring' : 'scale-100 opacity-60'
        }`}
        style={{ width: outerRingSize, height: outerRingSize }}
      />
      <div
        className="absolute rounded-full border border-primaryTeal/20 bg-primaryTeal/10"
        style={{ width: ringSize, height: ringSize }}
      />

      {/* Main button */}
      <button
        type="button"
        onClick={onPress}
        className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#087F73] to-[#073B3A] text-white shadow-clay transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-glow"
        style={{ width: dimension, height: dimension }}
        aria-label="Voice entry"
      >
        <AppIcon name="mic" size={dimension * 0.44} className="text-white drop-shadow" />
      </button>
    </div>
  );
}
