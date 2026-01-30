'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  WorkflowStep,
  WorkflowState,
  DecisionGateData,
  DecisionStatus,
  DecisionType,
  WORKFLOW_STEPS,
} from '../types';

interface UseWorkflowOptions {
  budgetId: string;
  initialStep?: WorkflowStep;
  onStepChange?: (step: WorkflowStep) => void;
  onDecisionMade?: (decision: DecisionGateData, action: 'approve' | 'reject' | 'alternate') => void;
}

interface UseWorkflowReturn {
  state: WorkflowState;
  currentStep: WorkflowStep;
  isStepCompleted: (step: WorkflowStep) => boolean;
  canProceed: boolean;
  pendingDecision: DecisionGateData | null;
  completeStep: (step: WorkflowStep) => void;
  goToStep: (step: WorkflowStep) => void;
  createDecisionGate: (type: DecisionType, question: string) => DecisionGateData;
  approveDecision: (decisionId: string, comment?: string) => void;
  rejectDecision: (decisionId: string, comment?: string) => void;
  requestAlternate: (decisionId: string, comment?: string) => void;
  resetWorkflow: () => void;
}

export function useWorkflow({
  budgetId,
  initialStep = 'budget',
  onStepChange,
  onDecisionMade,
}: UseWorkflowOptions): UseWorkflowReturn {
  const [state, setState] = useState<WorkflowState>({
    currentStep: initialStep,
    completedSteps: [],
    pendingDecisions: [],
    isBlocked: false,
  });

  const currentStepIndex = useMemo(
    () => WORKFLOW_STEPS.indexOf(state.currentStep),
    [state.currentStep]
  );

  const isStepCompleted = useCallback(
    (step: WorkflowStep) => state.completedSteps.includes(step),
    [state.completedSteps]
  );

  const canProceed = useMemo(
    () => !state.isBlocked && state.pendingDecisions.length === 0,
    [state.isBlocked, state.pendingDecisions]
  );

  const pendingDecision = useMemo(
    () => state.pendingDecisions.find((d) => d.status === 'pending') || null,
    [state.pendingDecisions]
  );

  const completeStep = useCallback(
    (step: WorkflowStep) => {
      setState((prev) => {
        const stepIndex = WORKFLOW_STEPS.indexOf(step);
        const nextStep = WORKFLOW_STEPS[stepIndex + 1];

        const newState: WorkflowState = {
          ...prev,
          completedSteps: prev.completedSteps.includes(step)
            ? prev.completedSteps
            : [...prev.completedSteps, step],
          currentStep: nextStep || prev.currentStep,
        };

        if (nextStep) {
          onStepChange?.(nextStep);
        }

        return newState;
      });
    },
    [onStepChange]
  );

  const goToStep = useCallback(
    (step: WorkflowStep) => {
      const targetIndex = WORKFLOW_STEPS.indexOf(step);

      // Can only go to completed steps or the next available step
      if (targetIndex <= currentStepIndex || state.completedSteps.includes(step)) {
        setState((prev) => ({
          ...prev,
          currentStep: step,
        }));
        onStepChange?.(step);
      }
    },
    [currentStepIndex, state.completedSteps, onStepChange]
  );

  const createDecisionGate = useCallback(
    (type: DecisionType, question: string): DecisionGateData => {
      const decision: DecisionGateData = {
        id: `decision-${Date.now()}`,
        type,
        status: 'pending',
        question,
        budgetId,
        submittedAt: new Date(),
      };

      setState((prev) => ({
        ...prev,
        pendingDecisions: [...prev.pendingDecisions, decision],
        isBlocked: true,
        blockedReason: 'Waiting for decision approval',
      }));

      return decision;
    },
    [budgetId]
  );

  const updateDecisionStatus = useCallback(
    (decisionId: string, status: DecisionStatus, action: 'approve' | 'reject' | 'alternate') => {
      setState((prev) => {
        const decision = prev.pendingDecisions.find((d) => d.id === decisionId);
        if (!decision) return prev;

        const updatedDecisions = prev.pendingDecisions.map((d) =>
          d.id === decisionId ? { ...d, status } : d
        );

        const stillPending = updatedDecisions.some((d) => d.status === 'pending');

        onDecisionMade?.(decision, action);

        return {
          ...prev,
          pendingDecisions: updatedDecisions,
          isBlocked: stillPending || status === 'rejected',
          blockedReason:
            status === 'rejected'
              ? 'Decision was rejected - revision required'
              : stillPending
              ? 'Waiting for decision approval'
              : undefined,
        };
      });
    },
    [onDecisionMade]
  );

  const approveDecision = useCallback(
    (decisionId: string, _comment?: string) => {
      updateDecisionStatus(decisionId, 'approved', 'approve');
    },
    [updateDecisionStatus]
  );

  const rejectDecision = useCallback(
    (decisionId: string, _comment?: string) => {
      updateDecisionStatus(decisionId, 'rejected', 'reject');
    },
    [updateDecisionStatus]
  );

  const requestAlternate = useCallback(
    (decisionId: string, _comment?: string) => {
      updateDecisionStatus(decisionId, 'alternate_requested', 'alternate');
    },
    [updateDecisionStatus]
  );

  const resetWorkflow = useCallback(() => {
    setState({
      currentStep: initialStep,
      completedSteps: [],
      pendingDecisions: [],
      isBlocked: false,
    });
  }, [initialStep]);

  return {
    state,
    currentStep: state.currentStep,
    isStepCompleted,
    canProceed,
    pendingDecision,
    completeStep,
    goToStep,
    createDecisionGate,
    approveDecision,
    rejectDecision,
    requestAlternate,
    resetWorkflow,
  };
}

export default useWorkflow;
