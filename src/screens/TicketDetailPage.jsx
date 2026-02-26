'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, ChevronUp, Package, Ruler, ArrowLeft, Loader2, Check, X, Clock, Send, CheckCircle, XCircle, LayoutGrid, List, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils';
import { budgetService, planningService, proposalService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import RiskScoreCard from '../components/RiskScoreCard';

/* =========================
   DAFC DESIGN SYSTEM COLORS
========================= */

// Chart colors: REX = Champagne Gold, TTP = Forest Green
const REX_COLOR = '#C4975A';
const TTP_COLOR = '#1B6B45';

// Card styles using DAFC tokens (light mode only)
const CARD_STYLES = [
  'from-[rgba(196,151,90,0.22)] to-[rgba(196,151,90,0.1)] border-[rgba(196,151,90,0.5)]',
  'from-[rgba(27,107,69,0.18)] to-[rgba(27,107,69,0.08)] border-[rgba(27,107,69,0.4)]',
  'from-[rgba(217,119,6,0.18)] to-[rgba(217,119,6,0.08)] border-[rgba(217,119,6,0.4)]',
  'from-[rgba(196,151,90,0.18)] to-[rgba(196,151,90,0.08)] border-[rgba(196,151,90,0.4)]',
  'from-[rgba(27,107,69,0.18)] to-[rgba(27,107,69,0.08)] border-[rgba(27,107,69,0.4)]',
  'from-[rgba(220,53,69,0.18)] to-[rgba(220,53,69,0.08)] border-[rgba(220,53,69,0.4)]',
];

/* =========================
   GROUPED BAR CHARTS
========================= */

const CollectionBarChart = ({ data, darkMode, t }) => (
  <div className="border rounded-xl shadow-sm p-3 md:p-6 bg-white border-[#E8E2DB]">
    <h3 className="text-base font-semibold font-brand text-[#6B5D4F]">{t ? t('planningDetail.collection') : 'Collection Allocation'}</h3>
    <p className="text-sm mb-4 text-[#6B5D4F]">Carry Over vs Seasonal — REX & TTP by collection</p>
    <div className="h-[300px]" style={{ minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DB" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6B5D4F' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B5D4F' }} tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} />
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E8E2DB',
              borderRadius: '8px',
              color: '#2C2417'
            }}
            labelStyle={{ color: '#2C2417' }}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          />
          <Legend wrapperStyle={{ color: '#6B5D4F' }} />
          <Bar dataKey="rex" name="REX" fill={REX_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
          <Bar dataKey="ttp" name="TTP" fill={TTP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GenderBarChart = ({ data, darkMode, t }) => (
  <div className="border rounded-xl shadow-sm p-3 md:p-6 bg-white border-[#E8E2DB]">
    <h3 className="text-base font-semibold font-brand text-[#6B5D4F]">{t ? t('planningDetail.gender') : 'Gender Allocation'}</h3>
    <p className="text-sm mb-4 text-[#6B5D4F]">Male vs Female — REX & TTP by gender</p>
    <div className="h-[300px]" style={{ minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DB" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6B5D4F' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B5D4F' }} tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} />
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E8E2DB',
              borderRadius: '8px',
              color: '#2C2417'
            }}
            labelStyle={{ color: '#2C2417' }}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          />
          <Legend wrapperStyle={{ color: '#6B5D4F' }} />
          <Bar dataKey="rex" name="REX" fill={REX_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
          <Bar dataKey="ttp" name="TTP" fill={TTP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

/* =========================
   SKU CARD (with sizing)
========================= */

const SizingTable = ({ productType, darkMode }) => (
  <div className="rounded-xl border overflow-hidden border-[#E8E2DB] bg-white">
    <div className="px-4 py-2.5 text-sm font-semibold border-b font-brand text-[#6B5D4F] bg-[#FBF9F7] border-[#E8E2DB]">
      Sizing
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[rgba(196,151,90,0.18)] text-[#8C8178]">
            <th className="px-3 py-2 text-left">{productType}</th>
            <th className="px-3 py-2 text-center font-data">0002</th>
            <th className="px-3 py-2 text-center font-data">0004</th>
            <th className="px-3 py-2 text-center font-data">0006</th>
            <th className="px-3 py-2 text-center font-data">0008</th>
            <th className="px-3 py-2 text-center">Sum</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[#E8E2DB]">
            <td className="px-3 py-2 text-[#6B5D4F]">% Sales mix</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">6%</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">33%</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">33%</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">28%</td>
            <td className="px-3 py-2 text-center font-semibold font-data text-[#2C2417]">100%</td>
          </tr>
          <tr className="border-t border-[#E8E2DB]">
            <td className="px-3 py-2 text-[#6B5D4F]">% ST</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">50%</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">43%</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">30%</td>
            <td className="px-3 py-2 text-center font-data text-[#6B5D4F]">63%</td>
            <td className="px-3 py-2 text-center text-[#6B5D4F]">-</td>
          </tr>
          <tr className="border-t border-[#E8E2DB] bg-[rgba(217,119,6,0.18)]">
            <td className="px-3 py-2 font-semibold text-[#8A6340]">Final Choice</td>
            <td className="px-3 py-2 text-center font-data text-[#2C2417]">0</td>
            <td className="px-3 py-2 text-center font-data text-[#2C2417]">3</td>
            <td className="px-3 py-2 text-center font-data text-[#2C2417]">3</td>
            <td className="px-3 py-2 text-center font-data text-[#2C2417]">2</td>
            <td className="px-3 py-2 text-center font-semibold font-data text-[#2C2417]">8</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const SKUCard = ({ item, block, cardIdx, darkMode }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [storeOrderOpen, setStoreOrderOpen] = useState(false);
  const [sizingOpen, setSizingOpen] = useState(false);
  const style = CARD_STYLES[cardIdx % CARD_STYLES.length];
  const productType = item.productType || block.productType;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${style} shadow-sm overflow-hidden transition-all hover:shadow-md`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl border flex items-center justify-center shrink-0 shadow-sm bg-white/80 border-white/50">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V8" stroke="#B8A692" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M4 8H20L18.5 5H5.5L4 8Z" stroke="#C4975A" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(196,151,90,0.1)"/>
              <path d="M9 8V5.5C9 4.11929 10.1193 3 11.5 3H12.5C13.8807 3 15 4.11929 15 5.5V8" stroke="#B8A692" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="9" y="12" width="6" height="3" rx="1" stroke="#C4975A" strokeWidth="1.2" opacity="0.5"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate font-brand text-[#2C2417]">
              <span className="font-data">{item.sku}</span> • {item.name}
            </div>
            <div className="text-sm mt-0.5 text-[#6B5D4F]">
              {block.gender} • {block.subCategory}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => setDetailsOpen((p) => !p)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-all bg-white/80 border-[#E8E2DB] text-[#6B5D4F] hover:bg-[rgba(196,151,90,0.18)] hover:border-[rgba(196,151,90,0.4)] hover:text-[#8A6340]"
              >
                {detailsOpen ? 'Hide details' : 'Details'}
              </button>
              <button
                type="button"
                onClick={() => setStoreOrderOpen((p) => !p)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all bg-white/80 border-[#E8E2DB] text-[#6B5D4F] hover:bg-[rgba(196,151,90,0.18)] hover:border-[rgba(196,151,90,0.4)] hover:text-[#8A6340]"
              >
                <Store size={12} />
                {storeOrderOpen ? 'Hide stores' : 'Store Order'}
              </button>
              <button
                type="button"
                onClick={() => setSizingOpen((p) => !p)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all bg-white/80 border-[#E8E2DB] text-[#6B5D4F] hover:bg-[rgba(196,151,90,0.18)] hover:border-[rgba(196,151,90,0.4)] hover:text-[#8A6340]"
              >
                <Ruler size={12} />
                {sizingOpen ? 'Hide sizing' : 'Sizing'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border px-3 py-2.5 bg-white/60 border-white/50">
            <p className="text-xs uppercase tracking-wide text-[#6B5D4F]">Rex</p>
            <p className="text-base font-bold text-[#C4975A] font-data">{item.rex}</p>
          </div>
          <div className="rounded-lg border px-3 py-2.5 bg-white/60 border-white/50">
            <p className="text-xs uppercase tracking-wide text-[#6B5D4F]">TTP</p>
            <p className="text-base font-bold text-[#1B6B45] font-data">{item.ttp}</p>
          </div>
          <div className="rounded-lg border px-3 py-2.5 bg-white/60 border-white/50">
            <p className="text-xs uppercase tracking-wide text-[#6B5D4F]">Order</p>
            <p className="text-base font-bold font-data text-[#2C2417]">{item.order}</p>
          </div>
          <div className="rounded-lg border px-3 py-2.5 bg-white/60 border-white/50">
            <p className="text-xs uppercase tracking-wide text-[#6B5D4F]">TTL value</p>
            <p className="text-base font-bold font-data text-[#2C2417]">{formatCurrency(item.ttlValue)}</p>
          </div>
        </div>

        {detailsOpen && (
          <div className="mt-4 rounded-xl border p-4 border-white/50 bg-white/40">
            <div className="grid grid-cols-2 gap-3 text-base">
              <div>
                <span className="text-sm text-[#6B5D4F]">Product type</span>
                <div className="font-medium text-[#2C2417]">{productType}</div>
              </div>
              <div>
                <span className="text-sm text-[#6B5D4F]">Theme</span>
                <div className="font-medium text-[#2C2417]">{item.theme}</div>
              </div>
              <div>
                <span className="text-sm text-[#6B5D4F]">Color</span>
                <div className="font-medium text-[#2C2417]">{item.color}</div>
              </div>
              <div>
                <span className="text-sm text-[#6B5D4F]">Composition</span>
                <div className="font-medium text-[#2C2417]">{item.composition}</div>
              </div>
              <div>
                <span className="text-sm text-[#6B5D4F]">SRP</span>
                <div className="font-medium text-lg font-data text-[#2C2417]">{formatCurrency(item.srp)}</div>
              </div>
            </div>
          </div>
        )}

        {storeOrderOpen && (
          <div className="mt-4 rounded-xl border overflow-hidden border-[#E8E2DB] bg-white">
            <div className="px-4 py-2.5 text-sm font-semibold border-b font-brand text-[#6B5D4F] bg-[#FBF9F7] border-[#E8E2DB]">Store Order</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[rgba(196,151,90,0.18)] text-[#8C8178]">
                    <th className="px-3 py-2 text-left">Store</th>
                    <th className="px-3 py-2 text-center font-data">ORDER</th>
                    <th className="px-3 py-2 text-right font-data">TTL VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#E8E2DB]">
                    <td className="px-3 py-2 text-[#6B5D4F]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C4975A]" />REX
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-data text-[#2C2417]">{item.rex || 0}</td>
                    <td className="px-3 py-2 text-right font-data text-[#2C2417]">{formatCurrency((item.rex || 0) * (item.srp || 0))}</td>
                  </tr>
                  <tr className="border-t border-[#E8E2DB]">
                    <td className="px-3 py-2 text-[#6B5D4F]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1B6B45]" />TTP
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-data text-[#2C2417]">{item.ttp || 0}</td>
                    <td className="px-3 py-2 text-right font-data text-[#2C2417]">{formatCurrency((item.ttp || 0) * (item.srp || 0))}</td>
                  </tr>
                  <tr className="border-t-2 border-[#C4975A]/40 bg-[rgba(196,151,90,0.12)]">
                    <td className="px-3 py-2 font-semibold text-[#8A6340]">Total</td>
                    <td className="px-3 py-2 text-center font-bold font-data text-[#2C2417]">{item.order || ((item.rex || 0) + (item.ttp || 0))}</td>
                    <td className="px-3 py-2 text-right font-bold font-data text-[#2C2417]">{formatCurrency(item.ttlValue || (item.order || 0) * (item.srp || 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sizingOpen && (
          <div className="mt-4">
            <SizingTable productType={productType} darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
   APPROVAL STEPS & COMPONENTS
========================= */

const APPROVAL_STEPS = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'brand_manager', label: 'Group Brand Manager' },
  { id: 'finance', label: 'Finance' },
  { id: 'ceo', label: 'CEO' },
];

const getApprovalStepStatus = (stepId, currentStep, approvalHistory) => {
  const historyItem = approvalHistory?.find(h => h.stepId === stepId);
  if (historyItem?.action === 'approved') return 'approved';
  if (historyItem?.action === 'rejected') return 'rejected';
  if (historyItem?.action === 'submitted') return 'approved';
  if (stepId === currentStep) return 'current';
  const stepIndex = APPROVAL_STEPS.findIndex(s => s.id === stepId);
  const currentIndex = APPROVAL_STEPS.findIndex(s => s.id === currentStep);
  return stepIndex < currentIndex ? 'approved' : 'waiting';
};

const ApprovalProgressBar = ({ currentStep, approvalHistory, darkMode, t }) => (
  <div className="border rounded-xl shadow-sm p-5 bg-white border-[#E8E2DB]">
    <h3 className="text-xs font-semibold uppercase tracking-wider mb-5 font-brand text-[#8C8178]">
      {t ? t('ticketDetail.approvalHistory') : 'Approval Progress'}
    </h3>
    <div className="flex items-start">
      {APPROVAL_STEPS.map((step, index) => {
        const status = getApprovalStepStatus(step.id, currentStep, approvalHistory);
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center" style={{ minWidth: 90 }}>
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                status === 'approved' ? 'bg-[#1B6B45] border-[#1B6B45] text-white' :
                status === 'rejected' ? 'bg-[#DC3545] border-[#DC3545] text-white' :
                status === 'current' ? 'bg-[#C4975A] border-[#C4975A] text-white animate-pulse' :
                'bg-[#FBF9F7] border-[#D4CBBC] text-[#8C8178]'
              }`}>
                {status === 'approved' ? <Check size={20} strokeWidth={3} /> :
                 status === 'rejected' ? <X size={20} strokeWidth={3} /> :
                 status === 'current' ? <Clock size={18} /> :
                 <span className="text-sm font-bold">{index + 1}</span>}
              </div>
              <div className={`text-xs mt-2 font-medium text-center leading-tight ${
                status === 'approved' ? 'text-[#1B6B45]' :
                status === 'rejected' ? 'text-[#DC3545]' :
                status === 'current' ? 'text-[#C4975A]' :
                'text-[#8C8178]'
              }`}>
                {step.label}
              </div>
              {(status === 'approved' || status === 'rejected') && (
                <span className={`mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              )}
              {status === 'current' && (
                <span className="mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
                  In Review
                </span>
              )}
            </div>
            {index < APPROVAL_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-5 mx-1 rounded-full transition-all ${
                getApprovalStepStatus(APPROVAL_STEPS[index + 1].id, currentStep, approvalHistory) !== 'waiting'
                  ? 'bg-[#1B6B45]'
                  : 'bg-[#E8E2DB]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const StatusTrackingPanel = ({ approvalHistory, ticket, darkMode, t }) => (
  <div className="border rounded-xl shadow-sm p-5 bg-white border-[#E8E2DB]">
    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 font-brand text-[#8C8178]">
      {t ? t('common.status') : 'Status Tracking'}
    </h3>

    <div className="space-y-0">
      {approvalHistory?.length > 0 ? (
        approvalHistory.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                item.action === 'approved' ? 'bg-[#1B6B45]' :
                item.action === 'rejected' ? 'bg-[#DC3545]' :
                item.action === 'submitted' ? 'bg-[#C4975A]' :
                'bg-[#8C8178]'
              }`} />
              {index < approvalHistory.length - 1 && (
                <div className="w-px flex-1 min-h-[20px] bg-[#E8E2DB]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  item.action === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  item.action === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                </span>
                <span className="text-xs text-[#8C8178]">
                  by {item.stepLabel || item.role || '-'}
                </span>
              </div>
              {item.decidedAt && (
                <div className="text-[10px] mt-0.5 font-data text-[#8C8178]">
                  {new Date(item.decidedAt).toLocaleString('vi-VN')}
                </div>
              )}
              {item.comment && (
                <div className="mt-1.5 px-3 py-2 rounded-lg text-xs italic bg-[#FBF9F7] text-[#6B5D4F] border border-[#E8E2DB]">
                  "{item.comment}"
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm italic text-[#8C8178]">
          {t ? t('ticketDetail.approvalHistory') : 'No approval history yet'}
        </div>
      )}
    </div>

    <div className="mt-4 pt-4 border-t border-[#E8E2DB]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8C8178]">{t ? t('common.status') : 'Current Status'}:</span>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
          ['APPROVED', 'LEVEL2_APPROVED', 'FINAL'].includes(ticket?.status?.toUpperCase())
            ? 'bg-emerald-100 text-emerald-700'
          : ['REJECTED', 'LEVEL1_REJECTED', 'LEVEL2_REJECTED'].includes(ticket?.status?.toUpperCase())
            ? 'bg-red-100 text-red-700'
          : ['SUBMITTED', 'LEVEL1_APPROVED'].includes(ticket?.status?.toUpperCase())
            ? 'bg-amber-100 text-amber-700'
          : 'bg-[#FBF9F7] text-[#6B5D4F]'
        }`}>
          {ticket?.status?.replace(/_/g, ' ') || 'Draft'}
        </span>
      </div>
    </div>
  </div>
);

/* =========================
   MAIN SCREEN
========================= */

export default function TicketDetailPage({ ticket, onBack, darkMode = true }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isMobile } = useIsMobile();
  const [collapsed, setCollapsed] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [skuData, setSkuData] = useState([]);
  const [skuViewMode, setSkuViewMode] = useState('card');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Determine the right service based on entity type
  const getEntityService = () => {
    if (ticket?.entityType === 'budget') return budgetService;
    if (ticket?.entityType === 'planning') return planningService;
    if (ticket?.entityType === 'proposal') return proposalService;
    return null;
  };

  // Check if current user can approve at the current step
  const canApprove = () => {
    if (!ticket || !user) return false;
    const status = ticket?.status?.toUpperCase();
    const roleName = (user.role?.name || user.roleName || '').toLowerCase();
    const permissions = user.role?.permissions || user.permissions || [];
    const entityType = ticket.entityType;
    const permPrefix = entityType === 'proposal' ? 'proposal' : entityType === 'planning' ? 'planning' : 'budget';

    if (status === 'SUBMITTED') {
      return permissions.includes(`${permPrefix}:approve_l1`) || permissions.includes('*') || roleName.includes('manager');
    }
    if (status === 'LEVEL1_APPROVED') {
      return permissions.includes(`${permPrefix}:approve_l2`) || permissions.includes('*') || roleName.includes('finance') || roleName.includes('director');
    }
    return false;
  };

  const handleSubmitTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    setActionLoading(true);
    try {
      await svc.submit(ticket.id);
      toast.success(t('ticketDetail.submit'));
      if (onBack) onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    const status = ticket?.status?.toUpperCase();
    setActionLoading(true);
    try {
      if (status === 'SUBMITTED') {
        await svc.approveL1(ticket.id, 'Approved');
      } else if (status === 'LEVEL1_APPROVED') {
        await svc.approveL2(ticket.id, 'Approved');
      }
      toast.success(t('ticketDetail.approve'));
      if (onBack) onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTicket = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    const svc = getEntityService();
    if (!svc) return;
    const status = ticket?.status?.toUpperCase();
    setActionLoading(true);
    setShowRejectModal(false);
    try {
      if (status === 'SUBMITTED') {
        await svc.rejectL1(ticket.id, rejectReason || 'Rejected');
      } else if (status === 'LEVEL1_APPROVED') {
        await svc.rejectL2(ticket.id, rejectReason || 'Rejected');
      }
      toast.success(t('ticketDetail.reject'));
      if (onBack) onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Approval history — derive from ticket status
  const approvalHistory = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return [];
    const history = [];
    history.push({
      stepId: 'submitted',
      stepLabel: 'Submitted',
      action: 'submitted',
      decidedAt: ticket?.createdAt || ticket?.createdOn || null,
      comment: null
    });
    if (['LEVEL1_APPROVED', 'LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'approved',
        decidedAt: ticket?.l1ApprovedAt || null,
        comment: ticket?.l1Comment || 'Approved for finance review'
      });
    } else if (status === 'LEVEL1_REJECTED') {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'rejected',
        decidedAt: ticket?.l1RejectedAt || null,
        comment: ticket?.l1Comment || 'Rejected'
      });
    }
    if (['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'approved',
        decidedAt: ticket?.l2ApprovedAt || null,
        comment: ticket?.l2Comment || 'Finance approved'
      });
    } else if (status === 'LEVEL2_REJECTED') {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'rejected',
        decidedAt: ticket?.l2RejectedAt || null,
        comment: ticket?.l2Comment || 'Rejected by Finance'
      });
    }
    if (['APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'ceo',
        stepLabel: 'CEO',
        action: 'approved',
        decidedAt: ticket?.approvedAt || null,
        comment: ticket?.ceoComment || 'Final approval granted'
      });
    }
    return history;
  }, [ticket]);

  const currentStep = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return 'submitted';
    if (status === 'SUBMITTED') return 'brand_manager';
    if (status === 'LEVEL1_APPROVED') return 'finance';
    if (status === 'LEVEL1_REJECTED') return 'brand_manager';
    if (status === 'LEVEL2_APPROVED') return 'ceo';
    if (status === 'LEVEL2_REJECTED') return 'finance';
    if (['APPROVED', 'FINAL'].includes(status)) return 'completed';
    return 'submitted';
  }, [ticket]);

  // Fetch detailed data based on entity type
  useEffect(() => {
    if (!ticket) return;

    const fetchDetailData = async () => {
      setLoading(true);
      try {
        let data = ticket.data;

        // If we have full data from ticket, use it; otherwise fetch
        if (ticket.entityType === 'budget' && ticket.id) {
          const res = await budgetService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'planning' && ticket.id) {
          const res = await planningService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'proposal' && ticket.id) {
          const res = await proposalService.getOne(ticket.id);
          data = res.data || res;
          // Transform proposal items to SKU format
          if (data.items) {
            const groupedSkus = {};
            data.items.forEach(item => {
              const key = `${item.gender?.name || 'Unknown'}_${item.category?.name || 'Unknown'}`;
              if (!groupedSkus[key]) {
                groupedSkus[key] = {
                  gender: item.gender?.name?.toLowerCase() || 'unknown',
                  productType: item.category?.name || 'Unknown',
                  subCategory: item.subCategory?.name || item.category?.name || 'Unknown',
                  pctBuyPropose: 0,
                  otbPropose: 0,
                  items: []
                };
              }
              groupedSkus[key].items.push({
                sku: item.sku?.code || item.skuId,
                name: item.sku?.name || '-',
                theme: item.sku?.theme || '-',
                color: item.sku?.color || '-',
                composition: item.sku?.composition || '-',
                srp: Number(item.sku?.retailPrice) || 0,
                order: Number(item.quantity) || 0,
                rex: Math.floor(Number(item.quantity) / 2) || 0,
                ttp: Math.ceil(Number(item.quantity) / 2) || 0,
                ttlValue: Number(item.totalValue) || 0
              });
              groupedSkus[key].otbPropose += Number(item.totalValue) || 0;
            });
            const skuGroups = Object.values(groupedSkus);
            setSkuData(skuGroups);
            // Default collapse all SKU groups
            const defaultCollapsed = {};
            skuGroups.forEach(block => {
              defaultCollapsed[`${block.productType}_${block.gender}`] = true;
            });
            setCollapsed(defaultCollapsed);
          }
        }

        setDetailData(data);
      } catch (err) {
        console.error('Failed to fetch ticket detail:', err);
        toast.error('Failed to load detail data');
        // Use ticket's inline data if available
        if (ticket.data) {
          setDetailData(ticket.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
  }, [ticket]);

  // Generate chart data from detail
  const { collectionData, genderData, budgetData, budgetSeasonData } = useMemo(() => {
    if (!detailData) {
      return {
        collectionData: [],
        genderData: [],
        budgetData: {},
        budgetSeasonData: {}
      };
    }

    // For budget type
    if (ticket?.entityType === 'budget') {
      const details = detailData.details || [];
      const storeMap = {};
      details.forEach(d => {
        const storeName = d.store?.name || 'Unknown';
        if (!storeMap[storeName]) {
          storeMap[storeName] = 0;
        }
        storeMap[storeName] += Number(d.budgetAmount) || 0;
      });

      return {
        collectionData: [
          { name: 'Total Allocation', rex: storeMap['REX'] || storeMap['Rex'] || Object.values(storeMap)[0] || 0, ttp: storeMap['TTP'] || storeMap['Ttp'] || Object.values(storeMap)[1] || 0 }
        ],
        genderData: [],
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.fiscalYear,
          groupBrand: detailData.groupBrand?.name || '-',
          brandId: detailData.groupBrandId,
          brandName: detailData.groupBrand?.name || '-',
          totalBudget: Number(detailData.totalBudget) || 0,
          budgetName: `${detailData.groupBrand?.name || 'Budget'} - ${detailData.seasonGroupId || ''} ${detailData.seasonType || ''}`,
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.seasonGroupId || '-',
          Season: detailData.seasonType || '-',
          rex: Object.values(storeMap)[0] || 0,
          ttp: Object.values(storeMap)[1] || 0,
          finalVersion: 1
        }
      };
    }

    // For planning type
    if (ticket?.entityType === 'planning') {
      const details = detailData.details || [];
      const collectionMap = {};
      const genderMap = {};

      details.forEach(d => {
        const colName = d.collection?.name || 'Other';
        const genName = d.gender?.name || 'Other';

        if (!collectionMap[colName]) collectionMap[colName] = { rex: 0, ttp: 0 };
        if (!genderMap[genName]) genderMap[genName] = { rex: 0, ttp: 0 };

        const otb = Number(d.otbValue) || 0;
        collectionMap[colName].rex += otb * 0.5;
        collectionMap[colName].ttp += otb * 0.5;
        genderMap[genName].rex += otb * 0.5;
        genderMap[genName].ttp += otb * 0.5;
      });

      return {
        collectionData: Object.entries(collectionMap).map(([name, data]) => ({ name, ...data })),
        genderData: Object.entries(genderMap).map(([name, data]) => ({ name, ...data })),
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.budgetDetail?.budget?.fiscalYear || '-',
          groupBrand: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          brandName: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          totalBudget: Number(detailData.budgetDetail?.budgetAmount) || 0,
          budgetName: detailData.planningCode || 'Planning',
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.budgetDetail?.budget?.seasonGroupId || '-',
          Season: detailData.budgetDetail?.budget?.seasonType || '-',
          rex: 0,
          ttp: 0,
          finalVersion: detailData.versionNumber || 1
        }
      };
    }

    // Default / proposal
    return {
      collectionData: [],
      genderData: [],
      budgetData: {
        id: detailData.id,
        fiscalYear: '-',
        groupBrand: ticket?.brand || '-',
        brandName: ticket?.brand || '-',
        totalBudget: 0,
        budgetName: ticket?.name || 'Ticket',
        status: detailData.status
      },
      budgetSeasonData: {
        seasonGroup: ticket?.seasonGroup || '-',
        Season: ticket?.season || '-',
        rex: 0,
        ttp: 0,
        finalVersion: 1
      }
    };
  }, [detailData, ticket]);

  const rexNum = Number(budgetSeasonData.rex) || 0;
  const ttpNum = Number(budgetSeasonData.ttp) || 0;
  const totalRexTtp = rexNum + ttpNum;

  // Use real SKU data or empty
  const displaySkuData = skuData.length > 0 ? skuData : [];

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-[#FBF9F7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-[#C4975A]" />
          <span className="text-[#6B5D4F]">{t('ticketDetail.loadingDetail')}</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-[#FBF9F7]">
        <div className="text-center text-[#6B5D4F]">
          <p>{t('common.noData')}</p>
          {onBack && (
            <button onClick={onBack} className="mt-4 text-[#C4975A] hover:underline">
              {t('ticketDetail.backToTickets')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 min-h-screen space-y-3 md:space-y-6 bg-[#FBF9F7]">
      {/* Back Button & Header */}
      {onBack && (
        <div className="flex items-center justify-between gap-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-[#1B6B45] to-[#1B6B45]/80">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg transition-all hover:bg-white/10 text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-semibold font-brand text-white">
                {t('ticketDetail.title')}
              </h1>
              <p className="text-xs text-white/70">
                {ticket?.entityType?.charAt(0).toUpperCase() + ticket?.entityType?.slice(1)} • {ticket?.name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Submit — only for DRAFT */}
            {ticket?.status?.toUpperCase() === 'DRAFT' && (
              <button
                onClick={handleSubmitTicket}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all text-sm border border-white/20 backdrop-blur-sm disabled:opacity-50"
              >
                <Send size={16} />
                {t('common.submit')}
              </button>
            )}

            {/* Approve / Reject — for pending approvers */}
            {canApprove() && (
              <>
                <button
                  onClick={handleRejectTicket}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#DC3545]/20 hover:bg-[#DC3545]/30 text-white font-semibold rounded-lg transition-all text-sm border border-[#DC3545]/30 backdrop-blur-sm disabled:opacity-50"
                >
                  <XCircle size={16} />
                  {t('ticketDetail.reject')}
                </button>
                <button
                  onClick={handleApproveTicket}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/25 hover:bg-white/35 text-white font-semibold rounded-lg transition-all text-sm border border-white/30 backdrop-blur-sm disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {t('ticketDetail.approve')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== APPROVAL PROGRESS BAR ===== */}
      <ApprovalProgressBar
        currentStep={currentStep}
        approvalHistory={approvalHistory}
        darkMode={darkMode}
        t={t}
      />

      {/* ===== STATUS TRACKING + BUDGET INFO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget + Budget Season — 2/3 width */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* 1. Budget + Budget Season */}
        <div className="border rounded-xl shadow-sm p-5 bg-white border-[#E8E2DB]">
          <h3 className="text-base font-semibold mb-4 font-brand text-[#6B5D4F]">{t('skuProposal.budget')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('budget.fiscalYear')}</p>
              <p className="text-base font-semibold font-data text-[#2C2417]">{budgetData.fiscalYear}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('budget.groupBrand')}</p>
              <p className="text-base font-semibold text-[#2C2417]">{budgetData.groupBrand}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('budget.brand')}</p>
              <p className="text-base font-semibold text-[#2C2417]">{budgetData.brandName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('budget.totalBudget')}</p>
              <p className="text-lg font-semibold text-[#C4975A] font-data">{formatCurrency(budgetData.totalBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('budget.budgetName')}</p>
              <p className="text-base font-semibold text-[#2C2417]">{budgetData.budgetName}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-xl shadow-sm p-5 bg-white border-[#E8E2DB]">
          <h3 className="text-base font-semibold mb-4 font-brand text-[#6B5D4F]">{t('skuProposal.season')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('skuProposal.seasonGroup')}</p>
              <p className="text-base font-semibold text-[#2C2417]">{budgetSeasonData.seasonGroup}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('skuProposal.season')}</p>
              <p className="text-base font-semibold text-[#2C2417]">{budgetSeasonData.Season}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('common.version')}</p>
              <p className="text-base font-semibold text-[#2C2417]">v{budgetSeasonData.finalVersion}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">REX</p>
              <p className="text-lg font-semibold text-[#C4975A] font-data">{formatCurrency(rexNum)}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">TTP</p>
              <p className="text-lg font-semibold text-[#1B6B45] font-data">{formatCurrency(ttpNum)}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B5D4F]">{t('skuProposal.total')}</p>
              <p className="text-lg font-bold text-[#C4975A] font-data">{formatCurrency(totalRexTtp)}</p>
            </div>
          </div>
        </div>

        {/* Risk Score Card */}
        <RiskScoreCard
          entityType="proposal"
          entityId={ticket?.proposalId || ticket?.id}
          autoCalculate={true}
          darkMode={darkMode}
        />
      </div>

        {/* Status Tracking Panel — 1/3 width */}
        <StatusTrackingPanel
          approvalHistory={approvalHistory}
          ticket={ticket}
          darkMode={darkMode}
          t={t}
        />
      </div>

      {/* 3. Charts - Collection & Gender (grouped bar: REX, TTP per category) */}
      {(collectionData.length > 0 || genderData.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-6">
          {collectionData.length > 0 && <CollectionBarChart data={collectionData} darkMode={darkMode} t={t} />}
          {genderData.length > 0 && <GenderBarChart data={genderData} darkMode={darkMode} t={t} />}
        </div>
      )}

      {/* 4. SKU Cards - grouped by type and gender (only for proposals) */}
      {displaySkuData.length > 0 && (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-brand text-[#2C2417]">
            <Package size={20} className="text-[#C4975A]" />
            {t('proposal.skuCode')} ({displaySkuData.reduce((sum, b) => sum + b.items.length, 0)})
          </h3>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg p-1 bg-[rgba(196,151,90,0.12)] border border-[rgba(196,151,90,0.3)]">
            <button
              type="button"
              onClick={() => setSkuViewMode('card')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'card'
                  ? 'bg-white text-[#8A6340] shadow-sm'
                  : 'text-[#8C8178] hover:text-[#6B5D4F]'
              }`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSkuViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'table'
                  ? 'bg-white text-[#8A6340] shadow-sm'
                  : 'text-[#8C8178] hover:text-[#6B5D4F]'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
        {/* === TABLE VIEW === */}
        {skuViewMode === 'table' && (
          <div className="border rounded-2xl shadow-sm overflow-hidden bg-white border-[#E8E2DB]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[rgba(196,151,90,0.18)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8C8178]"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.skuCode')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.productName')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.productType')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.color')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.rex')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.ttp')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.order')}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#8C8178]">{t('proposal.totalValue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2DB]">
                  {displaySkuData.flatMap(block => block.items.map((item, idx) => (
                    <tr key={`${item.sku}_${idx}`} className="transition-colors hover:bg-[rgba(196,151,90,0.1)]">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-[rgba(160,120,75,0.08)] border-[rgba(196,151,90,0.2)]">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V8" stroke="#B8A692" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M4 8H20L18.5 5H5.5L4 8Z" stroke="#C4975A" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(196,151,90,0.1)"/>
                            <path d="M9 8V5.5C9 4.11929 10.1193 3 11.5 3H12.5C13.8807 3 15 4.11929 15 5.5V8" stroke="#B8A692" strokeWidth="1.5" strokeLinecap="round"/>
                            <rect x="9" y="12" width="6" height="3" rx="1" stroke="#C4975A" strokeWidth="1.2" opacity="0.5"/>
                          </svg>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-data text-sm text-[#C4975A]">{item.sku}</td>
                      <td className="px-4 py-3 font-medium text-[#2C2417]">{item.name}</td>
                      <td className="px-4 py-3 text-[#6B5D4F]">{item.productType || block.productType}</td>
                      <td className="px-4 py-3 text-[#6B5D4F]">{item.color || '-'}</td>
                      <td className="px-4 py-3 text-center font-data font-medium text-[#C4975A]">{item.rex || 0}</td>
                      <td className="px-4 py-3 text-center font-data font-medium text-[#1B6B45]">{item.ttp || 0}</td>
                      <td className="px-4 py-3 text-center font-data font-bold text-[#2C2417]">{item.order || 0}</td>
                      <td className="px-4 py-3 text-right font-data font-medium text-[#2C2417]">{formatCurrency(item.ttlValue || 0)}</td>
                    </tr>
                  )))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#C4975A]/40 bg-[rgba(196,151,90,0.12)]">
                    <td colSpan="5" className="px-4 py-3 font-semibold text-[#8A6340]">{t('skuProposal.total')}</td>
                    <td className="px-4 py-3 text-center font-bold font-data text-[#C4975A]">
                      {displaySkuData.reduce((s, b) => s + b.items.reduce((ss, i) => ss + (i.rex || 0), 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold font-data text-[#1B6B45]">
                      {displaySkuData.reduce((s, b) => s + b.items.reduce((ss, i) => ss + (i.ttp || 0), 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold font-data text-[#2C2417]">
                      {displaySkuData.reduce((s, b) => s + b.items.reduce((ss, i) => ss + (i.order || 0), 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-data text-[#2C2417]">
                      {formatCurrency(displaySkuData.reduce((s, b) => s + b.items.reduce((ss, i) => ss + (i.ttlValue || 0), 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* === CARD VIEW === */}
        {skuViewMode === 'card' && displaySkuData.map((block) => {
          const key = `${block.gender}_${block.productType}`;
          const isCollapsed = collapsed[key];
          const totalSrp = block.items.reduce((sum, i) => sum + i.srp, 0);
          return (
            <div key={key} className="border rounded-2xl shadow-sm overflow-hidden bg-white border-[#E8E2DB]">
              <button
                type="button"
                onClick={() => setCollapsed((p) => ({ ...p, [key]: !p[key] }))}
                className="w-full flex items-center gap-4 px-5 py-4 transition-all bg-gradient-to-r from-[#1E3A5F] via-[#2A4A7F] to-[#1E3A5F] text-white hover:from-[#234470] hover:via-[#305490] hover:to-[#234470]"
              >
                <ChevronDown size={18} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''}`} />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-lg font-brand">{block.subCategory}</div>
                  <div className="text-sm mt-0.5 text-blue-200">
                    {block.gender} • {block.productType} • <span className="font-data">{block.items.length}</span> SKUs
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-blue-200">% Buy propose</div>
                    <div className="text-lg font-bold font-data text-[#C4975A]">{block.pctBuyPropose}%</div>
                  </div>
                  <div className="w-px h-8 bg-blue-400/30" />
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-blue-200">OTB propose</div>
                    <div className="text-lg font-bold font-data text-[#C4975A]">{formatCurrency(block.otbPropose)}</div>
                  </div>
                  <div className="w-px h-8 bg-blue-400/30" />
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-blue-200">Total SRP</div>
                    <div className="text-lg font-semibold font-data text-[#C4975A]">{formatCurrency(totalSrp)}</div>
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div className="p-5 bg-[#FBF9F7]/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
                    {block.items.map((item, idx) => (
                      <SKUCard
                        key={`${item.sku}_${idx}`}
                        item={{ ...item, productType: block.productType }}
                        block={block}
                        cardIdx={idx}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold font-brand text-[#2C2417] mb-3">{t('ticketDetail.reject')}</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t('approvals.rejectReason') || 'Reason for rejection...'}
              className="w-full border border-[#E8E2DB] rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#C4975A]/40 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[#E8E2DB] text-[#6B5D4F] hover:bg-[#FBF9F7] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitReject}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#DC3545] text-white hover:bg-[#C82333] transition-colors"
              >
                {t('ticketDetail.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
