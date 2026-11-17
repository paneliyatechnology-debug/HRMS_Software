'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UserPlus,
  Building2,
  MessageSquare,
  AlertTriangle,
  Smartphone,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkSession } from '../context/WorkSessionContext';
import { LiveClock } from './common/LiveClock';
import { getAllCompanies } from '../lib/companyService';
import { checkEmployeePunchEligibility } from '../lib/attendanceService';
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
  pendingLeavesCount?: number;
  unreadChatCount?: number;
  company?: any;
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
  pendingLeavesCount = 0,
  unreadChatCount = 0,
  company,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  // Dynamic Check In / Check Out Status from unified Work Session Context
  const { status: punchStatus } = useWorkSession();

  const displayCompanyName = companyInfo.name || user?.companyName || 'My Organization';
  const companyInitial = (displayCompanyName[0] || 'O').toUpperCase();
  const companyLogo = companyInfo.logoUrl;

  return (
    <header className="h-[58px] sm:h-[66px] bg-white border-b-2 border-[#064e3b] px-2.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Mobile Toggle, Brand Logo & Live Clock Widget */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 sm:p-2 rounded-[9px] text-[#4e6a5d] hover:text-[#0d271d] hover:bg-[#ecfdf5] lg:hidden transition-colors cursor-pointer shrink-0"
          title="Toggle navigation drawer"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden min-w-0 max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-none">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-tr from-[#10b981] to-[#059669] flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0 overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-0.5" />
            ) : (
              companyInitial
            )}
          </div>
          <div className="min-w-0 hidden min-[340px]:block">
            <span className="font-extrabold text-xs text-[#0d271d] tracking-tight block truncate leading-tight">
              {displayCompanyName}
            </span>
            <span className="text-[9px] text-[#059669] font-medium block leading-none opacity-90 truncate">
              by MyOwnHRMS
            </span>
          </div>
        </div>

        {/* Live Digital Clock Widget (Placed on Top Left) */}
        <div className="hidden sm:flex items-center shrink-0">
          <LiveClock showIndicator={false} onClick={portalMode !== 'admin' ? onOpenClockModal : undefined} />
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Shortcut Action Buttons (Transferred from Employee Dashboard Banner) */}
        {portalMode !== 'admin' && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              id="btn-header-apply-leave"
              onClick={onOpenLeaveModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-white hover:bg-[#ecfdf5] active:scale-95 text-[#065f46] font-semibold text-xs border border-[#a7f3d0] shadow-2xs transition-all cursor-pointer shrink-0"
              title="Apply Leave"
            >
              <Calendar className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="hidden md:inline">Apply Leave</span>
            </button>

            <button
              id="btn-header-payslips"
              onClick={() => onNavigateModule?.('payslips')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-white hover:bg-[#ecfdf5] active:scale-95 text-[#065f46] font-semibold text-xs border border-[#a7f3d0] shadow-2xs transition-all cursor-pointer shrink-0"
              title="My Payslips"
            >
              <Receipt className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="hidden md:inline">My Payslips</span>
            </button>

            <button
              id="btn-header-chat"
              onClick={() => (onOpenChat ? onOpenChat() : onNavigateModule?.('chat'))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-white hover:bg-[#ecfdf5] active:scale-95 text-[#065f46] font-semibold text-xs border border-[#a7f3d0] shadow-2xs transition-all cursor-pointer shrink-0"
              title="Team Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="hidden md:inline">Team Chat</span>
            </button>

            {onOpenProfile && (
              <button
                id="btn-header-profile"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-white hover:bg-[#ecfdf5] active:scale-95 text-[#065f46] font-semibold text-xs border border-[#a7f3d0] shadow-2xs transition-all cursor-pointer shrink-0"
                title="My Profile"
              >
                <User className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span className="hidden md:inline">My Profile</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Dynamic Check In / Check Out Button (Employees only - commented out for admin) */}
        {portalMode !== 'admin' && (
          <button
            id="btn-header-punch-toggle"
            onClick={onOpenClockModal}
            className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-[9px] text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 border ${
              punchStatus === 'working' || punchStatus === 'on_break'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                : 'bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'
            }`}
            title={
              punchStatus === 'working' || punchStatus === 'on_break'
                ? 'Currently checked in. Click to Check Out'
                : punchStatus === 'completed'
                ? 'Previous session checked out. Click to Check In again'
                : 'Click to Check In for today'
            }
          >
            {punchStatus === 'working' || punchStatus === 'on_break' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="hidden min-[480px]:inline">Check Out</span>
              </>
            ) : punchStatus === 'completed' ? (
              <>
                <Clock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span className="hidden min-[480px]:inline">Check In</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span className="hidden min-[480px]:inline">Check In</span>
              </>
            )}
          </button>
        )}

        {/* User Profile Dropdown */}
        <div ref={profileMenuRef} className="relative shrink-0">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-[10px] hover:bg-[#ecfdf5] transition-colors cursor-pointer shrink-0"
          >
            <div className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-full bg-[#dcfce7] text-[#065f46] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-[#a7f3d0] overflow-hidden">
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
              <span className="text-xs font-bold text-[#0d271d] leading-tight block truncate">
                {user.firstName || 'User'} {user.lastName || ''}
              </span>
              <span className="text-[10px] text-[#4e6a5d] leading-none block truncate">
                {portalMode === 'admin' ? 'Administrator' : 'Employee'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#4e6a5d] shrink-0" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-[13px] bg-white border border-[#d8ebd9] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-[#edf6f0] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#065f46] font-bold text-xs flex items-center justify-center shrink-0 border border-[#a7f3d0] overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <>{user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}</>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0d271d] truncate">
                    {user.firstName || 'User'} {user.lastName || ''}
                  </p>
                  <p className="text-[11px] text-[#4e6a5d] truncate">
                    {user.email || ''}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-[10px] font-bold">
                    {workStatus}
                  </span>
                </div>
              </div>

              {onOpenProfile && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#0d271d] hover:bg-[#ecfdf5] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#4e6a5d]" />
                  My Profile
                </button>
              )}

              {onNavigateSettings && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigateSettings();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#0d271d] hover:bg-[#ecfdf5] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#4e6a5d]" />
                  Settings
                </button>
              )}

              {onOpenMobileModal && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenMobileModal();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#0d271d] hover:bg-[#ecfdf5] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Mobile & Multi-Device
                </button>
              )}

              <div className="border-t border-[#edf6f0] my-1" />

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
