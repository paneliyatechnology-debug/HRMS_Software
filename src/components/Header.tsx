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
  Play,
  Pause,
  Square,
  Shield,
  Search,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllEmployeeActivities } from '../lib/activityTracker';
import {
  checkEmployeePunchEligibility,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  formatSecondsToHMS,
  formatSecondsToWords,
} from '../lib/attendanceService';

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

  // Live Punch State in Header
  const activeEmpId = user.employeeId || user.id || '';
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(activeEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');

  useEffect(() => {
    const updateHeaderTimer = () => {
      const eligibility = checkEmployeePunchEligibility(activeEmpId);
      setPunchState(eligibility);
      if (eligibility.record) {
        const active = getLiveActiveSeconds(eligibility.record);
        setLiveWorkedHMS(formatSecondsToHMS(active));
      } else {
        setLiveWorkedHMS('00:00:00');
      }
    };

    updateHeaderTimer();
    const interval = setInterval(updateHeaderTimer, 1000);
    window.addEventListener('hrms_attendance_updated', updateHeaderTimer);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hrms_attendance_updated', updateHeaderTimer);
    };
  }, [activeEmpId]);

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

  const roleBadge =
    user.role === 'SUPER_ADMIN'
      ? 'Owner / Super Admin'
      : user.role === 'HR_ADMIN'
      ? 'HR Admin'
      : user.role === 'FINANCE_ADMIN'
      ? 'Finance Admin'
      : 'Team Member';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] backdrop-blur-md">
      {/* Left: Mobile Toggle & Brand / Org */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Jibble Brand & Workspace Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 tracking-tight leading-none block">
                Paneliya HRMS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[10px] tracking-wide border border-indigo-200/60 uppercase">
                Jibble Engine
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 hidden sm:flex leading-none mt-1">
              <span className="font-semibold text-slate-600">Paneliya Technology Inc.</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live Cloud
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Live Web Punch Widget, Alerts, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Inactive Staff Real-time Alert (Admin only) */}
        {portalMode === 'admin' && idleStaffCount > 0 && (
          <div
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-700 font-bold text-xs shadow-xs animate-pulse"
            title="Employees inactive: No mouse/keyboard activity detected for more than 5 minutes"
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{idleStaffCount} Staff Idle (&gt;5m)</span>
          </div>
        )}

        {/* JIBBLE LIVE HEADER PUNCH CLOCK WIDGET */}
        {punchState.status === 'working' ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold font-mono text-emerald-800 tracking-tight">
              {liveWorkedHMS}
            </span>
            <button
              onClick={onOpenClockModal}
              className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
            >
              <span>Punch</span>
            </button>
          </div>
        ) : punchState.status === 'on_break' ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-800">On Break</span>
            <button
              onClick={onOpenClockModal}
              className="ml-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs"
            >
              Resume
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenClockModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all active:scale-98"
            title="Start your shift now"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Clock In</span>
          </button>
        )}

        {/* Quick Add Employee (Admin only) */}
        {portalMode === 'admin' && (
          <button
            onClick={onOpenAddEmployeeModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs active:scale-98"
            title="Add New Employee"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Add Member</span>
          </button>
        )}

        {/* Team Chat Quick Access */}
        {onOpenChat && (
          <button
            id="btn-header-open-chat"
            onClick={onOpenChat}
            className="relative w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors border border-transparent hover:border-slate-200"
            title="Open Team Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors border border-transparent hover:border-slate-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Notifications
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  All Synced
                </span>
              </div>
              <div className="py-3 text-xs text-slate-600 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800">
                    {portalMode === 'admin'
                      ? `${pendingLeavesCount} leave request(s) awaiting review.`
                      : 'Attendance punch is synchronized with central cloud gateway.'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Real-time update</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.firstName?.[0] || 'K'}{user.lastName?.[0] || 'S'}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                {roleBadge}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email || 'keyursangani1210@gmail.com'}
                </p>
                <div className="mt-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                    {roleBadge}
                  </span>
                </div>
              </div>

              <div className="py-1">
                {onOpenProfile && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Timesheet & Profile
                  </button>
                )}

                {onNavigateSettings && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigateSettings();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Workspace Settings
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
