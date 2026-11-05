'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { DashboardView } from '../DashboardView';
import dynamic from 'next/dynamic';

const ModuleLoadingSkeleton = () => (
  <div className="w-full min-h-[350px] flex items-center justify-center p-8 text-slate-400">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Loading module...</span>
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
const TrainingModule = dynamic(() => import('../modules/TrainingModule').then((m) => m.TrainingModule), { loading: () => <ModuleLoadingSkeleton /> });
const DocumentsModule = dynamic(() => import('../modules/DocumentsModule').then((m) => m.DocumentsModule), { loading: () => <ModuleLoadingSkeleton /> });
const AssetsModule = dynamic(() => import('../modules/AssetsModule').then((m) => m.AssetsModule), { loading: () => <ModuleLoadingSkeleton /> });
const ResignationsModule = dynamic(() => import('../modules/ResignationsModule').then((m) => m.ResignationsModule), { loading: () => <ModuleLoadingSkeleton /> });
const AnnouncementsModule = dynamic(() => import('../modules/AnnouncementsModule').then((m) => m.AnnouncementsModule), { loading: () => <ModuleLoadingSkeleton /> });
const ChatModule = dynamic(() => import('../modules/ChatModule').then((m) => m.ChatModule), { loading: () => <ModuleLoadingSkeleton /> });
const ReportsModule = dynamic(() => import('../modules/ReportsModule').then((m) => m.ReportsModule), { loading: () => <ModuleLoadingSkeleton /> });
const AuditLogsModule = dynamic(() => import('../modules/AuditLogsModule').then((m) => m.AuditLogsModule), { loading: () => <ModuleLoadingSkeleton /> });
const SettingsModule = dynamic(() => import('../modules/SettingsModule').then((m) => m.SettingsModule), { loading: () => <ModuleLoadingSkeleton /> });
import { getTotalUnreadChatCount, ADMIN_USER_ID } from '../../lib/chatService';

const AttendanceModal = dynamic(() => import('../modals/AttendanceModal').then((m) => m.AttendanceModal), { ssr: false });
const LeaveModal = dynamic(() => import('../modals/LeaveModal').then((m) => m.LeaveModal), { ssr: false });
const EmployeeDrawer = dynamic(() => import('../modals/EmployeeDrawer').then((m) => m.EmployeeDrawer), { ssr: false });
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

export function HrmsAppShell({ initialModule, initialSubTab }: HrmsAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, portalMode, setPortalMode } = useAuth();

  const [activeModule, setActiveModule] = useState<string>(() => {
    if (initialModule) return initialModule;
    if (typeof window !== 'undefined') {
      const parsed = parseRoutePath(window.location.pathname);
      if (parsed.isValid) return parsed.module;
    }
    return 'dashboard';
  });

  const [subTab, setSubTab] = useState<string>(() => {
    if (initialSubTab) return initialSubTab;
    if (typeof window !== 'undefined') {
      const parsed = parseRoutePath(window.location.pathname);
      return parsed.subTab || '';
    }
    return '';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        setActiveModule(parsed.module);
        setSubTab(parsed.subTab || '');
      }
    }
  }, [pathname, searchParams, router]);

  // Browser Back and Forward navigation handling
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoutePath(window.location.pathname);
      if (parsed.isValid) {
        setActiveModule(parsed.module);
        setSubTab(parsed.subTab || '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Enforce live database data: purge all stale cached business records
    purgeLocalBusinessData();
  }, [isAuthenticated]);

  // Data state
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
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
    const isAdmin = isUserAdminRole(user?.role);
    if (!isAdmin && portalMode === 'admin') {
      setPortalMode('employee');
      return;
    }

    if (portalMode === 'employee') {
      const allowedInEmployee = [
        'dashboard',
        'calendar',
        'attendance',
        'leaves',
        'payslips',
        'resignations',
        'organization',
        'documents',
        'announcements',
        'chat',
        'settings',
        'profile',
      ];
      if (!allowedInEmployee.includes(activeModule)) {
        navigateToModule('dashboard');
      }
    }
  }, [portalMode, activeModule, user?.role, setPortalMode]);

  // Chat unread count synchronization
  useEffect(() => {
    if (isAuthenticated) {
      const currentUserId = portalMode === 'admin' ? ADMIN_USER_ID : user?.employeeId || user?.id || '';
      const updateChatUnread = () => {
        setUnreadChatCount(getTotalUnreadChatCount(currentUserId));
      };
      updateChatUnread();
      window.addEventListener('hrms_chat_updated', updateChatUnread);
      return () => {
        window.removeEventListener('hrms_chat_updated', updateChatUnread);
      };
    }
  }, [isAuthenticated, portalMode, user]);

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
    const scopedEmpIds = new Set(scopedEmps.map((e) => e.id));
    return (Array.isArray(rawLeaves) ? rawLeaves : [])
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

    const workStatusRecords = extractRecordsFromWorkStatus(workStatusData, scopedEmps);
    const combined = [...(Array.isArray(rawAtt) ? rawAtt : []), ...workStatusRecords];
    return combined.filter((a) => {
      if (!a) return false;
      const cleanEmpId = (a.employeeId || '').replace(/^(emp-|user-)/, '');
      const cleanUserId = ((a as any).userId || '').replace(/^(emp-|user-)/, '');
      if (scopedEmpIds.has(a.employeeId) || (cleanEmpId && scopedEmpIds.has(cleanEmpId))) return true;
      if (cleanUserId && scopedEmpIds.has(cleanUserId)) return true;
      if ((a as any).companyId && (a as any).companyId === activeCompanyId) return true;
      if (workStatusRecords.some((wr) => wr.id === a.id)) return true;
      return false;
    });
  }, [activeCompanyId]);

  // Company Brand Data - fetched once on authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    api.getMyCompany()
      .then((c) => {
        if (isMounted && c) setCurrentCompany(c);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Page-Wise Data Loader: strictly calls ONLY the APIs needed by that module
  const loadDataForModule = useCallback(async (targetModule: string) => {
    if (isFetchingDataRef.current[targetModule]) return;
    isFetchingDataRef.current[targetModule] = true;

    try {
      if (targetModule === 'dashboard') {
        const [statsData, employeesData, leavesData, attendanceData, workStatusData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getEmployees().catch(() => []),
          api.getLeaves().catch(() => []),
          api.getAttendance().catch(() => []),
          portalMode !== 'admin' ? api.getWorkStatus().catch(() => null) : Promise.resolve(null),
        ]);

        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);

        const scopedLvs = scopeLeaves(leavesData, scopedEmps);
        setLeaves(scopedLvs);
        setLiveLeaves(scopedLvs);

        const scopedAtt = scopeAttendance(attendanceData, scopedEmps, workStatusData);
        setAttendance(scopedAtt);
        setLiveAttendanceRecords(scopedAtt);

        const anyStats = statsData as any;
        if (anyStats) {
          setStats({
            ...anyStats,
            totalEmployees: scopedEmps.length,
            activeEmployees: scopedEmps.filter((e) => e.status === 'Active').length,
            attendanceRate: scopedEmps.length > 0 ? (anyStats?.attendanceRate || 0) : 0,
            totalHours: scopedEmps.length > 0 ? (anyStats?.totalHours || 0) : 0,
          });
        }
      } else if (targetModule === 'employees') {
        const [employeesData, departmentsData] = await Promise.all([
          api.getEmployees().catch(() => []),
          api.getDepartments().catch(() => []),
        ]);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
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
        setAttendance(scopedAtt);
        setLiveAttendanceRecords(scopedAtt);
      } else if (targetModule === 'leaves') {
        const [leavesData, employeesData] = await Promise.all([
          api.getLeaves().catch(() => []),
          api.getEmployees().catch(() => []),
        ]);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
        const scopedLvs = scopeLeaves(leavesData, scopedEmps);
        setLeaves(scopedLvs);
        setLiveLeaves(scopedLvs);
      } else if (targetModule === 'payroll' || targetModule === 'payslips') {
        const [payrollData, employeesData] = await Promise.all([
          api.getPayroll().catch(() => []),
          api.getEmployees().catch(() => []),
        ]);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
        const scopedEmpIds = new Set(scopedEmps.map((e) => e.id));
        const rawPayroll = Array.isArray(payrollData) ? payrollData : [];
        const scopedPayroll = rawPayroll.filter(
          (p) => scopedEmpIds.has(p.employeeId) || ((p as any).companyId && (p as any).companyId === activeCompanyId)
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
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      } else if (targetModule === 'organization') {
        const [departmentsData, designationsData, employeesData] = await Promise.all([
          api.getDepartments().catch(() => []),
          api.getDesignations().catch(() => []),
          api.getEmployees().catch(() => []),
        ]);
        const scopedEmps = scopeEmployees(employeesData);
        setEmployees(scopedEmps);
        setLiveEmployees(scopedEmps);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        setDesignations(Array.isArray(designationsData) ? designationsData : []);
      } else if (targetModule === 'calendar') {
        const [attendanceData, leavesData] = await Promise.all([
          api.getAttendance().catch(() => []),
          api.getLeaves().catch(() => []),
        ]);
        const scopedAtt = scopeAttendance(attendanceData, employeesRef.current);
        setAttendance(scopedAtt);
        const scopedLvs = scopeLeaves(leavesData, employeesRef.current);
        setLeaves(scopedLvs);
      } else if (targetModule === 'chat' || targetModule === 'announcements') {
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
    }
  }, [activeCompanyId, activeCompanyCode, portalMode, scopeEmployees, scopeLeaves, scopeAttendance]);

  // Refresh handler passed down to modules
  const loadData = useCallback(() => {
    return loadDataForModule(activeModule);
  }, [loadDataForModule, activeModule]);

  const loadDataForModuleRef = useRef(loadDataForModule);
  loadDataForModuleRef.current = loadDataForModule;

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

    window.addEventListener('hrms_leaves_updated', handleRefreshEvent);

    return () => {
      window.removeEventListener('hrms_leaves_updated', handleRefreshEvent);
    };
  }, [isAuthenticated, scopeLeaves]);

  // Clean Path-Based Navigation (no full-page reloads, clean history updates)
  const navigateToModule = (mod: string, tab?: string) => {
    const route = getRouteForModule(mod, tab);
    setActiveModule(mod);
    setSubTab(tab || '');

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ module: mod, subTab: tab }, '', route);
      } catch (_) { }
    }
  };

  const handleOpenMyProfile = () => {
    const myEmp = employees.find((e) =>
      (user?.employeeId && (e.id === user.employeeId || (e as any)._id === user.employeeId)) ||
      (user?.id && (e.id === user.id || (e as any)._id === user.id)) ||
      ((user as any)?.employeeCode && e.employeeCode === (user as any).employeeCode) ||
      (user?.email && e.email?.toLowerCase() === user.email.toLowerCase())
    );
    if (myEmp) {
      setSelectedEmployee(myEmp);
    } else if (user) {
      setSelectedEmployee({
        id: user.employeeId || user.id || 'emp-self',
        employeeCode: (user as any)?.employeeCode || 'EMP-SELF',
        firstName: user.firstName || 'Employee',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
        avatarUrl: user.avatarUrl || '',
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
      });
    }
  };

  // Open profile modal if visiting /profile
  useEffect(() => {
    if (activeModule === 'profile') {
      handleOpenMyProfile();
    }
  }, [activeModule]);

  // Redirect to login if user is not authenticated (performed inside useEffect to avoid updating Router during render)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#b7e4c7] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-700">
          {isLoading ? 'Loading Paneliya HRMS...' : 'Redirecting to login...'}
        </span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#b7e4c7] text-[#0d271d] flex font-sans antialiased overflow-hidden relative">

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
          pendingLeavesCount={pendingLeavesCount}
          unreadChatCount={unreadChatCount}
          company={currentCompany}
        />

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-8 w-full [scrollbar-width:thin] bg-transparent relative z-10">
          <div key={activeModule} className="max-w-[1700px] mx-auto animate-module-fade-in">
            {activeModule === 'dashboard' && (
              <DashboardView
                stats={stats}
                employees={employees}
                leaves={leaves}
                attendance={attendance}
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
              />
            )}

            {activeModule === 'leaves' && (
              <LeaveModule
                leaves={leaves}
                onOpenApplyModal={() => setLeaveModalOpen(true)}
                onRefresh={loadData}
                portalMode={portalMode}
              />
            )}

            {(activeModule === 'payroll' || activeModule === 'payslips') && (
              portalMode === 'employee' ? (
                <EmployeePayslipsModule employees={employees} onRefresh={loadData} />
              ) : (
                <PayrollModule
                  payrollRecords={payroll}
                  onRefresh={loadData}
                />
              )
            )}

            {activeModule === 'recruitment' && (
              <RecruitmentModule
                jobs={jobs}
                candidates={candidates}
                departments={departments}
                onRefresh={loadData}
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
                initialTab={(subTab as any) === 'designations' ? 'designations' : 'departments'}
                onRefresh={loadData}
                portalMode={portalMode}
                employees={employees}
                company={currentCompany}
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

      {leaveModalOpen && (
        <LeaveModal
          isOpen={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          onRefresh={loadData}
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

