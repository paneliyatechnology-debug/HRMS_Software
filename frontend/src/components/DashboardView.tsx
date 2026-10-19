'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronDown,
  MoreVertical,
  Clock,
  PlusCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Employee, LeaveRequest } from '../types/hrms';

interface DashboardViewProps {
  stats: any;
  employees: Employee[];
  leaves: LeaveRequest[];
  onNavigateModule: (moduleName: string) => void;
  onOpenClockModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenAddEmployeeModal: () => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  employees,
  leaves,
  onNavigateModule,
  onOpenClockModal,
  onOpenLeaveModal,
  onOpenAddEmployeeModal,
  onSelectEmployee,
}) => {
  const { user } = useAuth();
  const [selectedMonthHover, setSelectedMonthHover] = useState('May');

  const kpis = stats?.kpiCards || {
    totalEmployees: { value: 36, growth: '+10%', subtext: '10+ Than Last Year' },
    todaysPresent: { count: 20, percentage: '86%', subtext: '86% Present Today' },
    totalExpense: { value: '$1600.10', growth: '-20%', subtext: '-20% Than Last Month' },
    totalPayrolls: { value: '$61520.00', growth: '+15%', subtext: '15+ Than Last Month' },
  };

  const performanceMonths = [
    { name: 'Jan', h1: 30, h2: 20 },
    { name: 'Feb', h1: 45, h2: 30 },
    { name: 'Mar', h1: 40, h2: 25 },
    { name: 'Apr', h1: 55, h2: 35 },
    { name: 'May', h1: 75, h2: 50, active: true, inc: '$2602.02', exp: '$1814.17' },
    { name: 'Jun', h1: 60, h2: 45 },
    { name: 'Jul', h1: 65, h2: 40 },
    { name: 'Aug', h1: 50, h2: 35 },
    { name: 'Sep', h1: 58, h2: 42 },
    { name: 'Oct', h1: 70, h2: 48 },
    { name: 'Nov', h1: 62, h2: 40 },
    { name: 'Dec', h1: 80, h2: 55 },
  ];

  const recentLeaveApps = leaves.length > 0 ? leaves.slice(0, 4) : [
    {
      id: 'lr-1',
      employeeName: 'Adarson Miller',
      employeeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      reason: 'Doctor Appointed',
      status: 'Approved',
    },
    {
      id: 'lr-2',
      employeeName: 'Gregory Patton',
      employeeAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      reason: 'Sickness',
      status: 'Pending',
    },
    {
      id: 'lr-3',
      employeeName: 'Kaden Alvarado',
      employeeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      reason: 'Family Reason',
      status: 'Approved',
    },
    {
      id: 'lr-4',
      employeeName: 'Blake Mejia',
      employeeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      reason: 'Tour',
      status: 'Rejected',
    },
  ];

  const employeeStatusLegend = [
    { label: 'Full-time', count: '24 People', pct: '50%', color: 'bg-blue-600' },
    { label: 'Remote', count: '10 People', pct: '05%', color: 'bg-amber-500' },
    { label: 'Part-time', count: '06 People', pct: '02%', color: 'bg-emerald-500' },
    { label: 'Contractual', count: '01 People', pct: '0.1%', color: 'bg-purple-600' },
    { label: 'Hourly', count: '01 People', pct: '0.1%', color: 'bg-rose-500' },
  ];

  const displayEmployees = employees.length > 0 ? employees.slice(0, 6) : [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Quick Action Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
            Enterprise Management
          </span>
          <h3 className="text-xl font-bold mt-2">Welcome to Paneliya HRMS</h3>
          <p className="text-blue-100 text-xs mt-1 max-w-lg">
            Manage your workforce lifecycle, attendance, payroll, leave requests, and recruiting in real time.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenClockModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-600 font-bold text-xs hover:bg-blue-50 transition shadow-sm active:scale-95"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            Check In / Check Out
          </button>
          <button
            onClick={onOpenLeaveModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 text-white font-bold text-xs transition border border-white/20 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            Apply Leave
          </button>
          <button
            onClick={onOpenAddEmployeeModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 text-white font-bold text-xs transition border border-white/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* 4 TOP KPI CARDS MATCHING MOCKUP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Employee */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>Total Employee</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {kpis.totalEmployees.growth}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {kpis.totalEmployees.value}
            </h3>
          </div>

          {/* Stepped green line graph matching mockup */}
          <div className="mt-4 flex items-center justify-between">
            <svg className="w-20 h-6 text-emerald-500" fill="none" viewBox="0 0 80 24">
              <path
                d="M 2 18 L 16 18 L 16 12 L 32 12 L 32 18 L 48 18 L 48 6 L 64 6 L 64 12 L 78 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[11px] font-medium text-slate-400">
              {kpis.totalEmployees.subtext}
            </span>
          </div>
        </div>

        {/* Card 2: Today's Present */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>Today&apos;s Present</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {kpis.todaysPresent.percentage}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {kpis.todaysPresent.count}
            </h3>
          </div>

          {/* Mini purple bars chart matching mockup */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-end gap-1 h-6">
              <span className="w-1.5 h-2 bg-purple-200 dark:bg-purple-900 rounded-full"></span>
              <span className="w-1.5 h-3.5 bg-purple-300 dark:bg-purple-800 rounded-full"></span>
              <span className="w-1.5 h-5 bg-purple-600 rounded-full"></span>
              <span className="w-1.5 h-3 bg-purple-400 rounded-full"></span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {kpis.todaysPresent.subtext}
            </span>
          </div>
        </div>

        {/* Card 3: Total Expense */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>Total Expense</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              20%
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {kpis.totalExpense.value}
            </h3>
          </div>

          {/* Vertical striped amber bars matching mockup */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-end gap-1 h-5 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-amber-400 rounded-full"
                  style={{ height: `${8 + ((i * 7) % 14)}px` }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {kpis.totalExpense.subtext}
            </span>
          </div>
        </div>

        {/* Card 4: Total Payrolls */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>Total Payrolls</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {kpis.totalPayrolls.growth}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {kpis.totalPayrolls.value}
            </h3>
          </div>

          {/* Blue progress bar matching mockup */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex-1 h-2.5 bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-3/4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 shrink-0">
              {kpis.totalPayrolls.subtext}
            </span>
          </div>
        </div>
      </div>

      {/* MID SECTION: Performance Overview (Left) + Leave Application (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Performance Overview Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Performance Overview
              </h3>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Expense</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer text-xs">
                <span>This Year</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="relative pt-6">
            {/* Tooltip Card for May matching mockup */}
            <div className="absolute top-0 left-[35%] z-20 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xl border border-slate-100 dark:border-slate-700 pointer-events-none transform -translate-x-1/2">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                May 2025
              </p>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">$2602.02</span>
                  <span className="text-emerald-500 font-bold">+10%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">$1814.17</span>
                  <span className="text-emerald-500 font-bold">+20%</span>
                </div>
              </div>
            </div>

            {/* Grid Lines with Percentages */}
            <div className="h-56 flex flex-col justify-between text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              {['500%', '400%', '300%', '200%', '100%', '0%'].map((pct) => (
                <div key={pct} className="flex items-center gap-4 w-full">
                  <span className="w-8 shrink-0">{pct}</span>
                  <div className="flex-1 border-b border-dashed border-slate-100 dark:border-slate-800" />
                </div>
              ))}
            </div>

            {/* Columns matching mockup */}
            <div className="grid grid-cols-12 gap-2 mt-2 px-10">
              {performanceMonths.map((m) => (
                <div
                  key={m.name}
                  onMouseEnter={() => setSelectedMonthHover(m.name)}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="h-44 w-full flex items-end justify-center relative">
                    <div
                      className={`w-6 rounded-t-xl transition-all duration-300 ${
                        m.active || selectedMonthHover === m.name
                          ? 'bg-blue-600 shadow-md shadow-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'
                      }`}
                      style={{ height: `${m.h1}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      m.active || selectedMonthHover === m.name
                        ? 'text-blue-600 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Span 1): Leave Application */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Leave Application
                </h3>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium cursor-pointer">
                <span>This Month</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Leave list matching mockup */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {recentLeaveApps.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={req.employeeName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        {req.employeeName}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        Reason: {req.reason}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-bold ${
                      req.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800'
                        : req.status === 'Pending'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateModule('leaves')}
            className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            View All Leave Requests
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: Employee Status (Left) + Employee List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Employee Status */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Employee Status
              </h3>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <button
              onClick={() => onNavigateModule('employees')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              View All
            </button>
          </div>

          {/* Big metric */}
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">42</span>
              <span className="text-xs font-medium text-slate-400">Total Employee & Staff</span>
            </div>

            {/* Horizontal segmented color bar matching mockup */}
            <div className="flex items-center gap-1.5 mt-3 h-2 w-full rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-1/2 rounded-full" />
              <div className="h-full bg-amber-500 w-1/4 rounded-full" />
              <div className="h-full bg-emerald-500 w-[15%] rounded-full" />
              <div className="h-full bg-purple-600 w-[5%] rounded-full" />
              <div className="h-full bg-rose-500 w-[5%] rounded-full" />
            </div>
          </div>

          {/* Breakdown items with color dots */}
          <div className="mt-6 space-y-3">
            {employeeStatusLegend.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                  <span>{item.count}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 w-8 text-right">
                    {item.pct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (Span 2): Employee List Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Employee List
              </h3>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <button
              onClick={() => onNavigateModule('employees')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              View All
            </button>
          </div>

          {/* Table matching mockup */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-slate-400 font-semibold">
                  <th className="py-2.5 pr-2 w-8">
                    <input type="checkbox" className="rounded text-blue-600" />
                  </th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {displayEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded text-blue-600" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {emp.designationTitle}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {emp.departmentName}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          emp.employmentType === 'Full-time'
                            ? 'text-blue-600 dark:text-blue-400'
                            : emp.employmentType === 'Remote'
                            ? 'text-amber-600 dark:text-amber-400'
                            : emp.employmentType === 'Part-time'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {emp.employmentType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEmployee(emp);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
