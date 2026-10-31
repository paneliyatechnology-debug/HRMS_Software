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
  Search,
  MapPin,
  LocateFixed,
  Camera,
  Smartphone,
  Laptop,
  Tablet,
  Eye,
  Fingerprint,
  Users,
  TrendingUp,
  LayoutGrid,
  FileSpreadsheet,
} from 'lucide-react';
import { PunchVerificationModal } from '../modals/PunchVerificationModal';
import { BiometricHubModal } from '../modals/BiometricHubModal';
import { AttendanceRecord, Employee } from '../../types/hrms';
import {
  getAllAttendanceRecords,
  getTodayRecordForEmployee,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  formatSecondsToWords,
  formatSecondsToHMS,
  getTodayDateString,
} from '../../lib/attendanceService';
import {
  getEmployeeWFHMap,
  setEmployeeWFHStatus,
  isEmployeeWFHEnabled,
} from '../../lib/geoService';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { TrackedHoursChart } from '../attendance/TrackedHoursChart';

interface AttendanceModuleProps {
  records: AttendanceRecord[];
  employees: Employee[];
  initialTab?: 'today' | 'summary' | 'roster' | 'holidays';
  onOpenPunchModal: () => void;
  onRefresh: () => void;
  portalMode?: 'employee' | 'admin';
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  records,
  employees,
  initialTab = 'today',
  onOpenPunchModal,
  onRefresh,
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  // Strict role check: If role is not an admin, user MUST be in employee self-service view
  const rawRole = (user?.role || '').trim().toUpperCase();
  const userIsAdminRole =
    rawRole === 'ADMIN' ||
    rawRole === 'HR_ADMIN' ||
    rawRole === 'COMPANY_ADMIN' ||
    rawRole === 'ORG_ADMIN' ||
    rawRole === 'FINANCE_ADMIN' ||
    isUserAdminRole(rawRole);

  const isEmployeeView = portalMode === 'employee' || !userIsAdminRole;
  const isAdminUser = !isEmployeeView && userIsAdminRole;

  const myEmpId = String(user?.employeeId || user?.id || '').trim();
  const myEmpCode = String((user as any)?.employeeCode || '').trim();
  const myEmail = String(user?.email || '').trim().toLowerCase();
  const myFirst = String(user?.firstName || '').trim().toLowerCase();
  const myLast = String(user?.lastName || '').trim().toLowerCase();
  const myFullName = `${myFirst} ${myLast}`.trim();

  // Match the logged in employee from employees list
  const matchedEmployee = React.useMemo(() => {
    return employees.find((emp) => {
      const eId = String(emp.id || (emp as any)._id || '').trim();
      const eUserId = String((emp as any).userId || '').trim();
      const eCode = String(emp.employeeCode || '').trim();
      const eEmail = String(emp.email || '').trim().toLowerCase();
      const eName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();

      return (
        (myEmpId && (eId.toLowerCase() === myEmpId.toLowerCase() || eUserId.toLowerCase() === myEmpId.toLowerCase())) ||
        (user?.id && (eId.toLowerCase() === String(user.id).toLowerCase() || eUserId.toLowerCase() === String(user.id).toLowerCase())) ||
        (myEmpCode && eCode.toLowerCase() === myEmpCode.toLowerCase()) ||
        (myEmail && eEmail === myEmail) ||
        (myFullName && eName === myFullName)
      );
    });
  }, [employees, myEmpId, user?.id, myEmpCode, myEmail, myFullName]);

  // Current employee fallback in case employee not registered in employees list
  const currentEmpFallback: Employee = React.useMemo(() => ({
    id: myEmpId || 'emp-self',
    employeeCode: myEmpCode || 'EMP-SELF',
    firstName: user?.firstName || 'Employee',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    avatarUrl: user?.avatarUrl || '',
    gender: 'Other',
    dateOfBirth: '',
    address: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    joiningDate: '',
    employmentType: 'Full-time',
    status: 'Active',
    departmentId: (user as any)?.departmentId || '',
    departmentName: (user as any)?.departmentName || '',
    designationId: (user as any)?.designationId || '',
    designationTitle: (user as any)?.designationTitle || '',
    reportingManagerId: '',
    reportingManagerName: '—',
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
  }), [myEmpId, myEmpCode, user]);

  const selfEmployee: Employee = matchedEmployee || currentEmpFallback;

  // Set of all identifier keys for this employee to match attendance records accurately
  const myCandidateIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (selfEmployee.id) ids.add(selfEmployee.id.toLowerCase());
    if (matchedEmployee?.id) ids.add(matchedEmployee.id.toLowerCase());
    if ((matchedEmployee as any)?._id) ids.add(String((matchedEmployee as any)._id).toLowerCase());
    if ((matchedEmployee as any)?.userId) ids.add(String((matchedEmployee as any).userId).toLowerCase());
    if (user?.employeeId) ids.add(String(user.employeeId).toLowerCase());
    if (user?.id) ids.add(String(user.id).toLowerCase());
    if (myEmpId) ids.add(myEmpId.toLowerCase());
    return ids;
  }, [selfEmployee.id, matchedEmployee, user?.employeeId, user?.id, myEmpId]);

  const isMyAttendanceRecord = (r: AttendanceRecord): boolean => {
    if (!r) return false;
    const recEmpId = String(r.employeeId || '').toLowerCase().trim();
    if (recEmpId && myCandidateIds.has(recEmpId)) return true;
    if ((r as any).userId && myCandidateIds.has(String((r as any).userId).toLowerCase().trim())) return true;
    if (r.employeeName && myFullName && r.employeeName.toLowerCase().trim() === myFullName) return true;
    if (matchedEmployee && r.employeeName && `${matchedEmployee.firstName} ${matchedEmployee.lastName}`.toLowerCase().trim() === r.employeeName.toLowerCase().trim()) return true;
    return false;
  };

  const [activeTab, setActiveTab] = useState<'today' | 'summary' | 'roster' | 'holidays'>(initialTab || 'today');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>([]);
  const [summaryViewMode, setSummaryViewMode] = useState<'cards' | 'grid'>('cards');
  const [detailEmp, setDetailEmp] = useState<Employee | null>(null);

  // Helper to compute monthly metrics for each employee
  const getEmployeeMonthlyMetrics = (emp: Employee) => {
    const empRecords = [
      ...records.filter(
        (r) =>
          r.employeeId === emp.id ||
          (emp.employeeCode && r.employeeCode === emp.employeeCode) ||
          (r.employeeName &&
            r.employeeName.trim().toLowerCase() ===
              `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase())
      ),
      ...liveRecords.filter((r) => r.employeeId === emp.id),
    ];

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let onLeaveDays = 0;
    let totalWorkSeconds = 0;

    daysInMonth.forEach(({ day }) => {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `2026-10-${dayStr}`;
      const rec = empRecords.find((r) => r.date === dateStr);

      if (rec) {
        const st = String(rec.status).toLowerCase();
        if (st === 'present') {
          presentDays++;
        } else if (st === 'late') {
          presentDays++;
          lateDays++;
        } else if (st === 'half day') {
          halfDays++;
        } else if (st === 'absent') {
          absentDays++;
        } else if (st === 'leave' || st === 'on leave') {
          onLeaveDays++;
        }

        if (rec.activeSeconds) {
          totalWorkSeconds += rec.activeSeconds;
        } else if (rec.checkIn && rec.checkOut) {
          totalWorkSeconds += 8.5 * 3600;
        } else if (rec.checkIn) {
          totalWorkSeconds += 4 * 3600;
        }
      } else {
        // Holiday vs Weekend vs normal workday
        if (day === 2 || day === 20 || day === 21) {
          // Public holiday
        } else if (day % 7 === 3 || day % 7 === 4) {
          // Weekend off
        } else if (day < 24) {
          // Active demo weekday
          presentDays++;
          totalWorkSeconds += 8 * 3600;
        }
      }
    });

    const workingDays = 22;
    const effectivePresent = Math.min(workingDays, presentDays + halfDays * 0.5);
    const score = workingDays > 0 ? Math.min(100, Math.round((effectivePresent / workingDays) * 100)) : 100;
    const avgDailyHours = effectivePresent > 0 ? (totalWorkSeconds / 3600 / effectivePresent).toFixed(1) : '8.0';

    return {
      presentDays,
      lateDays,
      halfDays,
      absentDays,
      onLeaveDays,
      workingDays,
      score,
      totalHours: Math.round(totalWorkSeconds / 3600),
      avgDailyHours,
    };
  };

  const attQ = attendanceSearch.trim().toLowerCase();

  // In employee view, visibleEmployees MUST ONLY contain the single logged-in employee!
  const visibleEmployees = React.useMemo(() => {
    if (isEmployeeView) {
      return [selfEmployee];
    }
    return attQ
      ? employees.filter((emp) => {
          const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
          const code = (emp.employeeCode || '').toLowerCase();
          const dept = (emp.departmentName || '').toLowerCase();
          const desig = (emp.designationTitle || '').toLowerCase();
          return (
            name.includes(attQ) ||
            code.includes(attQ) ||
            dept.includes(attQ) ||
            desig.includes(attQ)
          );
        })
      : employees;
  }, [isEmployeeView, selfEmployee, attQ, employees]);

  const getEmpTodayRecord = (emp: Employee): AttendanceRecord | null => {
    let rec = getTodayRecordForEmployee(emp.id);
    if (rec) return rec;

    if (isEmployeeView) {
      const today = getTodayDateString();
      const dbRec = records.find((r) => r.date === today && isMyAttendanceRecord(r));
      if (dbRec) return dbRec;

      for (const candId of Array.from(myCandidateIds)) {
        rec = getTodayRecordForEmployee(candId);
        if (rec) return rec;
      }
      const live = liveRecords.find((r) => r.date === today && isMyAttendanceRecord(r));
      if (live) return live;
    }
    return null;
  };

  const myTodayRecord = getEmpTodayRecord(selfEmployee);
  const myIsWorking = myTodayRecord && !myTodayRecord.isCompleted && !myTodayRecord.isOnBreak;
  const myIsOnBreak = myTodayRecord && !myTodayRecord.isCompleted && myTodayRecord.isOnBreak;
  const myIsDone = myTodayRecord && myTodayRecord.isCompleted;


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

  // Modal: Employee Punch Verification & Device Audit (Selfie & Device Hardware)
  const [auditModalRecord, setAuditModalRecord] = useState<AttendanceRecord | null>(null);
  const [auditModalEmployee, setAuditModalEmployee] = useState<Employee | null>(null);

  // Work From Home (WFH) Map: employeeId -> boolean
  const [wfhMap, setWfhMap] = useState<Record<string, boolean>>(() => getEmployeeWFHMap());
  const [wfhNotice, setWfhNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleWFHUpdate = () => {
      setWfhMap(getEmployeeWFHMap());
    };
    window.addEventListener('hrms_wfh_status_updated', handleWFHUpdate);
    return () => window.removeEventListener('hrms_wfh_status_updated', handleWFHUpdate);
  }, []);

  const handleToggleWFH = (emp: Employee) => {
    const current = Boolean(wfhMap[emp.id] || wfhMap[emp.id.toLowerCase()]);
    const next = !current;
    setEmployeeWFHStatus(emp.id, next);
    setWfhMap((prev) => ({ ...prev, [emp.id]: next, [emp.id.toLowerCase()]: next }));
    const msg = next
      ? `🏡 Work From Home ENABLED for ${emp.firstName} ${emp.lastName}.`
      : `🏢 Office Mode set for ${emp.firstName} ${emp.lastName}.`;
    setWfhNotice(msg);
    setTimeout(() => setWfhNotice(null), 5000);
  };

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
    if (records && Array.isArray(records)) {
      setLiveRecords(records);
    }
  }, [records]);

  useEffect(() => {
    const update = () => {
      setLiveRecords(getAllAttendanceRecords());
    };
    update();
    const handleUpdate = () => update();
    window.addEventListener('hrms_attendance_updated', handleUpdate);
    return () => {
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
      visibleEmployees.forEach((e) => {
        csvContent += `${e.employeeCode || e.id},"${e.firstName} ${e.lastName}",${selectedMonth},${selectedYear}\n`;
      });
    } else if (activeTab === 'roster') {
      csvContent += 'Employee ID,Name,Shift Name,Timing,Weekly Off\n';
      visibleEmployees.forEach((e) => {
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

        {/* Tab Switcher (Scrollable on mobile) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'today'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            {isEmployeeView ? "My Today's Punch" : "Today's Live Tracker"}
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'summary'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            {isEmployeeView ? "My Monthly Summary" : "Monthly Summary"}
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'roster'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            {isEmployeeView ? "My Shift Schedule" : "Shift Roster"}
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'holidays'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Holiday Schedule
          </button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenPunchModal}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-all active:scale-95 ${
              myIsWorking || myIsOnBreak
                ? 'bg-rose-600 hover:bg-rose-700'
                : myIsDone
                ? 'bg-slate-700 hover:bg-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {myIsWorking || myIsOnBreak ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="truncate">Check Out</span>
              </>
            ) : myIsDone ? (
              <>
                <Check className="w-4 h-4" />
                <span className="truncate">Checked Out</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="truncate">Check In</span>
              </>
            )}
          </button>

          {!isEmployeeView && (
            <>
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
            </>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEmployeeView ? 'Export My Attendance' : 'Export CSV'}</span>
          </button>

          {/* Quick Attendance Employee Search */}
          {!isEmployeeView && (
            <div className="relative min-w-[210px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                placeholder="Filter staff by name/ID..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
              {attendanceSearch && (
                <button
                  onClick={() => setAttendanceSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
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
        const mergedRecords = Array.isArray(records) && records.length > 0 ? records : liveRecords;
        const todayRecords = isEmployeeView
          ? mergedRecords.filter((r) => r.date === todayDate && isMyAttendanceRecord(r))
          : mergedRecords.filter((r) => r.date === todayDate);
        const workingCount = todayRecords.filter((r) => !r.isCompleted && !r.isOnBreak).length;
        const onBreakCount = todayRecords.filter((r) => !r.isCompleted && r.isOnBreak).length;
        const completedCount = todayRecords.filter((r) => r.isCompleted).length;

        return (
          <div className="space-y-4">
            {/* KPI Metrics */}
            {isEmployeeView ? (
              (() => {
                const selfEmp = visibleEmployees[0] || selfEmployee;
                const rec = selfEmp ? getEmpTodayRecord(selfEmp) : null;
                const isWorking = rec && !rec.isCompleted && !rec.isOnBreak;
                const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
                const isDone = rec && rec.isCompleted;
                const liveSecs = rec ? getLiveActiveSeconds(rec) : 0;
                const breakSecs = rec ? getLiveBreakSeconds(rec) : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">My Punch Status</span>
                      <p className="text-xl font-bold text-slate-900 mt-1">
                        {isDone ? 'Completed' : isWorking ? 'Working' : isOnBreak ? 'On Break' : 'Not Punched'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rec?.checkIn ? `In: ${rec.checkIn}` : 'No punch today'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">Working Timer</span>
                      <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                        {isWorking && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        {rec ? formatSecondsToHMS(liveSecs) : '00:00:00'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{isWorking ? 'Timer active' : 'Logged hours'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">Break Interval</span>
                      <p className="text-xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                        {formatSecondsToWords(breakSecs)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{isOnBreak ? 'Currently paused' : 'Total break taken'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">Assigned Shift</span>
                      <p className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        09:00 - 18:00
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Corporate Standard</p>
                    </div>
                  </div>
                );
              })()
            ) : (
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
            )}


            {/* WFH Action Toast Notice */}
            {wfhNotice && (
              <div className="mb-3 p-3 rounded-2xl bg-purple-50 border-2 border-purple-400 text-purple-950 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏡</span>
                  <span>{wfhNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWfhNotice(null)}
                  className="text-purple-700 hover:text-purple-950 font-bold ml-2 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Live Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {isEmployeeView ? "My Today's Shift & Attendance Log" : "Today's Live Workforce Shift Log"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEmployeeView ? "Your live punch and break intervals for today" : "Live work timers and break intervals updating every second"}
                  </p>
                </div>
                <button
                  onClick={onOpenPunchModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                >
                  Clock In / Out
                </button>
              </div>

              {/* Mobile Cards View (Visible on < md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {visibleEmployees.map((emp) => {
                  const rec = getEmpTodayRecord(emp);
                  const isWorking = rec && !rec.isCompleted && !rec.isOnBreak;
                  const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
                  const isDone = rec && rec.isCompleted;

                  const liveSecs = rec ? getLiveActiveSeconds(rec) : 0;
                  const breakSecs = rec ? getLiveBreakSeconds(rec) : 0;
                  const isWfhActive = Boolean(wfhMap[emp.id] || wfhMap[emp.id.toLowerCase()]);

                  return (
                    <div key={emp.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full border font-bold text-xs flex items-center justify-center shrink-0 bg-slate-100 border-slate-200 text-slate-700">
                            {emp.firstName?.[0] || 'E'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.employeeCode} • {emp.departmentName || 'General'}</p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {isWorking ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Working
                            </span>
                          ) : isOnBreak ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Pause className="w-3 h-3 text-amber-600" />
                              On Break
                            </span>
                          ) : isDone ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              <Check className="w-3 h-3 text-slate-600" />
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-100">
                              Not Punched
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">Punches</span>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {rec?.checkIn || '—'} → {rec?.checkOut || (isWorking ? 'Active' : '—')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">Active Worked</span>
                          <span className="font-mono font-bold text-emerald-700 text-[11px]">
                            {rec ? formatSecondsToHMS(liveSecs) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* WFH and Device row */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          {isAdminUser ? (
                            <button
                              type="button"
                              onClick={() => handleToggleWFH(emp)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                                isWfhActive
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {isWfhActive ? '🏡 WFH Active' : '🏢 Office Bound'}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">
                              {isWfhActive ? '🏡 WFH' : '🏢 Office'}
                            </span>
                          )}
                        </div>

                        {rec && (rec.checkInDevice || rec.checkInPhoto) && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuditModalRecord(rec);
                              setAuditModalEmployee(emp);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            <Camera className="w-3 h-3 text-slate-500" />
                            <span>Audit Details</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (Visible on >= md) */}
              <div className="hidden md:block overflow-x-auto w-full [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">EMPLOYEE</th>
                      <th className="py-2.5 px-4 font-medium">DEPARTMENT</th>
                      <th className="py-2.5 px-4 font-medium">WORK FROM HOME (WFH)</th>
                      <th className="py-2.5 px-4 font-medium">CHECK IN</th>
                      <th className="py-2.5 px-4 font-medium">CHECK OUT</th>
                      <th className="py-2.5 px-4 font-medium">DEVICE &amp; AUDIT</th>
                      <th className="py-2.5 px-4 font-medium">ACTIVE WORKED</th>
                      <th className="py-2.5 px-4 font-medium">BREAK TIME</th>
                      <th className="py-2.5 px-4 font-medium">LIVE STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleEmployees.map((emp) => {
                      const rec = getEmpTodayRecord(emp);
                      const isWorking = rec && !rec.isCompleted && !rec.isOnBreak;
                      const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
                      const isDone = rec && rec.isCompleted;

                      const liveSecs = rec ? getLiveActiveSeconds(rec) : 0;
                      const breakSecs = rec ? getLiveBreakSeconds(rec) : 0;
                      const isWfhActive = Boolean(wfhMap[emp.id] || wfhMap[emp.id.toLowerCase()]);

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full border font-semibold text-xs flex items-center justify-center shrink-0 bg-slate-100 border-slate-200 text-slate-700">
                              {emp.firstName?.[0] || 'E'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{emp.departmentName || 'General'}</td>
                          <td className="py-3 px-4">
                            {isAdminUser ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  role="switch"
                                  id={`wfh-toggle-${emp.id}`}
                                  aria-checked={isWfhActive}
                                  onClick={() => handleToggleWFH(emp)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isWfhActive ? 'bg-purple-600' : 'bg-slate-300'
                                  }`}
                                  title={
                                    isWfhActive
                                      ? 'WFH Active: Click to switch to Office Mode'
                                      : 'Office Mode: Click to switch to WFH'
                                  }
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                      isWfhActive ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border transition-colors ${
                                    isWfhActive
                                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {isWfhActive ? '🏡 WFH Active' : '🏢 Office'}
                                </span>
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                  isWfhActive
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {isWfhActive ? '🏡 WFH Active' : '🏢 Office Bound'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {rec?.checkIn ? (
                              <div className="flex items-center gap-1.5">
                                <span>{rec.checkIn}</span>
                                {rec.checkInPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuditModalRecord(rec);
                                      setAuditModalEmployee(emp);
                                    }}
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors cursor-pointer"
                                    title="Click to view Check-In Selfie & Device Audit"
                                  >
                                    <Camera className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {rec?.checkOut ? (
                              <div className="flex items-center gap-1.5">
                                <span>{rec.checkOut}</span>
                                {rec.checkOutPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuditModalRecord(rec);
                                      setAuditModalEmployee(emp);
                                    }}
                                    className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors cursor-pointer"
                                    title="Click to view Check-Out Selfie & Device Audit"
                                  >
                                    <Camera className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : isWorking ? (
                              <span className="text-emerald-600 font-medium">Working...</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {rec ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAuditModalRecord(rec);
                                  setAuditModalEmployee(emp);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-black bg-white hover:bg-[#FFE600] text-slate-900 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-[2px_2px_0px_0px_#000]"
                                title="View Employee Punch & Device Hardware Details"
                              >
                                {rec.checkInDevice?.os?.includes('Biometric') || rec.remarks?.includes('Biometric') ? (
                                  <Fingerprint className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : rec.checkInDevice?.deviceType === 'Mobile' ? (
                                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : rec.checkInDevice?.deviceType === 'Tablet' ? (
                                  <Tablet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                ) : (
                                  <Laptop className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                )}
                                <span className="truncate max-w-[110px]">
                                  {rec.checkInDevice?.deviceModel || rec.checkInDevice?.os || 'Inspect Device'}
                                </span>
                                {rec.checkInPhoto && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Geotag Selfie Verified" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {rec ? (
                              <span className={isWorking ? 'text-emerald-700' : 'text-slate-800'}>
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

      {/* TAB 1: Attendance Summary (Employee-Wise & Grid View) */}
      {activeTab === 'summary' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Top Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {isEmployeeView ? "My Monthly Attendance Summary" : "Employee-Wise Attendance Summary"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly scorecard, present/late ratios, work hours, and punch records for {selectedMonth} {selectedYear}
                  </p>
                </div>
              </div>

              {/* View Switcher and Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      summaryViewMode === 'cards'
                        ? 'bg-white text-emerald-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Employee Scorecard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      summaryViewMode === 'grid'
                        ? 'bg-white text-emerald-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>31-Day Calendar Grid</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Total Employees</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {visibleEmployees.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Staff on company roster</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Avg Attendance Rate</span>
                </div>
                <div className="text-xl font-bold text-emerald-800 mt-1">
                  {visibleEmployees.length > 0
                    ? Math.round(
                        visibleEmployees.reduce(
                          (acc, e) => acc + getEmployeeMonthlyMetrics(e).score,
                          0
                        ) / visibleEmployees.length
                      )
                    : 100}
                  %
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Overall company performance</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
                <div className="flex items-center gap-2 text-amber-700 text-[11px] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Late Marks</span>
                </div>
                <div className="text-xl font-bold text-amber-800 mt-1">
                  {visibleEmployees.reduce(
                    (acc, e) => acc + getEmployeeMonthlyMetrics(e).lateDays,
                    0
                  )}
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">Delayed arrivals in {selectedMonth}</div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70">
                <div className="flex items-center gap-2 text-purple-700 text-[11px] font-semibold">
                  <Plane className="w-3.5 h-3.5 text-purple-600" />
                  <span>Leaves &amp; Absences</span>
                </div>
                <div className="text-xl font-bold text-purple-800 mt-1">
                  {visibleEmployees.reduce(
                    (acc, e) =>
                      acc +
                      getEmployeeMonthlyMetrics(e).absentDays +
                      getEmployeeMonthlyMetrics(e).onLeaveDays,
                    0
                  )}
                </div>
                <div className="text-[10px] text-purple-600 mt-0.5">Approved leaves &amp; time off</div>
              </div>
            </div>
          </div>

          {/* VIEW 1: Clean Employee-Wise Scorecard (DEFAULT) */}
          {summaryViewMode === 'cards' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Employee Monthly Scorecard ({selectedMonth} {selectedYear})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click &ldquo;View Full Log&rdquo; on any employee to inspect their day-by-day punch timing.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {visibleEmployees.length} Employee{visibleEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>

              {visibleEmployees.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Employees in this Workspace Yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Once you add employees using the &ldquo;Add Employee&rdquo; button, their attendance scorecards and monthly logs will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Scorecard Cards (Visible on < md) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {visibleEmployees.map((emp) => {
                      const metrics = getEmployeeMonthlyMetrics(emp);
                      const todayRec = getEmpTodayRecord(emp);
                      const isWorkingNow = todayRec && !todayRec.isCompleted && !todayRec.isOnBreak;
                      const isDoneToday = todayRec && todayRec.isCompleted;

                      return (
                        <div
                          key={emp.id}
                          className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                          onClick={() => setDetailEmp(emp)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                {emp.avatarUrl ? (
                                  <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>
                                    {emp.firstName?.[0] || 'E'}
                                    {emp.lastName?.[0] || ''}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-900 truncate">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {emp.employeeCode || emp.id} • {emp.departmentName || 'Staff'}
                                </p>
                              </div>
                            </div>

                            {/* Attendance Score Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                              metrics.score >= 90
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : metrics.score >= 75
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {metrics.score}% Score
                            </span>
                          </div>

                          {/* 3-Column Micro Metrics Grid */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium block">Present</span>
                              <span className="font-bold text-emerald-700 text-xs">{metrics.presentDays} Days</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium block">Late</span>
                              <span className={`font-bold text-xs ${metrics.lateDays > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                {metrics.lateDays}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium block">Leaves/Off</span>
                              <span className={`font-bold text-xs ${metrics.onLeaveDays + metrics.absentDays > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                                {metrics.onLeaveDays + metrics.absentDays}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar & Logged Hours */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>Total Hours: <strong className="text-slate-800">{metrics.totalHours} hrs</strong> (~{metrics.avgDailyHours} h/d)</span>
                              <span className="font-semibold text-emerald-700">
                                {isWorkingNow ? '🟢 Currently Working' : isDoneToday ? 'Shift Done' : 'Not Punched Today'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  metrics.score >= 90
                                    ? 'bg-emerald-500'
                                    : metrics.score >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${metrics.score}%` }}
                              />
                            </div>
                          </div>

                          {/* Tap Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailEmp(emp);
                            }}
                            className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Monthly Log</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Scorecard Table (Visible on >= md) */}
                  <div className="hidden md:block overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-3">Present Days</th>
                        <th className="py-3 px-3">Late Marks</th>
                        <th className="py-3 px-3">Leaves / Off</th>
                        <th className="py-3 px-4">Attendance Score</th>
                        <th className="py-3 px-3">Hours Logged</th>
                        <th className="py-3 px-3">Today&apos;s Live Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleEmployees.map((emp) => {
                        const metrics = getEmployeeMonthlyMetrics(emp);
                        const todayRec = getEmpTodayRecord(emp);
                        const isWorkingNow = todayRec && !todayRec.isCompleted && !todayRec.isOnBreak;
                        const isDoneToday = todayRec && todayRec.isCompleted;

                        return (
                          <tr
                            key={emp.id}
                            className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                            onClick={() => setDetailEmp(emp)}
                          >
                            {/* 1. Employee Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>
                                      {emp.firstName?.[0] || 'E'}
                                      {emp.lastName?.[0] || ''}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                    <span>{emp.firstName} {emp.lastName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                    <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                                      {emp.employeeCode || emp.id}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate max-w-[120px]">{emp.departmentName || 'Engineering'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Present Days */}
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{metrics.presentDays} Days</span>
                              </span>
                            </td>

                            {/* 3. Late Marks */}
                            <td className="py-3 px-3">
                              {metrics.lateDays > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{metrics.lateDays} Late</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-400">
                                  0 Late
                                </span>
                              )}
                            </td>

                            {/* 4. Leaves & Off */}
                            <td className="py-3 px-3">
                              {metrics.onLeaveDays > 0 || metrics.absentDays > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Plane className="w-3 h-3" />
                                  <span>{metrics.onLeaveDays + metrics.absentDays} Off</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-400">
                                  0 Leave
                                </span>
                              )}
                            </td>

                            {/* 5. Attendance Score */}
                            <td className="py-3 px-4">
                              <div className="w-32">
                                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                  <span className={metrics.score >= 90 ? 'text-emerald-700' : metrics.score >= 75 ? 'text-amber-700' : 'text-rose-700'}>
                                    {metrics.score}%
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    {metrics.score >= 90 ? 'Excellent' : metrics.score >= 75 ? 'Good' : 'Needs Review'}
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      metrics.score >= 90
                                        ? 'bg-emerald-500'
                                        : metrics.score >= 75
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${metrics.score}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* 6. Hours Logged */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">
                                {metrics.totalHours} hrs
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ~{metrics.avgDailyHours} h/day
                              </div>
                            </td>

                            {/* 7. Today's Live Status */}
                            <td className="py-3 px-3">
                              {isWorkingNow ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                  Working ({todayRec?.checkIn})
                                </span>
                              ) : isDoneToday ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Check className="w-3 h-3" />
                                  Punched Out
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                                  Not Punched
                                </span>
                              )}
                            </td>

                            {/* 8. Action Button */}
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setDetailEmp(emp)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Log</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 2: 31-Day Calendar Grid View (With Improved Visuals) */}
        {summaryViewMode === 'grid' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    31-Day Calendar Matrix ({selectedMonth} {selectedYear})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Horizontal timeline of daily punch records across all team members.
                  </p>
                </div>
              </div>

              {/* Status Legend Row (Visible on ALL devices) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-semibold text-slate-600 pt-1 sm:pt-0">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 fill-indigo-500 shrink-0" />
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
                  <span>Day Off</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">!</span>
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="w-3.5 h-3.5 text-slate-500 stroke-[3] shrink-0" />
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>On Leave</span>
                </div>
              </div>
            </div>

            {/* Mobile Swipe Hint */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium sm:hidden px-1">
              <span>👉</span>
              <span>Swipe horizontally to view days 1 to 31</span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl [scrollbar-width:thin] pb-3">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 w-48 border-r border-slate-200">
                        EMPLOYEE
                      </th>
                      {daysInMonth.map(({ day, dayName }) => (
                        <th key={day} className="py-2 px-1.5 min-w-8 border-r border-slate-100 last:border-0">
                          <div className="font-bold text-slate-800">{day}</div>
                          <div className="text-[9px] text-slate-400 font-semibold">{dayName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {visibleEmployees.map((emp) => {
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-left sticky left-0 bg-white z-10 font-bold text-slate-900 border-r border-slate-200 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {emp.firstName?.[0] || 'E'}
                              {emp.lastName?.[0] || ''}
                            </div>
                            <span className="truncate max-w-[140px]">
                              {emp.firstName} {emp.lastName}
                            </span>
                          </td>

                          {daysInMonth.map(({ day }) => {
                            const dayStr = String(day).padStart(2, '0');
                            const dateStr = `2026-10-${dayStr}`;
                            const record = isEmployeeView
                              ? records.find((r) => r.date === dateStr && isMyAttendanceRecord(r)) ||
                                liveRecords.find((r) => r.date === dateStr && isMyAttendanceRecord(r))
                              : records.find((r) => r.employeeId === emp.id && r.date === dateStr) ||
                                liveRecords.find((r) => r.employeeId === emp.id && r.date === dateStr);

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
                            } else if (day % 7 === 3 || day % 7 === 4) {
                              icon = <CalendarIcon className="w-3 h-3 text-rose-300 mx-auto" />;
                            }

                            return (
                              <td key={day} className="py-2 px-1 text-center align-middle border-r border-slate-100 last:border-0">
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

          {/* EMPLOYEE DETAILED LOG MODAL */}
          {detailEmp && (() => {
            const m = getEmployeeMonthlyMetrics(detailEmp);
            const empRecs = [
              ...records.filter(
                (r) =>
                  r.employeeId === detailEmp.id ||
                  (detailEmp.employeeCode && r.employeeCode === detailEmp.employeeCode) ||
                  (r.employeeName &&
                    r.employeeName.trim().toLowerCase() ===
                      `${detailEmp.firstName || ''} ${detailEmp.lastName || ''}`.trim().toLowerCase())
              ),
              ...liveRecords.filter((r) => r.employeeId === detailEmp.id),
            ];

            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
                onClick={() => setDetailEmp(null)}
              >
                <div
                  className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[88vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center border border-emerald-200 shrink-0">
                        {detailEmp.avatarUrl ? (
                          <img src={detailEmp.avatarUrl} alt={detailEmp.firstName} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span>{detailEmp.firstName?.[0]}{detailEmp.lastName?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {detailEmp.firstName} {detailEmp.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono text-emerald-800 font-semibold">{detailEmp.employeeCode || detailEmp.id}</span>
                          <span>•</span>
                          <span>{detailEmp.departmentName || 'Department'}</span>
                          <span>•</span>
                          <span>{detailEmp.designationTitle || 'Staff'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailEmp(null)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Monthly Stats Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Present</div>
                      <div className="text-base font-extrabold text-emerald-800">{m.presentDays} Days</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-600 uppercase">Late</div>
                      <div className="text-base font-extrabold text-amber-800">{m.lateDays} Days</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="text-[10px] font-bold text-purple-600 uppercase">Leaves</div>
                      <div className="text-base font-extrabold text-purple-800">{m.onLeaveDays + m.absentDays} Days</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="text-[10px] font-bold text-blue-600 uppercase">Score</div>
                      <div className="text-base font-extrabold text-blue-800">{m.score}%</div>
                    </div>
                  </div>

                  {/* Day-by-day table */}
                  <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl [scrollbar-width:thin]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Punch In</th>
                          <th className="py-2.5 px-3">Punch Out</th>
                          <th className="py-2.5 px-3">Work Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {daysInMonth.map(({ day, dayName }) => {
                          const dayStr = String(day).padStart(2, '0');
                          const dateStr = `2026-10-${dayStr}`;
                          const rec = empRecs.find((r) => r.date === dateStr);

                          const isHoliday = day === 2 || day === 20 || day === 21;
                          const isWeekend = day % 7 === 3 || day % 7 === 4;

                          let statusLabel = 'Absent';
                          let statusClass = 'bg-slate-100 text-slate-600';

                          if (rec) {
                            const st = String(rec.status).toLowerCase();
                            if (st === 'present') {
                              statusLabel = 'Present';
                              statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                            } else if (st === 'late') {
                              statusLabel = 'Late';
                              statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                            } else if (st === 'half day') {
                              statusLabel = 'Half Day';
                              statusClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                            }
                          } else if (isHoliday) {
                            statusLabel = 'Holiday';
                            statusClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                          } else if (isWeekend) {
                            statusLabel = 'Weekend Off';
                            statusClass = 'bg-rose-50 text-rose-600 border border-rose-200';
                          } else if (day < 24) {
                            statusLabel = 'Present';
                            statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                          }

                          const inTime = rec?.checkIn || (statusLabel === 'Present' ? '09:00 AM' : statusLabel === 'Late' ? '09:35 AM' : '—');
                          const outTime = rec?.checkOut || (statusLabel === 'Present' || statusLabel === 'Late' ? '06:00 PM' : '—');
                          const duration = rec?.workingHours ? `${rec.workingHours}h 00m` : (statusLabel === 'Present' ? '9h 00m' : statusLabel === 'Late' ? '8h 25m' : '—');

                          return (
                            <tr key={day} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                <span>{day} Oct 2026</span>{' '}
                                <span className="text-[10px] text-slate-400 font-normal">({dayName})</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{inTime}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{outTime}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{duration}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDetailEmp(null)}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
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
                <h3 className="text-sm font-bold text-slate-900">
                  {isEmployeeView ? "My Shift Schedule" : "Shift Roster & Work Schedules"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEmployeeView ? "Your assigned shift timings and weekly off days" : "Assigned employee shifts and weekly off days"}
                </p>
              </div>
            </div>

            {!isEmployeeView && (
              <button
                onClick={() => alert('Opening shift assignment dialog')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                + Assign Shift
              </button>
            )}
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
                  {!isEmployeeView && <th className="py-3 px-4 text-right">ACTION</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleEmployees.map((emp) => (
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
                    {!isEmployeeView && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Editing shift for ${emp.firstName}`)}
                          className="text-xs text-indigo-600 hover:underline font-bold"
                        >
                          Modify
                        </button>
                      </td>
                    )}
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

            {!isEmployeeView && (
              <button
                onClick={() => alert('New holiday added to schedule')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                + Add Holiday
              </button>
            )}
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

      {/* Modal: Biometric Hardware Hub (Multi-Company Ready) */}
      <BiometricHubModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        employees={employees}
        onRefreshAttendance={onRefresh}
        currentCompanyId={(user as any)?.companyId || 'comp-paneliya'}
        currentCompanyName={(user as any)?.companyName || 'Paneliya Technology Inc.'}
      />



      {/* Employee Punch Verification & Device Audit Modal */}
      <PunchVerificationModal
        isOpen={Boolean(auditModalRecord)}
        onClose={() => {
          setAuditModalRecord(null);
          setAuditModalEmployee(null);
        }}
        record={auditModalRecord}
        employee={auditModalEmployee}
      />
    </div>
  );
};
