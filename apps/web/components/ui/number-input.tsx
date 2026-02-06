'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  /** Allow decimal values (default: true) */
  allowDecimals?: boolean;
  /** Number of decimal places (default: 2) */
  decimalPlaces?: number;
  /** Allow negative values (default: false) */
  allowNegative?: boolean;
  /** Prefix to show (e.g., "$") */
  prefix?: string;
  /** Suffix to show (e.g., "%") */
  suffix?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
}

/**
 * NumberInput component that prevents leading zeros and handles number formatting.
 * Use this instead of <Input type="number"> for better UX.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      allowDecimals = true,
      decimalPlaces = 2,
      allowNegative = false,
      prefix,
      suffix,
      min,
      max,
      className,
      placeholder = '0',
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');

    // Sync display value with controlled value
    React.useEffect(() => {
      if (value === undefined || value === null || value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(String(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty value
      if (inputValue === '') {
        setDisplayValue('');
        onChange(undefined);
        return;
      }

      // Build regex pattern based on options
      let pattern = allowDecimals ? /[^\d.-]/g : /[^\d-]/g;
      if (!allowNegative) {
        pattern = allowDecimals ? /[^\d.]/g : /[^\d]/g;
      }

      // Remove invalid characters
      let cleaned = inputValue.replace(pattern, '');

      // Handle negative sign - only allow at start
      if (allowNegative && cleaned.includes('-')) {
        const isNegative = cleaned.startsWith('-');
        cleaned = cleaned.replace(/-/g, '');
        if (isNegative) cleaned = '-' + cleaned;
      }

      // Handle multiple decimal points - keep only first
      if (allowDecimals) {
        const parts = cleaned.split('.');
        if (parts.length > 2) {
          cleaned = parts[0] + '.' + parts.slice(1).join('');
        }
      }

      // Remove leading zeros (but keep "0." for decimals)
      if (cleaned.length > 1) {
        const isNegative = cleaned.startsWith('-');
        let numPart = isNegative ? cleaned.slice(1) : cleaned;

        // Remove leading zeros except for "0." pattern
        if (!numPart.startsWith('0.')) {
          numPart = numPart.replace(/^0+(\d)/, '$1');
        }

        cleaned = isNegative ? '-' + numPart : numPart;
      }

      // Limit decimal places
      if (allowDecimals && cleaned.includes('.')) {
        const [intPart, decPart] = cleaned.split('.');
        if (decPart && decPart.length > decimalPlaces) {
          cleaned = intPart + '.' + decPart.slice(0, decimalPlaces);
        }
      }

      setDisplayValue(cleaned);

      // Parse and validate the number
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) {
        onChange(undefined);
        return;
      }

      // Apply min/max constraints
      let finalValue = parsed;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;

      onChange(finalValue);
    };

    const handleBlur = () => {
      // Format on blur
      if (value !== undefined && value !== null) {
        if (allowDecimals) {
          setDisplayValue(String(value));
        } else {
          setDisplayValue(String(Math.round(value)));
        }
      }
    };

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode={allowDecimals ? 'decimal' : 'numeric'}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            prefix && 'pl-7',
            suffix && 'pr-7',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

/**
 * CurrencyInput - A NumberInput pre-configured for currency values.
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<NumberInputProps, 'prefix' | 'allowDecimals' | 'decimalPlaces'> & { currency?: string }>(
  ({ currency = '$', ...props }, ref) => {
    return (
      <NumberInput
        ref={ref}
        prefix={currency}
        allowDecimals={true}
        decimalPlaces={2}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

/**
 * PercentInput - A NumberInput pre-configured for percentage values.
 */
export const PercentInput = React.forwardRef<HTMLInputElement, Omit<NumberInputProps, 'suffix' | 'min' | 'max'>>(
  (props, ref) => {
    return (
      <NumberInput
        ref={ref}
        suffix="%"
        min={0}
        max={100}
        allowDecimals={true}
        decimalPlaces={2}
        {...props}
      />
    );
  }
);

PercentInput.displayName = 'PercentInput';

/**
 * IntegerInput - A NumberInput for whole numbers only.
 */
export const IntegerInput = React.forwardRef<HTMLInputElement, Omit<NumberInputProps, 'allowDecimals' | 'decimalPlaces'>>(
  (props, ref) => {
    return (
      <NumberInput
        ref={ref}
        allowDecimals={false}
        {...props}
      />
    );
  }
);

IntegerInput.displayName = 'IntegerInput';
