'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Ticket,
  TicketStatus,
  CreateTicketInput,
  generateTicketNumber,
} from '../types';

interface UseTicketsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseTicketsReturn {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTicket: (input: CreateTicketInput) => Promise<Ticket>;
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>;
  submitTicket: (id: string, comment?: string) => Promise<void>;
  cancelTicket: (id: string, reason: string) => Promise<void>;
  getTicketById: (id: string) => Ticket | undefined;
}

// Generate demo tickets
function generateDemoTickets(): Ticket[] {
  const now = new Date();

  return [
    {
      id: 'ticket-1',
      number: 'TKT-2026-0042',
      type: 'otb_plan',
      title: 'SS26 REX Male OTB Plan Submission',
      description: 'Final OTB allocation for Spring Summer 2026 Male collection',
      status: 'in_review',
      priority: 'high',
      items: [
        {
          id: 'item-1',
          type: 'otb_plan',
          entityId: 'budget-1',
          name: 'OTB Plan v2.3 - Male Outerwear',
          version: 'v2.3',
          budget: 200000,
        },
        {
          id: 'item-2',
          type: 'otb_plan',
          entityId: 'budget-2',
          name: 'OTB Plan v2.3 - Male Tops',
          version: 'v2.3',
          budget: 150000,
        },
        {
          id: 'item-3',
          type: 'otb_plan',
          entityId: 'budget-3',
          name: 'OTB Plan v2.3 - Male Bottoms',
          version: 'v2.3',
          budget: 120000,
        },
      ],
      season: 'SS26',
      brand: 'REX',
      totalBudget: 470000,
      createdBy: {
        id: 'user-1',
        name: 'John Doe',
      },
      assignedTo: {
        id: 'user-finance',
        name: 'Michael Chen',
      },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      approvalRequestId: 'approval-1',
      history: [
        {
          id: 'hist-1',
          action: 'created',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          user: { id: 'user-1', name: 'John Doe' },
        },
        {
          id: 'hist-2',
          action: 'submitted',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          user: { id: 'user-1', name: 'John Doe' },
          comment: 'Ready for GMD review',
        },
        {
          id: 'hist-3',
          action: 'approved',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          user: { id: 'user-gmd', name: 'Sarah Johnson' },
          comment: 'Budget allocation looks good',
        },
      ],
    },
    {
      id: 'ticket-2',
      number: 'TKT-2026-0041',
      type: 'sizing_change',
      title: 'FW26 TTP Sizing Change',
      status: 'approved',
      priority: 'normal',
      items: [
        {
          id: 'item-4',
          type: 'sizing',
          entityId: 'sizing-1',
          name: 'FW26 TTP Size Profile Update',
          version: 'v1.0',
          budget: 348925,
        },
      ],
      season: 'FW26',
      brand: 'TTP',
      totalBudget: 348925,
      createdBy: {
        id: 'user-2',
        name: 'Jane Smith',
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      history: [
        {
          id: 'hist-4',
          action: 'created',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          user: { id: 'user-2', name: 'Jane Smith' },
        },
        {
          id: 'hist-5',
          action: 'submitted',
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          user: { id: 'user-2', name: 'Jane Smith' },
        },
        {
          id: 'hist-6',
          action: 'approved',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          user: { id: 'user-ceo', name: 'David Williams' },
          comment: 'Approved for production',
        },
      ],
    },
    {
      id: 'ticket-3',
      number: 'TKT-2026-0040',
      type: 'sku_proposal',
      title: 'SS26 REX Female SKU Proposal',
      status: 'draft',
      priority: 'normal',
      items: [
        {
          id: 'item-5',
          type: 'sku_proposal',
          entityId: 'sku-1',
          name: 'Female Collection SKU Proposal',
          version: 'v1.0',
          budget: 400000,
        },
      ],
      season: 'SS26',
      brand: 'REX',
      totalBudget: 400000,
      createdBy: {
        id: 'user-3',
        name: 'Bob Lee',
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      history: [
        {
          id: 'hist-7',
          action: 'created',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          user: { id: 'user-3', name: 'Bob Lee' },
        },
      ],
    },
  ];
}

export function useTickets(options: UseTicketsOptions = {}): UseTicketsReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = generateDemoTickets();
      setTickets(data);
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  const createTicket = useCallback(
    async (input: CreateTicketInput): Promise<Ticket> => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        number: generateTicketNumber(),
        type: input.type,
        title: input.title,
        description: input.description,
        status: 'draft',
        priority: input.priority,
        items: input.items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          ...item,
        })),
        season: input.season,
        brand: input.brand,
        totalBudget: input.items.reduce((sum, item) => sum + item.budget, 0),
        createdBy: {
          id: 'current-user',
          name: 'Current User',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deadline: input.deadline,
        history: [
          {
            id: `hist-${Date.now()}`,
            action: 'created',
            timestamp: new Date(),
            user: { id: 'current-user', name: 'Current User' },
          },
        ],
      };

      setTickets((prev) => [newTicket, ...prev]);
      return newTicket;
    },
    []
  );

  const updateTicket = useCallback(
    async (id: string, data: Partial<Ticket>): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                ...data,
                updatedAt: new Date(),
                history: [
                  ...ticket.history,
                  {
                    id: `hist-${Date.now()}`,
                    action: 'updated' as const,
                    timestamp: new Date(),
                    user: { id: 'current-user', name: 'Current User' },
                  },
                ],
              }
            : ticket
        )
      );
    },
    []
  );

  const submitTicket = useCallback(
    async (id: string, comment?: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                status: 'submitted' as TicketStatus,
                submittedAt: new Date(),
                updatedAt: new Date(),
                history: [
                  ...ticket.history,
                  {
                    id: `hist-${Date.now()}`,
                    action: 'submitted' as const,
                    timestamp: new Date(),
                    user: { id: 'current-user', name: 'Current User' },
                    comment,
                  },
                ],
              }
            : ticket
        )
      );
    },
    []
  );

  const cancelTicket = useCallback(
    async (id: string, reason: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                status: 'cancelled' as TicketStatus,
                updatedAt: new Date(),
                history: [
                  ...ticket.history,
                  {
                    id: `hist-${Date.now()}`,
                    action: 'cancelled' as const,
                    timestamp: new Date(),
                    user: { id: 'current-user', name: 'Current User' },
                    comment: reason,
                  },
                ],
              }
            : ticket
        )
      );
    },
    []
  );

  const getTicketById = useCallback(
    (id: string) => tickets.find((t) => t.id === id),
    [tickets]
  );

  return {
    tickets,
    isLoading,
    error,
    refresh,
    createTicket,
    updateTicket,
    submitTicket,
    cancelTicket,
    getTicketById,
  };
}

export default useTickets;
