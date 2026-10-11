import { AppIcon } from '../lib/icons';

export default function DisclaimerText({
  text,
  variant = 'info',
}: {
  text: string;
  variant?: 'info' | 'warning' | 'health';
}) {
  const map = {
    info: {
      bg: 'bg-white/80 border-border/60 text-textSecondary',
      iconColor: 'text-primary',
      icon: 'information-circle-outline',
    },
    warning: {
      bg: 'bg-[#FFF8EC]/90 border-[#F4B544]/40 text-[#92400E]',
      iconColor: 'text-[#D97706]',
      icon: 'information-circle-outline',
    },
    health: {
      bg: 'bg-[#EDFAF5]/90 border-mint/40 text-deepEmerald',
      iconColor: 'text-primary',
      icon: 'heart-outline',
    },
  }[variant];

  return (
    <div className={`flex items-start rounded-2xl border p-3.5 shadow-glass backdrop-blur-sm ${map.bg}`}>
      <AppIcon name={map.icon} size={16} className={`mr-2.5 mt-0.5 shrink-0 ${map.iconColor}`} />
      <p className="text-xs leading-relaxed font-medium">{text}</p>
    </div>
  );
}
