'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { api, clearApiCache } from '../lib/api';
import {
  formatSecondsToHMS,
  formatSecondsToWords,
  computeShiftClock,
  syncServerClock,
  getServerOffsetMs,
  normalizePunchType,
  parsePunchTimestamp,
  updateLocalRecordFromBackend,
  parseWorkSessionToRecord,
  performCheckIn,
  performTakeBreak,
  performResumeWork,
  performCheckOut,
  parseTimeStringToTimestamp,
  getTodayDateString,
} from '../lib/attendanceService';

export type WorkPunchStatus = 'not_started' | 'working' | 'on_break' | 'completed';

export interface WorkSessionContextType {
  status: WorkPunchStatus;
  liveWorkedHMS: string;
  liveBreakWords: string;
  liveBreakHMS: string;
  elapsedSeconds: number;
  breakSeconds: number;
  totalWorkedHMS: string;
  totalBreakHMS: string;
  totalWorkedSeconds: number;
  totalBreakSeconds: number;
  activeSession: any | null;
  currentBreak: any | null;
  lastCompletedSession: any | null;
  todaySummary: any | null;
  serverTime: string | null;
  attendanceLogic: any | null;
  punches: any[];
  actionLoading: boolean;
  initialLoading: boolean;
  punchBlockMessage: string | null;
  checkIn: (options?: { workMode?: 'Office' | 'Work From Home' | string; note?: string }) => Promise<boolean>;
  takeBreak: () => Promise<boolean>;
  resumeWork: () => Promise<boolean>;
  checkOut: (options?: { workMode?: 'Office' | 'Work From Home' | string; note?: string }) => Promise<boolean>;
  refresh: () => Promise<void>;
}

interface LiveShiftClockState {
  status: WorkPunchStatus;
  sessionStartTimeMs: number | null;
  sessionClosedBreaksSeconds: number;
  currentBreakStartTimeMs: number | null;
  sessionFrozenWorkedSeconds: number | null;
  priorSessionsWorkedSeconds: number;
  priorSessionsBreakSeconds: number;
  finalDayWorkedSeconds: number;
  finalDayBreakSeconds: number;
}

interface SegmentedSession {
  sessionIndex: number;
  startTime: string;
  endTime?: string;
  startTimeMs: number;
  endTimeMs?: number;
  workedSeconds: number;
  breakSeconds: number;
}

interface SegmentResult {
  sessions: SegmentedSession[];
  activeSession: {
    sessionIndex: number;
    startTime: string;
    startTimeMs: number;
    closedBreakSeconds: number;
    currentBreakStartTimeMs: number | null;
    isOnBreak: boolean;
  } | null;
  priorWorkedSeconds: number;
  priorBreakSeconds: number;
}

function segmentPunches(punches: any[]): SegmentResult {
  if (!Array.isArray(punches) || punches.length === 0) {
    return { sessions: [], activeSession: null, priorWorkedSeconds: 0, priorBreakSeconds: 0 };
  }

  const sorted = punches
    .map((p, idx) => {
      const type = normalizePunchType(p?.type);
      const timeMs = parsePunchTimestamp(p);
      const iso =
        p?.punchedAt ||
        p?.punchTime ||
        p?.time ||
        p?.timestamp ||
        (timeMs > 0 ? new Date(timeMs).toISOString() : new Date().toISOString());
      return { raw: p, type, timeMs, iso, originalIdx: idx };
    })
    .filter((p) => p.timeMs > 0 && p.type !== 'UNKNOWN')
    .sort((a, b) => a.timeMs - b.timeMs);

  const sessions: SegmentedSession[] = [];
  let currentStartMs: number | null = null;
  let currentStartIso: string | null = null;
  let sessionClosedBreaksMs = 0;
  let openBreakStartMs: number | null = null;
  let sessionIndex = 0;

  for (const p of sorted) {
    if (p.type === 'IN') {
      if (currentStartMs !== null) {
        if (openBreakStartMs !== null) {
          sessionClosedBreaksMs += Math.max(0, p.timeMs - openBreakStartMs);
          openBreakStartMs = null;
        }
        const gross = Math.max(0, p.timeMs - currentStartMs);
        const worked = Math.max(0, Math.floor((gross - sessionClosedBreaksMs) / 1000));
        sessions.push({
          sessionIndex,
          startTime: currentStartIso!,
          endTime: p.iso,
          startTimeMs: currentStartMs,
          endTimeMs: p.timeMs,
          workedSeconds: worked,
          breakSeconds: Math.floor(sessionClosedBreaksMs / 1000),
        });
        sessionIndex += 1;
      }
      currentStartMs = p.timeMs;
      currentStartIso = p.iso;
      sessionClosedBreaksMs = 0;
      openBreakStartMs = null;
    } else if (p.type === 'BREAK_START') {
      if (currentStartMs !== null && openBreakStartMs === null) {
        openBreakStartMs = p.timeMs;
      }
    } else if (p.type === 'BREAK_END') {
      if (currentStartMs !== null && openBreakStartMs !== null) {
        sessionClosedBreaksMs += Math.max(0, p.timeMs - openBreakStartMs);
        openBreakStartMs = null;
      }
    } else if (p.type === 'OUT') {
      if (currentStartMs !== null) {
        if (openBreakStartMs !== null) {
          sessionClosedBreaksMs += Math.max(0, p.timeMs - openBreakStartMs);
          openBreakStartMs = null;
        }
        const gross = Math.max(0, p.timeMs - currentStartMs);
        const worked = Math.max(0, Math.floor((gross - sessionClosedBreaksMs) / 1000));
        sessions.push({
          sessionIndex,
          startTime: currentStartIso!,
          endTime: p.iso,
          startTimeMs: currentStartMs,
          endTimeMs: p.timeMs,
          workedSeconds: worked,
          breakSeconds: Math.floor(sessionClosedBreaksMs / 1000),
        });
        sessionIndex += 1;
        currentStartMs = null;
        currentStartIso = null;
        sessionClosedBreaksMs = 0;
        openBreakStartMs = null;
      }
    }
  }

  const priorWorked = sessions.reduce((acc, s) => acc + s.workedSeconds, 0);
  const priorBreak = sessions.reduce((acc, s) => acc + s.breakSeconds, 0);

  let activeSession: SegmentResult['activeSession'] = null;
  if (currentStartMs !== null) {
    activeSession = {
      sessionIndex,
      startTime: currentStartIso!,
      startTimeMs: currentStartMs,
      closedBreakSeconds: Math.floor(sessionClosedBreaksMs / 1000),
      currentBreakStartTimeMs: openBreakStartMs,
      isOnBreak: openBreakStartMs !== null,
    };
  }

  return {
    sessions,
    activeSession,
    priorWorkedSeconds: priorWorked,
    priorBreakSeconds: priorBreak,
  };
}

const WorkSessionContext = createContext<WorkSessionContextType | null>(null);

export const WorkSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, portalMode, planStatus } = useAuth();
  const { showToast } = useSocket();

  const [status, setStatus] = useState<WorkPunchStatus>('not_started');
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [liveBreakHMS, setLiveBreakHMS] = useState('00:00:00');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);

  const [totalWorkedHMS, setTotalWorkedHMS] = useState('00:00:00');
  const [totalBreakHMS, setTotalBreakHMS] = useState('00:00:00');
  const [totalWorkedSeconds, setTotalWorkedSeconds] = useState(0);
  const [totalBreakSeconds, setTotalBreakSeconds] = useState(0);

  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [currentBreak, setCurrentBreak] = useState<any | null>(null);
  const [lastCompletedSession, setLastCompletedSession] = useState<any | null>(null);
  const [todaySummary, setTodaySummary] = useState<any | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [attendanceLogic, setAttendanceLogic] = useState<any | null>(null);
  const [punches, setPunches] = useState<any[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [punchBlockMessage, setPunchBlockMessage] = useState<string | null>(null);

  const statusRef = useRef<WorkPunchStatus>('not_started');
  const isFetchingRef = useRef<boolean>(false);
  const punchBlockRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const serverOffsetRef = useRef<number>(0);

  // User action timestamps to guarantee that user-triggered state transitions start at 0s
  // and do not jump due to API latency / roundtrip time
  const recentClockInAnchorMs = useRef<number | null>(null);
  const recentBreakAnchorMs = useRef<number | null>(null);
  const recentResumeAnchorMs = useRef<number | null>(null);

  const liveClockRef = useRef<LiveShiftClockState>({
    status: 'not_started',
    sessionStartTimeMs: null,
    sessionClosedBreaksSeconds: 0,
    currentBreakStartTimeMs: null,
    sessionFrozenWorkedSeconds: null,
    priorSessionsWorkedSeconds: 0,
    priorSessionsBreakSeconds: 0,
    finalDayWorkedSeconds: 0,
    finalDayBreakSeconds: 0,
  });

  userIdRef.current = user?.id;

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  /**
   * Master Clock Painter: Executes each second to render real-time UI without drift
   */
  const tick = useCallback(() => {
    const clock = liveClockRef.current;
    const offset = serverOffsetRef.current || getServerOffsetMs();
    const nowMs = Date.now() - offset;

    if (clock.status === 'working') {
      if (clock.sessionStartTimeMs) {
        const grossSecs = Math.max(0, Math.floor((nowMs - clock.sessionStartTimeMs) / 1000));
        const sessionWorked = Math.max(0, grossSecs - clock.sessionClosedBreaksSeconds);
        const sessionBreak = clock.sessionClosedBreaksSeconds;
        const totalWorked = clock.priorSessionsWorkedSeconds + sessionWorked;
        const totalBreak = clock.priorSessionsBreakSeconds + sessionBreak;

        setElapsedSeconds(sessionWorked);
        setLiveWorkedHMS(formatSecondsToHMS(sessionWorked));
        setBreakSeconds(sessionBreak);
        setLiveBreakWords(formatSecondsToWords(sessionBreak));
        setLiveBreakHMS(formatSecondsToHMS(sessionBreak));

        setTotalWorkedSeconds(totalWorked);
        setTotalWorkedHMS(formatSecondsToHMS(totalWorked));
        setTotalBreakSeconds(totalBreak);
        setTotalBreakHMS(formatSecondsToHMS(totalBreak));
      }
    } else if (clock.status === 'on_break') {
      const sessionWorked = clock.sessionFrozenWorkedSeconds ?? 0;
      const currentBreakExtra = clock.currentBreakStartTimeMs
        ? Math.max(0, Math.floor((nowMs - clock.currentBreakStartTimeMs) / 1000))
        : 0;
      const sessionBreak = clock.sessionClosedBreaksSeconds + currentBreakExtra;
      const totalWorked = clock.priorSessionsWorkedSeconds + sessionWorked;
      const totalBreak = clock.priorSessionsBreakSeconds + sessionBreak;

      // Work timer stays completely frozen during break
      setElapsedSeconds(sessionWorked);
      setLiveWorkedHMS(formatSecondsToHMS(sessionWorked));
      setBreakSeconds(sessionBreak);
      setLiveBreakWords(formatSecondsToWords(sessionBreak));
      setLiveBreakHMS(formatSecondsToHMS(sessionBreak));

      setTotalWorkedSeconds(totalWorked);
      setTotalWorkedHMS(formatSecondsToHMS(totalWorked));
      setTotalBreakSeconds(totalBreak);
      setTotalBreakHMS(formatSecondsToHMS(totalBreak));
    } else if (clock.status === 'completed') {
      const totalWorked = clock.finalDayWorkedSeconds;
      const totalBreak = clock.finalDayBreakSeconds;

      // When shift is completed, the live session timer resets cleanly to 00:00:00
      setElapsedSeconds(0);
      setLiveWorkedHMS('00:00:00');
      setBreakSeconds(0);
      setLiveBreakWords('0s');
      setLiveBreakHMS('00:00:00');

      setTotalWorkedSeconds(totalWorked);
      setTotalWorkedHMS(formatSecondsToHMS(totalWorked));
      setTotalBreakSeconds(totalBreak);
      setTotalBreakHMS(formatSecondsToHMS(totalBreak));
    } else {
      // not_started
      setElapsedSeconds(0);
      setLiveWorkedHMS('00:00:00');
      setBreakSeconds(0);
      setLiveBreakWords('0s');
      setLiveBreakHMS('00:00:00');
      setTotalWorkedSeconds(0);
      setTotalWorkedHMS('00:00:00');
      setTotalBreakSeconds(0);
      setTotalBreakHMS('00:00:00');
    }
  }, []);

  /**
   * Apply authoritative backend attendance logic and punch history
   */
  const applyAttendanceLogic = useCallback((data: any) => {
    const logic = data?.logic;
    if (!logic) return;

    const reason = logic.blocked ? String(logic.blockedReason || 'Clock in is not allowed today.') : null;
    punchBlockRef.current = reason;
    setPunchBlockMessage(reason);

    const punchesList = Array.isArray(data.punches)
      ? data.punches
      : Array.isArray(data.data?.punches)
      ? data.data.punches
      : [];
    setPunches(punchesList);
    setAttendanceLogic(data);

    const serverNowStr = data?.serverNow || data?.serverTime;
    if (serverNowStr) {
      syncServerClock(serverNowStr);
      setServerTime(serverNowStr);
    }
    const offset = getServerOffsetMs();
    serverOffsetRef.current = offset;
    const nowMs = Date.now() - offset;

    const segmented = segmentPunches(punchesList);

    const onBreak = Boolean(logic.onBreak || logic.next === 'break-end' || segmented.activeSession?.isOnBreak);
    const hasClosedSession =
      segmented.sessions.length > 0 ||
      punchesList.some((p: any) => normalizePunchType(p?.type) === 'OUT');
    let resolved: WorkPunchStatus = 'not_started';

    if (onBreak) {
      resolved = 'on_break';
    } else if (logic.next === 'check-out' || logic.next === 'clock-out' || segmented.activeSession) {
      resolved = 'working';
    } else if (hasClosedSession) {
      resolved = 'completed';
    } else {
      resolved = 'not_started';
    }

    setStatus(resolved);
    statusRef.current = resolved;

    const backendTotalWorkedSecs = Number(logic.totalMinutes || 0) * 60;
    const backendTotalBreakSecs = Number(logic.breakMinutes || 0) * 60;
    const priorWorkedSecs = segmented.priorWorkedSeconds;
    const priorBreakSecs = segmented.priorBreakSeconds;

    if (resolved === 'working') {
      let startMs =
        segmented.activeSession?.startTimeMs ||
        (data.attendance?.checkInAt ? parsePunchTimestamp(data.attendance.checkInAt) : nowMs);

      // If user clocked in recently within this browser session (< 45s), anchor startMs to the user's action
      // so the work timer begins strictly from 00:00:00 and ticks smoothly up, without jumping by API latency!
      if (recentClockInAnchorMs.current && Date.now() - recentClockInAnchorMs.current < 45000) {
        startMs = recentClockInAnchorMs.current - offset;
      }

      let closedBreaks = segmented.activeSession?.closedBreakSeconds || 0;
      if (recentResumeAnchorMs.current && Date.now() - recentResumeAnchorMs.current < 45000) {
        closedBreaks = Math.max(closedBreaks, liveClockRef.current.sessionClosedBreaksSeconds);
      }

      liveClockRef.current = {
        status: 'working',
        sessionStartTimeMs: startMs,
        sessionClosedBreaksSeconds: closedBreaks,
        currentBreakStartTimeMs: null,
        sessionFrozenWorkedSeconds: null,
        priorSessionsWorkedSeconds: priorWorkedSecs,
        priorSessionsBreakSeconds: priorBreakSecs,
        finalDayWorkedSeconds: 0,
        finalDayBreakSeconds: 0,
      };
    } else if (resolved === 'on_break') {
      const startMs = segmented.activeSession?.startTimeMs || nowMs;
      const closedBreaks = segmented.activeSession?.closedBreakSeconds || 0;
      let brkStartMs = segmented.activeSession?.currentBreakStartTimeMs || nowMs;
      let frozenWorked = Math.max(0, Math.floor((brkStartMs - startMs) / 1000) - closedBreaks);

      if (recentBreakAnchorMs.current && Date.now() - recentBreakAnchorMs.current < 45000) {
        brkStartMs = recentBreakAnchorMs.current - offset;
        if (liveClockRef.current.sessionFrozenWorkedSeconds !== null) {
          frozenWorked = liveClockRef.current.sessionFrozenWorkedSeconds;
        }
      }

      liveClockRef.current = {
        status: 'on_break',
        sessionStartTimeMs: startMs,
        sessionClosedBreaksSeconds: closedBreaks,
        currentBreakStartTimeMs: brkStartMs,
        sessionFrozenWorkedSeconds: frozenWorked,
        priorSessionsWorkedSeconds: priorWorkedSecs,
        priorSessionsBreakSeconds: priorBreakSecs,
        finalDayWorkedSeconds: 0,
        finalDayBreakSeconds: 0,
      };
    } else if (resolved === 'completed') {
      const finalWorked = Math.max(backendTotalWorkedSecs, priorWorkedSecs);
      const finalBreak = Math.max(backendTotalBreakSecs, priorBreakSecs);

      liveClockRef.current = {
        status: 'completed',
        sessionStartTimeMs: null,
        sessionClosedBreaksSeconds: 0,
        currentBreakStartTimeMs: null,
        sessionFrozenWorkedSeconds: null,
        priorSessionsWorkedSeconds: finalWorked,
        priorSessionsBreakSeconds: finalBreak,
        finalDayWorkedSeconds: finalWorked,
        finalDayBreakSeconds: finalBreak,
      };

      setElapsedSeconds(0);
      setLiveWorkedHMS('00:00:00');
      setBreakSeconds(0);
      setLiveBreakWords('0s');
      setLiveBreakHMS('00:00:00');
      setTotalWorkedSeconds(finalWorked);
      setTotalWorkedHMS(formatSecondsToHMS(finalWorked));
      setTotalBreakSeconds(finalBreak);
      setTotalBreakHMS(formatSecondsToHMS(finalBreak));
    } else {
      liveClockRef.current = {
        status: 'not_started',
        sessionStartTimeMs: null,
        sessionClosedBreaksSeconds: 0,
        currentBreakStartTimeMs: null,
        sessionFrozenWorkedSeconds: null,
        priorSessionsWorkedSeconds: 0,
        priorSessionsBreakSeconds: 0,
        finalDayWorkedSeconds: 0,
        finalDayBreakSeconds: 0,
      };
    }

    tick();

    if (resolved === 'working' || resolved === 'on_break') {
      const activeStartIso =
        segmented.activeSession?.startTime || data.attendance?.checkInAt || new Date(nowMs).toISOString();
      setActiveSession({
        status: onBreak ? 'ON_BREAK' : 'WORKING',
        startTime: activeStartIso,
        isOnBreak: onBreak,
        sessionIndex: segmented.activeSession?.sessionIndex ?? segmented.sessions.length,
      });
      setCurrentBreak(
        onBreak
          ? {
              startTime: segmented.activeSession?.currentBreakStartTimeMs
                ? new Date(segmented.activeSession.currentBreakStartTimeMs).toISOString()
                : new Date(nowMs).toISOString(),
            }
          : null
      );
    } else {
      setActiveSession(null);
      setCurrentBreak(null);
    }

    const lastClosed = segmented.sessions.length > 0 ? segmented.sessions[segmented.sessions.length - 1] : null;
    const firstInPunch = punchesList.find((p: any) => normalizePunchType(p?.type) === 'IN');
    const lastOutPunch = punchesList.slice().reverse().find((p: any) => normalizePunchType(p?.type) === 'OUT');
    const fallbackStart = firstInPunch?.punchedAt || data.attendance?.checkInAt || null;
    const fallbackEnd = lastOutPunch?.punchedAt || data.attendance?.checkOutAt || null;

    setLastCompletedSession(
      resolved === 'completed'
        ? {
            startTime: lastClosed?.startTime || fallbackStart,
            endTime: lastClosed?.endTime || fallbackEnd,
            durationSeconds: lastClosed?.workedSeconds || backendTotalWorkedSecs,
            totalBreakSeconds: lastClosed?.breakSeconds || backendTotalBreakSecs,
          }
        : null
    );

    const totalSessionsCount = segmented.sessions.length + (resolved === 'working' || resolved === 'on_break' ? 1 : 0);
    const finalSummaryWorked = resolved === 'completed' ? Math.max(backendTotalWorkedSecs, priorWorkedSecs) : priorWorkedSecs;
    const finalSummaryBreak = resolved === 'completed' ? Math.max(backendTotalBreakSecs, priorBreakSecs) : priorBreakSecs;

    const parseColonToSeconds = (str?: string | null): number => {
      if (!str || typeof str !== 'string') return 0;
      const parts = str.trim().split(':').map(Number);
      if (parts.some((n) => isNaN(n))) return 0;
      if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return 0;
    };

    const resolvedWorkedSecs =
      finalSummaryWorked > 0 ? finalSummaryWorked : parseColonToSeconds(logic.totalHours);
    const resolvedBreakSecs =
      finalSummaryBreak > 0 ? finalSummaryBreak : parseColonToSeconds(logic.breakHours);

    setTodaySummary({
      totalSecondsWorked: resolvedWorkedSecs,
      totalBreakSecondsToday: resolvedBreakSecs,
      totalDurationFormatted: formatSecondsToWords(resolvedWorkedSecs),
      totalBreakFormatted: formatSecondsToWords(resolvedBreakSecs),
      totalSessionsToday: Math.max(
        totalSessionsCount,
        punchesList.filter((p: any) => normalizePunchType(p?.type) === 'IN').length
      ),
    });
    tick();
  }, [tick]);

  /**
   * Authoritative backend status synchronizer
   */
  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    const role = String(user?.role || '').toUpperCase();
    if ((role === 'SUPER_ADMIN' && !(user as any)?.companyId) || (role !== 'SUPER_ADMIN' && (!planStatus.checked || !planStatus.premium))) {
      setInitialLoading(false);
      return;
    }
    isFetchingRef.current = true;
    try {
      const data: any = await api.getAttendanceLogic();
      if (data?.logic) {
        applyAttendanceLogic(data);
        return;
      }
      punchBlockRef.current = null;
      setPunchBlockMessage(null);
    } catch (err) {
      console.warn('[WorkSessionContext] Error fetching work status:', err);
    } finally {
      isFetchingRef.current = false;
      setInitialLoading(false);
    }
  }, [applyAttendanceLogic, user, planStatus.checked, planStatus.premium]);

  // Initial fetch on mount & listen to cross-component punch events
  useEffect(() => {
    const role = String(user?.role || '').toUpperCase();
    if (!isAuthenticated || (role !== 'SUPER_ADMIN' && (!planStatus.checked || !planStatus.premium))) return;
    refresh();

    const handleExternalUpdate = () => {
      refresh();
    };

    window.addEventListener('hrms_work_status_updated', handleExternalUpdate);
    const handleTick = (event: Event) => {
      const serverNow = (event as CustomEvent).detail?.serverNow;
      if (!serverNow) return;
      syncServerClock(serverNow);
      setServerTime(serverNow);
    };
    const handleLive = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.logic) return;
      if (detail.employeeId && userIdRef.current && detail.employeeId !== userIdRef.current) return;
      if (detail.serverNow) syncServerClock(detail.serverNow);
      applyAttendanceLogic(detail);
    };
    window.addEventListener('hrms_attendance_live', handleLive);
    window.addEventListener('hrms_attendance_tick', handleTick);
    return () => {
      window.removeEventListener('hrms_work_status_updated', handleExternalUpdate);
      window.removeEventListener('hrms_attendance_live', handleLive);
      window.removeEventListener('hrms_attendance_tick', handleTick);
    };
  }, [isAuthenticated, refresh, applyAttendanceLogic]);

  // Master 1-second live chronometer tick
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [tick]);

  /**
   * Action 1: Check In (Start Work / Clock In Again)
   */
  const checkIn = useCallback(
    async (options?: { workMode?: 'Office' | 'Work From Home' | string; note?: string }): Promise<boolean> => {
      if (statusRef.current === 'completed') {
        showToast({
          title: 'Clock in closed',
          message: 'Clock in is allowed only once today.',
          type: 'warning',
        });
        return false;
      }
      const roleUpper = String(user?.role || '').toUpperCase();
      const requiresFaceOrGeo =
        planStatus.features.includes('face_selfie') ||
        (roleUpper === 'EMPLOYEE' && planStatus.features.includes('geofence'));
      if (requiresFaceOrGeo && ['EMPLOYEE', 'HR', 'MANAGER'].includes(roleUpper)) {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('hrms_open_clock_modal'));
        return false;
      }
      setActionLoading(true);
      try {
        if (punchBlockRef.current) {
          showToast({
            title: 'Clock closed',
            message: punchBlockRef.current,
            type: 'warning',
          });
          return false;
        }

        clearApiCache('/attendance');

        const offset = getServerOffsetMs();
        serverOffsetRef.current = offset;
        const nowMs = Date.now() - offset;

        // Cumulative totals preserved from previous sessions
        const priorWorked =
          liveClockRef.current.status === 'completed'
            ? liveClockRef.current.finalDayWorkedSeconds
            : liveClockRef.current.priorSessionsWorkedSeconds;
        const priorBreak =
          liveClockRef.current.status === 'completed'
            ? liveClockRef.current.finalDayBreakSeconds
            : liveClockRef.current.priorSessionsBreakSeconds;

        // Immediate optimistic UI update: Session work timer starts clean at 00:00:00!
        recentClockInAnchorMs.current = Date.now();
        recentBreakAnchorMs.current = null;
        recentResumeAnchorMs.current = null;

        liveClockRef.current = {
          status: 'working',
          sessionStartTimeMs: nowMs,
          sessionClosedBreaksSeconds: 0,
          currentBreakStartTimeMs: null,
          sessionFrozenWorkedSeconds: null,
          priorSessionsWorkedSeconds: priorWorked,
          priorSessionsBreakSeconds: priorBreak,
          finalDayWorkedSeconds: 0,
          finalDayBreakSeconds: 0,
        };

        setStatus('working');
        statusRef.current = 'working';
        setActiveSession({
          status: 'WORKING',
          startTime: new Date(nowMs).toISOString(),
          isOnBreak: false,
          sessionIndex: 0,
        });
        setElapsedSeconds(0);
        setLiveWorkedHMS('00:00:00');
        setBreakSeconds(0);
        setLiveBreakHMS('00:00:00');
        setLiveBreakWords('0s');
        tick();

        const res = await api.clockIn({
          workMode: options?.workMode || 'Office',
          note: options?.note ?? 'Work shift start',
        });

        clearApiCache('/attendance');

        await refresh();

        const empId = user?.employeeId || user?.id || '';
        if (empId) {
          performCheckIn({
            id: empId,
            firstName: user?.firstName || 'Employee',
            lastName: user?.lastName || '',
            employeeCode: (user as any)?.employeeCode || '',
            departmentName: (user as any)?.departmentName || 'General Staff',
            companyId: user?.companyId,
            remarks: options?.note || 'Work shift start',
          });
        }

        window.dispatchEvent(new CustomEvent('hrms_work_status_updated'));
        window.dispatchEvent(new CustomEvent('hrms_attendance_updated'));

        showToast({
          title: 'Shift Started',
          message: res?.message || 'Clock-in successful. Your work timer is now running!',
          type: 'success',
        });
        return true;
      } catch (err: any) {
        recentClockInAnchorMs.current = null;
        const message = String(err?.message || '');
        if (/already clocked in/i.test(message)) {
          await refresh();
          showToast({
            title: 'Shift Already Running',
            message: 'You are already clocked in. Clock out when the shift ends.',
            type: 'info',
          });
          return true;
        }
        const isLeaveBlocked = /leave/i.test(message);
        console.warn('[WorkSessionContext] Check-in notice:', message);
        showToast({
          title: isLeaveBlocked ? 'Approved Leave Active' : 'Clock-In Notice',
          message: message || 'Could not start shift. Please try again.',
          type: isLeaveBlocked ? 'warning' : 'error',
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [user, refresh, showToast, tick]
  );

  /**
   * Action 2: Take Break
   */
  const takeBreak = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      clearApiCache('/attendance');

      const offset = getServerOffsetMs();
      serverOffsetRef.current = offset;
      const nowMs = Date.now() - offset;

      const clock = liveClockRef.current;
      let frozenWorked = 0;
      if (clock.sessionStartTimeMs) {
        const gross = Math.max(0, Math.floor((nowMs - clock.sessionStartTimeMs) / 1000));
        frozenWorked = Math.max(0, gross - clock.sessionClosedBreaksSeconds);
      }

      recentBreakAnchorMs.current = Date.now();
      recentResumeAnchorMs.current = null;

      liveClockRef.current = {
        ...clock,
        status: 'on_break',
        currentBreakStartTimeMs: nowMs,
        sessionFrozenWorkedSeconds: frozenWorked,
      };

      setStatus('on_break');
      statusRef.current = 'on_break';
      setElapsedSeconds(frozenWorked);
      setLiveWorkedHMS(formatSecondsToHMS(frozenWorked));
      setBreakSeconds(clock.sessionClosedBreaksSeconds);
      setLiveBreakHMS('00:00:00');
      setLiveBreakWords('0s');
      tick();

      const res = await api.startBreak({});
      clearApiCache('/attendance');

      await refresh();

      const empId = user?.employeeId || user?.id || '';
      if (empId) {
        performTakeBreak(empId);
      }

      window.dispatchEvent(new CustomEvent('hrms_work_status_updated'));
      window.dispatchEvent(new CustomEvent('hrms_attendance_updated'));

      showToast({
        title: 'Break Started',
        message: res?.message || 'Work timer paused! Enjoy your break.',
        type: 'info',
      });
      return true;
    } catch (err: any) {
      recentBreakAnchorMs.current = null;
      const message = String(err?.message || '');
      console.warn('[WorkSessionContext] Take break notice:', message);
      showToast({
        title: 'Break Failed',
        message: message || 'Could not start break. Please try again.',
        type: 'error',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, refresh, showToast, tick]);

  /**
   * Action 3: Resume Work
   */
  const resumeWork = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      clearApiCache('/attendance');

      const offset = getServerOffsetMs();
      serverOffsetRef.current = offset;
      const nowMs = Date.now() - offset;

      const clock = liveClockRef.current;
      const extraBreak = clock.currentBreakStartTimeMs
        ? Math.max(0, Math.floor((nowMs - clock.currentBreakStartTimeMs) / 1000))
        : 0;

      recentResumeAnchorMs.current = Date.now();
      recentBreakAnchorMs.current = null;

      liveClockRef.current = {
        ...clock,
        status: 'working',
        sessionClosedBreaksSeconds: clock.sessionClosedBreaksSeconds + extraBreak,
        currentBreakStartTimeMs: null,
        sessionFrozenWorkedSeconds: null,
      };

      setStatus('working');
      statusRef.current = 'working';
      tick();

      const res = await api.resumeBreak({});
      clearApiCache('/attendance');

      await refresh();

      const empId = user?.employeeId || user?.id || '';
      if (empId) {
        performResumeWork(empId);
      }

      window.dispatchEvent(new CustomEvent('hrms_work_status_updated'));
      window.dispatchEvent(new CustomEvent('hrms_attendance_updated'));

      showToast({
        title: 'Work Resumed',
        message: res?.message || 'Welcome back! Work timer is running.',
        type: 'success',
      });
      return true;
    } catch (err: any) {
      recentResumeAnchorMs.current = null;
      const message = String(err?.message || '');
      console.warn('[WorkSessionContext] Resume work notice:', message);
      showToast({
        title: 'Resume Failed',
        message: message || 'Could not resume work. Please try again.',
        type: 'error',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, refresh, showToast, tick]);

  /**
   * Action 4: Check Out (End Day)
   */
  const checkOut = useCallback(
    async (options?: { workMode?: 'Office' | 'Work From Home' | string; note?: string }): Promise<boolean> => {
      const roleUpper = String(user?.role || '').toUpperCase();
      const requiresFaceOrGeo =
        planStatus.features.includes('face_selfie') ||
        (roleUpper === 'EMPLOYEE' && planStatus.features.includes('geofence'));
      if (requiresFaceOrGeo && ['EMPLOYEE', 'HR', 'MANAGER'].includes(roleUpper)) {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('hrms_open_clock_modal'));
        return false;
      }
      if (statusRef.current === 'on_break') {
        showToast({
          title: 'Clock-Out Blocked',
          message: 'Cannot clock out while break is active. Please click "Resume Work" first.',
          type: 'warning',
        });
        return false;
      }
      setActionLoading(true);
      try {
        clearApiCache('/attendance');

        const offset = getServerOffsetMs();
        serverOffsetRef.current = offset;
        const nowMs = Date.now() - offset;

        const clock = liveClockRef.current;
        let finalSessionWorked = 0;
        if (clock.sessionStartTimeMs) {
          const gross = Math.max(0, Math.floor((nowMs - clock.sessionStartTimeMs) / 1000));
          finalSessionWorked = Math.max(0, gross - clock.sessionClosedBreaksSeconds);
        }
        const finalDayWorked = clock.priorSessionsWorkedSeconds + finalSessionWorked;
        const finalDayBreak = clock.priorSessionsBreakSeconds + clock.sessionClosedBreaksSeconds;

        recentClockInAnchorMs.current = null;
        recentBreakAnchorMs.current = null;
        recentResumeAnchorMs.current = null;

        liveClockRef.current = {
          status: 'completed',
          sessionStartTimeMs: null,
          sessionClosedBreaksSeconds: 0,
          currentBreakStartTimeMs: null,
          sessionFrozenWorkedSeconds: null,
          priorSessionsWorkedSeconds: finalDayWorked,
          priorSessionsBreakSeconds: finalDayBreak,
          finalDayWorkedSeconds: finalDayWorked,
          finalDayBreakSeconds: finalDayBreak,
        };

        setStatus('completed');
        statusRef.current = 'completed';

        // Explicitly reset the live session timer to 00:00:00
        setElapsedSeconds(0);
        setLiveWorkedHMS('00:00:00');
        setBreakSeconds(0);
        setLiveBreakHMS('00:00:00');
        setLiveBreakWords('0s');
        setTotalWorkedSeconds(finalDayWorked);
        setTotalWorkedHMS(formatSecondsToHMS(finalDayWorked));
        setTotalBreakSeconds(finalDayBreak);
        setTotalBreakHMS(formatSecondsToHMS(finalDayBreak));
        tick();

        const res = await api.clockOut({
          workMode: options?.workMode || 'Office',
          note: options?.note ?? '',
        });

        clearApiCache('/attendance');

        await refresh();

        const empId = user?.employeeId || user?.id || '';
        if (empId) {
          performCheckOut(empId, { remarks: options?.note || 'Shift clock-out' });
        }

        window.dispatchEvent(new CustomEvent('hrms_work_status_updated'));
        window.dispatchEvent(new CustomEvent('hrms_attendance_updated'));

        showToast({
          title: 'Shift Completed',
          message: res?.message || 'Clock out saved.',
          type: 'success',
        });
        return true;
      } catch (err: any) {
        recentClockInAnchorMs.current = null;
        const message = String(err?.message || '');
        console.warn('[WorkSessionContext] Check out notice:', message);
        showToast({
          title: 'Clock-Out Failed',
          message: message || 'Could not complete shift. Please try again.',
          type: 'error',
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [user, refresh, showToast, tick]
  );

  return (
    <WorkSessionContext.Provider
      value={{
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
        currentBreak,
        lastCompletedSession,
        todaySummary,
        serverTime,
        attendanceLogic,
        punches,
        actionLoading,
        initialLoading,
        punchBlockMessage,
        checkIn,
        takeBreak,
        resumeWork,
        checkOut,
        refresh,
      }}
    >
      {children}
    </WorkSessionContext.Provider>
  );
};

export const useWorkSession = (): WorkSessionContextType => {
  const context = useContext(WorkSessionContext);
  if (!context) {
    throw new Error('useWorkSession must be used within a WorkSessionProvider');
  }
  return context;
};
