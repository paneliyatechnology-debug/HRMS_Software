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
} from 'lucide-react';
import { useWorkSession } from '../../context/WorkSessionContext';
import { ModernDigitClock } from './ModernDigitClock';
import { verifyShiftTimeWindow } from '../../lib/shiftScheduleService';

interface DailyShiftConsoleProps {
  className?: string;
  showFooterBadges?: boolean;
  clockSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DailyShiftConsole: React.FC<DailyShiftConsoleProps> = ({
  className = '',
  showFooterBadges = true,
  clockSize = 'sm',
}) => {
  const {
    status,
    liveWorkedHMS,
    liveBreakWords,
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
      ? 'linear-gradient(90deg, #10b981, #059669)'
      : status === 'on_break'
      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
      : status === 'completed'
      ? 'linear-gradient(90deg, #059669, #10b981)'
      : 'linear-gradient(90deg, #059669, #10b981)';

  return (
    <div
      className={`rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden bg-white ${className}`}
    >
      {/* Dynamic colorful top bar */}
      <div className="h-1.5 w-full transition-all duration-500" style={{ background: topBarGradient }} />

      <div className="p-4 sm:p-6 flex flex-col flex-1">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Daily Shift Console
                </h3>
                <p className="text-[11px] text-slate-400">
                  Check-in, break, and work time tracking
                </p>
              </div>
            </div>

            {/* Live Clock Digital Badge */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center">
                <ModernDigitClock
                  timeString={currentSystemTime}
                  size="sm"
                  variant="light"
                  showLabels={false}
                />
              </div>
            </div>
          </div>

          {/* Status Hero Box */}
          <div className="my-5">
            {/* 1. STATE: NOT STARTED */}
            {status === 'not_started' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center space-y-3">
                <div className="flex justify-center">
                  <ModernDigitClock
                    timeString={currentSystemTime}
                    size={clockSize || "sm"}
                    variant="light"
                    showSweepRing={true}
                    label="Current Live Time"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900">
                    {shiftCheck.isAllowed
                      ? "Ready to Start Today's Shift"
                      : 'Shift Check-In Currently Locked'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Office Shift: <strong>{shiftCheck.shiftStart} – {shiftCheck.shiftEnd}</strong>{' '}
                    (Grace Buffer: {shiftCheck.config.gracePeriodMinutes} mins).
                  </p>
                  {shiftCheck.isAllowed ? (
                    <p className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100/90 border border-emerald-300 py-1 px-3 rounded-full inline-block mt-1">
                      Allowed Window: {shiftCheck.allowedStart} to {shiftCheck.allowedEnd}
                    </p>
                  ) : (
                    <p className="text-[11px] text-rose-800 font-extrabold bg-rose-100/90 border border-rose-300 py-1 px-3 rounded-full inline-block mt-1">
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
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl active:scale-95 font-black text-sm transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 max-w-full text-center ${
                      !shiftCheck.isAllowed
                        ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md shadow-rose-700/20'
                        : 'bg-[#059669] hover:bg-[#047857] text-white shadow-md shadow-[#059669]/25'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span>
                      {actionLoading
                        ? 'Starting Shift...'
                        : !shiftCheck.isAllowed
                        ? 'Shift Locked (View Timing)'
                        : 'Start Work (Check In Now)'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. STATE: WORKING */}
            {status === 'working' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold max-w-full truncate shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    Shift is Active • In at {formatTimeStr(activeSession?.startTime) || 'Recently'}
                  </span>
                </div>

                <div className="py-1 flex justify-center">
                  <ModernDigitClock
                    timeString={liveWorkedHMS}
                    size={clockSize || "sm"}
                    variant="light"
                    showSweepRing={true}
                    label="ACTIVE WORKED TIMER"
                  />
                </div>
                <p className="text-xs text-slate-600">
                  Worked time recorded today • Shift target: 9.0 Hours
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto w-full">
                  <button
                    id="btn-shift-take-break"
                    onClick={() => takeBreak()}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xs min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Pausing...' : 'Take Break'}
                    </span>
                  </button>
                  <button
                    id="btn-shift-check-out"
                    onClick={() => checkOut()}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm shadow-rose-600/25 min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-4 h-4 fill-current shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Checking out...' : 'End Day & Check Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. STATE: ON BREAK */}
            {status === 'on_break' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold max-w-full truncate shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="truncate">Break in Progress • Work Timer Paused</span>
                </div>

                <div className="py-1 flex justify-center">
                  <ModernDigitClock
                    timeString={liveWorkedHMS}
                    size={clockSize || "sm"}
                    variant="amber"
                    showSweepRing={true}
                    label="TIMER PAUSED (ON BREAK)"
                    subText={`Break Duration: ${liveBreakWords}`}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  Enjoy your break! Click resume when you are back at your workstation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto w-full">
                  <button
                    id="btn-shift-resume-work"
                    onClick={() => resumeWork()}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Resuming...' : 'Resume Work'}
                    </span>
                  </button>
                  <button
                    id="btn-shift-check-out-from-break"
                    type="button"
                    disabled={true}
                    title="Checkout is blocked during break. Please resume work first."
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 shadow-none min-w-0 cursor-not-allowed select-none"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Check Out (Resume Work First)
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-800/85 font-semibold bg-amber-100/70 py-1.5 px-3 rounded-xl border border-amber-200/80 max-w-md mx-auto">
                  ⚠️ Check-out is blocked while break is active. Please click &ldquo;Resume Work&rdquo; first.
                </p>
              </div>
            )}

            {/* 4. STATE: COMPLETED */}
            {status === 'completed' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  ✓ Session Checked Out
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Start In:{' '}
                  <strong>
                    {formatTimeStr(lastCompletedSession?.startTime) || 'Completed'}
                  </strong>{' '}
                  • Out:{' '}
                  <strong>
                    {formatTimeStr(lastCompletedSession?.endTime) || 'Completed'}
                  </strong>{' '}
                  • Today Worked:{' '}
                  <strong>
                    {todaySummary?.totalDurationFormatted || liveWorkedHMS}
                  </strong>
                </p>

                <div className="py-1 flex justify-center">
                  <ModernDigitClock
                    timeString={liveWorkedHMS}
                    size={clockSize || "sm"}
                    variant="light"
                    showSweepRing={false}
                    label="SHIFT FINALIZED"
                    subText={`Total Break: ${
                      todaySummary?.totalBreakFormatted || liveBreakWords
                    }`}
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="btn-shift-check-in-again"
                    onClick={() => checkIn()}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {actionLoading ? 'Starting Session...' : 'Check In Again (New Session)'}
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

