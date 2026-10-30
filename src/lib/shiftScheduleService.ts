/**
 * Enterprise Multi-Tenant Work Schedule & Shift Timing Buffer Enforcement Service
 * Configured by Company Admin in Settings > Working Hours & Shifts
 * Ensures buffer rules are strictly scoped to the specific company that configured them.
 */

export interface WorkScheduleConfig {
  companyId?: string;
  workingHoursPerDay: number;
  defaultShift: string; // e.g. "09:00 AM - 06:00 PM"
  shiftStartTime: string; // e.g. "09:00 AM"
  shiftEndTime: string; // e.g. "06:00 PM"
  gracePeriodMinutes: number; // e.g. 15 (Buffer after shift start)
  earlyBufferMinutes: number; // e.g. 30 (Buffer before shift start)
  enforceShiftWindow: boolean; // default true for company that enables it, false for others
  halfDayHours?: number;
}

const DEFAULT_SCHEDULE_CONFIG: WorkScheduleConfig = {
  companyId: 'comp-paneliya',
  workingHoursPerDay: 8,
  defaultShift: '09:00 AM - 06:00 PM',
  shiftStartTime: '09:00 AM',
  shiftEndTime: '06:00 PM',
  gracePeriodMinutes: 15,
  earlyBufferMinutes: 30,
  enforceShiftWindow: true,
  halfDayHours: 4,
};

const SCHEDULE_STORAGE_KEY = 'hrms_work_schedule';

/**
 * Helper to determine the company ID from explicit argument, employeeId, or active session
 */
export function resolveCurrentCompanyId(explicitCompanyId?: string, employeeId?: string): string {
  if (explicitCompanyId && explicitCompanyId.trim()) {
    return explicitCompanyId.trim();
  }

  // 1. If employeeId is supplied, lookup company from employee rosters
  if (employeeId && typeof window !== 'undefined') {
    try {
      // Check primary live employees
      const empsStr = localStorage.getItem('hrms_employees');
      if (empsStr) {
        const emps = JSON.parse(empsStr);
        const match = emps.find(
          (e: any) =>
            e.id === employeeId ||
            e._id === employeeId ||
            e.employeeCode === employeeId ||
            e.email?.toLowerCase() === employeeId.toLowerCase()
        );
        if (match?.companyId) return match.companyId;
      }

      // Check tenant-specific company rosters
      const tenantEmpsStr = localStorage.getItem('hrms_tenant_company_employees');
      if (tenantEmpsStr) {
        const tenantMap = JSON.parse(tenantEmpsStr);
        for (const [compId, empList] of Object.entries(tenantMap)) {
          if (Array.isArray(empList)) {
            const found = empList.some(
              (e: any) =>
                e.id === employeeId ||
                e._id === employeeId ||
                e.employeeCode === employeeId ||
                e.email?.toLowerCase() === employeeId.toLowerCase()
            );
            if (found) return compId;
          }
        }
      }
    } catch (e) {
      console.warn('Error resolving employee company:', e);
    }
  }

  // 2. Check currently authenticated user session
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('hrms_auth_user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.companyId) return parsed.companyId;
      }
    } catch {}
  }

  return 'comp-paneliya';
}

/**
 * Retrieve current schedule configuration for a specific company from storage
 */
export function getWorkScheduleConfig(companyId?: string): WorkScheduleConfig {
  const compId = resolveCurrentCompanyId(companyId);
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SCHEDULE_CONFIG, companyId: compId };
  }

  try {
    // 1. Check company-specific key
    const companyKey = `${SCHEDULE_STORAGE_KEY}_${compId}`;
    const saved = localStorage.getItem(companyKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SCHEDULE_CONFIG,
        ...parsed,
        companyId: compId,
        shiftStartTime: parsed.shiftStartTime || extractStartTime(parsed.defaultShift) || DEFAULT_SCHEDULE_CONFIG.shiftStartTime,
        shiftEndTime: parsed.shiftEndTime || extractEndTime(parsed.defaultShift) || DEFAULT_SCHEDULE_CONFIG.shiftEndTime,
        earlyBufferMinutes: parsed.earlyBufferMinutes !== undefined ? Number(parsed.earlyBufferMinutes) : 30,
        gracePeriodMinutes: parsed.gracePeriodMinutes !== undefined ? Number(parsed.gracePeriodMinutes) : 15,
        enforceShiftWindow: parsed.enforceShiftWindow !== undefined ? Boolean(parsed.enforceShiftWindow) : true,
      };
    }

    // 2. Legacy fallback for Paneliya HQ flagship company
    if (compId === 'comp-paneliya') {
      const legacySaved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (legacySaved) {
        const parsed = JSON.parse(legacySaved);
        return {
          ...DEFAULT_SCHEDULE_CONFIG,
          ...parsed,
          companyId: compId,
          shiftStartTime: parsed.shiftStartTime || extractStartTime(parsed.defaultShift) || DEFAULT_SCHEDULE_CONFIG.shiftStartTime,
          shiftEndTime: parsed.shiftEndTime || extractEndTime(parsed.defaultShift) || DEFAULT_SCHEDULE_CONFIG.shiftEndTime,
          earlyBufferMinutes: parsed.earlyBufferMinutes !== undefined ? Number(parsed.earlyBufferMinutes) : 30,
          gracePeriodMinutes: parsed.gracePeriodMinutes !== undefined ? Number(parsed.gracePeriodMinutes) : 15,
          enforceShiftWindow: parsed.enforceShiftWindow !== undefined ? Boolean(parsed.enforceShiftWindow) : true,
        };
      }
      return { ...DEFAULT_SCHEDULE_CONFIG, companyId: compId, enforceShiftWindow: true };
    }

    // 3. For any other tenant company that has NOT configured a buffer yet:
    // Buffer enforcement is strictly FALSE so their employees are not blocked.
    return {
      ...DEFAULT_SCHEDULE_CONFIG,
      companyId: compId,
      enforceShiftWindow: false,
    };
  } catch (err) {
    console.error('Failed to read schedule config from storage:', err);
  }

  return { ...DEFAULT_SCHEDULE_CONFIG, companyId: compId, enforceShiftWindow: false };
}

/**
 * Persist schedule configuration for a specific company and notify listeners
 */
export function saveWorkScheduleConfig(
  config: Partial<WorkScheduleConfig>,
  targetCompanyId?: string
): WorkScheduleConfig {
  const compId = resolveCurrentCompanyId(targetCompanyId || config.companyId);
  const current = getWorkScheduleConfig(compId);

  const updated: WorkScheduleConfig = {
    ...current,
    ...config,
    companyId: compId,
    defaultShift: `${config.shiftStartTime || current.shiftStartTime} - ${config.shiftEndTime || current.shiftEndTime}`,
  };

  if (typeof window !== 'undefined') {
    try {
      // Save company-scoped config
      localStorage.setItem(`${SCHEDULE_STORAGE_KEY}_${compId}`, JSON.stringify(updated));

      // Keep legacy key in sync if Paneliya flagship company
      if (compId === 'comp-paneliya') {
        localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));
      }

      window.dispatchEvent(
        new CustomEvent('hrms_schedule_updated', {
          detail: { config: updated, companyId: compId },
        })
      );
      import('./api').then(({ axiosClient }) => {
        void axiosClient.put('/settings', { workSchedule: updated });
      });
    } catch (err) {
      console.error('Failed to save schedule config to storage:', err);
    }
  }

  return updated;
}

/**
 * Extract start time string from "09:00 AM - 06:00 PM"
 */
function extractStartTime(shiftStr?: string): string {
  if (!shiftStr) return '09:00 AM';
  const parts = shiftStr.split('-');
  return (parts[0] || '09:00 AM').trim();
}

/**
 * Extract end time string from "09:00 AM - 06:00 PM"
 */
function extractEndTime(shiftStr?: string): string {
  if (!shiftStr) return '06:00 PM';
  const parts = shiftStr.split('-');
  return (parts[1] || '06:00 PM').trim();
}

/**
 * Parse time string ("09:00 AM", "14:30", "9:00", etc.) to minutes from midnight (0 - 1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 9 * 60; // 09:00 default
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');

  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9 * 60;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Format total minutes from midnight to 12-hour AM/PM string (e.g. 510 -> "08:30 AM")
 */
export function formatMinutesToTimeString(totalMins: number): string {
  let normalized = totalMins % (24 * 60);
  if (normalized < 0) normalized += 24 * 60;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
}

export interface ShiftVerificationResult {
  isAllowed: boolean;
  enforceActive: boolean;
  isLate: boolean;
  isEarly: boolean;
  companyId: string;
  shiftStart: string;
  shiftEnd: string;
  allowedStart: string;
  allowedEnd: string;
  currentTimeStr: string;
  minutesDifference: number; // minutes early or late
  reason?: string;
  config: WorkScheduleConfig;
}

/**
 * Verifies whether attendance punch is allowed at the current (or given) time
 * based on the SPECIFIC COMPANY's admin-defined shift time and buffer time.
 * If the employee's company has NOT enabled shift buffer enforcement, attendance is freely permitted.
 */
export function verifyShiftTimeWindow(
  customTime?: Date,
  companyId?: string,
  employeeId?: string
): ShiftVerificationResult {
  const resolvedCompanyId = resolveCurrentCompanyId(companyId, employeeId);
  const config = getWorkScheduleConfig(resolvedCompanyId);
  const now = customTime || new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const shiftStartMins = parseTimeToMinutes(config.shiftStartTime);
  const earlyBuffer = Math.max(0, Number(config.earlyBufferMinutes) || 0);
  const lateBuffer = Math.max(0, Number(config.gracePeriodMinutes) || 0);

  // Allowed Window:
  // From [Shift Start - earlyBuffer] to [Shift Start + lateBuffer]
  const allowedStartMins = shiftStartMins - earlyBuffer;
  const allowedEndMins = shiftStartMins + lateBuffer;

  const allowedStartStr = formatMinutesToTimeString(allowedStartMins);
  const allowedEndStr = formatMinutesToTimeString(allowedEndMins);

  // If this specific company has NOT enabled strict shift buffer enforcement, allow punch anytime!
  if (!config.enforceShiftWindow) {
    return {
      isAllowed: true,
      enforceActive: false,
      isLate: false,
      isEarly: false,
      companyId: resolvedCompanyId,
      shiftStart: config.shiftStartTime,
      shiftEnd: config.shiftEndTime,
      allowedStart: allowedStartStr,
      allowedEnd: allowedEndStr,
      currentTimeStr,
      minutesDifference: 0,
      config,
    };
  }

  // Check if current time falls within [allowedStartMins, allowedEndMins]
  if (currentMinutes < allowedStartMins) {
    const minsUntilStart = allowedStartMins - currentMinutes;
    return {
      isAllowed: false,
      enforceActive: true,
      isLate: false,
      isEarly: true,
      companyId: resolvedCompanyId,
      shiftStart: config.shiftStartTime,
      shiftEnd: config.shiftEndTime,
      allowedStart: allowedStartStr,
      allowedEnd: allowedEndStr,
      currentTimeStr,
      minutesDifference: -minsUntilStart,
      reason: `Attendance Locked: Too early for shift check-in. Your company's shift begins at ${config.shiftStartTime} with an early buffer of ${earlyBuffer} mins (Allowed window starts at ${allowedStartStr}).`,
      config,
    };
  }

  if (currentMinutes > allowedEndMins) {
    const minsLate = currentMinutes - allowedEndMins;
    return {
      isAllowed: true,
      enforceActive: true,
      isLate: true,
      isEarly: false,
      companyId: resolvedCompanyId,
      shiftStart: config.shiftStartTime,
      shiftEnd: config.shiftEndTime,
      allowedStart: allowedStartStr,
      allowedEnd: allowedEndStr,
      currentTimeStr,
      minutesDifference: minsLate,
      reason: `Late Attendance: Office check-in window closed at ${allowedEndStr}. A compulsory reason is required to check in.`,
      config,
    };
  }

  return {
    isAllowed: true,
    enforceActive: true,
    isLate: false,
    isEarly: false,
    companyId: resolvedCompanyId,
    shiftStart: config.shiftStartTime,
    shiftEnd: config.shiftEndTime,
    allowedStart: allowedStartStr,
    allowedEnd: allowedEndStr,
    currentTimeStr,
    minutesDifference: 0,
    config,
  };
}
