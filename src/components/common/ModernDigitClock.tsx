'use client';

import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface ModernDigitClockProps {
  time?: Date | null;
  timeString?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'emerald' | 'amber';
  showLabels?: boolean;
  showSweepRing?: boolean;
  label?: string;
  subText?: string;
  className?: string;
}

export const ModernDigitClock: React.FC<ModernDigitClockProps> = ({
  time,
  timeString,
  size = 'md',
  variant = 'emerald',
  showLabels = true,
  showSweepRing = false,
  label,
  subText,
  className = '',
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
        hours: parts[0] || '00',
        minutes: parts[1] || '00',
        seconds: parts[2] || '00',
        period: parts[3] || '',
        secNum: parseInt(parts[2], 10) || 0,
      };
    }

    return { hours: '00', minutes: '00', seconds: '00', period: '', secNum: 0 };
  }, [time, timeString]);

  // Size styling maps
  const sizeMap = {
    sm: {
      card: 'px-2 py-1 text-sm rounded-lg min-w-[28px]',
      colon: 'text-sm',
      label: 'text-[8px]',
      period: 'text-[9px] px-1.5 py-0.5',
      ringSize: 28,
    },
    md: {
      card: 'px-2.5 py-1.5 text-lg sm:text-xl rounded-xl min-w-[36px]',
      colon: 'text-lg sm:text-xl',
      label: 'text-[9px]',
      period: 'text-[10px] px-2 py-0.5',
      ringSize: 36,
    },
    lg: {
      card: 'px-3.5 py-2 text-2xl sm:text-3xl rounded-2xl min-w-[50px]',
      colon: 'text-2xl sm:text-3xl',
      label: 'text-[10px]',
      period: 'text-xs px-2.5 py-1',
      ringSize: 48,
    },
    xl: {
      card: 'px-4 sm:px-5 py-3 text-3xl sm:text-5xl rounded-2xl min-w-[62px] sm:min-w-[76px]',
      colon: 'text-3xl sm:text-5xl',
      label: 'text-[10px] sm:text-xs',
      period: 'text-xs sm:text-sm px-3 py-1',
      ringSize: 58,
    },
  }[size];

  // Variant styling maps
  const variantMap = {
    emerald: {
      cardBg: 'bg-white/10 backdrop-blur-md border border-[#10b981]/30 text-white shadow-sm',
      cardTop: 'bg-gradient-to-r from-[#10b981]/50 to-[#059669]/50',
      colonColor: 'text-[#34d399]',
      secColor: 'text-[#6ee7b7]',
      labelColor: 'text-[#a7f3d0]',
      periodBg: 'bg-[#10b981]/25 text-[#a7f3d0] border border-[#10b981]/40',
      ringColor: '#10b981',
      ringBg: 'rgba(255,255,255,0.1)',
    },
    dark: {
      cardBg: 'bg-[#062d1f] border border-[#0d4a34] text-white shadow-md',
      cardTop: 'bg-[#10b981]/40',
      colonColor: 'text-[#10b981]',
      secColor: 'text-[#34d399]',
      labelColor: 'text-[#6ee7b7]/80',
      periodBg: 'bg-[#0d4a34] text-[#a7f3d0] border border-[#10b981]/30',
      ringColor: '#10b981',
      ringBg: '#0b3b29',
    },
    light: {
      cardBg: 'bg-white border border-[#d8ebd9] text-[#0d271d] shadow-2xs',
      cardTop: 'bg-[#10b981]/15',
      colonColor: 'text-[#059669]',
      secColor: 'text-[#059669]',
      labelColor: 'text-[#4e6a5d]',
      periodBg: 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]',
      ringColor: '#059669',
      ringBg: '#d8ebd9',
    },
    amber: {
      cardBg: 'bg-amber-500/10 backdrop-blur-md border border-amber-500/30 text-amber-950 shadow-sm',
      cardTop: 'bg-amber-500/30',
      colonColor: 'text-amber-600',
      secColor: 'text-amber-600',
      labelColor: 'text-amber-700',
      periodBg: 'bg-amber-100 text-amber-800 border border-amber-300',
      ringColor: '#f59e0b',
      ringBg: '#fef3c7',
    },
  }[variant];

  // Sweep ring math (radius 18, circumference ~113.1)
  const ringRadius = 16;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (secNum / 60) * circumference;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Optional Top Label */}
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-radar-dot absolute inline-flex h-full w-full rounded-full bg-[#10b981]"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          <span className={`text-[11px] font-extrabold uppercase tracking-widest ${variantMap.labelColor}`}>
            {label}
          </span>
        </div>
      )}

      {/* Digits Display Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sweep Ring Dial (Optional) */}
        {showSweepRing && (
          <div className="relative mr-1 flex items-center justify-center shrink-0">
            <svg
              className="transform -rotate-90"
              width={sizeMap.ringSize}
              height={sizeMap.ringSize}
              viewBox="0 0 40 40"
            >
              <circle
                cx="20"
                cy="20"
                r={ringRadius}
                stroke={variantMap.ringBg}
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="20"
                cy="20"
                r={ringRadius}
                stroke={variantMap.ringColor}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <Clock className="w-3.5 h-3.5 text-current absolute opacity-70" />
          </div>
        )}

        {/* 1. Hours Card */}
        <div className="flex flex-col items-center">
          <div
            className={`font-mono font-black tracking-tight text-center relative overflow-hidden flex items-center justify-center ${sizeMap.card} ${variantMap.cardBg}`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${variantMap.cardTop}`} />
            <span>{hours}</span>
          </div>
          {showLabels && (
            <span className={`mt-1 font-bold uppercase tracking-wider ${sizeMap.label} ${variantMap.labelColor}`}>
              Hours
            </span>
          )}
        </div>

        {/* Colon */}
        <div
          className={`font-mono font-black self-center pb-2.5 sm:pb-3 animate-clock-colon ${sizeMap.colon} ${variantMap.colonColor}`}
        >
          :
        </div>

        {/* 2. Minutes Card */}
        <div className="flex flex-col items-center">
          <div
            className={`font-mono font-black tracking-tight text-center relative overflow-hidden flex items-center justify-center ${sizeMap.card} ${variantMap.cardBg}`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${variantMap.cardTop}`} />
            <span>{minutes}</span>
          </div>
          {showLabels && (
            <span className={`mt-1 font-bold uppercase tracking-wider ${sizeMap.label} ${variantMap.labelColor}`}>
              Mins
            </span>
          )}
        </div>

        {/* Colon */}
        <div
          className={`font-mono font-black self-center pb-2.5 sm:pb-3 animate-clock-colon ${sizeMap.colon} ${variantMap.colonColor}`}
        >
          :
        </div>

        {/* 3. Seconds Card (Animated Tick) */}
        <div className="flex flex-col items-center">
          <div
            key={seconds}
            className={`font-mono font-black tracking-tight text-center relative overflow-hidden flex items-center justify-center animate-digit-tick ${sizeMap.card} ${variantMap.cardBg}`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${variantMap.cardTop}`} />
            <span className={variantMap.secColor}>{seconds}</span>
          </div>
          {showLabels && (
            <span className={`mt-1 font-bold uppercase tracking-wider ${sizeMap.label} ${variantMap.labelColor}`}>
              Secs
            </span>
          )}
        </div>

        {/* AM / PM Pill */}
        {period && (
          <div className="flex flex-col justify-center ml-1">
            <span className={`font-mono font-extrabold rounded-lg tracking-wider ${sizeMap.period} ${variantMap.periodBg}`}>
              {period}
            </span>
          </div>
        )}
      </div>

      {/* Subtext e.g. Date */}
      {subText && (
        <p className={`mt-2 text-xs font-semibold ${variantMap.labelColor} opacity-90`}>
          {subText}
        </p>
      )}
    </div>
  );
};
