import { useTranslation } from 'react-i18next';
import { formatInr } from '../localization';
import { AppIcon } from '../lib/icons';
import Card from './Card';

export default function IncomeCard({ todayIncome, weekDelta = 0 }: { todayIncome: number; weekDelta?: number }) {
  const { t } = useTranslation();
  const up = weekDelta >= 0;

  return (
    <Card lifted variant="emerald">
      <p className="mb-1 text-base font-semibold leading-6 text-deepEmerald">{t('home.todayIncome')}</p>
      <p className="text-[44px] font-black leading-[54px] text-deepEmerald tracking-tight">
        {t('common.currency', { amount: formatInr(todayIncome) })}
      </p>
      <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md shadow-xs ${up ? 'bg-successSoft/90 border border-[#2E7D32]/40' : 'bg-dangerSoft/90 border border-danger/40'}`}>
        <AppIcon name={up ? 'trending-up' : 'trending-down'} size={16} className={up ? 'text-success' : 'text-danger'} />
        <span className={`text-sm font-bold ${up ? 'text-success' : 'text-danger'}`}>
          {t(up ? 'home.weekDeltaUp' : 'home.weekDeltaDown', { amount: formatInr(Math.abs(weekDelta)) })}
        </span>
      </div>
    </Card>
  );
}
