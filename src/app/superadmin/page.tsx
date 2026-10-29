'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  LogOut,
  ExternalLink,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Employee, Department, AttendanceRecord } from '../../types/hrms';
import { SuperAdminModule } from '../../components/modules/SuperAdminModule';
import { LiveClock } from '../../components/common/LiveClock';

export default function SuperAdminPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Guard: strictly redirect to / if not authenticated as SUPER_ADMIN (manual URL access only)
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        router.push('/');
      }
    }
  }, [isAuthenticated, user?.role, isLoading, router]);

  const loadData = async () => {
    try {
      const [employeesData, departmentsData, attendanceData] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
        api.getAttendance(),
      ]);

      if (Array.isArray(employeesData)) setEmployees(employeesData);
      if (Array.isArray(departmentsData)) setDepartments(departmentsData);
      if (Array.isArray(attendanceData)) setAttendance(attendanceData);
    } catch (err) {
      console.warn('Super Admin sync warning:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
      loadData();
    }
  }, [isAuthenticated, user?.role]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking Super Admin authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#152345] flex flex-col font-sans select-none">
      {/* Top Super Admin Header */}
      <header className="h-[66px] bg-white border-b-2 border-[#064e3b] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#6576ff] to-[#7f4cdb] text-white flex items-center justify-center shadow-md font-black text-lg">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-[#152345] tracking-tight">
                My Own HRMS
              </h1>
              <span className="px-2 py-0.5 rounded-[10px] bg-[#f6f8ff] border border-[#dce4f7] text-[#3446bd] font-bold text-[10px] uppercase tracking-wider">
                Super Admin Console
              </span>
            </div>
            <p className="text-[11px] text-[#6e7b98]">
              Multi-Tenant Governance &amp; Company Owner Directory
            </p>
          </div>
        </div>

        {/* Center Live Clock */}
        <div className="hidden sm:flex items-center justify-center">
          <LiveClock />
        </div>

        {/* Right user & actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setLoadingData(true);
              loadData();
            }}
            className="p-2 rounded-[9px] text-[#6e7b98] hover:text-[#152345] hover:bg-[#f4f7fc] border border-[#e4eaf5] transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-[#4f5fe8]' : ''}`} />
          </button>

          <button
            onClick={() => router.push('/')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border border-[#e4eaf5] bg-white hover:bg-[#f4f7fc] text-[#152345] text-xs font-semibold transition shadow-2xs"
            title="Switch to regular company workspace"
          >
            <Building2 className="w-3.5 h-3.5 text-[#6e7b98]" />
            <span>Company Workspace</span>
            <ExternalLink className="w-3 h-3 text-[#6e7b98]" />
          </button>

          <div className="h-5 w-px bg-[#e4eaf5] hidden sm:block" />

          {/* User profile pill */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] bg-[#f6f8ff] border border-[#dce4f7]">
            <div className="w-7 h-7 rounded-full bg-[#e8ecff] text-[#3548be] font-extrabold text-xs flex items-center justify-center">
              {user.firstName?.[0] || 'K'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[#152345] leading-tight">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Keyur Sangani'}
              </p>
              <p className="text-[10px] text-[#3446bd] font-semibold leading-none">
                Platform Super Admin
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out of Super Admin Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Console Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <SuperAdminModule
          primaryEmployees={employees}
          departments={departments}
          attendance={attendance}
          onRefreshData={loadData}
        />
      </main>
    </div>
  );
}
