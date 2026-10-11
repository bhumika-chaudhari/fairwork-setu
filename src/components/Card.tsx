import type { ReactNode } from 'react';

const variants: Record<string, string> = {
  default:
    'bg-gradient-to-br from-white/80 via-white/60 to-[rgba(240,253,248,0.45)] backdrop-blur-2xl border border-white/85 text-textPrimary hover:border-white/95',
  emerald:
    'bg-gradient-to-br from-[rgba(235,253,247,0.85)] via-[rgba(215,251,240,0.65)] to-[rgba(114,229,194,0.30)] backdrop-blur-2xl border border-[rgba(114,229,194,0.65)] text-textPrimary hover:border-mint',
  accent:
    'bg-gradient-to-br from-[rgba(255,251,235,0.85)] via-[rgba(254,243,199,0.65)] to-[rgba(244,181,68,0.22)] backdrop-blur-2xl border border-[rgba(244,181,68,0.55)] text-textPrimary hover:border-saffron',
  success:
    'bg-gradient-to-br from-[rgba(240,253,244,0.85)] via-[rgba(220,252,231,0.65)] to-[rgba(114,229,194,0.28)] backdrop-blur-2xl border border-[rgba(8,127,115,0.35)] text-textPrimary hover:border-primary',
  health:
    'bg-gradient-to-br from-[rgba(240,253,250,0.85)] via-[rgba(204,251,241,0.65)] to-[rgba(114,229,194,0.25)] backdrop-blur-2xl border border-[rgba(8,127,115,0.32)] text-textPrimary hover:border-teal',
  warning:
    'bg-gradient-to-br from-[rgba(255,251,235,0.85)] via-[rgba(254,243,199,0.65)] to-[rgba(217,119,6,0.24)] backdrop-blur-2xl border border-[rgba(217,119,6,0.45)] text-textPrimary hover:border-amber-500',
  soft:
    'bg-white/65 via-white/50 to-[rgba(248,252,250,0.40)] backdrop-blur-xl border border-white/75 text-textPrimary shadow-glass',
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
