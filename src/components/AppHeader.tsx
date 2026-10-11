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
    <header className="flex min-h-[48px] items-center justify-between border-b border-border bg-surface px-4 py-3">
      {onBack ? (
        <button type="button" onClick={onBack} className="flex h-12 w-12 items-center justify-center rounded-full" aria-label="back">
          <AppIcon name="arrow-back" size={24} className="text-textPrimary" />
        </button>
      ) : (
        <div className="h-12 min-w-12" />
      )}
      <h1 className="flex-1 text-center text-[22px] font-bold text-textPrimary">{title}</h1>
      <div className="flex min-w-12 items-center justify-center">{right}</div>
    </header>
  );
}
