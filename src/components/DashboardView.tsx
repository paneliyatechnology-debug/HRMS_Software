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
  Eye,
  EyeOff,
  ListChecks,
  Umbrella,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Employee, LeaveRequest, AttendanceRecord, Announcement } from '../types/hrms';
import { api } from '../lib/api';
import { useCompanyLive } from '../lib/useCompanyLive';
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  calculateEmployeeLeaveBalances,
  RawLeaveQuotaPayload,
} from '../lib/leaveQuotaUtils';
import { getRoleDefinition } from '../lib/roleConfig';
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
import {
  canUserPunch,
  canDeleteUser,
  canCreateUser,
  canApproveRejectLeave,
  isModuleAllowedForUser,
} from '../lib/rolePermissions';
import { useWorkSession } from '../context/WorkSessionContext';

function formatDisplayName(first?: string, last?: string): string {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!l || f.toLowerCase() === l.toLowerCase() || f.toLowerCase().includes(l.toLowerCase())) return f;
  if (l.toLowerCase().includes(f.toLowerCase())) return l;
  return `${f} ${l}`;
}

interface DashboardViewProps {
  loading?: boolean;
  stats: any;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
  leaveTypes?: any[];
  notices?: any[];
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
  loading = false,
  stats,
  employees,
  leaves,
  leaveTypes,
  attendance,
  notices,
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
  const officeRole = String(user?.role || '').toUpperCase();
  const isSuperAdmin = officeRole === 'SUPER_ADMIN';
  const officeDashboard = portalMode === 'admin' || officeRole === 'MANAGER' || officeRole === 'SUPERVISOR';
  const canReviewPhotos = ['ADMIN', 'HR', 'HR_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(officeRole);
  const [photoRequests, setPhotoRequests] = useState<Array<{ id: string; userName: string; role: string; email: string }>>([]);
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);

  const [saStats, setSaStats] = useState<{
    stats: Record<string, any>;
    charts: {
      monthlyOrders?: Array<{ key: string; label: string; orders: number; revenue: number }>;
      companyStatuses?: Array<{ status: string; count: number }>;
      orderStatuses?: Array<{ status: string; count: number }>;
    } | null;
    companies: any[];
    plans: any[];
    orders: any[];
    support: any[];
    loading: boolean;
  }>({ stats: {}, charts: null, companies: [], plans: [], orders: [], support: [], loading: isSuperAdmin });

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    setSaStats((prev) => ({ ...prev, loading: true }));
    api.getDashboard()
      .then((res: any) => {
        if (!active) return;
        setSaStats({
          stats: res?.stats || {},
          charts: res?.charts || null,
          companies: Array.isArray(res?.companies) ? res.companies : [],
          plans: Array.isArray(res?.plans) ? res.plans : [],
          orders: Array.isArray(res?.orders) ? res.orders : [],
          support: Array.isArray(res?.support) ? res.support : [],
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setSaStats((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [isSuperAdmin]);

  const loadPhotoRequests = async () => {
    if (!canReviewPhotos) return;
    try {
      setPhotoRequests(await api.listPhotoRequests());
    } catch {
      setPhotoRequests([]);
    }
  };

  useEffect(() => {
    void loadPhotoRequests();
  }, [canReviewPhotos]);
  const [liveTick, setLiveTick] = useState(0);
  useCompanyLive(['employees'], () => {
    void loadPhotoRequests();
  });
  useCompanyLive(['all', 'employees', 'attendance', 'leaves', 'notices', 'holidays', 'settings', 'tasks', 'payroll'], () => {
    setLiveTick((t) => t + 1);
    onRefreshData?.();
  });

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
    liveBreakHMS,
    liveBreakWords,
    elapsedSeconds,
    breakSeconds,
    totalWorkedSeconds,
    totalBreakSeconds,
    activeSession,
    lastCompletedSession,
    todaySummary,
    attendanceLogic,
    punches: livePunches,
    initialLoading: workSessionLoading,
    checkIn: handleCheckInAction,
    takeBreak: handleTakeBreakAction,
    resumeWork: handleResumeWorkAction,
    checkOut: handleCheckOutAction,
    actionLoading,
  } = useWorkSession();

  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>(() => getAllAttendanceRecords());
  const activeEmpId = (currentEmp.id && currentEmp.id !== 'emp-self' ? currentEmp.id : '') || user.employeeId || user.id || '';

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

  // Real backend-only states for announcements, holidays, tasks, payslips, company branding, and leave balances
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(portalMode !== 'admin');
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState<boolean>(portalMode !== 'admin');
  const [holidaysError, setHolidaysError] = useState<string | null>(null);
  const [leaveTypesList, setLeaveTypesList] = useState<any[]>(leaveTypes || []);
  const [leaveQuotaData, setLeaveQuotaData] = useState<RawLeaveQuotaPayload | null>(null);
  const [leaveQuotaLoading, setLeaveQuotaLoading] = useState<boolean>(portalMode !== 'admin');
  const [leaveQuotaError, setLeaveQuotaError] = useState<string | null>(null);
  const [empTasks, setEmpTasks] = useState<any[]>([]);
  const [empTasksLoading, setEmpTasksLoading] = useState<boolean>(portalMode !== 'admin');
  const [empTasksError, setEmpTasksError] = useState<string | null>(null);
  const [empPayslips, setEmpPayslips] = useState<any[]>([]);
  const [empPayslipsLoading, setEmpPayslipsLoading] = useState<boolean>(portalMode !== 'admin');
  const [empPayslipsError, setEmpPayslipsError] = useState<string | null>(null);
  const [shiftTargetHours, setShiftTargetHours] = useState<number | null>(null);
  const [companyNameApi, setCompanyNameApi] = useState<string>('');

  useEffect(() => {
    if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
      setLeaveTypesList(leaveTypes);
    }
  }, [leaveTypes]);

  useEffect(() => {
    if (isSuperAdmin) {
      setLeaveQuotaLoading(false);
      setAnnouncementsLoading(false);
      setHolidaysLoading(false);
      setEmpTasksLoading(false);
      setEmpPayslipsLoading(false);
      return;
    }
    let isMounted = true;
    const fetchExtraData = async () => {
      if (portalMode !== 'admin' && isMounted) {
        setHolidaysLoading(true);
        setAnnouncementsLoading(true);
        setEmpTasksLoading(true);
        setEmpPayslipsLoading(true);
        setLeaveQuotaLoading(true);
        setHolidaysError(null);
        setAnnouncementsError(null);
        setEmpTasksError(null);
        setEmpPayslipsError(null);
        setLeaveQuotaError(null);
      }

      const holPromise = api.getHolidays()
        .then((holRes: any) => {
          if (!isMounted) return;
          setHolidays(Array.isArray(holRes) ? holRes : Array.isArray(holRes?.data) ? holRes.data : []);
        })
        .catch((err: any) => {
          if (isMounted) {
            setHolidays([]);
            setHolidaysError(err?.message || 'Unable to load holidays.');
          }
        })
        .finally(() => {
          if (isMounted) setHolidaysLoading(false);
        });

      const ltPromise = api.listLeaveTypes(user?.companyId ? { companyId: user.companyId } : undefined)
        .then((ltRes: any) => {
          if (!isMounted) return true;
          if (Array.isArray(ltRes)) {
            setLeaveTypesList(ltRes);
          }
          return true;
        })
        .catch(() => false);

      const settingsPromise = api.getAttendanceSettings()
        .then((settingsRes: any) => {
          if (!isMounted || !settingsRes) return;
          const payload = settingsRes?.data || settingsRes;
          const explicitHours = Number(
            payload?.workingHoursPerDay ??
            payload?.dailyTargetHours ??
            payload?.targetHours ??
            payload?.expectedHours
          );
          if (Number.isFinite(explicitHours) && explicitHours > 0 && explicitHours <= 16) {
            setShiftTargetHours(Math.round(explicitHours * 10) / 10);
            return;
          }
          const startStr = String(payload?.shiftStart || '').trim();
          const endStr = String(payload?.shiftEnd || '').trim();
          if (startStr && endStr) {
            const parseMins = (t: string) => {
              const m = t.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
              if (!m) return null;
              let h = parseInt(m[1], 10);
              const mins = parseInt(m[2], 10);
              const ap = m[3]?.toUpperCase();
              if (ap === 'PM' && h < 12) h += 12;
              if (ap === 'AM' && h === 12) h = 0;
              return h * 60 + mins;
            };
            const sM = parseMins(startStr);
            const eM = parseMins(endStr);
            if (sM !== null && eM !== null && eM > sM) {
              const hrs = Math.round(((eM - sM) / 60) * 10) / 10;
              if (hrs > 0 && hrs <= 16) setShiftTargetHours(hrs);
            }
          }
        })
        .catch(() => {
          if (isMounted) setShiftTargetHours(null);
        });

      const companyPromise = api.getMyCompany()
        .then((comp: any) => {
          if (isMounted && comp?.name) {
            setCompanyNameApi(String(comp.name).replace(/\s+Inc\.?$/i, '').trim());
          }
        })
        .catch(() => undefined);

      if (portalMode !== 'admin') {
        const tasksPromise = api.listTasks()
          .then((res: any) => {
            if (!isMounted) return;
            const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            setEmpTasks(list);
          })
          .catch((err: any) => {
            if (isMounted) {
              setEmpTasks([]);
              setEmpTasksError(err?.message || 'Unable to load tasks.');
            }
          })
          .finally(() => {
            if (isMounted) setEmpTasksLoading(false);
          });

        const payslipPromise = api.listPayslips(true)
          .then((res: any) => {
            if (!isMounted) return;
            const list = Array.isArray(res)
              ? res
              : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.payslips)
                  ? res.payslips
                  : [];
            setEmpPayslips(list);
          })
          .catch((err: any) => {
            if (isMounted) {
              setEmpPayslips([]);
              setEmpPayslipsError(err?.message || 'Unable to load payslips.');
            }
          })
          .finally(() => {
            if (isMounted) setEmpPayslipsLoading(false);
          });

        const annPromise = api.getAnnouncements()
          .then((res: any) => {
            if (!isMounted) return;
            const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            setAnnouncements(list);
          })
          .catch((err: any) => {
            if (isMounted) {
              setAnnouncements([]);
              setAnnouncementsError(err?.message || 'Unable to load announcements.');
            }
          })
          .finally(() => {
            if (isMounted) setAnnouncementsLoading(false);
          });

        const leavePromise = Promise.all([
          ltPromise,
          fetchLeaveQuotaData(activeEmpId)
            .then((payload) => ({ ok: true as const, payload }))
            .catch((err: any) => ({ ok: false as const, err })),
        ])
          .then(([ltOk, quotaRes]) => {
            if (!isMounted) return;
            if (quotaRes.ok) {
              setLeaveQuotaData(quotaRes.payload);
              if (!ltOk && !quotaRes.payload?.settings && !quotaRes.payload?.balances) {
                setLeaveQuotaError('Unable to load leave balances.');
              }
            } else {
              setLeaveQuotaData(null);
              if (!ltOk) {
                setLeaveQuotaError(quotaRes.err?.message || 'Unable to load leave balances.');
              }
            }
          })
          .finally(() => {
            if (isMounted) setLeaveQuotaLoading(false);
          });

        await Promise.all([
          holPromise,
          settingsPromise,
          companyPromise,
          tasksPromise,
          payslipPromise,
          annPromise,
          leavePromise,
        ]);
      } else {
        await Promise.all([holPromise, ltPromise, settingsPromise, companyPromise]);
      }
    };
    fetchExtraData();

    const handleLeaveQuotaSync = async () => {
      if (portalMode === 'admin') return;
      try {
        const [payload, ltRes] = await Promise.all([
          fetchLeaveQuotaData(activeEmpId),
          api.listLeaveTypes(user?.companyId ? { companyId: user.companyId } : undefined).catch(() => []),
        ]);
        if (isMounted) {
          setLeaveQuotaData(payload);
          if (Array.isArray(ltRes) && ltRes.length > 0) {
            setLeaveTypesList(ltRes);
          }
        }
      } catch (_) { }
    };

    window.addEventListener('hrms_settings_updated', handleLeaveQuotaSync);
    window.addEventListener('hrms_leaves_updated', handleLeaveQuotaSync);
    window.addEventListener('hrms_leave_types_updated', handleLeaveQuotaSync);
    return () => {
      isMounted = false;
      window.removeEventListener('hrms_settings_updated', handleLeaveQuotaSync);
      window.removeEventListener('hrms_leaves_updated', handleLeaveQuotaSync);
      window.removeEventListener('hrms_leave_types_updated', handleLeaveQuotaSync);
    };
  }, [portalMode, activeEmpId, user?.companyId, isSuperAdmin, liveTick]);

  // Set of all identifier keys for this employee to match attendance records accurately
  const myCandidateIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeEmpId) ids.add(activeEmpId.toLowerCase());
    if (currentEmp?.id) ids.add(currentEmp.id.toLowerCase());
    if (user?.id) ids.add(user.id.toLowerCase());
    if (user?.employeeId) ids.add(user.employeeId.toLowerCase());
    if (currentEmp?.employeeCode) ids.add(currentEmp.employeeCode.toLowerCase());
    if ((user as any)?.employeeCode) ids.add((user as any).employeeCode.toLowerCase());
    [...ids].forEach((id) => {
      const clean = id.replace(/^(emp-|user-)/, '');
      if (clean) ids.add(clean);
    });
    return ids;
  }, [activeEmpId, currentEmp, user]);

  // Merge real backend attendance prop with live session attendance records (deduplicated by date + employeeId)
  const mergedAttendance = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    // 1. Authoritative backend records (contains complete punches array, checkInAt, checkOutAt)
    for (const rec of (attendance || [])) {
      if (!rec) continue;
      const empId = rec.employeeId || (rec as any).userId || rec.id || '';
      const key = `${empId.trim().toLowerCase()}__${rec.date}`;
      map.set(key, rec);
    }
    // 2. Overlay live session records, preserving backend punches if local doesn't have them
    for (const rec of (allAttendance || [])) {
      if (!rec) continue;
      const empId = rec.employeeId || (rec as any).userId || rec.id || '';
      const key = `${empId.trim().toLowerCase()}__${rec.date}`;
      const existing = map.get(key);
      if (existing) {
        const localIn = Boolean(rec.checkIn && rec.checkIn !== '—' && rec.checkIn !== '--:--');
        map.set(key, {
          ...existing,
          ...rec,
          checkIn: localIn ? rec.checkIn : existing.checkIn,
          checkOut: rec.checkOut || existing.checkOut,
          isOnBreak: rec.isOnBreak ?? existing.isOnBreak,
          isCompleted: rec.isCompleted ?? existing.isCompleted,
          punches: (Array.isArray(rec.punches) && rec.punches.length > 0)
            ? rec.punches
            : (Array.isArray(existing.punches) && existing.punches.length > 0)
              ? existing.punches
              : [],
        });
      } else {
        map.set(key, rec);
      }
    }
    return Array.from(map.values());
  }, [attendance, allAttendance]);

  // Real employee full attendance history (for 7d/14d daily graph & recent attendance)
  const myAllAttendance = useMemo(() => {
    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
    const empFullName = `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();

    const isMatch = (a: any) => {
      // In employee view, if backend scoped it to employee, accept all
      if (portalMode === 'employee') return true;

      const empId = (a.employeeId || '').toLowerCase();
      const userId = ((a.userId || (a as any).user?.id || '')).toLowerCase();
      const cleanEmpId = empId.replace(/^(emp-|user-)/, '');
      const cleanUserId = userId.replace(/^(emp-|user-)/, '');

      if (empId && myCandidateIds.has(empId)) return true;
      if (cleanEmpId && myCandidateIds.has(cleanEmpId)) return true;
      if (userId && myCandidateIds.has(userId)) return true;
      if (cleanUserId && myCandidateIds.has(cleanUserId)) return true;

      const aEmail = ((a.email || (a as any).user?.email || (a as any).employeeEmail || '')).toLowerCase();
      if (userEmail && aEmail && aEmail === userEmail) return true;

      const aName = (a.employeeName || (a as any).userName || '').trim().toLowerCase();
      if (userFullName && aName && aName === userFullName) return true;
      if (empFullName && aName && aName === empFullName) return true;

      return false;
    };

    const list = mergedAttendance.filter(isMatch);

    // If today has active or completed live session from WorkSessionContext, synthesize today's entry if missing
    const todayStr = getTodayDateString();
    const hasToday = list.some((a) => a.date === todayStr);

    if (!hasToday && (currentStatus === 'working' || currentStatus === 'on_break' || currentStatus === 'completed')) {
      const formatIso = (iso?: string) => {
        if (!iso) return '';
        try {
          const d = new Date(iso);
          return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
          return iso;
        }
      };

      const checkInTime = formatIso(activeSession?.startTime || lastCompletedSession?.startTime);
      const checkOutTime = currentStatus === 'completed' ? formatIso(lastCompletedSession?.endTime) : undefined;
      const todayTotalHours = currentStatus === 'completed' ? (todaySummary?.totalDurationFormatted || '00:00:00') : liveWorkedHMS;

      const liveTodayRec: AttendanceRecord = {
        id: `live-session-${todayStr}`,
        employeeId: user?.id || currentEmp?.id || 'emp-self',
        employeeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Me',
        date: todayStr,
        checkIn: checkInTime || '—',
        checkOut: checkOutTime,
        status: 'Present',
        totalHours: todayTotalHours,
        workingHours: 0,
        overtimeHours: 0,
        breakDurationMinutes: breakSeconds ? Math.floor(breakSeconds / 60) : 0,
        remarks: 'Live Work Session',
        createdAt: new Date().toISOString(),
      };
      list.unshift(liveTodayRec);
    }

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [mergedAttendance, myCandidateIds, portalMode, user, currentEmp, currentStatus, activeSession, lastCompletedSession, todaySummary, liveWorkedHMS, liveBreakHMS]);

  // Real employee recent attendance (last 5 records)
  const myRecentAttendance = useMemo(() => {
    return myAllAttendance.slice(0, 5);
  }, [myAllAttendance]);

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const todayStr = getTodayDateString();
    return holidays
      .filter((h) => String(h.date || '').slice(0, 10) >= todayStr)
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
      .slice(0, 3);
  }, [holidays]);

  // Leave processing state for admin
  const pendingLeaves = leaves.filter((l) => (l.status || '').toLowerCase() === 'pending');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [approveModalData, setApproveModalData] = useState<{
    id: string;
    empName: string;
    leaveType: string;
    empId?: string;
    daysCount?: number;
    startDate?: string;
    endDate?: string;
    reason?: string;
  } | null>(null);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; empName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Operational requirements');

  const handleDashboardOpenApproveModal = (leave: LeaveRequest) => {
    setApproveModalData({
      id: leave.id,
      empName: leave.employeeName,
      leaveType: leave.leaveType,
      empId: leave.employeeId,
      daysCount: leave.daysCount,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
    });
  };

  const executeApproveLeave = async () => {
    if (!approveModalData) return;
    const { id, empName, leaveType, empId } = approveModalData;
    setProcessingLeaveId(id);
    try {
      await api.acceptLeave(id, 'Accepted. Take care.');
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
      setApproveModalData(null);
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
      await api.rejectLeave(id, rejectReason || 'Rejected.');
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
      approveModalData ||
      rejectModalData ||
      removingEmpDashboard ||
      noticeTargetEmpDashboard
    );

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (checkOutModalOpen) setCheckOutModalOpen(false);
          if (approveModalData) setApproveModalData(null);
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
  }, [checkOutModalOpen, approveModalData, rejectModalData, removingEmpDashboard, noticeTargetEmpDashboard]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const empRoleDef = getRoleDefinition(currentEmp?.role || 'EMPLOYEE');

  const handleConfirmRemoveEmpDashboard = async () => {
    if (!removingEmpDashboard) return;
    if (!canDeleteUser(user)) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only Admin and HR have permission to delete users.',
      });
      return;
    }
    setRemoveEmpLoading(true);
    try {
      const empIdToDelete = removingEmpDashboard.id || (removingEmpDashboard as any).userId || (removingEmpDashboard as any)._id || (removingEmpDashboard as any).employeeId || '';
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

  const todayDate = getTodayDateString();
  const teamIds = new Set(employees.map((emp) => emp.id));
  const isPresent = (record: AttendanceRecord) => {
    const status = String(record.status || '').toLowerCase();
    return Boolean(record.checkIn) || status === 'present' || status === 'late' || status === 'half day';
  };
  const weekBars = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const presentIds = new Set(
      attendance
        .filter((record) => String(record.date || '').slice(0, 10) === iso && teamIds.has(record.employeeId) && isPresent(record))
        .map((record) => record.employeeId),
    );
    const count = presentIds.size;
    const rate = employees.length === 0 ? 0 : Math.round((count / employees.length) * 100);
    return {
      day: index === 6 ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      val: rate,
      count: `${count} Present`,
      isToday: index === 6,
    };
  });
  const todayRecords = attendance.filter(
    (record) => String(record.date || '').slice(0, 10) === todayDate && teamIds.has(record.employeeId) && isPresent(record),
  );
  const activeWorkingCount = todayRecords.filter((a) => !a.isCompleted && !a.isOnBreak).length;
  const onBreakCount = todayRecords.filter((a) => !a.isCompleted && a.isOnBreak).length;
  const completedTodayCount = todayRecords.filter((a) => a.isCompleted).length;
  const approvedLeavesCount = leaves.filter((l) => (l.status || '').toLowerCase() === 'approved').length;

  return (
    <div className="space-y-4 w-full overflow-x-clip">
      {/* Welcome & Section Head (Admin Only) */}
      {officeDashboard && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#0f172a] flex items-baseline gap-1.5 flex-wrap">
              <span>Hello,</span>
              <span className="text-[#1b4332]">{user.firstName || 'Admin'}!</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin ? (
              <button
                onClick={() => onNavigateModule('companies')}
                className="btn-primary"
              >
                All Companies
              </button>
            ) : (
              isModuleAllowedForUser('announcements', user) && (
                <button
                  onClick={() => onNavigateModule('announcements')}
                  className="btn-primary"
                >
                  View Announcements
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Employee Welcome Hero Banner */}
      {portalMode !== 'admin' && !isSuperAdmin && (() => {
        const hr = new Date().getHours();
        const greetWord = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
        const empFullName = formatDisplayName(user.firstName, user.lastName) || user.email || '';
        const compName = companyNameApi || user.companyName || currentEmp.companyName || '';
        return (
          <div
            className="relative rounded-[24px] border border-[#CFE4D7] overflow-hidden shadow-[0_2px_12px_rgba(16,56,36,0.04)] min-h-[142px] sm:min-h-[156px] flex items-start"
            style={{
              background: 'linear-gradient(108deg, #EAF4EE 0%, #E2F2E7 40%, #D8EFE1 72%, #CCEBD8 100%)',
            }}
          >
            {/* Soft Flowing Mint Curves Behind Building */}
            <svg
              viewBox="0 0 800 180"
              preserveAspectRatio="none"
              className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none select-none"
              aria-hidden="true"
            >
              <path
                d="M340 180 C460 95, 560 35, 800 0 L800 180 Z"
                fill="#D2EEDC"
                fillOpacity="0.55"
              />
              <path
                d="M450 180 C540 110, 640 50, 800 35 L800 180 Z"
                fill="#BCE5CC"
                fillOpacity="0.45"
              />
            </svg>
            <div
              className="hidden sm:block absolute inset-y-0 right-0 w-[42%] max-w-[440px] pointer-events-none select-none overflow-hidden"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to left, rgba(0,0,0,0.95) 42%, rgba(0,0,0,0.45) 75%, transparent 100%)',
                maskImage:
                  'linear-gradient(to left, rgba(0,0,0,0.95) 42%, rgba(0,0,0,0.45) 75%, transparent 100%)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/directory-building.jpg"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-center opacity-85"
              />
            </div>
            <div className="relative z-10 max-w-full sm:max-w-[62%] px-6 pt-5 pb-12 sm:px-8 sm:pt-6 sm:pb-16">
              <h1 className="text-xl sm:text-[25px] font-extrabold tracking-tight text-[#17251F] leading-snug break-words">
                {empFullName ? `${greetWord}, ${empFullName}!` : `${greetWord}!`} <span aria-hidden="true">👋</span>
              </h1>
              <p className="text-xs sm:text-[13.5px] text-[#55695E] mt-1 leading-relaxed">
                {compName ? (
                  <>Here&apos;s what&apos;s happening at <span className="font-semibold text-[#17251F]">{compName}</span> today.</>
                ) : (
                  <>Here&apos;s what&apos;s happening today.</>
                )}
              </p>
            </div>
          </div>
        );
      })()}

      {isSuperAdmin ? (
        /* ============================================================== */
        /* SUPER ADMIN VIEW (Scoped strictly to Super Admin permissions)  */
        /* ============================================================== */
        <div className="space-y-5">
          {saStats.loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="stat h-24 bg-white/70 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/80 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-20 bg-slate-200/70 rounded" />
                    <div className="h-6 w-14 bg-slate-200/80 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div
                onClick={() => onNavigateModule('companies')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <small>All Companies</small>
                  <strong>{saStats.stats.totalCompanies ?? saStats.companies.length}</strong>
                  <small>{saStats.stats.activeCompanies ?? 0} active · {saStats.stats.pendingCompanies ?? 0} pending</small>
                </div>
              </div>

              <div
                onClick={() => onNavigateModule('plans')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <small>Subscription Plans</small>
                  <strong>{saStats.stats.totalPlans ?? saStats.plans.length}</strong>
                  <small>{saStats.stats.activePlans ?? 0} active plans</small>
                </div>
              </div>

              <div
                onClick={() => onNavigateModule('orders')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <small>Revenue &amp; Orders</small>
                  <strong>₹{Number(saStats.stats.totalRevenue || 0).toLocaleString('en-IN')}</strong>
                  <small>{saStats.stats.activeOrders ?? 0} active · {saStats.stats.pendingOrders ?? 0} pending</small>
                </div>
              </div>

              <div
                onClick={() => onNavigateModule('support')}
                className="stat cursor-pointer hover:border-[#95d5b2] transition-colors h-full"
              >
                <div className="stat-icon">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <small>Support Inquiries</small>
                  <strong>{saStats.stats.totalSupport ?? saStats.support.length}</strong>
                  <small>Demo &amp; contact requests</small>
                </div>
              </div>
            </div>
          )}

          {/* Super Admin Analytics Graphs */}
          {(() => {
            const monthly = saStats.charts?.monthlyOrders || [];
            const maxRev = Math.max(1, ...monthly.map((m) => Number(m.revenue || 0)));
            const maxOrd = Math.max(1, ...monthly.map((m) => Number(m.orders || 0)));
            const compStatuses = saStats.charts?.companyStatuses || [];
            const totalCompForChart = Math.max(1, compStatuses.reduce((s, c) => s + c.count, 0));
            const activeC = compStatuses.find((c) => c.status === 'Active')?.count || 0;
            const pendingC = compStatuses.find((c) => c.status === 'Pending')?.count || 0;
            const otherC = totalCompForChart === 1 && compStatuses.reduce((s, c) => s + c.count, 0) === 0
              ? 0
              : Math.max(0, compStatuses.reduce((s, c) => s + c.count, 0) - activeC - pendingC);
            const activePct = Math.round((activeC / totalCompForChart) * 100);
            const pendingPct = Math.round((pendingC / totalCompForChart) * 100);
            const orderStatuses = saStats.charts?.orderStatuses || [];
            const totalOrdForChart = Math.max(1, orderStatuses.reduce((s, o) => s + o.count, 0));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Graph 1: 6-Month Revenue & Orders Bar Chart */}
                <section className="panel lg:col-span-7 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="m-0 border-0 pb-0 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#2d6a4f]" />
                        <span>6-Month Revenue &amp; Orders Trend</span>
                      </h3>
                      <p className="text-[11px] text-[#6c757d] mt-0.5">
                        Monthly subscription revenue (INR) and order volume
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Last 6 Months
                    </span>
                  </div>

                  {monthly.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      No monthly order data available yet.
                    </div>
                  ) : (
                    <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1 border-b border-slate-100">
                      {monthly.map((m) => {
                        const heightPct = m.revenue > 0
                          ? Math.max(12, Math.round((m.revenue / maxRev) * 100))
                          : m.orders > 0
                            ? Math.max(10, Math.round((m.orders / maxOrd) * 45))
                            : 6;
                        return (
                          <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                            <div className="text-[10px] font-bold text-slate-600 opacity-80 group-hover:opacity-100 transition-opacity text-center whitespace-nowrap">
                              {m.revenue > 0 ? `₹${m.revenue.toLocaleString('en-IN')}` : `${m.orders} ord`}
                            </div>
                            <div className="w-full max-w-[44px] flex-1 flex items-end justify-center">
                              <div
                                title={`${m.label}: ₹${m.revenue.toLocaleString('en-IN')} (${m.orders} orders)`}
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t-xl transition-all duration-500 ${m.revenue > 0 || m.orders > 0
                                  ? 'bg-gradient-to-t from-[#1b4332] to-[#40916c] group-hover:from-[#2d6a4f] group-hover:to-[#52b788] shadow-xs'
                                  : 'bg-slate-100'
                                  }`}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Graph 2: Platform Status Breakdown (Donut + Bars) */}
                <section className="panel lg:col-span-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="m-0 border-0 pb-0 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#2d6a4f]" />
                        <span>Platform Distribution</span>
                      </h3>
                      <p className="text-[11px] text-[#6c757d] mt-0.5">
                        Companies &amp; subscription status breakdown
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 py-2">
                    {/* SVG Ring Donut for Company Statuses */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="#e2e8f0"
                          strokeWidth="3.6"
                        />
                        {activePct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#1b4332"
                            strokeWidth="3.6"
                            strokeDasharray={`${activePct} ${100 - activePct}`}
                            strokeDashoffset="0"
                          />
                        )}
                        {pendingPct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="3.6"
                            strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                            strokeDashoffset={`${-activePct}`}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-slate-900 leading-none">
                          {saStats.stats.totalCompanies ?? saStats.companies.length}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Companies</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332]" /> Active
                        </span>
                        <span className="font-bold text-slate-900">{activeC}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending
                        </span>
                        <span className="font-bold text-slate-900">{pendingC}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Inactive / Rejected
                        </span>
                        <span className="font-bold text-slate-900">{otherC}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Progress Bars */}
                  <div className="pt-3 mt-2 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Orders by Status
                    </p>
                    {orderStatuses.map((o) => {
                      const pct = Math.round((o.count / totalOrdForChart) * 100);
                      const barColor =
                        o.status === 'Active'
                          ? 'bg-emerald-600'
                          : o.status === 'Pending'
                            ? 'bg-amber-500'
                            : 'bg-slate-400';
                      return (
                        <div key={o.status} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">{o.status}</span>
                            <span className="font-bold text-slate-900">{o.count}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="panel flex flex-col">
              <h3>
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Recent Companies
                </span>
                <button
                  onClick={() => onNavigateModule('companies')}
                  className="btn-ghost text-xs"
                >
                  View All
                </button>
              </h3>
              {saStats.companies.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No companies registered yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {saStats.companies.slice(0, 5).map((comp: any) => (
                    <div key={comp.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">{comp.name}</strong>
                        <span className={`tag ${comp.status === 'Active' ? 'green' : comp.status === 'Pending' ? 'orange' : ''}`}>
                          {comp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6c757d] mt-1 truncate">
                        {comp.email} {comp.industrySector ? `· ${comp.industrySector}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel flex flex-col">
              <h3>
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Recent Premium Orders
                </span>
                <button
                  onClick={() => onNavigateModule('orders')}
                  className="btn-ghost text-xs"
                >
                  Manage Orders
                </button>
              </h3>
              {saStats.orders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No premium orders recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {saStats.orders.slice(0, 5).map((ord: any) => (
                    <div key={ord.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">
                          {ord.companyName || ord.companyId} — {ord.planName}
                        </strong>
                        <span className={`tag ${ord.status === 'Active' ? 'green' : ord.status === 'Pending' ? 'orange' : ''}`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6c757d] mt-1">
                        ₹{Number(ord.price || 0).toLocaleString('en-IN')} · {ord.durationMonths} month(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel flex flex-col">
              <h3>
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2d6a4f] shrink-0" /> Recent Support Inquiries
                </span>
                <button
                  onClick={() => onNavigateModule('support')}
                  className="btn-ghost text-xs"
                >
                  View Inquiries
                </button>
              </h3>
              {saStats.support.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No support or demo inquiries received yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {saStats.support.slice(0, 5).map((req: any) => (
                    <div key={req.id} className="item">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-[#343a40] truncate">
                          {req.name} {req.companyName ? `(${req.companyName})` : ''}
                        </strong>
                        <span className="tag green">{req.kind || 'Inquiry'}</span>
                      </div>
                      <p className="text-[11px] text-[#6c757d] mt-1 line-clamp-1">
                        {req.email} · {req.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : officeDashboard ? (
        /* ============================================================== */
        /* HR / ADMIN VIEW                                                */
        /* ============================================================== */
        <div className="space-y-5">
          {canReviewPhotos && photoRequests.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-black text-amber-950">Profile photo requests</p>
              <p className="text-[11px] text-amber-900">Approve one upload. The same list is also on Employees.</p>
              {photoRequests.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-amber-100 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.userName || item.email}</p>
                    <p className="text-[11px] text-slate-500">{item.role} · {item.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={photoBusy === item.id}
                      onClick={async () => {
                        setPhotoBusy(item.id);
                        try {
                          const result = await api.reviewPhotoRequest(item.id, true);
                          showToast({ type: 'success', title: 'Approved', message: result.message });
                          await loadPhotoRequests();
                        } catch (err: any) {
                          showToast({ type: 'error', title: 'Could not approve', message: err.message || 'Try again.' });
                        } finally {
                          setPhotoBusy(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={photoBusy === item.id}
                      onClick={async () => {
                        setPhotoBusy(item.id);
                        try {
                          const result = await api.reviewPhotoRequest(item.id, false);
                          showToast({ type: 'success', title: 'Rejected', message: result.message });
                          await loadPhotoRequests();
                        } catch (err: any) {
                          showToast({ type: 'error', title: 'Could not reject', message: err.message || 'Try again.' });
                        } finally {
                          setPhotoBusy(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Personal Shift Clock Console for HR / Manager */}
          {canUserPunch(user) && (
            <DailyShiftConsole variant="banner" clockSize="sm" showHeaderClock={false} />
          )}

          {/* KPI Stats Row */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="stat h-24 bg-white/70 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/80 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-20 bg-slate-200/70 rounded" />
                    <div className="h-6 w-14 bg-slate-200/80 rounded" />
                    <div className="h-2.5 w-24 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {isModuleAllowedForUser('employees', user) && (
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
              )}

              {isModuleAllowedForUser('attendance', user) && (
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
              )}

              {canApproveRejectLeave(user) && isModuleAllowedForUser('leaves', user) && (
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
              )}

              {isModuleAllowedForUser('chat', user) && (
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
              )}
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-full">
              <section className="panel flex flex-col">
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

              {canApproveRejectLeave(user) && (
                <section className="panel flex flex-col">
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
                    <div className="divide-y divide-slate-100">
                      {pendingLeaves.slice(0, 3).map((leave, leaveIdx) => {
                        const isProcessing = processingLeaveId === leave.id;
                        return (
                          <div
                            key={leave.id ? `${leave.id}-${leaveIdx}` : leaveIdx}
                            className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <strong className="text-xs text-[#343a40]">
                                  {leave.employeeName}
                                </strong>
                                <span className="tag orange text-[11px]">
                                  {leave.leaveType}
                                </span>
                                <span className="text-[11px] text-[#6c757d]">
                                  {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''} ({leave.daysCount}d)
                                </span>
                                <span className="text-[11px] font-semibold text-amber-700">
                                  Pending
                                </span>
                              </div>
                              {leave.reason && (
                                <p className="text-[11px] text-[#6c757d] truncate max-w-md">
                                  Reason: <span className="text-[#343a40] font-medium">&ldquo;{leave.reason}&rdquo;</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {canApproveRejectLeave(user) && (
                                <>
                                  <button
                                    onClick={() => handleDashboardOpenApproveModal(leave)}
                                    disabled={isProcessing}
                                    className="btn-primary !text-[11px] !py-1 !px-2.5 !rounded-lg"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleDashboardRejectLeave(leave.id, leave.employeeName, leave.employeeId)}
                                    disabled={isProcessing}
                                    className="btn-danger !text-[11px] !py-1 !px-2.5 !rounded-lg"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </div>

            {isModuleAllowedForUser('employees', user) && (
              <div className="panel space-y-3 col-span-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f8f9fa]">
                  <div>
                    <h3 className="text-sm font-bold text-[#343a40] m-0">
                      Staff Directory &amp; Live Time Tracking
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateModule('attendance')}
                      className="btn-ghost text-xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#6c757d]" />
                      <span>Timesheets</span>
                    </button>
                    {canCreateUser(user) && (
                      <button
                        onClick={onOpenAddEmployeeModal}
                        className="btn-primary text-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Employee</span>
                      </button>
                    )}
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
                          const todayDate = getTodayDateString();
                          const todayRec =
                            mergedAttendance.find((r) => r && r.date === todayDate && isMatchEmployee(r, emp.id)) ||
                            (attendance || []).find((r) => r && r.date === todayDate && isMatchEmployee(r, emp.id)) ||
                            getTodayRecordForEmployee(emp.id, mergedAttendance);
                          const isDone = todayRec && Boolean(todayRec.isCompleted || (todayRec.checkOut && todayRec.checkOut !== '—') || (todayRec as any).status === 'Completed');
                          const isOnBreak = todayRec && !isDone && Boolean(todayRec.isOnBreak);
                          const isWorking = todayRec && !isDone && !isOnBreak && Boolean(todayRec.checkIn && todayRec.checkIn !== '—');

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
                                    type="button"
                                    id={`btn-dash-chat-${emp.id}`}
                                    onClick={() => onOpenChatWithEmployee?.(emp.id)}
                                    aria-label="Chat"
                                    className="group relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-out shadow-lg z-20">
                                      Chat
                                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    id={`btn-dash-notice-${emp.id}`}
                                    onClick={() => handleOpenNoticeModalDashboard(emp)}
                                    aria-label="Notice"
                                    className="group relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
                                  >
                                    <Bell className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-out shadow-lg z-20">
                                      Notice
                                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                    </span>
                                  </button>

                                  {canDeleteUser(user) && emp.email !== user.email && emp.id !== user.employeeId && emp.id !== user.id && (
                                    <button
                                      type="button"
                                      id={`btn-dash-remove-${emp.id}`}
                                      onClick={() => setRemovingEmpDashboard(emp)}
                                      aria-label="Remove"
                                      className="group relative inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 hover:border-rose-300 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-out shadow-lg z-20">
                                        Remove
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                      </span>
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
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* EMPLOYEE SELF-SERVICE VIEW (HIGH-CLARITY & SIMPLE)             */
        /* ============================================================== */
        <div className="space-y-4">
          {/* â•â•â• EMPLOYEE STAT CARDS â•â•â• */}
          {(() => {
            const myLeaves = leaves.filter((l) => {
              const eId = currentEmp?.id || user?.employeeId || user?.id || '';
              const eEmail = currentEmp?.email?.toLowerCase() || user?.email?.toLowerCase() || '';
              const eCode = ((currentEmp as any)?.employeeCode || (user as any)?.employeeCode || '').toLowerCase();
              const eName = `${currentEmp?.firstName || user?.firstName || ''} ${currentEmp?.lastName || user?.lastName || ''}`.trim().toLowerCase();
              if (eId && l.employeeId === eId) return true;
              if (eEmail && (l as any).employeeEmail?.toLowerCase() === eEmail) return true;
              if (eCode && (l as any).employeeCode?.toLowerCase() === eCode) return true;
              if (eName && l.employeeName?.toLowerCase() === eName) return true;
              return false;
            });
            const empLeaveSummary = resolveLeaveQuotaSummary(
              leaveQuotaData?.settings ?? null,
              leaveQuotaData?.balances ?? null,
              myLeaves,
              leaveTypesList
            );
            const empLeaveResult = calculateEmployeeLeaveBalances(
              leaveTypesList,
              myLeaves,
              leaveQuotaData?.settings ?? null,
              leaveQuotaData?.balances ?? null
            );
            const hasLeaveBackendData = Boolean(
              leaveQuotaData?.settings ||
              leaveQuotaData?.balances ||
              leaveTypesList.length > 0
            );
            const empLeftDays = empLeaveResult.hasConfiguredTypes
              ? empLeaveResult.totalAvailable
              : empLeaveSummary.total.available;

            const todayStr = getTodayDateString();
            const myTodayRec = myAllAttendance.find((r) => String(r.date || '').slice(0, 10) === todayStr) || null;
            const formatClockTime = (raw?: string) => {
              if (!raw || raw === '—' || raw === '--:--') return '';
              const dt = new Date(raw);
              if (!Number.isNaN(dt.getTime()) && raw.includes('T')) {
                return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
              }
              return raw;
            };
            const checkInLabel =
              formatClockTime(activeSession?.startTime) ||
              formatClockTime(lastCompletedSession?.startTime) ||
              formatClockTime(myTodayRec?.checkIn) ||
              '';

            const effectiveWorkedSecs =
              totalWorkedSeconds ||
              elapsedSeconds ||
              myTodayRec?.activeSeconds ||
              (typeof myTodayRec?.workingHours === 'number' && myTodayRec.workingHours > 0
                ? Math.round(myTodayRec.workingHours * 3600)
                : 0);
            const wHrs = Math.floor(effectiveWorkedSecs / 3600);
            const wMins = Math.floor((effectiveWorkedSecs % 3600) / 60);
            const hasAttendanceToday = Boolean(
              currentStatus === 'working' ||
              currentStatus === 'on_break' ||
              currentStatus === 'completed' ||
              myTodayRec?.checkIn ||
              effectiveWorkedSecs > 0
            );
            const workHoursText = !hasAttendanceToday
              ? '—'
              : wHrs > 0
                ? `${wHrs}h ${wMins}m`
                : `${wMins}m`;

            const attendanceHeadline =
              currentStatus === 'working'
                ? 'Present'
                : currentStatus === 'on_break'
                  ? 'On Break'
                  : currentStatus === 'completed' || Boolean(myTodayRec?.checkIn)
                    ? 'Present'
                    : 'Not Clocked In';

            const attendanceStatusPill =
              currentStatus === 'working'
                ? { label: 'Working', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                : currentStatus === 'on_break'
                  ? { label: 'On Break', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
                  : currentStatus === 'completed'
                    ? { label: 'Completed', cls: 'bg-emerald-50 text-[#1b4332] border-emerald-200' }
                    : myTodayRec?.status
                      ? { label: myTodayRec.status, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                      : { label: 'Pending', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

            const pendingTasksCount = empTasks.filter((t: any) => {
              const st = String(t?.status || '').toUpperCase();
              return st !== 'COMPLETED' && st !== 'DONE';
            }).length;

            const sortedPayslips = [...empPayslips].sort((a: any, b: any) => {
              const yA = Number(a?.year || 0);
              const yB = Number(b?.year || 0);
              if (yA !== yB) return yB - yA;
              const mA = Number(a?.month || 0);
              const mB = Number(b?.month || 0);
              if (mA !== mB) return mB - mA;
              return String(b?.createdAt || '').localeCompare(String(a?.createdAt || ''));
            });
            const latestPayslip = sortedPayslips[0] || null;
            const latestPayslipAmount = latestPayslip
              ? Number(
                  latestPayslip.netSalary ??
                  latestPayslip.netPay ??
                  latestPayslip.net ??
                  latestPayslip.amount ??
                  0
                )
              : null;
            const latestPayslipPeriod = (() => {
              if (!latestPayslip) return '';
              const m = Number(latestPayslip.month);
              const y = latestPayslip.year;
              if (m >= 1 && m <= 12 && y) {
                return new Date(Number(y), m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
              return latestPayslip.monthName || latestPayslip.period || '';
            })();

            if (loading) {
              return (
                <div className="-mt-6 sm:-mt-8 px-2.5 sm:px-4 relative z-20 grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 animate-pulse">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="bg-white rounded-[16px] border border-[#E4EDE7] px-3.5 py-2.5 min-h-[84px] sm:min-h-[90px] flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-200/70 shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="h-2.5 w-20 bg-slate-200/70 rounded" />
                        <div className="h-5 w-16 bg-slate-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div className="-mt-8 sm:-mt-10 px-3 sm:px-5 relative z-20 grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 items-stretch">
                {isModuleAllowedForUser('attendance', user) && (
                  <div
                    onClick={() => onNavigateModule('attendance')}
                    className="group bg-white rounded-[16px] sm:rounded-[18px] border border-[#d6ece0] shadow-[0_2px_10px_rgba(16,56,36,0.05)] px-3.5 py-2.5 sm:py-3 min-h-[86px] sm:min-h-[94px] hover:border-[#a6d8bc] hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5 h-full min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F5EC] text-[#087A50] flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium text-[#5c6b63] leading-tight">Today&apos;s Attendance</p>
                        <ChevronRight className="w-3.5 h-3.5 text-[#9fb0a6] group-hover:text-[#087A50] transition shrink-0 mt-0.5" />
                      </div>
                      {workSessionLoading ? (
                        <div className="h-5 w-24 bg-slate-100 rounded animate-pulse mt-1" />
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[16px] sm:text-[17px] font-extrabold text-[#17251F] leading-tight">
                              {attendanceHeadline}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                              currentStatus === 'working' || currentStatus === 'completed'
                                ? 'bg-[#E8F5EC] text-[#087A50] border-[#bde4cc]'
                                : attendanceStatusPill.cls
                            }`}>
                              {attendanceStatusPill.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64736B] mt-0.5 leading-snug break-words">
                            {checkInLabel ? `Check In: ${checkInLabel}` : 'Not clocked in yet'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('attendance', user) && (
                  <div
                    onClick={() => onNavigateModule('attendance')}
                    className="group bg-white rounded-[16px] sm:rounded-[18px] border border-[#d6ece0] shadow-[0_2px_10px_rgba(16,56,36,0.05)] px-3.5 py-2.5 sm:py-3 min-h-[86px] sm:min-h-[94px] hover:border-[#a6d8bc] hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5 h-full min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F5EC] text-[#087A50] flex items-center justify-center shrink-0">
                      <Clock className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium text-[#5c6b63] leading-tight">Work Hours</p>
                        <ChevronRight className="w-3.5 h-3.5 text-[#9fb0a6] group-hover:text-[#087A50] transition shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[17px] sm:text-[18px] font-extrabold text-[#17251F] leading-tight mt-0.5 tabular-nums">
                        {workSessionLoading ? '...' : workHoursText}
                      </p>
                      <p className="text-[11px] text-[#64736B] mt-0.5 leading-snug break-words">
                        {shiftTargetHours !== null ? `Target: ${shiftTargetHours}h` : 'Shift target not set'}
                      </p>
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('leaves', user) && (
                  <div
                    onClick={() => onNavigateModule('leaves')}
                    className="group bg-white rounded-[16px] sm:rounded-[18px] border border-[#d6ece0] shadow-[0_2px_10px_rgba(16,56,36,0.05)] px-3.5 py-2.5 sm:py-3 min-h-[86px] sm:min-h-[94px] hover:border-[#a6d8bc] hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5 h-full min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F5EC] text-[#087A50] flex items-center justify-center shrink-0">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" />
                        <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" />
                        <path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z" />
                        <path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium text-[#5c6b63] leading-tight">Leave Balance</p>
                        <ChevronRight className="w-3.5 h-3.5 text-[#9fb0a6] group-hover:text-[#087A50] transition shrink-0 mt-0.5" />
                      </div>
                      <p className={`text-[17px] sm:text-[18px] font-extrabold leading-tight mt-0.5 tabular-nums ${leaveQuotaError ? 'text-[#EF4444]' : 'text-[#17251F]'}`}>
                        {leaveQuotaLoading
                          ? '...'
                          : leaveQuotaError
                            ? 'Unavailable'
                            : !hasLeaveBackendData
                              ? 'Not set'
                              : `${empLeftDays} Days`}
                      </p>
                      {leaveQuotaError ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLiveTick((t) => t + 1);
                          }}
                          className="text-[11px] text-[#087A50] font-semibold hover:underline mt-0.5 cursor-pointer"
                        >
                          Retry &rarr;
                        </button>
                      ) : (
                        <p className="text-[11px] text-[#64736B] mt-0.5 leading-snug break-words">
                          {!leaveQuotaLoading && !hasLeaveBackendData
                            ? 'Quota not configured'
                            : 'This Year'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('tasks', user) && (
                  <div
                    onClick={() => onNavigateModule('tasks')}
                    className="group bg-white rounded-[16px] sm:rounded-[18px] border border-[#d6ece0] shadow-[0_2px_10px_rgba(16,56,36,0.05)] px-3.5 py-2.5 sm:py-3 min-h-[86px] sm:min-h-[94px] hover:border-[#a6d8bc] hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5 h-full min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F5EC] text-[#087A50] flex items-center justify-center shrink-0">
                      <ListChecks className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium text-[#5c6b63] leading-tight">Pending Tasks</p>
                        <ChevronRight className="w-3.5 h-3.5 text-[#9fb0a6] group-hover:text-[#087A50] transition shrink-0 mt-0.5" />
                      </div>
                      <p className={`text-[17px] sm:text-[18px] font-extrabold leading-tight mt-0.5 tabular-nums ${empTasksError ? 'text-[#EF4444]' : 'text-[#17251F]'}`}>
                        {empTasksLoading ? '...' : empTasksError ? 'Unavailable' : pendingTasksCount}
                      </p>
                      {empTasksError ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLiveTick((t) => t + 1);
                          }}
                          className="text-[11px] text-[#087A50] font-semibold hover:underline mt-0.5 cursor-pointer"
                        >
                          Retry &rarr;
                        </button>
                      ) : (
                        <p className="text-[11px] text-[#087A50] font-semibold mt-0.5 leading-snug">
                          View Tasks &rarr;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isModuleAllowedForUser('payslips', user) && (
                  <div
                    onClick={() => onNavigateModule('payslips')}
                    className="group min-[420px]:col-span-2 md:col-span-1 bg-white rounded-[16px] sm:rounded-[18px] border border-[#d6ece0] shadow-[0_2px_10px_rgba(16,56,36,0.05)] px-3.5 py-2.5 sm:py-3 min-h-[86px] sm:min-h-[94px] hover:border-[#a6d8bc] hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5 h-full min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F5EC] text-[#087A50] flex items-center justify-center shrink-0">
                      <FileText className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium text-[#5c6b63] leading-tight">
                          {latestPayslipPeriod ? `Payslip (${latestPayslipPeriod})` : 'Payslip'}
                        </p>
                        <ChevronRight className="w-3.5 h-3.5 text-[#9fb0a6] group-hover:text-[#087A50] transition shrink-0 mt-0.5" />
                      </div>
                      {empPayslipsLoading ? (
                        <div className="h-5 w-20 bg-slate-100 rounded animate-pulse mt-1" />
                      ) : empPayslipsError ? (
                        <>
                          <p className="text-[15px] font-extrabold text-[#EF4444] leading-tight mt-0.5">
                            Unavailable
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLiveTick((t) => t + 1);
                            }}
                            className="text-[11px] text-[#087A50] font-semibold hover:underline mt-0.5 cursor-pointer"
                          >
                            Retry &rarr;
                          </button>
                        </>
                      ) : latestPayslipAmount !== null ? (
                        <>
                          <p className="text-[17px] sm:text-[18px] font-extrabold text-[#17251F] leading-tight mt-0.5 tabular-nums">
                            ₹{latestPayslipAmount.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#087A50] font-semibold mt-0.5 leading-snug">
                            View Payslip &rarr;
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[15px] font-bold text-[#17251F] leading-tight mt-0.5">
                            No Payslip Available
                          </p>
                          <p className="text-[11px] text-[#64736B] font-medium mt-0.5 leading-snug">
                            No record generated yet
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* â•â•â• EMPLOYEE PANELS GRID â•â•â• */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Row 1 Left: Attendance Today */}
            {isModuleAllowedForUser('attendance', user) && (() => {
              const todayRec = myAllAttendance.find(
                (a) => String(a.date || '').slice(0, 10) === todayDate
              );
              const formatTimeVal = (val?: string | null) => {
                if (!val || val === '--:--') return '';
                if (val.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(val)) {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    return d.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });
                  }
                }
                return val;
              };

              const punchesSrc =
                Array.isArray(livePunches) && livePunches.length > 0
                  ? livePunches
                  : Array.isArray(todayRec?.punches)
                    ? todayRec.punches
                    : [];

              const breakWindow = (() => {
                const starts = punchesSrc.filter((p: any) =>
                  ['BREAK_START', 'BREAK_IN', 'START_BREAK', 'TAKE_BREAK', 'BREAK'].includes(
                    String(p?.type || '').trim().toUpperCase().replace(/[-\s]+/g, '_')
                  )
                );
                const ends = punchesSrc.filter((p: any) =>
                  ['BREAK_END', 'BREAK_OUT', 'END_BREAK', 'RESUME', 'RESUME_WORK'].includes(
                    String(p?.type || '').trim().toUpperCase().replace(/[-\s]+/g, '_')
                  )
                );
                if (starts.length === 0) return '';
                const lastStart = starts[starts.length - 1];
                const startStr = formatTimeVal(
                  lastStart?.punchedAt || lastStart?.punchTime || lastStart?.time || lastStart?.timestamp || lastStart?.createdAt
                );
                const lastEnd = ends.length >= starts.length ? ends[ends.length - 1] : null;
                const endStr = lastEnd
                  ? formatTimeVal(lastEnd?.punchedAt || lastEnd?.punchTime || lastEnd?.time || lastEnd?.timestamp || lastEnd?.createdAt)
                  : '';
                if (startStr && endStr) return `${startStr} – ${endStr}`;
                if (startStr && currentStatus === 'on_break') return `${startStr} – Active`;
                return '';
              })();

              const checkInStr =
                formatTimeVal(activeSession?.startTime) ||
                formatTimeVal(lastCompletedSession?.startTime) ||
                formatTimeVal(todayRec?.checkIn);

              const checkOutStr =
                currentStatus === 'completed'
                  ? formatTimeVal(lastCompletedSession?.endTime) || formatTimeVal(todayRec?.checkOut) || 'Completed'
                  : todayRec?.checkOut && todayRec.checkOut !== '--:--' && currentStatus !== 'working' && currentStatus !== 'on_break'
                    ? formatTimeVal(todayRec.checkOut)
                    : checkInStr
                      ? 'Pending'
                      : '—';

              const rawBreakSecs = totalBreakSeconds || breakSeconds || 0;
              const breakDurationStr =
                rawBreakSecs > 0
                  ? formatSecondsToWords(rawBreakSecs)
                  : todayRec?.formattedTotalBreak ||
                  (todayRec?.breakDurationMinutes ? `${todayRec.breakDurationMinutes}m` : '');
              const breakDisplay =
                currentStatus === 'on_break'
                  ? breakWindow || `On Break (${liveBreakHMS})`
                  : breakWindow || breakDurationStr || (checkInStr ? 'No break logged' : '—');

              const workedSecs = Math.max(
                0,
                totalWorkedSeconds ||
                elapsedSeconds ||
                (todayRec?.workingHours ? Math.round(todayRec.workingHours * 3600) : 0)
              );
              const targetSecs = shiftTargetHours !== null && shiftTargetHours > 0 ? shiftTargetHours * 3600 : 0;
              const progressPct = targetSecs > 0
                ? Math.min(100, Math.round((workedSecs / targetSecs) * 100))
                : checkInStr
                  ? 100
                  : 0;
              const ringRadius = 42;
              const ringCirc = 2 * Math.PI * ringRadius;
              const ringOffset = ringCirc - (ringCirc * progressPct) / 100;

              const statusHeading =
                currentStatus === 'working'
                  ? 'Present'
                  : currentStatus === 'on_break'
                    ? 'On Break'
                    : currentStatus === 'completed'
                      ? 'Completed'
                      : todayRec?.status || (checkInStr ? 'Present' : 'Not Clocked In');

              const statusSubtext =
                currentStatus === 'on_break'
                  ? `Break timer: ${liveBreakHMS}`
                  : checkInStr
                    ? currentStatus === 'completed' && checkOutStr !== 'Pending' && checkOutStr !== '—'
                      ? `Out at ${checkOutStr}`
                      : `Since ${checkInStr}`
                    : 'Ready to start shift';

              const isCheckedIn = Boolean(
                currentStatus === 'working' ||
                currentStatus === 'on_break' ||
                currentStatus === 'completed' ||
                checkInStr
              );

              return (
                <div className="lg:col-span-5 flex flex-col min-w-0">
                  <div className="bg-white rounded-[18px] border border-[#E4EDE7] shadow-[0_4px_16px_rgba(16,56,36,0.06)] p-4 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#eef3ef]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#DDF3E5] text-[#087A4B] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-7 4 14 3-7h4" />
                          </svg>
                        </span>
                        <h3 className="text-[15px] font-bold text-[#17221D] tracking-tight leading-snug">
                          Attendance Today
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateModule('attendance')}
                        className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full border border-[#dce8e0] bg-[#f5faf7] hover:bg-[#e5f4eb] hover:border-[#b7dec7] hover:text-[#075B3D] text-[11px] font-semibold text-[#2d3b34] transition-colors cursor-pointer shrink-0"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {workSessionLoading ? (
                      <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1 animate-pulse">
                        <div className="sm:col-span-5 flex flex-col items-center justify-center">
                          <div className="w-26 h-26 rounded-full bg-slate-100" />
                          <div className="h-4 w-20 bg-slate-100 rounded mt-2.5" />
                        </div>
                        <div className="sm:col-span-7 space-y-3.5 pl-4">
                          <div className="h-8 w-36 bg-slate-100 rounded-lg" />
                          <div className="h-8 w-40 bg-slate-100 rounded-lg" />
                          <div className="h-8 w-32 bg-slate-100 rounded-lg" />
                        </div>
                      </div>
                    ) : (
                    <div className="py-2.5 sm:py-3 grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4 items-center flex-1">
                      {/* Left Circular Ring & Current Status */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center text-center min-w-0">
                        <div className="relative w-[108px] h-[108px] flex items-center justify-center">
                          <svg className="w-[108px] h-[108px] -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={ringRadius}
                              fill="none"
                              stroke="#e5ede8"
                              strokeWidth="7.5"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={ringRadius}
                              fill="none"
                              stroke={
                                currentStatus === 'on_break'
                                  ? '#d97706'
                                  : isCheckedIn
                                    ? '#159653'
                                    : '#cbd5e1'
                              }
                              strokeWidth="7.5"
                              strokeLinecap="round"
                              strokeDasharray={ringCirc}
                              strokeDashoffset={isCheckedIn && progressPct === 0 ? ringCirc * 0.85 : ringOffset}
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div
                            className={`absolute w-12 h-12 rounded-full flex items-center justify-center shadow-2xs ${currentStatus === 'on_break'
                              ? 'bg-amber-600 text-white'
                              : isCheckedIn
                                ? 'bg-[#087A4B] text-white'
                                : 'bg-[#f1f5f3] text-[#94a3b8]'
                              }`}
                          >
                            {isCheckedIn ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.7}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <Clock className="w-5 h-5" />
                            )}
                          </div>
                        </div>

                        <p className="text-[14px] font-bold text-[#17221D] mt-2 leading-tight">
                          {statusHeading}
                        </p>
                        <p className="text-[11px] text-[#64736B] mt-0.5 leading-snug">{statusSubtext}</p>
                      </div>

                      {/* Right Vertical Timeline */}
                      <div className="sm:col-span-7 relative pl-8 space-y-3.5 min-w-0">
                        <div
                          className="absolute left-[11px] top-3 bottom-4 w-[1.5px] bg-[#dde6df]"
                          aria-hidden="true"
                        />

                        {/* Check In */}
                        <div className="relative flex flex-col">
                          <span
                            className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${checkInStr ? 'bg-[#087A4B] text-white' : 'bg-[#eef3f0] text-[#64736B]'
                              }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.7}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="text-[13px] font-bold text-[#17221D] leading-tight">Check In</span>
                          <span className="text-[11.5px] text-[#64736B] mt-0.5 tabular-nums break-words">
                            {checkInStr || 'Not clocked in yet'}
                          </span>
                        </div>

                        {/* Break */}
                        <div className="relative flex flex-col">
                          <span
                            className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${currentStatus === 'on_break'
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-[#eef3f0] text-[#4b5c53]'
                              }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-[13px] font-bold text-[#17221D] leading-tight">Break</span>
                          <span className="text-[11.5px] text-[#64736B] mt-0.5 tabular-nums break-words">
                            {breakDisplay}
                          </span>
                        </div>

                        {/* Check Out */}
                        <div className="relative flex flex-col">
                          <span
                            className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${currentStatus === 'completed'
                              ? 'bg-[#087A4B] text-white'
                              : 'bg-[#eef3f0] text-[#17221D]'
                              }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current" />
                          </span>
                          <span className="text-[13px] font-bold text-[#17221D] leading-tight">Check Out</span>
                          <span
                            className={`text-[11.5px] mt-0.5 tabular-nums break-words ${checkOutStr === 'Pending' ? 'text-[#64736B] font-medium' : 'text-[#64736B]'
                              }`}
                          >
                            {checkOutStr}
                          </span>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Subtle quick punch footer when user has punch permission */}
                    {canUserPunch(user) && currentStatus !== 'completed' && (() => {
                      const isActiveShift = currentStatus === 'working' || currentStatus === 'on_break';
                      const isOnBreak = currentStatus === 'on_break';
                      return (
                        <div className="pt-3 border-t border-[#eef3ef] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-2 text-[#5c6b63] font-medium tabular-nums">
                            {isActiveShift && (
                              <span
                                className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
                                  isOnBreak ? 'bg-amber-500' : 'bg-[#159653]'
                                }`}
                              />
                            )}
                            <span>
                              {isOnBreak
                                ? `On break: ${liveBreakHMS}`
                                : isActiveShift
                                  ? `Live timer: ${liveWorkedHMS}`
                                  : 'Tap Clock In to start recording work hours.'}
                            </span>
                          </span>
                          {isActiveShift ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                id="btn-dashboard-break-toggle"
                                type="button"
                                disabled={actionLoading}
                                onClick={() => {
                                  if (isOnBreak) {
                                    void handleResumeWorkAction();
                                  } else {
                                    void handleTakeBreakAction();
                                  }
                                }}
                                className={`px-3.5 py-1.5 rounded-full border text-[11.5px] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                                  isOnBreak
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                                    : 'bg-white hover:bg-[#f4f9f6] text-[#17221D] border-[#d6e2da] hover:border-[#b7dec7] shadow-2xs'
                                }`}
                                title={
                                  isOnBreak
                                    ? 'End break and resume work timer'
                                    : 'Pause work timer and start break'
                                }
                              >
                                {actionLoading
                                  ? isOnBreak
                                    ? 'Breaking Out...'
                                    : 'Breaking In...'
                                  : isOnBreak
                                    ? 'Break Out'
                                    : 'Break In'}
                              </button>
                              <button
                                id="btn-dashboard-clock-out"
                                type="button"
                                disabled={actionLoading || isOnBreak}
                                onClick={() => setCheckOutModalOpen(true)}
                                className="px-4 py-1.5 rounded-full bg-[#075B3D] hover:bg-[#05452e] text-white border border-[#075B3D] shadow-2xs text-[11.5px] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                title={
                                  isOnBreak
                                    ? 'Break Out first before clocking out'
                                    : 'Clock Out'
                                }
                              >
                                Clock Out
                              </button>
                            </div>
                          ) : (
                            <button
                              id="btn-dashboard-clock-in"
                              type="button"
                              disabled={actionLoading}
                              onClick={onOpenClockModal}
                              className="px-4 py-1.5 rounded-full bg-[#075B3D] hover:bg-[#05452e] text-white text-[11.5px] font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              Clock In
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Row 1 Right: Upcoming Calendar */}
            <div className="lg:col-span-7 flex flex-col min-w-0">
              {(() => {
                const todayObj = new Date();
                const todayWeekday = todayObj.toLocaleDateString('en-US', { weekday: 'short' });
                const todayDayNum = todayObj.getDate();
                const todayMonthShort = todayObj.toLocaleDateString('en-US', { month: 'short' });

                const todayHoliday = upcomingHolidays.find(
                  (h: any) => String(h.date || '').slice(0, 10) === todayDate
                );

                const eId = currentEmp?.id || user?.employeeId || user?.id || '';
                const todayApprovedLeave = leaves.find((l) => {
                  const statusOk = String(l.status || '').toLowerCase() === 'approved';
                  if (!statusOk) return false;
                  const mine =
                    (eId && l.employeeId === eId) ||
                    (user?.email && (l as any).employeeEmail?.toLowerCase() === user.email.toLowerCase());
                  if (!mine) return false;
                  const s = String(l.startDate || '').slice(0, 10);
                  const e = String(l.endDate || l.startDate || '').slice(0, 10);
                  return s <= todayDate && e >= todayDate;
                });

                const todayBannerTitle = todayHoliday
                  ? todayHoliday.name
                  : todayApprovedLeave
                    ? `On Leave (${todayApprovedLeave.leaveType || 'Approved'})`
                    : 'No Events Today';
                const todayBannerSub = todayHoliday
                  ? todayHoliday.type || 'Company Holiday'
                  : todayApprovedLeave
                    ? 'Enjoy your approved time off.'
                    : 'Enjoy your day!';

                return (
                  <div className="bg-white rounded-[18px] border border-[#E4EDE7] shadow-[0_4px_16px_rgba(16,56,36,0.06)] p-4 sm:p-5 flex flex-col justify-between h-full min-w-0">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#eef3ef]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#DDF3E5] text-[#087A4B] flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <h3 className="text-[15px] font-bold text-[#17221D] tracking-tight leading-snug">
                          Upcoming Calendar
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateModule('calendar')}
                        className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full border border-[#dce8e0] bg-[#f5faf7] hover:bg-[#e5f4eb] hover:border-[#b7dec7] hover:text-[#075B3D] text-[11px] font-semibold text-[#2d3b34] transition-colors cursor-pointer shrink-0"
                      >
                        <span>View Calendar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-3 flex-1 flex flex-col justify-between">
                      {/* Today highlight box */}
                      <div className="relative rounded-2xl bg-gradient-to-r from-[#f8fbf9] via-[#edf8f1] to-[#d5efe0] border border-[#dce8e0] px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
                          <div className="w-13 h-15 rounded-2xl bg-white border border-[#e3ece6] shadow-2xs flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-[#5c6b63] leading-none">
                              {todayWeekday}
                            </span>
                            <span className="text-[21px] font-extrabold text-[#17221D] leading-tight mt-0.5 tabular-nums">
                              {todayDayNum}
                            </span>
                            <span className="text-[10px] font-semibold text-[#5c6b63] leading-none">
                              {todayMonthShort}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-bold text-[#17221D] leading-snug break-words">{todayBannerTitle}</p>
                            <p className="text-xs text-[#64736B] mt-0.5 leading-snug break-words">{todayBannerSub}</p>
                          </div>
                        </div>

                        {/* Soft Mint Calendar & Trees Landscape SVG anchored cleanly */}
                        <svg
                          viewBox="0 0 140 84"
                          className="hidden sm:block -mr-3.5 -mb-3 w-[124px] h-[78px] shrink-0 select-none pointer-events-none"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path d="M6 84C38 58 72 56 140 42V84H6Z" fill="#9bd7b3" fillOpacity="0.48" />
                          <rect x="38" y="14" width="66" height="54" rx="9" fill="#ffffff" stroke="#cde4d5" strokeWidth="1.5" />
                          <path d="M38 23C38 18.029 42.029 14 47 14H95C99.971 14 104 18.029 104 23V28H38V23Z" fill="#087A50" />
                          <rect x="50" y="9" width="4" height="9" rx="2" fill="#065f3d" />
                          <rect x="88" y="9" width="4" height="9" rx="2" fill="#065f3d" />
                          <rect x="47" y="35" width="9" height="7" rx="2" fill="#dcebe2" />
                          <rect x="60" y="35" width="9" height="7" rx="2" fill="#dcebe2" />
                          <rect x="73" y="35" width="9" height="7" rx="2" fill="#dcebe2" />
                          <rect x="86" y="35" width="9" height="7" rx="2" fill="#dcebe2" />
                          <rect x="47" y="46" width="9" height="7" rx="2" fill="#dcebe2" />
                          <rect x="60" y="46" width="9" height="7" rx="2" fill="#159653" />
                          <rect x="73" y="46" width="9" height="7" rx="2" fill="#dcebe2" />
                          <circle cx="90.5" cy="49.5" r="4.5" fill="#f59e0b" fillOpacity="0.9" />
                          <ellipse cx="22" cy="59" rx="7" ry="12" fill="#2d6a4f" fillOpacity="0.72" />
                          <rect x="21" y="67" width="2" height="11" fill="#176B4D" />
                          <ellipse cx="118" cy="56" rx="8" ry="13" fill="#43ae7d" fillOpacity="0.78" />
                          <rect x="117" y="65" width="2" height="11" fill="#176B4D" />
                        </svg>
                      </div>

                      {/* Upcoming Holidays list */}
                      <div>
                        <p className="text-[12.5px] font-bold text-[#17221D] mb-2">Upcoming Holidays</p>
                        {holidaysLoading ? (
                          <div className="space-y-2 animate-pulse">
                            {[0, 1].map((idx) => (
                              <div key={idx} className="h-11 rounded-xl bg-slate-100" />
                            ))}
                          </div>
                        ) : holidaysError ? (
                          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-3">
                            <span>{holidaysError}</span>
                            <button
                              type="button"
                              onClick={() => setLiveTick((t) => t + 1)}
                              className="px-2.5 py-1 rounded-full bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50 cursor-pointer shrink-0"
                            >
                              Retry
                            </button>
                          </div>
                        ) : upcomingHolidays.length === 0 ? (
                          <div className="py-4 px-3 rounded-xl bg-[#f7faf8] border border-[#e6efe9] text-center text-xs text-[#64736B]">
                            No upcoming holidays scheduled.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {upcomingHolidays.slice(0, 3).map((h: any) => {
                              const holDate = new Date(h.date);
                              const dateLabel = isNaN(holDate.getTime())
                                ? String(h.date || '')
                                : holDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                });
                              const todayMidnight = new Date();
                              todayMidnight.setHours(0, 0, 0, 0);
                              const holMidnight = new Date(holDate);
                              holMidnight.setHours(0, 0, 0, 0);
                              const diffDays = isNaN(holMidnight.getTime())
                                ? null
                                : Math.max(
                                  0,
                                  Math.round((holMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
                                );
                              const daysPill =
                                diffDays === null
                                  ? ''
                                  : diffDays === 0
                                    ? 'Today'
                                    : diffDays === 1
                                      ? 'Tomorrow'
                                      : `In ${diffDays} days`;

                              return (
                                <div
                                  key={h.id || `${h.name}-${h.date}`}
                                  className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-[#f8fbf9] border border-[#e7efe9] hover:border-[#b7dec7] transition-colors"
                                >
                                  <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                                    <span className="w-8 h-8 rounded-lg bg-[#E6F5EC] text-[#087A4B] flex items-center justify-center shrink-0">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L6.5 10h3.1L5 16.5h4.2L8 20h3v2h2v-2h3l-1.2-3.5H19L14.4 10h3.1L12 2z" />
                                      </svg>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[12.5px] font-bold text-[#17221D] leading-snug break-words">{h.name}</p>
                                      <p className="text-[11px] text-[#64736B] mt-0.5 leading-snug break-words">{dateLabel}</p>
                                    </div>
                                  </div>
                                  {daysPill && (
                                    <span className="px-3 py-1 rounded-full bg-[#DDF3E5] text-[#087A4B] border border-[#c6e8d2] text-[10.5px] font-semibold shrink-0 whitespace-nowrap self-center">
                                      {daysPill}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Row 2 Left: Task Summary */}
            {isModuleAllowedForUser('tasks', user) && (() => {
              const highCount = empTasks.filter(
                (t: any) => String(t?.priority || '').toUpperCase() === 'HIGH'
              ).length;
              const mediumCount = empTasks.filter(
                (t: any) => String(t?.priority || '').toUpperCase() === 'MEDIUM'
              ).length;
              const lowCount = empTasks.filter(
                (t: any) => String(t?.priority || '').toUpperCase() === 'LOW'
              ).length;
              const totalCount = empTasks.length;

              return (
                <div className="lg:col-span-6 flex flex-col min-w-0">
                  <div className="bg-white rounded-[18px] border border-[#E4EDE7] shadow-[0_4px_16px_rgba(16,56,36,0.06)] p-4 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#eef3ef]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#087A4B] text-white flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <h3 className="text-[15px] font-bold text-[#17221D] tracking-tight leading-snug">
                          Task Summary
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateModule('tasks')}
                        className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full border border-[#dce8e0] bg-[#f5faf7] hover:bg-[#e5f4eb] hover:border-[#b7dec7] hover:text-[#075B3D] text-[11px] font-semibold text-[#2d3b34] transition-colors cursor-pointer shrink-0"
                      >
                        <span>View All Tasks</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-3 flex-1 flex flex-col justify-center">
                      {empTasksLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
                          {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="h-20 rounded-xl bg-slate-100" />
                          ))}
                        </div>
                      ) : empTasksError ? (
                        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-3">
                          <span>{empTasksError}</span>
                          <button
                            type="button"
                            onClick={() => setLiveTick((t) => t + 1)}
                            className="px-2.5 py-1 rounded-full bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50 cursor-pointer shrink-0"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                          <button
                            type="button"
                            onClick={() => onNavigateModule('tasks')}
                            className="p-3 rounded-xl bg-[#fef6f6] border border-[#f9e4e4] hover:border-[#f3c6c6] hover:bg-[#fdeeee] transition-all text-center flex flex-col items-center justify-center cursor-pointer min-w-0"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#fde2e2] text-[#e11d48] flex items-center justify-center mb-1.5 shrink-0">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="9" opacity="0.22" />
                                <path d="M12 7.5a1 1 0 011 1v4.2a1 1 0 11-2 0V8.5a1 1 0 011-1zm0 8.5a1.15 1.15 0 110 2.3 1.15 1.15 0 010-2.3z" />
                              </svg>
                            </span>
                            <span className="text-[11px] font-medium text-[#5c6b63] leading-snug">High Priority</span>
                            <span className="text-[22px] font-extrabold text-[#17221D] mt-0.5 tabular-nums leading-tight">{highCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigateModule('tasks')}
                            className="p-3 rounded-xl bg-[#fffaf0] border border-[#faeccc] hover:border-[#f2d699] hover:bg-[#fef5e4] transition-all text-center flex flex-col items-center justify-center cursor-pointer min-w-0"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#fef0c7] text-[#d97706] flex items-center justify-center mb-1.5 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-medium text-[#5c6b63] leading-snug">Medium Priority</span>
                            <span className="text-[22px] font-extrabold text-[#17221D] mt-0.5 tabular-nums leading-tight">{mediumCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigateModule('tasks')}
                            className="p-3 rounded-xl bg-[#f4fbf6] border border-[#d9f0e1] hover:border-[#b7e2c7] hover:bg-[#eaf7ef] transition-all text-center flex flex-col items-center justify-center cursor-pointer min-w-0"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#d7f3e2] text-[#15803d] flex items-center justify-center mb-1.5 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.7}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span className="text-[11px] font-medium text-[#5c6b63] leading-snug">Low Priority</span>
                            <span className="text-[22px] font-extrabold text-[#17221D] mt-0.5 tabular-nums leading-tight">{lowCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigateModule('tasks')}
                            className="p-3 rounded-xl bg-[#f4f8fe] border border-[#dfebfb] hover:border-[#bfd6f7] hover:bg-[#ebf3fe] transition-all text-center flex flex-col items-center justify-center cursor-pointer min-w-0"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#dbeafe] text-[#2563eb] flex items-center justify-center mb-1.5 shrink-0">
                              <ListChecks className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-medium text-[#5c6b63] leading-snug">Total Tasks</span>
                            <span className="text-[22px] font-extrabold text-[#17221D] mt-0.5 tabular-nums leading-tight">{totalCount}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Row 2 Right: Announcements */}
            <div className="lg:col-span-6 flex flex-col min-w-0">
              <div className="bg-white rounded-[18px] border border-[#E4EDE7] shadow-[0_3px_12px_rgba(20,60,40,0.06)] p-4 sm:p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#eef3ef]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#DDF3E5] text-[#087A4B] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </span>
                    <h3 className="text-[15px] font-bold text-[#17221D] tracking-tight leading-snug">
                      Announcements
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateModule('announcements')}
                    className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full border border-[#dce8e0] bg-[#f5faf7] hover:bg-[#e5f4eb] hover:border-[#b7dec7] hover:text-[#075B3D] text-[11px] font-semibold text-[#2d3b34] transition-colors cursor-pointer shrink-0"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-3 flex-1 flex flex-col justify-center">
                  {announcementsLoading ? (
                    <div className="space-y-2.5 animate-pulse">
                      {[0, 1].map((idx) => (
                        <div key={idx} className="h-14 rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : announcementsError ? (
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-3">
                      <span>{announcementsError}</span>
                      <button
                        type="button"
                        onClick={() => setLiveTick((t) => t + 1)}
                        className="px-2.5 py-1 rounded-full bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50 cursor-pointer shrink-0"
                      >
                        Retry
                      </button>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="py-6 px-4 rounded-xl bg-[#f7faf8] border border-[#e6efe9] text-center text-xs text-[#64736B]">
                      No announcements posted yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {announcements.slice(0, 3).map((item: any, idx: number) => {
                        const rawDate = item.createdAt || item.date || item.publishedAt || '';
                        const dObj = rawDate ? new Date(rawDate) : null;
                        const dateStr =
                          dObj && !isNaN(dObj.getTime())
                            ? dObj.toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                            })
                            : '';
                        const messageText = item.content || item.message || item.description || '';

                        return (
                          <button
                            key={item.id || `${item.title}-${idx}`}
                            type="button"
                            onClick={() => onNavigateModule('announcements')}
                            className={`w-full text-left flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 p-3 rounded-xl border transition-all cursor-pointer ${idx === 0
                              ? 'bg-[#ebf7ef] border-[#cfead8] hover:border-[#9fd5b4]'
                              : 'bg-[#f8fbf9] border-[#e7efe9] hover:border-[#cddfd3]'
                              }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                              <span
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${idx === 0
                                  ? 'bg-[#c7e9d3] text-[#087A4B]'
                                  : 'bg-white border border-[#dce6df] text-[#1f2937]'
                                  }`}
                              >
                                {idx === 0 ? (
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.5 8.5v7a3.5 3.5 0 000-7zM4 10a2 2 0 012-2h3.6l5.9-3.6A1 1 0 0117 5.25v13.5a1 1 0 01-1.5.85L9.6 16H9v3a1 1 0 11-2 0v-3H6a2 2 0 01-2-2v-4z" />
                                  </svg>
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12.5px] font-bold text-[#17221D] leading-snug break-words">
                                  {item.title || 'Company Announcement'}
                                </p>
                                {messageText && (
                                  <p className="text-[11px] text-[#5c6b63] mt-0.5 leading-snug line-clamp-2 break-words">
                                    {messageText}
                                  </p>
                                )}
                              </div>
                            </div>
                            {dateStr && (
                              <span className="px-2.5 py-1 rounded-full bg-white border border-[#dce6df] text-[10.5px] font-semibold text-[#334139] shrink-0 whitespace-nowrap">
                                {dateStr}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Square className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Clock Out for Today?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Attendance shift finalization</p>
                </div>
              </div>
              <button
                onClick={() => setCheckOutModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 leading-relaxed flex-1">
              Once clocked out, today’s work shift is locked and finalized. You will not be able to punch in again until tomorrow.
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-checkout"
                type="button"
                onClick={() => setCheckOutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-checkout"
                type="button"
                onClick={executeCheckOut}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Finalizing...' : 'Confirm Clock Out'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern In-App Leave Approval Modal for Admin */}
      {mounted && approveModalData && typeof document !== 'undefined' && createPortal(
        <div
          id="dashboard-approve-leave-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApproveModalData(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Approve Leave Application</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{approveModalData.empName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalData(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to approve the leave application for{' '}
                <strong className="text-slate-900 font-semibold">{approveModalData.empName}</strong>?
              </p>

              {/* Leave Details Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Leave Type:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                    {approveModalData.leaveType}
                  </span>
                </div>
                {approveModalData.startDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-800">
                      {approveModalData.startDate} {approveModalData.endDate && approveModalData.endDate !== approveModalData.startDate ? `to ${approveModalData.endDate}` : ''} ({approveModalData.daysCount || 1}d)
                    </span>
                  </div>
                )}
                {approveModalData.reason && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="font-semibold text-slate-500 block mb-1">Reason:</span>
                    <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      &ldquo;{approveModalData.reason}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-approve-leave"
                type="button"
                onClick={() => setApproveModalData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-approve-leave"
                type="button"
                onClick={executeApproveLeave}
                disabled={processingLeaveId === approveModalData.id}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingLeaveId === approveModalData.id ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Approve</span>
                  </>
                )}
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Reject Leave Request</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rejectModalData.empName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalData(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Rejection Reason (Shared with Employee) *
                </label>
                <textarea
                  id="reject-reason-input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-reject-leave"
                type="button"
                onClick={() => setRejectModalData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-leave"
                type="button"
                onClick={executeRejectLeave}
                disabled={processingLeaveId === rejectModalData.id}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Remove Employee?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Staff roster modification</p>
                </div>
              </div>
              <button
                onClick={() => setRemovingEmpDashboard(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 leading-relaxed flex-1">
              Are you sure you want to remove <strong className="text-slate-900">{removingEmpDashboard.firstName} {removingEmpDashboard.lastName}</strong> ({removingEmpDashboard.employeeCode}) from the staff roster?
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-dash-remove-emp"
                type="button"
                onClick={() => setRemovingEmpDashboard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-remove-emp"
                type="button"
                onClick={handleConfirmRemoveEmpDashboard}
                disabled={removeEmpLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      Send Notice
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Direct Notice
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    To: <strong className="text-slate-700">{noticeTargetEmpDashboard.firstName} {noticeTargetEmpDashboard.lastName}</strong> ({noticeTargetEmpDashboard.employeeCode} • {noticeTargetEmpDashboard.departmentName || 'Staff'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Notice Subject / Title *
                </label>
                <input
                  id="input-dash-notice-title"
                  type="text"
                  value={dashNoticeTitle}
                  onChange={(e) => setDashNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Urgent Task, HR Note..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Urgency / Priority Level
                </label>
                <select
                  id="select-dash-notice-priority"
                  value={dashNoticePriority}
                  onChange={(e) => setDashNoticePriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Low">Low Priority (General Notice)</option>
                  <option value="Medium">Medium Priority (Standard Notice)</option>
                  <option value="High">High Priority (Action Required)</option>
                  <option value="Urgent">Urgent Notice (Immediate Attention)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Notice Content *
                </label>
                <textarea
                  id="textarea-dash-notice-content"
                  rows={4}
                  value={dashNoticeContent}
                  onChange={(e) => setDashNoticeContent(e.target.value)}
                  placeholder="Type the message for the employee..."
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-dash-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmpDashboard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-dash-send-notice"
                type="button"
                onClick={handleConfirmSendNoticeDashboard}
                disabled={dashNoticeLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{dashNoticeLoading ? 'Sending...' : 'Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
};

