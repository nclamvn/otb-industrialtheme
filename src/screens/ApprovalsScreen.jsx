'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck, CheckCircle, XCircle, Clock, Loader2,
  Search, ChevronDown, Eye, MessageSquare,
  X, AlertTriangle, Shield, ArrowUpRight,
  CheckSquare, Square, MinusSquare,
  Wallet, BarChart3, Package, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { approvalService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '../utils';
import { includes as viIncludes } from '../utils/normalizeVietnamese';
import { ExpandableStatCard } from '../components/Common';
import { useIsMobile } from '@/hooks/useIsMobile';
import { SwipeAction, MobileDataCard, MobileFilterSheet, TableSkeleton } from '@/components/ui';
import FilterSelect from '@/components/ui/FilterSelect';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const STATUS_CONFIG = {
  SUBMITTED: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Pending L1' },
  LEVEL1_APPROVED: { color: '#2563EB', bg: 'rgba(37,99,235,0.12)', label: 'Pending L2' },
  LEVEL2_APPROVED: { color: '#1B6B45', bg: 'rgba(27,107,69,0.12)', label: 'Approved' },
  APPROVED: { color: '#1B6B45', bg: 'rgba(27,107,69,0.12)', label: 'Approved' },
  LEVEL1_REJECTED: { color: '#DC3545', bg: 'rgba(220,53,69,0.12)', label: 'Rejected' },
  LEVEL2_REJECTED: { color: '#DC3545', bg: 'rgba(220,53,69,0.12)', label: 'Rejected' },
  REJECTED: { color: '#DC3545', bg: 'rgba(220,53,69,0.12)', label: 'Rejected' },
};

const ENTITY_ICONS = {
  budget: { icon: Wallet, color: '#C4975A' },
  planning: { icon: BarChart3, color: '#2563EB' },
  proposal: { icon: Package, color: '#7C3AED' },
};
const ENTITY_FALLBACK = { icon: ClipboardList, color: '#8C8178' };
const EntityIcon = ({ type, size = 16 }) => {
  const cfg = ENTITY_ICONS[type] || ENTITY_FALLBACK;
  const Icon = cfg.icon;
  return <Icon size={size} strokeWidth={2} style={{ color: cfg.color }} />;
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const ApprovalsScreen = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [bulkRejectComment, setBulkRejectComment] = useState('');

  // Fetch pending approvals
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await approvalService.getPending();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
      setError(t('approvals.failedToLoad'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject
  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      const { item, action } = actionModal;
      if (action === 'approve') {
        await approvalService.approve(item.entityType, item.entityId, item.level, comment);
      } else {
        await approvalService.reject(item.entityType, item.entityId, item.level, comment);
      }
      toast.success(action === 'approve' ? t('common.approved') : t('common.rejected'));

      // Auto-advance: find next item in filtered list
      const currentIdx = filtered.findIndex(
        fi => fi.entityType === item.entityType && fi.entityId === item.entityId
      );
      const nextItem = filtered[currentIdx + 1] || filtered[currentIdx - 1];

      setActionModal(null);
      setComment('');
      await fetchPendingApprovals();

      if (!nextItem) {
        toast(t('common.allItemsReviewed'), { icon: '🎉' });
      }
    } catch (err) {
      console.error('Action failed:', err);
      toast.error(t('common.error'));
    } finally {
      setProcessing(false);
    }
  };

  // Bulk selection helpers
  const getItemKey = (item) => `${item.entityType}:${item.entityId}`;

  const toggleSelect = useCallback((key) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  // Clear selection when filters/data change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [entityFilter, levelFilter, searchTerm, items]);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (entityFilter !== 'all' && item.entityType !== entityFilter) return false;
      if (levelFilter !== 'all' && item.level !== parseInt(levelFilter)) return false;
      if (searchTerm) {
        const name = item.data?.name || item.data?.budgetName || '';
        const brand = item.data?.brand?.name || item.data?.brandName || '';
        return viIncludes(name, searchTerm) || viIncludes(brand, searchTerm);
      }
      return true;
    });
  }, [items, entityFilter, levelFilter, searchTerm]);

  // Select all toggle
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === filtered.length && filtered.length > 0) return new Set();
      return new Set(filtered.map(getItemKey));
    });
  }, [filtered]);

  // Bulk approve/reject handler
  const handleBulkAction = useCallback(async (action, comment) => {
    if (selectedIds.size === 0) return;
    if (action === 'reject' && !bulkRejectModalOpen) {
      setBulkRejectComment('');
      setBulkRejectModalOpen(true);
      return;
    }

    const selectedItems = filtered.filter((item) => selectedIds.has(getItemKey(item)));
    if (selectedItems.length === 0) return;

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of selectedItems) {
      try {
        if (action === 'approve') {
          await approvalService.approve(item.entityType, item.entityId, item.level);
        } else {
          await approvalService.reject(item.entityType, item.entityId, item.level, comment || '');
        }
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to ${action} ${item.entityType} ${item.entityId}:`, err);
      }
    }

    setBulkProcessing(false);
    setSelectedIds(new Set());
    setBulkRejectModalOpen(false);
    setBulkRejectComment('');

    if (successCount > 0) {
      toast.success(`${action === 'approve' ? t('approvals.approve') : t('approvals.reject')}: ${successCount} ${t('approvals.itemsProcessed') || 'items processed'}`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} ${t('approvals.itemsFailed') || 'items failed'}`);
    }

    await fetchPendingApprovals();
  }, [selectedIds, filtered, t, bulkRejectModalOpen]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const l1 = items.filter(i => i.level === 1).length;
    const l2 = items.filter(i => i.level === 2).length;
    const budgets = items.filter(i => i.entityType === 'budget').length;
    const plannings = items.filter(i => i.entityType === 'planning').length;
    const proposals = items.filter(i => i.entityType === 'proposal').length;

    return {
      total, l1, l2, budgets, plannings, proposals,
      entityBreakdown: [
        { label: t('approvals.typeBudget'), value: budgets, color: '#C4975A' },
        { label: t('approvals.typePlanning'), value: plannings, color: '#2563EB' },
        { label: t('approvals.typeProposal'), value: proposals, color: '#1B6B45' },
      ].filter(b => b.value > 0),
      levelBreakdown: [
        { label: 'Level 1', value: l1, color: '#2563EB' },
        { label: 'Level 2', value: l2, color: '#A371F7' },
      ].filter(b => b.value > 0),
      l1Pct: total > 0 ? Math.round((l1 / total) * 100) : 0,
      l2Pct: total > 0 ? Math.round((l2 / total) * 100) : 0,
      budgetPct: total > 0 ? Math.round((budgets / total) * 100) : 0,
    };
  }, [items, t]);

  const bg = 'bg-[#FAF8F5]';
  const cardBg = 'bg-[#FFFFFF]';
  const border = 'border-[#E8E2DB]';
  const textPrimary = 'text-[#2C2417]';
  const textSecondary = 'text-[#6B5D4F]';
  const textMuted = 'text-[#8C8178]';

  return (
    <div className={`min-h-screen ${bg} ${isMobile ? 'p-0' : 'p-4'}`}>
      {/* Mobile Filter Sheet */}
      {isMobile && (
        <MobileFilterSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          title={t('budget.filters')}
          filters={[
            { key: 'entityFilter', label: t('approvals.colType'), type: 'select', options: [
              { value: 'all', label: t('approvals.colType') },
              { value: 'budget', label: t('approvals.typeBudget') },
              { value: 'planning', label: t('approvals.typePlanning') },
              { value: 'proposal', label: t('approvals.typeProposal') },
            ]},
            { key: 'levelFilter', label: t('approvals.colLevel'), type: 'select', options: [
              { value: 'all', label: t('approvals.colLevel') },
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ]},
            { key: 'search', label: t('approvals.searchPlaceholder'), type: 'search' },
          ]}
          values={{ entityFilter, levelFilter, search: searchTerm }}
          onApply={(v) => { setEntityFilter(v.entityFilter || 'all'); setLevelFilter(v.levelFilter || 'all'); setSearchTerm(v.search || ''); }}
          onReset={() => { setEntityFilter('all'); setLevelFilter('all'); setSearchTerm(''); }}
        />
      )}

      {/* Compact Header + Filters */}
      <div className={`border ${border} rounded-xl px-3 py-2 mb-3 bg-white`}>
        <div className="flex flex-wrap items-center gap-3">
          <FileCheck size={14} className="text-content-muted flex-shrink-0" />
          <div className="flex-shrink-0">
            <h1 className={`text-sm font-semibold font-brand ${textPrimary} leading-tight`}>
              {t('screenConfig.approvals')}
            </h1>
            <p className={`text-[10px] ${textMuted} leading-tight`}>
              {t('approvals.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {isMobile ? (
              <button
                onClick={() => setShowMobileFilters(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${border} text-xs font-medium ${
                  (entityFilter !== 'all' || levelFilter !== 'all' || searchTerm)
                    ? 'border-[rgba(196,151,90,0.4)] text-[#A67B3D]'
                    : 'text-[#8C8178]'
                }`}
              >
                <ChevronDown size={12} />
              </button>
            ) : (
              <>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${border} bg-[#FBF9F7] w-48`}>
                  <Search size={12} className={textMuted} />
                  <input
                    type="text"
                    placeholder={t('approvals.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`bg-transparent outline-none text-xs w-full font-brand ${textPrimary} placeholder:${textMuted}`}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} aria-label={t('common.clearAll')} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <X size={10} className={textMuted} />
                    </button>
                  )}
                </div>

                <div className="shrink-0 w-[140px]">
                  <FilterSelect
                    options={[
                      { value: 'all', label: t('approvals.colType') },
                      { value: 'budget', label: t('approvals.typeBudget') },
                      { value: 'planning', label: t('approvals.typePlanning') },
                      { value: 'proposal', label: t('approvals.typeProposal') },
                    ]}
                    value={entityFilter}
                    onChange={(v) => setEntityFilter(v)}
                    searchable={false}
                    compact
                  />
                </div>

                <div className="shrink-0 w-[120px]">
                  <FilterSelect
                    options={[
                      { value: 'all', label: t('approvals.colLevel') },
                      { value: '1', label: 'Level 1' },
                      { value: '2', label: 'Level 2' },
                    ]}
                    value={levelFilter}
                    onChange={(v) => setLevelFilter(v)}
                    searchable={false}
                    compact
                  />
                </div>

                <button
                  onClick={fetchPendingApprovals}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border ${border} text-xs font-medium font-brand transition-all text-[#A67B3D] hover:bg-[rgba(196,151,90,0.1)]`}
                >
                  {t('common.refresh')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <ExpandableStatCard
          title={t('approvals.totalPending')}
          value={stats.total}
          sub={t('approvals.awaitingReview')}
          icon={Clock}
          accent="amber"
          breakdown={stats.entityBreakdown}
          expandTitle={t('approvals.allTypes')}
        />
        <ExpandableStatCard
          title={t('approvals.level1Pending')}
          value={stats.l1}
          sub={t('approvals.initialReview')}
          icon={Shield}
          accent="blue"
          progress={stats.l1Pct}
          progressLabel="Level 1"
          breakdown={stats.entityBreakdown}
        />
        <ExpandableStatCard
          title={t('approvals.level2Pending')}
          value={stats.l2}
          sub={t('approvals.finalApproval')}
          icon={FileCheck}
          accent="emerald"
          progress={stats.l2Pct}
          progressLabel="Level 2"
          badges={[
            { label: t('approvals.typeBudget'), value: stats.budgets, color: '#C4975A' },
            { label: t('approvals.typePlanning'), value: stats.plannings, color: '#2563EB' },
          ].filter(b => b.value > 0)}
        />
        <ExpandableStatCard
          title={t('approvals.budgetItems')}
          value={stats.budgets}
          sub={t('approvals.budgetRequests')}
          icon={ArrowUpRight}
          accent="gold"
          progress={stats.budgetPct}
          progressLabel={t('approvals.typeBudget')}
        />
      </div>

      {/* Table */}
      <div className={`border ${border} rounded-xl overflow-hidden bg-white`}>
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} columns={5} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#DC3545]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchPendingApprovals} className="mt-3 px-4 py-2 rounded-xl bg-[#C4975A] text-white text-sm font-medium font-brand">
              {t('common.retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle size={48} className="text-[#1B6B45]" />
            <p className={`text-base font-semibold mt-4 font-brand ${textPrimary}`}>{t('approvals.allCaughtUp')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('approvals.noPendingItems')}</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Swipeable Cards */
          <div className="p-3 space-y-3">
            {filtered.map((item, idx) => {
              const status = item.data?.status || 'SUBMITTED';
              const sc = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
              const name = item.data?.name || item.data?.budgetName || `${item.entityType} #${item.entityId}`;
              const brand = item.data?.brand?.name || item.data?.brandName || '-';

              return (
                <SwipeAction
                  key={`${item.entityType}-${item.entityId}-${idx}`}
                  onSwipeRight={() => { setActionModal({ item, action: 'approve' }); setComment(''); }}
                  onSwipeLeft={() => { setActionModal({ item, action: 'reject' }); setComment(''); }}
                  rightLabel={t('approvals.approve')}
                  leftLabel={t('approvals.reject')}
                >
                  <MobileDataCard
                    title={name}
                    subtitle={<span className="inline-flex items-center gap-1"><EntityIcon type={item.entityType} size={12} />{item.entityType} · {brand}</span>}
                    status={sc.label}
                    statusColor={sc.color === '#1B6B45' ? 'success' : sc.color === '#DC3545' ? 'critical' : sc.color === '#2563EB' ? 'info' : 'warning'}
                    metrics={[
                      { label: t('approvals.colLevel'), value: `Level ${item.level}` },
                      { label: t('approvals.colSubmitted'), value: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('vi-VN') : '-' },
                    ]}
                    actions={[
                      { label: t('approvals.reject'), onClick: () => { setActionModal({ item, action: 'reject' }); setComment(''); } },
                      { label: t('approvals.approve'), primary: true, onClick: () => { setActionModal({ item, action: 'approve' }); setComment(''); } },
                    ]}
                  />
                </SwipeAction>
              );
            })}
          </div>
        ) : (
          /* Desktop: Table */
          <>
          {/* Bulk Action Toolbar */}
          {selectedIds.size > 0 && (
            <div className={`border ${border} rounded-xl px-3 py-2 mb-3 flex flex-wrap items-center gap-2 bg-white`}>
              <span className={`text-xs font-semibold font-brand ${textPrimary}`}>
                {selectedIds.size} {t('approvals.itemsSelected') || 'selected'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  disabled={bulkProcessing}
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand text-white bg-[#1B6B45] hover:bg-[#155a39] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  {t('approvals.approveSelected') || 'Approve Selected'}
                </button>
                <button
                  disabled={bulkProcessing}
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand text-white bg-[#DC3545] hover:bg-[#c82333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  {t('approvals.rejectSelected') || 'Reject Selected'}
                </button>
                <button
                  disabled={bulkProcessing}
                  onClick={deselectAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${border} text-xs font-medium font-brand transition-colors text-[#8C8178] hover:bg-[#F0EBE5] disabled:opacity-50`}
                >
                  <X size={13} />
                  {t('approvals.deselectAll') || 'Deselect'}
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`bg-[#FBF9F7] border-b ${border}`}>
                  <th className="px-3 py-2 w-8">
                    <button
                      onClick={toggleSelectAll}
                      className={`flex items-center justify-center ${textMuted} hover:text-[#A67B3D] transition-colors`}
                    >
                      {selectedIds.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={16} className="text-[#A67B3D]" />
                        : selectedIds.size > 0
                          ? <MinusSquare size={16} className="text-[#A67B3D]" />
                          : <Square size={16} />
                      }
                    </button>
                  </th>
                  {[t('approvals.colType'), t('approvals.colName'), t('approvals.colBrand'), t('approvals.colLevel'), t('approvals.colStatus'), t('approvals.colSubmitted'), t('common.actions')].map((h) => (
                    <th key={h} className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand ${textMuted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const status = item.data?.status || 'SUBMITTED';
                  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
                  const name = item.data?.name || item.data?.budgetName || `${item.entityType} #${item.entityId}`;
                  const brand = item.data?.brand?.name || item.data?.brandName || '-';
                  const itemKey = getItemKey(item);
                  const isSelected = selectedIds.has(itemKey);

                  return (
                    <tr
                      key={`${item.entityType}-${item.entityId}-${idx}`}
                      className={`border-b ${border} transition-colors ${isSelected ? 'bg-[rgba(196,151,90,0.08)]' : 'hover:bg-[#FBF9F7]'}`}
                    >
                      <td className="px-3 py-1.5 w-8">
                        <button
                          onClick={() => toggleSelect(itemKey)}
                          className={`flex items-center justify-center ${textMuted} hover:text-[#A67B3D] transition-colors`}
                        >
                          {isSelected
                            ? <CheckSquare size={16} className="text-[#A67B3D]" />
                            : <Square size={16} />
                          }
                        </button>
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <EntityIcon type={item.entityType} size={16} />
                          <span className={`text-sm font-medium font-brand capitalize ${textPrimary}`}>
                            {item.entityType}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-medium font-brand ${textPrimary}`}>{name}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-brand ${textSecondary}`}>{brand}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-data"
                          style={{ color: item.level === 1 ? '#2563EB' : '#A371F7', backgroundColor: item.level === 1 ? 'rgba(37,99,235,0.12)' : 'rgba(163,113,247,0.12)' }}>
                          L{item.level}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-data"
                          style={{ color: sc.color, backgroundColor: sc.bg }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-xs font-data ${textMuted}`}>
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setActionModal({ item, action: 'approve' }); setComment(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand transition-all bg-[rgba(27,107,69,0.12)] text-[#1B6B45] hover:bg-[rgba(27,107,69,0.2)]"
                          >
                            <CheckCircle size={13} />
                            {t('approvals.approve')}
                          </button>
                          <button
                            onClick={() => { setActionModal({ item, action: 'reject' }); setComment(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-brand transition-all bg-[rgba(220,53,69,0.1)] text-[#DC3545] hover:bg-[rgba(220,53,69,0.18)]"
                          >
                            <XCircle size={13} />
                            {t('approvals.reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Bulk Reject Comment Modal */}
      {bulkRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} shadow-2xl bg-white`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-brand ${textPrimary}`}>
                  {t('approvals.rejectSelected') || 'Reject Selected'}
                </h3>
                <button onClick={() => setBulkRejectModalOpen(false)} aria-label={t('common.close')} className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-[#F0EBE5]">
                  <X size={18} className={textMuted} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <p className={`text-sm mb-3 ${textSecondary}`}>
                {selectedIds.size} {t('approvals.itemsSelected') || 'items selected'}
              </p>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>
                {t('approvals.rejectReason') || 'Reason for rejection'}
              </label>
              <textarea
                value={bulkRejectComment}
                onChange={(e) => setBulkRejectComment(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-xl border ${border} bg-[#FBF9F7] text-sm font-brand ${textPrimary} outline-none resize-none focus:border-[#C4975A]`}
                placeholder={t('approvals.commentPlaceholder')}
              />
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button
                onClick={() => setBulkRejectModalOpen(false)}
                className={`px-4 py-2 rounded-xl border ${border} text-sm font-medium font-brand ${textSecondary} transition-all hover:bg-[#F0EBE5]`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleBulkAction('reject', bulkRejectComment)}
                disabled={bulkProcessing}
                className="px-5 py-2 rounded-xl text-sm font-semibold font-brand transition-all disabled:opacity-50 bg-[#DC3545] text-white hover:bg-[#c82333]"
              >
                {bulkProcessing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (t('approvals.rejectSelected') || 'Reject Selected')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} shadow-2xl bg-white`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-brand ${textPrimary}`}>
                  {actionModal.action === 'approve' ? t('approvals.confirmApprove') : t('approvals.confirmReject')}
                </h3>
                <button onClick={() => setActionModal(null)} aria-label={t('common.close')} className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-[#F0EBE5]">
                  <X size={18} className={textMuted} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className={`text-sm ${textSecondary}`}>
                  <span className="inline-flex items-center gap-1.5"><EntityIcon type={actionModal.item.entityType} size={14} /><span className="capitalize font-medium">{actionModal.item.entityType}</span></span>
                  {' — '}
                  <span className={textPrimary}>{actionModal.item.data?.name || actionModal.item.data?.budgetName || `#${actionModal.item.entityId}`}</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>
                  {t('approvals.commentOptional')}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${border} bg-[#FBF9F7] text-sm font-brand ${textPrimary} outline-none resize-none focus:border-[#C4975A]`}
                  placeholder={t('approvals.commentPlaceholder')}
                />
              </div>
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button
                onClick={() => setActionModal(null)}
                className={`px-4 py-2 rounded-xl border ${border} text-sm font-medium font-brand ${textSecondary} transition-all hover:bg-[#F0EBE5]`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`px-5 py-2 rounded-xl text-sm font-semibold font-brand transition-all disabled:opacity-50 ${
                  actionModal.action === 'approve'
                    ? 'bg-[#1B6B45] text-white hover:bg-[#155a39]'
                    : 'bg-[#DC3545] text-white hover:bg-[#c82333]'
                }`}
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : actionModal.action === 'approve' ? t('approvals.approve') : t('approvals.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsScreen;
