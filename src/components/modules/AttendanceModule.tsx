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
  saveAttendanceRecords,
} from '../../lib/attendanceService';
import {
  getOfficeGeofenceConfig,
  saveOfficeGeofenceConfig,
  getCurrentGPSLocation,
  OfficeGeofenceConfig,
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
    rawRole === 'SUPER_ADMIN' ||
    rawRole === 'ADMIN' ||
    rawRole === 'HR_ADMIN' ||
    rawRole === 'COMPANY_ADMIN' ||
    rawRole === 'ORG_ADMIN' ||
    rawRole === 'FINANCE_ADMIN' ||
    isUserAdminRole(rawRole);

  const isEmployeeView = portalMode === 'employee' || !userIsAdminRole;
  const isAdminOrSuperAdmin = !isEmployeeView && userIsAdminRole;

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
    dateOfBirth: '1995-01-01',
    address: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    joiningDate: '2026-01-01',
    employmentType: 'Full-time',
    status: 'Active',
    departmentId: (user as any)?.departmentId || 'dept-1',
    departmentName: (user as any)?.departmentName || 'General',
    designationId: (user as any)?.designationId || 'des-1',
    designationTitle: (user as any)?.designationTitle || 'Staff',
    reportingManagerId: '',
    reportingManagerName: '—',
    workLocationId: 'loc-1',
    workLocationName: 'Corporate HQ',
    shift: 'General Shift (09:00 AM – 06:00 PM)',
    bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: '' },
    taxInformation: { taxId: '', panOrSsn: '', taxRegime: 'New Regime' },
    education: [],
    previousExperience: [],
    skills: [],
    salary: { basic: 0, hra: 0, allowances: 0, bonus: 0, pf: 0, tax: 0, professionalTax: 0, gross: 0, net: 0 },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
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
      for (const candId of Array.from(myCandidateIds)) {
        rec = getTodayRecordForEmployee(candId);
        if (rec) return rec;
      }
      const today = getTodayDateString();
      const live = liveRecords.find((r) => r.date === today && isMyAttendanceRecord(r));
      if (live) return live;
    }
    return null;
  };


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

  // Modal: Admin Geofence Settings (Admin & Super Admin ONLY)
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [adminGeofenceConfig, setAdminGeofenceConfig] = useState<OfficeGeofenceConfig>(() => getOfficeGeofenceConfig());
  const [geoCalibrating, setGeoCalibrating] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');

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
      ? `🏡 Work From Home ENABLED for ${emp.firstName} ${emp.lastName}. Geofencing is now turned OFF (Selfie punch only).`
      : `🏢 Office Geofencing RESTORED for ${emp.firstName} ${emp.lastName}. Office radius required.`;
    setWfhNotice(msg);
    setTimeout(() => setWfhNotice(null), 5000);
  };

  const handleSaveGeofenceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveOfficeGeofenceConfig(adminGeofenceConfig);
    setGeoNotice(`Office perimeter configured to ${adminGeofenceConfig.radiusMeters}m radius for ${adminGeofenceConfig.officeName}.`);
    setIsGeofenceModalOpen(false);
  };

  const handleAdminCalibrateGPS = async () => {
    setGeoCalibrating(true);
    try {
      const coords = await getCurrentGPSLocation();
      const updated: OfficeGeofenceConfig = {
        ...adminGeofenceConfig,
        latitude: Number(coords.latitude.toFixed(6)),
        longitude: Number(coords.longitude.toFixed(6)),
      };
      setAdminGeofenceConfig(updated);
      setGeoNotice('GPS position captured! Click "Save Configuration" to enforce these coordinates.');
    } catch (err: any) {
      alert(err.message || 'Failed to capture GPS position.');
    } finally {
      setGeoCalibrating(false);
    }
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Mark Attendance</span>
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

              <button
                onClick={() => {
                  setAdminGeofenceConfig(getOfficeGeofenceConfig());
                  setGeoNotice('');
                  setIsGeofenceModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Geofence Controls</span>
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
        const todayRecords = isEmployeeView
          ? liveRecords.filter((r) => r.date === todayDate && isMyAttendanceRecord(r))
          : liveRecords.filter((r) => r.date === todayDate);
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

              <div className="overflow-x-auto w-full [scrollbar-width:thin]">
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
                            {isAdminOrSuperAdmin ? (
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
                                      ? 'WFH Active: Click to turn OFF WFH (enforce office geofence)'
                                      : 'Office Mode: Click to turn ON WFH (bypass office geofence)'
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
                                  {isWfhActive ? '🏡 WFH (Geofence OFF)' : '🏢 Office'}
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

      {/* TAB 1: Attendance Summary (31-day October 2026 Matrix) */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {isEmployeeView ? "My Attendance Summary (October 2026)" : "Attendance Summary (October 2026)"}
            </h2>
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
                {visibleEmployees.map((emp) => {
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
                        const record = isEmployeeView
                          ? (records.find((r) => r.date === dateStr && isMyAttendanceRecord(r)) ||
                             liveRecords.find((r) => r.date === dateStr && isMyAttendanceRecord(r)))
                          : (records.find((r) => r.employeeId === emp.id && r.date === dateStr) ||
                             liveRecords.find((r) => r.employeeId === emp.id && r.date === dateStr));

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

      {/* Modal: Admin Geofence Settings & Calibration (Admin / Super Admin ONLY) */}
      {isGeofenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Office Geofence Controls</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px]">
                      ADMIN & SUPERADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Configure allowed perimeter for employee punch-ins</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeofenceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGeofenceConfig} className="mt-4 space-y-4 text-xs">
              {geoNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {geoNotice}
                </div>
              )}

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Enforce Geofence Verification</span>
                  <span className="text-slate-500 text-[11px]">
                    When active, employees can only punch within the designated office perimeter
                  </span>
                </div>
                <button
                  type="button"
                  id="toggle-geofence-enforce"
                  role="switch"
                  aria-checked={adminGeofenceConfig.enabled}
                  onClick={() =>
                    setAdminGeofenceConfig({
                      ...adminGeofenceConfig,
                      enabled: !adminGeofenceConfig.enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    adminGeofenceConfig.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      adminGeofenceConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Office Name / Branch Label</label>
                <input
                  type="text"
                  value={adminGeofenceConfig.officeName}
                  onChange={(e) =>
                    setAdminGeofenceConfig({ ...adminGeofenceConfig, officeName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Office Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={adminGeofenceConfig.latitude}
                    onChange={(e) =>
                      setAdminGeofenceConfig({
                        ...adminGeofenceConfig,
                        latitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Office Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={adminGeofenceConfig.longitude}
                    onChange={(e) =>
                      setAdminGeofenceConfig({
                        ...adminGeofenceConfig,
                        longitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Allowed Punch Radius</label>
                  <span className="font-extrabold text-indigo-600 font-mono text-sm">
                    {adminGeofenceConfig.radiusMeters} meters
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[100, 250, 500, 1000].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setAdminGeofenceConfig({ ...adminGeofenceConfig, radiusMeters: r })
                      }
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        adminGeofenceConfig.radiusMeters === r
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAdminCalibrateGPS}
                  disabled={geoCalibrating}
                  className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed className="w-4 h-4" />
                  <span>
                    {geoCalibrating
                      ? 'Acquiring GPS Position...'
                      : 'Set My Current Device GPS as Office HQ'}
                  </span>
                </button>
                <p className="text-[11px] text-slate-500 text-center mt-1">
                  Click while physically at the office to automatically save exact coordinates.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
