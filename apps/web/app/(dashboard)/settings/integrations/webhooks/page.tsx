'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  Webhook,
  Plus,
  Trash2,
  Play,
  Copy,
} from 'lucide-react';

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  isEnabled: boolean;
  secret?: string;
  lastDeliveryAt?: string;
  createdAt: string;
  _count?: {
    deliveries: number;
  };
}

const WEBHOOK_EVENTS = [
  { value: 'budget.created', label: 'Budget Created' },
  { value: 'budget.updated', label: 'Budget Updated' },
  { value: 'budget.deleted', label: 'Budget Deleted' },
  { value: 'otb.created', label: 'OTB Plan Created' },
  { value: 'otb.updated', label: 'OTB Plan Updated' },
  { value: 'otb.approved', label: 'OTB Plan Approved' },
  { value: 'sku.created', label: 'SKU Proposal Created' },
  { value: 'sku.updated', label: 'SKU Proposal Updated' },
  { value: 'sku.approved', label: 'SKU Proposal Approved' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
];

export default function WebhooksSettingsPage() {
  useSession();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch('/api/v1/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setNewWebhookSecret(data.webhook.secret);
        setFormData({ name: '', url: '', events: [] });
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  }

  async function handleToggle(id: string, isEnabled: boolean) {
    try {
      await fetch(`/api/v1/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, isEnabled: !isEnabled } : w)));
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(data.success
        ? `Test successful! Response time: ${data.responseTime}ms`
        : `Test failed: ${data.error}`
      );
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Error testing webhook');
    } finally {
      setTesting(null);
    }
  }

  function toggleEvent(event: string) {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="Configure webhooks for real-time event notifications"
      />

      {/* Secret Display Dialog */}
      {newWebhookSecret && (
        <Dialog open={!!newWebhookSecret} onOpenChange={() => setNewWebhookSecret(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Webhook Created Successfully</DialogTitle>
              <DialogDescription>
                Save this secret - it will only be shown once!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input value={newWebhookSecret} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(newWebhookSecret);
                      alert('Secret copied to clipboard!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use this secret to verify webhook signatures. The signature is sent in the X-Webhook-Signature header.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewWebhookSecret(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Webhook Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Webhook</DialogTitle>
              <DialogDescription>
                Create a new webhook endpoint
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={formData.events.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || !formData.url || formData.events.length === 0}
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Webhooks</CardTitle>
              <CardDescription>Manage webhook endpoints</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading webhooks...</p>
          ) : webhooks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No webhooks configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="font-mono text-sm max-w-[200px] truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{webhook.events.length} events</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={webhook.isEnabled}
                        onCheckedChange={() => handleToggle(webhook.id, webhook.isEnabled)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTest(webhook.id)}
                          disabled={testing === webhook.id || !webhook.isEnabled}
                        >
                          <Play className={`h-4 w-4 ${testing === webhook.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
