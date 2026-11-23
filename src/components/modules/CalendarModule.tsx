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
  CalendarOff,
  UserMinus,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getAllLeaves, setLiveLeaves } from '../../lib/leaveService';
import { getAllEmployees } from '../../lib/employeeService';
import {
  WorkScheduleConfig,
  getWorkScheduleConfig,
  saveWorkScheduleConfig,
  isDateWeekend,
  getWeekendPolicyDescription,
} from '../../lib/shiftScheduleService';

interface CalendarModuleProps {
  attendance: AttendanceRecord[];
  leaves?: LeaveRequest[];
  onOpenLeaveModal?: () => void;
  onOpenClockModal?: () => void;
  portalMode?: 'employee' | 'admin';
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  attendance,
  leaves: leavesProp = [],
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

  // Tooltip Hover Popup State for Dates & Employees on Leave
  interface HoveredDateInfo {
    day: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    holiday?: string;
    holidayObj?: any;
    attendance?: AttendanceRecord;
    staffCount?: number;
    leaves: LeaveRequest[];
  }

  interface HoverPosition {
    x: number;
    y: number;
    placement: 'top' | 'bottom';
  }

  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [hoveredDate, setHoveredDate] = useState<HoveredDateInfo | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition | null>(null);

  const handleCellMouseEnter = (e: React.MouseEvent<HTMLDivElement>, item: any) => {
    if (!item.isCurrentMonth && !item.day) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 320;
    const estimatedHeight = 250;

    let x = rect.left + rect.width / 2 - popupWidth / 2;
    const minX = 12;
    const maxX = window.innerWidth - popupWidth - 12;
    x = Math.max(minX, Math.min(x, maxX));

    let y: number;
    let placement: 'top' | 'bottom';
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= estimatedHeight + 16 || spaceBelow >= spaceAbove) {
      y = rect.bottom + 8;
      placement = 'bottom';
    } else {
      y = rect.top - 8;
      placement = 'top';
    }

    const isToday =
      item.isCurrentMonth &&
      item.day === todayDateNum &&
      month === todayMonth &&
      year === todayYear;

    setHoveredDate({
      day: item.day,
      dateStr: item.dateStr,
      isCurrentMonth: item.isCurrentMonth,
      isToday,
      isWeekend: item.isWeekend,
      holiday: item.holiday,
      holidayObj: item.holidayObj,
      attendance: item.attendance,
      staffCount: item.staffCount,
      leaves: item.leaves || [],
    });

    setHoverPosition({ x, y, placement });
  };

  const handleCellMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDate(null);
      setHoverPosition(null);
    }, 120);
  };

  const handlePopupMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    setHoveredDate(null);
    setHoverPosition(null);
  };

  useEffect(() => {
    const handleScrollOrResize = () => {
      setHoveredDate(null);
      setHoverPosition(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Corporate Work Schedule & Weekend Config (Loaded from backend settings)
  const [scheduleConfig, setScheduleConfig] = useState<WorkScheduleConfig>(() =>
    getWorkScheduleConfig(user?.companyId)
  );
  // Modal: Weekend Rules Config
  const [isWeekendModalOpen, setIsWeekendModalOpen] = useState(false);
  const [editingWeekendDays, setEditingWeekendDays] = useState<number[]>([0]);
  const [editingSatRule, setEditingSatRule] = useState<'all' | 'none' | 'alternate_2_4' | 'alternate_1_3'>('none');
  const [isSavingWeekend, setIsSavingWeekend] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync Work Schedule & Weekend Config from backend & live events
  useEffect(() => {
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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddHolidayOpen(false);
        setIsWeekendModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
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
    if (!deletingHoliday || portalMode === 'employee') return;
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
      const dateStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      const dayLeaves = leavesList.filter((l) => isLeaveActiveOnDate(l, dateStr));
      list.push({
        day: dNum,
        isCurrentMonth: false,
        dateStr,
        isWeekend: isDateWeekend(dateStr, scheduleConfig),
        leaves: dayLeaves,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = isDateWeekend(dateStr, scheduleConfig);

      const dayRecords = userAttendance.filter((a) => a.date === dateStr);
      const holObj = holidayDateMap[dateStr];
      const dayLeaves = leavesList.filter((l) => isLeaveActiveOnDate(l, dateStr));

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
        leaves: dayLeaves,
      });
    }

    // Padding for next month
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth() + 1;
    const totalSlots = Math.ceil(list.length / 7) * 7;
    const remainingSlots = totalSlots - list.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const dateStr = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayLeaves = leavesList.filter((l) => isLeaveActiveOnDate(l, dateStr));
      list.push({
        day: i,
        isCurrentMonth: false,
        dateStr,
        isWeekend: isDateWeekend(dateStr, scheduleConfig),
        leaves: dayLeaves,
      });
    }

    return list;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, userAttendance, holidayDateMap, scheduleConfig, leavesList]);

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
          <p className="text-lg font-semibold tracking-tight text-[#212529] mt-1">
            {monthNames[month].slice(0, 3)} {year}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6c757d] font-medium">
            <span>{stats.totalDays} Total Days</span>
          </div>
        </div>

        {/* Card 2: Working Days */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6c757d] uppercase tracking-wider">Working Days</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-[#495057]" />
            </div>
          </div>
          <p className="text-lg font-semibold tracking-tight text-[#212529] mt-1">
            {stats.workingDays} <span className="text-xs font-semibold text-[#6c757d]">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#2d6a4f] font-semibold">
            <span>Excludes weekends</span>
          </div>
        </div>

        {/* Card 3: Days Logged / Present */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6c757d] uppercase tracking-wider">{isAdminCalendar ? 'Staff Present' : 'Logged In'}</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
            </div>
          </div>
          <p className="text-lg font-semibold tracking-tight text-[#1b4332] mt-1">
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
            <span className="text-[11px] font-semibold text-[#6c757d] uppercase tracking-wider">Holidays</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-[#2d6a4f]" />
            </div>
          </div>
          <p className="text-lg font-semibold tracking-tight text-[#212529] mt-1">
            {stats.holidaysCount} <span className="text-xs font-semibold text-[#6c757d]">Days</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#495057] font-medium">
            <span>Official gazetted</span>
          </div>
        </div>

        {/* Card 5: Hours Worked */}
        <div className="p-4 rounded-xl bg-white border border-[#dee2e6] shadow-2xs hover:border-[#95d5b2] transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6c757d] uppercase tracking-wider">{isAdminCalendar ? 'Team Hours' : 'Tracked Hours'}</span>
            <div className="w-8 h-8 rounded-[10px] border border-[#ced4da] bg-[#f8f9fa] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#495057]" />
            </div>
          </div>
          <p className="text-lg font-semibold tracking-tight text-[#212529] mt-1">
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
              <>
                <button
                  type="button"
                  onClick={handleOpenWeekendModal}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#f8f9fa] border border-[#ced4da] text-[#212529] hover:text-[#1b4332] text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  title="Configure Corporate Weekend Policy"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Weekend Rules</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Holiday</span>
                </button>
              </>
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
              <span
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e9ecef] text-[#495057] border border-[#ced4da]"
                title={`Company Weekend Schedule: ${getWeekendPolicyDescription(scheduleConfig)}`}
              >
                <span className="w-2 h-2 rounded-full bg-[#6c757d]" /> Weekend ({getWeekendPolicyDescription(scheduleConfig)})
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
              const isWeekend = (scheduleConfig.weekendDays ?? [0]).includes(i) || (i === 6 && (scheduleConfig.saturdayRule || 'none') !== 'none');
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
                  onMouseEnter={(e) => handleCellMouseEnter(e, item)}
                  onMouseLeave={handleCellMouseLeave}
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

                    {/* Employees on Leave Badge */}
                    {item.isCurrentMonth && item.leaves && item.leaves.length > 0 && (
                      <div
                        className="truncate px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-amber-50 text-amber-900 border-amber-200 shadow-2xs"
                        title={`${item.leaves.length} employee(s) on leave`}
                      >
                        <CalendarOff className="w-2.5 h-2.5 shrink-0 text-amber-700" />
                        <span className="truncate">{item.leaves.length} on leave</span>
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
                {selectedDayInfo.holiday || selectedDayInfo.isWeekend
                  ? 'Off Duty'
                  : `${scheduleConfig.shiftStartTime || '09:00 AM'} – ${scheduleConfig.shiftEndTime || '06:00 PM'}`}
              </span>
              <span className="text-[11px] text-[#6c757d] mt-0.5 block">
                {selectedDayInfo.holiday
                  ? 'Corporate Public Holiday'
                  : selectedDayInfo.isWeekend
                    ? 'Official Weekend Weekly Rest'
                    : 'Standard Corporate Shift'}
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
                {selectedDayInfo.holidayObj?.description ||
                  (selectedDayInfo.isWeekend
                    ? `${new Date(year, month, selectedDayInfo.day).toLocaleDateString('en-US', { weekday: 'long' })} corporate weekend off`
                    : 'Scheduled operational business day')}
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

          {/* Employees On Leave in Selected Day */}
          <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#212529] flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-[#2d6a4f]" />
                <span>Employees on Leave ({selectedDayInfo.leaves?.length || 0})</span>
              </span>
              {selectedDayInfo.leaves && selectedDayInfo.leaves.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {selectedDayInfo.leaves.length} on leave
                </span>
              )}
            </div>

            {selectedDayInfo.leaves && selectedDayInfo.leaves.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {selectedDayInfo.leaves.map((lv: LeaveRequest, lIdx: number) => {
                  const empName = resolveLeaveEmployeeName(lv);
                  const deptName = resolveLeaveDepartment(lv);
                  const isApproved = lv.status === 'Approved';
                  const isOwn = isOwnLeave(lv);

                  return (
                    <div
                      key={lv.id || lIdx}
                      className="p-2.5 rounded-xl bg-white border border-[#dee2e6] hover:border-[#95d5b2] transition-all flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#1b4332] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {empName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <p className="text-xs font-bold text-[#212529] truncate flex items-center gap-1">
                            <span>{empName}</span>
                            {isOwn && <span className="text-[10px] font-semibold text-[#2d6a4f]">(You)</span>}
                          </p>
                          <p className="text-[10px] text-[#6c757d] truncate">
                            {deptName} &bull; <span className="font-medium text-[#495057]">{lv.leaveType}</span>
                            {lv.isHalfDay && ' (Half Day)'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
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
            ) : (
              <div className="flex items-center gap-2 py-2 text-xs text-[#6c757d]">
                <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
                <span>No employees on leave on this date.</span>
              </div>
            )}
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
                      <span className="text-[10px] font-semibold uppercase leading-none">{monthNames[month].slice(0, 3)}</span>
                      <span className="text-base font-semibold leading-none mt-0.5">{evt.day}</span>
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
                <>
                  <button
                    type="button"
                    onClick={handleOpenWeekendModal}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] hover:text-[#1b4332] text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Configure Corporate Weekend Policy"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Weekend Rules</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddHolidayOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Holiday</span>
                  </button>
                </>
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
                      <span className="text-[10px] font-semibold uppercase text-[#2d6a4f] leading-none">{mName || 'DAY'}</span>
                      <span className="text-base font-semibold leading-none mt-0.5">{dNum || '--'}</span>
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

                  {portalMode !== 'employee' && (
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
      {mounted && isAddHolidayOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddHolidayOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
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
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddHolidayOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Diwali / Deepawali Festival"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Calendar Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Classification</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                  >
                    <option value="Public">Public / Gazetted</option>
                    <option value="Optional">Optional / Floating</option>
                    <option value="Company">Company Special</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Annual Festival of Lights Celebration"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200/80 space-y-4 my-auto">
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

      {/* =========================================================================
          MODAL: CONFIGURE CORPORATE WEEKEND POLICY
          ========================================================================= */}
      {mounted && isWeekendModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingWeekend) setIsWeekendModalOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
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
    </div>
  );
};
