'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  imageOptimization,
  type ProcessedImage,
  type OptimizationOptions,
  type ImageVariant,
  IMAGE_VARIANTS,
  getQualityLabel,
} from './image-optimization';

// ============================================================
// useImageOptimization Hook
// ============================================================

export interface UseImageOptimizationOptions extends OptimizationOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: ProcessedImage) => void;
}

export interface UseImageOptimizationReturn {
  isProcessing: boolean;
  progress: number;
  error: Error | null;
  result: ProcessedImage | null;
  processImage: (file: File) => Promise<ProcessedImage | null>;
  reset: () => void;
}

/**
 * useImageOptimization - Hook for processing images with optimization
 */
export function useImageOptimization(
  options: UseImageOptimizationOptions = {}
): UseImageOptimizationReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);

  const processImage = useCallback(
    async (file: File): Promise<ProcessedImage | null> => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        // Simulate progress for user feedback
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        options.onProgress?.(10);

        const processed = await imageOptimization.processImage(file, options);

        clearInterval(progressInterval);
        setProgress(100);

        setResult(processed);
        options.onSuccess?.(processed);

        return processed;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Processing failed');
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    isProcessing,
    progress,
    error,
    result,
    processImage,
    reset,
  };
}

// ============================================================
// useBatchImageOptimization Hook
// ============================================================

export interface BatchProcessResult {
  file: File;
  result: ProcessedImage | null;
  error: Error | null;
}

export interface UseBatchImageOptimizationReturn {
  isProcessing: boolean;
  progress: number;
  completed: number;
  total: number;
  results: BatchProcessResult[];
  processBatch: (files: File[]) => Promise<BatchProcessResult[]>;
  reset: () => void;
}

/**
 * useBatchImageOptimization - Hook for processing multiple images
 */
export function useBatchImageOptimization(
  options: UseImageOptimizationOptions = {}
): UseBatchImageOptimizationReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<BatchProcessResult[]>([]);

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const processBatch = useCallback(
    async (files: File[]): Promise<BatchProcessResult[]> => {
      setIsProcessing(true);
      setCompleted(0);
      setTotal(files.length);
      setResults([]);

      const batchResults: BatchProcessResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await imageOptimization.processImage(file, options);
          batchResults.push({ file, result, error: null });
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Processing failed');
          batchResults.push({ file, result: null, error });
        }
        setCompleted(i + 1);
        setResults([...batchResults]);
      }

      setIsProcessing(false);
      return batchResults;
    },
    [options]
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setCompleted(0);
    setTotal(0);
    setResults([]);
  }, []);

  return {
    isProcessing,
    progress,
    completed,
    total,
    results,
    processBatch,
    reset,
  };
}

// ============================================================
// useImagePreview Hook
// ============================================================

export interface UseImagePreviewReturn {
  previewUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  loadPreview: (file: File) => void;
  clearPreview: () => void;
}

/**
 * useImagePreview - Hook for generating image preview URLs
 */
export function useImagePreview(): UseImagePreviewReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPreview = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    // Revoke previous URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create preview'));
    } finally {
      setIsLoading(false);
    }
  }, [previewUrl]);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
  }, [previewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    previewUrl,
    isLoading,
    error,
    loadPreview,
    clearPreview,
  };
}

// ============================================================
// useImageQuality Hook
// ============================================================

export interface ImageQualityInfo {
  score: number;
  label: string;
  labelVi: string;
  color: string;
  isAcceptable: boolean;
  recommendations: string[];
}

export interface UseImageQualityReturn {
  quality: ImageQualityInfo | null;
  isAnalyzing: boolean;
  analyzeQuality: (file: File) => Promise<ImageQualityInfo>;
}

/**
 * useImageQuality - Hook for analyzing image quality
 */
export function useImageQuality(): UseImageQualityReturn {
  const [quality, setQuality] = useState<ImageQualityInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeQuality = useCallback(async (file: File): Promise<ImageQualityInfo> => {
    setIsAnalyzing(true);

    try {
      // Read file as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Get dimensions
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });

      // Calculate quality score
      const score = await imageOptimization['calculateQualityScore'](
        dataUrl,
        dimensions.width,
        dimensions.height
      );

      const { label, labelVi, color } = getQualityLabel(score);

      // Generate recommendations
      const recommendations: string[] = [];
      if (dimensions.width < 800) {
        recommendations.push('Tăng chiều rộng ảnh lên ít nhất 800px');
      }
      if (dimensions.height < 1000) {
        recommendations.push('Tăng chiều cao ảnh lên ít nhất 1000px');
      }
      const aspectRatio = dimensions.width / dimensions.height;
      if (Math.abs(aspectRatio - 0.75) > 0.1) {
        recommendations.push('Điều chỉnh tỷ lệ ảnh về gần 3:4 (chiều rộng : chiều cao)');
      }
      if (file.size > 10 * 1024 * 1024) {
        recommendations.push('Giảm kích thước file xuống dưới 10MB');
      }

      const info: ImageQualityInfo = {
        score,
        label,
        labelVi,
        color,
        isAcceptable: score >= 50,
        recommendations,
      };

      setQuality(info);
      return info;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    quality,
    isAnalyzing,
    analyzeQuality,
  };
}

// ============================================================
// useColorExtraction Hook
// ============================================================

export interface ColorExtractionResult {
  dominantColor: string | null;
  palette: string[];
}

export interface UseColorExtractionReturn {
  colors: ColorExtractionResult | null;
  isExtracting: boolean;
  extractColors: (file: File) => Promise<ColorExtractionResult>;
}

/**
 * useColorExtraction - Hook for extracting colors from images
 */
export function useColorExtraction(): UseColorExtractionReturn {
  const [colors, setColors] = useState<ColorExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractColors = useCallback(async (file: File): Promise<ColorExtractionResult> => {
    setIsExtracting(true);

    try {
      // Read file as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Extract colors
      const { dominantColor, colorPalette } = await imageOptimization['extractColors'](dataUrl);

      const result: ColorExtractionResult = {
        dominantColor: dominantColor || null,
        palette: colorPalette || [],
      };

      setColors(result);
      return result;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    colors,
    isExtracting,
    extractColors,
  };
}
