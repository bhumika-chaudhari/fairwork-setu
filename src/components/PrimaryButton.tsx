import type { ReactNode } from 'react';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  className = '',
  size = 'normal',
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'emerald';
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  size?: 'normal' | 'small';
}) {
  const colors = {
    primary: 'emerald-gradient-btn',
    emerald: 'emerald-gradient-btn',
    secondary: 'bg-textSecondary text-white hover:bg-textSecondary/90 shadow-card',
    accent: 'bg-gradient-to-r from-[#F4B544] to-[#E29B26] text-deepEmerald font-bold shadow-card hover:brightness-105 border border-[#F4B544]/50',
    outline: 'bg-white/80 backdrop-blur-sm text-primary border-2 border-primary hover:bg-primarySoft/50 shadow-sm',
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      aria-label={title}
      className={`flex w-full items-center justify-center rounded-full px-5 font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
        size === 'small' ? 'h-[44px] text-sm' : 'h-13 min-h-[50px] text-base'
      } ${colors} ${className}`}
    >
      {icon}
      <span className={icon ? 'ml-2' : ''}>{title}</span>
    </button>
  );
}
