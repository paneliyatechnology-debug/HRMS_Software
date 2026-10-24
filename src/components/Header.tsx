'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiveClock } from './common/LiveClock';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenClockModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenAddEmployeeModal: () => void;
  onOpenProfile?: () => void;
  onNavigateSettings?: () => void;
  onOpenChat?: () => void;
  onOpenSearchModal?: () => void;
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

  return (
    <header className="h-[66px] bg-white border-b border-[#e4eaf5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-[9px] text-[#6e7b98] hover:text-[#152345] hover:bg-[#eef2ff] lg:hidden transition-colors"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Live Digital Clock Widget */}
      <div className="flex items-center justify-center px-2">
        <LiveClock onClick={onOpenClockModal} />
      </div>

      {/* Right: Actions, Role Pill, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Sleek Global Search Button (Opens Search Modal on click or Ctrl+K) */}
        {onOpenSearchModal && (
          <button
            id="btn-header-search"
            onClick={onOpenSearchModal}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-[9px] text-[#6e7b98] hover:text-[#152345] hover:bg-[#f4f7fc] border border-[#e4eaf5] transition-all shadow-2xs group cursor-pointer"
            title="Search HRMS modules, staff & records (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#4f5fe8] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-semibold text-[#6e7b98] group-hover:text-[#152345]">Search...</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Quick Clock Button */}
        <button
          onClick={onOpenClockModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-[#eef2ff] hover:bg-[#e0e7ff] text-[#3446bd] text-xs font-semibold shadow-2xs transition-colors"
          title="Attendance Punch"
        >
          <Clock className="w-3.5 h-3.5 text-[#4f5fe8]" />
          <span>Clock In / Out</span>
        </button>

        {/* Quick Add Employee (Admin only) */}
        {portalMode === 'admin' && (
          <button
            onClick={onOpenAddEmployeeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-[#4f5fe8] hover:bg-[#3f4fd6] text-white text-xs font-semibold transition-colors shadow-2xs"
            title="Add New Employee"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Employee</span>
          </button>
        )}

        {/* Team Chat Quick Access */}
        {onOpenChat && (
          <button
            id="btn-header-open-chat"
            onClick={onOpenChat}
            className="relative w-8 h-8 rounded-[9px] text-[#6e7b98] hover:text-[#152345] hover:bg-[#f4f7fc] border border-[#e4eaf5] flex items-center justify-center transition-colors"
            title="Open Team Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#16a779] ring-2 ring-white" />
            )}
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-8 h-8 rounded-[9px] text-[#6e7b98] hover:text-[#152345] hover:bg-[#f4f7fc] border border-[#e4eaf5] flex items-center justify-center transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-[13px] bg-white border border-[#e4eaf5] shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#edf1f8]">
                <span className="text-xs font-bold text-[#152345]">Notifications</span>
                <span className="text-[11px] text-[#6e7b98]">All caught up</span>
              </div>
              <div className="py-2.5 text-xs text-[#6e7b98]">
                {portalMode === 'admin'
                  ? `${pendingLeavesCount} leave request(s) awaiting review.`
                  : 'Your attendance records are synchronized.'}
              </div>
            </div>
          )}
        </div>

        {/* Role Pill from Nexora HTML */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-[10px] bg-[#f6f8ff] border border-[#dce4f7] text-[#3446bd] text-xs font-bold">
          {portalMode === 'admin' ? 'Admin' : 'Employee'}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-[10px] hover:bg-[#f4f7fc] transition-colors"
          >
            <div className="w-[34px] h-[34px] rounded-full bg-[#e8ecff] text-[#3548be] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-[#152345] leading-tight block">
                {user.firstName || 'User'} {user.lastName || ''}
              </span>
              <span className="text-[10px] text-[#6e7b98] leading-none block">
                {portalMode === 'admin' ? 'Administrator' : 'Employee'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6e7b98]" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-[13px] bg-white border border-[#e4eaf5] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-[#edf1f8]">
                <p className="text-xs font-bold text-[#152345] truncate">
                  {user.firstName || 'User'} {user.lastName || ''}
                </p>
                <p className="text-[11px] text-[#6e7b98] truncate">
                  {user.email || ''}
                </p>
              </div>

              {onOpenProfile && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#152345] hover:bg-[#f6f8ff] flex items-center gap-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#6e7b98]" />
                  My Profile
                </button>
              )}

              {onNavigateSettings && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigateSettings();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#152345] hover:bg-[#f6f8ff] flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#6e7b98]" />
                  Settings
                </button>
              )}

              <div className="border-t border-[#edf1f8] my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                  router.push('/login');
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#ed626c] hover:bg-[#fff0f1] flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-[#ed626c]" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
