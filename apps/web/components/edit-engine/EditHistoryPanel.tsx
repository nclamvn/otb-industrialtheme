'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Check,
  X,
  Clock,
  ArrowRight,
  Undo2,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EditHistoryItem {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  fieldLabel?: string;
  oldValue?: string;
  newValue?: string;
  varianceAmount?: number;
  variancePct?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
  requiresApproval: boolean;
  editReason?: string;
  editSource: string;
  editedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  approvedBy?: { id: string; name: string };
  approvedAt?: string;
  rejectedBy?: { id: string; name: string };
  rejectedAt?: string;
  rejectionReason?: string;
}

interface EditHistoryPanelProps {
  entityType?: string;
  entityId?: string;
  title?: string;
  onApprove?: (editId: string) => Promise<void>;
  onReject?: (editId: string, reason: string) => Promise<void>;
  onUndo?: (editId: string) => Promise<void>;
  canApprove?: boolean;
  className?: string;
}

export function EditHistoryPanel({
  entityType,
  entityId,
  title = 'Edit History',
  onApprove,
  onReject,
  onUndo,
  canApprove = false,
  className,
}: EditHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'time' | 'field' | 'user'>('time');

  // Fetch history
  const fetchHistory = async () => {
    if (!entityType && !entityId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/edit-engine/history?${params.toString()}`);
      const data = await res.json();
      setHistory(data.data || []);
    } catch (error) {
      console.error('Failed to fetch edit history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, entityType, entityId, statusFilter]);

  // Group history items
  const groupedHistory = React.useMemo(() => {
    if (groupBy === 'field') {
      const groups: Record<string, EditHistoryItem[]> = {};
      history.forEach((item) => {
        const key = item.fieldLabel || item.fieldName;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return groups;
    }

    if (groupBy === 'user') {
      const groups: Record<string, EditHistoryItem[]> = {};
      history.forEach((item) => {
        const key = item.editedBy.name;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return groups;
    }

    // Group by date (default)
    const groups: Record<string, EditHistoryItem[]> = {};
    history.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString('vi-VN');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [history, groupBy]);

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    AUTO_APPROVED: 'bg-blue-100 text-blue-800',
  };

  const statusIcons = {
    PENDING: Clock,
    APPROVED: Check,
    REJECTED: X,
    AUTO_APPROVED: Check,
  };

  const renderHistoryItem = (item: EditHistoryItem) => {
    const StatusIcon = statusIcons[item.status];
    const isApproved = item.status === 'APPROVED' || item.status === 'AUTO_APPROVED';

    return (
      <div
        key={item.id}
        className={cn(
          'p-3 rounded-lg border bg-card transition-colors hover:bg-muted/50',
          item.status === 'PENDING' && 'border-yellow-200',
          item.status === 'REJECTED' && 'border-red-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', statusColors[item.status])}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {item.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>
          {item.editSource !== 'manual' && (
            <Badge variant="outline" className="text-xs">
              {item.editSource}
            </Badge>
          )}
        </div>

        {/* Field & Value Change */}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {item.fieldLabel || item.fieldName}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground line-through">
              {item.oldValue || '-'}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium">{item.newValue || '-'}</span>
            {item.variancePct && Math.abs(item.variancePct) >= 1 && (
              <span
                className={cn(
                  'text-xs',
                  item.variancePct > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                ({item.variancePct > 0 && '+'}
                {item.variancePct.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* Reason */}
        {item.editReason && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            "{item.editReason}"
          </p>
        )}

        {/* User Info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {item.editedBy.name}
          </div>
          {item.approvedBy && (
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
              {item.approvedBy.name}
            </div>
          )}
          {item.rejectedBy && (
            <div className="flex items-center gap-1">
              <X className="w-3 h-3 text-red-600" />
              {item.rejectedBy.name}
              {item.rejectionReason && `: ${item.rejectionReason}`}
            </div>
          )}
        </div>

        {/* Actions */}
        {item.status === 'PENDING' && canApprove && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onApprove?.(item.id)}
            >
              <Check className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => {
                const reason = prompt('Rejection reason:');
                if (reason) onReject?.(item.id, reason);
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {isApproved && onUndo && (
          <div className="mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => onUndo(item.id)}
            >
              <Undo2 className="w-3 h-3 mr-1" />
              Undo This Change
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <History className="w-4 h-4 mr-2" />
          {title}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {title}
          </SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="flex gap-2 mt-4 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="AUTO_APPROVED">Auto-approved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">By Date</SelectItem>
              <SelectItem value="field">By Field</SelectItem>
              <SelectItem value="user">By User</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchHistory}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* History List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No edit history found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([groupKey, items]) => (
                <div key={groupKey}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    {groupBy === 'time' && <Calendar className="w-4 h-4" />}
                    {groupBy === 'user' && <User className="w-4 h-4" />}
                    {groupKey}
                    <Badge variant="secondary" className="ml-auto">
                      {items.length}
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {items.map(renderHistoryItem)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Export Button */}
        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
