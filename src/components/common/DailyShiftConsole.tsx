'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Square,
  Coffee,
  RotateCcw,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useWorkSession } from '../../context/WorkSessionContext';
import { ModernDigitClock } from './ModernDigitClock';
import { verifyShiftTimeWindow } from '../../lib/shiftScheduleService';

interface DailyShiftConsoleProps {
  className?: string;
  showFooterBadges?: boolean;
  clockSize?: 'sm' | 'md' | 'lg' | 'xl';
  showHeaderClock?: boolean;
}

export const DailyShiftConsole: React.FC<DailyShiftConsoleProps> = ({
  className = '',
  showFooterBadges = true,
  clockSize = 'sm',
  showHeaderClock = true,
}) => {
  const {
    status,
    liveWorkedHMS,
    liveBreakWords,
    liveBreakHMS,
    breakSeconds,
    activeSession,
    lastCompletedSession,
    todaySummary,
    actionLoading,
    checkIn,
    takeBreak,
    resumeWork,
    checkOut,
  } = useWorkSession();

  // Current Live Clock for header / not_started display
  const [currentSystemTime, setCurrentSystemTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentSystemTime(
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format check-in / start time cleanly
  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const shiftCheck = verifyShiftTimeWindow();

  // Determine top bar gradient based on status
  const topBarGradient =
    status === 'working'
      ? 'linear-gradient(90deg, #adb5bd, #6c757d)'
      : status === 'on_break'
        ? 'linear-gradient(90deg, #adb5bd, #ef4444)'
        : status === 'completed'
          ? 'linear-gradient(90deg, #6c757d, #adb5bd)'
          : 'linear-gradient(90deg, #6c757d, #adb5bd)';

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden bg-white ${className}`}
    >
      <div className="p-3 sm:p-3.5 flex flex-col">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs shrink-0"
                style={{ background: 'linear-gradient(135deg, #6c757d, #adb5bd)' }}
              >
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight leading-tight truncate">
                  Daily Shift Console
                </h3>
                <p className="text-[10px] text-slate-400 leading-tight truncate">
                  Clock-in, break, and work time tracking
                </p>
              </div>
            </div>

            {/* Live Clock Digital Badge */}
            {showHeaderClock && (
              <div className="flex items-center shrink-0">
                <ModernDigitClock
                  timeString={currentSystemTime}
                  size="sm"
                  variant="light"
                  showLabels={false}
                />
              </div>
            )}
          </div>

          {/* Status Hero Box */}
          <div className="mt-2.5 space-y-2.5">
            {/* 1. STATE: NOT STARTED */}
            {status === 'not_started' && (
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="space-y-1 text-center sm:text-left min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">
                      {shiftCheck.isAllowed
                        ? "Ready to Start Today's Shift"
                        : 'Shift Clock-In Currently Locked'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Office Shift: <strong>{shiftCheck.shiftStart} – {shiftCheck.shiftEnd}</strong>{' '}
                      (Grace: {shiftCheck.config.gracePeriodMinutes} mins)
                    </p>
                    {shiftCheck.isAllowed ? (
                      <p className="text-[10px] text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-300 py-0.5 px-2.5 rounded-full inline-block">
                        Allowed Window: {shiftCheck.allowedStart} to {shiftCheck.allowedEnd}
                      </p>
                    ) : (
                      <p className="text-[10px] text-rose-800 font-bold bg-rose-100/90 border border-rose-300 py-0.5 px-2.5 rounded-full inline-block">
                        Locked: {shiftCheck.allowedStart} to {shiftCheck.allowedEnd}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex justify-center sm:justify-end">
                    <button
                      id="btn-shift-check-in"
                      onClick={() => checkIn()}
                      disabled={actionLoading}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl active:scale-95 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                        !shiftCheck.isAllowed
                          ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm shadow-rose-700/20'
                          : 'bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-sm shadow-emerald-900/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>
                        {actionLoading
                          ? 'Starting Shift...'
                          : !shiftCheck.isAllowed
                            ? 'Shift Locked (View Timing)'
                            : 'Start Work (Clock In Now)'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dual Timers Preview */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Work Time</span>
                    </div>
                    <div className="font-mono font-bold text-base sm:text-lg text-slate-700 mt-0.5">
                      00:00:00
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">Starts on clock-in</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <Coffee className="w-3 h-3 text-slate-400" />
                      <span>Break Time</span>
                    </div>
                    <div className="font-mono font-bold text-base sm:text-lg text-slate-700 mt-0.5">
                      00:00:00
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">No break taken yet</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STATE: WORKING */}
            {status === 'working' && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold max-w-full truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">
                      Shift Active • In at {formatTimeStr(activeSession?.startTime) || 'Recently'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md shrink-0">
                    Target: 9.0h
                  </span>
                </div>

                {/* Dual Live Counters: Work Time (Live Ticking) & Break Time */}
                <div className="grid grid-cols-2 gap-2">
                  {/* WORK TIMER (LIVE TICKING) */}
                  <div className="p-2.5 rounded-xl border bg-white border-emerald-300 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-emerald-800 truncate">
                        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Work Time</span>
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-[9px] font-extrabold text-emerald-700 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-emerald-950">
                      {liveWorkedHMS || '00:00:00'}
                    </div>
                    <span className="text-[9px] text-emerald-700 font-medium mt-0.5 truncate">
                      Active shift counting
                    </span>
                  </div>

                  {/* BREAK TIMER */}
                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                    breakSeconds > 0 || (liveBreakHMS && liveBreakHMS !== '00:00:00')
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-slate-700 truncate">
                        <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Break Time</span>
                      </span>
                      {breakSeconds > 0 || (liveBreakHMS && liveBreakHMS !== '00:00:00') ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                          USED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 shrink-0">
                          0m
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-slate-800">
                      {liveBreakHMS || '00:00:00'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      {breakSeconds > 0 ? `${liveBreakWords} taken today` : 'No breaks taken'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    id="btn-shift-take-break"
                    onClick={() => takeBreak()}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Pausing...' : 'Take Break'}
                    </span>
                  </button>
                  <button
                    id="btn-shift-check-out"
                    onClick={() => checkOut()}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/25 min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Clocking out...' : 'End Day & Clock Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. STATE: ON BREAK */}
            {status === 'on_break' && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold max-w-full truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="truncate">Break in Progress • Work Paused</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md shrink-0">
                    Counting Break
                  </span>
                </div>

                {/* Dual Live Counters: Work Time (Paused) & Break Time (Live Ticking) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* WORK TIMER (PAUSED) */}
                  <div className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-slate-600 truncate">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Work Time</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                        PAUSED
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-slate-800">
                      {liveWorkedHMS || '00:00:00'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      Timer paused on break
                    </span>
                  </div>

                  {/* BREAK TIMER (LIVE TICKING) */}
                  <div className="p-2.5 rounded-xl border bg-white border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-amber-800 truncate">
                        <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Break Time</span>
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-[9px] font-extrabold text-amber-800 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-amber-950">
                      {liveBreakHMS || '00:00:00'}
                    </div>
                    <span className="text-[9px] text-amber-700 font-medium mt-0.5 truncate">
                      Break timer ticking
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    id="btn-shift-resume-work"
                    onClick={() => resumeWork()}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Resuming...' : 'Resume Work'}
                    </span>
                  </button>
                  <button
                    id="btn-shift-check-out-from-break"
                    type="button"
                    disabled={true}
                    title="Clock-out is blocked during break. Please resume work first."
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-none min-w-0 cursor-not-allowed select-none"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Clock Out (Resume First)
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-amber-800/85 font-semibold bg-amber-100/70 py-1 px-2.5 rounded-lg border border-amber-200/80 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Clock-out is blocked while break is active. Please click &ldquo;Resume Work&rdquo; first.</span>
                </p>
              </div>
            )}

            {/* 4. STATE: COMPLETED */}
            {status === 'completed' && (
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">
                        Session Clocked Out
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        In: <strong>{formatTimeStr(lastCompletedSession?.startTime) || '—'}</strong> • Out: <strong>{formatTimeStr(lastCompletedSession?.endTime) || '—'}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    SHIFT DONE
                  </span>
                </div>

                {/* Final Work & Break Summary Timers */}
                <div className="grid grid-cols-2 gap-2">
                  {/* TOTAL WORKED */}
                  <div className="p-2.5 rounded-xl border bg-white border-emerald-200 text-emerald-950 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-slate-700 truncate">
                        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Total Worked</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        FINAL
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-slate-900">
                      {todaySummary?.totalDurationFormatted || liveWorkedHMS || '00:00:00'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      Completed shift duration
                    </span>
                  </div>

                  {/* TOTAL BREAK */}
                  <div className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-slate-700 truncate">
                        <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Total Break</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        FINAL
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-slate-900">
                      {todaySummary?.totalBreakFormatted || liveBreakHMS || '00:00:00'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      {todaySummary?.totalBreakFormatted || (breakSeconds > 0 ? `${liveBreakWords} break` : '0m break')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end pt-0.5">
                  <button
                    id="btn-shift-check-in-again"
                    onClick={() => checkIn()}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {actionLoading ? 'Starting Session...' : 'Clock In Again (New Session)'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

