'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Cloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HardDrive,
  File,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StoredFile {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  category: string;
  createdAt: string;
}

export default function StorageSettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);

  // S3 configuration status (would come from API in production)
  const s3Configured = !!process.env.NEXT_PUBLIC_S3_CONFIGURED;

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const res = await fetch('/api/v1/integrations/s3/files?limit=10');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/v1/integrations/s3/files?id=${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cloud Storage (S3)"
        description="Manage AWS S3 storage configuration and files"
      />

      {/* S3 Configuration Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Cloud className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AWS S3 Configuration</CardTitle>
              <CardDescription>Storage backend for file uploads</CardDescription>
            </div>
          </div>
          <Badge variant={s3Configured ? 'default' : 'secondary'}>
            {s3Configured ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Configured
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Not Configured
              </>
            )}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s3-bucket">Bucket Name</Label>
                <Input
                  id="s3-bucket"
                  type="password"
                  placeholder="Configure in .env: AWS_S3_BUCKET"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3-region">Region</Label>
                <Input
                  id="s3-region"
                  type="password"
                  placeholder="Configure in .env: AWS_REGION"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3-access-key">Access Key ID</Label>
                <Input
                  id="s3-access-key"
                  type="password"
                  placeholder="Configure in .env: AWS_ACCESS_KEY_ID"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3-secret-key">Secret Access Key</Label>
                <Input
                  id="s3-secret-key"
                  type="password"
                  placeholder="Configure in .env: AWS_SECRET_ACCESS_KEY"
                  disabled
                />
              </div>
            </div>
          )}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Environment Configuration</AlertTitle>
            <AlertDescription>
              S3 credentials are configured via environment variables for security.
              Contact your system administrator to update storage settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Storage Usage</CardTitle>
              <CardDescription>Your file storage usage</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}</span>
              <span>Limit: 100 MB per file</span>
            </div>
            <Progress value={35} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Files</CardTitle>
              <CardDescription>Your recently uploaded files</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading files...</p>
          ) : files.length === 0 ? (
            <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.filename}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
