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
    secondary: 'bg-[#1E2B3E]/90 hover:bg-[#1E2B3E] text-white shadow-glass border border-[#F4EBDD]/20 active:scale-95',
    accent: 'bg-gradient-to-r from-[#E5953E] to-[#E5A823] text-[#7C2D16] font-extrabold shadow-[0_8px_24px_rgba(229,149,62,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.7)] hover:brightness-105 border border-white/40',
    outline: 'bg-white/80 backdrop-blur-xl text-[#B34A26] border border-[#B34A26]/40 hover:bg-white shadow-glass hover:border-[#B34A26]',
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      aria-label={title}
      className={`relative overflow-hidden flex w-full items-center justify-center rounded-full px-5 font-extrabold tracking-tight transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${
        size === 'small' ? 'h-[44px] text-sm' : 'h-13 min-h-[50px] text-base'
      } ${colors} ${className}`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {icon}
      <span className={icon ? 'ml-2' : ''}>{title}</span>
    </button>
  );
}
