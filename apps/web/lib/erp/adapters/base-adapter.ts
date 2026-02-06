// Base ERP Adapter
import { ERPType, SyncDirection } from '@prisma/client';

// Sync result type
export interface SyncResult {
  success: boolean;
  recordsTotal: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors?: Array<{ record: string; error: string }>;
  startedAt: Date;
  completedAt: Date;
}

// Entity data type
export interface EntityData {
  id: string;
  [key: string]: unknown;
}

// Connection config
export interface ConnectionConfig {
  host: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  additionalConfig?: Record<string, unknown>;
}

// Field mapping
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: string;
  isRequired: boolean;
}

// Base adapter abstract class
export abstract class BaseERPAdapter {
  protected config: ConnectionConfig;
  protected type: ERPType;
  protected name: string;

  constructor(config: ConnectionConfig, type: ERPType, name: string) {
    this.config = config;
    this.type = type;
    this.name = name;
  }

  // Abstract methods to be implemented by specific adapters
  abstract testConnection(): Promise<boolean>;
  abstract fetchEntities(entityType: string, lastSyncAt?: Date): Promise<EntityData[]>;
  abstract pushEntities(entityType: string, entities: EntityData[]): Promise<SyncResult>;
  abstract getSupportedEntities(): string[];

  // Common helper methods
  protected applyFieldMapping(
    data: Record<string, unknown>,
    mappings: FieldMapping[],
    direction: 'inbound' | 'outbound'
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const mapping of mappings) {
      const sourceKey = direction === 'inbound' ? mapping.sourceField : mapping.targetField;
      const targetKey = direction === 'inbound' ? mapping.targetField : mapping.sourceField;

      let value = data[sourceKey];

      // Apply transformation if specified
      if (mapping.transformation && value !== undefined) {
        value = this.applyTransformation(value, mapping.transformation);
      }

      // Use default value if value is undefined and required
      if (value === undefined && mapping.defaultValue) {
        value = mapping.defaultValue;
      }

      if (value !== undefined) {
        result[targetKey] = value;
      }
    }

    return result;
  }

  protected applyTransformation(value: unknown, transformation: string): unknown {
    switch (transformation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'number':
        return typeof value === 'string' ? parseFloat(value) : value;
      case 'string':
        return String(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return value instanceof Date ? value : new Date(String(value));
      case 'date_iso':
        return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
      default:
        return value;
    }
  }

  // Get adapter info
  getInfo(): { type: ERPType; name: string; supportedEntities: string[] } {
    return {
      type: this.type,
      name: this.name,
      supportedEntities: this.getSupportedEntities(),
    };
  }
}

// Sync direction helpers
export function canSyncInbound(direction: SyncDirection): boolean {
  return direction === SyncDirection.INBOUND || direction === SyncDirection.BIDIRECTIONAL;
}

export function canSyncOutbound(direction: SyncDirection): boolean {
  return direction === SyncDirection.OUTBOUND || direction === SyncDirection.BIDIRECTIONAL;
}
