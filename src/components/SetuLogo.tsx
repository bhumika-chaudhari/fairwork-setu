import React from 'react';

interface SetuLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function SetuLogo({
  className = '',
  size = 'md',
  showText = true,
}: SetuLogoProps) {
  const iconSizes = {
    sm: { w: 28, h: 28, spark: 6, font: 'text-lg' },
    md: { w: 34, h: 34, spark: 8, font: 'text-xl' },
    lg: { w: 44, h: 44, spark: 10, font: 'text-2xl' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Setu Bridge-Leaf Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#073B3A] to-[#087F73] shadow-card transition-transform active:scale-95"
        style={{ width: iconSizes.w, height: iconSizes.h }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Bridge arch / leaf foundation */}
          <path
            d="M6 22C8.5 15 13 11 22 10"
            stroke="#72E5C2"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M10 24C13 18.5 17 15.5 26 15"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Diamond spark / forward momentum */}
          <circle cx="23" cy="8" r="2.8" fill="#F4B544" />
        </svg>
      </div>

      {showText && (
        <span
          className={`font-extrabold tracking-tight text-[#073B3A] ${iconSizes.font}`}
        >
          Setu
        </span>
      )}
    </div>
  );
}
