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
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#064e3b] px-2 py-1 flex items-center justify-around lg:hidden shadow-[0_-4px_24px_rgba(6,45,31,0.08)] pb-[calc(0.4rem+env(safe-area-inset-bottom))] select-none"
    >
      {/* 1. Dashboard Tab */}
      <button
        id="btn-mobile-nav-dashboard"
        type="button"
        onClick={() => setActiveModule('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] cursor-pointer ${
          activeModule === 'dashboard'
            ? 'text-[#059669] font-bold'
            : 'text-[#4e6a5d] hover:text-[#0d271d]'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeModule === 'dashboard' ? 'bg-[#ecfdf5]' : ''}`}>
          <Home className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Home</span>
      </button>

      {/* 2. Attendance Tab */}
      <button
        id="btn-mobile-nav-attendance"
        type="button"
        onClick={() => setActiveModule('attendance')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] cursor-pointer ${
          activeModule === 'attendance'
            ? 'text-[#059669] font-bold'
            : 'text-[#4e6a5d] hover:text-[#0d271d]'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeModule === 'attendance' ? 'bg-[#ecfdf5]' : ''}`}>
          <Clock className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Tracker</span>
      </button>

      {/* 3. Center Elevated Quick Punch Button */}
      <div className="relative -mt-5 flex flex-col items-center">
        <button
          id="btn-mobile-nav-center-punch"
          type="button"
          onClick={onOpenClockModal}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10b981] text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-700/35 active:scale-90 transition-transform cursor-pointer border-4 border-white"
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
        <span className="text-[10px] font-extrabold text-[#065f46] tracking-tight mt-0.5">
          {punchStatus === 'working' ? 'Out' : punchStatus === 'on_break' ? 'Break' : 'Punch'}
        </span>
      </div>

      {/* 4. Leaves / Requests Tab */}
      <button
        id="btn-mobile-nav-leaves"
        type="button"
        onClick={() => setActiveModule('leaves')}
        className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] cursor-pointer ${
          activeModule === 'leaves'
            ? 'text-[#059669] font-bold'
            : 'text-[#4e6a5d] hover:text-[#0d271d]'
        }`}
      >
        <div className={`p-1 rounded-lg relative ${activeModule === 'leaves' ? 'bg-[#ecfdf5]' : ''}`}>
          <CalendarOff className="w-5 h-5 stroke-[2.2]" />
          {portalMode === 'admin' && pendingLeavesCount > 0 && (
            <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#f59e0b] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
              {pendingLeavesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">Leaves</span>
      </button>

      {/* 5. More / Menu Drawer Trigger */}
      <button
        id="btn-mobile-nav-more"
        type="button"
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] text-[#4e6a5d] hover:text-[#0d271d] active:scale-95 cursor-pointer"
      >
        <div className="p-1 rounded-lg relative">
          <Menu className="w-5 h-5 stroke-[2.2]" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">More</span>
      </button>
    </nav>
  );
};
