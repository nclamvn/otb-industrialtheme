'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Command, Search, Save, Undo, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  descriptionVi?: string;
  category: 'navigation' | 'editing' | 'actions' | 'search' | 'general';
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { keys: ['↑', '↓'], description: 'Navigate rows', descriptionVi: 'Di chuyển giữa các dòng', category: 'navigation' },
  { keys: ['←', '→'], description: 'Navigate columns', descriptionVi: 'Di chuyển giữa các cột', category: 'navigation' },
  { keys: ['Tab'], description: 'Next cell', descriptionVi: 'Ô tiếp theo', category: 'navigation' },
  { keys: ['Shift', 'Tab'], description: 'Previous cell', descriptionVi: 'Ô trước đó', category: 'navigation' },
  { keys: ['Home'], description: 'Go to first column', descriptionVi: 'Về cột đầu tiên', category: 'navigation' },
  { keys: ['End'], description: 'Go to last column', descriptionVi: 'Về cột cuối cùng', category: 'navigation' },

  // Search
  { keys: ['⌘', 'K'], description: 'Quick search', descriptionVi: 'Tìm kiếm nhanh', category: 'search' },
  { keys: ['⌘', 'F'], description: 'Find in page', descriptionVi: 'Tìm trong trang', category: 'search' },
  { keys: ['Esc'], description: 'Close search/dialog', descriptionVi: 'Đóng tìm kiếm/dialog', category: 'search' },

  // Editing
  { keys: ['Enter'], description: 'Edit cell / Confirm', descriptionVi: 'Sửa ô / Xác nhận', category: 'editing' },
  { keys: ['Esc'], description: 'Cancel editing', descriptionVi: 'Hủy chỉnh sửa', category: 'editing' },
  { keys: ['⌘', 'Z'], description: 'Undo', descriptionVi: 'Hoàn tác', category: 'editing' },
  { keys: ['⌘', 'Shift', 'Z'], description: 'Redo', descriptionVi: 'Làm lại', category: 'editing' },
  { keys: ['Delete'], description: 'Clear cell', descriptionVi: 'Xóa nội dung ô', category: 'editing' },

  // Actions
  { keys: ['⌘', 'S'], description: 'Save changes', descriptionVi: 'Lưu thay đổi', category: 'actions' },
  { keys: ['⌘', 'Enter'], description: 'Submit / Confirm', descriptionVi: 'Gửi / Xác nhận', category: 'actions' },
  { keys: ['⌘', 'N'], description: 'Create new', descriptionVi: 'Tạo mới', category: 'actions' },
  { keys: ['⌘', 'A'], description: 'Select all', descriptionVi: 'Chọn tất cả', category: 'actions' },
  { keys: ['Space'], description: 'Toggle selection', descriptionVi: 'Chọn/bỏ chọn', category: 'actions' },

  // General
  { keys: ['?'], description: 'Show shortcuts', descriptionVi: 'Hiện phím tắt', category: 'general' },
  { keys: ['⌘', '/'], description: 'Toggle sidebar', descriptionVi: 'Đóng/mở sidebar', category: 'general' },
];

interface KeyboardShortcutsHelpProps {
  shortcuts?: ShortcutItem[];
  locale?: 'en' | 'vi';
  triggerButton?: React.ReactNode;
  className?: string;
}

/**
 * KeyboardShortcutsHelp - Dialog showing available keyboard shortcuts
 */
export function KeyboardShortcutsHelp({
  shortcuts = DEFAULT_SHORTCUTS,
  locale = 'vi',
  triggerButton,
  className,
}: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for ? key to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = [
    { id: 'navigation', label: 'Navigation', labelVi: 'Di chuyển' },
    { id: 'search', label: 'Search', labelVi: 'Tìm kiếm' },
    { id: 'editing', label: 'Editing', labelVi: 'Chỉnh sửa' },
    { id: 'actions', label: 'Actions', labelVi: 'Thao tác' },
    { id: 'general', label: 'General', labelVi: 'Chung' },
  ];

  const getShortcutsByCategory = (categoryId: string) =>
    shortcuts.filter((s) => s.category === categoryId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
            <Keyboard className="h-4 w-4" />
            <span className="hidden sm:inline">
              {locale === 'vi' ? 'Phím tắt' : 'Shortcuts'}
            </span>
            <Badge variant="outline" className="text-[10px] px-1">?</Badge>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            {locale === 'vi' ? 'Phím tắt bàn phím' : 'Keyboard Shortcuts'}
          </DialogTitle>
          <DialogDescription>
            {locale === 'vi'
              ? 'Nhấn ? bất cứ lúc nào để mở hướng dẫn này'
              : 'Press ? anytime to open this guide'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {categories.map((category) => {
            const categoryShortcuts = getShortcutsByCategory(category.id);
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category.id}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {locale === 'vi' ? category.labelVi : category.label}
                </h4>
                <div className="grid gap-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm">
                        {locale === 'vi' && shortcut.descriptionVi
                          ? shortcut.descriptionVi
                          : shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <KeyBadge keyName={key} />
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <span>💡</span>
            {locale === 'vi'
              ? 'Trên Windows/Linux, thay ⌘ bằng Ctrl'
              : 'On Windows/Linux, use Ctrl instead of ⌘'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * KeyBadge - Styled keyboard key badge
 */
function KeyBadge({ keyName }: { keyName: string }) {
  const getKeyIcon = () => {
    switch (keyName) {
      case '⌘':
        return <Command className="w-3 h-3" />;
      case '↑':
        return <ArrowUp className="w-3 h-3" />;
      case '↓':
        return <ArrowDown className="w-3 h-3" />;
      case '←':
        return <ArrowLeft className="w-3 h-3" />;
      case '→':
        return <ArrowRight className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const icon = getKeyIcon();

  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border rounded shadow-sm">
      {icon || keyName}
    </kbd>
  );
}

/**
 * useKeyboardShortcut - Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
    ignoreInputs?: boolean;
  } = {}
) {
  const { enabled = true, preventDefault = true, ignoreInputs = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if typing in input
      if (ignoreInputs) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      // Check if all keys match
      const pressedKeys = new Set<string>();
      if (e.metaKey || e.ctrlKey) pressedKeys.add('⌘');
      if (e.shiftKey) pressedKeys.add('Shift');
      if (e.altKey) pressedKeys.add('Alt');
      pressedKeys.add(e.key.toUpperCase());

      const requiredKeys = new Set(keys.map((k) => k.toUpperCase()));

      if (
        pressedKeys.size === requiredKeys.size &&
        Array.from(pressedKeys).every((k) => requiredKeys.has(k))
      ) {
        if (preventDefault) e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback, enabled, preventDefault, ignoreInputs]);
}
