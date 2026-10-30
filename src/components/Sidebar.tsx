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
  Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllCompanies } from '../lib/companyService';

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

  // Dynamic White-label Company Branding
  const [companyInfo, setCompanyInfo] = useState<{ name: string; logoUrl?: string }>({
    name: 'Paneliya Technology',
  });

  useEffect(() => {
    const updateBrand = () => {
      try {
        const companies = getAllCompanies();
        let matched = companies.find((c) => c.id === user?.companyId);
        if (!matched && user?.companyName) {
          matched = companies.find(
            (c) => c.name.toLowerCase() === user.companyName?.toLowerCase()
          );
        }
        if (!matched && user?.email) {
          matched = companies.find(
            (c) => c.adminUser?.email?.toLowerCase() === user.email.toLowerCase()
          );
        }
        const customName = localStorage.getItem('hrms_company_name');
        const customLogo = localStorage.getItem('hrms_company_logo');

        const resolvedName =
          customName ||
          matched?.name ||
          user?.companyName ||
          'Paneliya Technology';
        const resolvedLogo = customLogo || matched?.logoUrl;

        setCompanyInfo({
          name: resolvedName.replace(/\s+Inc\.?$/i, '').trim(),
          logoUrl: resolvedLogo,
        });
      } catch {
        // fallback
      }
    };

    updateBrand();
    window.addEventListener('hrms_companies_updated', updateBrand);
    return () => {
      window.removeEventListener('hrms_companies_updated', updateBrand);
    };
  }, [user]);

  // Dynamic Work Availability Status
  const [workStatus, setWorkStatus] = useState<string>('Working in Office');
  useEffect(() => {
    const updatePrefs = () => {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('hrms_emp_preferences') : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.workStatus) {
            setWorkStatus(parsed.workStatus);
          }
        }
      } catch {}
    };
    updatePrefs();
    window.addEventListener('hrms_preferences_updated', updatePrefs);
    return () => window.removeEventListener('hrms_preferences_updated', updatePrefs);
  }, []);

  const displayCompanyName = companyInfo.name || 'Paneliya Technology';
  const companyInitial = (displayCompanyName[0] || 'P').toUpperCase();
  const companyLogo = companyInfo.logoUrl;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hrms_sidebar_collapsed');
      if (saved !== null) {
        setInternalCollapsed(saved === 'true');
      }
    }
  }, []);

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const effectiveCollapsed = isCollapsed && isDesktop;

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

    if (effectiveCollapsed) {
      return (
        <button
          key={id}
          id={`nav-item-${id}`}
          onClick={() => handleNav(id, subTab)}
          title={label}
          aria-label={label}
          className={`w-full relative flex items-center justify-center h-10 rounded-[10px] transition-all duration-200 cursor-pointer group active:scale-95 ${
            isActive
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'text-[#475569] hover:bg-[#ecfdf5] hover:text-[#064e3b] hover:scale-105'
          }`}
        >
          <span className={`w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#059669] group-hover:text-[#064e3b]'}`}>
            {icon}
          </span>
          {badge && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f59e0b] ring-2 ring-white animate-pulse" />
          )}
        </button>
      );
    }

    return (
      <button
        key={id}
        id={`nav-item-${id}`}
        onClick={() => handleNav(id, subTab)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
          isActive
            ? 'bg-[#064e3b] text-white font-bold shadow-xs translate-x-0.5'
            : 'text-[#334155] hover:bg-[#ecfdf5] hover:text-[#064e3b] hover:translate-x-1 font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-5 flex justify-center transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#059669] group-hover:text-[#064e3b]'}`}>
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
          className="fixed inset-0 bg-[#062d1f]/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 h-screen lg:h-full w-[280px] max-w-[85vw] ${
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-[245px]'
        } bg-white text-[#0d271d] flex flex-col shrink-0 select-none transition-all duration-200 ease-in-out border-r-2 border-[#064e3b] shadow-xs ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-[62px] sm:h-[66px] border-b-2 border-[#064e3b] shrink-0 bg-white ${
            effectiveCollapsed
              ? 'px-2 flex items-center justify-center'
              : 'px-3 flex items-center justify-between'
          }`}
        >
          {effectiveCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                id="btn-sidebar-logo-expand"
                onClick={toggleCollapse}
                className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#10b981] to-[#059669] flex items-center justify-center font-black text-white text-xl shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer relative group overflow-hidden"
                title={`${displayCompanyName} (by MyOwnHRMS)`}
              >
                {companyLogo ? (
                  <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-1" />
                ) : (
                  companyInitial
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-[#064e3b] flex items-center justify-center text-[10px] text-[#064e3b] shadow-xs">
                  <PanelLeftOpen className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#10b981] to-[#059669] flex items-center justify-center font-black text-white text-xl shadow-md shrink-0 overflow-hidden">
                  {companyLogo ? (
                    <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-1" />
                  ) : (
                    companyInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <b className="text-[14px] sm:text-[15px] tracking-[0.2px] text-[#0d271d] block leading-tight font-black truncate" title={displayCompanyName}>
                    {displayCompanyName}
                  </b>
                  <small className="text-[10px] tracking-[0.4px] text-[#059669] block font-bold leading-none mt-0.5">
                    by MyOwnHRMS
                  </small>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Desktop Collapse Button */}
                <button
                  id="btn-sidebar-toggle-collapse"
                  onClick={toggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-[#065f46] hover:text-[#0d271d] hover:bg-[#ecfdf5] transition-colors cursor-pointer"
                  title="Collapse sidebar (icons only)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#065f46] hover:text-[#0d271d] hover:bg-[#ecfdf5] lg:hidden cursor-pointer"
                  title="Close navigation"
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
            effectiveCollapsed ? 'px-2' : 'px-2.5'
          } py-3 space-y-4 text-sm [scrollbar-width:thin] pb-24 lg:pb-6`}
        >
          {/* Main workspace section */}
          <div className="space-y-0.5">
            {!effectiveCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold text-[#065f46] uppercase tracking-[1.2px]">
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
                <span className="px-1.5 py-0.2 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold">
                  {pendingLeavesCount}
                </span>
              ) : undefined
            )}
            {portalMode === 'employee' && (
              navItem('payslips', 'My Payslips', <Receipt className="w-4 h-4" />)
            )}
            {portalMode === 'employee' && (
              navItem('resignations', 'My Resignation', <LogOut className="w-4 h-4" />)
            )}
            {navItem(
              'chat',
              'Team Chat',
              <MessageSquare className="w-4 h-4" />,
              unreadChatCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#10b981] text-white text-[10px] font-bold">
                  {unreadChatCount}
                </span>
              ) : undefined
            )}
            {navItem('calendar', 'Calendar & Holidays', <Calendar className="w-4 h-4" />)}
          </div>

          {/* HR Management (Only in Admin view) */}
          {portalMode === 'admin' && (
            <div className="space-y-0.5">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-[#064e3b]/20 mx-1" />
              ) : (
                <p className="px-3 pb-1 text-[10px] font-extrabold text-[#065f46] uppercase tracking-[1.2px] pt-2">
                  Workforce
                </p>
              )}

              {effectiveCollapsed ? (
                <>
                  {navItem('employees', 'Employees Directory', <Users className="w-4 h-4" />)}
                  {navItem('organization', 'Departments & Roles', <Layers className="w-4 h-4" />, undefined, 'departments')}
                </>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSection('people')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-[#334155] hover:bg-[#ecfdf5] hover:text-[#064e3b] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 flex justify-center text-[#059669] group-hover:text-[#064e3b]">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>Employees</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#059669] transition-transform ${
                        openSections.people ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openSections.people && (
                    <div className="ml-5 pl-3 space-y-0.5 border-l-2 border-[#064e3b]/30 my-1">
                      <button
                        onClick={() => handleNav('employees')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer ${
                          activeModule === 'employees'
                            ? 'text-white font-bold bg-[#064e3b]'
                            : 'text-[#475569] hover:text-[#064e3b] hover:bg-[#ecfdf5]'
                        }`}
                      >
                        Directory
                      </button>
                      <button
                        onClick={() => handleNav('organization', 'departments')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer ${
                          activeModule === 'organization'
                            ? 'text-white font-bold bg-[#064e3b]'
                            : 'text-[#475569] hover:text-[#064e3b] hover:bg-[#ecfdf5]'
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
              {navItem('resignations', 'Resignations & Clearance', <LogOut className="w-4 h-4" />)}
              {navItem('reports', 'Reports', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* Company section */}
          <div className="space-y-0.5">
            {effectiveCollapsed ? (
              <div className="my-2 border-t border-[#064e3b]/20 mx-1" />
            ) : (
              <p className="px-3 pb-1 text-[10px] font-extrabold text-[#065f46] uppercase tracking-[1.2px] pt-2">
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
          className={`border-t-2 border-[#064e3b] bg-[#f8faf9] ${
            effectiveCollapsed ? 'p-2' : 'p-3'
          }`}
        >
          {effectiveCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#064e3b] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs cursor-pointer overflow-hidden border border-[#a7f3d0]"
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
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <>
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    {user.lastName?.[0] || ''}
                  </>
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-[7px] text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-1.5 rounded-[8px] hover:bg-[#ecfdf5] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#064e3b] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden border border-[#a7f3d0]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        {user.lastName?.[0] || ''}
                      </>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0d271d] truncate">
                      {user.firstName
                        ? `${user.firstName} ${user.lastName || ''}`.trim()
                        : user.email || 'User'}
                    </p>
                    <p className="text-[10px] text-[#475569] truncate flex items-center gap-1">
                      <span>{portalMode === 'admin' ? 'Administrator' : (user as any).designationTitle || 'Staff Employee'}</span>
                      <span className="opacity-60">•</span>
                      <span className="text-[#059669] font-bold">{workStatus}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-[7px] text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-[#064e3b]/20 px-1 text-[10px] text-[#475569] flex justify-between items-center">
                <span className="truncate max-w-[125px] font-medium" title={displayCompanyName}>{displayCompanyName}</span>
                <span className="text-[#059669] font-bold">by MyOwnHRMS</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
