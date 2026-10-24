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

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || !currentTime) {
    // Elegant placeholder while mounting to avoid SSR hydration mismatch
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 animate-pulse text-xs text-slate-400 select-none ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-mono font-medium">--:--:-- --</span>
      </div>
    );
  }

  // Format Time
  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: !is24Hour,
  });

  const formattedTime = timeFormatter.format(currentTime);

  // Format Date (e.g. Fri, 23 Oct 2026)
  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedDate = dateFormatter.format(currentTime);

  // Timezone abbreviation (e.g. IST)
  const timeZoneName =
    Intl.DateTimeFormat('en-IN', { timeZoneName: 'short' })
      .formatToParts(currentTime)
      .find((part) => part.type === 'timeZoneName')?.value || 'IST';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIs24Hour((prev) => !prev);
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
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
        <div className="flex items-center gap-1.5 font-mono font-bold tracking-tight text-white text-xs sm:text-sm">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formattedTime}</span>
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
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        )}
        <Clock className="w-3 h-3 text-indigo-600" />
        <span>{formattedTime}</span>
      </div>
    );
  }

  // Variant: Pill (Default Modern Badge for Header)
  return (
    <div
      id="live-clock-pill"
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-[11px] bg-[#f8faff] border border-[#dce4f7] shadow-2xs hover:border-[#4f5fe8]/50 hover:bg-white hover:shadow-xs transition-all duration-200 cursor-pointer select-none ${className}`}
      title="Live System Time (Auto-synced) • Click to toggle 12h/24h"
    >
      {/* Live Indicator Dot & Badge */}
      {showIndicator && (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a779] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16a779]"></span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider text-[#13865f] bg-[#e5f8f0] px-1.5 py-0.2 rounded-full leading-tight">
            LIVE
          </span>
        </div>
      )}

      {/* Divider */}
      {showIndicator && <div className="hidden sm:block h-3.5 w-px bg-[#e4eaf5]" />}

      {/* Digital Time with Monospace Figures */}
      <div className="flex items-center gap-1.5 font-mono text-[#152345]">
        <Clock className="w-3.5 h-3.5 text-[#4f5fe8] group-hover:rotate-12 transition-transform duration-300" />
        <span className="font-bold text-xs sm:text-[13px] tracking-tight text-[#152345]">
          {formattedTime}
        </span>
      </div>

      {/* Timezone Badge */}
      {showTimezone && (
        <span className="text-[10px] font-bold text-[#3446bd] bg-[#eef2ff] border border-[#dce4f7] px-1.5 py-0.5 rounded leading-none hidden md:inline-block">
          {timeZoneName}
        </span>
      )}

      {/* Date */}
      {showDate && (
        <>
          <div className="hidden md:block h-3.5 w-px bg-[#e4eaf5]" />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#6e7b98] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#6e7b98]" />
            <span>{formattedDate}</span>
          </div>
        </>
      )}
    </div>
  );
};
