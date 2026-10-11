import { useTranslation } from 'react-i18next';
import { formatInr } from '../localization';
import Card from './Card';
import ProgressRing from './ProgressRing';

export default function SavingsProgressCard({
  target,
  saved,
  suggestion,
  title,
}: {
  target: number;
  saved: number;
  suggestion?: number;
  title?: string;
}) {
  const { t } = useTranslation();
  const progress = target > 0 ? Math.min(saved / target, 1) : 0;
  const remaining = Math.max(target - saved, 0);

  return (
    <Card variant="accent" lifted>
      <div className="flex items-center gap-4">
        <ProgressRing progress={progress} />
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-textSecondary">{title ?? t('home.emergencySavings')}</p>
          <p className="text-lg font-bold leading-7 text-textPrimary">
            {t('common.currency', { amount: formatInr(saved) })} / {t('common.currency', { amount: formatInr(target) })}
          </p>
          <p className="mt-2 text-sm font-semibold text-warning">
            {suggestion
              ? t('home.savingsSuggestion', { amount: formatInr(suggestion) })
              : t('dhan.remaining', { amount: formatInr(remaining) })}
          </p>
        </div>
      </div>
    </Card>
  );
}
