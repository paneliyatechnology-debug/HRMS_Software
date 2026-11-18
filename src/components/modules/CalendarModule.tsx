'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  leaves?: LeaveRequest[];
  onOpenLeaveModal?: () => void;
  onOpenClockModal?: () => void;
  portalMode?: 'employee' | 'admin';
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  attendance,
  leaves: _leaves,
  onOpenLeaveModal: _onOpenLeaveModal,
  onOpenClockModal,
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const myEmpId = user?.employeeId || user?.id || '';
  const myEmpCode = (user as any)?.employeeCode || '';
  const isAdminCalendar = portalMode !== 'employee';

  const isOwnPunch = (record: AttendanceRecord) => {
    const recordId = record.employeeId || (record as any)._id || '';
    const recordCode = (record as any).employeeCode || '';
    return (
      (!!myEmpId && (recordId === myEmpId || recordId === user?.id)) ||
      (!!myEmpCode && recordCode === myEmpCode)
    );
  };

  const userAttendance = isAdminCalendar
    ? attendance.filter((record) => !isOwnPunch(record))
    : attendance.filter((record) => isOwnPunch(record));

  // View state: 'grid' (Month view), 'agenda' (Chronological list), 'holidays' (Corporate holiday roster)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'holidays'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'attendance' | 'holidays'>('all');

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
  // Modal: Delete Holiday
  const [deletingHoliday, setDeletingHoliday] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingHoliday, setIsDeletingHoliday] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!isAddHolidayOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddHolidayOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddHolidayOpen]);

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

  const handleConfirmDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    const { id, name } = deletingHoliday;
    setIsDeletingHoliday(true);
    try {
      await api.deleteHoliday(id);
      setHolidaysList((prev) =>
        prev.filter((h) => {
          const itemKey = String(h.id || (h as any)._id || (h as any).holidayId || '').trim();
          return itemKey !== id;
        })
      );
      showToast({
        type: 'success',
        title: 'Holiday Removed',
        message: `${name} has been removed from the calendar.`,
      });
      setDeletingHoliday(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_holidays_updated'));
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete holiday.',
      });
    } finally {
      setIsDeletingHoliday(false);
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

      const dayRecords = userAttendance.filter((a) => a.date === dateStr);
      const holObj = holidayDateMap[dateStr];

      list.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        isWeekend,
        dayOfWeek,
        attendance: isAdminCalendar ? undefined : dayRecords[0],
        staffCount: isAdminCalendar ? dayRecords.length : 0,
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
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, userAttendance, holidayDateMap]);

  // Executive Statistics for current month
  const stats = useMemo(() => {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    const totalDays = currentMonthDays.length;
    const workingDays = currentMonthDays.filter((d) => !d.isWeekend && !d.holiday).length;
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthStaff = userAttendance.filter((record) => String(record.date || '').startsWith(monthKey));
    const presentCount = isAdminCalendar
      ? new Set(monthStaff.filter((record) => record.status === 'Present' || record.status === 'Late').map((record) => record.employeeId)).size
      : currentMonthDays.filter((d) => d.attendance && d.attendance.status === 'Present').length;
    const lateCount = isAdminCalendar
      ? 0
      : currentMonthDays.filter((d) => d.attendance && d.attendance.status === 'Late').length;
    const holidaysCount = currentMonthDays.filter((d) => d.holiday).length;
    const weekendsCount = currentMonthDays.filter((d) => d.isWeekend).length;
    const totalHoursWorked = isAdminCalendar
      ? monthStaff.reduce((acc, record) => acc + (record.workingHours || 0), 0)
      : currentMonthDays.reduce((acc, d) => acc + (d.attendance?.workingHours || 0), 0);
    const completionPercent = workingDays > 0 ? Math.min(100, Math.round(((presentCount + lateCount) / workingDays) * 100)) : 0;

    return {
      totalDays,
      workingDays,
      presentCount,
      lateCount,
      holidaysCount,
      weekendsCount,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      completionPercent,
    };
  }, [days, isAdminCalendar, userAttendance, year, month]);

  const selectedDayInfo = days.find((d) => d.isCurrentMonth && d.day === selectedDay);

  // Filtered days for Agenda view (only official holidays and weekends, plus verified attendance)
  const agendaEvents = useMemo(() => {
    return days
      .filter((d) => d.isCurrentMonth && (d.holiday || d.isWeekend || d.attendance))
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
    <div className="space-y-5 w-full select-none">
      {/* Page Title Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
        <h1 className="hrms-page-title">Calendar &amp; Holidays</h1>
      </div>

      {/* =========================================================================
          TOP EXECUTIVE METRICS CARDS
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Month Overview */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">Month</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4 text-[#495057]" />
            </div>
          </div>
          <p className="text-lg font-black text-[#212529] mt-1">
            {monthNames[month].slice(0, 3)} {year}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6c757d] font-medium">
            <span>{stats.totalDays} Total Days</span>
          </div>
        </div>

        {/* Card 2: Working Days */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">Working Days</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-[#495057]" />
            </div>
          </div>
          <p className="text-lg font-black text-[#212529] mt-1">
            {stats.workingDays} <span className="text-xs font-semibold text-[#6c757d]">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#2d6a4f] font-semibold">
            <span>Excludes weekends</span>
          </div>
        </div>

        {/* Card 3: Days Logged / Present */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">{isAdminCalendar ? 'Staff Present' : 'Logged In'}</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
            </div>
          </div>
          <p className="text-lg font-black text-[#1b4332] mt-1">
            {stats.presentCount + stats.lateCount} <span className="text-xs font-semibold text-[#6c757d]">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#2d6a4f] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            <span>{isAdminCalendar ? 'Employees this month' : `${stats.completionPercent}% Attendance`}</span>
          </div>
        </div>

        {/* Card 4: Official Holidays */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">Holidays</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-[#2d6a4f]" />
            </div>
          </div>
          <p className="text-lg font-black text-[#212529] mt-1">
            {stats.holidaysCount} <span className="text-xs font-semibold text-[#6c757d]">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#495057] font-medium">
            <span>Official gazetted</span>
          </div>
        </div>

        {/* Card 5: Hours Worked */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">{isAdminCalendar ? 'Team Hours' : 'Tracked Hours'}</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#495057]" />
            </div>
          </div>
          <p className="text-lg font-black text-[#212529] mt-1">
            {stats.totalHoursWorked} <span className="text-xs font-semibold text-[#6c757d]">Hrs</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#495057] font-medium">
            <span>{stats.weekendsCount} weekend days &bull; {stats.holidaysCount} holidays</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROLS BAR: Navigation, View Switcher & Filters
          ========================================================================= */}
      <div className="bg-white border border-[#dee2e6] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Month Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-xl border border-[#dee2e6] bg-[#f8f9fa] p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-[#495057] hover:text-[#1b4332] hover:bg-white transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1 text-xs font-bold text-[#1b4332] hover:bg-[#d8f3dc] rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              <span>Today</span>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-[#495057] hover:text-[#1b4332] hover:bg-white transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#212529] tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] text-[10px] font-bold">
              Q{Math.floor(month / 3) + 1}
            </span>
          </div>
        </div>

        {/* Center / Right: View Mode Toggle & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc]/60'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Month Grid</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'agenda'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc]/60'
                }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>

            <button
              onClick={() => setViewMode('holidays')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'holidays'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc]/60'
                }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Holidays ({holidaysList.length})</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {portalMode !== 'employee' && (
              <button
                onClick={() => setIsAddHolidayOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holiday</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: LUXURY MONTH GRID
          ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="bg-white border border-[#dee2e6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Legend Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e9ecef] text-xs">
            <div className="flex items-center gap-1.5 text-[#495057] text-[11px] font-semibold">
              <Filter className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Status Legend:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d8f3dc] text-[#1b4332] border border-[#74c69d]">
                <span className="w-2 h-2 rounded-full bg-[#2d6a4f]" /> Today
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1b4332] text-white border border-[#081c15]">
                <Star className="w-2.5 h-2.5 text-[#95d5b2] fill-[#95d5b2]" /> Holiday
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e9ecef] text-[#495057] border border-[#ced4da]">
                <span className="w-2 h-2 rounded-full bg-[#6c757d]" /> Weekend
              </span>
              {!isAdminCalendar && (
                <>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d8f3dc]/70 text-[#1b4332] border border-[#95d5b2]">
                    <span className="w-2 h-2 rounded-full bg-[#40916c]" /> Present
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                  </span>
                </>
              )}
              {isAdminCalendar && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d8f3dc]/70 text-[#1b4332] border border-[#95d5b2]">
                  <span className="w-2 h-2 rounded-full bg-[#40916c]" /> Staff present
                </span>
              )}
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center bg-[#1b4332] rounded-xl p-1.5 shadow-2xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
              const isWeekend = i === 0 || i === 6;
              return (
                <div
                  key={d}
                  className={`text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-lg ${isWeekend
                    ? 'text-[#b7e4c7] bg-white/10'
                    : 'text-white'
                    }`}
                >
                  {d}
                </div>
              );
            })}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-0.5">
            {days.map((item, idx) => {
              const isToday =
                item.isCurrentMonth &&
                item.day === todayDateNum &&
                month === todayMonth &&
                year === todayYear;
              const isSelected = item.isCurrentMonth && item.day === selectedDay;

              let cellStyle = 'bg-white border-[#dee2e6] hover:border-[#52b788] hover:bg-[#d8f3dc]/20';
              if (!item.isCurrentMonth) {
                cellStyle = 'bg-[#f8f9fa]/70 text-[#adb5bd] border-[#e9ecef] pointer-events-none opacity-65';
              } else if (isToday && isSelected) {
                cellStyle = 'border-[#1b4332] ring-2 ring-[#2d6a4f]/30 bg-[#d8f3dc]/55 shadow-xs';
              } else if (isToday) {
                cellStyle = 'border-[#2d6a4f] bg-[#d8f3dc]/45 hover:bg-[#d8f3dc]/60 shadow-2xs';
              } else if (isSelected) {
                cellStyle = 'border-[#2d6a4f] ring-2 ring-[#2d6a4f]/25 bg-[#d8f3dc]/25 shadow-xs';
              } else if (item.holiday) {
                cellStyle = 'bg-[#d8f3dc]/35 border-[#95d5b2] hover:border-[#2d6a4f]';
              } else if (item.isWeekend) {
                cellStyle = 'bg-[#f1f3f5] border-[#dee2e6] hover:border-[#adb5bd] text-[#495057]';
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.isCurrentMonth) setSelectedDay(item.day);
                  }}
                  className={`min-h-[78px] sm:min-h-[116px] p-1.5 sm:p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between cursor-pointer group ${cellStyle}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-extrabold w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday
                        ? 'bg-[#2d6a4f] text-white shadow-xs'
                        : isSelected
                          ? 'bg-[#1b4332] text-white shadow-xs'
                          : !item.isCurrentMonth
                            ? 'text-[#adb5bd]'
                            : item.isWeekend
                              ? 'text-[#495057] group-hover:text-[#1b4332]'
                              : 'text-[#212529] group-hover:bg-[#d8f3dc] group-hover:text-[#1b4332]'
                        }`}
                    >
                      {item.day}
                    </span>

                    <div className="flex items-center gap-1">
                      {isToday && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-[#1b4332] text-white text-[9px] font-bold uppercase tracking-wide">
                          Today
                        </span>
                      )}
                      {item.holiday && (
                        <span className="p-1 rounded-full bg-[#1b4332] text-[#95d5b2]" title={item.holiday}>
                          <Star className="w-3 h-3 fill-[#95d5b2] text-[#95d5b2]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Badges and Event Tags: ONLY official holidays and weekends */}
                  <div className="space-y-1 mt-1 text-[10px]">
                    {/* Official Holiday Tag (Added by Admin) */}
                    {item.holiday && (
                      <div
                        className="truncate px-2 py-0.5 rounded-md bg-[#1b4332] text-white font-semibold border border-[#081c15] shadow-2xs flex items-center gap-1"
                        title={`Holiday: ${item.holiday}`}
                      >
                        <Star className="w-2.5 h-2.5 fill-[#95d5b2] text-[#95d5b2] shrink-0" />
                        <span className="truncate">{item.holiday}</span>
                      </div>
                    )}

                    {/* Weekend Tag */}
                    {item.isWeekend && !item.holiday && item.isCurrentMonth && (
                      <div
                        className="truncate px-2 py-0.5 rounded-md bg-white text-[#495057] font-semibold border border-[#ced4da] flex items-center gap-1.5"
                        title="Weekend"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6c757d] shrink-0" />
                        <span className="truncate">Weekend</span>
                      </div>
                    )}

                    {isAdminCalendar && (item.staffCount ?? 0) > 0 && !item.holiday && !item.isWeekend && (
                      <div className="truncate px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]">
                        <Users className="w-2.5 h-2.5 shrink-0 text-[#2d6a4f]" />
                        <span className="truncate">{item.staffCount} staff</span>
                      </div>
                    )}

                    {/* Attendance Record Status (Regular Working Days Only) */}
                    {!isAdminCalendar && item.attendance && !item.holiday && !item.isWeekend && (
                      <div
                        className={`truncate px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${item.attendance.status === 'Present'
                          ? 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]'
                          : item.attendance.status === 'Late'
                            ? 'bg-[#f8f9fa] text-[#343a40] border-[#adb5bd]'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        title={`${item.attendance.status} • ${item.attendance.checkIn || '--'} to ${item.attendance.checkOut || '--'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.attendance.status === 'Present'
                            ? 'bg-[#2d6a4f]'
                            : item.attendance.status === 'Late'
                              ? 'bg-[#6c757d]'
                              : 'bg-rose-500'
                            }`}
                        />
                        <span className="truncate">{item.attendance.status}</span>
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
        <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e9ecef]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-white flex items-center justify-center font-black text-sm shadow-xs">
                {selectedDayInfo.day}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#212529]">
                  {selectedDayInfo.day} {monthNames[month]} {year}
                </h3>
                <p className="text-xs text-[#6c757d] font-medium">
                  {selectedDayInfo.dateStr} &bull; {new Date(year, month, selectedDayInfo.day).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedDayInfo.holiday && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1b4332] text-white border border-[#081c15] flex items-center gap-1.5 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-[#95d5b2] text-[#95d5b2]" />
                  <span>Holiday: {selectedDayInfo.holiday}</span>
                </span>
              )}

              {selectedDayInfo.isWeekend && !selectedDayInfo.holiday && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e9ecef] text-[#495057] border border-[#ced4da] shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6c757d]" />
                  <span>Weekend Off</span>
                </span>
              )}

              {selectedDayInfo.attendance && !selectedDayInfo.holiday && !selectedDayInfo.isWeekend && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${selectedDayInfo.attendance.status === 'Present'
                    ? 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]'
                    : selectedDayInfo.attendance.status === 'Late'
                      ? 'bg-[#e9ecef] text-[#343a40] border-[#adb5bd]'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f]" />
                  <span>Attendance: {selectedDayInfo.attendance.status}</span>
                </span>
              )}
            </div>
          </div>

          {/* 4 Detail Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
            {/* Shift Timing */}
            <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
              <span className="text-[10px] uppercase font-bold text-[#6c757d] block tracking-wider">Shift Schedule</span>
              <span className="font-extrabold text-[#212529] text-sm mt-1 block">
                {selectedDayInfo.holiday || selectedDayInfo.isWeekend ? 'Off Duty' : '09:00 AM – 06:00 PM'}
              </span>
              <span className="text-[11px] text-[#6c757d] mt-0.5 block">
                {selectedDayInfo.holiday ? 'Corporate Public Holiday' : selectedDayInfo.isWeekend ? 'Weekend Weekly Rest' : 'Standard Corporate Shift (8h net)'}
              </span>
            </div>

            {/* Punch In & Punch Out */}
            <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
              <span className="text-[10px] uppercase font-bold text-[#6c757d] block tracking-wider">Attendance Punch</span>
              <span className="font-extrabold text-[#212529] text-sm mt-1 block">
                {selectedDayInfo.attendance?.checkIn || '--'} &rarr; {selectedDayInfo.attendance?.checkOut || '--'}
              </span>
              <span className="text-[11px] text-[#6c757d] mt-0.5 block">
                {selectedDayInfo.attendance?.workingHours
                  ? `${selectedDayInfo.attendance.workingHours} Hours logged`
                  : 'No attendance punch logged'}
              </span>
            </div>

            {/* Day Classification */}
            <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
              <span className="text-[10px] uppercase font-bold text-[#6c757d] block tracking-wider">Classification</span>
              <span className="font-extrabold text-[#212529] text-sm mt-1 block">
                {selectedDayInfo.holiday ? selectedDayInfo.holiday : selectedDayInfo.isWeekend ? 'Weekend Off' : 'Regular Work Day'}
              </span>
              <span className="text-[11px] text-[#6c757d] mt-0.5 block">
                {selectedDayInfo.holidayObj?.description || (selectedDayInfo.isWeekend ? 'Saturday / Sunday corporate weekend' : 'Scheduled operational business day')}
              </span>
            </div>

            {/* Work Mode */}
            <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
              <span className="text-[10px] uppercase font-bold text-[#6c757d] block tracking-wider">Location / Presence</span>
              <span className="font-extrabold text-[#212529] text-sm mt-1 block">
                Corporate Office Desk
              </span>
              <span className="text-[11px] text-[#6c757d] mt-0.5 block">
                Attendance &amp; presence verified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: AGENDA / SCHEDULE CHRONOLOGICAL LIST
          ========================================================================= */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e9ecef]">
            <div>
              <h3 className="text-base font-extrabold text-[#212529]">
                Monthly Schedule &amp; Event Timeline ({agendaEvents.length})
              </h3>
              <p className="text-xs text-[#6c757d]">
                Chronological list of official corporate holidays and weekend schedule for {monthNames[month]} {year}.
              </p>
            </div>
          </div>

          {agendaEvents.length === 0 ? (
            <div className="text-center py-12 text-[#6c757d]">
              <CalendarDays className="w-12 h-12 mx-auto text-[#ced4da] mb-2" />
              <p className="text-sm font-semibold">No holidays or weekend events for this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendaEvents.map((evt) => (
                <div
                  key={evt.dateStr}
                  onClick={() => setSelectedDay(evt.day)}
                  className="p-4 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] hover:border-[#95d5b2] hover:bg-[#d8f3dc]/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${evt.holiday
                        ? 'bg-[#1b4332] text-white'
                        : evt.isWeekend
                          ? 'bg-[#e9ecef] text-[#343a40] border border-[#ced4da]'
                          : 'bg-[#2d6a4f] text-white'
                        }`}
                    >
                      <span className="text-[10px] font-bold uppercase leading-none">{monthNames[month].slice(0, 3)}</span>
                      <span className="text-base font-black leading-none mt-0.5">{evt.day}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#212529] flex items-center gap-1.5">
                        {evt.holiday ? (
                          <><Star className="w-3.5 h-3.5 text-[#2d6a4f] fill-[#2d6a4f] shrink-0" /><span>{evt.holiday}</span></>
                        ) : evt.isWeekend ? (
                          <><CalendarDays className="w-3.5 h-3.5 text-[#6c757d] shrink-0" /><span>Weekend ({new Date(year, month, evt.day).toLocaleDateString('en-US', { weekday: 'long' })})</span></>
                        ) : (
                          <><Briefcase className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" /><span>Work Shift: {evt.attendance?.status || 'Scheduled'}</span></>
                        )}
                      </h4>
                      <p className="text-xs text-[#6c757d] mt-0.5">
                        {evt.dateStr} &bull; {new Date(year, month, evt.day).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {evt.holiday && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1b4332] text-white">
                        Official Holiday
                      </span>
                    )}
                    {evt.isWeekend && !evt.holiday && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#495057] border border-[#ced4da]">
                        Weekend Off
                      </span>
                    )}
                    {evt.attendance && !evt.holiday && !evt.isWeekend && (
                      <div className="text-xs text-[#495057] bg-white border border-[#dee2e6] px-3 py-1.5 rounded-xl font-medium">
                        Punch: <span className="font-bold text-[#1b4332]">{evt.attendance.checkIn} &rarr; {evt.attendance.checkOut || 'Active'}</span> ({evt.attendance.workingHours}h)
                      </div>
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
        <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e9ecef]">
            <div>
              <h3 className="text-base font-extrabold text-[#212529] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#2d6a4f] fill-[#2d6a4f]" />
                <span>Official Corporate Holidays Roster ({filteredHolidays.length})</span>
              </h3>
              <p className="text-xs text-[#6c757d] mt-0.5">
                Gazetted and floating company holidays recognized across all branches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#6c757d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search holiday..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 rounded-xl border border-[#dee2e6] text-xs bg-[#f8f9fa] text-[#212529] placeholder:text-[#6c757d] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                />
              </div>

              {portalMode !== 'employee' && (
                <button
                  onClick={() => setIsAddHolidayOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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

              const holidayId = String(h.id || (h as any)._id || (h as any).holidayId || '').trim();

              return (
                <div
                  key={holidayId || `${h.name}-${h.date}`}
                  className="p-4 rounded-xl bg-white border border-[#dee2e6] hover:border-[#74c69d] hover:shadow-xs transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black uppercase text-[#2d6a4f] leading-none">{mName || 'DAY'}</span>
                      <span className="text-base font-black leading-none mt-0.5">{dNum || '--'}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-[#212529] leading-snug">{h.name}</h4>
                      <p className="text-xs text-[#6c757d] mt-0.5 font-medium">
                        {h.date} &bull; {h.dayOfWeek || 'Weekday'}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2]">
                        {h.type || 'Public'} Holiday
                      </span>
                      {h.description && (
                        <p className="text-[11px] text-[#6c757d] mt-1 leading-relaxed">
                          {h.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingHoliday({ id: holidayId, name: h.name });
                    }}
                    className="p-1.5 rounded-xl text-[#6c757d] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD HOLIDAY
          ========================================================================= */}
      {mounted && isAddHolidayOpen && typeof document !== 'undefined' && createPortal(
        <div onClick={(e) => {
          if (e.target === e.currentTarget) setIsAddHolidayOpen(false);
        }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#081c15]/55 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#dee2e6] overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-full bg-white/15 text-[#95d5b2]">
                  <Star className="w-4 h-4 fill-[#95d5b2]" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Add Company Holiday</h3>
                  <p className="text-[11px] text-[#d8f3dc]">Corporate schedule roster synchronization</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddHolidayOpen(false)}
                className="p-1.5 rounded-xl text-[#d8f3dc] hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#343a40] mb-1.5">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Diwali / Deepawali Festival"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-hidden focus:border-[#2d6a4f] text-[#212529] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#343a40] mb-1.5">Calendar Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:outline-hidden focus:border-[#2d6a4f] text-[#212529] font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#343a40] mb-1.5">Holiday Classification</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:border-[#2d6a4f] text-[#212529] font-medium"
                  >
                    <option value="Public">Public / Gazetted</option>
                    <option value="Optional">Optional / Floating</option>
                    <option value="Company">Company Special</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#343a40] mb-1.5">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Annual Festival of Lights Celebration"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:bg-white focus:border-[#2d6a4f] text-[#212529] font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e9ecef]">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#dee2e6] text-[#495057] font-bold hover:bg-[#f8f9fa] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold shadow-xs active:scale-95 cursor-pointer"
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modern In-App Remove Holiday Confirmation Modal */}
      {mounted && deletingHoliday && typeof document !== 'undefined' && createPortal(
        <div
          id="delete-holiday-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingHoliday) setDeletingHoliday(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Holiday?</h3>
                <p className="text-xs text-slate-500">Official calendar modification</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{deletingHoliday.name}</strong> from the company calendar? This will delete the holiday from the backend.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingHoliday}
                onClick={() => setDeletingHoliday(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingHoliday}
                onClick={handleConfirmDeleteHoliday}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingHoliday ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
