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
    <header className="h-18 bg-white border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Hamburger & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Hello {user.firstName || 'John'}!
        </h2>
      </div>

      {/* Center: Search input matching mockup */}
      <div
        onClick={onOpenSearch}
        className="cursor-pointer hidden md:flex items-center mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-2 w-72 lg:w-96 rounded-full bg-slate-50/80 border border-slate-200/60 text-xs text-slate-400 hover:border-slate-300 hover:bg-white transition-all shadow-2xs">
          <span>Search here ...</span>
          <Search className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/70 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>English</span>
        </div>

        {/* Messages */}
        <button
          onClick={() => alert('No new instant messages.')}
          className="w-8 h-8 rounded-full border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors"
          title="Messages"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-8 h-8 rounded-full border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                <span className="text-[10px] font-semibold text-slate-500">Real-Time Sync</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <p className="font-semibold text-slate-800">Leave Request Approved</p>
                  <p className="text-[11px] text-slate-500">Your leave application for upcoming Friday was approved.</p>
                  <span className="text-[9px] text-slate-400">10m ago</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <p className="font-semibold text-slate-800">Payroll Generated</p>
                  <p className="text-[11px] text-slate-500">Monthly payroll run is ready for audit review.</p>
                  <span className="text-[9px] text-slate-400">1h ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200/70 hover:bg-slate-50 transition-all"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="User"
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-slate-800 hidden sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Role selection dropdown */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Switch Role (Testing)
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Current: {role}
                </span>
              </div>

              <div className="py-1 space-y-0.5">
                {availableRoles.map((r) => {
                  const Icon = r.icon;
                  const isCurrent = role === r.role;
                  return (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                        <div>
                          <p className="font-bold leading-tight">{r.label}</p>
                          <p className={`text-[10px] ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>
                            {r.desc}
                          </p>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-white" />}
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
