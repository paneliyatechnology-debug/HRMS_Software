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
  CheckSquare,
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
  onOpenProfile?: () => void;
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
  onOpenProfile,
}) => {
  const { user } = useAuth();
  const resigned = Boolean(user?.resigned);
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

  const renderProfileNavItem = () => {
    return navItem('profile', 'My Profile', <User className="w-4 h-4" />);
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
      if (subTab) {
        isActive = activeModule === 'organization' && activeSubTab === subTab;
      } else {
        isActive = activeModule === 'organization';
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
          className={`w-full relative flex items-center justify-center h-10 rounded-[10px] transition-all duration-200 cursor-pointer group active:scale-95 ${isActive
            ? 'bg-[#1b4332] text-white shadow-xs'
            : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332] hover:scale-105'
            }`}
        >
          <span className={`w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#6c757d] group-hover:text-[#2d6a4f]'}`}>
            {icon}
          </span>
          {badge && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#52b788] ring-2 ring-white animate-pulse" />
          )}
        </button>
      );
    }

    return (
      <button
        key={id}
        id={`nav-item-${id}`}
        onClick={() => handleNav(id, subTab)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 cursor-pointer group active:scale-[0.98] ${isActive
          ? 'bg-[#1b4332] text-white font-bold shadow-xs translate-x-0.5'
          : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332] hover:translate-x-1 font-medium'
          }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-5 flex justify-center transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#6c757d] group-hover:text-[#2d6a4f]'}`}>
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:relative top-0 left-0 bottom-0 z-50 h-screen lg:h-full w-[280px] max-w-[85vw] ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-[245px]'
          } bg-white text-[#212529] flex flex-col shrink-0 select-none transition-all duration-200 ease-in-out border-r border-[#e9ecef] shadow-xs ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand Header */}
        <div
          className={`relative h-[62px] sm:h-[66px] border-b border-[#e9ecef] shrink-0 bg-white ${effectiveCollapsed
            ? 'px-2 flex items-center justify-center'
            : 'px-3 flex items-center justify-between'
            }`}
        >
          {effectiveCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                id="btn-sidebar-logo-expand"
                onClick={toggleCollapse}
                className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#52b788] to-[#2d6a4f] flex items-center justify-center font-black text-white text-xl shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer overflow-hidden"
                title={`Expand sidebar — ${displayCompanyName}`}
              >
                {companyLogo ? (
                  <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-1" />
                ) : (
                  companyInitial
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#52b788] to-[#2d6a4f] flex items-center justify-center font-black text-white text-xl shadow-md shrink-0 overflow-hidden">
                  {companyLogo ? (
                    <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-1" />
                  ) : (
                    companyInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <b className="text-[14px] sm:text-[15px] tracking-[0.2px] text-[#212529] block leading-tight font-semibold truncate" title={displayCompanyName}>
                    {displayCompanyName}
                  </b>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Desktop Collapse Button */}
                <button
                  id="btn-sidebar-toggle-collapse"
                  onClick={toggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-[#343a40] hover:text-[#212529] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                  title="Collapse sidebar (icons only)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#343a40] hover:text-[#212529] hover:bg-[#f8f9fa] lg:hidden cursor-pointer"
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
          className={`flex-1 overflow-y-auto ${effectiveCollapsed ? 'px-2' : 'px-2.5'
            } py-3 space-y-4 text-sm [scrollbar-width:thin] pb-24 lg:pb-6`}
        >
          {/* Main workspace section */}
          <div className="space-y-0.5">
            {!effectiveCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold text-[#343a40] uppercase tracking-[1.2px]">
                {portalMode === 'admin' ? 'Administration' : 'Self-Service'}
              </p>
            )}

            {resigned ? (
              <>
                {navItem('attendance', 'Attendance', <Clock className="w-4 h-4" />)}
                {navItem('payslips', 'My Payslips', <Receipt className="w-4 h-4" />)}
              </>
            ) : (
            <>
            {navItem('dashboard', 'Dashboard', <Home className="w-4 h-4" />)}
            {navItem('attendance', 'Attendance', <Clock className="w-4 h-4" />)}
            {navItem(
              'leaves',
              portalMode === 'admin' ? 'Leave Requests' : 'My Leaves',
              <CalendarOff className="w-4 h-4" />,
              portalMode === 'admin' && pendingLeavesCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#adb5bd] text-white text-[10px] font-bold">
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
                <span className="px-1.5 py-0.2 rounded-full bg-[#2d6a4f] text-white text-[10px] font-bold">
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              ) : undefined
            )}
            {navItem('calendar', 'Calendar & Holidays', <Calendar className="w-4 h-4" />)}
            </>
            )}
          </div>

          {/* HR Management (Only in Admin view) */}
          {!resigned && portalMode === 'admin' && (
            <div className="space-y-0.5">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-[#343a40]/20 mx-1" />
              ) : (
                <p className="px-3 pb-1 text-[10px] font-extrabold text-[#343a40] uppercase tracking-[1.2px] pt-2">
                  Workforce
                </p>
              )}

              {effectiveCollapsed ? (
                <>
                  {navItem('employees', 'Employees Directory', <Users className="w-4 h-4" />)}
                  {navItem('organization', 'Departments', <Layers className="w-4 h-4" />, undefined, 'departments')}
                  {navItem('tasks', 'Tasks', <CheckSquare className="w-4 h-4" />)}
                </>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSection('people')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-[#343a40] hover:bg-[#f8f9fa] hover:text-[#343a40] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 flex justify-center text-[#6c757d] group-hover:text-[#343a40]">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>Employees</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#6c757d] transition-transform ${openSections.people ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {openSections.people && (
                    <div className="ml-5 pl-3 space-y-0.5 border-l-2 border-[#95d5b2] my-1">
                      <button
                        onClick={() => handleNav('employees')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer ${activeModule === 'employees'
                          ? 'text-white font-bold bg-[#2d6a4f]'
                          : 'text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc]'
                          }`}
                      >
                        Directory
                      </button>
                      <button
                        onClick={() => handleNav('organization', 'departments')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer ${activeModule === 'organization' && activeSubTab === 'departments'
                          ? 'text-white font-bold bg-[#2d6a4f]'
                          : 'text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc]'
                          }`}
                      >
                        Departments
                      </button>
                      <button
                        onClick={() => handleNav('organization', 'teams')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer ${activeModule === 'organization' && activeSubTab === 'teams'
                          ? 'text-white font-bold bg-[#2d6a4f]'
                          : 'text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc]'
                          }`}
                      >
                        Teams
                      </button>
                    </div>
                  )}
                </div>
              )}

              {navItem('tasks', 'Tasks & Projects', <CheckSquare className="w-4 h-4" />)}
              {navItem('payroll', 'Payroll & Slips', <CircleDollarSign className="w-4 h-4" />)}
              {navItem('recruitment', 'Recruitment', <UserCheck className="w-4 h-4" />)}
              {navItem('resignations', 'Resignations & Clearance', <LogOut className="w-4 h-4" />)}
              {navItem('reports', 'Reports', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* Company section */}
          {!resigned && (portalMode === 'admin' ? (
            <div className="space-y-0.5">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-[#343a40]/20 mx-1" />
              ) : (
                <p className="px-3 pb-1 text-[10px] font-extrabold text-[#343a40] uppercase tracking-[1.2px] pt-2">
                  Company
                </p>
              )}
              {navItem('organization', 'About Organisation', <Building2 className="w-4 h-4" />, undefined, 'about')}
              {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
              {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
              {renderProfileNavItem()}
              {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
            </div>
          ) : (
            <div className="space-y-0.5">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-[#343a40]/20 mx-1" />
              ) : (
                <p className="px-3 pb-1 text-[10px] font-extrabold text-[#343a40] uppercase tracking-[1.2px] pt-2">
                  Company
                </p>
              )}
              {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
              {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
              {renderProfileNavItem()}
              {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
            </div>
          ))}
        </div>

        {/* Compact Company Brand Footer */}
        <div
          className={`border-t border-[#e9ecef] bg-[#f8f9fa] shrink-0 ${effectiveCollapsed ? 'p-2 flex justify-center' : 'px-3.5 py-2.5'
            }`}
        >
          {effectiveCollapsed ? (
            <div
              className="w-7 h-7 rounded-[6px] bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2] text-[10px] font-bold flex items-center justify-center select-none"
              title={`${displayCompanyName} • by MyOwnHRMS`}
            >
              {companyInitial}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-[10px] leading-tight">
              <span
                className="truncate font-semibold text-[#343a40]"
                title={displayCompanyName}
              >
                {displayCompanyName}
              </span>
              <span className="text-[#2d6a4f] font-bold whitespace-nowrap shrink-0">
                by MyOwnHRMS
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
