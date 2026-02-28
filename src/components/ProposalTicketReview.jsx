'use client';
import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, MessageSquare, User, Calendar, Tag, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDate } from '@/utils';

const ProposalTicketReview = ({ ticket, onApprove, onReject, isLoading = false }) => {
  const { t } = useLanguage();
  const [comment, setComment] = useState('');

  const handleApprove = useCallback(() => {
    onApprove?.({ ticketId: ticket.id, comment });
    setComment('');
  }, [ticket, comment, onApprove]);

  const handleReject = useCallback(() => {
    onReject?.({ ticketId: ticket.id, comment });
    setComment('');
  }, [ticket, comment, onReject]);

  if (!ticket) return null;

  const statusColors = {
    PENDING: { bg: '#FEF3C7', text: '#D97706' },
    APPROVED: { bg: '#D1FAE5', text: '#1B6B45' },
    REJECTED: { bg: '#FEE2E2', text: '#DC3545' },
    DRAFT: { bg: '#F0EBE5', text: '#6B5E54' },
  };

  const sc = statusColors[ticket.status] || statusColors.DRAFT;

  return (
    <div className="rounded-2xl border border-[#E8E2DB] bg-white overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(44,36,23,0.06)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E2DB] bg-[#FAF8F5]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={16} style={{ color: '#C4975A' }} />
            <h3 className="text-base font-semibold font-brand text-[#2C2417]">
              {ticket.code || ticket.title}
            </h3>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: sc.bg, color: sc.text }}
          >
            {ticket.status}
          </span>
        </div>
        {ticket.description && (
          <p className="text-sm text-[#6B5E54]">{ticket.description}</p>
        )}
      </div>

      {/* Details */}
      <div className="px-6 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {ticket.brand && (
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-[#8C8178]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8C8178]">
                  {t('common.brand') || 'Brand'}
                </p>
                <p className="text-sm font-medium text-[#2C2417]">{ticket.brand}</p>
              </div>
            </div>
          )}
          {ticket.createdBy && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#8C8178]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8C8178]">
                  {t('common.createdBy') || 'Created by'}
                </p>
                <p className="text-sm font-medium text-[#2C2417]">{ticket.createdBy}</p>
              </div>
            </div>
          )}
          {ticket.date && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#8C8178]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8C8178]">
                  {t('common.date') || 'Date'}
                </p>
                <p className="text-sm font-medium text-[#2C2417]">{formatDate(ticket.date)}</p>
              </div>
            </div>
          )}
          {ticket.totalAmount != null && (
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#8C8178]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8C8178]">
                  {t('common.amount') || 'Amount'}
                </p>
                <p className="text-sm font-medium text-[#2C2417]">{formatCurrency(ticket.totalAmount)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items table */}
        {ticket.items?.length > 0 && (
          <div className="rounded-xl border border-[#E8E2DB] overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF8F5]">
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#6B5E54]">SKU</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[#6B5E54]">Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[#6B5E54]">{t('common.amount') || 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {ticket.items.map((item, idx) => (
                  <tr key={idx} className="border-t border-[#F0EBE5]">
                    <td className="px-3 py-2 text-[#2C2417]">{item.sku || item.name}</td>
                    <td className="px-3 py-2 text-right text-[#6B5E54]">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-medium text-[#2C2417]">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review section */}
      {ticket.status === 'PENDING' && (
        <div className="px-6 py-4 border-t border-[#E8E2DB] bg-[#FAF8F5] space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[#6B5E54]">
              <MessageSquare size={12} />
              {t('components.reviewComment') || 'Comment'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder={t('components.addComment') || 'Add a comment...'}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none transition-colors
                border-[#E8E2DB] focus:border-[#C4975A] text-[#2C2417] placeholder:text-[#B0A89F]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                border border-[#DC3545] text-[#DC3545] hover:bg-[#FEF2F2] disabled:opacity-50"
            >
              <XCircle size={14} />
              {t('common.reject') || 'Reject'}
            </button>
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors
                bg-[#1B6B45] hover:bg-[#155936] disabled:opacity-50"
            >
              <CheckCircle size={14} />
              {t('common.approve') || 'Approve'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalTicketReview;
