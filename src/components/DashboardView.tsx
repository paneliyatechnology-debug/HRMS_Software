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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord } from '../types/hrms';
import { api } from '../lib/api';
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
  const currentEmpId = user.employeeId || 'emp-2';
  const currentEmp = employees.find((e) => e.id === currentEmpId || e.email === user.email) || employees[0];

  // Live punch status for employee
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(currentEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync and tick timer every second
  const refreshAttendanceState = () => {
    const records = getAllAttendanceRecords();
    setAllAttendance(records);
    const eligibility = checkEmployeePunchEligibility(currentEmpId);
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
  }, [currentEmpId]);

  // Leave processing state for admin
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; empName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Operational requirements');

  const handleDashboardApproveLeave = async (id: string, empName: string, leaveType: string) => {
    setProcessingLeaveId(id);
    try {
      await api.approveLeave(id, 'SUPER_ADMIN', 'Keyur Sangani', 'Approved from Dashboard');
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
      await api.rejectLeave(id, 'Keyur Sangani', rejectReason || 'Operational requirements');
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
        authorName: `${user.firstName || 'Keyur'} ${user.lastName || 'Sangani'} (HR & Admin)`,
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

  // Check In handler (Strict 1 per day rule)
  const handleCheckInAction = () => {
    setActionLoading(true);
    try {
      const res = performCheckIn({
        id: currentEmpId,
        firstName: currentEmp?.firstName || user.firstName || 'Employee',
        lastName: currentEmp?.lastName || user.lastName || '',
        employeeCode: currentEmp?.employeeCode || 'EMP-2',
        departmentName: currentEmp?.departmentName || 'Engineering',
      });

      if (!res.success) {
        showToast({ type: 'warning', title: 'Check In Notice', message: res.message });
      } else {
        showToast({ type: 'success', title: 'Work Shift Started', message: res.message });
        refreshAttendanceState();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', title: 'Check In Error', message: err.message || 'Failed to check in.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Break handler (Pause timer)
  const handleTakeBreakAction = () => {
    setActionLoading(true);
    try {
      const res = performTakeBreak(currentEmpId);
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
      const res = performResumeWork(currentEmpId);
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

  // Check Out modal trigger
  const handleCheckOutAction = () => {
    setCheckOutModalOpen(true);
  };

  const executeCheckOut = () => {
    setCheckOutModalOpen(false);
    setActionLoading(true);
    try {
      const res = performCheckOut(currentEmpId);
      if (res.success) {
        showToast({ type: 'success', title: 'Shift Completed', message: res.message });
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
    <div className="space-y-6 pb-12 w-full max-w-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            {portalMode === 'admin' ? 'HR Overview' : 'My Workspace'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentDateString}</p>
        </div>

        {/* Live system clock on header right */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentTime || '09:00:00 AM'}</span>
        </div>
      </div>

      {portalMode === 'admin' ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigateModule('employees')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">Total Employees</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
              <p className="text-xs text-slate-500 mt-1">Active team members</p>
            </div>

            <div
              onClick={() => onNavigateModule('attendance')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">Today's Attendance</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {todayRecords.length} / {employees.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {todayRecords.length > 0
                  ? `${activeWorkingCount} working, ${onBreakCount} on break, ${completedTodayCount} done`
                  : 'No punches today'}
              </p>
            </div>

            <div
              onClick={() => onNavigateModule('leaves')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">Pending Leaves</span>
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">System Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Connected</p>
              <p className="text-xs text-slate-500 mt-1">API Port 4000 Online</p>
            </div>
          </div>

          {/* Pending Leave Requests Section (Admin Only 1-Click Approve/Reject) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 sm:px-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Leave Requests Awaiting Approval ({pendingLeaves.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and act on pending leave submissions
                </p>
              </div>
              <button
                onClick={() => onNavigateModule('leaves')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No leave requests currently pending review.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingLeaves.map((leave) => {
                  const isProcessing = processingLeaveId === leave.id;
                  return (
                    <div
                      key={leave.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900">
                            {leave.employeeName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {leave.leaveType}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''} ({leave.daysCount}d)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Reason: <span className="text-slate-800 font-medium">&ldquo;{leave.reason}&rdquo;</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleDashboardApproveLeave(leave.id, leave.employeeName, leave.leaveType)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                        >
                          {isProcessing ? 'Saving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Employees Directory with Live Attendance Observation for Admin */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 sm:px-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Employees Attendance & Workforce Status ({employees.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live work timer, daily attendance & break tracker for all staff
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddEmployeeModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                >
                  + Add Employee
                </button>
                <button
                  onClick={() => onNavigateModule('attendance')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                >
                  Full Attendance Roster
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">NAME</th>
                    <th className="py-2.5 px-4 font-medium">CODE</th>
                    <th className="py-2.5 px-4 font-medium">DESIGNATION</th>
                    <th className="py-2.5 px-4 font-medium">TODAY'S SHIFT</th>
                    <th className="py-2.5 px-4 font-medium">WORKED TIME</th>
                    <th className="py-2.5 px-4 font-medium">BREAK</th>
                    <th className="py-2.5 px-4 font-medium">STATUS</th>
                    <th className="py-2.5 px-4 font-medium text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const todayRec = getTodayRecordForEmployee(emp.id);
                    const isWorking = todayRec && !todayRec.isCompleted && !todayRec.isOnBreak;
                    const isOnBreak = todayRec && !todayRec.isCompleted && todayRec.isOnBreak;
                    const isDone = todayRec && todayRec.isCompleted;

                    const liveSecs = todayRec ? getLiveActiveSeconds(todayRec) : 0;
                    const breakSecs = todayRec ? getLiveBreakSeconds(todayRec) : 0;

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => onSelectEmployee(emp)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                            {emp.firstName?.[0] || 'E'}
                          </div>
                          <span className="truncate">{emp.firstName} {emp.lastName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{emp.employeeCode}</td>
                        <td className="py-3 px-4 text-slate-700 truncate">{emp.designationTitle || 'Staff'}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {todayRec?.checkIn ? (
                            <span>
                              {todayRec.checkIn} {todayRec.checkOut ? `– ${todayRec.checkOut}` : '– Active'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {todayRec ? formatSecondsToWords(liveSecs) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {breakSecs > 0 ? formatSecondsToWords(breakSecs) : '0s'}
                        </td>
                        <td className="py-3 px-4">
                          {isWorking ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Working
                            </span>
                          ) : isOnBreak ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                              <Pause className="w-3 h-3 text-amber-600" />
                              On Break
                            </span>
                          ) : isDone ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3 text-slate-600" />
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-100">
                              Not Punched
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              id={`btn-dash-chat-${emp.id}`}
                              onClick={() => onOpenChatWithEmployee?.(emp.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Chat with employee"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chat</span>
                            </button>

                            <button
                              id={`btn-dash-notice-${emp.id}`}
                              onClick={() => handleOpenNoticeModalDashboard(emp)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Send notice to employee"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Notice</span>
                            </button>

                            {emp.email !== user.email && emp.firstName !== 'Keyur' && (
                              <button
                                id={`btn-dash-remove-${emp.id}`}
                                onClick={() => setRemovingEmpDashboard(emp)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                                title="Remove employee from staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Remove</span>
                              </button>
                            )}

                            <span className="text-slate-500 hover:text-slate-900 font-medium px-1.5">
                              View
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* EMPLOYEE SELF-SERVICE VIEW                                     */
        /* ============================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Real-time Clock, Break & Daily Attendance Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium uppercase tracking-wide">Attendance Punch</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      punchState.status === 'working'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1'
                        : punchState.status === 'on_break'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1'
                        : punchState.status === 'completed'
                        ? 'bg-slate-100 text-slate-700 font-semibold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {punchState.status === 'working' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Working (Timer Running)
                      </>
                    )}
                    {punchState.status === 'on_break' && (
                      <>
                        <Pause className="w-3 h-3 text-amber-600" />
                        On Break (Paused)
                      </>
                    )}
                    {punchState.status === 'completed' && '✓ Shift Completed'}
                    {punchState.status === 'not_started' && 'Not Checked In'}
                  </span>
                </div>

                {/* Clock & Timer Display */}
                <div className="my-4 py-4 px-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                  {punchState.status === 'not_started' && (
                    <>
                      <p className="text-2xl font-mono font-semibold text-slate-900">{currentTime || '09:00 AM'}</p>
                      <p className="text-xs text-slate-500 mt-1">Daily Shift: 09:30 AM – 06:30 PM</p>
                    </>
                  )}

                  {punchState.status === 'working' && (
                    <>
                      <p className="text-3xl font-mono font-extrabold text-emerald-600 tracking-wider">
                        {liveWorkedHMS}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        In: {punchState.record?.checkIn} &bull; Break: {liveBreakWords}
                      </p>
                    </>
                  )}

                  {punchState.status === 'on_break' && (
                    <>
                      <p className="text-3xl font-mono font-bold text-amber-600 tracking-wider">
                        {liveWorkedHMS}
                      </p>
                      <p className="text-xs text-amber-800 font-medium mt-1">
                        ⏸ Timer Paused &bull; Break Time: {liveBreakWords}
                      </p>
                    </>
                  )}

                  {punchState.status === 'completed' && (
                    <>
                      <p className="text-2xl font-mono font-bold text-slate-900">
                        {formatSecondsToWords(punchState.record?.activeSeconds || 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        In: {punchState.record?.checkIn} &bull; Out: {punchState.record?.checkOut} &bull; Break: {punchState.record?.breakDurationMinutes}m
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons: Check In / Break / Resume / Check Out */}
              <div>
                {punchState.status === 'not_started' && (
                  <button
                    id="btn-check-in"
                    onClick={handleCheckInAction}
                    disabled={actionLoading}
                    className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Check In</span>
                  </button>
                )}

                {punchState.status === 'working' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-take-break"
                      onClick={handleTakeBreakAction}
                      disabled={actionLoading}
                      className="h-10 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      title="Pause work timer and start break"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-700" />
                      <span>Take Break</span>
                    </button>
                    <button
                      id="btn-check-out"
                      onClick={handleCheckOutAction}
                      disabled={actionLoading}
                      className="h-10 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      title="Stop timer and finalize attendance for today"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Check Out</span>
                    </button>
                  </div>
                )}

                {punchState.status === 'on_break' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-resume-work"
                      onClick={handleResumeWorkAction}
                      disabled={actionLoading}
                      className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      title="Resume work timer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Work</span>
                    </button>
                    <button
                      id="btn-check-out-break"
                      onClick={handleCheckOutAction}
                      disabled={actionLoading}
                      className="h-10 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Check Out</span>
                    </button>
                  </div>
                )}

                {punchState.status === 'completed' && (
                  <div id="attendance-completed-banner" className="text-center py-2.5 px-3 rounded-lg bg-slate-100 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-800">✓ Completed for Today</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Next check-in available tomorrow
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Leave Balances Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium uppercase tracking-wide">Leave Balance</span>
                  <button
                    id="btn-apply-leave-dash"
                    onClick={onOpenLeaveModal}
                    className="text-slate-900 font-semibold hover:underline"
                  >
                    + Apply Leave
                  </button>
                </div>

                <div className="my-4 p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 font-medium">Paid Annual Leave</span>
                    <span className="font-semibold text-slate-900">3.12 days</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full w-[26%]" />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  No upcoming scheduled leaves this month.
                </p>
              </div>

              <button
                onClick={() => onNavigateModule('leaves')}
                className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                View Leave History
              </button>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 block mb-3">
                  My Profile
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-semibold flex items-center justify-center text-sm">
                    {currentEmp?.firstName?.[0] || 'R'}{currentEmp?.lastName?.[0] || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {currentEmp?.firstName || user.firstName} {currentEmp?.lastName || user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{currentEmp?.designationTitle || 'Staff'}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{currentEmp?.employeeCode || 'EMP-2'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectEmployee(currentEmp)}
                  className="h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onNavigateModule('documents')}
                  className="h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
                >
                  Documents
                </button>
              </div>
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
    </div>
  );
};
