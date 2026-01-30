'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ApprovalRequest,
  ApprovalLevel,
  ApprovalStatus,
  APPROVAL_LEVELS,
} from '../types';

interface UseApprovalChainOptions {
  request: ApprovalRequest | null;
  currentUserId: string;
  onApproved?: (request: ApprovalRequest) => void;
  onRejected?: (request: ApprovalRequest) => void;
  onStepComplete?: (level: ApprovalLevel, status: ApprovalStatus) => void;
}

interface UseApprovalChainReturn {
  request: ApprovalRequest | null;
  isLoading: boolean;
  error: string | null;
  currentLevel: ApprovalLevel | null;
  canUserApprove: (level: ApprovalLevel) => boolean;
  approve: (level: ApprovalLevel, comment?: string) => Promise<void>;
  reject: (level: ApprovalLevel, comment: string) => Promise<void>;
  getNextApprover: () => ApprovalLevel | null;
  isFullyApproved: boolean;
  isRejected: boolean;
}

// Demo approvers by level - in production this would come from user roles
const DEMO_APPROVERS_BY_LEVEL: Record<ApprovalLevel, string[]> = {
  gmd: ['user-gmd-1', 'user-gmd-2'],
  finance: ['user-finance-1', 'user-finance-2'],
  ceo: ['user-ceo-1'],
};

export function useApprovalChain({
  request: initialRequest,
  currentUserId,
  onApproved,
  onRejected,
  onStepComplete,
}: UseApprovalChainOptions): UseApprovalChainReturn {
  const [request, setRequest] = useState<ApprovalRequest | null>(initialRequest);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLevel = useMemo(() => {
    if (!request || request.status !== 'in_progress') return null;
    return request.currentLevel;
  }, [request]);

  const isFullyApproved = useMemo(() => {
    return request?.status === 'approved';
  }, [request]);

  const isRejected = useMemo(() => {
    return request?.status === 'rejected';
  }, [request]);

  const canUserApprove = useCallback(
    (level: ApprovalLevel): boolean => {
      if (!request || request.status !== 'in_progress') return false;
      if (request.currentLevel !== level) return false;

      // Check if user has permission for this level
      const approvers = DEMO_APPROVERS_BY_LEVEL[level];
      return approvers.includes(currentUserId);
    },
    [request, currentUserId]
  );

  const getNextApprover = useCallback((): ApprovalLevel | null => {
    if (!request || request.status !== 'in_progress') return null;

    const currentIndex = APPROVAL_LEVELS.indexOf(request.currentLevel);
    if (currentIndex === -1 || currentIndex >= APPROVAL_LEVELS.length - 1) {
      return null;
    }

    return APPROVAL_LEVELS[currentIndex + 1];
  }, [request]);

  const approve = useCallback(
    async (level: ApprovalLevel, comment?: string): Promise<void> => {
      if (!request) {
        setError('No request to approve');
        return;
      }

      if (!canUserApprove(level)) {
        setError('You do not have permission to approve this level');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const nextLevel = getNextApprover();
        const isLastLevel = !nextLevel;

        setRequest((prev) => {
          if (!prev) return prev;

          const updatedSteps = prev.steps.map((step) =>
            step.level === level
              ? {
                  ...step,
                  status: 'approved' as ApprovalStatus,
                  approvedAt: new Date(),
                  comment,
                  approver: {
                    id: currentUserId,
                    name: 'Current User', // Would come from user context
                    email: 'user@example.com',
                    role: level.toUpperCase(),
                  },
                }
              : step
          );

          const updatedRequest: ApprovalRequest = {
            ...prev,
            steps: updatedSteps,
            currentLevel: nextLevel || prev.currentLevel,
            status: isLastLevel ? 'approved' : 'in_progress',
          };

          // Callbacks
          onStepComplete?.(level, 'approved');
          if (isLastLevel) {
            onApproved?.(updatedRequest);
          }

          return updatedRequest;
        });
      } catch (err) {
        setError('Failed to approve. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [request, canUserApprove, getNextApprover, currentUserId, onApproved, onStepComplete]
  );

  const reject = useCallback(
    async (level: ApprovalLevel, comment: string): Promise<void> => {
      if (!request) {
        setError('No request to reject');
        return;
      }

      if (!canUserApprove(level)) {
        setError('You do not have permission to reject this level');
        return;
      }

      if (!comment.trim()) {
        setError('Comment is required for rejection');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setRequest((prev) => {
          if (!prev) return prev;

          const updatedSteps = prev.steps.map((step) =>
            step.level === level
              ? {
                  ...step,
                  status: 'rejected' as ApprovalStatus,
                  approvedAt: new Date(),
                  comment,
                  approver: {
                    id: currentUserId,
                    name: 'Current User',
                    email: 'user@example.com',
                    role: level.toUpperCase(),
                  },
                }
              : step
          );

          const updatedRequest: ApprovalRequest = {
            ...prev,
            steps: updatedSteps,
            status: 'rejected',
          };

          // Callbacks
          onStepComplete?.(level, 'rejected');
          onRejected?.(updatedRequest);

          return updatedRequest;
        });
      } catch (err) {
        setError('Failed to reject. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [request, canUserApprove, currentUserId, onRejected, onStepComplete]
  );

  return {
    request,
    isLoading,
    error,
    currentLevel,
    canUserApprove,
    approve,
    reject,
    getNextApprover,
    isFullyApproved,
    isRejected,
  };
}

export default useApprovalChain;
