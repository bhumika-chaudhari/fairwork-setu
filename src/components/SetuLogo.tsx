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
  const sizeClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
  }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="FairWork Setu"
        className={`${sizeClasses} w-auto object-contain shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98] drop-shadow-xs`}
        loading="eager"
      />
      <span className="sr-only">FairWork Setu</span>
    </div>
  );
}
