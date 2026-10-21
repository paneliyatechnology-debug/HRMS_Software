'use client';

import React, { useState, useEffect } from 'react';
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
import { ReportsModule } from '../components/modules/ReportsModule';
import { AuditLogsModule } from '../components/modules/AuditLogsModule';
import { SettingsModule } from '../components/modules/SettingsModule';

import { AttendanceModal } from '../components/modals/AttendanceModal';
import { LeaveModal } from '../components/modals/LeaveModal';
import { EmployeeDrawer } from '../components/modals/EmployeeDrawer';
import { EmployeeProfileModal } from '../components/modals/EmployeeProfileModal';
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';

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
import {
  mockDashboardStats,
  mockEmployees,
  mockDepartments,
  mockDesignations,
  mockLocations,
  mockLeaveRequests,
} from '../lib/mockData';

export default function Home() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [subTab, setSubTab] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [stats, setStats] = useState<any>(mockDashboardStats);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [designations, setDesignations] = useState<Designation[]>(mockDesignations);
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaveRequests);
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
      if (employeesData && employeesData.length > 0) setEmployees(employeesData);
      if (departmentsData && departmentsData.length > 0) setDepartments(departmentsData);
      if (designationsData && designationsData.length > 0) setDesignations(designationsData);
      if (leavesData) setLeaves(leavesData);
      if (attendanceData) setAttendance(attendanceData);
      if (payrollData && payrollData.length > 0) setPayroll(payrollData);
      if (jobsData && jobsData.length > 0) setJobs(jobsData);
      if (candidatesData && candidatesData.length > 0) setCandidates(candidatesData);
      if (assetsData && assetsData.length > 0) setAssets(assetsData);
    } catch (err) {
      console.warn('API sync warning (using real data fallback):', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col font-sans select-none antialiased">
      {/* Top Navbar matching Clan.biz */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenClockModal={() => setClockModalOpen(true)}
        onOpenLeaveModal={() => setLeaveModalOpen(true)}
        onOpenAddEmployeeModal={() => setAddEmployeeModalOpen(true)}
        onOpenProfile={() => setSelectedEmployee(employees[0] || mockEmployees[0])}
        onNavigateSettings={() => setActiveModule('settings')}
      />

      {/* Slide-over Left Sidebar */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onSelectSubTab={setSubTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto">
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
          />
        )}

        {activeModule === 'calendar' && (
          <CalendarModule
            attendance={attendance}
            leaves={leaves}
            onOpenLeaveModal={() => setLeaveModalOpen(true)}
            onOpenClockModal={() => setClockModalOpen(true)}
          />
        )}

        {activeModule === 'employees' && (
          <EmployeesModule
            employees={employees}
            departments={departments}
            onSelectEmployee={setSelectedEmployee}
            onOpenAddModal={() => setAddEmployeeModalOpen(true)}
          />
        )}

        {activeModule === 'attendance' && (
          <AttendanceModule
            records={attendance}
            employees={employees}
            initialTab={(subTab as any) || 'summary'}
            onOpenPunchModal={() => setClockModalOpen(true)}
            onRefresh={loadData}
          />
        )}

        {activeModule === 'leaves' && (
          <LeaveModule
            leaves={leaves}
            onOpenApplyModal={() => setLeaveModalOpen(true)}
            onRefresh={loadData}
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
            initialTab={(subTab as any) || 'departments'}
            onRefresh={loadData}
          />
        )}

        {activeModule === 'training' && (
          <TrainingModule
            programs={[]}
            onRefresh={loadData}
          />
        )}

        {activeModule === 'documents' && <DocumentsModule />}
        {activeModule === 'assets' && <AssetsModule />}
        {activeModule === 'resignations' && <ResignationsModule />}
        {activeModule === 'announcements' && <AnnouncementsModule />}
        {activeModule === 'reports' && <ReportsModule />}
        {activeModule === 'audit-logs' && <AuditLogsModule />}
        {activeModule === 'settings' && <SettingsModule />}
      </main>

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
      />

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        employees={employees}
        onSelectEmployee={setSelectedEmployee}
        onNavigateModule={setActiveModule}
      />
    </div>
  );
}
