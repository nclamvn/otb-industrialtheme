'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Package,
  TrendingUp,
  Clock,
  FileCheck,
  ArrowRight,
  Layers,
  ShoppingBag,
  Tag,
  GitBranch,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface AllocationItem {
  category: string;
  amount: number;
  percentage: number;
  skuCount: number;
}

interface VersionInfo {
  number: number;
  date: string;
  author: string;
  status: 'draft' | 'final';
}

interface OTBPreviewProps {
  planId: string;
  planName: string;
  season: string;
  brand: string;
  totalAllocation: number;
  allocatedToSKUs: number;
  pendingSKUs: number;
  approvedSKUs: number;
  status: 'planning' | 'review' | 'approved' | 'locked';
  allocations: AllocationItem[];
  currentVersion: VersionInfo;
  previousVersions: number;
  lastUpdated: string;
  onViewDetails?: () => void;
  onCompareVersions?: () => void;
  className?: string;
}

export function OTBPreview({
  planId,
  planName,
  season,
  brand,
  totalAllocation,
  allocatedToSKUs,
  pendingSKUs,
  approvedSKUs,
  status,
  allocations,
  currentVersion,
  previousVersions,
  lastUpdated,
  onViewDetails,
  onCompareVersions,
  className,
}: OTBPreviewProps) {
  const allocationPercent = Math.round((allocatedToSKUs / totalAllocation) * 100);
  const unallocated = totalAllocation - allocatedToSKUs;
  const totalSKUs = pendingSKUs + approvedSKUs;
  const approvalPercent = totalSKUs > 0 ? Math.round((approvedSKUs / totalSKUs) * 100) : 0;

  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'approved':
        return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: FileCheck };
      case 'locked':
        return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileCheck };
      case 'review':
        return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Clock };
      default:
        return { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="p-4 space-y-4">
        {/* Plan Info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D7B797]" />
              <h3 className="font-semibold text-lg">{planName}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{season}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{brand}</span>
            </div>
          </div>
          <Badge className={cn('text-xs flex items-center gap-1', statusConfig.color)}>
            <StatusIcon className="w-3 h-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Allocation Summary */}
        <div className="p-3 rounded-lg border bg-gradient-to-r from-[#D7B797]/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total OTB Allocation</span>
            <span className="text-xl font-bold font-mono">
              ${totalAllocation.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Allocated to SKUs</span>
              <span className="font-mono">{allocationPercent}%</span>
            </div>
            <Progress value={allocationPercent} className="h-2" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 border text-center">
            <p className="text-lg font-bold text-[#127749]">{approvedSKUs}</p>
            <p className="text-[10px] text-muted-foreground">Approved SKUs</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border text-center">
            <p className="text-lg font-bold text-yellow-600">{pendingSKUs}</p>
            <p className="text-[10px] text-muted-foreground">Pending SKUs</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border text-center">
            <p className="text-lg font-bold font-mono">${(unallocated / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-muted-foreground">Unallocated</p>
          </div>
        </div>

        {/* SKU Approval Progress */}
        {totalSKUs > 0 && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">SKU Approval Progress</span>
                <span>{approvedSKUs}/{totalSKUs}</span>
              </div>
              <Progress value={approvalPercent} className="h-1.5" />
            </div>
            <span className="text-sm font-semibold text-[#127749]">{approvalPercent}%</span>
          </div>
        )}
      </div>

      {/* Category Allocations */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="w-4 h-4 text-[#D7B797]" />
          Allocation by Category
        </div>
        <div className="space-y-2">
          {allocations.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.skuCount} SKUs
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium">
                  ${item.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Version Info */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <GitBranch className="w-4 h-4 text-[#127749]" />
            Version Info
          </div>
          {previousVersions > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCompareVersions}
              className="text-xs h-7 text-[#127749] hover:text-[#127749]"
            >
              Compare Versions
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="w-10 h-10 rounded-full bg-[#127749]/10 flex items-center justify-center">
            <span className="text-sm font-bold text-[#127749]">v{currentVersion.number}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Version {currentVersion.number}</span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-[9px] h-4',
                  currentVersion.status === 'final'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                )}
              >
                {currentVersion.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentVersion.author} • {currentVersion.date}
            </p>
          </div>
        </div>
        {previousVersions > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            +{previousVersions} previous version{previousVersions > 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdated}
          </span>
          <Button
            size="sm"
            onClick={onViewDetails}
            className="bg-[#127749] hover:bg-[#0d5a36]"
          >
            View OTB Plan
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mock data generator
export function generateMockOTBPreview(): Omit<OTBPreviewProps, 'onViewDetails' | 'onCompareVersions' | 'className'> {
  return {
    planId: 'otb-001',
    planName: 'SS25 Women\'s Collection',
    season: 'Spring/Summer 2025',
    brand: 'Main Brand',
    totalAllocation: 2500000,
    allocatedToSKUs: 1875000,
    pendingSKUs: 24,
    approvedSKUs: 56,
    status: 'review',
    allocations: [
      { category: 'Bags', amount: 750000, percentage: 40, skuCount: 28 },
      { category: 'Shoes', amount: 562500, percentage: 30, skuCount: 22 },
      { category: 'Accessories', amount: 375000, percentage: 20, skuCount: 18 },
      { category: 'RTW', amount: 187500, percentage: 10, skuCount: 12 },
    ],
    currentVersion: {
      number: 3,
      date: 'Jan 28, 2025',
      author: 'Alice Wong',
      status: 'draft',
    },
    previousVersions: 2,
    lastUpdated: '1 hour ago',
  };
}
