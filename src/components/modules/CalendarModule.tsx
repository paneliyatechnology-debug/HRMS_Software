'use client';

import React, { useState, useEffect } from 'react';
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
  Trash2,
  X,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface CalendarModuleProps {
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  onOpenLeaveModal?: () => void;
  onOpenClockModal?: () => void;
  portalMode?: 'employee' | 'admin';
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  attendance,
  leaves,
  onOpenLeaveModal,
  onOpenClockModal,
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const myEmpId = user?.employeeId || user?.id || '';
  const myEmpCode = (user as any)?.employeeCode || '';
  const myEmail = user?.email?.toLowerCase() || '';

  const userAttendance = portalMode === 'employee'
    ? attendance.filter((a) =>
        (myEmpId && (a.employeeId === myEmpId || (a as any)._id === myEmpId)) ||
        (myEmpCode && (a as any).employeeCode === myEmpCode)
      )
    : attendance;

  const userLeaves = portalMode === 'employee'
    ? leaves.filter((l) =>
        (myEmpId && l.employeeId === myEmpId) ||
        (myEmpCode && (l as any).employeeCode === myEmpCode) ||
        (myEmail && (l as any).employeeEmail?.toLowerCase() === myEmail)
      )
    : leaves;

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(21);
  const [holidaysList, setHolidaysList] = useState<any[]>([]);

  // Modal: Add Holiday
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('2026-11-26');
  const [holidayType, setHolidayType] = useState('Public');
  const [holidayDescription, setHolidayDescription] = useState('');

  const loadHolidays = async () => {
    try {
      const data = await api.getHolidays();
      setHolidaysList(data);
    } catch (err) {
      console.error('Error loading holidays:', err);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) {
      showToast({ type: 'warning', title: 'Details missing', message: 'Name and date are required.' });
      return;
    }

    const dateObj = new Date(holidayDate);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    try {
      const created = await api.createHoliday({
        name: holidayName.trim(),
        date: holidayDate,
        dayOfWeek,
        type: holidayType as any,
        description: holidayDescription.trim() || 'Official company holiday',
      });

      setHolidaysList((prev) => [...prev, created]);
      showToast({
        type: 'success',
        title: 'Holiday Added',
        message: `${created.name} added to corporate calendar.`,
      });

      setIsAddHolidayOpen(false);
      setHolidayName('');
      setHolidayDescription('');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add', message: err.message || 'Could not create holiday.' });
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the holiday "${name}"?`)) return;
    try {
      await api.deleteHoliday(id);
      setHolidaysList((prev) => prev.filter((h) => h.id !== id));
      showToast({
        type: 'success',
        title: 'Holiday Removed',
        message: `${name} has been removed from the calendar.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Could not delete holiday.' });
    }
  };

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

  // Create lookup for holidays by dateStr
  const holidayDateMap: Record<string, string> = {};
  holidaysList.forEach((h) => {
    holidayDateMap[h.date] = h.name;
  });

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
    const attRec = userAttendance.find((a) => a.date === dateStr);
    // Check leaves for this date
    const leaveRec = userLeaves.find((l) => dateStr >= l.startDate && dateStr <= l.endDate);
    const holidayName = holidayDateMap[dateStr];

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {portalMode === 'employee' ? 'My Calendar & Shifts' : 'Enterprise Calendar'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {portalMode === 'employee'
              ? 'View your shifts, attendance logs, applied leaves, and official holidays'
              : 'View shifts, attendance logs, approved leaves, and manage official holidays'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {portalMode !== 'employee' && (
            <button
              onClick={() => setIsAddHolidayOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Holiday</span>
            </button>
          )}

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

      {/* Corporate Holidays Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Official Corporate Holidays Directory ({holidaysList.length})
          </h3>
          {portalMode !== 'employee' && (
            <button
              onClick={() => setIsAddHolidayOpen(true)}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              + Add Holiday
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {holidaysList.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">{h.name}</span>
                <span className="text-[11px] text-slate-500">
                  {h.date} • {h.dayOfWeek || 'Weekday'}
                </span>
                <span className="text-[10px] font-bold text-blue-600 block mt-0.5">{h.type || 'Public'}</span>
              </div>
              {portalMode !== 'employee' && (
                <button
                  onClick={() => handleDeleteHoliday(h.id, h.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove Holiday"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Holiday */}
      {isAddHolidayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Add Company Holiday
              </h3>
              <button
                onClick={() => setIsAddHolidayOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Thanksgiving Day"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  >
                    <option value="Public">Public / National</option>
                    <option value="Optional">Optional / Floating</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g., Annual Thanksgiving celebration"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
