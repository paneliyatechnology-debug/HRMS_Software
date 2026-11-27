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
  Lock,
} from 'lucide-react';
import { useWorkSession } from '../../context/WorkSessionContext';
import { ModernDigitClock } from './ModernDigitClock';
import { verifyShiftTimeWindow } from '../../lib/shiftScheduleService';
import { formatSecondsToHMS } from '../../lib/attendanceService';

interface DailyShiftConsoleProps {
  className?: string;
  showFooterBadges?: boolean;
<<<<<<< HEAD
  clockSize?: 'sm' | 'md' | 'lg' | 'xl';
  showHeaderClock?: boolean;
  variant?: 'card' | 'banner';
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
}

export const DailyShiftConsole: React.FC<DailyShiftConsoleProps> = ({
  className = '',
  showFooterBadges = true,
<<<<<<< HEAD
  clockSize = 'sm',
  showHeaderClock = true,
  variant = 'card',
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
}) => {
  const {
    status,
    liveWorkedHMS,
    liveBreakWords,
    liveBreakHMS,
    elapsedSeconds,
    breakSeconds,
    totalWorkedHMS,
    totalBreakHMS,
    totalWorkedSeconds,
    totalBreakSeconds,
    activeSession,
    lastCompletedSession,
    todaySummary,
    actionLoading,
    checkIn,
    takeBreak,
    resumeWork,
    checkOut,
  } = useWorkSession();

  // Current Live Clock for header
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

<<<<<<< HEAD
  // Ultra-compact banner layout for dashboard header without unwanted vertical height or gaps
  if (variant === 'banner') {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs px-4 py-3 sm:px-5 sm:py-3 ${className}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Status Icon, Title & Dynamic Subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${status === 'working'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status === 'on_break'
                    ? 'bg-amber-50 text-amber-700'
                    : status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-emerald-50 text-emerald-700'
                }`}
            >
              {status === 'on_break' ? (
                <Coffee className="w-4 h-4" />
              ) : status === 'completed' ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Daily Shift Clock
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {status === 'working'
                  ? `In at ${formatTimeStr(activeSession?.startTime) || 'Recently'} • Target: 9.0h`
                  : status === 'on_break'
                    ? 'Break in progress • Work timer paused'
                    : status === 'completed'
                      ? `In: ${formatTimeStr(lastCompletedSession?.startTime) || '—'} • Out: ${formatTimeStr(lastCompletedSession?.endTime) || '—'}`
                      : `Office Shift: ${shiftCheck.shiftStart} – ${shiftCheck.shiftEnd}`}
              </p>
            </div>
          </div>

          {/* Center: Dual Timers in sleek compact badges */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            {/* Work Timer Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${status === 'working'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Work</span>
              </div>
              <span className="font-mono font-bold text-sm text-slate-900">
                {status === 'completed'
                  ? '00:00:00'
                  : liveWorkedHMS || '00:00:00'}
              </span>
              {status === 'working' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              {status === 'completed' && (
                <span className="text-[10px] text-slate-400 font-medium">
                  ({todaySummary?.totalDurationFormatted || totalWorkedHMS || '00:00:00'})
                </span>
              )}
            </div>

            {/* Break Timer Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${status === 'on_break'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
            >
              <div className="flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Break</span>
              </div>
              <span className="font-mono font-bold text-sm text-slate-900">
                {status === 'completed'
                  ? '00:00:00'
                  : liveBreakHMS || '00:00:00'}
              </span>
              {status === 'on_break' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {status === 'completed' && (
                <span className="text-[10px] text-slate-400 font-medium">
                  ({todaySummary?.totalBreakFormatted || totalBreakHMS || '00:00:00'})
                </span>
              )}
            </div>
          </div>

          {/* Right: Compact Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {status === 'not_started' && (
              <button
                id="btn-shift-check-in-banner"
                onClick={() => checkIn()}
                disabled={actionLoading}
                className={`px-3.5 py-2 rounded-xl active:scale-95 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap ${!shiftCheck.isAllowed
                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                    : 'bg-[#2d6a4f] hover:bg-[#1b4332] text-white'
                  }`}
              >
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>{actionLoading ? 'Starting...' : 'Clock In Now'}</span>
              </button>
            )}

            {status === 'working' && (
              <>
                <button
                  id="btn-shift-take-break-banner"
                  onClick={() => takeBreak()}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{actionLoading ? 'Pausing...' : 'Take Break'}</span>
                </button>
                <button
                  id="btn-shift-check-out-banner"
                  onClick={() => checkOut()}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-300 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-rose-600 shrink-0" />
                  <span>{actionLoading ? 'Clocking out...' : 'Clock Out'}</span>
                </button>
              </>
            )}

            {status === 'on_break' && (
              <>
                <button
                  id="btn-shift-resume-work-banner"
                  onClick={() => resumeWork()}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>{actionLoading ? 'Resuming...' : 'Resume Work'}</span>
                </button>
                <button
                  id="btn-shift-check-out-disabled-banner"
                  disabled={true}
                  title="Clock-out is blocked during break. Please resume work first."
                  className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {status === 'completed' && (
              <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                Clocked out for today
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Determine top bar gradient based on status
=======
  // Top bar gradient based on status
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  const topBarGradient =
    status === 'working'
      ? 'linear-gradient(90deg, #10b981, #059669)'
      : status === 'on_break'
      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
      : status === 'completed'
      ? 'linear-gradient(90deg, #059669, #10b981)'
      : 'linear-gradient(90deg, #059669, #10b981)';

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden bg-white ${className}`}
    >
      {/* Dynamic colorful top bar */}
      <div className="h-1.5 w-full transition-all duration-500" style={{ background: topBarGradient }} />

      <div className="p-3.5 sm:p-4.5 flex flex-col flex-1">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs shrink-0 bg-[#059669]"
              >
                <Clock className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Daily Shift Console
                </h3>
<<<<<<< HEAD

=======
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Check-in, break, and work time tracking
                </p>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </div>
            </div>

            {/* Live Clock Digital Badge matching reference image */}
            <div className="flex items-center">
              <ModernDigitClock
                timeString={currentSystemTime}
                variant="header-badge"
              />
            </div>
          </div>

          {/* Status Hero Box */}
<<<<<<< HEAD
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
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl active:scale-95 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap ${!shiftCheck.isAllowed
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
=======
          <div className="my-3 sm:my-3.5">
            {/* 1. STATE: NOT STARTED */}
            {status === 'not_started' && (
              <div className="rounded-2xl bg-gradient-to-b from-[#f3faf6] to-[#ebf7f0] border border-[#d7ece0] p-3 sm:p-4 text-center space-y-2.5">
                {/* Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d7f5e3] border border-[#b4ebcb] text-[#0d5f43] text-[11px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
                  <span>
                    {shiftCheck.isAllowed
                      ? "Shift is Ready • Check In to Start Today's Shift"
                      : 'Shift Check-In Currently Locked'}
                  </span>
                </div>

                {/* Section Title with Dividing Lines */}
                <div className="flex items-center justify-center gap-2.5 my-0.5">
                  <div className="h-[1px] bg-[#cfe7d6] flex-1 max-w-[50px] sm:max-w-[80px]" />
                  <div className="flex items-center gap-1.5 text-[#0d5f43]">
                    <Clock className="w-3.5 h-3.5 text-[#0d5f43]" strokeWidth={2.2} />
                    <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                      CURRENT LIVE TIME
                    </span>
                  </div>
                  <div className="h-[1px] bg-[#cfe7d6] flex-1 max-w-[50px] sm:max-w-[80px]" />
                </div>

                {/* Main Timer Display */}
                <div className="py-0.5 flex justify-center">
                  <ModernDigitClock
                    timeString={currentSystemTime}
                    variant="cockpit"
                    showSweepRing={true}
                  />
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] sm:text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Office Shift: <strong>{shiftCheck.shiftStart} – {shiftCheck.shiftEnd}</strong>{' '}
                    (Grace Buffer: {shiftCheck.config.gracePeriodMinutes} mins).
                  </p>
                  {shiftCheck.isAllowed ? (
                    <p className="text-[10px] sm:text-[11px] text-emerald-800 font-extrabold bg-emerald-100/90 border border-emerald-300 py-0.5 px-2.5 rounded-full inline-block mt-0.5">
                      Allowed Window: {shiftCheck.allowedStart} to {shiftCheck.allowedEnd}
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-[11px] text-rose-800 font-extrabold bg-rose-100/90 border border-rose-300 py-0.5 px-2.5 rounded-full inline-block mt-0.5">
                      Locked: Check-in only allowed from {shiftCheck.allowedStart} to{' '}
                      {shiftCheck.allowedEnd}
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    id="btn-shift-check-in"
                    onClick={() => checkIn()}
                    disabled={actionLoading}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl active:scale-95 font-bold text-xs sm:text-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 max-w-full text-center ${
                      !shiftCheck.isAllowed
                        ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md shadow-rose-700/20'
                        : 'bg-[#059669] hover:bg-[#047857] text-white shadow-md shadow-[#059669]/25'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>
                      {actionLoading
                        ? 'Starting Shift...'
                        : !shiftCheck.isAllowed
                        ? 'Shift Locked (View Timing)'
                        : 'Start Work (Check In Now)'}
                    </span>
                  </button>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                </div>
              </div>
            )}

            {/* 2. STATE: WORKING (Exact match to reference image) */}
            {status === 'working' && (
<<<<<<< HEAD
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold max-w-full truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">
                      Shift Active{activeSession?.sessionIndex ? ` (Session ${activeSession.sessionIndex + 1})` : ''} • In at {formatTimeStr(activeSession?.startTime) || 'Recently'}
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
                      {totalWorkedSeconds > elapsedSeconds && totalWorkedSeconds > 0
                        ? `Today's Total: ${totalWorkedHMS || formatSecondsToHMS(totalWorkedSeconds)}`
                        : 'Active shift counting'}
                    </span>
                  </div>

                  {/* BREAK TIMER */}
                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${breakSeconds > 0 || (liveBreakHMS && liveBreakHMS !== '00:00:00')
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
                      {totalBreakSeconds > breakSeconds && totalBreakSeconds > 0
                        ? `Today's Break: ${totalBreakHMS || formatSecondsToHMS(totalBreakSeconds)}`
                        : (breakSeconds > 0 ? `${liveBreakWords} taken today` : 'No breaks taken')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
=======
              <div className="rounded-2xl bg-gradient-to-b from-[#f3faf6] to-[#ebf7f0] border border-[#d7ece0] p-3 sm:p-4 text-center space-y-2.5">
                {/* Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d7f5e3] border border-[#b4ebcb] text-[#0d5f43] text-[11px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
                  <span>
                    Shift is Active • In at {formatTimeStr(activeSession?.startTime) || 'Recently'}
                  </span>
                </div>

                {/* Section Title with Dividing Lines */}
                <div className="flex items-center justify-center gap-2.5 my-0.5">
                  <div className="h-[1px] bg-[#cfe7d6] flex-1 max-w-[50px] sm:max-w-[80px]" />
                  <div className="flex items-center gap-1.5 text-[#0d5f43]">
                    <Clock className="w-3.5 h-3.5 text-[#0d5f43]" strokeWidth={2.2} />
                    <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                      ACTIVE WORKED TIMER
                    </span>
                  </div>
                  <div className="h-[1px] bg-[#cfe7d6] flex-1 max-w-[50px] sm:max-w-[80px]" />
                </div>

                {/* Main Timer Display */}
                <div className="py-0.5 flex justify-center">
                  <ModernDigitClock
                    timeString={liveWorkedHMS}
                    variant="cockpit"
                    showSweepRing={true}
                    accentColor="emerald"
                  />
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Worked time recorded today • Shift target: 9.0 Hours
                </p>

                {/* Action Buttons: Take Break & End Day & Check Out */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-sm sm:max-w-md mx-auto w-full">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  <button
                    id="btn-shift-take-break"
                    onClick={() => takeBreak()}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#fffcf0] hover:bg-[#fff7d9] text-[#92400e] font-bold text-xs sm:text-sm border border-[#fde68a] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xs min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Coffee className="w-4 h-4 text-[#b45309] shrink-0" strokeWidth={2.2} />
                    <span className="truncate">
                      {actionLoading ? 'Pausing...' : 'Take Break'}
                    </span>
                  </button>
                  <button
                    id="btn-shift-check-out"
                    onClick={() => checkOut()}
                    disabled={actionLoading}
<<<<<<< HEAD
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-300 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-3.5 h-3.5 fill-current text-rose-600 shrink-0" />
=======
                    className="w-full py-2.5 px-4 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-3.5 h-3.5 fill-white text-white shrink-0" />
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                    <span className="truncate">
                      {actionLoading ? 'Checking out...' : 'End Day & Check Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. STATE: ON BREAK */}
            {status === 'on_break' && (
<<<<<<< HEAD
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
                      {totalWorkedSeconds > elapsedSeconds && totalWorkedSeconds > 0
                        ? `Today's Total: ${totalWorkedHMS || formatSecondsToHMS(totalWorkedSeconds)} (Paused)`
                        : 'Timer paused on break'}
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
=======
              <div className="rounded-2xl bg-gradient-to-b from-[#fefbf3] to-[#fef6e5] border border-[#fed7aa] p-3 sm:p-4 text-center space-y-2.5">
                {/* Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[#92400e] text-[11px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0" />
                  <span>Break in Progress • Work Timer Paused</span>
                </div>

                {/* Section Title with Dividing Lines */}
                <div className="flex items-center justify-center gap-2.5 my-0.5">
                  <div className="h-[1px] bg-[#fed7aa] flex-1 max-w-[50px] sm:max-w-[80px]" />
                  <div className="flex items-center gap-1.5 text-[#92400e]">
                    <Clock className="w-3.5 h-3.5 text-[#92400e]" strokeWidth={2.2} />
                    <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                      TIMER PAUSED (ON BREAK)
                    </span>
                  </div>
                  <div className="h-[1px] bg-[#fed7aa] flex-1 max-w-[50px] sm:max-w-[80px]" />
                </div>

                {/* Main Timer Display */}
                <div className="py-0.5 flex justify-center">
                  <ModernDigitClock
                    timeString={liveWorkedHMS}
                    variant="cockpit"
                    showSweepRing={true}
                    accentColor="amber"
                    subText={`Break Duration: ${liveBreakWords}`}
                  />
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Enjoy your break! Click resume when you are back at your workstation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-sm sm:max-w-md mx-auto w-full">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  <button
                    id="btn-shift-resume-work"
                    onClick={() => resumeWork()}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#059669]/25 min-w-0 cursor-pointer disabled:opacity-50"
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
                    title="Checkout is blocked during break. Please resume work first."
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-none min-w-0 cursor-not-allowed select-none"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Check Out (Resume First)
                    </span>
                  </button>
                </div>
                <p className="text-[10px] sm:text-[11px] text-amber-800 font-semibold bg-amber-100/80 py-1 px-2.5 rounded-lg border border-amber-200 max-w-sm sm:max-w-md mx-auto">
                  ⚠️ Check-out is blocked while break is active. Please click &ldquo;Resume Work&rdquo; first.
                </p>
              </div>
            )}

            {/* 4. STATE: COMPLETED */}
            {status === 'completed' && (
<<<<<<< HEAD
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
                  {/* WORK TIMER (RESET TO 00:00:00) */}
                  <div className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-slate-600 truncate">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Work Timer</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        RESET
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-slate-700">
                      00:00:00
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      {`Total: ${todaySummary?.totalDurationFormatted || totalWorkedHMS || '00:00:00'}`}
                    </span>
                  </div>

                  {/* BREAK TIMER (RESET TO 00:00:00) */}
                  <div className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-slate-600 truncate">
                        <Coffee className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Break Timer</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        RESET
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-slate-700">
                      00:00:00
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      {`Total: ${todaySummary?.totalBreakFormatted || totalBreakHMS || '00:00:00'}`}
                    </span>
                  </div>
                </div>

                <p className="text-center sm:text-right text-[11px] font-semibold text-slate-500 pt-0.5">
                  Clock in and clock out are done for today.
                </p>
=======
              <div className="rounded-2xl bg-gradient-to-b from-[#f3faf6] to-[#ebf7f0] border border-[#d7ece0] p-3 sm:p-4 text-center space-y-2.5">
                {/* Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d7f5e3] border border-[#b4ebcb] text-[#0d5f43] text-[11px] font-bold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Session Completed & Checked Out</span>
                </div>

                {/* Section Title with Dividing Lines */}
                <div className="flex items-center justify-center gap-2.5 my-0.5">
                  <div className="h-[1px] bg-[#cfe7d6] flex-1 max-w-[50px] sm:max-w-[80px]" />
                  <div className="flex items-center gap-1.5 text-[#0d5f43]">
                    <Clock className="w-3.5 h-3.5 text-[#0d5f43]" strokeWidth={2.2} />
                    <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                      SHIFT FINALIZED
                    </span>
                  </div>
                  <div className="h-[1px] bg-[#cfe7d6] flex-1 max-w-[50px] sm:max-w-[80px]" />
                </div>

                <p className="text-[11px] sm:text-xs text-slate-600 max-w-md mx-auto">
                  Start In:{' '}
                  <strong>
                    {formatTimeStr(lastCompletedSession?.startTime) || 'Completed'}
                  </strong>{' '}
                  • Out:{' '}
                  <strong>
                    {formatTimeStr(lastCompletedSession?.endTime) || 'Completed'}
                  </strong>{' '}
                  • Today Worked:{' '}
                  <strong className="text-[#059669]">
                    {todaySummary?.totalDurationFormatted || liveWorkedHMS}
                  </strong>
                </p>

                {/* Main Timer Display */}
                <div className="py-0.5 flex justify-center">
                  <ModernDigitClock
                    timeString={liveWorkedHMS}
                    variant="cockpit"
                    showSweepRing={false}
                    subText={`Total Break: ${
                      todaySummary?.totalBreakFormatted || liveBreakWords
                    }`}
                  />
                </div>

                <div className="pt-1">
                  <button
                    id="btn-shift-check-in-again"
                    onClick={() => checkIn()}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-md shadow-[#059669]/25 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {actionLoading ? 'Starting Session...' : 'Check In Again (New Session)'}
                    </span>
                  </button>
                </div>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
