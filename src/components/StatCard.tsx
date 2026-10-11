export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex-1 text-center">
      <p className="text-base font-extrabold text-textPrimary">{value}</p>
      <p className="mt-0.5 text-xs text-textSecondary">{label}</p>
    </div>
  );
}
