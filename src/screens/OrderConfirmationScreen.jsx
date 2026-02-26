'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, CheckCircle, Clock, Loader2, Package,
  Search, ChevronDown, X, AlertTriangle, FileText,
  DollarSign, Truck, XCircle, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { budgetService, proposalService, orderService } from '../services';
import api, { invalidateCache } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatCurrency } from '../utils';
import { ExpandableStatCard } from '../components/Common';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const ORDER_STATUS = {
  PENDING: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Pending' },
  CONFIRMED: { color: '#1B6B45', bg: 'rgba(27,107,69,0.12)', label: 'Confirmed' },
  SHIPPED: { color: '#2563EB', bg: 'rgba(37,99,235,0.12)', label: 'Shipped' },
  CANCELLED: { color: '#DC3545', bg: 'rgba(220,53,69,0.12)', label: 'Cancelled' },
  PARTIAL: { color: '#A371F7', bg: 'rgba(163,113,247,0.12)', label: 'Partial' },
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const OrderConfirmationScreen = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try dedicated endpoint first
      const response = await api.get('/orders');
      const data = response.data.data || response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      // Fallback: derive from approved proposals
      try {
        const proposals = await proposalService.getAll({ status: 'APPROVED' });
        const data = Array.isArray(proposals) ? proposals : (proposals?.data || []);
        const mapped = data.map((p, idx) => ({
          id: p.id || idx + 1,
          poNumber: `PO-${String(p.id || idx + 1).padStart(5, '0')}`,
          brandName: p.brand?.name || p.brandName || '-',
          season: p.seasonGroup || p.season || '-',
          skuCount: p.items?.length || p.skuCount || 0,
          totalValue: Number(p.totalValue || p.amount || 0),
          status: 'PENDING',
          createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
          proposalId: p.id,
        }));
        setOrders(mapped);
      } catch (fallbackErr) {
        console.error('Failed to fetch orders:', fallbackErr);
        setError(t('orderConfirm.failedToLoad'));
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (order) => {
    setProcessing(true);
    try {
      await orderService.confirmOrder(order.id);
      invalidateCache('/orders');
      invalidateCache('/proposals');
      toast.success(t('orderConfirm.orderConfirmed') || 'Order confirmed');
      fetchOrders();
    } catch (err) {
      console.error('Failed to confirm order:', err);
      toast.error(err.userMessage || err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleCancelOrder = async (order) => {
    setProcessing(true);
    try {
      await orderService.cancelOrder(order.id);
      invalidateCache('/orders');
      invalidateCache('/proposals');
      toast.success(t('orderConfirm.orderCancelled') || 'Order cancelled');
      fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast.error(err.userMessage || err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  // Filtered
  const filtered = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (order.poNumber || '').toLowerCase().includes(term) ||
          (order.brandName || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const confirmed = orders.filter(o => o.status === 'CONFIRMED').length;
    const shipped = orders.filter(o => o.status === 'SHIPPED').length;
    const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
    const totalValue = orders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const confirmedValue = orders.filter(o => o.status === 'CONFIRMED').reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const pendingValue = orders.filter(o => o.status === 'PENDING').reduce((sum, o) => sum + (o.totalValue || 0), 0);

    return {
      total, pending, confirmed, shipped, cancelled, totalValue, confirmedValue, pendingValue,
      confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      statusBreakdown: [
        { label: t('orderConfirm.statusPending'), value: pending, color: '#D97706' },
        { label: t('orderConfirm.statusConfirmed'), value: confirmed, color: '#1B6B45' },
        { label: t('orderConfirm.statusShipped'), value: shipped, color: '#2563EB' },
        { label: t('orderConfirm.statusCancelled'), value: cancelled, color: '#DC3545' },
      ].filter(b => b.value > 0),
      valueBreakdown: [
        { label: t('orderConfirm.statusPending'), value: pendingValue, displayValue: formatCurrency(pendingValue), color: '#D97706' },
        { label: t('orderConfirm.statusConfirmed'), value: confirmedValue, displayValue: formatCurrency(confirmedValue), color: '#1B6B45' },
      ].filter(b => b.value > 0),
    };
  }, [orders, t]);

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
          <ShoppingCart size={14} className="text-content-muted flex-shrink-0" />
          <div className="flex-shrink-0">
            <h1 className={`text-sm font-semibold font-brand ${textPrimary} leading-tight`}>
              {t('screenConfig.orderConfirmation')}
            </h1>
            <p className={`text-[10px] ${textMuted} leading-tight`}>
              {t('orderConfirm.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${border} bg-white w-48`}>
              <Search size={12} className={textMuted} />
              <input
                type="text"
                placeholder={t('orderConfirm.searchPlaceholder')}
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
                <option value="PENDING">{t('orderConfirm.statusPending')}</option>
                <option value="CONFIRMED">{t('orderConfirm.statusConfirmed')}</option>
                <option value="SHIPPED">{t('orderConfirm.statusShipped')}</option>
                <option value="CANCELLED">{t('orderConfirm.statusCancelled')}</option>
              </select>
              <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>

            <button
              onClick={fetchOrders}
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
          title={t('orderConfirm.totalOrders')}
          value={stats.total}
          sub={t('orderConfirm.allPurchaseOrders')}
          icon={ShoppingCart}
          accent="gold"
          breakdown={stats.statusBreakdown}
          expandTitle={t('orderConfirm.allStatuses')}
        />
        <ExpandableStatCard
          title={t('orderConfirm.pendingConfirm')}
          value={stats.pending}
          sub={t('orderConfirm.awaitingConfirmation')}
          icon={Clock}
          accent="amber"
          trendLabel={stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : '0%'}
          trend={stats.pending > 0 ? -1 : 0}
        />
        <ExpandableStatCard
          title={t('orderConfirm.confirmed')}
          value={stats.confirmed}
          sub={t('orderConfirm.ordersConfirmed')}
          icon={CheckCircle}
          accent="emerald"
          progress={stats.confirmedPct}
          progressLabel={t('orderConfirm.statusConfirmed')}
          badges={[
            { label: t('orderConfirm.statusShipped'), value: stats.shipped, color: '#2563EB' },
          ].filter(b => b.value > 0)}
        />
        <ExpandableStatCard
          title={t('orderConfirm.totalValue')}
          value={formatCurrency(stats.totalValue)}
          sub={t('orderConfirm.allOrdersValue')}
          icon={DollarSign}
          accent="blue"
          breakdown={stats.valueBreakdown}
          expandTitle={t('orderConfirm.colValue')}
        />
      </div>

      {/* Table */}
      <div className={`border ${border} rounded-xl overflow-hidden`} style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(196,151,90,0.03) 35%, rgba(196,151,90,0.08) 100%)',
      }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#A67B3D]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{t('orderConfirm.loadingOrders')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#DC3545]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchOrders} className="mt-3 px-4 py-2 rounded-xl bg-[#C4975A] text-white text-sm font-medium font-brand">
              {t('common.tryAgain')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={48} className={textMuted} />
            <p className={`text-base font-semibold mt-4 font-brand ${textPrimary}`}>{t('orderConfirm.noOrders')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('orderConfirm.noOrdersDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`bg-[#FBF9F7] border-b ${border}`}>
                  {[t('orderConfirm.colPO'), t('orderConfirm.colBrand'), t('orderConfirm.colSeason'), t('orderConfirm.colSKUs'), t('orderConfirm.colValue'), t('orderConfirm.colStatus'), t('orderConfirm.colDate'), t('common.actions')].map((h) => (
                    <th key={h} className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand ${textMuted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => {
                  const sc = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
                  return (
                    <tr key={order.id || idx} className={`border-b ${border} transition-colors hover:bg-[#FBF9F7]`}>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-semibold font-data ${textPrimary}`}>{order.poNumber}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-brand ${textPrimary}`}>{order.brandName}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-brand ${textSecondary}`}>{order.season}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-data ${textPrimary}`}>{order.skuCount}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-semibold font-data ${textPrimary}`}>{formatCurrency(order.totalValue)}</span>
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
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        {order.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmModal({ order, action: 'confirm' })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand transition-all bg-[rgba(27,107,69,0.12)] text-[#1B6B45] hover:bg-[rgba(27,107,69,0.2)]"
                            >
                              <CheckCircle size={13} />
                              {t('common.confirm')}
                            </button>
                            <button
                              onClick={() => setConfirmModal({ order, action: 'cancel' })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand transition-all bg-[rgba(220,53,69,0.1)] text-[#DC3545] hover:bg-[rgba(220,53,69,0.18)]"
                            >
                              <XCircle size={13} />
                              {t('common.cancel')}
                            </button>
                          </div>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <span className={`text-xs font-brand ${textMuted}`}>
                            <Truck size={14} className="inline mr-1" />
                            {t('orderConfirm.readyToShip')}
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

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} ${cardBg} shadow-2xl`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-brand ${textPrimary}`}>
                  {confirmModal.action === 'confirm' ? t('orderConfirm.confirmOrder') : t('orderConfirm.cancelOrder')}
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
                    <span className={`text-xs ${textMuted}`}>{t('orderConfirm.colPO')}</span>
                    <span className={`text-sm font-semibold font-data ${textPrimary}`}>{confirmModal.order.poNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('orderConfirm.colBrand')}</span>
                    <span className={`text-sm font-brand ${textPrimary}`}>{confirmModal.order.brandName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('orderConfirm.colValue')}</span>
                    <span className={`text-sm font-semibold font-data ${textPrimary}`}>{formatCurrency(confirmModal.order.totalValue)}</span>
                  </div>
                </div>
              </div>
              {confirmModal.action === 'cancel' && (
                <p className="text-sm mt-4 text-[#DC3545]">
                  {t('orderConfirm.cancelWarning')}
                </p>
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
                onClick={() => confirmModal.action === 'confirm' ? handleConfirmOrder(confirmModal.order) : handleCancelOrder(confirmModal.order)}
                disabled={processing}
                className={`px-5 py-2 rounded-xl text-sm font-semibold font-brand transition-all disabled:opacity-50 ${
                  confirmModal.action === 'confirm'
                    ? 'bg-[#1B6B45] text-white hover:bg-[#155a39]'
                    : 'bg-[#DC3545] text-white hover:bg-[#c82333]'
                }`}
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : confirmModal.action === 'confirm' ? t('common.confirm') : t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmationScreen;
