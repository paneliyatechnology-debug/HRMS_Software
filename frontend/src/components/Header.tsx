'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Globe,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  Shield,
  Briefcase,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../types/hrms';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, onOpenSearch }) => {
  const { user, role, switchRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const availableRoles: { role: Role; label: string; desc: string; icon: any }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full System & Settings Access', icon: Shield },
    { role: 'HR_ADMIN', label: 'HR Admin', desc: 'Employee, Leave, Payroll, Org Management', icon: Users },
    { role: 'MANAGER', label: 'Team Manager', desc: 'Team Attendance & Leave Approvals', icon: Briefcase },
    { role: 'EMPLOYEE', label: 'Employee', desc: 'Self-Service, My Leaves, Payslips', icon: UserCheck },
    { role: 'RECRUITER', label: 'Recruiter', desc: 'Jobs, Candidate Pipeline, ATS', icon: Users },
    { role: 'FINANCE_ADMIN', label: 'Finance Admin', desc: 'Payroll Runs, Payslips, Tax Slabs', icon: Briefcase },
  ];

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Greeting & Search */}
      <div className="flex items-center gap-6">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hello {user.firstName}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Welcome back to your Paneliya HRMS workspace
          </p>
        </div>

        {/* Search input matching mockup */}
        <div
          onClick={onOpenSearch}
          className="relative cursor-pointer hidden md:flex items-center"
        >
          <div className="flex items-center gap-2 px-3.5 py-2 w-72 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Search here ...</span>
            <kbd className="ml-auto text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-400 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Language selector */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>English</span>
        </div>

        {/* Messages */}
        <button
          onClick={() => alert('No new instant messages.')}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          title="Messages"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h4>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-slate-700/50 hover:bg-blue-50 transition-colors">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Leave Approved</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Doctor appointed leave for Oct 21 approved</p>
                  <span className="text-[9px] text-slate-400">10m ago</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 transition-colors">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Payroll Generated</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">October payroll run is ready for audit review</p>
                  <span className="text-[9px] text-slate-400">1h ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="User"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 leading-none">
                {role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Role Switcher Dropdown */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role (Demo RBAC)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Test and preview all role views instantly:
                </p>
              </div>

              <div className="space-y-1">
                {availableRoles.map((r) => {
                  const isCurrent = r.role === role;
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{r.label}</span>
                          {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
