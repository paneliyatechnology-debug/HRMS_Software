'use client';

import React from 'react';
import {
  Home,
  Clock,
  CalendarOff,
  Menu,
  Play,
  Square,
  Coffee,
  Users,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isModuleAllowedForUser } from '../../lib/rolePermissions';

interface MobileBottomNavProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  onOpenClockModal: () => void;
  onOpenSidebar: () => void;
  portalMode?: 'employee' | 'admin';
  pendingLeavesCount?: number;
  unreadChatCount?: number;
  punchStatus?: 'not_started' | 'working' | 'on_break' | 'completed';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  setActiveModule,
  onOpenClockModal,
  onOpenSidebar,
  portalMode = 'admin',
  pendingLeavesCount = 0,
  unreadChatCount = 0,
  punchStatus = 'not_started',
}) => {
  const { user } = useAuth();
  const resigned = Boolean(user?.resigned);

  const navItemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer touch-manipulation ${
      isActive ? 'text-[#1b4332] font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
    }`;

  const iconWrapClass = (isActive: boolean) =>
    `px-2.5 py-1 rounded-xl transition-colors ${isActive ? 'bg-[#d8f3dc] text-[#1b4332]' : ''}`;

  if (resigned) {
    return (
      <nav
        id="mobile-bottom-nav"
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around lg:hidden shadow-[0_-6px_24px_rgba(15,23,42,0.08)] select-none"
      >
        <button
          type="button"
          onClick={() => setActiveModule('attendance')}
          className={navItemClass(activeModule === 'attendance')}
        >
          <div className={iconWrapClass(activeModule === 'attendance')}>
            <Clock className="w-5 h-5 stroke-[2.1]" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Attendance</span>
        </button>
        <button
          type="button"
          onClick={onOpenClockModal}
          className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white flex items-center justify-center shadow-lg shadow-emerald-900/25 border-4 border-white cursor-pointer active:scale-95 transition-transform"
          title="Attendance Punch Clock"
        >
          {punchStatus === 'working' ? (
            <Square className="w-5 h-5 fill-current" />
          ) : punchStatus === 'on_break' ? (
            <Coffee className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveModule('payslips')}
          className={navItemClass(activeModule === 'payslips')}
        >
          <div className={iconWrapClass(activeModule === 'payslips')}>
            <Receipt className="w-5 h-5 stroke-[2.1]" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Payroll</span>
        </button>
      </nav>
    );
  }

  const isAdminCenter =
    portalMode === 'admin' &&
    (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') &&
    isModuleAllowedForUser('employees', user);

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around lg:hidden shadow-[0_-6px_24px_rgba(15,23,42,0.08)] select-none"
    >
      {/* 1. Home / Dashboard */}
      <button
        id="btn-mobile-nav-dashboard"
        type="button"
        onClick={() => setActiveModule('dashboard')}
        className={navItemClass(activeModule === 'dashboard')}
      >
        <div className={iconWrapClass(activeModule === 'dashboard')}>
          <Home className="w-5 h-5 stroke-[2.1]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Home</span>
      </button>

      {/* 2. Attendance */}
      <button
        id="btn-mobile-nav-attendance"
        type="button"
        onClick={() => setActiveModule('attendance')}
        className={navItemClass(activeModule === 'attendance')}
      >
        <div className={iconWrapClass(activeModule === 'attendance')}>
          <Clock className="w-5 h-5 stroke-[2.1]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Attendance</span>
      </button>

      {/* 3. Center Elevated Action (Employees for Admin, Punch for Staff) */}
      <div className="relative -mt-5 flex flex-col items-center">
        {isAdminCenter ? (
          <button
            id="btn-mobile-nav-center-staff"
            type="button"
            onClick={() => setActiveModule('employees')}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white flex items-center justify-center shadow-lg shadow-emerald-900/25 active:scale-95 transition-transform cursor-pointer border-4 border-white"
            title="Employees"
          >
            <Users className="w-5 h-5" />
          </button>
        ) : (
          <button
            id="btn-mobile-nav-center-punch"
            type="button"
            onClick={onOpenClockModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white flex items-center justify-center shadow-lg shadow-emerald-900/25 active:scale-95 transition-transform cursor-pointer border-4 border-white"
            title="Attendance Punch Clock"
          >
            {punchStatus === 'working' ? (
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping absolute" />
                <Square className="w-5 h-5 fill-current" />
              </div>
            ) : punchStatus === 'on_break' ? (
              <Coffee className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        )}
        <span className="text-[10px] font-bold text-[#1b4332] tracking-tight mt-0.5 leading-none">
          {isAdminCenter
            ? 'Employees'
            : punchStatus === 'working'
              ? 'Clock Out'
              : punchStatus === 'on_break'
                ? 'On Break'
                : 'Punch In'}
        </span>
      </div>

      {/* 4. Leave */}
      <button
        id="btn-mobile-nav-leaves"
        type="button"
        onClick={() => setActiveModule('leaves')}
        className={`relative ${navItemClass(activeModule === 'leaves')}`}
      >
        <div className={`relative ${iconWrapClass(activeModule === 'leaves')}`}>
          <CalendarOff className="w-5 h-5 stroke-[2.1]" />
          {portalMode === 'admin' && pendingLeavesCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {pendingLeavesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Leave</span>
      </button>

      {/* 5. More (Opens Sidebar Drawer) */}
      <button
        id="btn-mobile-nav-more"
        type="button"
        onClick={onOpenSidebar}
        className={navItemClass(false)}
      >
        <div className="relative px-2.5 py-1 rounded-xl">
          <Menu className="w-5 h-5 stroke-[2.1]" />
          {unreadChatCount > 0 && (
            <span className="absolute top-0.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">More</span>
      </button>
    </nav>
  );
};
