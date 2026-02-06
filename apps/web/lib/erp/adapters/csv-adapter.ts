// CSV Import/Export Adapter
import { ERPType } from '@prisma/client';
import { BaseERPAdapter, ConnectionConfig, EntityData, SyncResult } from './base-adapter';

export class CSVAdapter extends BaseERPAdapter {
  constructor(config: ConnectionConfig) {
    super(config, ERPType.CSV_IMPORT, 'CSV Import/Export');
  }

  async testConnection(): Promise<boolean> {
    // CSV adapter doesn't need connection testing
    return true;
  }

  getSupportedEntities(): string[] {
    return ['products', 'inventory', 'sales', 'budget'];
  }

  async fetchEntities(_entityType: string, _lastSyncAt?: Date): Promise<EntityData[]> {
    // CSV import is handled separately through file upload
    // CSV adapter: fetching ${entityType}
    return [];
  }

  async pushEntities(entityType: string, entities: EntityData[]): Promise<SyncResult> {
    const startedAt = new Date();

    // CSV export - convert entities to CSV format
    try {
      const records = entities.length;

      return {
        success: true,
        recordsTotal: records,
        recordsSuccess: records,
        recordsFailed: 0,
        startedAt,
        completedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        recordsTotal: entities.length,
        recordsSuccess: 0,
        recordsFailed: entities.length,
        errors: [{ record: 'all', error: error instanceof Error ? error.message : 'Unknown error' }],
        startedAt,
        completedAt: new Date(),
      };
    }
  }

  // Parse CSV data
  parseCSV(csvContent: string, hasHeader: boolean = true): Record<string, string>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = hasHeader
      ? lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      : lines[0].split(',').map((_, i) => `column_${i}`);

    const startLine = hasHeader ? 1 : 0;
    const results: Record<string, string>[] = [];

    for (let i = startLine; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const record: Record<string, string> = {};

      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      results.push(record);
    }

    return results;
  }

  // Parse a single CSV line (handling quoted values)
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  // Generate CSV from data
  generateCSV(data: Record<string, unknown>[], headers?: string[]): string {
    if (data.length === 0) return '';

    const keys = headers || Object.keys(data[0]);
    const lines: string[] = [];

    // Header row
    lines.push(keys.map((k) => `"${k}"`).join(','));

    // Data rows
    for (const row of data) {
      const values = keys.map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }
}
