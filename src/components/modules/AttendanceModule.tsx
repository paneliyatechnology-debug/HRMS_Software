'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Download,
  Star,
  Check,
  AlertCircle,
  X,
  Plane,
  Home,
  ChevronDown,
  Clock,
  User,
  List,
  CalendarDays,
  ShieldCheck,
  Coffee,
  Pause,
  Sliders,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types/hrms';
import {
  getAllAttendanceRecords,
  getTodayRecordForEmployee,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  formatSecondsToWords,
  formatSecondsToHMS,
  getTodayDateString,
  saveAttendanceRecords,
} from '../../lib/attendanceService';
import {
  getAllEmployeeActivities,
  EmployeeActivityStatus,
} from '../../lib/activityTracker';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface AttendanceModuleProps {
  records: AttendanceRecord[];
  employees: Employee[];
  initialTab?: 'today' | 'summary' | 'roster' | 'holidays';
  onOpenPunchModal: () => void;
  onRefresh: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  records,
  employees,
  initialTab = 'today',
  onOpenPunchModal,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const [activeTab, setActiveTab] = useState<'today' | 'summary' | 'roster' | 'holidays'>(initialTab || 'today');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>([]);

  // Real-time Employee Activity status (mouse/screen movement)
  const [activities, setActivities] = useState<Record<string, EmployeeActivityStatus>>({});

  useEffect(() => {
    const syncActivities = () => {
      setActivities(getAllEmployeeActivities());
    };
    syncActivities();
    const interval = setInterval(syncActivities, 2000);
    window.addEventListener('hrms_employee_activity_updated', syncActivities);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hrms_employee_activity_updated', syncActivities);
    };
  }, []);

  // Modal: HR Regularization
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regEmpId, setRegEmpId] = useState(employees[0]?.id || 'emp-1');
  const [regDate, setRegDate] = useState('2026-10-21');
  const [regCheckIn, setRegCheckIn] = useState('09:00 AM');
  const [regCheckOut, setRegCheckOut] = useState('06:00 PM');
  const [regStatus, setRegStatus] = useState<'Present' | 'Half Day' | 'Late'>('Present');
  const [regRemarks, setRegRemarks] = useState('Missed punch due to biometric maintenance');

  // Modal: Biometric Hardware Sync
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [bioDeviceId, setBioDeviceId] = useState('GATE-01-TERMINAL');
  const [bioEmployeeCode, setBioEmployeeCode] = useState('EMP-1');
  const [bioSyncing, setBioSyncing] = useState(false);

  const handleRegularizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.regularizeAttendance({
        employeeId: regEmpId,
        date: regDate,
        checkIn: regCheckIn,
        checkOut: regCheckOut,
        status: regStatus,
        remarks: regRemarks,
      });

      // Also persist to local attendanceService so UI timer and dashboard stay in sync
      const existing = getAllAttendanceRecords();
      const targetEmp = employees.find((emp) => emp.id === regEmpId);
      const updated = [
        ...existing.filter((r) => !(r.employeeId === regEmpId && r.date === regDate)),
        {
          id: `att-reg-${Date.now()}`,
          employeeId: regEmpId,
          employeeName: targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Employee',
          date: regDate,
          checkIn: regCheckIn,
          checkOut: regCheckOut,
          status: regStatus,
          activeSeconds: 28800,
          breakSeconds: 3600,
          breakDurationMinutes: 60,
          workingHours: 8,
          overtimeHours: 0,
          isCompleted: true,
          isOnBreak: false,
          remarks: regRemarks,
          createdAt: new Date().toISOString(),
        },
      ];
      saveAttendanceRecords(updated as AttendanceRecord[]);

      showToast({
        type: 'success',
        title: 'Attendance Regularized',
        message: `Punches for ${regDate} corrected and logged in audit trail.`,
      });
      setIsRegModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Regularization Failed',
        message: err.message || 'Could not regularize attendance.',
      });
    }
  };

  const handleBiometricSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBioSyncing(true);
    try {
      const nowStr = new Date().toISOString();
      await api.syncBiometricAttendance([
        {
          deviceId: 'ZK-DEV-01',
          employeeCode: bioEmployeeCode,
          punchTime: nowStr,
          type: 'IN',
        },
      ]);

      showToast({
        type: 'success',
        title: 'Biometric Machine Synced',
        message: `Synchronized biometric punch logs from ${bioDeviceId}.`,
      });
      setIsBiometricModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message || 'Could not sync biometric machine.',
      });
    } finally {
      setBioSyncing(false);
    }
  };

  useEffect(() => {
    const update = () => {
      setLiveRecords(getAllAttendanceRecords());
    };
    update();
    const timer = setInterval(update, 1000);
    const handleUpdate = () => update();
    window.addEventListener('hrms_attendance_updated', handleUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener('hrms_attendance_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Days in October 2026 (1 to 31)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const date = new Date(2026, 9, day); // month 9 is October
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return { day, dayName };
  });

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'summary') {
      csvContent += 'Employee ID,Name,Month,Year\n';
      employees.forEach((e) => {
        csvContent += `${e.employeeCode || e.id},"${e.firstName} ${e.lastName}",${selectedMonth},${selectedYear}\n`;
      });
    } else if (activeTab === 'roster') {
      csvContent += 'Employee ID,Name,Shift Name,Timing,Weekly Off\n';
      employees.forEach((e) => {
        csvContent += `${e.employeeCode || e.id},"${e.firstName} ${e.lastName}","General Corporate Shift","09:00 AM - 06:00 PM","Saturday, Sunday"\n`;
      });
    } else {
      csvContent += 'Date,Holiday Name,Day,Type\n';
      holidaysList.forEach((h) => {
        csvContent += `"${h.date}","${h.name}","${h.day}","${h.type}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const holidaysList = [
    { date: '02-Oct-2026', name: 'Mahatma Gandhi Jayanti', day: 'Friday', type: 'National Holiday' },
    { date: '20-Oct-2026', name: 'Maha Navami', day: 'Tuesday', type: 'Festival' },
    { date: '21-Oct-2026', name: 'Dussehra / Vijaya Dashami', day: 'Wednesday', type: 'Gazetted Holiday' },
    { date: '29-Oct-2026', name: 'Karwa Chauth', day: 'Thursday', type: 'Restricted Holiday' },
    { date: '08-Nov-2026', name: 'Dhanteras', day: 'Sunday', type: 'Festival' },
    { date: '09-Nov-2026', name: 'Diwali / Lakshmi Puja', day: 'Monday', type: 'Public Holiday' },
    { date: '10-Nov-2026', name: 'Gujarati New Year / Bestu Varas', day: 'Tuesday', type: 'Public Holiday' },
    { date: '11-Nov-2026', name: 'Bhai Dooj', day: 'Wednesday', type: 'Restricted Holiday' },
    { date: '25-Dec-2026', name: 'Christmas Day', day: 'Friday', type: 'Public Holiday' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none animate-in fade-in">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor daily clock punches, shifts roster, and company public holiday schedules
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'today'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Live Tracker
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Summary
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'roster'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shift Roster
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'holidays'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Holiday Schedule
          </button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenPunchModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => setIsRegModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Regularize Punch</span>
          </button>

          <button
            onClick={() => setIsBiometricModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Biometric Sync</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters dropdowns for Summary */}
        {activeTab === 'summary' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800 shadow-2xs"
            >
              <option value="October">October 2026</option>
              <option value="November">November 2026</option>
              <option value="December">December 2026</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB: Today's Live Attendance & Break Tracker */}
      {activeTab === 'today' && (() => {
        const todayDate = getTodayDateString();
        const todayRecords = liveRecords.filter((r) => r.date === todayDate);
        const workingCount = todayRecords.filter((r) => !r.isCompleted && !r.isOnBreak).length;
        const onBreakCount = todayRecords.filter((r) => !r.isCompleted && r.isOnBreak).length;
        const completedCount = todayRecords.filter((r) => r.isCompleted).length;

        return (
          <div className="space-y-4">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase">Punched Today</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{todayRecords.length} / {employees.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Total registered</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase">Working Now</span>
                <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {workingCount}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Active timers</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase">On Break</span>
                <p className="text-xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  {onBreakCount}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Timer paused</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase">Shift Completed</span>
                <p className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-600" />
                  {completedCount}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Checked out</p>
              </div>
            </div>

            {/* Live Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Today's Live Workforce Shift Log</h3>
                  <p className="text-xs text-slate-500">Live work timers and break intervals updating every second</p>
                </div>
                <button
                  onClick={onOpenPunchModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                >
                  Clock In / Out
                </button>
              </div>

              <div className="overflow-x-auto w-full [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">EMPLOYEE</th>
                      <th className="py-2.5 px-4 font-medium">DEPARTMENT</th>
                      <th className="py-2.5 px-4 font-medium">CHECK IN</th>
                      <th className="py-2.5 px-4 font-medium">CHECK OUT</th>
                      <th className="py-2.5 px-4 font-medium">ACTIVE WORKED</th>
                      <th className="py-2.5 px-4 font-medium">BREAK TIME</th>
                      <th className="py-2.5 px-4 font-medium">LIVE STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => {
                      const rec = getTodayRecordForEmployee(emp.id);
                      const isWorking = rec && !rec.isCompleted && !rec.isOnBreak;
                      const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
                      const isDone = rec && rec.isCompleted;
                      const isIdle = activities[emp.id]?.isIdle || false;

                      const liveSecs = rec ? getLiveActiveSeconds(rec) : 0;
                      const breakSecs = rec ? getLiveBreakSeconds(rec) : 0;

                      return (
                        <tr
                          key={emp.id}
                          className={`transition-colors ${
                            isIdle
                              ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full border font-semibold text-xs flex items-center justify-center shrink-0 ${
                                isIdle
                                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {emp.firstName?.[0] || 'E'}
                            </div>
                            <div>
                              <p className={`font-semibold ${isIdle ? 'text-rose-900' : 'text-slate-900'}`}>
                                {emp.firstName} {emp.lastName}
                              </p>
                              {isIdle ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-400 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                                  {emp.employeeCode} • IDLE &gt;5M
                                </span>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{emp.departmentName || 'General'}</td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {rec?.checkIn || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {rec?.checkOut || (isWorking ? <span className="text-emerald-600 font-medium">Working...</span> : <span className="text-slate-400">—</span>)}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {rec ? (
                              <span className={isWorking ? (isIdle ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-800'}>
                                {formatSecondsToHMS(liveSecs)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {breakSecs > 0 ? (
                              <span className={isOnBreak ? 'text-amber-700 font-semibold' : ''}>
                                {formatSecondsToWords(breakSecs)}
                              </span>
                            ) : (
                              <span className="text-slate-400">0s</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isIdle ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1 w-fit animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                                Idle (&gt;5m No Mouse Activity)
                              </span>
                            ) : isWorking ? (
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 1: Attendance Summary (31-day October 2026 Matrix) */}
      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Attendance Summary (October 2026)</h2>
          </div>

          {/* Status Legend Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
              <span>Day Off</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                !
              </span>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <X className="w-3.5 h-3.5 text-slate-500 stroke-[3]" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
              <span>On Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-sky-500" />
              <span>Work From Home</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border-t border-slate-100 pt-2 [scrollbar-width:thin]">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-4 text-left font-bold text-slate-600 sticky left-0 bg-white z-10 w-44">
                    EMPLOYEE
                  </th>
                  {daysInMonth.map(({ day, dayName }) => (
                    <th key={day} className="py-2 px-2 min-w-8">
                      <div>{day}</div>
                      <div className="text-[9px] text-slate-400 font-semibold">{dayName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {employees.map((emp) => {
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Employee column */}
                      <td className="py-3 px-4 text-left sticky left-0 bg-white z-10 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px] flex items-center justify-center shrink-0">
                          {emp.firstName[0]}
                          {emp.lastName ? emp.lastName[0] : ''}
                        </div>
                        <span className="truncate">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </td>

                      {/* 31 days cells */}
                      {daysInMonth.map(({ day }) => {
                        const dayStr = String(day).padStart(2, '0');
                        const dateStr = `2026-10-${dayStr}`;
                        const record = records.find(
                          (r) => r.employeeId === emp.id && r.date === dateStr
                        );

                        let icon = <span className="text-slate-300">-</span>;

                        if (record) {
                          const st = String(record.status).toLowerCase();
                          if (st === 'present') {
                            icon = <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto stroke-[2.5]" />;
                          } else if (st === 'late') {
                            icon = (
                              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black mx-auto flex items-center justify-center">
                                !
                              </span>
                            );
                          } else if (st === 'absent') {
                            icon = <X className="w-3.5 h-3.5 text-slate-500 mx-auto stroke-[2.5]" />;
                          }
                        } else if (day === 2 || day === 20 || day === 21) {
                          icon = <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 mx-auto" />;
                        } else if (day === 19) {
                          icon = (
                            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center mx-auto">
                              <X className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
                            </div>
                          );
                        }

                        return (
                          <td key={day} className="py-2.5 px-1 text-center align-middle">
                            {icon}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Shift Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shift Roster & Work Schedules</h3>
                <p className="text-xs text-slate-500">Assigned employee shifts and weekly off days</p>
              </div>
            </div>

            <button
              onClick={() => alert('Opening shift assignment dialog')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              + Assign Shift
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">EMPLOYEE</th>
                  <th className="py-3 px-4">CURRENT SHIFT</th>
                  <th className="py-3 px-4">TIMING</th>
                  <th className="py-3 px-4">GRACE PERIOD</th>
                  <th className="py-3 px-4">WEEKLY OFF</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px] flex items-center justify-center">
                        {emp.firstName[0]}
                        {emp.lastName ? emp.lastName[0] : ''}
                      </div>
                      <div>
                        <p>{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] font-normal text-slate-400">{emp.employeeCode}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      General Corporate Shift
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-700 font-bold">
                      09:00 AM – 06:00 PM
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      15 Minutes (till 09:15 AM)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        Saturday, Sunday
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Editing shift for ${emp.firstName}`)}
                        className="text-xs text-indigo-600 hover:underline font-bold"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Holiday Schedule */}
      {activeTab === 'holidays' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Holiday Calendar (2026)</h3>
                <p className="text-xs text-slate-500">Corporate declared gazetted, national & regional holidays</p>
              </div>
            </div>

            <button
              onClick={() => alert('New holiday added to schedule')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              + Add Holiday
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">HOLIDAY NAME</th>
                  <th className="py-3 px-4">DAY OF WEEK</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidaysList.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {h.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{h.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {h.day}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {h.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: HR Regularization */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                HR Attendance Regularization
              </h3>
              <button
                onClick={() => setIsRegModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegularizeSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={regEmpId}
                  onChange={(e) => setRegEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={regCheckIn}
                    onChange={(e) => setRegCheckIn(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={regCheckOut}
                    onChange={(e) => setRegCheckOut(e.target.value)}
                    placeholder="06:00 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correction Remarks / Reason *</label>
                <input
                  type="text"
                  required
                  value={regRemarks}
                  onChange={(e) => setRegRemarks(e.target.value)}
                  placeholder="e.g., Missed punch due to biometric maintenance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save Regularization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Biometric Hardware Sync */}
      {isBiometricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                Biometric Terminal Sync (ZKTeco / eSSL)
              </h3>
              <button
                onClick={() => setIsBiometricModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBiometricSyncSubmit} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Machine Network Gateway</span>
                <p className="font-mono text-slate-800 text-[11px]">TCP/IP Protocol • Port 4000 Hook</p>
                <p className="text-[11px] text-emerald-600 font-semibold">Ready to pull batch buffer logs</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terminal Device Identifier</label>
                <input
                  type="text"
                  value={bioDeviceId}
                  onChange={(e) => setBioDeviceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee Code Test Punch</label>
                <input
                  type="text"
                  value={bioEmployeeCode}
                  onChange={(e) => setBioEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBiometricModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bioSyncing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {bioSyncing ? 'Synchronizing...' : 'Execute Batch Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
