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
  iconName: 'Crown' | 'Shield' | 'Users' | 'User';
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
    label: 'Admin',
    shortLabel: 'Admin',
    description: 'Company administrator for one organization.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    bgLight: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textColor: 'text-blue-700',
    iconName: 'Shield',
  },
  {
    role: 'HR',
    label: 'HR',
    shortLabel: 'HR',
    description: 'Human resources role for people, leave, and workplace operations.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgLight: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textColor: 'text-emerald-700',
    iconName: 'Users',
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

export function getRoleDefinition(role?: Role | string): RoleDefinition {
  const employee = ROLE_DEFINITIONS[3];
  if (!role) return employee;
  const normalized = role.trim().toUpperCase();
  return ROLE_DEFINITIONS.find((r) => r.role === normalized) || {
    ...employee,
    label: role,
    shortLabel: role,
  };
}
