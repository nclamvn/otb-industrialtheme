'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  Building2,
  MapPin,
  ChevronDown,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface ContextItem {
  id: string;
  label: string;
  value: string;
  icon: 'calendar' | 'brand' | 'location';
  options?: { id: string; label: string }[];
}

interface DAFCContextBarProps {
  items: ContextItem[];
  showRefresh?: boolean;
  className?: string;
}

const iconMap = {
  calendar: Calendar,
  brand: Building2,
  location: MapPin,
};

const ContextSelector = ({
  item,
}: {
  item: ContextItem;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(item.value);
  const Icon = iconMap[item.icon];
  const hasOptions = item.options && item.options.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => hasOptions && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200',
          'bg-card border border-border hover:border-[hsl(30_43%_72%/0.5)]',
          hasOptions && 'cursor-pointer',
          isOpen && 'border-[hsl(30_43%_72%)] ring-2 ring-[hsl(30_43%_72%/0.2)]'
        )}
      >
        <Icon className="h-3.5 w-3.5 text-[hsl(30_43%_72%)]" />
        <div className="flex flex-col items-start">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
            {item.label}
          </span>
          <span className="text-xs font-semibold text-foreground -mt-0.5">
            {selectedValue}
          </span>
        </div>
        {hasOptions && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && hasOptions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] py-1 rounded-lg bg-card border border-border">
            {item.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSelectedValue(option.label);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-[hsl(30_43%_72%/0.1)]',
                  option.label === selectedValue && 'bg-[hsl(30_43%_72%/0.15)] text-[hsl(30_43%_72%)]'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return date.toLocaleDateString();
};

export function DAFCContextBar({
  items,
  showRefresh = true,
  className,
}: DAFCContextBarProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3 rounded-xl',
        'bg-[hsl(30_43%_72%/0.06)]',
        'border border-[hsl(30_43%_72%/0.2)]',
        className
      )}
    >
      {/* Left: Context selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(152_73%_27%)] animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[hsl(152_73%_27%)]">
            Live
          </span>
        </div>

        {items.map((item) => (
          <ContextSelector
            key={item.id}
            item={item}
          />
        ))}
      </div>

      {/* Right: Last updated & Refresh */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Updated {formatTimeAgo(lastUpdated)}</span>
        </div>

        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 rounded-full transition-all duration-200',
              'bg-[hsl(30_43%_72%/0.1)] hover:bg-[hsl(30_43%_72%/0.2)]',
              'text-[hsl(30_43%_72%)] hover:text-[hsl(30_40%_55%)]',
              isRefreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default DAFCContextBar;
