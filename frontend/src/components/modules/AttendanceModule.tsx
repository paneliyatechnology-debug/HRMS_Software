'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Download,
  Star,
  Check,
  AlertCircle,
  X,
  Plane,
  Home,
  ChevronDown,
  Clock,
  User,
  List,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types/hrms';

interface AttendanceModuleProps {
  records: AttendanceRecord[];
  employees: Employee[];
  onOpenPunchModal: () => void;
  onRefresh: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  records,
  employees,
  onOpenPunchModal,
  onRefresh,
}) => {
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Days in October 2026 (1 to 31)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const date = new Date(2026, 9, day); // month 9 is October
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return { day, dayName };
  });

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Employee ID,Name,Month,Year\nEMP-1,Keyur Sangani,October,2026';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'attendance_october_2026.csv');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* Filters Bar matching Clan.biz */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {/* Employee */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1">Employee</label>
          <div className="relative">
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="All">All</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Department */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1">Department</label>
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Admin">Administration</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Designation */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1">Designation</label>
          <div className="relative">
            <select
              value={selectedDesig}
              onChange={(e) => setSelectedDesig(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="All">All</option>
              <option value="AppAdministrator">App Administrator</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Month */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1">Month</label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Year */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1">Year</label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPunchModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>

        {/* View mode toggle icons */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button className="p-1.5 rounded-lg bg-slate-100 text-slate-900" title="Matrix View">
            <List className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800" title="Employee View">
            <User className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800" title="Clock View">
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Attendance Summary Legend Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Attendance Summary</h2>
        </div>

        {/* Status Legend Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
            <span>Day Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Half Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
              !
            </span>
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <X className="w-3.5 h-3.5 text-slate-500 stroke-[3]" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-sky-500" />
            <span>Work From Home</span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border-t border-slate-100 pt-2 [scrollbar-width:thin]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-4 text-left font-bold text-slate-600 sticky left-0 bg-white z-10 w-44">
                  EMPLOYEE
                </th>
                {daysInMonth.map(({ day, dayName }) => (
                  <th key={day} className="py-2 px-2 min-w-8">
                    <div>{day}</div>
                    <div className="text-[9px] text-slate-400 font-semibold">{dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {employees.map((emp) => {
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee column */}
                    <td className="py-3 px-4 text-left sticky left-0 bg-white z-10 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-slate-900 font-bold text-[10px] shrink-0">
                        {emp.firstName[0]}
                        {emp.lastName ? emp.lastName[0] : ''}
                      </div>
                      <span className="truncate">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </td>

                    {/* 31 days cells */}
                    {daysInMonth.map(({ day }) => {
                      const dayStr = String(day).padStart(2, '0');
                      const dateStr = `2026-10-${dayStr}`;
                      const record = records.find(
                        (r) => r.employeeId === emp.id && r.date === dateStr
                      );

                      // Match paneliya.clan.biz state: day 19 is absent (✕) or present (✓ if clocked in), days 1-13 absent
                      let icon = <span className="text-slate-300">-</span>;

                      if (record) {
                        const st = String(record.status).toLowerCase();
                        if (st === 'present') {
                          icon = <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto stroke-[2.5]" />;
                        } else if (st === 'late') {
                          icon = (
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black mx-auto flex items-center justify-center">
                              !
                            </span>
                          );
                        } else if (st === 'absent') {
                          icon = <X className="w-3.5 h-3.5 text-slate-500 mx-auto stroke-[2.5]" />;
                        }
                      } else if (day === 19) {
                        icon = (
                          <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center mx-auto">
                            <X className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
                          </div>
                        );
                      }

                      return (
                        <td key={day} className="py-2.5 px-1 text-center align-middle">
                          {icon}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
