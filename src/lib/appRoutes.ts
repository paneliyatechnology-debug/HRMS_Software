export const APP_MODULES = [
  'dashboard',
  'attendance',
  'leaves',
  'payslips',
  'resignations',
  'chat',
  'calendar',
  'employees',
  'organization',
  'payroll',
  'recruitment',
  'reports',
  'documents',
  'announcements',
  'settings',
  'performance',
  'training',
  'assets',
  'audit-logs',
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export function isAppModule(value: string): value is AppModule {
  return (APP_MODULES as readonly string[]).includes(value);
}

export function moduleFromPath(pathname: string): AppModule {
  const segment = (pathname || '/').split('/').filter(Boolean)[0] || '';
  return isAppModule(segment) ? segment : 'dashboard';
}

export function pathForModule(mod: string): string {
  return `/${isAppModule(mod) ? mod : 'dashboard'}`;
}
