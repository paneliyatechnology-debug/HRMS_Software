import { AttendanceRecord, Employee, DevicePunchInfo } from '../types/hrms';
import { detectUserDevice } from './deviceDetector';
import { verifyShiftTimeWindow } from './shiftScheduleService';

const STORAGE_KEY = 'hrms_daily_attendance_records';

/**
 * Pure In-Memory Attendance Storage
 * All records strictly originate from backend database via API.
 * NO attendance data is cached or stored in browser LocalStorage.
 */
let liveAttendanceRecords: AttendanceRecord[] = [];

export function setLiveAttendanceRecords(records: AttendanceRecord[]): void {
  liveAttendanceRecords = Array.isArray(records) ? [...records] : [];
}

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
 * Retrieve all live attendance records (from database memory)
 */
export function getAllAttendanceRecords(): AttendanceRecord[] {
  return liveAttendanceRecords;
}

/**
 * Update live records and notify components (strictly avoids localStorage persistence)
 */
export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  liveAttendanceRecords = Array.isArray(records) ? [...records] : [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('hrms_attendance_records');
    } catch {}
    window.dispatchEvent(new Event('hrms_attendance_updated'));
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
  shiftWindowInfo?: any;
} {
  const record = getTodayRecordForEmployee(employeeId);

  if (!record) {
    const shiftCheck = verifyShiftTimeWindow(undefined, undefined, employeeId);
    if (shiftCheck.isEarly) {
      return {
        canCheckIn: false,
        status: 'not_started',
        message: shiftCheck.reason || 'Check-in is locked before the shift window starts.',
        record: null,
        shiftWindowInfo: shiftCheck,
      };
    }

    return {
      canCheckIn: true,
      status: 'not_started',
      message: shiftCheck.isLate
        ? 'Late arrival detected. Reason for being late is compulsory to check in.'
        : 'You have not checked in today. Please click Check In to begin your shift.',
      record: null,
      shiftWindowInfo: shiftCheck,
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
 * Allowed ONLY ONCE per calendar day within designated shift window!
 */
export function performCheckIn(
  employee: {
    id: string;
    firstName: string;
    lastName?: string;
    employeeCode?: string;
    departmentName?: string;
    companyId?: string;
    lateReason?: string;
    remarks?: string;
  },
  geoData?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    distanceMeters?: number;
    isGeofenceVerified?: boolean;
    photo?: string;
    device?: DevicePunchInfo;
  }
): { success: boolean; message: string; record?: AttendanceRecord } {
  // 1. Check shift timing window configured by Admin for this specific company
  const shiftCheck = verifyShiftTimeWindow(undefined, employee.companyId, employee.id);
  if (shiftCheck.isEarly) {
    return {
      success: false,
      message: shiftCheck.reason || 'Attendance Denied: Too early for shift check-in.',
    };
  }

  if (shiftCheck.isLate && !employee.lateReason?.trim()) {
    return {
      success: false,
      message: 'Late reason is compulsory. Please enter why you arrived late.',
    };
  }

  // 2. Check general punch eligibility
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

  const device = geoData?.device || detectUserDevice();

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
    status: shiftCheck.isLate ? 'Late' : 'Present',
    remarks: employee.remarks || (shiftCheck.isLate ? `[Late Reason: ${employee.lateReason?.trim()}]` : 'Self portal check-in'),
    lateReason: shiftCheck.isLate ? employee.lateReason?.trim() : undefined,
    createdAt: now.toISOString(),
    activeSeconds: 0,
    breakSeconds: 0,
    isOnBreak: false,
    isCompleted: false,
    lastActiveTimestamp: Date.now(),
    lastBreakTimestamp: undefined,
    checkInLatitude: geoData?.latitude,
    checkInLongitude: geoData?.longitude,
    checkInAccuracy: geoData?.accuracy,
    checkInDistanceMeters: geoData?.distanceMeters,
    isGeofenceVerified: geoData?.isGeofenceVerified ?? (geoData?.latitude !== undefined),
    checkInPhoto: geoData?.photo,
    checkInDevice: device,
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
export function performCheckOut(
  employeeId: string,
  geoData?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    distanceMeters?: number;
    photo?: string;
    device?: DevicePunchInfo;
  }
): {
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

  const device = geoData?.device || detectUserDevice();

  record.checkOut = checkOutStr;
  record.isCompleted = true;
  record.isOnBreak = false;
  record.lastActiveTimestamp = undefined;
  record.lastBreakTimestamp = undefined;
  record.breakDurationMinutes = Math.round((record.breakSeconds || 0) / 60);
  record.workingHours = Number(((record.activeSeconds || 0) / 3600).toFixed(2));
  record.status = 'Present';
  if (geoData?.latitude !== undefined) {
    record.checkOutLatitude = geoData.latitude;
    record.checkOutLongitude = geoData.longitude;
    record.checkOutDistanceMeters = geoData.distanceMeters;
  }
  if (geoData?.photo) {
    record.checkOutPhoto = geoData.photo;
  }
  record.checkOutDevice = device;

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

/**
 * Update or insert a record returned from the backend (check-in, check-out, or sync)
 */
export function updateLocalRecordFromBackend(backendRec: any): AttendanceRecord | null {
  if (!backendRec || !backendRec.employeeId) return null;
  const all = getAllAttendanceRecords();
  const today = backendRec.date || getTodayDateString();
  const idx = all.findIndex(
    (r) =>
      (backendRec.id && r.id === backendRec.id) ||
      (r.date === today &&
        (r.employeeId === backendRec.employeeId ||
          r.employeeId.toLowerCase() === backendRec.employeeId.toLowerCase()))
  );

  const hasCheckOut = Boolean(backendRec.checkOut && backendRec.checkOut.trim() !== '');

  let updated: AttendanceRecord;

  if (idx !== -1) {
    const existing = all[idx];
    const isCompleted = hasCheckOut || existing.isCompleted || false;

    let activeSec = existing.activeSeconds || 0;
    if (backendRec.workingHours && backendRec.workingHours > 0) {
      activeSec = Math.round(backendRec.workingHours * 3600);
    }

    updated = {
      ...existing,
      id: backendRec.id || existing.id,
      employeeId: backendRec.employeeId,
      employeeName: backendRec.employeeName || existing.employeeName,
      date: today,
      checkIn: backendRec.checkIn || existing.checkIn,
      checkOut: backendRec.checkOut || existing.checkOut,
      status: backendRec.status || existing.status || 'Present',
      remarks: backendRec.remarks || existing.remarks,
      isCompleted,
      isOnBreak: isCompleted ? false : existing.isOnBreak,
      activeSeconds: activeSec,
      breakDurationMinutes: backendRec.breakDurationMinutes ?? existing.breakDurationMinutes ?? 0,
      breakSeconds: (backendRec.breakDurationMinutes ?? 0) * 60 || existing.breakSeconds || 0,
      workingHours: backendRec.workingHours ?? existing.workingHours ?? 0,
      overtimeHours: backendRec.overtimeHours ?? existing.overtimeHours ?? 0,
      lastActiveTimestamp: isCompleted ? undefined : (existing.isOnBreak ? undefined : (existing.lastActiveTimestamp || Date.now())),
      checkInLatitude: backendRec.latitude ?? backendRec.checkInLatitude ?? existing.checkInLatitude,
      checkInLongitude: backendRec.longitude ?? backendRec.checkInLongitude ?? existing.checkInLongitude,
      checkInAccuracy: backendRec.accuracy ?? backendRec.checkInAccuracy ?? existing.checkInAccuracy,
      checkInDistanceMeters: backendRec.distanceMeters ?? backendRec.checkInDistanceMeters ?? existing.checkInDistanceMeters,
      checkOutLatitude: backendRec.checkOutLatitude ?? existing.checkOutLatitude,
      checkOutLongitude: backendRec.checkOutLongitude ?? existing.checkOutLongitude,
      isGeofenceVerified: backendRec.isGeofenceVerified ?? existing.isGeofenceVerified ?? true,
      checkInPhoto: backendRec.checkInPhoto ?? backendRec.photo ?? existing.checkInPhoto,
      checkOutPhoto: backendRec.checkOutPhoto ?? existing.checkOutPhoto,
      checkInDevice: backendRec.checkInDevice ?? existing.checkInDevice,
      checkOutDevice: backendRec.checkOutDevice ?? existing.checkOutDevice,
    };
    all[idx] = updated;
  } else {
    const isCompleted = hasCheckOut;
    let activeSec = 0;
    if (backendRec.workingHours && backendRec.workingHours > 0) {
      activeSec = Math.round(backendRec.workingHours * 3600);
    }

    updated = {
      id: backendRec.id || `att-${Date.now()}`,
      employeeId: backendRec.employeeId,
      employeeName: backendRec.employeeName || 'Employee',
      date: today,
      checkIn: backendRec.checkIn,
      checkOut: backendRec.checkOut || undefined,
      status: backendRec.status || 'Present',
      remarks: backendRec.remarks || '',
      isCompleted,
      isOnBreak: false,
      activeSeconds: activeSec,
      breakSeconds: (backendRec.breakDurationMinutes || 0) * 60,
      breakDurationMinutes: backendRec.breakDurationMinutes || 0,
      workingHours: backendRec.workingHours || 0,
      overtimeHours: backendRec.overtimeHours || 0,
      lastActiveTimestamp: isCompleted ? undefined : Date.now(),
      createdAt: backendRec.createdAt || new Date().toISOString(),
      checkInLatitude: backendRec.latitude ?? backendRec.checkInLatitude,
      checkInLongitude: backendRec.longitude ?? backendRec.checkInLongitude,
      checkInAccuracy: backendRec.accuracy ?? backendRec.checkInAccuracy,
      checkInDistanceMeters: backendRec.distanceMeters ?? backendRec.checkInDistanceMeters,
      checkOutLatitude: backendRec.checkOutLatitude,
      checkOutLongitude: backendRec.checkOutLongitude,
      isGeofenceVerified: backendRec.isGeofenceVerified ?? true,
      checkInPhoto: backendRec.checkInPhoto ?? backendRec.photo,
      checkOutPhoto: backendRec.checkOutPhoto,
      checkInDevice: backendRec.checkInDevice,
      checkOutDevice: backendRec.checkOutDevice,
    };
    all.push(updated);
  }

  saveAttendanceRecords(all);
  return updated;
}

/**
 * Bulk sync backend attendance records
 */
export function syncBackendAttendanceRecords(backendRecords: any[]): void {
  if (!Array.isArray(backendRecords) || backendRecords.length === 0) return;
  for (const bRec of backendRecords) {
    updateLocalRecordFromBackend(bRec);
  }
}

