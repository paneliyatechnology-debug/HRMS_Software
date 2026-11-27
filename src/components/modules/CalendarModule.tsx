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

function clockLabel(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function calendarAttendanceStatus(status: string): AttendanceRecord['status'] {
  if (status === 'Leave') return 'On Leave';
  if (status === 'Weekly Off') return 'Week Off';
  if (status === 'Holiday') return 'Holiday';
  if (status === 'Absent' || status === 'Late' || status === 'Half Day' || status === 'Present') return status;
  return 'Present';
}

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

<<<<<<< HEAD
  // Live in-memory leaves store for calendar
  const [leavesList, setLeavesList] = useState<LeaveRequest[]>(() =>
    Array.isArray(leavesProp) && leavesProp.length > 0 ? leavesProp : getAllLeaves() || []
  );

  useEffect(() => {
    if (Array.isArray(leavesProp) && leavesProp.length > 0) {
      setLeavesList(leavesProp);
    }
  }, [leavesProp]);

  // Real-time synchronization & fallback fetch for leaves
  useEffect(() => {
    let active = true;
    const loadLeaves = async () => {
      try {
        const data = await api.getLeaves();
        if (!active) return;
        if (Array.isArray(data)) {
          setLeavesList(data);
          setLiveLeaves(data);
        }
      } catch (err) {
        console.error('Failed to load leaves for calendar:', err);
      }
    };

    if (!leavesProp || leavesProp.length === 0) {
      loadLeaves();
    }

    const handleLeavesUpdate = () => {
      loadLeaves();
    };

    window.addEventListener('hrms_leaves_updated', handleLeavesUpdate);
    return () => {
      active = false;
      window.removeEventListener('hrms_leaves_updated', handleLeavesUpdate);
    };
  }, [leavesProp]);

  // Normalize date string to YYYY-MM-DD
  const normalizeDate = (d?: string): string => {
    if (!d) return '';
    const str = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return str;
  };

  const isLeaveActiveOnDate = (leave: LeaveRequest, targetDateStr: string): boolean => {
    if (!leave) return false;
    if (leave.status === 'Rejected' || (leave.status as string) === 'Cancelled') return false;

    const start = normalizeDate(leave.startDate);
    const end = normalizeDate(leave.endDate) || start;

    if (start && end) {
      if (targetDateStr >= start && targetDateStr <= end) {
        return true;
      }
    }

    if (Array.isArray(leave.dayBreakdown) && leave.dayBreakdown.length > 0) {
      return leave.dayBreakdown.some((bd) => normalizeDate(bd.date) === targetDateStr);
    }

    return false;
  };

  const resolveLeaveEmployeeName = (leave: LeaveRequest): string => {
    if (leave.employeeName && leave.employeeName !== 'Staff Member' && leave.employeeName !== 'Staff Employee') {
      return leave.employeeName;
    }
    const emps = getAllEmployees();
    const emp = emps.find((e) => e.id === leave.employeeId);
    if (emp) {
      return `${emp.firstName} ${emp.lastName || ''}`.trim();
    }
    return leave.employeeName || 'Staff Member';
  };

  const resolveLeaveDepartment = (leave: LeaveRequest): string => {
    if (leave.departmentName && leave.departmentName !== 'General' && leave.departmentName !== '--') {
      return leave.departmentName;
    }
    const emps = getAllEmployees();
    const emp = emps.find((e) => e.id === leave.employeeId);
    return emp?.departmentName || leave.departmentName || 'General';
  };

  const isOwnLeave = (leave: LeaveRequest): boolean => {
    return (
      (!!myEmpId && (leave.employeeId === myEmpId || leave.employeeId === user?.id)) ||
      (!!myEmpCode && (leave as any).employeeCode === myEmpCode)
    );
  };
=======
  const userAttendance = isAdminCalendar
    ? attendance.filter((record) => !isOwnPunch(record))
    : attendance.filter((record) => isOwnPunch(record));
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

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
  const [ownMonthAttendance, setOwnMonthAttendance] = useState<AttendanceRecord[]>([]);
  const [joinedOn, setJoinedOn] = useState('');

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
<<<<<<< HEAD
    let active = true;
    const loadSchedule = async () => {
      try {
        const rules = await api.getWeekendRules();
        if (!active || !rules) return;
        const weekendDays = Array.isArray(rules.weekendDays) ? rules.weekendDays : [0];
        const saturdayRule = rules.saturdayRule || 'none';
        const next = { ...getWorkScheduleConfig(user?.companyId), weekendDays, saturdayRule };
        setScheduleConfig(next);
        saveWorkScheduleConfig(next, user?.companyId);
      } catch (err) {
        console.error('Failed to load schedule for calendar:', err);
      }
    };
    loadSchedule();

    const handleScheduleUpdate = (e: any) => {
      if (e.detail?.config) {
        setScheduleConfig(e.detail.config);
      } else {
        setScheduleConfig(getWorkScheduleConfig(user?.companyId));
      }
    };
    window.addEventListener('hrms_schedule_updated', handleScheduleUpdate);
    return () => {
      active = false;
      window.removeEventListener('hrms_schedule_updated', handleScheduleUpdate);
    };
  }, [user?.companyId]);

  useEffect(() => {
    if (!isAddHolidayOpen && !isWeekendModalOpen) return;
=======
    if (!isAddHolidayOpen) return;
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
<<<<<<< HEAD
  }, [isAddHolidayOpen, isWeekendModalOpen]);

  const handleOpenWeekendModal = () => {
    const activeDays = scheduleConfig.weekendDays ?? [0];
    setEditingWeekendDays(activeDays);
    setEditingSatRule(scheduleConfig.saturdayRule ?? (activeDays.includes(6) ? 'all' : 'none'));
    setIsWeekendModalOpen(true);
  };

  const handleSaveWeekendPolicy = async () => {
    setIsSavingWeekend(true);
    try {
      const updatedConfig: WorkScheduleConfig = {
        ...scheduleConfig,
        weekendDays: editingWeekendDays,
        saturdayRule: editingWeekendDays.includes(6) ? editingSatRule : 'none',
      };
      await api.saveWeekendRules({
        weekendDays: updatedConfig.weekendDays || [],
        saturdayRule: updatedConfig.saturdayRule || 'none',
      });
      saveWorkScheduleConfig(updatedConfig, user?.companyId);
      setScheduleConfig(updatedConfig);

      showToast({
        type: 'success',
        title: 'Weekend Policy Updated',
        message: `Corporate weekend schedule set to: ${getWeekendPolicyDescription(updatedConfig)}`,
      });
      setIsWeekendModalOpen(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not update weekend schedule.',
      });
    } finally {
      setIsSavingWeekend(false);
    }
  };
=======
  }, [isAddHolidayOpen]);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

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

  useEffect(() => {
    if (isAdminCalendar) return;
    let active = true;
    const loadMonth = async () => {
      try {
        const data = await api.getAttendanceCalendar({ year, month: month + 1 });
        if (!active) return;
        const days = Array.isArray(data?.days) ? data.days : [];
        setJoinedOn(String(data?.joinedOn || '').slice(0, 10));
        const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Employee';
        setOwnMonthAttendance(days.filter((day: any) => day?.status && !day.beforeJoining && day.status !== 'Holiday' && day.status !== 'Weekly Off').map((day: any) => ({
          id: day.attendanceId || `day-${day.date}`,
          employeeId: user?.id || myEmpId,
          employeeName: name,
          employeeCode: myEmpCode,
          departmentName: (user as any)?.departmentName || 'General',
          date: String(day.date || '').slice(0, 10),
          checkIn: clockLabel(day.checkInAt),
          checkOut: clockLabel(day.checkOutAt) || undefined,
          breakDurationMinutes: 0,
          workingHours: Number(day.totalMinutes || 0) / 60,
          overtimeHours: Number(day.overtimeMinutes || 0) / 60,
          status: calendarAttendanceStatus(day.status),
          remarks: day.holidayName || '',
          createdAt: new Date().toISOString(),
        })));
        setHolidaysList((prev) => {
          const known = new Set(prev.map((item) => String(item.date || '').slice(0, 10)));
          const extra = days
            .filter((day: any) => day.holidayName && !day.beforeJoining && !known.has(String(day.date).slice(0, 10)))
            .map((day: any) => ({ id: `hol-${day.date}`, name: day.holidayName, date: String(day.date).slice(0, 10) }));
          return extra.length ? [...prev, ...extra] : prev;
        });
      } catch (err) {
        console.error('Failed to load attendance calendar:', err);
      }
    };
    loadMonth();
    window.addEventListener('hrms_attendance_updated', loadMonth);
    window.addEventListener('hrms_attendance_live', loadMonth);
    return () => {
      active = false;
      window.removeEventListener('hrms_attendance_updated', loadMonth);
      window.removeEventListener('hrms_attendance_live', loadMonth);
    };
  }, [isAdminCalendar, year, month, user?.id, user?.firstName, user?.lastName, myEmpId, myEmpCode]);

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

  const userAttendance = isAdminCalendar
    ? attendance.filter((record) => !isOwnPunch(record))
    : ownMonthAttendance;

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
<<<<<<< HEAD
      const beforeJoining = !isAdminCalendar && Boolean(joinedOn) && dateStr < joinedOn;
      const holObj = beforeJoining ? undefined : holidayDateMap[dateStr];
      const dayLeaves = beforeJoining ? [] : leavesList.filter((l) => isLeaveActiveOnDate(l, dateStr));
=======
      const holObj = holidayDateMap[dateStr];
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

      list.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        beforeJoining,
        isWeekend: beforeJoining ? false : isWeekend,
        dayOfWeek,
        attendance: isAdminCalendar || beforeJoining ? undefined : dayRecords[0],
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
<<<<<<< HEAD
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, userAttendance, holidayDateMap, scheduleConfig, leavesList, isAdminCalendar, joinedOn]);
=======
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, userAttendance, holidayDateMap]);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

  // Executive Statistics for current month
  const stats = useMemo(() => {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    const totalDays = currentMonthDays.length;
    const workingDays = currentMonthDays.filter((d) => !d.beforeJoining && !d.isWeekend && !d.holiday).length;
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
    <div className="space-y-5 max-w-7xl mx-auto select-none pb-12">


      {/* =========================================================================
          TOP EXECUTIVE METRICS CARDS
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Card 1: Month Overview */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            {monthNames[month].slice(0, 3)} {year}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
            <span>{stats.totalDays} Total Days</span>
          </div>
        </div>

        {/* Card 2: Working Days */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Working Days</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            {stats.workingDays} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-blue-600 font-semibold">
            <span>Excludes weekends</span>
          </div>
        </div>

        {/* Card 3: Days Logged / Present */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isAdminCalendar ? 'Staff Present' : 'Logged In'}</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">
            {stats.presentCount + stats.lateCount} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAdminCalendar ? 'Employees this month' : `${stats.completionPercent}% Attendance`}</span>
          </div>
        </div>

        {/* Card 4: Official Holidays */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Holidays</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            {stats.holidaysCount} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-amber-700 font-medium">
            <span>Official gazetted</span>
          </div>
        </div>

        {/* Card 5: Hours Worked */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isAdminCalendar ? 'Team Hours' : 'Tracked Hours'}</span>
            <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            {stats.totalHoursWorked} <span className="text-xs font-semibold text-slate-400">Hrs</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-purple-700 font-medium">
            <span>{stats.weekendsCount} weekend days • {stats.holidaysCount} holidays</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROLS BAR: Navigation, View Switcher & Filters
          ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Month Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-800" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1 text-xs font-extrabold text-emerald-800 hover:bg-white rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Today</span>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4 text-emerald-800" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
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
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Holiday</span>
              </button>
            )}

            {/* [DISABLED FOR ADMIN]: admin side se clockin and out ka feature nikal de abhi ke liye use comment karde */}
            {portalMode !== 'admin' && onOpenClockModal && (
              <button
                onClick={onOpenClockModal}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log Punch</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: LUXURY MONTH GRID
          ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          {/* Legend Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status Legend:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-900 border border-amber-300">
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Holiday
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Weekend
              </span>
              {!isAdminCalendar && (
                <>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" /> Remote WFH
                  </span>
                </>
              )}
              {isAdminCalendar && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Staff present
                </span>
              )}
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
                    isWeekend ? 'text-slate-400 bg-slate-50/60' : 'text-emerald-800 bg-emerald-50/60'
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
              const isSelected = item.isCurrentMonth && !item.beforeJoining && item.day === selectedDay;

<<<<<<< HEAD
              let cellStyle = 'bg-white border-[#dee2e6] hover:border-[#52b788] hover:bg-[#d8f3dc]/20';
              if (item.beforeJoining) {
                cellStyle = 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed';
              } else if (!item.isCurrentMonth) {
                cellStyle = 'bg-[#f8f9fa]/70 text-[#adb5bd] border-[#e9ecef] pointer-events-none opacity-65';
              } else if (isToday && isSelected) {
                cellStyle = 'border-[#1b4332] ring-2 ring-[#2d6a4f]/30 bg-[#d8f3dc]/55 shadow-xs';
              } else if (isToday) {
                cellStyle = 'border-[#2d6a4f] bg-[#d8f3dc]/45 hover:bg-[#d8f3dc]/60 shadow-2xs';
=======
              let cellStyle = 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20';
              if (!item.isCurrentMonth) {
                cellStyle = 'bg-slate-50/40 text-slate-300 border-slate-100 pointer-events-none opacity-60';
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              } else if (isSelected) {
                cellStyle = 'border-emerald-600 ring-2 ring-emerald-600/25 bg-emerald-50/70 shadow-xs';
              } else if (isToday) {
                cellStyle = 'border-emerald-400 bg-emerald-50/30';
              } else if (item.isWeekend) {
                cellStyle = 'bg-slate-50/80 border-slate-200/70 text-slate-500';
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.beforeJoining || !item.isCurrentMonth) return;
                    setSelectedDay(item.day);
                  }}
                  onMouseEnter={(e) => {
                    if (item.beforeJoining) return;
                    handleCellMouseEnter(e, item);
                  }}
<<<<<<< HEAD
                  onMouseLeave={handleCellMouseLeave}
                  className={`min-h-[78px] sm:min-h-[116px] p-1.5 sm:p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between group ${item.beforeJoining ? 'cursor-not-allowed' : 'cursor-pointer'} ${cellStyle}`}
=======
                  className={`min-h-[75px] sm:min-h-[118px] p-1.5 sm:p-2.5 rounded-2xl border transition-all duration-150 flex flex-col justify-between cursor-pointer group ${cellStyle}`}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        isToday
                          ? 'bg-gradient-to-tr from-emerald-500 to-emerald-700 text-white shadow-xs'
                          : isSelected
                          ? 'bg-emerald-900 text-white'
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

                  {/* Day Badges and Event Tags: ONLY official holidays and weekends */}
                  <div className="space-y-1 mt-1 text-[10px]">
                    {item.beforeJoining && (
                      <div className="truncate px-2 py-0.5 rounded-md bg-slate-200 text-slate-500 font-semibold border border-slate-300" title="This day is before the employee joined">
                        Not joined
                      </div>
                    )}
                    {item.holiday && !item.beforeJoining && (
                      <div
                        className="truncate px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 font-extrabold border border-amber-300 shadow-2xs flex items-center gap-1"
                        title={`Holiday: ${item.holiday}`}
                      >
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600 shrink-0" />
                        <span className="truncate">{item.holiday}</span>
                      </div>
                    )}

                    {/* Weekend Tag */}
                    {item.isWeekend && !item.holiday && !item.beforeJoining && item.isCurrentMonth && (
                      <div
                        className="truncate px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs flex items-center gap-1"
                        title="Weekend"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="truncate">Weekend</span>
                      </div>
                    )}

                    {isAdminCalendar && (item.staffCount ?? 0) > 0 && !item.holiday && !item.isWeekend && (
                      <div className="truncate px-2 py-0.5 rounded-lg font-bold border shadow-2xs flex items-center gap-1 bg-emerald-50 text-emerald-800 border-emerald-200">
                        <Users className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{item.staffCount} staff</span>
                      </div>
                    )}

                    {/* Attendance Record Status (Regular Working Days Only) */}
                    {!isAdminCalendar && item.attendance && !item.beforeJoining && !item.holiday && !item.isWeekend && (
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
<<<<<<< HEAD

                    {/* Employees on Leave Badge */}
                    {item.isCurrentMonth && !item.beforeJoining && item.leaves && item.leaves.length > 0 && (
                      <div
                        className="truncate px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-amber-50 text-amber-900 border-amber-200 shadow-2xs"
                        title={`${item.leaves.length} employee(s) on leave`}
                      >
                        <CalendarOff className="w-2.5 h-2.5 shrink-0 text-amber-700" />
                        <span className="truncate">{item.leaves.length} on leave</span>
                      </div>
                    )}
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
        <div className="bg-white border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-950 text-white flex items-center justify-center font-black text-sm shadow-xs">
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

              {selectedDayInfo.isWeekend && !selectedDayInfo.holiday && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Weekend Off</span>
                </span>
              )}

              {selectedDayInfo.attendance && !selectedDayInfo.holiday && !selectedDayInfo.isWeekend && (
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
            </div>
          </div>

          {/* 4 Detail Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
            {/* Shift Timing */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">Shift Schedule</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.holiday || selectedDayInfo.isWeekend ? 'Off Duty' : '09:00 AM – 06:00 PM'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {selectedDayInfo.holiday ? 'Corporate Public Holiday' : selectedDayInfo.isWeekend ? 'Weekend Weekly Rest' : 'Standard Corporate Shift (8h net)'}
              </span>
            </div>

            {/* Punch In & Punch Out */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">Attendance Punch</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.attendance?.checkIn || '--'} → {selectedDayInfo.attendance?.checkOut || '--'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {selectedDayInfo.attendance?.workingHours
                  ? `${selectedDayInfo.attendance.workingHours} Hours logged`
                  : 'No attendance punch logged'}
              </span>
            </div>

            {/* Day Classification */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">Classification</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.holiday ? selectedDayInfo.holiday : selectedDayInfo.isWeekend ? 'Weekend Off' : 'Regular Work Day'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {selectedDayInfo.holidayObj?.description || (selectedDayInfo.isWeekend ? 'Saturday / Sunday corporate weekend' : 'Scheduled operational business day')}
              </span>
            </div>

            {/* Work Mode */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">Location / Presence</span>
              <span className="font-extrabold text-slate-900 text-sm mt-1 block">
                {selectedDayInfo.attendance?.isWFH ? 'Remote Work (WFH)' : 'Corporate Office Desk'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Monthly Schedule &amp; Event Timeline ({agendaEvents.length})
              </h3>
              <p className="text-xs text-slate-500">
                Chronological list of official corporate holidays and weekend schedule for {monthNames[month]} {year}.
              </p>
            </div>
          </div>

          {agendaEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No holidays or weekend events for this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendaEvents.map((evt) => (
                <div
                  key={evt.dateStr}
                  onClick={() => setSelectedDay(evt.day)}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold leading-none">{monthNames[month].slice(0, 3)}</span>
                      <span className="text-base font-black leading-none mt-0.5">{evt.day}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {evt.holiday
                          ? `🌟 ${evt.holiday}`
                          : evt.isWeekend
                          ? `🗓️ Weekend (${new Date(year, month, evt.day).toLocaleDateString('en-US', { weekday: 'long' })})`
                          : `💼 Work Shift: ${evt.attendance?.status || 'Scheduled'}`}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {evt.dateStr} • {new Date(year, month, evt.day).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {evt.holiday && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Official Holiday
                      </span>
                    )}
                    {evt.isWeekend && !evt.holiday && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Weekend Off
                      </span>
                    )}
                    {evt.attendance && !evt.holiday && !evt.isWeekend && (
                      <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
                        Punch: <span className="font-bold text-slate-900">{evt.attendance.checkIn} → {evt.attendance.checkOut || 'Active'}</span> ({evt.attendance.workingHours}h)
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
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

              const holidayId = String(h.id || (h as any)._id || (h as any).holidayId || '').trim();

              return (
                <div
                  key={holidayId || `${h.name}-${h.date}`}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all flex items-start justify-between gap-3"
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingHoliday({ id: holidayId, name: h.name });
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
<<<<<<< HEAD
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddHolidayOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Add Company Holiday
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Corporate schedule roster synchronization
                  </p>
=======
        <div onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddHolidayOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#062d1f] to-[#0a422e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-white/10 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Add Company Holiday</h3>
                  <p className="text-[11px] text-[#a7f3d0]">Corporate schedule roster synchronization</p>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddHolidayOpen(false)}
<<<<<<< HEAD
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
=======
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div>
<<<<<<< HEAD
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Holiday Name *</label>
=======
                <label className="block font-bold text-slate-700 mb-1.5">Holiday Name *</label>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                <input
                  type="text"
                  required
                  placeholder="e.g., Diwali / Deepawali Festival"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
<<<<<<< HEAD
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
=======
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Calendar Date *</label>
=======
                  <label className="block font-bold text-slate-700 mb-1.5">Calendar Date *</label>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
<<<<<<< HEAD
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Classification</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
=======
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Holiday Classification</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  >
                    <option value="Public">Public / Gazetted</option>
                    <option value="Optional">Optional / Floating</option>
                    <option value="Company">Company Special</option>
                  </select>
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description / Remarks</label>
=======
                <label className="block font-bold text-slate-700 mb-1.5">Description / Remarks</label>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                <input
                  type="text"
                  placeholder="e.g., Annual Festival of Lights Celebration"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
<<<<<<< HEAD
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
=======
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                >
                  Cancel
                </button>
                <button
                  type="submit"
<<<<<<< HEAD
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
=======
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-md shadow-emerald-500/20 active:scale-95"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200/80 space-y-4 my-auto animate-in zoom-in-95 duration-200">
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

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingHoliday}
                onClick={() => setDeletingHoliday(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingHoliday}
                onClick={handleConfirmDeleteHoliday}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDeletingHoliday ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
<<<<<<< HEAD

      {/* =========================================================================
          MODAL: CONFIGURE CORPORATE WEEKEND POLICY
          ========================================================================= */}
      {mounted && isWeekendModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingWeekend) setIsWeekendModalOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Corporate Weekend Schedule
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Configure official weekly off days for company calendar &amp; attendance
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingWeekend}
                onClick={() => setIsWeekendModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Day selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Weekly Non-Working Days (Off Days)
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    { day: 0, label: 'Sunday', short: 'Sun' },
                    { day: 1, label: 'Monday', short: 'Mon' },
                    { day: 2, label: 'Tuesday', short: 'Tue' },
                    { day: 3, label: 'Wednesday', short: 'Wed' },
                    { day: 4, label: 'Thursday', short: 'Thu' },
                    { day: 5, label: 'Friday', short: 'Fri' },
                    { day: 6, label: 'Saturday', short: 'Sat' },
                  ].map((d) => {
                    const isSelected = editingWeekendDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditingWeekendDays(editingWeekendDays.filter((x) => x !== d.day));
                            if (d.day === 6) setEditingSatRule('none');
                          } else {
                            const next = [...editingWeekendDays, d.day].sort();
                            setEditingWeekendDays(next);
                            if (d.day === 6 && editingSatRule === 'none') {
                              setEditingSatRule('all');
                            }
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        <span>{d.label}</span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? 'Off' : 'Work'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saturday Rule Selector (if Saturday is selected) */}
              {editingWeekendDays.includes(6) && (
                <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-semibold text-slate-700">
                    Saturday Operational Schedule
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Choose whether all Saturdays are holidays or alternate Saturdays remain working days.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'all', title: 'All Saturdays Off', desc: 'Every Saturday is a full corporate weekend' },
                      { id: 'alternate_2_4', title: '2nd & 4th Saturday Off', desc: '1st, 3rd & 5th Saturdays are working days' },
                      { id: 'alternate_1_3', title: '1st & 3rd Saturday Off', desc: '2nd & 4th Saturdays are working days' },
                    ].map((opt) => {
                      const isAct = editingSatRule === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setEditingSatRule(opt.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isAct
                              ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{opt.title}</span>
                            <input
                              type="radio"
                              name="calendarSatRule"
                              checked={isAct}
                              onChange={() => { }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real-time Summary Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Preview Configuration:</span>
                </div>
                <p className="mt-1 font-bold text-xs text-indigo-950">
                  {getWeekendPolicyDescription({
                    weekendDays: editingWeekendDays,
                    saturdayRule: editingWeekendDays.includes(6) ? editingSatRule : 'none',
                  })}
                </p>
                <p className="text-[11px] text-indigo-700/80 mt-0.5">
                  Unselected days will be treated as operational business days in calendar statistics and attendance records.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isSavingWeekend}
                onClick={() => setIsWeekendModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingWeekend}
                onClick={handleSaveWeekendPolicy}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingWeekend ? 'Saving Policy...' : 'Save Weekend Policy'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          ANIMATED FLOATING HOVER POPUP (DATE DETAILS & EMPLOYEES ON LEAVE)
          ========================================================================= */}
      {mounted && hoveredDate && hoverPosition && typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseEnter={handlePopupMouseEnter}
            onMouseLeave={handlePopupMouseLeave}
            style={{
              position: 'fixed',
              left: `${hoverPosition.x}px`,
              ...(hoverPosition.placement === 'bottom'
                ? { top: `${hoverPosition.y}px` }
                : { bottom: `${window.innerHeight - hoverPosition.y}px` }),
              zIndex: 99999,
            }}
            className={`w-76 sm:w-80 bg-white/95 backdrop-blur-md border border-[#dee2e6] rounded-2xl shadow-xl p-3.5 space-y-3 pointer-events-auto select-none ${
              hoverPosition.placement === 'bottom' ? 'animate-calendar-pop' : 'animate-calendar-pop-above'
            }`}
          >
            {/* Header: Date + Day Badge */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e9ecef] gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {hoveredDate.day}
                </div>
                <div className="leading-tight">
                  <h4 className="text-xs font-bold text-[#212529]">
                    {hoveredDate.day} {monthNames[month]} {year}
                  </h4>
                  <span className="text-[10px] text-[#6c757d] font-medium">
                    {new Date(year, month, hoveredDate.day).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>
              </div>

              {/* Day Classification Badge */}
              <div>
                {hoveredDate.holiday ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1b4332] text-[#95d5b2] border border-[#081c15] flex items-center gap-1 shadow-2xs">
                    <Star className="w-2.5 h-2.5 fill-[#95d5b2]" />
                    <span className="truncate max-w-[80px]">Holiday</span>
                  </span>
                ) : hoveredDate.isWeekend ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e9ecef] text-[#495057] border border-[#ced4da] flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6c757d]" />
                    <span>Weekend</span>
                  </span>
                ) : hoveredDate.isToday ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d8f3dc] text-[#1b4332] border border-[#74c69d] flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
                    <span>Today</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f8f9fa] text-[#495057] border border-[#dee2e6]">
                    Work Day
                  </span>
                )}
              </div>
            </div>

            {/* Date Details / Shift & Punch Summary */}
            <div className="bg-[#f8f9fa] rounded-xl p-2.5 border border-[#e9ecef] space-y-1 text-[11px]">
              {hoveredDate.holiday ? (
                <div className="flex items-start gap-1.5 text-[#1b4332]">
                  <Star className="w-3 h-3 text-[#2d6a4f] fill-[#2d6a4f] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{hoveredDate.holiday}</span>
                    {hoveredDate.holidayObj?.description && (
                      <p className="text-[10px] text-[#6c757d] leading-normal mt-0.5">
                        {hoveredDate.holidayObj.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : hoveredDate.isWeekend ? (
                <div className="flex items-center gap-1.5 text-[#495057]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#6c757d] shrink-0" />
                  <span>Weekly Off Duty &bull; {getWeekendPolicyDescription(scheduleConfig)}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[#495057]">
                    <span className="text-[10px] text-[#6c757d]">Shift:</span>
                    <span className="font-semibold text-[#212529]">
                      {scheduleConfig.shiftStartTime || '09:00 AM'} – {scheduleConfig.shiftEndTime || '06:00 PM'}
                    </span>
                  </div>

                  {isAdminCalendar ? (
                    <div className="flex items-center justify-between text-[#495057] pt-0.5 border-t border-[#e9ecef]">
                      <span className="text-[10px] text-[#6c757d]">Present:</span>
                      <span className="font-semibold text-[#1b4332] flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#2d6a4f]" />
                        <span>{(hoveredDate.staffCount ?? 0) > 0 ? `${hoveredDate.staffCount} Staff Present` : '0 Present'}</span>
                      </span>
                    </div>
                  ) : hoveredDate.attendance ? (
                    <div className="flex items-center justify-between text-[#495057] pt-0.5 border-t border-[#e9ecef]">
                      <span className="text-[10px] text-[#6c757d]">Punch:</span>
                      <span className="font-semibold text-[#1b4332]">
                        {hoveredDate.attendance.checkIn || '--'} &rarr; {hoveredDate.attendance.checkOut || 'Active'}
                        {hoveredDate.attendance.workingHours ? ` (${hoveredDate.attendance.workingHours}h)` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[#6c757d] pt-0.5 border-t border-[#e9ecef]">
                      <span className="text-[10px]">Status:</span>
                      <span className="text-[10px] font-medium italic">No attendance punched</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Employees On Leave List Section */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#212529] flex items-center gap-1.5 text-[11px]">
                  <CalendarOff className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Employees on Leave</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    hoveredDate.leaves.length > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-[#e9ecef] text-[#6c757d]'
                  }`}
                >
                  {hoveredDate.leaves.length}
                </span>
              </div>

              {hoveredDate.leaves.length === 0 ? (
                <div className="flex items-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] text-[11px] text-[#6c757d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                  <span>No employees on leave on this date</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 custom-scrollbar">
                  {hoveredDate.leaves.map((lv: LeaveRequest, lIdx: number) => {
                    const empName = resolveLeaveEmployeeName(lv);
                    const deptName = resolveLeaveDepartment(lv);
                    const isApproved = lv.status === 'Approved';
                    const isOwn = isOwnLeave(lv);

                    return (
                      <div
                        key={lv.id || lIdx}
                        className="p-2 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#95d5b2] hover:bg-[#d8f3dc]/15 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#1b4332] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[11px] font-bold text-[#212529] truncate flex items-center gap-1">
                              <span>{empName}</span>
                              {isOwn && (
                                <span className="text-[9px] font-semibold text-[#2d6a4f]">(You)</span>
                              )}
                            </p>
                            <p className="text-[10px] text-[#6c757d] truncate">
                              {deptName} &bull; <span className="font-medium text-[#495057]">{lv.leaveType}</span>
                              {lv.isHalfDay && ' (Half Day)'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${
                            isApproved
                              ? 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {lv.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* =========================================================================
          MODAL: CONFIGURE CORPORATE WEEKEND POLICY
          ========================================================================= */}
      {mounted && isWeekendModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingWeekend) setIsWeekendModalOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#081c15]/55 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#dee2e6] overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-5 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/15 text-[#95d5b2]">
                  <CalendarDays className="w-5 h-5 text-[#95d5b2]" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Corporate Weekend Schedule
                  </h3>
                  <p className="text-[11px] text-[#d8f3dc]">
                    Configure official weekly off days for company calendar &amp; attendance
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingWeekend}
                onClick={() => setIsWeekendModalOpen(false)}
                className="p-1.5 rounded-xl text-[#d8f3dc] hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Day selection */}
              <div>
                <label className="block text-xs font-bold text-[#212529] mb-1">
                  Weekly Non-Working Days (Off Days)
                </label>
                <p className="text-[11px] text-[#6c757d] mb-3">
                  Click a day to toggle between Working Day and Weekend Off. Only selected days will appear as weekends.
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { day: 0, label: 'Sunday', short: 'Sun' },
                    { day: 1, label: 'Monday', short: 'Mon' },
                    { day: 2, label: 'Tuesday', short: 'Tue' },
                    { day: 3, label: 'Wednesday', short: 'Wed' },
                    { day: 4, label: 'Thursday', short: 'Thu' },
                    { day: 5, label: 'Friday', short: 'Fri' },
                    { day: 6, label: 'Saturday', short: 'Sat' },
                  ].map((d) => {
                    const isSelected = editingWeekendDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditingWeekendDays(editingWeekendDays.filter((x) => x !== d.day));
                            if (d.day === 6) setEditingSatRule('none');
                          } else {
                            const next = [...editingWeekendDays, d.day].sort();
                            setEditingWeekendDays(next);
                            if (d.day === 6 && editingSatRule === 'none') {
                              setEditingSatRule('all');
                            }
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${isSelected
                            ? 'bg-[#1b4332] text-white border-[#081c15] shadow-xs'
                            : 'bg-[#f8f9fa] text-[#495057] border-[#dee2e6] hover:border-[#adb5bd] hover:bg-white'
                          }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#95d5b2]" />}
                        <span>{d.label}</span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold ${isSelected ? 'bg-white/20 text-[#d8f3dc]' : 'bg-[#e9ecef] text-[#6c757d]'
                            }`}
                        >
                          {isSelected ? 'Off' : 'Work'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saturday Rule Selector (if Saturday is selected) */}
              {editingWeekendDays.includes(6) && (
                <div className="pt-3 border-t border-[#e9ecef] space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-[#212529]">
                    Saturday Operational Schedule
                  </label>
                  <p className="text-[11px] text-[#6c757d]">
                    Choose whether all Saturdays are holidays or alternate Saturdays remain working days.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'all', title: 'All Saturdays Off', desc: 'Every Saturday is a full corporate weekend' },
                      { id: 'alternate_2_4', title: '2nd & 4th Saturday Off', desc: '1st, 3rd & 5th Saturdays are working days' },
                      { id: 'alternate_1_3', title: '1st & 3rd Saturday Off', desc: '2nd & 4th Saturdays are working days' },
                    ].map((opt) => {
                      const isAct = editingSatRule === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setEditingSatRule(opt.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${isAct
                              ? 'border-[#1b4332] bg-[#d8f3dc]/35 ring-1 ring-[#1b4332]'
                              : 'border-[#dee2e6] bg-[#f8f9fa] hover:border-[#adb5bd]'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#212529]">{opt.title}</span>
                            <input
                              type="radio"
                              name="calendarSatRule"
                              checked={isAct}
                              onChange={() => { }}
                              className="text-[#1b4332] focus:ring-[#2d6a4f]"
                            />
                          </div>
                          <p className="text-[11px] text-[#6c757d] mt-1 leading-snug">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real-time Summary Box */}
              <div className="p-3.5 rounded-xl bg-[#d8f3dc]/40 border border-[#95d5b2] text-[#1b4332] text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f]" />
                  <span>Preview Configuration:</span>
                </div>
                <p className="mt-1 font-semibold text-sm text-[#081c15]">
                  {getWeekendPolicyDescription({
                    weekendDays: editingWeekendDays,
                    saturdayRule: editingWeekendDays.includes(6) ? editingSatRule : 'none',
                  })}
                </p>
                <p className="text-[11px] text-[#2d6a4f] mt-0.5">
                  Unselected days will be treated as operational business days in calendar statistics and attendance records.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e9ecef]">
                <button
                  type="button"
                  disabled={isSavingWeekend}
                  onClick={() => setIsWeekendModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#dee2e6] text-[#495057] font-bold text-xs hover:bg-[#f8f9fa] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingWeekend}
                  onClick={handleSaveWeekendPolicy}
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-xs shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingWeekend ? 'Saving Policy...' : 'Save Weekend Policy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          ANIMATED FLOATING HOVER POPUP (DATE DETAILS & EMPLOYEES ON LEAVE)
          ========================================================================= */}
      {mounted && hoveredDate && hoverPosition && typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseEnter={handlePopupMouseEnter}
            onMouseLeave={handlePopupMouseLeave}
            style={{
              position: 'fixed',
              left: `${hoverPosition.x}px`,
              ...(hoverPosition.placement === 'bottom'
                ? { top: `${hoverPosition.y}px` }
                : { bottom: `${window.innerHeight - hoverPosition.y}px` }),
              zIndex: 99999,
            }}
            className={`w-76 sm:w-80 bg-white/95 backdrop-blur-md border border-[#dee2e6] rounded-2xl shadow-xl p-3.5 space-y-3 pointer-events-auto select-none ${
              hoverPosition.placement === 'bottom' ? 'animate-calendar-pop' : 'animate-calendar-pop-above'
            }`}
          >
            {/* Header: Date + Day Badge */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e9ecef] gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {hoveredDate.day}
                </div>
                <div className="leading-tight">
                  <h4 className="text-xs font-bold text-[#212529]">
                    {hoveredDate.day} {monthNames[month]} {year}
                  </h4>
                  <span className="text-[10px] text-[#6c757d] font-medium">
                    {new Date(year, month, hoveredDate.day).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>
              </div>

              {/* Day Classification Badge */}
              <div>
                {hoveredDate.holiday ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1b4332] text-[#95d5b2] border border-[#081c15] flex items-center gap-1 shadow-2xs">
                    <Star className="w-2.5 h-2.5 fill-[#95d5b2]" />
                    <span className="truncate max-w-[80px]">Holiday</span>
                  </span>
                ) : hoveredDate.isWeekend ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e9ecef] text-[#495057] border border-[#ced4da] flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6c757d]" />
                    <span>Weekend</span>
                  </span>
                ) : hoveredDate.isToday ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d8f3dc] text-[#1b4332] border border-[#74c69d] flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
                    <span>Today</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f8f9fa] text-[#495057] border border-[#dee2e6]">
                    Work Day
                  </span>
                )}
              </div>
            </div>

            {/* Date Details / Shift & Punch Summary */}
            <div className="bg-[#f8f9fa] rounded-xl p-2.5 border border-[#e9ecef] space-y-1 text-[11px]">
              {hoveredDate.holiday ? (
                <div className="flex items-start gap-1.5 text-[#1b4332]">
                  <Star className="w-3 h-3 text-[#2d6a4f] fill-[#2d6a4f] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{hoveredDate.holiday}</span>
                    {hoveredDate.holidayObj?.description && (
                      <p className="text-[10px] text-[#6c757d] leading-normal mt-0.5">
                        {hoveredDate.holidayObj.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : hoveredDate.isWeekend ? (
                <div className="flex items-center gap-1.5 text-[#495057]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#6c757d] shrink-0" />
                  <span>Weekly Off Duty &bull; {getWeekendPolicyDescription(scheduleConfig)}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[#495057]">
                    <span className="text-[10px] text-[#6c757d]">Shift:</span>
                    <span className="font-semibold text-[#212529]">
                      {scheduleConfig.shiftStartTime || '09:00 AM'} – {scheduleConfig.shiftEndTime || '06:00 PM'}
                    </span>
                  </div>

                  {isAdminCalendar ? (
                    <div className="flex items-center justify-between text-[#495057] pt-0.5 border-t border-[#e9ecef]">
                      <span className="text-[10px] text-[#6c757d]">Present:</span>
                      <span className="font-semibold text-[#1b4332] flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#2d6a4f]" />
                        <span>{(hoveredDate.staffCount ?? 0) > 0 ? `${hoveredDate.staffCount} Staff Present` : '0 Present'}</span>
                      </span>
                    </div>
                  ) : hoveredDate.attendance ? (
                    <div className="flex items-center justify-between text-[#495057] pt-0.5 border-t border-[#e9ecef]">
                      <span className="text-[10px] text-[#6c757d]">Punch:</span>
                      <span className="font-semibold text-[#1b4332]">
                        {hoveredDate.attendance.checkIn || '--'} &rarr; {hoveredDate.attendance.checkOut || 'Active'}
                        {hoveredDate.attendance.workingHours ? ` (${hoveredDate.attendance.workingHours}h)` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[#6c757d] pt-0.5 border-t border-[#e9ecef]">
                      <span className="text-[10px]">Status:</span>
                      <span className="text-[10px] font-medium italic">No attendance punched</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Employees On Leave List Section */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#212529] flex items-center gap-1.5 text-[11px]">
                  <CalendarOff className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Employees on Leave</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    hoveredDate.leaves.length > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-[#e9ecef] text-[#6c757d]'
                  }`}
                >
                  {hoveredDate.leaves.length}
                </span>
              </div>

              {hoveredDate.leaves.length === 0 ? (
                <div className="flex items-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] text-[11px] text-[#6c757d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                  <span>No employees on leave on this date</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 custom-scrollbar">
                  {hoveredDate.leaves.map((lv: LeaveRequest, lIdx: number) => {
                    const empName = resolveLeaveEmployeeName(lv);
                    const deptName = resolveLeaveDepartment(lv);
                    const isApproved = lv.status === 'Approved';
                    const isOwn = isOwnLeave(lv);

                    return (
                      <div
                        key={lv.id || lIdx}
                        className="p-2 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#95d5b2] hover:bg-[#d8f3dc]/15 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#1b4332] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[11px] font-bold text-[#212529] truncate flex items-center gap-1">
                              <span>{empName}</span>
                              {isOwn && (
                                <span className="text-[9px] font-semibold text-[#2d6a4f]">(You)</span>
                              )}
                            </p>
                            <p className="text-[10px] text-[#6c757d] truncate">
                              {deptName} &bull; <span className="font-medium text-[#495057]">{lv.leaveType}</span>
                              {lv.isHalfDay && ' (Half Day)'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${
                            isApproved
                              ? 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {lv.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    </div>
  );
};
