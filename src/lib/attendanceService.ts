import { AttendanceRecord, Employee } from '../types/hrms';

const STORAGE_KEY = 'hrms_daily_attendance_records';

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format total seconds into HH:MM:SS
 */
export function formatSecondsToHMS(totalSecs: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSecs || 0));
  const hours = Math.floor(safeSecs / 3600);
  const minutes = Math.floor((safeSecs % 3600) / 60);
  const seconds = safeSecs % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format total seconds into human readable e.g. "2h 45m 12s" or "45m 10s"
 */
export function formatSecondsToWords(totalSecs: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSecs || 0));
  const hours = Math.floor(safeSecs / 3600);
  const minutes = Math.floor((safeSecs % 3600) / 60);
  const seconds = safeSecs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Computes live active worked seconds for a record
 */
export function getLiveActiveSeconds(record: AttendanceRecord): number {
  let active = record.activeSeconds || 0;
  if (!record.isCompleted && !record.isOnBreak && record.lastActiveTimestamp) {
    const elapsed = Math.max(0, Math.floor((Date.now() - record.lastActiveTimestamp) / 1000));
    active += elapsed;
  }
  return active;
}

/**
 * Computes live break seconds for a record
 */
export function getLiveBreakSeconds(record: AttendanceRecord): number {
  let brk = record.breakSeconds || 0;
  if (!record.isCompleted && record.isOnBreak && record.lastBreakTimestamp) {
    const elapsed = Math.max(0, Math.floor((Date.now() - record.lastBreakTimestamp) / 1000));
    brk += elapsed;
  }
  return brk;
}

/**
 * Retrieve all records from localStorage
 */
export function getAllAttendanceRecords(): AttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to read attendance records:', err);
  }
  return [];
}

/**
 * Persist records to localStorage and notify listeners
 */
export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('hrms_attendance_updated'));
  } catch (err) {
    console.error('Failed to save attendance records:', err);
  }
}

/**
 * Find today's attendance record for an employee
 */
export function getTodayRecordForEmployee(employeeId: string): AttendanceRecord | null {
  const today = getTodayDateString();
  const all = getAllAttendanceRecords();
  return (
    all.find(
      (r) =>
        r.date === today &&
        (r.employeeId === employeeId || r.employeeId.toLowerCase() === employeeId.toLowerCase())
    ) || null
  );
}

/**
 * Check if the employee can check in today
 */
export function checkEmployeePunchEligibility(employeeId: string): {
  canCheckIn: boolean;
  status: 'not_started' | 'working' | 'on_break' | 'completed';
  message: string;
  record: AttendanceRecord | null;
} {
  const record = getTodayRecordForEmployee(employeeId);

  if (!record) {
    return {
      canCheckIn: true,
      status: 'not_started',
      message: 'You have not checked in today. Please click Check In to begin your shift.',
      record: null,
    };
  }

  if (record.isCompleted || record.checkOut) {
    return {
      canCheckIn: false,
      status: 'completed',
      message: 'Today’s attendance is completed. You can check in again tomorrow.',
      record,
    };
  }

  if (record.isOnBreak) {
    return {
      canCheckIn: false,
      status: 'on_break',
      message: 'You are currently on break. Timer is paused.',
      record,
    };
  }

  return {
    canCheckIn: false,
    status: 'working',
    message: 'You are currently clocked in and working. Timer is running.',
    record,
  };
}

/**
 * Action: Check In
 * Allowed ONLY ONCE per calendar day!
 */
export function performCheckIn(employee: {
  id: string;
  firstName: string;
  lastName?: string;
  employeeCode?: string;
  departmentName?: string;
}): { success: boolean; message: string; record?: AttendanceRecord } {
  const eligibility = checkEmployeePunchEligibility(employee.id);

  if (!eligibility.canCheckIn) {
    return {
      success: false,
      message: eligibility.message,
      record: eligibility.record || undefined,
    };
  }

  const today = getTodayDateString();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName || ''}`.trim(),
    employeeCode: employee.employeeCode || 'EMP-1',
    departmentName: employee.departmentName || 'General',
    date: today,
    checkIn: timeStr,
    checkOut: undefined,
    breakDurationMinutes: 0,
    workingHours: 0,
    overtimeHours: 0,
    status: 'Present',
    remarks: 'Self portal check-in',
    createdAt: now.toISOString(),
    activeSeconds: 0,
    breakSeconds: 0,
    isOnBreak: false,
    isCompleted: false,
    lastActiveTimestamp: Date.now(),
    lastBreakTimestamp: undefined,
  };

  const all = getAllAttendanceRecords();
  all.push(newRecord);
  saveAttendanceRecords(all);

  return {
    success: true,
    message: `Checked in successfully at ${timeStr}. Work timer started!`,
    record: newRecord,
  };
}

/**
 * Action: Take Break (Pause Work Timer)
 */
export function performTakeBreak(employeeId: string): {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
} {
  const all = getAllAttendanceRecords();
  const today = getTodayDateString();
  const idx = all.findIndex(
    (r) =>
      r.date === today &&
      (r.employeeId === employeeId || r.employeeId.toLowerCase() === employeeId.toLowerCase())
  );

  if (idx === -1) {
    return { success: false, message: 'No active check-in record found for today.' };
  }

  const record = all[idx];

  if (record.isCompleted) {
    return { success: false, message: 'Shift is already completed for today.' };
  }

  if (record.isOnBreak) {
    return { success: false, message: 'You are already on break.' };
  }

  // Accumulate worked seconds
  const now = Date.now();
  if (record.lastActiveTimestamp) {
    const elapsed = Math.max(0, Math.floor((now - record.lastActiveTimestamp) / 1000));
    record.activeSeconds = (record.activeSeconds || 0) + elapsed;
  }

  record.isOnBreak = true;
  record.lastActiveTimestamp = undefined;
  record.lastBreakTimestamp = now;

  all[idx] = record;
  saveAttendanceRecords(all);

  return {
    success: true,
    message: 'Break started. Work timer is paused.',
    record,
  };
}

/**
 * Action: Resume Work (Restart Work Timer, Accumulate Break Time)
 */
export function performResumeWork(employeeId: string): {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
} {
  const all = getAllAttendanceRecords();
  const today = getTodayDateString();
  const idx = all.findIndex(
    (r) =>
      r.date === today &&
      (r.employeeId === employeeId || r.employeeId.toLowerCase() === employeeId.toLowerCase())
  );

  if (idx === -1) {
    return { success: false, message: 'No active check-in record found for today.' };
  }

  const record = all[idx];

  if (record.isCompleted) {
    return { success: false, message: 'Shift is already completed for today.' };
  }

  if (!record.isOnBreak) {
    return { success: false, message: 'You are not currently on break.' };
  }

  // Accumulate break seconds
  const now = Date.now();
  if (record.lastBreakTimestamp) {
    const elapsed = Math.max(0, Math.floor((now - record.lastBreakTimestamp) / 1000));
    record.breakSeconds = (record.breakSeconds || 0) + elapsed;
    record.breakDurationMinutes = Math.round((record.breakSeconds || 0) / 60);
  }

  record.isOnBreak = false;
  record.lastBreakTimestamp = undefined;
  record.lastActiveTimestamp = now;

  all[idx] = record;
  saveAttendanceRecords(all);

  return {
    success: true,
    message: 'Resumed work. Timer is active.',
    record,
  };
}

/**
 * Action: Check Out
 * Finalizes work & break hours, stops timer completely, blocks check-in until tomorrow
 */
export function performCheckOut(employeeId: string): {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
} {
  const all = getAllAttendanceRecords();
  const today = getTodayDateString();
  const idx = all.findIndex(
    (r) =>
      r.date === today &&
      (r.employeeId === employeeId || r.employeeId.toLowerCase() === employeeId.toLowerCase())
  );

  if (idx === -1) {
    return { success: false, message: 'No active check-in found to check out from.' };
  }

  const record = all[idx];

  if (record.isCompleted) {
    return { success: false, message: 'Shift already checked out for today.' };
  }

  const now = Date.now();

  // Finalize active seconds if still working
  if (!record.isOnBreak && record.lastActiveTimestamp) {
    const elapsed = Math.max(0, Math.floor((now - record.lastActiveTimestamp) / 1000));
    record.activeSeconds = (record.activeSeconds || 0) + elapsed;
  }

  // Finalize break seconds if was on break
  if (record.isOnBreak && record.lastBreakTimestamp) {
    const elapsedBreak = Math.max(0, Math.floor((now - record.lastBreakTimestamp) / 1000));
    record.breakSeconds = (record.breakSeconds || 0) + elapsedBreak;
  }

  const nowDate = new Date(now);
  const checkOutStr = nowDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  record.checkOut = checkOutStr;
  record.isCompleted = true;
  record.isOnBreak = false;
  record.lastActiveTimestamp = undefined;
  record.lastBreakTimestamp = undefined;
  record.breakDurationMinutes = Math.round((record.breakSeconds || 0) / 60);
  record.workingHours = Number(((record.activeSeconds || 0) / 3600).toFixed(2));
  record.status = 'Present';

  all[idx] = record;
  saveAttendanceRecords(all);

  return {
    success: true,
    message: `Checked out successfully at ${checkOutStr}. Total worked: ${formatSecondsToWords(
      record.activeSeconds || 0
    )}. Attendance completed for today!`,
    record,
  };
}
