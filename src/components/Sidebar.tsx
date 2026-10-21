'use client';

import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  Clock,
  Award,
  CircleDollarSign,
  Settings,
  ChevronDown,
  X,
  UserCheck,
  Building2,
  CalendarOff,
  Shield,
  User,
  FileText,
  Laptop,
  Bell,
  BarChart3,
  LogOut,
  FolderLock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectSubTab?: (subTab: string) => void;
  portalMode?: 'employee' | 'admin';
  onTogglePortal?: (mode: 'employee' | 'admin') => void;
  pendingLeavesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  onSelectSubTab,
  portalMode = 'admin',
  onTogglePortal,
  pendingLeavesCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
    attendance: true,
    finance: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNav = (moduleId: string, subTab?: string) => {
    setActiveModule(moduleId);
    if (onSelectSubTab && subTab) {
      onSelectSubTab(subTab);
    }
    // On small mobile screens, close sidebar when navigating
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'text-indigo-700 font-semibold bg-indigo-50/70'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <>
      {/* Mobile Backdrop Overlay (only on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Persistent Sidebar on Desktop (lg:translate-x-0 lg:static), slide-over on Mobile */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-none block">
                Paneliya HRMS
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live System
              </span>
            </div>
          </div>

          {/* Close button for Mobile only */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Mode Indicator */}
        <div className="px-4 pt-3.5 pb-1 shrink-0">
          <div
            className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
              portalMode === 'employee'
                ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {portalMode === 'employee' ? (
                <User className="w-4 h-4 text-purple-600" />
              ) : (
                <Shield className="w-4 h-4 text-indigo-600" />
              )}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                  MODE
                </p>
                <p className="text-xs font-bold">
                  {portalMode === 'employee' ? 'Employee Self-Service' : 'HR & Admin Suite'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                portalMode === 'employee'
                  ? 'bg-purple-200 text-purple-900'
                  : 'bg-indigo-200 text-indigo-900'
              }`}
            >
              {portalMode === 'employee' ? 'Staff' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm [scrollbar-width:thin]">
          {/* Main Group Header */}
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Workspace
          </p>

          {/* 1. Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={navItemClass(activeModule === 'dashboard')}
          >
            <div className="flex items-center gap-2.5">
              <Home className={`w-4 h-4 ${activeModule === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{portalMode === 'employee' ? 'My Dashboard' : 'HR Dashboard'}</span>
            </div>
          </button>

          {/* 2. Attendance */}
          <button
            onClick={() => handleNav('attendance', 'summary')}
            className={navItemClass(activeModule === 'attendance')}
          >
            <div className="flex items-center gap-2.5">
              <Clock className={`w-4 h-4 ${activeModule === 'attendance' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{portalMode === 'employee' ? 'My Attendance' : 'Attendance & Clock'}</span>
            </div>
          </button>

          {/* 3. Leaves & Approvals */}
          <button
            onClick={() => handleNav('leaves')}
            className={navItemClass(activeModule === 'leaves')}
          >
            <div className="flex items-center gap-2.5">
              <CalendarOff className={`w-4 h-4 ${activeModule === 'leaves' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{portalMode === 'employee' ? 'My Leaves' : 'Leave Approvals'}</span>
            </div>
            {portalMode === 'admin' && pendingLeavesCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                {pendingLeavesCount}
              </span>
            ) : null}
          </button>

          {/* 4. Calendar & Shifts */}
          <button
            onClick={() => handleNav('calendar')}
            className={navItemClass(activeModule === 'calendar')}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className={`w-4 h-4 ${activeModule === 'calendar' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Calendar & Holidays</span>
            </div>
          </button>

          {/* ADMIN-ONLY MANAGEMENT SECTION */}
          {portalMode === 'admin' && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Organization & HR
              </p>

              {/* Employees Directory */}
              <div>
                <button
                  onClick={() => toggleSection('people')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Employees</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      openSections.people ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.people && (
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <button
                      onClick={() => handleNav('employees')}
                      className={subNavItemClass(activeModule === 'employees')}
                    >
                      Workforce Directory
                    </button>
                    <button
                      onClick={() => handleNav('organization', 'departments')}
                      className={subNavItemClass(activeModule === 'organization')}
                    >
                      Departments & Roles
                    </button>
                  </div>
                )}
              </div>

              {/* Payroll */}
              <button
                onClick={() => handleNav('payroll')}
                className={navItemClass(activeModule === 'payroll')}
              >
                <div className="flex items-center gap-2.5">
                  <CircleDollarSign className={`w-4 h-4 ${activeModule === 'payroll' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Payroll & Slips</span>
                </div>
              </button>

              {/* Recruitment / ATS */}
              <button
                onClick={() => handleNav('recruitment')}
                className={navItemClass(activeModule === 'recruitment')}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className={`w-4 h-4 ${activeModule === 'recruitment' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Recruitment & ATS</span>
                </div>
              </button>

              {/* Reports */}
              <button
                onClick={() => handleNav('reports')}
                className={navItemClass(activeModule === 'reports')}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={`w-4 h-4 ${activeModule === 'reports' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Analytics & Reports</span>
                </div>
              </button>
            </>
          )}

          {/* GENERAL COMPANY SECTION */}
          <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            General
          </p>

          {/* Documents */}
          <button
            onClick={() => handleNav('documents')}
            className={navItemClass(activeModule === 'documents')}
          >
            <div className="flex items-center gap-2.5">
              <FolderLock className={`w-4 h-4 ${activeModule === 'documents' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Documents Vault</span>
            </div>
          </button>

          {/* Announcements */}
          <button
            onClick={() => handleNav('announcements')}
            className={navItemClass(activeModule === 'announcements')}
          >
            <div className="flex items-center gap-2.5">
              <Award className={`w-4 h-4 ${activeModule === 'announcements' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Notice Board</span>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNav('settings')}
            className={navItemClass(activeModule === 'settings')}
          >
            <div className="flex items-center gap-2.5">
              <Settings className={`w-4 h-4 ${activeModule === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>System Settings</span>
            </div>
          </button>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.firstName?.[0] || 'K'}{user.lastName?.[0] || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user.email || 'keyur.sangani1234@gmail.com'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
