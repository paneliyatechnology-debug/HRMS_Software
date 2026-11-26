'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Globe } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  variant?: 'pill' | 'minimal' | 'topbar' | 'compact';
  showDate?: boolean;
  showSeconds?: boolean;
  showTimezone?: boolean;
  showIndicator?: boolean;
  onClick?: () => void;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  className = '',
  variant = 'pill',
  showDate = true,
  showSeconds = true,
  showTimezone = true,
  showIndicator = true,
  onClick,
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [is24Hour, setIs24Hour] = useState(false);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [locale, setLocale] = useState('en-IN');

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!mounted || !currentTime) {
    // Elegant placeholder while mounting to avoid SSR hydration mismatch
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-transparent animate-pulse text-xs text-slate-400 select-none ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-mono font-medium">--:--:-- --</span>
      </div>
    );
  }

  // Format Time
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: !is24Hour,
  });

  const formattedTime = timeFormatter.format(currentTime);

  // Extract separate parts for animated rendering
  const timeParts = timeFormatter.formatToParts(currentTime);
  const hours = timeParts.find((p) => p.type === 'hour')?.value || '00';
  const minutes = timeParts.find((p) => p.type === 'minute')?.value || '00';
  const seconds = timeParts.find((p) => p.type === 'second')?.value || '00';
  const dayPeriod = timeParts.find((p) => p.type === 'dayPeriod')?.value || '';

  // Format Date according to preference
  let formattedDate = '';
  const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(currentTime);
  const monthName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(currentTime);
  const dd = String(currentTime.getDate()).padStart(2, '0');
  const mm = String(currentTime.getMonth() + 1).padStart(2, '0');
  const yyyy = currentTime.getFullYear();

  if (dateFormat === 'MM/DD/YYYY') {
    formattedDate = `${dayName}, ${mm}/${dd}/${yyyy}`;
  } else if (dateFormat === 'YYYY-MM-DD') {
    formattedDate = `${dayName}, ${yyyy}-${mm}-${dd}`;
  } else {
    formattedDate = `${dayName}, ${dd} ${monthName} ${yyyy}`;
  }

  // Timezone abbreviation (e.g. IST)
  const timeZoneName =
    Intl.DateTimeFormat(locale, { timeZoneName: 'short' })
      .formatToParts(currentTime)
      .find((part) => part.type === 'timeZoneName')?.value || 'IST';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIs24Hour(!is24Hour);
    }
  };

  // Variant: Topbar (for full-width top strip)
  if (variant === 'topbar') {
    return (
      <div
        id="live-clock-topbar"
        onClick={handleClick}
        className={`inline-flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer hover:text-white transition-colors ${className}`}
        title="Live Real-time Clock • Click to toggle 12h/24h format"
      >
        {showIndicator && (
          <span className="relative flex h-2 w-2">
            <span className="animate-radar-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
        <div className="flex items-center gap-1 font-mono font-bold tracking-tight text-white text-xs sm:text-sm">
          <Clock className="w-3.5 h-3.5 text-emerald-400 mr-0.5" />
          <span>{hours}</span>
          <span className="animate-clock-colon text-emerald-400">:</span>
          <span>{minutes}</span>
          {showSeconds && (
            <>
              <span className="animate-clock-colon text-emerald-400">:</span>
              <span key={seconds} className="animate-digit-tick text-emerald-300">
                {seconds}
              </span>
            </>
          )}
          {dayPeriod && <span className="text-[10px] ml-1 opacity-80">{dayPeriod}</span>}
        </div>
        {showTimezone && (
          <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
            {timeZoneName}
          </span>
        )}
        {showDate && (
          <>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium hidden sm:inline flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
          </>
        )}
      </div>
    );
  }

  // Variant: Compact (for mobile / tight spots)
  if (variant === 'compact') {
    return (
      <div
        id="live-clock-compact"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-mono font-bold transition-all cursor-pointer ${className}`}
        title="Live Clock • Click to toggle 12h/24h"
      >
        {showIndicator && (
          <span className="relative flex h-2 w-2">
            <span className="animate-radar-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
        <Clock className="w-3 h-3 text-emerald-600 mr-0.5" />
        <span>{hours}</span>
        <span className="animate-clock-colon text-emerald-600">:</span>
        <span>{minutes}</span>
        {showSeconds && (
          <>
            <span className="animate-clock-colon text-emerald-600">:</span>
            <span key={seconds} className="animate-digit-tick text-emerald-600">
              {seconds}
            </span>
          </>
        )}
      </div>
    );
  }

  // Variant: Pill (Default Modern Badge for Header)
  return (
    <div
      id="live-clock-pill"
      onClick={handleClick}
<<<<<<< HEAD
      className={`group inline-flex items-center flex-nowrap whitespace-nowrap gap-2 sm:gap-2.5 px-3 py-1.5 rounded-[11px] bg-[#ecfdf5]/70 border border-[#a7f3d0] shadow-2xs hover:border-[#059669]/60 hover:bg-white hover:shadow-xs transition-all duration-200 cursor-pointer select-none max-w-full overflow-hidden ${className}`}
=======
      className={`group inline-flex flex-col items-start justify-center px-2 py-1 rounded-[10px] bg-transparent hover:bg-[#d8f3dc]/60 transition-all duration-200 cursor-pointer select-none shrink-0 ${className}`}
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
      title="Live System Time (Auto-synced) • Click to toggle 12h/24h"
    >
      {/* Live Indicator Dot & Badge */}
      {showIndicator && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="animate-radar-dot absolute inline-flex h-full w-full rounded-full bg-[#52b788]"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2d6a4f]"></span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#1b4332] bg-[#d8f3dc] px-1.5 py-0.5 rounded-full leading-tight">
            LIVE
          </span>
        </div>
      )}

      {/* Top: Digital Time with Monospace Figures and Timezone */}
      <div className="flex items-center gap-0.5 font-mono text-[#1b4332] leading-none">
        <Clock className="w-3.5 h-3.5 text-[#2d6a4f] group-hover:rotate-12 transition-transform duration-300 mr-1 shrink-0" />
        <span className="font-bold text-xs sm:text-[13px] tracking-tight text-[#1b4332]">
          {hours}
        </span>
        <span className="text-[#52b788] font-bold text-xs sm:text-[13px] animate-clock-colon px-0.5">
          :
        </span>
        <span className="font-bold text-xs sm:text-[13px] tracking-tight text-[#1b4332]">
          {minutes}
        </span>
        {showSeconds && (
          <>
            <span className="text-[#52b788] font-bold text-xs sm:text-[13px] animate-clock-colon px-0.5">
              :
            </span>
            <span
              key={seconds}
              className="font-bold text-xs sm:text-[13px] tracking-tight text-[#40916c] animate-digit-tick inline-block min-w-[16px] text-center"
            >
              {seconds}
            </span>
          </>
        )}
        {dayPeriod && (
          <span className="text-[10px] font-bold text-[#2d6a4f] ml-1 uppercase">
            {dayPeriod}
          </span>
        )}

        {/* Timezone Badge */}
        {showTimezone && (
          <span className="text-[9px] font-bold text-[#1b4332] bg-[#d8f3dc] border border-[#95d5b2] px-1.5 py-0.5 rounded leading-none ml-1.5 inline-block">
            {timeZoneName}
          </span>
        )}
      </div>

      {/* Bottom: Date */}
      {showDate && (
<<<<<<< HEAD
        <>
          <div className="hidden 2xl:block h-3.5 w-px bg-[#d8ebd9]" />
          <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-[#4e6a5d] font-medium whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#059669]" />
            <span className="whitespace-nowrap">{formattedDate}</span>
          </div>
        </>
=======
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#495057] font-medium whitespace-nowrap leading-tight mt-1">
          <Calendar className="w-3 h-3 text-[#40916c] shrink-0" />
          <span>{formattedDate}</span>
        </div>
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
      )}
    </div>
  );
};
