'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Ticket as TicketIcon, Send, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import {
  TicketList,
  TicketCard,
  CreateTicketDialog,
  useTickets,
  Ticket,
  CreateTicketInput,
} from '@/components/tickets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  PlanningRequestDialog,
  PlanningRequestItem,
  DEMO_SUPPLIERS,
} from '@/components/supplier';

// Demo available items for creating tickets
const DEMO_AVAILABLE_ITEMS = [
  {
    id: 'item-demo-1',
    type: 'otb_plan' as const,
    name: 'OTB Plan - Male Outerwear',
    version: 'v2.3',
    budget: 200000,
  },
  {
    id: 'item-demo-2',
    type: 'otb_plan' as const,
    name: 'OTB Plan - Male Tops',
    version: 'v2.3',
    budget: 150000,
  },
  {
    id: 'item-demo-3',
    type: 'otb_plan' as const,
    name: 'OTB Plan - Male Bottoms',
    version: 'v2.3',
    budget: 120000,
  },
  {
    id: 'item-demo-4',
    type: 'otb_plan' as const,
    name: 'OTB Plan - Male Accessories',
    version: 'v2.3',
    budget: 130000,
  },
  {
    id: 'item-demo-5',
    type: 'sku_proposal' as const,
    name: 'Female Collection SKU Proposal',
    version: 'v1.0',
    budget: 400000,
  },
  {
    id: 'item-demo-6',
    type: 'sizing' as const,
    name: 'FW26 Size Profile Update',
    version: 'v1.0',
    budget: 348925,
  },
];

export default function TicketsPage() {
  const t = useTranslations('ticket');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const {
    tickets,
    isLoading,
    createTicket,
    submitTicket,
    cancelTicket,
  } = useTickets();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSendRequestOpen, setIsSendRequestOpen] = useState(false);

  // Convert ticket items to planning request items
  const planningItems = useMemo<PlanningRequestItem[]>(() => {
    if (!selectedTicket) return [];
    return selectedTicket.items.map((item, index) => ({
      styleCode: `STY-${selectedTicket.season}-${String(index + 1).padStart(3, '0')}`,
      productName: item.name,
      category: item.type === 'otb_plan' ? 'OTB Plan' : item.type === 'sku_proposal' ? 'SKU' : 'Sizing',
      gender: 'Unisex',
      size: 'Various',
      units: Math.floor(item.budget / 50), // Demo: derive units from budget
      unitPrice: 50,
      totalValue: item.budget,
    }));
  }, [selectedTicket]);

  const handleCreateTicket = async (input: CreateTicketInput) => {
    try {
      const newTicket = await createTicket(input);
      toast.success(`Ticket ${newTicket.number} created successfully`);
      setIsCreateOpen(false);
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const handleCancelTicket = async (ticket: Ticket) => {
    try {
      await cancelTicket(ticket.id, 'Cancelled by user');
      toast.success(`Ticket ${ticket.number} cancelled`);
    } catch (error) {
      toast.error('Failed to cancel ticket');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSendToSupplier = () => {
    setIsDetailOpen(false);
    setIsSendRequestOpen(true);
  };

  const handleSupplierRequestSuccess = (requestId: string, requestNumber: string) => {
    toast.success(`Planning request ${requestNumber} sent to supplier`);
    // TODO: Update ticket status or add to history
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description="Manage approval tickets for OTB plans, SKU proposals, and sizing changes"
        icon={<TicketIcon className="h-6 w-6" />}
      />

      <TicketList
        tickets={tickets}
        onViewTicket={handleViewTicket}
        onUpdateTicket={handleViewTicket}
        onCancelTicket={handleCancelTicket}
        onCreateTicket={() => setIsCreateOpen(true)}
        isLoading={isLoading}
      />

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateTicket}
        availableItems={DEMO_AVAILABLE_ITEMS}
        defaultSeason="SS26"
        defaultBrand="REX"
      />

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              {selectedTicket?.number} - {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Approved Status Banner - Show Send to Supplier option */}
              {selectedTicket.status === 'approved' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                          All Approvals Complete!
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Ready to send planning request to supplier
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleSendToSupplier} className="bg-emerald-600 hover:bg-emerald-700">
                      <Send className="h-4 w-4 mr-2" />
                      Send to Supplier
                    </Button>
                  </div>
                </div>
              )}

              {/* Ticket Card */}
              <TicketCard
                ticket={selectedTicket}
                onUpdate={() => {}}
                onCancel={() => handleCancelTicket(selectedTicket)}
              />

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                  {t('history.title')}
                </h4>
                <TicketTimeline
                  history={selectedTicket.history}
                  currentStatus={selectedTicket.status}
                  currentAssignee={selectedTicket.assignedTo}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Planning Request Dialog - After Approval */}
      {selectedTicket && (
        <PlanningRequestDialog
          open={isSendRequestOpen}
          onOpenChange={setIsSendRequestOpen}
          ticketId={selectedTicket.id}
          ticketNumber={selectedTicket.number}
          items={planningItems}
          suppliers={DEMO_SUPPLIERS}
          onSuccess={handleSupplierRequestSuccess}
        />
      )}
    </div>
  );
}
