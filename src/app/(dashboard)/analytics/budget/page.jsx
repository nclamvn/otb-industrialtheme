'use client';
import { useAppContext } from '@/contexts/AppContext';
import BudgetAnalyticsScreen from '@/screens/BudgetAnalyticsScreen';

export default function BudgetAnalyticsPage() {
  const { darkMode } = useAppContext();
  return <BudgetAnalyticsScreen darkMode={darkMode} />;
}
