'use client';

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchTriggerProps {
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  showShortcut?: boolean;
}

export function SearchTrigger({
  onClick,
  className,
  variant = 'outline',
  showShortcut = true,
}: SearchTriggerProps) {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <Button
      variant={variant}
      className={cn(
        'relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 md:w-80',
        className
      )}
      onClick={onClick}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">Search...</span>
      <span className="inline-flex lg:hidden">Search</span>
      {showShortcut && (
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">{shortcutKey}</span>K
        </kbd>
      )}
    </Button>
  );
}
