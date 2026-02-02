'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Lock, ShieldOff } from 'lucide-react';

// ============================================================
// Types & Constants
// ============================================================

export type UserRole =
  | 'ADMIN'
  | 'CEO'
  | 'FINANCE_DIRECTOR'
  | 'GSM'
  | 'BRAND_MANAGER'
  | 'MERCHANDISER'
  | 'PLANNER'
  | 'VIEWER';

export type Permission =
  // Budget permissions
  | 'budget:view'
  | 'budget:edit'
  | 'budget:approve'
  | 'budget:delete'
  // SKU permissions
  | 'sku:view'
  | 'sku:create'
  | 'sku:edit'
  | 'sku:approve'
  | 'sku:delete'
  // OTB permissions
  | 'otb:view'
  | 'otb:edit'
  | 'otb:approve'
  | 'otb:lock'
  // Delivery permissions
  | 'delivery:view'
  | 'delivery:edit'
  | 'delivery:approve'
  // Media permissions
  | 'media:view'
  | 'media:upload'
  | 'media:delete'
  // Reports permissions
  | 'reports:view'
  | 'reports:export'
  // Settings permissions
  | 'settings:view'
  | 'settings:edit'
  // User management
  | 'users:view'
  | 'users:manage';

// Role -> Permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'budget:view', 'budget:edit', 'budget:approve', 'budget:delete',
    'sku:view', 'sku:create', 'sku:edit', 'sku:approve', 'sku:delete',
    'otb:view', 'otb:edit', 'otb:approve', 'otb:lock',
    'delivery:view', 'delivery:edit', 'delivery:approve',
    'media:view', 'media:upload', 'media:delete',
    'reports:view', 'reports:export',
    'settings:view', 'settings:edit',
    'users:view', 'users:manage',
  ],
  CEO: [
    'budget:view', 'budget:approve',
    'sku:view', 'sku:approve',
    'otb:view', 'otb:approve', 'otb:lock',
    'delivery:view', 'delivery:approve',
    'media:view',
    'reports:view', 'reports:export',
    'settings:view',
    'users:view',
  ],
  FINANCE_DIRECTOR: [
    'budget:view', 'budget:edit', 'budget:approve',
    'sku:view', 'sku:approve',
    'otb:view', 'otb:edit', 'otb:approve',
    'delivery:view',
    'media:view',
    'reports:view', 'reports:export',
    'settings:view',
  ],
  GSM: [
    'budget:view', 'budget:edit',
    'sku:view', 'sku:create', 'sku:edit', 'sku:approve',
    'otb:view', 'otb:edit', 'otb:approve',
    'delivery:view', 'delivery:edit', 'delivery:approve',
    'media:view', 'media:upload',
    'reports:view', 'reports:export',
  ],
  BRAND_MANAGER: [
    'budget:view', 'budget:edit',
    'sku:view', 'sku:create', 'sku:edit',
    'otb:view', 'otb:edit',
    'delivery:view', 'delivery:edit',
    'media:view', 'media:upload',
    'reports:view',
  ],
  MERCHANDISER: [
    'budget:view',
    'sku:view', 'sku:create', 'sku:edit',
    'otb:view',
    'delivery:view', 'delivery:edit',
    'media:view', 'media:upload',
    'reports:view',
  ],
  PLANNER: [
    'budget:view',
    'sku:view',
    'otb:view', 'otb:edit',
    'delivery:view', 'delivery:edit',
    'media:view',
    'reports:view',
  ],
  VIEWER: [
    'budget:view',
    'sku:view',
    'otb:view',
    'delivery:view',
    'media:view',
    'reports:view',
  ],
};

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: UserRole[] = [
  'VIEWER',
  'PLANNER',
  'MERCHANDISER',
  'BRAND_MANAGER',
  'GSM',
  'FINANCE_DIRECTOR',
  'CEO',
  'ADMIN',
];

// ============================================================
// Permission Context
// ============================================================

interface PermissionContextValue {
  userRole: UserRole | null;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isRoleAtLeast: (role: UserRole) => boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  userRole: null,
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isRoleAtLeast: () => false,
});

// ============================================================
// Permission Provider
// ============================================================

interface PermissionProviderProps {
  userRole: UserRole | null;
  customPermissions?: Permission[];
  children: React.ReactNode;
}

export function PermissionProvider({
  userRole,
  customPermissions,
  children,
}: PermissionProviderProps) {
  const permissions = useMemo(() => {
    if (!userRole) return [];
    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    if (customPermissions) {
      const combined = [...rolePerms, ...customPermissions];
      return Array.from(new Set(combined));
    }
    return rolePerms;
  }, [userRole, customPermissions]);

  const hasPermission = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: Permission[]) => perms.some((p) => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: Permission[]) => perms.every((p) => permissions.includes(p)),
    [permissions]
  );

  const isRoleAtLeast = useCallback(
    (role: UserRole) => {
      if (!userRole) return false;
      const userIndex = ROLE_HIERARCHY.indexOf(userRole);
      const requiredIndex = ROLE_HIERARCHY.indexOf(role);
      return userIndex >= requiredIndex;
    },
    [userRole]
  );

  const value = useMemo(
    () => ({
      userRole,
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isRoleAtLeast,
    }),
    [userRole, permissions, hasPermission, hasAnyPermission, hasAllPermissions, isRoleAtLeast]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ============================================================
// usePermissionCheck Hook
// ============================================================

export function usePermissionCheck() {
  return useContext(PermissionContext);
}

/**
 * Check a single permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { hasPermission } = usePermissionCheck();
  return hasPermission(permission);
}

/**
 * Check if user has any of the given permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { hasAnyPermission } = usePermissionCheck();
  return hasAnyPermission(permissions);
}

/**
 * Check if user's role is at least the specified level
 */
export function useIsRoleAtLeast(role: UserRole): boolean {
  const { isRoleAtLeast } = usePermissionCheck();
  return isRoleAtLeast(role);
}

// ============================================================
// RoleGateWrapper Component
// ============================================================

interface RoleGateWrapperProps {
  // Permission requirements (one of these must be provided)
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, all permissions required; if false, any one suffices
  role?: UserRole; // Minimum role required

  // Behavior
  fallback?: React.ReactNode;
  showFallback?: boolean;
  disableInsteadOfHide?: boolean;

  // Children
  children: React.ReactNode;
  className?: string;
}

/**
 * RoleGateWrapper - Conditionally render content based on permissions
 *
 * Usage:
 * ```tsx
 * <RoleGateWrapper permission="budget:edit">
 *   <EditButton />
 * </RoleGateWrapper>
 *
 * <RoleGateWrapper permissions={['sku:edit', 'sku:delete']} requireAll>
 *   <BulkEditForm />
 * </RoleGateWrapper>
 *
 * <RoleGateWrapper role="GSM">
 *   <ApprovalPanel />
 * </RoleGateWrapper>
 * ```
 */
export function RoleGateWrapper({
  permission,
  permissions,
  requireAll = false,
  role,
  fallback,
  showFallback = false,
  disableInsteadOfHide = false,
  children,
  className,
}: RoleGateWrapperProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRoleAtLeast,
  } = usePermissionCheck();

  // Determine if access is granted
  const hasAccess = useMemo(() => {
    // Check role requirement
    if (role && !isRoleAtLeast(role)) return false;

    // Check single permission
    if (permission && !hasPermission(permission)) return false;

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      if (requireAll && !hasAllPermissions(permissions)) return false;
      if (!requireAll && !hasAnyPermission(permissions)) return false;
    }

    return true;
  }, [
    permission,
    permissions,
    requireAll,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRoleAtLeast,
  ]);

  // If access denied
  if (!hasAccess) {
    // Show disabled version
    if (disableInsteadOfHide) {
      return (
        <div className={cn('pointer-events-none opacity-50', className)}>
          {children}
        </div>
      );
    }

    // Show fallback
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }

    // Show default fallback
    if (showFallback) {
      return (
        <div
          className={cn(
            'flex items-center justify-center p-4 text-muted-foreground bg-muted/30 rounded-lg',
            className
          )}
        >
          <Lock className="w-4 h-4 mr-2" />
          <span className="text-sm">Bạn không có quyền truy cập</span>
        </div>
      );
    }

    // Hide completely
    return null;
  }

  // Access granted
  return <>{children}</>;
}

// ============================================================
// Additional Helper Components
// ============================================================

/**
 * PermissionBadge - Display user's current role
 */
interface PermissionBadgeProps {
  className?: string;
}

const ROLE_LABELS: Record<UserRole, { en: string; vi: string }> = {
  ADMIN: { en: 'Administrator', vi: 'Quản trị viên' },
  CEO: { en: 'CEO', vi: 'CEO' },
  FINANCE_DIRECTOR: { en: 'Finance Director', vi: 'Giám đốc Tài chính' },
  GSM: { en: 'General Sales Manager', vi: 'Giám đốc Kinh doanh' },
  BRAND_MANAGER: { en: 'Brand Manager', vi: 'Quản lý Thương hiệu' },
  MERCHANDISER: { en: 'Merchandiser', vi: 'Merchandiser' },
  PLANNER: { en: 'Planner', vi: 'Planner' },
  VIEWER: { en: 'Viewer', vi: 'Người xem' },
};

export function PermissionBadge({ className }: PermissionBadgeProps) {
  const { userRole } = usePermissionCheck();

  if (!userRole) return null;

  const label = ROLE_LABELS[userRole];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        userRole === 'ADMIN' && 'bg-purple-100 text-purple-800',
        userRole === 'CEO' && 'bg-amber-100 text-amber-800',
        userRole === 'FINANCE_DIRECTOR' && 'bg-blue-100 text-blue-800',
        userRole === 'GSM' && 'bg-green-100 text-green-800',
        userRole === 'BRAND_MANAGER' && 'bg-teal-100 text-teal-800',
        userRole === 'MERCHANDISER' && 'bg-cyan-100 text-cyan-800',
        userRole === 'PLANNER' && 'bg-indigo-100 text-indigo-800',
        userRole === 'VIEWER' && 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {label.vi}
    </span>
  );
}

/**
 * PermissionGuard - HOC for protecting components
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: Permission
) {
  return function PermissionGuardedComponent(props: P) {
    return (
      <RoleGateWrapper permission={permission}>
        <WrappedComponent {...props} />
      </RoleGateWrapper>
    );
  };
}

/**
 * useCanEdit - Common hook for edit permission checks
 */
export function useCanEdit(resource: 'budget' | 'sku' | 'otb' | 'delivery' | 'media' | 'settings') {
  const { hasPermission, hasAnyPermission } = usePermissionCheck();

  return {
    canView: hasPermission(`${resource}:view` as Permission),
    canEdit: hasPermission(`${resource}:edit` as Permission),
    canCreate: hasAnyPermission([`${resource}:create` as Permission, `${resource}:edit` as Permission]),
    canDelete: hasPermission(`${resource}:delete` as Permission),
    canApprove: hasPermission(`${resource}:approve` as Permission),
  };
}
