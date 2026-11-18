'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertCircle, Sun, Sunset, CalendarDays } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { LeaveType, LeaveRequest, LeaveDaySession, LeaveDayBreakdown } from '../../types/hrms';
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  ResolvedLeaveQuotaSummary,
} from '../../lib/leaveQuotaUtils';
import { useModalOverlay } from '../../lib/useModalOverlay';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
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

export const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const { emitLeaveApplied, showToast } = useSocket();
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [daySessions, setDaySessions] = useState<Record<string, LeaveDaySession>>({});
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [quotaSummary, setQuotaSummary] = useState<ResolvedLeaveQuotaSummary | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

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
    if (!isMultiDay) {
      return selectedDates.map((date) => ({
        date,
        session: halfDaySession,
        duration: 0.5,
      }));
    }
    return selectedDates.map((date) => {
      const session: LeaveDaySession = daySessions[date] || 'FULL_DAY';
      return {
        date,
        session,
        duration: session === 'FULL_DAY' ? 1 : 0.5,
      };
    });
  }, [selectedDates, isHalfDay, isMultiDay, halfDaySession, daySessions]);

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
    setLeaveType('Casual Leave');
    setIsHalfDay(false);
    setHalfDaySession('FIRST_HALF');
    setDaySessions({});
    setReason('');
    setFieldErrors({});
    setError('');

    let active = true;
    const loadDynamicBalances = async () => {
      setQuotaLoading(true);
      try {
        const myId = user?.employeeId || user?.id || '';
        const myEmail = user?.email?.toLowerCase() || '';
        const myName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();

        const [quotaPayload, rawLeaves] = await Promise.all([
          fetchLeaveQuotaData(myId),
          api.getLeaves(myId ? { employeeId: myId } : undefined).catch(() => [] as LeaveRequest[]),
        ]);
        if (!active) return;

        const allLeaves = Array.isArray(rawLeaves) ? rawLeaves : [];
        const myLeaves = allLeaves.filter((l) => {
          if (myId && l.employeeId === myId) return true;
          if (myEmail && (l as any).employeeEmail?.toLowerCase() === myEmail) return true;
          if (myName && l.employeeName?.toLowerCase() === myName) return true;
          return false;
        });

        setQuotaSummary(
          resolveLeaveQuotaSummary(quotaPayload.settings, quotaPayload.balances, myLeaves)
        );
      } catch (_) {
        if (active) setQuotaSummary(null);
      } finally {
        if (active) setQuotaLoading(false);
      }
    };
    loadDynamicBalances();
    return () => {
      active = false;
    };
  }, [isOpen, user]);

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
        ...(hasAnyHalfDay ? { dayBreakdown } : {}),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-100 shadow-2xl relative cursor-default animate-modal-zoom max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 pr-8">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Apply for Leave</h3>
            <p className="text-xs text-slate-500">
              Submit your request for manager & HR review
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Type
            </label>
            <select
              id="leave-type-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="Casual Leave">
                {quotaLoading || !quotaSummary
                  ? 'Casual Leave'
                  : `Casual Leave (Balance: ${quotaSummary.casual.available}/${quotaSummary.casual.quota} days)`}
              </option>
              <option value="Sick Leave">
                {quotaLoading || !quotaSummary
                  ? 'Sick Leave'
                  : `Sick Leave (Balance: ${quotaSummary.sick.available}/${quotaSummary.sick.quota} days)`}
              </option>
              <option value="Paid Leave">
                {quotaLoading || !quotaSummary
                  ? 'Paid / Annual Leave'
                  : `Paid / Annual Leave (Balance: ${quotaSummary.paid.available}/${quotaSummary.paid.quota} days)`}
              </option>
              <option value="Comp Off">Compensatory Off</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                id="leave-start-date"
                type="date"
                min={getTodayDate()}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  End Date
                </label>
                {fieldErrors.endDate && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
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
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white text-slate-900 transition-all ${fieldErrors.endDate
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                required
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsHalfDay(checked);
                    if (checked && isMultiDay) {
                      setDaySessions((prev) => {
                        const next: Record<string, LeaveDaySession> = {};
                        selectedDates.forEach((d) => {
                          next[d] = prev[d] || 'FULL_DAY';
                        });
                        return next;
                      });
                    }
                  }}
                  className="rounded text-[#343a40] focus:ring-[#6c757d] cursor-pointer"
                />
                <label htmlFor="halfDay" className="text-xs text-[#343a40] font-medium cursor-pointer">
                  {isMultiDay
                    ? 'Customize Half Day (Date-Wise First / Second Half)'
                    : 'Half Day Leave (First Half or Second Half)'}
                </label>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2] shrink-0">
                {totalDaysCount} {totalDaysCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {isHalfDay && !isMultiDay && (
              <div className="p-3 bg-[#f8f9fa]/60 border border-[#dee2e6] space-y-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-semibold text-[#343a40]">
                  Select Half Day Session ({formatDateChip(startDate)}) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="btn-halfday-first"
                    onClick={() => setHalfDaySession('FIRST_HALF')}
                    className={`p-2.5 text-left border transition-all cursor-pointer flex items-center gap-2.5 ${halfDaySession === 'FIRST_HALF'
                      ? 'bg-[#2d6a4f] text-white border-[#1b4332] shadow-xs'
                      : 'bg-white text-[#343a40] border-[#dee2e6] hover:bg-[#d8f3dc] hover:border-[#95d5b2]'
                      }`}
                  >
                    <Sun
                      className={`w-4 h-4 shrink-0 ${halfDaySession === 'FIRST_HALF' ? 'text-[#f8f9fa]' : 'text-[#6c757d]'
                        }`}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block leading-tight">First Half</span>
                      <span
                        className={`text-[10px] block mt-0.5 ${halfDaySession === 'FIRST_HALF' ? 'text-[#f8f9fa]' : 'text-[#6c757d]'
                          }`}
                      >
                        Morning Session (0.5d)
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="btn-halfday-second"
                    onClick={() => setHalfDaySession('SECOND_HALF')}
                    className={`p-2.5 text-left border transition-all cursor-pointer flex items-center gap-2.5 ${halfDaySession === 'SECOND_HALF'
                      ? 'bg-[#2d6a4f] text-white border-[#1b4332] shadow-xs'
                      : 'bg-white text-[#343a40] border-[#dee2e6] hover:bg-[#d8f3dc] hover:border-[#95d5b2]'
                      }`}
                  >
                    <Sunset
                      className={`w-4 h-4 shrink-0 ${halfDaySession === 'SECOND_HALF' ? 'text-[#f8f9fa]' : 'text-[#6c757d]'
                        }`}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block leading-tight">Second Half</span>
                      <span
                        className={`text-[10px] block mt-0.5 ${halfDaySession === 'SECOND_HALF' ? 'text-[#f8f9fa]' : 'text-[#6c757d]'
                          }`}
                      >
                        Afternoon Session (0.5d)
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {isHalfDay && isMultiDay && (
              <div className="p-3 bg-[#f8f9fa]/60 border border-[#dee2e6] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-semibold text-[#343a40] flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#343a40]" />
                    <span>Date-Wise Half Day Selection</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#343a40]">
                    Total: {totalDaysCount} {totalDaysCount === 1 ? 'day' : 'days'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {dayBreakdown.map((item) => (
                    <div
                      key={item.date}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-[#e9ecef] rounded-lg"
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
                        <span className="text-xs font-semibold text-[#212529] whitespace-nowrap">
                          {formatDateChip(item.date)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f8f9fa] text-[#343a40] border border-[#dee2e6]">
                          {item.duration === 1 ? '1 Day' : '0.5 Day'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 shrink-0">
                        {(
                          [
                            { id: 'FULL_DAY', label: 'Full Day' },
                            { id: 'FIRST_HALF', label: 'First Half' },
                            { id: 'SECOND_HALF', label: 'Second Half' },
                          ] as const
                        ).map((opt) => {
                          const active = item.session === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSetDaySession(item.date, opt.id)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded border transition-all cursor-pointer whitespace-nowrap ${active
                                ? 'bg-[#2d6a4f] text-white border-[#1b4332] shadow-2xs'
                                : 'bg-[#f8f9fa] text-[#343a40] border-[#dee2e6] hover:bg-[#d8f3dc] hover:text-[#1b4332] hover:border-[#95d5b2]'
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Leave Description <span className="text-red-500">*</span>
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
              placeholder="Please provide details for the team coverage and emergency contact..."
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all ${fieldErrors.reason
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                : 'border-slate-200'
                }`}
              required
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-leave"
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Submitting...'
                : `Submit Application (${totalDaysCount} ${totalDaysCount === 1 ? 'Day' : 'Days'})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
