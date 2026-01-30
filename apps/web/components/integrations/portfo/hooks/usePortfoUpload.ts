'use client';

import { useState, useCallback } from 'react';
import {
  SRDDocument,
  PortfoUploadStatus,
  PortfoUploadStep,
  PORTFO_UPLOAD_STEPS,
  PORTFO_STEP_CONFIG,
} from '../types';

interface UsePortfoUploadOptions {
  onSuccess?: (portfoId: string, portfoUrl: string) => void;
  onError?: (error: string) => void;
}

interface UsePortfoUploadReturn {
  status: PortfoUploadStatus | null;
  isUploading: boolean;
  upload: (
    document: SRDDocument,
    options: { notifyStakeholders: boolean; createBackup: boolean }
  ) => Promise<void>;
  reset: () => void;
}

export function usePortfoUpload(
  options: UsePortfoUploadOptions = {}
): UsePortfoUploadReturn {
  const { onSuccess, onError } = options;
  const [status, setStatus] = useState<PortfoUploadStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const simulateStep = async (
    step: PortfoUploadStep,
    uploadId: string,
    documentId: string
  ) => {
    const config = PORTFO_STEP_CONFIG[step];

    setStatus((prev) => ({
      ...prev!,
      currentStep: step,
      progress: config.progress,
    }));

    // Simulate step duration
    const stepDurations: Record<PortfoUploadStep, number> = {
      validating: 500,
      transforming: 800,
      uploading: 1500,
      verifying: 600,
      backup: 400,
      complete: 0,
    };

    await new Promise((resolve) => setTimeout(resolve, stepDurations[step]));
  };

  const upload = useCallback(
    async (
      document: SRDDocument,
      uploadOptions: { notifyStakeholders: boolean; createBackup: boolean }
    ) => {
      setIsUploading(true);

      const uploadId = `upload-${Date.now()}`;
      const initialStatus: PortfoUploadStatus = {
        id: uploadId,
        status: 'uploading',
        progress: 0,
        currentStep: 'validating',
        documentId: document.id,
        startedAt: new Date(),
      };

      setStatus(initialStatus);

      try {
        // Simulate each step
        for (const step of PORTFO_UPLOAD_STEPS.slice(0, -1)) {
          await simulateStep(step, uploadId, document.id);
        }

        // Generate mock Portfo response
        const portfoId = `PORTFO-${new Date().getFullYear()}-${document.season}-${document.brand}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
        const portfoUrl = `https://portfo.example.com/documents/${portfoId}`;

        // Set success status
        setStatus({
          id: uploadId,
          status: 'success',
          progress: 100,
          currentStep: 'complete',
          documentId: document.id,
          portfoId,
          portfoUrl,
          startedAt: initialStatus.startedAt,
          completedAt: new Date(),
        });

        onSuccess?.(portfoId, portfoUrl);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Upload failed';

        setStatus((prev) => ({
          ...prev!,
          status: 'failed',
          error: errorMessage,
        }));

        onError?.(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setStatus(null);
    setIsUploading(false);
  }, []);

  return {
    status,
    isUploading,
    upload,
    reset,
  };
}

export default usePortfoUpload;
