'use client';

import { useState, useCallback } from 'react';
import {
  Supplier,
  PlanningRequest,
  PlanningRequestItem,
  SendRequestInput,
  SendRequestResult,
  SupplierRequestStatus,
  generateRequestNumber,
} from '../types';

type SendStep = 'idle' | 'preparing' | 'sending' | 'success' | 'error';

interface UseSupplierRequestReturn {
  // State
  currentRequest: PlanningRequest | null;
  sendStep: SendStep;
  progress: number;
  error: string | null;

  // Actions
  sendRequest: (input: SendRequestInput) => Promise<SendRequestResult>;
  resetState: () => void;
}

// Simulate API call delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSupplierRequest(
  suppliers: Supplier[]
): UseSupplierRequestReturn {
  const [currentRequest, setCurrentRequest] = useState<PlanningRequest | null>(null);
  const [sendStep, setSendStep] = useState<SendStep>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = useCallback(
    async (input: SendRequestInput): Promise<SendRequestResult> => {
      const supplier = suppliers.find((s) => s.id === input.supplierId);
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }

      try {
        // Reset state
        setError(null);
        setSendStep('preparing');
        setProgress(0);

        // Create request object
        const requestNumber = generateRequestNumber();
        const request: PlanningRequest = {
          id: `req-${Date.now()}`,
          requestNumber,
          ticketId: input.ticketId,
          ticketNumber: `TKT-${input.ticketId}`,
          approvalId: `apr-${input.ticketId}`,
          season: 'SS26',
          brand: 'REX',
          totalUnits: input.items.reduce((sum, item) => sum + item.units, 0),
          totalValue: input.items.reduce((sum, item) => sum + item.totalValue, 0),
          supplier,
          items: input.items,
          status: 'pending' as SupplierRequestStatus,
          method: supplier.method,
          createdAt: new Date(),
        };

        setCurrentRequest(request);
        setProgress(20);

        // Simulate preparing files
        await delay(800);
        setProgress(40);

        // Start sending
        setSendStep('sending');
        setProgress(60);

        // Simulate sending based on method
        if (supplier.method === 'email') {
          // Simulate email sending
          await delay(1500);
          setProgress(80);
          await delay(500);
        } else if (supplier.method === 'api') {
          // Simulate API call
          await delay(2000);
          setProgress(90);

          // Simulate occasional API failure (10% chance)
          if (Math.random() < 0.1) {
            throw new Error('API connection timeout');
          }
        } else {
          // Manual - just prepare files
          await delay(500);
        }

        // Success
        setProgress(100);
        setSendStep('success');

        const updatedRequest: PlanningRequest = {
          ...request,
          status: supplier.method === 'manual' ? 'pending' : 'sent',
          sentAt: supplier.method !== 'manual' ? new Date() : undefined,
        };
        setCurrentRequest(updatedRequest);

        // TODO: Save to backend
        // await api.planningRequests.create(updatedRequest);

        return {
          success: true,
          requestId: request.id,
          requestNumber: request.requestNumber,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setSendStep('error');

        if (currentRequest) {
          setCurrentRequest({
            ...currentRequest,
            status: 'failed',
          });
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [suppliers, currentRequest]
  );

  const resetState = useCallback(() => {
    setCurrentRequest(null);
    setSendStep('idle');
    setProgress(0);
    setError(null);
  }, []);

  return {
    currentRequest,
    sendStep,
    progress,
    error,
    sendRequest,
    resetState,
  };
}

export default useSupplierRequest;
