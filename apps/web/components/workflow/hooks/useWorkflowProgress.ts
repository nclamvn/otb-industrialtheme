'use client';

import { useState, useEffect, useCallback } from 'react';

interface StepProgress {
  version?: number;
  versionStatus?: 'draft' | 'final';
  itemCount?: number;
  totalValue?: number;
  lastModified?: string;
  hasWarning?: boolean;
  warningMessage?: string;
}

interface ActiveSeason {
  id: string;
  code: string;
  brand: string;
}

interface WorkflowProgressData {
  progress: Record<string, StepProgress>;
  activeSeasons: ActiveSeason[];
}

const DEFAULT_DATA: WorkflowProgressData = {
  progress: {
    budget: {
      version: 2,
      versionStatus: 'final',
      itemCount: 12,
      totalValue: 5200000,
      lastModified: new Date().toISOString(),
    },
    otb: {
      version: 3,
      versionStatus: 'draft',
      itemCount: 45,
      totalValue: 4800000,
      lastModified: new Date().toISOString(),
    },
    sku: {
      version: 1,
      versionStatus: 'draft',
      itemCount: 156,
      totalValue: 3200000,
      lastModified: new Date().toISOString(),
      hasWarning: true,
      warningMessage: '12 SKUs missing size breakdown',
    },
    sizing: {
      itemCount: 0,
    },
    ticket: {},
    approval: {},
  },
  activeSeasons: [
    { id: '1', code: 'SS25', brand: 'Ferragamo' },
    { id: '2', code: 'SS25', brand: 'TODs' },
  ],
};

export function useWorkflowProgress() {
  const [data, setData] = useState<WorkflowProgressData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/workflow/progress');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Use default mock data if API fails
      setData(DEFAULT_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();

    // Refresh every 30 seconds
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  return {
    progress: data.progress,
    activeSeasons: data.activeSeasons,
    isLoading,
    refetch: fetchProgress,
  };
}
