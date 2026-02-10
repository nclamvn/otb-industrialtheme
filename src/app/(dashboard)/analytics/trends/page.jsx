'use client';
import { useAppContext } from '@/contexts/AppContext';
import CategoryTrendsScreen from '@/screens/CategoryTrendsScreen';

export default function CategoryTrendsPage() {
  const { darkMode } = useAppContext();
  return <CategoryTrendsScreen darkMode={darkMode} />;
}
