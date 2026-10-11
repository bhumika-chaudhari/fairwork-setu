import type { ReactNode } from 'react';

const variants: Record<string, string> = {
  default:
    'bg-gradient-to-br from-white/94 via-[rgba(244,253,250,0.88)] to-[rgba(114,229,194,0.16)] backdrop-blur-md border border-[rgba(8,127,115,0.16)] text-textPrimary shadow-glass hover:border-[rgba(8,127,115,0.28)]',
  emerald:
    'bg-gradient-to-br from-[rgba(235,253,247,0.95)] via-[rgba(209,250,237,0.82)] to-[rgba(114,229,194,0.24)] backdrop-blur-md border border-[rgba(8,127,115,0.25)] text-textPrimary shadow-glass',
  accent:
    'bg-gradient-to-br from-[rgba(255,251,235,0.95)] via-[rgba(254,243,199,0.82)] to-[rgba(244,181,68,0.15)] backdrop-blur-md border border-[rgba(244,181,68,0.40)] text-textPrimary shadow-glass',
  success:
    'bg-gradient-to-br from-[rgba(240,253,244,0.95)] via-[rgba(220,252,231,0.85)] to-[rgba(114,229,194,0.25)] backdrop-blur-md border border-[rgba(8,127,115,0.24)] text-textPrimary shadow-glass',
  health:
    'bg-gradient-to-br from-[rgba(240,253,250,0.95)] via-[rgba(204,251,241,0.85)] to-[rgba(114,229,194,0.20)] backdrop-blur-md border border-[rgba(8,127,115,0.22)] text-textPrimary shadow-glass',
  warning:
    'bg-gradient-to-br from-[rgba(255,251,235,0.95)] via-[rgba(254,243,199,0.85)] to-[rgba(217,119,6,0.18)] backdrop-blur-md border border-[rgba(217,119,6,0.30)] text-textPrimary shadow-glass',
  soft:
    'bg-gradient-to-br from-white/92 via-[rgba(248,252,250,0.80)] to-[rgba(114,229,194,0.10)] backdrop-blur-sm border border-[rgba(8,127,115,0.12)] text-textPrimary shadow-sm',
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
      className={`relative mb-4 rounded-[24px] p-4 transition-all duration-200 overflow-hidden ${
        lifted ? 'shadow-lifted' : 'shadow-glass'
      } ${variants[variant]} ${
        onClick ? 'cursor-pointer active:scale-[0.99] hover:shadow-glassHover' : ''
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      {children}
    </div>
  );
}
