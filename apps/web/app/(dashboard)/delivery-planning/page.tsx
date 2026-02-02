'use client';

import { useState } from 'react';
import {
  DeliveryMatrix,
  DeliveryStoreSummary,
  useDeliveryPlanning,
} from '@/components/delivery-planning';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Calendar,
  Download,
  Upload,
  Package,
  Building2,
} from 'lucide-react';

export default function DeliveryPlanningPage() {
  const [selectedSeason, setSelectedSeason] = useState('W25');
  const [viewMode, setViewMode] = useState<'matrix' | 'summary'>('matrix');

  const {
    matrix,
    pendingEdits,
    isSaving,
    updateCell,
    saveChanges,
  } = useDeliveryPlanning();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-blue-600" />
            Delivery Planning
          </h1>
          <p className="text-slate-500 mt-1">
            Plan product deliveries across all store locations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'matrix' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('matrix')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Matrix
            </Button>
            <Button
              variant={viewMode === 'summary' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('summary')}
            >
              <Building2 className="w-4 h-4 mr-1" />
              By Store
            </Button>
          </div>

          {/* Season Filter */}
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="W25">Winter 25</SelectItem>
              <SelectItem value="SP26">Spring 26</SelectItem>
            </SelectContent>
          </Select>

          {/* Actions */}
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
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
            {matrix.skus.length}
          </p>
        </div>

        {/* Stores Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-purple-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Building2 className="w-24 h-24 text-purple-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Stores
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
            {matrix.stores.length}
          </p>
        </div>

        {/* Months Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-amber-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Calendar className="w-24 h-24 text-amber-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Months
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
            {matrix.months.length}
          </p>
        </div>

        {/* Total Units Card */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-border bg-card border-l-4 border-l-green-500 hover:border-border/80 transition-all duration-200">
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Truck className="w-24 h-24 text-green-500 opacity-[0.08]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Total Units
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 tabular-nums pr-14">
            {matrix.totals.grand.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'matrix' ? (
        <DeliveryMatrix
          data={matrix}
          editable={true}
          onCellChange={updateCell}
          onSave={saveChanges}
        />
      ) : (
        <DeliveryStoreSummary data={matrix} />
      )}

      {/* Pending Changes Bar */}
      {pendingEdits.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 rounded-lg border-2 border-border">
          <span className="text-amber-800 dark:text-amber-200">
            {pendingEdits.length} unsaved changes
          </span>
          <Button size="sm" onClick={saveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      )}
    </div>
  );
}
