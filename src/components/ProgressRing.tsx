export default function ProgressRing({
  progress,
  size = 88,
  stroke = 9,
  color = '#087F73',
  trackColor = '#E6F7F2',
  label,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - clamped)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-black text-deepEmerald"
          style={{ fontSize: Math.max(size * 0.22, 10) }}
        >
          {label ?? `${Math.round(clamped * 100)}%`}
        </span>
      </div>
    </div>
  );
}
