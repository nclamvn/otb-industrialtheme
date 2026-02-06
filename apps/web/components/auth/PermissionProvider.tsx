'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-3: PermissionProvider — React Context for RBAC
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import {
  PermissionKey,
  RoleName,
  PermissionUser,
  PermissionCheckResult,
  PermissionAuditEntry,
  ROLE_DEFINITIONS,
} from '@/types/permissions';
import { PermissionEngine, createPermissionEngine } from '@/lib/permissions/permission-engine';

// ─── Context Types ──────────────────────────────────────────────────────────────
interface PermissionContextValue {
  user: PermissionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Permission checks
  can: (permission: PermissionKey) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  check: (permission: PermissionKey) => PermissionCheckResult;
  hasRole: (role: RoleName) => boolean;
  hasRoleLevel: (minRole: RoleName) => boolean;
  // User management
  setUser: (user: PermissionUser | null) => void;
  getUserPermissions: () => PermissionKey[];
  getManageableRoles: () => RoleName[];
  canManageRole: (role: RoleName) => boolean;
  // Audit
  auditLog: PermissionAuditEntry[];
  logPermissionChange: (
    action: 'granted' | 'revoked' | 'role_changed',
    targetUser: PermissionUser,
    details: { permission?: PermissionKey; previousRole?: RoleName; newRole?: RoleName }
  ) => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

// ─── Provider Props ─────────────────────────────────────────────────────────────
interface PermissionProviderProps {
  children: React.ReactNode;
  initialUser?: PermissionUser | null;
  onAuditEntry?: (entry: PermissionAuditEntry) => void;
}

// ─── Provider Component ─────────────────────────────────────────────────────────
export function PermissionProvider({
  children,
  initialUser = null,
  onAuditEntry,
}: PermissionProviderProps) {
  const [user, setUserState] = useState<PermissionUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const [auditLog, setAuditLog] = useState<PermissionAuditEntry[]>([]);

  // Create engine with audit callback
  const engine = useMemo(() => {
    return createPermissionEngine((entry) => {
      setAuditLog((prev) => [...prev, entry]);
      onAuditEntry?.(entry);
    });
  }, [onAuditEntry]);

  // Sync user with engine
  useEffect(() => {
    engine.setUser(user);
  }, [user, engine]);

  // ─── Permission Check Functions ───────────────────────────────────────────────
  const can = useCallback(
    (permission: PermissionKey): boolean => {
      return engine.check(permission).allowed;
    },
    [engine]
  );

  const canAll = useCallback(
    (permissions: PermissionKey[]): boolean => {
      return engine.checkAll(permissions).allowed;
    },
    [engine]
  );

  const canAny = useCallback(
    (permissions: PermissionKey[]): boolean => {
      return engine.checkAny(permissions).allowed;
    },
    [engine]
  );

  const check = useCallback(
    (permission: PermissionKey): PermissionCheckResult => {
      return engine.check(permission);
    },
    [engine]
  );

  const hasRole = useCallback(
    (role: RoleName): boolean => {
      return user?.role === role;
    },
    [user]
  );

  const hasRoleLevel = useCallback(
    (minRole: RoleName): boolean => {
      return engine.hasRoleLevel(minRole);
    },
    [engine]
  );

  // ─── User Management ──────────────────────────────────────────────────────────
  const setUser = useCallback((newUser: PermissionUser | null) => {
    setUserState(newUser);
  }, []);

  const getUserPermissions = useCallback((): PermissionKey[] => {
    return engine.getUserPermissions();
  }, [engine]);

  const getManageableRoles = useCallback((): RoleName[] => {
    return engine.getManageableRoles();
  }, [engine]);

  const canManageRole = useCallback(
    (role: RoleName): boolean => {
      return engine.canManageRole(role);
    },
    [engine]
  );

  // ─── Audit Functions ──────────────────────────────────────────────────────────
  const logPermissionChange = useCallback(
    (
      action: 'granted' | 'revoked' | 'role_changed',
      targetUser: PermissionUser,
      details: { permission?: PermissionKey; previousRole?: RoleName; newRole?: RoleName }
    ) => {
      engine.logPermissionChange(action, targetUser, details);
    },
    [engine]
  );

  // ─── Context Value ────────────────────────────────────────────────────────────
  const value = useMemo<PermissionContextValue>(
    () => ({
      user,
      isAuthenticated: !!user && user.isActive,
      isLoading,
      can,
      canAll,
      canAny,
      check,
      hasRole,
      hasRoleLevel,
      setUser,
      getUserPermissions,
      getManageableRoles,
      canManageRole,
      auditLog,
      logPermissionChange,
    }),
    [
      user,
      isLoading,
      can,
      canAll,
      canAny,
      check,
      hasRole,
      hasRoleLevel,
      setUser,
      getUserPermissions,
      getManageableRoles,
      canManageRole,
      auditLog,
      logPermissionChange,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────────
export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// ─── HOC for Permission-Protected Components ────────────────────────────────────
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: PermissionKey,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionProtectedComponent(props: P) {
    const { can } = usePermissions();

    if (!can(requiredPermission)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };
}

// ─── Demo User Factory ──────────────────────────────────────────────────────────
export function createDemoUser(role: RoleName): PermissionUser {
  const roleDefinition = ROLE_DEFINITIONS[role];
  return {
    id: `demo-${role}`,
    email: `${role}@dafc-otb.demo`,
    name: `Demo ${roleDefinition.label}`,
    role,
    isActive: true,
    lastLogin: new Date(),
  };
}

export const DEMO_USERS: Record<RoleName, PermissionUser> = {
  admin: createDemoUser('admin'),
  merchandising_director: createDemoUser('merchandising_director'),
  planner: createDemoUser('planner'),
  buyer: createDemoUser('buyer'),
  analyst: createDemoUser('analyst'),
  viewer: createDemoUser('viewer'),
};
