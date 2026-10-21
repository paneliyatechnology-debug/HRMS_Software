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

  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateString, setCurrentDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setCurrentDateString(
        now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (portalMode === 'admin') {
      setActiveTab('hr');
    } else {
      setActiveTab('my');
    }
  }, [portalMode]);

  // Attendance state
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [clockInLoading, setClockInLoading] = useState(false);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

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

  const handleDashboardRejectLeave = async (id: string, empName: string) => {
    const reason = prompt(`Rejection reason for ${empName}:`, 'Operational requirements');
    if (!reason) return;
    setProcessingLeaveId(id);
    try {
      await api.rejectLeave(id, 'Keyur Sangani', reason);
      showToast({
        type: 'warning',
        title: 'Rejected',
        message: `${empName}'s leave request was rejected.`,
      });
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

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendance.find(
      (a) => (a.employeeId === 'emp-1' || a.employeeName?.includes('Keyur')) && a.date === today
    );
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      setIsCheckedIn(true);
      setCheckInTime(todayRecord.checkIn);
    } else {
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  }, [attendance]);

  const handleToggleClockIn = async () => {
    setClockInLoading(true);
    try {
      if (!isCheckedIn) {
        await api.checkIn('emp-1', 'Self clock-in');
        setIsCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } else {
        await api.checkOut('emp-1', 'Self clock-out');
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
    designationTitle: 'App Administrator',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {activeTab === 'hr' ? 'HR Overview' : 'My Workspace'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentDateString}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('hr')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'hr'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HR Admin
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'my'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Self-Service
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'hr' ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigateModule('employees')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
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
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">Today's Attendance</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{isCheckedIn ? '1' : '0'} / {employees.length}</p>
              <p className="text-xs text-slate-500 mt-1">{isCheckedIn ? '1 Present today' : 'No punches today'}</p>
            </div>

            <div
              onClick={() => onNavigateModule('leaves')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">Pending Leaves</span>
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">System Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Connected</p>
              <p className="text-xs text-slate-500 mt-1">API Port 4000 Online</p>
            </div>
          </div>

          {/* Pending Leave Requests Section */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                        <div className="flex items-center gap-2">
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
                          Reason: <span className="text-slate-800">"{leave.reason}"</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleDashboardApproveLeave(leave.id, leave.employeeName, leave.leaveType)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
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

          {/* Workforce Directory */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 sm:px-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Employees ({employees.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Quick directory overview</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddEmployeeModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                >
                  + Add Employee
                </button>
                <button
                  onClick={() => onNavigateModule('employees')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  Directory Table
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">NAME</th>
                    <th className="py-2.5 px-4 font-medium">CODE</th>
                    <th className="py-2.5 px-4 font-medium">DESIGNATION</th>
                    <th className="py-2.5 px-4 font-medium">DEPARTMENT</th>
                    <th className="py-2.5 px-4 font-medium">STATUS</th>
                    <th className="py-2.5 px-4 font-medium text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                          {emp.firstName?.[0] || 'E'}
                        </div>
                        <span>{emp.firstName} {emp.lastName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{emp.employeeCode}</td>
                      <td className="py-3 px-4 text-slate-700">{emp.designationTitle || 'Staff'}</td>
                      <td className="py-3 px-4 text-slate-500">{emp.departmentName || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emp.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-slate-600 hover:text-slate-900 font-medium">
                          View
                        </span>
                      </td>
                    </tr>
                  ))}
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
            {/* Clock Widget */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium uppercase tracking-wide">Attendance Punch</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      isCheckedIn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCheckedIn ? 'Clocked In' : 'Clocked Out'}
                  </span>
                </div>

                <div className="my-4 py-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                  <p className="text-2xl font-semibold text-slate-900">{currentTime || '05:00 PM'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isCheckedIn ? `In since ${checkInTime}` : 'Regular Shift: 09:30 AM – 06:30 PM'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleClockIn}
                disabled={clockInLoading}
                className={`w-full h-10 rounded-lg text-sm font-medium transition-colors ${
                  isCheckedIn
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {clockInLoading
                  ? 'Saving...'
                  : isCheckedIn
                  ? 'Clock Out'
                  : 'Clock In'}
              </button>
            </div>

            {/* Leave Balances */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium uppercase tracking-wide">Leave Balance</span>
                  <button
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

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 block mb-3">
                  My Profile
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-semibold flex items-center justify-center text-sm">
                    {primaryEmployee.firstName?.[0] || 'K'}{primaryEmployee.lastName?.[0] || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {primaryEmployee.firstName} {primaryEmployee.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{primaryEmployee.designationTitle}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{primaryEmployee.employeeCode}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectEmployee(primaryEmployee)}
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
    </div>
  );
};
