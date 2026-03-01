'use client';
import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useURLFilters(defaultFilters = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const result = { ...defaultFilters };
    for (const key of Object.keys(defaultFilters)) {
      const value = searchParams.get(key);
      if (value !== null) {
        result[key] = value;
      }
    }
    return result;
  }, [searchParams, defaultFilters]);

  const setFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null || value === '' || value === defaultFilters[key]) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [searchParams, router, pathname, defaultFilters]);

  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilter, resetFilters };
}
