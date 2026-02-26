'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { useBudget, usePlanning, useIsMobile } from '@/hooks';
import { getScreenIdFromPathname } from '@/utils/routeMap';
import AuthGuard from '@/components/AuthGuard';
import { Sidebar } from '@/components/Layout';
import AppHeader from '@/components/Layout/AppHeader';
import MobileBottomNav from '@/components/Layout/MobileBottomNav';
import { BudgetModal } from '@/components/Common';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode, kpiData } = useAppContext();
  const { isMobile } = useIsMobile();

  const currentScreen = getScreenIdFromPathname(pathname);

  const {
    selectedYear,
    showBudgetForm,
    selectedCell,
    budgetFormData,
    setBudgetFormData,
    handleStoreAllocationChange,
    calculateTotalBudget,
    handleSaveBudget,
    closeBudgetForm,
  } = useBudget();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAF8F5] flex transition-colors duration-normal">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar
            currentScreen={currentScreen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            user={user}
            onLogout={logout}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden text-[#2C2417]">
          <AppHeader
            currentScreen={currentScreen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            kpiData={kpiData}
            isMobile={isMobile}
            user={user}
            onLogout={logout}
          />

          <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3 pb-[80px]' : 'p-6'}`}>
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <MobileBottomNav
            currentScreen={currentScreen}
            darkMode={darkMode}
          />
        )}

        {showBudgetForm && selectedCell && (
          <BudgetModal
            selectedCell={selectedCell}
            selectedYear={selectedYear}
            budgetFormData={budgetFormData}
            setBudgetFormData={setBudgetFormData}
            onClose={closeBudgetForm}
            onSave={handleSaveBudget}
            calculateTotalBudget={calculateTotalBudget}
            handleStoreAllocationChange={handleStoreAllocationChange}
            darkMode={darkMode}
          />
        )}
      </div>
    </AuthGuard>
  );
}
