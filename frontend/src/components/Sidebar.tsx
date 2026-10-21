'use client';

import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  Clock,
  Award,
  CircleDollarSign,
  Smartphone,
  LifeBuoy,
  HelpCircle,
  BookOpen,
  Settings,
  ChevronDown,
  X,
  UserCheck,
  Building2,
  GitFork,
  CheckCircle2,
  CalendarOff,
  Shield,
  User,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectSubTab?: (subTab: string) => void;
  portalMode?: 'employee' | 'admin';
  onTogglePortal?: (mode: 'employee' | 'admin') => void;
  pendingLeavesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  onSelectSubTab,
  portalMode = 'admin',
  onTogglePortal,
  pendingLeavesCount = 0,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
    attendance: true,
    engagement: false,
    finance: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNav = (moduleId: string, subTab?: string) => {
    setActiveModule(moduleId);
    if (onSelectSubTab && subTab) {
      onSelectSubTab(subTab);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-250 ease-out select-none ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Close Button */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 relative flex items-center justify-center shrink-0">
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
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              paneliya technolo...
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Identifier Badge */}
        <div className="px-3 pt-3">
          {portalMode === 'employee' ? (
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 leading-none">
                    PORTAL
                  </p>
                  <p className="text-xs font-bold text-slate-900">Employee Self-Service</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                Staff
              </span>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 leading-none">
                    PORTAL
                  </p>
                  <p className="text-xs font-bold text-white">HR & Admin Suite</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-amber-300 border border-white/20">
                Admin
              </span>
            </div>
          )}
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm font-medium [scrollbar-width:thin]">
          {/* ============================================================ */}
          {/* EMPLOYEE PORTAL MENU */}
          {/* ============================================================ */}
          {portalMode === 'employee' ? (
            <>
              {/* My Dashboard */}
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4 text-indigo-600" />
                <span>My Dashboard</span>
              </button>

              {/* My Calendar */}
              <button
                onClick={() => handleNav('calendar')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'calendar'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>My Calendar & Holidays</span>
              </button>

              {/* My Attendance */}
              <button
                onClick={() => handleNav('attendance', 'summary')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'attendance'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>My Attendance & Logs</span>
              </button>

              {/* My Leaves */}
              <button
                onClick={() => handleNav('leaves')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'leaves'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CalendarOff className="w-4 h-4 text-slate-400" />
                <span>My Leaves & Balances</span>
              </button>

              {/* My Documents */}
              <button
                onClick={() => handleNav('documents')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'documents'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>My Documents</span>
              </button>

              {/* Notice Board */}
              <button
                onClick={() => handleNav('announcements')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'announcements'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4 text-slate-400" />
                <span>Notice Board</span>
              </button>
            </>
          ) : (
            /* ============================================================ */
            /* HR / ADMIN PORTAL MENU */
            /* ============================================================ */
            <>
              {/* HR Executive Dashboard */}
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4 text-indigo-600" />
                <span>HR Dashboard</span>
              </button>

              {/* Leave Approvals (With Pending Count Badge!) */}
              <button
                onClick={() => handleNav('leaves')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'leaves'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarOff className="w-4 h-4 text-amber-500" />
                  <span>Leave Approvals</span>
                </div>
                {pendingLeavesCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-2xs">
                    {pendingLeavesCount} Pending
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Cleared
                  </span>
                )}
              </button>

              {/* People Section (Observe All Employees) */}
              <div>
                <button
                  onClick={() => toggleSection('people')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Employees Directory</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openSections.people ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.people && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
                    <button
                      onClick={() => handleNav('employees')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        activeModule === 'employees'
                          ? 'text-indigo-700 font-bold bg-indigo-50/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      All Employees (Observe)
                    </button>
                    <button
                      onClick={() => handleNav('organization', 'designations')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Designations
                    </button>
                    <button
                      onClick={() => handleNav('organization', 'departments')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Departments
                    </button>
                    <button
                      onClick={() => handleNav('organization', 'hierarchy')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Organisation Chart
                    </button>
                  </div>
                )}
              </div>

              {/* Attendance Section */}
              <div>
                <button
                  onClick={() => toggleSection('attendance')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Attendance & Roster</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openSections.attendance ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.attendance && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
                    <button
                      onClick={() => handleNav('attendance', 'summary')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        activeModule === 'attendance'
                          ? 'text-indigo-700 font-bold bg-indigo-50/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Attendance Matrix
                    </button>
                    <button
                      onClick={() => handleNav('attendance', 'roster')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Shift Roster
                    </button>
                    <button
                      onClick={() => handleNav('attendance', 'holidays')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Holiday Calendar
                    </button>
                  </div>
                )}
              </div>

              {/* Finance & Payroll */}
              <div>
                <button
                  onClick={() => toggleSection('finance')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CircleDollarSign className="w-4 h-4 text-slate-400" />
                    <span>Finance & Payroll</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openSections.finance ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.finance && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
                    <button
                      onClick={() => handleNav('payroll')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        activeModule === 'payroll'
                          ? 'text-indigo-700 font-bold bg-indigo-50/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Payroll Processing
                    </button>
                    <button
                      onClick={() => handleNav('reports')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Financial Reports
                    </button>
                  </div>
                )}
              </div>

              {/* Recruitment */}
              <button
                onClick={() => handleNav('recruitment')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'recruitment'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Recruitment & ATS</span>
              </button>

              {/* Notice Board & Engagement */}
              <div>
                <button
                  onClick={() => toggleSection('engagement')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>Company Notice & Awards</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openSections.engagement ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.engagement && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
                    <button
                      onClick={() => handleNav('announcements')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Notice Board
                    </button>
                    <button
                      onClick={() => handleNav('performance')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Performance & Reviews
                    </button>
                  </div>
                )}
              </div>

              {/* Audit Logs */}
              <button
                onClick={() => handleNav('audit-logs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'audit-logs'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Audit Trail & Compliance</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => handleNav('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === 'settings'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>HR Settings</span>
              </button>
            </>
          )}
        </div>

        {/* Sidebar Footer with Quick Switch Portal Action */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50 shrink-0">
          {/* Liquid Metal Portal Switch Button */}
          {portalMode === 'employee' ? (
            <button
              onClick={() => {
                if (onTogglePortal) onTogglePortal('admin');
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl liquid-metal-indigo text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Switch to HR / Admin Portal</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onTogglePortal) onTogglePortal('employee');
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl liquid-metal-chrome border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Switch to Employee Portal</span>
            </button>
          )}

          {/* Sub-links row */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500 font-medium">
            <span
              onClick={() => alert('Support ticket portal: paneliya technology OS v6.1.83')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Help & Support
            </span>
            <span
              onClick={() => alert('Opening employee knowledge base...')}
              className="hover:text-slate-900 cursor-pointer"
            >
              E-Guide
            </span>
            <Settings
              onClick={() => handleNav('settings')}
              className="w-3.5 h-3.5 hover:text-slate-900 cursor-pointer"
            />
          </div>

          {/* Version & Copyright */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
            <span>paneliya v6.2</span>
            <span>Real-time Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};
