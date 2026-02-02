'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Clock,
  UserCheck,
  DollarSign,
  Crown,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Timer,
  AlertTriangle,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface ApprovalTicket {
  id: string;
  code: string;
  brand: string;
  brandLogo?: string;
  season: string;
  totalValue: number;
  itemCount: number;
  submittedBy: string;
  submittedAt: Date;
  dueDate?: Date;
  status: 'pending' | 'gsm_review' | 'finance_review' | 'ceo_review' | 'approved' | 'rejected';
  isUrgent?: boolean;
  comments?: number;
  currentReviewer?: {
    name: string;
    avatar?: string;
  };
}

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  statuses: string[];
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    title: 'Pending',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
    statuses: ['pending'],
  },
  {
    id: 'gsm',
    title: 'GSM Review',
    icon: UserCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    statuses: ['gsm_review'],
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    statuses: ['finance_review'],
  },
  {
    id: 'ceo',
    title: 'CEO',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    statuses: ['ceo_review'],
  },
  {
    id: 'done',
    title: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    statuses: ['approved', 'rejected'],
  },
];

interface ApprovalKanbanProps {
  tickets: ApprovalTicket[];
  onViewTicket: (ticket: ApprovalTicket) => void;
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string) => void;
  currentUserRole: string;
  className?: string;
}

export function ApprovalKanban({
  tickets,
  onViewTicket,
  onApprove,
  onReject,
  currentUserRole,
  className,
}: ApprovalKanbanProps) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {COLUMNS.map((column) => {
        const columnTickets = tickets.filter((t) =>
          column.statuses.includes(t.status)
        );
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-72 rounded-xl border',
              column.bgColor
            )}
          >
            {/* Column Header */}
            <div className="p-3 border-b bg-background/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', column.color)} />
                  <span className="font-medium text-sm">{column.title}</span>
                </div>
                <Badge variant="secondary" className="text-xs h-5 px-2">
                  {columnTickets.length}
                </Badge>
              </div>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
              {columnTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No items
                </div>
              ) : (
                columnTickets.map((ticket, index) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    index={index}
                    onView={() => onViewTicket(ticket)}
                    onApprove={() => onApprove(ticket.id)}
                    onReject={() => onReject(ticket.id)}
                    canApprove={canUserApprove(ticket.status, currentUserRole)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function canUserApprove(status: string, role: string): boolean {
  const roleMap: Record<string, string[]> = {
    gsm_review: ['MERCHANDISE_LEAD', 'ADMIN'],
    finance_review: ['FINANCE_HEAD', 'FINANCE_USER', 'ADMIN'],
    ceo_review: ['BOD_MEMBER', 'ADMIN'],
  };
  return roleMap[status]?.includes(role) ?? false;
}

interface TicketCardProps {
  ticket: ApprovalTicket;
  index: number;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  canApprove: boolean;
}

function TicketCard({
  ticket,
  index,
  onView,
  onApprove,
  onReject,
  canApprove,
}: TicketCardProps) {
  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();
  const isCompleted = ticket.status === 'approved' || ticket.status === 'rejected';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md border-l-4',
          ticket.isUrgent && 'border-l-red-500 ring-1 ring-red-200',
          isOverdue && !ticket.isUrgent && 'border-l-amber-500',
          ticket.status === 'approved' && 'border-l-green-500',
          ticket.status === 'rejected' && 'border-l-red-500',
          !ticket.isUrgent && !isOverdue && !isCompleted && 'border-l-[#D7B797]'
        )}
        onClick={onView}
      >
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{ticket.brand}</span>
                {ticket.isUrgent && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{ticket.season}</p>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] h-5">
                {ticket.code}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                    <Eye className="w-3 h-3 mr-2" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Value */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold font-mono text-[#127749]">
              ${(ticket.totalValue / 1000).toFixed(0)}K
            </span>
            <span className="text-xs text-muted-foreground">
              {ticket.itemCount} SKUs
            </span>
          </div>

          {/* Submitter */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
            <span>by {ticket.submittedBy}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5">
              {ticket.currentReviewer && (
                <Avatar className="w-5 h-5">
                  <AvatarImage src={ticket.currentReviewer.avatar} />
                  <AvatarFallback className="text-[8px] bg-[#D7B797] text-white">
                    {ticket.currentReviewer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.submittedAt), { addSuffix: true, locale: vi })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {ticket.comments && ticket.comments > 0 && (
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-[10px]">{ticket.comments}</span>
                </div>
              )}
              {isOverdue && (
                <Timer className="w-3 h-3 text-amber-500" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canApprove && !isCompleted && (
            <div className="flex gap-2 mt-2 pt-2 border-t">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs bg-[#127749] hover:bg-[#0d5a36]"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove();
                }}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {/* Status Badge for completed */}
          {isCompleted && (
            <div className="mt-2 pt-2 border-t">
              <Badge
                variant={ticket.status === 'approved' ? 'default' : 'destructive'}
                className={cn(
                  'w-full justify-center text-xs',
                  ticket.status === 'approved' && 'bg-green-600'
                )}
              >
                {ticket.status === 'approved' ? 'Approved' : 'Rejected'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Demo data generator
export function generateMockTickets(): ApprovalTicket[] {
  return [
    {
      id: '1',
      code: 'TKT-001',
      brand: 'Ferragamo',
      season: 'SS25',
      totalValue: 1250000,
      itemCount: 45,
      submittedBy: 'John Doe',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
      isUrgent: true,
      comments: 3,
      currentReviewer: { name: 'Jane Smith' },
    },
    {
      id: '2',
      code: 'TKT-002',
      brand: 'TODs',
      season: 'SS25',
      totalValue: 890000,
      itemCount: 32,
      submittedBy: 'Alice Wong',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'gsm_review',
      comments: 1,
      currentReviewer: { name: 'Bob Lee' },
    },
    {
      id: '3',
      code: 'TKT-003',
      brand: 'Burberry',
      season: 'FW25',
      totalValue: 2100000,
      itemCount: 78,
      submittedBy: 'Charlie Kim',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'finance_review',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue
      comments: 5,
      currentReviewer: { name: 'Diana Chen' },
    },
    {
      id: '4',
      code: 'TKT-004',
      brand: 'Celine',
      season: 'SS25',
      totalValue: 1750000,
      itemCount: 56,
      submittedBy: 'Eve Park',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'ceo_review',
      comments: 2,
      currentReviewer: { name: 'CEO Office' },
    },
    {
      id: '5',
      code: 'TKT-005',
      brand: 'Ferragamo',
      season: 'FW25',
      totalValue: 980000,
      itemCount: 41,
      submittedBy: 'Frank Liu',
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'approved',
      comments: 4,
    },
    {
      id: '6',
      code: 'TKT-006',
      brand: 'TODs',
      season: 'FW25',
      totalValue: 650000,
      itemCount: 28,
      submittedBy: 'Grace Tan',
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'rejected',
      comments: 6,
    },
  ];
}
