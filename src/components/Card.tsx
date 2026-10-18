import type { ReactNode } from 'react';

const variants: Record<string, string> = {
  default:
    'bg-gradient-to-br from-white/95 via-white/85 to-[#FDF8F0]/70 backdrop-blur-2xl border border-[#F4EBDD] text-textPrimary hover:border-[#E5953E]/40',
  emerald:
    'bg-gradient-to-br from-white/95 via-[#FDF3EE]/90 to-[#F1B96B]/20 backdrop-blur-2xl border border-[#F1B96B]/60 text-textPrimary hover:border-[#B34A26]/50',
  accent:
    'bg-gradient-to-br from-white/95 via-[#FEF4E8]/90 to-[#E5953E]/20 backdrop-blur-2xl border border-[#E5953E]/50 text-textPrimary hover:border-saffronGold',
  success:
    'bg-gradient-to-br from-white/95 via-[#F1F8F3]/90 to-[#2E7D32]/15 backdrop-blur-2xl border border-[#2E7D32]/30 text-textPrimary hover:border-[#2E7D32]/50',
  health:
    'bg-gradient-to-br from-white/95 via-[#FEF4E8]/90 to-[#B34A26]/15 backdrop-blur-2xl border border-[#E5953E]/40 text-textPrimary hover:border-[#B34A26]',
  warning:
    'bg-gradient-to-br from-white/95 via-[#FEF9EC]/90 to-[#E5A823]/20 backdrop-blur-2xl border border-[#E5A823]/45 text-textPrimary hover:border-safetyYellow',
  soft:
    'bg-white/80 via-white/65 to-[#FDF8F0]/50 backdrop-blur-xl border border-[#F4EBDD] text-textPrimary shadow-glass',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  lifted = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  lifted?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      data-clickable={onClick ? 'true' : undefined}
      className={`relative mb-4 rounded-[26px] p-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
        lifted ? 'shadow-lifted' : 'shadow-glass'
      } ${variants[variant]} ${
        onClick
          ? 'cursor-pointer active:scale-[0.985] hover:shadow-glassHover hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {/* Specular highlight rim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 to-transparent" />
      {children}
    </div>
  );
}
