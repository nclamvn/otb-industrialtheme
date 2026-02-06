// ═══════════════════════════════════════════════════════════════════════════════
// Import Data Service — Server-Side JSON Store with CRUD
// DAFC OTB Platform — Actual data persistence for imported records
//
// Architecture: JSON file store → swap to Prisma/PostgreSQL by replacing
// readStore/writeStore functions. All business logic stays the same.
// ═══════════════════════════════════════════════════════════════════════════════

import { promises as fs } from 'fs';
import path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ImportTarget =
  | 'products' | 'otb_budget' | 'wssi' | 'size_profiles'
  | 'forecasts' | 'clearance' | 'kpi_targets' | 'suppliers' | 'categories';

export interface StoredRecord {
  _id: string;
  _importedAt: string;
  _importSessionId: string;
  _source: string;
  [key: string]: unknown;
}

export interface BatchImportRequest {
  target: ImportTarget;
  mode: 'insert' | 'upsert' | 'update_only';
  duplicateHandling: 'skip' | 'overwrite' | 'merge';
  matchKey: string[];
  rows: Record<string, unknown>[];
  batchIndex: number;
  totalBatches: number;
  sessionId?: string;
}

export interface BatchImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ row: number; field?: string; error: string }>;
  sessionId: string;
}

// ─── File Store ──────────────────────────────────────────────────────────────

const DATA_ROOT = path.join(process.cwd(), 'data', 'imports');

async function ensureDir(target: ImportTarget): Promise<string> {
  const dir = path.join(DATA_ROOT, target);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function readStore(target: ImportTarget): Promise<StoredRecord[]> {
  try {
    const dir = await ensureDir(target);
    const filePath = path.join(dir, 'store.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStore(target: ImportTarget, records: StoredRecord[]): Promise<void> {
  const dir = await ensureDir(target);
  const filePath = path.join(dir, 'store.json');
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
}

function genId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Batch Import ────────────────────────────────────────────────────────────

export async function processBatch(req: BatchImportRequest): Promise<BatchImportResult> {
  const { target, mode, duplicateHandling, matchKey, rows } = req;
  const sessionId = req.sessionId || `sess_${genId()}`;
  const now = new Date().toISOString();

  const existing = await readStore(target);

  // Build index for duplicate detection
  const indexMap = new Map<string, number>();
  existing.forEach((rec, idx) => {
    const key = matchKey.map((k) => String(rec[k] ?? '')).join('||');
    if (key && key !== matchKey.map(() => '').join('||')) {
      indexMap.set(key.toLowerCase(), idx);
    }
  });

  const result: BatchImportResult = {
    inserted: 0, updated: 0, skipped: 0, errors: 0,
    errorDetails: [], sessionId,
  };

  const updated = [...existing];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Skip entirely empty rows
      const hasData = Object.values(row).some((v) => v !== null && v !== undefined && v !== '');
      if (!hasData) { result.skipped++; continue; }

      const rowKey = matchKey.map((k) => String(row[k] ?? '')).join('||').toLowerCase();
      const existingIdx = rowKey && rowKey !== matchKey.map(() => '').join('||')
        ? indexMap.get(rowKey)
        : undefined;

      if (existingIdx !== undefined) {
        // Duplicate found
        switch (mode) {
          case 'insert':
            switch (duplicateHandling) {
              case 'skip':
                result.skipped++;
                break;
              case 'overwrite':
                updated[existingIdx] = {
                  ...updated[existingIdx], ...row,
                  _importedAt: now, _importSessionId: sessionId, _source: 'import',
                };
                result.updated++;
                break;
              case 'merge':
                for (const [k, v] of Object.entries(row)) {
                  if (v !== null && v !== undefined && v !== '') {
                    updated[existingIdx][k] = v;
                  }
                }
                updated[existingIdx]._importedAt = now;
                updated[existingIdx]._importSessionId = sessionId;
                result.updated++;
                break;
            }
            break;

          case 'upsert':
            updated[existingIdx] = {
              ...updated[existingIdx], ...row,
              _importedAt: now, _importSessionId: sessionId, _source: 'import',
            };
            result.updated++;
            break;

          case 'update_only':
            updated[existingIdx] = {
              ...updated[existingIdx], ...row,
              _importedAt: now, _importSessionId: sessionId, _source: 'import',
            };
            result.updated++;
            break;
        }
      } else {
        // New record
        if (mode === 'update_only') {
          result.skipped++;
        } else {
          const newRec: StoredRecord = {
            _id: genId(),
            _importedAt: now,
            _importSessionId: sessionId,
            _source: 'import',
            ...row,
          };
          updated.push(newRec);
          indexMap.set(rowKey, updated.length - 1);
          result.inserted++;
        }
      }
    } catch (err) {
      result.errors++;
      result.errorDetails.push({
        row: i + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await writeStore(target, updated);
  return result;
}

// ─── Query Data ──────────────────────────────────────────────────────────────

export interface QueryParams {
  target: ImportTarget;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

export interface QueryResult {
  records: StoredRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function queryData(params: QueryParams): Promise<QueryResult> {
  const { target, page = 1, pageSize = 50, search, sortBy = '_importedAt', sortOrder = 'desc', filters } = params;

  let records = await readStore(target);

  // Search
  if (search) {
    const q = search.toLowerCase();
    records = records.filter((r) =>
      Object.entries(r)
        .filter(([k]) => !k.startsWith('_'))
        .some(([, v]) => v !== null && String(v).toLowerCase().includes(q))
    );
  }

  // Filters
  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (val) {
        records = records.filter((r) =>
          String(r[key] ?? '').toLowerCase().includes(val.toLowerCase())
        );
      }
    }
  }

  // Sort
  records.sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const na = Number(va), nb = Number(vb);
    if (!isNaN(na) && !isNaN(nb)) return sortOrder === 'asc' ? na - nb : nb - na;
    return sortOrder === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const total = records.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return { records: records.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface ImportStats {
  target: ImportTarget;
  totalRecords: number;
  lastImportAt: string | null;
  sessionCount: number;
  fieldCounts: Record<string, number>;
}

export async function getStats(target: ImportTarget): Promise<ImportStats> {
  const records = await readStore(target);
  const sessions = new Set(records.map((r) => r._importSessionId));
  const lastImport = records.reduce<string | null>((latest, r) => {
    if (!latest || r._importedAt > latest) return r._importedAt;
    return latest;
  }, null);

  const fieldCounts: Record<string, number> = {};
  for (const r of records) {
    for (const [k, v] of Object.entries(r)) {
      if (k.startsWith('_')) continue;
      if (v !== null && v !== undefined && v !== '') {
        fieldCounts[k] = (fieldCounts[k] || 0) + 1;
      }
    }
  }

  return {
    target, totalRecords: records.length,
    lastImportAt: lastImport, sessionCount: sessions.size, fieldCounts,
  };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteSession(target: ImportTarget, sessionId: string): Promise<number> {
  const records = await readStore(target);
  const kept = records.filter((r) => r._importSessionId !== sessionId);
  await writeStore(target, kept);
  return records.length - kept.length;
}

export async function clearAll(target: ImportTarget): Promise<number> {
  const records = await readStore(target);
  await writeStore(target, []);
  return records.length;
}
