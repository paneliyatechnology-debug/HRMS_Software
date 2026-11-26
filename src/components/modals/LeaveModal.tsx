'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, AlertCircle, CalendarDays, ChevronDown, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { LeaveType, LeaveRequest, LeaveDaySession, LeaveDayBreakdown } from '../../types/hrms';
import { useModalOverlay } from '../../lib/useModalOverlay';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  availableLeaveTypes?: Array<{ id: string; name: string }>;
}

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDatesInRange = (startStr: string, endStr: string): string[] => {
  if (!startStr || !endStr || endStr < startStr) return startStr ? [startStr] : [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return [startStr];

  const dates: string[] = [];
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  let guard = 0;

  while (cur <= end && guard < 60) {
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return dates;
};

const formatDateChip = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

const formatDisplayDate = (dateStr: string): string => {
  const match = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr || 'Select date';
  return `${match[3]}-${match[2]}-${match[1]}`;
};

interface ThemedDatePickerProps {
  id: string;
  value: string;
  minDate?: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  align?: 'left' | 'right';
}

const ThemedDatePicker: React.FC<ThemedDatePickerProps> = ({
  id,
  value,
  minDate,
  onChange,
  hasError = false,
  align = 'left',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayStr = getTodayDate();

  const initialDate = useMemo(() => {
    const [y, m] = (value || todayStr).split('-').map(Number);
    return new Date(y || new Date().getFullYear(), (m || new Date().getMonth() + 1) - 1, 1);
  }, [value, todayStr]);

  const [viewDate, setViewDate] = useState<Date>(initialDate);

  useEffect(() => {
    if (open) {
      setViewDate(initialDate);
    }
  }, [open, initialDate]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, dateStr: `${year}-${mm}-${dd}` });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-slate-800 flex items-center justify-between gap-2 transition-all cursor-pointer ${
          hasError
            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
            : open
              ? 'border-[#2d6a4f] ring-2 ring-[#2d6a4f]/20 shadow-xs'
              : 'border-slate-300 hover:border-[#2d6a4f]/60'
        }`}
      >
        <span className="font-medium truncate">{formatDisplayDate(value)}</span>
        <Calendar className={`w-4 h-4 shrink-0 ${open ? 'text-[#2d6a4f]' : 'text-slate-500'}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1.5 z-[60] w-[260px] rounded-2xl border border-[#dee2e6] bg-white shadow-[0_18px_40px_-12px_rgba(15,23,42,0.22)] p-3 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-2.5">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-[#d8f3dc]/60 hover:text-[#1b4332] transition cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-900">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-[#d8f3dc]/60 hover:text-[#1b4332] transition cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
              <span key={wd} className="text-[10px] font-bold text-slate-400 py-0.5">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} />;
              const isDisabled = Boolean(minDate && cell.dateStr < minDate);
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(cell.dateStr);
                    setOpen(false);
                  }}
                  className={`h-7 w-full rounded-lg text-[11px] font-semibold flex items-center justify-center transition ${
                    isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#2d6a4f] text-white font-bold shadow-2xs cursor-pointer'
                        : isToday
                          ? 'bg-[#d8f3dc]/70 text-[#1b4332] ring-1 ring-[#95d5b2] font-bold hover:bg-[#2d6a4f] hover:text-white cursor-pointer'
                          : 'text-slate-700 hover:bg-[#d8f3dc]/70 hover:text-[#1b4332] cursor-pointer'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Today */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              disabled={Boolean(minDate && todayStr < minDate)}
              onClick={() => {
                onChange(todayStr);
                setOpen(false);
              }}
              className="font-semibold text-[#2d6a4f] hover:text-[#1b4332] disabled:opacity-40 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onRefresh, availableLeaveTypes }) => {
  const { user } = useAuth();
  const { emitLeaveApplied, showToast } = useSocket();
  const [leaveType, setLeaveType] = useState<LeaveType>(
    (availableLeaveTypes && availableLeaveTypes[0]?.name ? availableLeaveTypes[0].name : '') as LeaveType
  );
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [daySessions, setDaySessions] = useState<Record<string, LeaveDaySession>>({});
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [backendLeaveTypes, setBackendLeaveTypes] = useState<Array<{ id: string; name: string }>>(availableLeaveTypes || []);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typeDropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [typeDropdownOpen]);

  const selectedDates = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);
  const isMultiDay = selectedDates.length > 1;

  const dayBreakdown = useMemo<LeaveDayBreakdown[]>(() => {
    if (!isHalfDay) {
      return selectedDates.map((date) => ({
        date,
        session: 'FULL_DAY',
        duration: 1,
      }));
    }
    return selectedDates.map((date) => {
      const session: LeaveDaySession =
        daySessions[date] || (!isMultiDay ? 'FIRST_HALF' : 'FULL_DAY');
      return {
        date,
        session,
        duration: session === 'FULL_DAY' ? 1 : 0.5,
      };
    });
  }, [selectedDates, isHalfDay, isMultiDay, daySessions]);

  const totalDaysCount = useMemo(
    () => Number(dayBreakdown.reduce((sum, item) => sum + item.duration, 0).toFixed(2)),
    [dayBreakdown]
  );

  const handleSetDaySession = (dateStr: string, session: LeaveDaySession) => {
    setDaySessions((prev) => ({
      ...prev,
      [dateStr]: session,
    }));
  };

  useEffect(() => {
    if (!isOpen) return;
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
    setIsHalfDay(false);
    setDaySessions({});
    setReason('');
    setFieldErrors({});
    setError('');
    setTypeDropdownOpen(false);

    let active = true;
    const fetchLeaveTypesOnly = async () => {
      setLeaveTypesLoading(true);
      try {
        const userCompId = user?.companyId;
        const liveLeaveTypes = await api.listLeaveTypes(userCompId ? { companyId: userCompId } : undefined).catch(() => []);
        if (!active) return;

        const candidates =
          Array.isArray(liveLeaveTypes) && liveLeaveTypes.length > 0
            ? liveLeaveTypes
            : Array.isArray(availableLeaveTypes) && availableLeaveTypes.length > 0
            ? availableLeaveTypes
            : [];

        if (candidates.length > 0) {
          const seen = new Set<string>();
          const uniqueList = candidates.filter((lt: any) => {
            const key = (lt.name || '').trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setBackendLeaveTypes(uniqueList);
          if (uniqueList[0]?.name) {
            setLeaveType(uniqueList[0].name as LeaveType);
          }
        } else {
          setBackendLeaveTypes([]);
          setLeaveType('' as LeaveType);
        }
      } catch (_) {
        if (active) {
          setBackendLeaveTypes([]);
          setLeaveType('' as LeaveType);
        }
      } finally {
        if (active) setLeaveTypesLoading(false);
      }
    };
    fetchLeaveTypesOnly();
    return () => {
      active = false;
    };
  }, [isOpen, availableLeaveTypes, user?.companyId]);

  const clearFieldError = (f: string) => {
    setFieldErrors((prev) => {
      if (!prev[f]) return prev;
      const copy = { ...prev };
      delete copy[f];
      return copy;
    });
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    clearFieldError('startDate');
    clearFieldError('endDate');
    // If the new start date is after the current end date, advance end date to match start date
    if (endDate && val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    if (startDate && val < startDate) {
      setFieldErrors((prev) => ({
        ...prev,
        endDate: 'End date cannot be earlier than start date.',
      }));
      setEndDate(startDate);
      return;
    }
    setEndDate(val);
    clearFieldError('endDate');
  };

  useModalOverlay({ isOpen, onClose });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!leaveType) {
      errors.leaveType = 'Please select a valid leave category.';
    }
    if (!reason.trim()) {
      errors.reason = 'Please provide a valid reason for leave.';
    }
    const today = getTodayDate();
    if (startDate < today) {
      errors.startDate = 'Leave cannot be applied for past dates.';
    }
    if (endDate < startDate) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError('');
    try {
      const targetUserId =
        (user as any)?.userId ||
        (user as any)?.sub ||
        user?.id ||
        user?.employeeId ||
        '';

      const empName = `${user.firstName || 'Employee'} ${user.lastName || ''}`.trim();
      const firstHalfDayEntry = dayBreakdown.find((d) => d.session !== 'FULL_DAY');
      const hasAnyHalfDay = Boolean(firstHalfDayEntry);

      const formattedDays = dayBreakdown.map((d) => {
        const sessionUpper = String(d.session || '').toUpperCase();
        const isFirst = sessionUpper === 'FIRST_HALF' || sessionUpper.includes('FIRST');
        const isSecond = sessionUpper === 'SECOND_HALF' || sessionUpper.includes('SECOND');
        const portion = isFirst ? 'First Half' : isSecond ? 'Second Half' : 'Full Day';
        return {
          date: d.date,
          portion,
        };
      });

      const leavePayload = {
        userId: targetUserId,
        employeeId: user.employeeId || targetUserId,
        employeeName: empName || 'Employee',
        departmentName: (user as any).departmentName || (user as any).department || 'General',
        leaveType,
        startDate,
        endDate,
        daysCount: totalDaysCount,
        isHalfDay: hasAnyHalfDay,
        ...(hasAnyHalfDay && firstHalfDayEntry && firstHalfDayEntry.session !== 'FULL_DAY'
          ? { halfDaySession: firstHalfDayEntry.session }
          : {}),
        dayBreakdown,
        days: formattedDays,
        reason: reason.trim(),
      };

      const result = await api.applyLeave(leavePayload);

      const createdLeave = {
        ...leavePayload,
        id: (result as any)?.id || (result as any)?._id || (result as any)?.data?.id || `leave-${Date.now()}`,
        status: 'Pending' as const,
        appliedOn: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      // Instantly broadcast via WebSocket to Admin side
      emitLeaveApplied(createdLeave);

      showToast({
        title: 'Leave Request Submitted',
        message: 'Your leave application has been submitted and sent to HR in real-time.',
        type: 'success',
      });

      onRefresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: createdLeave }));
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#dee2e6] shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-8">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">New Leave Request</h3>
          
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div
            ref={typeDropdownRef}
            onMouseEnter={() => setTypeDropdownOpen(true)}
            onMouseLeave={() => setTypeDropdownOpen(false)}
            className="relative"
          >
            <label htmlFor="leave-type-select" className="block text-xs font-bold text-slate-800 mb-1.5">
              Type
            </label>
            <button
              id="leave-type-select"
              type="button"
              onClick={() => setTypeDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={typeDropdownOpen}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-left flex items-center justify-between gap-2 transition-all duration-150 cursor-pointer ${
                typeDropdownOpen
                  ? 'border-[#2d6a4f] ring-2 ring-[#2d6a4f]/15 text-slate-900 shadow-xs'
                  : 'border-slate-300 text-slate-800 hover:border-[#2d6a4f]/60'
              }`}
            >
              <span className={`truncate font-medium ${!leaveType ? 'text-slate-400' : 'text-slate-800'}`}>
                {leaveTypesLoading && backendLeaveTypes.length === 0
                  ? 'Loading company leave types...'
                  : leaveType || 'Select leave type'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                  typeDropdownOpen ? 'rotate-180 text-[#2d6a4f]' : ''
                }`}
              />
            </button>

            {typeDropdownOpen && (
              <div className="absolute left-0 right-0 pt-1.5 z-50">
                <div
                  role="listbox"
                  className="rounded-2xl border border-[#dee2e6] bg-white shadow-[0_18px_40px_-12px_rgba(15,23,42,0.18)] p-1.5 max-h-56 overflow-y-auto [scrollbar-width:thin] divide-y divide-slate-100/80 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {leaveTypesLoading && backendLeaveTypes.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-slate-400 text-center">
                      Loading company leave types...
                    </div>
                  ) : backendLeaveTypes.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-slate-400 text-center">
                      No leave types configured by company
                    </div>
                  ) : (
                    backendLeaveTypes.map((lt) => {
                      const selected = leaveType === lt.name;
                      return (
                        <button
                          key={lt.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setLeaveType(lt.name as LeaveType);
                            clearFieldError('leaveType');
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-[13px] flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#2d6a4f] text-white font-semibold shadow-2xs'
                              : 'text-slate-700 hover:bg-[#f8f9fa] hover:text-[#1b4332] hover:pl-4 font-medium'
                          }`}
                        >
                          <span className="truncate">{lt.name}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {fieldErrors.leaveType && (
              <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {fieldErrors.leaveType}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="leave-start-date" className="block text-xs font-bold text-slate-800 mb-1.5">
                From
              </label>
              <ThemedDatePicker
                id="leave-start-date"
                value={startDate}
                minDate={getTodayDate()}
                onChange={handleStartDateChange}
                hasError={Boolean(fieldErrors.startDate)}
                align="left"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="leave-end-date" className="text-xs font-bold text-slate-800">
                  To
                </label>
                {fieldErrors.endDate && (
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.endDate}
                  </span>
                )}
              </div>
              <ThemedDatePicker
                id="leave-end-date"
                value={endDate}
                minDate={startDate}
                onChange={handleEndDateChange}
                hasError={Boolean(fieldErrors.endDate)}
                align="right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsHalfDay(checked);
                    if (checked) {
                      setDaySessions((prev) => {
                        const next: Record<string, LeaveDaySession> = {};
                        selectedDates.forEach((d) => {
                          next[d] = prev[d] || (!isMultiDay ? 'FIRST_HALF' : 'FULL_DAY');
                        });
                        return next;
                      });
                    }
                  }}
                  className="rounded text-[#2d6a4f] focus:ring-[#2d6a4f] cursor-pointer"
                />
                <label htmlFor="halfDay" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Customize Day-Wise (Full / Half Day)
                </label>
              </div>
              <span className="text-xs font-bold text-[#1b4332] shrink-0">
                {totalDaysCount} {totalDaysCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {isHalfDay && (
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Day-Wise Session Selection</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#1b4332]">
                    Total: {totalDaysCount} {totalDaysCount === 1 ? 'day' : 'days'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {dayBreakdown.map((item) => (
                    <div
                      key={item.date}
                      className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {formatDateChip(item.date)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {item.duration === 1 ? '1d' : '0.5d'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 shrink-0">
                        {(
                          [
                            { id: 'FULL_DAY', label: 'Full Day' },
                            { id: 'FIRST_HALF', label: '1st Half' },
                            { id: 'SECOND_HALF', label: '2nd Half' },
                          ] as const
                        ).map((opt) => {
                          const active = item.session === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSetDaySession(item.date, opt.id)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                                active
                                  ? 'bg-[#2d6a4f] text-white border-[#1b4332] shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-[#d8f3dc] hover:text-[#1b4332] hover:border-[#95d5b2]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="leave-reason-textarea" className="text-xs font-bold text-slate-800">
                Reason
              </label>
              {fieldErrors.reason && (
                <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.reason}
                </span>
              )}
            </div>
            <textarea
              id="leave-reason-textarea"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                clearFieldError('reason');
              }}
              placeholder="Short context for your manager"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all ${fieldErrors.reason
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                : 'border-slate-300'
                }`}
              required
            />
          </div>

          <div className="pt-1">
            <button
              id="btn-submit-leave"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Submitting...'
                : `Submit (${totalDaysCount} ${totalDaysCount === 1 ? 'Day' : 'Days'})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
