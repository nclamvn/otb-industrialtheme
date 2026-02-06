'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-3: Permission Engine — RBAC Authorization Logic
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import {
  PermissionKey,
  RoleName,
  PermissionUser,
  PermissionCheckResult,
  PermissionAuditEntry,
  ROLE_DEFINITIONS,
  ROLE_HIERARCHY,
} from '@/types/permissions';

// ─── Permission Engine Class ────────────────────────────────────────────────────
export class PermissionEngine {
  private user: PermissionUser | null = null;
  private auditLog: PermissionAuditEntry[] = [];
  private onAuditEntry?: (entry: PermissionAuditEntry) => void;

  constructor(onAuditEntry?: (entry: PermissionAuditEntry) => void) {
    this.onAuditEntry = onAuditEntry;
  }

  // ─── Set Current User ─────────────────────────────────────────────────────────
  setUser(user: PermissionUser | null): void {
    this.user = user;
  }

  getUser(): PermissionUser | null {
    return this.user;
  }

  // ─── Check Single Permission ──────────────────────────────────────────────────
  check(permission: PermissionKey): PermissionCheckResult {
    if (!this.user) {
      return {
        allowed: false,
        reason: 'Người dùng chưa đăng nhập',
        requiredPermission: permission,
        userRole: 'viewer',
      };
    }

    if (!this.user.isActive) {
      this.logAccessDenied(permission, 'Tài khoản đã bị vô hiệu hóa');
      return {
        allowed: false,
        reason: 'Tài khoản đã bị vô hiệu hóa',
        requiredPermission: permission,
        userRole: this.user.role,
      };
    }

    // Check if explicitly revoked
    if (this.user.revokedPermissions?.includes(permission)) {
      this.logAccessDenied(permission, 'Quyền đã bị thu hồi');
      return {
        allowed: false,
        reason: 'Quyền này đã bị thu hồi khỏi tài khoản của bạn',
        requiredPermission: permission,
        userRole: this.user.role,
      };
    }

    // Check custom permissions first
    if (this.user.customPermissions?.includes(permission)) {
      return {
        allowed: true,
        requiredPermission: permission,
        userRole: this.user.role,
      };
    }

    // Check role-based permissions
    const roleDefinition = ROLE_DEFINITIONS[this.user.role];
    if (roleDefinition.permissions.includes(permission)) {
      return {
        allowed: true,
        requiredPermission: permission,
        userRole: this.user.role,
      };
    }

    this.logAccessDenied(permission, 'Không có quyền');
    return {
      allowed: false,
      reason: `Vai trò "${roleDefinition.labelVi}" không có quyền này`,
      requiredPermission: permission,
      userRole: this.user.role,
    };
  }

  // ─── Check Multiple Permissions (AND) ─────────────────────────────────────────
  checkAll(permissions: PermissionKey[]): PermissionCheckResult {
    for (const permission of permissions) {
      const result = this.check(permission);
      if (!result.allowed) return result;
    }
    return {
      allowed: true,
      requiredPermission: permissions[0],
      userRole: this.user?.role || 'viewer',
    };
  }

  // ─── Check Multiple Permissions (OR) ──────────────────────────────────────────
  checkAny(permissions: PermissionKey[]): PermissionCheckResult {
    for (const permission of permissions) {
      const result = this.check(permission);
      if (result.allowed) return result;
    }
    return {
      allowed: false,
      reason: 'Không có quyền cần thiết',
      requiredPermission: permissions[0],
      userRole: this.user?.role || 'viewer',
    };
  }

  // ─── Check Role Level ─────────────────────────────────────────────────────────
  hasRoleLevel(minRole: RoleName): boolean {
    if (!this.user) return false;
    const userLevel = ROLE_DEFINITIONS[this.user.role].level;
    const requiredLevel = ROLE_DEFINITIONS[minRole].level;
    return userLevel <= requiredLevel;
  }

  // ─── Get User Permissions ─────────────────────────────────────────────────────
  getUserPermissions(): PermissionKey[] {
    if (!this.user || !this.user.isActive) return [];

    const rolePermissions = ROLE_DEFINITIONS[this.user.role].permissions;
    const customPermissions = this.user.customPermissions || [];
    const revokedPermissions = this.user.revokedPermissions || [];

    const allPermissions = new Set([...rolePermissions, ...customPermissions]);
    revokedPermissions.forEach((p) => allPermissions.delete(p));

    return Array.from(allPermissions);
  }

  // ─── Can User Manage Role ─────────────────────────────────────────────────────
  canManageRole(targetRole: RoleName): boolean {
    if (!this.user) return false;
    const userLevel = ROLE_DEFINITIONS[this.user.role].level;
    const targetLevel = ROLE_DEFINITIONS[targetRole].level;
    // Can only manage roles at lower privilege level (higher number)
    return userLevel < targetLevel;
  }

  // ─── Get Manageable Roles ─────────────────────────────────────────────────────
  getManageableRoles(): RoleName[] {
    if (!this.user) return [];
    const userLevel = ROLE_DEFINITIONS[this.user.role].level;
    return ROLE_HIERARCHY.filter((role) => ROLE_DEFINITIONS[role].level > userLevel);
  }

  // ─── Audit Logging ────────────────────────────────────────────────────────────
  private logAccessDenied(permission: PermissionKey, reason: string): void {
    if (!this.user) return;

    const entry: PermissionAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.user.id,
      userName: this.user.name,
      action: 'access_denied',
      permission,
      metadata: { reason },
    };

    this.auditLog.push(entry);
    this.onAuditEntry?.(entry);
  }

  logPermissionChange(
    action: 'granted' | 'revoked' | 'role_changed',
    targetUser: PermissionUser,
    details: {
      permission?: PermissionKey;
      previousRole?: RoleName;
      newRole?: RoleName;
    }
  ): void {
    if (!this.user) return;

    const entry: PermissionAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.user.id,
      userName: this.user.name,
      action,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      permission: details.permission,
      previousRole: details.previousRole,
      newRole: details.newRole,
    };

    this.auditLog.push(entry);
    this.onAuditEntry?.(entry);
  }

  logLogin(user: PermissionUser, ipAddress?: string, userAgent?: string): void {
    const entry: PermissionAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: user.id,
      userName: user.name,
      action: 'login',
      ipAddress,
      userAgent,
    };

    this.auditLog.push(entry);
    this.onAuditEntry?.(entry);
  }

  logLogout(): void {
    if (!this.user) return;

    const entry: PermissionAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.user.id,
      userName: this.user.name,
      action: 'logout',
    };

    this.auditLog.push(entry);
    this.onAuditEntry?.(entry);
  }

  getAuditLog(): PermissionAuditEntry[] {
    return [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────────────────
let engineInstance: PermissionEngine | null = null;

export function getPermissionEngine(): PermissionEngine {
  if (!engineInstance) {
    engineInstance = new PermissionEngine();
  }
  return engineInstance;
}

export function createPermissionEngine(
  onAuditEntry?: (entry: PermissionAuditEntry) => void
): PermissionEngine {
  return new PermissionEngine(onAuditEntry);
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
export function parsePermissionKey(key: PermissionKey): {
  resource: string;
  action: string;
} {
  const [resource, action] = key.split(':');
  return { resource, action };
}

export function formatPermissionKey(resource: string, action: string): PermissionKey {
  return `${resource}:${action}` as PermissionKey;
}

export function getPermissionLabel(key: PermissionKey, locale: 'en' | 'vi' = 'vi'): string {
  const { resource, action } = parsePermissionKey(key);

  const resourceLabels: Record<string, { en: string; vi: string }> = {
    budget: { en: 'Budget', vi: 'Ngân sách' },
    otb: { en: 'OTB', vi: 'OTB' },
    wssi: { en: 'WSSI', vi: 'WSSI' },
    size_profile: { en: 'Size Profile', vi: 'Hồ sơ size' },
    forecast: { en: 'Forecast', vi: 'Dự báo' },
    clearance: { en: 'Clearance', vi: 'Thanh lý' },
    kpi: { en: 'KPI', vi: 'KPI' },
    media: { en: 'Media', vi: 'Media' },
    product: { en: 'Product', vi: 'Sản phẩm' },
    category: { en: 'Category', vi: 'Danh mục' },
    season: { en: 'Season', vi: 'Mùa' },
    supplier: { en: 'Supplier', vi: 'Nhà cung cấp' },
    report: { en: 'Report', vi: 'Báo cáo' },
    user: { en: 'User', vi: 'Người dùng' },
    settings: { en: 'Settings', vi: 'Cài đặt' },
    audit_log: { en: 'Audit Log', vi: 'Nhật ký' },
  };

  const actionLabels: Record<string, { en: string; vi: string }> = {
    create: { en: 'Create', vi: 'Tạo' },
    read: { en: 'View', vi: 'Xem' },
    update: { en: 'Edit', vi: 'Sửa' },
    delete: { en: 'Delete', vi: 'Xóa' },
    approve: { en: 'Approve', vi: 'Duyệt' },
    export: { en: 'Export', vi: 'Xuất' },
    import: { en: 'Import', vi: 'Nhập' },
    lock: { en: 'Lock', vi: 'Khóa' },
    unlock: { en: 'Unlock', vi: 'Mở khóa' },
    archive: { en: 'Archive', vi: 'Lưu trữ' },
    bulk_edit: { en: 'Bulk Edit', vi: 'Sửa hàng loạt' },
    manage_users: { en: 'Manage Users', vi: 'Quản lý người dùng' },
    view_analytics: { en: 'View Analytics', vi: 'Xem phân tích' },
    configure: { en: 'Configure', vi: 'Cấu hình' },
  };

  const rLabel = resourceLabels[resource]?.[locale] || resource;
  const aLabel = actionLabels[action]?.[locale] || action;

  return `${aLabel} ${rLabel}`;
}
