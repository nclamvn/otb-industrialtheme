'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-3: PermissionAuditLog — Permission Change History Display
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PermissionAuditEntry, ROLE_DEFINITIONS, RoleName } from '@/types/permissions';
import {
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Filter,
  Search,
  ChevronDown,
  Clock,
  User,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface PermissionAuditLogProps {
  entries: PermissionAuditEntry[];
  maxHeight?: string;
  showFilters?: boolean;
  className?: string;
}

// ─── Action Config ──────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<
  PermissionAuditEntry['action'],
  { icon: React.ElementType; label: string; color: string }
> = {
  granted: {
    icon: Shield,
    label: 'Cấp quyền',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  },
  revoked: {
    icon: ShieldOff,
    label: 'Thu hồi quyền',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  },
  role_changed: {
    icon: UserCheck,
    label: 'Đổi vai trò',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  },
  access_denied: {
    icon: UserX,
    label: 'Từ chối truy cập',
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  },
  login: {
    icon: LogIn,
    label: 'Đăng nhập',
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  },
  logout: {
    icon: LogOut,
    label: 'Đăng xuất',
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
  },
};

// ─── Permission Audit Log Component ─────────────────────────────────────────────
export function PermissionAuditLog({
  entries,
  maxHeight = '500px',
  showFilters = true,
  className,
}: PermissionAuditLogProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.userName.toLowerCase().includes(q) ||
          e.targetUserName?.toLowerCase().includes(q) ||
          e.permission?.toLowerCase().includes(q)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter((e) => e.action === actionFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (dateFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case '7days':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      result = result.filter((e) => new Date(e.timestamp) >= cutoff);
    }

    // Sort by timestamp descending
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return result;
  }, [entries, search, actionFilter, dateFilter]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, PermissionAuditEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString('vi-VN');
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Nhật ký quyền truy cập
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng, quyền..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Loại hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                {Object.entries(ACTION_CONFIG).map(([action, config]) => (
                  <SelectItem key={action} value={action}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredEntries.length} bản ghi
          {filteredEntries.length !== entries.length && ` / ${entries.length} tổng`}
        </div>

        {/* Log entries */}
        <ScrollArea style={{ maxHeight }}>
          {filteredEntries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Không có bản ghi nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEntries).map(([date, dayEntries]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-background/95 backdrop-blur py-1 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{date}</span>
                  </div>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <AuditLogEntry key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Audit Log Entry Component ──────────────────────────────────────────────────
interface AuditLogEntryProps {
  entry: PermissionAuditEntry;
}

function AuditLogEntry({ entry }: AuditLogEntryProps) {
  const config = ACTION_CONFIG[entry.action];
  const Icon = config.icon;
  const time = new Date(entry.timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className={cn('p-2 rounded-full', config.color)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{entry.userName}</span>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
        </div>

        {/* Action details */}
        <div className="text-sm text-muted-foreground mt-1">
          {entry.action === 'granted' && entry.permission && (
            <span>
              Cấp quyền <code className="px-1 py-0.5 bg-muted rounded">{entry.permission}</code>
              {entry.targetUserName && <span> cho {entry.targetUserName}</span>}
            </span>
          )}
          {entry.action === 'revoked' && entry.permission && (
            <span>
              Thu hồi quyền <code className="px-1 py-0.5 bg-muted rounded">{entry.permission}</code>
              {entry.targetUserName && <span> từ {entry.targetUserName}</span>}
            </span>
          )}
          {entry.action === 'role_changed' && (
            <span>
              Đổi vai trò
              {entry.targetUserName && <span> của {entry.targetUserName}</span>}
              {entry.previousRole && entry.newRole && (
                <span>
                  {' '}
                  từ <RoleBadgeSmall role={entry.previousRole} /> thành{' '}
                  <RoleBadgeSmall role={entry.newRole} />
                </span>
              )}
            </span>
          )}
          {entry.action === 'access_denied' && entry.permission && (
            <span>
              Bị từ chối truy cập{' '}
              <code className="px-1 py-0.5 bg-muted rounded">{entry.permission}</code>
            </span>
          )}
          {entry.action === 'login' && <span>Đăng nhập vào hệ thống</span>}
          {entry.action === 'logout' && <span>Đăng xuất khỏi hệ thống</span>}
        </div>

        {/* Metadata */}
        {(entry.ipAddress || entry.userAgent) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {entry.ipAddress && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {entry.ipAddress}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Địa chỉ IP</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>

      {/* Time */}
      <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
    </div>
  );
}

// ─── Role Badge Small Component ─────────────────────────────────────────────────
function RoleBadgeSmall({ role }: { role: RoleName }) {
  const roleDefinition = ROLE_DEFINITIONS[role];
  return (
    <span
      className="px-1.5 py-0.5 text-xs rounded"
      style={{
        backgroundColor: `${roleDefinition.color}20`,
        color: roleDefinition.color,
      }}
    >
      {roleDefinition.labelVi}
    </span>
  );
}

export default PermissionAuditLog;
