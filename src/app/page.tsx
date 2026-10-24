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
import { LoginPage } from '../components/auth/LoginPage';
import { LandingPage } from '../components/landing/LandingPage';
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
      const allowedInEmployee = ['dashboard', 'calendar', 'attendance', 'leaves', 'documents', 'announcements', 'chat', 'settings'];
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

      if (statsData) setStats(statsData);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setDesignations(Array.isArray(designationsData) ? designationsData : []);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setPayroll(Array.isArray(payrollData) ? payrollData : []);
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

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onOpenLogin={() => router.push('/login')} />;
  }

  return (
    <div className="h-screen w-full bg-[#f4f7fc] text-[#152345] flex font-sans antialiased overflow-hidden">
      {/* Left Sidebar (Full height from top to bottom) */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
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
          onNavigateModule={setActiveModule}
          onSelectEmployee={setSelectedEmployee}
          employees={employees}
          portalMode={portalMode}
          pendingLeavesCount={pendingLeavesCount}
          unreadChatCount={unreadChatCount}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full [scrollbar-width:thin] bg-[#f4f7fc]">
          <div className="max-w-[1700px] mx-auto">
        {activeModule === 'dashboard' && (
          <DashboardView
            stats={stats}
            employees={employees}
            leaves={leaves}
            attendance={attendance}
            onNavigateModule={(mod) => {
              setActiveModule(mod);
            }}
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

        {activeModule === 'payroll' && (
          <PayrollModule
            payrollRecords={payroll}
            onRefresh={loadData}
          />
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
        {activeModule === 'resignations' && <ResignationsModule />}
        {activeModule === 'announcements' && (
          <AnnouncementsModule employees={employees} portalMode={portalMode} />
        )}
        {activeModule === 'chat' && (
          <ChatModule
            employees={employees}
            initialEmployeeId={targetChatEmployeeId}
            onClearInitialEmployee={() => setTargetChatEmployeeId(null)}
          />
        )}
        {activeModule === 'reports' && <ReportsModule />}
        {activeModule === 'audit-logs' && <AuditLogsModule />}
        {activeModule === 'settings' && <SettingsModule portalMode={portalMode} />}
          </div>
        </main>
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
    </div>
  );
}
