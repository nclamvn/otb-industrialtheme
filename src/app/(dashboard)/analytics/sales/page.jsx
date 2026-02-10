'use client';
import { useAppContext } from '@/contexts/AppContext';
import SalesPerformanceScreen from '@/screens/SalesPerformanceScreen';

export default function SalesPerformancePage() {
  const { darkMode } = useAppContext();
  return <SalesPerformanceScreen darkMode={darkMode} />;
}
