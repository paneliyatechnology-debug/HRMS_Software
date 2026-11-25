'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Calendar,
  Users,
  Shield,
  CheckCircle2,
  Check,
  X,
  UserPlus,
  ArrowRight,
  ChevronRight,
  Briefcase,
  AlertCircle,
  Coffee,
  Play,
  Square,
  Pause,
  Trash2,
  Bell,
  Send,
  MessageSquare,
  Building2,
  Crown,
  MapPin,
  Mail,
  Phone,
  User,
  Sparkles,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  FileText,
  HelpCircle,
  ExternalLink,
  Receipt,
  BarChart3,
  Megaphone,
  Zap,
  Eye,
  EyeOff,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord } from '../types/hrms';
import { api } from '../lib/api';
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  calculateEmployeeLeaveBalances,
  RawLeaveQuotaPayload,
} from '../lib/leaveQuotaUtils';
import { getRoleDefinition } from '../lib/roleConfig';
import { ChangeRoleModal } from './modals/ChangeRoleModal';
import { TrackedHoursChart } from './attendance/TrackedHoursChart';
import { DailyAttendanceGraph } from './attendance/DailyAttendanceGraph';
import {
  checkEmployeePunchEligibility,
  performCheckIn,
  performTakeBreak,
  performResumeWork,
  performCheckOut,
  updateLocalRecordFromBackend,
  formatSecondsToHMS,
  formatSecondsToWords,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  getAllAttendanceRecords,
  saveAttendanceRecords,
  isMatchEmployee,
  getTodayRecordForEmployee,
  getTodayDateString,
} from '../lib/attendanceService';
import { verifyShiftTimeWindow, getWorkScheduleConfig } from '../lib/shiftScheduleService';
import { ModernDigitClock } from './common/ModernDigitClock';
import { DailyShiftConsole } from './common/DailyShiftConsole';
import {
  canUserPunch,
  canDeleteUser,
  canCreateUser,
  canApproveRejectLeave,
  isModuleAllowedForUser,
} from '../lib/rolePermissions';
import { useWorkSession } from '../context/WorkSessionContext';

function formatDisplayName(first?: string, last?: string): string {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!l || f.toLowerCase() === l.toLowerCase() || f.toLowerCase().includes(l.toLowerCase())) return f;
  if (l.toLowerCase().includes(f.toLowerCase())) return l;
  return `${f} ${l}`;
}

interface DashboardViewProps {
  loading?: boolean;
  stats: any;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
  leaveTypes?: any[];
  notices?: any[];
  onNavigateModule: (moduleName: string, subTab?: string) => void;
  onOpenClockModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenAddEmployeeModal: () => void;
  onSelectEmployee: (emp: Employee) => void;
  onRefreshData?: () => void;
  onOpenChatWithEmployee?: (empId: string) => void;
  portalMode?: 'employee' | 'admin';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  loading = false,
  stats,
  employees,
  leaves,
  leaveTypes,
  attendance,
  notices,
  onNavigateModule,
  onOpenClockModal,
  onOpenLeaveModal,
  onOpenAddEmployeeModal,
  onSelectEmployee,
  onRefreshData,
  onOpenChatWithEmployee,
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast, emitLeaveStatusUpdated } = useSocket();
  const officeRole = String(user?.role || '').toUpperCase();
  const officeDashboard = portalMode === 'admin' || officeRole === 'MANAGER' || officeRole === 'SUPERVISOR';

  // Current system clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateString, setCurrentDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDateString(
        now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine current active employee for self-service punch (memoized to prevent re-creation loops)
  const currentEmpId = user.employeeId || user.id || '';
  const currentEmp: Employee = useMemo(() => {
    return (
      employees.find(
        (e) =>
          (currentEmpId && e.id === currentEmpId) ||
          (user.email && e.email && e.email.toLowerCase() === user.email.toLowerCase()) ||
          ((user as any).employeeCode && e.employeeCode && e.employeeCode.toLowerCase() === (user as any).employeeCode.toLowerCase())
      ) || {
        id: currentEmpId || 'emp-self',
        employeeCode: (user as any).employeeCode || 'EMP',
        firstName: user.firstName || 'Employee',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        avatarUrl: user.avatarUrl || '',
        gender: 'Other',
        dateOfBirth: '',
        address: '',
        emergencyContact: { name: '', relationship: '', phone: '' },
        joiningDate: '',
        employmentType: 'Full-time',
        status: 'Active',
        departmentId: '',
        departmentName: (user as any).departmentName || 'General',
        designationId: '',
        designationTitle: (user as any).designationTitle || 'Staff Member',
        workLocationId: '',
        workLocationName: '',
        shift: 'General Shift',
        bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: '' },
        taxInformation: { taxId: '', panOrSsn: '', taxRegime: '' },
        education: [],
        previousExperience: [],
        skills: [],
        salary: { basic: 0, hra: 0, allowances: 0, bonus: 0, pf: 0, tax: 0, professionalTax: 0, gross: 0, net: 0 },
        createdAt: '',
        updatedAt: '',
      }
    );
  }, [employees, currentEmpId, user.email, (user as any).employeeCode, user.firstName, user.lastName]);

  // Unified Punch & Work Session Context
  const {
    status: currentStatus,
    liveWorkedHMS,
    liveBreakHMS,
    liveBreakWords,
    breakSeconds,
    activeSession,
    lastCompletedSession,
    todaySummary,
    checkIn: handleCheckInAction,
    takeBreak: handleTakeBreakAction,
    resumeWork: handleResumeWorkAction,
    checkOut: handleCheckOutAction,
    actionLoading,
  } = useWorkSession();

  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>(() => getAllAttendanceRecords());
  const activeEmpId = currentEmp.id || currentEmpId;

  // Sync attendance records on system events
  useEffect(() => {
    const handleUpdate = () => {
      setAllAttendance(getAllAttendanceRecords());
    };
    handleUpdate();
    window.addEventListener('hrms_attendance_updated', handleUpdate);
    window.addEventListener('hrms_work_status_updated', handleUpdate);
    return () => {
      window.removeEventListener('hrms_attendance_updated', handleUpdate);
      window.removeEventListener('hrms_work_status_updated', handleUpdate);
    };
  }, []);

  // Real announcements, holidays, and admin-configured leave quota/balance states
  const [announcements, setAnnouncements] = useState<any[]>(notices || []);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaveTypesList, setLeaveTypesList] = useState<any[]>(leaveTypes || []);
  const [leaveQuotaData, setLeaveQuotaData] = useState<RawLeaveQuotaPayload | null>(null);
  const [leaveQuotaLoading, setLeaveQuotaLoading] = useState<boolean>(portalMode !== 'admin');

  useEffect(() => {
    if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
      setLeaveTypesList(leaveTypes);
    }
  }, [leaveTypes]);

  useEffect(() => {
    let isMounted = true;
    const fetchExtraData = async () => {
      try {
        const [holRes, ltRes] = await Promise.all([
          api.getHolidays(),
          api.listLeaveTypes(user?.companyId ? { companyId: user.companyId } : undefined).catch(() => []),
        ]);
        if (isMounted) {
          if (Array.isArray(notices)) setAnnouncements(notices);
          setHolidays(Array.isArray(holRes) ? holRes : []);
          if (Array.isArray(ltRes) && ltRes.length > 0) {
            setLeaveTypesList(ltRes);
          }
        }
      } catch (err) {
        console.warn('DashboardView fetch extra data notice:', err);
      }

      if (portalMode !== 'admin') {
        if (isMounted) setLeaveQuotaLoading(true);
        try {
          const payload = await fetchLeaveQuotaData(activeEmpId);
          if (isMounted) setLeaveQuotaData(payload);
        } catch (_) {
        } finally {
          if (isMounted) setLeaveQuotaLoading(false);
        }
      }
    };
    fetchExtraData();

    const handleLeaveQuotaSync = async () => {
      if (portalMode === 'admin') return;
      try {
        const [payload, ltRes] = await Promise.all([
          fetchLeaveQuotaData(activeEmpId),
          api.listLeaveTypes(user?.companyId ? { companyId: user.companyId } : undefined).catch(() => []),
        ]);
        if (isMounted) {
          setLeaveQuotaData(payload);
          if (Array.isArray(ltRes) && ltRes.length > 0) {
            setLeaveTypesList(ltRes);
          }
        }
      } catch (_) { }
    };

    window.addEventListener('hrms_settings_updated', handleLeaveQuotaSync);
    window.addEventListener('hrms_leaves_updated', handleLeaveQuotaSync);
    window.addEventListener('hrms_leave_types_updated', handleLeaveQuotaSync);
    return () => {
      isMounted = false;
      window.removeEventListener('hrms_settings_updated', handleLeaveQuotaSync);
      window.removeEventListener('hrms_leaves_updated', handleLeaveQuotaSync);
      window.removeEventListener('hrms_leave_types_updated', handleLeaveQuotaSync);
    };
  }, [portalMode, activeEmpId, user?.companyId]);

  // Set of all identifier keys for this employee to match attendance records accurately
  const myCandidateIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeEmpId) ids.add(activeEmpId.toLowerCase());
    if (currentEmp?.id) ids.add(currentEmp.id.toLowerCase());
    if (user?.id) ids.add(user.id.toLowerCase());
    if (user?.employeeId) ids.add(user.employeeId.toLowerCase());
    if (currentEmp?.employeeCode) ids.add(currentEmp.employeeCode.toLowerCase());
    if ((user as any)?.employeeCode) ids.add((user as any).employeeCode.toLowerCase());
    [...ids].forEach((id) => {
      const clean = id.replace(/^(emp-|user-)/, '');
      if (clean) ids.add(clean);
    });
    return ids;
  }, [activeEmpId, currentEmp, user]);

  // Real 7-day attendance turnout for admin panel
  const sevenDaysData = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = i === 0;

      const dayLabel = isToday
        ? 'Today'
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      const dayRecords = allAttendance.filter((a) => a.date === dateStr);
      const totalEmps = Math.max(1, employees.length);
      const percentage = employees.length > 0 ? Math.min(100, Math.round((dayRecords.length / totalEmps) * 100)) : 0;

      result.push({
        day: dayLabel,
        date: dateStr,
        val: percentage,
        count: `${dayRecords.length} Present`,
        isToday,
      });
    }
    return result;
  }, [allAttendance, employees.length]);

  // Merge real backend attendance prop with live session attendance records (deduplicated by date + employeeId)
  const mergedAttendance = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    // 1. Authoritative backend records (contains complete punches array, checkInAt, checkOutAt)
    for (const rec of (attendance || [])) {
      if (!rec) continue;
      const empId = rec.employeeId || (rec as any).userId || rec.id || '';
      const key = `${empId.trim().toLowerCase()}__${rec.date}`;
      map.set(key, rec);
    }
    // 2. Overlay live session records, preserving backend punches if local doesn't have them
    for (const rec of (allAttendance || [])) {
      if (!rec) continue;
      const empId = rec.employeeId || (rec as any).userId || rec.id || '';
      const key = `${empId.trim().toLowerCase()}__${rec.date}`;
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          ...rec,
          punches: (Array.isArray(rec.punches) && rec.punches.length > 0)
            ? rec.punches
            : (Array.isArray(existing.punches) && existing.punches.length > 0)
            ? existing.punches
            : [],
        });
      } else {
        map.set(key, rec);
      }
    }
    return Array.from(map.values());
  }, [attendance, allAttendance]);

  // Real employee full attendance history (for 7d/14d daily graph & recent attendance)
  const myAllAttendance = useMemo(() => {
    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
    const empFullName = `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();

    const isMatch = (a: any) => {
      // In employee view, if backend scoped it to employee, accept all
      if (portalMode === 'employee') return true;

      const empId = (a.employeeId || '').toLowerCase();
      const userId = ((a.userId || (a as any).user?.id || '')).toLowerCase();
      const cleanEmpId = empId.replace(/^(emp-|user-)/, '');
      const cleanUserId = userId.replace(/^(emp-|user-)/, '');

      if (empId && myCandidateIds.has(empId)) return true;
      if (cleanEmpId && myCandidateIds.has(cleanEmpId)) return true;
      if (userId && myCandidateIds.has(userId)) return true;
      if (cleanUserId && myCandidateIds.has(cleanUserId)) return true;

      const aEmail = ((a.email || (a as any).user?.email || (a as any).employeeEmail || '')).toLowerCase();
      if (userEmail && aEmail && aEmail === userEmail) return true;

      const aName = (a.employeeName || (a as any).userName || '').trim().toLowerCase();
      if (userFullName && aName && aName === userFullName) return true;
      if (empFullName && aName && aName === empFullName) return true;

      return false;
    };

    const list = mergedAttendance.filter(isMatch);

    // If today has active or completed live session from WorkSessionContext, synthesize today's entry if missing
    const todayStr = getTodayDateString();
    const hasToday = list.some((a) => a.date === todayStr);

    if (!hasToday && (currentStatus === 'working' || currentStatus === 'on_break' || currentStatus === 'completed')) {
      const formatIso = (iso?: string) => {
        if (!iso) return '';
        try {
          const d = new Date(iso);
          return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
          return iso;
        }
      };

      const checkInTime = formatIso(activeSession?.startTime || lastCompletedSession?.startTime);
      const checkOutTime = currentStatus === 'completed' ? formatIso(lastCompletedSession?.endTime) : undefined;
      const todayTotalHours = currentStatus === 'completed' ? (todaySummary?.totalDurationFormatted || '00:00:00') : liveWorkedHMS;

      const liveTodayRec: AttendanceRecord = {
        id: `live-session-${todayStr}`,
        employeeId: user?.id || currentEmp?.id || 'emp-self',
        employeeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Me',
        date: todayStr,
        checkIn: checkInTime || '—',
        checkOut: checkOutTime,
        status: 'Present',
        totalHours: todayTotalHours,
        workingHours: 0,
        overtimeHours: 0,
        breakDurationMinutes: breakSeconds ? Math.floor(breakSeconds / 60) : 0,
        remarks: 'Live Work Session',
        createdAt: new Date().toISOString(),
      };
      list.unshift(liveTodayRec);
    }

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [mergedAttendance, myCandidateIds, portalMode, user, currentEmp, currentStatus, activeSession, lastCompletedSession, todaySummary, liveWorkedHMS, liveBreakHMS]);

  // Real employee recent attendance (last 5 records)
  const myRecentAttendance = useMemo(() => {
    return myAllAttendance.slice(0, 5);
  }, [myAllAttendance]);

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const todayStr = getTodayDateString();
    return holidays
      .filter((h) => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [holidays]);

  // Leave processing state for admin
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
  const [dashboardLeaveRowView, setDashboardLeaveRowView] = useState<Record<string, boolean>>({});
  const toggleDashboardLeaveRowView = (id: string) => {
    setDashboardLeaveRowView((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false,
    }));
  };
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [approveModalData, setApproveModalData] = useState<{
    id: string;
    empName: string;
    leaveType: string;
    empId?: string;
    daysCount?: number;
    startDate?: string;
    endDate?: string;
    reason?: string;
  } | null>(null);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; empName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Operational requirements');

  const handleDashboardOpenApproveModal = (leave: LeaveRequest) => {
    setApproveModalData({
      id: leave.id,
      empName: leave.employeeName,
      leaveType: leave.leaveType,
      empId: leave.employeeId,
      daysCount: leave.daysCount,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
    });
  };

  const executeApproveLeave = async () => {
    if (!approveModalData) return;
    const { id, empName, leaveType, empId } = approveModalData;
    setProcessingLeaveId(id);
    try {
      await api.acceptLeave(id, 'Accepted. Take care.');
      showToast({
        type: 'success',
        title: 'Approved',
        message: `${empName}'s ${leaveType} has been approved.`,
      });
      emitLeaveStatusUpdated({
        id,
        employeeId: empId,
        employeeName: empName,
        leaveType,
        status: 'Approved',
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: { id, employeeId: empId, status: 'Approved' } }));
      }
      setApproveModalData(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not approve leave.',
      });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleDashboardRejectLeave = (id: string, empName: string, empId?: string) => {
    setRejectModalData({ id, empName, empId } as any);
    setRejectReason('Operational requirements');
  };

  const executeRejectLeave = async () => {
    if (!rejectModalData) return;
    const { id, empName } = rejectModalData;
    const empId = (rejectModalData as any).empId;
    setProcessingLeaveId(id);
    try {
      await api.rejectLeave(id, rejectReason || 'Rejected.');
      showToast({
        type: 'warning',
        title: 'Rejected',
        message: `${empName}'s leave request was rejected.`,
      });
      emitLeaveStatusUpdated({
        id,
        employeeId: empId,
        employeeName: empName,
        status: 'Rejected',
        reason: rejectReason,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: { id, employeeId: empId, status: 'Rejected' } }));
      }
      setRejectModalData(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not reject leave.',
      });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // Admin Staff Management state
  const [removingEmpDashboard, setRemovingEmpDashboard] = useState<Employee | null>(null);
  const [removeEmpLoading, setRemoveEmpLoading] = useState(false);

  const [noticeTargetEmpDashboard, setNoticeTargetEmpDashboard] = useState<Employee | null>(null);
  const [dashNoticeTitle, setDashNoticeTitle] = useState('');
  const [dashNoticeContent, setDashNoticeContent] = useState('');
  const [dashNoticePriority, setDashNoticePriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [dashNoticeLoading, setDashNoticeLoading] = useState(false);

  // Admin role management on Dashboard
  // Dashboard In-App Modals Scroll-Lock and Escape Key Handler
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      checkOutModalOpen ||
      approveModalData ||
      rejectModalData ||
      removingEmpDashboard ||
      noticeTargetEmpDashboard
    );

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (checkOutModalOpen) setCheckOutModalOpen(false);
          if (approveModalData) setApproveModalData(null);
          if (rejectModalData) setRejectModalData(null);
          if (removingEmpDashboard) setRemovingEmpDashboard(null);
          if (noticeTargetEmpDashboard) setNoticeTargetEmpDashboard(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [checkOutModalOpen, approveModalData, rejectModalData, removingEmpDashboard, noticeTargetEmpDashboard]);

  const [roleTargetEmpDash, setRoleTargetEmpDash] = useState<Employee | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const empRoleDef = getRoleDefinition(currentEmp?.role || 'EMPLOYEE');

  const handleConfirmRemoveEmpDashboard = async () => {
    if (!removingEmpDashboard) return;
    if (!canDeleteUser(user)) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only Admin and HR have permission to delete users.',
      });
      return;
    }
    setRemoveEmpLoading(true);
    try {
      const empIdToDelete = removingEmpDashboard.id || (removingEmpDashboard as any).userId || (removingEmpDashboard as any)._id || (removingEmpDashboard as any).employeeId || '';
      const payload = {
        firstName: removingEmpDashboard.firstName || '',
        lastName: removingEmpDashboard.lastName || '',
        phone: removingEmpDashboard.phone || '',
        status: removingEmpDashboard.status || 'Active',
      };
      const res = await api.deleteEmployee(empIdToDelete, payload);
      showToast({
        type: 'success',
        title: 'Employee Removed',
        message: res?.message || `${removingEmpDashboard.firstName} ${removingEmpDashboard.lastName} removed from staff.`,
      });
      setRemovingEmpDashboard(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Remove Failed',
        message: err.message || 'Failed to remove employee.',
      });
    } finally {
      setRemoveEmpLoading(false);
    }
  };

  const handleOpenNoticeModalDashboard = (emp: Employee) => {
    setNoticeTargetEmpDashboard(emp);
    setDashNoticeTitle(`Notice for ${emp.firstName} ${emp.lastName}`);
    setDashNoticeContent('');
    setDashNoticePriority('Medium');
  };

  const handleConfirmSendNoticeDashboard = async () => {
    if (!noticeTargetEmpDashboard) return;
    if (!dashNoticeTitle.trim() || !dashNoticeContent.trim()) {
      showToast({
        type: 'warning',
        title: 'Incomplete Notice',
        message: 'Please provide both notice title and message body.',
      });
      return;
    }

    setDashNoticeLoading(true);
    try {
      await api.createAnnouncement({
        title: dashNoticeTitle.trim(),
        content: dashNoticeContent.trim(),
        targetAudience: 'Individual',
        targetEmployeeId: noticeTargetEmpDashboard.id,
        targetEmployeeName: `${noticeTargetEmpDashboard.firstName} ${noticeTargetEmpDashboard.lastName}`,
        departmentName: noticeTargetEmpDashboard.departmentName,
        priority: dashNoticePriority,
        authorName: `${user.firstName || 'HR'} ${user.lastName || 'Admin'} (HR & Admin)`,
        authorRole: 'Administration',
      });

      showToast({
        type: 'success',
        title: 'Notice Sent',
        message: `Notice dispatched to ${noticeTargetEmpDashboard.firstName} ${noticeTargetEmpDashboard.lastName}.`,
      });
      setNoticeTargetEmpDashboard(null);
      setDashNoticeTitle('');
      setDashNoticeContent('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Send Failed',
        message: err.message || 'Could not send notice.',
      });
    } finally {
      setDashNoticeLoading(false);
    }
  };

  const executeCheckOut = async () => {
    setCheckOutModalOpen(false);
    await handleCheckOutAction();
  };

  // Admin stats computation
  const todayDate = getTodayDateString();
  const todayRecords = allAttendance.filter((a) => a.date === todayDate);
  const activeWorkingCount = todayRecords.filter((a) => !a.isCompleted && !a.isOnBreak).length;
  const onBreakCount = todayRecords.filter((a) => !a.isCompleted && a.isOnBreak).length;
  const completedTodayCount = todayRecords.filter((a) => a.isCompleted).length;
  const approvedLeavesCount = leaves.filter((l) => (l.status || '').toLowerCase() === 'approved').length;

  // Employees who have NOT clocked in today
  const notClockedInEmployees = useMemo(() => {
    const activeEmps = employees.filter((e) => (e.status || 'Active').toLowerCase() !== 'inactive');
    return activeEmps.filter((emp) => {
      const hasTodayRec = mergedAttendance.some(
        (r) =>
          r &&
          r.date === todayDate &&
          isMatchEmployee(r, emp.id) &&
          Boolean(r.checkIn && r.checkIn !== '--:--' && r.checkIn !== '—')
      );
      return !hasTodayRec;
    });
  }, [employees, mergedAttendance, todayDate]);

  // Late clock-in records (sorted newest date first, then highest lateMinutes)
  const lateClockInRecords = useMemo(() => {
    const formatLateDuration = (mins: number): string => {
      if (!mins || mins <= 0) return 'Late';
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h}h ${m}m late`;
      if (h > 0) return `${h}h late`;
      return `${m}m late`;
    };

    return mergedAttendance
      .filter((r) => {
        if (!r) return false;
        const mins = Number(r.lateMinutes || 0);
        return mins > 0 || r.status === 'Late';
      })
      .map((r) => {
        const matchedEmp = employees.find((e) => isMatchEmployee(r, e.id));
        const name =
          r.employeeName ||
          (matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}`.trim() : '') ||
          'Staff Member';
        const mins = Number(r.lateMinutes || 0);
        return {
          ...r,
          resolvedName: name,
          resolvedEmployee: matchedEmp,
          lateDurationText: formatLateDuration(mins),
          lateMinsNum: mins,
        };
      })
      .sort((a, b) => {
        const dateCmp = (b.date || '').localeCompare(a.date || '');
        if (dateCmp !== 0) return dateCmp;
        return b.lateMinsNum - a.lateMinsNum;
      });
  }, [mergedAttendance, employees]);

  return (
    <div className="space-y-5 w-full overflow-x-clip">
      {/* Welcome & Section Head (Admin Only) */}
      {officeDashboard && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#0f172a] flex items-baseline gap-1.5 flex-wrap">
              <span>Hello,</span>
              <span className="text-[#1b4332]">{user.firstName || 'Admin'}!</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateModule('announcements')}
              className="btn-primary"
            >
              ＋ View announcements
            </button>
          </div>
        </div>
      )}

      {/* Employee Welcome */}
      {portalMode !== 'admin' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#0f172a] flex items-baseline gap-1.5 flex-wrap">
              <span>Hello,</span>
              <span className="text-[#1b4332]">{user.firstName || 'Employee'}!</span>
            </h1>
          </div>
        </div>
      )}

      {officeDashboard ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-5">
          {/* Personal Shift Clock Console for HR / Manager */}
          {canUserPunch(user) && (
            <DailyShiftConsole variant="banner" clockSize="sm" showHeaderClock={false} />
          )}

          {/* KPI Stats Row */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="stat h-24 bg-white/70 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/80 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-20 bg-slate-200/70 rounded" />
                    <div className="h-6 w-14 bg-slate-200/80 rounded" />
                    <div className="h-2.5 w-24 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {isModuleAllowedForUser('employees', user) && (
                <div
                  onClick={() => onNavigateModule('employees')}
                  className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
                >
                  <div className="stat-icon">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <small>Total Employees</small>
                    <strong>{employees.length}</strong>
                    <small>Active workforce</small>
                  </div>
                </div>
              )}

              {isModuleAllowedForUser('attendance', user) && (
                <div
                  onClick={() => onNavigateModule('attendance')}
                  className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
                >
                  <div className="stat-icon">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <small>Present Today</small>
                    <strong>{todayRecords.length}</strong>
                    <small>{activeWorkingCount} working, {onBreakCount} break</small>
                  </div>
                </div>
              )}

              {isModuleAllowedForUser('leaves', user) && (
                <div
                  onClick={() => onNavigateModule('leaves')}
                  className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
                >
                  <div className="stat-icon">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <small>Pending Leaves</small>
                    <strong>{pendingLeaves.length}</strong>
                    <small>Need review</small>
                  </div>
                </div>
              )}

              {isModuleAllowedForUser('chat', user) && (
                <div
                  onClick={() => onNavigateModule('chat')}
                  className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
                >
                  <div className="stat-icon">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <small>Team Hub</small>
                    <strong>{employees.length > 0 ? 'Active' : '—'}</strong>
                    <small>Real-time collaboration</small>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            <div className="md:col-span-2">
              <DailyAttendanceGraph
                mode="admin"
                records={mergedAttendance}
                totalEmployees={employees.length}
                onViewFullLog={() => onNavigateModule('attendance')}
              />
                  </div>

            <section className="panel h-full">
              <h3>
                <span className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Announcements
                </span>
                <button
                  onClick={() => onNavigateModule('announcements')}
                  className="btn-ghost text-xs"
                >
                  View all
                </button>
              </h3>
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No company announcements published yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {announcements.slice(0, 3).map((item) => (
                    <div key={item.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">{item.title}</strong>
                        <span className={`tag ${item.priority === 'High' || item.priority === 'Urgent' ? 'orange' : 'green'}`}>
                          {item.priority || 'Notice'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6c757d] mt-1 leading-relaxed line-clamp-2">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel col-span-full">
              <h3>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Pending leave approvals ({pendingLeaves.length})
                </span>
                <button
                  onClick={() => onNavigateModule('leaves')}
                  className="btn-ghost text-xs"
                >
                  Review all
                </button>
              </h3>

              {pendingLeaves.length === 0 ? (
                <div className="p-6 text-center text-[#6c757d] text-xs">
                  No leave requests currently pending review.
                </div>
              ) : (
                <div className="space-y-1">
                  {pendingLeaves.slice(0, 3).map((leave, leaveIdx) => {
                    const isProcessing = processingLeaveId === leave.id;
                    const isDetailed = dashboardLeaveRowView[leave.id] !== false;
                    return (
                      <div
                        key={leave.id ? `${leave.id}-${leaveIdx}` : leaveIdx}
                        className="item flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs text-[#343a40]">
                              {leave.employeeName}
                            </strong>
                            <span className="tag orange">
                              {leave.leaveType}
                            </span>
                            <span className="text-xs text-[#6c757d] font-mono">
                              {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''} ({leave.daysCount}d)
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          </div>
                          {isDetailed && (
                            <p className="text-xs text-[#6c757d]">
                              Reason: <span className="text-[#343a40] font-medium">&ldquo;{leave.reason}&rdquo;</span>
                          </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {canApproveRejectLeave(user) && (
                            <>
                              <button
                                onClick={() => handleDashboardOpenApproveModal(leave)}
                                disabled={isProcessing}
                                className="btn-primary text-xs py-1.5 px-3"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName, leave.employeeId)}
                                disabled={isProcessing}
                                className="btn-danger text-xs py-1.5 px-3"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {/* Static Eye/EyeOff View Mode Toggle (Placed at the last) */}
                          <button
                            type="button"
                            onClick={() => toggleDashboardLeaveRowView(leave.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDetailed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={isDetailed ? 'Switch to Compact View (Eye Off)' : 'Switch to Detailed View (Eye On)'}
                          >
                            {isDetailed ? (
                              <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 stroke-[2.2]" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Not Clocked In Today & Late Clock-Ins Lists */}
            {isModuleAllowedForUser('attendance', user) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-full">
                {/* 1. Employees Not Clocked In Today */}
                <section className="panel flex flex-col">
                  <h3>
                    <span className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-rose-600 shrink-0" /> Not Clocked In Today ({notClockedInEmployees.length})
                    </span>
                    <button
                      onClick={() => onNavigateModule('attendance')}
                      className="btn-ghost text-xs"
                    >
                      Attendance
                    </button>
                  </h3>

                  {loading ? (
                    <div className="space-y-2 py-2 animate-pulse">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-10 rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : notClockedInEmployees.length === 0 ? (
                    <div className="p-6 text-center text-[#6c757d] text-xs">
                      {employees.length === 0
                        ? 'No employees registered yet.'
                        : 'All active employees have clocked in today!'}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                      {notClockedInEmployees.map((emp, idx) => {
                        const isOnApprovedLeave = leaves.some(
                          (l) =>
                            (l.status || '').toLowerCase() === 'approved' &&
                            (l.employeeId === emp.id || (l as any).userId === emp.id) &&
                            l.startDate <= todayDate &&
                            l.endDate >= todayDate
                        );
                        return (
                          <div
                            key={emp.id ? `${emp.id}-${idx}` : idx}
                            onClick={() => onSelectEmployee(emp)}
                            className="py-2.5 px-2 flex items-center justify-between gap-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {emp.firstName?.[0] || 'E'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {(emp as any).designation || emp.departmentName || emp.employeeCode || 'Staff'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                isOnApprovedLeave
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isOnApprovedLeave ? 'On Leave' : 'Not Clocked In'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* 2. Late Clock-Ins List (Employee Name, Date, Late Duration) */}
                <section className="panel flex flex-col">
                  <h3>
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Late Clock-Ins ({lateClockInRecords.length})
                    </span>
                    <button
                      onClick={() => onNavigateModule('attendance')}
                      className="btn-ghost text-xs"
                    >
                      View log
                    </button>
                  </h3>

                  {loading ? (
                    <div className="space-y-2 py-2 animate-pulse">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-10 rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : lateClockInRecords.length === 0 ? (
                    <div className="p-6 text-center text-[#6c757d] text-xs">
                      No late clock-ins recorded.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            <th className="py-1.5 px-2">Employee</th>
                            <th className="py-1.5 px-2">Date</th>
                            <th className="py-1.5 px-2 text-right">Late Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lateClockInRecords.map((rec, idx) => {
                            const recDateObj = rec.date ? new Date(rec.date) : null;
                            const formattedDate =
                              rec.date === todayDate
                                ? 'Today'
                                : recDateObj && !isNaN(recDateObj.getTime())
                                ? recDateObj.toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : rec.date || '—';
                            return (
                              <tr
                                key={rec.id ? `${rec.id}-${idx}` : idx}
                                onClick={() => rec.resolvedEmployee && onSelectEmployee(rec.resolvedEmployee)}
                                className={`hover:bg-slate-50 transition-colors ${
                                  rec.resolvedEmployee ? 'cursor-pointer' : ''
                                }`}
                              >
                                <td className="py-2 px-2 font-semibold text-slate-800 whitespace-nowrap">
                                  <div>{rec.resolvedName}</div>
                                  {rec.checkIn && rec.checkIn !== '--:--' && (
                                    <div className="text-[10px] font-normal text-slate-400">
                                      In: {rec.checkIn}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                                  {formattedDate}
                                </td>
                                <td className="py-2 px-2 text-right whitespace-nowrap">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    {rec.lateDurationText}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}

            {isModuleAllowedForUser('employees', user) && (
            <div className="panel space-y-3 col-span-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f8f9fa]">
              <div>
                  <h3 className="text-sm font-bold text-[#343a40] m-0">
                  Staff Directory &amp; Live Time Tracking
                </h3>
                  <p className="text-xs text-[#6c757d] mt-0.5">
                    Live status, recorded punches, and direct messaging
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateModule('attendance')}
                    className="btn-ghost text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#6c757d]" />
                    <span>Timesheets</span>
                  </button>
                  {canCreateUser(user) && (
                    <button
                      onClick={onOpenAddEmployeeModal}
                      className="btn-primary text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Employee</span>
                    </button>
                  )}
                </div>
              </div>

            <div className="tablewrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>ID</th>
                    <th>DESIGNATION</th>
                    <th>TODAY&apos;S SHIFT</th>
                    <th>WORKED TIME</th>
                    <th>BREAK</th>
                    <th>STATUS</th>
                    <th className="text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="py-10 text-center text-xs text-[#6c757d]">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Users className="w-8 h-8 text-emerald-500/50" />
                            <p className="font-bold text-[#343a40]">No employees in this company yet</p>
                            <p className="text-[11px] text-[#6c757d]">Click &ldquo;+ Add Employee&rdquo; above to onboard your staff members.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => {
                    const todayDate = getTodayDateString();
                    const todayRec =
                      mergedAttendance.find((r) => r && r.date === todayDate && isMatchEmployee(r, emp.id)) ||
                      (attendance || []).find((r) => r && r.date === todayDate && isMatchEmployee(r, emp.id)) ||
                      getTodayRecordForEmployee(emp.id, mergedAttendance);
                        const isDone = todayRec && Boolean(todayRec.isCompleted || (todayRec.checkOut && todayRec.checkOut !== '—') || (todayRec as any).status === 'Completed');
                        const isOnBreak = todayRec && !isDone && Boolean(todayRec.isOnBreak);
                        const isWorking = todayRec && !isDone && !isOnBreak && Boolean(todayRec.checkIn && todayRec.checkIn !== '—');

                    const liveSecs = todayRec ? getLiveActiveSeconds(todayRec) : 0;
                    const breakSecs = todayRec ? getLiveBreakSeconds(todayRec) : 0;

                    return (
                      <tr
                        key={emp.id ? `${emp.id}-${index}` : index}
                        onClick={() => onSelectEmployee(emp)}
                            className="hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      >
                            <td className="font-semibold text-[#343a40]">
                          <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#d8f3dc] text-[#1b4332] font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.firstName?.[0] || 'E'}
                            </div>
                            <span className="truncate">{emp.firstName} {emp.lastName}</span>
                          </div>
                        </td>
                            <td className="text-[#6c757d] font-mono text-xs">{emp.employeeCode}</td>
                            <td className="text-[#343a40] truncate">{emp.designationTitle || 'Staff'}</td>
                            <td className="text-[#6c757d] font-mono text-xs">
                          {todayRec?.checkIn ? (
                            <span>
                              {todayRec.checkIn} {todayRec.checkOut ? `– ${todayRec.checkOut}` : '– Active'}
                            </span>
                          ) : (
                                <span className="text-[#dee2e6]">—</span>
                          )}
                        </td>
                            <td className="font-mono font-bold text-[#343a40] text-xs">
                          {todayRec ? formatSecondsToWords(liveSecs) : '—'}
                        </td>
                            <td className="text-[#6c757d] font-mono text-xs">
                          {breakSecs > 0 ? formatSecondsToWords(breakSecs) : '0s'}
                        </td>
                        <td>
                          {isWorking ? (
                            <span className="tag green">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#52b788] animate-pulse" />
                              Working
                            </span>
                          ) : isOnBreak ? (
                            <span className="tag orange">
                                  <Pause className="w-3 h-3 text-[#6c757d]" />
                              On Break
                            </span>
                          ) : isDone ? (
                            <span className="tag">
                              <Check className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                                <span className="tag" style={{ background: '#f8f9fa', color: '#6c757d' }}>
                              Not Punched
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              id={`btn-dash-chat-${emp.id}`}
                              onClick={() => onOpenChatWithEmployee?.(emp.id)}
                              className="btn-ghost text-xs py-1 px-2.5"
                              title="Chat with employee"
                            >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#2d6a4f]" />
                              <span className="hidden sm:inline">Chat</span>
                            </button>

                                {(officeRole === 'ADMIN' || officeRole === 'SUPER_ADMIN') && emp.email !== user.email && emp.id !== user.employeeId && emp.id !== user.id && (
                            <button
                              id={`btn-dash-role-${emp.id}`}
                              onClick={() => setRoleTargetEmpDash(emp)}
                                    className="btn-secondary text-xs py-1 px-2.5"
                              title="Change employee role"
                            >
                                    <Shield className="w-3.5 h-3.5 text-[#2d6a4f]" />
                              <span className="hidden sm:inline">Role</span>
                            </button>
                                )}

                            <button
                              id={`btn-dash-notice-${emp.id}`}
                              onClick={() => handleOpenNoticeModalDashboard(emp)}
                              className="btn-secondary text-xs py-1 px-2.5"
                              title="Send notice to employee"
                            >
                                  <Bell className="w-3.5 h-3.5 text-[#2d6a4f]" />
                              <span className="hidden sm:inline">Notice</span>
                            </button>

                                {canDeleteUser(user) && emp.email !== user.email && emp.id !== user.employeeId && emp.id !== user.id && (
                                  <button
                                    id={`btn-dash-remove-${emp.id}`}
                                    onClick={() => setRemovingEmpDashboard(emp)}
                                    className="btn-danger text-xs py-1 px-2 cursor-pointer"
                                    title="Remove employee from staff"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* EMPLOYEE SELF-SERVICE VIEW (HIGH-CLARITY & SIMPLE)             */
        /* ============================================================== */
        <div className="space-y-5">
          {/* ═══ EMPLOYEE STAT CARDS ═══ */}
          {(() => {
            const myLeaves = leaves.filter((l) => {
              const eId = currentEmp?.id || user?.employeeId || user?.id || '';
              const eEmail = currentEmp?.email?.toLowerCase() || user?.email?.toLowerCase() || '';
              const eCode = ((currentEmp as any)?.employeeCode || (user as any)?.employeeCode || '').toLowerCase();
              const eName = `${currentEmp?.firstName || user?.firstName || ''} ${currentEmp?.lastName || user?.lastName || ''}`.trim().toLowerCase();
              if (eId && l.employeeId === eId) return true;
              if (eEmail && (l as any).employeeEmail?.toLowerCase() === eEmail) return true;
              if (eCode && (l as any).employeeCode?.toLowerCase() === eCode) return true;
              if (eName && l.employeeName?.toLowerCase() === eName) return true;
              return false;
            });
            const empLeaveSummary = resolveLeaveQuotaSummary(
              leaveQuotaData?.settings ?? null,
              leaveQuotaData?.balances ?? null,
              myLeaves,
              leaveTypesList
            );
            const empTakenDays = empLeaveSummary.total.taken;
            const empTotalQuota = empLeaveSummary.total.quota;
            const empLeftDays = empLeaveSummary.total.available;

            if (loading) {
            return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 h-full flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200/70 shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="h-2.5 w-16 bg-slate-200/70 rounded" />
                        <div className="h-4 w-24 bg-slate-200/80 rounded" />
                        <div className="h-2.5 w-20 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {isModuleAllowedForUser('attendance', user) && (
                  <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentStatus === 'working' ? 'bg-emerald-50 text-emerald-600' : currentStatus === 'on_break' ? 'bg-amber-50 text-amber-600' : currentStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Today&apos;s Status</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{currentStatus === 'working' ? 'Working' : currentStatus === 'on_break' ? 'On Break' : currentStatus === 'completed' ? 'Shift Done' : 'Not Clocked In'}</p>
                        <p className="text-[11px] text-slate-500">{currentStatus === 'working' ? liveWorkedHMS : currentStatus === 'completed' ? `${todaySummary?.totalDurationFormatted || liveWorkedHMS || 'Completed'}` : '09:30 AM start'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('leaves', user) && (
                  <div onClick={onOpenLeaveModal} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Leave Balance</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {leaveQuotaLoading ? 'Loading...' : `${empLeftDays} Days Left`}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold">
                          {leaveQuotaLoading
                            ? 'Fetching quota...'
                            : `${empTakenDays} Used • ${empTotalQuota} Total`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('payslips', user) && (
                  <div onClick={() => onNavigateModule('payslips')} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Salary &amp; Payslips</p>
                        <p className="text-sm font-semibold text-slate-800">{currentEmp?.salary?.net ? `₹${currentEmp.salary.net.toLocaleString()}` : '—'}</p>
                        <p className="text-[11px] text-emerald-700 font-semibold">View Payslips &rarr;</p>
                      </div>
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('chat', user) && (
                  <div onClick={() => currentEmp?.reportingManagerId ? onOpenChatWithEmployee?.(currentEmp.reportingManagerId) : undefined} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-amber-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Reports To</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{currentEmp?.reportingManagerName || 'Not assigned'}</p>
                        <p className="text-[11px] text-amber-700 font-semibold">Tap to Chat</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══ EMPLOYEE PANELS GRID ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6 flex flex-col">
              <DailyShiftConsole clockSize="sm" showHeaderClock={false} className="h-full" />
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight leading-tight truncate">
                          My Recent Attendance
                      </h3>
                        <p className="text-[10px] text-slate-400 leading-tight truncate">
                          Daily clock in/out timestamps &amp; worked duration
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateModule('attendance')}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 shrink-0 cursor-pointer"
                  >
                    <span>Full Log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                  <div className="mt-2.5 flex-1 overflow-auto max-h-[145px] [scrollbar-width:thin]">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-slate-100 text-[9px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/80">
                          <th className="py-1.5 px-2">DATE &amp; DAY</th>
                          <th className="py-1.5 px-2">CLOCK IN</th>
                          <th className="py-1.5 px-2">CLOCK OUT</th>
                          <th className="py-1.5 px-2">BREAK</th>
                          <th className="py-1.5 px-2">WORKED</th>
                          <th className="py-1.5 px-2 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myRecentAttendance.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400 text-[11px]">
                              No attendance history recorded yet. Clock in to begin tracking your work hours!
                          </td>
                        </tr>
                      ) : (
                        myRecentAttendance.map((rec: any) => {
                          const recDate = new Date(rec.date);
                            const dayName = rec.date === getTodayDateString() ? 'Today' : recDate.toLocaleDateString('en-US', { weekday: 'short' });
                            const formattedDate = recDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                            const workedStr = rec.totalHours || (rec.workingHours ? `${rec.workingHours} hrs` : (rec.date === getTodayDateString() && currentStatus === 'working' ? liveWorkedHMS : '—'));
                            const bSecs = getLiveBreakSeconds(rec);
                            const breakStr = rec.formattedTotalBreak || (bSecs > 0 ? formatSecondsToWords(bSecs) : rec.breakDurationMinutes ? `${rec.breakDurationMinutes}m` : '0m');

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-1.5 px-2 font-semibold text-slate-900 whitespace-nowrap">
                                  <span>{dayName}</span>
                                  <span className="text-[10px] text-slate-400 font-normal ml-1">{formattedDate}</span>
                                </td>
                                <td className="py-1.5 px-2 font-medium text-slate-700 whitespace-nowrap">{rec.checkIn && rec.checkIn !== '--:--' ? rec.checkIn : '—'}</td>
                                <td className="py-1.5 px-2 font-medium text-slate-700 whitespace-nowrap">{rec.checkOut && rec.checkOut !== '--:--' ? rec.checkOut : '—'}</td>
                                <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{breakStr}</td>
                                <td className="py-1.5 px-2 font-mono font-semibold text-slate-900 whitespace-nowrap">{workedStr}</td>
                                <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold ${rec.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {rec.status || 'Present'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
                <div className="p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">Leave Quota &amp; Balances</h4>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onNavigateModule('leaves')}
                        className="text-xs font-semibold text-slate-500 hover:text-emerald-700 cursor-pointer"
                      >
                        View All
                      </button>
                    <button
                      onClick={onOpenLeaveModal}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      + Apply Leave
                    </button>
                    </div>
                  </div>

                  {(() => {
                    const empMyLeaves = leaves.filter((l) => {
                      const eId = currentEmp?.id || user?.employeeId || user?.id || '';
                      const eEmail = currentEmp?.email?.toLowerCase() || user?.email?.toLowerCase() || '';
                      const eCode = ((currentEmp as any)?.employeeCode || (user as any)?.employeeCode || '').toLowerCase();
                      const eName = `${currentEmp?.firstName || user?.firstName || ''} ${currentEmp?.lastName || user?.lastName || ''}`.trim().toLowerCase();
                      if (eId && l.employeeId === eId) return true;
                      if (eEmail && (l as any).employeeEmail?.toLowerCase() === eEmail) return true;
                      if (eCode && (l as any).employeeCode?.toLowerCase() === eCode) return true;
                      if (eName && l.employeeName?.toLowerCase() === eName) return true;
                      return false;
                    });
                    const empLeaveResult = calculateEmployeeLeaveBalances(
                      leaveTypesList,
                      empMyLeaves,
                      leaveQuotaData?.settings ?? null,
                      leaveQuotaData?.balances ?? null
                    );
                    const empSummary = resolveLeaveQuotaSummary(
                      leaveQuotaData?.settings ?? null,
                      leaveQuotaData?.balances ?? null,
                      empMyLeaves,
                      leaveTypesList
                    );

                    if (leaveQuotaLoading) {
                      return (
                        <div className="grid grid-cols-3 gap-2.5 text-center text-xs animate-pulse">
                          {[0, 1, 2].map((idx) => (
                            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                              <div className="h-3 w-12 mx-auto bg-slate-200 rounded" />
                              <div className="h-5 w-14 mx-auto bg-slate-200 rounded" />
                              <div className="h-2.5 w-16 mx-auto bg-slate-100 rounded" />
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Dynamically show the top 3 leave types configured for the employee
                    const top3Cards = empLeaveResult.cards.slice(0, 3);
                    const gridColsClass = top3Cards.length === 1 ? 'grid-cols-1' : top3Cards.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

                    if (top3Cards.length > 0) {
                      return (
                        <div className={`grid ${gridColsClass} gap-2.5 text-center text-xs`}>
                          {top3Cards.map((card) => (
                            <div
                              key={card.id}
                              onClick={() => onNavigateModule('leaves')}
                              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate" title={card.name}>
                                {card.name}
                              </span>
                              <span className="text-xl font-bold tracking-tight text-slate-900 block mt-1">
                                {card.available} Left
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                of {card.quota} Total
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Casual</span>
                          <span className="text-xl font-bold tracking-tight text-slate-900 block mt-1">
                            {empSummary.casual.available} Left
                      </span>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            of {empSummary.casual.quota} Total
                      </span>
                    </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sick</span>
                          <span className="text-xl font-bold tracking-tight text-slate-900 block mt-1">
                            {empSummary.sick.available} Left
                      </span>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            of {empSummary.sick.quota} Total
                      </span>
                    </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Annual</span>
                          <span className="text-xl font-bold tracking-tight text-slate-900 block mt-1">
                            {empSummary.paid.available} Left
                      </span>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            of {empSummary.paid.quota} Total
                      </span>
                    </div>
                  </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
                <div className="p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">Upcoming Holidays</h4>
                    <button
                      onClick={() => onNavigateModule('calendar')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      View Calendar
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {upcomingHolidays.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">No upcoming holidays scheduled.</p>
                    ) : (
                      upcomingHolidays.map((h: any) => {
                        const holDate = new Date(h.date);
                        const dateLabel = holDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', weekday: 'short' });
                        return (
                          <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Calendar className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[140px]">{h.name}</span>
                                <span className="text-[10px] text-slate-400">{h.type || 'Company Holiday'}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-slate-700 text-[11px] shrink-0">{dateLabel}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Check Out Confirmation Modal */}
      {mounted && checkOutModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="checkout-confirm-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckOutModalOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Clock Out for Today?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Attendance shift finalization</p>
              </div>
              </div>
              <button
                onClick={() => setCheckOutModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 leading-relaxed flex-1">
              Once clocked out, today’s work shift is locked and finalized. You will not be able to punch in again until tomorrow.
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-checkout"
                type="button"
                onClick={() => setCheckOutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-checkout"
                type="button"
                onClick={executeCheckOut}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Finalizing...' : 'Confirm Clock Out'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern In-App Leave Approval Modal for Admin */}
      {mounted && approveModalData && typeof document !== 'undefined' && createPortal(
        <div
          id="dashboard-approve-leave-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApproveModalData(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Approve Leave Application</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{approveModalData.empName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalData(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to approve the leave application for{' '}
                <strong className="text-slate-900 font-semibold">{approveModalData.empName}</strong>?
              </p>

              {/* Leave Details Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Leave Type:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                    {approveModalData.leaveType}
                  </span>
                </div>
                {approveModalData.startDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-800">
                      {approveModalData.startDate} {approveModalData.endDate && approveModalData.endDate !== approveModalData.startDate ? `to ${approveModalData.endDate}` : ''} ({approveModalData.daysCount || 1}d)
                    </span>
                  </div>
                )}
                {approveModalData.reason && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="font-semibold text-slate-500 block mb-1">Reason:</span>
                    <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      &ldquo;{approveModalData.reason}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-approve-leave"
                type="button"
                onClick={() => setApproveModalData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-approve-leave"
                type="button"
                onClick={executeApproveLeave}
                disabled={processingLeaveId === approveModalData.id}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingLeaveId === approveModalData.id ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern In-App Leave Rejection Modal for Admin */}
      {mounted && rejectModalData && typeof document !== 'undefined' && createPortal(
        <div
          id="dashboard-reject-leave-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectModalData(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Reject Leave Request</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rejectModalData.empName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalData(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Rejection Reason (Shared with Employee) *
              </label>
              <textarea
                id="reject-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-reject-leave"
                type="button"
                onClick={() => setRejectModalData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-leave"
                type="button"
                onClick={executeRejectLeave}
                disabled={processingLeaveId === rejectModalData.id}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {processingLeaveId === rejectModalData.id ? 'Saving...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern In-App Remove Employee Confirmation Modal (Dashboard) */}
      {mounted && removingEmpDashboard && typeof document !== 'undefined' && createPortal(
        <div
          id="dashboard-remove-employee-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemovingEmpDashboard(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Remove Employee?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Staff roster modification</p>
              </div>
              </div>
              <button
                onClick={() => setRemovingEmpDashboard(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 leading-relaxed flex-1">
              Are you sure you want to remove <strong className="text-slate-900">{removingEmpDashboard.firstName} {removingEmpDashboard.lastName}</strong> ({removingEmpDashboard.employeeCode}) from the staff roster?
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-dash-remove-emp"
                type="button"
                onClick={() => setRemovingEmpDashboard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-remove-emp"
                type="button"
                onClick={handleConfirmRemoveEmpDashboard}
                disabled={removeEmpLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {removeEmpLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern In-App Send Notice Modal (Dashboard) */}
      {mounted && noticeTargetEmpDashboard && typeof document !== 'undefined' && createPortal(
        <div
          id="dashboard-send-notice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoticeTargetEmpDashboard(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      Send Notice
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Direct Notice
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    To: <strong className="text-slate-700">{noticeTargetEmpDashboard.firstName} {noticeTargetEmpDashboard.lastName}</strong> ({noticeTargetEmpDashboard.employeeCode} • {noticeTargetEmpDashboard.departmentName || 'Staff'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Notice Subject / Title *
                </label>
                <input
                  id="input-dash-notice-title"
                  type="text"
                  value={dashNoticeTitle}
                  onChange={(e) => setDashNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Urgent Task, HR Note..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Urgency / Priority Level
                </label>
                <select
                  id="select-dash-notice-priority"
                  value={dashNoticePriority}
                  onChange={(e) => setDashNoticePriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Low">Low Priority (General Notice)</option>
                  <option value="Medium">Medium Priority (Standard Notice)</option>
                  <option value="High">High Priority (Action Required)</option>
                  <option value="Urgent">Urgent Notice (Immediate Attention)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Notice Content *
                </label>
                <textarea
                  id="textarea-dash-notice-content"
                  rows={4}
                  value={dashNoticeContent}
                  onChange={(e) => setDashNoticeContent(e.target.value)}
                  placeholder="Type the message for the employee..."
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-dash-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-send-notice"
                type="button"
                onClick={handleConfirmSendNoticeDashboard}
                disabled={dashNoticeLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{dashNoticeLoading ? 'Sending...' : 'Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Change Role Modal on Dashboard */}
      <ChangeRoleModal
        isOpen={Boolean(roleTargetEmpDash)}
        onClose={() => setRoleTargetEmpDash(null)}
        employee={roleTargetEmpDash}
        onSuccess={() => {
          setRoleTargetEmpDash(null);
          if (onRefreshData) onRefreshData();
        }}
      />


    </div>
  );
};

