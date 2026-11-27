import { User, Role } from '../types/hrms';

/**
 * Module IDs used across HRMS routing and sidebar
 */


export type HrmsModuleId =
  | 'dashboard'
  | 'companies'
  | 'plans'
  | 'orders'
  | 'support'
  | 'attendance'
  | 'leaves'
  | 'employees'
  | 'organization'
  | 'tasks'
  | 'payroll'
  | 'payslips'
  | 'recruitment'
  | 'resignations'
  | 'announcements'
  | 'documents'
  | 'chat'
  | 'calendar'
  | 'notifications'
  | 'reports'
  | 'settings'
  | 'profile';

/**
 * Strict role-based module accessibility based on Postman API specifications:
 * - Admin: Full access across all administration, workforce, and company modules.
 * - HR: Attendance, Leaves, Employees (Users), Payroll, Recruitment, Resignations, Notices, Documents, Chat, Calendar, Reports.
 *       Tasks are included. Organization stays with Admin and Manager.
 * - Manager: Dashboard, Attendance, Leaves, Organization (Departments/Teams), Tasks, Payslips, Resignations, Notices, Documents, Chat, Calendar.
 *       (Excludes: Employees directory, Recruitment, Admin Payroll Management, Reports, Settings).
 * - Employee: Dashboard, Attendance, Leaves, Tasks, Payslips, Resignations, Notices, Documents, Chat, Calendar, Profile.
 *       (Excludes: Employees directory, Organization, Payroll Management, Recruitment, Reports, Settings).
 */
export const ROLE_MODULE_PERMISSIONS: Record<string, HrmsModuleId[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'companies',
    'plans',
    'orders',
    'support',
    'profile',
  ],
  ADMIN: [
    'dashboard',
    'attendance',
    'leaves',
    'employees',
    'organization',
    'tasks',
    'payroll',
    'recruitment',
    'resignations',
    'announcements',
    'documents',
    'chat',
    'calendar',
    'reports',
    'settings',
    'profile',
  ],
  HR: [
    'dashboard',
    'attendance',
    'leaves',
    'employees',
    'tasks',
    'payroll',
    'recruitment',
    'resignations',
    'announcements',
    'documents',
    'chat',
    'calendar',
    'reports',
    'profile',
  ],
  HR_ADMIN: [
    'dashboard',
    'attendance',
    'leaves',
    'employees',
    'tasks',
    'payroll',
    'recruitment',
    'resignations',
    'announcements',
    'documents',
    'chat',
    'calendar',
    'reports',
    'profile',
  ],
  MANAGER: [
    'dashboard',
    'attendance',
    'leaves',
    'employees',
    'organization',
    'tasks',
    'payslips',
    'resignations',
    'announcements',
    'documents',
    'chat',
    'calendar',
    'profile',
  ],
  EMPLOYEE: [
    'dashboard',
    'attendance',
    'leaves',
    'tasks',
    'payslips',
    'resignations',
    'announcements',
    'documents',
    'chat',
    'calendar',
    'profile',
  ],
};

/**
 * Normalizes an arbitrary role string to standard uppercase role key
 */
export function normalizeRoleKey(role?: string): string {
  if (!role) return 'EMPLOYEE';
  const r = role.trim().toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (r === 'ADMIN' || r === 'COMPANY_ADMIN' || r === 'ORG_ADMIN') return 'ADMIN';
  if (r === 'HR' || r === 'HR_ADMIN') return 'HR';
  if (r === 'MANAGER' || r === 'TEAM_LEAD' || r === 'LEAD') return 'MANAGER';
  return 'EMPLOYEE';
}

const SHARED_MODULES = new Set([
  'dashboard',
  'companies',
  'plans',
  'orders',
  'support',
  'profile',
  'announcements',
  'documents',
  'chat',
  'calendar',
  'notifications',
  'resignations',
  'reports',
  'settings',
]);

function industryAllowsModule(moduleId: string, keys: string[]) {
  if (SHARED_MODULES.has(moduleId)) return true;
  const has = (...names: string[]) => names.some((name) => keys.includes(name));
  if (moduleId === 'employees') return has('employee', 'employees', 'staff', 'directory', 'users', 'store-employees');
  if (moduleId === 'attendance') return has('attendance', 'shift', 'shifts', 'roster', 'staff-scheduling');
  if (moduleId === 'leaves') return has('leave', 'leaves');
  if (moduleId === 'payroll' || moduleId === 'payslips') return has('payroll', 'salary', 'salaries', 'payslip', 'payslips');
  if (moduleId === 'recruitment') return has('recruitment', 'hiring', 'jobs', 'candidates');
  if (moduleId === 'organization') return has('departments', 'department', 'teams', 'team', 'organization');
  if (moduleId === 'tasks') return has('tasks', 'task', 'projects', 'project', 'performance');
  return false;
}

/**
 * Checks whether a module is permitted for the given user:
 * 1. Matches against the strict role permissions defined in the API specification.
 * 2. If the user object returned by /users/profile contains explicit allowedModules / modules,
 *    it also validates that the module is included in that dynamic list.
 */
export function isModuleAllowedForUser(moduleId: string, user?: User | null): boolean {
  if (!user) return false;
  if (moduleId === 'notifications') return true;

  const normalizedRole = normalizeRoleKey(user.role);
  const allowedList = ROLE_MODULE_PERMISSIONS[normalizedRole] || ROLE_MODULE_PERMISSIONS.EMPLOYEE;

  // 1. Strict base check by role
  if (!allowedList.includes(moduleId as HrmsModuleId)) {
    return false;
  }

  // Admin & Super Admin always have full access to their role's modules
  if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') {
    return true;
  }

  const industryKeys = Array.isArray((user as User & { industryModules?: string[] }).industryModules)
    ? (user as User & { industryModules?: string[] }).industryModules!.map((key) => String(key).toLowerCase())
    : [];
  if (industryKeys.length > 0 && !industryAllowsModule(moduleId, industryKeys)) {
    return false;
  }

  // 2. Dynamic check if the profile API provides dynamic module entitlements
  const anyUser = user as any;
  const dynamicModules =
    anyUser.allowedModules ||
    anyUser.modules ||
    anyUser.accessibleModules ||
    anyUser.modulePermissions;

  if (Array.isArray(dynamicModules) && dynamicModules.length > 0) {
    const normDynamic = dynamicModules.map((m: any) => String(m?.key || m?.name || m).toLowerCase().trim());
    const matches = normDynamic.some((m: string) => {
      if (m === moduleId.toLowerCase()) return true;
      if (moduleId === 'employees' && (m === 'staff' || m === 'users' || m === 'directory')) return true;
      if (moduleId === 'attendance' && (m === 'roster' || m === 'shifts' || m === 'tracker')) return true;
      if (moduleId === 'leaves' && (m === 'leave' || m === 'leave-types' || m === 'requests')) return true;
      if (moduleId === 'organization' && (m === 'departments' || m === 'teams' || m === 'department' || m === 'team')) return true;
      if (moduleId === 'payroll' && (m === 'salaries' || m === 'salary' || m === 'payslips')) return true;
      if (moduleId === 'payslips' && (m === 'payroll' || m === 'salary' || m === 'payslip')) return true;
      if (moduleId === 'recruitment' && (m === 'openings' || m === 'applications' || m === 'jobs' || m === 'candidates')) return true;
      if (moduleId === 'resignations' && (m === 'resignation' || m === 'clearance')) return true;
      if (moduleId === 'announcements' && (m === 'notices' || m === 'noticeboard' || m === 'board' || m === 'notice')) return true;
      if (moduleId === 'documents' && (m === 'document' || m === 'files')) return true;
      if (moduleId === 'chat' && (m === 'messages' || m === 'messaging')) return true;
      if (moduleId === 'calendar' && (m === 'holidays' || m === 'holiday')) return true;
      if (moduleId === 'reports' && (m === 'analytics' || m === 'reporting')) return true;
      if (moduleId === 'settings' && (m === 'config' || m === 'preferences')) return true;
      if (moduleId === 'profile' && (m === 'user' || m === 'my-profile')) return true;
      if (moduleId === 'tasks' && (m === 'task' || m === 'projects' || m === 'project' || m === 'tasks-projects' || m === 'tasks & projects' || m === 'performance')) return true;
      return false;
    });
    if (!matches) return false;
  }

  return true;
}

/**
 * Returns whether user is permitted to punch in/out (Clock or break: Employee, HR, Manager).
 * Admin and Super Admin cannot punch as per backend API collection.
 */
export function canUserPunch(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'EMPLOYEE' || role === 'HR' || role === 'MANAGER';
}

/**
 * Returns whether user can create staff/users in Directory (Admin and HR only).
 */
export function canCreateUser(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR' || role === 'MANAGER';
}

/**
 * Returns whether user can delete staff/users in Directory (Admin and HR only as per requirements).
 */
export function canDeleteUser(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user can approve or reject leaves (Admin, Super Admin, HR only).
 */
export function canApproveRejectLeave(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user has administrative rights to manage resignation notice periods and clearance
 */
export function canManageResignations(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user can manage (create, edit, delete) leave types (Admin, Super Admin, HR)
 */
export function canManageLeaveTypes(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user can publish or delete notices/announcements (Admin, Super Admin, HR, Manager).
 * Employee can view and dismiss notices, but cannot create or delete board notices.
 */
export function canManageNotices(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR' || role === 'MANAGER';
}

/**
 * Returns whether user can create or delete tasks (Admin, Super Admin, HR, Manager).
 * Employee can view and edit task status, but cannot create or delete tasks.
 */
export function canManageTasks(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';
}

/**
 * Returns whether user can manage organization structure (Departments, Teams) (Admin, Super Admin, Manager).
 */
export function canManageOrganization(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';
}

/**
 * Returns whether user can manage recruitment (Jobs, Candidates, Applications, Offers) (Admin, Super Admin, HR).
 */
export function canManageRecruitment(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user can manage payroll (Generate payroll, set salary, mark paid) (Admin, Super Admin, HR).
 * Employee and Manager can only view their personal payslips.
 */
export function canManagePayroll(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user can configure attendance settings or biometric sync (Admin, Super Admin, HR).
 */
export function canManageAttendanceSettings(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
}

/**
 * Returns whether user can create or delete group chats (Admin, Super Admin, HR, Manager).
 */
export function canManageChatGroups(user?: User | null): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR' || role === 'MANAGER';
}

/**
 * Returns the complete list of allowed modules for a given user
 */
export function getAllowedModulesForUser(user?: User | null): HrmsModuleId[] {
  if (!user) return [];
  const normalizedRole = normalizeRoleKey(user.role);
  const baseList = ROLE_MODULE_PERMISSIONS[normalizedRole] || ROLE_MODULE_PERMISSIONS.EMPLOYEE;
  return baseList.filter((m) => isModuleAllowedForUser(m, user));
}
