'use client';

import { useState, useCallback, useEffect } from 'react';
import { budgetsApi } from '@/lib/api-client';
import { BudgetNode } from '../types';
import {
  BudgetVersion,
  VersionComparison,
  VersionChange,
  ComparisonChange,
  generateDemoVersions,
  compareVersions as localCompareVersions,
} from '../version-history/types';

interface UseVersionHistoryOptions {
  budgetId: string;
  budgetNode?: BudgetNode;
  autoLoad?: boolean;
}

interface UseVersionHistoryReturn {
  // Versions list
  versions: BudgetVersion[];
  isLoading: boolean;
  error: string | null;
  loadVersions: () => Promise<void>;

  // Current/selected version
  currentVersion: BudgetVersion | null;
  selectedVersion: BudgetVersion | null;
  selectVersion: (versionId: string | null) => void;

  // Version operations
  createVersion: (name: string, description?: string, tags?: string[]) => Promise<BudgetVersion | null>;
  isCreating: boolean;

  // Version actions
  submitVersion: (versionId: string, comments?: string) => Promise<boolean>;
  approveVersion: (versionId: string, comments?: string) => Promise<boolean>;
  rejectVersion: (versionId: string, reason: string) => Promise<boolean>;

  // Comparison
  comparison: VersionComparison | null;
  isComparing: boolean;
  compareVersions: (version1Id: string, version2Id: string) => Promise<void>;
  clearComparison: () => void;

  // Rollback
  rollback: (versionId: string, createBackup?: boolean, reason?: string) => Promise<boolean>;
  isRollingBack: boolean;
}

export function useVersionHistory({
  budgetId,
  budgetNode,
  autoLoad = true,
}: UseVersionHistoryOptions): UseVersionHistoryReturn {
  // Versions state
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [currentVersion, setCurrentVersion] = useState<BudgetVersion | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersion | null>(null);

  // Operation states
  const [isCreating, setIsCreating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Comparison state
  const [comparison, setComparison] = useState<VersionComparison | null>(null);

  // Load versions from API
  const loadVersions = useCallback(async () => {
    if (!budgetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.getVersions(budgetId);

      if (response.success && response.data) {
        const mappedVersions = mapApiVersions(response.data.data);
        setVersions(mappedVersions);

        // Set current version
        const current = mappedVersions.find(v => v.status === 'current' || v.isCurrent);
        setCurrentVersion(current || mappedVersions[0] || null);
      } else if (budgetNode) {
        // Fallback to demo data
        const demoVersions = generateDemoVersions(budgetNode);
        setVersions(demoVersions);
        setCurrentVersion(demoVersions.find(v => v.isCurrent) || null);
      }
    } catch (err) {
      // Fallback to demo data
      if (budgetNode) {
        const demoVersions = generateDemoVersions(budgetNode);
        setVersions(demoVersions);
        setCurrentVersion(demoVersions.find(v => v.isCurrent) || null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load versions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, budgetNode]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadVersions();
    }
  }, [autoLoad, loadVersions]);

  // Select a version
  const selectVersion = useCallback((versionId: string | null) => {
    if (!versionId) {
      setSelectedVersion(null);
      return;
    }

    const version = versions.find(v => v.id === versionId);
    setSelectedVersion(version || null);
  }, [versions]);

  // Create a new version (snapshot)
  const createVersion = useCallback(async (
    name: string,
    description?: string,
    tags?: string[]
  ): Promise<BudgetVersion | null> => {
    if (!budgetId) return null;

    setIsCreating(true);

    try {
      const response = await budgetsApi.createVersion(budgetId, { name, description, tags });

      if (response.success && response.data) {
        const newVersion = mapApiVersion(response.data);
        setVersions(prev => [newVersion, ...prev]);
        return newVersion;
      }

      return null;
    } catch (err) {
      console.error('Failed to create version:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [budgetId]);

  // Submit version for approval
  const submitVersion = useCallback(async (versionId: string, comments?: string): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      const response = await budgetsApi.submitVersion(budgetId, versionId, comments);

      if (response.success) {
        // Update local state
        setVersions(prev => prev.map(v =>
          v.id === versionId ? { ...v, status: 'submitted' as const } : v
        ));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to submit version:', err);
      return false;
    }
  }, [budgetId]);

  // Approve version
  const approveVersion = useCallback(async (versionId: string, comments?: string): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      const response = await budgetsApi.approveVersion(budgetId, versionId, comments);

      if (response.success) {
        // Update local state - mark as current and previous current as archived
        setVersions(prev => prev.map(v => {
          if (v.id === versionId) {
            return { ...v, status: 'current' as const, isCurrent: true };
          }
          if (v.isCurrent) {
            return { ...v, status: 'approved' as const, isCurrent: false };
          }
          return v;
        }));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to approve version:', err);
      return false;
    }
  }, [budgetId]);

  // Reject version
  const rejectVersion = useCallback(async (versionId: string, reason: string): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      const response = await budgetsApi.rejectVersion(budgetId, versionId, reason);

      if (response.success) {
        // Update local state
        setVersions(prev => prev.map(v =>
          v.id === versionId ? { ...v, status: 'rejected' as const } : v
        ));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to reject version:', err);
      return false;
    }
  }, [budgetId]);

  // Compare two versions
  const compareVersionsFn = useCallback(async (version1Id: string, version2Id: string) => {
    if (!budgetId) return;

    setIsComparing(true);

    try {
      const response = await budgetsApi.compareVersions(budgetId, version1Id, version2Id);

      if (response.success && response.data) {
        const data = response.data;

        // Map API response to frontend format
        const v1 = versions.find(v => v.id === version1Id) || mapApiVersion(data.version1);
        const v2 = versions.find(v => v.id === version2Id) || mapApiVersion(data.version2);

        const mappedComparison: VersionComparison = {
          leftVersion: v1,
          rightVersion: v2,
          changes: mapComparisonChanges(data.changes),
          summary: {
            added: data.summary.nodesAdded,
            removed: data.summary.nodesRemoved,
            modified: data.summary.nodesModified,
            unchanged: data.summary.nodesUnchanged,
            totalBudgetDiff: data.summary.totalBudgetDiff,
            totalBudgetDiffPercent: data.summary.totalBudgetDiffPercent,
          },
        };

        setComparison(mappedComparison);
      } else {
        // Fallback to local comparison
        const v1 = versions.find(v => v.id === version1Id);
        const v2 = versions.find(v => v.id === version2Id);

        if (v1 && v2) {
          const localComparison = localCompareVersions(v1, v2);
          setComparison(localComparison);
        }
      }
    } catch (err) {
      // Fallback to local comparison
      const v1 = versions.find(v => v.id === version1Id);
      const v2 = versions.find(v => v.id === version2Id);

      if (v1 && v2) {
        const localComparison = localCompareVersions(v1, v2);
        setComparison(localComparison);
      }
    } finally {
      setIsComparing(false);
    }
  }, [budgetId, versions]);

  // Clear comparison
  const clearComparison = useCallback(() => {
    setComparison(null);
  }, []);

  // Rollback to a version
  const rollback = useCallback(async (
    versionId: string,
    createBackup = true,
    reason?: string
  ): Promise<boolean> => {
    if (!budgetId) return false;

    setIsRollingBack(true);

    try {
      const response = await budgetsApi.rollback(budgetId, versionId, { createBackup, reason });

      if (response.success) {
        // Reload versions to get updated state
        await loadVersions();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to rollback:', err);
      return false;
    } finally {
      setIsRollingBack(false);
    }
  }, [budgetId, loadVersions]);

  return {
    // Versions list
    versions,
    isLoading,
    error,
    loadVersions,

    // Current/selected version
    currentVersion,
    selectedVersion,
    selectVersion,

    // Version operations
    createVersion,
    isCreating,

    // Version actions
    submitVersion,
    approveVersion,
    rejectVersion,

    // Comparison
    comparison,
    isComparing,
    compareVersions: compareVersionsFn,
    clearComparison,

    // Rollback
    rollback,
    isRollingBack,
  };
}

// Helper functions for mapping API types

function mapApiVersions(apiVersions: any[]): BudgetVersion[] {
  return apiVersions.map(mapApiVersion);
}

function mapApiVersion(apiVersion: any): BudgetVersion {
  return {
    id: apiVersion.id,
    versionNumber: apiVersion.versionNumber,
    name: apiVersion.name,
    description: apiVersion.description,
    status: mapVersionStatus(apiVersion.status),
    createdAt: new Date(apiVersion.createdAt),
    createdBy: apiVersion.createdBy || {
      id: apiVersion.createdById,
      name: 'Unknown',
      email: '',
    },
    snapshot: apiVersion.snapshotData || {},
    changes: mapVersionChanges(apiVersion.changes || []),
    parentVersionId: undefined,
    tags: apiVersion.tags || [],
    isLatest: apiVersion.versionNumber === 1,
    isCurrent: apiVersion.status === 'CURRENT',
  };
}

function mapVersionStatus(status: string): BudgetVersion['status'] {
  const map: Record<string, BudgetVersion['status']> = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CURRENT: 'current',
    ARCHIVED: 'approved',
  };
  return map[status] || 'draft';
}

function mapVersionChanges(changes: any[]): VersionChange[] {
  return changes.map(c => ({
    id: c.id,
    nodeId: c.nodeId,
    nodeName: c.nodeName,
    nodePath: c.nodePath || [],
    changeType: mapChangeType(c.changeType),
    field: c.field,
    oldValue: c.oldValue ? parseFloat(c.oldValue) || c.oldValue : null,
    newValue: c.newValue ? parseFloat(c.newValue) || c.newValue : null,
    diff: c.diff ? Number(c.diff) : undefined,
    diffPercent: c.diffPercent ? Number(c.diffPercent) : undefined,
  }));
}

function mapChangeType(type: string): VersionChange['changeType'] {
  const map: Record<string, VersionChange['changeType']> = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    REALLOC: 'realloc',
    MERGE: 'merge',
    SPLIT: 'split',
  };
  return map[type] || 'update';
}

function mapComparisonChanges(changes: any[]): ComparisonChange[] {
  return changes.map(c => ({
    nodeId: c.nodeId,
    nodeName: c.nodeName,
    nodePath: c.nodePath || [],
    status: c.status as ComparisonChange['status'],
    leftValue: c.value1,
    rightValue: c.value2,
    diff: c.diff,
    diffPercent: c.diffPercent,
  }));
}

export default useVersionHistory;
