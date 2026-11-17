'use client';

import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

export interface ModernDigitClockProps {
  time?: Date | null;
  timeString?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?:
    | 'cockpit'
    | 'header-badge'
    | 'dark'
    | 'light'
    | 'emerald'
    | 'amber'
    | 'executive-dark'
    | 'executive-emerald'
    | 'executive-amber';
  showLabels?: boolean;
  showSweepRing?: boolean;
  label?: string;
  subText?: string;
  className?: string;
  accentColor?: 'emerald' | 'amber';
}

export const ModernDigitClock: React.FC<ModernDigitClockProps> = ({
  time,
  timeString,
  size = 'md',
  variant = 'cockpit',
  showLabels = true,
  showSweepRing = true,
  label,
  subText,
  className = '',
  accentColor = 'emerald',
}) => {
  // Parse hours, minutes, seconds, ampm
  const { hours, minutes, seconds, period, secNum } = useMemo(() => {
    if (time) {
      let h = time.getHours();
      const m = time.getMinutes();
      const s = time.getSeconds();
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return {
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
        period: p,
        secNum: s,
      };
    }

    if (timeString) {
      // Could be "HH:MM:SS" or "HH:MM:SS AM/PM" or "02h 15m 30s"
      const match = timeString.match(/(\d{1,2})[:h\s]+(\d{1,2})[:m\s]+(\d{1,2})\s*(AM|PM)?/i);
      if (match) {
        const s = parseInt(match[3], 10) || 0;
        return {
          hours: String(match[1]).padStart(2, '0'),
          minutes: String(match[2]).padStart(2, '0'),
          seconds: String(match[3]).padStart(2, '0'),
          period: match[4] ? match[4].toUpperCase() : '',
          secNum: s,
        };
      }
      // Fallback simple split
      const parts = timeString.split(/[:\s]/);
      return {
        hours: parts[0] ? String(parts[0]).padStart(2, '0') : '00',
        minutes: parts[1] ? String(parts[1]).padStart(2, '0') : '00',
        seconds: parts[2] ? String(parts[2]).padStart(2, '0') : '00',
        period: parts[3] ? parts[3].toUpperCase() : '',
        secNum: parseInt(parts[2], 10) || 0,
      };
    }

    return { hours: '00', minutes: '00', seconds: '00', period: '', secNum: 0 };
  }, [time, timeString]);

  // Circumference for circular progress ring (radius = 38)
  const ringRadius = 38;
  const circumference = 2 * Math.PI * ringRadius; // ~238.76
  const strokeDashoffset = circumference - (secNum / 60) * circumference;

  // 1. Header Compact Badge Display (like top-right in reference image: [ 03 ] : [ 43 ] : [ 11 ] [ PM ])
  if (variant === 'header-badge' || (size === 'sm' && !showLabels)) {
    return (
      <div className={`flex items-center gap-1 sm:gap-1.5 select-none font-mono ${className}`}>
        <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200/80 shadow-2xs text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
          {hours}
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-400">:</span>
        <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200/80 shadow-2xs text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
          {minutes}
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-400">:</span>
        <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200/80 shadow-2xs text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
          {seconds}
        </div>
        {period && (
          <div className="px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] sm:text-xs font-bold text-emerald-800 ml-0.5 sm:ml-1">
            {period}
          </div>
        )}
      </div>
    );
  }

  // 2. Reference Design: Dark Green Digital Timer with Circular Green Progress Ring
  const isAmber = accentColor === 'amber' || variant === 'amber' || variant === 'executive-amber';

  return (
    <div className={`flex flex-col items-center select-none w-full ${className}`}>
      {/* Main Row: Circular Progress Ring on Left + Dark Emerald Container on Right */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-1">
        {/* Left: Circular Green Progress Ring with Center Clock Icon */}
        {showSweepRing && (
          <div className="relative w-18 h-18 sm:w-22 sm:h-22 flex items-center justify-center shrink-0">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                stroke={isAmber ? '#fef3c7' : '#d5ede0'}
                strokeWidth="11"
                fill="none"
              />
              {/* Active Progress Stroke */}
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                stroke={isAmber ? '#d97706' : '#059669'}
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <Clock
              className={`w-6 h-6 sm:w-7 sm:h-7 absolute ${
                isAmber ? 'text-amber-800' : 'text-[#0a4232]'
              }`}
              strokeWidth={2.3}
            />
          </div>
        )}

        {/* Right: Dark Emerald-Green Rounded Container */}
        <div
          className={`rounded-[22px] sm:rounded-[28px] px-3.5 sm:px-6 py-3 sm:py-3.5 shadow-lg flex items-center gap-1.5 sm:gap-2.5 ${
            isAmber
              ? 'bg-[#3d1a04] shadow-amber-950/20'
              : 'bg-[#0a4232] shadow-[#0a4232]/25'
          }`}
        >
          {/* 1. HOURS CARD */}
          <div className="flex flex-col items-center">
            <div
              className={`w-13 sm:w-18 h-12 sm:h-16 rounded-[14px] sm:rounded-[18px] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center justify-center ${
                isAmber ? 'bg-[#78350f]' : 'bg-[#145743]'
              }`}
            >
              <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono tabular-nums leading-none tracking-tight">
                {hours}
              </span>
            </div>
            {showLabels && (
              <span
                className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase mt-1.5 ${
                  isAmber ? 'text-amber-300' : 'text-[#7dd8b2]'
                }`}
              >
                HOURS
              </span>
            )}
          </div>

          {/* COLON */}
          <span className="text-xl sm:text-2xl font-black text-white/90 self-start mt-2.5 sm:mt-3.5 px-0.5">
            :
          </span>

          {/* 2. MINS CARD */}
          <div className="flex flex-col items-center">
            <div
              className={`w-13 sm:w-18 h-12 sm:h-16 rounded-[14px] sm:rounded-[18px] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center justify-center ${
                isAmber ? 'bg-[#78350f]' : 'bg-[#145743]'
              }`}
            >
              <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono tabular-nums leading-none tracking-tight">
                {minutes}
              </span>
            </div>
            {showLabels && (
              <span
                className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase mt-1.5 ${
                  isAmber ? 'text-amber-300' : 'text-[#7dd8b2]'
                }`}
              >
                MINS
              </span>
            )}
          </div>

          {/* COLON */}
          <span className="text-xl sm:text-2xl font-black text-white/90 self-start mt-2.5 sm:mt-3.5 px-0.5">
            :
          </span>

          {/* 3. SECS CARD */}
          <div className="flex flex-col items-center">
            <div
              key={seconds}
              className={`w-13 sm:w-18 h-12 sm:h-16 rounded-[14px] sm:rounded-[18px] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center justify-center ${
                isAmber ? 'bg-[#78350f]' : 'bg-[#145743]'
              }`}
            >
              <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono tabular-nums leading-none tracking-tight">
                {seconds}
              </span>
            </div>
            {showLabels && (
              <span
                className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase mt-1.5 ${
                  isAmber ? 'text-amber-300' : 'text-[#7dd8b2]'
                }`}
              >
                SECS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subtext e.g. Break duration */}
      {subText && (
        <p
          className={`mt-2 text-xs font-semibold ${
            isAmber ? 'text-amber-800' : 'text-[#0d5f43]'
          }`}
        >
          {subText}
        </p>
      )}
    </div>
  );
};
