export default function ProgressBar({
  progress,
  color = '#16A34A',
  trackColor = '#DCFCE7',
  height = 10,
}: {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ backgroundColor: trackColor, height }}>
      <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
    </div>
  );
}
