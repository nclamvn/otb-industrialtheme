'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Calendar,
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rateLimit: number;
  isEnabled: boolean;
  lastUsedAt?: string;
  usageCount: number;
  expiresAt?: string;
  createdAt: string;
}

const API_SCOPES = [
  { value: 'read:budget', label: 'Read Budget Data' },
  { value: 'read:otb', label: 'Read OTB Plans' },
  { value: 'read:sku', label: 'Read SKU Proposals' },
  { value: 'read:analytics', label: 'Read Analytics' },
  { value: 'read:users', label: 'Read Users' },
  { value: 'write:budget', label: 'Write Budget Data' },
  { value: 'write:otb', label: 'Write OTB Plans' },
  { value: 'write:sku', label: 'Write SKU Proposals' },
  { value: 'read:*', label: 'Read All (Wildcard)' },
  { value: 'write:*', label: 'Write All (Wildcard)' },
  { value: '*', label: 'Full Access' },
];

export default function APIKeysPage() {
  useSession();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    scopes: [] as string[],
    rateLimit: 1000,
    expiresAt: '',
  });

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  async function fetchAPIKeys() {
    try {
      const res = await fetch('/api/v1/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewApiKey(data.apiKey.key);
        setShowAddDialog(false);
        setFormData({ name: '', scopes: [], rateLimit: 1000, expiresAt: '' });
        fetchAPIKeys();
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== id));
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  }

  async function handleToggle(id: string, isEnabled: boolean) {
    try {
      await fetch(`/api/v1/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      setApiKeys(apiKeys.map((k) => (k.id === id ? { ...k, isEnabled: !isEnabled } : k)));
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  }

  function toggleScope(scope: string) {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('apiKeys')}
        description="Manage API keys for programmatic access to the platform"
      />

      {/* New API Key Display Dialog */}
      {newApiKey && (
        <Dialog open={!!newApiKey} onOpenChange={() => setNewApiKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tCommon('success')}</DialogTitle>
              <DialogDescription>
                Save this API key - it will only be shown once!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('apiKeys')}</Label>
                <div className="flex gap-2">
                  <Input value={newApiKey} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(newApiKey);
                      alert(tCommon('copied'));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Include this key in your API requests using the Authorization header:
                <code className="block mt-2 p-2 bg-muted rounded text-xs">
                  Authorization: Bearer {newApiKey.slice(0, 12)}...
                </code>
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewApiKey(null)}>{tCommon('close')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add API Key Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {tCommon('create')} {t('apiKeys')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tCommon('create')} {t('apiKeys')}</DialogTitle>
              <DialogDescription>
                Generate a new API key for programmatic access
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{tForms('name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My API Key"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {API_SCOPES.map((scope) => (
                    <div key={scope.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={scope.value}
                        checked={formData.scopes.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                      />
                      <label
                        htmlFor={scope.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {scope.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (req/hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 1000 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || formData.scopes.length === 0}
              >
                {tCommon('create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('apiKeys')}</CardTitle>
              <CardDescription>Manage your API access credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">{tCommon('loading')}</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-sm">{tCommon('noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tForms('name')}</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>{tForms('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell className="font-mono text-sm">{apiKey.prefix}...</TableCell>
                    <TableCell>
                      <Badge variant="outline">{apiKey.scopes.length} scopes</Badge>
                    </TableCell>
                    <TableCell>{apiKey.usageCount.toLocaleString()} requests</TableCell>
                    <TableCell>
                      {apiKey.expiresAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(apiKey.expiresAt)}
                        </span>
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={apiKey.isEnabled}
                        onCheckedChange={() => handleToggle(apiKey.id, apiKey.isEnabled)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(apiKey.id)}
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
