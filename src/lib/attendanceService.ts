import { AttendanceRecord, Employee, DevicePunchInfo, AttendancePunchLog } from '../types/hrms';
import { detectUserDevice } from './deviceDetector';
import { verifyShiftTimeWindow } from './shiftScheduleService';

const STORAGE_KEY = 'hrms_daily_attendance_records';

/**
 * Pure In-Memory Attendance Storage
 * All records strictly originate from backend database via API.
 * NO attendance data is cached or stored in browser LocalStorage.
 */
let liveAttendanceRecords: AttendanceRecord[] = [];

/**
 * Safely parse a time string (e.g. "09:30 AM", "14:15") or createdAt timestamp to epoch ms
 */
export function parseTimeStringToTimestamp(timeStr?: string, dateStr?: string, createdAt?: string): number {
  if (createdAt) {
    const t = new Date(createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (!timeStr) return Date.now();

  try {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const secs = match[3] ? parseInt(match[3], 10) : 0;
      const ampm = match[4]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
      base.setHours(hours, mins, secs, 0);
      const ts = base.getTime();
      if (!isNaN(ts)) return ts;
    }
  } catch {}

  return Date.now();
}

export function setLiveAttendanceRecords(records: AttendanceRecord[]): void {
  liveAttendanceRecords = Array.isArray(records)
    ? records.map((r) => {
        const hasCheckOut = Boolean(r.isCompleted || (r.checkOut && r.checkOut.trim() !== ''));
        if (!hasCheckOut && r.checkIn && !r.isOnBreak && !r.lastActiveTimestamp) {
          return {
            ...r,
            isCompleted: false,
            lastActiveTimestamp: parseTimeStringToTimestamp(r.checkIn, r.date, r.createdAt),
          };
        }
        return r;
      })
    : [];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('hrms_attendance_updated'));
  }
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
 * Computes live active worked seconds for a record across all sessions today:
 * 1. If Checked In & working: timer calculates live and ticks every second.
 * 2. If On Break: timer stops / pauses work time calculation.
 * 3. If Checked Out: timer stops completely, showing finalized worked hours.
 */
export function getLiveActiveSeconds(record: AttendanceRecord): number {
  if (!record) return 0;

  const isCheckedOut = Boolean(record.isCompleted || (record.checkOut && record.checkOut.trim() !== ''));
  const isOnBreak = Boolean(record.isOnBreak);

  // 1. If Checked Out: Timer STOPPED, return finalized total worked time
  if (isCheckedOut) {
    if (record.activeSeconds && record.activeSeconds > 0) {
      return record.activeSeconds;
    }
    if (record.workingHours && record.workingHours > 0) {
      return Math.round(record.workingHours * 3600);
    }
    if (record.checkIn && record.checkOut) {
      const inTs = parseTimeStringToTimestamp(record.checkIn, record.date, record.createdAt);
      const outTs = parseTimeStringToTimestamp(record.checkOut, record.date);
      const diffSecs = Math.max(0, Math.floor((outTs - inTs) / 1000));
      const breakSecs = (record.breakDurationMinutes || 0) * 60 + (record.breakSeconds || 0);
      return Math.max(0, diffSecs - breakSecs);
    }
    return record.activeSeconds || 0;
  }

  // 2. If On Break: Timer PAUSED / STOPPED, return frozen accumulated active seconds
  if (isOnBreak) {
    if (record.activeSeconds && record.activeSeconds > 0) {
      return record.activeSeconds;
    }
    if (record.checkIn) {
      const inTs = parseTimeStringToTimestamp(record.checkIn, record.date, record.createdAt);
      const breakStart = record.lastBreakTimestamp || Date.now();
      const diffSecs = Math.max(0, Math.floor((breakStart - inTs) / 1000));
      return Math.max(0, diffSecs - (record.breakSeconds || 0));
    }
    return record.activeSeconds || 0;
  }

  // 3. If Checked In & working: Timer CALCULATING LIVE & TICKING
  if (record.checkIn) {
    if (!record.lastActiveTimestamp) {
      record.lastActiveTimestamp = parseTimeStringToTimestamp(record.checkIn, record.date, record.createdAt);
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - record.lastActiveTimestamp) / 1000));
    return (record.activeSeconds || 0) + elapsed;
  }

  return record.activeSeconds || 0;
}

/**
 * Computes live break seconds for a record (explicit breaks + gap while checked out)
 */
export function getLiveBreakSeconds(record: AttendanceRecord): number {
  if (!record) return 0;
  let brk = record.breakSeconds || (record.breakDurationMinutes || 0) * 60;
  if (!record.isCompleted && !record.checkOut && record.isOnBreak && record.lastBreakTimestamp) {
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
 * Safely check if an attendance record belongs to the target employee
 */
export function isMatchEmployee(rec: any, targetId?: string | null): boolean {
  if (!rec || !targetId) return false;
  const t = String(targetId).trim().toLowerCase();
  const tSuffix = t.replace(/^(emp-|user-)/, '');

  const recEmpId = rec.employeeId ? String(rec.employeeId).trim().toLowerCase() : '';
  const recUserId = rec.userId ? String(rec.userId).trim().toLowerCase() : '';
  const recId = rec.id ? String(rec.id).trim().toLowerCase() : '';

  if (recEmpId) {
    if (recEmpId === t) return true;
    if (recEmpId.replace(/^(emp-|user-)/, '') === tSuffix) return true;
  }
  if (recUserId) {
    if (recUserId === t) return true;
    if (recUserId.replace(/^(emp-|user-)/, '') === tSuffix) return true;
  }
  if (recId) {
    if (recId === t) return true;
    if (recId.replace(/^(emp-|user-)/, '') === tSuffix) return true;
  }
  return false;
}

/**
 * Find today's attendance record for an employee
 */
export function getTodayRecordForEmployee(employeeId: string): AttendanceRecord | null {
  if (!employeeId) return null;
  const today = getTodayDateString();
  const all = getAllAttendanceRecords();
  return (
    all.find((r) => r && r.date === today && isMatchEmployee(r, employeeId)) || null
  );
}

/**
 * Check if the employee can check in today (Supports Multiple Punches in a Day)
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
      message: 'You have not checked in today. Please click Check In to begin your shift.',
      record: null,
      shiftWindowInfo: shiftCheck,
    };
  }

  // If currently paused on break
  if (record.isOnBreak) {
    return {
      canCheckIn: false,
      status: 'on_break',
      message: 'You are currently on break. Timer is paused.',
      record,
    };
  }

  // If currently clocked in and working (not checked out)
  if (!record.isCompleted && !record.checkOut) {
    return {
      canCheckIn: false,
      status: 'working',
      message: 'You are currently clocked in and working. Timer is running.',
      record,
    };
  }

  // Multiple Punches: Employee has previously checked out today!
  // They are allowed to Check In again anytime for their next work session.
  return {
    canCheckIn: true,
    status: 'completed',
    message: 'Previous session checked out. Click Check In to start your next session.',
    record,
  };
}

/**
 * Action: Check In (Supports Multiple Punches per Day)
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
  const all = getAllAttendanceRecords();
  const existingIdx = all.findIndex(
    (r) => r && r.date === today && isMatchEmployee(r, employee.id)
  );

  const punchItem: AttendancePunchLog = {
    id: `p-${Date.now()}`,
    type: 'IN',
    time: timeStr,
    timestamp: now.getTime(),
    photo: geoData?.photo,
    device,
    remarks: employee.remarks || 'Check-in',
    latitude: geoData?.latitude,
    longitude: geoData?.longitude,
  };

  if (existingIdx !== -1) {
    // Re-check-in: Resume / start next work session for today
    const record = all[existingIdx];

    // Automatically count gap between previous check-out and this check-in towards break time
    if (record.lastCheckOutTimestamp) {
      const gapSecs = Math.max(0, Math.floor((now.getTime() - record.lastCheckOutTimestamp) / 1000));
      record.breakSeconds = (record.breakSeconds || 0) + gapSecs;
      record.breakDurationMinutes = Math.round((record.breakSeconds || 0) / 60);
    }

    record.checkIn = record.checkIn || timeStr;
    record.checkOut = undefined; // Actively clocked in
    record.isCompleted = false;
    record.isOnBreak = false;
    record.lastActiveTimestamp = now.getTime();
    record.lastBreakTimestamp = undefined;
    record.lastCheckOutTimestamp = undefined;
    record.status = 'Present';
    if (employee.remarks) record.remarks = employee.remarks;
    if (geoData?.photo) record.checkInPhoto = geoData.photo;
    if (device) record.checkInDevice = device;

    record.punches = Array.isArray(record.punches) ? [...record.punches, punchItem] : [punchItem];

    all[existingIdx] = record;
    saveAttendanceRecords(all);

    return {
      success: true,
      message: `Checked in again successfully at ${timeStr}. Work timer resumed!`,
      record,
    };
  }

  // First check-in of today
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
    remarks: employee.remarks || 'Self portal check-in',
    createdAt: now.toISOString(),
    activeSeconds: 0,
    breakSeconds: 0,
    isOnBreak: false,
    isCompleted: false,
    lastActiveTimestamp: now.getTime(),
    lastBreakTimestamp: undefined,
    checkInLatitude: geoData?.latitude,
    checkInLongitude: geoData?.longitude,
    checkInAccuracy: geoData?.accuracy,
    checkInDistanceMeters: geoData?.distanceMeters,
    isGeofenceVerified: geoData?.isGeofenceVerified ?? (geoData?.latitude !== undefined),
    checkInPhoto: geoData?.photo,
    checkInDevice: device,
    punches: [punchItem],
  };

  all.unshift(newRecord);
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
  if (!employeeId) return { success: false, message: 'Invalid employee.' };
  const all = getAllAttendanceRecords();
  const today = getTodayDateString();
  const idx = all.findIndex(
    (r) => r && r.date === today && isMatchEmployee(r, employeeId)
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
  if (!employeeId) return { success: false, message: 'Invalid employee.' };
  const all = getAllAttendanceRecords();
  const today = getTodayDateString();
  const idx = all.findIndex(
    (r) => r && r.date === today && isMatchEmployee(r, employeeId)
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
 * Action: Check Out (Supports Multiple Punches per Day)
 * Finalizes current work session, accumulates total worked hours, and allows checking in again later
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
    remarks?: string;
  }
): {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
} {
  if (!employeeId) return { success: false, message: 'Invalid employee.' };
  const all = getAllAttendanceRecords();
  const today = getTodayDateString();
  const idx = all.findIndex(
    (r) => r && r.date === today && isMatchEmployee(r, employeeId)
  );

  if (idx === -1) {
    return { success: false, message: 'No active check-in found to check out from.' };
  }

  const record = all[idx];

  if (record.isCompleted || record.checkOut) {
    return { success: false, message: 'Current session is already checked out.' };
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

  const punchItem: AttendancePunchLog = {
    id: `p-${now}`,
    type: 'OUT',
    time: checkOutStr,
    timestamp: now,
    photo: geoData?.photo,
    device,
    remarks: geoData?.remarks || 'Check-out',
    latitude: geoData?.latitude,
    longitude: geoData?.longitude,
  };

  record.checkOut = checkOutStr;
  record.isCompleted = true;
  record.isOnBreak = false;
  record.lastActiveTimestamp = undefined;
  record.lastBreakTimestamp = undefined;
  record.lastCheckOutTimestamp = now;
  record.breakDurationMinutes = Math.round((record.breakSeconds || 0) / 60);
  record.workingHours = Number(((record.activeSeconds || 0) / 3600).toFixed(2));
  record.overtimeHours = record.workingHours > 8.0 ? Number((record.workingHours - 8.0).toFixed(2)) : 0;
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
  record.punches = Array.isArray(record.punches) ? [...record.punches, punchItem] : [punchItem];

  all[idx] = record;
  saveAttendanceRecords(all);

  return {
    success: true,
    message: `Checked out successfully at ${checkOutStr}. Total worked today: ${formatSecondsToWords(
      record.activeSeconds || 0
    )}. You can check in again later.`,
    record,
  };
}

/**
 * Update or insert a record returned from the backend (check-in, check-out, or sync)
 */
export function updateLocalRecordFromBackend(backendRec: any): AttendanceRecord | null {
  if (!backendRec || (!backendRec.employeeId && !backendRec.userId && !backendRec.id)) return null;
  const all = getAllAttendanceRecords();
  const today = backendRec.date || getTodayDateString();
  const targetEmpId = backendRec.employeeId || backendRec.userId;
  const idx = all.findIndex(
    (r) =>
      r &&
      ((backendRec.id && r.id === backendRec.id) ||
        (r.date === today && isMatchEmployee(r, targetEmpId)))
  );

  const hasCheckOut = Boolean(backendRec.checkOut && backendRec.checkOut.trim() !== '');

  let updated: AttendanceRecord;

  if (idx !== -1) {
    const existing = all[idx];
    const isCompleted = hasCheckOut;

    let activeSec = existing.activeSeconds || 0;
    if (hasCheckOut) {
      if (backendRec.workingHours && backendRec.workingHours > 0) {
        activeSec = Math.round(backendRec.workingHours * 3600);
      } else if (existing.activeSeconds && existing.activeSeconds > 0) {
        activeSec = existing.activeSeconds;
      } else if (backendRec.checkIn && backendRec.checkOut) {
        const inTs = parseTimeStringToTimestamp(backendRec.checkIn, today, backendRec.createdAt);
        const outTs = parseTimeStringToTimestamp(backendRec.checkOut, today);
        activeSec = Math.max(0, Math.floor((outTs - inTs) / 1000));
      }
    }

    updated = {
      ...existing,
      id: backendRec.id || existing.id,
      employeeId: backendRec.employeeId,
      employeeName: backendRec.employeeName || existing.employeeName,
      date: today,
      checkIn: backendRec.checkIn || existing.checkIn,
      checkOut: hasCheckOut ? backendRec.checkOut : undefined,
      status: backendRec.status || existing.status || 'Present',
      remarks: backendRec.remarks || existing.remarks,
      isCompleted,
      isOnBreak: isCompleted ? false : existing.isOnBreak,
      activeSeconds: activeSec,
      breakDurationMinutes: backendRec.breakDurationMinutes ?? existing.breakDurationMinutes ?? 0,
      breakSeconds: (backendRec.breakDurationMinutes ?? 0) * 60 || existing.breakSeconds || 0,
      workingHours: hasCheckOut ? (backendRec.workingHours || Number((activeSec / 3600).toFixed(2))) : (existing.workingHours || 0),
      overtimeHours: backendRec.overtimeHours ?? existing.overtimeHours ?? 0,
      lastActiveTimestamp: isCompleted ? undefined : (existing.isOnBreak ? undefined : (existing.lastActiveTimestamp || parseTimeStringToTimestamp(backendRec.checkIn, today, backendRec.createdAt))),
      lastCheckOutTimestamp: isCompleted ? Date.now() : undefined,
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
    } else if (hasCheckOut && backendRec.checkIn && backendRec.checkOut) {
      const inTs = parseTimeStringToTimestamp(backendRec.checkIn, today, backendRec.createdAt);
      const outTs = parseTimeStringToTimestamp(backendRec.checkOut, today);
      activeSec = Math.max(0, Math.floor((outTs - inTs) / 1000));
    }

    updated = {
      id: backendRec.id || `att-${Date.now()}`,
      employeeId: backendRec.employeeId,
      employeeName: backendRec.employeeName || 'Employee',
      date: today,
      checkIn: backendRec.checkIn,
      checkOut: hasCheckOut ? backendRec.checkOut : undefined,
      status: backendRec.status || 'Present',
      remarks: backendRec.remarks || '',
      isCompleted,
      isOnBreak: false,
      activeSeconds: activeSec,
      breakSeconds: (backendRec.breakDurationMinutes || 0) * 60,
      breakDurationMinutes: backendRec.breakDurationMinutes || 0,
      workingHours: hasCheckOut ? (backendRec.workingHours || Number((activeSec / 3600).toFixed(2))) : (backendRec.workingHours || 0),
      overtimeHours: backendRec.overtimeHours || 0,
      lastActiveTimestamp: isCompleted ? undefined : parseTimeStringToTimestamp(backendRec.checkIn, today, backendRec.createdAt),
      lastCheckOutTimestamp: isCompleted ? Date.now() : undefined,
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

