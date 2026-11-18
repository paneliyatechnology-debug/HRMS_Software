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
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';
import {
  WidgetCardWrapper,
  WidgetDropZone,
  WidgetGallerySidebar,
  DashboardWidgetDef,
} from './dashboard/DashboardWidgetShell';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord } from '../types/hrms';
import { api } from '../lib/api';
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
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

  // Real announcements, holidays, and admin-configured leave quota/balance states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaveQuotaData, setLeaveQuotaData] = useState<RawLeaveQuotaPayload | null>(null);
  const [leaveQuotaLoading, setLeaveQuotaLoading] = useState<boolean>(portalMode !== 'admin');

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
        const payload = await fetchLeaveQuotaData(activeEmpId);
        if (isMounted) setLeaveQuotaData(payload);
      } catch (_) { }
    };

    window.addEventListener('hrms_settings_updated', handleLeaveQuotaSync);
    window.addEventListener('hrms_leaves_updated', handleLeaveQuotaSync);
    return () => {
      isMounted = false;
      window.removeEventListener('hrms_settings_updated', handleLeaveQuotaSync);
      window.removeEventListener('hrms_leaves_updated', handleLeaveQuotaSync);
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

  // Merge real backend attendance prop with live session attendance records (deduplicated by date + employeeId)
  const mergedAttendance = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const rec of allAttendance) {
      const key = `${(rec.employeeId || rec.id || '').toLowerCase()}__${rec.date}`;
      map.set(key, rec);
    }
    for (const rec of attendance) {
      const key = `${(rec.employeeId || rec.id || '').toLowerCase()}__${rec.date}`;
      if (!map.has(key)) {
        map.set(key, rec);
      }
    }
    return Array.from(map.values());
  }, [attendance, allAttendance]);

  // Real employee full attendance history (for 7d/14d daily graph)
  const myAllAttendance = useMemo(() => {
    return mergedAttendance
      .filter((a) => myCandidateIds.has((a.employeeId || '').toLowerCase()))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [mergedAttendance, myCandidateIds]);

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
  const approvedLeavesCount = leaves.filter((l) => (l.status || '').toLowerCase() === 'approved').length;

  // =========================================================================
  // TEMPORARY MOBILE-STYLE WIDGET CUSTOMIZER (IN-MEMORY ONLY — NO STORAGE)
  // =========================================================================
  const DEFAULT_ADMIN_KPIS = ['kpi_employees', 'kpi_present', 'kpi_pending_leaves', 'kpi_team_hub'];
  const DEFAULT_ADMIN_PANELS = [
    'panel_attendance_graph',
    'panel_announcements',
    'panel_pending_approvals',
    'panel_staff_directory',
  ];
  const DEFAULT_EMP_KPIS = ['emp_kpi_status', 'emp_kpi_leave', 'emp_kpi_salary', 'emp_kpi_manager'];
  const DEFAULT_EMP_PANELS = [
    'emp_panel_shift_console',
    'emp_panel_recent_attendance',
    'emp_panel_attendance_graph',
    'emp_panel_leave_breakdown',
    'emp_panel_holidays',
  ];

  const [widgetEditMode, setWidgetEditMode] = useState(false);
  const [adminKpiOrder, setAdminKpiOrder] = useState<string[]>(DEFAULT_ADMIN_KPIS);
  const [adminPanelOrder, setAdminPanelOrder] = useState<string[]>(DEFAULT_ADMIN_PANELS);
  const [empKpiOrder, setEmpKpiOrder] = useState<string[]>(DEFAULT_EMP_KPIS);
  const [empPanelOrder, setEmpPanelOrder] = useState<string[]>(DEFAULT_EMP_PANELS);

  const adminWidgetDefs: DashboardWidgetDef[] = [
    { id: 'kpi_employees', title: 'Total Employees', description: 'Active workforce count', group: 'kpi', icon: <Users className="w-4 h-4" /> },
    { id: 'kpi_present', title: 'Present Today', description: 'Live working & break staff', group: 'kpi', icon: <Clock className="w-4 h-4" /> },
    { id: 'kpi_pending_leaves', title: 'Pending Leaves', description: 'Requests awaiting review', group: 'kpi', icon: <Shield className="w-4 h-4" /> },
    { id: 'kpi_team_hub', title: 'Team Hub', description: 'Quick link to team chat', group: 'kpi', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'kpi_holidays', title: 'Upcoming Holidays', description: 'Scheduled holiday count', group: 'kpi', icon: <Calendar className="w-4 h-4" /> },
    { id: 'kpi_approved_leaves', title: 'Approved Leaves', description: 'Total approved leave requests', group: 'kpi', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'panel_attendance_graph', title: 'Attendance Graph', description: '7 & 14 day workforce chart', group: 'panel', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'panel_announcements', title: 'Announcements', description: 'Latest company notices', group: 'panel', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'panel_pending_approvals', title: 'Pending Leave Approvals', description: '1-click Approve / Reject queue', group: 'panel', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'panel_staff_directory', title: 'Staff Directory & Tracking', description: 'Live shift status & messaging', group: 'panel', icon: <Users className="w-4 h-4" /> },
    { id: 'panel_upcoming_holidays', title: 'Upcoming Holidays List', description: 'Upcoming company holidays', group: 'panel', icon: <Calendar className="w-4 h-4" /> },
  ];

  const empWidgetDefs: DashboardWidgetDef[] = [
    { id: 'emp_kpi_status', title: "Today's Status", description: 'Live shift status & timer', group: 'kpi', icon: <Clock className="w-4 h-4" /> },
    { id: 'emp_kpi_leave', title: 'Leave Balance', description: 'Remaining & used leave days', group: 'kpi', icon: <Shield className="w-4 h-4" /> },
    { id: 'emp_kpi_salary', title: 'Salary & Payslips', description: 'Net salary & payslip shortcut', group: 'kpi', icon: <Receipt className="w-4 h-4" /> },
    { id: 'emp_kpi_manager', title: 'Reports To', description: 'Reporting manager & quick chat', group: 'kpi', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'emp_kpi_holidays', title: 'Upcoming Holidays', description: 'Next holiday count', group: 'kpi', icon: <Calendar className="w-4 h-4" /> },
    { id: 'emp_panel_shift_console', title: 'Daily Shift Console', description: 'Clock in, break & clock out', group: 'panel', icon: <Clock className="w-4 h-4" /> },
    { id: 'emp_panel_recent_attendance', title: 'My Recent Attendance', description: 'Recent daily timestamps table', group: 'panel', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'emp_panel_attendance_graph', title: 'Daily Attendance Analysis', description: 'Graphical daily hours chart', group: 'panel', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'emp_panel_leave_breakdown', title: 'Leave Quota & Balances', description: 'Casual, Sick & Annual quota', group: 'panel', icon: <Shield className="w-4 h-4" /> },
    { id: 'emp_panel_holidays', title: 'Upcoming Holidays', description: 'Upcoming company holiday dates', group: 'panel', icon: <Calendar className="w-4 h-4" /> },
    { id: 'emp_panel_announcements', title: 'Company Announcements', description: 'Latest HR notices & circulars', group: 'panel', icon: <Megaphone className="w-4 h-4" /> },
  ];

  const handleAddWidget = (id: string, group: 'kpi' | 'panel') => {
    if (portalMode === 'admin') {
      if (group === 'kpi') setAdminKpiOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
      else setAdminPanelOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      if (group === 'kpi') setEmpKpiOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
      else setEmpPanelOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const handleRemoveWidget = (id: string, group: 'kpi' | 'panel') => {
    if (portalMode === 'admin') {
      if (group === 'kpi') setAdminKpiOrder((prev) => prev.filter((item) => item !== id));
      else setAdminPanelOrder((prev) => prev.filter((item) => item !== id));
    } else {
      if (group === 'kpi') setEmpKpiOrder((prev) => prev.filter((item) => item !== id));
      else setEmpPanelOrder((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleDropWidget = (
    payload: string,
    targetId: string | null,
    targetGroup: 'kpi' | 'panel'
  ) => {
    const parts = payload.split(':');
    if (parts.length !== 3) return;
    const [origin, sourceGroupRaw, sourceId] = parts;
    const sourceGroup = sourceGroupRaw as 'kpi' | 'panel';

    const updateList = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter((prev) => {
        if (origin === 'gallery') {
          if (prev.includes(sourceId)) return prev;
          if (targetId && sourceGroup === targetGroup) {
            const idx = prev.indexOf(targetId);
            if (idx !== -1) {
              const copy = [...prev];
              copy.splice(idx, 0, sourceId);
              return copy;
            }
          }
          return [...prev, sourceId];
        }
        // Reordering existing board widgets within the same group
        if (sourceGroup !== targetGroup) return prev;
        if (!targetId || sourceId === targetId) return prev;
        const fromIdx = prev.indexOf(sourceId);
        const toIdx = prev.indexOf(targetId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        return copy;
      });
    };

    if (portalMode === 'admin') {
      updateList(sourceGroup === 'kpi' ? setAdminKpiOrder : setAdminPanelOrder);
    } else {
      updateList(sourceGroup === 'kpi' ? setEmpKpiOrder : setEmpPanelOrder);
    }
  };

  const handleResetWidgets = () => {
    if (portalMode === 'admin') {
      setAdminKpiOrder(DEFAULT_ADMIN_KPIS);
      setAdminPanelOrder(DEFAULT_ADMIN_PANELS);
    } else {
      setEmpKpiOrder(DEFAULT_EMP_KPIS);
      setEmpPanelOrder(DEFAULT_EMP_PANELS);
    }
  };

  const currentWidgetDefs = portalMode === 'admin' ? adminWidgetDefs : empWidgetDefs;
  const currentActiveWidgetIds =
    portalMode === 'admin'
      ? [...adminKpiOrder, ...adminPanelOrder]
      : [...empKpiOrder, ...empPanelOrder];

  return (
    <div className={`space-y-5 w-full overflow-x-clip transition-all duration-200 ${widgetEditMode ? 'lg:pr-[332px]' : ''}`}>
      {/* Welcome & Section Head (Admin Only) */}
      {portalMode === 'admin' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
          <div>
            <h1
              className="text-2xl sm:text-[30px] leading-tight tracking-[-0.03em] flex items-baseline gap-1.5 flex-wrap"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              <span
                className="font-bold"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #081c15 0%, #1b4332 45%, #40916c 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Hello,
              </span>
              <span
                className="font-bold"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #081c15 0%, #1b4332 45%, #40916c 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {user.firstName || 'Admin'}!
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {widgetEditMode && (
              <button
                type="button"
                onClick={handleResetWidgets}
                className="btn-ghost text-xs"
                title="Restore default dashboard widgets"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              id="btn-toggle-dashboard-widgets"
              type="button"
              onClick={() => setWidgetEditMode((prev) => !prev)}
              className={
                widgetEditMode
                  ? 'btn-primary'
                  : 'btn-secondary'
              }
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{widgetEditMode ? 'Done Editing' : 'Edit Widgets'}</span>
            </button>
            <button
              onClick={() => onNavigateModule('announcements')}
              className="btn-primary"
            >
              ＋ View announcements
            </button>
          </div>
        </div>
      )}

      {/* Employee Welcome & Widget Customizer Bar */}
      {portalMode !== 'admin' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
          <div>
            <h1 className="hrms-page-title">
              Hello, {user.firstName || 'Employee'}!
            </h1>
            {widgetEditMode && (
              <p className="text-xs font-semibold text-[#1b4332] mt-1">
                Widget Edit Mode — drag cards to reorder, click &times; to remove, or drag new widgets from the right panel.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {widgetEditMode && (
              <button
                type="button"
                onClick={handleResetWidgets}
                className="btn-ghost text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              id="btn-toggle-emp-dashboard-widgets"
              type="button"
              onClick={() => setWidgetEditMode((prev) => !prev)}
              className={widgetEditMode ? 'btn-primary' : 'btn-secondary'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{widgetEditMode ? 'Done Editing' : 'Edit Widgets'}</span>
            </button>
          </div>
        </div>
      )}

      {portalMode === 'admin' ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-5">
          {/* Editable KPI Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {adminKpiOrder.map((kpiId) => {
              if (kpiId === 'kpi_employees') {
                return (
                  <WidgetCardWrapper
                    key={kpiId}
                    id={kpiId}
                    title="Total Employees"
                    group="kpi"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                    onDropWidget={handleDropWidget}
                  >
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
                  </WidgetCardWrapper>
                );
              }
              if (kpiId === 'kpi_present') {
                return (
                  <WidgetCardWrapper
                    key={kpiId}
                    id={kpiId}
                    title="Present Today"
                    group="kpi"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                    onDropWidget={handleDropWidget}
                  >
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
                  </WidgetCardWrapper>
                );
              }
              if (kpiId === 'kpi_pending_leaves') {
                return (
                  <WidgetCardWrapper
                    key={kpiId}
                    id={kpiId}
                    title="Pending Leaves"
                    group="kpi"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                    onDropWidget={handleDropWidget}
                  >
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
                  </WidgetCardWrapper>
                );
              }
              if (kpiId === 'kpi_team_hub') {
                return (
                  <WidgetCardWrapper
                    key={kpiId}
                    id={kpiId}
                    title="Team Hub"
                    group="kpi"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                    onDropWidget={handleDropWidget}
                  >
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
                  </WidgetCardWrapper>
                );
              }
              if (kpiId === 'kpi_holidays') {
                return (
                  <WidgetCardWrapper
                    key={kpiId}
                    id={kpiId}
                    title="Upcoming Holidays"
                    group="kpi"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                    onDropWidget={handleDropWidget}
                  >
                    <div
                      onClick={() => onNavigateModule('calendar')}
                      className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
                    >
                      <div className="stat-icon">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <small>Upcoming Holidays</small>
                        <strong>{upcomingHolidays.length}</strong>
                        <small>Scheduled dates</small>
                      </div>
                    </div>
                  </WidgetCardWrapper>
                );
              }
              if (kpiId === 'kpi_approved_leaves') {
                return (
                  <WidgetCardWrapper
                    key={kpiId}
                    id={kpiId}
                    title="Approved Leaves"
                    group="kpi"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                    onDropWidget={handleDropWidget}
                  >
                    <div
                      onClick={() => onNavigateModule('leaves')}
                      className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
                    >
                      <div className="stat-icon">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <small>Approved Leaves</small>
                        <strong>{approvedLeavesCount}</strong>
                        <small>Total approved</small>
                      </div>
                    </div>
                  </WidgetCardWrapper>
                );
              }
              return null;
            })}

            {widgetEditMode && adminKpiOrder.length === 0 && (
              <WidgetDropZone
                group="kpi"
                label="Drop KPI Stat Cards Here"
                onDropWidget={handleDropWidget}
              />
            )}
          </div>

          {/* Editable Main Dashboard Grid (1.2fr 1fr .9fr on desktop) */}
          <div className="dashboard-grid">
            {adminPanelOrder.map((panelId) => {
              if (panelId === 'panel_attendance_graph') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Attendance Graph"
                    group="panel"
                    editMode={widgetEditMode}
                    className="md:col-span-2"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <DailyAttendanceGraph
                      mode="admin"
                      records={mergedAttendance}
                      totalEmployees={employees.length}
                      onViewFullLog={() => onNavigateModule('attendance')}
                    />
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'panel_announcements') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Announcements"
                    group="panel"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
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
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'panel_upcoming_holidays') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Upcoming Holidays"
                    group="panel"
                    editMode={widgetEditMode}
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <section className="panel h-full">
                      <h3>
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Upcoming Holidays
                        </span>
                        <button
                          onClick={() => onNavigateModule('calendar')}
                          className="btn-ghost text-xs"
                        >
                          Calendar
                        </button>
                      </h3>
                      {upcomingHolidays.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No upcoming holidays scheduled.
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs">
                          {upcomingHolidays.map((h: any) => {
                            const holDate = new Date(h.date);
                            const dateLabel = holDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', weekday: 'short' });
                            return (
                              <div key={h.id} className="item flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <strong className="text-xs text-[#212529] block truncate">{h.name}</strong>
                                  <span className="text-[10px] text-[#6c757d]">{h.type || 'Company Holiday'}</span>
                                </div>
                                <span className="tag green shrink-0">{dateLabel}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'panel_pending_approvals') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Pending Leave Approvals"
                    group="panel"
                    editMode={widgetEditMode}
                    className="col-span-full"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <section className="panel">
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
                                  </div>
                                  <p className="text-xs text-[#6c757d]">
                                    Reason: <span className="text-[#343a40] font-medium">&ldquo;{leave.reason}&rdquo;</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  <button
                                    onClick={() => handleDashboardApproveLeave(leave.id, leave.employeeName, leave.leaveType, leave.employeeId)}
                                    disabled={isProcessing}
                                    className="btn-primary text-xs py-1.5 px-3"
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
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'panel_staff_directory') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Staff Directory & Tracking"
                    group="panel"
                    editMode={widgetEditMode}
                    className="col-span-full"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <div className="panel space-y-3">
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

                                        <button
                                          id={`btn-dash-role-${emp.id}`}
                                          onClick={() => setRoleTargetEmpDash(emp)}
                                          className="btn-secondary text-xs py-1 px-2.5"
                                          title="Change employee role"
                                        >
                                          <Shield className="w-3.5 h-3.5 text-[#2d6a4f]" />
                                          <span className="hidden sm:inline">Role</span>
                                        </button>

                                        <button
                                          id={`btn-dash-notice-${emp.id}`}
                                          onClick={() => handleOpenNoticeModalDashboard(emp)}
                                          className="btn-secondary text-xs py-1 px-2.5"
                                          title="Send notice to employee"
                                        >
                                          <Bell className="w-3.5 h-3.5 text-[#2d6a4f]" />
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
                  </WidgetCardWrapper>
                );
              }

              return null;
            })}

            {widgetEditMode && (
              <WidgetDropZone
                group="panel"
                label="Drop Dashboard Panels Here"
                onDropWidget={handleDropWidget}
              />
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* EMPLOYEE SELF-SERVICE VIEW (HIGH-CLARITY & SIMPLE)             */
        /* ============================================================== */
        <div className="space-y-5">
          {/* ═══ EDITABLE EMPLOYEE STAT CARDS ═══ */}
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
            const empLeaveSummary = resolveLeaveQuotaSummary(
              leaveQuotaData?.settings ?? null,
              leaveQuotaData?.balances ?? null,
              myLeaves
            );
            const empTakenDays = empLeaveSummary.total.taken;
            const empTotalQuota = empLeaveSummary.total.quota;
            const empLeftDays = empLeaveSummary.total.available;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {empKpiOrder.map((kpiId) => {
                  if (kpiId === 'emp_kpi_status') {
                    return (
                      <WidgetCardWrapper
                        key={kpiId}
                        id={kpiId}
                        title="Today's Status"
                        group="kpi"
                        editMode={widgetEditMode}
                        onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                        onDropWidget={handleDropWidget}
                      >
                        <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all h-full">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentStatus === 'working' ? 'bg-emerald-50 text-emerald-600' : currentStatus === 'on_break' ? 'bg-amber-50 text-amber-600' : currentStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Today&apos;s Status</p>
                              <p className="text-sm font-black text-slate-900 truncate">{currentStatus === 'working' ? 'Working' : currentStatus === 'on_break' ? 'On Break' : currentStatus === 'completed' ? 'Shift Done' : 'Not Clocked In'}</p>
                              <p className="text-[11px] text-slate-500">{currentStatus === 'working' ? liveWorkedHMS : currentStatus === 'completed' ? `${todaySummary?.totalDurationFormatted || liveWorkedHMS || 'Completed'}` : '09:30 AM start'}</p>
                            </div>
                          </div>
                        </div>
                      </WidgetCardWrapper>
                    );
                  }
                  if (kpiId === 'emp_kpi_leave') {
                    return (
                      <WidgetCardWrapper
                        key={kpiId}
                        id={kpiId}
                        title="Leave Balance"
                        group="kpi"
                        editMode={widgetEditMode}
                        onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                        onDropWidget={handleDropWidget}
                      >
                        <div onClick={onOpenLeaveModal} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leave Balance</p>
                              <p className="text-sm font-black text-slate-900">
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
                      </WidgetCardWrapper>
                    );
                  }
                  if (kpiId === 'emp_kpi_salary') {
                    return (
                      <WidgetCardWrapper
                        key={kpiId}
                        id={kpiId}
                        title="Salary & Payslips"
                        group="kpi"
                        editMode={widgetEditMode}
                        onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                        onDropWidget={handleDropWidget}
                      >
                        <div onClick={() => onNavigateModule('payslips')} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Salary &amp; Payslips</p>
                              <p className="text-sm font-black text-slate-900">{currentEmp?.salary?.net ? `₹${currentEmp.salary.net.toLocaleString()}` : '—'}</p>
                              <p className="text-[11px] text-emerald-700 font-semibold">View Payslips &rarr;</p>
                            </div>
                          </div>
                        </div>
                      </WidgetCardWrapper>
                    );
                  }
                  if (kpiId === 'emp_kpi_manager') {
                    return (
                      <WidgetCardWrapper
                        key={kpiId}
                        id={kpiId}
                        title="Reports To"
                        group="kpi"
                        editMode={widgetEditMode}
                        onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                        onDropWidget={handleDropWidget}
                      >
                        <div onClick={() => currentEmp?.reportingManagerId ? onOpenChatWithEmployee?.(currentEmp.reportingManagerId) : undefined} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-amber-200 hover:shadow-md transition-all cursor-pointer h-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reports To</p>
                              <p className="text-sm font-black text-slate-900 truncate">{currentEmp?.reportingManagerName || 'Not assigned'}</p>
                              <p className="text-[11px] text-amber-700 font-semibold">Tap to Chat</p>
                            </div>
                          </div>
                        </div>
                      </WidgetCardWrapper>
                    );
                  }
                  if (kpiId === 'emp_kpi_holidays') {
                    return (
                      <WidgetCardWrapper
                        key={kpiId}
                        id={kpiId}
                        title="Upcoming Holidays"
                        group="kpi"
                        editMode={widgetEditMode}
                        onRemove={(id) => handleRemoveWidget(id, 'kpi')}
                        onDropWidget={handleDropWidget}
                      >
                        <div onClick={() => onNavigateModule('calendar')} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Upcoming Holidays</p>
                              <p className="text-sm font-black text-slate-900">{upcomingHolidays.length}</p>
                              <p className="text-[11px] text-emerald-700 font-semibold">View Calendar &rarr;</p>
                            </div>
                          </div>
                        </div>
                      </WidgetCardWrapper>
                    );
                  }
                  return null;
                })}

                {widgetEditMode && empKpiOrder.length === 0 && (
                  <WidgetDropZone
                    group="kpi"
                    label="Drop KPI Stat Cards Here"
                    onDropWidget={handleDropWidget}
                  />
                )}
              </div>
            );
          })()}

          {/* ═══ EDITABLE EMPLOYEE PANELS GRID ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {empPanelOrder.map((panelId) => {
              if (panelId === 'emp_panel_shift_console') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Daily Shift Console"
                    group="panel"
                    editMode={widgetEditMode}
                    className="lg:col-span-6 flex flex-col"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <DailyShiftConsole clockSize="sm" showHeaderClock={false} className="h-full" />
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'emp_panel_recent_attendance') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="My Recent Attendance"
                    group="panel"
                    editMode={widgetEditMode}
                    className="lg:col-span-6 flex flex-col"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
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
                                  const workedStr = rec.workingHours ? `${rec.workingHours} hrs` : (rec.date === getTodayDateString() && currentStatus === 'working' ? liveWorkedHMS : '—');
                                  const bSecs = getLiveBreakSeconds(rec);
                                  const breakStr = rec.formattedTotalBreak || (bSecs > 0 ? formatSecondsToWords(bSecs) : rec.breakDurationMinutes ? `${rec.breakDurationMinutes}m` : '0m');

                                  return (
                                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-1.5 px-2 font-semibold text-slate-900 whitespace-nowrap">
                                        <span>{dayName}</span>
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">{formattedDate}</span>
                                      </td>
                                      <td className="py-1.5 px-2 font-medium text-slate-700 whitespace-nowrap">{rec.checkIn || '—'}</td>
                                      <td className="py-1.5 px-2 font-medium text-slate-700 whitespace-nowrap">{rec.checkOut || '—'}</td>
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
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'emp_panel_attendance_graph') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Daily Attendance Analysis"
                    group="panel"
                    editMode={widgetEditMode}
                    className="lg:col-span-12"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <DailyAttendanceGraph
                      mode="employee"
                      records={myAllAttendance}
                      liveWorkedHMS={liveWorkedHMS}
                      liveStatus={currentStatus}
                      todayCheckIn={
                        activeSession?.startTime
                          ? new Date(activeSession.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                          : lastCompletedSession?.startTime
                            ? new Date(lastCompletedSession.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                            : undefined
                      }
                      todayCheckOut={
                        lastCompletedSession?.endTime
                          ? new Date(lastCompletedSession.endTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                          : undefined
                      }
                      todayBreakWords={todaySummary?.totalBreakFormatted || liveBreakWords}
                      onViewFullLog={() => onNavigateModule('attendance')}
                    />
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'emp_panel_leave_breakdown') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Leave Quota & Balances"
                    group="panel"
                    editMode={widgetEditMode}
                    className="lg:col-span-6"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
                      <div className="p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <h4 className="text-sm font-bold text-slate-900 m-0">Leave Quota &amp; Balances</h4>
                          <button
                            onClick={onOpenLeaveModal}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            + Apply Leave
                          </button>
                        </div>

                        {(() => {
                          const empMyLeaves = leaves.filter((l) => {
                            const eId = currentEmp?.id || user?.employeeId || user?.id || '';
                            const eEmail = currentEmp?.email?.toLowerCase() || user?.email?.toLowerCase() || '';
                            const eName = `${currentEmp?.firstName || user?.firstName || ''} ${currentEmp?.lastName || user?.lastName || ''}`.trim().toLowerCase();
                            if (eId && l.employeeId === eId) return true;
                            if (eEmail && (l as any).employeeEmail?.toLowerCase() === eEmail) return true;
                            if (eName && l.employeeName?.toLowerCase() === eName) return true;
                            return false;
                          });
                          const empSummary = resolveLeaveQuotaSummary(
                            leaveQuotaData?.settings ?? null,
                            leaveQuotaData?.balances ?? null,
                            empMyLeaves
                          );
                          if (leaveQuotaLoading) {
                            return (
                              <div className="grid grid-cols-3 gap-2.5 text-center text-xs animate-pulse">
                                {[0, 1, 2].map((idx) => (
                                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                                    <div className="h-3 w-12 mx-auto bg-slate-200 rounded" />
                                    <div className="h-5 w-14 mx-auto bg-slate-200 rounded" />
                                    <div className="h-2.5 w-16 mx-auto bg-slate-100 rounded" />
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Casual</span>
                                <span className="text-lg font-black text-blue-700 block mt-0.5">
                                  {empSummary.casual.available} Left
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  of {empSummary.casual.quota} Total
                                </span>
                              </div>
                              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Sick</span>
                                <span className="text-lg font-black text-emerald-700 block mt-0.5">
                                  {empSummary.sick.available} Left
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  of {empSummary.sick.quota} Total
                                </span>
                              </div>
                              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual</span>
                                <span className="text-lg font-black text-purple-700 block mt-0.5">
                                  {empSummary.paid.available} Left
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  of {empSummary.paid.quota} Total
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'emp_panel_holidays') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Upcoming Holidays"
                    group="panel"
                    editMode={widgetEditMode}
                    className="lg:col-span-6"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
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
                  </WidgetCardWrapper>
                );
              }

              if (panelId === 'emp_panel_announcements') {
                return (
                  <WidgetCardWrapper
                    key={panelId}
                    id={panelId}
                    title="Company Announcements"
                    group="panel"
                    editMode={widgetEditMode}
                    className="lg:col-span-6"
                    onRemove={(id) => handleRemoveWidget(id, 'panel')}
                    onDropWidget={handleDropWidget}
                  >
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
                      <div className="p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <h4 className="text-sm font-bold text-slate-900 m-0">Company Announcements</h4>
                          <button
                            onClick={() => onNavigateModule('announcements')}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            View All
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          {announcements.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-400">No announcements published yet.</p>
                          ) : (
                            announcements.slice(0, 3).map((item: any) => (
                              <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900 truncate">{item.title}</span>
                                  <span className="tag green shrink-0">{item.priority || 'Notice'}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </WidgetCardWrapper>
                );
              }

              return null;
            })}

            {widgetEditMode && (
              <WidgetDropZone
                group="panel"
                label="Drop Dashboard Panels Here"
                onDropWidget={handleDropWidget}
              />
            )}
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
                <h3 className="text-sm font-bold text-slate-900">Clock Out for Today?</h3>
                <p className="text-xs text-slate-500">Attendance shift finalization</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once clocked out, today’s work shift is locked and finalized. You will not be able to punch in again until tomorrow.
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
                {actionLoading ? 'Finalizing...' : 'Confirm Clock Out'}
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
                  <option value="Low">Low Priority (General Notice)</option>
                  <option value="Medium">Medium Priority (Standard Notice)</option>
                  <option value="High">High Priority (Action Required)</option>
                  <option value="Urgent">Urgent Notice (Immediate Attention)</option>
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
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2d6a4f] hover:bg-[#1b4332] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
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

      {/* Temporary Mobile-Style Right Widget Gallery Drawer */}
      <WidgetGallerySidebar
        isOpen={widgetEditMode}
        allWidgets={currentWidgetDefs}
        activeIds={currentActiveWidgetIds}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onResetLayout={handleResetWidgets}
        onClose={() => setWidgetEditMode(false)}
      />
    </div>
  );
};

