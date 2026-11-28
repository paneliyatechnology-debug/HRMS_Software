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
  ChevronDown,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest } from '../../types/hrms';
import { ThemedDatePicker } from '../modals/LeaveModal';
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

  // View state: 'grid' (Month view), 'agenda' (Chronological list), 'holidays' (Corporate holiday roster), 'events' (Events & Birthdays)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'holidays' | 'events'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'attendance' | 'holidays'>('all');
  const [listScope, setListScope] = useState<'month' | 'day'>('month');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [holidayTypeDropdownOpen, setHolidayTypeDropdownOpen] = useState(false);

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
  // Events & Birthdays
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [eventCategory, setEventCategory] = useState<'Anniversary' | 'Celebration' | 'Meeting' | 'Other'>('Anniversary');
  const [eventDescription, setEventDescription] = useState('');
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

  const loadEvents = async (targetYear: number) => {
    try {
      const data = await api.getCalendarEvents(targetYear);
      setEventsList(Array.isArray(data) ? data : []);
    } catch {
      setEventsList([]);
    }
  };

  useEffect(() => {
    loadEvents(currentDate.getFullYear());
  }, [currentDate.getFullYear()]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      showToast({ type: 'warning', title: 'Details missing', message: 'Event title and date are required.' });
      return;
    }
    try {
      const created = await api.createCalendarEvent({
        title: eventTitle.trim(),
        date: eventDate,
        category: eventCategory,
        description: eventDescription.trim() || undefined,
      });
      setEventsList((prev) => [...prev, created].sort((a, b) => String(a.date).localeCompare(String(b.date))));
      showToast({ type: 'success', title: 'Event Added', message: `${created.title} added to calendar.` });
      setIsAddEventOpen(false);
      setEventTitle('');
      setEventDescription('');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add', message: err.message || 'Could not create event.' });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.deleteCalendarEvent(eventId);
      setEventsList((prev) => prev.filter((ev) => ev.id !== eventId));
      showToast({ type: 'success', title: 'Event Deleted', message: 'Event removed from calendar.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message || 'Could not delete event.' });
    }
  };

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

  // Create lookup for holidays by dateStr (supporting multiple holidays per day)
  const holidayDateMap: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    holidaysList.forEach((h) => {
      map[h.date] = h;
    });
    return map;
  }, [holidaysList]);

  const eventsByDate: Record<string, any[]> = useMemo(() => {
    const map: Record<string, any[]> = {};
    eventsList.forEach((ev) => {
      const d = String(ev.date || '').slice(0, 10);
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    });
    return map;
  }, [eventsList]);

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
      const beforeJoining = !isAdminCalendar && Boolean(joinedOn) && dateStr < joinedOn;
      const holObj = beforeJoining ? undefined : holidayDateMap[dateStr];
      const dayLeaves = beforeJoining ? [] : leavesList.filter((l) => isLeaveActiveOnDate(l, dateStr));

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
        events: eventsByDate[dateStr] || [],
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
        events: eventsByDate[dateStr] || [],
      });
    }

    return list;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, userAttendance, holidayDateMap, eventsByDate, scheduleConfig, leavesList, isAdminCalendar, joinedOn]);

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

  // Build Monday-first mini calendar grid for the left panel
  const miniCalendarDays = (() => {
    const firstDow = new Date(year, month, 1).getDay();
    const mondayOffset = (firstDow + 6) % 7;
    const totalMonthDays = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevY = prevMonthDate.getFullYear();
    const prevM = prevMonthDate.getMonth() + 1;
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextY = nextMonthDate.getFullYear();
    const nextM = nextMonthDate.getMonth() + 1;

    const currentMonthMap = new Map<number, any>();
    days.forEach((d) => {
      if (d.isCurrentMonth) currentMonthMap.set(d.day, d);
    });

    const cells: any[] = [];
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      cells.push({ day: dNum, isCurrentMonth: false, dateStr, leaves: [] });
    }
    for (let d = 1; d <= totalMonthDays; d++) {
      const existing = currentMonthMap.get(d);
      if (existing) {
        cells.push(existing);
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, isCurrentMonth: true, dateStr, leaves: [] });
      }
    }
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    const rem = totalSlots - cells.length;
    for (let i = 1; i <= rem; i++) {
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, isCurrentMonth: false, dateStr, leaves: [] });
    }
    return cells;
  })();

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const effectiveListScope = listScope;
  const activeDay = selectedDay;
  const activeDayInfo = selectedDayInfo;
  const activeDateStr = selectedDateStr;

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDateNum).padStart(2, '0')}`;

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr === todayDateStr) return 'Today';
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  type CalendarFeedItem = {
    id: string;
    kind: 'holiday' | 'leave' | 'attendance' | 'weekend';
    title: string;
    subtitle: string;
    meta?: string;
    badge: string;
    badgeTone: string;
    dotColor: string;
    sortDate: string;
    holidayId?: string;
    holidayName?: string;
    avatarLetter?: string;
  };

  const feedItems: CalendarFeedItem[] = (() => {
    const items: CalendarFeedItem[] = [];

    const relevantHolidays = effectiveListScope === 'day'
      ? holidaysList.filter((h) => normalizeDate(h.date) === activeDateStr)
      : holidaysList.filter((h) => normalizeDate(h.date).startsWith(monthPrefix));

    relevantHolidays.forEach((h: any, idx: number) => {
      const hDate = normalizeDate(h.date);
      const hType = h.type || 'Public';
      const hId = h._id || h.id || `hol-${idx}`;
      items.push({
        id: `holiday-${hId}`,
        kind: 'holiday',
        title: h.name || 'Company Holiday',
        subtitle: `${formatDisplayDate(hDate)} · ${hType} Holiday`,
        meta: h.description || undefined,
        badge: hType,
        badgeTone:
          hType === 'Optional'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : hType === 'Company'
              ? 'bg-emerald-50 text-[#1b4332] border-[#95d5b2]'
              : 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-[#f97316]',
        sortDate: hDate,
        holidayId: h._id || h.id,
        holidayName: h.name,
      });
    });

    const relevantLeaves = effectiveListScope === 'day'
      ? (activeDayInfo?.leaves || [])
      : leavesList.filter((lv) => {
        if (!lv || lv.status === 'Rejected' || (lv.status as string) === 'Cancelled') return false;
        const s = normalizeDate(lv.startDate);
        const e = normalizeDate(lv.endDate) || s;
        return s.startsWith(monthPrefix) || e.startsWith(monthPrefix);
      });

    relevantLeaves.forEach((lv: LeaveRequest, idx: number) => {
      const empName = resolveLeaveEmployeeName(lv);
      const deptName = resolveLeaveDepartment(lv);
      const isOwn = isOwnLeave(lv);
      const s = normalizeDate(lv.startDate);
      const e = normalizeDate(lv.endDate) || s;
      const dateRange = s === e ? formatDisplayDate(s) : `${formatDisplayDate(s)} – ${formatDisplayDate(e)}`;
      const isApproved = lv.status === 'Approved';

      items.push({
        id: `leave-${lv.id || idx}`,
        kind: 'leave',
        title: `${empName}${isOwn ? ' (You)' : ''} · ${lv.leaveType || 'Leave'}`,
        subtitle: `${dateRange}${lv.isHalfDay ? ' · Half Day' : ''}`,
        meta: lv.reason ? `${deptName} · ${lv.reason}` : deptName,
        badge: lv.status || 'Pending',
        badgeTone: isApproved
          ? 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]'
          : 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-[#0ea5e9]',
        sortDate: s,
        avatarLetter: empName.charAt(0).toUpperCase(),
      });
    });

    if (!isAdminCalendar) {
      const relevantAtt = effectiveListScope === 'day'
        ? userAttendance.filter((a) => a.date === activeDateStr)
        : userAttendance.filter((a) => String(a.date || '').startsWith(monthPrefix));

      relevantAtt.forEach((att, idx) => {
        const isLate = att.status === 'Late';
        const isAbsent = att.status === 'Absent';
        items.push({
          id: `att-${att.id || att.date || idx}`,
          kind: 'attendance',
          title: `Attendance · ${att.status}`,
          subtitle: `${formatDisplayDate(att.date)} · ${att.checkIn || '--'} – ${att.checkOut || 'Active'}`,
          meta: att.workingHours ? `${att.workingHours} hrs logged` : undefined,
          badge: att.status,
          badgeTone: isAbsent
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : isLate
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]',
          dotColor: isAbsent ? 'bg-[#ef4444]' : 'bg-[#16a34a]',
          sortDate: att.date,
        });
      });
    } else if (effectiveListScope === 'day' && activeDayInfo && (activeDayInfo.staffCount ?? 0) > 0) {
      items.push({
        id: `staff-count-${activeDateStr}`,
        kind: 'attendance',
        title: 'Staff Attendance Recorded',
        subtitle: `${formatDisplayDate(activeDateStr)} · ${activeDayInfo.staffCount} team member${activeDayInfo.staffCount === 1 ? '' : 's'} clocked in`,
        badge: 'Confirmed',
        badgeTone: 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]',
        dotColor: 'bg-[#16a34a]',
        sortDate: activeDateStr,
      });
    }

    if (effectiveListScope === 'day' && activeDayInfo?.isWeekend && !activeDayInfo?.holiday) {
      items.push({
        id: `weekend-${activeDateStr}`,
        kind: 'weekend',
        title: 'Scheduled Weekend Off',
        subtitle: `${formatDisplayDate(activeDateStr)} · Company non-working day`,
        meta: getWeekendPolicyDescription(scheduleConfig),
        badge: 'Week Off',
        badgeTone: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
        sortDate: activeDateStr,
      });
    }

    return items.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  })();

  return (
    <div className="space-y-4 w-full select-none">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              handleJumpToToday();
              setListScope('day');
            }}
            className="px-3 py-1.5 rounded-xl border border-[#dee2e6] bg-white hover:bg-[#f8f9fa] text-xs font-semibold text-[#495057] transition cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {!isAdminCalendar && onOpenClockModal && (
            <button
              type="button"
              onClick={onOpenClockModal}
              className="px-3.5 py-2 rounded-xl border border-[#dee2e6] bg-white hover:bg-[#f8f9fa] text-xs font-semibold text-[#212529] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Clock In / Out</span>
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

      {/* Main 2-Column Layout */ }
  <div className="flex flex-col lg:flex-row gap-5 items-start">
    {/* LEFT COLUMN: Compact Mini Month Calendar */}
    <div className="w-full lg:w-[320px] shrink-0 rounded-2xl bg-[#f8f9fa] border border-[#e9ecef] p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
          className="w-8 h-8 rounded-lg hover:bg-white border border-transparent hover:border-[#dee2e6] flex items-center justify-center text-[#495057] transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-[15px] font-bold text-[#212529] tracking-tight">
          {monthNames[month]} {year}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Next Month"
          className="w-8 h-8 rounded-lg hover:bg-white border border-transparent hover:border-[#dee2e6] flex items-center justify-center text-[#495057] transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((wd) => (
          <div
            key={wd}
            className="text-center text-[11px] font-medium text-[#6c757d] py-1.5"
          >
            {wd}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-1"
        onMouseLeave={() => setHoveredDay(null)}
      >
        {miniCalendarDays.map((item, idx) => {
          const isSelected = item.isCurrentMonth && item.day === selectedDay;
          const isHovered = item.isCurrentMonth && item.day === hoveredDay && !isSelected;
          const isToday =
            item.isCurrentMonth &&
            item.day === todayDateNum &&
            month === todayMonth &&
            year === todayYear;
          const hasHoliday = Boolean(item.holiday);
          const hasLeave = Array.isArray(item.leaves) && item.leaves.length > 0;
          const hasAttendance = Boolean(item.attendance) || (item.staffCount ?? 0) > 0;

          return (
            <button
              key={`${item.dateStr}-${idx}`}
              type="button"
              onClick={() => {
                if (!item.isCurrentMonth) return;
                setSelectedDay(item.day);
                setListScope('day');
              }}
              onMouseEnter={() => {
                if (!item.isCurrentMonth) return;
                setHoveredDay(item.day);
              }}
              onMouseLeave={handleCellMouseLeave}
              className={`min-h-[78px] sm:min-h-[116px] p-1.5 sm:p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between group ${item.beforeJoining ? 'cursor-not-allowed' : 'cursor-pointer'} ${cellStyle}`}
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
                {item.beforeJoining && (
                  <div className="truncate px-2 py-0.5 rounded-md bg-slate-200 text-slate-500 font-semibold border border-slate-300" title="This day is before the employee joined">
                    Not joined
                  </div>
                )}
                {item.holiday && !item.beforeJoining && (
                  <div
                    className="truncate px-2 py-0.5 rounded-md bg-[#1b4332] text-white font-semibold border border-[#081c15] shadow-2xs flex items-center gap-1"
                    title={`Holiday: ${item.holiday}`}
                  >
                    <Star className="w-2.5 h-2.5 fill-[#95d5b2] text-[#95d5b2] shrink-0" />
                    <span className="truncate">{item.holiday}</span>
                  </div>
                )}

                {/* Weekend Tag */}
                {item.isWeekend && !item.holiday && !item.beforeJoining && item.isCurrentMonth && (
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
                {!isAdminCalendar && item.attendance && !item.beforeJoining && !item.holiday && !item.isWeekend && (
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
                {item.isCurrentMonth && !item.beforeJoining && item.leaves && item.leaves.length > 0 && (
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

        {/* RIGHT COLUMN: Upcoming Events & Holidays */}
        <div className="flex-1 min-w-0 w-full rounded-2xl bg-white border border-[#dee2e6] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#212529] tracking-tight">
                {effectiveListScope === 'day' && activeDay
                  ? `Schedule · ${activeDay} ${monthNames[month]} ${year}`
                  : 'Upcoming events & holidays'}
              </h3>
            </div>

            <div className="inline-flex items-center rounded-xl bg-[#f8f9fa] border border-[#dee2e6] p-0.5">
              <button
                type="button"
                onClick={() => setListScope('month')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${listScope === 'month'
                    ? 'bg-[#2d6a4f] text-white shadow-2xs'
                    : 'text-[#6c757d] hover:text-[#212529]'
                  }`}
              >
                {monthNames[month].slice(0, 3)}
              </button>
              <button
                type="button"
                onClick={() => setListScope('day')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${listScope === 'day'
                    ? 'bg-[#2d6a4f] text-white shadow-2xs'
                    : 'text-[#6c757d] hover:text-[#212529]'
                  }`}
              >
                Selected Day
              </button>
            </div>
          </div>

          {feedItems.length > 0 ? (
            <div className="space-y-3">
              {feedItems.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-[#dee2e6] bg-white p-4 hover:border-[#95d5b2] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ev.dotColor}`} />
                      <h4 className="text-[15px] font-semibold text-[#212529] truncate">
                        {ev.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${ev.badgeTone}`}
                      >
                        {ev.badge}
                      </span>
                      {isAdminCalendar && ev.kind === 'holiday' && ev.holidayId && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeletingHoliday({
                              id: ev.holidayId!,
                              name: ev.holidayName || ev.title,
                            })
                          }
                          className="p-1 rounded-lg text-[#6c757d] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/15 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 my-auto flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-white rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-[#2d6a4f] fill-[#b7e4c7]" />
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

                    <form onSubmit={handleCreateHoliday} className="p-4 sm:p-6 space-y-4 text-xs">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Holiday Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Diwali / Deepawali Festival"
                          value={holidayName}
                          onChange={(e) => setHolidayName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] text-slate-800 font-medium transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="holiday-date-picker" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Calendar Date *
                          </label>
                          <ThemedDatePicker
                            id="holiday-date-picker"
                            value={holidayDate}
                            onChange={setHolidayDate}
                          />
                        </div>
                        <div
                          onMouseEnter={() => setHolidayTypeDropdownOpen(true)}
                          onMouseLeave={() => setHolidayTypeDropdownOpen(false)}
                          className="relative"
                        >
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Classification</label>
                          <button
                            type="button"
                            onClick={() => setHolidayTypeDropdownOpen((prev) => !prev)}
                            aria-haspopup="listbox"
                            aria-expanded={holidayTypeDropdownOpen}
                            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-left flex items-center justify-between gap-2 transition-all duration-150 cursor-pointer ${holidayTypeDropdownOpen
                                ? 'border-[#2d6a4f] ring-2 ring-[#2d6a4f]/20 text-slate-900 shadow-xs'
                                : 'border-slate-300 text-slate-800 hover:border-[#2d6a4f]/60'
                              }`}
                          >
                            <span className="truncate font-medium">
                              {holidayType === 'Optional'
                                ? 'Optional / Floating'
                                : holidayType === 'Company'
                                  ? 'Company Special'
                                  : 'Public / Gazetted'}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${holidayTypeDropdownOpen ? 'rotate-180 text-[#2d6a4f]' : ''
                                }`}
                            />
                          </button>

                          {holidayTypeDropdownOpen && (
                            <div className="absolute left-0 right-0 pt-1.5 z-[60]">
                              <div
                                role="listbox"
                                className="rounded-2xl border border-[#dee2e6] bg-white shadow-[0_18px_40px_-12px_rgba(15,23,42,0.18)] p-1.5 divide-y divide-slate-100/80 animate-in fade-in slide-in-from-top-1 duration-150"
                              >
                                {[
                                  { value: 'Public', label: 'Public / Gazetted' },
                                  { value: 'Optional', label: 'Optional / Floating' },
                                  { value: 'Company', label: 'Company Special' },
                                ].map((opt) => {
                                  const selected = holidayType === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setHolidayType(opt.value as any);
                                        setHolidayTypeDropdownOpen(false);
                                      }}
                                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between gap-2 transition cursor-pointer ${selected
                                          ? 'bg-[#d8f3dc] text-[#1b4332] font-semibold'
                                          : 'text-slate-700 hover:bg-[#f8f9fa] hover:text-[#1b4332]'
                                        }`}
                                    >
                                      <span>{opt.label}</span>
                                      {selected && <Check className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description / Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g., Annual Festival of Lights Celebration"
                          value={holidayDescription}
                          onChange={(e) => setHolidayDescription(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] text-slate-800 font-medium transition-all"
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
                          className="px-5 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
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
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/15 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
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

              {/* =========================================================================
          MODAL: CONFIGURE CORPORATE WEEKEND POLICY
          ========================================================================= */}
              {mounted && isWeekendModalOpen && typeof document !== 'undefined' && createPortal(
                <div
                  onClick={(e) => {
                    if (e.target === e.currentTarget && !isSavingWeekend) setIsWeekendModalOpen(false);
                  }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/15 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center shrink-0">
                          <CalendarDays className="w-5 h-5 text-[#2d6a4f]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            Corporate Weekend Policy
                          </h3>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            Configure official weekly off days for calendar &amp; attendance
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
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                      {/* Day selection */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Weekly Off Days
                          </label>
                          <span className="text-[11px] font-semibold text-[#1b4332] bg-[#d8f3dc]/70 px-2.5 py-0.5 rounded-full">
                            {7 - editingWeekendDays.length} Working &bull; {editingWeekendDays.length} Off
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { day: 1, label: 'Monday', short: 'Mon' },
                            { day: 2, label: 'Tuesday', short: 'Tue' },
                            { day: 3, label: 'Wednesday', short: 'Wed' },
                            { day: 4, label: 'Thursday', short: 'Thu' },
                            { day: 5, label: 'Friday', short: 'Fri' },
                            { day: 6, label: 'Saturday', short: 'Sat' },
                            { day: 0, label: 'Sunday', short: 'Sun' },
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
                                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer border ${isSelected
                                    ? 'bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#95d5b2] hover:bg-[#f8f9fa]'
                                  }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  {isSelected ? (
                                    <Check className="w-3.5 h-3.5 text-[#b7e4c7] shrink-0" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                  )}
                                  <span className="truncate">{d.label}</span>
                                </span>
                                <span
                                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
                        <div className="pt-4 border-t border-slate-100 space-y-2.5 animate-in fade-in">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Saturday Operational Schedule
                            </label>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Choose whether all Saturdays are holidays or alternate Saturdays remain working days.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                              { id: 'all', title: 'All Saturdays Off', desc: 'Every Saturday is an official weekend' },
                              { id: 'alternate_2_4', title: '2nd & 4th Sat Off', desc: '1st, 3rd & 5th Saturdays are working' },
                              { id: 'alternate_1_3', title: '1st & 3rd Sat Off', desc: '2nd & 4th Saturdays are working' },
                            ].map((opt) => {
                              const isAct = editingSatRule === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setEditingSatRule(opt.id as any)}
                                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${isAct
                                      ? 'border-[#2d6a4f] bg-[#d8f3dc]/40 ring-1 ring-[#2d6a4f]/40 shadow-2xs'
                                      : 'border-slate-200 bg-white hover:border-[#95d5b2] hover:bg-[#f8f9fa]'
                                    }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-bold ${isAct ? 'text-[#1b4332]' : 'text-slate-800'}`}>
                                      {opt.title}
                                    </span>
                                    <span
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isAct ? 'border-[#2d6a4f] bg-[#2d6a4f]' : 'border-slate-300 bg-white'
                                        }`}
                                    >
                                      {isAct && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Real-time Summary Box */}
                      <div className="p-3.5 rounded-xl bg-[#d8f3dc]/35 border border-[#95d5b2] text-xs">
                        <div className="flex items-center gap-2 font-bold text-[#1b4332]">
                          <span className="w-2 h-2 rounded-full bg-[#2d6a4f] shrink-0" />
                          <span>Active Policy Preview</span>
                        </div>
                        <p className="mt-1 font-semibold text-[13px] text-[#081c15]">
                          {getWeekendPolicyDescription({
                            weekendDays: editingWeekendDays,
                            saturdayRule: editingWeekendDays.includes(6) ? editingSatRule : 'none',
                          })}
                        </p>
                        <p className="text-[11px] text-[#2d6a4f] mt-0.5">
                          Unselected days will be treated as working days in calendar and attendance records.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 py-4 sm:px-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
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
                        className="px-5 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-xs shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition"
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
                    className={`w-76 sm:w-80 bg-white/95 backdrop-blur-md border border-[#dee2e6] rounded-2xl shadow-xl p-3.5 space-y-3 pointer-events-auto select-none ${hoverPosition.placement === 'bottom' ? 'animate-calendar-pop' : 'animate-calendar-pop-above'
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
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${hoveredDate.leaves.length > 0
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
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${isApproved
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
                    className={`w-76 sm:w-80 bg-white/95 backdrop-blur-md border border-[#dee2e6] rounded-2xl shadow-xl p-3.5 space-y-3 pointer-events-auto select-none ${hoverPosition.placement === 'bottom' ? 'animate-calendar-pop' : 'animate-calendar-pop-above'
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
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${hoveredDate.leaves.length > 0
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
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${isApproved
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
