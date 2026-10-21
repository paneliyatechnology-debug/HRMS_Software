'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest } from '../../types/hrms';

interface CalendarModuleProps {
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  onOpenLeaveModal?: () => void;
  onOpenClockModal?: () => void;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  attendance,
  leaves,
  onOpenLeaveModal,
  onOpenClockModal,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(21);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Known holidays in October 2026
  const holidays: Record<number, string> = {
    2: 'Gandhi Jayanti',
    20: 'Maha Navami',
    21: 'Dussehra / Vijaya Dashami',
    29: 'Karwa Chauth',
  };

  // Generate calendar grid
  const days = [];

  // Padding from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check attendance for this date
    const attRec = attendance.find((a) => a.date === dateStr);
    // Check leaves for this date
    const leaveRec = leaves.find((l) => dateStr >= l.startDate && dateStr <= l.endDate);
    const holidayName = month === 9 ? holidays[d] : undefined;

    days.push({
      day: d,
      isCurrentMonth: true,
      dateStr,
      isWeekend,
      attendance: attRec,
      leave: leaveRec,
      holiday: holidayName,
    });
  }

  // Padding for next month
  const totalSlots = Math.ceil(days.length / 7) * 7;
  const remainingSlots = totalSlots - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    });
  }

  const selectedDayInfo = days.find((d) => d.isCurrentMonth && d.day === selectedDay);

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View your shifts, attendance history, approved leaves, and public holidays
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenClockModal && (
            <button
              onClick={onOpenClockModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Log Punch</span>
            </button>
          )}

          {onOpenLeaveModal && (
            <button
              onClick={onOpenLeaveModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Apply Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(2026, 9, 1))}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Leave
            </span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-px mt-3 text-center border-b border-slate-100 pb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div
              key={d}
              className={`text-xs font-bold uppercase tracking-wider ${
                i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2">
          {days.map((item, idx) => {
            const isToday = item.isCurrentMonth && item.day === 21;
            const isSelected = item.isCurrentMonth && item.day === selectedDay;

            let badgeClass = 'text-slate-700 hover:bg-slate-50';
            if (!item.isCurrentMonth) badgeClass = 'text-slate-300 bg-slate-50/40 pointer-events-none';
            else if (isSelected) badgeClass = 'ring-2 ring-indigo-500 bg-indigo-50/40 text-indigo-900 font-bold';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (item.isCurrentMonth) setSelectedDay(item.day);
                }}
                className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border border-slate-100 flex flex-col justify-between transition-all cursor-pointer ${badgeClass}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : item.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.day}
                  </span>

                  {item.holiday && (
                    <span title={item.holiday}>
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </span>
                  )}
                </div>

                {/* Event Tags inside Day cell */}
                <div className="space-y-1 mt-1 text-[10px]">
                  {item.holiday && (
                    <div className="truncate px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
                      {item.holiday}
                    </div>
                  )}

                  {item.leave && (
                    <div className="truncate px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-medium border border-sky-200/60">
                      {item.leave.leaveType}
                    </div>
                  )}

                  {item.attendance && (
                    <div
                      className={`truncate px-1.5 py-0.5 rounded font-semibold border ${
                        item.attendance.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : item.attendance.status === 'Late'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                          : 'bg-rose-50 text-rose-700 border-rose-200/60'
                      }`}
                    >
                      ● {item.attendance.status}
                    </div>
                  )}

                  {item.isWeekend && !item.holiday && !item.attendance && item.isCurrentMonth && (
                    <div className="text-slate-400 font-medium px-1">Weekend</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Card */}
      {selectedDayInfo && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Day Details: {selectedDayInfo.day} {monthNames[month]} {year}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayInfo.dateStr}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedDayInfo.holiday && (
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                  Holiday: {selectedDayInfo.holiday}
                </span>
              )}
              {selectedDayInfo.attendance && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedDayInfo.attendance.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDayInfo.attendance.status === 'Late'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Status: {selectedDayInfo.attendance.status}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Timing</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">09:00 AM – 06:00 PM</span>
              <span className="text-[11px] text-slate-500">General Corporate Shift</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Punch In / Out</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {selectedDayInfo.attendance?.checkIn || '--'} → {selectedDayInfo.attendance?.checkOut || '--'}
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedDayInfo.attendance?.workingHours
                  ? `${selectedDayInfo.attendance.workingHours} Hours worked`
                  : 'No punches logged'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave & Absence</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {selectedDayInfo.leave ? selectedDayInfo.leave.leaveType : 'None'}
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedDayInfo.leave?.reason || 'Regular working day'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
