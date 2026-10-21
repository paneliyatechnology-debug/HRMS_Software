'use client';

import React, { useState } from 'react';
import {
  Menu,
  Plus,
  CheckSquare,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Clock,
  Calendar,
  UserPlus,
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
  const { user } = useAuth();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Hamburger & Clan.biz Isometric Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Isometric 3D colored cube matching Clan.biz */}
          <div className="w-7 h-7 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
              <path
                d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z"
                fill="#f8fafc"
                stroke="#64748b"
                strokeWidth="1.2"
              />
              <path d="M12 2L21 7.2L12 12.4L3 7.2L12 2Z" fill="#fbbf24" />
              <path d="M3 7.2L12 12.4V22L3 16.8V7.2Z" fill="#ec4899" />
              <path d="M12 12.4L21 7.2V16.8L12 22V12.4Z" fill="#3b82f6" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
              paneliya technolo...
            </span>
          </div>
        </div>
      </div>

      {/* Center: Liquid Metal Portal Switcher */}
      <div className="flex items-center">
        <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/90 shadow-2xs">
          <button
            onClick={() => onTogglePortal && onTogglePortal('employee')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              portalMode === 'employee'
                ? 'liquid-metal-chrome text-slate-900 shadow-xs border border-slate-300 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Employee Self-Service"
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Employee Portal</span>
            <span className="sm:hidden">Employee</span>
          </button>

          <button
            onClick={() => onTogglePortal && onTogglePortal('admin')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              portalMode === 'admin'
                ? 'liquid-metal-indigo text-white shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to HR / Admin Management Portal"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">HR / Admin Portal</span>
            <span className="sm:hidden">HR Admin</span>
            {pendingLeavesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse shadow-xs">
                {pendingLeavesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* + Create Action Button */}
        <div className="relative">
          <button
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg liquid-metal-chrome border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              {portalMode === 'admin' && (
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    onOpenAddEmployeeModal();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  Add Employee
                </button>
              )}
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onOpenClockModal();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Clock In / Out
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onOpenLeaveModal();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Apply Leave
              </button>
            </div>
          )}
        </div>

        {/* Tasks icon with badge */}
        <div className="relative">
          <button
            onClick={() => setTasksModalOpen(!tasksModalOpen)}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors relative"
            title="My Tasks"
          >
            <CheckSquare className="w-4 h-4 text-slate-700" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              1
            </span>
          </button>

          {tasksModalOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Assigned Tasks</span>
                <span className="text-[10px] text-rose-600 bg-rose-50 font-bold px-1.5 py-0.5 rounded">1 Pending</span>
              </div>
              <div className="py-2.5">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800">Complete your profile</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload photo & emergency contact details</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell with green dot */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-slate-500">Live</span>
              </div>
              <div className="py-2 space-y-1.5">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800">
                    {portalMode === 'admin'
                      ? 'Admin Portal Active'
                      : 'Employee Self-Service Active'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {portalMode === 'admin'
                      ? `${pendingLeavesCount} employee leave requests are awaiting your review.`
                      : 'You can punch attendance, view leave balances, and download company documents.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100 overflow-hidden shadow-2xs">
              <span className="text-slate-900 font-black">KS</span>
            </div>
            <span className="hidden md:inline-block text-xs font-bold text-slate-800">
              {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">
                  {user.firstName || 'Keyur'} {user.lastName || 'Sangani'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {user.email || 'keyur.sangani1234@gmail.com'}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      portalMode === 'admin'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {portalMode === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3" />
                        <span>HR & Administrator</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>Employee Mode</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick switch inside profile */}
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onTogglePortal) {
                    onTogglePortal(portalMode === 'admin' ? 'employee' : 'admin');
                  }
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-between transition-colors mb-1"
              >
                <span>Switch to {portalMode === 'admin' ? 'Employee Portal' : 'HR / Admin Portal'}</span>
                <span>➔</span>
              </button>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                My Profile (11 Tabs)
              </button>

              {portalMode === 'admin' && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (onNavigateSettings) onNavigateSettings();
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  HR Settings
                </button>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  window.location.reload();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
