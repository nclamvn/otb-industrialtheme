'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package2,
  Plus,
  Trash2,
  Send,
  Layers,
  Check,
  X,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Unlink,
} from 'lucide-react';
import {
  Ticket,
  TicketStatus,
  TICKET_STATUS_CONFIG,
  TICKET_TYPE_CONFIG,
  TICKET_PRIORITY_CONFIG,
} from './types';

export interface TicketBundle {
  id: string;
  name: string;
  description?: string;
  tickets: Ticket[];
  createdAt: Date;
  status: 'draft' | 'ready' | 'submitted';
  totalBudget: number;
}

interface TicketBundlingProps {
  tickets: Ticket[];
  bundles: TicketBundle[];
  selectedTicketIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onCreateBundle: (name: string, ticketIds: string[]) => Promise<TicketBundle>;
  onAddToBundle: (bundleId: string, ticketIds: string[]) => Promise<void>;
  onRemoveFromBundle: (bundleId: string, ticketIds: string[]) => Promise<void>;
  onDeleteBundle: (bundleId: string) => Promise<void>;
  onSubmitBundle: (bundleId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function TicketBundling({
  tickets,
  bundles,
  selectedTicketIds,
  onSelectionChange,
  onCreateBundle,
  onAddToBundle,
  onRemoveFromBundle,
  onDeleteBundle,
  onSubmitBundle,
  isLoading = false,
  className,
}: TicketBundlingProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [bundleName, setBundleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Get unbundled tickets
  const bundledTicketIds = useMemo(() => {
    const ids = new Set<string>();
    bundles.forEach((bundle) => {
      bundle.tickets.forEach((ticket) => ids.add(ticket.id));
    });
    return ids;
  }, [bundles]);

  const unbundledTickets = useMemo(
    () => tickets.filter((t) => !bundledTicketIds.has(t.id)),
    [tickets, bundledTicketIds]
  );

  const selectedUnbundled = useMemo(
    () => selectedTicketIds.filter((id) => !bundledTicketIds.has(id)),
    [selectedTicketIds, bundledTicketIds]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        onSelectionChange(unbundledTickets.map((t) => t.id));
      } else {
        onSelectionChange([]);
      }
    },
    [unbundledTickets, onSelectionChange]
  );

  const handleSelectTicket = useCallback(
    (ticketId: string, checked: boolean) => {
      if (checked) {
        onSelectionChange([...selectedTicketIds, ticketId]);
      } else {
        onSelectionChange(selectedTicketIds.filter((id) => id !== ticketId));
      }
    },
    [selectedTicketIds, onSelectionChange]
  );

  const handleCreateBundle = useCallback(async () => {
    if (!bundleName.trim() || selectedUnbundled.length === 0) return;

    setIsCreating(true);
    try {
      await onCreateBundle(bundleName.trim(), selectedUnbundled);
      setBundleName('');
      onSelectionChange([]);
      setShowCreateDialog(false);
    } finally {
      setIsCreating(false);
    }
  }, [bundleName, selectedUnbundled, onCreateBundle, onSelectionChange]);

  const handleSubmitBundle = useCallback(
    async (bundleId: string) => {
      setIsSubmitting(bundleId);
      try {
        await onSubmitBundle(bundleId);
      } finally {
        setIsSubmitting(null);
      }
    },
    [onSubmitBundle]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Bundle Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Ticket Bundles</h3>
            <p className="text-sm text-muted-foreground">
              Group related tickets for batch submission
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={selectedUnbundled.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Bundle ({selectedUnbundled.length})
        </Button>
      </div>

      {/* Existing Bundles */}
      {bundles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Active Bundles
          </h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm font-medium">
                        {bundle.name}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleSubmitBundle(bundle.id)}
                          disabled={bundle.status === 'submitted'}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Bundle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteBundle(bundle.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Bundle
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-xs">
                    {bundle.tickets.length} tickets &bull;{' '}
                    {formatCurrency(bundle.totalBudget)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {bundle.tickets.slice(0, 3).map((ticket) => (
                      <Badge
                        key={ticket.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {ticket.number}
                      </Badge>
                    ))}
                    {bundle.tickets.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{bundle.tickets.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge
                      variant={
                        bundle.status === 'submitted' ? 'default' : 'outline'
                      }
                      className={cn(
                        bundle.status === 'submitted' &&
                          'bg-blue-500 hover:bg-blue-600'
                      )}
                    >
                      {bundle.status === 'submitted'
                        ? 'Submitted'
                        : bundle.status === 'ready'
                        ? 'Ready'
                        : 'Draft'}
                    </Badge>
                    {isSubmitting === bundle.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Unbundled Tickets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Unbundled Tickets ({unbundledTickets.length})
          </h4>
          {unbundledTickets.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedUnbundled.length === unbundledTickets.length &&
                  unbundledTickets.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Select All
              </Label>
            </div>
          )}
        </div>

        {unbundledTickets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Package2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                All tickets are bundled
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {unbundledTickets.map((ticket) => {
              const isSelected = selectedTicketIds.includes(ticket.id);
              const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
              const typeConfig = TICKET_TYPE_CONFIG[ticket.type];
              const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority];

              return (
                <Card
                  key={ticket.id}
                  className={cn(
                    'transition-all cursor-pointer hover:border border-border',
                    isSelected && 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  )}
                  onClick={() => handleSelectTicket(ticket.id, !isSelected)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectTicket(ticket.id, !!checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {ticket.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', statusConfig.color)}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{ticket.number}</span>
                          <span>&bull;</span>
                          <span>{typeConfig.label}</span>
                          <span>&bull;</span>
                          <span>{formatCurrency(ticket.totalBudget)}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', priorityConfig.color)}
                      >
                        {priorityConfig.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Bundle Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Create Ticket Bundle
            </DialogTitle>
            <DialogDescription>
              Bundle {selectedUnbundled.length} selected tickets for batch
              submission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bundle-name">Bundle Name</Label>
              <Input
                id="bundle-name"
                placeholder="e.g., FW26 Initial OTB Submission"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Selected Tickets</Label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-muted rounded-md">
                {unbundledTickets
                  .filter((t) => selectedTicketIds.includes(t.id))
                  .map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{ticket.title}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(ticket.totalBudget)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <span className="text-sm font-medium">Total Budget</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(
                  unbundledTickets
                    .filter((t) => selectedTicketIds.includes(t.id))
                    .reduce((sum, t) => sum + t.totalBudget, 0)
                )}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBundle}
              disabled={isCreating || !bundleName.trim()}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package2 className="h-4 w-4 mr-2" />
              )}
              Create Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Hook for managing bundle state
export function useTicketBundling(initialTickets: Ticket[] = []) {
  const [bundles, setBundles] = useState<TicketBundle[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  const createBundle = useCallback(
    async (name: string, ticketIds: string[]): Promise<TicketBundle> => {
      const ticketsToBundle = initialTickets.filter((t) =>
        ticketIds.includes(t.id)
      );

      const newBundle: TicketBundle = {
        id: `bundle-${Date.now()}`,
        name,
        tickets: ticketsToBundle,
        createdAt: new Date(),
        status: 'draft',
        totalBudget: ticketsToBundle.reduce((sum, t) => sum + t.totalBudget, 0),
      };

      setBundles((prev) => [...prev, newBundle]);
      return newBundle;
    },
    [initialTickets]
  );

  const addToBundle = useCallback(
    async (bundleId: string, ticketIds: string[]) => {
      const ticketsToAdd = initialTickets.filter((t) =>
        ticketIds.includes(t.id)
      );

      setBundles((prev) =>
        prev.map((bundle) => {
          if (bundle.id !== bundleId) return bundle;

          const newTickets = [...bundle.tickets, ...ticketsToAdd];
          return {
            ...bundle,
            tickets: newTickets,
            totalBudget: newTickets.reduce((sum, t) => sum + t.totalBudget, 0),
          };
        })
      );
    },
    [initialTickets]
  );

  const removeFromBundle = useCallback(
    async (bundleId: string, ticketIds: string[]) => {
      setBundles((prev) =>
        prev.map((bundle) => {
          if (bundle.id !== bundleId) return bundle;

          const newTickets = bundle.tickets.filter(
            (t) => !ticketIds.includes(t.id)
          );
          return {
            ...bundle,
            tickets: newTickets,
            totalBudget: newTickets.reduce((sum, t) => sum + t.totalBudget, 0),
          };
        })
      );
    },
    []
  );

  const deleteBundle = useCallback(async (bundleId: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== bundleId));
  }, []);

  const submitBundle = useCallback(async (bundleId: string) => {
    setBundles((prev) =>
      prev.map((bundle) =>
        bundle.id === bundleId ? { ...bundle, status: 'submitted' as const } : bundle
      )
    );
  }, []);

  return {
    bundles,
    selectedTicketIds,
    setSelectedTicketIds,
    createBundle,
    addToBundle,
    removeFromBundle,
    deleteBundle,
    submitBundle,
  };
}

export default TicketBundling;
