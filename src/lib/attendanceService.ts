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
let serverOffsetMs = 0;

/** Keep both screens on the server second, even if the two browsers' clocks differ. */
export function syncServerClock(serverTime?: string | null) {
  if (!serverTime) return;
  const parsed = Date.parse(serverTime);
  if (Number.isNaN(parsed)) return;
  serverOffsetMs = Date.now() - parsed;
}

function serverNow(): number {
  return Date.now() - serverOffsetMs;
}

/**
 * Safely parse a time string (e.g. "09:30 AM", "14:15") or createdAt timestamp to epoch ms
 */
export function parseTimeStringToTimestamp(timeStr?: string, dateStr?: string, createdAt?: string): number {
  if (timeStr && typeof timeStr === 'string') {
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
  }

  if (createdAt) {
    const t = new Date(createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  return Date.now();
}

export function setLiveAttendanceRecords(records: AttendanceRecord[]): void {
  const today = getTodayDateString();
  const currentActiveToday = liveAttendanceRecords.find(
    (r) => r && r.date === today && !r.isCompleted && (r.checkIn || !r.checkOut)
  );

  const stamped = Array.isArray(records) ? records.find((record) => record?.serverTime) : null;
  if (stamped?.serverTime) syncServerClock(stamped.serverTime);

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

  // Preserve today's active in-progress punch session so external refreshes don't wipe it out
  if (currentActiveToday) {
    const exists = liveAttendanceRecords.some(
      (r) => r.date === today && isMatchEmployee(r, currentActiveToday.employeeId || (currentActiveToday as any).userId)
    );
    if (!exists) {
      liveAttendanceRecords.unshift(currentActiveToday);
    }
  }

  // NOTE: We do not dispatch 'hrms_attendance_updated' here to prevent
  // cyclic infinite loops when parent containers (like HrmsAppShell) sync from backend.
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
 * Safely parse any break time input (number of seconds, "00h 25m 54s", "00:25:54", "25m 54s", "25m") into total seconds
 */
export function parseBreakTimeToSeconds(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.max(0, Math.floor(val));
  }
  if (typeof val !== 'string') return 0;
  const str = val.trim();
  if (!str || str === '-' || str === '—' || str === '0s' || str === '0m' || str === '00:00:00' || str === '00h 00m 00s') return 0;

  // Check HH:MM:SS or MM:SS
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => parseFloat(p.trim()));
    if (parts.every((p) => !isNaN(p))) {
      if (parts.length === 3) {
        return Math.floor(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      }
      if (parts.length === 2) {
        return Math.floor(parts[0] * 60 + parts[1]);
      }
    }
  }

  // Check 00h 25m 54s / 1h 30m / 25m / 30s
  let totalSecs = 0;
  let matched = false;
  const hMatch = str.match(/(\d+)\s*h(?:ours?|rs?)?/i);
  if (hMatch) {
    totalSecs += parseInt(hMatch[1], 10) * 3600;
    matched = true;
  }
  const mMatch = str.match(/(\d+)\s*m(?:in(?:ute)?s?)?/i);
  if (mMatch) {
    totalSecs += parseInt(mMatch[1], 10) * 60;
    matched = true;
  }
  const sMatch = str.match(/(\d+)\s*s(?:ec(?:ond)?s?)?/i);
  if (sMatch) {
    totalSecs += parseInt(sMatch[1], 10);
    matched = true;
  }
  if (matched) return totalSecs;

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
}

/**
 * Same second math the admin list and the employee clock both use.
 * On break, worked time stays frozen at the break-start second.
 * When the break ends, worked time continues from that second.
 */
export function computeShiftClock(
  source: any,
  nowMs: number = serverNow(),
): { worked: number; breakSeconds: number } | null {
  if (!source) return null;
  const clock = source.clock && typeof source.clock === 'object' ? source.clock : source;
  const sessionStartTime = clock.sessionStartTime as string | undefined;
  const openBreakStartTime = clock.openBreakStartTime as string | undefined;
  const isLive = Boolean(clock.isLive && sessionStartTime);
  if (!isLive) return null;

  let startMs = new Date(sessionStartTime as string).getTime();
  if (!startMs || Number.isNaN(startMs)) {
    startMs = parseTimeStringToTimestamp(sessionStartTime as string);
  }
  if (!startMs || Number.isNaN(startMs)) return null;

  const completedWork = Number(clock.completedWorkSeconds) || 0;
  const completedBreak = Number(clock.completedBreakSeconds) || 0;
  const sessionClosedBreak = Number(clock.sessionClosedBreakSeconds) || 0;
  const onBreak = Boolean(clock.isOnBreak && openBreakStartTime);
  let breakStartMs = openBreakStartTime ? new Date(openBreakStartTime).getTime() : 0;
  if (openBreakStartTime && (!breakStartMs || Number.isNaN(breakStartMs))) {
    breakStartMs = parseTimeStringToTimestamp(openBreakStartTime);
  }

  if (onBreak && breakStartMs && !Number.isNaN(breakStartMs)) {
    const frozenSegment = Math.max(0, Math.floor((breakStartMs - startMs) / 1000) - sessionClosedBreak);
    return {
      worked: completedWork + frozenSegment,
      breakSeconds: completedBreak + Math.max(0, Math.floor((nowMs - breakStartMs) / 1000)),
    };
  }

  return {
    worked: completedWork + Math.max(0, Math.floor((nowMs - startMs) / 1000) - sessionClosedBreak),
    breakSeconds: completedBreak,
  };
}

/**
 * Computes live active worked seconds for a record across all sessions today:
 * 1. If Checked In & working: timer calculates live and ticks every second.
 * 2. If On Break: timer stops / pauses work time calculation.
 * 3. If Checked Out: timer stops completely, showing finalized worked hours.
 */
export function getLiveActiveSeconds(record: AttendanceRecord): number {
  if (!record) return 0;
  const sharedClock = computeShiftClock(record);
  if (sharedClock) return sharedClock.worked;

  const isCheckedOut = Boolean(record.isCompleted || (record.checkOut && record.checkOut.trim() !== ''));
  const isOnBreak = Boolean(record.isOnBreak);

  // 1. If Checked Out: Timer STOPPED, return finalized total worked time
  if (isCheckedOut) {
    if (record.activeSeconds && record.activeSeconds > 0) {
      return record.activeSeconds;
    }
    if (record.checkIn && record.checkOut) {
      const inTs = parseTimeStringToTimestamp(record.checkIn, record.date);
      const outTs = parseTimeStringToTimestamp(record.checkOut, record.date);
      const diffSecs = Math.max(0, Math.floor((outTs - inTs) / 1000));
      const breakSecs = getLiveBreakSeconds(record);
      const actualSecs = Math.max(0, diffSecs - breakSecs);
      return actualSecs;
    }
    if (record.workingHours && record.workingHours > 0) {
      return Math.round(record.workingHours * 3600);
    }
    return record.activeSeconds || 0;
  }

  // 2. If On Break: Timer PAUSED / STOPPED, return frozen accumulated active seconds
  if (isOnBreak) {
    if (record.activeSeconds && record.activeSeconds > 0) {
      return record.activeSeconds;
    }
    if (record.checkIn) {
      const inTs = parseTimeStringToTimestamp(record.checkIn, record.date);
      const breakStart = record.lastBreakTimestamp || Date.now();
      const diffSecs = Math.max(0, Math.floor((breakStart - inTs) / 1000));
      return Math.max(0, diffSecs - (record.breakSeconds || 0));
    }
    return record.activeSeconds || 0;
  }

  // 3. If Checked In & working: Timer CALCULATING LIVE & TICKING
  if (record.checkIn) {
    if (!record.lastActiveTimestamp) {
      record.lastActiveTimestamp = parseTimeStringToTimestamp(record.checkIn, record.date);
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
  const sharedClock = computeShiftClock(record);
  if (sharedClock) return sharedClock.breakSeconds;
  const anyRec = record as any;
  let brk =
    record.breakSeconds ||
    anyRec.totalBreakSeconds ||
    anyRec.totalBreakSecondsToday ||
    (record.breakDurationMinutes ? record.breakDurationMinutes * 60 : 0) ||
    anyRec.totalBreakDuration ||
    anyRec.breakDuration ||
    anyRec.totalBreak ||
    anyRec.todaySummary?.totalBreakSecondsToday ||
    anyRec.todaySummary?.totalBreakSeconds ||
    (anyRec.formattedTotalBreak ? parseBreakTimeToSeconds(anyRec.formattedTotalBreak) : 0) ||
    (anyRec.totalBreakFormatted ? parseBreakTimeToSeconds(anyRec.totalBreakFormatted) : 0) ||
    (anyRec.todaySummary?.totalBreakFormatted ? parseBreakTimeToSeconds(anyRec.todaySummary.totalBreakFormatted) : 0) ||
    (anyRec.breakTime ? parseBreakTimeToSeconds(anyRec.breakTime) : 0) ||
    0;

  if (brk === 0 && Array.isArray(anyRec.breaks) && anyRec.breaks.length > 0) {
    anyRec.breaks.forEach((b: any) => {
      if (typeof b.durationSeconds === 'number') brk += b.durationSeconds;
      else if (typeof b.totalBreakSeconds === 'number') brk += b.totalBreakSeconds;
      else if (typeof b.duration === 'number') brk += b.duration;
      else if (typeof b.totalSeconds === 'number') brk += b.totalSeconds;
      else if (typeof b.breakSeconds === 'number') brk += b.breakSeconds;
      else if (typeof b.durationMinutes === 'number') brk += b.durationMinutes * 60;
      else if (b.formattedDuration) brk += parseBreakTimeToSeconds(b.formattedDuration);
      else if (b.startBreak && b.resumeBreak) {
        brk += Math.max(0, (new Date(b.resumeBreak).getTime() - new Date(b.startBreak).getTime()) / 1000);
      } else if (b.startTime && b.endTime) {
        brk += Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000);
      } else if (b.start && b.end) {
        brk += Math.max(0, (new Date(b.end).getTime() - new Date(b.start).getTime()) / 1000);
      }
    });
  }

  if (!record.isCompleted && !record.checkOut && record.isOnBreak && record.lastBreakTimestamp) {
    const elapsed = Math.max(0, Math.floor((Date.now() - record.lastBreakTimestamp) / 1000));
    brk += elapsed;
  }
  return Math.round(brk);
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
export function saveAttendanceRecords(records: AttendanceRecord[], silent: boolean = false): void {
  liveAttendanceRecords = Array.isArray(records) ? [...records] : [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('hrms_attendance_records');
    } catch {}
    if (!silent) {
      window.dispatchEvent(new Event('hrms_attendance_updated'));
    }
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

  // 2. Check general punch eligibility
  const eligibility = checkEmployeePunchEligibility(employee.id);

  if (!eligibility.canCheckIn && eligibility.status === 'working') {
    return {
      success: true,
      message: 'Already checked in and working.',
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

    record.checkIn = timeStr;
    record.checkOut = undefined; // Actively clocked in
    record.isCompleted = false;
    record.isOnBreak = false;
    record.activeSeconds = 0; // Restart session timer from 00 as requested
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
      message: `Checked in again successfully at ${timeStr}. Work timer started from 00:00:00!`,
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
    const isReCheckIn = (existing.isCompleted || Boolean(existing.checkOut)) && !hasCheckOut;

    let activeSec = 0;
    if (hasCheckOut) {
      if (existing.activeSeconds && existing.activeSeconds > 0) {
        activeSec = existing.activeSeconds;
      } else if (backendRec.checkIn && backendRec.checkOut) {
        const inTs = parseTimeStringToTimestamp(backendRec.checkIn, today);
        const outTs = parseTimeStringToTimestamp(backendRec.checkOut, today);
        const breakSecs = (backendRec.breakDurationMinutes || 0) * 60;
        activeSec = Math.max(0, Math.floor((outTs - inTs) / 1000) - breakSecs);
      } else if (backendRec.workingHours && backendRec.workingHours > 0) {
        activeSec = Math.round(backendRec.workingHours * 3600);
      }
    } else if (isReCheckIn || backendRec.activeSeconds === 0) {
      activeSec = typeof backendRec.activeSeconds === 'number' ? backendRec.activeSeconds : 0;
    } else if (typeof backendRec.activeSeconds === 'number') {
      activeSec = backendRec.activeSeconds;
    } else {
      activeSec = existing.activeSeconds || 0;
    }

    const nowTs = Date.now();
    const lastActive = isCompleted
      ? undefined
      : (backendRec.isOnBreak
          ? undefined
          : (isReCheckIn
              ? nowTs
              : (backendRec.lastActiveTimestamp || existing.lastActiveTimestamp || nowTs)));

    const bSecs =
      backendRec.breakSeconds ||
      backendRec.totalBreakSeconds ||
      (backendRec.breakDurationMinutes ? backendRec.breakDurationMinutes * 60 : 0) ||
      (backendRec.formattedTotalBreak ? parseBreakTimeToSeconds(backendRec.formattedTotalBreak) : 0) ||
      existing.breakSeconds ||
      0;
    const bMins = Math.round(bSecs / 60);
    const formattedTotalBreak = backendRec.formattedTotalBreak || (bSecs > 0 ? formatSecondsToWords(bSecs) : existing.formattedTotalBreak);

    updated = {
      ...existing,
      id: backendRec.id || existing.id,
      employeeId: backendRec.employeeId || existing.employeeId,
      employeeName: backendRec.employeeName || existing.employeeName,
      date: today,
      checkIn: isReCheckIn ? (backendRec.checkIn || existing.checkIn) : (backendRec.checkIn || existing.checkIn),
      checkOut: hasCheckOut ? backendRec.checkOut : undefined,
      status: backendRec.status || existing.status || 'Present',
      remarks: backendRec.remarks || existing.remarks,
      isCompleted,
      isOnBreak: isCompleted ? false : (backendRec.isOnBreak ?? existing.isOnBreak),
      isLive: backendRec.isLive ?? (existing as any).isLive,
      sessionStartTime: backendRec.sessionStartTime ?? (existing as any).sessionStartTime,
      openBreakStartTime: backendRec.openBreakStartTime ?? (existing as any).openBreakStartTime,
      completedBreakSeconds: backendRec.completedBreakSeconds ?? (existing as any).completedBreakSeconds,
      sessionClosedBreakSeconds: backendRec.sessionClosedBreakSeconds ?? (existing as any).sessionClosedBreakSeconds,
      completedWorkSeconds: backendRec.completedWorkSeconds ?? (existing as any).completedWorkSeconds,
      activeSeconds: isReCheckIn ? 0 : activeSec,
      breakDurationMinutes: bMins,
      breakSeconds: bSecs,
      totalBreakSeconds: bSecs,
      formattedTotalBreak,
      workingHours: hasCheckOut ? (backendRec.workingHours || Number((activeSec / 3600).toFixed(2))) : (isReCheckIn ? 0 : (existing.workingHours || 0)),
      overtimeHours: backendRec.overtimeHours ?? existing.overtimeHours ?? 0,
      lastActiveTimestamp: lastActive,
      lastCheckOutTimestamp: isCompleted ? nowTs : undefined,
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
    const bSecs =
      backendRec.breakSeconds ||
      backendRec.totalBreakSeconds ||
      (backendRec.breakDurationMinutes ? backendRec.breakDurationMinutes * 60 : 0) ||
      (backendRec.formattedTotalBreak ? parseBreakTimeToSeconds(backendRec.formattedTotalBreak) : 0) ||
      0;
    const bMins = Math.round(bSecs / 60);
    const formattedTotalBreak = backendRec.formattedTotalBreak || (bSecs > 0 ? formatSecondsToWords(bSecs) : undefined);

    let activeSec = 0;
    if (hasCheckOut && backendRec.checkIn && backendRec.checkOut) {
      const inTs = parseTimeStringToTimestamp(backendRec.checkIn, today);
      const outTs = parseTimeStringToTimestamp(backendRec.checkOut, today);
      activeSec = Math.max(0, Math.floor((outTs - inTs) / 1000) - bSecs);
    } else if (backendRec.workingHours && backendRec.workingHours > 0) {
      activeSec = Math.round(backendRec.workingHours * 3600);
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
      breakSeconds: bSecs,
      totalBreakSeconds: bSecs,
      breakDurationMinutes: bMins,
      formattedTotalBreak,
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

  saveAttendanceRecords(all, true);
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

/**
 * Convert raw work session data from `/api/attendance/work/status` into AttendanceRecord format
 */
export function parseWorkSessionToRecord(session: any, empList: Employee[] = []): AttendanceRecord | null {
  if (!session || typeof session !== 'object') return null;
  const rawId = session._id || session.id || session.workSessionId || `ws-${Date.now()}`;
  const userId = session.userId || session.employeeId || session.user || '';

  const matchedEmp = empList.find((e: any) =>
    (userId && (e.id === userId || e.userId === userId || (e as any)._id === userId)) ||
    (session.employeeCode && e.employeeCode === session.employeeCode) ||
    (session.email && e.email?.toLowerCase() === session.email.toLowerCase())
  );

  const empId = matchedEmp ? matchedEmp.id : (userId || 'emp-unknown');
  const empName = matchedEmp
    ? `${matchedEmp.firstName} ${matchedEmp.lastName}`.trim()
    : (session.employeeName || session.userName || 'Employee');
  const empCode = matchedEmp?.employeeCode || session.employeeCode || '';
  const deptName = matchedEmp?.departmentName || session.departmentName || 'General Staff';

  const startDate = session.startTime || session.startedAt || session.checkIn || session.createdAt || session.date;
  const endDate = session.endTime || session.stoppedAt || session.checkOut || session.updatedAt;

  const recDate = session.date
    ? (typeof session.date === 'string' && session.date.includes('T') ? session.date.split('T')[0] : session.date)
    : (startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  const formatTime = (isoOrTime?: string) => {
    if (!isoOrTime) return '';
    if (typeof isoOrTime === 'string' && isoOrTime.includes(':') && !isoOrTime.includes('T')) return isoOrTime;
    try {
      const d = new Date(isoOrTime);
      if (isNaN(d.getTime())) return String(isoOrTime);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(isoOrTime);
    }
  };

  const checkIn = formatTime(startDate) || '09:00 AM';
  const hasEnded = Boolean(endDate && endDate !== startDate);
  const checkOut = hasEnded ? formatTime(endDate) : undefined;

  const statusStr = String(session.status || '').toUpperCase();
  const isWorking = statusStr === 'ACTIVE' || statusStr === 'WORKING' || Boolean(session.active);
  const isOnBreak = statusStr === 'BREAK' || statusStr === 'ON_BREAK' || Boolean(session.onBreak);
  const isCompleted = statusStr === 'COMPLETED' || statusStr === 'STOPPED' || Boolean(checkOut);

  let breakSeconds = 0;
  if (Array.isArray(session.breaks) && session.breaks.length > 0) {
    session.breaks.forEach((b: any) => {
      if (typeof b.durationSeconds === 'number') breakSeconds += b.durationSeconds;
      else if (typeof b.totalBreakSeconds === 'number') breakSeconds += b.totalBreakSeconds;
      else if (typeof b.duration === 'number') breakSeconds += b.duration;
      else if (typeof b.totalSeconds === 'number') breakSeconds += b.totalSeconds;
      else if (typeof b.breakSeconds === 'number') breakSeconds += b.breakSeconds;
      else if (typeof b.durationMinutes === 'number') breakSeconds += b.durationMinutes * 60;
      else if (b.formattedDuration) breakSeconds += parseBreakTimeToSeconds(b.formattedDuration);
      else if (b.startBreak && b.resumeBreak) {
        breakSeconds += Math.max(0, (new Date(b.resumeBreak).getTime() - new Date(b.startBreak).getTime()) / 1000);
      } else if (b.startTime && b.endTime) {
        breakSeconds += Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000);
      } else if (b.start && b.end) {
        breakSeconds += Math.max(0, (new Date(b.end).getTime() - new Date(b.start).getTime()) / 1000);
      }
    });
  }

  if (breakSeconds === 0) {
    if (typeof session.totalBreakSeconds === 'number') {
      breakSeconds = session.totalBreakSeconds;
    } else if (typeof session.breakSeconds === 'number') {
      breakSeconds = session.breakSeconds;
    } else if (typeof session.totalBreakSecondsToday === 'number') {
      breakSeconds = session.totalBreakSecondsToday;
    } else if (typeof session.totalBreakDuration === 'number') {
      breakSeconds = session.totalBreakDuration;
    } else if (typeof session.breakDurationMinutes === 'number') {
      breakSeconds = session.breakDurationMinutes * 60;
    } else if (typeof session.breakDuration === 'number') {
      breakSeconds = session.breakDuration > 100 ? session.breakDuration : session.breakDuration * 60;
    } else if (session.formattedTotalBreak) {
      breakSeconds = parseBreakTimeToSeconds(session.formattedTotalBreak);
    } else if (session.totalBreakFormatted) {
      breakSeconds = parseBreakTimeToSeconds(session.totalBreakFormatted);
    } else if (session.breakTime) {
      breakSeconds = parseBreakTimeToSeconds(session.breakTime);
    } else if (session.todaySummary?.totalBreakSecondsToday) {
      breakSeconds = session.todaySummary.totalBreakSecondsToday;
    } else if (session.todaySummary?.totalBreakFormatted) {
      breakSeconds = parseBreakTimeToSeconds(session.todaySummary.totalBreakFormatted);
    }
  }

  const formattedTotalBreak =
    session.formattedTotalBreak ||
    session.totalBreakFormatted ||
    session.todaySummary?.totalBreakFormatted ||
    (breakSeconds > 0 ? formatSecondsToWords(breakSeconds) : undefined);

  const activeSeconds =
    session.durationSeconds ||
    session.elapsedSeconds ||
    session.activeSeconds ||
    session.todaySummary?.totalSecondsWorked ||
    (session.workingHours ? session.workingHours * 3600 : 0);
  const workingHours = activeSeconds > 0 ? Number((activeSeconds / 3600).toFixed(2)) : 0;
  const officeLoc = session.officeLocationName || session.officeLocation?.name || session.officeName || '';
  const devInfo = session.deviceInfo || session.device?.deviceType || (typeof session.device === 'string' ? session.device : '');
  const ip = session.ipAddress || '';

  return {
    id: String(rawId),
    employeeId: empId,
    employeeName: empName,
    employeeCode: empCode,
    departmentName: deptName,
    companyId: session.companyId || (matchedEmp as any)?.companyId || '',
    companyCode: session.companyCode || (matchedEmp as any)?.companyCode || '',
    date: recDate,
    checkIn,
    checkOut,
    breakDurationMinutes: Math.round(breakSeconds / 60),
    workingHours,
    overtimeHours: workingHours > 8.5 ? Number((workingHours - 8.5).toFixed(2)) : 0,
    status: isCompleted ? 'Completed' : isOnBreak ? 'On Break' : isWorking ? 'Working' : 'Present',
    createdAt: startDate || new Date().toISOString(),
    activeSeconds,
    breakSeconds,
    totalBreakSeconds: breakSeconds,
    formattedTotalBreak,
    isOnBreak,
    isCompleted,
    deviceInfo: devInfo,
    ipAddress: ip,
    officeLocationName: officeLoc,
    durationFormatted: session.todaySummary?.totalDurationFormatted || session.durationFormatted || session.formattedElapsed,
    punches: [
      {
        id: `p-${rawId}-in`,
        type: 'IN',
        timestamp: startDate || new Date().toISOString(),
        time: checkIn,
        device: devInfo ? { deviceType: devInfo, browser: devInfo } : undefined,
      },
      ...(checkOut
        ? [
            {
              id: `p-${rawId}-out`,
              type: 'OUT' as const,
              timestamp: endDate || new Date().toISOString(),
              time: checkOut,
              device: devInfo ? { deviceType: devInfo, browser: devInfo } : undefined,
            },
          ]
        : []),
    ],
  } as any;
}

/**
 * Extract all valid AttendanceRecords from an arbitrary work status API response
 */
export function extractRecordsFromWorkStatus(response: any, empList: Employee[] = []): AttendanceRecord[] {
  if (!response || typeof response !== 'object') return [];
  const results: AttendanceRecord[] = [];

  const rawList = Array.isArray(response)
    ? response
    : Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.history)
    ? response.history
    : Array.isArray(response.sessions)
    ? response.sessions
    : Array.isArray(response.records)
    ? response.records
    : [];

  rawList.forEach((item: any) => {
    const itemWithSummary = response.todaySummary ? { todaySummary: response.todaySummary, ...item } : item;
    const r = parseWorkSessionToRecord(itemWithSummary, empList);
    if (r) results.push(r);
  });

  // 1. Check lastCompletedSession from backend status response
  if (response.lastCompletedSession && typeof response.lastCompletedSession === 'object') {
    const lastComp = response.lastCompletedSession;
    const lastCompWithMeta = {
      ...lastComp,
      todaySummary: response.todaySummary || lastComp.todaySummary,
      totalBreakSeconds:
        lastComp.totalBreakSeconds ??
        lastComp.breakSeconds ??
        response.totalBreakSeconds ??
        response.todaySummary?.totalBreakSecondsToday ??
        response.todaySummary?.totalBreakSeconds,
      formattedTotalBreak:
        lastComp.formattedTotalBreak ??
        lastComp.totalBreakFormatted ??
        response.formattedTotalBreak ??
        response.todaySummary?.totalBreakFormatted,
      durationFormatted:
        lastComp.durationFormatted ??
        lastComp.formattedDuration ??
        response.todaySummary?.totalDurationFormatted,
    };
    const r = parseWorkSessionToRecord(lastCompWithMeta, empList);
    if (r) {
      if (lastComp.deviceInfo) (r as any).deviceInfo = lastComp.deviceInfo;
      if (lastComp.ipAddress) (r as any).ipAddress = lastComp.ipAddress;
      if (lastComp.officeLocationName) (r as any).officeLocationName = lastComp.officeLocationName;
      if (lastCompWithMeta.durationFormatted) (r as any).durationFormatted = lastCompWithMeta.durationFormatted;
      if (lastCompWithMeta.formattedTotalBreak) (r as any).formattedTotalBreak = lastCompWithMeta.formattedTotalBreak;
      if (lastCompWithMeta.totalBreakSeconds) {
        (r as any).totalBreakSeconds = lastCompWithMeta.totalBreakSeconds;
        if (!r.breakSeconds) {
          r.breakSeconds = lastCompWithMeta.totalBreakSeconds;
          r.breakDurationMinutes = Math.round(lastCompWithMeta.totalBreakSeconds / 60);
        }
      }
      if (!results.some((x) => x.id === r.id)) {
        results.push(r);
      }
    }
  }

  // 2. Check activeSession / workSession
  const active = response.activeSession || response.workSession || response.session || (response.hasActiveSession ? response : null);
  if (active && typeof active === 'object') {
    const activeWithMeta = {
      ...active,
      isOnBreak: Boolean(response.isOnBreak ?? active.isOnBreak),
      status: response.isOnBreak || active.status === 'ON_BREAK' ? 'ON_BREAK' : (active.status || 'ACTIVE'),
      officeLocationName: active.officeLocationName || response.assignedOffice?.name,
      totalBreakSeconds:
        response.totalBreakSeconds ??
        active.totalBreakSeconds ??
        response.todaySummary?.totalBreakSecondsToday ??
        active.breakSeconds,
      formattedTotalBreak:
        response.formattedTotalBreak ??
        active.formattedTotalBreak ??
        response.todaySummary?.totalBreakFormatted,
      formattedElapsed: active.formattedElapsed,
      formattedTotalAttendance: active.formattedTotalAttendance,
      todaySummary: response.todaySummary,
      currentBreak: response.currentBreak,
      assignedOffice: response.assignedOffice,
    };
    const r = parseWorkSessionToRecord(activeWithMeta, empList);
    if (r) {
      (r as any).currentBreak = response.currentBreak;
      (r as any).formattedTotalBreak = activeWithMeta.formattedTotalBreak;
      (r as any).todaySummary = response.todaySummary;
      (r as any).assignedOffice = response.assignedOffice;
      (r as any).officeLocationName = active.officeLocationName || response.assignedOffice?.name;
      (r as any).durationFormatted = active.formattedElapsed || response.todaySummary?.totalDurationFormatted;
      if (activeWithMeta.totalBreakSeconds) {
        (r as any).totalBreakSeconds = activeWithMeta.totalBreakSeconds;
        if (!r.breakSeconds) {
          r.breakSeconds = activeWithMeta.totalBreakSeconds;
          r.breakDurationMinutes = Math.round(activeWithMeta.totalBreakSeconds / 60);
        }
      }
      if (!results.some((x) => x.id === r.id)) {
        results.unshift(r);
      }
    }
  }

  // 3. Check logic, attendance & punches from /attendance/logic response
  if ((response.attendance || response.logic || response.punches) && !results.some((x) => x.date === (response.attendance?.date || getTodayDateString()))) {
    const att = response.attendance;
    const logic = response.logic;
    const punchesList: any[] = Array.isArray(response.punches) ? response.punches : [];
    const inP = punchesList.find((p: any) => p.type === 'IN' || p.type === 'CLOCK_IN' || p.type === 'clock-in');
    const outP = punchesList.slice().reverse().find((p: any) => p.type === 'OUT' || p.type === 'CLOCK_OUT' || p.type === 'clock-out');
    const rawIn = inP?.punchedAt || inP?.time || inP?.timestamp || att?.checkInAt || att?.checkIn;
    const rawOut = outP?.punchedAt || outP?.time || outP?.timestamp || att?.checkOutAt || att?.checkOut;
    const totalMins = Number(logic?.totalMinutes || att?.totalWorkMinutes || 0);
    const breakMins = Number(logic?.breakMinutes || att?.totalBreakMinutes || 0);
    const activeSec = totalMins * 60;
    const brkSec = breakMins * 60;
    const onBrk = Boolean(logic?.onBreak || logic?.next === 'break-end');
    const isAct = Boolean(onBrk || logic?.next === 'check-out' || logic?.next === 'clock-out');
    const isDone = Boolean(!isAct && (outP || logic?.next === 'check-in' || logic?.next === 'clock-in' || att?.checkOutAt));

    const rec: AttendanceRecord = {
      id: String(att?.id || 'logic-today'),
      employeeId: String(att?.employeeId || att?.userId || empList[0]?.id || 'emp-self'),
      employeeName: empList[0] ? `${empList[0].firstName} ${empList[0].lastName}`.trim() : 'Employee',
      employeeCode: empList[0]?.employeeCode,
      departmentName: (empList[0] as any)?.department || (empList[0] as any)?.departmentName || empList[0]?.departmentId,
      date: att?.date || getTodayDateString(),
      checkIn: rawIn ? (new Date(rawIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })) : '—',
      checkOut: isAct ? undefined : (rawOut ? new Date(rawOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : undefined),
      breakDurationMinutes: breakMins,
      workingHours: Number((totalMins / 60).toFixed(2)),
      overtimeHours: 0,
      status: isDone ? 'Completed' : onBrk ? 'On Break' : isAct ? 'Working' : 'Present',
      createdAt: rawIn || new Date().toISOString(),
      activeSeconds: activeSec,
      breakSeconds: brkSec,
      totalBreakSeconds: brkSec,
      formattedTotalBreak: logic?.breakHours && logic.breakHours !== '00:00:00' ? logic.breakHours : formatSecondsToWords(brkSec),
      durationFormatted: logic?.totalHours && logic.totalHours !== '00:00:00' ? logic.totalHours : formatSecondsToHMS(activeSec),
      isOnBreak: onBrk,
      isCompleted: isDone,
      punches: punchesList,
    } as any;
    results.unshift(rec);
  }

  return results;
}


