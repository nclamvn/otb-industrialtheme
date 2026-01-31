'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  SizingVersion,
  SizingVersionStatus,
  SizingVersionChange,
  SizingVersionComparison,
  ChoiceAllocationData,
} from '../types';

interface UseSizingVersionOptions {
  skuProposalId?: string;
  initialData?: ChoiceAllocationData[];
  autoLoad?: boolean;
}

// Demo data generator
function generateDemoVersions(currentData?: ChoiceAllocationData[]): SizingVersion[] {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'sv-1',
      versionNumber: 1,
      name: 'Initial Size Allocation',
      description: 'System-generated initial allocation based on historical data',
      status: 'APPROVED' as SizingVersionStatus,
      snapshotData: currentData || [],
      totalUnits: 1250,
      totalValue: 187500000,
      changes: [],
      tags: ['system', 'initial'],
      createdAt: weekAgo,
      createdBy: { id: 'system', name: 'System', avatar: undefined },
      approvedAt: weekAgo,
      approvedBy: { id: 'u-1', name: 'MD Manager' },
    },
    {
      id: 'sv-2',
      versionNumber: 2,
      name: 'Adjusted for Trend',
      description: 'Adjusted size ratios based on current season trends',
      status: 'APPROVED' as SizingVersionStatus,
      snapshotData: currentData || [],
      totalUnits: 1320,
      totalValue: 198000000,
      changes: [
        { id: 'c1', field: 'percentage', oldValue: 25, newValue: 28, sizeName: 'M', changeType: 'UPDATE' },
        { id: 'c2', field: 'percentage', oldValue: 20, newValue: 22, sizeName: 'L', changeType: 'UPDATE' },
      ],
      tags: ['trend-adjusted'],
      createdAt: twoDaysAgo,
      createdBy: { id: 'u-2', name: 'Business Manager' },
      approvedAt: dayAgo,
      approvedBy: { id: 'u-1', name: 'MD Manager' },
    },
    {
      id: 'sv-3',
      versionNumber: 3,
      name: 'Store Feedback Update',
      description: 'Incorporated feedback from store managers on size preferences',
      status: 'CURRENT' as SizingVersionStatus,
      snapshotData: currentData || [],
      totalUnits: 1380,
      totalValue: 207000000,
      changes: [
        { id: 'c3', field: 'qtyA', oldValue: 4, newValue: 5, sizeName: 'S', skuCode: 'REX-001', changeType: 'UPDATE' },
        { id: 'c4', field: 'qtyB', oldValue: 3, newValue: 4, sizeName: 'M', skuCode: 'REX-001', changeType: 'UPDATE' },
      ],
      tags: ['store-feedback', 'current'],
      createdAt: dayAgo,
      createdBy: { id: 'u-2', name: 'Business Manager' },
    },
    {
      id: 'sv-4',
      versionNumber: 4,
      name: 'Draft - Q2 Optimization',
      description: 'Working draft for Q2 size optimization',
      status: 'DRAFT' as SizingVersionStatus,
      snapshotData: currentData || [],
      totalUnits: 1400,
      totalValue: 210000000,
      changes: [
        { id: 'c5', field: 'qtyC', oldValue: 2, newValue: 3, sizeName: 'XL', skuCode: 'REX-002', changeType: 'UPDATE' },
      ],
      tags: ['draft', 'q2'],
      createdAt: now,
      createdBy: { id: 'u-2', name: 'Business Manager' },
    },
  ];
}

export function useSizingVersion({
  skuProposalId,
  initialData,
  autoLoad = true,
}: UseSizingVersionOptions = {}) {
  const [versions, setVersions] = useState<SizingVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SizingVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [comparison, setComparison] = useState<SizingVersionComparison | null>(null);

  // Load versions
  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/sku-proposals/${skuProposalId}/sizing-versions`);
      // const data = await response.json();

      // For now, use demo data
      await new Promise((resolve) => setTimeout(resolve, 500));
      const demoVersions = generateDemoVersions(initialData);
      setVersions(demoVersions);

      // Select the current version by default
      const currentVersion = demoVersions.find((v) => v.status === 'CURRENT') || demoVersions[0];
      setSelectedVersion(currentVersion);
    } catch (err) {
      setError('Failed to load sizing versions');
      console.error('Error loading sizing versions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [skuProposalId, initialData]);

  // Auto load on mount
  useEffect(() => {
    if (autoLoad) {
      loadVersions();
    }
  }, [autoLoad, loadVersions]);

  // Select a version
  const selectVersion = useCallback((versionId: string) => {
    const version = versions.find((v) => v.id === versionId);
    if (version) {
      setSelectedVersion(version);
    }
  }, [versions]);

  // Create a new version
  const createVersion = useCallback(async (
    name: string,
    description?: string,
    currentData?: ChoiceAllocationData[]
  ): Promise<SizingVersion | null> => {
    setIsCreating(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/sku-proposals/${skuProposalId}/sizing-versions`, {
      //   method: 'POST',
      //   body: JSON.stringify({ name, description, snapshotData: currentData }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 800));

      const newVersion: SizingVersion = {
        id: `sv-${Date.now()}`,
        versionNumber: versions.length + 1,
        name,
        description,
        status: 'DRAFT',
        snapshotData: currentData || [],
        totalUnits: 1400,
        totalValue: 210000000,
        changes: [],
        tags: ['user-created'],
        createdAt: new Date(),
        createdBy: { id: 'current-user', name: 'Current User' },
      };

      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersion(newVersion);
      return newVersion;
    } catch (err) {
      console.error('Error creating sizing version:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [versions.length]);

  // Compare two versions
  const compareVersions = useCallback(async (leftId: string, rightId: string) => {
    setIsComparing(true);

    try {
      const leftVersion = versions.find((v) => v.id === leftId);
      const rightVersion = versions.find((v) => v.id === rightId);

      if (!leftVersion || !rightVersion) {
        throw new Error('Version not found');
      }

      // TODO: Replace with actual API call for detailed comparison
      await new Promise((resolve) => setTimeout(resolve, 600));

      const comparisonResult: SizingVersionComparison = {
        leftVersion,
        rightVersion,
        changes: {
          added: rightVersion.changes.filter((c) => c.changeType === 'CREATE'),
          removed: leftVersion.changes.filter((c) => c.changeType === 'DELETE'),
          modified: rightVersion.changes.filter((c) => c.changeType === 'UPDATE'),
        },
        summary: {
          totalChanges: rightVersion.changes.length,
          unitsDiff: rightVersion.totalUnits - leftVersion.totalUnits,
          valueDiff: rightVersion.totalValue - leftVersion.totalValue,
        },
      };

      setComparison(comparisonResult);
      return comparisonResult;
    } catch (err) {
      console.error('Error comparing versions:', err);
      return null;
    } finally {
      setIsComparing(false);
    }
  }, [versions]);

  // Clear comparison
  const clearComparison = useCallback(() => {
    setComparison(null);
  }, []);

  // Rollback to a version
  const rollback = useCallback(async (
    versionId: string,
    createBackup: boolean = true,
    reason?: string
  ): Promise<boolean> => {
    setIsRollingBack(true);

    try {
      const targetVersion = versions.find((v) => v.id === versionId);
      if (!targetVersion) {
        throw new Error('Version not found');
      }

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mark rolled-back version as current
      setVersions((prev) =>
        prev.map((v) => ({
          ...v,
          status: v.id === versionId ? 'CURRENT' : (v.status === 'CURRENT' ? 'APPROVED' : v.status),
        }))
      );

      setSelectedVersion({ ...targetVersion, status: 'CURRENT' });
      return true;
    } catch (err) {
      console.error('Error rolling back version:', err);
      return false;
    } finally {
      setIsRollingBack(false);
    }
  }, [versions]);

  // Set a version as final
  const setAsFinal = useCallback(async (versionId: string): Promise<boolean> => {
    try {
      const targetVersion = versions.find((v) => v.id === versionId);
      if (!targetVersion) {
        throw new Error('Version not found');
      }

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setVersions((prev) =>
        prev.map((v) => ({
          ...v,
          status: v.id === versionId ? 'FINAL' : v.status,
        }))
      );

      return true;
    } catch (err) {
      console.error('Error setting version as final:', err);
      return false;
    }
  }, [versions]);

  // Get current version
  const currentVersion = useMemo(
    () => versions.find((v) => v.status === 'CURRENT' || v.status === 'FINAL'),
    [versions]
  );

  // Get draft versions
  const draftVersions = useMemo(
    () => versions.filter((v) => v.status === 'DRAFT'),
    [versions]
  );

  return {
    versions,
    selectedVersion,
    currentVersion,
    draftVersions,
    isLoading,
    error,
    loadVersions,
    selectVersion,
    createVersion,
    isCreating,
    comparison,
    isComparing,
    compareVersions,
    clearComparison,
    rollback,
    isRollingBack,
    setAsFinal,
  };
}

export default useSizingVersion;
