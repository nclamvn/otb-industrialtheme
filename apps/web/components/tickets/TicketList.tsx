'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Inbox } from 'lucide-react';
import { TicketCard } from './TicketCard';
import { Ticket, TicketStatus } from './types';

interface TicketListProps {
  tickets: Ticket[];
  onViewTicket?: (ticket: Ticket) => void;
  onUpdateTicket?: (ticket: Ticket) => void;
  onCancelTicket?: (ticket: Ticket) => void;
  onCreateTicket?: () => void;
  isLoading?: boolean;
  className?: string;
}

const STATUS_TABS: (TicketStatus | 'all')[] = [
  'all',
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
];

export function TicketList({
  tickets,
  onViewTicket,
  onUpdateTicket,
  onCancelTicket,
  onCreateTicket,
  isLoading = false,
  className,
}: TicketListProps) {
  const t = useTranslations('ticket');
  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = tickets.filter((ticket) => {
    // Status filter
    if (activeTab !== 'all' && ticket.status !== activeTab) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.number.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.createdBy.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getTabCount = (status: TicketStatus | 'all') => {
    if (status === 'all') return tickets.length;
    return tickets.filter((t) => t.status === status).length;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="pl-9"
          />
        </div>
        {onCreateTicket && (
          <Button onClick={onCreateTicket} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('create')}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TicketStatus | 'all')}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {STATUS_TABS.map((status) => (
            <TabsTrigger key={status} value={status} className="gap-2">
              {status === 'all' ? 'All' : t(`status.${status}`)}
              <span className="text-xs bg-slate-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">
                {getTabCount(status)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-neutral-400">
            <Inbox className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">No tickets found</p>
            <p className="text-sm">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create a new ticket to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                compact
                onView={() => onViewTicket?.(ticket)}
                onUpdate={() => onUpdateTicket?.(ticket)}
                onCancel={() => onCancelTicket?.(ticket)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default TicketList;
