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
        className={`flex h-12 items-center justify-center px-4 font-semibold text-textSecondary transition-colors hover:text-deepEmerald active:scale-95 ${className}`}
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
      className={`flex h-12 w-full items-center justify-center rounded-full border border-primary/30 bg-white/70 backdrop-blur-sm px-5 font-semibold text-primary transition-all hover:bg-white active:scale-98 ${className}`}
    >
      {icon}
      <span className={icon ? 'ml-2' : ''}>{title}</span>
    </button>
  );
}
