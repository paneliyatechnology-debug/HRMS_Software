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
  weekendDays?: number[]; // [0] = Sunday, [6] = Saturday, etc. (0 - 6)
  saturdayRule?: 'all' | 'none' | 'alternate_2_4' | 'alternate_1_3'; // Saturday policy
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
  weekendDays: [0], // Default Sunday only (Admin must select Saturday for it to be weekend)
  saturdayRule: 'none',
};

import { getAllEmployees } from './employeeService';

const SCHEDULE_STORAGE_KEY = 'hrms_work_schedule';

let liveSchedules: Record<string, WorkScheduleConfig> = {};

/**
 * Helper to determine the company ID from explicit argument, employeeId, or active session
 */
export function resolveCurrentCompanyId(explicitCompanyId?: string, employeeId?: string): string {
  if (explicitCompanyId && explicitCompanyId.trim()) {
    return explicitCompanyId.trim();
  }

  // 1. If employeeId is supplied, lookup company from live employee rosters
  if (employeeId) {
    const emps = getAllEmployees();
    const match = emps.find(
      (e: any) =>
        e.id === employeeId ||
        e._id === employeeId ||
        e.employeeCode === employeeId ||
        (e.email && typeof employeeId === 'string' && e.email.toLowerCase() === employeeId.toLowerCase())
    );
    if (match?.companyId) return match.companyId;
  }

  return 'comp-paneliya';
}

/**
 * Retrieve current schedule configuration for a specific company (in-memory)
 */
export function getWorkScheduleConfig(companyId?: string): WorkScheduleConfig {
  const compId = resolveCurrentCompanyId(companyId);
  if (liveSchedules[compId]) {
    return liveSchedules[compId];
  }
  return { ...DEFAULT_SCHEDULE_CONFIG, companyId: compId };
}

/**
 * Save schedule configuration for a specific company (in-memory)
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

  liveSchedules[compId] = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`${SCHEDULE_STORAGE_KEY}_${compId}`);
      localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    } catch {}

<<<<<<< HEAD
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
=======
    window.dispatchEvent(
      new CustomEvent('hrms_schedule_updated', {
        detail: { config: updated, companyId: compId },
      })
    );
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
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

  // Punch anytime: allow check in and check out at any time without locking
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

/**
 * Check if a specific date is a weekend based on company work schedule configuration.
 * @param date Date object or "YYYY-MM-DD" string
 * @param config Optional WorkScheduleConfig override
 */
export function isDateWeekend(
  date: Date | string,
  config?: Partial<WorkScheduleConfig> | null
): boolean {
  let d: Date;
  if (typeof date === 'string') {
    // If YYYY-MM-DD, parse parts safely to avoid UTC offset shifting
    const parts = date.split('-').map(Number);
    if (parts.length === 3) {
      d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  if (!d || isNaN(d.getTime())) return false;

  const resolvedConfig = (config && config.weekendDays !== undefined)
    ? config
    : getWorkScheduleConfig(config?.companyId);

  const weekendDays = resolvedConfig.weekendDays ?? [0];
  const saturdayRule = resolvedConfig.saturdayRule ?? (weekendDays.includes(6) ? 'all' : 'none');
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // If Saturday (6)
  if (dayOfWeek === 6) {
    if (saturdayRule === 'none' && !weekendDays.includes(6)) return false;
    if (saturdayRule === 'all') return true;
    if (saturdayRule === 'alternate_2_4') {
      const dayOfMonth = d.getDate();
      const satIndex = Math.ceil(dayOfMonth / 7);
      return satIndex === 2 || satIndex === 4;
    }
    if (saturdayRule === 'alternate_1_3') {
      const dayOfMonth = d.getDate();
      const satIndex = Math.ceil(dayOfMonth / 7);
      return satIndex === 1 || satIndex === 3;
    }
    return weekendDays.includes(6);
  }

  // Other days (Sunday = 0, Mon = 1, etc.)
  return weekendDays.includes(dayOfWeek);
}

/**
 * Returns human-friendly text describing the company's weekend schedule.
 */
export function getWeekendPolicyDescription(config?: Partial<WorkScheduleConfig> | null): string {
  const resolved = (config && config.weekendDays !== undefined)
    ? config
    : getWorkScheduleConfig(config?.companyId);
  const days = resolved.weekendDays ?? [0];
  const satRule = resolved.saturdayRule ?? (days.includes(6) ? 'all' : 'none');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (days.length === 0 && satRule === 'none') {
    return 'No official weekends (7-day operations)';
  }

  const parts: string[] = [];
  days.filter((d) => d !== 6).forEach((d) => {
    parts.push(dayNames[d]);
  });

  if (satRule === 'all' || (days.includes(6) && satRule !== 'alternate_2_4' && satRule !== 'alternate_1_3')) {
    parts.push('Saturday');
  } else if (satRule === 'alternate_2_4') {
    parts.push('2nd & 4th Saturday');
  } else if (satRule === 'alternate_1_3') {
    parts.push('1st & 3rd Saturday');
  }

  return parts.length > 0 ? parts.join(', ') + ' Off' : 'No weekly off';
}
