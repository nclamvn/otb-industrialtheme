'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Check, X } from 'lucide-react';

export default function CreatableSelect({
  options: initialOptions = [],
  value,
  onChange,
  onCreateOption,
  placeholder = 'Select or create...',
  label,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => setOptions(initialOptions), [initialOptions]);

  const filtered = options.filter((opt) =>
    (opt.label || opt.value).toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = search.trim() && !options.some(
    (o) => (o.label || o.value).toLowerCase() === search.toLowerCase()
  );

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = useCallback((opt) => {
    onChange?.(opt.value);
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  const handleCreate = useCallback(() => {
    const newOpt = { value: search.trim(), label: search.trim() };
    setOptions((prev) => [...prev, newOpt]);
    onCreateOption?.(newOpt);
    onChange?.(newOpt.value);
    setIsOpen(false);
    setSearch('');
  }, [search, onChange, onCreateOption]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    onChange?.(null);
  }, [onChange]);

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

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
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
        <div className="flex items-center gap-1">
          {value && (
            <span onClick={handleClear} className="p-0.5 rounded hover:bg-[#F0EBE5]">
              <X size={12} className="text-[#8C8178]" />
            </span>
          )}
          <ChevronDown size={14} className={`text-[#8C8178] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#E8E2DB] bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#F0EBE5]">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreate) handleCreate();
              }}
              placeholder="Type to search or create..."
              className="w-full px-2 py-1.5 rounded-md bg-[#FAF8F5] text-sm outline-none text-[#2C2417] placeholder:text-[#B0A89F]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[#FAF8F5]
                  ${opt.value === value ? 'text-[#C4975A] font-medium' : 'text-[#2C2417]'}`}
              >
                <span className="flex-1">{opt.label || opt.value}</span>
                {opt.value === value && <Check size={14} className="text-[#C4975A]" />}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[#1B6B45] font-medium hover:bg-[#F0FAF5] transition-colors"
              >
                <Plus size={14} />
                <span>Create &quot;{search.trim()}&quot;</span>
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <div className="px-3 py-2 text-sm text-[#8C8178]">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
