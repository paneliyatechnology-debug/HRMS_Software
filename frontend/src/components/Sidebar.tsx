'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  CreditCard,
  UserCheck,
  TrendingUp,
  BarChart3,
  Bell,
  FileText,
  Settings,
  Video,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
}) => {
  const { hasPermission } = useAuth();

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, permission: 'MANAGE_EMPLOYEES', hasSub: true },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, hasSub: true },
    { id: 'leaves', label: 'Leave', icon: CalendarOff, badge: '5' },
    { id: 'payroll', label: 'Payroll', icon: CreditCard, permission: 'PROCESS_PAYROLL' },
    { id: 'recruitment', label: 'Recruitment', icon: UserCheck, permission: 'MANAGE_RECRUITMENT', badge: '3', hasSub: true },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const supportMenuItems = [
    { id: 'announcements', label: 'Notice Board', icon: Bell },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings, hasSub: true },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-60 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 select-none ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100/80">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs text-white font-bold">
            <span className="tracking-tighter flex items-center gap-0.5">
              <span className="inline-block w-1.5 h-3.5 bg-white rounded-full"></span>
              <span className="inline-block w-1.5 h-2 bg-blue-200 rounded-full"></span>
            </span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              HRM
              <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </h1>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-3.5 py-4 space-y-6">
          {/* Main Menu */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            <nav className="space-y-1">
              {mainMenuItems.map((item) => {
                if (item.permission && !hasPermission(item.permission)) return null;
                const isActive = activeModule === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.hasSub && (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Support & Settings */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Support & Settings
            </p>
            <nav className="space-y-1">
              {supportMenuItems.map((item) => {
                const isActive = activeModule === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.hasSub && (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Discord / Daily Meeting Card matching mockup */}
        <div className="p-3.5 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60"
                  alt="Avatar"
                />
              </div>
              <div className="w-6 h-6 rounded-full bg-white text-slate-600 flex items-center justify-center shadow-2xs">
                <Video className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Daily Meeting</h4>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2.5">
              9:30 - 11:00 AM on Discord
            </p>
            <button
              onClick={() => alert('Opening Daily Standup meeting...')}
              className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Join Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
