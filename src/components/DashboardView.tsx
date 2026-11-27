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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord, Announcement } from '../types/hrms';
import { api } from '../lib/api';
import { useCompanyLive } from '../lib/useCompanyLive';
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  calculateEmployeeLeaveBalances,
  RawLeaveQuotaPayload,
} from '../lib/leaveQuotaUtils';
import { getRoleDefinition } from '../lib/roleConfig';
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
  const isSuperAdmin = officeRole === 'SUPER_ADMIN';
  const officeDashboard = portalMode === 'admin' || officeRole === 'MANAGER' || officeRole === 'SUPERVISOR';
  const canReviewPhotos = ['ADMIN', 'HR', 'HR_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(officeRole);
  const [photoRequests, setPhotoRequests] = useState<Array<{ id: string; userName: string; role: string; email: string }>>([]);
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);

  const [saStats, setSaStats] = useState<{
    stats: Record<string, any>;
    charts: {
      monthlyOrders?: Array<{ key: string; label: string; orders: number; revenue: number }>;
      companyStatuses?: Array<{ status: string; count: number }>;
      orderStatuses?: Array<{ status: string; count: number }>;
    } | null;
    companies: any[];
    plans: any[];
    orders: any[];
    support: any[];
    loading: boolean;
  }>({ stats: {}, charts: null, companies: [], plans: [], orders: [], support: [], loading: isSuperAdmin });

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    setSaStats((prev) => ({ ...prev, loading: true }));
    api.getDashboard()
      .then((res: any) => {
        if (!active) return;
        setSaStats({
          stats: res?.stats || {},
          charts: res?.charts || null,
          companies: Array.isArray(res?.companies) ? res.companies : [],
          plans: Array.isArray(res?.plans) ? res.plans : [],
          orders: Array.isArray(res?.orders) ? res.orders : [],
          support: Array.isArray(res?.support) ? res.support : [],
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setSaStats((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [isSuperAdmin]);

  const loadPhotoRequests = async () => {
    if (!canReviewPhotos) return;
    try {
      setPhotoRequests(await api.listPhotoRequests());
    } catch {
      setPhotoRequests([]);
    }
  };

  useEffect(() => {
    void loadPhotoRequests();
  }, [canReviewPhotos]);
  const [liveTick, setLiveTick] = useState(0);
  useCompanyLive(['employees'], () => {
    void loadPhotoRequests();
  });
  useCompanyLive(['all', 'employees', 'attendance', 'leaves', 'notices', 'holidays', 'settings', 'tasks', 'payroll'], () => {
    setLiveTick((t) => t + 1);
    onRefreshData?.();
  });

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
    if (isSuperAdmin) {
      setLeaveQuotaLoading(false);
      return;
    }
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
  }, [portalMode, activeEmpId, user?.companyId, isSuperAdmin]);

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
        const localIn = Boolean(rec.checkIn && rec.checkIn !== '—' && rec.checkIn !== '--:--');
        map.set(key, {
          ...existing,
          ...rec,
          checkIn: localIn ? rec.checkIn : existing.checkIn,
          checkOut: rec.checkOut || existing.checkOut,
          isOnBreak: rec.isOnBreak ?? existing.isOnBreak,
          isCompleted: rec.isCompleted ?? existing.isCompleted,
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
  const pendingLeaves = leaves.filter((l) => (l.status || '').toLowerCase() === 'pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
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

  const [leaveDaysLeft, setLeaveDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getAnnouncements().then((list) => {
      if (!cancelled) setAnnouncements(Array.isArray(list) ? list.slice(0, 3) : []);
    }).catch(() => {
      if (!cancelled) setAnnouncements([]);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.companyId, employees.length, liveTick]);

  useEffect(() => {
    if (portalMode === 'admin') return;
    const employeeId = currentEmp.id;
    if (!employeeId || employeeId === 'emp-self') {
      setLeaveDaysLeft(null);
      return;
    }
    let cancelled = false;
    api.getLeaveBalances(employeeId).then((balance) => {
      if (cancelled || !balance) return;
      const remaining =
        (balance.casualLeave?.remaining || 0) +
        (balance.sickLeave?.remaining || 0) +
        (balance.paidLeave?.remaining || 0);
      setLeaveDaysLeft(remaining);
    }).catch(() => {
      if (!cancelled) setLeaveDaysLeft(null);
    });
    return () => {
      cancelled = true;
    };
  }, [portalMode, currentEmp.id, liveTick]);

  const todayDate = getTodayDateString();
  const teamIds = new Set(employees.map((emp) => emp.id));
  const isPresent = (record: AttendanceRecord) => {
    const status = String(record.status || '').toLowerCase();
    return Boolean(record.checkIn) || status === 'present' || status === 'late' || status === 'half day';
  };
  const weekBars = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const presentIds = new Set(
      attendance
        .filter((record) => String(record.date || '').slice(0, 10) === iso && teamIds.has(record.employeeId) && isPresent(record))
        .map((record) => record.employeeId),
    );
    const count = presentIds.size;
    const rate = employees.length === 0 ? 0 : Math.round((count / employees.length) * 100);
    return {
      day: index === 6 ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      val: rate,
      count: `${count} Present`,
      isToday: index === 6,
    };
  });
  const todayRecords = attendance.filter(
    (record) => String(record.date || '').slice(0, 10) === todayDate && teamIds.has(record.employeeId) && isPresent(record),
  );
  const activeWorkingCount = todayRecords.filter((a) => !a.isCompleted && !a.isOnBreak).length;
  const onBreakCount = todayRecords.filter((a) => !a.isCompleted && a.isOnBreak).length;
  const completedTodayCount = todayRecords.filter((a) => a.isCompleted).length;
  const approvedLeavesCount = leaves.filter((l) => (l.status || '').toLowerCase() === 'approved').length;

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
            {isSuperAdmin ? (
              <button
                onClick={() => onNavigateModule('companies')}
                className="btn-primary"
              >
                All Companies
              </button>
            ) : (
              isModuleAllowedForUser('announcements', user) && (
                <button
                  onClick={() => onNavigateModule('announcements')}
                  className="btn-primary"
                >
                  View Announcements
                </button>
              )
            )}
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

      {isSuperAdmin ? (
        /* ============================================================== */
        /* SUPER ADMIN VIEW (Scoped strictly to Super Admin permissions)  */
        /* ============================================================== */
        <div className="space-y-5">
          {saStats.loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="stat h-24 bg-white/70 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/80 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-20 bg-slate-200/70 rounded" />
                    <div className="h-6 w-14 bg-slate-200/80 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div
                onClick={() => onNavigateModule('companies')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <small>All Companies</small>
                  <strong>{saStats.stats.totalCompanies ?? saStats.companies.length}</strong>
                  <small>{saStats.stats.activeCompanies ?? 0} active · {saStats.stats.pendingCompanies ?? 0} pending</small>
                </div>
              </div>

              <div
                onClick={() => onNavigateModule('plans')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <small>Subscription Plans</small>
                  <strong>{saStats.stats.totalPlans ?? saStats.plans.length}</strong>
                  <small>{saStats.stats.activePlans ?? 0} active plans</small>
                </div>
              </div>

              <div
                onClick={() => onNavigateModule('orders')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <small>Revenue &amp; Orders</small>
                  <strong>₹{Number(saStats.stats.totalRevenue || 0).toLocaleString('en-IN')}</strong>
                  <small>{saStats.stats.activeOrders ?? 0} active · {saStats.stats.pendingOrders ?? 0} pending</small>
                </div>
              </div>

              <div
                onClick={() => onNavigateModule('support')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <small>Support Inquiries</small>
                  <strong>{saStats.stats.totalSupport ?? saStats.support.length}</strong>
                  <small>Demo &amp; contact requests</small>
                </div>
              </div>
            </div>
          )}

          {/* Super Admin Analytics Graphs */}
          {(() => {
            const monthly = saStats.charts?.monthlyOrders || [];
            const maxRev = Math.max(1, ...monthly.map((m) => Number(m.revenue || 0)));
            const maxOrd = Math.max(1, ...monthly.map((m) => Number(m.orders || 0)));
            const compStatuses = saStats.charts?.companyStatuses || [];
            const totalCompForChart = Math.max(1, compStatuses.reduce((s, c) => s + c.count, 0));
            const activeC = compStatuses.find((c) => c.status === 'Active')?.count || 0;
            const pendingC = compStatuses.find((c) => c.status === 'Pending')?.count || 0;
            const otherC = totalCompForChart === 1 && compStatuses.reduce((s, c) => s + c.count, 0) === 0
              ? 0
              : Math.max(0, compStatuses.reduce((s, c) => s + c.count, 0) - activeC - pendingC);
            const activePct = Math.round((activeC / totalCompForChart) * 100);
            const pendingPct = Math.round((pendingC / totalCompForChart) * 100);
            const orderStatuses = saStats.charts?.orderStatuses || [];
            const totalOrdForChart = Math.max(1, orderStatuses.reduce((s, o) => s + o.count, 0));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Graph 1: 6-Month Revenue & Orders Bar Chart */}
                <section className="panel lg:col-span-7 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="m-0 border-0 pb-0 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#2d6a4f]" />
                        <span>6-Month Revenue &amp; Orders Trend</span>
                      </h3>
                      <p className="text-[11px] text-[#6c757d] mt-0.5">
                        Monthly subscription revenue (INR) and order volume
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Last 6 Months
                    </span>
                  </div>

                  {monthly.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      No monthly order data available yet.
                    </div>
                  ) : (
                    <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1 border-b border-slate-100">
                      {monthly.map((m) => {
                        const heightPct = m.revenue > 0
                          ? Math.max(12, Math.round((m.revenue / maxRev) * 100))
                          : m.orders > 0
                            ? Math.max(10, Math.round((m.orders / maxOrd) * 45))
                            : 6;
                        return (
                          <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                            <div className="text-[10px] font-bold text-slate-600 opacity-80 group-hover:opacity-100 transition-opacity text-center whitespace-nowrap">
                              {m.revenue > 0 ? `₹${m.revenue.toLocaleString('en-IN')}` : `${m.orders} ord`}
                            </div>
                            <div className="w-full max-w-[44px] flex-1 flex items-end justify-center">
                              <div
                                title={`${m.label}: ₹${m.revenue.toLocaleString('en-IN')} (${m.orders} orders)`}
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t-xl transition-all duration-500 ${
                                  m.revenue > 0 || m.orders > 0
                                    ? 'bg-gradient-to-t from-[#1b4332] to-[#40916c] group-hover:from-[#2d6a4f] group-hover:to-[#52b788] shadow-xs'
                                    : 'bg-slate-100'
                                }`}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Graph 2: Platform Status Breakdown (Donut + Bars) */}
                <section className="panel lg:col-span-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="m-0 border-0 pb-0 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#2d6a4f]" />
                        <span>Platform Distribution</span>
                      </h3>
                      <p className="text-[11px] text-[#6c757d] mt-0.5">
                        Companies &amp; subscription status breakdown
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 py-2">
                    {/* SVG Ring Donut for Company Statuses */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="#e2e8f0"
                          strokeWidth="3.6"
                        />
                        {activePct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#1b4332"
                            strokeWidth="3.6"
                            strokeDasharray={`${activePct} ${100 - activePct}`}
                            strokeDashoffset="0"
                          />
                        )}
                        {pendingPct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="3.6"
                            strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                            strokeDashoffset={`${-activePct}`}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-slate-900 leading-none">
                          {saStats.stats.totalCompanies ?? saStats.companies.length}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Companies</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332]" /> Active
                        </span>
                        <span className="font-bold text-slate-900">{activeC}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending
                        </span>
                        <span className="font-bold text-slate-900">{pendingC}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Inactive / Rejected
                        </span>
                        <span className="font-bold text-slate-900">{otherC}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Progress Bars */}
                  <div className="pt-3 mt-2 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Orders by Status
                    </p>
                    {orderStatuses.map((o) => {
                      const pct = Math.round((o.count / totalOrdForChart) * 100);
                      const barColor =
                        o.status === 'Active'
                          ? 'bg-emerald-600'
                          : o.status === 'Pending'
                            ? 'bg-amber-500'
                            : 'bg-slate-400';
                      return (
                        <div key={o.status} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">{o.status}</span>
                            <span className="font-bold text-slate-900">{o.count}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="panel flex flex-col">
              <h3>
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Recent Companies
                </span>
                <button
                  onClick={() => onNavigateModule('companies')}
                  className="btn-ghost text-xs"
                >
                  View All
                </button>
              </h3>
              {saStats.companies.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No companies registered yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {saStats.companies.slice(0, 5).map((comp: any) => (
                    <div key={comp.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">{comp.name}</strong>
                        <span className={`tag ${comp.status === 'Active' ? 'green' : comp.status === 'Pending' ? 'orange' : ''}`}>
                          {comp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6c757d] mt-1 truncate">
                        {comp.email} {comp.industrySector ? `· ${comp.industrySector}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel flex flex-col">
              <h3>
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Recent Premium Orders
                </span>
                <button
                  onClick={() => onNavigateModule('orders')}
                  className="btn-ghost text-xs"
                >
                  Manage Orders
                </button>
              </h3>
              {saStats.orders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No premium orders recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {saStats.orders.slice(0, 5).map((ord: any) => (
                    <div key={ord.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">
                          {ord.companyName || ord.companyId} — {ord.planName}
                        </strong>
                        <span className={`tag ${ord.status === 'Active' ? 'green' : ord.status === 'Pending' ? 'orange' : ''}`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6c757d] mt-1">
                        ₹{Number(ord.price || 0).toLocaleString('en-IN')} · {ord.durationMonths} month(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel flex flex-col">
              <h3>
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Recent Support Inquiries
                </span>
                <button
                  onClick={() => onNavigateModule('support')}
                  className="btn-ghost text-xs"
                >
                  View Inquiries
                </button>
              </h3>
              {saStats.support.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No support or demo inquiries received yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {saStats.support.slice(0, 5).map((req: any) => (
                    <div key={req.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">
                          {req.name} {req.companyName ? `(${req.companyName})` : ''}
                        </strong>
                        <span className="tag green">{req.kind || 'Inquiry'}</span>
                      </div>
                      <p className="text-[11px] text-[#6c757d] mt-1 line-clamp-1">
                        {req.email} · {req.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : officeDashboard ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-5">
          {canReviewPhotos && photoRequests.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-black text-amber-950">Profile photo requests</p>
              <p className="text-[11px] text-amber-900">Approve one upload. The same list is also on Employees.</p>
              {photoRequests.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-amber-100 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.userName || item.email}</p>
                    <p className="text-[11px] text-slate-500">{item.role} · {item.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={photoBusy === item.id}
                      onClick={async () => {
                        setPhotoBusy(item.id);
                        try {
                          const result = await api.reviewPhotoRequest(item.id, true);
                          showToast({ type: 'success', title: 'Approved', message: result.message });
                          await loadPhotoRequests();
                        } catch (err: any) {
                          showToast({ type: 'error', title: 'Could not approve', message: err.message || 'Try again.' });
                        } finally {
                          setPhotoBusy(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={photoBusy === item.id}
                      onClick={async () => {
                        setPhotoBusy(item.id);
                        try {
                          const result = await api.reviewPhotoRequest(item.id, false);
                          showToast({ type: 'success', title: 'Rejected', message: result.message });
                          await loadPhotoRequests();
                        } catch (err: any) {
                          showToast({ type: 'error', title: 'Could not reject', message: err.message || 'Try again.' });
                        } finally {
                          setPhotoBusy(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

              {canApproveRejectLeave(user) && isModuleAllowedForUser('leaves', user) && (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-full">
              <section className="panel flex flex-col">
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

              {canApproveRejectLeave(user) && (
              <section className="panel flex flex-col">
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
                <div className="divide-y divide-slate-100">
                  {pendingLeaves.slice(0, 3).map((leave, leaveIdx) => {
                    const isProcessing = processingLeaveId === leave.id;
                    return (
                      <div
                        key={leave.id ? `${leave.id}-${leaveIdx}` : leaveIdx}
                        className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs text-[#343a40]">
                              {leave.employeeName}
                            </strong>
                            <span className="tag orange text-[11px]">
                              {leave.leaveType}
                            </span>
                            <span className="text-[11px] text-[#6c757d]">
                              {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''} ({leave.daysCount}d)
                            </span>
                            <span className="text-[11px] font-semibold text-amber-700">
                              Pending
                            </span>
                          </div>
                          {leave.reason && (
                            <p className="text-[11px] text-[#6c757d] truncate max-w-md">
                              Reason: <span className="text-[#343a40] font-medium">&ldquo;{leave.reason}&rdquo;</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {canApproveRejectLeave(user) && (
                            <>
                              <button
                                onClick={() => handleDashboardOpenApproveModal(leave)}
                                disabled={isProcessing}
                                className="btn-primary !text-[11px] !py-1 !px-2.5 !rounded-lg"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName, leave.employeeId)}
                                disabled={isProcessing}
                                className="btn-danger !text-[11px] !py-1 !px-2.5 !rounded-lg"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </section>
              )}
            </div>

            {isModuleAllowedForUser('employees', user) && (
            <div className="panel space-y-3 col-span-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f8f9fa]">
              <div>
                  <h3 className="text-sm font-bold text-[#343a40] m-0">
                  Staff Directory &amp; Live Time Tracking
                </h3>
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
                              type="button"
                              id={`btn-dash-chat-${emp.id}`}
                              onClick={() => onOpenChatWithEmployee?.(emp.id)}
                              aria-label="Chat"
                              className="group relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-out shadow-lg z-20">
                                Chat
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                              </span>
                            </button>

                            <button
                              type="button"
                              id={`btn-dash-notice-${emp.id}`}
                              onClick={() => handleOpenNoticeModalDashboard(emp)}
                              aria-label="Notice"
                              className="group relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
                            >
                              <Bell className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-out shadow-lg z-20">
                                Notice
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                              </span>
                            </button>

                            {canDeleteUser(user) && emp.email !== user.email && emp.id !== user.employeeId && emp.id !== user.id && (
                              <button
                                type="button"
                                id={`btn-dash-remove-${emp.id}`}
                                onClick={() => setRemovingEmpDashboard(emp)}
                                aria-label="Remove"
                                className="group relative inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 hover:border-rose-300 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-out shadow-lg z-20">
                                  Remove
                                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                </span>
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
          {/* â•â•â• EMPLOYEE STAT CARDS â•â•â• */}
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

          {/* â•â•â• EMPLOYEE PANELS GRID â•â•â• */}
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
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


    </div>
  );
};

