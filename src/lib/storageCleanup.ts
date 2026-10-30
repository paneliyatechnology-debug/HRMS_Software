/**
 * Storage Cleanup Utility
 * Ensures NO business data is persisted in browser LocalStorage or Cache Storage.
 * All application data must originate directly from the live database.
 */

export const BUSINESS_STORAGE_KEYS = [
  'hrms_daily_attendance_records',
  'hrms_attendance_records',
  'hrms_employees_records',
  'hrms_employees',
  'hrms_multi_tenant_companies',
  'hrms_all_companies_v2',
  'hrms_tenant_company_employees',
  'hrms_tenant_employees',
  'hrms_leave_requests',
  'hrms_leave_requests_data',
  'hrms_payroll_records',
  'hrms_notices_records',
  'hrms_company_name',
  'hrms_company_logo',
  'hrms_company_id',
  'hrms_company_code',
  'hrms_current_company',
  'hrms_company_gst',
  'hrms_emp_preferences',
  'hrms_emp_notifications',
  'hrms_emp_profile_extra',
  'hrms_work_status',
  'hrms_time_format',
  'hrms_date_format',
  'hrms_language',
  'hrms_biometric_devices_list',
  'hrms_biometric_hardware_logs',
  'hrms_chat_messages_map',
  'hrms_chat_conversations_v2',
  'hrms_geofence_config',
  'hrms_employee_wfh_status',
  'hrms_work_schedule',
  'hrms_initial_module',
];

const PRESERVED_AUTH_KEYS = new Set([
  'hrms_auth_token',
  'bearerToken',
  'hrms_is_authenticated',
  'hrms_auth_user',
  'hrms_current_role',
  'hrms_portal_mode',
]);

/**
 * Completely purge any cached business data from LocalStorage and browser CacheStorage.
 */
export function purgeLocalBusinessData(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Purge Cache Storage API caches
    if ('caches' in window && window.caches) {
      window.caches.keys().then((keys) => {
        keys.forEach((key) => window.caches.delete(key));
      }).catch(() => {});
    }

    // 2. Remove all known business keys from localStorage
    BUSINESS_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });

    // 3. Scan and remove any residual prefixed business data keys
    const total = localStorage.length;
    const toDelete: string[] = [];
    for (let i = 0; i < total; i++) {
      const k = localStorage.key(i);
      if (k && !PRESERVED_AUTH_KEYS.has(k) && k.startsWith('hrms_')) {
        toDelete.push(k);
      }
    }
    toDelete.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch (err) {
    console.warn('Storage purge notice:', err);
  }
}

