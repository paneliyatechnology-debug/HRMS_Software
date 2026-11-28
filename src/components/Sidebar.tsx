'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Home,
  Calendar,
  Users,
  Clock,
  ScanFace,
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
  Bell,
} from 'lucide-react';
import { useAuth, isUserAdminRole } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAllCompanies, resolveCompanyBrandAvatar } from '../lib/companyService';
import { api } from '../lib/api';
import { isModuleAllowedForUser, canManageResignations } from '../lib/rolePermissions';

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
  employees?: any[];
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
  employees = [],
  onOpenProfile,
}) => {
  const { user } = useAuth();
  const { unreadNoticesCount } = useSocket();
  const resigned = Boolean(user?.resigned);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
  });

  useEffect(() => {
    const role = String(user?.role || '').toUpperCase();
    if (!role || role === 'SUPER_ADMIN') return;
    let active = true;
    api.getCompanyFeatures()
      .then((res: any) => {
        if (!active) return;
        const data = res?.data || res;
        const isPrem = Boolean(data?.premium);
        const feats = Array.isArray(data?.features) ? (data.features as string[]) : [];
        setHasPremium(isPrem && feats.includes('face_clock'));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user?.role]);

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
            logoUrl:
              backendComp.logoUrl ||
              backendComp.adminAvatarUrl ||
              backendComp.avatarUrl ||
              (backendComp as any).logo,
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

  const displayCompanyName = (
    companyInfo.name ||
    company?.name ||
    user?.companyName ||
    (user as any)?.companyProfile?.name ||
    'My Organization'
  ).replace(/\s+Inc\.?$/i, '').trim();
  const companyInitial = (displayCompanyName[0] || 'O').toUpperCase();
  const companyLogo = resolveCompanyBrandAvatar(
    { ...company, logoUrl: company?.logoUrl || companyInfo.logoUrl },
    user,
    employees
  );

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

  const [hoverFlyout, setHoverFlyout] = useState<{
    key: string;
    label: string;
    top: number;
    left: number;
    subItems?: { id: string; label: string; subTab?: string }[];
  } | null>(null);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelFlyoutClose = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
  };

  const openFlyout = (
    e: React.MouseEvent<HTMLElement>,
    data: { key: string; label: string; subItems?: { id: string; label: string; subTab?: string }[] }
  ) => {
    cancelFlyoutClose();
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverFlyout({
      ...data,
      top: rect.top,
      left: rect.right + 10,
    });
  };

  const scheduleFlyoutClose = () => {
    cancelFlyoutClose();
    flyoutCloseTimer.current = setTimeout(() => {
      setHoverFlyout(null);
    }, 120);
  };

  useEffect(() => {
    if (!effectiveCollapsed) setHoverFlyout(null);
  }, [effectiveCollapsed]);

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
    if (!isModuleAllowedForUser(id, user)) {
      return null;
    }

    let isActive = activeModule === id;
    if (id === 'organization') {
      if (subTab) {
        isActive = activeModule === 'organization' && activeSubTab === subTab;
      } else {
        isActive = activeModule === 'organization';
      }
    }

    const itemKey = subTab ? `${id}-${subTab}` : id;

    if (effectiveCollapsed) {
      return (
        <button
          key={itemKey}
          id={`nav-item-${itemKey}`}
          onClick={() => {
            setHoverFlyout(null);
            handleNav(id, subTab);
          }}
          onMouseEnter={(e) => openFlyout(e, { key: itemKey, label })}
          onMouseLeave={scheduleFlyoutClose}
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
        key={itemKey}
        id={`nav-item-${itemKey}`}
        onClick={() => handleNav(id, subTab)}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] text-[12.5px] sm:text-[13px] transition-colors duration-150 cursor-pointer group active:scale-[0.99] ${isActive
          ? 'bg-[#075B3D] text-white font-bold shadow-xs'
          : 'text-[#495057] hover:bg-slate-100/90 hover:text-[#1b4332] font-medium'
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-4.5 flex justify-center shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-[#6c757d] group-hover:text-[#2d6a4f]'}`}>
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
          className="fixed inset-0 bg-white/45 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:relative top-0 left-0 bottom-0 z-50 lg:z-[110] h-screen lg:h-full w-[260px] max-w-[85vw] ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-[214px]'
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
                className={`w-[38px] h-[38px] rounded-[12px] bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 text-xl shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer overflow-hidden ${companyLogo ? '' : 'p-1'}`}
                title={`Expand sidebar — ${displayCompanyName}`}
              >
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={displayCompanyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-slate-700">{companyInitial}</span>
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className={`w-[38px] h-[38px] rounded-[12px] bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 text-xl shadow-xs shrink-0 overflow-hidden ${companyLogo ? '' : 'p-1'}`}>
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt={displayCompanyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-700">{companyInitial}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {!displayCompanyName || /^(my\s*own\s*hrms|my\s*organization)$/i.test(displayCompanyName.trim()) ? (
                    <img src="/brand-name.png" alt="myown hrms" className="h-5 w-auto object-contain" />
                  ) : (
                    <b className="text-[14px] sm:text-[15px] tracking-[0.2px] text-[#212529] block leading-tight font-semibold truncate" title={displayCompanyName}>
                      {displayCompanyName}
                    </b>
                  )}
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
          className={`flex-1 overflow-y-auto flex flex-col justify-between ${effectiveCollapsed ? 'px-2' : 'px-2.5'
            } py-3 text-sm [scrollbar-width:thin] pb-24 lg:pb-3`}
        >
          <div className="space-y-4">
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
                {navItem('companies', 'All Companies', <Building2 className="w-4 h-4" />)}
                {navItem('plans', 'Plans', <Award className="w-4 h-4" />)}
                {navItem('orders', 'Orders', <Receipt className="w-4 h-4" />)}
                {navItem('support', 'Support Inquiries', <MessageSquare className="w-4 h-4" />)}
                {navItem('attendance', 'Attendance', <Clock className="w-4 h-4" />)}
                {['ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(String(user?.role || '').toUpperCase()) && (
                  effectiveCollapsed ? (
                    <button
                      type="button"
                      aria-label="Face clock"
                      onMouseEnter={(e) => openFlyout(e, { key: 'face-clock', label: 'Face clock' })}
                      onMouseLeave={scheduleFlyoutClose}
                      onClick={() => {
                        setHoverFlyout(null);
                        if (!hasPremium) {
                          setActiveModule('plans');
                          setIsOpen(false);
                          return;
                        }
                        window.location.href = '/face-clock';
                      }}
                      className="w-full relative flex items-center justify-center h-10 rounded-[10px] text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332] hover:scale-105 transition-all duration-200 cursor-pointer group active:scale-95"
                    >
                      <span className="w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 text-[#6c757d] group-hover:text-[#2d6a4f]">
                        <ScanFace className="w-4 h-4" />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasPremium) {
                          setActiveModule('plans');
                          setIsOpen(false);
                          return;
                        }
                        window.location.href = '/face-clock';
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] text-[#495057] hover:bg-slate-100/90 hover:text-[#1b4332] transition-colors duration-150 font-medium cursor-pointer group active:scale-[0.99]"
                    >
                      <span className="w-5 flex justify-center text-[#6c757d] group-hover:text-[#2d6a4f] transition-colors duration-150"><ScanFace className="w-4 h-4" /></span>
                      <span className="truncate">Face clock</span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${hasPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        PRO
                      </span>
                    </button>
                  )
                )}
                {navItem(
                  'leaves',
                  portalMode === 'admin' ? 'Leave Requests' : 'My Leaves',
                  <CalendarOff className="w-4 h-4" />,
                  portalMode === 'admin' && pendingLeavesCount > 0 ? (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        activeModule === 'leaves' ? 'bg-[#74c69d]' : 'bg-[#2d6a4f]'
                      }`}
                    />
                  ) : undefined
                )}
                {navItem('tasks', 'Tasks & Projects', <CheckSquare className="w-4 h-4" />)}
                {navItem('payslips', 'My Payslips', <Receipt className="w-4 h-4" />)}
                {(user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && (
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
                {navItem(
                  'notifications',
                  'Notifications',
                  <Bell className="w-4 h-4" />,
                  unreadNoticesCount > 0 ? (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        activeModule === 'notifications' ? 'bg-[#74c69d]' : 'bg-[#2d6a4f]'
                      }`}
                    />
                  ) : undefined
                )}
              </>
            )}
          </div>

          {/* HR & Workforce Management (Shown to any role with workforce permissions) */}
          {!resigned && (
            isModuleAllowedForUser('employees', user) ||
            isModuleAllowedForUser('organization', user) ||
            isModuleAllowedForUser('payroll', user) ||
            isModuleAllowedForUser('recruitment', user) ||
            (canManageResignations(user) && isModuleAllowedForUser('resignations', user)) ||
            isModuleAllowedForUser('reports', user)
          ) && (
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
                    {isModuleAllowedForUser('employees', user) && isModuleAllowedForUser('organization', user) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHoverFlyout(null);
                          handleNav('employees');
                        }}
                        onMouseEnter={(e) =>
                          openFlyout(e, {
                            key: 'people',
                            label: 'Employees',
                            subItems: [
                              { id: 'employees', label: 'Directory' },
                              { id: 'organization', label: 'Departments', subTab: 'departments' },
                              { id: 'organization', label: 'Teams', subTab: 'teams' },
                            ],
                          })
                        }
                        onMouseLeave={scheduleFlyoutClose}
                        aria-label="Employees"
                        className={`w-full relative flex items-center justify-center h-10 rounded-[10px] transition-all duration-200 cursor-pointer group active:scale-95 ${activeModule === 'employees' ||
                          (activeModule === 'organization' && (activeSubTab === 'departments' || activeSubTab === 'teams'))
                          ? 'bg-[#1b4332] text-white shadow-xs'
                          : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332] hover:scale-105'
                          }`}
                      >
                        <span
                          className={`w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${activeModule === 'employees' ||
                            (activeModule === 'organization' && (activeSubTab === 'departments' || activeSubTab === 'teams'))
                            ? 'text-white'
                            : 'text-[#6c757d] group-hover:text-[#2d6a4f]'
                            }`}
                        >
                          <Users className="w-4 h-4" />
                        </span>
                      </button>
                    ) : (
                      <>
                        {navItem('employees', 'Employees Directory', <Users className="w-4 h-4" />)}
                        {navItem('organization', 'Departments', <Layers className="w-4 h-4" />, undefined, 'departments')}
                        {navItem('organization', 'Teams', <Users className="w-4 h-4" />, undefined, 'teams')}
                      </>
                    )}
                    {navItem('payroll', 'Payroll & Slips', <CircleDollarSign className="w-4 h-4" />)}
                    {navItem('recruitment', 'Recruitment', <UserCheck className="w-4 h-4" />)}
                    {canManageResignations(user) &&
                      navItem('resignations', 'Resignations & Clearance', <LogOut className="w-4 h-4" />)
                    }
                    {navItem('reports', 'Reports', <BarChart3 className="w-4 h-4" />)}
                  </>
                ) : (
                  <div>
                    {/* Both employees & organization allowed (Admin) */}
                    {isModuleAllowedForUser('employees', user) && isModuleAllowedForUser('organization', user) ? (
                      <div>
                        <button
                          onClick={() => toggleSection('people')}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-[#343a40] hover:bg-slate-100/90 hover:text-[#1b4332] transition-colors duration-150 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 flex justify-center text-[#6c757d] group-hover:text-[#2d6a4f] transition-colors duration-150">
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
                              className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors duration-150 cursor-pointer ${activeModule === 'employees'
                                ? 'text-white font-bold bg-[#2d6a4f]'
                                : 'text-[#495057] hover:text-[#1b4332] hover:bg-slate-100/90'
                                }`}
                            >
                              Directory
                            </button>
                            <button
                              onClick={() => handleNav('organization', 'departments')}
                              className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors duration-150 cursor-pointer ${activeModule === 'organization' && activeSubTab === 'departments'
                                ? 'text-white font-bold bg-[#2d6a4f]'
                                : 'text-[#495057] hover:text-[#1b4332] hover:bg-slate-100/90'
                                }`}
                            >
                              Departments
                            </button>
                            <button
                              onClick={() => handleNav('organization', 'teams')}
                              className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors duration-150 cursor-pointer ${activeModule === 'organization' && activeSubTab === 'teams'
                                ? 'text-white font-bold bg-[#2d6a4f]'
                                : 'text-[#495057] hover:text-[#1b4332] hover:bg-slate-100/90'
                                }`}
                            >
                              Teams
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* HR: Employees only */}
                        {isModuleAllowedForUser('employees', user) && (
                          navItem('employees', 'Employees Directory', <Users className="w-4 h-4" />)
                        )}
                        {/* Manager: Departments & Teams only */}
                        {isModuleAllowedForUser('organization', user) && (
                          <>
                            {navItem('organization', 'Departments', <Layers className="w-4 h-4" />, undefined, 'departments')}
                            {navItem('organization', 'Teams', <Users className="w-4 h-4" />, undefined, 'teams')}
                          </>
                        )}
                      </>
                    )}

                    {navItem('payroll', 'Payroll & Slips', <CircleDollarSign className="w-4 h-4" />)}
                    {navItem('recruitment', 'Recruitment', <UserCheck className="w-4 h-4" />)}
                    {canManageResignations(user) &&
                      navItem('resignations', 'Resignations & Clearance', <LogOut className="w-4 h-4" />)
                    }
                    {navItem('reports', 'Reports', <BarChart3 className="w-4 h-4" />)}
                  </div>
                )}
              </div>
            )}

          {/* Company section */}
          {!resigned && (
            <div className="space-y-0.5">
              {effectiveCollapsed ? (
                <div className="my-2 border-t border-[#343a40]/20 mx-1" />
              ) : (
                <p className="px-3 pb-1 text-[10px] font-extrabold text-[#343a40] uppercase tracking-[1.2px] pt-2">
                  Company
                </p>
              )}
              {portalMode === 'employee' && (
                navItem('team-directory', 'Team & Directory', <Users className="w-4 h-4" />)
              )}
              {isModuleAllowedForUser('organization', user) && (
                navItem('organization', 'About Organisation', <Building2 className="w-4 h-4" />, undefined, 'about')
              )}
              {navItem('documents', 'Documents', <FolderLock className="w-4 h-4" />)}
              {navItem('announcements', 'Notice Board', <Award className="w-4 h-4" />)}
              {renderProfileNavItem()}
              {portalMode === 'admin' && navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
            </div>
          )}
          </div>

          {/* Bottom Sidebar Workplace Growth Illustration Card */}
          {!effectiveCollapsed && !resigned && (
            <div className="mt-4 pt-1 shrink-0">
              <div className="relative rounded-[14px] bg-gradient-to-br from-[#e7f5ec] via-[#eef9f2] to-[#d4eedc] border border-[#cde8d6] p-3.5 overflow-hidden shadow-2xs">
                <div className="relative z-10 max-w-[122px]">
                  <p className="text-[13px] font-bold text-[#17221D] leading-tight tracking-tight">
                    Together
                    <br />
                    We Grow
                  </p>
                  <p className="text-[10px] font-medium text-[#4b6357] leading-snug mt-1.5">
                    Building a better workplace together.
                  </p>
                </div>

                {/* Corporate Growth & Teamwork SVG Illustration */}
                <svg
                  viewBox="0 0 110 88"
                  className="pointer-events-none select-none absolute -right-1 -bottom-1 w-[86px] h-[72px]"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="80" cy="24" r="14" fill="#fde68a" fillOpacity="0.45" />
                  <path d="M8 88C24 62 48 56 68 62C84 67 96 58 110 46V88H8Z" fill="#78caa0" fillOpacity="0.45" />
                  <path d="M26 88C46 66 72 64 110 54V88H26Z" fill="#176b4d" fillOpacity="0.88" />
                  <path d="M74 68V35" stroke="#154c1a" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M74 44C63 44 57 35 62 27C69 27 74 35 74 44Z" fill="#2d6a4f" />
                  <path d="M74 39C85 38 92 29 88 21C80 22 74 30 74 39Z" fill="#f59e0b" fillOpacity="0.9" />
                  <path d="M74 52C65 52 60 46 63 40C69 40 74 45 74 52Z" fill="#52b788" />
                  <circle cx="48" cy="40" r="2.2" fill="#43ae7d" fillOpacity="0.65" />
                  <circle cx="94" cy="44" r="1.8" fill="#176b4d" fillOpacity="0.5" />
                </svg>
              </div>
            </div>
          )}
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

      {/* Collapsed Sidebar Animated Hover Popup */}
      {effectiveCollapsed &&
        hoverFlyout &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseEnter={cancelFlyoutClose}
            onMouseLeave={scheduleFlyoutClose}
            style={{ top: hoverFlyout.top, left: hoverFlyout.left }}
            className="fixed z-[90] min-w-[168px] max-w-[220px] rounded-xl bg-white border border-slate-200/90 shadow-[0_14px_32px_-8px_rgba(15,23,42,0.22)] p-1.5 animate-in fade-in slide-in-from-left-2 duration-150"
          >
            <div className="px-2.5 py-1.5 text-xs font-bold text-[#1b4332] flex items-center justify-between gap-2">
              <span>{hoverFlyout.label}</span>
            </div>
            {hoverFlyout.subItems && hoverFlyout.subItems.length > 0 && (
              <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5">
                {hoverFlyout.subItems.map((sub) => {
                  const subActive =
                    sub.subTab
                      ? activeModule === sub.id && activeSubTab === sub.subTab
                      : activeModule === sub.id;
                  return (
                    <button
                      key={`${sub.id}-${sub.subTab || ''}`}
                      type="button"
                      onClick={() => {
                        setHoverFlyout(null);
                        handleNav(sub.id, sub.subTab);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${subActive
                        ? 'bg-[#2d6a4f] text-white font-bold'
                        : 'text-slate-600 hover:bg-[#d8f3dc] hover:text-[#1b4332] font-medium'
                        }`}
                    >
                      <span>{sub.label}</span>
                      <ChevronRight className={`w-3 h-3 ${subActive ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
