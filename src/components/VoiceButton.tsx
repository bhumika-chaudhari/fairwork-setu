import { AppIcon } from '../lib/icons';

export default function VoiceButton({
  onPress,
  size = 56,
  isListening = false,
  className = '',
}: {
  onPress: () => void;
  size?: number;
  isListening?: boolean;
  className?: string;
}) {
  const dimension = Math.max(size, 44);
  const ringSize = dimension + 12;
  const outerRingSize = dimension + 24;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer pulsing ambient rings */}
      <div
        className={`absolute rounded-full border border-saffronGold/60 bg-gradient-to-br from-saffronGold/25 to-terracotta/15 backdrop-blur-xl transition-all duration-700 shadow-glow ${
          isListening ? 'animate-pulse-ring' : 'scale-100 opacity-80'
        }`}
        style={{ width: outerRingSize, height: outerRingSize }}
      />
      <div
        className="absolute rounded-full border border-[#F4EBDD] bg-white/40 backdrop-blur-md shadow-xs"
        style={{ width: ringSize, height: ringSize }}
      />

      {/* Main button */}
      <button
        type="button"
        onClick={onPress}
        className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] via-[#943818] to-[#7C2D16] text-white shadow-[0_12px_32px_rgba(179,74,38,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.6)] border border-[#E5953E]/50 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-glow"
        style={{ width: dimension, height: dimension }}
        aria-label="Voice entry"
      >
        <AppIcon name="mic" size={dimension * 0.44} className="text-white drop-shadow" />
      </button>
    </div>
  );
}
