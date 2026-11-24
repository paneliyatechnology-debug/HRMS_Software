import { Role } from '../types/hrms';

export interface RoleDefinition {
  role: Role;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  bgLight: string;
  borderClass: string;
  textColor: string;
  iconName: 'Crown' | 'Shield' | 'Users' | 'User' | 'Briefcase';
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    shortLabel: 'Super Admin',
    description: 'Platform owner with access across the whole system.',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    bgLight: 'bg-violet-50',
    borderClass: 'border-violet-200',
    textColor: 'text-violet-700',
    iconName: 'Crown',
  },
  {
    role: 'ADMIN',
    label: 'Company Admin',
    shortLabel: 'Admin',
    description: 'Full access to employees, departments, attendance, leave, payroll, recruitment, and reports.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    bgLight: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textColor: 'text-blue-700',
    iconName: 'Shield',
  },
  {
    role: 'HR',
    label: 'HR Manager',
    shortLabel: 'HR',
    description: 'Employees, attendance, leave, recruitment, payroll, and HR reports.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgLight: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textColor: 'text-emerald-700',
    iconName: 'Users',
  },
  {
    role: 'MANAGER',
    label: 'Production Manager',
    shortLabel: 'Production',
    description: 'View employees, attendance, and leave. Manage shift. View department hiring and team reports.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    bgLight: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textColor: 'text-amber-700',
    iconName: 'Briefcase',
  },
  {
    role: 'SUPERVISOR',
    label: 'Supervisor',
    shortLabel: 'Supervisor',
    description: 'View own team, manage their attendance and shift, and approve team leave.',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    bgLight: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textColor: 'text-orange-700',
    iconName: 'Briefcase',
  },
  {
    role: 'EMPLOYEE',
    label: 'Employee',
    shortLabel: 'Employee',
    description: 'Staff member with self-service attendance, leave, and profile access.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    bgLight: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textColor: 'text-slate-700',
    iconName: 'User',
  },
];

/**
 * Roles that can be assigned or selected by administrators when changing user roles.
 * Super Admin cannot be assigned to any user.
 */
export const ASSIGNABLE_ROLE_DEFINITIONS: RoleDefinition[] = ROLE_DEFINITIONS.filter(
  (r) => r.role !== 'SUPER_ADMIN'
);

export function getRoleDefinition(role?: Role | string): RoleDefinition {
  const employee = ROLE_DEFINITIONS.find((r) => r.role === 'EMPLOYEE') || ROLE_DEFINITIONS[ROLE_DEFINITIONS.length - 1];
  if (!role) return employee;
  const normalized = role.trim().toUpperCase();
  return ROLE_DEFINITIONS.find((r) => r.role === normalized) || {
    ...employee,
    label: role,
    shortLabel: role,
  };
}
