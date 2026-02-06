'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useResponsive';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface MobilePageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: React.ReactNode;
  bottomNav?: boolean;
  className?: string;
}

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function MobilePageWrapper({
  children,
  title,
  subtitle,
  showBackButton = true,
  onBack,
  headerActions,
  bottomNav = true,
  className,
}: MobilePageWrapperProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Only apply mobile wrapper on mobile devices
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={cn('min-h-screen flex flex-col bg-background', className)}>
      {/* Mobile Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border safe-area-pt">
          <div className="flex items-center h-14 px-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2 -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>

            {headerActions && <div className="flex items-center gap-1">{headerActions}</div>}
          </div>
        </header>
      )}

      {/* Page Content */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('flex-1', bottomNav && 'pb-20')}
      >
        {children}
      </motion.main>
    </div>
  );
}

export default MobilePageWrapper;
export type { MobilePageWrapperProps };
