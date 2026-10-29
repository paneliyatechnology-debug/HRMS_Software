'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  MapPin,
  Building,
  Check,
  Search,
  FileText,
  Layers,
  CalendarDays,
  Briefcase,
  TrendingUp,
  LayoutGrid,
  ListOrdered,
  Award,
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

  // View state: 'grid' (Month view), 'agenda' (Chronological list), 'holidays' (Corporate holiday roster)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'holidays'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'attendance' | 'holidays' | 'leaves'>('all');

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDateNum = today.getDate();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());
  const [holidaysList, setHolidaysList] = useState<any[]>([]);

  // Search & Filter in Holidays directory
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [holidayTypeFilter, setHolidayTypeFilter] = useState<'All' | 'Public' | 'Optional' | 'Company'>('All');

  // Modal: Add Holiday
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [holidayType, setHolidayType] = useState<'Public' | 'Optional' | 'Company'>('Public');
  const [holidayDescription, setHolidayDescription] = useState('');

  const loadHolidays = async () => {
    try {
      const data = await api.getHolidays();
      setHolidaysList(data || []);
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
        type: holidayType,
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
    const prevDate = new Date(year, month - 1, 1);
    setCurrentDate(prevDate);
    const now = new Date();
    if (prevDate.getFullYear() === now.getFullYear() && prevDate.getMonth() === now.getMonth()) {
      setSelectedDay(now.getDate());
    } else {
      setSelectedDay(1);
    }
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month + 1, 1);
    setCurrentDate(nextDate);
    const now = new Date();
    if (nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() === now.getMonth()) {
      setSelectedDay(now.getDate());
    } else {
      setSelectedDay(1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Create lookup for holidays by dateStr
  const holidayDateMap: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    holidaysList.forEach((h) => {
      map[h.date] = h;
    });
    return map;
  }, [holidaysList]);

  // Generate calendar grid
  const days = useMemo(() => {
    const list = [];

    // Padding from previous month
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthNum = prevMonthDate.getMonth() + 1;
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      list.push({
        day: dNum,
        isCurrentMonth: false,
        dateStr: `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
        isWeekend: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const attRec = userAttendance.find((a) => a.date === dateStr);
      const leaveRec = userLeaves.find((l) => dateStr >= l.startDate && dateStr <= l.endDate);
      const holObj = holidayDateMap[dateStr];

      list.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        isWeekend,
        dayOfWeek,
        attendance: attRec,
        leave: leaveRec,
        holiday: holObj?.name,
        holidayObj: holObj,
      });
    }

    // Padding for next month
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth() + 1;
    const totalSlots = Math.ceil(list.length / 7) * 7;
    const remainingSlots = totalSlots - list.length;
    for (let i = 1; i <= remainingSlots; i++) {
      list.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isWeekend: false,
      });
    }

    return list;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, userAttendance, userLeaves, holidayDateMap]);

  // Executive Statistics for current month
  const stats = useMemo(() => {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    const totalDays = currentMonthDays.length;
    const workingDays = currentMonthDays.filter((d) => !d.isWeekend && !d.holiday).length;
    const presentCount = currentMonthDays.filter((d) => d.attendance && d.attendance.status === 'Present').length;
    const lateCount = currentMonthDays.filter((d) => d.attendance && d.attendance.status === 'Late').length;
    const holidaysCount = currentMonthDays.filter((d) => d.holiday).length;
    const leavesCount = currentMonthDays.filter((d) => d.leave).length;
    const totalHoursWorked = currentMonthDays.reduce((acc, d) => acc + (d.attendance?.workingHours || 0), 0);
    const completionPercent = workingDays > 0 ? Math.min(100, Math.round(((presentCount + lateCount) / workingDays) * 100)) : 0;

    return {
      totalDays,
      workingDays,
      presentCount,
      lateCount,
      holidaysCount,
      leavesCount,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      completionPercent,
    };
  }, [days]);

  const selectedDayInfo = days.find((d) => d.isCurrentMonth && d.day === selectedDay);

  // Filtered days for Agenda view
  const agendaEvents = useMemo(() => {
    return days
      .filter((d) => d.isCurrentMonth && (d.attendance || d.holiday || d.leave))
      .sort((a, b) => (a.day || 0) - (b.day || 0));
  }, [days]);

  // Filtered holidays list
  const filteredHolidays = useMemo(() => {
    return holidaysList.filter((h) => {
      const matchSearch =
        !holidaySearchQuery ||
        h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase()) ||
        h.date.includes(holidaySearchQuery) ||
        (h.description && h.description.toLowerCase().includes(holidaySearchQuery.toLowerCase()));
      const matchType = holidayTypeFilter === 'All' || h.type === holidayTypeFilter;
      return matchSearch && matchType;
    });
  }, [holidaysList, holidaySearchQuery, holidayTypeFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto select-none animate-in fade-in pb-12">


      {/* =========================================================================
          TOP EXECUTIVE METRICS CARDS
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Month Overview */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8ebd9] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month</span>
            <span className="p-1.5 rounded-lg bg-[#ecfdf5] text-[#059669]">
              <CalendarIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">
            {monthNames[month].slice(0, 3)} {year}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
            <span>{stats.totalDays} Total Days</span>
          </div>
        </div>

        {/* Card 2: Working Days */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8ebd9] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Working Days</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">
            {stats.workingDays} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 font-bold">
            <span>Excludes weekends</span>
          </div>
        </div>

        {/* Card 3: Days Logged / Present */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8ebd9] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logged In</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-emerald-700 mt-1">
            {stats.presentCount + stats.lateCount} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stats.completionPercent}% Attendance</span>
          </div>
        </div>

        {/* Card 4: Official Holidays */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8ebd9] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Holidays</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">
            {stats.holidaysCount} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 font-medium">
            <span>Official gazetted</span>
          </div>
        </div>

        {/* Card 5: Hours Worked */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8ebd9] shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tracked Hours</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">
            {stats.totalHoursWorked} <span className="text-xs font-semibold text-slate-400">Hrs</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-700 font-medium">
            <span>{stats.leavesCount > 0 ? `${stats.leavesCount} leave(s) recorded` : 'Regular attendance'}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROLS BAR: Navigation, View Switcher & Filters
          ========================================================================= */}
      <div className="bg-white border border-[#d8ebd9] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Month Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-xl border border-[#d8ebd9] bg-[#f2f9f5] p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 text-[#065f46]" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1 text-xs font-extrabold text-[#065f46] hover:bg-white rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Today</span>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4 text-[#065f46]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#0d271d] tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-[10px] font-bold">
              Q{Math.floor(month / 3) + 1}
            </span>
          </div>
        </div>

        {/* Center / Right: View Mode Toggle & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Month Grid</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agenda</span>
            </button>

            <button
              onClick={() => setViewMode('holidays')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'holidays'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Holidays ({holidaysList.length})</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {portalMode !== 'employee' && (
              <button
                onClick={() => setIsAddHolidayOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#059669]" />
                <span>Add Holiday</span>
              </button>
            )}

            {onOpenClockModal && (
              <button
                onClick={onOpenClockModal}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Log Punch</span>
              </button>
            )}

            {onOpenLeaveModal && (
              <button
                onClick={onOpenLeaveModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-extrabold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Apply Leave</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: LUXURY MONTH GRID
          ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="bg-white border border-[#d8ebd9] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          {/* Legend Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#edf6f0] text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
              <Filter className="w-3.5 h-3.5 text-[#059669]" />
              <span>Status Legend:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-900 border border-amber-300">
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Holiday
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Leave
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Remote WFH
              </span>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-2 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
              const isWeekend = i === 0 || i === 6;
              return (
                <div
                  key={d}
                  className={`text-xs font-black uppercase tracking-wider py-1 rounded-lg ${
                    isWeekend ? 'text-slate-400 bg-slate-50/60' : 'text-[#065f46] bg-[#ecfdf5]/40'
                  }`}
                >
                  {d}
                </div>
              );
            })}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-1">
            {days.map((item, idx) => {
              const isToday =
                item.isCurrentMonth &&
                item.day === todayDateNum &&
                month === todayMonth &&
                year === todayYear;
              const isSelected = item.isCurrentMonth && item.day === selectedDay;

              let cellStyle = 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-[#ecfdf5]/20';
              if (!item.isCurrentMonth) {
                cellStyle = 'bg-slate-50/40 text-slate-300 border-slate-100 pointer-events-none opacity-60';
              } else if (isSelected) {
                cellStyle = 'border-[#059669] ring-2 ring-[#059669]/25 bg-[#ecfdf5]/70 shadow-xs';
              } else if (isToday) {
                cellStyle = 'border-emerald-400 bg-emerald-50/30';
              } else if (item.isWeekend) {
                cellStyle = 'bg-[#fafdfa] border-slate-200/70 text-slate-500';
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.isCurrentMonth) setSelectedDay(item.day);
                  }}
                  className={`min-h-[75px] sm:min-h-[118px] p-1.5 sm:p-2.5 rounded-2xl border transition-all duration-150 flex flex-col justify-between cursor-pointer group ${cellStyle}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        isToday
                          ? 'bg-gradient-to-tr from-[#10b981] to-[#059669] text-white shadow-xs'
                          : isSelected
                          ? 'bg-[#062d1f] text-white'
                          : item.isCurrentMonth
                          ? 'text-slate-800 group-hover:text-emerald-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.day}
                    </span>

                    {item.holiday && (
                      <span className="p-0.5 rounded-full bg-amber-100 text-amber-600" title={item.holiday}>
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      </span>
                    )}
                  </div>

                  {/* Day Badges and Event Tags */}
                  <div className="space-y-1 mt-1 text-[10px]">
                    {/* Official Holiday Tag */}
                    {item.holiday && (
                      <div
                        className="truncate px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 font-extrabold border border-amber-300 shadow-2xs flex items-center gap-1"
                        title={item.holiday}
                      >
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600 shrink-0" />
                        <span className="truncate">{item.holiday}</span>
                      </div>
                    )}

                    {/* Approved Leave Tag */}
                    {item.leave && (
                      <div
                        className="truncate px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 shadow-2xs flex items-center gap-1"
                        title={`${item.leave.leaveType} (${item.leave.status})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="truncate">{item.leave.leaveType}</span>
                      </div>
                    )}

                    {/* Attendance Record Status */}
                    {item.attendance && (
                      <div
                        className={`truncate px-2 py-0.5 rounded-lg font-bold border shadow-2xs flex items-center gap-1 ${
                          item.attendance.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.attendance.status === 'Late'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title={`${item.attendance.status} • ${item.attendance.checkIn || '--'} to ${item.attendance.checkOut || '--'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            item.attendance.status === 'Present'
                              ? 'bg-emerald-500'
                              : item.attendance.status === 'Late'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="truncate">{item.attendance.status}</span>
                      </div>
                    )}

                    {/* Weekend tag */}
                    {item.isWeekend && !item.holiday && !item.attendance && item.isCurrentMonth && (
                      <div className="hidden sm:block text-slate-400 font-semibold px-1 text-[9px] uppercase tracking-wider">
                        Weekend
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SELECTED DAY INSPECTOR / DETAILS CARD
          ========================================================================= */}
      {viewMode === 'grid' && selectedDayInfo && (
        <div className="bg-white border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#edf6f0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#062d1f] to-[#083b28] text-white flex items-center justify-center font-black text-sm shadow-xs">
                {selectedDayInfo.day}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedDayInfo.day} {monthNames[month]} {year}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedDayInfo.dateStr} • {new Date(year, month, selectedDayInfo.day).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedDayInfo.holiday && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Holiday: {selectedDayInfo.holiday}</span>
                </span>
              )}

              {selectedDayInfo.attendance && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${
                    selectedDayInfo.attendance.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : selectedDayInfo.attendance.status === 'Late'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Attendance: {selectedDayInfo.attendance.status}</span>
                </span>
              )}

              {selectedDayInfo.leave && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-2xs">
                  Leave: {selectedDayInfo.leave.leaveType}
                </span>
              )}
            </div>
          </div>

          {/* 4 Detail Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
            {/* Shift Timing */}
            <div className="p-3.5 rounded-2xl bg-[#f2f9f5] border border-[#d8ebd9]">
              <span className="text-[10px] uppercase font-bold text-[#065f46] block tracking-wider">Shift Schedule</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">09:00 AM – 06:00 PM</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Standard Corporate Shift (8h net)</span>
            </div>

            {/* Punch In & Punch Out */}
            <div className="p-3.5 rounded-2xl bg-[#f2f9f5] border border-[#d8ebd9]">
              <span className="text-[10px] uppercase font-bold text-[#065f46] block tracking-wider">Biometric / Web Punch</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.attendance?.checkIn || '--'} → {selectedDayInfo.attendance?.checkOut || '--'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {selectedDayInfo.attendance?.workingHours
                  ? `${selectedDayInfo.attendance.workingHours} Hours logged`
                  : 'No attendance punch logged'}
              </span>
            </div>

            {/* Leave / Absence Info */}
            <div className="p-3.5 rounded-2xl bg-[#f2f9f5] border border-[#d8ebd9]">
              <span className="text-[10px] uppercase font-bold text-[#065f46] block tracking-wider">Leave & Excuses</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.leave ? selectedDayInfo.leave.leaveType : 'Regular Work Day'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {selectedDayInfo.leave?.reason || 'No leave applied for this date'}
              </span>
            </div>

            {/* Work Mode */}
            <div className="p-3.5 rounded-2xl bg-[#f2f9f5] border border-[#d8ebd9]">
              <span className="text-[10px] uppercase font-bold text-[#065f46] block tracking-wider">Location / Presence</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.attendance?.isWFH ? 'Remote Work (WFH)' : 'Corporate Office Desk'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Geofence verified IP & location
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: AGENDA / SCHEDULE CHRONOLOGICAL LIST
          ========================================================================= */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-[#d8ebd9] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf6f0]">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Monthly Schedule & Event Timeline ({agendaEvents.length})
              </h3>
              <p className="text-xs text-slate-500">
                Chronological list of all logged punches, applied leaves, and official holidays for {monthNames[month]} {year}.
              </p>
            </div>
          </div>

          {agendaEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No recorded events or punches for this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendaEvents.map((evt) => (
                <div
                  key={evt.dateStr}
                  onClick={() => setSelectedDay(evt.day)}
                  className="p-4 rounded-2xl border border-[#d8ebd9] bg-[#fafdfa] hover:bg-[#ecfdf5]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#062d1f] text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold leading-none">{monthNames[month].slice(0, 3)}</span>
                      <span className="text-base font-black leading-none mt-0.5">{evt.day}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {evt.holiday
                          ? `🌟 ${evt.holiday}`
                          : evt.leave
                          ? `🌴 ${evt.leave.leaveType} (${evt.leave.status})`
                          : `💼 Work Shift: ${evt.attendance?.status || 'Scheduled'}`}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {evt.dateStr} • {new Date(year, month, evt.day).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {evt.attendance && (
                      <div className="text-xs text-slate-600 bg-white border border-[#d8ebd9] px-3 py-1.5 rounded-xl font-medium">
                        Punch: <span className="font-bold text-slate-900">{evt.attendance.checkIn} → {evt.attendance.checkOut || 'Active'}</span> ({evt.attendance.workingHours}h)
                      </div>
                    )}
                    {evt.holiday && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Official Holiday
                      </span>
                    )}
                    {evt.leave && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {evt.leave.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: CORPORATE HOLIDAYS DIRECTORY
          ========================================================================= */}
      {viewMode === 'holidays' && (
        <div className="bg-white border border-[#d8ebd9] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#edf6f0]">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Official Corporate Holidays Roster ({filteredHolidays.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gazetted and floating company holidays recognized across all branches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search holiday..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {portalMode !== 'employee' && (
                <button
                  onClick={() => setIsAddHolidayOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Holiday</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {filteredHolidays.map((h) => {
              let mName = '';
              let dNum: number | string = '';
              if (h.date) {
                const parts = h.date.split('-');
                if (parts.length === 3) {
                  const hDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  mName = hDate.toLocaleDateString('en-US', { month: 'short' });
                  dNum = hDate.getDate();
                }
              }

              return (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-white to-[#fafdfa] border border-[#d8ebd9] hover:border-emerald-300 hover:shadow-xs transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black uppercase text-amber-700 leading-none">{mName || 'DAY'}</span>
                      <span className="text-base font-black leading-none mt-0.5">{dNum || '--'}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{h.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {h.date} • {h.dayOfWeek || 'Weekday'}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {h.type || 'Public'} Holiday
                      </span>
                      {h.description && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {h.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {portalMode !== 'employee' && (
                    <button
                      onClick={() => handleDeleteHoliday(h.id, h.name)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD HOLIDAY
          ========================================================================= */}
      {isAddHolidayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#062d1f] to-[#0a422e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-white/10 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Add Company Holiday</h3>
                  <p className="text-[11px] text-[#a7f3d0]">Corporate schedule roster synchronization</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddHolidayOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Diwali / Deepawali Festival"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Calendar Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Holiday Classification</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                  >
                    <option value="Public">Public / Gazetted</option>
                    <option value="Optional">Optional / Floating</option>
                    <option value="Company">Company Special</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Annual Festival of Lights Celebration"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-md shadow-emerald-500/20 active:scale-95"
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
