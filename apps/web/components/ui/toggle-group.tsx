'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Toggle Group Context ───────────────────────────────────────────────────────
const ToggleGroupContext = React.createContext<{
  value: string | undefined;
  onValueChange: (value: string) => void;
}>({
  value: undefined,
  onValueChange: () => {},
});

// ─── Toggle Group Props ─────────────────────────────────────────────────────────
interface ToggleGroupProps {
  type: 'single' | 'multiple';
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

// ─── Toggle Group Component ─────────────────────────────────────────────────────
const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ type, value, defaultValue, onValueChange, children, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const currentValue = value ?? internalValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [value, onValueChange]
    );

    return (
      <ToggleGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          role="group"
          className={cn('flex items-center justify-center gap-1', className)}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroup.displayName = 'ToggleGroup';

// ─── Toggle Group Item Props ────────────────────────────────────────────────────
interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

// ─── Toggle Group Item Component ────────────────────────────────────────────────
const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isActive}
        data-state={isActive ? 'on' : 'off'}
        onClick={() => context.onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 h-9 text-sm font-medium ring-offset-background transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'hover:bg-muted hover:text-muted-foreground',
          isActive && 'bg-accent text-accent-foreground',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
