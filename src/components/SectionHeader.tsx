export default function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-2.5 mt-3 flex items-center justify-between">
      <h2 className="text-sm md:text-base font-extrabold text-deepEmerald">{title}</h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-bold text-primaryTeal hover:underline"
        >
          {actionLabel} →
        </button>
      ) : null}
    </div>
  );
}
