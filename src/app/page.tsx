'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { CalendarModule } from '../components/modules/CalendarModule';
import { EmployeesModule } from '../components/modules/EmployeesModule';
import { AttendanceModule } from '../components/modules/AttendanceModule';
import { LeaveModule } from '../components/modules/LeaveModule';
import { PayrollModule } from '../components/modules/PayrollModule';
import { EmployeePayslipsModule } from '../components/modules/EmployeePayslipsModule';
import { RecruitmentModule } from '../components/modules/RecruitmentModule';
import { PerformanceModule } from '../components/modules/PerformanceModule';
import { OrganizationModule } from '../components/modules/OrganizationModule';
import { TrainingModule } from '../components/modules/TrainingModule';
import { DocumentsModule } from '../components/modules/DocumentsModule';
import { AssetsModule } from '../components/modules/AssetsModule';
import { ResignationsModule } from '../components/modules/ResignationsModule';
import { AnnouncementsModule } from '../components/modules/AnnouncementsModule';
import { ChatModule } from '../components/modules/ChatModule';
import { ReportsModule } from '../components/modules/ReportsModule';
import { AuditLogsModule } from '../components/modules/AuditLogsModule';
import { SettingsModule } from '../components/modules/SettingsModule';
import { getTotalUnreadChatCount, ADMIN_USER_ID } from '../lib/chatService';

import { AttendanceModal } from '../components/modals/AttendanceModal';
import { LeaveModal } from '../components/modals/LeaveModal';
import { EmployeeDrawer } from '../components/modals/EmployeeDrawer';
import { EmployeeProfileModal } from '../components/modals/EmployeeProfileModal';
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';
import { MobileConnectModal } from '../components/modals/MobileConnectModal';
import { LoginPage } from '../components/auth/LoginPage';
import { LandingPage } from '../components/landing/LandingPage';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { WavyBackground } from '../components/common/WavyBackground';
import { checkEmployeePunchEligibility } from '../lib/attendanceService';
import { useAuth, isUserAdminRole } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../lib/api';
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
} from '../types/hrms';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, portalMode, setPortalMode } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [subTab, setSubTab] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('login') === 'true' || window.location.hash === '#login') {
        router.push('/login');
        return;
      }
      const hashModule = window.location.hash ? window.location.hash.replace('#', '') : '';
      const mod = urlParams.get('module') || hashModule;
      if (mod) {
        setActiveModule(mod);
      }
      // Remove any #hash from address bar so URL stays completely clean
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initMod = localStorage.getItem('hrms_initial_module');
      if (initMod) {
        localStorage.removeItem('hrms_initial_module');
        setActiveModule(initMod);
      }
    }
  }, [isAuthenticated, user?.role]);

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
      ];
      if (!allowedInEmployee.includes(activeModule)) {
        setActiveModule('dashboard');
      }
    }
  }, [portalMode, activeModule, user?.role, setPortalMode]);

  const { showToast } = useSocket();

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

  const loadData = async () => {
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
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getEmployees(),
        api.getDepartments(),
        api.getDesignations(),
        api.getLeaves(),
        api.getAttendance(),
        api.getPayroll(),
        api.getJobs(),
        api.getCandidates(),
        api.getAssets(),
      ]);

      const seenEmpIds = new Set<string>();
      const safeEmployees = Array.isArray(employeesData)
        ? employeesData.filter((emp) => {
            if (!emp || !emp.id || seenEmpIds.has(emp.id)) return false;
            seenEmpIds.add(emp.id);
            return true;
          })
        : [];

      // Multi-Tenant Isolation: Scope data to the logged-in company
      const activeCompanyId =
        user?.companyId ||
        (typeof window !== 'undefined' ? localStorage.getItem('hrms_company_id') : null) ||
        'comp-paneliya';

      let scopedEmployees: Employee[] = [];
      if (activeCompanyId === 'comp-paneliya' || activeCompanyId === 'cmp-1') {
        scopedEmployees = safeEmployees.filter(
          (e) => !e.companyId || e.companyId === 'comp-paneliya' || e.companyId === 'cmp-1'
        );
      } else {
        scopedEmployees = safeEmployees.filter(
          (e) =>
            e.companyId === activeCompanyId ||
            (e as any).companyCode === activeCompanyId ||
            (user?.companyCode && (e as any).companyCode === user.companyCode)
        );
      }
      setEmployees(scopedEmployees);

      // Scope Leaves to this company only
      const scopedEmpIds = new Set(scopedEmployees.map((e) => e.id));
      const rawLeaves = Array.isArray(leavesData) ? leavesData : [];
      const scopedLeaves = rawLeaves.filter(
        (l) => scopedEmpIds.has(l.employeeId) || ((l as any).companyId && (l as any).companyId === activeCompanyId)
      );
      setLeaves(scopedLeaves);

      // Scope Attendance to this company only
      const rawAttendance = Array.isArray(attendanceData) ? attendanceData : [];
      const scopedAttendance = rawAttendance.filter(
        (a) => scopedEmpIds.has(a.employeeId) || ((a as any).companyId && (a as any).companyId === activeCompanyId)
      );
      setAttendance(scopedAttendance);

      // Scope Payroll to this company only
      const rawPayroll = Array.isArray(payrollData) ? payrollData : [];
      const scopedPayroll = rawPayroll.filter(
        (p) => scopedEmpIds.has(p.employeeId) || ((p as any).companyId && (p as any).companyId === activeCompanyId)
      );
      setPayroll(scopedPayroll);

      // Dynamic Company-Scoped Dashboard Stats
      if (activeCompanyId !== 'comp-paneliya') {
        const anyStats = statsData as any;
        setStats({
          totalEmployees: scopedEmployees.length,
          onLeave: scopedLeaves.filter((l) => l.status === 'Approved').length,
          pendingLeaves: scopedLeaves.filter((l) => l.status === 'Pending').length,
          attendanceRate: scopedEmployees.length > 0 ? (anyStats?.attendanceRate || 0) : 0,
          totalHours: scopedEmployees.length > 0 ? (anyStats?.totalHours || 0) : 0,
          overtimeHours: 0,
          lateArrivals: 0,
          earlyDepartures: 0,
        });
      } else if (statsData) {
        setStats(statsData);
      }

      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setDesignations(Array.isArray(designationsData) ? designationsData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
    } catch (err) {
      console.warn('API sync warning (using real data fallback):', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const pollInterval = setInterval(() => {
        loadData();
      }, 10000);
      const handleUpdate = () => loadData();
      window.addEventListener('hrms_employees_updated', handleUpdate);
      window.addEventListener('hrms_announcements_updated', handleUpdate);
      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('hrms_employees_updated', handleUpdate);
        window.removeEventListener('hrms_announcements_updated', handleUpdate);
      };
    } else {
      setEmployees([]);
      setDepartments([]);
      setDesignations([]);
      setLocations([]);
      setLeaves([]);
      setAttendance([]);
      setPayroll([]);
      setJobs([]);
      setCandidates([]);
      setAssets([]);
      setSelectedEmployee(null);
    }
  }, [isAuthenticated, user?.employeeId, user?.id]);

  useEffect(() => {
    const handleLogout = () => {
      setEmployees([]);
      setDepartments([]);
      setDesignations([]);
      setLocations([]);
      setLeaves([]);
      setAttendance([]);
      setPayroll([]);
      setJobs([]);
      setCandidates([]);
      setAssets([]);
      setSelectedEmployee(null);
    };
    window.addEventListener('hrms_auth_logout', handleLogout);
    return () => window.removeEventListener('hrms_auth_logout', handleLogout);
  }, []);

  if (isLoading && isAuthenticated) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onOpenLogin={() => router.push('/login')} />;
  }

  const navigateToModule = (mod: string) => {
    setActiveModule(mod);
    if (typeof window !== 'undefined' && window.location.hash) {
      // Keep URL clean without #hash
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {}
    }
  };

  return (
    <div className="h-screen w-full bg-[#f2f9f5] text-[#0d271d] flex font-sans antialiased overflow-hidden relative">
      {/* Random Wavy Line Luxury Background Layer */}
      <WavyBackground />

      {/* Left Sidebar (Full height from top to bottom) */}
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

      {/* Right Content Area: Header on top, Scrollable main below */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenClockModal={() => setClockModalOpen(true)}
          onOpenLeaveModal={() => setLeaveModalOpen(true)}
          onOpenAddEmployeeModal={() => setAddEmployeeModalOpen(true)}
          onOpenMobileModal={() => setMobileModalOpen(true)}
          onOpenProfile={() => {
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
          }}
          onNavigateSettings={() => setActiveModule('settings')}
          onOpenChat={() => setActiveModule('chat')}
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
              setActiveModule('chat');
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
              setActiveModule('chat');
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
        {activeModule === 'reports' && <ReportsModule />}
        {activeModule === 'audit-logs' && <AuditLogsModule />}
        {activeModule === 'settings' && <SettingsModule portalMode={portalMode} />}
          </div>
        </main>

        {/* Mobile App Bottom Navigation Bar */}
        <MobileBottomNav
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          onOpenClockModal={() => setClockModalOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          portalMode={portalMode}
          pendingLeavesCount={pendingLeavesCount}
          unreadChatCount={unreadChatCount}
          punchStatus={checkEmployeePunchEligibility(user?.employeeId || user?.id || '')?.status}
        />
      </div>

      {/* Global Modals & Drawers */}
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
        onNavigateModule={setActiveModule}
        portalMode={portalMode}
      />

      <MobileConnectModal
        isOpen={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
      />
    </div>
  );
}
