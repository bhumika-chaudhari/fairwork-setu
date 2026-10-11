import type { ReactNode } from 'react';
import { AppIcon } from '../lib/icons';

export default function AppHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[52px] items-center justify-between border-b border-white/80 bg-white/75 backdrop-blur-2xl px-4 py-3 shadow-[0_4px_20px_rgba(7,59,58,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)]">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 hover:bg-white/90 border border-white/80 shadow-xs transition-all active:scale-95"
          aria-label="back"
        >
          <AppIcon name="arrow-back" size={20} className="text-textPrimary" />
        </button>
      ) : (
        <div className="h-10 min-w-10" />
      )}
      <h1 className="flex-1 text-center text-[20px] font-extrabold text-deepEmerald tracking-tight">{title}</h1>
      <div className="flex min-w-10 items-center justify-center">{right}</div>
    </header>
  );
}
