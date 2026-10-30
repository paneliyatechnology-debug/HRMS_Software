'use client';

import React, { useState, useEffect } from 'react';
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
  formatSecondsToHMS,
  formatSecondsToWords,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  getAllAttendanceRecords,
  getTodayRecordForEmployee,
  getTodayDateString,
} from '../lib/attendanceService';
import { verifyShiftTimeWindow, getWorkScheduleConfig } from '../lib/shiftScheduleService';
import { verifyCurrentGeofence } from '../lib/geoService';
import { ModernDigitClock } from './common/ModernDigitClock';

interface DashboardViewProps {
  stats: any;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
  onNavigateModule: (moduleName: string) => void;
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
  const { showToast } = useSocket();

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

  // Determine current active employee for self-service punch
  const currentEmpId = user.employeeId || user.id || '';
  const currentEmp: Employee =
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
    };

  // Live punch status for employee
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(currentEmp.id || currentEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const activeEmpId = currentEmp.id || currentEmpId;

  // Sync and tick timer every second
  const refreshAttendanceState = () => {
    const records = getAllAttendanceRecords();
    setAllAttendance(records);
    const eligibility = checkEmployeePunchEligibility(activeEmpId);
    setPunchState(eligibility);

    if (eligibility.record) {
      const active = getLiveActiveSeconds(eligibility.record);
      const brk = getLiveBreakSeconds(eligibility.record);
      setLiveWorkedHMS(formatSecondsToHMS(active));
      setLiveBreakWords(formatSecondsToWords(brk));
    } else {
      setLiveWorkedHMS('00:00:00');
      setLiveBreakWords('0s');
    }
  };

  useEffect(() => {
    refreshAttendanceState();
    const timer = setInterval(refreshAttendanceState, 1000);

    const handleUpdate = () => refreshAttendanceState();
    window.addEventListener('hrms_attendance_updated', handleUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hrms_attendance_updated', handleUpdate);
    };
  }, [activeEmpId, currentEmpId, user.email]);

  // Leave processing state for admin
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; empName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Operational requirements');

  const handleDashboardApproveLeave = async (id: string, empName: string, leaveType: string) => {
    setProcessingLeaveId(id);
    try {
      await api.approveLeave(id, 'HR_ADMIN', 'HR Administration', 'Approved from Dashboard');
      showToast({
        type: 'success',
        title: 'Approved',
        message: `${empName}'s ${leaveType} has been approved.`,
      });
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

  const handleDashboardRejectLeave = (id: string, empName: string) => {
    setRejectModalData({ id, empName });
    setRejectReason('Operational requirements');
  };

  const executeRejectLeave = async () => {
    if (!rejectModalData) return;
    const { id, empName } = rejectModalData;
    setProcessingLeaveId(id);
    try {
      await api.rejectLeave(id, 'HR Administration', rejectReason || 'Operational requirements');
      showToast({
        type: 'warning',
        title: 'Rejected',
        message: `${empName}'s leave request was rejected.`,
      });
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
  const [roleTargetEmpDash, setRoleTargetEmpDash] = useState<Employee | null>(null);
  const empRoleDef = getRoleDefinition(currentEmp?.role || 'EMPLOYEE');

  const handleConfirmRemoveEmpDashboard = async () => {
    if (!removingEmpDashboard) return;
    setRemoveEmpLoading(true);
    try {
      const res = await api.deleteEmployee(removingEmpDashboard.id);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Employee Removed',
          message: res.message || `${removingEmpDashboard.firstName} ${removingEmpDashboard.lastName} removed from staff.`,
        });
        setRemovingEmpDashboard(null);
        if (onRefreshData) onRefreshData();
      } else {
        showToast({
          type: 'error',
          title: 'Remove Failed',
          message: res.message || 'Could not remove employee.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
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

  // Check In handler (Triggers selfie & geofenced punch modal)
  const handleCheckInAction = () => {
    if (onOpenClockModal) {
      onOpenClockModal();
    }
  };

  // Break handler (Pause timer)
  const handleTakeBreakAction = () => {
    setActionLoading(true);
    try {
      const res = performTakeBreak(activeEmpId);
      if (res.success) {
        showToast({ type: 'info', title: 'Break Started', message: res.message });
        refreshAttendanceState();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Resume handler (Restart timer)
  const handleResumeWorkAction = () => {
    setActionLoading(true);
    try {
      const res = performResumeWork(activeEmpId);
      if (res.success) {
        showToast({ type: 'success', title: 'Work Resumed', message: res.message });
        refreshAttendanceState();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Check Out modal trigger (Triggers selfie & geofenced punch modal)
  const handleCheckOutAction = () => {
    if (onOpenClockModal) {
      onOpenClockModal();
    } else {
      setCheckOutModalOpen(true);
    }
  };

  const executeCheckOut = async () => {
    setCheckOutModalOpen(false);
    setActionLoading(true);
    try {
      const geoResult = await verifyCurrentGeofence();
      if (!geoResult.isAllowed) {
        showToast({
          type: 'warning',
          title: 'Geofence Verification Failed',
          message: geoResult.errorMessage || 'Check-out blocked: You must be inside the office perimeter to check out.',
        });
        setActionLoading(false);
        return;
      }

      const geoData = geoResult.userCoords
        ? {
          latitude: geoResult.userCoords.latitude,
          longitude: geoResult.userCoords.longitude,
          accuracy: geoResult.userCoords.accuracy,
          distanceMeters: geoResult.distanceMeters ?? undefined,
          locationAddress: geoResult.config.officeName,
        }
        : undefined;

      const res = await api.checkOut(
        activeEmpId,
        'Evening clock-out',
        {
          email: user.email,
          employeeCode: currentEmp?.employeeCode || (user as any).employeeCode,
        },
        geoData
      );
      if (res.success) {
        showToast({ type: 'success', title: 'Shift Completed', message: 'Shift checked out successfully! Entry saved in database.' });
        refreshAttendanceState();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', title: 'Check Out Error', message: err.message || 'Failed to check out.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin stats computation
  const todayDate = getTodayDateString();
  const todayRecords = allAttendance.filter((a) => a.date === todayDate);
  const activeWorkingCount = todayRecords.filter((a) => !a.isCompleted && !a.isOnBreak).length;
  const onBreakCount = todayRecords.filter((a) => !a.isCompleted && a.isOnBreak).length;
  const completedTodayCount = todayRecords.filter((a) => a.isCompleted).length;

  return (
    <div className="space-y-5 pb-12 w-full max-w-full overflow-hidden">
      {/* Welcome & Section Head */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#d8ebd9]">
        <div>
          <div className="text-xs text-[#4e6a5d] font-medium">
            {currentDateString} &bull; {portalMode === 'admin' ? 'Admin workspace' : 'Employee workspace'}
          </div>
          <h1 className="text-2xl sm:text-[27px] font-bold text-[#0d271d] tracking-tight mt-0.5">
            hello, {user.firstName || (portalMode === 'admin' ? 'Admin' : 'Employee')}! 👋
          </h1>
          <div className="text-xs text-[#4e6a5d] mt-0.5">
            Here&apos;s what&apos;s happening across your workspace today.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {portalMode === 'admin' ? (
            <button
              onClick={() => onNavigateModule('announcements')}
              className="btn-primary"
            >
              ＋ View announcements
            </button>
          ) : (
            <button
              onClick={onOpenLeaveModal}
              className="btn-primary"
            >
              ＋ Apply for leave
            </button>
          )}
        </div>
      </div>

      {portalMode === 'admin' ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-5">
          {/* Stats Row (Matching HTML .stats) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div
              onClick={() => onNavigateModule('employees')}
              className="stat cursor-pointer hover:border-[#059669]/40 transition-colors"
            >
              <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <small>Total Employees</small>
                <strong>{employees.length}</strong>
                <small>Active workforce</small>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('attendance')}
              className="stat cursor-pointer hover:border-[#10b981]/40 transition-colors"
            >
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <small>Present Today</small>
                <strong>{todayRecords.length}</strong>
                <small>{activeWorkingCount} working, {onBreakCount} break</small>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('leaves')}
              className="stat cursor-pointer hover:border-[#f59e0b]/40 transition-colors"
            >
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <small>Pending Leaves</small>
                <strong>{pendingLeaves.length}</strong>
                <small>Need review</small>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('chat')}
              className="stat cursor-pointer hover:border-[#059669]/40 transition-colors"
            >
              <div className="stat-icon" style={{ background: '#f0fdf4', color: '#047857' }}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <small>Team Hub</small>
                <strong>{employees.length > 0 ? 'Active' : '—'}</strong>
                <small>Real-time collaboration</small>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid (1.2fr 1fr .9fr on desktop) */}
          <div className="dashboard-grid">
            {/* Panel 1: Attendance Overview (7 Days Chart) */}
            <section className="panel sm:col-span-2">
              <h3>
                <span className="flex items-center gap-2">
                  <span className="text-base">📊</span> Attendance Rate & Turnout
                </span>
                <span className="tag">Last 7 Days</span>
              </h3>
              <div className="flex items-end gap-2 sm:gap-3 h-[165px] px-2 pt-4 pb-2 border-b border-[#d8ebd9]">
                {[
                  { day: '22 Oct', val: 92, count: `${Math.max(1, Math.round(employees.length * 0.92))} Present` },
                  { day: '23 Oct', val: 88, count: `${Math.max(1, Math.round(employees.length * 0.88))} Present` },
                  { day: '24 Oct', val: 95, count: `${Math.max(1, Math.round(employees.length * 0.95))} Present` },
                  { day: '25 Oct', val: 90, count: `${Math.max(1, Math.round(employees.length * 0.90))} Present` },
                  { day: '26 Oct', val: 85, count: `${Math.max(1, Math.round(employees.length * 0.85))} Present` },
                  { day: '27 Oct', val: 94, count: `${Math.max(1, Math.round(employees.length * 0.94))} Present` },
                  {
                    day: 'Today',
                    val: Math.min(100, Math.round((todayRecords.length / Math.max(1, employees.length)) * 100)) || 96,
                    count: `${todayRecords.length || employees.length} Present`,
                    isToday: true,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group cursor-pointer">
                    <div className="text-[10px] text-[#0d271d] font-mono font-bold bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.5 rounded shadow-2xs">
                      {item.val}%
                    </div>
                    <div
                      style={{ height: `${item.val}%` }}
                      className={`w-full max-w-[42px] rounded-t-lg transition-all shadow-xs ${item.isToday
                          ? 'bg-gradient-to-t from-[#047857] to-[#10b981] ring-2 ring-[#10b981]/50'
                          : 'bg-gradient-to-t from-[#059669] to-[#34d399] group-hover:brightness-110'
                        }`}
                      title={item.count}
                    />
                    <small
                      className={`text-[11px] font-bold mt-1 ${item.isToday ? 'text-[#059669]' : 'text-[#4e6a5d]'
                        }`}
                    >
                      {item.day}
                    </small>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-[#4e6a5d] mt-3">
                <span className="font-medium">
                  <strong className="text-[#0d271d]">{todayRecords.length || employees.length}</strong> checked-in out of{' '}
                  <strong className="text-[#0d271d]">{employees.length}</strong> team members today
                </span>
                <button
                  onClick={() => onNavigateModule('attendance')}
                  className="text-[#059669] font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
              <div className="space-y-1">
                <div className="item">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-[#152345]">Diwali Holiday Schedule</strong>
                    <span className="tag orange">Holiday</span>
                  </div>
                  <div className="text-[11px] text-[#6e7b98] mt-1 leading-relaxed">
                    The office will be closed from 31 Oct to 2 Nov. Please plan your shifts.
                  </div>
                </div>
                <div className="item">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-[#152345]">Monthly Town Hall</strong>
                    <span className="tag">Event</span>
                  </div>
                  <div className="text-[11px] text-[#6e7b98] mt-1 leading-relaxed">
                    Join monthly town hall on 27 Oct at 3:00 PM in main conference room.
                  </div>
                </div>
                <div className="item">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-[#152345]">Security Policy Update</strong>
                    <span className="tag green">Policy</span>
                  </div>
                  <div className="text-[11px] text-[#6e7b98] mt-1 leading-relaxed">
                    All employees should review the updated security policy.
                  </div>
                </div>
              </div>
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
                  onClick={onOpenClockModal}
                  className="btn-secondary justify-center py-2.5"
                >
                  <Clock className="w-4 h-4 text-[#4f5fe8]" />
                  <span>Mark punch</span>
                </button>
                <button
                  onClick={onOpenLeaveModal}
                  className="btn-secondary justify-center py-2.5"
                >
                  <Shield className="w-4 h-4 text-[#4f5fe8]" />
                  <span>Apply leave</span>
                </button>
                <button
                  onClick={onOpenAddEmployeeModal}
                  className="btn-secondary justify-center py-2.5"
                >
                  <UserPlus className="w-4 h-4 text-[#4f5fe8]" />
                  <span>Add staff</span>
                </button>
                <button
                  onClick={() => onNavigateModule('calendar')}
                  className="btn-secondary justify-center py-2.5"
                >
                  <Calendar className="w-4 h-4 text-[#4f5fe8]" />
                  <span>Holidays</span>
                </button>
              </div>
            </section>

            {/* Panel 4: Pending Approvals */}
            <section className="panel sm:col-span-2">
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
                <div className="p-6 text-center text-[#6e7b98] text-xs">
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
                            <strong className="text-xs text-[#152345]">
                              {leave.employeeName}
                            </strong>
                            <span className="tag orange">
                              {leave.leaveType}
                            </span>
                            <span className="text-xs text-[#6e7b98] font-mono">
                              {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''} ({leave.daysCount}d)
                            </span>
                          </div>
                          <p className="text-xs text-[#6e7b98]">
                            Reason: <span className="text-[#152345] font-medium">&ldquo;{leave.reason}&rdquo;</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleDashboardApproveLeave(leave.id, leave.employeeName, leave.leaveType)}
                            disabled={isProcessing}
                            className="btn-primary text-xs py-1.5 px-3 bg-[#16a779] hover:bg-[#13865f]"
                          >
                            {isProcessing ? 'Saving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName)}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e4eaf5]">
              <div>
                <h3 className="text-sm font-bold text-[#152345] m-0">
                  Staff Directory &amp; Live Time Tracking
                </h3>
                <p className="text-xs text-[#6e7b98] mt-0.5">
                  Live status, recorded punches, and direct messaging
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateModule('attendance')}
                  className="btn-ghost text-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#4f5fe8]" />
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
                      <td colSpan={6} className="py-10 text-center text-xs text-[#6e7b98]">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Users className="w-8 h-8 text-emerald-500/50" />
                          <p className="font-bold text-[#152345]">No employees in this company yet</p>
                          <p className="text-[11px] text-[#6e7b98]">Click &ldquo;+ Add Employee&rdquo; above to onboard your staff members.</p>
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
                        className="hover:bg-[#f8faff] cursor-pointer transition-colors"
                      >
                        <td className="font-semibold text-[#152345]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#e8ecff] text-[#3548be] font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.firstName?.[0] || 'E'}
                            </div>
                            <span className="truncate">{emp.firstName} {emp.lastName}</span>
                          </div>
                        </td>
                        <td className="text-[#6e7b98] font-mono text-xs">{emp.employeeCode}</td>
                        <td className="text-[#152345] truncate">{emp.designationTitle || 'Staff'}</td>
                        <td className="text-[#6e7b98] font-mono text-xs">
                          {todayRec?.checkIn ? (
                            <span>
                              {todayRec.checkIn} {todayRec.checkOut ? `– ${todayRec.checkOut}` : '– Active'}
                            </span>
                          ) : (
                            <span className="text-[#aab8df]">—</span>
                          )}
                        </td>
                        <td className="font-mono font-bold text-[#152345] text-xs">
                          {todayRec ? formatSecondsToWords(liveSecs) : '—'}
                        </td>
                        <td className="text-[#6e7b98] font-mono text-xs">
                          {breakSecs > 0 ? formatSecondsToWords(breakSecs) : '0s'}
                        </td>
                        <td>
                          {isWorking ? (
                            <span className="tag green">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16a779] animate-pulse" />
                              Working
                            </span>
                          ) : isOnBreak ? (
                            <span className="tag orange">
                              <Pause className="w-3 h-3 text-[#f39a3f]" />
                              On Break
                            </span>
                          ) : isDone ? (
                            <span className="tag">
                              <Check className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                            <span className="tag" style={{ background: '#f4f7fc', color: '#6e7b98' }}>
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
                              <MessageSquare className="w-3.5 h-3.5 text-[#4f5fe8]" />
                              <span className="hidden sm:inline">Chat</span>
                            </button>

                            <button
                              id={`btn-dash-role-${emp.id}`}
                              onClick={() => setRoleTargetEmpDash(emp)}
                              className="btn-secondary text-xs py-1 px-2.5 text-purple-700 bg-purple-50 hover:bg-purple-100"
                              title="Change employee role"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Role</span>
                            </button>

                            <button
                              id={`btn-dash-notice-${emp.id}`}
                              onClick={() => handleOpenNoticeModalDashboard(emp)}
                              className="btn-secondary text-xs py-1 px-2.5"
                              title="Send notice to employee"
                            >
                              <Bell className="w-3.5 h-3.5 text-[#4f5fe8]" />
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
          <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #062d1f 0%, #0a3d2b 45%, #041d14 100%)' }}>
            {/* Animated glow blobs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.2), transparent 70%)' }} />
            <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.15), transparent 70%)' }} />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Employee info */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl border border-white/20 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669, #047857)' }}>
                    {currentEmp?.avatarUrl ? (
                      <img src={currentEmp.avatarUrl} alt={currentEmp.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentEmp?.firstName?.[0] || 'E'}{currentEmp?.lastName?.[0] || ''}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#062d1f] flex items-center justify-center"
                    style={{ background: punchState.status === 'working' ? '#10b981' : punchState.status === 'on_break' ? '#f59e0b' : punchState.status === 'completed' ? '#059669' : '#4e6a5d' }}>
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-emerald-200 border border-white/15 font-mono uppercase tracking-wide">
                      {currentEmp?.employeeCode || 'EMP-1'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${empRoleDef.badgeClass}`}>
                      <Shield className="w-2.5 h-2.5" />
                      {empRoleDef.label}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {currentEmp?.firstName || user.firstName} {currentEmp?.lastName || user.lastName}
                  </h2>
                  <p className="text-xs text-emerald-300 mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-white">{currentEmp?.designationTitle || 'Staff Member'}</span>
                    <span className="text-emerald-500">•</span>
                    <span>{currentEmp?.departmentName || 'Engineering'}</span>
                    <span className="text-emerald-500">•</span>
                    <span className="text-emerald-400 font-semibold">{currentEmp?.shift || 'General Shift'}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button id="btn-emp-apply-leave" onClick={onOpenLeaveModal}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-[#065f46] font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                  Apply Leave
                </button>
                <button id="btn-emp-payslips" onClick={() => onNavigateModule('payslips')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
                  <Receipt className="w-3.5 h-3.5 text-emerald-300" />
                  My Payslips
                </button>
                <button id="btn-emp-chat" onClick={() => onNavigateModule('chat')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Team Chat
                </button>
                <button id="btn-emp-profile" onClick={() => onSelectEmployee(currentEmp)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Stat 1: Attendance status */}
                <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all">
                  <div className="h-1 w-full absolute top-0 left-0 rounded-t-2xl" style={{ background: punchState.status === 'working' ? 'linear-gradient(90deg,#10b981,#34d399)' : punchState.status === 'on_break' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : punchState.status === 'completed' ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#94a3b8,#cbd5e1)' }} />
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${punchState.status === 'working' ? 'bg-emerald-50 text-emerald-600' : punchState.status === 'on_break' ? 'bg-amber-50 text-amber-600' : punchState.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Today's Status</p>
                      <p className="text-sm font-black text-slate-900 truncate">{punchState.status === 'working' ? 'Working' : punchState.status === 'on_break' ? 'On Break' : punchState.status === 'completed' ? 'Shift Done' : 'Not Checked In'}</p>
                      <p className="text-[11px] text-slate-500">{punchState.status === 'working' ? liveWorkedHMS : punchState.status === 'completed' ? `${punchState.record?.workingHours || 9}h logged` : '09:30 AM start'}</p>
                    </div>
                  </div>
                </div>

                {/* Stat 2: Leave Balance */}
                <div onClick={onOpenLeaveModal} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="h-1 w-full absolute top-0 left-0 rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leave Balance</p>
                      <p className="text-sm font-black text-slate-900">{empLeftDays} Days Left</p>
                      <p className="text-[11px] text-emerald-600 font-semibold">{empTakenDays} Taken • {empLeftDays} Left</p>
                    </div>
                  </div>
                </div>

                {/* Stat 3: Salary & Payslips */}
                <div onClick={() => onNavigateModule('payslips')} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="h-1 w-full absolute top-0 left-0 rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Salary & Payslips</p>
                      <p className="text-sm font-black text-slate-900">{currentEmp?.salary?.net ? `₹${currentEmp.salary.net.toLocaleString()}` : '₹45,000'}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">View Payslips &rarr;</p>
                    </div>
                  </div>
                </div>

                {/* Stat 4: Manager */}
                <div onClick={() => onOpenChatWithEmployee?.('emp-1')} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden hover:border-amber-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="h-1 w-full absolute top-0 left-0 rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reports To</p>
                      <p className="text-sm font-black text-slate-900 truncate">{currentEmp?.reportingManagerName || 'HR Administration'}</p>
                      <p className="text-[11px] text-amber-700 font-semibold">Tap to Chat</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ 3. PUNCH CONSOLE + SIDEBAR ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Shift Punch Console */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden bg-white">
              {/* Colorful top bar */}
              <div className="h-1.5 w-full" style={{ background: punchState.status === 'working' ? 'linear-gradient(90deg,#10b981,#059669)' : punchState.status === 'on_break' ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : punchState.status === 'completed' ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#059669,#10b981)' }} />
              <div className="p-6 flex flex-col flex-1">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Daily Shift Console</h3>
                        <p className="text-[11px] text-slate-400">Check-in, break, and work time tracking</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center">
                        <ModernDigitClock
                          timeString={currentTime}
                          size="sm"
                          variant="light"
                          showLabels={false}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Hero Box */}
                  <div className="my-5">
                    {punchState.status === 'not_started' && (
                      <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center space-y-4">
                        <div className="flex justify-center">
                          <ModernDigitClock
                            timeString={currentTime}
                            size="md"
                            variant="light"
                            showSweepRing={true}
                            label="Current Live Time"
                          />
                        </div>
                        {(() => {
                          const shiftCheck = verifyShiftTimeWindow();
                          return (
                            <>
                              <h4 className="text-lg font-black text-slate-900">
                                {shiftCheck.isAllowed ? "Ready to Start Today's Shift" : "Shift Check-In Currently Locked"}
                              </h4>
                              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                Office Shift: <strong>{shiftCheck.shiftStart} – {shiftCheck.shiftEnd}</strong> (Grace Buffer: {shiftCheck.config.gracePeriodMinutes} mins).
                              </p>
                              {shiftCheck.isAllowed ? (
                                <p className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100/90 border border-emerald-300 py-1 px-3 rounded-full inline-block mt-1">
                                  Allowed Window: {shiftCheck.allowedStart} to {shiftCheck.allowedEnd}
                                </p>
                              ) : (
                                <p className="text-[11px] text-rose-800 font-extrabold bg-rose-100/90 border border-rose-300 py-1 px-3 rounded-full inline-block mt-1">
                                  Locked: Check-in only allowed from {shiftCheck.allowedStart} to {shiftCheck.allowedEnd}
                                </p>
                              )}
                            </>
                          );
                        })()}
                        <div className="pt-1">
                          <button
                            id="btn-emp-check-in-main"
                            onClick={handleCheckInAction}
                            disabled={actionLoading}
                            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl active:scale-95 font-black text-sm transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 max-w-full text-center ${
                              !verifyShiftTimeWindow().isAllowed
                                ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md shadow-rose-700/20'
                                : 'bg-[#059669] hover:bg-[#047857] text-white shadow-md shadow-[#059669]/25'
                            }`}
                          >
                            <Play className="w-4 h-4 fill-current shrink-0" />
                            <span className="truncate">
                              {!verifyShiftTimeWindow().isAllowed ? 'Shift Locked (View Timing)' : 'Start Work (Check In Now)'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {punchState.status === 'working' && (
                      <div className="p-4 sm:p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold max-w-full truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="truncate">Shift is Active • In at {punchState.record?.checkIn}</span>
                        </div>

                        <div className="py-2 flex justify-center">
                          <ModernDigitClock
                            timeString={liveWorkedHMS}
                            size="xl"
                            variant="light"
                            showSweepRing={true}
                            label="Active Worked Timer"
                          />
                        </div>
                        <p className="text-xs text-slate-600">
                          Worked time recorded today • Shift target: 9.0 Hours
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto w-full">
                          <button
                            id="btn-emp-take-break"
                            onClick={handleTakeBreakAction}
                            disabled={actionLoading}
                            className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xs min-w-0"
                          >
                            <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="truncate">Take Break</span>
                          </button>
                          <button
                            id="btn-emp-check-out"
                            onClick={handleCheckOutAction}
                            disabled={actionLoading}
                            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm shadow-rose-600/25 min-w-0"
                          >
                            <Square className="w-4 h-4 fill-current shrink-0" />
                            <span className="truncate">End Day & Check Out</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {punchState.status === 'on_break' && (
                      <div className="p-4 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold max-w-full truncate">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span className="truncate">Break in Progress • Work Timer Paused</span>
                        </div>

                        <div className="py-2 flex justify-center">
                          <ModernDigitClock
                            timeString={liveWorkedHMS}
                            size="xl"
                            variant="amber"
                            showSweepRing={true}
                            label="Timer Paused (On Break)"
                            subText={`Break Duration: ${liveBreakWords}`}
                          />
                        </div>
                        <p className="text-xs text-slate-600">
                          Enjoy your break! Click resume when you are back at your workstation.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto w-full">
                          <button
                            id="btn-emp-resume-work"
                            onClick={handleResumeWorkAction}
                            disabled={actionLoading}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm min-w-0"
                          >
                            <Play className="w-4 h-4 fill-current shrink-0" />
                            <span className="truncate">Resume Work</span>
                          </button>
                          <button
                            id="btn-emp-check-out-from-break"
                            onClick={handleCheckOutAction}
                            disabled={actionLoading}
                            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm min-w-0"
                          >
                            <Square className="w-4 h-4 fill-current shrink-0" />
                            <span className="truncate">Check Out for Today</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {punchState.status === 'completed' && (
                      <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                          <Check className="w-6 h-6 stroke-[3]" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900">
                          ✓ Today's Shift Completed!
                        </h4>
                        <p className="text-xs text-slate-600 max-w-md mx-auto">
                          In: <strong>{punchState.record?.checkIn}</strong> • Out: <strong>{punchState.record?.checkOut}</strong> • Total Hours: <strong>{punchState.record?.workingHours || 9.0}h</strong>
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <span>Attendance safely recorded & finalized for payroll</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Clear Policy Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      ✓
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Exact Timestamps</span>
                      <span className="text-slate-500 text-[11px]">In & Out times recorded securely.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      ✓
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Break Protection</span>
                      <span className="text-slate-500 text-[11px]">Pause for tea/lunch anytime.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      ✓
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Payroll Linked</span>
                      <span className="text-slate-500 text-[11px]">Synced with salary computation.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Profile + Workplace Cards */}
            <div className="lg:col-span-5 space-y-4">

              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#10b981,#059669,#047857)' }} />
                <div className="p-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md shrink-0"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      {currentEmp?.firstName?.[0] || 'E'}{currentEmp?.lastName?.[0] || ''}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{currentEmp?.firstName} {currentEmp?.lastName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{currentEmp?.designationTitle} • {currentEmp?.departmentName}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 mt-1">Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-black uppercase">Employee ID</p>
                      <p className="font-bold text-slate-900 font-mono mt-0.5">{currentEmp?.employeeCode}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-black uppercase">Work Shift</p>
                      <p className="font-bold text-slate-900 mt-0.5 truncate">09:30 – 18:30</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => onSelectEmployee(currentEmp)}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-colors hover:opacity-90 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff' }}>My Profile</button>
                    <button onClick={() => onNavigateModule('documents')}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 font-bold text-xs text-center transition-colors cursor-pointer">Documents</button>
                  </div>
                </div>
              </div>

              {/* Employment Details Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Workplace Info</h4>
                        <p className="text-[10px] text-slate-400">Employment details</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">Active</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Work Location', value: currentEmp?.workLocationName || 'Corporate HQ' },
                      { label: 'Employment Type', value: currentEmp?.employmentType || 'Full-time' },
                      { label: 'Joined On', value: currentEmp?.joiningDate ? new Date(currentEmp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-colors">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className="font-bold text-slate-900 text-right max-w-[120px] truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onNavigateModule('organization')}
                    className="w-full mt-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors hover:opacity-90 cursor-pointer"
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
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
                      {[
                        {
                          day: 'Today (Live)',
                          date: '24 Oct 2026',
                          inTime: punchState.record?.checkIn || '—',
                          outTime: punchState.record?.checkOut || '—',
                          break: liveBreakWords !== '0s' ? liveBreakWords : '0m',
                          hours: punchState.status === 'working' ? liveWorkedHMS : punchState.record?.workingHours ? `${punchState.record.workingHours}h` : '—',
                          status: punchState.status === 'working' ? 'Present' : punchState.status === 'completed' ? 'Present' : 'Not Punched',
                          statusClass: punchState.status === 'working' ? 'bg-emerald-50 text-emerald-700' : punchState.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600',
                        },
                        {
                          day: 'Friday',
                          date: '23 Oct 2026',
                          inTime: '09:22 AM',
                          outTime: '06:30 PM',
                          break: '25m',
                          hours: '9.1 hrs',
                          status: 'Present',
                          statusClass: 'bg-emerald-50 text-emerald-700',
                        },
                        {
                          day: 'Thursday',
                          date: '22 Oct 2026',
                          inTime: '09:18 AM',
                          outTime: '06:35 PM',
                          break: '20m',
                          hours: '9.2 hrs',
                          status: 'Present',
                          statusClass: 'bg-emerald-50 text-emerald-700',
                        },
                        {
                          day: 'Wednesday',
                          date: '21 Oct 2026',
                          inTime: '09:30 AM',
                          outTime: '06:30 PM',
                          break: '30m',
                          hours: '9.0 hrs',
                          status: 'Present',
                          statusClass: 'bg-emerald-50 text-emerald-700',
                        },
                        {
                          day: 'Tuesday',
                          date: '20 Oct 2026',
                          inTime: '09:15 AM',
                          outTime: '06:20 PM',
                          break: '20m',
                          hours: '9.1 hrs',
                          status: 'Present',
                          statusClass: 'bg-emerald-50 text-emerald-700',
                        },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">
                            <div>{row.day}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{row.date}</div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">{row.inTime}</td>
                          <td className="py-3 px-3 font-medium text-slate-700">{row.outTime}</td>
                          <td className="py-3 px-3 text-slate-500">{row.break}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{row.hours}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.statusClass}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      + Apply Leave
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Casual</span>
                      <span className="text-lg font-black text-blue-700 block mt-0.5">4 Left</span>
                      <span className="text-[10px] text-slate-500">of 12 Total</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Sick</span>
                      <span className="text-lg font-black text-emerald-700 block mt-0.5">3 Left</span>
                      <span className="text-[10px] text-slate-500">of 10 Total</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual</span>
                      <span className="text-lg font-black text-purple-700 block mt-0.5">5 Left</span>
                      <span className="text-[10px] text-slate-500">of 15 Total</span>
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
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View Calendar
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🪔</span>
                        <div>
                          <span className="font-bold text-slate-900 block">Diwali Festival</span>
                          <span className="text-[10px] text-slate-400">Public Holiday</span>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 text-[11px]">Nov 01, 2026 (Fri)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🎄</span>
                        <div>
                          <span className="font-bold text-slate-900 block">Christmas Day</span>
                          <span className="text-[10px] text-slate-400">Public Holiday</span>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 text-[11px]">Dec 25, 2026 (Wed)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🎉</span>
                        <div>
                          <span className="font-bold text-slate-900 block">New Year 2027</span>
                          <span className="text-[10px] text-slate-400">Company Holiday</span>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 text-[11px]">Jan 01, 2027 (Wed)</span>
                    </div>
                  </div>
                </div></div>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Check Out Confirmation Modal */}
      {checkOutModalOpen && (
        <div
          id="checkout-confirm-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckOutModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
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
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-checkout"
                type="button"
                onClick={executeCheckOut}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Finalizing...' : 'Confirm Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Leave Rejection Modal for Admin */}
      {rejectModalData && (
        <div
          id="dashboard-reject-leave-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectModalData(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Reject Leave Request ({rejectModalData.empName})
              </h3>
              <button
                onClick={() => setRejectModalData(null)}
                className="text-slate-400 hover:text-slate-600"
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
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-leave"
                type="button"
                onClick={executeRejectLeave}
                disabled={processingLeaveId === rejectModalData.id}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {processingLeaveId === rejectModalData.id ? 'Saving...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Remove Employee Confirmation Modal (Dashboard) */}
      {removingEmpDashboard && (
        <div
          id="dashboard-remove-employee-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemovingEmpDashboard(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
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
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-remove-emp"
                type="button"
                onClick={handleConfirmRemoveEmpDashboard}
                disabled={removeEmpLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {removeEmpLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Send Notice Modal (Dashboard) */}
      {noticeTargetEmpDashboard && (
        <div
          id="dashboard-send-notice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoticeTargetEmpDashboard(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Send Notice to {noticeTargetEmpDashboard.firstName} {noticeTargetEmpDashboard.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {noticeTargetEmpDashboard.employeeCode} &bull; {noticeTargetEmpDashboard.departmentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notice Subject / Title
                </label>
                <input
                  id="input-dash-notice-title"
                  type="text"
                  value={dashNoticeTitle}
                  onChange={(e) => setDashNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Urgent Task, HR Note..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Urgency / Priority
                </label>
                <select
                  id="select-dash-notice-priority"
                  value={dashNoticePriority}
                  onChange={(e) => setDashNoticePriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent / Important Notice</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notice Content
                </label>
                <textarea
                  id="textarea-dash-notice-content"
                  rows={4}
                  value={dashNoticeContent}
                  onChange={(e) => setDashNoticeContent(e.target.value)}
                  placeholder="Type the message for the employee..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-dash-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-send-notice"
                type="button"
                onClick={handleConfirmSendNoticeDashboard}
                disabled={dashNoticeLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dashNoticeLoading ? 'Sending...' : 'Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>
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

