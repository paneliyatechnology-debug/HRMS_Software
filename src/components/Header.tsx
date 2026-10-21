'use client';

import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Clock,
  Calendar,
  UserPlus,
  CheckCircle2,
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
  onTogglePortal?: (mode: 'employee' | 'admin') => void;
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
  onTogglePortal,
  pendingLeavesCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Mobile Hamburger & App Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs font-black text-sm">
            P
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none block">
              Paneliya HRMS
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:block">
              Workforce & Attendance System
            </span>
          </div>
        </div>
      </div>

      {/* Center: Clean Portal Switcher */}
      <div className="flex items-center">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
          <button
            onClick={() => onTogglePortal && onTogglePortal('employee')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              portalMode === 'employee'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Employee View</span>
            <span className="sm:hidden">Staff</span>
          </button>

          <button
            onClick={() => onTogglePortal && onTogglePortal('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              portalMode === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${portalMode === 'admin' ? 'text-white' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">HR & Admin View</span>
            <span className="sm:hidden">Admin</span>
            {pendingLeavesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {pendingLeavesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right Controls: Quick Actions + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Clock Button */}
        <button
          onClick={onOpenClockModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all active:scale-95"
          title="Punch Attendance"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Clock In / Out</span>
        </button>

        {/* Quick Leave Button */}
        <button
          onClick={onOpenLeaveModal}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-all active:scale-95"
          title="Apply for Leave"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Apply Leave</span>
        </button>

        {/* Quick Add Employee (Admin only) */}
        {portalMode === 'admin' && (
          <button
            onClick={onOpenAddEmployeeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Add New Employee"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Add Employee</span>
          </button>
        )}

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <div className="py-3 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800">
                    {portalMode === 'admin' ? 'Admin Portal Active' : 'Employee Self-Service Active'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {portalMode === 'admin'
                      ? `${pendingLeavesCount} employee leave requests are awaiting your review.`
                      : 'Punch attendance, check leave balance, and download documents.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.firstName?.[0] || 'K'}{user.lastName?.[0] || 'S'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none">
                {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 leading-none">
                {portalMode === 'admin' ? 'HR Administrator' : 'Software Engineer'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
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
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  View My Profile
                </button>
              )}

              {onNavigateSettings && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigateSettings();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Account Settings
                </button>
              )}

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
