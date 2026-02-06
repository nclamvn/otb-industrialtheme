// Real-time Event Definitions

// Event types
export const REALTIME_EVENTS = {
  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CLEAR: 'notification:clear',

  // Approvals
  APPROVAL_REQUESTED: 'approval:requested',
  APPROVAL_COMPLETED: 'approval:completed',
  APPROVAL_ESCALATED: 'approval:escalated',

  // Data updates
  DATA_CREATED: 'data:created',
  DATA_UPDATED: 'data:updated',
  DATA_DELETED: 'data:deleted',

  // User presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_TYPING: 'user:typing',

  // AI
  AI_RESPONSE_START: 'ai:response:start',
  AI_RESPONSE_CHUNK: 'ai:response:chunk',
  AI_RESPONSE_END: 'ai:response:end',
  AI_SUGGESTION: 'ai:suggestion',

  // Sync
  SYNC_STARTED: 'sync:started',
  SYNC_PROGRESS: 'sync:progress',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED: 'sync:failed',

  // Export
  EXPORT_STARTED: 'export:started',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_READY: 'export:ready',
  EXPORT_FAILED: 'export:failed',

  // System
  SYSTEM_ALERT: 'system:alert',
  SYSTEM_MAINTENANCE: 'system:maintenance',
} as const;

export type RealtimeEventType = typeof REALTIME_EVENTS[keyof typeof REALTIME_EVENTS];

// Event payload types
export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

export interface ApprovalEvent {
  workflowId: string;
  workflowType: string;
  entityId: string;
  entityType: string;
  status: string;
  requestedBy?: string;
  approvedBy?: string;
}

export interface DataEvent {
  entityType: string;
  entityId: string;
  action: 'created' | 'updated' | 'deleted';
  data?: Record<string, unknown>;
  changedFields?: string[];
}

export interface UserPresenceEvent {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface SyncEvent {
  connectionId: string;
  connectionName: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
}

export interface ExportEvent {
  exportId: string;
  exportType: string;
  status: 'started' | 'progress' | 'ready' | 'failed';
  progress?: number;
  fileUrl?: string;
  error?: string;
}

// Channel helpers
export function getUserChannel(userId: string): string {
  return `user:${userId}`;
}

export function getRoleChannel(role: string): string {
  return `role:${role}`;
}

export function getEntityChannel(entityType: string, entityId?: string): string {
  return entityId ? `entity:${entityType}:${entityId}` : `entity:${entityType}`;
}

export function getGlobalChannel(): string {
  return 'global';
}
