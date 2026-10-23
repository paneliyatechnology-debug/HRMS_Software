'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllEmployeeActivities } from '../lib/activityTracker';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenClockModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenAddEmployeeModal: () => void;
  onOpenProfile?: () => void;
  onNavigateSettings?: () => void;
  onOpenChat?: () => void;
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
  portalMode = 'admin',
  pendingLeavesCount = 0,
  unreadChatCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [idleStaffCount, setIdleStaffCount] = useState<number>(0);

  useEffect(() => {
    const updateIdleCount = () => {
      const activities = getAllEmployeeActivities();
      const count = Object.values(activities).filter((a) => a.isIdle).length;
      setIdleStaffCount(count);
    };
    updateIdleCount();
    const interval = setInterval(updateIdleCount, 2000);
    window.addEventListener('hrms_employee_activity_updated', updateIdleCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hrms_employee_activity_updated', updateIdleCount);
    };
  }, []);

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
        {/* Inactive Staff Real-time Alert (Admin only) */}
        {portalMode === 'admin' && idleStaffCount > 0 && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-700 font-bold text-xs shadow-xs animate-pulse"
            title="Employees inactive: No mouse/keyboard activity detected for more than 5 minutes"
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{idleStaffCount} Staff Idle (&gt;5m)</span>
          </div>
        )}

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

        {/* Team Chat Quick Access */}
        {onOpenChat && (
          <button
            id="btn-header-open-chat"
            onClick={onOpenChat}
            className="relative w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Open Team Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-900 ring-2 ring-white" />
            )}
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
              {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
            </div>
            <span className="hidden md:inline-block text-xs font-medium text-slate-800">
              {user.firstName || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.firstName || 'User'} {user.lastName || ''}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user.email || ''}
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
