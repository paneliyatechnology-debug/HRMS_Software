'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { DashboardView } from '../DashboardView';
import { CalendarModule } from '../modules/CalendarModule';
import { EmployeesModule } from '../modules/EmployeesModule';
import { AttendanceModule } from '../modules/AttendanceModule';
import { LeaveModule } from '../modules/LeaveModule';
import { PayrollModule } from '../modules/PayrollModule';
import { EmployeePayslipsModule } from '../modules/EmployeePayslipsModule';
import { RecruitmentModule } from '../modules/RecruitmentModule';
import { PerformanceModule } from '../modules/PerformanceModule';
import { OrganizationModule } from '../modules/OrganizationModule';
import { TrainingModule } from '../modules/TrainingModule';
import { DocumentsModule } from '../modules/DocumentsModule';
import { AssetsModule } from '../modules/AssetsModule';
import { ResignationsModule } from '../modules/ResignationsModule';
import { AnnouncementsModule } from '../modules/AnnouncementsModule';
import { ChatModule } from '../modules/ChatModule';
import { ReportsModule } from '../modules/ReportsModule';
import { AuditLogsModule } from '../modules/AuditLogsModule';
import { SettingsModule } from '../modules/SettingsModule';
import { getTotalUnreadChatCount, ADMIN_USER_ID } from '../../lib/chatService';

import { AttendanceModal } from '../modals/AttendanceModal';
import { LeaveModal } from '../modals/LeaveModal';
import { EmployeeDrawer } from '../modals/EmployeeDrawer';
import { EmployeeProfileModal } from '../modals/EmployeeProfileModal';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { MobileConnectModal } from '../modals/MobileConnectModal';
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
        if (parsed.subTab) {
          setSubTab(parsed.subTab);
        }
      }
    }
  }, [pathname, searchParams, router]);

  // Browser Back and Forward navigation handling
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoutePath(window.location.pathname);
      if (parsed.isValid) {
        setActiveModule(parsed.module);
        if (parsed.subTab) {
          setSubTab(parsed.subTab);
        }
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

  const loadData = useCallback(async () => {
    try {
      const [
        statsData,
        employeesData,
        departmentsData,
        designationsData,
        leavesData,
        attendanceData,
        payrollData,
        jobsData,
        candidatesData,
        assetsData,
        myCompanyData,
        workStatusData,
      ] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getEmployees().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getDesignations().catch(() => []),
        api.getLeaves().catch(() => []),
        api.getAttendance().catch(() => []),
        api.getPayroll().catch(() => []),
        api.getJobs().catch(() => []),
        api.getCandidates().catch(() => []),
        api.getAssets().catch(() => []),
        api.getMyCompany().catch(() => null),
        portalMode !== 'admin' ? api.getWorkStatus().catch(() => null) : Promise.resolve(null),
      ]);

      if (myCompanyData) {
        setCurrentCompany(myCompanyData);
      }

      const seenEmpIds = new Set<string>();
      const safeEmployees = Array.isArray(employeesData)
        ? employeesData.filter((emp) => {
          if (!emp || !emp.id || seenEmpIds.has(emp.id)) return false;
          seenEmpIds.add(emp.id);
          return true;
        })
        : [];

      // Multi-Tenant Isolation: Scope data to the logged-in company
      const activeCompanyId = user?.companyId || myCompanyData?.id || '';

      let scopedEmployees: Employee[] = [];
      if (!activeCompanyId) {
        scopedEmployees = safeEmployees;
      } else if (activeCompanyId === 'comp-paneliya' || activeCompanyId === 'cmp-1') {
        scopedEmployees = safeEmployees.filter(
          (e) => !e.companyId || e.companyId === 'comp-paneliya' || e.companyId === 'cmp-1'
        );
      } else {
        scopedEmployees = safeEmployees.filter(
          (e) =>
            !e.companyId ||
            e.companyId === activeCompanyId ||
            (e as any).companyCode === activeCompanyId ||
            (user?.companyCode && (e as any).companyCode === user.companyCode) ||
            (myCompanyData?.code && (e as any).companyCode === myCompanyData.code)
        );
        if (scopedEmployees.length === 0 && safeEmployees.length > 0) {
          scopedEmployees = safeEmployees;
        }
      }
      setEmployees(scopedEmployees);
      setLiveEmployees(scopedEmployees);

      // Scope Leaves to this company only
      const scopedEmpIds = new Set(scopedEmployees.map((e) => e.id));
      const rawLeaves = Array.isArray(leavesData) ? leavesData : [];
      const scopedLeaves = rawLeaves.filter(
        (l) => scopedEmpIds.has(l.employeeId) || ((l as any).companyId && (l as any).companyId === activeCompanyId)
      );
      setLeaves(scopedLeaves);
      setLiveLeaves(scopedLeaves);

      // Scope Attendance to this company only (including records from /api/attendance/work/status)
      const workStatusRecords = extractRecordsFromWorkStatus(workStatusData, scopedEmployees);
      const rawAttendance = [
        ...(Array.isArray(attendanceData) ? attendanceData : []),
        ...workStatusRecords,
      ];
      const scopedAttendance = rawAttendance.filter(
        (a) => scopedEmpIds.has(a.employeeId) || ((a as any).companyId && (a as any).companyId === activeCompanyId)
      );
      setAttendance(scopedAttendance);
      setLiveAttendanceRecords(scopedAttendance);

      // Scope Payroll to this company only
      const rawPayroll = Array.isArray(payrollData) ? payrollData : [];
      const scopedPayroll = rawPayroll.filter(
        (p) => scopedEmpIds.has(p.employeeId) || ((p as any).companyId && (p as any).companyId === activeCompanyId)
      );
      setPayroll(scopedPayroll);

      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setDesignations(Array.isArray(designationsData) ? designationsData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setAssets(Array.isArray(assetsData) ? assetsData : []);

      const anyStats = statsData as any;
      if (anyStats) {
        setStats({
          ...anyStats,
          totalEmployees: scopedEmployees.length,
          activeEmployees: scopedEmployees.filter((e) => e.status === 'Active').length,
          attendanceRate: scopedEmployees.length > 0 ? (anyStats?.attendanceRate || 0) : 0,
          totalHours: scopedEmployees.length > 0 ? (anyStats?.totalHours || 0) : 0,
        });
      }
    } catch (err) {
      console.warn('Could not refresh HRMS data:', err);
    }
  }, [user, portalMode]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Clean Path-Based Navigation (no full-page reloads, clean history updates)
  const navigateToModule = (mod: string, tab?: string) => {
    const route = getRouteForModule(mod, tab);
    setActiveModule(mod);
    if (tab) setSubTab(tab);

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
        setActiveModule={navigateToModule}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onSelectSubTab={setSubTab}
        portalMode={portalMode}
        pendingLeavesCount={pendingLeavesCount}
        unreadChatCount={unreadChatCount}
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
                initialTab={(subTab as any) || (portalMode === 'employee' ? 'today' : 'summary')}
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
                initialTab={(subTab as any) || 'about'}
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

      <AttendanceModal
        isOpen={clockModalOpen}
        onClose={() => setClockModalOpen(false)}
        onRefresh={loadData}
      />

      <LeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onRefresh={loadData}
      />

      <EmployeeDrawer
        isOpen={addEmployeeModalOpen}
        onClose={() => setAddEmployeeModalOpen(false)}
        onRefresh={loadData}
        departments={departments}
        designations={designations}
        employees={employees}
      />

      <EmployeeProfileModal
        employee={selectedEmployee}
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        onRefresh={loadData}
      />

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        employees={employees}
        onSelectEmployee={setSelectedEmployee}
        onNavigateModule={navigateToModule}
        portalMode={portalMode}
      />

      <MobileConnectModal
        isOpen={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
      />
    </div>
  );
}

