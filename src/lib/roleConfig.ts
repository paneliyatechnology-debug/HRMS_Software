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
  iconName: 'Crown' | 'Shield' | 'Award' | 'Briefcase' | 'Users' | 'User' | 'Target' | 'CreditCard';
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'HR_ADMIN',
    label: 'HR Admin (HR)',
    shortLabel: 'HR Admin',
    description: 'Manages employees, designations, leaves, payroll, hiring and workplace policies.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    bgLight: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textColor: 'text-blue-700',
    iconName: 'Shield',
  },
  {
    role: 'HR_EXECUTIVE',
    label: 'HR Executive',
    shortLabel: 'HR Exec',
    description: 'Assists with employee onboarding, daily attendance tracking and document verification.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgLight: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    textColor: 'text-indigo-700',
    iconName: 'Award',
  },
  {
    role: 'MANAGER',
    label: 'Manager',
    shortLabel: 'Manager',
    description: 'Departmental leadership, performance assessments and leave approval authority.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    bgLight: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textColor: 'text-amber-800',
    iconName: 'Briefcase',
  },
  {
    role: 'TEAM_LEADER',
    label: 'Team Leader',
    shortLabel: 'Team Lead',
    description: 'Leads project squads, coordinates daily sprints, guides team members and tracks delivery.',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    bgLight: 'bg-teal-50',
    borderClass: 'border-teal-200',
    textColor: 'text-teal-700',
    iconName: 'Users',
  },
  {
    role: 'EMPLOYEE',
    label: 'Employee',
    shortLabel: 'Employee',
    description: 'Standard staff member with self-service attendance, leave requests and internal directory.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    bgLight: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textColor: 'text-slate-700',
    iconName: 'User',
  },
  {
    role: 'RECRUITER',
    label: 'Recruiter / Talent',
    shortLabel: 'Recruiter',
    description: 'Manages job vacancies, candidate applications, interview schedules and candidate pipelines.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgLight: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textColor: 'text-emerald-700',
    iconName: 'Target',
  },
  {
    role: 'FINANCE_ADMIN',
    label: 'Finance Admin',
    shortLabel: 'Finance',
    description: 'Manages compensation structures, salary slips, payroll deductions and tax compliance.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    bgLight: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textColor: 'text-rose-700',
    iconName: 'CreditCard',
  },
];

export function getRoleDefinition(role?: Role | string): RoleDefinition {
  if (!role) return ROLE_DEFINITIONS[5]; // Default: EMPLOYEE
  const normalized = role.trim().toUpperCase();
  const found = ROLE_DEFINITIONS.find((r) => r.role === normalized);
  return (
    found || {
      role: 'EMPLOYEE',
      label: role,
      shortLabel: role,
      description: 'System user',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      bgLight: 'bg-slate-50',
      borderClass: 'border-slate-200',
      textColor: 'text-slate-700',
      iconName: 'User',
    }
  );
}
