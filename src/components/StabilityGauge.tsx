import { useTranslation } from 'react-i18next';

export default function StabilityGauge({ score }: { score: number }) {
  const { t } = useTranslation();
  const size = 86;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / 100, 0), 1);

  return (
    <div className="mr-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#FEF3C7" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F59E0B"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ * (1 - progress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-extrabold text-textPrimary">{score}</span>
          <span className="text-xs text-textMuted">{t('dhan.of100')}</span>
        </div>
      </div>
    </div>
  );
}
