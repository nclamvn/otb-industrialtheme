'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Ticket as TicketIcon } from 'lucide-react';
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
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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
    </div>
  );
}
