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
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
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
          <div className="mt-2.5">
            {/* 1. STATE: NOT STARTED */}
            {status === 'not_started' && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left min-w-0">
                  <h4 className="text-sm font-black text-slate-900 leading-tight">
                    {shiftCheck.isAllowed
                      ? "Ready to Start Today's Shift"
                      : 'Shift Clock-In Currently Locked'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-snug">
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
                        : 'bg-[#6c757d] hover:bg-[#343a40] text-white shadow-sm shadow-[#6c757d]/25'
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
            )}

            {/* 2. STATE: WORKING */}
            {status === 'working' && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="space-y-1 text-center sm:text-left min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold max-w-full truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">
                        Shift Active • In at {formatTimeStr(activeSession?.startTime) || 'Recently'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Worked time today • Target: 9.0 Hours
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ModernDigitClock
                      timeString={liveWorkedHMS}
                      size={clockSize || "sm"}
                      variant="light"
                      showSweepRing={true}
                      label="ACTIVE WORKED TIMER"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="space-y-1 text-center sm:text-left min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold max-w-full truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="truncate">Break in Progress • Timer Paused</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Click resume when you are back at your workstation.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ModernDigitClock
                      timeString={liveWorkedHMS}
                      size={clockSize || "sm"}
                      variant="amber"
                      showSweepRing={true}
                      label="TIMER PAUSED (ON BREAK)"
                      subText={`Break: ${liveBreakWords}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 text-center sm:text-left min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        Session Clocked Out
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                        In:{' '}
                        <strong>
                          {formatTimeStr(lastCompletedSession?.startTime) || 'Completed'}
                        </strong>{' '}
                        • Out:{' '}
                        <strong>
                          {formatTimeStr(lastCompletedSession?.endTime) || 'Completed'}
                        </strong>{' '}
                        • Worked:{' '}
                        <strong>
                          {todaySummary?.totalDurationFormatted || liveWorkedHMS}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <ModernDigitClock
                      timeString={liveWorkedHMS}
                      size={clockSize || "sm"}
                      variant="light"
                      showSweepRing={false}
                      label="SHIFT FINALIZED"
                      subText={`Break: ${todaySummary?.totalBreakFormatted || liveBreakWords
                        }`}
                    />
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end">
                  <button
                    id="btn-shift-check-in-again"
                    onClick={() => checkIn()}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
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

