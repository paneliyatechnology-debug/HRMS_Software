'use client';

export interface EmployeeActivityStatus {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  lastActiveTimestamp: number;
  isIdle: boolean;
  idleSeconds: number;
  status: 'Active' | 'Idle';
  alertTriggered: boolean;
}

const STORAGE_KEY = 'hrms_employee_activity_map';
const DEFAULT_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)

let liveActivityMap: Record<string, EmployeeActivityStatus> = {};

/**
 * Get all employee activity records from live memory
 */
export function getAllEmployeeActivities(): Record<string, EmployeeActivityStatus> {
  return liveActivityMap;
}

/**
 * Save all activities and emit real-time event (strictly in-memory)
 */
export function saveAllEmployeeActivities(map: Record<string, EmployeeActivityStatus>): void {
  liveActivityMap = map;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new Event('hrms_employee_activity_updated'));
  }
}

/**
 * Check if a specific employee is currently idle (> 5 minutes inactive)
 */
export function getEmployeeActivity(employeeId: string): EmployeeActivityStatus | null {
  const map = getAllEmployeeActivities();
  return map[employeeId] || null;
}

/**
 * Record user activity (mouse move, click, keyboard, touch, scroll)
 */
export function recordUserScreenActivity(
  employeeId: string,
  employeeName: string,
  employeeCode: string
): void {
  const map = getAllEmployeeActivities();
  const now = Date.now();
  const current = map[employeeId];

  // If user was idle, reset to active and trigger update
  const wasIdle = current?.isIdle || false;

  map[employeeId] = {
    employeeId,
    employeeName,
    employeeCode,
    lastActiveTimestamp: now,
    isIdle: false,
    idleSeconds: 0,
    status: 'Active',
    alertTriggered: false,
  };

  saveAllEmployeeActivities(map);

  if (wasIdle) {
    window.dispatchEvent(
      new CustomEvent('hrms_employee_resumed_activity', {
        detail: { employeeId, employeeName, employeeCode },
      })
    );
  }
}

/**
 * Evaluate idle statuses across all tracked employees (called every second)
 * Returns array of newly idle employees for which alerts should be fired
 */
export function evaluateInactivity(
  inactivityThresholdMs: number = DEFAULT_INACTIVITY_MS
): EmployeeActivityStatus[] {
  const map = getAllEmployeeActivities();
  const now = Date.now();
  let changed = false;
  const newlyIdle: EmployeeActivityStatus[] = [];

  Object.keys(map).forEach((empId) => {
    const item = map[empId];
    const diffMs = now - item.lastActiveTimestamp;
    const idleSecs = Math.max(0, Math.floor(diffMs / 1000));
    item.idleSeconds = idleSecs;

    if (diffMs >= inactivityThresholdMs) {
      if (!item.isIdle) {
        item.isIdle = true;
        item.status = 'Idle';
        changed = true;
        if (!item.alertTriggered) {
          item.alertTriggered = true;
          newlyIdle.push(item);
        }
      }
    } else {
      if (item.isIdle) {
        item.isIdle = false;
        item.status = 'Active';
        item.alertTriggered = false;
        changed = true;
      }
    }
  });

  if (changed) {
    saveAllEmployeeActivities(map);
  }

  return newlyIdle;
}

/**
 * Helper to simulate an employee being idle (>5 minutes) for instant admin testing
 */
export function simulateEmployeeIdle(
  employeeId: string,
  employeeName: string,
  employeeCode: string,
  minutesAgo: number = 6
): void {
  const map = getAllEmployeeActivities();
  const fakePastTime = Date.now() - minutesAgo * 60 * 1000;

  map[employeeId] = {
    employeeId,
    employeeName,
    employeeCode,
    lastActiveTimestamp: fakePastTime,
    isIdle: true,
    idleSeconds: minutesAgo * 60,
    status: 'Idle',
    alertTriggered: true,
  };

  saveAllEmployeeActivities(map);

  // Trigger alert event for admin
  window.dispatchEvent(
    new CustomEvent('hrms_employee_idle_alert', {
      detail: map[employeeId],
    })
  );
}

/**
 * Helper to reset idle status for an employee
 */
export function resetEmployeeIdle(employeeId: string): void {
  const map = getAllEmployeeActivities();
  if (map[employeeId]) {
    map[employeeId].isIdle = false;
    map[employeeId].lastActiveTimestamp = Date.now();
    map[employeeId].status = 'Active';
    map[employeeId].idleSeconds = 0;
    map[employeeId].alertTriggered = false;
    saveAllEmployeeActivities(map);
  }
}
