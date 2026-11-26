'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, CalendarDays } from 'lucide-react';
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
          <p className="text-xs text-slate-400 mt-0.5">
            Submit time off for approval.
          </p>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label htmlFor="leave-type-select" className="block text-xs font-bold text-slate-800 mb-1.5">
              Type
            </label>
            <select
              id="leave-type-select"
              value={leaveType}
              onChange={(e) => {
                setLeaveType(e.target.value as LeaveType);
                clearFieldError('leaveType');
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition"
              required
            >
              {leaveTypesLoading && backendLeaveTypes.length === 0 ? (
                <option value="" disabled>Loading company leave types...</option>
              ) : backendLeaveTypes.length > 0 ? (
                backendLeaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.name}>
                    {lt.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No leave types configured by company</option>
              )}
            </select>
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
              <input
                id="leave-start-date"
                type="date"
                min={getTodayDate()}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition"
                required
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
              <input
                id="leave-end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className={`w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-slate-800 transition-all ${fieldErrors.endDate
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f]'
                  }`}
                required
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
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2] shrink-0">
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
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
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
