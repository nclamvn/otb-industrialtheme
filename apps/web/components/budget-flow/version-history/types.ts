'use client';

import { BudgetNode } from '../types';

// Version types
export type VersionStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'current';
export type ChangeType = 'create' | 'update' | 'delete' | 'realloc' | 'merge' | 'split';

// Version snapshot
export interface BudgetVersion {
  id: string;
  versionNumber: number;
  name: string;
  description?: string;
  status: VersionStatus;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  snapshot: BudgetNode;
  changes: VersionChange[];
  parentVersionId?: string;
  tags?: string[];
  isLatest: boolean;
  isCurrent: boolean;
}

// Individual change within a version
export interface VersionChange {
  id: string;
  nodeId: string;
  nodeName: string;
  nodePath: string[];
  changeType: ChangeType;
  field: string;
  oldValue: number | string | null;
  newValue: number | string | null;
  diff?: number;
  diffPercent?: number;
}

// Comparison result
export interface VersionComparison {
  leftVersion: BudgetVersion;
  rightVersion: BudgetVersion;
  changes: ComparisonChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    totalBudgetDiff: number;
    totalBudgetDiffPercent: number;
  };
}

export interface ComparisonChange {
  nodeId: string;
  nodeName: string;
  nodePath: string[];
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  leftValue?: number;
  rightValue?: number;
  diff?: number;
  diffPercent?: number;
  children?: ComparisonChange[];
}

// Demo data generator
export function generateDemoVersions(currentData: BudgetNode): BudgetVersion[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const versions: BudgetVersion[] = [
    {
      id: 'v4',
      versionNumber: 4,
      name: 'Current Version',
      description: 'Latest adjustments after AI optimization',
      status: 'current',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      createdBy: {
        id: 'user-001',
        name: 'Nguyen Van A',
        email: 'a.nguyen@dafc.com',
        avatar: undefined,
      },
      snapshot: currentData,
      changes: [
        {
          id: 'c1',
          nodeId: 'rex-male-outerwear',
          nodeName: 'Outerwear',
          nodePath: ['FY 2026 Spring Summer', 'REX', 'Male', 'Outerwear'],
          changeType: 'update',
          field: 'budget',
          oldValue: 180000,
          newValue: 200000,
          diff: 20000,
          diffPercent: 11.1,
        },
        {
          id: 'c2',
          nodeId: 'rex-male-accessories',
          nodeName: 'Accessories',
          nodePath: ['FY 2026 Spring Summer', 'REX', 'Male', 'Accessories'],
          changeType: 'update',
          field: 'budget',
          oldValue: 150000,
          newValue: 130000,
          diff: -20000,
          diffPercent: -13.3,
        },
      ],
      tags: ['ai-optimized', 'gap-resolved'],
      isLatest: true,
      isCurrent: true,
    },
    {
      id: 'v3',
      versionNumber: 3,
      name: 'Approved by Manager',
      description: 'Final approval from Brand Manager',
      status: 'approved',
      createdAt: new Date(now.getTime() - 1 * dayMs), // 1 day ago
      createdBy: {
        id: 'user-002',
        name: 'Tran Thi B',
        email: 'b.tran@dafc.com',
        avatar: undefined,
      },
      snapshot: { ...currentData, budget: 1800000 },
      changes: [
        {
          id: 'c3',
          nodeId: 'root',
          nodeName: 'FY 2026 Spring Summer',
          nodePath: ['FY 2026 Spring Summer'],
          changeType: 'update',
          field: 'status',
          oldValue: 'submitted',
          newValue: 'approved',
          diff: undefined,
          diffPercent: undefined,
        },
      ],
      tags: ['approved'],
      isLatest: false,
      isCurrent: false,
      parentVersionId: 'v2',
    },
    {
      id: 'v2',
      versionNumber: 2,
      name: 'User Adjustments',
      description: 'Manual budget reallocation based on sales forecast',
      status: 'submitted',
      createdAt: new Date(now.getTime() - 3 * dayMs), // 3 days ago
      createdBy: {
        id: 'user-001',
        name: 'Nguyen Van A',
        email: 'a.nguyen@dafc.com',
        avatar: undefined,
      },
      snapshot: { ...currentData, budget: 1750000, allocated: 1600000 },
      changes: [
        {
          id: 'c4',
          nodeId: 'rex',
          nodeName: 'REX',
          nodePath: ['FY 2026 Spring Summer', 'REX'],
          changeType: 'update',
          field: 'budget',
          oldValue: 950000,
          newValue: 1037575,
          diff: 87575,
          diffPercent: 9.2,
        },
        {
          id: 'c5',
          nodeId: 'ttp',
          nodeName: 'TTP',
          nodePath: ['FY 2026 Spring Summer', 'TTP'],
          changeType: 'update',
          field: 'budget',
          oldValue: 800000,
          newValue: 848925,
          diff: 48925,
          diffPercent: 6.1,
        },
      ],
      tags: ['user-adjusted'],
      isLatest: false,
      isCurrent: false,
      parentVersionId: 'v1',
    },
    {
      id: 'v1',
      versionNumber: 1,
      name: 'Initial System Proposal',
      description: 'Auto-generated budget allocation based on historical data',
      status: 'draft',
      createdAt: new Date(now.getTime() - 7 * dayMs), // 7 days ago
      createdBy: {
        id: 'system',
        name: 'DAFC System',
        email: 'system@dafc.com',
        avatar: undefined,
      },
      snapshot: { ...currentData, budget: 1500000, allocated: 1200000 },
      changes: [
        {
          id: 'c6',
          nodeId: 'root',
          nodeName: 'FY 2026 Spring Summer',
          nodePath: ['FY 2026 Spring Summer'],
          changeType: 'create',
          field: 'budget',
          oldValue: null,
          newValue: 1500000,
          diff: 1500000,
          diffPercent: 100,
        },
      ],
      tags: ['system-generated', 'initial'],
      isLatest: false,
      isCurrent: false,
    },
  ];

  return versions;
}

// Compare two versions
export function compareVersions(
  leftVersion: BudgetVersion,
  rightVersion: BudgetVersion
): VersionComparison {
  const changes: ComparisonChange[] = [];
  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  function compareNodes(
    leftNode: BudgetNode | undefined,
    rightNode: BudgetNode | undefined,
    path: string[] = []
  ): ComparisonChange | null {
    if (!leftNode && !rightNode) return null;

    if (!leftNode && rightNode) {
      added++;
      return {
        nodeId: rightNode.id,
        nodeName: rightNode.name,
        nodePath: [...path, rightNode.name],
        status: 'added',
        rightValue: rightNode.budget,
      };
    }

    if (leftNode && !rightNode) {
      removed++;
      return {
        nodeId: leftNode.id,
        nodeName: leftNode.name,
        nodePath: [...path, leftNode.name],
        status: 'removed',
        leftValue: leftNode.budget,
      };
    }

    const left = leftNode!;
    const right = rightNode!;
    const currentPath = [...path, left.name];

    // Compare children
    const childChanges: ComparisonChange[] = [];
    const allChildIds = new Set([
      ...(left.children?.map((c) => c.id) || []),
      ...(right.children?.map((c) => c.id) || []),
    ]);

    allChildIds.forEach((childId) => {
      const leftChild = left.children?.find((c) => c.id === childId);
      const rightChild = right.children?.find((c) => c.id === childId);
      const childChange = compareNodes(leftChild, rightChild, currentPath);
      if (childChange) {
        childChanges.push(childChange);
      }
    });

    if (left.budget !== right.budget) {
      modified++;
      return {
        nodeId: left.id,
        nodeName: left.name,
        nodePath: currentPath,
        status: 'modified',
        leftValue: left.budget,
        rightValue: right.budget,
        diff: right.budget - left.budget,
        diffPercent: ((right.budget - left.budget) / left.budget) * 100,
        children: childChanges.length > 0 ? childChanges : undefined,
      };
    }

    if (childChanges.length > 0) {
      return {
        nodeId: left.id,
        nodeName: left.name,
        nodePath: currentPath,
        status: 'modified',
        leftValue: left.budget,
        rightValue: right.budget,
        children: childChanges,
      };
    }

    unchanged++;
    return null;
  }

  const rootChange = compareNodes(leftVersion.snapshot, rightVersion.snapshot);
  if (rootChange) {
    changes.push(rootChange);
  }

  const totalBudgetDiff =
    rightVersion.snapshot.budget - leftVersion.snapshot.budget;
  const totalBudgetDiffPercent =
    (totalBudgetDiff / leftVersion.snapshot.budget) * 100;

  return {
    leftVersion,
    rightVersion,
    changes,
    summary: {
      added,
      removed,
      modified,
      unchanged,
      totalBudgetDiff,
      totalBudgetDiffPercent,
    },
  };
}

// Status colors
export const VERSION_STATUS_COLORS = {
  draft: {
    bg: 'bg-muted',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  submitted: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  current: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
};

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  realloc: 'Reallocated',
  merge: 'Merged',
  split: 'Split',
};
