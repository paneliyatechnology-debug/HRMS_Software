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
import { api } from '../lib/api';

interface SidebarProps {
  activeModule: string;
  activeSubTab?: string;
  setActiveModule: (m: string, subTab?: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectSubTab?: (subTab: string) => void;
  portalMode?: 'employee' | 'admin';
  pendingLeavesCount?: number;
  unreadChatCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  company?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubTab = '',
  setActiveModule,
  isOpen,
  setIsOpen,
  onSelectSubTab,
  portalMode = 'admin',
  pendingLeavesCount = 0,
  unreadChatCount = 0,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  company,
}) => {
  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
  });

  // Dynamic White-label Company Branding
  const [companyInfo, setCompanyInfo] = useState<{ name: string; logoUrl?: string }>({
    name: company?.name || user?.companyName || '',
    logoUrl: company?.logoUrl,
  });

  useEffect(() => {
    let isMounted = true;

    if (company && company.name) {
      setCompanyInfo({
        name: company.name.replace(/\s+Inc\.?$/i, '').trim(),
        logoUrl: company.logoUrl,
      });
      return;
    }

    const updateBrand = async () => {
      try {
        let backendComp = null;
        try {
          backendComp = await api.getMyCompany();
        } catch {
          // ignore
        }

        if (isMounted && backendComp && backendComp.name) {
          setCompanyInfo({
            name: backendComp.name.replace(/\s+Inc\.?$/i, '').trim(),
            logoUrl: backendComp.logoUrl,
          });
          return;
        }

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

        const resolvedName =
          matched?.name ||
          user?.companyName ||
          'My Organization';
        const resolvedLogo = matched?.logoUrl;

        if (isMounted) {
          setCompanyInfo({
            name: resolvedName.replace(/\s+Inc\.?$/i, '').trim(),
            logoUrl: resolvedLogo,
          });
        }
      } catch {
        // fallback
      }
    };

    updateBrand();
    window.addEventListener('hrms_companies_updated', updateBrand);
    return () => {
      isMounted = false;
      window.removeEventListener('hrms_companies_updated', updateBrand);
    };
  }, [company, user?.companyId, user?.companyName]);

  // Dynamic Work Availability Status
  const [workStatus, setWorkStatus] = useState<string>('Working in Office');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const displayCompanyName = companyInfo.name || user?.companyName || 'My Organization';
  const companyInitial = (displayCompanyName[0] || 'O').toUpperCase();
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
    setActiveModule(moduleId, subTab);
    if (onSelectSubTab) {
      onSelectSubTab(subTab || '');
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
    let isActive = activeModule === id;
    if (id === 'organization') {
      if (subTab === 'departments') {
        isActive = activeModule === 'organization' && activeSubTab === 'departments';
      } else {
        isActive = activeModule === 'organization' && activeSubTab !== 'departments';
      }
    }

    if (effectiveCollapsed) {
      return (
        <button
          key={id}
          id={`nav-item-${id}`}
          onClick={() => handleNav(id, subTab)}
          title={label}
          aria-label={label}
          className={`w-full relative flex items-center justify-center h-10 rounded-xl transition-all duration-150 cursor-pointer group active:scale-95 ${
            isActive
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className={`w-5 h-5 flex items-center justify-center transition-transform duration-150 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'}`}>
            {icon}
          </span>
          {badge && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
          )}
        </button>
      );
    }

    return (
      <button
        key={id}
        id={`nav-item-${id}`}
        onClick={() => handleNav(id, subTab)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all duration-150 cursor-pointer group active:scale-[0.99] ${
          isActive
            ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border-l-[3px] border-emerald-600'
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-5 flex justify-center transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-700'}`}>
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 h-screen lg:h-full w-[280px] max-w-[85vw] ${
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-[245px]'
        } bg-white text-slate-800 flex flex-col shrink-0 select-none transition-all duration-200 ease-in-out border-r border-slate-200/80 shadow-xs ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 border-b border-slate-200/80 shrink-0 bg-white ${
            effectiveCollapsed
              ? 'px-2 flex items-center justify-center'
              : 'px-3.5 flex items-center justify-between'
          }`}
        >
          {effectiveCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                id="btn-sidebar-logo-expand"
                onClick={toggleCollapse}
                className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer relative group overflow-hidden"
                title={`${displayCompanyName} (by MyOwnHRMS)`}
              >
                {companyLogo ? (
                  <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-1" />
                ) : (
                  companyInitial
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 shadow-xs">
                  <PanelLeftOpen className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-sm shrink-0 overflow-hidden">
                  {companyLogo ? (
                    <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-1" />
                  ) : (
                    companyInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <b className="text-[14px] text-slate-900 block leading-tight font-bold truncate" title={displayCompanyName}>
                    {displayCompanyName}
                  </b>
                  <small className="text-[10px] text-emerald-600 block font-semibold leading-none mt-0.5">
                    by MyOwnHRMS
                  </small>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Desktop Collapse Button */}
                <button
                  id="btn-sidebar-toggle-collapse"
                  onClick={toggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Collapse sidebar (icons only)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
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
          } py-3.5 space-y-4 text-sm [scrollbar-width:thin] pb-24 lg:pb-6`}
        >
          {/* Main workspace section */}
          <div className="space-y-1">
            {!effectiveCollapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
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
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {unreadChatCount}
                </span>
              ) : undefined
            )}
            {navItem('calendar', 'Calendar & Holidays', <Calendar className="w-4 h-4" />)}
          </div>

          {/* HR Management (Only in Admin view) */}
          {portalMode === 'admin' && (
            <div className="space-y-1">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-slate-200 mx-1" />
              ) : (
                <p className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
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
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 flex justify-center text-slate-400 group-hover:text-slate-700">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>Employees</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        openSections.people ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openSections.people && (
                    <div className="ml-5 pl-3 space-y-0.5 border-l border-slate-200 my-1">
                      <button
                        onClick={() => handleNav('employees')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          activeModule === 'employees'
                            ? 'text-emerald-700 font-bold bg-emerald-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Directory
                      </button>
                      <button
                        onClick={() => handleNav('organization', 'departments')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          activeModule === 'organization' && activeSubTab === 'departments'
                            ? 'text-emerald-700 font-bold bg-emerald-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
              {navItem('reports', 'Reports & Analytics', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* Company section */}
          {portalMode === 'admin' ? (
            <div className="space-y-1">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-slate-200 mx-1" />
              ) : (
                <p className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                  Organization
                </p>
              )}
              {navItem('organization', 'About Organisation', <Building2 className="w-4 h-4" />, undefined, 'about')}
              {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
              {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
              {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
            </div>
          ) : (
            <div className="space-y-1">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-slate-200 mx-1" />
              ) : (
                <p className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                  Organization
                </p>
              )}
              {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
              {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
            </div>
          )}
        </div>

        {/* Footer: User profile & Logout */}
        <div
          className={`border-t border-slate-200/80 bg-slate-50/70 ${
            effectiveCollapsed ? 'p-2' : 'p-3'
          }`}
        >
          {effectiveCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs cursor-pointer overflow-hidden border border-emerald-200"
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
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white transition-all shadow-2xs border border-transparent hover:border-slate-200/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden border border-emerald-200">
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
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.firstName
                        ? `${user.firstName} ${user.lastName || ''}`.trim()
                        : user.email || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      <span>{portalMode === 'admin' ? 'Administrator' : (user as any).designationTitle || 'Staff Employee'}</span>
                      <span className="opacity-60">•</span>
                      <span className="text-emerald-600 font-semibold">{workStatus}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 px-1 text-[10px] text-slate-400 flex justify-between items-center">
                <span className="truncate max-w-[125px] font-medium text-slate-600" title={displayCompanyName}>{displayCompanyName}</span>
                <span className="text-emerald-600 font-semibold">by MyOwnHRMS</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
