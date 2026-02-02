'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Keyboard, Command, Search, Plus, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'editing';
  action?: () => void;
  global?: boolean;
}

interface KeyboardShortcutsProps {
  onSearch?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  children?: React.ReactNode;
}

// Platform detection
const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';

export function KeyboardShortcuts({
  onSearch,
  onNew,
  onSave,
  children,
}: KeyboardShortcutsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  // Get context-aware new item URL
  const getNewItemUrl = useCallback(() => {
    if (pathname?.includes('/budgets')) return '/budgets/new';
    if (pathname?.includes('/otb-analysis')) return '/otb-analysis/new';
    if (pathname?.includes('/sku-proposals')) return '/sku-proposals/new';
    return null;
  }, [pathname]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModKey = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Help dialog: Cmd/Ctrl + /
      if (isModKey && e.key === '/') {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Don't trigger shortcuts when typing in inputs (except for global ones)
      if (isInputFocused && !e.key.startsWith('Escape')) {
        return;
      }

      // Global search: Cmd/Ctrl + K
      if (isModKey && e.key === 'k') {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        }
        return;
      }

      // New item: Cmd/Ctrl + N (context-aware)
      if (isModKey && e.key === 'n') {
        e.preventDefault();
        if (onNew) {
          onNew();
        } else {
          const newUrl = getNewItemUrl();
          if (newUrl) {
            router.push(newUrl);
          }
        }
        return;
      }

      // Save: Cmd/Ctrl + S
      if (isModKey && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
        return;
      }

      // Close modal / Cancel: Escape
      if (e.key === 'Escape') {
        setHelpOpen(false);
        return;
      }

      // Quick navigation with G key followed by another key
      if (!isModKey && e.key === 'g') {
        // Listen for the next key
        const handleNextKey = (nextEvent: KeyboardEvent) => {
          switch (nextEvent.key) {
            case 'd':
              router.push('/');
              break;
            case 'b':
              router.push('/budgets');
              break;
            case 'o':
              router.push('/otb-analysis');
              break;
            case 's':
              router.push('/sku-proposals');
              break;
            case 'a':
              router.push('/approvals');
              break;
            case 'n':
              router.push('/notifications');
              break;
          }
          document.removeEventListener('keydown', handleNextKey);
        };

        // Wait for next key (with timeout)
        document.addEventListener('keydown', handleNextKey, { once: true });
        setTimeout(() => {
          document.removeEventListener('keydown', handleNextKey);
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname, onSearch, onNew, onSave, getNewItemUrl]);

  const shortcuts: Shortcut[] = [
    // Navigation
    { keys: ['g', 'd'], description: 'Go to Dashboard', category: 'navigation' },
    { keys: ['g', 'b'], description: 'Go to Budgets', category: 'navigation' },
    { keys: ['g', 'o'], description: 'Go to OTB Analysis', category: 'navigation' },
    { keys: ['g', 's'], description: 'Go to SKU Proposals', category: 'navigation' },
    { keys: ['g', 'a'], description: 'Go to Approvals', category: 'navigation' },
    // Actions
    { keys: [modKey, 'K'], description: 'Global Search', category: 'actions', global: true },
    { keys: [modKey, 'N'], description: 'New Item (context-aware)', category: 'actions' },
    { keys: [modKey, 'S'], description: 'Save Current', category: 'actions' },
    { keys: [modKey, '/'], description: 'Show Keyboard Shortcuts', category: 'actions', global: true },
    // Editing
    { keys: ['Enter'], description: 'Save Edit', category: 'editing' },
    { keys: ['Escape'], description: 'Cancel Edit / Close Modal', category: 'editing' },
    { keys: ['↑', '↓'], description: 'Navigate List Items', category: 'editing' },
    { keys: ['Tab'], description: 'Next Field', category: 'editing' },
  ];

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    editing: 'Editing',
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {children}

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-[#127749]" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate and work faster
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryLabels[category]}
                </h4>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            {keyIdx > 0 && (
                              <span className="text-xs text-muted-foreground mx-0.5">then</span>
                            )}
                            <kbd
                              className={cn(
                                'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
                                'text-xs font-mono font-medium',
                                'bg-muted border border-border rounded',
                                'text-muted-foreground'
                              )}
                            >
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">{modKey} + /</kbd> anytime to show this help
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook for using keyboard shortcuts in components
export function useKeyboardShortcut(
  keys: string | string[],
  callback: () => void,
  options: {
    enableOnInputs?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const { enableOnInputs = false, preventDefault = true } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused && !enableOnInputs) {
        return;
      }

      const keysArray = Array.isArray(keys) ? keys : [keys];
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModKey = isMac ? e.metaKey : e.ctrlKey;

      const keyMatches = keysArray.every((key) => {
        if (key === 'mod' || key === 'cmd' || key === 'ctrl') {
          return isModKey;
        }
        if (key === 'shift') {
          return e.shiftKey;
        }
        if (key === 'alt') {
          return e.altKey;
        }
        return e.key.toLowerCase() === key.toLowerCase();
      });

      if (keyMatches) {
        if (preventDefault) {
          e.preventDefault();
        }
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback, enableOnInputs, preventDefault]);
}

// Keyboard shortcut hint component
export function ShortcutHint({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-muted-foreground">+</span>}
          <kbd
            className={cn(
              'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
              'text-[10px] font-mono',
              'bg-muted border border-border rounded',
              'text-muted-foreground'
            )}
          >
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
