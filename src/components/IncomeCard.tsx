import { useTranslation } from 'react-i18next';
import { formatInr } from '../localization';
import { AppIcon } from '../lib/icons';
import Card from './Card';

export default function IncomeCard({ todayIncome, weekDelta = 0 }: { todayIncome: number; weekDelta?: number }) {
  const { t } = useTranslation();
  const up = weekDelta >= 0;

  return (
    <Card lifted className="border-primarySoft bg-primarySoft">
      <p className="mb-1 text-base font-medium leading-6 text-primaryDark">{t('home.todayIncome')}</p>
      <p className="text-[44px] font-extrabold leading-[60px] text-primaryDark">
        {t('common.currency', { amount: formatInr(todayIncome) })}
      </p>
      <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 ${up ? 'bg-successSoft' : 'bg-dangerSoft'}`}>
        <AppIcon name={up ? 'trending-up' : 'trending-down'} size={16} className={up ? 'text-success' : 'text-danger'} />
        <span className={`text-sm font-semibold ${up ? 'text-success' : 'text-danger'}`}>
          {t(up ? 'home.weekDeltaUp' : 'home.weekDeltaDown', { amount: formatInr(Math.abs(weekDelta)) })}
        </span>
      </div>
    </Card>
  );
}
