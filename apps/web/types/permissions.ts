// ═══════════════════════════════════════════════════════════════════════════════
// ADV-3: Permission Types & Role Definitions
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Permission Actions ──────────────────────────────────────────────────────
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'import'
  | 'lock'
  | 'unlock'
  | 'archive'
  | 'bulk_edit'
  | 'manage_users'
  | 'view_analytics'
  | 'configure';

// ─── Resource Types ──────────────────────────────────────────────────────────
export type ResourceType =
  | 'budget'
  | 'otb'
  | 'wssi'
  | 'size_profile'
  | 'forecast'
  | 'clearance'
  | 'kpi'
  | 'media'
  | 'product'
  | 'category'
  | 'season'
  | 'supplier'
  | 'report'
  | 'user'
  | 'settings'
  | 'audit_log';

// ─── Permission Key ──────────────────────────────────────────────────────────
export type PermissionKey = `${ResourceType}:${PermissionAction}`;

// ─── Role Definitions ────────────────────────────────────────────────────────
export type RoleName =
  | 'admin'
  | 'merchandising_director'
  | 'planner'
  | 'buyer'
  | 'analyst'
  | 'viewer';

export interface RoleDefinition {
  name: RoleName;
  label: string;
  labelVi: string;
  description: string;
  level: number; // 0 = highest privilege
  permissions: PermissionKey[];
  color: string;
  icon: string;
}

// ─── User with Permissions ───────────────────────────────────────────────────
export interface PermissionUser {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  customPermissions?: PermissionKey[];
  revokedPermissions?: PermissionKey[];
  departmentId?: string;
  regionId?: string;
  isActive: boolean;
  lastLogin?: Date;
}

// ─── Permission Check Result ─────────────────────────────────────────────────
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermission: PermissionKey;
  userRole: RoleName;
}

// ─── Audit Log Entry ─────────────────────────────────────────────────────────
export interface PermissionAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'granted' | 'revoked' | 'role_changed' | 'access_denied' | 'login' | 'logout';
  targetUserId?: string;
  targetUserName?: string;
  permission?: PermissionKey;
  previousRole?: RoleName;
  newRole?: RoleName;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// ─── Department Scope ────────────────────────────────────────────────────────
export interface DepartmentScope {
  id: string;
  name: string;
  categories: string[];
  regions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE PERMISSION MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

const READ_ONLY: PermissionAction[] = ['read', 'export'];
const EDITOR: PermissionAction[] = ['create', 'read', 'update', 'export', 'import'];
const MANAGER: PermissionAction[] = [...EDITOR, 'delete', 'approve', 'lock', 'unlock', 'archive', 'bulk_edit'];
const ALL_ACTIONS: PermissionAction[] = [
  'create', 'read', 'update', 'delete', 'approve', 'export',
  'import', 'lock', 'unlock', 'archive', 'bulk_edit',
  'manage_users', 'view_analytics', 'configure',
];

function buildPermissions(resources: ResourceType[], actions: PermissionAction[]): PermissionKey[] {
  return resources.flatMap((r) => actions.map((a) => `${r}:${a}` as PermissionKey));
}

const ALL_RESOURCES: ResourceType[] = [
  'budget', 'otb', 'wssi', 'size_profile', 'forecast', 'clearance',
  'kpi', 'media', 'product', 'category', 'season', 'supplier',
  'report', 'user', 'settings', 'audit_log',
];

const PLANNING_RESOURCES: ResourceType[] = [
  'budget', 'otb', 'wssi', 'size_profile', 'forecast', 'clearance', 'kpi',
];

const PRODUCT_RESOURCES: ResourceType[] = [
  'product', 'media', 'category', 'season', 'supplier',
];

export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = {
  admin: {
    name: 'admin',
    label: 'Administrator',
    labelVi: 'Quản trị viên',
    description: 'Full system access with user management',
    level: 0,
    permissions: buildPermissions(ALL_RESOURCES, ALL_ACTIONS),
    color: '#A371F7',
    icon: 'Shield',
  },
  merchandising_director: {
    name: 'merchandising_director',
    label: 'Merchandising Director',
    labelVi: 'Giám đốc Merchandising',
    description: 'Full access to all planning and product data, can approve budgets',
    level: 1,
    permissions: [
      ...buildPermissions(ALL_RESOURCES, MANAGER),
      'user:read',
      'settings:read',
      'settings:update',
      'audit_log:read',
    ],
    color: '#D7B797',
    icon: 'Crown',
  },
  planner: {
    name: 'planner',
    label: 'Planner',
    labelVi: 'Chuyên viên lập kế hoạch',
    description: 'Can create and edit planning data, submit for approval',
    level: 2,
    permissions: [
      ...buildPermissions(PLANNING_RESOURCES, EDITOR),
      ...buildPermissions(PRODUCT_RESOURCES, READ_ONLY),
      'report:read',
      'report:export',
      'kpi:view_analytics',
    ],
    color: '#58A6FF',
    icon: 'BarChart3',
  },
  buyer: {
    name: 'buyer',
    label: 'Buyer',
    labelVi: 'Chuyên viên mua hàng',
    description: 'Can manage products, media, and supplier communications',
    level: 2,
    permissions: [
      ...buildPermissions(PRODUCT_RESOURCES, EDITOR),
      ...buildPermissions(PLANNING_RESOURCES, READ_ONLY),
      'media:delete',
      'media:bulk_edit',
      'supplier:update',
      'report:read',
      'report:export',
    ],
    color: '#3FB950',
    icon: 'ShoppingBag',
  },
  analyst: {
    name: 'analyst',
    label: 'Analyst',
    labelVi: 'Chuyên viên phân tích',
    description: 'Read access with analytics and export capabilities',
    level: 3,
    permissions: [
      ...buildPermissions(ALL_RESOURCES, READ_ONLY),
      'kpi:view_analytics',
      'forecast:view_analytics',
      'report:create',
    ],
    color: '#D29922',
    icon: 'TrendingUp',
  },
  viewer: {
    name: 'viewer',
    label: 'Viewer',
    labelVi: 'Người xem',
    description: 'Read-only access to approved data',
    level: 4,
    permissions: buildPermissions(
      ['budget', 'otb', 'wssi', 'kpi', 'product', 'media', 'report'],
      ['read']
    ),
    color: '#8B949E',
    icon: 'Eye',
  },
};

export const ROLE_HIERARCHY: RoleName[] = [
  'admin',
  'merchandising_director',
  'planner',
  'buyer',
  'analyst',
  'viewer',
];
