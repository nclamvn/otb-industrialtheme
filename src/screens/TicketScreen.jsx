'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Loader2, Plus, X, LayoutList, LayoutGrid, Ticket, CircleCheckBig, DollarSign } from 'lucide-react';
import TicketKanbanBoard from '../components/TicketKanbanBoard';
import { ExpandableStatCard } from '../components/Common';
import { budgetService, planningService, proposalService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileDataCard } from '@/components/ui';
import { formatCurrency } from '../utils';

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

  // Fetch all tickets (budgets, plannings, proposals)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all entities from different sources
        const [budgetsRes, planningsRes, proposalsRes] = await Promise.all([
          budgetService.getAll().catch(() => ({ data: [] })),
          planningService.getAll().catch(() => ({ data: [] })),
          proposalService.getAll().catch(() => ({ data: [] }))
        ]);

        const allTickets = [];

        // Transform budgets to tickets
        (budgetsRes.data || budgetsRes || []).forEach(b => {
          allTickets.push({
            id: b.id,
            entityType: 'budget',
            name: `${b.groupBrand?.name || 'Budget'} - ${b.seasonGroupId || ''} ${b.seasonType || ''}`,
            brand: b.groupBrand?.name || '-',
            seasonGroup: b.seasonGroupId || '-',
            season: b.seasonType || '-',
            createdBy: b.createdBy?.name || 'System',
            createdOn: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '-',
            status: b.status,
            totalBudget: Number(b.totalBudget) || 0,
            data: b
          });
        });

        // Transform plannings to tickets
        (planningsRes.data || planningsRes || []).forEach(p => {
          allTickets.push({
            id: p.id,
            entityType: 'planning',
            name: p.planningCode || `Planning ${p.versionName || ''}`,
            brand: p.budgetDetail?.budget?.groupBrand?.name || '-',
            seasonGroup: p.budgetDetail?.budget?.seasonGroupId || '-',
            season: p.budgetDetail?.budget?.seasonType || '-',
            createdBy: p.createdBy?.name || 'System',
            createdOn: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '-',
            status: p.status,
            totalBudget: Number(p.budgetDetail?.budgetAmount) || 0,
            data: p
          });
        });

        // Transform proposals to tickets
        (proposalsRes.data || proposalsRes || []).forEach(pr => {
          allTickets.push({
            id: pr.id,
            entityType: 'proposal',
            name: pr.proposalCode || `Proposal ${pr.versionName || ''}`,
            brand: pr.planning?.budgetDetail?.budget?.groupBrand?.name || '-',
            seasonGroup: pr.planning?.budgetDetail?.budget?.seasonGroupId || '-',
            season: pr.planning?.budgetDetail?.budget?.seasonType || '-',
            createdBy: pr.createdBy?.name || 'System',
            createdOn: pr.createdAt ? new Date(pr.createdAt).toISOString().split('T')[0] : '-',
            status: pr.status,
            totalBudget: 0,
            data: pr
          });
        });

        // Sort by created date descending
        allTickets.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

        setTickets(allTickets);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
        setError(t('ticket.failedToLoadTickets'));
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isAuthenticated]);

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
    <div className="space-y-6">
      {/* ===== PAGE TITLE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold font-['Montserrat'] text-[#2C2417]">
            {t('ticket.title')}
          </h1>
          <p className="text-xs text-[#6B5D4F]">
            {t('ticket.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#FBF9F7] border border-[#E8E2DB]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-150 ${
                viewMode === 'table'
                  ? 'bg-white text-[#A67B3D] shadow-sm'
                  : 'text-[#8C8178] hover:text-[#6B5D4F]'
              }`}
              title={t('ticket.tableView')}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all duration-150 ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#A67B3D] shadow-sm'
                  : 'text-[#8C8178] hover:text-[#6B5D4F]'
              }`}
              title={t('ticket.kanbanView')}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowCreatePopup(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 bg-[#C4975A] text-white hover:bg-[#A67B3D]"
          >
            <Plus size={18} />
            {t('ticket.createTicket')}
          </button>
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
        <div className="border rounded-lg p-12 flex flex-col items-center justify-center bg-white border-[#E8E2DB] text-[#8C8178]">
          <Loader2 size={32} className="animate-spin mb-3" />
          <span className="text-sm">{t('ticket.loadingTickets')}</span>
        </div>
      ) : error ? (
        <div className="border rounded-lg p-6 text-center text-sm bg-white border-[#E8E2DB] text-[#DC3545]">
          {t('ticket.failedToLoadTickets')}: {error}
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
            <div className="border rounded-lg overflow-hidden bg-white border-[#E8E2DB]">
              <table className="w-full text-sm">
                <thead className="bg-[#FBF9F7]">
                  <tr>
                    {[t('common.name'), t('approval.brand'), t('ticket.seasonLabel'), t('budget.createdBy'), t('budget.createdOn'), t('common.status'), t('common.actions')].map((header, idx) => (
                      <th
                        key={header}
                        className={`px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-[#6B5D4F] ${idx === 6 ? 'text-center' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0EBE5]">
                  {tickets.map((ticket) => (
                    <tr
                      key={`${ticket.entityType}-${ticket.id}`}
                      className="transition-all duration-150 border-l-2 border-transparent hover:bg-[rgba(196,151,90,0.08)] hover:border-l-[#C4975A]"
                    >
                      <td className="px-4 py-3 font-medium text-[#2C2417]">
                        {ticket.name}
                      </td>
                      <td className="px-4 py-3 text-[#6B5D4F]">
                        {ticket.brand}
                      </td>
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#6B5D4F]">
                        {ticket.seasonGroup} {ticket.season}
                      </td>
                      <td className="px-4 py-3 text-[#6B5D4F]">
                        {ticket.createdBy}
                      </td>
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#8C8178]">
                        {ticket.createdOn}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusStyle(ticket.status)}`}>
                          {getDisplayStatus(ticket.status, t)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onOpenTicketDetail(ticket)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all duration-150 text-[#A67B3D] border-[rgba(196,151,90,0.4)] hover:bg-[rgba(196,151,90,0.1)]"
                        >
                          <Eye size={14} />
                          {t('common.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {tickets.length === 0 && (
                <div className="p-6 text-center text-sm text-[#8C8178]">
                  {t('ticket.noTicketsFound')}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== CREATE TICKET POPUP ===== */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden bg-white">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E8E2DB]" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(196,151,90,0.08) 35%, rgba(196,151,90,0.18) 100%)',
              boxShadow: 'inset 0 -1px 0 rgba(196,151,90,0.08)',
            }}>
              <h3 className="text-lg font-bold font-['Montserrat'] text-[#A67B3D]">{t('ticket.createNewTicket')}</h3>
              <button
                onClick={() => setShowCreatePopup(false)}
                className="p-2 rounded-lg transition-colors hover:bg-[rgba(196,151,90,0.1)]"
              >
                <X size={20} className="text-[#A67B3D]" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#6B5D4F]">{t('ticket.budgetNameLabel')}</label>
                <select
                  value={newTicket.budgetName}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, budgetName: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white border-[#E8E2DB] text-[#2C2417] focus:ring-[rgba(196,151,90,0.3)] focus:border-[#C4975A]"
                >
                  <option value="">{t('ticket.selectBudgetPlaceholder')}</option>
                  {tickets.filter(t => t.entityType === 'budget').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#6B5D4F]">{t('ticket.seasonGroupLabel')}</label>
                <select
                  value={newTicket.seasonGroup}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, seasonGroup: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white border-[#E8E2DB] text-[#2C2417] focus:ring-[rgba(196,151,90,0.3)] focus:border-[#C4975A]"
                >
                  <option value="">{t('ticket.selectSeasonGroup')}</option>
                  {SEASON_GROUPS.map(sg => (
                    <option key={sg.id} value={sg.id}>{sg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#6B5D4F]">{t('ticket.seasonLabel')}</label>
                <select
                  value={newTicket.season}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, season: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white border-[#E8E2DB] text-[#2C2417] focus:ring-[rgba(196,151,90,0.3)] focus:border-[#C4975A]"
                >
                  <option value="">{t('ticket.selectSeason')}</option>
                  {SEASONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreatePopup(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[#6B5D4F] hover:bg-[#FBF9F7]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement create ticket API call
                    console.log('Creating ticket:', newTicket);
                    setShowCreatePopup(false);
                    setNewTicket({ budgetName: '', seasonGroup: '', season: '' });
                  }}
                  disabled={!newTicket.budgetName || !newTicket.seasonGroup || !newTicket.season}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                    !newTicket.budgetName || !newTicket.seasonGroup || !newTicket.season
                      ? 'bg-[#E8E2DB] text-[#8C8178] cursor-not-allowed'
                      : 'bg-[#C4975A] text-white hover:bg-[#A67B3D]'
                  }`}
                >
                  {t('ticket.createTicket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketScreen;
