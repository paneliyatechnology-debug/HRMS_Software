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

    const loadPreferences = () => {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('hrms_emp_preferences') : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.timeFormat) {
            setIs24Hour(parsed.timeFormat === '24h');
          }
          if (parsed.dateFormat) {
            setDateFormat(parsed.dateFormat);
          }
          if (parsed.language === 'Hindi') {
            setLocale('hi-IN');
          } else if (parsed.language === 'Gujarati') {
            setLocale('gu-IN');
          } else {
            setLocale('en-IN');
          }
        }
      } catch (err) {
        console.error('Failed to load clock preferences:', err);
      }
    };

    loadPreferences();
    window.addEventListener('hrms_preferences_updated', loadPreferences);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hrms_preferences_updated', loadPreferences);
    };
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
      const next24 = !is24Hour;
      setIs24Hour(next24);
      try {
        const saved = localStorage.getItem('hrms_emp_preferences');
        const parsed = saved ? JSON.parse(saved) : {};
        parsed.timeFormat = next24 ? '24h' : '12h';
        localStorage.setItem('hrms_emp_preferences', JSON.stringify(parsed));
        window.dispatchEvent(new Event('hrms_preferences_updated'));
      } catch {}
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
      className={`group inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-[11px] bg-[#ecfdf5]/70 border border-[#a7f3d0] shadow-2xs hover:border-[#059669]/60 hover:bg-white hover:shadow-xs transition-all duration-200 cursor-pointer select-none ${className}`}
      title="Live System Time (Auto-synced) • Click to toggle 12h/24h"
    >
      {/* Live Indicator Dot & Badge */}
      {showIndicator && (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-radar-dot absolute inline-flex h-full w-full rounded-full bg-[#10b981]"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider text-[#065f46] bg-[#dcfce7] px-1.5 py-0.5 rounded-full leading-tight">
            LIVE
          </span>
        </div>
      )}

      {/* Divider */}
      {showIndicator && <div className="hidden sm:block h-3.5 w-px bg-[#d8ebd9]" />}

      {/* Digital Time with Monospace Figures and Pulsing Colons */}
      <div className="flex items-center gap-0.5 font-mono text-[#0d271d]">
        <Clock className="w-3.5 h-3.5 text-[#059669] group-hover:rotate-12 transition-transform duration-300 mr-1" />
        <span className="font-bold text-xs sm:text-[13px] tracking-tight text-[#0d271d]">
          {hours}
        </span>
        <span className="text-[#059669] font-bold text-xs sm:text-[13px] animate-clock-colon px-0.5">
          :
        </span>
        <span className="font-bold text-xs sm:text-[13px] tracking-tight text-[#0d271d]">
          {minutes}
        </span>
        {showSeconds && (
          <>
            <span className="text-[#059669] font-bold text-xs sm:text-[13px] animate-clock-colon px-0.5">
              :
            </span>
            <span
              key={seconds}
              className="font-bold text-xs sm:text-[13px] tracking-tight text-[#059669] animate-digit-tick inline-block min-w-[16px] text-center"
            >
              {seconds}
            </span>
          </>
        )}
        {dayPeriod && (
          <span className="text-[10px] font-bold text-[#4e6a5d] ml-1 uppercase">
            {dayPeriod}
          </span>
        )}
      </div>

      {/* Timezone Badge */}
      {showTimezone && (
        <span className="text-[10px] font-bold text-[#065f46] bg-[#dcfce7] border border-[#a7f3d0] px-1.5 py-0.5 rounded leading-none hidden md:inline-block">
          {timeZoneName}
        </span>
      )}

      {/* Date */}
      {showDate && (
        <>
          <div className="hidden md:block h-3.5 w-px bg-[#d8ebd9]" />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#4e6a5d] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#059669]" />
            <span>{formattedDate}</span>
          </div>
        </>
      )}
    </div>
  );
};
