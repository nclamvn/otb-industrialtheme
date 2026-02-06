'use client';

import { useState, useMemo } from 'react';
import {
  CostingBreakdownCard,
  CostingTable,
  CostingBreakdown,
  calculateCosting,
  calculateCostingSummary,
} from '@/components/costing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  Calculator,
  Download,
  Search,
  TrendingUp,
  Package,
} from 'lucide-react';

// Format currency for display
const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B VND`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M VND`;
  }
  return `${value.toLocaleString()} VND`;
};

// Demo data generator
const generateDemoCostings = (): CostingBreakdown[] => {
  const skus = [
    { id: '8116333', unitCost: 150, srp: 87900000, category: 'WOMENS' },
    { id: '8113543', unitCost: 120, srp: 65900000, category: 'WOMENS' },
    { id: '8115960', unitCost: 130, srp: 71900000, category: 'WOMENS' },
    { id: '8113524', unitCost: 180, srp: 80900000, category: 'MENS' },
    { id: '8112624', unitCost: 200, srp: 94900000, category: 'MENS' },
    { id: '8114084', unitCost: 80, srp: 12900000, category: 'ACCESSORIES' },
    { id: '8117890', unitCost: 95, srp: 25900000, category: 'ACCESSORIES' },
    { id: '8118234', unitCost: 250, srp: 125900000, category: 'BAGS' },
  ];

  return skus.map((sku) =>
    calculateCosting({
      skuId: sku.id,
      unitCost: sku.unitCost,
      category: sku.category,
      srp: sku.srp,
      exchangeRate: 24000,
    })
  );
};

export default function CostingPage() {
  const [costings] = useState<CostingBreakdown[]>(generateDemoCostings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSku, setSelectedSku] = useState<CostingBreakdown | null>(costings[0]);

  const filteredCostings = useMemo(() => {
    if (!searchTerm) return costings;
    return costings.filter((c) =>
      c.skuId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [costings, searchTerm]);

  const summary = useMemo(
    () => calculateCostingSummary(filteredCostings),
    [filteredCostings]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Costing Analysis
          </h1>
          <p className="text-slate-500 mt-1">
            View cost breakdown and margin analysis for all SKUs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total SKUs Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-blue-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Package className="w-24 h-24 text-blue-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Total SKUs
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
            {summary.totalSKUs}
          </p>
        </div>

        {/* Avg Unit Cost Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-purple-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Calculator className="w-24 h-24 text-purple-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Avg Unit Cost
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
            ${summary.avgUnitCost.toFixed(2)}
          </p>
        </div>

        {/* Total Landed Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-amber-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <DollarSign className="w-24 h-24 text-amber-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Total Landed
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
            {formatCurrency(summary.totalLandedValue)}
          </p>
        </div>

        {/* Avg Margin Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-green-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <TrendingUp className="w-24 h-24 text-green-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Avg Margin
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 tabular-nums pr-14">
            {(summary.avgMargin * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2">
          <CostingTable
            costings={filteredCostings}
            onRowClick={setSelectedSku}
          />
        </div>

        {/* Detail Card */}
        <div>
          <h3 className="font-semibold mb-4">Cost Breakdown</h3>
          {selectedSku ? (
            <CostingBreakdownCard costing={selectedSku} showDetails={true} />
          ) : (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
              Select a SKU to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
