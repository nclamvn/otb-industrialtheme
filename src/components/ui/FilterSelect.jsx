'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function FilterSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchable = true,
  label,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = options.filter((opt) =>
    (opt.label || opt.value).toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = useCallback((opt) => {
    onChange?.(opt.value);
    setIsOpen(false);
    setSearch('');
    setFocusIndex(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusIndex >= 0 && filtered[focusIndex]) {
          handleSelect(filtered[focusIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  }, [isOpen, focusIndex, filtered, handleSelect]);

  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-xs font-medium mb-1 text-[#6B5E54]">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#C4975A]'}
          ${isOpen ? 'border-[#C4975A] ring-1 ring-[#C4975A]/20' : 'border-[#E8E2DB]'}
          bg-white text-[#2C2417]`}
      >
        <span className={selectedOption ? 'text-[#2C2417]' : 'text-[#8C8178]'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#8C8178] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#E8E2DB] bg-white shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-[#F0EBE5]">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#FAF8F5]">
                <Search size={14} className="text-[#8C8178]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setFocusIndex(-1); }}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-sm outline-none text-[#2C2417] placeholder:text-[#B0A89F]"
                />
              </div>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#8C8178]">No options found</div>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                    ${i === focusIndex ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'}
                    ${opt.value === value ? 'text-[#C4975A] font-medium' : 'text-[#2C2417]'}`}
                >
                  <span className="flex-1">{opt.label || opt.value}</span>
                  {opt.value === value && <Check size={14} className="text-[#C4975A]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
