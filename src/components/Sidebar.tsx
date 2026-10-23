'use client';

import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  Clock,
  CircleDollarSign,
  Settings,
  ChevronDown,
  X,
  UserCheck,
  Building2,
  CalendarOff,
  FolderLock,
  Award,
  BarChart3,
  LogOut,
  MessageSquare,
  Zap,
  PlayCircle,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  PlaneTakeoff,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectSubTab?: (subTab: string) => void;
  portalMode?: 'employee' | 'admin';
  pendingLeavesCount?: number;
  unreadChatCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  onSelectSubTab,
  portalMode = 'admin',
  pendingLeavesCount = 0,
  unreadChatCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNav = (moduleId: string, subTab?: string) => {
    setActiveModule(moduleId);
    if (onSelectSubTab && subTab) {
      onSelectSubTab(subTab);
    }
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const navItem = (id: string, label: string, icon: React.ReactNode, badge?: React.ReactNode) => {
    const isActive = activeModule === id;
    return (
      <button
        id={`nav-item-${id}`}
        onClick={() => handleNav(id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`}>
            {icon}
          </span>
          <span className="tracking-tight">{label}</span>
        </div>
        {badge}
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none transition-transform duration-200 ease-out shadow-xs ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Jibble Emblem & Workspace */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 font-black text-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 tracking-tight block">
                JIBBLE
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                Paneliya Workforce
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 text-xs [scrollbar-width:thin]">
          {/* Main workspace section */}
          <div className="space-y-1">
            <p className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {portalMode === 'admin' ? 'Time & Tracking' : 'My Workplace'}
            </p>

            {navItem('dashboard', 'Dashboard', <Home className="w-4 h-4" />)}

            {navItem(
              'attendance',
              'Live Attendance (Who’s In)',
              <Clock className="w-4 h-4" />,
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}

            {navItem(
              'leaves',
              portalMode === 'admin' ? 'Time Off & Leaves' : 'My Time Off',
              <PlaneTakeoff className="w-4 h-4" />,
              portalMode === 'admin' && pendingLeavesCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {pendingLeavesCount}
                </span>
              ) : undefined
            )}

            {navItem(
              'chat',
              'Team Chat',
              <MessageSquare className="w-4 h-4" />,
              unreadChatCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {unreadChatCount}
                </span>
              ) : undefined
            )}

            {navItem('calendar', 'Schedules & Shifts', <CalendarDays className="w-4 h-4" />)}
          </div>

          {/* Workforce & Operations (Admin Only) */}
          {portalMode === 'admin' && (
            <div className="space-y-1">
              <p className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Workforce Management
              </p>

              <div>
                <button
                  onClick={() => toggleSection('people')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="tracking-tight">People & Groups</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      openSections.people ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.people && (
                  <div className="ml-6 pl-2 space-y-1 border-l-2 border-slate-100 mt-1">
                    <button
                      onClick={() => handleNav('employees')}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        activeModule === 'employees'
                          ? 'text-indigo-600 font-bold bg-indigo-50/70'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Team Directory
                    </button>
                    <button
                      onClick={() => handleNav('organization', 'departments')}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        activeModule === 'organization'
                          ? 'text-indigo-600 font-bold bg-indigo-50/70'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Departments & Roles
                    </button>
                  </div>
                )}
              </div>

              {navItem('payroll', 'Payroll & Timesheets', <CircleDollarSign className="w-4 h-4" />)}
              {navItem('recruitment', 'Recruitment / ATS', <UserCheck className="w-4 h-4" />)}
              {navItem('reports', 'Reports & Analytics', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* Policies & Organization */}
          <div className="space-y-1">
            <p className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Company
            </p>

            {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
            {navItem('announcements', 'Notices & News', <Award className="w-4 h-4" />)}

            {portalMode === 'admin' && (
              <>
                {navItem('assets', 'Assets & Devices', <Building2 className="w-4 h-4" />)}
                {navItem('audit-logs', 'Audit Logs', <FolderLock className="w-4 h-4" />)}
              </>
            )}

            {navItem('settings', 'Settings & Policies', <Sliders className="w-4 h-4" />)}
          </div>
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.firstName?.[0] || 'K'}{user.lastName?.[0] || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold truncate leading-tight mt-0.5">
                  {portalMode === 'admin' ? 'Super Admin' : 'Employee'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
