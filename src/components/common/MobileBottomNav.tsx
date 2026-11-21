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
  Calendar,
  Users,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  onOpenClockModal: () => void;
  onOpenSidebar: () => void;
  portalMode?: 'employee' | 'admin' | 'hr';
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
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#343a40] px-2 py-1 flex items-center justify-around lg:hidden shadow-[0_-4px_24px_rgba(6,45,31,0.08)] pb-[calc(0.4rem+env(safe-area-inset-bottom))] select-none"
    >
      {/* 1. Dashboard Tab */}
      <button
        id="btn-mobile-nav-dashboard"
        type="button"
        onClick={() => setActiveModule('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] cursor-pointer ${activeModule === 'dashboard'
          ? 'text-[#6c757d] font-bold'
          : 'text-[#343a40] hover:text-[#212529]'
          }`}
      >
        <div className={`p-1 rounded-lg ${activeModule === 'dashboard' ? 'bg-[#f8f9fa]' : ''}`}>
          <Home className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Home</span>
      </button>

      {portalMode !== 'hr' && (
      <>
      {/* 2. Attendance Tab */}
      <button
        id="btn-mobile-nav-attendance"
        type="button"
        onClick={() => setActiveModule('attendance')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] cursor-pointer ${activeModule === 'attendance'
          ? 'text-[#6c757d] font-bold'
          : 'text-[#343a40] hover:text-[#212529]'
          }`}
      >
        <div className={`p-1 rounded-lg ${activeModule === 'attendance' ? 'bg-[#f8f9fa]' : ''}`}>
          <Clock className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Tracker</span>
      </button>

      {/* 3. Center Elevated Quick Button (Punch for Employee, Staff for Admin) */}
      <div className="relative -mt-5 flex flex-col items-center">
        {portalMode === 'admin' ? (
          <button
            id="btn-mobile-nav-center-staff"
            type="button"
            onClick={() => setActiveModule('employees')}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#343a40] via-[#6c757d] to-[#adb5bd] text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-700/35 active:scale-90 transition-transform cursor-pointer border-4 border-white"
            title="Manage Employees"
          >
            <Users className="w-5 h-5" />
          </button>
        ) : (
          <button
            id="btn-mobile-nav-center-punch"
            type="button"
            onClick={onOpenClockModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#343a40] via-[#6c757d] to-[#adb5bd] text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-700/35 active:scale-90 transition-transform cursor-pointer border-4 border-white"
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
        <span className="text-[10px] font-extrabold text-[#343a40] tracking-tight mt-0.5">
          {portalMode === 'admin'
            ? 'Staff'
            : punchStatus === 'working'
              ? 'Out'
              : punchStatus === 'on_break'
                ? 'Break'
                : 'Punch'}
        </span>
      </div>

      {/* 4. Leaves / Requests Tab */}
      <button
        id="btn-mobile-nav-leaves"
        type="button"
        onClick={() => setActiveModule('leaves')}
        className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] cursor-pointer ${activeModule === 'leaves'
          ? 'text-[#6c757d] font-bold'
          : 'text-[#343a40] hover:text-[#212529]'
          }`}
      >
        <div className={`p-1 rounded-lg relative ${activeModule === 'leaves' ? 'bg-[#f8f9fa]' : ''}`}>
          <CalendarOff className="w-5 h-5 stroke-[2.2]" />
          {portalMode === 'admin' && pendingLeavesCount > 0 && (
            <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#adb5bd] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
              {pendingLeavesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Leaves</span>
      </button>
      </>
      )}

      {/* 5. More / Menu Drawer Trigger */}
      <button
        id="btn-mobile-nav-more"
        type="button"
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] text-[#343a40] hover:text-[#212529] active:scale-95 cursor-pointer"
      >
        <div className="p-1 rounded-lg relative">
          <Menu className="w-5 h-5 stroke-[2.2]" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#adb5bd] ring-2 ring-white" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">More</span>
      </button>
    </nav>
  );
};
