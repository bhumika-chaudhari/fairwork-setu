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

  let styleClasses = 'bg-cleanWhite/90 hover:bg-cleanWhite text-earthyCharcoal border-softBorder hover:border-terracotta/40 backdrop-blur-lg shadow-xs';
  if (selected) {
    styleClasses = 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white border-saffronGold/50 shadow-dockActive';
  } else if (variant === 'mint') {
    styleClasses = 'bg-warmAmber/20 backdrop-blur-md text-warmCocoa border-warmAmber/40 font-bold';
  } else if (variant === 'primary') {
    styleClasses = 'bg-terracotta/10 backdrop-blur-md text-terracotta border-terracotta/30 font-bold';
  } else if (variant === 'accent') {
    styleClasses = 'bg-saffronGold/20 backdrop-blur-md text-warmCocoa border-saffronGold/40 font-bold';
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
