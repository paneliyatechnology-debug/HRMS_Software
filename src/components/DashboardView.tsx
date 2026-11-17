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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord } from '../types/hrms';
import { api } from '../lib/api';
import { getRoleDefinition } from '../lib/roleConfig';
import { ChangeRoleModal } from './modals/ChangeRoleModal';
import { TrackedHoursChart } from './attendance/TrackedHoursChart';
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
import { useWorkSession } from '../context/WorkSessionContext';

function formatDisplayName(first?: string, last?: string): string {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!l || f.toLowerCase() === l.toLowerCase() || f.toLowerCase().includes(l.toLowerCase())) return f;
  if (l.toLowerCase().includes(f.toLowerCase())) return l;
  return `${f} ${l}`;
}

interface DashboardViewProps {
  stats: any;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
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
  stats,
  employees,
  leaves,
  attendance,
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
    liveBreakWords,
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

  // Real announcements, holidays, and leave balance states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchExtraData = async () => {
      try {
        const [annRes, holRes] = await Promise.all([
          api.getAnnouncements(),
          api.getHolidays(),
        ]);
        if (isMounted) {
          setAnnouncements(Array.isArray(annRes) ? annRes : []);
          setHolidays(Array.isArray(holRes) ? holRes : []);
        }
      } catch (err) {
        console.warn('DashboardView fetch extra data notice:', err);
      }

      if (portalMode !== 'admin' && activeEmpId && activeEmpId !== 'emp-self') {
        try {
          const bal = await api.getLeaveBalances(activeEmpId);
          if (isMounted) setLeaveBalances(bal);
        } catch (_) {}
      }
    };
    fetchExtraData();
    return () => {
      isMounted = false;
    };
  }, [portalMode, activeEmpId]);

  // Set of all identifier keys for this employee to match attendance records accurately
  const myCandidateIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeEmpId) ids.add(activeEmpId.toLowerCase());
    if (currentEmp?.id) ids.add(currentEmp.id.toLowerCase());
    if (user?.id) ids.add(user.id.toLowerCase());
    if (user?.employeeId) ids.add(user.employeeId.toLowerCase());
    if (currentEmp?.employeeCode) ids.add(currentEmp.employeeCode.toLowerCase());
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

  // Real employee recent attendance (last 5 records)
  const myRecentAttendance = useMemo(() => {
    return allAttendance
      .filter((a) => myCandidateIds.has((a.employeeId || '').toLowerCase()))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);
  }, [allAttendance, myCandidateIds]);

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
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; empName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Operational requirements');

  const handleDashboardApproveLeave = async (id: string, empName: string, leaveType: string, empId?: string) => {
    setProcessingLeaveId(id);
    try {
      await api.approveLeave(id, user?.role || 'HR', 'HR', 'Approved from Dashboard');
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
      await api.rejectLeave(id, 'HR Administration', rejectReason || 'Operational requirements');
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
      rejectModalData ||
      removingEmpDashboard ||
      noticeTargetEmpDashboard
    );

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (checkOutModalOpen) setCheckOutModalOpen(false);
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
  }, [checkOutModalOpen, rejectModalData, removingEmpDashboard, noticeTargetEmpDashboard]);

  const [roleTargetEmpDash, setRoleTargetEmpDash] = useState<Employee | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const empRoleDef = getRoleDefinition(currentEmp?.role || 'EMPLOYEE');

  const handleConfirmRemoveEmpDashboard = async () => {
    if (!removingEmpDashboard) return;
    setRemoveEmpLoading(true);
    try {
      const empIdToDelete = removingEmpDashboard.id || (removingEmpDashboard as any).employeeId || '';
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

  return (
    <div className="space-y-5 pb-12 w-full max-w-full overflow-hidden">
      {/* Welcome & Section Head (Admin Only) */}
      {portalMode === 'admin' && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {currentDateString} &bull; Admin workspace
            </div>
            <h1 className="text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight mt-0.5">
              hello, {user.firstName || 'Admin'}! 👋
            </h1>
            <div className="text-xs text-slate-500 mt-0.5">
              Here&apos;s what&apos;s happening across your workspace today.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateModule('announcements')}
              className="btn-primary"
            >
              ＋ View announcements
            </button>
          </div>
        </div>
      )}

      {portalMode === 'admin' ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => onNavigateModule('employees')}
              className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Employees</span>
                <span className="text-lg font-bold text-slate-900 block leading-tight">{employees.length}</span>
                <span className="text-[10px] text-slate-400 font-medium">Active workforce</span>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('attendance')}
              className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Present Today</span>
                <span className="text-lg font-bold text-slate-900 block leading-tight">{todayRecords.length}</span>
                <span className="text-[10px] text-slate-400 font-medium">{activeWorkingCount} working, {onBreakCount} break</span>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('leaves')}
              className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Leaves</span>
                <span className="text-lg font-bold text-slate-900 block leading-tight">{pendingLeaves.length}</span>
                <span className="text-[10px] text-slate-400 font-medium">Need review</span>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('chat')}
              className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Team Hub</span>
                <span className="text-lg font-bold text-slate-900 block leading-tight">{employees.length > 0 ? 'Active' : '—'}</span>
                <span className="text-[10px] text-slate-400 font-medium">Real-time collaboration</span>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid (1.2fr 1fr .9fr on desktop) */}
          <div className="dashboard-grid">
            {/* Panel 1: Attendance Overview (7 Days Chart) */}
            <section className="panel md:col-span-2">
              <h3>
                <span className="flex items-center gap-2">
                  <span className="text-base">📊</span> Attendance Rate &amp; Turnout
                </span>
                <span className="tag">Last 7 Days</span>
              </h3>
              <div className="flex items-end gap-2 sm:gap-3 h-[165px] px-2 pt-4 pb-2 border-b border-slate-100">
                {sevenDaysData.map((item: { day: string; date: string; val: number; count: string; isToday: boolean }, idx: number) => (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group cursor-pointer">
                    <div className="text-[10px] text-slate-800 font-mono font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shadow-2xs">
                      {item.val}%
                    </div>
                    <div
                      style={{ height: `${Math.max(4, item.val)}%` }}
                      className={`w-full max-w-[42px] rounded-t-lg transition-all shadow-xs ${item.isToday
                          ? 'bg-gradient-to-t from-emerald-700 to-emerald-500 ring-2 ring-emerald-500/50'
                          : 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-110'
                        }`}
                      title={item.count}
                    />
                    <small
                      className={`text-[11px] font-bold mt-1 ${item.isToday ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                    >
                      {item.day}
                    </small>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                <span className="font-medium">
                  <strong className="text-slate-900">{todayRecords.length}</strong> checked-in out of{' '}
                  <strong className="text-slate-900">{employees.length}</strong> team members today
                </span>
                <button
                  onClick={() => onNavigateModule('attendance')}
                  className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open Timesheets &rarr;
                </button>
              </div>
            </section>

            {/* Panel 2: Announcements */}
            <section className="panel">
              <h3>
                <span className="flex items-center gap-2">
                  <span>📣</span> Announcements
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
                        <strong className="text-xs text-slate-900 truncate">{item.title}</strong>
                        <span className={`tag ${item.priority === 'High' || item.priority === 'Urgent' ? 'orange' : 'green'}`}>
                          {item.priority || 'Notice'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Panel 3: Quick Actions */}
            <section className="panel">
              <h3>
                <span className="flex items-center gap-2">
                  <span>⚡</span> Quick actions
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => onNavigateModule('leaves')}
                  className="btn-secondary justify-center py-2.5"
                >
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <span>Leave requests</span>
                </button>
                <button
                  onClick={onOpenAddEmployeeModal}
                  className="btn-secondary justify-center py-2.5"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>Add staff</span>
                </button>
                <button
                  onClick={() => onNavigateModule('calendar')}
                  className="btn-secondary justify-center py-2.5"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Holidays</span>
                </button>
                <button
                  onClick={() => onNavigateModule('reports')}
                  className="btn-secondary justify-center py-2.5"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Analytics</span>
                </button>
              </div>
            </section>

            {/* Panel 4: Pending Approvals */}
            <section className="panel md:col-span-2">
              <h3>
                <span className="flex items-center gap-2">
                  <span>✅</span> Pending leave approvals ({pendingLeaves.length})
                </span>
                <button
                  onClick={() => onNavigateModule('leaves')}
                  className="btn-ghost text-xs"
                >
                  Review all
                </button>
              </h3>

              {pendingLeaves.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No leave requests currently pending review.
                </div>
              ) : (
                <div className="space-y-1">
                  {pendingLeaves.slice(0, 3).map((leave, leaveIdx) => {
                    const isProcessing = processingLeaveId === leave.id;
                    return (
                      <div
                        key={leave.id ? `${leave.id}-${leaveIdx}` : leaveIdx}
                        className="item flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs text-slate-900">
                              {leave.employeeName}
                            </strong>
                            <span className="tag orange">
                              {leave.leaveType}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''} ({leave.daysCount}d)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Reason: <span className="text-slate-900 font-medium">&ldquo;{leave.reason}&rdquo;</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleDashboardApproveLeave(leave.id, leave.employeeName, leave.leaveType, leave.employeeId)}
                            disabled={isProcessing}
                            className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {isProcessing ? 'Saving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName, leave.employeeId)}
                            disabled={isProcessing}
                            className="btn-danger text-xs py-1.5 px-3"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Live Staff Attendance & Real-Time Activity Directory */}
          <div className="panel space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  Staff Directory &amp; Live Time Tracking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live status, recorded punches, and direct messaging
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateModule('attendance')}
                  className="btn-ghost text-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Timesheets</span>
                </button>
                <button
                  onClick={onOpenAddEmployeeModal}
                  className="btn-primary text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </button>
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
                      <td colSpan={8} className="py-10 text-center text-xs text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Users className="w-8 h-8 text-emerald-500/50" />
                          <p className="font-bold text-slate-900">No employees in this company yet</p>
                          <p className="text-[11px] text-slate-500">Click &ldquo;+ Add Employee&rdquo; above to onboard your staff members.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => {
                    const todayRec = getTodayRecordForEmployee(emp.id);
                    const isWorking = todayRec && !todayRec.isCompleted && !todayRec.isOnBreak;
                    const isOnBreak = todayRec && !todayRec.isCompleted && todayRec.isOnBreak;
                    const isDone = todayRec && todayRec.isCompleted;

                    const liveSecs = todayRec ? getLiveActiveSeconds(todayRec) : 0;
                    const breakSecs = todayRec ? getLiveBreakSeconds(todayRec) : 0;

                    return (
                      <tr
                        key={emp.id ? `${emp.id}-${index}` : index}
                        onClick={() => onSelectEmployee(emp)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.firstName?.[0] || 'E'}
                            </div>
                            <span className="truncate">{emp.firstName} {emp.lastName}</span>
                          </div>
                        </td>
                        <td className="text-slate-500 font-mono text-xs">{emp.employeeCode}</td>
                        <td className="text-slate-900 truncate">{emp.designationTitle || 'Staff'}</td>
                        <td className="text-slate-500 font-mono text-xs">
                          {todayRec?.checkIn ? (
                            <span>
                              {todayRec.checkIn} {todayRec.checkOut ? `– ${todayRec.checkOut}` : '– Active'}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="font-mono font-bold text-slate-900 text-xs">
                          {todayRec ? formatSecondsToWords(liveSecs) : '—'}
                        </td>
                        <td className="text-slate-500 font-mono text-xs">
                          {breakSecs > 0 ? formatSecondsToWords(breakSecs) : '0s'}
                        </td>
                        <td>
                          {isWorking ? (
                            <span className="tag green">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Working
                            </span>
                          ) : isOnBreak ? (
                            <span className="tag orange">
                              <Pause className="w-3 h-3 text-amber-500" />
                              On Break
                            </span>
                          ) : isDone ? (
                            <span className="tag">
                              <Check className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                            <span className="tag">
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
                              className="btn-ghost text-xs py-1 px-2.5 text-emerald-600 hover:text-emerald-700"
                              title="Chat with employee"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chat</span>
                            </button>

                            <button
                              id={`btn-dash-role-${emp.id}`}
                              onClick={() => setRoleTargetEmpDash(emp)}
                              className="btn-secondary text-xs py-1 px-2.5 text-slate-700 hover:bg-slate-100"
                              title="Change employee role"
                            >
                              <Shield className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Role</span>
                            </button>

                            <button
                              id={`btn-dash-notice-${emp.id}`}
                              onClick={() => handleOpenNoticeModalDashboard(emp)}
                              className="btn-secondary text-xs py-1 px-2.5 text-amber-700 hover:bg-amber-50"
                              title="Send notice to employee"
                            >
                              <Bell className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Notice</span>
                            </button>

                            {emp.email !== user.email && emp.id !== user.employeeId && emp.id !== user.id && (
                              <button
                                id={`btn-dash-remove-${emp.id}`}
                                onClick={() => setRemovingEmpDashboard(emp)}
                                className="btn-danger text-xs py-1 px-2"
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
        </div>
      ) : (
        /* ============================================================== */
        /* EMPLOYEE SELF-SERVICE VIEW (HIGH-CLARITY & SIMPLE)             */
        /* ============================================================== */
        <div className="space-y-5">

          {/* ═══ 1. HERO BANNER ═══ */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #062d1f 0%, #0a3d2b 45%, #041d14 100%)' }}>
            {/* Animated glow blobs */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2), transparent 70%)' }} />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15), transparent 70%)' }} />

            <div className="relative z-10 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Employee info */}
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md border border-white/20 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669, #047857)' }}>
                    {currentEmp?.avatarUrl ? (
                      <img src={currentEmp.avatarUrl} alt={currentEmp.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentEmp?.firstName?.[0] || 'E'}{currentEmp?.lastName?.[0] || ''}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#062d1f] flex items-center justify-center"
                    style={{ background: currentStatus === 'working' ? '#10b981' : currentStatus === 'on_break' ? '#f59e0b' : currentStatus === 'completed' ? '#059669' : '#4e6a5d' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-emerald-200 border border-white/15 font-mono uppercase tracking-wide">
                      {currentEmp?.employeeCode || 'EMP-1'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${empRoleDef.badgeClass}`}>
                      <Shield className="w-2.5 h-2.5" />
                      {empRoleDef.label}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {formatDisplayName(currentEmp?.firstName || user.firstName, currentEmp?.lastName || user.lastName)}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-emerald-300 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-white">{currentEmp?.designationTitle || 'Staff Member'}</span>
                    <span className="text-emerald-500">•</span>
                    <span>{currentEmp?.departmentName || 'Engineering'}</span>
                    <span className="text-emerald-500">•</span>
                    <span className="text-emerald-300 font-medium">{currentEmp?.shift || 'General Shift'}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button id="btn-emp-apply-leave" onClick={onOpenLeaveModal}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 active:scale-95 text-[#065f46] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                  Apply Leave
                </button>
                <button id="btn-emp-payslips" onClick={() => onNavigateModule('payslips')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
                  <Receipt className="w-3.5 h-3.5 text-emerald-300" />
                  My Payslips
                </button>
                <button id="btn-emp-chat" onClick={() => onNavigateModule('chat')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Team Chat
                </button>
                <button id="btn-emp-profile" onClick={() => onSelectEmployee(currentEmp)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
                  <User className="w-3.5 h-3.5" />
                  My Profile
                </button>
              </div>
            </div>
          </div>

          {/* ═══ 2. STAT CARDS ═══ */}
          {(() => {
            const myLeaves = leaves.filter((l) => {
              const eId = currentEmp?.id || user?.employeeId || user?.id || '';
              const eEmail = currentEmp?.email?.toLowerCase() || user?.email?.toLowerCase() || '';
              const eName = `${currentEmp?.firstName || user?.firstName || ''} ${currentEmp?.lastName || user?.lastName || ''}`.trim().toLowerCase();
              if (eId && l.employeeId === eId) return true;
              if (eEmail && (l as any).employeeEmail?.toLowerCase() === eEmail) return true;
              if (eName && l.employeeName?.toLowerCase() === eName) return true;
              return false;
            });
            const empTakenDays = myLeaves
              .filter((l) => (l.status || '').toLowerCase() === 'approved')
              .reduce((sum, l) => sum + (Number(l.daysCount) || 1), 0);
            const empTotalQuota = 36;
            const empLeftDays = Math.max(0, empTotalQuota - empTakenDays);

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Stat 1: Attendance status */}
                <div className="relative bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 sm:p-3.5 overflow-hidden hover:border-emerald-300 hover:shadow-xs transition-all">
                  <div className="h-0.5 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: currentStatus === 'working' ? 'linear-gradient(90deg,#10b981,#34d399)' : currentStatus === 'on_break' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : currentStatus === 'completed' ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#94a3b8,#cbd5e1)' }} />
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${currentStatus === 'working' ? 'bg-emerald-50 text-emerald-600' : currentStatus === 'on_break' ? 'bg-amber-50 text-amber-600' : currentStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Today's Status</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{currentStatus === 'working' ? 'Working' : currentStatus === 'on_break' ? 'On Break' : currentStatus === 'completed' ? 'Shift Done' : 'Not Checked In'}</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{currentStatus === 'working' ? liveWorkedHMS : currentStatus === 'completed' ? `${todaySummary?.totalDurationFormatted || liveWorkedHMS || 'Completed'}` : '09:30 AM start'}</p>
                    </div>
                  </div>
                </div>

                {/* Stat 2: Leave Balance */}
                <div onClick={onOpenLeaveModal} className="relative bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 sm:p-3.5 overflow-hidden hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer">
                  <div className="h-0.5 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Leave Balance</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{empLeftDays} Days Left</p>
                      <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">{empTakenDays} Taken • {empLeftDays} Left</p>
                    </div>
                  </div>
                </div>

                {/* Stat 3: Salary & Payslips */}
                <div onClick={() => onNavigateModule('payslips')} className="relative bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 sm:p-3.5 overflow-hidden hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer">
                  <div className="h-0.5 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Salary & Payslips</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{currentEmp?.salary?.net ? `₹${currentEmp.salary.net.toLocaleString()}` : '—'}</p>
                      <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">View Payslips &rarr;</p>
                    </div>
                  </div>
                </div>

                {/* Stat 4: Manager */}
                <div onClick={() => currentEmp?.reportingManagerId ? onOpenChatWithEmployee?.(currentEmp.reportingManagerId) : undefined} className="relative bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 sm:p-3.5 overflow-hidden hover:border-amber-200 hover:shadow-xs transition-all cursor-pointer">
                  <div className="h-0.5 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Reports To</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{currentEmp?.reportingManagerName || 'Not assigned'}</p>
                      <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium">Tap to Chat</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ 3. PUNCH CONSOLE + SIDEBAR ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Unified Daily Shift Console */}
            <div className="lg:col-span-7">
              <DailyShiftConsole />
            </div>

            {/* Right 5 Cols: Profile + Workplace Cards */}
            <div className="lg:col-span-5 space-y-4">

              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg,#10b981,#059669,#047857)' }} />
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-xs shrink-0"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      {currentEmp?.firstName?.[0] || 'E'}{currentEmp?.lastName?.[0] || ''}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">{formatDisplayName(currentEmp?.firstName, currentEmp?.lastName)}</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{currentEmp?.designationTitle} • {currentEmp?.departmentName}</p>
                      <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 mt-0.5">Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Employee ID</p>
                      <p className="font-bold text-slate-900 font-mono text-[11px] mt-0.5">{currentEmp?.employeeCode}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Work Shift</p>
                      <p className="font-bold text-slate-900 text-[11px] mt-0.5 truncate">09:30 – 18:30</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <button onClick={() => onSelectEmployee(currentEmp)}
                      className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-center transition-colors hover:opacity-90 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff' }}>My Profile</button>
                    <button onClick={() => onNavigateModule('documents')}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold text-xs text-center transition-colors cursor-pointer">Documents</button>
                  </div>
                </div>
              </div>

              {/* Employment Details Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Workplace Info</h4>
                        <p className="text-[9px] text-slate-400">Employment details</p>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">Active</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { label: 'Work Location', value: currentEmp?.workLocationName || 'Corporate HQ' },
                      { label: 'Employment Type', value: currentEmp?.employmentType || 'Full-time' },
                      { label: 'Joined On', value: currentEmp?.joiningDate ? new Date(currentEmp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-colors">
                        <span className="text-slate-500 text-[11px] font-medium">{label}</span>
                        <span className="font-semibold text-slate-900 text-[11px] text-right max-w-[120px] truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onNavigateModule('organization')}
                    className="w-full mt-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:opacity-90 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff' }}>
                    <Building2 className="w-3.5 h-3.5" />
                    About Organisation
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ═══ 4. ATTENDANCE HISTORY + LEAVE/HOLIDAYS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7: Attendance table */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
              <div className="p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        My Recent Attendance (Last 5 Days)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Your daily punch in/out timestamps and worked duration summary.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateModule('attendance')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Full Log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-3 rounded-l-xl">DATE & DAY</th>
                        <th className="py-2.5 px-3">CHECK IN</th>
                        <th className="py-2.5 px-3">CHECK OUT</th>
                        <th className="py-2.5 px-3">BREAK</th>
                        <th className="py-2.5 px-3">WORKED</th>
                        <th className="py-2.5 px-3 text-right rounded-r-xl">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myRecentAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No attendance history recorded yet. Punch in to begin tracking your work hours!
                          </td>
                        </tr>
                      ) : (
                        myRecentAttendance.map((rec: any) => {
                          const recDate = new Date(rec.date);
                          const dayName = rec.date === getTodayDateString() ? 'Today' : recDate.toLocaleDateString('en-US', { weekday: 'long' });
                          const formattedDate = recDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                          const workedStr = rec.workingHours ? `${rec.workingHours} hrs` : (rec.date === getTodayDateString() && currentStatus === 'working' ? liveWorkedHMS : '—');
                          const bSecs = getLiveBreakSeconds(rec);
                          const breakStr = rec.formattedTotalBreak || (bSecs > 0 ? formatSecondsToWords(bSecs) : rec.breakDurationMinutes ? `${rec.breakDurationMinutes}m` : '0m');

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900">
                                <div>{dayName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{formattedDate}</div>
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-700">{rec.checkIn || '—'}</td>
                              <td className="py-3 px-3 font-medium text-slate-700">{rec.checkOut || '—'}</td>
                              <td className="py-3 px-3 text-slate-500">{breakStr}</td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">{workedStr}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  rec.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
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
              </div></div>

            {/* Right 5: Leave + Holidays */}
            <div className="lg:col-span-5 space-y-4">
              {/* Leave Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                <div className="p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">Leave Quota & Balances</h4>
                    <button
                      onClick={onOpenLeaveModal}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      + Apply Leave
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Casual</span>
                      <span className="text-lg font-black text-blue-700 block mt-0.5">
                        {leaveBalances?.casualLeave?.remaining != null ? `${leaveBalances.casualLeave.remaining} Left` : '—'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {leaveBalances?.casualLeave?.total != null ? `of ${leaveBalances.casualLeave.total} Total` : 'Standard Quota'}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Sick</span>
                      <span className="text-lg font-black text-emerald-700 block mt-0.5">
                        {leaveBalances?.sickLeave?.remaining != null ? `${leaveBalances.sickLeave.remaining} Left` : '—'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {leaveBalances?.sickLeave?.total != null ? `of ${leaveBalances.sickLeave.total} Total` : 'Standard Quota'}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual</span>
                      <span className="text-lg font-black text-purple-700 block mt-0.5">
                        {leaveBalances?.paidLeave?.remaining != null ? `${leaveBalances.paidLeave.remaining} Left` : '—'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {leaveBalances?.paidLeave?.total != null ? `of ${leaveBalances.paidLeave.total} Total` : 'Standard Quota'}
                      </span>
                    </div>
                  </div>
                </div></div>

              {/* Upcoming Holidays */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444)' }} />
                <div className="p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">Upcoming Holidays</h4>
                    <button
                      onClick={() => onNavigateModule('calendar')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
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
                              <span className="text-base">📅</span>
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
                </div></div>
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Check Out for Today?</h3>
                <p className="text-xs text-slate-500">Attendance shift finalization</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once checked out, today’s work shift is locked and finalized. You will not be able to punch in again until tomorrow.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-checkout"
                type="button"
                onClick={() => setCheckOutModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-checkout"
                type="button"
                onClick={executeCheckOut}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Finalizing...' : 'Confirm Check Out'}
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Reject Leave Request ({rejectModalData.empName})
              </h3>
              <button
                onClick={() => setRejectModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Rejection Reason (Shared with Employee)
              </label>
              <textarea
                id="reject-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-reject-leave"
                type="button"
                onClick={() => setRejectModalData(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-leave"
                type="button"
                onClick={executeRejectLeave}
                disabled={processingLeaveId === rejectModalData.id}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Employee?</h3>
                <p className="text-xs text-slate-500">Staff roster modification</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{removingEmpDashboard.firstName} {removingEmpDashboard.lastName}</strong> ({removingEmpDashboard.employeeCode}) from the staff roster?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-dash-remove-emp"
                type="button"
                onClick={() => setRemovingEmpDashboard(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-remove-emp"
                type="button"
                onClick={handleConfirmRemoveEmpDashboard}
                disabled={removeEmpLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Send Notice
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                      Direct Notice
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    To: <strong className="text-slate-700">{noticeTargetEmpDashboard.firstName} {noticeTargetEmpDashboard.lastName}</strong> ({noticeTargetEmpDashboard.employeeCode} • {noticeTargetEmpDashboard.departmentName || 'Staff'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Notice Subject / Title *
                </label>
                <input
                  id="input-dash-notice-title"
                  type="text"
                  value={dashNoticeTitle}
                  onChange={(e) => setDashNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Urgent Task, HR Note..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Urgency / Priority Level
                </label>
                <select
                  id="select-dash-notice-priority"
                  value={dashNoticePriority}
                  onChange={(e) => setDashNoticePriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
                >
                  <option value="Low">🟢 Low Priority (General Notice)</option>
                  <option value="Medium">🔵 Medium Priority (Standard Notice)</option>
                  <option value="High">🟠 High Priority (Action Required)</option>
                  <option value="Urgent">🔴 Urgent Notice (Immediate Attention)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Notice Content *
                </label>
                <textarea
                  id="textarea-dash-notice-content"
                  rows={4}
                  value={dashNoticeContent}
                  onChange={(e) => setDashNoticeContent(e.target.value)}
                  placeholder="Type the message for the employee..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <button
                id="btn-cancel-dash-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-send-notice"
                type="button"
                onClick={handleConfirmSendNoticeDashboard}
                disabled={dashNoticeLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
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

