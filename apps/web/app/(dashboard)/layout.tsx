'use client';

import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AIChatWidget } from '@/components/ai/chat-widget';
import { CommandMenu } from '@/components/global-search';
import { BottomNav } from '@/components/mobile/bottom-nav';
import { MobileSidebar } from '@/components/mobile/mobile-sidebar';
import { GlobalWorkflowStepper } from '@/components/workflow/GlobalWorkflowStepper';
import { PlanningContextBar } from '@/components/layout/PlanningContextBar';
import { PlanningContextProvider } from '@/contexts/PlanningContext';
import { QuickPreviewProvider } from '@/components/preview';
import { NavigationProvider } from '@/components/navigation';
import { KeyboardShortcuts } from '@/components/keyboard';
import { useAlertNotifications } from '@/lib/hooks/use-alert-notifications';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Enable real-time alert notifications (check every 2 minutes)
  useAlertNotifications({
    enabled: true,
    pollInterval: 2 * 60 * 1000,
    showCriticalOnly: false,
  });

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSidebarCollapsed = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  return (
    <SessionProvider>
      <PlanningContextProvider>
        <NavigationProvider>
        <QuickPreviewProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex">
            <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebarCollapsed} />
          </div>

          {/* Mobile Sidebar (Sheet for tablet) */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>

          {/* Mobile Sidebar (Full menu from "More") */}
          <MobileSidebar
            open={moreMenuOpen}
            onClose={() => setMoreMenuOpen(false)}
          />

          {/* Main Content */}
          <div className={`flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'}`}>
            <Header onMenuClick={() => setSidebarOpen(true)} />
            {/* Global Workflow Stepper - UX-1 */}
            <GlobalWorkflowStepper />
            {/* Planning Context Bar - UX-2 */}
            <PlanningContextBar />
            <main className="flex-1 overflow-y-auto bg-muted/30 p-3 md:p-4 pb-20 md:pb-4">
              {children}
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNav onMoreClick={() => setMoreMenuOpen(true)} />

          {/* AI Chat Widget */}
          <AIChatWidget />

          {/* Global Search (Cmd+K) */}
          <CommandMenu />

          {/* Keyboard Shortcuts - UX-12 */}
          <KeyboardShortcuts />
        </div>
        </QuickPreviewProvider>
        </NavigationProvider>
      </PlanningContextProvider>
    </SessionProvider>
  );
}
