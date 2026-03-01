'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Eye, Loader2, Plus, X, LayoutList, LayoutGrid, Ticket, CircleCheckBig, DollarSign } from 'lucide-react';
import TicketKanbanBoard from '../components/TicketKanbanBoard';
import { ExpandableStatCard } from '../components/Common';
import { budgetService, planningService, proposalService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileDataCard, TableSkeleton } from '@/components/ui';
import FilterSelect from '@/components/ui/FilterSelect';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import { formatCurrency, formatDate } from '../utils';

/* =========================
   UTILS
========================= */

// Map API status to display status (uses t function)
const getDisplayStatus = (status, t) => {
  const statusMap = {
    'DRAFT': t ? t('ticket.statusDraft') : 'Draft',
    'SUBMITTED': t ? t('ticket.statusPending') : 'Pending',
    'LEVEL1_APPROVED': t ? t('ticket.statusPendingL2') : 'Pending L2',
    'LEVEL2_APPROVED': t ? t('ticket.statusApproved') : 'Approved',
    'APPROVED': t ? t('ticket.statusApproved') : 'Approved',
    'LEVEL1_REJECTED': t ? t('ticket.statusRejected') : 'Rejected',
    'LEVEL2_REJECTED': t ? t('ticket.statusRejected') : 'Rejected',
    'REJECTED': t ? t('ticket.statusRejected') : 'Rejected',
    'FINAL': t ? t('ticket.statusFinal') : 'Final'
  };
  return statusMap[status?.toUpperCase()] || status || (t ? t('ticket.statusUnknown') : 'Unknown');
};

// Get entity type label (uses t function)
const getEntityTypeLabel = (type, t) => {
  const labels = {
    'budget': t ? t('ticket.entityBudget') : 'Budget',
    'planning': t ? t('ticket.entityPlanning') : 'Planning',
    'proposal': t ? t('ticket.entityProposal') : 'SKU Proposal'
  };
  return labels[type] || type;
};

const SEASON_GROUPS = [
  { id: 'SS', label: 'Spring/Summer' },
  { id: 'FW', label: 'Fall/Winter' }
];

const SEASONS = [
  { id: 'Pre', label: 'Pre' },
  { id: 'Main', label: 'Main/Show' }
];


const TicketScreen = ({ onOpenTicketDetail }) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { isMobile } = useIsMobile();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newTicket, setNewTicket] = useState({
    budgetName: '',
    seasonGroup: '',
    season: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [budgetOptions, setBudgetOptions] = useState([]);

  // Close popup on Escape key
  useEffect(() => {
    if (!showCreatePopup) return;
    const handler = (e) => { if (e.key === 'Escape') setShowCreatePopup(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showCreatePopup]);

  // Fetch all tickets (budgets, plannings, proposals)
  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [budgetsRes, planningsRes, proposalsRes] = await Promise.all([
        budgetService.getAll().catch(() => ({ data: [] })),
        planningService.getAll().catch(() => ({ data: [] })),
        proposalService.getAll().catch(() => ({ data: [] }))
      ]);

      const allTickets = [];

      (budgetsRes.data || budgetsRes || []).forEach(b => {
        allTickets.push({
          id: b.id,
          entityType: 'budget',
          name: `${b.groupBrand?.name || 'Budget'} - ${b.seasonGroupId || ''} ${b.seasonType || ''}`,
          brand: b.groupBrand?.name || '-',
          seasonGroup: b.seasonGroupId || '-',
          season: b.seasonType || '-',
          createdBy: b.createdBy?.name || 'System',
          createdOn: b.createdAt ? formatDate(b.createdAt) : '-',
          status: b.status,
          totalBudget: Number(b.totalBudget) || 0,
          data: b
        });
      });

      (planningsRes.data || planningsRes || []).forEach(p => {
        allTickets.push({
          id: p.id,
          entityType: 'planning',
          name: p.planningCode || `Planning ${p.versionName || ''}`,
          brand: p.budgetDetail?.budget?.groupBrand?.name || '-',
          seasonGroup: p.budgetDetail?.budget?.seasonGroupId || '-',
          season: p.budgetDetail?.budget?.seasonType || '-',
          createdBy: p.createdBy?.name || 'System',
          createdOn: formatDate(p.createdAt) !== '—' ? formatDate(p.createdAt) : '-',
          status: p.status,
          totalBudget: Number(p.budgetDetail?.budgetAmount) || 0,
          data: p
        });
      });

      (proposalsRes.data || proposalsRes || []).forEach(pr => {
        allTickets.push({
          id: pr.id,
          entityType: 'proposal',
          name: pr.proposalCode || `Proposal ${pr.versionName || ''}`,
          brand: pr.planning?.budgetDetail?.budget?.groupBrand?.name || '-',
          seasonGroup: pr.planning?.budgetDetail?.budget?.seasonGroupId || '-',
          season: pr.planning?.budgetDetail?.budget?.seasonType || '-',
          createdBy: pr.createdBy?.name || 'System',
          createdOn: formatDate(pr.createdAt) !== '—' ? formatDate(pr.createdAt) : '-',
          status: pr.status,
          totalBudget: 0,
          data: pr
        });
      });

      allTickets.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
      setTickets(allTickets);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(t('ticket.failedToLoadTickets'));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Calculate stats
  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const approved = tickets.filter(t =>
      ['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(t.status?.toUpperCase())
    ).length;
    const pending = tickets.filter(t =>
      ['SUBMITTED', 'LEVEL1_APPROVED'].includes(t.status?.toUpperCase())
    ).length;
    const draft = tickets.filter(t => t.status?.toUpperCase() === 'DRAFT').length;
    const rejected = tickets.filter(t =>
      ['LEVEL1_REJECTED', 'LEVEL2_REJECTED', 'REJECTED'].includes(t.status?.toUpperCase())
    ).length;
    const totalSpending = tickets
      .filter(t => ['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(t.status?.toUpperCase()))
      .reduce((sum, t) => sum + (t.totalBudget || 0), 0);

    // By entity type
    const byType = {};
    tickets.forEach(tk => {
      const type = tk.entityType || 'other';
      byType[type] = (byType[type] || 0) + 1;
    });
    const typeBreakdown = Object.entries(byType)
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);

    return {
      totalTickets: total,
      approvedTickets: approved,
      pendingTickets: pending,
      draftTickets: draft,
      rejectedTickets: rejected,
      totalSpending,
      approvedPct: total > 0 ? Math.round((approved / total) * 100) : 0,
      typeBreakdown,
    };
  }, [tickets]);

  // Status styles
  const getStatusStyle = (status) => {
    const displayStatus = getDisplayStatus(status, t);
    const styles = {
      Approved: 'bg-green-100 text-[#1B6B45]',
      Final: 'bg-green-200 text-[#1B6B45]',
      Pending: 'bg-yellow-100 text-[#D97706]',
      'Pending L2': 'bg-purple-100 text-purple-700',
      Draft: 'bg-gray-100 text-[#6B5D4F]',
      Rejected: 'bg-red-100 text-[#DC3545]',
    };
    return styles[displayStatus] || styles['Draft'];
  };

  // Map API status to MobileDataCard statusColor
  const getStatusColor = (status) => {
    const upper = status?.toUpperCase();
    if (['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(upper)) return 'success';
    if (['SUBMITTED', 'LEVEL1_APPROVED'].includes(upper)) return 'warning';
    if (['LEVEL1_REJECTED', 'LEVEL2_REJECTED', 'REJECTED'].includes(upper)) return 'critical';
    if (upper === 'DRAFT') return 'neutral';
    return 'neutral';
  };

  // Entity type badge style
  const getEntityTypeStyle = (type) => {
    const styles = {
      budget: 'bg-[rgba(196,151,90,0.15)] text-[#7D5A28] border border-[rgba(196,151,90,0.4)]',
      planning: 'bg-blue-100 text-blue-700',
      proposal: 'bg-emerald-100 text-emerald-700',
    };
    return styles[type] || styles['budget'];
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* ===== PAGE TITLE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold font-brand text-content">
            {t('ticket.title')}
          </h1>
          <p className="text-[11px] text-content-muted">
            {t('ticket.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* View Toggle */}
          <div className="flex items-center rounded-md p-0.5 bg-surface-secondary border border-border-muted">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all duration-150 ${
                viewMode === 'table'
                  ? 'bg-white text-dafc-gold shadow-sm'
                  : 'text-content-muted hover:text-content'
              }`}
              title={t('ticket.tableView')}
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-all duration-150 ${
                viewMode === 'kanban'
                  ? 'bg-white text-dafc-gold shadow-sm'
                  : 'text-content-muted hover:text-content'
              }`}
              title={t('ticket.kanbanView')}
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {!isMobile && (
            <button
              onClick={() => setShowCreatePopup(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 bg-dafc-gold text-white hover:bg-[#A67B3D]"
            >
              <Plus size={12} />
              {t('ticket.createTicket')}
            </button>
          )}
        </div>
      </div>

      {/* ===== KPI HEADER ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <ExpandableStatCard
          title={t('ticket.totalTickets')}
          value={ticketStats.totalTickets}
          icon={Ticket}
          accent="blue"
          breakdown={ticketStats.typeBreakdown}
          expandTitle={t('home.kpiDetail.byEntityType')}
          badges={[
            { label: 'Pending', value: ticketStats.pendingTickets, color: '#D97706' },
            { label: 'Draft', value: ticketStats.draftTickets, color: '#8C8178' },
          ]}
        />
        <ExpandableStatCard
          title={t('ticket.approvedTickets')}
          value={ticketStats.approvedTickets}
          icon={CircleCheckBig}
          accent="emerald"
          progress={ticketStats.approvedPct}
          progressLabel={t('ticket.approvedTickets')}
          trendLabel={`${ticketStats.approvedPct}%`}
          trend={ticketStats.approvedPct > 50 ? 1 : -1}
        />
        <ExpandableStatCard
          title={t('ticket.totalSpending')}
          value={formatCurrency(ticketStats.totalSpending)}
          sub={t('ticket.approvedBudgetsOnly')}
          icon={DollarSign}
          accent="gold"
        />
      </div>

      {/* ===== TICKET CONTENT ===== */}
      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error ? (
        <div className="border rounded-lg p-4 text-center bg-white border-border-muted">
          <p className="text-xs text-[#DC3545] mb-3">{t('ticket.failedToLoadTickets')}: {error}</p>
          <button onClick={fetchTickets} className="px-4 py-2 rounded-xl bg-[#C4975A] text-white text-xs font-medium font-brand">
            {t('common.retry')}
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <TicketKanbanBoard
          tickets={tickets}
          onTicketClick={onOpenTicketDetail}
        />
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-sm rounded-lg border bg-white border-[#E8E2DB] text-[#8C8178]">
                  {t('ticket.noTicketsFound')}
                </div>
              ) : (
                tickets.map((ticket) => (
                  <MobileDataCard
                    key={`${ticket.entityType}-${ticket.id}`}
                    title={ticket.name}
                    subtitle={`${getEntityTypeLabel(ticket.entityType, t)} — ${ticket.brand}`}
                    status={getDisplayStatus(ticket.status, t)}
                    statusColor={getStatusColor(ticket.status)}
                    metrics={[
                      { label: t('ticket.seasonLabel'), value: `${ticket.seasonGroup} ${ticket.season}` },
                      { label: t('budget.createdBy'), value: ticket.createdBy },
                      { label: t('budget.createdOn'), value: ticket.createdOn },
                      ...(ticket.totalBudget > 0
                        ? [{ label: t('ticket.totalSpending'), value: formatCurrency(ticket.totalBudget) }]
                        : []),
                    ]}
                    actions={[
                      {
                        label: t('common.view'),
                        primary: true,
                        onClick: () => onOpenTicketDetail(ticket),
                      },
                    ]}
                    onClick={() => onOpenTicketDetail(ticket)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white border-border-muted">
              <table className="w-full text-xs">
                <thead className="bg-surface-secondary">
                  <tr>
                    {[t('common.name'), t('approval.brand'), t('ticket.seasonLabel'), t('budget.createdBy'), t('budget.createdOn'), t('common.status'), t('common.actions')].map((header, idx) => (
                      <th
                        key={header}
                        className={`px-3 py-2 text-left font-medium text-[10px] uppercase tracking-wider text-content-muted ${idx === 6 ? 'text-center' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-muted">
                  {tickets.map((ticket) => (
                    <tr
                      key={`${ticket.entityType}-${ticket.id}`}
                      className="transition-all duration-150 border-l-2 border-transparent hover:bg-dafc-gold/5 hover:border-l-dafc-gold"
                    >
                      <td className="px-3 py-2 font-medium text-content">
                        {ticket.name}
                      </td>
                      <td className="px-3 py-2 text-content-muted">
                        {ticket.brand}
                      </td>
                      <td className="px-3 py-2 font-data text-content-muted">
                        {ticket.seasonGroup} {ticket.season}
                      </td>
                      <td className="px-3 py-2 text-content-muted">
                        {ticket.createdBy}
                      </td>
                      <td className="px-3 py-2 font-data text-content-muted">
                        {ticket.createdOn}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusStyle(ticket.status)}`}>
                          {getDisplayStatus(ticket.status, t)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => onOpenTicketDetail(ticket)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium border rounded-md transition-all duration-150 text-dafc-gold border-dafc-gold/40 hover:bg-dafc-gold/5"
                        >
                          <Eye size={11} />
                          {t('common.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {tickets.length === 0 && (
                <div className="p-4 text-center text-xs text-content-muted">
                  {t('ticket.noTicketsFound')}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== CREATE TICKET POPUP ===== */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden bg-white">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border-muted bg-white">
              <h3 className="text-sm font-semibold font-brand text-content">{t('ticket.createNewTicket')}</h3>
              <button
                onClick={() => setShowCreatePopup(false)}
                aria-label={t('common.close')}
                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors hover:bg-surface-secondary"
              >
                <X size={16} className="text-content-muted" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium mb-1 text-content-muted">{t('ticket.budgetNameLabel')}</label>
                <div className="w-full">
                  <FilterSelect
                    options={tickets.filter(t => t.entityType === 'budget').map(b => ({ value: String(b.id), label: b.name }))}
                    value={newTicket.budgetName}
                    onChange={(v) => setNewTicket(prev => ({ ...prev, budgetName: v }))}
                    placeholder={t('ticket.selectBudgetPlaceholder')}
                    searchable={false}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1 text-content-muted">{t('ticket.seasonGroupLabel')}</label>
                <div className="w-full">
                  <FilterSelect
                    options={SEASON_GROUPS.map(sg => ({ value: sg.id, label: sg.label }))}
                    value={newTicket.seasonGroup}
                    onChange={(v) => setNewTicket(prev => ({ ...prev, seasonGroup: v }))}
                    placeholder={t('ticket.selectSeasonGroup')}
                    searchable={false}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1 text-content-muted">{t('ticket.seasonLabel')}</label>
                <div className="w-full">
                  <FilterSelect
                    options={SEASONS.map(s => ({ value: s.id, label: s.label }))}
                    value={newTicket.season}
                    onChange={(v) => setNewTicket(prev => ({ ...prev, season: v }))}
                    placeholder={t('ticket.selectSeason')}
                    searchable={false}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreatePopup(false)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors text-content-muted hover:bg-surface-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement create ticket API call
                    setShowCreatePopup(false);
                    setNewTicket({ budgetName: '', seasonGroup: '', season: '' });
                  }}
                  disabled={!newTicket.budgetName || !newTicket.seasonGroup || !newTicket.season}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    !newTicket.budgetName || !newTicket.seasonGroup || !newTicket.season
                      ? 'bg-border-muted text-content-muted cursor-not-allowed'
                      : 'bg-dafc-gold text-white hover:bg-[#A67B3D]'
                  }`}
                >
                  {t('ticket.createTicket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <FloatingActionButton
          actions={[
            { label: t('ticket.createTicket'), icon: Plus, onClick: () => setShowCreatePopup(true), color: '#C4975A' },
          ]}
        />
      )}
    </div>
  );
};

export default TicketScreen;
