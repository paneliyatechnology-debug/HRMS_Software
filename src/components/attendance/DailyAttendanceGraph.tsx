'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  CalendarCheck,
  TrendingUp,
  Coffee,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { AttendanceRecord } from '../../types/hrms';
import {
  getTodayDateString,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  formatSecondsToWords,
} from '../../lib/attendanceService';
import { isDateWeekend } from '../../lib/shiftScheduleService';

interface DailyAttendanceGraphProps {
  mode: 'employee' | 'admin';
  records: AttendanceRecord[];
  totalEmployees?: number;
  liveWorkedHMS?: string;
  liveStatus?: 'not_started' | 'working' | 'on_break' | 'completed';
  todayCheckIn?: string;
  todayCheckOut?: string;
  todayBreakWords?: string;
  onViewFullLog?: () => void;
}

interface DayPoint {
  dateStr: string;
  shortLabel: string;
  fullDateLabel: string;
  weekday: string;
  isToday: boolean;
  isWeekend: boolean;
  // Employee mode metrics
  workedHours: number;
  workedLabel: string;
  checkIn?: string;
  checkOut?: string;
  breakLabel: string;
  status: string;
  hasRecord: boolean;
  // Admin mode metrics
  presentCount: number;
  lateCount: number;
  turnoutPct: number;
}

const TARGET_HOURS = 9;

function parseHMSToHours(hms?: string): number {
  if (!hms) return 0;
  const parts = hms.split(':').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 0;
  return parts[0] + parts[1] / 60 + parts[2] / 3600;
}

function formatHoursCompact(hours: number): string {
  if (hours <= 0) return '0h';
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const DailyAttendanceGraph: React.FC<DailyAttendanceGraphProps> = ({
  mode,
  records,
  totalEmployees = 0,
  liveWorkedHMS,
  liveStatus = 'not_started',
  todayCheckIn,
  todayCheckOut,
  todayBreakWords,
  onViewFullLog,
}) => {
  const [rangeDays, setRangeDays] = useState<7 | 14>(7);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const todayStr = getTodayDateString();

  // Build real daily time-series strictly from actual backend/session records (zero mock data)
  const dayPoints: DayPoint[] = useMemo(() => {
    const points: DayPoint[] = [];
    const now = new Date();

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = dateStr === todayStr;
      const dow = d.getDay();
      const isWeekend = isDateWeekend(dateStr);

      const shortLabel = isToday
        ? 'Today'
        : rangeDays === 7
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const fullDateLabel = d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const dayRecords = records.filter((r) => r.date === dateStr);

      if (mode === 'employee') {
        const rec = dayRecords[0];
        let workedHours = 0;

        if (rec) {
          const liveSecs = getLiveActiveSeconds(rec);
          if (liveSecs > 0) {
            workedHours = liveSecs / 3600;
          } else if (typeof rec.workingHours === 'number' && rec.workingHours > 0) {
            workedHours = rec.workingHours;
          } else if (typeof rec.completedWorkSeconds === 'number' && rec.completedWorkSeconds > 0) {
            workedHours = rec.completedWorkSeconds / 3600;
          }
        }

        // For Today, incorporate real live timer from WorkSessionContext if greater
        if (isToday && liveStatus !== 'not_started') {
          const liveHrs = parseHMSToHours(liveWorkedHMS);
          if (liveHrs > workedHours) {
            workedHours = liveHrs;
          }
        }

        const hasRecord = Boolean(rec) || (isToday && liveStatus !== 'not_started');
        const bSecs = rec ? getLiveBreakSeconds(rec) : 0;
        const breakLabel = isToday && todayBreakWords && todayBreakWords !== '0m'
          ? todayBreakWords
          : rec?.formattedTotalBreak ||
          (bSecs > 0
            ? formatSecondsToWords(bSecs)
            : rec?.breakDurationMinutes
              ? `${rec.breakDurationMinutes}m`
              : '0m');

        const resolvedStatus = rec?.status
          ? rec.status
          : isToday && liveStatus === 'working'
            ? 'Working'
            : isToday && liveStatus === 'on_break'
              ? 'On Break'
              : isToday && liveStatus === 'completed'
                ? 'Present'
                : isWeekend
                  ? 'Weekend'
                  : 'No Record';

        points.push({
          dateStr,
          shortLabel,
          fullDateLabel,
          weekday,
          isToday,
          isWeekend,
          workedHours: Number(workedHours.toFixed(2)),
          workedLabel: formatHoursCompact(workedHours),
          checkIn: rec?.checkIn || (isToday ? todayCheckIn : undefined),
          checkOut: rec?.checkOut || (isToday ? todayCheckOut : undefined),
          breakLabel,
          status: resolvedStatus,
          hasRecord,
          presentCount: hasRecord ? 1 : 0,
          lateCount: rec?.status === 'Late' ? 1 : 0,
          turnoutPct: hasRecord ? 100 : 0,
        });
      } else {
        // Admin workforce daily attendance turnout
        const uniqueEmpIds = new Set(
          dayRecords.map((r) => (r.employeeId || r.id || '').toLowerCase()).filter(Boolean)
        );
        const presentCount = uniqueEmpIds.size;
        const lateCount = dayRecords.filter((r) => r.status === 'Late').length;
        const denom = Math.max(1, totalEmployees);
        const turnoutPct =
          totalEmployees > 0 ? Math.min(100, Math.round((presentCount / denom) * 100)) : 0;

        points.push({
          dateStr,
          shortLabel,
          fullDateLabel,
          weekday,
          isToday,
          isWeekend,
          workedHours: 0,
          workedLabel: `${presentCount} Staff`,
          breakLabel: '—',
          status: presentCount > 0 ? `${turnoutPct}% Turnout` : isWeekend ? 'Weekend' : 'No Records',
          hasRecord: presentCount > 0,
          presentCount,
          lateCount,
          turnoutPct,
        });
      }
    }

    return points;
  }, [
    records,
    rangeDays,
    todayStr,
    mode,
    liveWorkedHMS,
    liveStatus,
    todayCheckIn,
    todayCheckOut,
    todayBreakWords,
    totalEmployees,
  ]);

  // Summary metrics computed strictly from real dayPoints
  const summary = useMemo(() => {
    const activeDays = dayPoints.filter((d) => d.hasRecord);
    if (mode === 'employee') {
      const totalHours = activeDays.reduce((acc, d) => acc + d.workedHours, 0);
      const avgHours = activeDays.length > 0 ? totalHours / activeDays.length : 0;
      const onTimeDays = activeDays.filter((d) => d.status !== 'Late').length;
      const onTimePct = activeDays.length > 0 ? Math.round((onTimeDays / activeDays.length) * 100) : 0;
      return {
        primaryLabel: 'Days Logged',
        primaryValue: `${activeDays.length} / ${rangeDays}`,
        secondaryLabel: 'Total Worked',
        secondaryValue: formatHoursCompact(totalHours),
        tertiaryLabel: 'Daily Avg',
        tertiaryValue: formatHoursCompact(avgHours),
        quaternaryLabel: 'On-Time Rate',
        quaternaryValue: activeDays.length > 0 ? `${onTimePct}%` : '—',
        hasAnyData: activeDays.length > 0,
      };
    } else {
      const avgTurnout =
        activeDays.length > 0
          ? Math.round(activeDays.reduce((acc, d) => acc + d.turnoutPct, 0) / activeDays.length)
          : 0;
      const todayPt = dayPoints[dayPoints.length - 1];
      const peakPt = dayPoints.reduce(
        (best, cur) => (cur.presentCount > best.presentCount ? cur : best),
        dayPoints[0]
      );
      return {
        primaryLabel: 'Today Present',
        primaryValue: `${todayPt?.presentCount || 0} / ${totalEmployees}`,
        secondaryLabel: 'Today Turnout',
        secondaryValue: `${todayPt?.turnoutPct || 0}%`,
        tertiaryLabel: `${rangeDays}d Avg Rate`,
        tertiaryValue: activeDays.length > 0 ? `${avgTurnout}%` : '—',
        quaternaryLabel: 'Peak Turnout',
        quaternaryValue: peakPt && peakPt.presentCount > 0 ? `${peakPt.presentCount} Staff` : '—',
        hasAnyData: activeDays.length > 0,
      };
    }
  }, [dayPoints, mode, rangeDays, totalEmployees]);

  // Active inspected day defaults to Today (last bar)
  const activeIdx =
    selectedIndex !== null && selectedIndex < dayPoints.length
      ? selectedIndex
      : dayPoints.length - 1;
  const activeDay = dayPoints[activeIdx];

  // Graph scale calculations
  const maxVal = useMemo(() => {
    if (mode === 'admin') return 100;
    const maxHours = Math.max(...dayPoints.map((d) => d.workedHours), TARGET_HOURS);
    return Math.ceil(maxHours);
  }, [dayPoints, mode]);

  const yTicks = useMemo(() => {
    if (mode === 'admin') return [100, 75, 50, 25, 0];
    const top = Math.max(9, maxVal);
    return [top, Math.round((top * 2) / 3), Math.round(top / 3), 0];
  }, [mode, maxVal]);

  // Build SVG polyline points for smooth visual trend overlay
  const svgWidth = 600;
  const svgHeight = 160;
  const padX = 24;
  const padTop = 14;
  const padBottom = 10;
  const usableW = svgWidth - padX * 2;
  const usableH = svgHeight - padTop - padBottom;

  const polylineCoords = useMemo(() => {
    if (dayPoints.length === 0) return [];
    return dayPoints.map((pt, idx) => {
      const x =
        dayPoints.length === 1
          ? svgWidth / 2
          : padX + (idx / (dayPoints.length - 1)) * usableW;
      const val = mode === 'admin' ? pt.turnoutPct : pt.workedHours;
      const ratio = maxVal > 0 ? Math.min(1, val / maxVal) : 0;
      const y = padTop + usableH * (1 - ratio);
      return { x, y, pt, val };
    });
  }, [dayPoints, mode, maxVal, usableW, usableH]);

  const polylineStr = polylineCoords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPathStr =
    polylineCoords.length > 0
      ? `M ${polylineCoords[0].x.toFixed(1)},${(padTop + usableH).toFixed(1)} ` +
      polylineCoords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') +
      ` L ${polylineCoords[polylineCoords.length - 1].x.toFixed(1)},${(padTop + usableH).toFixed(1)} Z`
      : '';

  const targetY =
    mode === 'employee'
      ? padTop + usableH * (1 - Math.min(1, TARGET_HOURS / Math.max(TARGET_HOURS, maxVal)))
      : padTop;

  return (
    <div className="bg-white rounded-2xl border border-[#dee2e6] shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f8f9fa]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-[#f8f9fa] text-[#343a40] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-[#212529] tracking-tight truncate">
                {mode === 'employee' ? 'Daily Attendance Analysis' : 'Workforce Daily Attendance Graph'}
              </h3>
              <p className="text-[11px] text-[#343a40] truncate">
                {mode === 'employee'
                  ? 'Graphical breakdown of your daily worked hours & attendance consistency'
                  : 'Real-time daily attendance turnout percentage & staff presence trends'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Range Selector */}
            <div className="inline-flex rounded-[6px] border border-[#dee2e6] bg-[#f8f9fa] p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setRangeDays(7);
                  setSelectedIndex(null);
                }}
                className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${rangeDays === 7
                  ? 'bg-[#2d6a4f] text-white'
                  : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
                  }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setRangeDays(14);
                  setSelectedIndex(null);
                }}
                className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${rangeDays === 14
                  ? 'bg-[#2d6a4f] text-white'
                  : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
                  }`}
              >
                14 Days
              </button>
            </div>

            {onViewFullLog && (
              <button
                type="button"
                onClick={onViewFullLog}
                className="text-xs font-semibold text-[#2d6a4f] hover:text-[#1b4332] inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Interactive Graphical Chart */}
        <div className="bg-[#f8f9fa] border border-[#dee2e6] p-3 sm:p-4">
          <div className="flex items-stretch gap-2">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-[#6c757d] pr-1 py-2 select-none shrink-0 text-right w-8">
              {yTicks.map((t) => (
                <span key={t}>{mode === 'admin' ? `${t}%` : `${t}h`}</span>
              ))}
            </div>

            {/* Chart Plot Canvas */}
            <div className="flex-1 min-w-0">
              <div className="relative h-[170px] w-full border-b border-l border-[#ced4da]">
                {/* Horizontal Reference Gridlines */}
                {yTicks.slice(0, -1).map((t, idx) => (
                  <div
                    key={t}
                    className="absolute inset-x-0 border-t border-[#e9ecef] pointer-events-none"
                    style={{ top: `${(idx / (yTicks.length - 1)) * 100}%` }}
                  />
                ))}

                {/* Interactive Vertical Bars Layer */}
                <div className="relative z-10 flex items-end justify-between h-full px-2 sm:px-4 gap-1 sm:gap-2 pt-7">
                  {dayPoints.map((pt, idx) => {
                    const val = mode === 'admin' ? pt.turnoutPct : pt.workedHours;
                    const heightPct =
                      maxVal > 0 && val > 0 ? Math.max(6, Math.min(100, (val / maxVal) * 100)) : 0;
                    const isClicked = selectedIndex === idx;
                    const isSelected = idx === activeIdx;
                    const isAbsentOrLate = pt.status === 'Absent' || pt.status === 'Late';

                    return (
                      <button
                        key={pt.dateStr}
                        type="button"
                        onClick={() => setSelectedIndex((prev) => (prev === idx ? null : idx))}
                        className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer focus:outline-none"
                        title={`${pt.fullDateLabel} — Click to view total time`}
                      >
                        {/* Bar Column with Click-only Total Time Popover */}
                        <div className="relative w-full flex justify-center items-end flex-1">
                          {isClicked && (
                            <span
                              style={{ bottom: `calc(${Math.min(heightPct, 88)}% + 6px)` }}
                              className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#1b4332] text-white text-[10px] font-mono font-semibold whitespace-nowrap shadow-sm z-20 pointer-events-none"
                            >
                              {mode === 'admin'
                                ? `${pt.presentCount} Staff (${pt.turnoutPct}%)`
                                : `Total: ${pt.hasRecord ? pt.workedLabel : '0h'}`}
                            </span>
                          )}
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full max-w-[32px] rounded-t-[4px] transition-all duration-300 ${heightPct === 0
                              ? 'h-[3px] bg-[#dee2e6]'
                              : isClicked || isSelected
                                ? 'bg-[#1b4332] ring-2 ring-[#74c69d]'
                                : isAbsentOrLate
                                  ? 'bg-[#dc2626]'
                                  : pt.isToday
                                    ? 'bg-[#2d6a4f]'
                                    : 'bg-[#52b788] group-hover:bg-[#2d6a4f]'
                              }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* X-Axis Day Labels */}
              <div className="flex items-center justify-between px-2 sm:px-4 gap-1 sm:gap-2 mt-1.5">
                {dayPoints.map((pt, idx) => {
                  const isSelected = idx === activeIdx;
                  return (
                    <button
                      key={pt.dateStr}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`flex-1 text-center text-[10px] truncate cursor-pointer transition-colors ${isSelected
                        ? 'text-[#212529] font-semibold'
                        : pt.isToday
                          ? 'text-[#343a40] font-semibold'
                          : 'text-[#6c757d]'
                        }`}
                    >
                      {pt.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Empty Data Note (Never fabricates bars) */}
          {!summary.hasAnyData && (
            <div className="mt-3 pt-2.5 border-t border-[#e9ecef] flex items-center justify-center gap-2 text-xs text-[#343a40]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                No attendance records recorded in the last {rangeDays} days yet. Clock in to populate daily analytics.
              </span>
            </div>
          )}
        </div>

        {/* Selected Day Inspector Bar */}
        {activeDay && (
          <div className="p-3 bg-[#f8f9fa] border border-[#dee2e6] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-[#343a40] text-white flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#212529]">
                    {activeDay.isToday ? 'Today' : activeDay.weekday}, {activeDay.fullDateLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeDay.status === 'Absent' || activeDay.status === 'Late'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : activeDay.hasRecord
                        ? 'bg-[#e9ecef] text-[#212529] border border-[#ced4da]'
                        : 'bg-white text-[#343a40] border border-[#dee2e6]'
                      }`}
                  >
                    {activeDay.status}
                  </span>
                </div>

                {mode === 'employee' ? (
                  <p className="text-[11px] text-[#343a40] mt-0.5 truncate">
                    {activeDay.hasRecord
                      ? `Clock In: ${activeDay.checkIn || '—'} • Clock Out: ${activeDay.checkOut || (activeDay.isToday && liveStatus === 'working' ? 'Active' : '—')
                      }`
                      : activeDay.isWeekend
                        ? 'Scheduled weekend rest day'
                        : 'No punch recorded on this date'}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#343a40] mt-0.5">
                    {activeDay.presentCount} of {totalEmployees} staff present ({activeDay.turnoutPct}%)
                    {activeDay.lateCount > 0 ? ` • ${activeDay.lateCount} Late` : ''}
                  </p>
                )}
              </div>
            </div>

            {mode === 'employee' && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#dee2e6]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#343a40]" />
                  <span className="text-[11px] text-[#343a40] font-medium">Total Time:</span>
                  <span className="font-mono font-semibold text-[#212529]">{activeDay.workedLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#dee2e6]">
                  <Coffee className="w-3.5 h-3.5 text-[#6c757d]" />
                  <span className="font-mono text-[#343a40]">{activeDay.breakLabel}</span>
                </div>
                {activeDay.workedHours >= TARGET_HOURS && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-[#343a40]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#343a40]" />
                    9h Goal
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
