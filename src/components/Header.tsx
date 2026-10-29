'use client';

import React, { useState, useEffect } from 'react';
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
  Search,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiveClock } from './common/LiveClock';
import { getAllCompanies } from '../lib/companyService';

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
  onNavigateModule?: (moduleName: string) => void;
  onSelectEmployee?: (emp: any) => void;
  employees?: any[];
  portalMode?: 'employee' | 'admin';
  pendingLeavesCount?: number;
  unreadChatCount?: number;
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
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  return (
    <header className="h-[62px] sm:h-[66px] bg-white border-b-2 border-[#064e3b] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Mobile Toggle & Brand Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-[9px] text-[#4e6a5d] hover:text-[#0d271d] hover:bg-[#ecfdf5] lg:hidden transition-colors cursor-pointer"
          title="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden min-w-0 max-w-[170px] sm:max-w-none">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-tr from-[#10b981] to-[#059669] flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0 overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt={displayCompanyName} className="w-full h-full object-contain p-0.5" />
            ) : (
              companyInitial
            )}
          </div>
          <div className="min-w-0 hidden min-[360px]:block">
            <span className="font-extrabold text-xs text-[#0d271d] tracking-tight block truncate leading-tight">
              {displayCompanyName}
            </span>
            <span className="text-[9px] text-[#059669] font-medium block leading-none opacity-90">
              by MyOwnHRMS
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Digital Clock Widget */}
      <div className="hidden sm:flex items-center justify-center px-2 min-w-0">
        <LiveClock onClick={onOpenClockModal} />
      </div>

      {/* Right: Actions, Role Pill, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Sleek Global Search Button (Opens Search Modal on click or Ctrl+K) */}
        {onOpenSearchModal && (
          <button
            id="btn-header-search"
            onClick={onOpenSearchModal}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-[9px] text-[#4e6a5d] hover:text-[#0d271d] hover:bg-[#ecfdf5] border border-[#d8ebd9] transition-all shadow-2xs group cursor-pointer"
            title="Search HRMS modules, staff & records (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#059669] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-semibold text-[#4e6a5d] group-hover:text-[#0d271d]">Search...</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-emerald-100 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Mobile & Multi-Device Access Button */}
        {onOpenMobileModal && (
          <button
            id="btn-header-mobile"
            onClick={onOpenMobileModal}
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            title="Open HRMS on Mobile or other devices (Scan QR or direct IP)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Mobile Connect</span>
          </button>
        )}

        {/* Quick Clock Button */}
        <button
          onClick={onOpenClockModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Attendance Punch"
        >
          <Clock className="w-3.5 h-3.5 text-[#059669]" />
          <span>Clock In / Out</span>
        </button>

        {/* Quick Add Employee (Admin only) */}
        {portalMode === 'admin' && (
          <button
            onClick={onOpenAddEmployeeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Add New Employee"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Employee</span>
          </button>
        )}



        {/* Work Status Pill */}
        <div
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[#f2f9f5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold shadow-2xs"
          title="Current Work Availability Status (Configured in Settings > Work & Display)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{workStatus}</span>
        </div>

        {/* Role Pill */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-[10px] bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-bold">
          {portalMode === 'admin' ? 'Admin' : 'Employee'}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-[10px] hover:bg-[#ecfdf5] transition-colors cursor-pointer"
          >
            <div className="w-[34px] h-[34px] rounded-full bg-[#dcfce7] text-[#065f46] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-[#a7f3d0] overflow-hidden">
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
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-[#0d271d] leading-tight block">
                {user.firstName || 'User'} {user.lastName || ''}
              </span>
              <span className="text-[10px] text-[#4e6a5d] leading-none block">
                {portalMode === 'admin' ? 'Administrator' : 'Employee'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#4e6a5d]" />
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
