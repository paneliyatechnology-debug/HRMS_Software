'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Users,
  Clock,
  CircleDollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  UserCheck,
  Building2,
  CalendarOff,
  FolderLock,
  Award,
  BarChart3,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  Layers,
  FileText,
  User,
  PanelLeftClose,
  PanelLeftOpen,
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
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
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
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hrms_sidebar_collapsed');
      if (saved !== null) {
        setInternalCollapsed(saved === 'true');
      }
    }
  }, []);

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(next);
    } else {
      setInternalCollapsed(next);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_sidebar_collapsed', String(next));
    }
  };

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

  const navItem = (
    id: string,
    label: string,
    icon: React.ReactNode,
    badge?: React.ReactNode,
    subTab?: string
  ) => {
    const isActive = activeModule === id;

    if (isCollapsed) {
      return (
        <button
          key={id}
          id={`nav-item-${id}`}
          onClick={() => handleNav(id, subTab)}
          title={label}
          aria-label={label}
          className={`w-full relative flex items-center justify-center h-10 rounded-[8px] transition-all duration-150 cursor-pointer group ${
            isActive
              ? 'bg-[#4e5de0] text-white shadow-xs'
              : 'text-[#c8d4f2] hover:bg-[#4e5de0]/80 hover:text-white'
          }`}
        >
          <span className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-white' : 'text-[#aab8df] group-hover:text-white'}`}>
            {icon}
          </span>
          {badge && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f39a3f] ring-2 ring-[#111d3b]" />
          )}
        </button>
      );
    }

    return (
      <button
        key={id}
        id={`nav-item-${id}`}
        onClick={() => handleNav(id, subTab)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] transition-all duration-150 ${
          isActive
            ? 'bg-[#4e5de0] text-white font-semibold shadow-xs'
            : 'text-[#c8d4f2] hover:bg-[#4e5de0]/80 hover:text-white font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-5 flex justify-center ${isActive ? 'text-white' : 'text-[#aab8df]'}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
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
          className="fixed inset-0 bg-[#111d3b]/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 h-screen lg:h-full ${
          isCollapsed ? 'w-[68px]' : 'w-[245px]'
        } bg-gradient-to-b from-[#111d3b] to-[#101a34] text-[#eaf0ff] flex flex-col shrink-0 select-none transition-all duration-200 ease-in-out border-r border-[#19284c] ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-[66px] border-b border-[#34415e]/80 shrink-0 ${
            isCollapsed
              ? 'px-2 flex items-center justify-center'
              : 'px-3 flex items-center justify-between'
          }`}
        >
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                id="btn-sidebar-logo-expand"
                onClick={toggleCollapse}
                className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#6576ff] to-[#7f4cdb] flex items-center justify-center font-black text-white text-xl shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer relative group"
                title="Expand sidebar"
              >
                M
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#111d3b] border border-[#6576ff] flex items-center justify-center text-[10px] text-white shadow-xs">
                  <PanelLeftOpen className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#6576ff] to-[#7f4cdb] flex items-center justify-center font-black text-white text-xl shadow-md shrink-0">
                  M
                </div>
                <div>
                  <b className="text-[17px] tracking-[0.5px] text-white block leading-tight font-black">
                    MY OWN
                  </b>
                  <small className="text-[10px] tracking-[2px] text-[#aab8df] block uppercase font-bold">
                    H R M S
                  </small>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Button */}
                <button
                  id="btn-sidebar-toggle-collapse"
                  onClick={toggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-[#aab8df] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Collapse sidebar (icons only)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-[#aab8df] hover:text-white lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation list */}
        <div
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? 'px-2' : 'px-2.5'
          } py-3 space-y-4 text-sm [scrollbar-width:thin]`}
        >
          {/* Main workspace section */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold text-[#9baedb] uppercase tracking-[1px]">
                {portalMode === 'admin' ? 'Administration' : 'Self-Service'}
              </p>
            )}

            {navItem('dashboard', 'Dashboard', <Home className="w-4 h-4" />)}
            {navItem('attendance', 'Attendance', <Clock className="w-4 h-4" />)}
            {navItem(
              'leaves',
              portalMode === 'admin' ? 'Leave Requests' : 'My Leaves',
              <CalendarOff className="w-4 h-4" />,
              portalMode === 'admin' && pendingLeavesCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#f39a3f] text-white text-[10px] font-bold">
                  {pendingLeavesCount}
                </span>
              ) : undefined
            )}
            {navItem(
              'chat',
              'Team Chat',
              <MessageSquare className="w-4 h-4" />,
              unreadChatCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#16a779] text-white text-[10px] font-bold">
                  {unreadChatCount}
                </span>
              ) : undefined
            )}
            {navItem('calendar', 'Calendar & Holidays', <Calendar className="w-4 h-4" />)}
          </div>

          {/* HR Management (Only in Admin view) */}
          {portalMode === 'admin' && (
            <div className="space-y-0.5">
              {isCollapsed ? (
                <div className="my-2 border-t border-[#34415e]/50 mx-1" />
              ) : (
                <p className="px-3 pb-1 text-[11px] font-semibold text-[#9baedb] uppercase tracking-[1px]">
                  Workforce
                </p>
              )}

              {isCollapsed ? (
                <>
                  {navItem('employees', 'Employees Directory', <Users className="w-4 h-4" />)}
                  {navItem('organization', 'Departments & Roles', <Layers className="w-4 h-4" />, undefined, 'departments')}
                </>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSection('people')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-[#c8d4f2] hover:bg-[#4e5de0]/80 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 flex justify-center text-[#aab8df]">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>Employees</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#aab8df] transition-transform ${
                        openSections.people ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openSections.people && (
                    <div className="ml-5 pl-3 space-y-0.5 border-l border-[#34415e] my-1">
                      <button
                        onClick={() => handleNav('employees')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                          activeModule === 'employees'
                            ? 'text-white font-semibold bg-[#4e5de0]'
                            : 'text-[#c8d4f2] hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Directory
                      </button>
                      <button
                        onClick={() => handleNav('organization', 'departments')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                          activeModule === 'organization'
                            ? 'text-white font-semibold bg-[#4e5de0]'
                            : 'text-[#c8d4f2] hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Departments & Roles
                      </button>
                    </div>
                  )}
                </div>
              )}

              {navItem('payroll', 'Payroll & Slips', <CircleDollarSign className="w-4 h-4" />)}
              {navItem('recruitment', 'Recruitment', <UserCheck className="w-4 h-4" />)}
              {navItem('reports', 'Reports', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* Company section */}
          <div className="space-y-0.5">
            {isCollapsed ? (
              <div className="my-2 border-t border-[#34415e]/50 mx-1" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-semibold text-[#9baedb] uppercase tracking-[1px]">
                Company
              </p>
            )}
            {navItem('organization', 'About Organisation', <Building2 className="w-4 h-4" />, undefined, 'about')}
            {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
            {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
            {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
          </div>
        </div>

        {/* Footer: User profile & Logout */}
        <div
          className={`border-t border-[#34415e]/80 bg-[#101a34]/60 ${
            isCollapsed ? 'p-2' : 'p-3'
          }`}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-8 h-8 rounded-full bg-[#e8ecff] text-[#3548be] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                title={`${
                  user.firstName
                    ? `${user.firstName} ${user.lastName || ''}`.trim()
                    : user.email || 'User'
                } (${
                  portalMode === 'admin'
                    ? 'Administrator'
                    : (user as any).designationTitle || 'Staff Employee'
                })`}
              >
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                {user.lastName?.[0] || ''}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-[7px] text-[#aab8df] hover:text-[#ed626c] hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-1.5 rounded-[8px] hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#e8ecff] text-[#3548be] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    {user.lastName?.[0] || ''}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {user.firstName
                        ? `${user.firstName} ${user.lastName || ''}`.trim()
                        : user.email || 'User'}
                    </p>
                    <p className="text-[10px] text-[#aab8df] truncate">
                      {portalMode === 'admin'
                        ? 'Administrator'
                        : (user as any).designationTitle || 'Staff Employee'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-[7px] text-[#aab8df] hover:text-[#ed626c] hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-[#34415e]/40 px-1 text-[10px] text-[#aab8df] flex justify-between items-center">
                <span>My Own HRMS</span>
                <span className="text-[#6576ff] font-semibold">People · Work</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
