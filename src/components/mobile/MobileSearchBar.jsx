'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MobileSearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder,
  autoFocus = false,
}) {
  const { t } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onChange?.('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit?.(value);
    inputRef.current?.blur();
  }, [onSubmit, value]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors
          ${isFocused ? 'border-[#C4975A] ring-1 ring-[#C4975A]/20 bg-white' : 'border-[#E8E2DB] bg-[#FAF8F5]'}`}
      >
        <Search size={18} className="flex-shrink-0 text-[#8C8178]" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || t('common.search') || 'Search...'}
          className="flex-1 bg-transparent text-sm outline-none text-[#2C2417] placeholder:text-[#B0A89F]"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 p-1 rounded-full hover:bg-[#F0EBE5]"
          >
            <X size={14} className="text-[#8C8178]" />
          </button>
        )}
      </div>
    </form>
  );
}
