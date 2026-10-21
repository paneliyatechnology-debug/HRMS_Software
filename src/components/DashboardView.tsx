'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  ChevronRight,
  LayoutGrid,
  Users,
  Shield,
  FileText,
  UserCheck,
  TrendingUp,
  Award,
  CheckCircle2,
  Check,
  X,
  UserPlus,
  AlertCircle,
  Building2,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord } from '../types/hrms';
import { api } from '../lib/api';

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
  portalMode?: 'employee' | 'admin';
  onTogglePortal?: (mode: 'employee' | 'admin') => void;
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
  portalMode = 'admin',
  onTogglePortal,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [activeTab, setActiveTab] = useState<'my' | 'hr'>(portalMode === 'admin' ? 'hr' : 'my');

  // Live ticking clock for simple attendance tracking
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

  // Sync activeTab when portalMode changes
  useEffect(() => {
    if (portalMode === 'admin') {
      setActiveTab('hr');
    } else {
      setActiveTab('my');
    }
  }, [portalMode]);

  // Live Clock In / Out State from real database
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [elapsedHours, setElapsedHours] = useState('0 Hours');

  // Pending leaves queue
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  const handleDashboardApproveLeave = async (id: string, empName: string, leaveType: string) => {
    setProcessingLeaveId(id);
    try {
      await api.approveLeave(id, 'SUPER_ADMIN', 'Keyur Sangani', 'Approved directly from HR Dashboard');
      showToast({
        type: 'success',
        title: 'Leave Approved',
        message: `${empName}'s ${leaveType} has been approved.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Approval Error',
        message: err.message || 'Could not approve leave.',
      });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleDashboardRejectLeave = async (id: string, empName: string) => {
    const reason = prompt(`Enter rejection remarks for ${empName}:`, 'Operational constraints during sprint');
    if (!reason) return;
    setProcessingLeaveId(id);
    try {
      await api.rejectLeave(id, 'Keyur Sangani', reason);
      showToast({
        type: 'warning',
        title: 'Leave Rejected',
        message: `${empName}'s leave was rejected with remarks: "${reason}"`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rejection Error',
        message: err.message || 'Could not reject leave.',
      });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // Check if Keyur Sangani is already clocked in today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendance.find(
      (a) => (a.employeeId === 'emp-1' || a.employeeName?.includes('Keyur')) && a.date === today
    );
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      setIsCheckedIn(true);
      setCheckInTime(todayRecord.checkIn);
      setElapsedHours(todayRecord.workingHours > 0 ? `${todayRecord.workingHours} Hours` : '0.1 Hours');
    } else {
      setIsCheckedIn(false);
      setCheckInTime(null);
      setElapsedHours('0 Hours');
    }
  }, [attendance]);

  const handleToggleClockIn = async () => {
    setClockInLoading(true);
    try {
      if (!isCheckedIn) {
        await api.checkIn('emp-1', 'Self clock-in via Dashboard');
        setIsCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        setElapsedHours('0.1 Hours');
      } else {
        await api.checkOut('emp-1', 'Self clock-out via Dashboard');
        setIsCheckedIn(false);
      }
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Attendance error:', err);
      setIsCheckedIn(!isCheckedIn);
    } finally {
      setClockInLoading(false);
    }
  };

  const primaryEmployee = employees[0] || {
    id: 'emp-1',
    employeeCode: 'EMP-1',
    firstName: 'Keyur',
    lastName: 'Sangani',
    email: 'keyur.sangani1234@gmail.com',
    status: 'Active',
    joiningDate: '19-Oct-2026',
    departmentName: 'Administration & Management',
    workLocationName: 'Surat HQ',
    designationTitle: 'App Administrator',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Sub-Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.firstName || 'Keyur'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentDateString} • {portalMode === 'admin' ? 'HR Administrator Workspace' : 'Employee Workspace'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Sub-tab Pill Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('hr')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'hr'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HR Admin
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'my'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Self-Service
            </button>
          </div>

          <button
            onClick={() => onNavigateModule('attendance')}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Attendance Matrix"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'hr' ? (
        /* ============================================================== */
        /* HR / ADMIN MANAGEMENT VIEW (Simple & Easy to Use)              */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Top 4 Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Employees */}
            <div
              onClick={() => onNavigateModule('employees')}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Employees
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-slate-900">{employees.length}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Active Workforce
                </p>
              </div>
            </div>

            {/* Today's Attendance */}
            <div
              onClick={() => onNavigateModule('attendance')}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Today's Attendance
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-slate-900">{isCheckedIn ? '100%' : '0%'}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {isCheckedIn ? 'Keyur Sangani Clocked In' : 'No clock-ins recorded yet'}
                </p>
              </div>
            </div>

            {/* Pending Leave Approvals */}
            <div
              onClick={() => onNavigateModule('leaves')}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Pending Approvals
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-slate-900">{pendingLeaves.length}</p>
                {pendingLeaves.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold mt-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Action Required
                  </span>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All Cleared
                  </p>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Backend API Sync
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </p>
                <p className="text-xs text-slate-500 mt-1">Nest.js Port 4000 Active</p>
              </div>
            </div>
          </div>

          {/* ⚡ PENDING LEAVE APPROVALS QUEUE (Simple, Clear & High Contrast) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pending Leave Requests ({pendingLeaves.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and approve or reject employee leave applications
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateModule('leaves')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View All Leaves</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    No pending leave applications
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    All employee leave requests have been reviewed and processed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingLeaves.map((leave) => {
                  const isProcessing = processingLeaveId === leave.id;
                  return (
                    <div
                      key={leave.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {leave.employeeName?.[0] || 'E'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{leave.employeeName}</p>
                              <p className="text-xs text-slate-500">
                                {leave.departmentName || 'paneliya technology'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            {leave.leaveType}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-slate-800">
                            {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                          </span>
                          <span className="font-bold text-indigo-700">({leave.daysCount} days)</span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 italic px-1">
                          "{leave.reason}"
                        </p>
                      </div>

                      {/* Clear, High-Contrast Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() =>
                            handleDashboardApproveLeave(leave.id, leave.employeeName, leave.leaveType)
                          }
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDashboardRejectLeave(leave.id, leave.employeeName)
                          }
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 👥 WORKFORCE DIRECTORY (Click to Observe Profile) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Workforce Directory ({employees.length} Members)
                </h3>
                <p className="text-xs text-slate-500">
                  Click on any employee to view their full profile, attendance, and records
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddEmployeeModal}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </button>
                <button
                  onClick={() => onNavigateModule('employees')}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View Full Table ➔
                </button>
              </div>
            </div>

            {/* Employee Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-3"
                  title="Click to view details"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {emp.firstName?.[0] || 'K'}{emp.lastName?.[0] || 'S'}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                        {emp.status || 'Active'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                        {emp.designationTitle || 'Staff Member'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {emp.departmentName || 'Engineering & Tech'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        {emp.employeeCode} • {emp.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800">
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Module Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateModule('attendance')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Attendance Log</p>
                <p className="text-xs text-slate-500">Monthly roster & punches</p>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('payroll')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Payroll Processing</p>
                <p className="text-xs text-slate-500">Salary slips & calculations</p>
              </div>
            </div>

            <div
              onClick={() => onNavigateModule('calendar')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Company Calendar</p>
                <p className="text-xs text-slate-500">Holidays & official shifts</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* EMPLOYEE SELF-SERVICE VIEW (Simple, Clean & Tactile)           */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Top 3 Interactive Widgets: Live Attendance, Leave Balance, Next Holiday */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Live Attendance & Clock In / Out Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Live Attendance
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isCheckedIn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCheckedIn ? '● Clocked In' : 'Not Clocked In'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl my-3 text-center">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{currentTime || '04:00 PM'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {isCheckedIn ? `Punched in at ${checkInTime}` : 'Shift: 09:30 AM – 06:30 PM'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {isCheckedIn
                    ? 'Your working hours are being counted in real-time. Remember to punch out before leaving.'
                    : 'Click the button below to record your punch in for today.'}
                </p>
              </div>

              <div>
                <button
                  onClick={handleToggleClockIn}
                  disabled={clockInLoading}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 ${
                    isCheckedIn
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {clockInLoading
                      ? 'Updating...'
                      : isCheckedIn
                      ? 'Punch Out (Clock Out)'
                      : 'Punch In (Clock In)'}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Leave Balance */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Leave Balance
                  </span>
                  <button
                    onClick={onOpenLeaveModal}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    + Apply Leave
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Annual Paid Leave</span>
                    <span className="font-extrabold text-slate-900">3.12 days available</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2.5">
                    <div className="w-3/5 bg-indigo-600 h-full rounded-full" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Upcoming Leave</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">No upcoming leaves scheduled</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateModule('leaves')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                View Leave History ➔
              </button>
            </div>

            {/* 3. My Profile Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block pb-2">
                  My Profile
                </span>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {primaryEmployee.firstName?.[0] || 'K'}{primaryEmployee.lastName?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {primaryEmployee.firstName} {primaryEmployee.lastName}
                    </h3>
                    <p className="text-xs text-indigo-600 font-semibold">{primaryEmployee.designationTitle}</p>
                    <p className="text-xs text-slate-500">{primaryEmployee.departmentName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Code</p>
                    <p className="font-bold text-slate-900 mt-0.5">{primaryEmployee.employeeCode}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                    <p className="font-bold text-emerald-600 mt-0.5">Active</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectEmployee(primaryEmployee)}
                  className="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors text-center"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onNavigateModule('documents')}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors text-center"
                >
                  Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
