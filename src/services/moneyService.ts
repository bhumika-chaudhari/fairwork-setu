import {
  emergencySaved,
  emergencyTarget,
  expenseCategories,
  recentExpensesList,
  nextWeekMax,
  nextWeekMin,
  stabilityScore,
  todayIncome,
  todaySaveSuggestion,
  voiceExpense,
  voiceIncome,
  weekIncomeDelta,
  weeklyIncome,
  weeklySavingsSaved,
  weeklySavingsTarget,
} from '../data/mockData';

export async function getMoneyOverview() {
  const totalWeekly = weeklyIncome.reduce((sum, d) => sum + d.amount, 0);
  const avgDaily = Math.round(totalWeekly / weeklyIncome.length);

  return {
    weeklyIncome,
    totalWeeklyIncome: totalWeekly,
    avgDailyIncome: avgDaily,
    expenseCategories,
    recentExpenses: recentExpensesList,
    todayIncome,
    weekIncomeDelta,
    emergencySaved,
    emergencyTarget,
    todaySaveSuggestion,
    weeklySavingsSaved,
    weeklySavingsTarget,
    nextWeekMin,
    nextWeekMax,
    stabilityScore,
    voiceIncome,
    voiceExpense,
  };
}
