'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History,
  Search,
  Download,
  Eye,
  Plus,
  Edit,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Demo audit log data
const auditLogs = [
  {
    id: '1',
    tableName: 'budget_allocations',
    recordId: 'budget-001',
    action: 'CREATE',
    changedFields: ['totalBudget', 'seasonId', 'brandId'],
    oldValue: null,
    newValue: {
      totalBudget: 5000000,
      seasonId: 'ss25',
      brandId: 'nike',
      status: 'DRAFT',
    },
    userId: 'user-001',
    userEmail: 'planner@dafc.com',
    userName: 'OTB Planner',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    tableName: 'budget_allocations',
    recordId: 'budget-001',
    action: 'UPDATE',
    changedFields: ['totalBudget', 'status'],
    oldValue: {
      totalBudget: 5000000,
      status: 'DRAFT',
    },
    newValue: {
      totalBudget: 5500000,
      status: 'SUBMITTED',
    },
    userId: 'user-001',
    userEmail: 'planner@dafc.com',
    userName: 'OTB Planner',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    tableName: 'otb_plans',
    recordId: 'otb-001',
    action: 'CREATE',
    changedFields: ['budgetId', 'seasonId', 'brandId', 'versionType'],
    oldValue: null,
    newValue: {
      budgetId: 'budget-001',
      seasonId: 'ss25',
      brandId: 'nike',
      versionType: 'V0_SYSTEM',
      status: 'DRAFT',
    },
    userId: 'system',
    userEmail: 'system@dafc.com',
    userName: 'System',
    ipAddress: '127.0.0.1',
    userAgent: 'System Process',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: '4',
    tableName: 'budget_allocations',
    recordId: 'budget-001',
    action: 'UPDATE',
    changedFields: ['status', 'approvedById', 'approvedAt'],
    oldValue: {
      status: 'SUBMITTED',
      approvedById: null,
      approvedAt: null,
    },
    newValue: {
      status: 'APPROVED',
      approvedById: 'user-002',
      approvedAt: new Date().toISOString(),
    },
    userId: 'user-002',
    userEmail: 'manager@dafc.com',
    userName: 'Brand Manager',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: '5',
    tableName: 'sku_items',
    recordId: 'sku-batch-001',
    action: 'BULK_CREATE',
    changedFields: ['count'],
    oldValue: null,
    newValue: {
      count: 156,
      proposalId: 'prop-001',
    },
    userId: 'user-001',
    userEmail: 'planner@dafc.com',
    userName: 'OTB Planner',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
];

const actionIcons = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  BULK_CREATE: Plus,
  BULK_UPDATE: Edit,
  BULK_DELETE: Trash2,
};

const actionColors = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  BULK_CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  BULK_UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BULK_DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const tableNameLabels: Record<string, string> = {
  budget_allocations: 'Budgets',
  otb_plans: 'OTB Plans',
  otb_line_items: 'OTB Line Items',
  sku_proposals: 'SKU Proposals',
  sku_items: 'SKU Items',
  users: 'Users',
  workflows: 'Workflows',
  workflow_steps: 'Workflow Steps',
};

interface AuditLogDetailProps {
  log: typeof auditLogs[0];
  open: boolean;
  onClose: () => void;
}

function AuditLogDetail({ log, open, onClose }: AuditLogDetailProps) {
  const tCommon = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tCommon('details')}</DialogTitle>
          <DialogDescription>
            {tableNameLabels[log.tableName] || log.tableName} - {log.action}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Record ID</p>
              <p className="text-sm font-mono">{log.recordId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">{format(log.createdAt, 'PPpp')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="text-sm">{log.userName} ({log.userEmail})</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">IP Address</p>
              <p className="text-sm font-mono">{log.ipAddress}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Changed Fields</p>
            <div className="flex flex-wrap gap-2">
              {log.changedFields.map((field) => (
                <Badge key={field} variant="outline">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          <Tabs defaultValue="new" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1">New Value</TabsTrigger>
              <TabsTrigger value="old" className="flex-1">Old Value</TabsTrigger>
              <TabsTrigger value="diff" className="flex-1">Diff</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <pre className="text-xs">
                  {JSON.stringify(log.newValue, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="old">
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <pre className="text-xs">
                  {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : 'N/A (New Record)'}
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="diff">
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {log.oldValue && log.newValue ? (
                  <div className="space-y-2 text-xs">
                    {log.changedFields.map((field) => {
                      const oldVal = (log.oldValue as Record<string, unknown>)?.[field];
                      const newVal = (log.newValue as Record<string, unknown>)?.[field];
                      return (
                        <div key={field} className="border-b pb-2">
                          <p className="font-medium">{field}</p>
                          <p className="text-red-600">- {JSON.stringify(oldVal)}</p>
                          <p className="text-green-600">+ {JSON.stringify(newVal)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No previous value (new record)</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">User Agent</p>
            <p className="text-xs text-muted-foreground truncate">{log.userAgent}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditTrailPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedLog, setSelectedLog] = useState<typeof auditLogs[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const tCommon = useTranslations('common');
  const tTable = useTranslations('table');
  const tSearch = useTranslations('search');

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    if (selectedTable !== 'all' && log.tableName !== selectedTable) return false;
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.recordId.toLowerCase().includes(query) ||
        log.userEmail.toLowerCase().includes(query) ||
        log.userName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            {tSearch('auditTrail')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all changes and activities in the system
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <History className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">{auditLogs.length}</div>
            <p className="text-sm text-muted-foreground mt-1">All recorded activities</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <Plus className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tCommon('create')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-green-600">
              {auditLogs.filter((l) => l.action.includes('CREATE')).length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">New records created</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <Edit className="absolute -bottom-4 -right-4 h-32 w-32 text-amber-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tCommon('update')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-amber-600">
              {auditLogs.filter((l) => l.action.includes('UPDATE')).length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Records modified</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <User className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-purple-600">
              {new Set(auditLogs.map((l) => l.userId)).size}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Unique contributors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={tTable('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={tCommon('all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="budget_allocations">Budgets</SelectItem>
                <SelectItem value="otb_plans">OTB Plans</SelectItem>
                <SelectItem value="sku_proposals">SKU Proposals</SelectItem>
                <SelectItem value="sku_items">SKU Items</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={tCommon('all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="CREATE">{tCommon('create')}</SelectItem>
                <SelectItem value="UPDATE">{tCommon('update')}</SelectItem>
                <SelectItem value="DELETE">{tCommon('delete')}</SelectItem>
                <SelectItem value="BULK_CREATE">Bulk Create</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {tTable('showing')} {paginatedLogs.length} {tTable('of')} {filteredLogs.length} {tTable('entries')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Changed Fields</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || Edit;
                  const actionColor = actionColors[log.action as keyof typeof actionColors];

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(log.createdAt, 'MMM d, HH:mm')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tableNameLabels[log.tableName] || log.tableName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${actionColor}`}>
                          <ActionIcon className="h-3 w-3" />
                          {log.action}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{log.recordId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{log.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.userEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {log.changedFields.slice(0, 3).map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {log.changedFields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{log.changedFields.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {tTable('page')} {currentPage} {tTable('of')} {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {tTable('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {tTable('next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedLog && (
        <AuditLogDetail
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
