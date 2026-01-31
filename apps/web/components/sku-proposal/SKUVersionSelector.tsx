'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  History,
  ChevronDown,
  Check,
  Star,
  GitCompare,
  Plus,
  RotateCcw,
  Loader2,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export type SKUVersionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CURRENT' | 'FINAL';

export interface SKUVersion {
  id: string;
  versionNumber: number;
  name: string;
  description?: string;
  status: SKUVersionStatus;
  productCount: number;
  totalBudget: number;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
}

interface SKUVersionSelectorProps {
  proposalId: string;
  currentVersion?: SKUVersion;
  versions?: SKUVersion[];
  onVersionChange?: (version: SKUVersion) => void;
  onCreateVersion?: (name: string, description?: string) => Promise<SKUVersion | null>;
  onSetFinal?: (version: SKUVersion) => Promise<boolean>;
  onCompare?: (leftId: string, rightId: string) => void;
  className?: string;
  showFinalButton?: boolean;
}

const STATUS_CONFIG: Record<SKUVersionStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  APPROVED: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100' },
  CURRENT: { label: 'Current', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  FINAL: { label: 'Final', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
};

// Demo data
function generateDemoVersions(): SKUVersion[] {
  const now = new Date();
  return [
    {
      id: 'skuv-1',
      versionNumber: 1,
      name: 'Initial SKU Proposal',
      description: 'System-generated initial proposal',
      status: 'APPROVED',
      productCount: 45,
      totalBudget: 850000,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      createdBy: { id: 'system', name: 'System' },
    },
    {
      id: 'skuv-2',
      versionNumber: 2,
      name: 'Added New Products',
      description: 'Added 10 new products from supplier catalog',
      status: 'APPROVED',
      productCount: 55,
      totalBudget: 920000,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      createdBy: { id: 'u-1', name: 'Business Manager' },
    },
    {
      id: 'skuv-3',
      versionNumber: 3,
      name: 'Budget Optimization',
      description: 'Optimized SKU mix for budget constraints',
      status: 'CURRENT',
      productCount: 52,
      totalBudget: 880000,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdBy: { id: 'u-1', name: 'Business Manager' },
    },
  ];
}

export function SKUVersionSelector({
  proposalId,
  currentVersion: initialCurrentVersion,
  versions: initialVersions,
  onVersionChange,
  onCreateVersion,
  onSetFinal,
  onCompare,
  className,
  showFinalButton = true,
}: SKUVersionSelectorProps) {
  const [versions, setVersions] = useState<SKUVersion[]>(initialVersions || []);
  const [currentVersion, setCurrentVersion] = useState<SKUVersion | undefined>(initialCurrentVersion);
  const [isLoading, setIsLoading] = useState(!initialVersions);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSettingFinal, setIsSettingFinal] = useState(false);

  // Load demo versions if none provided
  useEffect(() => {
    if (!initialVersions) {
      setTimeout(() => {
        const demoVersions = generateDemoVersions();
        setVersions(demoVersions);
        setCurrentVersion(demoVersions.find((v) => v.status === 'CURRENT') || demoVersions[demoVersions.length - 1]);
        setIsLoading(false);
      }, 500);
    }
  }, [initialVersions]);

  const handleVersionSelect = useCallback((version: SKUVersion) => {
    setCurrentVersion(version);
    if (onVersionChange) {
      onVersionChange(version);
    }
    toast.success(`Switched to version v${version.versionNumber}.0`);
  }, [onVersionChange]);

  const handleCreateVersion = useCallback(async () => {
    if (!newVersionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }

    setIsCreating(true);
    try {
      let newVersion: SKUVersion | null = null;

      if (onCreateVersion) {
        newVersion = await onCreateVersion(newVersionName, newVersionDescription);
      } else {
        // Demo creation
        await new Promise((resolve) => setTimeout(resolve, 800));
        newVersion = {
          id: `skuv-${Date.now()}`,
          versionNumber: versions.length + 1,
          name: newVersionName,
          description: newVersionDescription,
          status: 'DRAFT',
          productCount: currentVersion?.productCount || 0,
          totalBudget: currentVersion?.totalBudget || 0,
          createdAt: new Date(),
          createdBy: { id: 'current-user', name: 'Current User' },
        };
        setVersions((prev) => [...prev, newVersion!]);
      }

      if (newVersion) {
        setCurrentVersion(newVersion);
        toast.success(`Created version: ${newVersion.name}`);
        setShowCreateDialog(false);
        setNewVersionName('');
        setNewVersionDescription('');
      }
    } catch (err) {
      toast.error('Failed to create version');
    } finally {
      setIsCreating(false);
    }
  }, [newVersionName, newVersionDescription, onCreateVersion, versions.length, currentVersion]);

  const handleSetFinal = useCallback(async () => {
    if (!currentVersion) return;

    setIsSettingFinal(true);
    try {
      let success = false;

      if (onSetFinal) {
        success = await onSetFinal(currentVersion);
      } else {
        // Demo
        await new Promise((resolve) => setTimeout(resolve, 500));
        setVersions((prev) =>
          prev.map((v) => ({
            ...v,
            status: v.id === currentVersion.id ? 'FINAL' : v.status,
          }))
        );
        setCurrentVersion({ ...currentVersion, status: 'FINAL' });
        success = true;
      }

      if (success) {
        toast.success(`Version v${currentVersion.versionNumber}.0 set as final`);
      }
    } catch (err) {
      toast.error('Failed to set as final');
    } finally {
      setIsSettingFinal(false);
      setShowFinalDialog(false);
    }
  }, [currentVersion, onSetFinal]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">Loading versions...</span>
      </div>
    );
  }

  const statusConfig = currentVersion ? STATUS_CONFIG[currentVersion.status] : STATUS_CONFIG.DRAFT;

  return (
    <>
      <div className={cn('flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50', className)}>
        {/* Version Icon */}
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
          <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Version Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              SKU Proposal Version
            </span>
            <Badge className={cn('text-xs', statusConfig.bgColor, statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
          {currentVersion && (
            <p className="text-xs text-slate-500 mt-0.5">
              v{currentVersion.versionNumber}.0 - {currentVersion.name}
            </p>
          )}
        </div>

        {/* Version Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <span>v{currentVersion?.versionNumber || 1}.0</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
              Select Version
            </div>
            <DropdownMenuSeparator />
            {versions.map((version) => {
              const vConfig = STATUS_CONFIG[version.status];
              return (
                <DropdownMenuItem
                  key={version.id}
                  onClick={() => handleVersionSelect(version)}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {currentVersion?.id === version.id && (
                        <Check className="h-3 w-3 text-blue-600" />
                      )}
                      <span className="font-medium">v{version.versionNumber}.0</span>
                      <Badge className={cn('text-[10px]', vConfig.bgColor, vConfig.color)}>
                        {vConfig.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400">
                      {version.productCount} SKUs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5 mt-0.5">{version.name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 ml-5 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-2.5 w-2.5" />
                      {version.createdBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDate(version.createdAt)}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Save as New Version
            </DropdownMenuItem>
            {onCompare && currentVersion && versions.length > 1 && (
              <DropdownMenuItem
                onClick={() => {
                  const prevVersion = versions[versions.length - 2];
                  if (prevVersion) {
                    onCompare(prevVersion.id, currentVersion.id);
                  }
                }}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare with Previous
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Select Final Button */}
        {showFinalButton && currentVersion && currentVersion.status !== 'FINAL' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowFinalDialog(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Star className="h-3 w-3" />
            Select Final
          </Button>
        )}

        {/* Final Badge */}
        {currentVersion?.status === 'FINAL' && (
          <Badge className="bg-emerald-100 text-emerald-700 gap-1">
            <Star className="h-3 w-3" />
            Final Version
          </Badge>
        )}
      </div>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
            <DialogDescription>
              Create a snapshot of the current SKU proposal as a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                placeholder="e.g., Updated Mix for Q2"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-description">Description (Optional)</Label>
              <Textarea
                id="version-description"
                placeholder="Describe the changes in this version..."
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={isCreating || !newVersionName.trim()}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Final Confirmation */}
      <AlertDialog open={showFinalDialog} onOpenChange={setShowFinalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Final Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark v{currentVersion?.versionNumber}.0 "{currentVersion?.name}" as the final SKU proposal version. This version will be used for ticket submission and cannot be changed without creating a new proposal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettingFinal}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSetFinal}
              disabled={isSettingFinal}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSettingFinal ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Set as Final
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SKUVersionSelector;
