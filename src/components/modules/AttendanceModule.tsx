'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Eye,
  Users,
  TrendingUp,
  LayoutGrid,
  FileSpreadsheet,
  Play,
  Square,
  RotateCcw,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const BiometricHubModal = dynamic(
  () => import('../modals/BiometricHubModal').then((m) => m.BiometricHubModal),
  { ssr: false }
);
import { AttendanceRecord, Employee } from '../../types/hrms';
import {
  getAllAttendanceRecords,
  getTodayRecordForEmployee,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  formatSecondsToWords,
  formatSecondsToHMS,
  getTodayDateString,
  performCheckIn,
  performTakeBreak,
  performResumeWork,
  performCheckOut,
  extractRecordsFromWorkStatus,
  updateLocalRecordFromBackend,
  isMatchEmployee,
} from '../../lib/attendanceService';
import {
  getEmployeeWFHMap,
  setEmployeeWFHStatus,
  isEmployeeWFHEnabled,
} from '../../lib/geoService';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { useWorkSession } from '../../context/WorkSessionContext';
import { TrackedHoursChart } from '../attendance/TrackedHoursChart';
import { ModernDigitClock } from '../common/ModernDigitClock';
import { DailyShiftConsole } from '../common/DailyShiftConsole';
import { isDateWeekend, getWorkScheduleConfig } from '../../lib/shiftScheduleService';

interface AttendanceModuleProps {
  records: AttendanceRecord[];
  employees: Employee[];
  initialTab?: 'today' | 'summary' | string;
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
  const {
    todaySummary,
    liveWorkedHMS: sessionWorkedHMS,
    liveBreakWords: sessionBreakWords,
    activeSession,
    lastCompletedSession,
  } = useWorkSession();
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
    if (isMatchEmployee(r, selfEmployee.id) || isMatchEmployee(r, user?.id) || isMatchEmployee(r, user?.employeeId) || isMatchEmployee(r, myEmpId)) return true;
    if (r.employeeName && myFullName && r.employeeName.toLowerCase().trim() === myFullName) return true;
    if (matchedEmployee && r.employeeName && `${matchedEmployee.firstName} ${matchedEmployee.lastName}`.toLowerCase().trim() === r.employeeName.toLowerCase().trim()) return true;
    return false;
  };

  const resolvedTab: 'today' | 'summary' = 'today';

  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const mNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return mNames[new Date().getMonth()] || 'November';
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>([]);
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [actionLoading, setActionLoading] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [summaryViewMode, setSummaryViewMode] = useState<'cards' | 'grid'>('cards');
  const [detailEmp, setDetailEmp] = useState<Employee | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'logs' | 'matrix'>('logs');
  const [detailEmpLoading, setDetailEmpLoading] = useState(false);
  const [detailEmpRecords, setDetailEmpRecords] = useState<AttendanceRecord[]>([]);
  const [detailEmpStatusData, setDetailEmpStatusData] = useState<any | null>(null);

  const fetchEmpWorkStatus = React.useCallback(async (empToLoad: Employee) => {
    if (!empToLoad) return;
    setDetailEmpLoading(true);
    try {
      // Hit attendance work status API per user requirement:
      // curl --location 'http://192.168.1.105:4000/api/api/attendance/work/status' --header 'Authorization: Bearer <TOKEN>'
      const res = await api.getWorkStatus();
      if (!res) return;
      setDetailEmpStatusData(res);
      const extracted = extractRecordsFromWorkStatus(res, employees);

      const bound = extracted.map((rec) => ({
        ...rec,
        employeeId: rec.employeeId || empToLoad.id,
        employeeName: rec.employeeName || `${empToLoad.firstName} ${empToLoad.lastName}`.trim(),
        employeeCode: rec.employeeCode || empToLoad.employeeCode || 'EMP',
      }));

      setDetailEmpRecords(bound);
    } catch (err) {
      console.warn('[AttendanceModule] Failed to fetch work status from /api/attendance/work/status:', err);
    } finally {
      setDetailEmpLoading(false);
    }
  }, [employees]);

  useEffect(() => {
    if (detailEmp) {
      fetchEmpWorkStatus(detailEmp);
    } else {
      setDetailEmpRecords([]);
      setDetailEmpLoading(false);
      setDetailEmpStatusData(null);
    }
  }, [detailEmp?.id]);

  // Dedicated state for authoritative work status response (/api/attendance/work/status)
  const [workStatusData, setWorkStatusData] = useState<any>(null);
  const [attendanceSummaryData, setAttendanceSummaryData] = useState<any | null>(null);
  const [attendanceCalendarData, setAttendanceCalendarData] = useState<any | null>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const isFetchingWorkStatusRef = React.useRef(false);

  const fetchAttendanceSummaryAndCalendar = useCallback(async () => {
    try {
      const [sumRes, calRes] = await Promise.all([
        api.getAttendanceSummary().catch(() => null),
        api.getAttendanceCalendar().catch(() => null),
      ]);
      if (sumRes) setAttendanceSummaryData(sumRes);
      if (calRes) setAttendanceCalendarData(calRes);
    } catch (err) {
      console.warn('[AttendanceModule] Could not load attendance summary/calendar:', err);
    }
  }, []);

  const fetchWorkStatus = useCallback(async () => {
    if (isFetchingWorkStatusRef.current) return;
    isFetchingWorkStatusRef.current = true;
    try {
      const data: any = await api.getWorkStatus();
      if (!data || typeof data !== 'object') return;
      setWorkStatusData(data);
    } catch (err) {
      console.warn('[AttendanceModule] Could not load work status:', err);
    } finally {
      isFetchingWorkStatusRef.current = false;
    }
  }, []);

  const loadWorkHistory = useCallback(async () => {
    if (!isEmployeeView) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await api.getWorkHistory(1, 100);
      setHistorySessions(Array.isArray(res.sessions) ? res.sessions : []);
    } catch (err: any) {
      setHistorySessions([]);
      setHistoryError(err?.message || 'Could not load attendance log history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [isEmployeeView]);

  const fetchWorkStatusRef = useRef(fetchWorkStatus);
  fetchWorkStatusRef.current = fetchWorkStatus;
  const loadWorkHistoryRef = useRef(loadWorkHistory);
  loadWorkHistoryRef.current = loadWorkHistory;
  const fetchSummaryCalRef = useRef(fetchAttendanceSummaryAndCalendar);
  fetchSummaryCalRef.current = fetchAttendanceSummaryAndCalendar;

  // Sync logged in employee's work status from backend on mount, and on real punch updates
  useEffect(() => {
    fetchWorkStatusRef.current();
    loadWorkHistoryRef.current();
    fetchSummaryCalRef.current();

    const handleUpdate = () => {
      fetchWorkStatusRef.current();
      loadWorkHistoryRef.current();
      fetchSummaryCalRef.current();
    };
    window.addEventListener('hrms_work_status_updated', handleUpdate);
    return () => {
      window.removeEventListener('hrms_work_status_updated', handleUpdate);
    };
  }, []);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthIdx = Math.max(0, MONTH_NAMES.indexOf(selectedMonth));
  const currentYearNum = parseInt(selectedYear, 10) || 2026;
  const totalDaysInSelectedMonth = new Date(currentYearNum, currentMonthIdx + 1, 0).getDate();

  const daysInMonth = React.useMemo(() => {
    return Array.from({ length: totalDaysInSelectedMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(currentYearNum, currentMonthIdx, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
      return { day, dayName, dayOfWeek };
    });
  }, [totalDaysInSelectedMonth, currentYearNum, currentMonthIdx]);

  // Helper to compute monthly metrics for each employee from live database records
  const getEmployeeMonthlyMetrics = (emp: Employee) => {
    const empRecordsMap = new Map<string, AttendanceRecord>();
    const extraDetailRecs =
      detailEmp && (emp.id === detailEmp.id || (emp.employeeCode && emp.employeeCode === detailEmp.employeeCode))
        ? detailEmpRecords
        : [];
    const allEmpRecs = [
      ...records.filter(
        (r) =>
          r.employeeId === emp.id ||
          (emp.employeeCode && r.employeeCode === emp.employeeCode) ||
          (r.employeeName &&
            r.employeeName.trim().toLowerCase() ===
            `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase())
      ),
      ...liveRecords.filter((r) => r.employeeId === emp.id),
      ...extraDetailRecs,
    ];
    allEmpRecs.forEach((r) => {
      if (r.date) empRecordsMap.set(r.date, r);
    });

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let onLeaveDays = 0;
    let totalWorkSeconds = 0;

    const todayStr = getTodayDateString();
    const monthStr = String(currentMonthIdx + 1).padStart(2, '0');

    daysInMonth.forEach(({ day, dayOfWeek }) => {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYearNum}-${monthStr}-${dayStr}`;
      const rec = empRecordsMap.get(dateStr);

      if (rec) {
        const st = String(rec.status || '').toLowerCase();
        if (st === 'present' || st === 'late') {
          presentDays++;
        } else if (st === 'half day') {
          halfDays++;
        } else if (st === 'absent') {
          absentDays++;
        } else if (st === 'leave' || st === 'on leave') {
          onLeaveDays++;
        } else if (rec.checkIn) {
          presentDays++;
        }

        if (rec.activeSeconds) {
          totalWorkSeconds += rec.activeSeconds;
        } else if (rec.workingHours) {
          totalWorkSeconds += rec.workingHours * 3600;
        } else if (rec.checkIn && rec.checkOut) {
          totalWorkSeconds += 8.5 * 3600;
        } else if (rec.checkIn) {
          totalWorkSeconds += 4 * 3600;
        }
      } else {
        const isWeekend = isDateWeekend(dateStr, getWorkScheduleConfig(user?.companyId));
        if (!isWeekend && dateStr < todayStr && allEmpRecs.length > 0) {
          absentDays++;
        }
      }
    });

    const todaySummary = detailEmp && detailEmp.id === emp.id ? detailEmpStatusData?.todaySummary : null;
    if (todaySummary?.totalSecondsWorked && todaySummary.totalSecondsWorked > 0) {
      totalWorkSeconds = Math.max(totalWorkSeconds, todaySummary.totalSecondsWorked);
    }
    if (todaySummary?.totalSessionsToday && todaySummary.totalSessionsToday > 0) {
      presentDays = Math.max(presentDays, 1);
    }

    const elapsedWorkDays = daysInMonth.filter(({ day, dayOfWeek }) => {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYearNum}-${monthStr}-${dayStr}`;
      return dayOfWeek !== 0 && dayOfWeek !== 6 && dateStr <= todayStr;
    }).length;

    const effectivePresent = presentDays + halfDays * 0.5;
    const workingDays = Math.max(1, elapsedWorkDays);
    const score = Math.min(100, Math.round((effectivePresent / workingDays) * 100));
    const avgDailyHours = effectivePresent > 0 ? (totalWorkSeconds / 3600 / effectivePresent).toFixed(1) : '0.0';

    const distinctLogs: AttendanceRecord[] = [];
    const seenIds = new Set<string>();
    [...extraDetailRecs, ...allEmpRecs].forEach((r) => {
      const key = r.id || `${r.date}-${r.checkIn}-${r.checkOut || 'active'}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        distinctLogs.push(r);
      }
    });

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
      allRecords: distinctLogs.sort((a, b) => {
        const timeA = a.punches?.[0]?.timestamp || a.lastActiveTimestamp || a.createdAt || a.date || '';
        const timeB = b.punches?.[0]?.timestamp || b.lastActiveTimestamp || b.createdAt || b.date || '';
        return String(timeB).localeCompare(String(timeA));
      }),
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
  const myIsWorking = myTodayRecord && !myTodayRecord.isCompleted && !myTodayRecord.isOnBreak && !myTodayRecord.checkOut;
  const myIsOnBreak = myTodayRecord && !myTodayRecord.isCompleted && myTodayRecord.isOnBreak;
  const myIsDone = myTodayRecord && (myTodayRecord.isCompleted || Boolean(myTodayRecord.checkOut));

  // Format daily record date string into display-ready object
  const formatDailyDate = (dateStr?: string) => {
    if (!dateStr) return { formatted: '—', dayName: '', isToday: false };
    const todayStr = getTodayDateString();
    const isToday = dateStr === todayStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = dt.toLocaleDateString('en-US', { month: 'short' });
        return {
          formatted: `${String(d).padStart(2, '0')} ${monthName} ${y}`,
          dayName,
          isToday,
        };
      }
    } catch { }
    return { formatted: dateStr, dayName: '', isToday };
  };

  const formatIsoTo12HourTime = (isoOrTime?: string): string => {
    if (!isoOrTime) return '';
    if (typeof isoOrTime === 'string' && isoOrTime.includes(':') && !isoOrTime.includes('T') && !isoOrTime.includes('-')) {
      return isoOrTime;
    }
    try {
      const d = new Date(isoOrTime);
      if (isNaN(d.getTime())) return String(isoOrTime);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(isoOrTime);
    }
  };

  // Daily attendance for the logged-in employee, including past days from /attendance/work/history
  const employeeDailyRecords = React.useMemo(() => {
    const todayDateStr = getTodayDateString();
    const map = new Map<string, AttendanceRecord>();

    const cleanRecordDate = (r: any): string => {
      const d = r?.date || r?.todayDate || r?.attendanceDate || r?.startTime || r?.createdAt;
      if (!d) return '';
      if (typeof d === 'string' && d.includes('T')) {
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          return `${parsed.getFullYear()}-${month}-${day}`;
        }
        return d.split('T')[0];
      }
      return String(d).slice(0, 10);
    };

    (records || []).forEach((r) => {
      if (r && isMyAttendanceRecord(r)) {
        const cleanDate = cleanRecordDate(r) || todayDateStr;
        map.set(cleanDate, { ...r, date: cleanDate });
      }
    });

    (liveRecords || []).forEach((r) => {
      if (r && isMyAttendanceRecord(r)) {
        const cleanDate = cleanRecordDate(r) || todayDateStr;
        map.set(cleanDate, { ...r, date: cleanDate });
      }
    });

    if (historySessions.length > 0) {
      map.clear();
    }
    historySessions.forEach((session) => {
      const cleanDate = cleanRecordDate(session);
      if (!cleanDate || !session?.id) return;
      const active = session.status === 'ACTIVE' || session.status === 'ON_BREAK';
      const breakSeconds = Number(session.totalBreakSeconds) || 0;
      const workSeconds = Number(session.durationSeconds) || 0;
      map.set(session.id, ({
        id: session.id,
        employeeId: session.employeeId || selfEmployee?.id || myEmpId,
        employeeName: session.employeeName || (selfEmployee ? `${selfEmployee.firstName} ${selfEmployee.lastName}`.trim() : ''),
        employeeCode: selfEmployee?.employeeCode,
        date: cleanDate,
        checkIn: formatIsoTo12HourTime(session.startTime) || '—',
        checkOut: active ? undefined : formatIsoTo12HourTime(session.endTime),
        status: session.status === 'ON_BREAK' ? 'On Break' : active ? 'Working' : 'Completed',
        isCompleted: !active,
        isOnBreak: session.status === 'ON_BREAK',
        activeSeconds: workSeconds,
        breakSeconds,
        breakDurationMinutes: Math.round(breakSeconds / 60),
        workingHours: +(workSeconds / 3600).toFixed(2),
        overtimeHours: 0,
        formattedTotalBreak: session.formattedTotalBreak || formatSecondsToWords(breakSeconds),
        durationFormatted: session.durationFormatted || formatSecondsToHMS(workSeconds),
        createdAt: session.startTime,
      } as unknown as AttendanceRecord));
    });

    // 3. Ensure today's live record is present with most current ticking/punch state
    const todayRec = historySessions.length === 0 && selfEmployee ? getEmpTodayRecord(selfEmployee) : null;
    if (todayRec) {
      const cleanDate = todayRec.date && !todayRec.date.includes('T') ? todayRec.date : todayDateStr;
      map.set(cleanDate, { ...todayRec, date: cleanDate });
    }

    // 4. Authoritative overlay from /api/attendance/work/status (todayDate, status, start time, end time, break time, active work time)
    const statusDataToUse = historySessions.length === 0
      ? (workStatusData || (todaySummary ? { todaySummary, activeSession, lastCompletedSession } : null))
      : null;
    if (statusDataToUse) {
      const summary = statusDataToUse.todaySummary;
      const active = statusDataToUse.activeSession;
      const lastComp = statusDataToUse.lastCompletedSession;
      const session = active || lastComp;

      const todayKey = summary?.todayDate || (statusDataToUse.serverTime ? statusDataToUse.serverTime.split('T')[0] : todayDateStr);
      const hasActive = Boolean(statusDataToUse.hasActiveSession || (active && active.status !== 'COMPLETED'));
      const isOnBreak = Boolean(statusDataToUse.isOnBreak || (active && active.status === 'ON_BREAK'));
      const isCompleted = Boolean(!hasActive && (lastComp || (summary && summary.totalSessionsToday > 0)));

      const checkInTime = formatIsoTo12HourTime(session?.startTime || session?.startedAt || active?.startTime || lastComp?.startTime);
      const checkOutTime = hasActive ? undefined : formatIsoTo12HourTime(lastComp?.endTime || session?.endTime);

      const breakTimeStr =
        summary?.totalBreakFormatted && summary.totalBreakFormatted !== '0s'
          ? summary.totalBreakFormatted
          : statusDataToUse.formattedTotalBreak && statusDataToUse.formattedTotalBreak !== '0s' && statusDataToUse.formattedTotalBreak !== '00h 00m 00s'
            ? statusDataToUse.formattedTotalBreak
            : summary?.totalBreakSecondsToday && summary.totalBreakSecondsToday > 0
              ? formatSecondsToWords(summary.totalBreakSecondsToday)
              : session?.totalBreakSeconds && session.totalBreakSeconds > 0
                ? formatSecondsToWords(session.totalBreakSeconds)
                : '00h 00m 00s';

      const activeWorkedStr =
        summary?.totalDurationFormatted ||
        lastComp?.durationFormatted ||
        (summary?.totalSecondsWorked ? formatSecondsToHMS(summary.totalSecondsWorked) : undefined) ||
        (session?.durationSeconds ? formatSecondsToHMS(session.durationSeconds) : (hasActive ? (sessionWorkedHMS || liveWorkedHMS) : '00:00:00'));

      const statusStr = isCompleted ? 'Completed' : isOnBreak ? 'On Break' : hasActive ? 'Working' : 'Present';

      const existingToday = map.get(todayKey);

      const authoritativeTodayRec: AttendanceRecord = {
        ...(existingToday || {}),
        id: session?.id || existingToday?.id || `ws-${todayKey}`,
        employeeId: selfEmployee.id || myEmpId,
        employeeName: `${selfEmployee.firstName} ${selfEmployee.lastName}`.trim(),
        employeeCode: selfEmployee.employeeCode,
        date: todayKey,
        checkIn: checkInTime && checkInTime !== '—' ? checkInTime : (existingToday?.checkIn || '—'),
        checkOut: checkOutTime && checkOutTime !== '—' ? checkOutTime : existingToday?.checkOut,
        status: statusStr,
        isCompleted,
        isOnBreak,
        activeSeconds: summary?.totalSecondsWorked || session?.durationSeconds || existingToday?.activeSeconds || 0,
        breakSeconds: summary?.totalBreakSecondsToday || session?.totalBreakSeconds || existingToday?.breakSeconds || 0,
        formattedTotalBreak: breakTimeStr,
        durationFormatted: activeWorkedStr,
        breakDurationMinutes: Math.round((summary?.totalBreakSecondsToday || session?.totalBreakSeconds || 0) / 60),
        workingHours: Number(((summary?.totalSecondsWorked || session?.durationSeconds || 0) / 3600).toFixed(2)),
        overtimeHours: 0,
        createdAt: session?.startTime || existingToday?.createdAt || new Date().toISOString(),
        sessionStartTime: statusDataToUse.clock?.sessionStartTime || existingToday?.sessionStartTime,
        openBreakStartTime: statusDataToUse.clock?.openBreakStartTime || null,
        completedBreakSeconds: statusDataToUse.clock?.completedBreakSeconds,
        sessionClosedBreakSeconds: statusDataToUse.clock?.sessionClosedBreakSeconds,
        completedWorkSeconds: statusDataToUse.clock?.completedWorkSeconds,
        isLive: statusDataToUse.clock?.isLive,
      } as any;

      map.set(todayKey, authoritativeTodayRec);
    }

    // Sort descending by date (newest first)
    return Array.from(map.values()).sort((a, b) => {
      const aTime = (a as any).createdAt || a.date || '';
      const bTime = (b as any).createdAt || b.date || '';
      return String(bTime).localeCompare(String(aTime));
    });
  }, [records, liveRecords, historySessions, selfEmployee, isMyAttendanceRecord, myEmpId, nowTick, todaySummary, workStatusData, activeSession, lastCompletedSession, liveWorkedHMS]);

  // Helper to reliably extract and format break time for any attendance record
  const getRecordBreakDisplay = (rec: AttendanceRecord) => {
    const anyRec = rec as any;
    if (anyRec.sessionStartTime && anyRec.isLive) {
      return formatSecondsToWords(getLiveBreakSeconds(rec));
    }
    if (anyRec.formattedTotalBreak && anyRec.formattedTotalBreak !== '0s') {
      return anyRec.formattedTotalBreak;
    }
    if (anyRec.totalBreakFormatted && anyRec.totalBreakFormatted !== '0s') {
      return anyRec.totalBreakFormatted;
    }
    if (anyRec.todaySummary?.totalBreakFormatted && anyRec.todaySummary.totalBreakFormatted !== '0s') {
      return anyRec.todaySummary.totalBreakFormatted;
    }
    const isToday = rec.date === getTodayDateString();
    if (isToday) {
      if (workStatusData?.todaySummary?.totalBreakFormatted && workStatusData.todaySummary.totalBreakFormatted !== '0s') {
        return workStatusData.todaySummary.totalBreakFormatted;
      }
      if (todaySummary?.totalBreakFormatted && todaySummary.totalBreakFormatted !== '0s') {
        return todaySummary.totalBreakFormatted;
      }
      if (workStatusData?.formattedTotalBreak && workStatusData.formattedTotalBreak !== '0s' && workStatusData.formattedTotalBreak !== '00h 00m 00s') {
        return workStatusData.formattedTotalBreak;
      }
      if (todaySummary?.totalBreakSecondsToday && todaySummary.totalBreakSecondsToday > 0) {
        return formatSecondsToWords(todaySummary.totalBreakSecondsToday);
      }
      if (sessionBreakWords && sessionBreakWords !== '0s') {
        return sessionBreakWords;
      }
      if (liveBreakWords && liveBreakWords !== '0s') {
        return liveBreakWords;
      }
    }
    const breakSecs = getLiveBreakSeconds(rec);
    if (breakSecs > 0) {
      return formatSecondsToWords(breakSecs);
    }
    if (rec.breakDurationMinutes && rec.breakDurationMinutes > 0) {
      return `${rec.breakDurationMinutes}m`;
    }
    return '00h 00m 00s';
  };

  // Helper to reliably extract and format active worked duration
  const getRecordActiveWorkedDisplay = (rec: AttendanceRecord) => {
    const anyRec = rec as any;
    if (anyRec.sessionStartTime && anyRec.isLive) {
      return formatSecondsToHMS(getLiveActiveSeconds(rec));
    }
    const isToday = rec.date === getTodayDateString();
    const isWorking = isToday && !rec.isCompleted && !rec.isOnBreak && !rec.checkOut && Boolean(rec.checkIn);

    if (isWorking) {
      if (sessionWorkedHMS && sessionWorkedHMS !== '00:00:00') {
        return sessionWorkedHMS;
      }
      if (liveWorkedHMS && liveWorkedHMS !== '00:00:00') {
        return liveWorkedHMS;
      }
    }
    if (anyRec.durationFormatted && anyRec.durationFormatted !== '00:00:00' && anyRec.durationFormatted !== '00h 00m 00s') {
      return anyRec.durationFormatted;
    }
    if (anyRec.todaySummary?.totalDurationFormatted) {
      return anyRec.todaySummary.totalDurationFormatted;
    }
    if (isToday) {
      if (workStatusData?.todaySummary?.totalDurationFormatted) {
        return workStatusData.todaySummary.totalDurationFormatted;
      }
      if (workStatusData?.lastCompletedSession?.durationFormatted) {
        return workStatusData.lastCompletedSession.durationFormatted;
      }
      if (todaySummary?.totalDurationFormatted) {
        return todaySummary.totalDurationFormatted;
      }
    }
    const liveSecs = getLiveActiveSeconds(rec);
    if (liveSecs > 0) {
      return formatSecondsToHMS(liveSecs);
    }
    return '00:00:00';
  };


  // Modal: HR Regularization
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  useEffect(() => {
    const isAnyOpen = isRegModalOpen || !!detailEmp;
    if (!isAnyOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRegModalOpen) setIsRegModalOpen(false);
        if (detailEmp) setDetailEmp(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRegModalOpen, detailEmp]);

  const [regEmpId, setRegEmpId] = useState(employees[0]?.id || 'emp-1');
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [regCheckIn, setRegCheckIn] = useState('09:00 AM');
  const [regCheckOut, setRegCheckOut] = useState('06:00 PM');
  const [regStatus, setRegStatus] = useState<'Present' | 'Half Day' | 'Late'>('Present');
  const [regRemarks, setRegRemarks] = useState('Missed punch due to biometric maintenance');

  // Modal: Biometric Hardware Sync
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [bioDeviceId, setBioDeviceId] = useState('GATE-01-TERMINAL');
  const [bioEmployeeCode, setBioEmployeeCode] = useState('EMP-1');
  const [bioSyncing, setBioSyncing] = useState(false);

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
    const msg = `WFH Configuration Blocked: Backend API endpoint for employee Work From Home assignment is not implemented.`;
    setWfhNotice(msg);
    setTimeout(() => setWfhNotice(null), 6000);
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
    const tick = () => {
      setNowTick(Date.now());
      const all = getAllAttendanceRecords();
      setLiveRecords(all.length > 0 ? all : (records || []));

      const myRec = getEmpTodayRecord(selfEmployee);
      if (myRec) {
        const active = getLiveActiveSeconds(myRec);
        const brk = getLiveBreakSeconds(myRec);
        const activeStr =
          active > 0
            ? formatSecondsToHMS(active)
            : sessionWorkedHMS && sessionWorkedHMS !== '00:00:00'
              ? sessionWorkedHMS
              : '00:00:00';
        setLiveWorkedHMS(activeStr);
        setLiveBreakWords(formatSecondsToWords(brk));
      } else if (sessionWorkedHMS && sessionWorkedHMS !== '00:00:00') {
        setLiveWorkedHMS(sessionWorkedHMS);
        setLiveBreakWords(sessionBreakWords || '0s');
      } else {
        setLiveWorkedHMS('00:00:00');
        setLiveBreakWords('0s');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    const handleUpdate = () => tick();
    window.addEventListener('hrms_attendance_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hrms_attendance_updated', handleUpdate);
    };
  }, [selfEmployee, records]);

  const handleCheckInAction = async () => {
    setActionLoading(true);
    try {
      const res = await api.startWork({ workMode: 'Office', note: '' });
      performCheckIn({
        id: selfEmployee.id || myEmpId,
        firstName: selfEmployee.firstName,
        lastName: selfEmployee.lastName,
        employeeCode: selfEmployee.employeeCode,
        remarks: 'Morning shift clock-in',
      });
      showToast({ title: 'Shift Started', message: res?.message || 'Clocked in successfully! Work timer has started.', type: 'success' });
      onRefresh();
    } catch (err: any) {
      showToast({ title: 'Clock In Failed', message: err.message || 'Unable to clock in.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakeBreakAction = async () => {
    setActionLoading(true);
    try {
      const res = await api.startBreak({});
      const localRes = performTakeBreak(selfEmployee.id || myEmpId);
      showToast({ title: 'Break Started', message: res?.message || localRes?.message || 'Work timer paused! Enjoy your break.', type: 'info' });
      onRefresh();
    } catch (err: any) {
      showToast({ title: 'Break Error', message: err.message || 'Unable to start break.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeWorkAction = async () => {
    setActionLoading(true);
    try {
      const res = await api.resumeBreak({});
      const localRes = performResumeWork(selfEmployee.id || myEmpId);
      showToast({ title: 'Work Resumed', message: res?.message || localRes?.message || 'Work timer resumed and counting!', type: 'success' });
      onRefresh();
    } catch (err: any) {
      showToast({ title: 'Resume Error', message: err.message || 'Unable to resume work.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOutAction = async () => {
    setActionLoading(true);
    try {
      const res = await api.stopWork({ workMode: 'Office', note: '' });
      const outRes = performCheckOut(selfEmployee.id || myEmpId, {
        remarks: 'Evening clock-out',
      });
      showToast({
        title: 'Shift Clocked Out',
        message: res?.message || outRes.message || 'Clock-out complete! Final day hours calculated.',
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      showToast({ title: 'Clock Out Failed', message: err.message || 'Unable to clock out.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    let csvContent = '';
    let fileName = '';

    if (isEmployeeView) {
      const todayDateStr = getTodayDateString();
      fileName = `My_Attendance_Records_${todayDateStr}.csv`;
      csvContent += 'Date,Employee ID,Employee Name,Clock In,Clock Out,Break Time,Worked Duration,Status\n';

      let list = employeeDailyRecords.length > 0 ? [...employeeDailyRecords] : records.filter(isMyAttendanceRecord);

      // If list is empty, synthesize today's record from live work session or today's record fallback
      if (list.length === 0) {
        const todayRec = selfEmployee ? getEmpTodayRecord(selfEmployee) : null;
        if (todayRec) {
          list = [todayRec];
        } else {
          list = [{
            id: `ws-${todayDateStr}`,
            employeeId: selfEmployee.id || myEmpId,
            employeeName: `${selfEmployee.firstName} ${selfEmployee.lastName}`.trim(),
            employeeCode: selfEmployee.employeeCode,
            date: todaySummary?.todayDate || todayDateStr,
            checkIn: formatIsoTo12HourTime(activeSession?.startTime || lastCompletedSession?.startTime) || '—',
            checkOut: formatIsoTo12HourTime(lastCompletedSession?.endTime) || (activeSession ? 'Working...' : '—'),
            status: activeSession ? (activeSession.status === 'ON_BREAK' ? 'On Break' : 'Working') : (lastCompletedSession ? 'Completed' : 'Present'),
            isCompleted: Boolean(!activeSession && lastCompletedSession),
            formattedTotalBreak: todaySummary?.totalBreakFormatted || '00h 00m 00s',
            durationFormatted: todaySummary?.totalDurationFormatted || lastCompletedSession?.durationFormatted || '00:00:00',
          } as any];
        }
      }

      list.forEach((rec) => {
        let rawDate =
          rec.date ||
          (rec as any).todayDate ||
          (rec as any).attendanceDate ||
          (rec as any).workDate ||
          (rec as any).startTime ||
          (rec as any).startedAt ||
          (rec as any).createdAt ||
          (rec as any).serverTime ||
          todaySummary?.todayDate ||
          workStatusData?.todaySummary?.todayDate ||
          todayDateStr;

        if (typeof rawDate === 'string' && rawDate.includes('T')) {
          rawDate = rawDate.split('T')[0];
        }

        const dateIso = String(rawDate || todayDateStr);
        const dateFormatted = formatDailyDate(dateIso).formatted;
        const dateStr = dateFormatted && dateFormatted !== '—' ? dateFormatted : dateIso;

        const empCode = (selfEmployee?.employeeCode || rec.employeeCode || selfEmployee?.id || '').replace(/"/g, '""');
        const empName = `${selfEmployee?.firstName || ''} ${selfEmployee?.lastName || ''}`.trim().replace(/"/g, '""');
        const checkIn = (rec.checkIn || '—').replace(/"/g, '""');
        const checkOut = (rec.checkOut || (rec.isCompleted ? 'Completed' : ((rec.status as string) === 'Working' ? 'Working...' : '—'))).replace(/"/g, '""');
        const breakStr = getRecordBreakDisplay(rec);
        const workHours = getRecordActiveWorkedDisplay(rec);
        const status = rec.status || 'Present';
        csvContent += `"${dateStr}","${empCode}","${empName}","${checkIn}","${checkOut}","${breakStr}","${workHours}","${status}"\n`;
      });
    } else if (resolvedTab === 'today') {
      const todayDateStr = getTodayDateString();
      fileName = `Attendance_Workforce_${todayDateStr}.csv`;
      csvContent += 'Date,Employee ID,Employee Name,Department,Clock In,Clock Out,Break Time,Active Worked,Working Hours,Status,Office / Location,Device / IP\n';

      visibleEmployees.forEach((emp) => {
        const rec = getEmpTodayRecord(emp);
        const isWorking = rec && !rec.isCompleted && !rec.isOnBreak && !rec.checkOut;
        const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
        const isDone = rec && (rec.isCompleted || Boolean(rec.checkOut));

        const liveSecs = rec ? getLiveActiveSeconds(rec) : 0;
        const breakSecs = rec ? getLiveBreakSeconds(rec) : 0;

        let rawEmpDate =
          rec?.date ||
          (rec as any)?.todayDate ||
          (rec as any)?.attendanceDate ||
          (rec as any)?.startTime ||
          (rec as any)?.createdAt ||
          todayDateStr;
        if (typeof rawEmpDate === 'string' && rawEmpDate.includes('T')) {
          rawEmpDate = rawEmpDate.split('T')[0];
        }
        const empDateIso = String(rawEmpDate || todayDateStr);
        const empDateFormatted = formatDailyDate(empDateIso).formatted;
        const dateStr = empDateFormatted && empDateFormatted !== '—' ? empDateFormatted : empDateIso;

        const empCode = (emp.employeeCode || emp.id || '').replace(/"/g, '""');
        const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().replace(/"/g, '""');
        const dept = (emp.departmentName || 'General').replace(/"/g, '""');
        const checkIn = (rec?.checkIn || '—').replace(/"/g, '""');
        const checkOut = (rec?.checkOut || (isWorking ? 'In Progress' : '—')).replace(/"/g, '""');

        const breakTimeStr = (rec as any)?.formattedTotalBreak || (breakSecs > 0 ? formatSecondsToWords(breakSecs) : rec?.breakDurationMinutes ? `${rec.breakDurationMinutes}m` : '0m');
        const activeWorkedStr = (rec as any)?.durationFormatted || (rec ? formatSecondsToHMS(liveSecs) : '00:00:00');
        const workingHoursStr = rec?.workingHours ? rec.workingHours.toFixed(2) : (liveSecs > 0 ? (liveSecs / 3600).toFixed(2) : '0.00');

        const statusStr = rec
          ? (isOnBreak ? 'On Break' : isWorking ? 'Working Now' : isDone ? 'Shift Completed' : rec.status || 'Present')
          : 'Not Punched';

        const officeLoc = ((rec as any)?.officeLocationName || '').replace(/"/g, '""');
        const devInfo = ((rec as any)?.deviceInfo || rec?.checkInDevice?.deviceType || 'Web Punch').replace(/"/g, '""');
        const ip = ((rec as any)?.ipAddress || '').replace(/"/g, '""');
        const deviceIpStr = ip ? `${devInfo} (${ip})` : devInfo;

        csvContent += `"${dateStr}","${empCode}","${empName}","${dept}","${checkIn}","${checkOut}","${breakTimeStr}","${activeWorkedStr}","${workingHoursStr}","${statusStr}","${officeLoc}","${deviceIpStr}"\n`;
      });
    } else if (resolvedTab === 'summary') {
      fileName = `Attendance_Summary_${selectedMonth}_${selectedYear}.csv`;
      csvContent += 'Employee ID,Employee Name,Department,Month,Year,Present Days,Half Days,Absent Days,Total Work Hours,Daily Average (Hrs)\n';

      visibleEmployees.forEach((emp) => {
        const m = getEmployeeMonthlyMetrics(emp);
        const empCode = (emp.employeeCode || emp.id || '').replace(/"/g, '""');
        const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().replace(/"/g, '""');
        const dept = (emp.departmentName || 'General').replace(/"/g, '""');

        csvContent += `"${empCode}","${empName}","${dept}","${selectedMonth}","${selectedYear}",${m.presentDays},${m.halfDays},${m.absentDays},${m.totalHours},${m.avgDailyHours}\n`;
      });
    } else {
      const todayDateStr = getTodayDateString();
      fileName = `Attendance_Records_${todayDateStr}.csv`;
      csvContent += 'Date,Employee ID,Employee Name,Department,Clock In,Clock Out,Break Time,Work Hours,Status\n';
      records.forEach((rec) => {
        const emp = employees.find((e) => e.id === rec.employeeId);
        const empCode = (emp?.employeeCode || rec.employeeId || '').replace(/"/g, '""');
        const empName = (emp ? `${emp.firstName} ${emp.lastName}` : (rec as any).employeeName || 'Staff').replace(/"/g, '""');
        const dept = (emp?.departmentName || 'General').replace(/"/g, '""');

        let rawDate =
          rec.date ||
          (rec as any).todayDate ||
          (rec as any).attendanceDate ||
          (rec as any).startTime ||
          (rec as any).createdAt ||
          todayDateStr;
        if (typeof rawDate === 'string' && rawDate.includes('T')) {
          rawDate = rawDate.split('T')[0];
        }
        const dateIso = String(rawDate || todayDateStr);
        const dateFormatted = formatDailyDate(dateIso).formatted;
        const dateStr = dateFormatted && dateFormatted !== '—' ? dateFormatted : dateIso;

        const checkIn = (rec.checkIn || '—').replace(/"/g, '""');
        const checkOut = (rec.checkOut || '—').replace(/"/g, '""');
        const breakStr = getRecordBreakDisplay(rec);
        const workHours = getRecordActiveWorkedDisplay(rec);
        const status = rec.status || 'Present';

        csvContent += `"${dateStr}","${empCode}","${empName}","${dept}","${checkIn}","${checkOut}","${breakStr}","${workHours}","${status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 w-full select-none animate-in fade-in">
      {/* Top Header, Action Buttons & Compact Shift Console */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pt-1">
        {/* Left: Action Buttons Row (for Admin Search or Month Filters) */}
        {(!isEmployeeView || (resolvedTab as string) === 'summary') ? (
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
              {(resolvedTab as string) === 'summary' && (
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
          </div>
        ) : null}

        {/* Right: Compact Daily Shift Console fitted into top-right header area */}
        {isEmployeeView && resolvedTab === 'today' && (
          <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0">
            <DailyShiftConsole clockSize="sm" showHeaderClock={false} />
          </div>
        )}
      </div>

      {/* TAB: Today's Live Attendance & Break Tracker */}
      {resolvedTab === 'today' && (() => {
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
            {/* KPI Metrics for Admin */}
            {!isEmployeeView && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Punched Today</span>
                  <p className="text-xl font-semibold tracking-tight text-slate-800 mt-1">{todayRecords.length} / {employees.length}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Total registered</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Working Now</span>
                  <p className="text-xl font-semibold tracking-tight text-emerald-600 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {workingCount}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active timers</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">On Break</span>
                  <p className="text-xl font-semibold tracking-tight text-amber-600 mt-1 flex items-center gap-1.5">
                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                    {onBreakCount}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Timer paused</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Shift Completed</span>
                  <p className="text-xl font-semibold tracking-tight text-slate-800 mt-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-600" />
                    {completedCount}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Clocked out</p>
                </div>
              </div>
            )}


            {/* WFH Action Toast Notice */}
            {wfhNotice && (
              <div className="mb-3 p-3 rounded-2xl bg-purple-50 border-2 border-purple-400 text-purple-950 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>{wfhNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWfhNotice(null)}
                  className="text-purple-700 hover:text-purple-950 font-bold ml-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Daily Attendance & Live Shift Log */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-4 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isEmployeeView
                        ? 'Daily Attendance Records'
                        : "Today's Live Workforce Shift Log"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {isEmployeeView
                        ? `${employeeDailyRecords.length} ${employeeDailyRecords.length === 1 ? 'Day' : 'Days'} Logged`
                        : `${visibleEmployees.length} Employees`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEmployeeView
                      ? 'Daily date-wise punch in, punch out, break intervals, and total worked duration'
                      : 'Live work timers and break intervals updating every second'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title={isEmployeeView ? 'Export My Attendance' : 'Export CSV'}
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isEmployeeView ? 'Export My Attendance' : 'Export CSV'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await Promise.all([fetchWorkStatus(), loadWorkHistory()]);
                      onRefresh?.();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Refresh attendance records"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: Employee Daily Attendance */}
              {isEmployeeView ? (
                <>
                  {historyError ? (
                    <div className="py-10 px-4 text-center">
                      <h4 className="text-sm font-bold text-rose-700">Attendance history could not be loaded</h4>
                      <p className="text-xs text-slate-500 mt-1">{historyError}</p>
                    </div>
                  ) : historyLoading && employeeDailyRecords.length === 0 ? (
                    <div className="py-14 px-4 text-center text-xs text-slate-500">Loading attendance log history...</div>
                  ) : employeeDailyRecords.length === 0 ? (
                    <div className="py-14 px-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No Daily Attendance Records Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Your daily attendance entries will automatically appear here once you punch in.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards View (Visible on < md) */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {employeeDailyRecords.map((rec, recIdx) => {
                          const dateInfo = formatDailyDate(rec.date);
                          const isToday = dateInfo.isToday;
                          const isWorking = isToday && !rec.isCompleted && !rec.isOnBreak && !rec.checkOut && Boolean(rec.checkIn);
                          const isOnBreak = isToday && !rec.isCompleted && Boolean(rec.isOnBreak);
                          const isDone = isToday ? Boolean(rec.isCompleted || rec.checkOut) : Boolean(rec.checkOut);
                          const liveSecs = getLiveActiveSeconds(rec);
                          const breakSecs = getLiveBreakSeconds(rec);

                          return (
                            <div key={`${rec.id || rec.date}-m-${recIdx}`} className="p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900">{dateInfo.formatted}</span>
                                    {isToday && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800">
                                        TODAY
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {!isEmployeeView && rec.employeeName ? `${rec.employeeName} • ` : ''}
                                    {dateInfo.dayName}
                                  </span>
                                </div>

                                <div>
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
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                      {rec.status || 'Present'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Punches (In → Out)</span>
                                  <span className="font-semibold text-slate-800 text-[11px]">
                                    {rec.checkIn || '—'} → {rec.checkOut || (isWorking ? 'Active' : '—')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Break Time</span>
                                  <span className="font-mono font-medium text-slate-700 text-[11px]">
                                    {getRecordBreakDisplay(rec)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Active Worked</span>
                                  <span className="font-mono font-bold text-emerald-700 text-[11px]">
                                    {getRecordActiveWorkedDisplay(rec)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table View (Visible on >= md) */}
                      <div className="hidden md:block overflow-x-auto w-full [scrollbar-width:thin]">
                        <table className="w-full text-left text-xs min-w-[650px]">
                          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                            <tr>
                              {!isEmployeeView && <th className="py-2.5 px-4 font-medium">EMPLOYEE</th>}
                              <th className="py-2.5 px-4 font-medium">DATE &amp; DAY</th>
                              <th className="py-2.5 px-4 font-medium">STATUS</th>
                              <th className="py-2.5 px-4 font-medium">CLOCK IN</th>
                              <th className="py-2.5 px-4 font-medium">CLOCK OUT</th>
                              <th className="py-2.5 px-4 font-medium">BREAK TIME</th>
                              <th className="py-2.5 px-4 font-medium">ACTIVE WORKED</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {employeeDailyRecords.map((rec, recIdx) => {
                              const dateInfo = formatDailyDate(rec.date);
                              const isToday = dateInfo.isToday;
                              const isWorking = isToday && !rec.isCompleted && !rec.isOnBreak && !rec.checkOut && Boolean(rec.checkIn);
                              const isOnBreak = isToday && !rec.isCompleted && Boolean(rec.isOnBreak);
                              const isDone = isToday ? Boolean(rec.isCompleted || rec.checkOut) : Boolean(rec.checkOut);

                              return (
                                <tr key={`${rec.id || rec.date}-d-${recIdx}`} className="hover:bg-slate-50/70 transition-colors">
                                  {!isEmployeeView && (
                                    <td className="py-3 px-4 font-semibold text-slate-900">
                                      {rec.employeeName || rec.employeeId}
                                    </td>
                                  )}
                                  <td className="py-3 px-4 font-medium text-slate-900">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900">{dateInfo.formatted}</span>
                                      {isToday ? (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800">
                                          TODAY
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-mono">({dateInfo.dayName})</span>
                                      )}
                                    </div>
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
                                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200 w-fit block">
                                        {rec.status || 'Present'}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 font-mono text-slate-700">
                                    {rec.checkIn && rec.checkIn !== '—' ? (
                                      <span>{rec.checkIn}</span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 font-mono text-slate-700">
                                    {rec.checkOut && rec.checkOut !== '—' ? (
                                      <span>{rec.checkOut}</span>
                                    ) : isWorking ? (
                                      <span className="text-emerald-600 font-medium">Working...</span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 font-mono text-slate-600">
                                    <span className={isOnBreak ? 'text-amber-700 font-semibold' : ''}>
                                      {getRecordBreakDisplay(rec)}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                                    <span className={isWorking ? 'text-emerald-700 font-bold' : 'text-slate-800'}>
                                      {getRecordActiveWorkedDisplay(rec)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* VIEW 2: Admin Today's Live Workforce Shift Log */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {visibleEmployees.map((emp) => {
                      const rec = getEmpTodayRecord(emp);
                      const isWorking = rec && !rec.isCompleted && !rec.isOnBreak && !rec.checkOut;
                      const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
                      const isDone = rec && (rec.isCompleted || Boolean(rec.checkOut));

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
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden md:block overflow-x-auto w-full [scrollbar-width:thin]">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4 font-medium">EMPLOYEE</th>
                          <th className="py-2.5 px-4 font-medium">DEPARTMENT</th>
                          <th className="py-2.5 px-4 font-medium">CLOCK IN</th>
                          <th className="py-2.5 px-4 font-medium">CLOCK OUT</th>
                          <th className="py-2.5 px-4 font-medium">ACTIVE WORKED</th>
                          <th className="py-2.5 px-4 font-medium">BREAK TIME</th>
                          <th className="py-2.5 px-4 font-medium">LIVE STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleEmployees.map((emp) => {
                          const rec = getEmpTodayRecord(emp);
                          const isWorking = rec && !rec.isCompleted && !rec.isOnBreak && !rec.checkOut;
                          const isOnBreak = rec && !rec.isCompleted && rec.isOnBreak;
                          const isDone = rec && (rec.isCompleted || Boolean(rec.checkOut));

                          const liveSecs = rec ? getLiveActiveSeconds(rec) : 0;
                          const breakSecs = rec ? getLiveBreakSeconds(rec) : 0;
                          const isWfhActive = Boolean(wfhMap[emp.id] || wfhMap[emp.id.toLowerCase()]);

                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
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
                              <td className="py-3 px-4 font-mono text-slate-700">
                                {rec?.checkIn ? (
                                  <span>{rec.checkIn}</span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-700">
                                {rec?.checkOut ? (
                                  <span>{rec.checkOut}</span>
                                ) : isWorking ? (
                                  <span className="text-emerald-600 font-medium">Working...</span>
                                ) : (
                                  <span className="text-slate-400">—</span>
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
                                <span className={isOnBreak ? 'text-amber-700 font-semibold' : ''}>
                                  {rec ? getRecordBreakDisplay(rec) : '0s'}
                                </span>
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
                </>
              )}            </div>
          </div>
        );
      })()}

      {/* TAB 1: Attendance Summary (Employee-Wise & Grid View) - strictly disabled for admin */}
      {(resolvedTab as string) === 'summary' && isEmployeeView && (
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${summaryViewMode === 'cards'
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${summaryViewMode === 'grid'
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
                <div className="text-xl font-semibold tracking-tight text-slate-800 mt-1">
                  {visibleEmployees.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Staff on company roster</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Avg Attendance Rate</span>
                </div>
                <div className="text-xl font-semibold tracking-tight text-emerald-800 mt-1">
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

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70">
                <div className="flex items-center gap-2 text-blue-700 text-[11px] font-semibold">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  <span>Calendar Days</span>
                </div>
                <div className="text-xl font-semibold tracking-tight text-blue-800 mt-1">
                  {daysInMonth.length} Days
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">Total days in {selectedMonth}</div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70">
                <div className="flex items-center gap-2 text-purple-700 text-[11px] font-semibold">
                  <Plane className="w-3.5 h-3.5 text-purple-600" />
                  <span>Leaves &amp; Absences</span>
                </div>
                <div className="text-xl font-semibold tracking-tight text-purple-800 mt-1">
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
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${metrics.score >= 90
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
                              <span className="text-[10px] text-slate-400 font-medium block">Half Day</span>
                              <span className={`font-bold text-xs ${metrics.halfDays > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                {metrics.halfDays}
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
                              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                                {isWorkingNow ? <><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Currently Working</> : isDoneToday ? 'Shift Done' : 'Not Punched Today'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${metrics.score >= 90
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
                    <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-3">Present Days</th>
                          <th className="py-3 px-3">Half Days</th>
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

                              {/* 3. Half Days */}
                              <td className="py-3 px-3">
                                {metrics.halfDays > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{metrics.halfDays} Days</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-400">
                                    0 Days
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
                                      className={`h-full rounded-full transition-all ${metrics.score >= 90
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
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
                            const monthStr = String(currentMonthIdx + 1).padStart(2, '0');
                            const dateStr = `${currentYearNum}-${monthStr}-${dayStr}`;
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
            const monthStr = String(currentMonthIdx + 1).padStart(2, '0');
            const todayStr = getTodayDateString();

            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
                onClick={() => setDetailEmp(null)}
              >
                <div
                  className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[90vh] flex flex-col cursor-default my-auto overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center border border-emerald-200 shrink-0">
                        {detailEmp.avatarUrl ? (
                          <img src={detailEmp.avatarUrl} alt={detailEmp.firstName} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span>{detailEmp.firstName?.[0]}{detailEmp.lastName?.[0]}</span>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {detailEmp.firstName} {detailEmp.lastName}
                          </h3>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            {detailEmp.employeeCode || detailEmp.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>{detailEmp.departmentName || 'General Staff'}</span>
                          <span>•</span>
                          <span>{detailEmp.designationTitle || 'Employee'}</span>
                          <span>•</span>
                          <span className="text-slate-400">{detailEmp.shift || 'General Shift (9 AM - 6 PM)'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fetchEmpWorkStatus(detailEmp)}
                        disabled={detailEmpLoading}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition cursor-pointer disabled:opacity-50"
                        title="Refresh live punch status from /api/attendance/work/status"
                      >
                        <RotateCcw className={`w-4 h-4 ${detailEmpLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailEmp(null)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Real Metrics KPI Strip */}
                  {(() => {
                    const todaySummary = detailEmpStatusData?.todaySummary;
                    const presentCount = todaySummary?.totalSessionsToday && todaySummary.totalSessionsToday > 0
                      ? Math.max(1, m.presentDays)
                      : m.presentDays;
                    const totalWorkHrsStr = todaySummary?.totalDurationFormatted
                      ? todaySummary.totalDurationFormatted
                      : `${m.totalHours} hrs`;
                    const totalBreakStr = todaySummary?.totalBreakFormatted || detailEmpStatusData?.formattedTotalBreak || `${m.allRecords.reduce((acc, r) => acc + (r.breakDurationMinutes || 0), 0)}m`;
                    const avgHrsStr = Number(m.avgDailyHours) > 0 ? `${m.avgDailyHours} h/day` : (todaySummary?.totalDurationFormatted ? `${todaySummary.totalDurationFormatted}/day` : '0.0 h/day');

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                          <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Present Days</div>
                          <div className="text-lg font-semibold tracking-tight text-emerald-800 mt-0.5">{presentCount} {presentCount === 1 ? 'Day' : 'Days'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Total Break Taken</div>
                          <div className="text-lg font-semibold tracking-tight text-amber-800 mt-0.5">{totalBreakStr}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                          <div className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">Total Work Hours</div>
                          <div className="text-lg font-semibold tracking-tight text-indigo-800 mt-0.5">{totalWorkHrsStr}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Daily Average</div>
                          <div className="text-lg font-semibold tracking-tight text-slate-800 mt-0.5">{avgHrsStr}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Real-time Status Banner from /api/attendance/work/status */}
                  {detailEmpStatusData && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${detailEmpStatusData.isOnBreak || detailEmpStatusData.activeSession?.status === 'ON_BREAK'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : detailEmpStatusData.hasActiveSession || detailEmpStatusData.activeSession?.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-200/80 text-slate-700'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${detailEmpStatusData.isOnBreak || detailEmpStatusData.activeSession?.status === 'ON_BREAK'
                            ? 'bg-amber-500 animate-pulse'
                            : detailEmpStatusData.hasActiveSession || detailEmpStatusData.activeSession?.status === 'ACTIVE'
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-400'
                            }`} />
                          {detailEmpStatusData.isOnBreak || detailEmpStatusData.activeSession?.status === 'ON_BREAK'
                            ? <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3" /> Currently on Break</span>
                            : detailEmpStatusData.hasActiveSession || detailEmpStatusData.activeSession?.status === 'ACTIVE'
                              ? 'Live Shift Active'
                              : 'Shift Completed'}
                        </span>

                        {detailEmpStatusData.currentBreak && (
                          <span className="text-amber-800 font-semibold text-[11px]">
                            Break Elapsed: <strong>{detailEmpStatusData.currentBreak.formattedElapsed}</strong>
                          </span>
                        )}

                        {detailEmpStatusData.activeSession && (
                          <span className="text-slate-600 text-[11px]">
                            Total Session Time: <strong className="text-slate-900">{detailEmpStatusData.activeSession.formattedTotalAttendance || detailEmpStatusData.activeSession.formattedElapsed || '—'}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {(detailEmpStatusData.assignedOffice || detailEmpStatusData.activeSession?.officeLocationName) && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {detailEmpStatusData.assignedOffice?.name || detailEmpStatusData.activeSession?.officeLocationName}
                          </span>
                        )}
                        {detailEmpStatusData.todaySummary?.totalSessionsToday !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800">
                            {detailEmpStatusData.todaySummary.totalSessionsToday} Sessions Today
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Tabs inside Modal */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setDetailModalTab('logs')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${detailModalTab === 'logs'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Punch Logs & History {detailEmpLoading ? '(Syncing...)' : `(${m.allRecords.length})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailModalTab('matrix')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${detailModalTab === 'matrix'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Monthly Calendar ({selectedMonth} {currentYearNum})</span>
                    </button>
                  </div>

                  {/* TAB 1: Real Punch Logs & History */}
                  {detailModalTab === 'logs' && (
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl [scrollbar-width:thin] min-h-[220px]">
                      {detailEmpLoading ? (
                        <div className="py-14 px-4 text-center">
                          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                          <h4 className="text-sm font-bold text-slate-800">Checking Live Attendance Records...</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            Querying /api/attendance/work/status for {detailEmp.firstName} {detailEmp.lastName}...
                          </p>
                        </div>
                      ) : m.allRecords.length === 0 ? (
                        <div className="py-14 px-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">No Punch Logs Recorded</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            No attendance punch records exist in the database for {detailEmp.firstName} {detailEmp.lastName} yet. Records will automatically appear here once the employee punches in/out.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Punch In</th>
                              <th className="py-2.5 px-3">Punch Out</th>
                              <th className="py-2.5 px-3">Break</th>
                              <th className="py-2.5 px-3">Work Hours</th>
                              <th className="py-2.5 px-3 text-right">Device / Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {m.allRecords.map((rec) => {
                              const recDate = new Date(rec.date);
                              const dayLabel = rec.date === todayStr ? 'Today' : recDate.toLocaleDateString('en-US', { weekday: 'short' });
                              const formattedDate = recDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                              const st = String(rec.status || 'Present').toLowerCase();
                              const isWorkingNow = rec.checkIn && !rec.checkOut && rec.date === todayStr;

                              return (
                                <tr key={rec.id || rec.date} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    <div>{formattedDate}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{dayLabel}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.isOnBreak || st === 'on_break'
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : st === 'late'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : st === 'half day'
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : st === 'absent'
                                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                    >
                                      {rec.isOnBreak || st === 'on_break' ? <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3" /> On Break</span> : (rec.status || 'Present')}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                                    {rec.checkIn || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                                    {rec.isOnBreak ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 animate-pulse">
                                        <Pause className="w-2.5 h-2.5" />
                                        Break Active
                                      </span>
                                    ) : isWorkingNow ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        In Progress
                                      </span>
                                    ) : (
                                      rec.checkOut || '—'
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 font-mono">
                                    {(rec as any).formattedTotalBreak || (rec.breakDurationMinutes ? `${rec.breakDurationMinutes}m` : '0m')}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                    {(rec as any).durationFormatted || (rec.workingHours ? `${rec.workingHours} hrs` : (isWorkingNow ? 'Active' : '—'))}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="inline-flex flex-col items-end gap-0.5">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                        {(rec as any).officeLocationName || (rec as any).deviceInfo || rec.checkInDevice?.deviceType || (rec.isWFH ? 'Remote / WFH' : 'Web Punch')}
                                      </span>
                                      {(rec as any).ipAddress && (
                                        <span className="text-[9px] font-mono text-slate-400">IP: {(rec as any).ipAddress}</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Dynamic Monthly Calendar Matrix */}
                  {detailModalTab === 'matrix' && (
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl [scrollbar-width:thin] min-h-[220px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Punch In</th>
                            <th className="py-2.5 px-3">Punch Out</th>
                            <th className="py-2.5 px-3">Work Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {daysInMonth.map(({ day, dayName, dayOfWeek }) => {
                            const dayStr = String(day).padStart(2, '0');
                            const dateStr = `${currentYearNum}-${monthStr}-${dayStr}`;
                            const rec = m.allRecords.find((r) => r.date === dateStr);

                            const isWeekend = isDateWeekend(dateStr, getWorkScheduleConfig(user?.companyId));
                            const isPast = dateStr < todayStr;
                            const isToday = dateStr === todayStr;

                            let statusLabel = 'Not Punched';
                            let statusClass = 'bg-slate-100 text-slate-500';

                            if (rec) {
                              const st = String(rec.status || 'Present').toLowerCase();
                              if (st === 'late') {
                                statusLabel = 'Late';
                                statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                              } else if (st === 'half day') {
                                statusLabel = 'Half Day';
                                statusClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                              } else if (st === 'absent') {
                                statusLabel = 'Absent';
                                statusClass = 'bg-rose-50 text-rose-700 border border-rose-200';
                              } else {
                                statusLabel = 'Present';
                                statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                              }
                            } else if (isWeekend) {
                              statusLabel = 'Weekend Off';
                              statusClass = 'bg-slate-100 text-slate-400';
                            } else if (isToday) {
                              statusLabel = 'Today';
                              statusClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                            } else if (isPast) {
                              statusLabel = 'No Record';
                              statusClass = 'bg-slate-50 text-slate-400 border border-slate-100';
                            } else {
                              statusLabel = 'Upcoming';
                              statusClass = 'bg-slate-50 text-slate-400';
                            }

                            const inTime = rec?.checkIn || '—';
                            const outTime = rec?.checkOut || (rec?.checkIn && isToday ? 'Working' : '—');
                            const duration = rec?.workingHours ? `${rec.workingHours} hrs` : '—';

                            return (
                              <tr key={day} className={`hover:bg-slate-50/70 ${isToday ? 'bg-blue-50/30' : ''}`}>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  <span>{day} {selectedMonth.slice(0, 3)} {currentYearNum}</span>{' '}
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
                  )}

                  {/* Modal Footer */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Showing verified live attendance records for <strong>{detailEmp.firstName} {detailEmp.lastName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailEmp(null)}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
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

      {/* Modal: HR Regularization */}
      {isRegModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRegModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <Sliders className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    HR Attendance Regularization
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Adjust employee punch record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
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
                    min={new Date().toISOString().split('T')[0]}
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
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clock-in Time</label>
                  <input
                    type="text"
                    value={regCheckIn}
                    onChange={(e) => setRegCheckIn(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clock-out Time</label>
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

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  Save Regularization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Biometric Hardware Hub (Multi-Company Ready) */}
      {isBiometricModalOpen && (
        <BiometricHubModal
          isOpen={isBiometricModalOpen}
          onClose={() => setIsBiometricModalOpen(false)}
          employees={employees}
          onRefreshAttendance={onRefresh}
          currentCompanyId={(user as any)?.companyId || 'comp-paneliya'}
          currentCompanyName={(user as any)?.companyName || 'Paneliya Technology Inc.'}
        />
      )}
    </div>
  );
};
