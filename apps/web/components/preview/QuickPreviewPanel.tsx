'use client';

import React from 'react';
import { SlideOver, useSlideOver } from '@/components/ui/slide-over';
import { BudgetPreview, generateMockBudgetPreview } from './BudgetPreview';
import { OTBPreview, generateMockOTBPreview } from './OTBPreview';
import { SKUPreview, generateMockSKUPreview } from './SKUPreview';

type PreviewType = 'budget' | 'otb' | 'sku';

interface QuickPreviewPanelProps {
  type: PreviewType;
  entityId: string;
  open: boolean;
  onClose: () => void;
  onViewDetails?: () => void;
}

export function QuickPreviewPanel({
  type,
  entityId,
  open,
  onClose,
  onViewDetails,
}: QuickPreviewPanelProps) {
  // In real implementation, fetch data based on type and entityId
  // For now, use mock data
  const getTitle = () => {
    switch (type) {
      case 'budget': return 'Budget Preview';
      case 'otb': return 'OTB Plan Preview';
      case 'sku': return 'SKU Preview';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'budget': return 'Quick view of budget allocation and utilization';
      case 'otb': return 'Quick view of OTB plan summary and allocations';
      case 'sku': return 'Quick view of SKU details and performance';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'budget':
        return (
          <BudgetPreview
            {...generateMockBudgetPreview()}
            onViewDetails={onViewDetails}
          />
        );
      case 'otb':
        return (
          <OTBPreview
            {...generateMockOTBPreview()}
            onViewDetails={onViewDetails}
          />
        );
      case 'sku':
        return (
          <SKUPreview
            {...generateMockSKUPreview()}
            onViewDetails={onViewDetails}
          />
        );
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={getTitle()}
      description={getDescription()}
      width="md"
    >
      {renderContent()}
    </SlideOver>
  );
}

// Context for managing quick preview state across the app
interface QuickPreviewContextValue {
  openPreview: (type: PreviewType, entityId: string) => void;
  closePreview: () => void;
  isOpen: boolean;
  currentType: PreviewType | null;
  currentEntityId: string | null;
}

const QuickPreviewContext = React.createContext<QuickPreviewContextValue | null>(null);

export function QuickPreviewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentType, setCurrentType] = React.useState<PreviewType | null>(null);
  const [currentEntityId, setCurrentEntityId] = React.useState<string | null>(null);

  const openPreview = React.useCallback((type: PreviewType, entityId: string) => {
    setCurrentType(type);
    setCurrentEntityId(entityId);
    setIsOpen(true);
  }, []);

  const closePreview = React.useCallback(() => {
    setIsOpen(false);
    // Delay clearing type/id to allow close animation
    setTimeout(() => {
      setCurrentType(null);
      setCurrentEntityId(null);
    }, 300);
  }, []);

  return (
    <QuickPreviewContext.Provider
      value={{ openPreview, closePreview, isOpen, currentType, currentEntityId }}
    >
      {children}
      {currentType && currentEntityId && (
        <QuickPreviewPanel
          type={currentType}
          entityId={currentEntityId}
          open={isOpen}
          onClose={closePreview}
        />
      )}
    </QuickPreviewContext.Provider>
  );
}

export function useQuickPreview() {
  const context = React.useContext(QuickPreviewContext);
  if (!context) {
    throw new Error('useQuickPreview must be used within a QuickPreviewProvider');
  }
  return context;
}

// Convenience button component for triggering previews
interface PreviewTriggerButtonProps {
  type: PreviewType;
  entityId: string;
  children: React.ReactNode;
  className?: string;
}

export function PreviewTriggerButton({
  type,
  entityId,
  children,
  className,
}: PreviewTriggerButtonProps) {
  const { openPreview } = useQuickPreview();

  return (
    <button
      type="button"
      onClick={() => openPreview(type, entityId)}
      className={className}
    >
      {children}
    </button>
  );
}
