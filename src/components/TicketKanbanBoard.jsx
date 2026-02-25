'use client';
import React from 'react';
import {
  FileText, Clock, CheckCircle, XCircle,
  ArrowRight, Building2, Star
} from 'lucide-react';
import { formatCurrency } from '../utils';
import { useLanguage } from '@/contexts/LanguageContext';

const COLUMNS = [
  { id: 'DRAFT', labelKey: 'kanban.draft', icon: FileText },
  { id: 'SUBMITTED', labelKey: 'kanban.submitted', icon: Clock },
  { id: 'LEVEL1_APPROVED', labelKey: 'kanban.l1Approved', icon: ArrowRight },
  { id: 'LEVEL2_APPROVED', labelKey: 'kanban.l2Approved', icon: ArrowRight },
  { id: 'APPROVED', labelKey: 'kanban.approved', icon: CheckCircle },
  { id: 'FINAL', labelKey: 'kanban.final', icon: Star },
  { id: 'REJECTED', labelKey: 'kanban.rejected', icon: XCircle },
];

// Map column id to light-only DAFC-style colors
const COLUMN_COLORS = {
  DRAFT: {
    header: 'bg-[#F0EBE4]',
    icon: 'text-[#8C8178]',
    count: 'bg-[#E8E2DB] text-[#6B5D4F]',
    bg: 'bg-[#FBF9F7]',
    border: 'border-[#E8E2DB]',
  },
  SUBMITTED: {
    header: 'bg-amber-50',
    icon: 'text-[#D97706]',
    count: 'bg-amber-200 text-amber-700',
    bg: 'bg-amber-50/50',
    border: 'border-amber-200',
  },
  LEVEL1_APPROVED: {
    header: 'bg-purple-50',
    icon: 'text-purple-600',
    count: 'bg-purple-200 text-purple-700',
    bg: 'bg-purple-50/50',
    border: 'border-purple-200',
  },
  LEVEL2_APPROVED: {
    header: 'bg-blue-50',
    icon: 'text-[#2563EB]',
    count: 'bg-blue-200 text-blue-700',
    bg: 'bg-blue-50/50',
    border: 'border-blue-200',
  },
  APPROVED: {
    header: 'bg-emerald-50',
    icon: 'text-[#1B6B45]',
    count: 'bg-emerald-200 text-emerald-700',
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-200',
  },
  FINAL: {
    header: 'bg-[rgba(196,151,90,0.15)]',
    icon: 'text-[#6B4D30]',
    count: 'bg-[rgba(196,151,90,0.3)] text-[#6B4D30]',
    bg: 'bg-[rgba(196,151,90,0.05)]',
    border: 'border-[rgba(196,151,90,0.3)]',
  },
  REJECTED: {
    header: 'bg-red-50',
    icon: 'text-[#DC3545]',
    count: 'bg-red-200 text-red-700',
    bg: 'bg-red-50/50',
    border: 'border-red-200',
  },
};

// Entity type badge styles (light only)
const ENTITY_COLORS = {
  budget: 'bg-[rgba(196,151,90,0.2)] text-[#6B4D30]',
  planning: 'bg-blue-100 text-blue-700',
  proposal: 'bg-emerald-100 text-emerald-700',
};

const TicketKanbanBoard = ({ tickets = [], onTicketClick, darkMode = true }) => {
  const { t } = useLanguage();

  // Group tickets by status — merge LEVEL1_REJECTED/LEVEL2_REJECTED into REJECTED
  const ticketsByStatus = COLUMNS.reduce((acc, col) => {
    if (col.id === 'REJECTED') {
      acc[col.id] = tickets.filter(t => {
        const s = t.status?.toUpperCase();
        return s === 'REJECTED' || s === 'LEVEL1_REJECTED' || s === 'LEVEL2_REJECTED';
      });
    } else {
      acc[col.id] = tickets.filter(t => t.status?.toUpperCase() === col.id);
    }
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
      {COLUMNS.map((column) => {
        const colors = COLUMN_COLORS[column.id] || COLUMN_COLORS.DRAFT;
        const columnTickets = ticketsByStatus[column.id] || [];
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 ${colors.bg} ${colors.border} border rounded-xl overflow-hidden`}
          >
            {/* Column Header */}
            <div className={`${colors.header} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Icon size={16} className={colors.icon} />
                <span className={`font-semibold text-sm font-['Montserrat'] ${colors.icon}`}>
                  {t(column.labelKey)}
                </span>
              </div>
              <span className={`${colors.count} text-xs font-bold font-['JetBrains_Mono'] px-2 py-0.5 rounded-full`}>
                {columnTickets.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
              {columnTickets.length === 0 ? (
                <div className="text-center py-8 text-sm font-['Montserrat'] text-[#8C8178]">
                  {t('kanban.noTickets')}
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <div
                    key={`${ticket.entityType}-${ticket.id}`}
                    onClick={() => onTicketClick?.(ticket)}
                    className="rounded-lg border border-[#E8E2DB] hover:border-[#C4975A] hover:shadow-md p-3 cursor-pointer transition-all duration-150"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, rgba(196,151,90,0.04) 35%, rgba(196,151,90,0.10) 100%)',
                      boxShadow: 'inset 0 -1px 0 rgba(196,151,90,0.04)',
                    }}
                  >
                    {/* Entity Type + Date */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        ENTITY_COLORS[ticket.entityType] || ENTITY_COLORS.budget
                      }`}>
                        {ticket.entityType}
                      </span>
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#8C8178]">
                        {ticket.createdOn}
                      </span>
                    </div>

                    {/* Ticket Name */}
                    <h4 className="font-medium text-sm font-['Montserrat'] mb-2 line-clamp-2 text-[#2C2417]">
                      {ticket.name}
                    </h4>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {ticket.brand && ticket.brand !== '-' && (
                        <span className="flex items-center gap-1 text-[#6B5D4F]">
                          <Building2 size={12} />
                          {ticket.brand}
                        </span>
                      )}
                      {ticket.seasonGroup && ticket.seasonGroup !== '-' && (
                        <span className="px-1.5 py-0.5 rounded font-['JetBrains_Mono'] bg-[#FBF9F7] text-[#6B5D4F]">
                          {ticket.seasonGroup} {ticket.season !== '-' ? ticket.season : ''}
                        </span>
                      )}
                    </div>

                    {/* Budget Amount */}
                    {ticket.totalBudget > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E8E2DB]">
                        <span className="text-xs font-['JetBrains_Mono'] text-[#6B4D30]">
                          {formatCurrency(ticket.totalBudget)}
                        </span>
                      </div>
                    )}

                    {/* Created By */}
                    {ticket.createdBy && ticket.createdBy !== 'System' && (
                      <div className="mt-1 text-[10px] text-[#8C8178]">
                        {t('kanban.by')} {ticket.createdBy}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketKanbanBoard;
