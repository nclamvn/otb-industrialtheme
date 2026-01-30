'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ApprovalRequest,
  ApprovalLevel,
  ApprovalPriority,
  ApprovalRequestType,
} from '../types';

interface UseMyApprovalsOptions {
  userId: string;
  userRoles: ApprovalLevel[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMyApprovalsReturn {
  pendingApprovals: ApprovalRequest[];
  allApprovals: ApprovalRequest[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  filterByPriority: (priority: ApprovalPriority | 'all') => void;
  filterByType: (type: ApprovalRequestType | 'all') => void;
  sortBy: (field: 'date' | 'priority' | 'deadline') => void;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    highPriority: number;
  };
}

// Generate demo data for approvals
function generateDemoApprovals(): ApprovalRequest[] {
  const now = new Date();

  return [
    {
      id: 'approval-1',
      type: 'otb_plan',
      entityId: 'budget-1',
      entityName: 'Male Outerwear',
      requestedBy: {
        id: 'user-1',
        name: 'John Doe',
        avatar: undefined,
      },
      requestedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      currentLevel: 'finance',
      steps: [
        {
          id: 'step-1-1',
          level: 'gmd',
          status: 'approved',
          approvedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          comment: 'Budget allocation looks good. Approved.',
          approver: {
            id: 'gmd-1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'GMD',
          },
        },
        {
          id: 'step-1-2',
          level: 'finance',
          status: 'pending',
          deadline: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
          approver: {
            id: 'finance-1',
            name: 'Michael Chen',
            email: 'michael@example.com',
            role: 'Finance Director',
          },
        },
        {
          id: 'step-1-3',
          level: 'ceo',
          status: 'pending',
          approver: {
            id: 'ceo-1',
            name: 'David Williams',
            email: 'david@example.com',
            role: 'CEO',
          },
        },
      ],
      status: 'in_progress',
      priority: 'high',
      metadata: {
        season: 'SS26',
        brand: 'REX',
        totalBudget: 200000,
        skuCount: 45,
      },
    },
    {
      id: 'approval-2',
      type: 'sku_proposal',
      entityId: 'sku-proposal-1',
      entityName: 'Female Sizing',
      requestedBy: {
        id: 'user-2',
        name: 'Jane Smith',
      },
      requestedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      currentLevel: 'gmd',
      steps: [
        {
          id: 'step-2-1',
          level: 'gmd',
          status: 'pending',
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          approver: {
            id: 'gmd-2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'GMD',
          },
        },
        {
          id: 'step-2-2',
          level: 'finance',
          status: 'pending',
        },
        {
          id: 'step-2-3',
          level: 'ceo',
          status: 'pending',
        },
      ],
      status: 'in_progress',
      priority: 'medium',
      metadata: {
        season: 'SS26',
        brand: 'TTP',
        totalBudget: 348925,
        skuCount: 120,
      },
    },
    {
      id: 'approval-3',
      type: 'sizing',
      entityId: 'sizing-1',
      entityName: 'Unisex Sizing Change',
      requestedBy: {
        id: 'user-3',
        name: 'Bob Lee',
      },
      requestedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      currentLevel: 'gmd',
      steps: [
        {
          id: 'step-3-1',
          level: 'gmd',
          status: 'pending',
          deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
        {
          id: 'step-3-2',
          level: 'finance',
          status: 'pending',
        },
        {
          id: 'step-3-3',
          level: 'ceo',
          status: 'pending',
        },
      ],
      status: 'in_progress',
      priority: 'normal',
      metadata: {
        season: 'FW26',
        brand: 'REX',
        totalBudget: 37575,
      },
    },
  ];
}

export function useMyApprovals({
  userId,
  userRoles,
  autoRefresh = false,
  refreshInterval = 60000,
}: UseMyApprovalsOptions): UseMyApprovalsReturn {
  const [allApprovals, setAllApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ApprovalPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ApprovalRequestType | 'all'>('all');
  const [sortField, setSortField] = useState<'date' | 'priority' | 'deadline'>('date');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - in production this would fetch from backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      const data = generateDemoApprovals();
      setAllApprovals(data);
    } catch (err) {
      setError('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  // Filter pending approvals that user can act on
  const pendingApprovals = useMemo(() => {
    return allApprovals.filter((approval) => {
      if (approval.status !== 'in_progress') return false;
      // Check if user's role matches the current level
      return userRoles.includes(approval.currentLevel);
    });
  }, [allApprovals, userRoles]);

  // Apply filters and sorting
  const filteredApprovals = useMemo(() => {
    let filtered = [...pendingApprovals];

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((a) => a.priority === priorityFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortField) {
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, normal: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'deadline': {
          const aDeadline = a.steps.find((s) => s.level === a.currentLevel)?.deadline;
          const bDeadline = b.steps.find((s) => s.level === b.currentLevel)?.deadline;
          if (!aDeadline) return 1;
          if (!bDeadline) return -1;
          return aDeadline.getTime() - bDeadline.getTime();
        }
        case 'date':
        default:
          return b.requestedAt.getTime() - a.requestedAt.getTime();
      }
    });

    return filtered;
  }, [pendingApprovals, priorityFilter, typeFilter, sortField]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = allApprovals.filter((a) => a.status === 'in_progress').length;
    const approved = allApprovals.filter((a) => a.status === 'approved').length;
    const rejected = allApprovals.filter((a) => a.status === 'rejected').length;
    const highPriority = pendingApprovals.filter((a) => a.priority === 'high').length;

    return {
      total: allApprovals.length,
      pending,
      approved,
      rejected,
      highPriority,
    };
  }, [allApprovals, pendingApprovals]);

  return {
    pendingApprovals: filteredApprovals,
    allApprovals,
    isLoading,
    error,
    refresh,
    filterByPriority: setPriorityFilter,
    filterByType: setTypeFilter,
    sortBy: setSortField,
    stats,
  };
}

export default useMyApprovals;
