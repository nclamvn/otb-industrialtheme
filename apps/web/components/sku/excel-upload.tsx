'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ExcelUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
  acceptedFormats?: string[];
  maxSize?: number;
}

export function ExcelUpload({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  acceptedFormats = ['.xlsx', '.xls'],
  maxSize = 10 * 1024 * 1024, // 10MB
}: ExcelUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.message.includes('larger than')) {
          setError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        } else {
          setError('Invalid file type. Please upload an Excel file (.xlsx)');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    [maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize,
    multiple: false,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch {
      setError('Failed to upload file');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          error && 'border-destructive',
          isUploading && 'cursor-not-allowed opacity-50',
          !isDragActive && !error && 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <>
              <Upload className="h-12 w-12 text-primary animate-bounce" />
              <p className="text-lg font-medium">Drop the file here...</p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">
                  Drag & drop your Excel file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: {acceptedFormats.join(', ')} (max{' '}
                {maxSize / 1024 / 1024}MB)
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !isUploading && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  );
}

interface UploadResultProps {
  success: boolean;
  itemsCreated?: number;
  warnings?: string[];
  onClose: () => void;
}

export function UploadResult({
  success,
  itemsCreated,
  warnings,
  onClose,
}: UploadResultProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg',
        success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      )}
    >
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={cn('font-medium', success ? 'text-green-800' : 'text-red-800')}>
            {success ? 'Upload Successful' : 'Upload Failed'}
          </p>
          {itemsCreated !== undefined && (
            <p className="text-sm text-green-700 mt-1">
              {itemsCreated} SKU items imported successfully
            </p>
          )}
          {warnings && warnings.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-yellow-700">Warnings:</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside mt-1">
                {warnings.slice(0, 5).map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
                {warnings.length > 5 && (
                  <li>...and {warnings.length - 5} more warnings</li>
                )}
              </ul>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
