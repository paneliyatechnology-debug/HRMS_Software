/**
 * Application Routing Architecture & Path Definitions
 * 
 * Provides centralized routing resolution, path generation, and reverse route parsing
 * for clean, path-based URL navigation across the HRMS platform.
 */

export interface RouteResolution {
  module: string;
  subTab?: string;
  isValid: boolean;
}

export const VALID_MODULE_MAP: Record<string, { module: string; subTab?: string }> = {
  'dashboard': { module: 'dashboard' },
  'companies': { module: 'companies' },
  'plans': { module: 'plans' },
  'orders': { module: 'orders' },
  'support': { module: 'support' },
  'attendance': { module: 'attendance' },
  'employees': { module: 'employees' },
  'leaves': { module: 'leaves' },
  'leave': { module: 'leaves' },
  'payroll': { module: 'payroll' },
  'payslips': { module: 'payslips' },
<<<<<<< HEAD
  'tasks': { module: 'tasks' },
  'teams': { module: 'organization', subTab: 'teams' },
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  'organization': { module: 'organization', subTab: 'about' },
  'departments': { module: 'organization', subTab: 'departments' },
  'designations': { module: 'organization', subTab: 'designations' },
  'recruitment': { module: 'recruitment' },
  'performance': { module: 'performance' },
  'training': { module: 'training' },
  'documents': { module: 'documents' },
  'assets': { module: 'assets' },
  'resignations': { module: 'resignations' },
  'announcements': { module: 'announcements' },
  'chat': { module: 'chat' },
  'reports': { module: 'reports' },
  'audit-logs': { module: 'audit-logs' },
  'settings': { module: 'settings' },
  'profile': { module: 'profile' },
  'calendar': { module: 'calendar' },
  'notifications': { module: 'notifications' },
};

/**
 * Returns the canonical path-based URL for a given module and optional sub-tab.
 */
export function getRouteForModule(moduleId: string, subTab?: string): string {
  if (moduleId === 'dashboard') return '/dashboard';
  if (moduleId === 'organization') {
    if (subTab === 'departments') return '/departments';
    if (subTab === 'teams') return '/teams';
    if (subTab === 'designations') return '/designations';
    return '/organization';
  }
  if (moduleId === 'leave') return '/leaves';
  return `/${moduleId}`;
}

/**
 * Parses a browser pathname into the corresponding module and subTab.
 * Returns isValid: false for unknown / 404 paths.
 */
export function parseRoutePath(pathname: string): RouteResolution {
  if (!pathname) return { module: 'dashboard', isValid: true };
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

  // Root or /dashboard
  if (!clean || clean === 'dashboard') {
    return { module: 'dashboard', isValid: true };
  }

  const parts = clean.split('/');
  const first = parts[0];
  const second = parts[1];

  // Nested organization routes: /organization/departments, /organization/designations, etc.
  if (first === 'organization') {
    if (second === 'departments') return { module: 'organization', subTab: 'departments', isValid: true };
    if (second === 'teams') return { module: 'organization', subTab: 'teams', isValid: true };
    if (second === 'designations') return { module: 'organization', subTab: 'designations', isValid: true };
    if (second === 'about') return { module: 'organization', subTab: 'about', isValid: true };
    return { module: 'organization', subTab: 'about', isValid: true };
  }

  if (VALID_MODULE_MAP[first]) {
    return { ...VALID_MODULE_MAP[first], isValid: true };
  }

  return { module: 'dashboard', isValid: false };
}

