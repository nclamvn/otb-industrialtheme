'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Play,
} from 'lucide-react';
import { ImportPreview } from './import-preview';
import { ValidationSummary } from './validation-summary';
import { ParseResult, ParsedSKU, ParseError } from '@/lib/excel';

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'validation' | 'complete';

interface ExcelImporterProps {
  onImport: (data: ParsedSKU[]) => Promise<void>;
  onDownloadTemplate?: () => void;
  categories?: { id: string; code: string; name: string }[];
  maxFileSize?: number; // in MB
  className?: string;
}

export function ExcelImporter({
  onImport,
  onDownloadTemplate,
  categories = [],
  maxFileSize = 10,
  className,
}: ExcelImporterProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [editedData, setEditedData] = useState<ParsedSKU[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    []
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx')) {
        setErrors([
          {
            row: 0,
            column: '',
            message: 'Invalid file type. Please upload an Excel file (.xlsx)',
            severity: 'error',
          },
        ]);
        return;
      }

      // Validate file size
      if (selectedFile.size > maxFileSize * 1024 * 1024) {
        setErrors([
          {
            row: 0,
            column: '',
            message: `File size exceeds ${maxFileSize}MB limit`,
            severity: 'error',
          },
        ]);
        return;
      }

      setFile(selectedFile);
      setErrors([]);
      setIsLoading(true);

      try {
        // Read and parse file
        const buffer = await selectedFile.arrayBuffer();
        const { parseExcelFile } = await import('@/lib/excel');
        const result = parseExcelFile(buffer);

        setParseResult(result);
        setEditedData(result.data);
        setErrors(result.errors);

        if (result.success || result.data.length > 0) {
          setStep('preview');
        }
      } catch (error) {
        setErrors([
          {
            row: 0,
            column: '',
            message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [maxFileSize]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle data edit
  const handleDataEdit = useCallback((index: number, field: keyof ParsedSKU, value: unknown) => {
    setEditedData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  // Handle row delete
  const handleRowDelete = useCallback((index: number) => {
    setEditedData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onImport(editedData);

      clearInterval(progressInterval);
      setImportProgress(100);
      setStep('complete');
    } catch (error) {
      setErrors([
        {
          row: 0,
          column: '',
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        },
      ]);
    } finally {
      setIsImporting(false);
    }
  }, [editedData, onImport]);

  // Reset importer
  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setEditedData([]);
    setErrors([]);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Get step status
  const getStepStatus = (targetStep: ImportStep) => {
    const stepOrder: ImportStep[] = ['upload', 'mapping', 'preview', 'validation', 'complete'];
    const currentIndex = stepOrder.indexOf(step);
    const targetIndex = stepOrder.indexOf(targetStep);

    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel Import
            </CardTitle>
            <CardDescription>
              Upload and import SKU data from Excel files
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onDownloadTemplate && (
              <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            )}
            {step !== 'upload' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {(['upload', 'preview', 'complete'] as ImportStep[]).map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  getStepStatus(s) === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : getStepStatus(s) === 'current'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {getStepStatus(s) === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm',
                  getStepStatus(s) === 'current' ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview & Validate' : 'Complete'}
              </span>
              {index < 2 && <div className="w-12 h-px bg-border mx-4" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Upload Step */}
        {step === 'upload' && (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              'hover:border-primary hover:bg-primary/5'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isLoading ? (
              <div className="space-y-4">
                <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Parsing file...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop your Excel file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (max {maxFileSize}MB, .xlsx format)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </>
            )}
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && parseResult && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {parseResult.summary.totalRows} rows • {(file?.size || 0 / 1024).toFixed(1)}KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                  <p className="text-2xl font-bold">{parseResult.summary.totalRows}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Parsed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {editedData.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {editedData.reduce((sum, item) => sum + item.orderQuantity, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${editedData.reduce((sum, item) => sum + item.orderQuantity * item.retailPrice, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Preview and Validation */}
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Data Preview
                </TabsTrigger>
                <TabsTrigger value="validation" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issues ({errors.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <ImportPreview
                  data={editedData}
                  onEdit={handleDataEdit}
                  onDelete={handleRowDelete}
                  categories={categories}
                />
              </TabsContent>

              <TabsContent value="validation" className="mt-4">
                <ValidationSummary
                  errors={errors}
                  onFixError={(row, field) => {
                    // Scroll to row in preview
                    console.log('Fix error at row:', row, 'field:', field);
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || editedData.length === 0}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Import {editedData.length} SKUs
                  </>
                )}
              </Button>
            </div>

            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Importing... {importProgress}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Successfully imported {editedData.length} SKUs
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {step === 'upload' && errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Upload Error</span>
            </div>
            <ul className="mt-2 text-sm text-red-700">
              {errors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
