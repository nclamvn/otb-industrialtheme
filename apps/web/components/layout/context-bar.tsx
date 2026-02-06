'use client';

import { cn } from '@/lib/utils';
import { RefreshCw, Download } from 'lucide-react';

interface ContextBarProps {
  brands: { id: string; name: string }[];
  seasons: { id: string; name: string }[];
  selectedBrand: string;
  selectedSeason: string;
  onBrandChange: (value: string) => void;
  onSeasonChange: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  extra?: React.ReactNode;
  className?: string;
}

export function ContextBar({
  brands,
  seasons,
  selectedBrand,
  selectedSeason,
  onBrandChange,
  onSeasonChange,
  onRefresh,
  onExport,
  isLoading,
  extra,
  className,
}: ContextBarProps) {
  return (
    <div
      className={cn(
        'h-header bg-surface border-b border-border flex items-center justify-between px-4',
        className
      )}
    >
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="ind-select ind-input-sm w-[160px]"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSeason}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="ind-select ind-input-sm w-[140px]"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {extra}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            className="ind-btn ind-btn-ghost ind-btn-sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
        )}
        {onExport && (
          <button className="ind-btn ind-btn-ghost ind-btn-sm" onClick={onExport}>
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
