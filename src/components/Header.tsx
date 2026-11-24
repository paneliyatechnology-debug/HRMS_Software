'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Clock,
  Calendar,
  CalendarCheck,
  UserPlus,
  Building2,
  MessageSquare,
  AlertTriangle,
  Smartphone,
  Receipt,
  Lock,
  Home,
  Users,
  CalendarOff,
  CircleDollarSign,
  Award,
  BarChart3,
  UserCheck,
  Sparkles,
  Briefcase,
  FolderLock,
  ShieldCheck,
  FileText,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWorkSession } from '../context/WorkSessionContext';
import { LiveClock } from './common/LiveClock';
import { getAllCompanies } from '../lib/companyService';
import { checkEmployeePunchEligibility } from '../lib/attendanceService';
import { isModuleAllowedForUser, canUserPunch } from '../lib/rolePermissions';
import { api } from '../lib/api';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenClockModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenAddEmployeeModal: () => void;
  onOpenProfile?: () => void;
  onNavigateSettings?: () => void;
  onOpenChat?: () => void;
  onOpenSearchModal?: () => void;
  onOpenMobileModal?: () => void;
  onNavigateModule?: (moduleName: string, subTab?: string) => void;
  onSelectEmployee?: (emp: any) => void;
  employees?: any[];
  portalMode?: 'employee' | 'admin';
  activeModule?: string;
  isAddEmployeeModalOpen?: boolean;
  isLeaveModalOpen?: boolean;
  pendingLeavesCount?: number;
  unreadChatCount?: number;
  company?: any;
  isScrolled?: boolean;
  pageTitle?: string;
  activeSubTab?: string;
  onScrollToTop?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenClockModal,
  onOpenLeaveModal,
  onOpenAddEmployeeModal,
  onOpenProfile,
  onNavigateSettings,
  onOpenChat,
  onOpenSearchModal,
  onOpenMobileModal,
  onNavigateModule,
  onSelectEmployee,
  employees = [],
  portalMode = 'admin',
  activeModule = '',
  isAddEmployeeModalOpen = false,
  isLeaveModalOpen = false,
  pendingLeavesCount = 0,
  unreadChatCount = 0,
  company,
  isScrolled = false,
  pageTitle = '',
  activeSubTab = '',
  onScrollToTop,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const resigned = Boolean(user?.resigned);
  const { notices, dismissNotice, clearNotices, showToast } = useSocket();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (noticeRef.current && !noticeRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

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

  // Dynamic Clock In / Clock Out Status & Actions from unified Work Session Context
  const { status: punchStatus, checkIn, checkOut, actionLoading, punchBlockMessage } = useWorkSession();
  const clockClosed = Boolean(punchBlockMessage) && punchStatus !== 'working' && punchStatus !== 'on_break';

  const handleHeaderPunchClick = () => {
    if (actionLoading || punchStatus === 'on_break') return;
    if (clockClosed) {
      showToast({ title: 'Clock closed', message: punchBlockMessage || 'Clock in is not allowed today.', type: 'warning' });
      return;
    }
    if (punchStatus === 'working') {
      checkOut();
    } else {
      checkIn();
    }
  };

  const displayCompanyName = companyInfo.name || user?.companyName || 'My Organization';
  const companyInitial = (displayCompanyName[0] || 'O').toUpperCase();
  const companyLogo = companyInfo.logoUrl;

  const isDashboard = !activeModule || activeModule === 'dashboard';

  // Resolve page heading and icon for the animated morphing header slot
  const { title: resolvedPageTitle, icon: resolvedPageIcon } = useMemo(() => {
    let icon = <Clock className="w-3.5 h-3.5" />;
    switch (activeModule) {
      case 'dashboard':
        icon = <Home className="w-3.5 h-3.5" />;
        break;
      case 'attendance':
        icon = <Clock className="w-3.5 h-3.5" />;
        break;
      case 'employees':
        icon = <Users className="w-3.5 h-3.5" />;
        break;
      case 'leaves':
      case 'leave':
        icon = <CalendarOff className="w-3.5 h-3.5" />;
        break;
      case 'calendar':
        icon = <Calendar className="w-3.5 h-3.5" />;
        break;
      case 'payroll':
        icon = <CircleDollarSign className="w-3.5 h-3.5" />;
        break;
      case 'payslips':
        icon = <Receipt className="w-3.5 h-3.5" />;
        break;
      case 'organization':
        icon = <Building2 className="w-3.5 h-3.5" />;
        break;
      case 'announcements':
        icon = <Award className="w-3.5 h-3.5" />;
        break;
      case 'chat':
        icon = <MessageSquare className="w-3.5 h-3.5" />;
        break;
      case 'reports':
        icon = <BarChart3 className="w-3.5 h-3.5" />;
        break;
      case 'recruitment':
        icon = <UserCheck className="w-3.5 h-3.5" />;
        break;
      case 'performance':
        icon = <Sparkles className="w-3.5 h-3.5" />;
        break;
      case 'training':
        icon = <Briefcase className="w-3.5 h-3.5" />;
        break;
      case 'documents':
        icon = <FolderLock className="w-3.5 h-3.5" />;
        break;
      case 'assets':
        icon = <ShieldCheck className="w-3.5 h-3.5" />;
        break;
      case 'resignations':
        icon = <LogOut className="w-3.5 h-3.5" />;
        break;
      case 'audit-logs':
        icon = <FileText className="w-3.5 h-3.5" />;
        break;
      case 'settings':
        icon = <Settings className="w-3.5 h-3.5" />;
        break;
      case 'profile':
        icon = <User className="w-3.5 h-3.5" />;
        break;
      default:
        icon = <Layers className="w-3.5 h-3.5" />;
    }

    if (pageTitle && pageTitle.trim()) {
      return { title: pageTitle.trim(), icon };
    }

    const userName = user?.firstName || (portalMode === 'admin' ? 'Admin' : 'Employee');
    switch (activeModule) {
      case 'dashboard':
        return {
          title: `Hello, ${userName}!`,
          icon,
        };
      case 'attendance':
        return { title: 'Attendance', icon };
      case 'employees':
        return { title: 'Employees', icon };
      case 'leaves':
      case 'leave':
        return {
          title: portalMode === 'admin' ? 'Leave Requests' : 'My Leaves',
          icon,
        };
      case 'calendar':
        return { title: 'Calendar & Holidays', icon };
      case 'payroll':
        return { title: 'Payroll', icon };
      case 'payslips':
        return { title: 'My Payslips', icon };
      case 'organization':
        return {
          title:
            activeSubTab === 'departments'
              ? 'Departments & Roles'
              : activeSubTab === 'designations'
                ? 'Designations'
                : 'About Organisation',
          icon,
        };
      case 'announcements':
        return { title: 'Notice Board & Circulars', icon };
      case 'chat':
        return { title: 'Team Chat', icon };
      case 'reports':
        return { title: 'Reports & Analytics', icon };
      case 'recruitment':
        return { title: 'Recruitment', icon };
      case 'performance':
        return { title: 'Performance Reviews', icon };
      case 'training':
        return { title: 'Training Programs', icon };
      case 'documents':
        return { title: 'Company Documents', icon };
      case 'assets':
        return { title: 'Assets', icon };
      case 'resignations':
        return {
          title: portalMode === 'admin' ? 'Resignations & Clearance' : 'My Resignation',
          icon,
        };
      case 'audit-logs':
        return { title: 'Audit Logs', icon };
      case 'settings':
        return { title: 'Settings & Preferences', icon };
      case 'profile':
        return { title: 'My Profile', icon };
      default:
        return {
          title: activeModule ? activeModule.charAt(0).toUpperCase() + activeModule.slice(1) : 'HRMS',
          icon,
        };
    }
  }, [activeModule, activeSubTab, portalMode, user?.firstName, pageTitle]);

  return (
    <header className="h-[58px] sm:h-[66px] bg-white border-b border-[#e9ecef] px-2.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Mobile Toggle, Brand Logo & Live Clock Widget <-> Scrolled Heading Morph */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 sm:p-2 rounded-[9px] text-[#343a40] hover:text-[#212529] hover:bg-[#f8f9fa] lg:hidden transition-colors cursor-pointer shrink-0"
          title="Toggle navigation drawer"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className={`flex items-center gap-2 lg:hidden min-w-0 transition-all duration-300 ${(!isDashboard || isScrolled) ? 'max-w-[32px]' : 'max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-none'}`}>
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-tr from-[#adb5bd] to-[#6c757d] flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0 overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-0.5" />
            ) : (
              companyInitial
            )}
          </div>
          <div className={`min-w-0 ${(!isDashboard || isScrolled) ? 'hidden' : 'hidden min-[340px]:block'}`}>
            <span className="font-semibold text-xs text-[#212529] tracking-tight block truncate leading-tight">
              {displayCompanyName}
            </span>
          </div>
        </div>

        {/* Header Title Slot: Live Clock on Dashboard; Page Heading on All Other Pages */}
        <div className="flex items-center h-10 min-w-0">
          {isDashboard ? (
            /* Dashboard: Always show Live Digital Clock Widget */
            <div className="hidden sm:flex items-center shrink-0">
              <LiveClock showIndicator={false} showTimezone={false} />
            </div>
          ) : (
            /* All Other Pages: Show Page Heading immediately when page is opened */
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={onScrollToTop}
                title="Click to scroll to top"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-[10px] bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#dee2e6] hover:border-[#ced4da] shadow-2xs transition-all active:scale-95 cursor-pointer text-left group"
              >
                <span className="w-6 h-6 rounded-[7px] bg-[#d8f3dc] group-hover:bg-[#b7e4c7] text-[#1b4332] flex items-center justify-center shrink-0 border border-[#b7e4c7] transition-colors">
                  {resolvedPageIcon}
                </span>
                <span className="hrms-header-page-title text-xs sm:text-sm font-semibold tracking-tight text-[#0f172a] truncate max-w-[140px] min-[400px]:max-w-[190px] sm:max-w-[280px] md:max-w-[360px]">
                  {resolvedPageTitle}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Admin Quick Action Buttons in Top Header */}
        {portalMode === 'admin' && (() => {
          const isLeavesActive = activeModule === 'leaves' && !isAddEmployeeModalOpen;
          const isAddStaffActive = isAddEmployeeModalOpen;
          const isHolidaysActive = activeModule === 'calendar' && !isAddEmployeeModalOpen;
          const getBtnCls = (active: boolean) =>
            `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] active:scale-95 font-semibold text-xs border shadow-2xs transition-all cursor-pointer shrink-0 ${active
              ? 'bg-[#1b4332] text-white border-[#1b4332]'
              : 'bg-[#f8f9fa] hover:bg-[#d8f3dc] text-[#343a40] hover:text-[#1b4332] border-[#dee2e6] hover:border-[#95d5b2]'
            }`;
          return (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                id="btn-header-admin-leaves"
                type="button"
                onClick={() => onNavigateModule?.('leaves')}
                className={getBtnCls(isLeavesActive)}
                title="Leave Requests"
              >
                <CalendarCheck className={`w-3.5 h-3.5 shrink-0 ${isLeavesActive ? 'text-white' : 'text-[#2d6a4f]'}`} />
                <span className="hidden md:inline">Leave Requests</span>
                {pendingLeavesCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${isLeavesActive ? 'bg-white/20 text-white' : 'bg-[#2d6a4f] text-white'
                      }`}
                  >
                    {pendingLeavesCount}
                  </span>
                )}
              </button>

              {isModuleAllowedForUser('employees', user) && (
                <button
                  id="btn-header-admin-add-staff"
                  type="button"
                  onClick={onOpenAddEmployeeModal}
                  className={getBtnCls(isAddStaffActive)}
                  title="Add Staff"
                >
                  <UserPlus className={`w-3.5 h-3.5 shrink-0 ${isAddStaffActive ? 'text-white' : 'text-[#2d6a4f]'}`} />
                  <span className="hidden md:inline">Add Staff</span>
                </button>
              )}

              <button
                id="btn-header-admin-holidays"
                type="button"
                onClick={() => onNavigateModule?.('calendar')}
                className={getBtnCls(isHolidaysActive)}
                title="Holidays"
              >
                <Calendar className={`w-3.5 h-3.5 shrink-0 ${isHolidaysActive ? 'text-white' : 'text-[#2d6a4f]'}`} />
                <span className="hidden md:inline">Holidays</span>
              </button>
            </div>
          );
        })()}

        {/* Shortcut Action Buttons (Transferred from Employee Dashboard Banner) */}
        {portalMode !== 'admin' && (() => {
          const isApplyLeaveActive = isLeaveModalOpen;
          const isPayslipsActive = (activeModule === 'payslips' || activeModule === 'payroll') && !isLeaveModalOpen;
          const isChatActive = activeModule === 'chat' && !isLeaveModalOpen;
          const getBtnCls = (active: boolean) =>
            `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] active:scale-95 font-semibold text-xs border shadow-2xs transition-all cursor-pointer shrink-0 ${active
              ? 'bg-[#1b4332] text-white border-[#1b4332]'
              : 'bg-[#f8f9fa] hover:bg-[#d8f3dc] text-[#343a40] hover:text-[#1b4332] border-[#dee2e6] hover:border-[#95d5b2]'
            }`;
          return (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {!resigned && (
                <button
                  id="btn-header-apply-leave"
                  onClick={onOpenLeaveModal}
                  className={getBtnCls(isApplyLeaveActive)}
                  title="Apply Leave"
                >
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${isApplyLeaveActive ? 'text-white' : 'text-[#2d6a4f]'}`} />
                  <span className="hidden md:inline">Apply Leave</span>
                </button>
              )}

              <button
                id="btn-header-payslips"
                onClick={() => onNavigateModule?.('payslips')}
                className={getBtnCls(isPayslipsActive)}
                title="My Payslips"
              >
                <Receipt className={`w-3.5 h-3.5 shrink-0 ${isPayslipsActive ? 'text-white' : 'text-[#2d6a4f]'}`} />
                <span className="hidden md:inline">My Payslips</span>
              </button>

              {!resigned && (
                <button
                  id="btn-header-chat"
                  onClick={() => (onOpenChat ? onOpenChat() : onNavigateModule?.('chat'))}
                  className={getBtnCls(isChatActive)}
                  title="Team Chat"
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isChatActive ? 'text-white' : 'text-[#2d6a4f]'}`} />
                  <span className="hidden md:inline">Team Chat</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Quick Dynamic Clock In / Clock Out Button (Direct Action — No Popup, Blocked on Break) */}
        {canUserPunch(user) && (
          <div className="flex items-center gap-2 min-w-0">
            {clockClosed && (
              <span
                className="hidden sm:inline max-w-[240px] truncate text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1"
                title={punchBlockMessage || ''}
              >
                {punchBlockMessage}
              </span>
            )}
            <button
              id="btn-header-punch-toggle"
              type="button"
              onClick={handleHeaderPunchClick}
              disabled={actionLoading || punchStatus === 'on_break' || clockClosed}
              className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-[9px] text-xs font-semibold shadow-2xs transition-colors shrink-0 border ${punchStatus === 'on_break' || clockClosed
                ? 'bg-amber-50 text-amber-800 border-amber-200 cursor-not-allowed select-none'
                : punchStatus === 'working'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 cursor-pointer disabled:opacity-50'
                  : 'bg-[#2d6a4f] hover:bg-[#1b4332] text-white border-[#2d6a4f] cursor-pointer disabled:opacity-50'
                }`}
              title={
                clockClosed
                  ? punchBlockMessage || 'Clock in is not allowed today.'
                  : punchStatus === 'on_break'
                    ? 'Clock Out is blocked while on break. Please resume work first.'
                    : punchStatus === 'working'
                      ? 'Currently clocked in. Click to Clock Out immediately'
                      : punchStatus === 'completed'
                        ? 'Previous session clocked out. Click to Clock In again'
                        : 'Click to Clock In and start your work timer'
              }
            >
              {clockClosed ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="sm:hidden max-w-[120px] truncate">{punchBlockMessage}</span>
                  <span className="hidden sm:inline">Clock closed</span>
                </>
              ) : punchStatus === 'on_break' ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden min-[480px]:inline">On Break</span>
                </>
              ) : punchStatus === 'working' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="hidden min-[480px]:inline">
                    {actionLoading ? 'Clocking Out...' : 'Clock Out'}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="hidden min-[480px]:inline">
                    {actionLoading ? 'Clocking In...' : 'Clock In'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {!resigned && (
        <div ref={noticeRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative p-2 rounded-[10px] hover:bg-[#f8f9fa] text-[#343a40] cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notices.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2d6a4f] text-white text-[10px] font-bold flex items-center justify-center">
                {notices.length > 9 ? '9+' : notices.length}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[80vw] rounded-2xl border border-[#dee2e6] bg-white shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[#e9ecef] flex items-center justify-between">
                <p className="text-sm font-semibold text-[#212529]">Notifications</p>
                {notices.length > 0 && (
                  <button type="button" onClick={clearNotices} className="text-[11px] font-semibold text-[#2d6a4f] cursor-pointer">Clear</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notices.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-[#6c757d]">No new notifications.</p>
                ) : notices.map((notice) => (
                  <button
                    key={notice.id}
                    type="button"
                    onClick={() => {
                      dismissNotice(notice.id);
                      setNotificationsOpen(false);
                      if (notice.module === 'chat') {
                        onOpenChat ? onOpenChat() : onNavigateModule?.('chat');
                      } else if (notice.module) {
                        onNavigateModule?.(notice.module);
                      }
                    }}
                    className="w-full text-left px-3 py-2.5 border-b border-[#f1f3f5] hover:bg-[#f8f9fa] cursor-pointer"
                  >
                    <p className="text-[13px] font-semibold text-[#212529]">{notice.title}</p>
                    <p className="text-[12px] text-[#495057] line-clamp-2">{notice.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* User Profile Dropdown */}
        <div ref={profileMenuRef} className="relative shrink-0">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-[10px] hover:bg-[#f8f9fa] transition-colors cursor-pointer shrink-0"
          >
            <div className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-full bg-[#d8f3dc] text-[#1b4332] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-[#95d5b2] overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>{user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}</>
              )}
            </div>
            <div className="hidden md:block text-left min-w-0 max-w-[110px] lg:max-w-[140px]">
              <span className="text-xs font-semibold text-[#212529] leading-tight block truncate">
                {user.firstName || 'User'} {user.lastName || ''}
              </span>
              <span className="text-[10px] text-[#343a40] leading-none block truncate">
                {user.role ? (user.role === 'ADMIN' ? 'Administrator' : user.role === 'HR' ? 'HR Manager' : user.role === 'MANAGER' ? 'Manager' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Employee') : (portalMode === 'admin' ? 'Administrator' : 'Employee')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#343a40] shrink-0" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-[13px] bg-white border border-[#e9ecef] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-[#f8f9fa] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f8f9fa] text-[#343a40] font-bold text-xs flex items-center justify-center shrink-0 border border-[#dee2e6] overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <>{user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}</>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212529] truncate">
                    {user.firstName || 'User'} {user.lastName || ''}
                  </p>
                  <p className="text-[11px] text-[#343a40] truncate">
                    {user.email || ''}
                  </p>
                </div>
              </div>

              {onOpenProfile && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#212529] hover:bg-[#f8f9fa] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#343a40]" />
                  My Profile
                </button>
              )}

              {onNavigateSettings && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigateSettings();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#212529] hover:bg-[#f8f9fa] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#343a40]" />
                  Settings
                </button>
              )}

              <div className="border-t border-[#f8f9fa] my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                  router.push('/login');
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#ef4444] hover:bg-[#fee2e2] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#ef4444]" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
