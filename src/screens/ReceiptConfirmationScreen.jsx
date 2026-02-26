'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, CheckCircle, Clock, Loader2, Package,
  Search, ChevronDown, X, AlertTriangle, FileText,
  ClipboardCheck, XCircle, AlertCircle, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatCurrency } from '../utils';
import { includes as viIncludes } from '../utils/normalizeVietnamese';
import { proposalService, orderService } from '../services';
import api, { invalidateCache } from '../services/api';
import { ExpandableStatCard } from '../components/Common';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const RECEIPT_STATUS = {
  PENDING: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Pending' },
  CONFIRMED: { color: '#1B6B45', bg: 'rgba(27,107,69,0.12)', label: 'Confirmed' },
  DISCREPANCY: { color: '#DC3545', bg: 'rgba(220,53,69,0.12)', label: 'Discrepancy' },
  PARTIAL: { color: '#A371F7', bg: 'rgba(163,113,247,0.12)', label: 'Partial' },
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const ReceiptConfirmationScreen = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [discrepancyNote, setDiscrepancyNote] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try dedicated receipts endpoint first
      const response = await api.get('/receipts');
      const data = response.data.data || response.data;
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      // Fallback: derive receipts from approved proposals
      try {
        const response = await proposalService.getAll({ status: 'APPROVED' });
        const data = response.data || response;
        const proposals = Array.isArray(data) ? data : [];
        const mapped = proposals.map((p, idx) => ({
          id: p.id || idx + 1,
          receiptNumber: `REC-${String(idx + 1).padStart(5, '0')}`,
          poReference: p.proposalCode || `PO-${String(idx + 1).padStart(5, '0')}`,
          brandName: p.budget?.groupBrand?.name || p.brandName || '-',
          itemCount: p.products?.length || p.skuCount || 0,
          orderedQty: p.products?.reduce((sum, pr) => sum + (pr.totalQuantity || 0), 0) || p.totalQty || 0,
          receivedQty: p.receivedQty || 0,
          status: p.receiptStatus || 'PENDING',
          receivedDate: p.receivedDate || null,
          createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
        }));
        setReceipts(mapped);
      } catch (innerErr) {
        console.error('Failed to fetch receipts:', innerErr);
        setError(t('receiptConfirm.failedToLoad'));
        setReceipts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (receipt) => {
    setProcessing(true);
    try {
      await orderService.confirmReceipt(receipt.id, { receivedQty: receipt.orderedQty });
      invalidateCache('/receipts');
      invalidateCache('/orders');
      toast.success(t('receiptConfirm.receiptConfirmed') || 'Receipt confirmed');
      fetchReceipts();
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      toast.error(err.userMessage || err.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleFlagDiscrepancy = async (receipt) => {
    setProcessing(true);
    try {
      await orderService.flagDiscrepancy(receipt.id, discrepancyNote);
      invalidateCache('/receipts');
      toast.success(t('receiptConfirm.discrepancyFlagged') || 'Discrepancy flagged');
      fetchReceipts();
    } catch (err) {
      console.error('Failed to flag discrepancy:', err);
      toast.error(err.userMessage || err.response?.data?.message || 'Failed to flag discrepancy');
    } finally {
      setProcessing(false);
      setConfirmModal(null);
      setDiscrepancyNote('');
    }
  };

  // Filtered
  const filtered = useMemo(() => {
    return receipts.filter(receipt => {
      if (statusFilter !== 'all' && receipt.status !== statusFilter) return false;
      if (searchTerm) {
        return (
          viIncludes(receipt.receiptNumber || '', searchTerm) ||
          viIncludes(receipt.poReference || '', searchTerm) ||
          viIncludes(receipt.brandName || '', searchTerm)
        );
      }
      return true;
    });
  }, [receipts, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = receipts.length;
    const pending = receipts.filter(r => r.status === 'PENDING').length;
    const confirmed = receipts.filter(r => r.status === 'CONFIRMED').length;
    const discrepancy = receipts.filter(r => r.status === 'DISCREPANCY').length;
    const partial = receipts.filter(r => r.status === 'PARTIAL').length;

    return {
      total, pending, confirmed, discrepancy, partial,
      confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      discrepancyPct: total > 0 ? Math.round((discrepancy / total) * 100) : 0,
      statusBreakdown: [
        { label: t('receiptConfirm.statusPending'), value: pending, color: '#D97706' },
        { label: t('receiptConfirm.statusConfirmed'), value: confirmed, color: '#1B6B45' },
        { label: t('receiptConfirm.statusDiscrepancy'), value: discrepancy, color: '#DC3545' },
        { label: t('receiptConfirm.statusPartial'), value: partial, color: '#A371F7' },
      ].filter(b => b.value > 0),
    };
  }, [receipts, t]);

  const bg = 'bg-[#FAF8F5]';
  const cardBg = 'bg-[#FFFFFF]';
  const border = 'border-[#E8E2DB]';
  const textPrimary = 'text-[#2C2417]';
  const textSecondary = 'text-[#6B5D4F]';
  const textMuted = 'text-[#8C8178]';

  return (
    <div className={`min-h-screen ${bg} p-4`}>
      {/* Compact Header + Filters */}
      <div className={`border ${border} rounded-xl px-3 py-2 mb-3 bg-white`}>
        <div className="flex flex-wrap items-center gap-3">
          <Receipt size={14} className="text-content-muted flex-shrink-0" />
          <div className="flex-shrink-0">
            <h1 className={`text-sm font-semibold font-brand ${textPrimary} leading-tight`}>
              {t('screenConfig.receiptConfirmation')}
            </h1>
            <p className={`text-[10px] ${textMuted} leading-tight`}>
              {t('receiptConfirm.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${border} bg-white w-48`}>
              <Search size={12} className={textMuted} />
              <input
                type="text"
                placeholder={t('receiptConfirm.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-transparent outline-none text-xs w-full font-brand ${textPrimary} placeholder:${textMuted}`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}>
                  <X size={10} className={textMuted} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none px-2 py-1 pr-6 rounded-lg border ${border} bg-white text-xs font-brand ${textPrimary} outline-none cursor-pointer`}
              >
                <option value="all">{t('common.status')}</option>
                <option value="PENDING">{t('receiptConfirm.statusPending')}</option>
                <option value="CONFIRMED">{t('receiptConfirm.statusConfirmed')}</option>
                <option value="DISCREPANCY">{t('receiptConfirm.statusDiscrepancy')}</option>
                <option value="PARTIAL">{t('receiptConfirm.statusPartial')}</option>
              </select>
              <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>

            <button
              onClick={fetchReceipts}
              className={`px-2.5 py-1 rounded-lg border ${border} text-xs font-medium font-brand transition-all text-[#A67B3D] hover:bg-surface-secondary`}
            >
              {t('common.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <ExpandableStatCard
          title={t('receiptConfirm.totalReceipts')}
          value={stats.total}
          sub={t('receiptConfirm.allReceipts')}
          icon={Receipt}
          accent="gold"
          breakdown={stats.statusBreakdown}
          expandTitle={t('receiptConfirm.allStatuses')}
        />
        <ExpandableStatCard
          title={t('receiptConfirm.pendingReceipts')}
          value={stats.pending}
          sub={t('receiptConfirm.awaitingCheck')}
          icon={Clock}
          accent="amber"
          trendLabel={stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : '0%'}
          trend={stats.pending > 0 ? -1 : 0}
        />
        <ExpandableStatCard
          title={t('receiptConfirm.confirmedReceipts')}
          value={stats.confirmed}
          sub={t('receiptConfirm.goodsReceived')}
          icon={CheckCircle}
          accent="emerald"
          progress={stats.confirmedPct}
          progressLabel={t('receiptConfirm.statusConfirmed')}
        />
        <ExpandableStatCard
          title={t('receiptConfirm.discrepancies')}
          value={stats.discrepancy}
          sub={t('receiptConfirm.needsAttention')}
          icon={AlertCircle}
          accent="red"
          progress={stats.discrepancyPct}
          progressLabel={t('receiptConfirm.statusDiscrepancy')}
          badges={[
            { label: t('receiptConfirm.statusPartial'), value: stats.partial, color: '#A371F7' },
          ].filter(b => b.value > 0)}
        />
      </div>

      {/* Table */}
      <div className={`border ${border} rounded-xl overflow-hidden bg-white`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#A67B3D]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{t('receiptConfirm.loadingReceipts')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#DC3545]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchReceipts} className="mt-3 px-4 py-2 rounded-xl bg-[#C4975A] text-white text-sm font-medium font-brand">
              {t('common.tryAgain')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ClipboardCheck size={48} className={textMuted} />
            <p className={`text-base font-semibold mt-4 font-brand ${textPrimary}`}>{t('receiptConfirm.noReceipts')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('receiptConfirm.noReceiptsDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`bg-[#FBF9F7] border-b ${border}`}>
                  {[t('receiptConfirm.colReceipt'), t('receiptConfirm.colPORef'), t('receiptConfirm.colBrand'), t('receiptConfirm.colItems'), t('receiptConfirm.colStatus'), t('receiptConfirm.colDate'), t('common.actions')].map((h) => (
                    <th key={h} className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand ${textMuted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((receipt, idx) => {
                  const sc = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.PENDING;
                  return (
                    <tr key={receipt.id || idx} className={`border-b ${border} transition-colors hover:bg-[#FBF9F7]`}>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-semibold font-data ${textPrimary}`}>{receipt.receiptNumber}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-data ${textSecondary}`}>{receipt.poReference}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-brand ${textPrimary}`}>{receipt.brandName}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-data ${textPrimary}`}>{receipt.itemCount}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-data"
                          style={{ color: sc.color, backgroundColor: sc.bg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-xs font-data ${textMuted}`}>
                          {receipt.receivedDate
                            ? new Date(receipt.receivedDate).toLocaleDateString('vi-VN')
                            : receipt.createdAt
                              ? new Date(receipt.createdAt).toLocaleDateString('vi-VN')
                              : '-'
                          }
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        {receipt.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setConfirmModal({ receipt, action: 'confirm' }); setDiscrepancyNote(''); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand transition-all bg-[rgba(27,107,69,0.12)] text-[#1B6B45] hover:bg-[rgba(27,107,69,0.2)]"
                            >
                              <CheckCircle size={13} />
                              {t('common.confirm')}
                            </button>
                            <button
                              onClick={() => { setConfirmModal({ receipt, action: 'discrepancy' }); setDiscrepancyNote(''); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand transition-all bg-[rgba(220,53,69,0.1)] text-[#DC3545] hover:bg-[rgba(220,53,69,0.18)]"
                            >
                              <AlertCircle size={13} />
                              {t('receiptConfirm.flag')}
                            </button>
                          </div>
                        )}
                        {receipt.status === 'CONFIRMED' && (
                          <span className={`text-xs font-brand text-[#1B6B45]`}>
                            <CheckCircle size={14} className="inline mr-1" />
                            {t('receiptConfirm.verified')}
                          </span>
                        )}
                        {receipt.status === 'DISCREPANCY' && (
                          <span className={`text-xs font-brand text-[#DC3545]`}>
                            <AlertCircle size={14} className="inline mr-1" />
                            {t('receiptConfirm.underReview')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm/Discrepancy Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} ${cardBg} shadow-2xl`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-brand ${textPrimary}`}>
                  {confirmModal.action === 'confirm' ? t('receiptConfirm.confirmReceipt') : t('receiptConfirm.flagDiscrepancy')}
                </h3>
                <button onClick={() => setConfirmModal(null)} className="p-1.5 rounded-lg hover:bg-[#F0EBE5]">
                  <X size={18} className={textMuted} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className={`rounded-xl border ${border} p-4 bg-[#FBF9F7]`}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colReceipt')}</span>
                    <span className={`text-sm font-semibold font-data ${textPrimary}`}>{confirmModal.receipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colPORef')}</span>
                    <span className={`text-sm font-data ${textSecondary}`}>{confirmModal.receipt.poReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colBrand')}</span>
                    <span className={`text-sm font-brand ${textPrimary}`}>{confirmModal.receipt.brandName}</span>
                  </div>
                </div>
              </div>

              {confirmModal.action === 'discrepancy' && (
                <div className="mt-4">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>
                    {t('receiptConfirm.discrepancyNote')}
                  </label>
                  <textarea
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-xl border ${border} bg-[#FBF9F7] text-sm font-brand ${textPrimary} outline-none resize-none focus:border-[#C4975A]`}
                    placeholder={t('receiptConfirm.discrepancyPlaceholder')}
                  />
                </div>
              )}
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button
                onClick={() => setConfirmModal(null)}
                className={`px-4 py-2 rounded-xl border ${border} text-sm font-medium font-brand ${textSecondary} transition-all hover:bg-[#F0EBE5]`}
              >
                {t('common.back')}
              </button>
              <button
                onClick={() => confirmModal.action === 'confirm' ? handleConfirmReceipt(confirmModal.receipt) : handleFlagDiscrepancy(confirmModal.receipt)}
                disabled={processing || (confirmModal.action === 'discrepancy' && !discrepancyNote.trim())}
                className={`px-5 py-2 rounded-xl text-sm font-semibold font-brand transition-all disabled:opacity-50 ${
                  confirmModal.action === 'confirm'
                    ? 'bg-[#1B6B45] text-white hover:bg-[#155936]'
                    : 'bg-[#DC3545] text-white hover:bg-[#c82333]'
                }`}
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : confirmModal.action === 'confirm' ? t('common.confirm') : t('receiptConfirm.submitFlag')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptConfirmationScreen;
