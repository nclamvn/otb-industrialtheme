export {
  RoleGateWrapper,
  PermissionProvider,
  PermissionBadge,
  withPermission,
  usePermissionCheck,
  useHasPermission,
  useHasAnyPermission,
  useIsRoleAtLeast,
  useCanEdit,
  type UserRole,
  type Permission,
} from './RoleGateWrapper';

// Phase 4: Advanced RBAC (ADV-3)
export {
  PermissionProvider as AdvancedPermissionProvider,
  usePermissions,
  withPermission as withAdvancedPermission,
  createDemoUser,
  DEMO_USERS,
} from './PermissionProvider';

export { PermissionAuditLog } from './PermissionAuditLog';
