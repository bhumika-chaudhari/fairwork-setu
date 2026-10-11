export default function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  error,
  type = 'text',
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  type?: 'text' | 'numeric' | 'tel';
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-base font-semibold leading-6 text-textPrimary">{label}</span>
      <input
        className="min-h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-base text-textPrimary outline-none"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        inputMode={type === 'numeric' ? 'numeric' : type === 'tel' ? 'tel' : 'text'}
        aria-label={label}
      />
      <span className="mt-2 block text-sm leading-[22px] text-textSecondary">{error ?? hint}</span>
    </label>
  );
}
