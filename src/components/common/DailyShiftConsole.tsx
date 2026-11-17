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

interface DailyShiftConsoleProps {
  className?: string;
  showFooterBadges?: boolean;
}

export const DailyShiftConsole: React.FC<DailyShiftConsoleProps> = ({
  className = '',
  showFooterBadges = true,
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

  // Top bar gradient based on status
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
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Check-in, break, and work time tracking
                </p>
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
                </div>
              </div>
            )}

            {/* 2. STATE: WORKING (Exact match to reference image) */}
            {status === 'working' && (
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
                    className="w-full py-2.5 px-4 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 min-w-0 cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                    <span className="truncate">
                      {actionLoading ? 'Checking out...' : 'End Day & Check Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. STATE: ON BREAK */}
            {status === 'on_break' && (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
