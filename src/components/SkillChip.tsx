import React from 'react';
import { AppIcon } from '../lib/icons';

export interface SkillChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'mint';
  color?: string;
  showToggleIcon?: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export default function SkillChip({
  label,
  icon,
  selected = false,
  onPress,
  onClick,
  variant = 'default',
  color,
  showToggleIcon = true,
  size = 'md',
  disabled = false,
}: SkillChipProps) {
  const handleClick = onPress || onClick;
  const isInteractive = Boolean(handleClick) && !disabled;

  let styleClasses =
    'bg-white/95 hover:bg-white text-deepEmerald border-[#D8CCB5] hover:border-[#B34A26]/60 shadow-xs font-semibold';
  if (selected) {
    styleClasses =
      'bg-gradient-to-r from-[#B34A26] to-[#8C3415] text-white border-[#B34A26] font-bold shadow-dockActive ring-2 ring-[#B34A26]/30';
  } else if (variant === 'mint') {
    styleClasses = 'bg-warmAmber/20 backdrop-blur-md text-warmCocoa border-warmAmber/40 font-bold';
  } else if (variant === 'primary') {
    styleClasses = 'bg-terracotta/10 backdrop-blur-md text-terracotta border-terracotta/30 font-bold';
  } else if (variant === 'accent') {
    styleClasses = 'bg-saffronGold/20 backdrop-blur-md text-warmCocoa border-saffronGold/40 font-bold';
  }

  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs md:text-sm min-h-[36px]';

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`${label}${selected ? ' (selected)' : ''}`}
      disabled={disabled}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick?.();
        }
      }}
      className={`inline-flex items-center rounded-full border transition-all duration-200 select-none ${
        isInteractive ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-60'
      } ${sizeClasses} ${styleClasses}`}
      style={color && !selected ? { color, borderColor: color } : undefined}
    >
      {showToggleIcon && (
        <span
          className={`mr-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold transition-all duration-200 ${
            selected
              ? 'bg-white text-[#B34A26] shadow-xs'
              : 'bg-[#EFE6D8] text-warmCocoa border border-[#D8CCB5]'
          }`}
          aria-hidden="true"
        >
          {selected ? '✓' : '+'}
        </span>
      )}
      {icon ? <AppIcon name={icon} size={14} className="mr-1.5 shrink-0" /> : null}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
