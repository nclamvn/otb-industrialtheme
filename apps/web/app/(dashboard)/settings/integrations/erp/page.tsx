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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Database,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
} from 'lucide-react';

interface ERPConnection {
  id: string;
  name: string;
  type: string;
  host: string;
  port?: number;
  database?: string;
  syncDirection: string;
  isEnabled: boolean;
  lastSyncAt?: string;
  createdAt: string;
  _count?: {
    syncLogs: number;
    fieldMappings: number;
  };
}

export default function ERPSettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [connections, setConnections] = useState<ERPConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'CSV',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    syncDirection: 'BIDIRECTIONAL',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchConnections();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function fetchConnections() {
    try {
      const res = await fetch('/api/v1/integrations/erp');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/v1/integrations/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          port: formData.port ? parseInt(formData.port) : undefined,
        }),
      });

      if (res.ok) {
        setShowAddDialog(false);
        setFormData({
          name: '',
          type: 'CSV',
          host: '',
          port: '',
          database: '',
          username: '',
          password: '',
          syncDirection: 'BIDIRECTIONAL',
        });
        fetchConnections();
      }
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this ERP connection?')) return;

    try {
      const res = await fetch(`/api/v1/integrations/erp/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConnections(connections.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  }

  async function handleTestConnection(id: string) {
    setSyncing(id);
    try {
      const res = await fetch(`/api/v1/integrations/erp/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      alert(data.success ? 'Connection successful!' : `Connection failed: ${data.error || data.message}`);
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error testing connection');
    } finally {
      setSyncing(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ERP Integration"
          description="Connect to enterprise resource planning systems"
        />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only administrators can configure ERP integrations. Contact your system administrator for assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ERP Integration"
        description="Connect to SAP, Oracle, or other ERP systems"
      />

      {/* Add Connection Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add ERP Connection</DialogTitle>
              <DialogDescription>
                Configure a new ERP system connection
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My ERP Connection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">ERP Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAP">SAP</SelectItem>
                    <SelectItem value="ORACLE">Oracle</SelectItem>
                    <SelectItem value="DYNAMICS">Microsoft Dynamics</SelectItem>
                    <SelectItem value="NETSUITE">NetSuite</SelectItem>
                    <SelectItem value="CSV">CSV Import/Export</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host / File Path</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="localhost or /path/to/files"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    placeholder="3306"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input
                    id="database"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="erp_db"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="syncDirection">Sync Direction</Label>
                <Select
                  value={formData.syncDirection}
                  onValueChange={(value) => setFormData({ ...formData, syncDirection: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INBOUND">Inbound Only (Import)</SelectItem>
                    <SelectItem value="OUTBOUND">Outbound Only (Export)</SelectItem>
                    <SelectItem value="BIDIRECTIONAL">Bidirectional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.host}>
                Create Connection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connections List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">ERP Connections</CardTitle>
              <CardDescription>Manage your ERP system connections</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading connections...</p>
          ) : connections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No ERP connections configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => (
                  <TableRow key={conn.id}>
                    <TableCell className="font-medium">{conn.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{conn.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{conn.host}</TableCell>
                    <TableCell>{conn.syncDirection}</TableCell>
                    <TableCell>
                      {conn.isEnabled ? (
                        <Badge variant="default">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTestConnection(conn.id)}
                          disabled={syncing === conn.id}
                        >
                          {syncing === conn.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(conn.id)}
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
