import { AppIcon } from '../lib/icons';

export default function EmptyState({
  icon = 'search-outline',
  message,
  submessage,
  actionLabel,
  onAction,
}: {
  icon?: string;
  message: string;
  submessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white/80 p-8 text-center shadow-glass border border-white">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E6F7F2] text-[#087F73] shadow-xs">
        <AppIcon name={icon} size={36} />
      </div>
      <p className="text-base font-extrabold text-deepEmerald">{message}</p>
      {submessage ? (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-textSecondary">
          {submessage}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-full bg-emerald-gradient px-5 py-2 text-xs font-bold text-white shadow-clay hover:brightness-105 active:scale-95"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
