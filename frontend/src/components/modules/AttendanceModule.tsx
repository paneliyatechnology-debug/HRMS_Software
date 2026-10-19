'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  Filter,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types/hrms';
import { api } from '../../lib/api';

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
  const [selectedDate, setSelectedDate] = useState('2026-10-19');
  const [selectedDept, setSelectedDept] = useState('ALL');

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance & Shift Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric punch tracking, working duration, overtime, and monthly attendance calendar
          </p>
        </div>

        <button
          onClick={onOpenPunchModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
        >
          <Clock className="w-4 h-4" /> Punch Check In / Out
        </button>
      </div>

      {/* Attendance Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Present Today</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">20 Employees</p>
          <span className="text-[11px] text-emerald-600 font-bold">95% of active shifts</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Late Arrivals</span>
          <p className="text-2xl font-black text-amber-500 mt-1">2 Employees</p>
          <span className="text-[11px] text-slate-400">Past 09:30 AM grace period</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">On Leave Today</span>
          <p className="text-2xl font-black text-blue-600 mt-1">1 Employee</p>
          <span className="text-[11px] text-slate-400">Approved Sick Leave</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Avg Working Hours</span>
          <p className="text-2xl font-black text-purple-600 mt-1">8.4 Hours</p>
          <span className="text-[11px] text-slate-400">Target: 8.0 hrs/day</span>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" /> Daily Attendance Logs
          </h3>

          <div className="flex items-center gap-3 text-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {rec.employeeName || 'Employee'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{rec.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {rec.checkIn || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {rec.checkOut || 'In Progress'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">
                    {rec.workingHours ? `${rec.workingHours} hrs` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        rec.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-600'
                          : rec.status === 'Late'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{rec.remarks || 'Standard Shift'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
