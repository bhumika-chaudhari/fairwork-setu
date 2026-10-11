import { AppIcon } from '../lib/icons';

export default function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-12 items-center rounded-2xl border border-white/95 bg-white/90 px-3.5 shadow-glass backdrop-blur-md transition-all focus-within:border-primary/60 focus-within:bg-white focus-within:shadow-glassHover">
      <AppIcon name="search-outline" size={18} className="text-primary" />
      <input
        className="ml-2.5 w-full bg-transparent text-sm font-medium text-textPrimary outline-none placeholder:text-textMuted"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChangeText('')}
          className="text-textMuted hover:text-deepEmerald text-xs font-bold px-1"
        >
          ✕
        </button>
      )}
    </label>
  );
}
