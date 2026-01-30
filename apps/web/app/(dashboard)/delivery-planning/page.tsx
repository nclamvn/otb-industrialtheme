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
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
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
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Package className="w-4 h-4" />
            Total SKUs
          </div>
          <div className="text-2xl font-bold">{matrix.skus.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Building2 className="w-4 h-4" />
            Stores
          </div>
          <div className="text-2xl font-bold">{matrix.stores.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Calendar className="w-4 h-4" />
            Months
          </div>
          <div className="text-2xl font-bold">{matrix.months.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
            <Package className="w-4 h-4" />
            Total Units
          </div>
          <div className="text-2xl font-bold text-green-700">{matrix.totals.grand.toLocaleString()}</div>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 rounded-lg shadow-lg">
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
