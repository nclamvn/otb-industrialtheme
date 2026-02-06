'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import { Calendar, Filter, User, Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { TimelineItem, Activity, ActivityAction } from './TimelineItem';

interface ActivityFilter {
  userId?: string;
  actionType?: ActivityAction;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface ActivityTimelineProps {
  activities: Activity[];
  users?: { id: string; name: string }[];
  showFilters?: boolean;
  groupByDate?: boolean;
  maxHeight?: string;
  compact?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
}

const actionTypeOptions: { value: ActivityAction; label: string }[] = [
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'commented', label: 'Commented' },
  { value: 'versioned', label: 'Versioned' },
  { value: 'uploaded', label: 'Uploaded' },
];

const entityTypeOptions = [
  { value: 'budget', label: 'Budget' },
  { value: 'otb', label: 'OTB Plan' },
  { value: 'sku', label: 'SKU' },
  { value: 'approval', label: 'Approval' },
];

export function ActivityTimeline({
  activities,
  users = [],
  showFilters = true,
  groupByDate = true,
  maxHeight = '600px',
  compact = false,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className,
}: ActivityTimelineProps) {
  const [filters, setFilters] = useState<ActivityFilter>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only using dynamic date labels after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply filters
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filters.userId && activity.user.id !== filters.userId) return false;
      if (filters.actionType && activity.action !== filters.actionType) return false;
      if (filters.entityType && activity.entity.type !== filters.entityType) return false;
      if (dateRange.from && activity.timestamp < startOfDay(dateRange.from)) return false;
      if (dateRange.to && activity.timestamp > new Date(dateRange.to.setHours(23, 59, 59))) return false;
      return true;
    });
  }, [activities, filters, dateRange]);

  // Group by date - only use "Today"/"Yesterday" labels after client mount to prevent hydration mismatch
  const groupedActivities = useMemo(() => {
    if (!groupByDate) {
      return [{ date: null, activities: filteredActivities }];
    }

    const groups: Map<string, Activity[]> = new Map();

    filteredActivities.forEach((activity) => {
      let dateKey: string;
      // Only use dynamic "Today"/"Yesterday" after mount to prevent hydration mismatch
      if (isMounted && isToday(activity.timestamp)) {
        dateKey = 'Today';
      } else if (isMounted && isYesterday(activity.timestamp)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(activity.timestamp, 'MMMM d, yyyy');
      }

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(activity);
    });

    return Array.from(groups.entries()).map(([date, acts]) => ({
      date,
      activities: acts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }));
  }, [filteredActivities, groupByDate, isMounted]);

  const hasActiveFilters = filters.userId || filters.actionType || filters.entityType || dateRange.from;

  const clearFilters = () => {
    setFilters({});
    setDateRange({});
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-muted/30">
          <Filter className="w-4 h-4 text-muted-foreground" />

          {/* User filter */}
          {users.length > 0 && (
            <Select
              value={filters.userId || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, userId: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <User className="w-3 h-3 mr-1" />
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Action type filter */}
          <Select
            value={filters.actionType || 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                actionType: value === 'all' ? undefined : (value as ActivityAction),
              }))
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actionTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Entity type filter */}
          <Select
            value={filters.entityType || 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, entityType: value === 'all' ? undefined : value }))
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Layers className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {entityTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Calendar className="w-3 h-3" />
                {dateRange.from
                  ? dateRange.to
                    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                    : format(dateRange.from, 'MMM d')
                  : 'Date range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}

          {/* Results count */}
          <div className="ml-auto">
            <Badge variant="secondary" className="text-[10px]">
              {filteredActivities.length} activities
            </Badge>
          </div>
        </div>
      )}

      {/* Timeline */}
      <ScrollArea style={{ maxHeight }}>
        <div className="p-4">
          {groupedActivities.length === 0 || filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No activities found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            groupedActivities.map((group, groupIdx) => (
              <div key={group.date || groupIdx}>
                {/* Date header */}
                {group.date && (
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-2 z-10">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal bg-background"
                    >
                      {group.date}
                    </Badge>
                  </div>
                )}

                {/* Activities */}
                <div className="space-y-0">
                  {group.activities.map((activity, idx) => (
                    <TimelineItem
                      key={activity.id}
                      activity={activity}
                      showConnector
                      isLast={idx === group.activities.length - 1}
                      compact={compact}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Load more */}
          {hasMore && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Mock data generator
export function generateMockActivities(count: number = 10): Activity[] {
  const users = [
    { id: 'u1', name: 'John Smith', avatar: undefined },
    { id: 'u2', name: 'Alice Wong', avatar: undefined },
    { id: 'u3', name: 'Bob Lee', avatar: undefined },
  ];

  const entities = [
    { type: 'budget' as const, id: 'b1', name: 'SS25 Main Budget', link: '/budgets/b1' },
    { type: 'otb' as const, id: 'o1', name: 'Women\'s Collection OTB', link: '/otb-analysis/o1' },
    { type: 'sku' as const, id: 's1', name: 'Classic Leather Tote', link: '/sku-proposals/s1' },
    { type: 'approval' as const, id: 'a1', name: 'Q1 Budget Approval', link: '/approvals/a1' },
  ];

  const actions: ActivityAction[] = [
    'created', 'updated', 'submitted', 'approved', 'rejected', 'commented', 'versioned'
  ];

  const activities: Activity[] = [];

  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const entity = entities[Math.floor(Math.random() * entities.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const hoursAgo = Math.floor(Math.random() * 72);

    activities.push({
      id: `act-${i}`,
      action,
      user,
      entity,
      timestamp: subDays(new Date(), hoursAgo / 24),
      changes: action === 'updated' ? [
        { field: 'Amount', oldValue: '$1,200,000', newValue: '$1,350,000' },
        { field: 'Status', oldValue: 'Draft', newValue: 'Review' },
      ] : undefined,
      comment: action === 'commented' ? 'Please review the Q2 projections.' : undefined,
    });
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
