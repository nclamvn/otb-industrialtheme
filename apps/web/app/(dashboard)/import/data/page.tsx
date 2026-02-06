'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ImportedDataViewer — View & Manage Imported Data
// DAFC OTB Platform — Browse, search, sort imported records for any target
// Access at: /import/data?target=products
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Download,
  Package,
  BarChart3,
  Grid3X3,
  TrendingUp,
  Scissors,
  Target,
  Truck,
  Folder,
  AlertTriangle,
  Loader2,
  Upload,
  DatabaseZap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type ImportTarget =
  | 'products' | 'otb_budget' | 'wssi' | 'size_profiles'
  | 'forecasts' | 'clearance' | 'kpi_targets' | 'suppliers' | 'categories';

interface StoredRecord {
  _id: string;
  _importedAt: string;
  _importSessionId: string;
  _source: string;
  [key: string]: unknown;
}

const TARGET_META: Record<ImportTarget, { label: string; icon: React.ElementType }> = {
  products: { label: 'Sản phẩm', icon: Package },
  otb_budget: { label: 'Ngân sách OTB', icon: BarChart3 },
  wssi: { label: 'Kế hoạch WSSI', icon: Grid3X3 },
  size_profiles: { label: 'Phân bổ Size', icon: Grid3X3 },
  forecasts: { label: 'Dự báo bán hàng', icon: TrendingUp },
  clearance: { label: 'Giải hàng tồn kho', icon: Scissors },
  kpi_targets: { label: 'Mục tiêu KPI', icon: Target },
  suppliers: { label: 'Nhà cung cấp', icon: Truck },
  categories: { label: 'Danh mục', icon: Folder },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImportedDataViewer() {
  const searchParams = useSearchParams();
  const initialTarget = (searchParams.get('target') as ImportTarget) || 'products';

  const [target, setTarget] = useState<ImportTarget>(initialTarget);
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('_importedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRecords: number;
    sessionCount: number;
    lastImportAt: string | null;
    fieldCounts: Record<string, number>;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    synced?: number;
    proposalId?: string;
  } | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        target,
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/v1/import/data?${params}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setRecords(data.records || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [target, page, pageSize, search, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/import/data?target=${target}&mode=stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, [target]);

  useEffect(() => { fetchData(); fetchStats(); }, [fetchData, fetchStats]);

  // ─── Delete All ──────────────────────────────────────────────────

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/v1/import/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, clearAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteConfirm(false);
        fetchData();
        fetchStats();
      }
    } catch { /* */ }
    setDeleteLoading(false);
  };

  // ─── Sync to Database ─────────────────────────────────────────────

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/v1/import/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, overwrite: false }),
      });
      const data = await res.json();
      setSyncResult({
        success: data.success,
        message: data.message || (data.success ? 'Sync thành công' : 'Lỗi sync'),
        synced: data.synced,
        proposalId: data.proposalId,
      });
    } catch (err) {
      setSyncResult({
        success: false,
        message: err instanceof Error ? err.message : 'Lỗi kết nối',
      });
    }
    setSyncLoading(false);
  };

  // ─── Sort Handler ────────────────────────────────────────────────

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // ─── CSV Export ──────────────────────────────────────────────────

  const handleExport = () => {
    if (records.length === 0) return;
    const dataFields = Object.keys(records[0]).filter((k) => !k.startsWith('_'));
    const header = dataFields.join(',');
    const rows = records.map((r) =>
      dataFields.map((f) => `"${String(r[f] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${target}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Derive columns from records ─────────────────────────────────

  const dataColumns = records.length > 0
    ? Object.keys(records[0]).filter((k) => !k.startsWith('_'))
    : [];

  const TargetIcon = TARGET_META[target]?.icon || Database;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dữ liệu đã Import"
        description="Xem, tìm kiếm và quản lý dữ liệu đã import vào hệ thống"
      />

      {/* ─── Target Tabs ──────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.entries(TARGET_META) as [ImportTarget, typeof TARGET_META[ImportTarget]][]).map(
          ([key, meta]) => {
            const isActive = target === key;
            const Icon = meta.icon;
            return (
              <Button
                key={key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setTarget(key); setPage(1); setSearch(''); }}
                className={isActive ? 'bg-[#D7B797] hover:bg-[#D7B797]/90 text-white' : ''}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {meta.label}
              </Button>
            );
          }
        )}
      </div>

      {/* ─── Stats Card ────────────────────────────────────────── */}
      {stats && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <TargetIcon className="w-5 h-5 text-[#D7B797]" />
                  <span className="font-semibold">{TARGET_META[target]?.label}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-mono font-bold text-green-600">{stats.totalRecords.toLocaleString()}</span> bản ghi
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-mono">{stats.sessionCount}</span> lần import
                </div>
                {stats.lastImportAt && (
                  <div className="text-sm text-muted-foreground">
                    Lần cuối: <span className="font-mono">{new Date(stats.lastImportAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Sync to Database Button */}
                {(target === 'products' || target === 'otb_budget') && stats.totalRecords > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {syncLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <DatabaseZap className="w-4 h-4 mr-1" />
                    )}
                    Sync vào DB
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={stats.totalRecords === 0}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Xóa tất cả
                </Button>
                <Link href="/import">
                  <Button size="sm" className="bg-[#D7B797] hover:bg-[#D7B797]/90">
                    <Upload className="w-4 h-4 mr-1" />
                    Import thêm
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Sync Result Notification ──────────────────────────────── */}
      {syncResult && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            syncResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {syncResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <div className="flex-1">
            <p className="font-medium">{syncResult.message}</p>
            {syncResult.synced !== undefined && syncResult.synced > 0 && (
              <p className="text-sm mt-1">
                Đã đồng bộ <span className="font-bold">{syncResult.synced}</span> bản ghi
                {syncResult.proposalId && (
                  <> vào proposal <code className="bg-white/50 px-1 rounded">{syncResult.proposalId}</code></>
                )}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSyncResult(null)}
            className="hover:bg-white/50"
          >
            Đóng
          </Button>
          {syncResult.success && target === 'products' && (
            <Link href="/sku-proposal">
              <Button size="sm" variant="outline" className="border-green-400 hover:bg-green-100">
                Xem SKU Proposals
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* ─── Search & Refresh ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm trong dữ liệu đã import..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* ─── Data Table ───────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#D7B797]" />
              <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
              <Button variant="outline" onClick={fetchData} className="mt-3">
                Thử lại
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">
                Chưa có dữ liệu {TARGET_META[target]?.label} được import
              </p>
              <Link href="/import">
                <Button className="bg-[#D7B797] hover:bg-[#D7B797]/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Import ngay
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      {dataColumns.map((col) => (
                        <TableHead
                          key={col}
                          className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                          onClick={() => handleSort(col)}
                        >
                          <span className="flex items-center gap-1">
                            {col}
                            {sortBy === col ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </span>
                        </TableHead>
                      ))}
                      <TableHead className="whitespace-nowrap">Imported</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((rec, idx) => (
                      <TableRow key={rec._id}>
                        <TableCell className="text-center text-muted-foreground font-mono text-xs">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        {dataColumns.map((col) => (
                          <TableCell
                            key={col}
                            className="font-mono text-xs max-w-[200px] truncate"
                            title={String(rec[col] ?? '')}
                          >
                            {String(rec[col] ?? '—')}
                          </TableCell>
                        ))}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(rec._importedAt).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Pagination ───────────────────────────────────── */}
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total.toLocaleString()} bản ghi
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p > totalPages) return null;
                    return (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="icon"
                        className={`h-8 w-8 font-mono text-xs ${p === page ? 'bg-[#D7B797] hover:bg-[#D7B797]/90' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Delete Confirmation Dialog ──────────────────────────── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Xóa toàn bộ dữ liệu?
            </DialogTitle>
            <DialogDescription>
              Thao tác này không thể hoàn tác. Tất cả <strong>{stats?.totalRecords.toLocaleString()}</strong> bản ghi{' '}
              <strong>{TARGET_META[target]?.label}</strong> sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Xóa tất cả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
