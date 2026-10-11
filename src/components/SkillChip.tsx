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

  let styleClasses = 'bg-white/65 hover:bg-white/85 text-textPrimary border-white/80 hover:border-primary/40 backdrop-blur-lg shadow-[0_2px_8px_rgba(7,59,58,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)]';
  if (selected) {
    styleClasses = 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white border-mint/50 shadow-dockActive';
  } else if (variant === 'mint') {
    styleClasses = 'bg-[#E4FAF2]/80 backdrop-blur-md text-[#073B3A] border-[#72E5C2]/60 font-bold';
  } else if (variant === 'primary') {
    styleClasses = 'bg-primarySoft/80 backdrop-blur-md text-primaryDark border-mint/35 font-bold';
  } else if (variant === 'accent') {
    styleClasses = 'bg-accentSoft/80 backdrop-blur-md text-[#B45309] border-[#F4B544]/50 font-bold';
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
