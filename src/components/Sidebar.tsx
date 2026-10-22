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
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-slate-100 text-slate-900 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={isActive ? 'text-slate-900' : 'text-slate-400'}>{icon}</span>
          <span>{label}</span>
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
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none transition-transform duration-150 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-lg lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 lg:hidden">
          <span className="text-sm font-semibold text-slate-900">Paneliya HRMS</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-sm [scrollbar-width:thin]">
          {/* Main workspace section */}
          <div className="space-y-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {portalMode === 'admin' ? 'Administration' : 'Self-Service'}
            </p>

            {navItem('dashboard', 'Dashboard', <Home className="w-4 h-4" />)}
            {navItem('attendance', 'Attendance', <Clock className="w-4 h-4" />)}
            {navItem(
              'leaves',
              portalMode === 'admin' ? 'Leave Requests' : 'My Leaves',
              <CalendarOff className="w-4 h-4" />,
              portalMode === 'admin' && pendingLeavesCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-xs font-semibold">
                  {pendingLeavesCount}
                </span>
              ) : undefined
            )}
            {navItem(
              'chat',
              'Team Chat',
              <MessageSquare className="w-4 h-4" />,
              unreadChatCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white text-xs font-semibold">
                  {unreadChatCount}
                </span>
              ) : undefined
            )}
            {navItem('calendar', 'Calendar & Holidays', <Calendar className="w-4 h-4" />)}
          </div>

          {/* HR Management (Only in Admin view) */}
          {portalMode === 'admin' && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Workforce
              </p>

              <div>
                <button
                  onClick={() => toggleSection('people')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
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
                  <div className="ml-6 pl-2 space-y-0.5 border-l border-slate-200 mt-0.5">
                    <button
                      onClick={() => handleNav('employees')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        activeModule === 'employees'
                          ? 'text-slate-900 font-semibold bg-slate-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Directory
                    </button>
                    <button
                      onClick={() => handleNav('organization', 'departments')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        activeModule === 'organization'
                          ? 'text-slate-900 font-semibold bg-slate-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Departments & Roles
                    </button>
                  </div>
                )}
              </div>

              {navItem('payroll', 'Payroll & Slips', <CircleDollarSign className="w-4 h-4" />)}
              {navItem('recruitment', 'Recruitment', <UserCheck className="w-4 h-4" />)}
              {navItem('reports', 'Reports', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* Company section */}
          <div className="space-y-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Company
            </p>
            {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
            {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
            {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
          </div>
        </div>

        {/* Footer: User profile */}
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                {user.lastName?.[0] || ''}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || 'Employee'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {portalMode === 'admin' ? 'Administrator' : (user as any).designationTitle || 'Staff Employee'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
