import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { feedback, playTap } from '../lib/feedback';

interface SoundToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function SoundToggle({
  className = '',
  size = 'md',
  showLabel = false,
}: SoundToggleProps) {
  const [muted, setMuted] = useState(feedback.isMuted);

  useEffect(() => {
    // Keep in sync with feedback engine globally
    const unsubscribe = feedback.subscribe((isMuted) => {
      setMuted(isMuted);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    const next = feedback.toggleMute();
    if (!next) {
      playTap();
    }
  };

  const dimClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      title={muted ? 'Unmute sounds & haptics' : 'Mute sounds & haptics'}
      aria-label={muted ? 'Unmute sounds & haptics' : 'Mute sounds & haptics'}
      className={`relative flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-[#F4EBDD] text-deepEmerald shadow-xs transition-colors hover:bg-white hover:border-[#E5953E]/50 active:scale-95 ${
        showLabel ? 'px-3 py-1.5 gap-1.5 w-auto' : dimClasses
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${iconSize} transition-transform ${muted ? 'text-[#B34A26]' : 'text-[#7C2D16]'}`}
      >
        <polygon
          points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
          fill="currentColor"
          fillOpacity={muted ? '0.08' : '0.2'}
        />
        {!muted ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <>
            <line x1="23" y1="1" x2="1" y2="23" stroke="#B34A26" strokeWidth="2.5" />
          </>
        )}
      </svg>

      {showLabel && (
        <span className="text-xs font-bold text-deepEmerald">
          {muted ? 'Muted' : 'Sound On'}
        </span>
      )}
    </motion.button>
  );
}
