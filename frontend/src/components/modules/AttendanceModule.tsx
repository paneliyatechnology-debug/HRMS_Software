'use client';

import React, { useState, useEffect } from 'react';
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
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types/hrms';

interface AttendanceModuleProps {
  records: AttendanceRecord[];
  employees: Employee[];
  initialTab?: 'summary' | 'roster' | 'holidays';
  onOpenPunchModal: () => void;
  onRefresh: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  records,
  employees,
  initialTab = 'summary',
  onOpenPunchModal,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'roster' | 'holidays'>(initialTab);
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Days in October 2026 (1 to 31)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const date = new Date(2026, 9, day); // month 9 is October
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return { day, dayName };
  });

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'summary') {
      csvContent += 'Employee ID,Name,Month,Year\n';
      employees.forEach((e) => {
        csvContent += `${e.employeeCode || e.id},"${e.firstName} ${e.lastName}",${selectedMonth},${selectedYear}\n`;
      });
    } else if (activeTab === 'roster') {
      csvContent += 'Employee ID,Name,Shift Name,Timing,Weekly Off\n';
      employees.forEach((e) => {
        csvContent += `${e.employeeCode || e.id},"${e.firstName} ${e.lastName}","General Corporate Shift","09:00 AM - 06:00 PM","Saturday, Sunday"\n`;
      });
    } else {
      csvContent += 'Date,Holiday Name,Day,Type\n';
      holidaysList.forEach((h) => {
        csvContent += `"${h.date}","${h.name}","${h.day}","${h.type}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const holidaysList = [
    { date: '02-Oct-2026', name: 'Mahatma Gandhi Jayanti', day: 'Friday', type: 'National Holiday' },
    { date: '20-Oct-2026', name: 'Maha Navami', day: 'Tuesday', type: 'Festival' },
    { date: '21-Oct-2026', name: 'Dussehra / Vijaya Dashami', day: 'Wednesday', type: 'Gazetted Holiday' },
    { date: '29-Oct-2026', name: 'Karwa Chauth', day: 'Thursday', type: 'Restricted Holiday' },
    { date: '08-Nov-2026', name: 'Dhanteras', day: 'Sunday', type: 'Festival' },
    { date: '09-Nov-2026', name: 'Diwali / Lakshmi Puja', day: 'Monday', type: 'Public Holiday' },
    { date: '10-Nov-2026', name: 'Gujarati New Year / Bestu Varas', day: 'Tuesday', type: 'Public Holiday' },
    { date: '11-Nov-2026', name: 'Bhai Dooj', day: 'Wednesday', type: 'Restricted Holiday' },
    { date: '25-Dec-2026', name: 'Christmas Day', day: 'Friday', type: 'Public Holiday' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none animate-in fade-in">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor daily clock punches, shifts roster, and company public holiday schedules
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-2xs text-xs font-bold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'summary'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Summary
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shift Roster
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'holidays'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Holiday Schedule
          </button>
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
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters dropdowns for Summary */}
        {activeTab === 'summary' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800 shadow-2xs"
            >
              <option value="October">October 2026</option>
              <option value="November">November 2026</option>
              <option value="December">December 2026</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Attendance Summary (31-day October 2026 Matrix) */}
      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Attendance Summary (October 2026)</h2>
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
                        } else if (day === 2 || day === 20 || day === 21) {
                          icon = <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 mx-auto" />;
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
      )}

      {/* TAB 2: Shift Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shift Roster & Work Schedules</h3>
                <p className="text-xs text-slate-500">Assigned employee shifts and weekly off days</p>
              </div>
            </div>

            <button
              onClick={() => alert('Opening shift assignment dialog')}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition shadow-2xs"
            >
              + Assign Shift
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">EMPLOYEE</th>
                  <th className="py-3 px-4">CURRENT SHIFT</th>
                  <th className="py-3 px-4">TIMING</th>
                  <th className="py-3 px-4">GRACE PERIOD</th>
                  <th className="py-3 px-4">WEEKLY OFF</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-slate-900 font-bold text-[10px]">
                        {emp.firstName[0]}
                        {emp.lastName ? emp.lastName[0] : ''}
                      </div>
                      <div>
                        <p>{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] font-normal text-slate-400">{emp.employeeCode}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      General Corporate Shift
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-700 font-bold">
                      09:00 AM – 06:00 PM
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      15 Minutes (till 09:15 AM)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        Saturday, Sunday
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Editing shift for ${emp.firstName}`)}
                        className="text-xs text-indigo-600 hover:underline font-bold"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Holiday Schedule */}
      {activeTab === 'holidays' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Holiday Calendar (2026)</h3>
                <p className="text-xs text-slate-500">Corporate declared gazetted, national & regional holidays</p>
              </div>
            </div>

            <button
              onClick={() => alert('New holiday added to schedule')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition shadow-2xs"
            >
              + Add Holiday
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">HOLIDAY NAME</th>
                  <th className="py-3 px-4">DAY OF WEEK</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidaysList.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {h.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{h.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {h.day}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {h.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
