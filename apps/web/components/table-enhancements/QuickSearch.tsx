'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  X,
  ChevronDown,
  Clock,
  ArrowRight,
  Keyboard,
  Sparkles,
} from 'lucide-react';

interface SearchSuggestion {
  type: 'recent' | 'suggested' | 'field';
  value: string;
  label: string;
  field?: string;
  count?: number;
}

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  searchFields?: { id: string; label: string; labelVi?: string }[];
  recentSearches?: string[];
  suggestions?: SearchSuggestion[];
  onFieldSearch?: (field: string, value: string) => void;
  showKeyboardHint?: boolean;
  debounceMs?: number;
  className?: string;
}

/**
 * QuickSearch - Advanced search input with suggestions and field-specific search
 */
export function QuickSearch({
  value,
  onChange,
  onSearch,
  placeholder = 'Tìm kiếm...',
  searchFields = [],
  recentSearches = [],
  suggestions = [],
  onFieldSearch,
  showKeyboardHint = true,
  debounceMs = 300,
  className,
}: QuickSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Handle search submit
  const handleSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (selectedField && onFieldSearch) {
      onFieldSearch(selectedField, localValue);
    } else if (onSearch) {
      onSearch(localValue);
    }

    onChange(localValue);
    setIsOpen(false);
  }, [localValue, selectedField, onChange, onSearch, onFieldSearch]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    setSelectedField(null);
    inputRef.current?.focus();
  }, [onChange]);

  // Select a suggestion
  const handleSelectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.field) {
        setSelectedField(suggestion.field);
        setLocalValue(suggestion.value);
      } else {
        setLocalValue(suggestion.value);
        onChange(suggestion.value);
        onSearch?.(suggestion.value);
      }
      setIsOpen(false);
    },
    [onChange, onSearch]
  );

  // Parse field:value syntax
  const parsedSearch = useMemo(() => {
    const match = localValue.match(/^(\w+):(.*)$/);
    if (match) {
      const field = searchFields.find(
        (f) => f.id.toLowerCase() === match[1].toLowerCase()
      );
      if (field) {
        return { field: field.id, value: match[2] };
      }
    }
    return null;
  }, [localValue, searchFields]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative flex items-center', className)}>
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
              if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder={placeholder}
            className={cn(
              'pl-9 pr-20',
              selectedField && 'pl-24'
            )}
          />

          {/* Selected Field Badge */}
          {selectedField && (
            <Badge
              variant="secondary"
              className="absolute left-9 text-[10px] h-5"
            >
              {searchFields.find((f) => f.id === selectedField)?.labelVi ||
                selectedField}
            </Badge>
          )}

          {/* Actions */}
          <div className="absolute right-2 flex items-center gap-1">
            {localValue && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {showKeyboardHint && !localValue && (
              <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                <Keyboard className="h-3 w-3 mr-0.5" />
                ⌘K
              </Badge>
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {/* Field Search Options */}
            {searchFields.length > 0 && localValue && !parsedSearch && (
              <>
                <CommandGroup heading="Tìm theo trường">
                  {searchFields.slice(0, 4).map((field) => (
                    <CommandItem
                      key={field.id}
                      onSelect={() => {
                        setSelectedField(field.id);
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="text-muted-foreground mr-2">
                        {field.labelVi || field.label}:
                      </span>
                      <span>{localValue}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !localValue && (
              <>
                <CommandGroup heading="Tìm kiếm gần đây">
                  {recentSearches.slice(0, 5).map((search, i) => (
                    <CommandItem
                      key={i}
                      onSelect={() =>
                        handleSelectSuggestion({
                          type: 'recent',
                          value: search,
                          label: search,
                        })
                      }
                    >
                      <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {search}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <CommandGroup heading="Gợi ý">
                {suggestions.slice(0, 5).map((suggestion, i) => (
                  <CommandItem
                    key={i}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span>{suggestion.label}</span>
                    {suggestion.count !== undefined && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[10px]"
                      >
                        {suggestion.count}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search Tips */}
            {!localValue && searchFields.length > 0 && (
              <CommandGroup heading="Mẹo tìm kiếm">
                <div className="px-2 py-1.5 text-xs text-muted-foreground space-y-1">
                  <p>Nhập <code className="bg-muted px-1 rounded">field:value</code> để tìm theo trường cụ thể</p>
                  <p>VD: <code className="bg-muted px-1 rounded">sku:ABC123</code></p>
                </div>
              </CommandGroup>
            )}

            <CommandEmpty>Không có gợi ý</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * useQuickSearch - Hook for managing quick search state
 */
export function useQuickSearch<T>(
  data: T[],
  options: {
    searchFields: (keyof T)[];
    caseSensitive?: boolean;
    maxRecentSearches?: number;
    storageKey?: string;
  }
) {
  const [searchValue, setSearchValue] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (options.storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(options.storageKey);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data;

    const query = options.caseSensitive
      ? searchValue.trim()
      : searchValue.trim().toLowerCase();

    return data.filter((item) =>
      options.searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        const strValue = options.caseSensitive
          ? String(value)
          : String(value).toLowerCase();
        return strValue.includes(query);
      })
    );
  }, [data, searchValue, options.searchFields, options.caseSensitive]);

  // Add to recent searches
  const addRecentSearch = useCallback(
    (value: string) => {
      if (!value.trim()) return;

      const maxRecent = options.maxRecentSearches || 10;
      const updated = [
        value,
        ...recentSearches.filter((s) => s !== value),
      ].slice(0, maxRecent);

      setRecentSearches(updated);

      if (options.storageKey) {
        localStorage.setItem(options.storageKey, JSON.stringify(updated));
      }
    },
    [recentSearches, options.maxRecentSearches, options.storageKey]
  );

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (value.trim()) {
        addRecentSearch(value.trim());
      }
    },
    [addRecentSearch]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('');
  }, []);

  return {
    searchValue,
    setSearchValue,
    handleSearch,
    clearSearch,
    recentSearches,
    filteredData,
    resultCount: filteredData.length,
    totalCount: data.length,
  };
}
