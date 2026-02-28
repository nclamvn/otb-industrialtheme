'use client';
import { useRef } from 'react';
import { X } from 'lucide-react';

export default function FilterChips({ filters = [], activeFilters = {}, onToggle, onClear }) {
  const scrollRef = useRef(null);

  const hasActive = Object.values(activeFilters).some(Boolean);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {hasActive && (
          <button
            onClick={onClear}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              border border-[#DC3545] text-[#DC3545] bg-[#FEF2F2]"
          >
            <X size={12} />
            Clear
          </button>
        )}
        {filters.map((filter) => {
          const isActive = activeFilters[filter.key];
          return (
            <button
              key={filter.key}
              onClick={() => onToggle?.(filter.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                ${isActive
                  ? 'border-[#C4975A] bg-[#C4975A] text-white'
                  : 'border-[#E8E2DB] bg-white text-[#6B5E54] hover:border-[#C4975A]'
                }`}
            >
              {filter.icon && <filter.icon size={12} />}
              <span>{filter.label}</span>
              {isActive && filter.count != null && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] bg-white/20">
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
