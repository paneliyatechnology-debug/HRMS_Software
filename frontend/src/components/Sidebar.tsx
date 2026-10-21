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
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectSubTab?: (subTab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  onSelectSubTab,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: true,
    attendance: true,
    engagement: false,
    finance: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev [section] }));
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
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-slate-100">
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

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm font-medium [scrollbar-width:thin]">
          {/* Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeModule === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4 text-indigo-600" />
            <span>Dashboard</span>
          </button>

          {/* My Calendar */}
          <button
            onClick={() => handleNav('calendar')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeModule === 'calendar'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>My Calendar</span>
          </button>

          {/* People Section */}
          <div>
            <button
              onClick={() => toggleSection('people')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-slate-400" />
                <span>People</span>
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
                  Employees
                </button>
                <button
                  onClick={() => handleNav('organization', 'designations')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Designation
                </button>
                <button
                  onClick={() => handleNav('organization', 'departments')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Department
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
                <span>Attendance</span>
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
                  Attendance Summary
                </button>
                <button
                  onClick={() => handleNav('leaves')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    activeModule === 'leaves'
                      ? 'text-indigo-700 font-bold bg-indigo-50/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Leaves
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
                  Holiday
                </button>
              </div>
            )}
          </div>

          {/* Engagement Section */}
          <div>
            <button
              onClick={() => toggleSection('engagement')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-slate-400" />
                <span>Engagement</span>
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
                  Appreciations & Awards
                </button>
              </div>
            )}
          </div>

          {/* Finance & Payroll Section */}
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
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Payroll
                </button>
                <button
                  onClick={() => handleNav('reports')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Expenses & Invoices
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          {/* Get the app pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-800">Get the app</span>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Report Issue button */}
          <button
            onClick={() => alert('Support ticket portal: paneliya technology OS v6.1.83')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-bold hover:bg-indigo-100/60 transition-colors"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Report Issue</span>
          </button>

          {/* Sub-links row */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">Help</span>
            <span className="hover:text-slate-900 cursor-pointer">E-Guide</span>
            <Settings
              onClick={() => handleNav('settings')}
              className="w-3.5 h-3.5 hover:text-slate-900 cursor-pointer"
            />
          </div>

          {/* Version & Copyright */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium pt-1">
            <span>v6.1.83</span>
            <span>© 2026 Clan</span>
          </div>
        </div>
      </aside>
    </>
  );
};
