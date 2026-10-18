import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Legend } from 'recharts';
import { formatInr } from '../localization';

export interface DailyChartItem {
  dayKey: string;
  dayLabel?: string;
  date: string;
  income?: number;
  amount?: number; // fallback compatibility
  expense?: number;
  isToday?: boolean;
}

export default function IncomeChart({ days }: { days: DailyChartItem[] }) {
  const { t } = useTranslation();

  const data = days.map((day) => {
    const inc = day.income !== undefined ? day.income : day.amount || 0;
    const exp = day.expense || 0;
    return {
      name: day.dayKey ? t(day.dayKey) : day.dayLabel || 'Day',
      income: inc,
      expense: exp,
      date: day.date,
    };
  });

  const hasAnyData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasAnyData) {
    return (
      <div className="w-full py-8 text-center bg-surfaceAlt/50 rounded-2xl border border-dashed border-border/70">
        <p className="text-xs font-bold text-textMuted">
          {t('dhan.emptyChartHint') || 'No income or expense entries logged this week.'}
        </p>
        <p className="text-[11px] text-textSecondary mt-0.5">
          {t('dhan.emptyChartAction')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#4A423D', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(229, 149, 62, 0.12)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const inc = (payload.find((p) => p.dataKey === 'income')?.value as number) || 0;
                  const exp = (payload.find((p) => p.dataKey === 'expense')?.value as number) || 0;
                  return (
                    <div className="rounded-xl bg-[#1E2B3E] px-3 py-2 text-xs font-bold text-white shadow-lifted border border-[#E5953E]/40 space-y-0.5">
                      <div className="flex items-center justify-between gap-3 text-saffronGold">
                        <span>{t('transactions.typeIncome')}:</span>
                        <span>₹{formatInr(inc)}</span>
                      </div>
                      {exp > 0 && (
                        <div className="flex items-center justify-between gap-3 text-red-300">
                          <span>{t('transactions.typeExpense')}:</span>
                          <span>−₹{formatInr(exp)}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingBottom: 6 }}
              formatter={(value) => (value === 'income' ? t('transactions.typeIncome') : t('transactions.typeExpense'))}
            />
            <Bar dataKey="income" fill="#B34A26" radius={[6, 6, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" fill="#7C2D16" radius={[6, 6, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-between border-t border-border/40 pt-2 text-[10px] font-bold text-textMuted overflow-x-auto hide-scrollbar">
        {data.map((item) => (
          <span key={item.date} className="text-center min-w-[36px]">
            {item.income > 0 ? (
              <span className="text-deepEmerald font-black">₹{item.income}</span>
            ) : item.expense > 0 ? (
              <span className="text-danger font-semibold">−₹{item.expense}</span>
            ) : (
              '−'
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
