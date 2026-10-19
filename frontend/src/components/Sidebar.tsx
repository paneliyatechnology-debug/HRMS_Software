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
  Building2,
  BarChart3,
  Bell,
  FileText,
  Briefcase,
  GraduationCap,
  HardDrive,
  LogOut,
  ShieldCheck,
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
    { id: 'employees', label: 'Employees', icon: Users, permission: 'MANAGE_EMPLOYEES' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'leaves', label: 'Leave', icon: CalendarOff, badge: '5' },
    { id: 'payroll', label: 'Payroll', icon: CreditCard, permission: 'PROCESS_PAYROLL' },
    { id: 'recruitment', label: 'Recruitment', icon: UserCheck, permission: 'MANAGE_RECRUITMENT', badge: '3' },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const supportMenuItems = [
    { id: 'announcements', label: 'Notice Board', icon: Bell },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'assets', label: 'Assets', icon: HardDrive, permission: 'MANAGE_ASSETS' },
    { id: 'resignations', label: 'Exit Management', icon: LogOut },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, permission: 'VIEW_AUDIT_LOGS' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-50 dark:border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            <span className="tracking-tighter flex items-center gap-0.5">
              <span className="inline-block w-1.5 h-4 bg-white rounded-full"></span>
              <span className="inline-block w-1.5 h-2.5 bg-blue-200 rounded-full"></span>
            </span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              HRM
              <span className="text-[10px] uppercase font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </h1>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {/* Main Menu */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Support & Settings */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Support & Settings
            </p>
            <nav className="space-y-1">
              {supportMenuItems.map((item) => {
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Discord / Daily Meeting Card matching mockup */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-100 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60"
                  alt="Avatar"
                />
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Video className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">Daily Standup</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">
              9:30 - 11:00 AM on Discord
            </p>
            <button
              onClick={() => alert('Launching Google Meet / Discord Standup room...')}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-xs shadow-blue-500/20"
            >
              Join Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
