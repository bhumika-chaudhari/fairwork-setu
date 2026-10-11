import type { ReactNode } from 'react';

export default function GhostButton({
  title,
  onPress,
  icon,
  className = '',
  variant = 'text',
}: {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  className?: string;
  variant?: 'text' | 'outline';
}) {
  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`flex h-11 items-center justify-center px-4 font-bold text-textSecondary transition-all hover:text-deepEmerald hover:bg-white/50 rounded-full active:scale-95 ${className}`}
      >
        {icon}
        <span className={icon ? 'ml-2' : ''}>{title}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex h-12 w-full items-center justify-center rounded-full border border-white/80 bg-white/65 backdrop-blur-xl px-5 font-bold text-primary shadow-glass transition-all hover:bg-white/85 hover:border-primary/40 active:scale-[0.98] ${className}`}
    >
      {icon}
      <span className={icon ? 'ml-2' : ''}>{title}</span>
    </button>
  );
}
