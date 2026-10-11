import { AppIcon } from '../lib/icons';

export default function SkillChip({
  label,
  icon,
  selected = false,
  onPress,
  variant = 'default',
  color,
  showToggleIcon = false,
  size = 'md',
}: {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'mint';
  color?: string;
  showToggleIcon?: boolean;
  size?: 'sm' | 'md';
}) {
  const isInteractive = Boolean(onPress);

  let styleClasses = 'bg-white/80 text-textPrimary border-border/80 hover:bg-white hover:border-primary/40';
  if (selected) {
    styleClasses = 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white border-transparent shadow-card';
  } else if (variant === 'mint') {
    styleClasses = 'bg-[#E4FAF2] text-[#073B3A] border-[#72E5C2]/60 font-semibold';
  } else if (variant === 'primary') {
    styleClasses = 'bg-primarySoft text-primaryDark border-primarySoft font-semibold';
  } else if (variant === 'accent') {
    styleClasses = 'bg-accentSoft text-[#B45309] border-[#F4B544]/40 font-semibold';
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]';

  return (
    <button
      type="button"
      disabled={!isInteractive}
      onClick={onPress}
      className={`inline-flex items-center rounded-full border transition-all duration-200 ${
        isInteractive ? 'cursor-pointer active:scale-95' : 'cursor-default'
      } ${sizeClasses} ${styleClasses}`}
      style={color && !selected ? { color, borderColor: color } : undefined}
    >
      {showToggleIcon && (
        <span className="mr-1.5 font-bold text-xs">
          {selected ? '✓' : '+'}
        </span>
      )}
      {icon ? <AppIcon name={icon} size={14} className="mr-1.5" /> : null}
      <span className="font-semibold whitespace-nowrap">{label}</span>
    </button>
  );
}
