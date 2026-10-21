'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenClockModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenAddEmployeeModal: () => void;
  onOpenProfile?: () => void;
  onNavigateSettings?: () => void;
  portalMode?: 'employee' | 'admin';
  pendingLeavesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenClockModal,
  onOpenLeaveModal,
  onOpenAddEmployeeModal,
  onOpenProfile,
  onNavigateSettings,
  portalMode = 'admin',
  pendingLeavesCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight leading-none block">
              Paneliya HRMS
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
              Workforce Portal
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2">
        {/* Quick Clock Button */}
        <button
          onClick={onOpenClockModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs transition-colors"
          title="Attendance Punch"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Clock In / Out</span>
        </button>

        {/* Quick Add Employee (Admin only) */}
        {portalMode === 'admin' && (
          <button
            onClick={onOpenAddEmployeeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
            title="Add New Employee"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Employee</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white border border-slate-200 shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[11px] text-slate-400">All caught up</span>
              </div>
              <div className="py-2 text-xs text-slate-600">
                {portalMode === 'admin'
                  ? `${pendingLeavesCount} leave request(s) awaiting review.`
                  : 'Your attendance records are synchronized.'}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
              {user.firstName?.[0] || 'K'}{user.lastName?.[0] || 'S'}
            </div>
            <span className="hidden md:inline-block text-xs font-medium text-slate-800">
              {user.firstName || 'Keyur'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user.email || 'keyur.sangani1234@gmail.com'}
                </p>
              </div>

              {onOpenProfile && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  My Profile
                </button>
              )}

              {onNavigateSettings && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigateSettings();
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Settings
                </button>
              )}

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
