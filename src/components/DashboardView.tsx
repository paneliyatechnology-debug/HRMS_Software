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
  MapPin,
  Laptop,
  FolderGit2,
  FileText,
  ChevronDown,
  Sparkles,
  Zap,
  Filter,
  Search,
  ExternalLink,
  PlaneTakeoff,
  TrendingUp,
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
  const currentEmpId = user.employeeId || user.id || '';
  const currentEmp: Employee =
    employees.find(
      (e) =>
        (currentEmpId && (e.id === currentEmpId || (e as any)._id === currentEmpId)) ||
        (user.email && e.email && e.email.toLowerCase() === user.email.toLowerCase()) ||
        ((user as any).employeeCode && e.employeeCode && e.employeeCode.toLowerCase() === (user as any).employeeCode.toLowerCase())
    ) || {
      id: currentEmpId || 'emp-self',
      employeeCode: (user as any).employeeCode || 'EMP-1',
      firstName: user.firstName || 'Keyur',
      lastName: user.lastName || 'Sangani',
      email: user.email || 'keyursangani1210@gmail.com',
      phone: (user as any).phone || '6352486893',
      avatarUrl: user.avatarUrl || '',
      gender: 'Male',
      dateOfBirth: '1996-05-15',
      address: 'Surat, Gujarat',
      emergencyContact: { name: '', relationship: '', phone: '' },
      joiningDate: '2026-01-01',
      employmentType: 'Full-time',
      status: 'Active',
      departmentId: 'dept-1',
      departmentName: (user as any).departmentName || 'Engineering',
      designationId: 'des-1',
      designationTitle: (user as any).designationTitle || (user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff Member'),
      workLocationId: 'loc-1',
      workLocationName: 'HQ Tech Park',
      shift: 'General Shift (09:00 AM – 06:00 PM)',
      bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: '' },
      taxInformation: { taxId: '', panOrSsn: '', taxRegime: 'New Regime' },
      education: [],
      previousExperience: [],
      skills: [],
      salary: { basic: 50000, hra: 20000, allowances: 10000, bonus: 5000, pf: 6000, tax: 8000, professionalTax: 200, gross: 85000, net: 70800 },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

  const activeEmpId = currentEmp.id || currentEmpId;

  // Live punch status for current user
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(activeEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveWorkedSeconds, setLiveWorkedSeconds] = useState(0);
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Jibble Task / Project Tracking state
  const [selectedProject, setSelectedProject] = useState('Paneliya HRMS Core');
  const [selectedActivity, setSelectedActivity] = useState('Software Engineering');
  const [taskNote, setTaskNote] = useState('');

  // Who's In Filter State
  const [rosterTab, setRosterTab] = useState<'all' | 'in' | 'break' | 'out'>('all');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDept, setRosterDept] = useState('ALL');

  // Checkout modal
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);

  // Leave approval state
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  // Sync and tick timer every second
  const refreshAttendanceState = () => {
    const records = getAllAttendanceRecords();
    setAllAttendance(records);
    const eligibility = checkEmployeePunchEligibility(activeEmpId);
    setPunchState(eligibility);

    if (eligibility.record) {
      const active = getLiveActiveSeconds(eligibility.record);
      const brk = getLiveBreakSeconds(eligibility.record);
      setLiveWorkedSeconds(active);
      setLiveWorkedHMS(formatSecondsToHMS(active));
      setLiveBreakWords(formatSecondsToWords(brk));
    } else {
      setLiveWorkedSeconds(0);
      setLiveWorkedHMS('00:00:00');
      setLiveBreakWords('0s');
    }
  };

  useEffect(() => {
    refreshAttendanceState();
    const interval = setInterval(refreshAttendanceState, 1000);
    window.addEventListener('hrms_attendance_updated', refreshAttendanceState);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hrms_attendance_updated', refreshAttendanceState);
    };
  }, [activeEmpId]);

  // Handle Punch In
  const handleCheckInAction = () => {
    setActionLoading(true);
    try {
      const res = performCheckIn({
        id: activeEmpId,
        firstName: currentEmp.firstName,
        lastName: currentEmp.lastName,
        employeeCode: currentEmp.employeeCode,
        departmentName: currentEmp.departmentName,
      });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Clocked In Successfully',
          message: `Shift started on ${selectedProject} (${selectedActivity}).`,
        });
        refreshAttendanceState();
        if (onRefreshData) onRefreshData();
      } else {
        showToast({ type: 'warning', title: 'Cannot Clock In', message: res.message });
      }
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', title: 'Error', message: 'Failed to clock in.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Break
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

  // Handle Resume
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

  // Handle Check Out
  const executeCheckOut = () => {
    setCheckOutModalOpen(false);
    setActionLoading(true);
    try {
      const res = performCheckOut(activeEmpId);
      if (res.success) {
        showToast({ type: 'success', title: 'Clocked Out', message: res.message });
        refreshAttendanceState();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', title: 'Clock Out Error', message: err.message || 'Failed to check out.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Leave Quick Approvals
  const handleApproveLeave = async (id: string, empName: string) => {
    setProcessingLeaveId(id);
    try {
      await api.approveLeave(id, `${user.firstName} ${user.lastName}`);
      showToast({
        type: 'success',
        title: 'Leave Approved',
        message: `${empName}'s time off request has been approved.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Could not approve leave.' });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleRejectLeave = async (id: string, empName: string) => {
    setProcessingLeaveId(id);
    try {
      await api.rejectLeave(id, `${user.firstName} ${user.lastName}`, 'Operational requirements');
      showToast({
        type: 'warning',
        title: 'Leave Rejected',
        message: `${empName}'s leave request was declined.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Could not reject leave.' });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // Compute Live Team Stats
  const todayDate = getTodayDateString();
  const todayRecords = allAttendance.filter((a) => a.date === todayDate);

  // Map each employee to their live presence status
  const teamPresenceList = employees.map((emp) => {
    const rec = todayRecords.find((r) => r.employeeId === emp.id || r.employeeCode === emp.employeeCode);
    if (!rec) {
      return {
        emp,
        status: 'out' as const,
        statusLabel: 'Clocked Out',
        color: 'slate',
        clockInTime: null,
        activeSeconds: 0,
        formattedDuration: '00h 00m',
        project: '—',
        activity: 'Off Shift',
      };
    }

    if (rec.isCompleted) {
      return {
        emp,
        status: 'completed' as const,
        statusLabel: 'Shift Completed',
        color: 'slate',
        clockInTime: rec.checkIn,
        activeSeconds: rec.activeSeconds || 0,
        formattedDuration: formatSecondsToWords(rec.activeSeconds || 0),
        project: 'Paneliya Core',
        activity: 'Finalized',
      };
    }

    if (rec.isOnBreak) {
      const sec = getLiveActiveSeconds(rec);
      return {
        emp,
        status: 'break' as const,
        statusLabel: 'On Break',
        color: 'amber',
        clockInTime: rec.checkIn,
        activeSeconds: sec,
        formattedDuration: formatSecondsToWords(sec),
        project: 'Paneliya Core',
        activity: 'On Break',
      };
    }

    const sec = getLiveActiveSeconds(rec);
    return {
      emp,
      status: 'in' as const,
      statusLabel: 'Clocked In',
      color: 'emerald',
      clockInTime: rec.checkIn,
      activeSeconds: sec,
      formattedDuration: formatSecondsToWords(sec),
      project: 'Paneliya Core',
      activity: 'Engineering',
    };
  });

  const totalMembersCount = employees.length || 1;
  const clockedInList = teamPresenceList.filter((m) => m.status === 'in');
  const onBreakList = teamPresenceList.filter((m) => m.status === 'break');
  const clockedOutList = teamPresenceList.filter((m) => m.status === 'out' || m.status === 'completed');

  // Filtered Roster
  const filteredPresence = teamPresenceList.filter((m) => {
    if (rosterTab === 'in' && m.status !== 'in') return false;
    if (rosterTab === 'break' && m.status !== 'break') return false;
    if (rosterTab === 'out' && m.status !== 'out' && m.status !== 'completed') return false;

    if (rosterDept !== 'ALL' && m.emp.departmentId !== rosterDept && m.emp.departmentName !== rosterDept) {
      return false;
    }

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      const matchName = `${m.emp.firstName} ${m.emp.lastName}`.toLowerCase().includes(q);
      const matchCode = m.emp.employeeCode?.toLowerCase().includes(q);
      const matchDept = m.emp.departmentName?.toLowerCase().includes(q);
      return matchName || matchCode || matchDept;
    }
    return true;
  });

  // Total hours across team today
  const totalTeamSeconds = teamPresenceList.reduce((acc, m) => acc + m.activeSeconds, 0);
  const totalTeamHMS = formatSecondsToWords(totalTeamSeconds);

  // Daily target calculation (8 hours = 28,800 seconds)
  const targetSeconds = 8 * 3600;
  const progressPercent = Math.min(100, Math.round((liveWorkedSeconds / targetSeconds) * 100));

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

  return (
    <div className="space-y-6 pb-16 w-full max-w-full overflow-hidden">
      {/* Top Welcome & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              👋 Welcome, {currentEmp.firstName || 'Keyur'}!
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200">
              Live Workforce
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {currentDateString} • Paneliya Technology Enterprise Hub (Surat, GMT+05:30)
          </p>
        </div>

        {/* System Digital Clock Header Widget */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="font-mono font-bold text-slate-800 text-sm tracking-tight">{currentTime || '12:00:00 PM'}</span>
          </div>

          {portalMode === 'admin' && (
            <button
              onClick={onOpenAddEmployeeModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. THE ICONIC JIBBLE WEB PUNCH CLOCK HERO CARD                 */}
      {/* ============================================================== */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-white via-slate-50/60 to-indigo-50/20 border border-indigo-200/60 shadow-lg shadow-indigo-600/5 relative overflow-hidden">
        {/* Subtle decorative glowing corner */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Column: Live Status & Digital Time */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              {punchState.status === 'working' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span>CLOCKED IN • {punchState.record?.checkIn || '09:00 AM'}</span>
                </div>
              ) : punchState.status === 'on_break' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-xs shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>ON BREAK • {liveBreakWords}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>CLOCKED OUT • Shift Not Started</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {currentTime || '12:00:00 PM'}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDateString}</span>
              </p>
            </div>

            {/* Geofence & Device Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold">
                <MapPin className="w-3 h-3 text-indigo-500" /> HQ Surat Office
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold">
                <Laptop className="w-3 h-3 text-emerald-500" /> Web Browser
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold">
                <Shield className="w-3 h-3 text-violet-500" /> Geofence Verified
              </span>
            </div>
          </div>

          {/* Center Column: Live Worked Hours Counter & Progress Bar */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Today's Tracked Time
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 tracking-tight block">
                  {liveWorkedHMS}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Daily Goal (8h)
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {progressPercent}% <span className="text-slate-400 font-normal">completed</span>
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Jibble Project & Task Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Project / Client
                </label>
                <div className="relative">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full h-8 px-2.5 pr-7 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="Paneliya HRMS Core">Paneliya HRMS Core</option>
                    <option value="Enterprise Cloud Migration">Enterprise Cloud Migration</option>
                    <option value="Client Custom Solutions">Client Custom Solutions</option>
                    <option value="Internal Operations">Internal Operations</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Activity / Task
                </label>
                <div className="relative">
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full h-8 px-2.5 pr-7 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Code Review & Testing">Code Review & Testing</option>
                    <option value="Team Sync / Meeting">Team Sync / Meeting</option>
                    <option value="Architecture & Planning">Architecture & Planning</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Large Action Buttons (Jibble CTAs) */}
          <div className="lg:col-span-3 flex flex-col gap-2.5 justify-center">
            {punchState.status === 'not_started' && (
              <button
                id="btn-jibble-clock-in"
                onClick={handleCheckInAction}
                disabled={actionLoading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-base transition-all shadow-lg shadow-emerald-600/30 active:scale-98 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Clock In</span>
              </button>
            )}

            {punchState.status === 'working' && (
              <div className="flex flex-col gap-2 w-full">
                <button
                  id="btn-jibble-take-break"
                  onClick={handleTakeBreakAction}
                  disabled={actionLoading}
                  className="w-full h-11 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98"
                >
                  <Coffee className="w-4 h-4 text-amber-700" />
                  <span>Take Break</span>
                </button>
                <button
                  id="btn-jibble-clock-out"
                  onClick={() => setCheckOutModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs transition-all shadow-sm shadow-rose-600/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Clock Out</span>
                </button>
              </div>
            )}

            {punchState.status === 'on_break' && (
              <div className="flex flex-col gap-2 w-full">
                <button
                  id="btn-jibble-resume"
                  onClick={handleResumeWorkAction}
                  disabled={actionLoading}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-600/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Work</span>
                </button>
                <button
                  id="btn-jibble-clock-out-break"
                  onClick={() => setCheckOutModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs active:scale-98 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Clock Out</span>
                </button>
              </div>
            )}

            {punchState.status === 'completed' && (
              <div className="text-center p-3 rounded-xl bg-slate-100 border border-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">Shift Completed</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Next check-in tomorrow</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. JIBBLE KEY WORKFORCE METRICS BAR                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Tracked Today */}
        <div
          onClick={() => onNavigateModule('attendance')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Tracked Today</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{totalTeamHMS}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Across active workforce
          </p>
        </div>

        {/* Metric 2: Who's In Real-Time */}
        <div
          onClick={() => setRosterTab('in')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Who's In Now</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {clockedInList.length} <span className="text-base text-slate-400 font-sans font-medium">/ {totalMembersCount}</span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {Math.round((clockedInList.length / totalMembersCount) * 100)}% of team active
          </p>
        </div>

        {/* Metric 3: On Break */}
        <div
          onClick={() => setRosterTab('break')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">On Break</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{onBreakList.length}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">
            {onBreakList.length > 0 ? `${onBreakList.length} team members paused` : 'No one on break right now'}
          </p>
        </div>

        {/* Metric 4: Pending Time Off */}
        <div
          onClick={() => onNavigateModule('leaves')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Time Off Requests</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlaneTakeoff className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{pendingLeaves.length}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            {pendingLeaves.length > 0 ? `${pendingLeaves.length} awaiting approval` : 'All time off cleared'}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. THE SIGNATURE JIBBLE "WHO'S IN / WHO'S OUT" ROSTER BOARD   */}
      {/* ============================================================== */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        {/* Roster Header with Title & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Team Presence & Who’s In
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time attendance status and live duration counter for every team member
            </p>
          </div>

          {/* Roster Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-bold">
            <button
              onClick={() => setRosterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                rosterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalMembersCount})
            </button>
            <button
              onClick={() => setRosterTab('in')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                rosterTab === 'in'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-emerald-700 hover:bg-white/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              In ({clockedInList.length})
            </button>
            <button
              onClick={() => setRosterTab('break')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                rosterTab === 'break'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : 'text-amber-800 hover:bg-white/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-200" />
              Break ({onBreakList.length})
            </button>
            <button
              onClick={() => setRosterTab('out')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                rosterTab === 'out'
                  ? 'bg-slate-800 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out ({clockedOutList.length})
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, role or EMP code..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Filter Dept:</span>
            <select
              value={rosterDept}
              onChange={(e) => setRosterDept(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              <option value="dept-1">Administration & Management</option>
              <option value="dept-2">Engineering & Tech</option>
              <option value="dept-3">Product & Design</option>
              <option value="dept-4">Sales & Marketing</option>
            </select>
          </div>
        </div>

        {/* Member Grid (Jibble Roster Cards) */}
        {filteredPresence.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-slate-50 border border-slate-100">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No team members match this filter</p>
            <p className="text-xs text-slate-400 mt-1">Try switching tabs or clearing your search filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPresence.map(({ emp, status, statusLabel, clockInTime, formattedDuration, project, activity }) => {
              const isSelf = emp.id === activeEmpId || emp.employeeCode === currentEmp.employeeCode;

              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md relative group ${
                    status === 'in'
                      ? 'bg-white border-emerald-200/80 shadow-2xs'
                      : status === 'break'
                      ? 'bg-amber-50/30 border-amber-200/80 shadow-2xs'
                      : 'bg-white border-slate-200/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Avatar with Status Ring */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center ring-2 ring-white shadow-xs overflow-hidden">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                        )}
                      </div>
                      {/* Live status dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white flex items-center justify-center ${
                          status === 'in'
                            ? 'bg-emerald-500'
                            : status === 'break'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      >
                        {status === 'in' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900 truncate">
                          {emp.firstName} {emp.lastName}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {emp.designationTitle || 'Staff'} • {emp.employeeCode || 'EMP'}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          status === 'in'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'break'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Activity & Running Timer Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Tracked Today
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {status === 'out' ? '—' : formattedDuration}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        In Time
                      </span>
                      <span className="font-semibold text-slate-600">
                        {clockInTime ? clockInTime : 'Not In'}
                      </span>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 ml-2">
                      {onOpenChatWithEmployee && (
                        <button
                          onClick={() => onOpenChatWithEmployee(emp.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition"
                          title="Message on Team Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectEmployee(emp)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        title="View Full Profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. WEEKLY TIMESHEET SNAPSHOT & TIME OFF APPROVALS              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Timesheet Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Weekly Timesheet Snapshot
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target 8h daily • Total this week: 38.5 hrs
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('attendance')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Full Timesheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 7-Day Bar Chart Simulation */}
          <div className="pt-4 grid grid-cols-7 gap-2 sm:gap-3 items-end h-48 border-b border-slate-100 pb-2">
            {[
              { day: 'Mon', date: 'Oct 19', hours: 8.5, active: true },
              { day: 'Tue', date: 'Oct 20', hours: 8.0, active: true },
              { day: 'Wed', date: 'Oct 21', hours: 7.5, active: true },
              { day: 'Thu', date: 'Oct 22', hours: 8.2, active: true },
              { day: 'Fri', date: 'Oct 23', hours: Math.min(8.5, Math.max(2, liveWorkedSeconds / 3600)), today: true },
              { day: 'Sat', date: 'Oct 24', hours: 0, weekend: true },
              { day: 'Sun', date: 'Oct 25', hours: 0, weekend: true },
            ].map((col, idx) => {
              const maxHeight = 10;
              const fillPct = Math.min(100, (col.hours / maxHeight) * 100);
              const isOvertime = col.hours > 8.0;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {col.hours.toFixed(1)}h
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden p-1">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        col.today
                          ? 'bg-gradient-to-t from-indigo-600 to-violet-500'
                          : isOvertime
                          ? 'bg-gradient-to-t from-indigo-500 to-emerald-400'
                          : col.weekend
                          ? 'bg-transparent'
                          : 'bg-indigo-400'
                      }`}
                      style={{ height: `${fillPct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-bold ${col.today ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {col.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" /> Regular Hours
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" /> Overtime (1.5x)
              </span>
            </div>
            <span className="font-semibold text-slate-700">Target: 40 hrs/wk</span>
          </div>
        </div>

        {/* Pending Time Off & Leaves Approval Queue */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {portalMode === 'admin' ? 'Time Off Requests' : 'My Leave Balances'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {portalMode === 'admin'
                  ? `${pendingLeaves.length} requests awaiting managerial decision`
                  : 'Annual leave policy balances'}
              </p>
            </div>
            {portalMode === 'employee' && (
              <button
                onClick={onOpenLeaveModal}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Apply Time Off
              </button>
            )}
          </div>

          {portalMode === 'admin' ? (
            <div className="space-y-3">
              {pendingLeaves.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">All Time Off Cleared</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No pending leave requests</p>
                </div>
              ) : (
                pendingLeaves.slice(0, 3).map((l) => (
                  <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {l.employeeName?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{l.employeeName}</p>
                          <p className="text-[10px] text-slate-500">{l.leaveType} • {l.daysCount} day(s)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{l.startDate}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic font-sans pl-9">
                      "{l.reason || 'Personal requirements'}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectLeave(l.id, l.employeeName)}
                        disabled={processingLeaveId === l.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApproveLeave(l.id, l.employeeName)}
                        disabled={processingLeaveId === l.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase block">Casual</span>
                  <span className="text-xl font-black text-indigo-900 block mt-0.5">8</span>
                  <span className="text-[10px] text-indigo-600">days left</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Sick</span>
                  <span className="text-xl font-black text-emerald-900 block mt-0.5">7</span>
                  <span className="text-[10px] text-emerald-600">days left</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Paid</span>
                  <span className="text-xl font-black text-amber-900 block mt-0.5">12</span>
                  <span className="text-[10px] text-amber-600">days left</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-900 block">Upcoming Holiday:</span>
                <p className="text-xs text-slate-600 mt-0.5">Diwali Festivities (Nov 1, 2026) • All offices closed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check Out Confirmation Modal */}
      {checkOutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Square className="w-5 h-5 fill-current" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">End Shift & Clock Out?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You have worked <span className="font-bold font-mono text-slate-800">{liveWorkedHMS}</span> today. Your timesheet will be finalized for payroll.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCheckOutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                Continue Working
              </button>
              <button
                onClick={executeCheckOut}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Confirm Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
