'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface MediaUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  skuItemId?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string[];
  className?: string;
}

export function MediaUploader({
  onUpload,
  skuItemId,
  maxFiles = 10,
  maxSize = 20,
  accept = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const errors = rejection.errors.map((e) => e.message).join(', ');
        console.error(`File rejected: ${rejection.file.name} - ${errors}`);
      });

      // Add accepted files to state
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
      maxSize: maxSize * 1024 * 1024,
      maxFiles,
      multiple: true,
    });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);

    // Update all files to uploading status
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: 'uploading' as const,
        progress: 0,
      }))
    );

    try {
      const filesToUpload = files.map((f) => f.file);
      await onUpload(filesToUpload);

      // Mark all as success
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'success' as const,
          progress: 100,
        }))
      );

      // Clear after short delay
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          error: 'Upload failed',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          isDragActive && !isDragReject && 'border-[#127749] bg-[#127749]/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isDragActive && !isDragReject && 'bg-[#127749]/10',
              isDragReject && 'bg-destructive/10',
              !isDragActive && 'bg-muted'
            )}
          >
            {isDragReject ? (
              <AlertCircle className="w-6 h-6 text-destructive" />
            ) : (
              <Upload
                className={cn(
                  'w-6 h-6',
                  isDragActive ? 'text-[#127749]' : 'text-muted-foreground'
                )}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragActive
                ? isDragReject
                  ? 'File type not accepted'
                  : 'Drop images here'
                : 'Drag & drop images here, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP, GIF up to {maxSize}MB each (max {maxFiles} files)
            </p>
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isUploading}
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                {file.status !== 'pending' && (
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center',
                      file.status === 'uploading' && 'bg-black/40',
                      file.status === 'success' && 'bg-[#127749]/40',
                      file.status === 'error' && 'bg-destructive/40'
                    )}
                  >
                    {file.status === 'uploading' && (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="w-6 h-6 text-white" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                )}

                {/* Remove Button */}
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <Progress
                    value={file.progress}
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-none"
                  />
                )}

                {/* File Name */}
                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60">
                  <p className="text-[9px] text-white truncate">
                    {file.file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              className="bg-[#127749] hover:bg-[#127749]/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Upload {files.length} Image{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
