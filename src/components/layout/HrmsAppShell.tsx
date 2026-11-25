'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { DashboardView } from '../DashboardView';
import dynamic from 'next/dynamic';

const ModuleLoadingSkeleton = () => (
  <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse" role="status" aria-label="Loading content">
    {/* Header / Title Bar Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="space-y-2">
        <div className="h-7 w-44 sm:w-60 bg-slate-200/80 rounded-xl" />
        <div className="h-4 w-28 sm:w-40 bg-slate-100 rounded-lg" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-24 sm:w-28 bg-slate-100 rounded-xl" />
        <div className="h-9 w-28 sm:w-32 bg-emerald-100/70 rounded-xl" />
      </div>
    </div>

    {/* Metric / Stat Cards Grid Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-20 bg-slate-100 rounded-md" />
            <div className="w-8 h-8 rounded-xl bg-slate-100" />
          </div>
          <div className="h-7 w-16 sm:w-20 bg-slate-200/90 rounded-lg" />
          <div className="h-3 w-28 bg-slate-100/80 rounded-md" />
        </div>
      ))}
    </div>

    {/* Search & Filter Toolbar Skeleton */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      <div className="h-10 w-full sm:w-72 bg-slate-100 rounded-xl" />
      <div className="flex items-center gap-2">
        <div className="h-10 w-24 bg-slate-100 rounded-xl" />
        <div className="h-10 w-28 bg-slate-100 rounded-xl" />
      </div>
    </div>

    {/* Main Data Table / List Skeleton */}
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="h-12 bg-slate-50/80 border-b border-slate-200/80 px-4 sm:px-6 flex items-center gap-4 sm:gap-6">
        <div className="h-4 w-5 bg-slate-200/80 rounded" />
        <div className="h-4 w-32 bg-slate-200/80 rounded" />
        <div className="h-4 w-24 bg-slate-200/80 rounded hidden sm:block" />
        <div className="h-4 w-28 bg-slate-200/80 rounded hidden md:block" />
        <div className="h-4 w-20 bg-slate-200/80 rounded hidden lg:block" />
        <div className="h-4 w-16 bg-slate-200/80 rounded ml-auto" />
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="py-3.5 px-4 sm:px-6 flex items-center gap-4 sm:gap-6">
            <div className="w-9 h-9 rounded-xl bg-slate-200/80 shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-4 w-36 sm:w-48 bg-slate-200/90 rounded-md" />
              <div className="h-3 w-24 sm:w-32 bg-slate-100 rounded-md" />
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-full hidden sm:block shrink-0" />
            <div className="h-4 w-24 bg-slate-100 rounded-md hidden md:block shrink-0" />
            <div className="h-4 w-20 bg-slate-100 rounded-md hidden lg:block shrink-0" />
            <div className="h-7 w-16 bg-slate-100 rounded-lg ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CalendarModule = dynamic(() => import('../modules/CalendarModule').then((m) => m.CalendarModule), { loading: () => <ModuleLoadingSkeleton /> });
const EmployeesModule = dynamic(() => import('../modules/EmployeesModule').then((m) => m.EmployeesModule), { loading: () => <ModuleLoadingSkeleton /> });
const AttendanceModule = dynamic(() => import('../modules/AttendanceModule').then((m) => m.AttendanceModule), { loading: () => <ModuleLoadingSkeleton /> });
const LeaveModule = dynamic(() => import('../modules/LeaveModule').then((m) => m.LeaveModule), { loading: () => <ModuleLoadingSkeleton /> });
const PayrollModule = dynamic(() => import('../modules/PayrollModule').then((m) => m.PayrollModule), { loading: () => <ModuleLoadingSkeleton /> });
const EmployeePayslipsModule = dynamic(() => import('../modules/EmployeePayslipsModule').then((m) => m.EmployeePayslipsModule), { loading: () => <ModuleLoadingSkeleton /> });
const RecruitmentModule = dynamic(() => import('../modules/RecruitmentModule').then((m) => m.RecruitmentModule), { loading: () => <ModuleLoadingSkeleton /> });
const PerformanceModule = dynamic(() => import('../modules/PerformanceModule').then((m) => m.PerformanceModule), { loading: () => <ModuleLoadingSkeleton /> });
const OrganizationModule = dynamic(() => import('../modules/OrganizationModule').then((m) => m.OrganizationModule), { loading: () => <ModuleLoadingSkeleton /> });
const TasksModule = dynamic(() => import('../modules/TasksModule').then((m) => m.TasksModule), { loading: () => <ModuleLoadingSkeleton /> });
const TrainingModule = dynamic(() => import('../modules/TrainingModule').then((m) => m.TrainingModule), { loading: () => <ModuleLoadingSkeleton /> });
const DocumentsModule = dynamic(() => import('../modules/DocumentsModule').then((m) => m.DocumentsModule), { loading: () => <ModuleLoadingSkeleton /> });
const AssetsModule = dynamic(() => import('../modules/AssetsModule').then((m) => m.AssetsModule), { loading: () => <ModuleLoadingSkeleton /> });
const ResignationsModule = dynamic(() => import('../modules/ResignationsModule').then((m) => m.ResignationsModule), { loading: () => <ModuleLoadingSkeleton /> });
const AnnouncementsModule = dynamic(() => import('../modules/AnnouncementsModule').then((m) => m.AnnouncementsModule), { loading: () => <ModuleLoadingSkeleton /> });
const ChatModule = dynamic(() => import('../modules/ChatModule').then((m) => m.ChatModule), { loading: () => <ModuleLoadingSkeleton /> });
const ReportsModule = dynamic(() => import('../modules/ReportsModule').then((m) => m.ReportsModule), { loading: () => <ModuleLoadingSkeleton /> });
const AuditLogsModule = dynamic(() => import('../modules/AuditLogsModule').then((m) => m.AuditLogsModule), { loading: () => <ModuleLoadingSkeleton /> });
const SettingsModule = dynamic(() => import('../modules/SettingsModule').then((m) => m.SettingsModule), { loading: () => <ModuleLoadingSkeleton /> });
const ProfileModule = dynamic(() => import('../modules/ProfileModule').then((m) => m.ProfileModule), { loading: () => <ModuleLoadingSkeleton /> });
import { getTotalUnreadChatCount, ADMIN_USER_ID, getActiveChatConversation } from '../../lib/chatService';
import { addChatUnread, subscribeChatUnread } from '../../lib/chatUnread';

const AttendanceModal = dynamic(() => import('../modals/AttendanceModal').then((m) => m.AttendanceModal), { ssr: false });
const BankDetailForm = dynamic(() => import('../modals/BankDetailForm').then((m) => m.BankDetailForm), { ssr: false });
const LeaveModal = dynamic(() => import('../modals/LeaveModal').then((m) => m.LeaveModal), { ssr: false });
import { EmployeeDrawer } from '../modals/EmployeeDrawer';
const EmployeeProfileModal = dynamic(() => import('../modals/EmployeeProfileModal').then((m) => m.EmployeeProfileModal), { ssr: false });
const GlobalSearchModal = dynamic(() => import('../modals/GlobalSearchModal').then((m) => m.GlobalSearchModal), { ssr: false });
const MobileConnectModal = dynamic(() => import('../modals/MobileConnectModal').then((m) => m.MobileConnectModal), { ssr: false });
import { MobileBottomNav } from '../common/MobileBottomNav';
import { WavyBackground } from '../common/WavyBackground';
import {
  checkEmployeePunchEligibility,
  setLiveAttendanceRecords,
  extractRecordsFromWorkStatus,
} from '../../lib/attendanceService';
import { setLiveEmployees } from '../../lib/employeeService';
import { setLiveLeaves } from '../../lib/leaveService';
import { purgeLocalBusinessData } from '../../lib/storageCleanup';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { getRouteForModule, parseRoutePath } from '../../lib/routes';
import { isModuleAllowedForUser } from '../../lib/rolePermissions';
import {
  Employee,
  Department,
  Designation,
  Location,
  LeaveRequest,
  AttendanceRecord,
  PayrollRecord,
  JobOpening,
  Candidate,
  CompanyAsset,
} from '../../types/hrms';

interface HrmsAppShellProps {
  initialModule?: string;
  initialSubTab?: string;
}

function punchClock(value?: string | null) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function attendanceKey(record: { employeeId?: string; userId?: string; date?: string }) {
  const id = String(record.employeeId || record.userId || '').trim().toLowerCase();
  return `${id}__${String(record.date || '').slice(0, 10)}`;
}

function liveAttendanceRow(detail: any): AttendanceRecord | null {
  const attendance = detail?.attendance || {};
  const employeeId = String(detail?.employeeId || attendance.userId || '');
  if (!employeeId) return null;
  const punches = Array.isArray(detail?.punches) ? detail.punches : [];
  const firstIn = punches.find((punch: any) => String(punch?.type || '').toUpperCase() === 'IN');
  const lastOut = [...punches].reverse().find((punch: any) => String(punch?.type || '').toUpperCase() === 'OUT');
  const lastType = String(punches.at(-1)?.type || '').toUpperCase();
  const onBreak = lastType === 'BREAK_START' || Boolean(detail?.logic?.onBreak);
  const completed = lastType === 'OUT';
  const date = String(detail?.date || attendance.workDate || '').slice(0, 10);
  return {
    id: String(attendance.id || `live-${employeeId}-${date}`),
    companyId: String(detail?.companyId || attendance.companyId || ''),
    employeeId,
    userId: employeeId,
    employeeName: String(attendance.userName || detail?.employeeName || 'Employee'),
    employeeCode: 'EMP',
    departmentName: 'General',
    date,
    checkIn: punchClock(firstIn?.punchedAt || attendance.checkInAt),
    checkOut: completed ? punchClock(lastOut?.punchedAt || attendance.checkOutAt) : undefined,
    breakDurationMinutes: Number(detail?.logic?.breakMinutes || 0),
    workingHours: Number(detail?.logic?.totalMinutes || attendance.totalMinutes || 0) / 60,
    overtimeHours: Number(detail?.logic?.overtimeMinutes || 0) / 60,
    status: 'Present',
    remarks: '',
    createdAt: new Date().toISOString(),
    punches,
    isOnBreak: onBreak,
    isCompleted: completed,
    checkInAt: attendance.checkInAt || firstIn?.punchedAt || null,
    checkOutAt: completed ? attendance.checkOutAt || lastOut?.punchedAt || null : null,
  } as AttendanceRecord;
}

function mergeLiveAttendance(current: AttendanceRecord[], incoming: AttendanceRecord) {
  const key = attendanceKey(incoming);
  const next = current.filter((row) => attendanceKey(row) !== key);
  const previous = current.find((row) => attendanceKey(row) === key);
  next.unshift({
    ...(previous || {}),
    ...incoming,
    employeeName: previous?.employeeName && previous.employeeName !== 'Employee' ? previous.employeeName : incoming.employeeName,
    employeeCode: previous?.employeeCode || incoming.employeeCode,
    departmentName: previous?.departmentName || incoming.departmentName,
  });
  return next;
}

function keepNewerPunch(serverRows: AttendanceRecord[], currentRows: AttendanceRecord[]) {
  const current = new Map(currentRows.map((row) => [attendanceKey(row), row]));
  const seen = new Set<string>();
  const merged = serverRows.map((row) => {
    const key = attendanceKey(row);
    seen.add(key);
    const live = current.get(key);
    if (!live?.checkIn) return row;
    if (!row.checkIn || (live.checkOut && !row.checkOut)) {
      return {
        ...row,
        checkIn: row.checkIn || live.checkIn,
        checkOut: row.checkOut || live.checkOut,
        isOnBreak: (row as any).isOnBreak ?? (live as any).isOnBreak,
        isCompleted: (row as any).isCompleted ?? (live as any).isCompleted,
        punches: Array.isArray(row.punches) && row.punches.length ? row.punches : live.punches,
      };
    }
    return row;
  });
  for (const row of currentRows) {
    if (!seen.has(attendanceKey(row)) && row.checkIn) merged.unshift(row);
  }
  return merged;
}

export function HrmsAppShell({ initialModule, initialSubTab }: HrmsAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, portalMode, setPortalMode } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeModule, setActiveModule] = useState<string>(() => {
    if (initialModule) return initialModule;
    if (pathname) {
      const parsed = parseRoutePath(pathname);
      if (parsed.isValid) return parsed.module;
    }
    return 'dashboard';
  });

  const [subTab, setSubTab] = useState<string>(() => {
    if (initialSubTab) return initialSubTab;
    if (pathname) {
      const parsed = parseRoutePath(pathname);
      return parsed.subTab || '';
    }
    return '';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrolledPageTitle, setScrolledPageTitle] = useState('');
  const mainScrollRef = useRef<HTMLElement>(null);

  const handleScrollToTop = useCallback(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen to main scroll container to trigger header live clock <-> page title morph
  useEffect(() => {
    const mainEl = mainScrollRef.current;
    if (!mainEl) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = mainEl.scrollTop;
          const nextScrolled = scrollTop > 35;
          setIsScrolled(nextScrolled);

          if (nextScrolled) {
            const headingEl = mainEl.querySelector('h1, .hrms-page-title');
            if (headingEl) {
              const text = headingEl.textContent?.trim();
              if (text) {
                setScrolledPageTitle(text);
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on initial layout or change
    handleScroll();

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [activeModule, subTab]);

  // Reset scroll and header title on page / sub-tab navigation
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    setIsScrolled(false);
    setScrolledPageTitle('');
  }, [activeModule, subTab]);

  // Synchronize route with activeModule and support backward-compatible query redirection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Backward compatibility: if an old URL such as /?module=attendance is accessed, redirect to /attendance
      const urlParams = new URLSearchParams(window.location.search);
      const legacyModule = urlParams.get('module');
      if (legacyModule) {
        urlParams.delete('module');
        const rest = urlParams.toString();
        const targetRoute = getRouteForModule(legacyModule) + (rest ? `?${rest}` : '');
        router.replace(targetRoute);
        return;
      }

      // 2. Synchronize module from current path
      const currentPath = window.location.pathname;
      const parsed = parseRoutePath(currentPath);
      if (parsed.isValid) {
        if (!isModuleAllowedForUser(parsed.module, user)) {
          router.replace(getRouteForModule('dashboard'));
          setActiveModule('dashboard');
          setSubTab('');
        } else {
          setActiveModule(parsed.module);
          setSubTab(parsed.subTab || '');
        }
      }
    }
  }, [pathname, searchParams, router, user]);

  // Browser Back and Forward navigation handling
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoutePath(window.location.pathname);
      if (parsed.isValid) {
        if (!isModuleAllowedForUser(parsed.module, user)) {
          router.replace(getRouteForModule('dashboard'));
          setActiveModule('dashboard');
          setSubTab('');
        } else {
          setActiveModule(parsed.module);
          setSubTab(parsed.subTab || '');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, router]);

  useEffect(() => {
    // Enforce live database data: purge all stale cached business records
    purgeLocalBusinessData();
  }, [isAuthenticated]);

  // Data state
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState<Record<string, boolean>>(() => {
    const initialMod = initialModule || (typeof window !== 'undefined' ? parseRoutePath(window.location.pathname).module : 'dashboard') || 'dashboard';
    return { [initialMod]: true };
  });
  const [dashboardNotices, setDashboardNotices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [currentCompany, setCurrentCompany] = useState<any>(null);

  // Modals state
  const [clockModalOpen, setClockModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  // Chat integration state
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [targetChatEmployeeId, setTargetChatEmployeeId] = useState<string | null>(null);

  const pendingLeavesCount = leaves.filter((l) => l.status === 'Pending').length;

  // Strict role guard: prevent employees from accessing admin-only views or portal
  useEffect(() => {
    const resigned = Boolean(user?.resigned);
    if (resigned) {
      if (portalMode !== 'employee') {
        setPortalMode('employee');
        return;
      }
      if (activeModule !== 'attendance' && activeModule !== 'payslips') {
        navigateToModule('attendance');
      }
      return;
    }

    const isAdmin = isUserAdminRole(user?.role);
    if (!isAdmin && portalMode === 'admin') {
      setPortalMode('employee');
      return;
    }

    if (!isModuleAllowedForUser(activeModule, user)) {
      navigateToModule('dashboard');
    }
  }, [portalMode, activeModule, user, setPortalMode]);

  useEffect(() => {
    const openClock = () => setClockModalOpen(true);
    window.addEventListener('hrms_open_clock_modal', openClock);
    return () => window.removeEventListener('hrms_open_clock_modal', openClock);
  }, []);

  useEffect(() => {
    return subscribeChatUnread((counts) => {
      setUnreadChatCount(Object.values(counts).reduce((sum, count) => sum + count, 0));
    });
  }, []);

  useEffect(() => {
    const myId = user?.id || '';
    const onDirect = (event: Event) => {
      const row = (event as CustomEvent).detail as { senderId?: string; recipientId?: string };
      if (!myId || !row?.senderId || !row.recipientId || row.senderId === myId) return;
      const conversationId = `direct-${row.senderId}`;
      if (conversationId === getActiveChatConversation()) return;
      addChatUnread(conversationId);
    };
    const onGroup = (event: Event) => {
      const row = (event as CustomEvent).detail as { groupId?: string; userId?: string };
      if (!myId || !row?.groupId || !row.userId || row.userId === myId) return;
      const conversationId = `group-${row.groupId}`;
      if (conversationId === getActiveChatConversation()) return;
      addChatUnread(conversationId);
    };
    window.addEventListener('hrms_direct_chat_message', onDirect);
    window.addEventListener('hrms_group_chat_message', onGroup);
    return () => {
      window.removeEventListener('hrms_direct_chat_message', onDirect);
      window.removeEventListener('hrms_group_chat_message', onGroup);
    };
  }, [user?.id]);

  // Global keyboard shortcut for Global Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const isFetchingDataRef = useRef<Record<string, boolean>>({});
  const pendingReloadRef = useRef<Record<string, boolean>>({});
  const employeesRef = useRef<Employee[]>([]);

  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);

  const activeCompanyId = user?.companyId || currentCompany?.id || '';
  const activeCompanyCode = (user as any)?.companyCode || currentCompany?.code || '';

  // Helpers for multi-tenant company isolation
  const scopeEmployees = useCallback((rawEmps: Employee[]): Employee[] => {
    const seenEmpIds = new Set<string>();
    const safe = Array.isArray(rawEmps)
      ? rawEmps.filter((emp) => {
        if (!emp || !emp.id || seenEmpIds.has(emp.id)) return false;
        seenEmpIds.add(emp.id);
        return true;
      })
      : [];

    if (!activeCompanyId) return safe;
    if (activeCompanyId === 'comp-paneliya' || activeCompanyId === 'cmp-1') {
      return safe.filter(
        (e) => !e.companyId || e.companyId === 'comp-paneliya' || e.companyId === 'cmp-1'
      );
    }
    const filtered = safe.filter(
      (e) =>
        !e.companyId ||
        e.companyId === activeCompanyId ||
        (e as any).companyCode === activeCompanyId ||
        (activeCompanyCode && (e as any).companyCode === activeCompanyCode)
    );
    return filtered.length > 0 ? filtered : safe;
  }, [activeCompanyId, activeCompanyCode]);

  const scopeLeaves = useCallback((rawLeaves: LeaveRequest[], scopedEmps: Employee[]): LeaveRequest[] => {
    if (!Array.isArray(rawLeaves)) return [];
    if (scopedEmps.length === 0) return rawLeaves;
    const scopedEmpIds = new Set(scopedEmps.map((e) => e.id));
    return rawLeaves
      .filter(
        (l) =>
          scopedEmpIds.has(l.employeeId) ||
          scopedEmpIds.has((l as any).userId) ||
          ((l as any).companyId && (l as any).companyId === activeCompanyId) ||
          ((l as any).employee?.id && scopedEmpIds.has((l as any).employee.id))
      )
      .map((l) => {
        const matchedEmp = scopedEmps.find(
          (e) =>
            e.id === l.employeeId ||
            e.id === (l as any).userId ||
            e.id === (l as any).employee?.id ||
            `${e.firstName} ${e.lastName}`.trim().toLowerCase() === (l.employeeName || '').trim().toLowerCase()
        );
        return {
          ...l,
          departmentName:
            l.departmentName && l.departmentName !== '--'
              ? l.departmentName
              : matchedEmp?.departmentName || (matchedEmp as any)?.department || (l as any).employee?.departmentName || 'General',
          employeeName:
            l.employeeName ||
            (matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}`.trim() : (l as any).employee?.fullName || 'Staff Member'),
        };
      });
  }, [activeCompanyId]);

  const scopeAttendance = useCallback((rawAtt: AttendanceRecord[], scopedEmps: Employee[], workStatusData?: any): AttendanceRecord[] => {
    // In employee portal mode, backend already returns the employee's own records
    if (portalMode === 'employee') {
      const workStatusRecords = extractRecordsFromWorkStatus(workStatusData, scopedEmps);
      return [...(Array.isArray(rawAtt) ? rawAtt : []), ...workStatusRecords];
    }

    const scopedEmpIds = new Set<string>();
    scopedEmps.forEach((e) => {
      if (e.id) {
        scopedEmpIds.add(e.id);
        scopedEmpIds.add(e.id.replace(/^(emp-|user-)/, ''));
      }
      if (e.userId) {
        scopedEmpIds.add(e.userId);
        scopedEmpIds.add(e.userId.replace(/^(emp-|user-)/, ''));
      }
    });

    if (user?.id) {
      scopedEmpIds.add(user.id);
      scopedEmpIds.add(user.id.replace(/^(emp-|user-)/, ''));
    }
    if ((user as any)?.employeeId) {
      scopedEmpIds.add((user as any).employeeId);
      scopedEmpIds.add((user as any).employeeId.replace(/^(emp-|user-)/, ''));
    }

    const workStatusRecords = extractRecordsFromWorkStatus(workStatusData, scopedEmps);
    const combined = [...(Array.isArray(rawAtt) ? rawAtt : []), ...workStatusRecords];
    return combined.filter((a) => {
      if (!a) return false;
      const cleanEmpId = (a.employeeId || '').replace(/^(emp-|user-)/, '');
      const cleanUserId = ((a as any).userId || '').replace(/^(emp-|user-)/, '');
      if (scopedEmpIds.has(a.employeeId) || (cleanEmpId && scopedEmpIds.has(cleanEmpId))) return true;
      if (cleanUserId && scopedEmpIds.has(cleanUserId)) return true;
      if (!activeCompanyId || ((a as any).companyId && (a as any).companyId === activeCompanyId)) return true;
      if (workStatusRecords.some((wr) => wr.id === a.id)) return true;
      return false;
    });
  }, [activeCompanyId, portalMode, user?.id, (user as any)?.employeeId]);

  // Company Brand Data - fetched once on authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    api.getMyCompany()
      .then((c) => {
        if (isMounted && c) setCurrentCompany(c);
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Page-Wise Data Loader: strictly calls ONLY the APIs needed by that module
  const loadDataForModule = useCallback(async (targetModule: string) => {
    if (isFetchingDataRef.current[targetModule]) {
      pendingReloadRef.current[targetModule] = true;
      return;
    }
    isFetchingDataRef.current[targetModule] = true;
    setModuleLoading((prev) => ({ ...prev, [targetModule]: true }));

    try {
      if (targetModule === 'dashboard') {
        setDashboardLoading(true);
        try {
          const dash = await api.getDashboard();
          setEmployees(dash.employees);
          setLiveEmployees(dash.employees);
          setLeaves(dash.leaves);
          setLiveLeaves(dash.leaves);
          setAttendance((current) => {
            const updated = keepNewerPunch(dash.attendance, current);
            setLiveAttendanceRecords(updated);
            return updated;
          });
          setDashboardNotices(dash.notices);
          setStats(dash.stats);
        } finally {
          setDashboardLoading(false);
        }
      } else if (targetModule === 'employees') {
        const [employeesData, departmentsData] = await Promise.all([
          api.getEmployees().catch(() => []),
          api.getDepartments().catch(() => []),
        ]);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : Array.isArray((departmentsData as any)?.data) ? (departmentsData as any).data : []);
      } else if (targetModule === 'attendance') {
        const needEmployees = portalMode === 'admin' && employeesRef.current.length === 0;
        const [attendanceData, employeesData] = await Promise.all([
          api.getAttendance().catch(() => []),
          needEmployees ? api.getEmployees().catch(() => []) : Promise.resolve(employeesRef.current),
        ]);
        if (needEmployees && Array.isArray(employeesData) && employeesData.length > 0) {
          const scopedEmps = scopeEmployees(employeesData);
          setEmployees(scopedEmps);
          setLiveEmployees(scopedEmps);
        }
        const activeEmps = employeesRef.current.length > 0 ? employeesRef.current : (Array.isArray(employeesData) ? scopeEmployees(employeesData) : []);
        const scopedAtt = scopeAttendance(attendanceData, activeEmps);
        setAttendance((current) => {
          const updated = keepNewerPunch(scopedAtt, current);
          setLiveAttendanceRecords(updated);
          return updated;
        });
      } else if (targetModule === 'leaves') {
        const needEmployees = employeesRef.current.length === 0;
        const [leavesData, employeesData, leaveTypesData] = await Promise.all([
          api.getLeaves().catch(() => []),
          needEmployees ? api.getEmployees().catch(() => []) : Promise.resolve(employeesRef.current),
          api.listLeaveTypes(activeCompanyId ? { companyId: activeCompanyId } : undefined).catch(() => []),
        ]);
        const scopedEmps = needEmployees && Array.isArray(employeesData) ? scopeEmployees(employeesData) : employeesRef.current;
        if (needEmployees) {
          setEmployees(scopedEmps);
          setLiveEmployees(scopedEmps);
        }
        const scopedLvs = scopeLeaves(leavesData, scopedEmps);
        setLeaves(scopedLvs);
        setLiveLeaves(scopedLvs);
        setLeaveTypes(Array.isArray(leaveTypesData) ? leaveTypesData : []);
      } else if (targetModule === 'payroll' || targetModule === 'payslips') {
        const needEmployees = employeesRef.current.length === 0;
        const [payrollData, employeesData] = await Promise.all([
          api.getPayroll().catch(() => []),
          needEmployees ? api.getEmployees().catch(() => []) : Promise.resolve(employeesRef.current),
        ]);
        const scopedEmps = needEmployees && Array.isArray(employeesData) ? scopeEmployees(employeesData) : employeesRef.current;
        if (needEmployees) {
          setEmployees(scopedEmps);
          setLiveEmployees(scopedEmps);
        }
        const scopedEmpIds = new Set(scopedEmps.map((e) => e.id));
        const rawPayroll = Array.isArray(payrollData) ? payrollData : Array.isArray((payrollData as any)?.data) ? (payrollData as any).data : [];
        const scopedPayroll = rawPayroll.filter(
          (p: any) => scopedEmpIds.has(p.employeeId) || ((p as any).companyId && (p as any).companyId === activeCompanyId)
        );
        setPayroll(scopedPayroll);
      } else if (targetModule === 'recruitment') {
        const [jobsData, candidatesData, departmentsData] = await Promise.all([
          api.getJobs().catch(() => []),
          api.getCandidates().catch(() => []),
          api.getDepartments().catch(() => []),
        ]);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : Array.isArray((departmentsData as any)?.data) ? (departmentsData as any).data : []);
      } else if (targetModule === 'organization') {
        const [departmentsData, employeesData] = await Promise.all([
          api.getDepartments().catch(() => []),
          api.getEmployees().catch(() => []),
        ]);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : Array.isArray((departmentsData as any)?.data) ? (departmentsData as any).data : []);
      } else if (targetModule === 'calendar') {
        if (portalMode !== 'admin') {
          const leavesData = await api.getLeaves().catch(() => []);
          const ownLeaves = Array.isArray(leavesData) ? leavesData : [];
          setLeaves(ownLeaves);
          setLiveLeaves(ownLeaves);
        } else {
        const needEmployees = employeesRef.current.length === 0;
        const [attendanceData, leavesData, employeesData] = await Promise.all([
          api.getAttendance().catch(() => []),
          api.getLeaves().catch(() => []),
          needEmployees ? api.getEmployees().catch(() => []) : Promise.resolve(employeesRef.current),
        ]);
        if (needEmployees && Array.isArray(employeesData) && employeesData.length > 0) {
          const scopedEmps = scopeEmployees(employeesData);
          setEmployees(scopedEmps);
          setLiveEmployees(scopedEmps);
        }
        const activeEmps = employeesRef.current.length > 0 ? employeesRef.current : (Array.isArray(employeesData) ? scopeEmployees(employeesData) : []);
        const scopedAtt = scopeAttendance(attendanceData, activeEmps);
        setAttendance(scopedAtt);
        setLiveAttendanceRecords(scopedAtt);
        const scopedLvs = scopeLeaves(leavesData, activeEmps);
        setLeaves(scopedLvs);
        setLiveLeaves(scopedLvs);
        }
      } else if (targetModule === 'chat' || targetModule === 'announcements') {
        const role = String(user?.role || '').toUpperCase();
        const canListUsers = ['ADMIN', 'HR', 'MANAGER', 'SUPER_ADMIN', 'HR_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(role);
        if (!canListUsers) return;
        const employeesData = await api.getEmployees().catch(() => []);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
      }
      // Note: training, performance, documents, assets, resignations, audit-logs, settings
      // self-fetch their own module data on mount, so no redundant shell fetch is required.
    } catch (err) {
      console.warn(`Could not load data for module ${targetModule}:`, err);
    } finally {
      isFetchingDataRef.current[targetModule] = false;
      setModuleLoading((prev) => ({ ...prev, [targetModule]: false }));
      if (pendingReloadRef.current[targetModule]) {
        pendingReloadRef.current[targetModule] = false;
        void loadDataForModule(targetModule);
      }
    }
  }, [activeCompanyId, activeCompanyCode, portalMode, user?.role, scopeEmployees, scopeLeaves, scopeAttendance]);

  // Refresh handler passed down to modules
  const loadData = useCallback(() => {
    return loadDataForModule(activeModule);
  }, [loadDataForModule, activeModule]);

  const loadDataForModuleRef = useRef(loadDataForModule);
  loadDataForModuleRef.current = loadDataForModule;
  const activeModuleRef = useRef(activeModule);
  activeModuleRef.current = activeModule;

  useEffect(() => {
    const reloadLiveAttendance = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const row = liveAttendanceRow(detail);
      if (row?.employeeId && row.date) {
        setAttendance((current) => {
          const updated = mergeLiveAttendance(current, row);
          setLiveAttendanceRecords(updated);
          return updated;
        });
      }
      const moduleName = activeModuleRef.current;
      if (moduleName === 'dashboard' || moduleName === 'attendance') {
        void loadDataForModuleRef.current(moduleName);
      }
    };
    window.addEventListener('hrms_attendance_live', reloadLiveAttendance);
    return () => window.removeEventListener('hrms_attendance_live', reloadLiveAttendance);
  }, []);

  useEffect(() => {
    const refreshEmployees = () => {
      loadDataForModuleRef.current(activeModule);
    };
    window.addEventListener('hrms_employees_updated', refreshEmployees);
    return () => window.removeEventListener('hrms_employees_updated', refreshEmployees);
  }, [activeModule]);

  // Page-wise data loading: runs ONLY when activeModule changes or on user authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    loadDataForModuleRef.current(activeModule);

    // Lightweight 60s background refresh ONLY for the currently active module
    const pollTimer = setInterval(() => {
      loadDataForModuleRef.current(activeModule);
    }, 60000);

    return () => clearInterval(pollTimer);
  }, [isAuthenticated, activeModule]);

  // Real-time leave synchronization: strictly refreshes leaves only
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRefreshEvent = async (event?: any) => {
      try {
        const payload = event?.detail;
        if (payload && payload.id) {
          if (payload.status === 'Pending') {
            setLeaves((prev) => {
              if (prev.some((item) => item.id === payload.id)) return prev;
              const newLeave: LeaveRequest = {
                id: payload.id,
                employeeId: payload.employeeId || payload.userId || '',
                employeeName: payload.employeeName || 'Staff Member',
                departmentName: payload.departmentName || '',
                leaveType: payload.leaveType || 'Casual Leave',
                startDate: payload.startDate || new Date().toISOString().split('T')[0],
                endDate: payload.endDate || new Date().toISOString().split('T')[0],
                daysCount: payload.daysCount || 1,
                isHalfDay: Boolean(payload.isHalfDay),
                reason: payload.reason || '',
                status: 'Pending',
                appliedDate: payload.appliedDate || payload.appliedOn || new Date().toISOString().split('T')[0],
              };
              return [newLeave, ...prev];
            });
          } else if (payload.status === 'Approved' || payload.status === 'Rejected') {
            setLeaves((prev) =>
              prev.map((item) => (item.id === payload.id ? { ...item, status: payload.status } : item))
            );
          }
        }

        const freshLeaves = await api.getLeaves();
        if (Array.isArray(freshLeaves)) {
          const scoped = scopeLeaves(freshLeaves, employeesRef.current);
          setLeaves(scoped);
          setLiveLeaves(scoped);
        }
      } catch (err) {
        console.warn('Direct leaves fetch error:', err);
      }
    };

    const handleLeaveTypesUpdate = () => {
      api.listLeaveTypes().then((types) => {
        if (Array.isArray(types)) setLeaveTypes(types);
      }).catch(() => {});
    };

    window.addEventListener('hrms_leaves_updated', handleRefreshEvent);
    window.addEventListener('hrms_leave_types_updated', handleLeaveTypesUpdate);

    return () => {
      window.removeEventListener('hrms_leaves_updated', handleRefreshEvent);
      window.removeEventListener('hrms_leave_types_updated', handleLeaveTypesUpdate);
    };
  }, [isAuthenticated, scopeLeaves]);

  // Clean Path-Based Navigation (no full-page reloads, clean history updates)
  const navigateToModule = (mod: string, tab?: string) => {
    const targetModule = isModuleAllowedForUser(mod, user) ? mod : 'dashboard';
    const targetTab = targetModule === mod ? tab || '' : '';
    const route = getRouteForModule(targetModule, targetTab);
    setActiveModule(targetModule);
    setSubTab(targetTab);

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ module: targetModule, subTab: targetTab }, '', route);
      } catch (_) { }
    }
  };

  const myProfileEmployee = React.useMemo<Employee | null>(() => {
    if (!user) return null;
    const myEmp = employees.find(
      (e) =>
        (user?.employeeId && (e.id === user.employeeId || (e as any)._id === user.employeeId)) ||
        (user?.id && (e.id === user.id || (e as any)._id === user.id)) ||
        ((user as any)?.employeeCode && e.employeeCode === (user as any).employeeCode) ||
        (user?.email && e.email?.toLowerCase() === user.email.toLowerCase())
    );
    if (myEmp) return myEmp;

    return {
      id: user.employeeId || user.id || '',
      employeeCode: (user as any)?.employeeCode || '',
      companyId: user.companyId || '',
      companyName: user.companyName || currentCompany?.name || '',
      role: user.role,
      firstName: user.firstName || 'Employee',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: (user as any)?.phone || '',
      avatarUrl: user.avatarUrl || '',
      gender: (user as any)?.gender || '',
      dateOfBirth: (user as any)?.dateOfBirth || '',
      address: (user as any)?.address || '',
      emergencyContact: (user as any)?.emergencyContact || { name: '', relationship: '', phone: '' },
      joiningDate: (user as any)?.joiningDate || '',
      employmentType: (user as any)?.employmentType || '',
      status: (user as any)?.status || 'Active',
      departmentId: (user as any)?.departmentId || '',
      departmentName: (user as any)?.departmentName || '',
      designationId: (user as any)?.designationId || '',
      designationTitle: (user as any)?.designationTitle || '',
      reportingManagerId: '',
      reportingManagerName: '',
      workLocationId: '',
      workLocationName: '',
      shift: '',
      bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: '' },
      taxInformation: { taxId: '', panOrSsn: '', taxRegime: '' },
      education: [],
      previousExperience: [],
      skills: [],
      salary: { basic: 0, hra: 0, allowances: 0, bonus: 0, pf: 0, tax: 0, professionalTax: 0, gross: 0, net: 0 },
      createdAt: '',
      updatedAt: '',
    };
  }, [employees, user, currentCompany]);

  const handleOpenMyProfile = () => {
    navigateToModule('profile');
  };

  // Redirect to login if user is not authenticated (performed inside useEffect to avoid updating Router during render)
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#e9ecef] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        {!mounted || isLoading ? (
          <img src="/brand-name.png" alt="myown hrms" className="h-5 w-auto object-contain" />
        ) : (
          <span className="text-xs font-semibold text-slate-700">Redirecting to login...</span>
        )}
      </div>
    );
  }

  return (
    <div className="hrms-app-shell h-screen w-full bg-[#e9ecef] text-[#212529] flex font-sans antialiased overflow-hidden relative">

      {/* Left Sidebar */}
      <Sidebar
        activeModule={activeModule}
        activeSubTab={subTab}
        setActiveModule={navigateToModule}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onSelectSubTab={setSubTab}
        portalMode={portalMode}
        pendingLeavesCount={pendingLeavesCount}
        unreadChatCount={unreadChatCount}
        company={currentCompany}
        employees={employees}
        onOpenProfile={handleOpenMyProfile}
      />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenClockModal={() => setClockModalOpen(true)}
          onOpenLeaveModal={() => setLeaveModalOpen(true)}
          onOpenAddEmployeeModal={() => setAddEmployeeModalOpen(true)}
          onOpenMobileModal={() => setMobileModalOpen(true)}
          onOpenProfile={handleOpenMyProfile}
          onNavigateSettings={() => navigateToModule('settings')}
          onOpenChat={() => navigateToModule('chat')}
          onOpenSearchModal={() => setSearchModalOpen(true)}
          onNavigateModule={navigateToModule}
          onSelectEmployee={setSelectedEmployee}
          employees={employees}
          portalMode={portalMode}
          activeModule={activeModule}
          activeSubTab={subTab}
          isAddEmployeeModalOpen={addEmployeeModalOpen}
          isLeaveModalOpen={leaveModalOpen}
          pendingLeavesCount={pendingLeavesCount}
          unreadChatCount={unreadChatCount}
          company={currentCompany}
          isScrolled={isScrolled}
          pageTitle={scrolledPageTitle}
          onScrollToTop={handleScrollToTop}
        />

        <main
          ref={mainScrollRef}
          className={`flex-1 w-full [scrollbar-width:thin] bg-transparent relative z-10 ${activeModule === 'chat' || activeModule === 'announcements'
            ? 'overflow-hidden flex flex-col px-4 sm:px-6 py-4 pb-20 sm:pb-5'
            : 'overflow-y-auto px-4 sm:px-6 py-5 pb-24 sm:pb-8'
            }`}
        >
          {['EMPLOYEE', 'HR', 'MANAGER'].includes(String(user?.role || '').toUpperCase()) && !user?.avatarUrl && (
            <div className="max-w-7xl mx-auto w-full mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-amber-950">Upload a profile photo with your face. Attendance stays closed until it is saved.</p>
              <button
                type="button"
                onClick={() => navigateToModule('settings')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                Upload photo
              </button>
            </div>
          )}
          <div
            key={`${activeModule}-${subTab || 'root'}`}
            className={`max-w-7xl mx-auto w-full animate-module-fade-in ${activeModule === 'chat' || activeModule === 'announcements' ? 'flex-1 min-h-0 flex flex-col' : ''
              }`}
          >
            {(activeModule === 'dashboard' || !isModuleAllowedForUser(activeModule, user)) && (
              <DashboardView
                loading={dashboardLoading}
                stats={stats}
                employees={employees}
                leaves={leaves}
                leaveTypes={leaveTypes}
                attendance={attendance}
                notices={dashboardNotices}
                onNavigateModule={navigateToModule}
                onOpenClockModal={() => setClockModalOpen(true)}
                onOpenLeaveModal={() => setLeaveModalOpen(true)}
                onOpenAddEmployeeModal={() => setAddEmployeeModalOpen(true)}
                onSelectEmployee={setSelectedEmployee}
                onRefreshData={loadData}
                onOpenChatWithEmployee={(empId) => {
                  setTargetChatEmployeeId(empId);
                  navigateToModule('chat');
                }}
                portalMode={portalMode}
              />
            )}

            {activeModule === 'calendar' && (
              <CalendarModule
                attendance={attendance}
                leaves={leaves}
                onOpenLeaveModal={() => setLeaveModalOpen(true)}
                onOpenClockModal={() => setClockModalOpen(true)}
                portalMode={portalMode}
              />
            )}

            {activeModule === 'employees' && (
              <EmployeesModule
                employees={employees}
                departments={departments}
                onSelectEmployee={setSelectedEmployee}
                onOpenAddModal={() => setAddEmployeeModalOpen(true)}
                onRefresh={loadData}
                onOpenChatWithEmployee={(empId) => {
                  setTargetChatEmployeeId(empId);
                  navigateToModule('chat');
                }}
                portalMode={portalMode}
                loading={Boolean(moduleLoading['employees'] || employees.length === 0)}
              />
            )}

            {activeModule === 'attendance' && (
              <AttendanceModule
                records={attendance}
                employees={employees}
                initialTab={
                  portalMode === 'admin'
                    ? 'today'
                    : subTab === 'summary' || subTab === 'roster' || subTab === 'holidays'
                      ? (subTab as any)
                      : 'today'
                }
                onOpenPunchModal={() => setClockModalOpen(true)}
                onRefresh={loadData}
                portalMode={portalMode}
                loading={Boolean(moduleLoading['attendance'] || (portalMode === 'admin' && employees.length === 0))}
              />
            )}

            {activeModule === 'leaves' && (
              <LeaveModule
                leaves={leaves}
                leaveTypes={leaveTypes}
                onOpenApplyModal={() => setLeaveModalOpen(true)}
                onRefresh={loadData}
                portalMode={portalMode}
                loading={Boolean(moduleLoading['leaves'] || (leaves.length === 0 && moduleLoading['leaves'] !== false))}
              />
            )}

            {(activeModule === 'payroll' || activeModule === 'payslips') && (
              portalMode === 'employee' ? (
                <EmployeePayslipsModule employees={employees} onRefresh={loadData} />
              ) : (
                <PayrollModule
                  payrollRecords={payroll}
                  onRefresh={loadData}
                  loading={Boolean(moduleLoading['payroll'] || moduleLoading['payslips'])}
                />
              )
            )}

            {activeModule === 'recruitment' && (
              <RecruitmentModule
                jobs={jobs}
                candidates={candidates}
                departments={departments}
                onRefresh={loadData}
                onImportCandidates={(newCands) => {
                  setCandidates((prev) => [...prev, ...newCands]);
                }}
              />
            )}

            {activeModule === 'performance' && (
              <PerformanceModule
                reviews={[]}
                onRefresh={loadData}
              />
            )}

            {activeModule === 'organization' && (
              <OrganizationModule
                departments={departments}
                designations={designations}
                locations={locations}
                initialTab={(subTab as any) === 'teams' ? 'teams' : (subTab as any) === 'about' ? 'about' : 'departments'}
                onRefresh={loadData}
                portalMode={portalMode}
                employees={employees}
                company={currentCompany}
              />
            )}

            {activeModule === 'tasks' && (
              <TasksModule
                employees={employees}
                departments={departments}
                portalMode={portalMode}
                onRefresh={loadData}
              />
            )}

            {activeModule === 'training' && (
              <TrainingModule
                programs={[]}
                onRefresh={loadData}
              />
            )}

            {activeModule === 'documents' && (
              <DocumentsModule
                portalMode={portalMode}
                currentEmployeeId={user?.employeeId || user?.id}
              />
            )}

            {activeModule === 'assets' && <AssetsModule />}
            {activeModule === 'resignations' && <ResignationsModule portalMode={portalMode} />}
            {activeModule === 'announcements' && (
              <AnnouncementsModule employees={employees} portalMode={portalMode} />
            )}
            {activeModule === 'chat' && (
              <ChatModule
                employees={employees}
                initialEmployeeId={targetChatEmployeeId}
                onClearInitialEmployee={() => setTargetChatEmployeeId(null)}
                portalMode={portalMode}
              />
            )}
            {activeModule === 'reports' && (
              <ReportsModule
                company={currentCompany}
                employees={employees}
                departments={departments}
                attendance={attendance}
                payroll={payroll}
                leaves={leaves}
                stats={stats}
              />
            )}
            {activeModule === 'audit-logs' && <AuditLogsModule />}
            {activeModule === 'profile' && (
              <div className="space-y-5 w-full">
                <EmployeeProfileModal
                  variant="page"
                  employee={myProfileEmployee}
                  isOpen={true}
                  onRefresh={loadData}
                />
              </div>
            )}
            {activeModule === 'settings' && <SettingsModule portalMode={portalMode} />}
          </div>
        </main>

        <MobileBottomNav
          activeModule={activeModule}
          setActiveModule={navigateToModule}
          onOpenClockModal={() => setClockModalOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          portalMode={portalMode}
          pendingLeavesCount={pendingLeavesCount}
          unreadChatCount={unreadChatCount}
          punchStatus={checkEmployeePunchEligibility(user?.employeeId || user?.id || '')?.status}
        />
      </div>

      {clockModalOpen && (
        <AttendanceModal
          isOpen={clockModalOpen}
          onClose={() => setClockModalOpen(false)}
          onRefresh={loadData}
        />
      )}
      <BankDetailForm />

      {leaveModalOpen && (
        <LeaveModal
          isOpen={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          onRefresh={loadData}
          availableLeaveTypes={leaveTypes}
        />
      )}

      {addEmployeeModalOpen && (
        <EmployeeDrawer
          isOpen={addEmployeeModalOpen}
          onClose={() => setAddEmployeeModalOpen(false)}
          onRefresh={loadData}
          departments={departments}
          designations={designations}
          employees={employees}
        />
      )}

      {Boolean(selectedEmployee) && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          onRefresh={loadData}
        />
      )}

      {searchModalOpen && (
        <GlobalSearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          employees={employees}
          onSelectEmployee={setSelectedEmployee}
          onNavigateModule={navigateToModule}
          portalMode={portalMode}
        />
      )}

      {mobileModalOpen && (
        <MobileConnectModal
          isOpen={mobileModalOpen}
          onClose={() => setMobileModalOpen(false)}
        />
      )}
    </div>
  );
}

