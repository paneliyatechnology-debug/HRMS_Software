import { LeaveRequest, Employee } from '../types/hrms';
import { getAllEmployees } from './employeeService';

const LEAVES_STORAGE_KEY = 'hrms_leave_requests';

// Pure In-Memory Leave Storage - live from database via API
let liveLeavesStore: LeaveRequest[] = [];

export function setLiveLeaves(leaves: LeaveRequest[]): void {
  liveLeavesStore = Array.isArray(leaves) ? [...leaves] : [];
}

export function getAllLeaves(): LeaveRequest[] {
  return liveLeavesStore;
}

export function saveLeaves(leaves: LeaveRequest[]): void {
  liveLeavesStore = Array.isArray(leaves) ? [...leaves] : [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LEAVES_STORAGE_KEY);
      localStorage.removeItem('hrms_leave_requests_data');
    } catch {}
    window.dispatchEvent(new Event('hrms_leaves_updated'));
  }
}

export function applyForLeave(data: {
  employeeId: string;
  employeeName?: string;
  employeeAvatar?: string;
  departmentName?: string;
  leaveType: any;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  reason: string;
}): LeaveRequest {
  const all = getAllLeaves();
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Resolve employee name if missing
  let resolvedName = data.employeeName;
  let resolvedDept = data.departmentName;
  if (!resolvedName) {
    const found = getAllEmployees().find((e: Employee) => e.id === data.employeeId);
    if (found) {
      resolvedName = `${found.firstName} ${found.lastName || ''}`.trim();
      resolvedDept = resolvedDept || found.departmentName;
    } else {
      resolvedName = 'Staff Employee';
    }
  }

  const newLeave: LeaveRequest = {
    id: `lr-${Date.now()}`,
    employeeId: data.employeeId,
    employeeName: resolvedName,
    employeeAvatar: data.employeeAvatar || '',
    departmentName: resolvedDept || 'General',
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    daysCount: data.isHalfDay ? 0.5 : Math.max(1, diffDays),
    isHalfDay: data.isHalfDay,
    reason: data.reason,
    status: 'Pending',
    appliedDate: new Date().toISOString().split('T')[0],
  };

  const updated = [newLeave, ...all];
  saveLeaves(updated);
  return newLeave;
}

export function approveLeaveRequest(id: string, approverName = 'Admin'): { success: boolean; leave?: LeaveRequest } {
  const all = getAllLeaves();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return { success: false };

  all[idx] = {
    ...all[idx],
    status: 'Approved',
    hrApproverName: approverName,
    hrApprovedAt: new Date().toISOString(),
  };

  saveLeaves(all);
  return { success: true, leave: all[idx] };
}

export function rejectLeaveRequest(id: string, reason?: string, approverName = 'Admin'): { success: boolean; leave?: LeaveRequest } {
  const all = getAllLeaves();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return { success: false };

  all[idx] = {
    ...all[idx],
    status: 'Rejected',
    comments: reason || 'Rejected by Administrator',
    hrApproverName: approverName,
    hrApprovedAt: new Date().toISOString(),
  };

  saveLeaves(all);
  return { success: true, leave: all[idx] };
}
