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
import { api } from '../lib/api';
import {
  formatSecondsToHMS,
  formatSecondsToWords,
  computeShiftClock,
  syncServerClock,
  updateLocalRecordFromBackend,
  parseWorkSessionToRecord,
  performCheckIn,
  performTakeBreak,
  performResumeWork,
  performCheckOut,
} from '../lib/attendanceService';

export type WorkPunchStatus = 'not_started' | 'working' | 'on_break' | 'completed';

export interface WorkSessionContextType {
  status: WorkPunchStatus;
  liveWorkedHMS: string;
  liveBreakWords: string;
  liveBreakHMS: string;
  elapsedSeconds: number;
  breakSeconds: number;
  activeSession: any | null;
  currentBreak: any | null;
  lastCompletedSession: any | null;
  todaySummary: any | null;
  serverTime: string | null;
  actionLoading: boolean;
  initialLoading: boolean;
  checkIn: () => Promise<boolean>;
  takeBreak: () => Promise<boolean>;
  resumeWork: () => Promise<boolean>;
  checkOut: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const WorkSessionContext = createContext<WorkSessionContextType | null>(null);

export const WorkSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, portalMode } = useAuth();
  const { showToast } = useSocket();

  const [status, setStatus] = useState<WorkPunchStatus>('not_started');
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [liveBreakHMS, setLiveBreakHMS] = useState('00:00:00');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [currentBreak, setCurrentBreak] = useState<any | null>(null);
  const [lastCompletedSession, setLastCompletedSession] = useState<any | null>(null);
  const [todaySummary, setTodaySummary] = useState<any | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Precision anchor refs so timers never drift or jump during re-renders or backgrounding
  const statusRef = useRef<WorkPunchStatus>('not_started');
  const baseWorkedRef = useRef<number>(0);
  const baseBreakRef = useRef<number>(0);
  const anchorTimeRef = useRef<number>(Date.now());
  const clockRef = useRef<any>(null);
  const isFetchingRef = useRef<boolean>(false);

  const publishClock = (clock: any, nowMs: number = Date.now()) => {
    const live = computeShiftClock(clock, nowMs);
    if (!live) return false;
    baseWorkedRef.current = live.worked;
    baseBreakRef.current = live.breakSeconds;
    setElapsedSeconds(live.worked);
    setBreakSeconds(live.breakSeconds);
    setLiveWorkedHMS(formatSecondsToHMS(live.worked));
    setLiveBreakWords(formatSecondsToWords(live.breakSeconds));
    setLiveBreakHMS(formatSecondsToHMS(live.breakSeconds));
    return true;
  };

  // Sync ref with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  /**
   * Authoritative backend status synchronizer
   */
  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    // Admins viewing in admin portal mode do not have personal shift tracking console
    const rawRole = (user?.role || '').trim().toUpperCase();
    const isStrictAdmin = (rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'HR' || rawRole === 'HR_ADMIN' || rawRole === 'COMPANY_ADMIN') && portalMode === 'admin';
    if (isStrictAdmin) {
      setInitialLoading(false);
      return;
    }
    isFetchingRef.current = true;
    try {
      const data: any = await api.getWorkStatus();
      if (!data) return;

      setServerTime(data.serverTime || null);
      syncServerClock(data.serverTime);
      setActiveSession(data.activeSession || null);
      setCurrentBreak(data.currentBreak || null);
      setLastCompletedSession(data.lastCompletedSession || null);
      setTodaySummary(data.todaySummary || null);

      const hasActive = Boolean(
        data.hasActiveSession ||
          (data.activeSession && data.activeSession.status !== 'COMPLETED')
      );
      const isOnBrk = Boolean(
        data.isOnBreak ||
          data.activeSession?.isOnBreak ||
          data.activeSession?.status === 'ON_BREAK'
      );
      const isDone =
        !hasActive &&
        Boolean(
          data.lastCompletedSession ||
            (data.todaySummary && data.todaySummary.totalSessionsToday > 0)
        );

      let resolved: WorkPunchStatus = 'not_started';
      if (hasActive) {
        resolved = isOnBrk ? 'on_break' : 'working';
      } else if (isDone) {
        resolved = 'completed';
      } else {
        resolved = 'not_started';
      }

      setStatus(resolved);
      statusRef.current = resolved;
      anchorTimeRef.current = Date.now();
      clockRef.current = data.clock || null;
      if (data.clock && publishClock(data.clock)) {
        // Employee clock uses the same break-start timestamps as the admin list.
      } else if (resolved === 'working') {
        baseWorkedRef.current = data.activeSession?.elapsedSeconds ?? 0;
        baseBreakRef.current =
          data.totalBreakSeconds ??
          data.activeSession?.totalBreakSeconds ??
          0;
        setElapsedSeconds(baseWorkedRef.current);
        setBreakSeconds(baseBreakRef.current);
        setLiveWorkedHMS(formatSecondsToHMS(baseWorkedRef.current));
        setLiveBreakWords(formatSecondsToWords(baseBreakRef.current));
        setLiveBreakHMS(formatSecondsToHMS(baseBreakRef.current));
      } else if (resolved === 'on_break') {
        baseWorkedRef.current = data.activeSession?.elapsedSeconds ?? 0;
        baseBreakRef.current =
          data.currentBreak?.elapsedSeconds ??
          data.totalBreakSeconds ??
          data.activeSession?.totalBreakSeconds ??
          0;
        setElapsedSeconds(baseWorkedRef.current);
        setBreakSeconds(baseBreakRef.current);
        setLiveWorkedHMS(formatSecondsToHMS(baseWorkedRef.current));
        setLiveBreakWords(formatSecondsToWords(baseBreakRef.current));
        setLiveBreakHMS(formatSecondsToHMS(baseBreakRef.current));
      } else if (resolved === 'completed') {
        const finalSecs =
          data.lastCompletedSession?.durationSeconds ??
          data.todaySummary?.totalSecondsWorked ??
          0;
        const totalBrk =
          data.todaySummary?.totalBreakSecondsToday ??
          data.lastCompletedSession?.totalBreakSeconds ??
          0;
        baseWorkedRef.current = finalSecs;
        baseBreakRef.current = totalBrk;
        setElapsedSeconds(finalSecs);
        setBreakSeconds(totalBrk);
        setLiveWorkedHMS(formatSecondsToHMS(finalSecs));
        setLiveBreakWords(formatSecondsToWords(totalBrk));
        setLiveBreakHMS(formatSecondsToHMS(totalBrk));
      } else {
        baseWorkedRef.current = 0;
        baseBreakRef.current = 0;
        setElapsedSeconds(0);
        setBreakSeconds(0);
        setLiveWorkedHMS('00:00:00');
        setLiveBreakWords('0s');
        setLiveBreakHMS('00:00:00');
      }

      // Synchronize into local attendance memory for tables & history consistency
      if (data.activeSession) {
        const rec = parseWorkSessionToRecord({
          ...data.activeSession,
          todaySummary: data.todaySummary,
          formattedTotalBreak: data.formattedTotalBreak || data.todaySummary?.totalBreakFormatted,
          totalBreakSeconds: data.totalBreakSeconds ?? data.todaySummary?.totalBreakSecondsToday,
        });
        if (rec) updateLocalRecordFromBackend({ ...rec, ...(data.clock || {}) });
      } else if (data.lastCompletedSession) {
        const rec = parseWorkSessionToRecord({
          ...data.lastCompletedSession,
          todaySummary: data.todaySummary,
          formattedTotalBreak: data.todaySummary?.totalBreakFormatted || data.formattedTotalBreak,
          totalBreakSeconds: data.todaySummary?.totalBreakSecondsToday ?? data.totalBreakSeconds,
        });
        if (rec) updateLocalRecordFromBackend(rec);
      }
    } catch (err) {
      console.warn('[WorkSessionContext] Error fetching work status:', err);
    } finally {
      isFetchingRef.current = false;
      setInitialLoading(false);
    }
  }, [portalMode]);

  // Initial fetch on mount & listen to cross-component punch events
  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();

    const handleExternalUpdate = () => {
      refresh();
    };

    window.addEventListener('hrms_work_status_updated', handleExternalUpdate);
    return () => {
      window.removeEventListener('hrms_work_status_updated', handleExternalUpdate);
    };
  }, [isAuthenticated, refresh]);

  // Master 1-second live chronometer tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - anchorTimeRef.current) / 1000));

      if (clockRef.current && publishClock(clockRef.current)) {
        return;
      }

      if (statusRef.current === 'working') {
        const currentWorked = baseWorkedRef.current + diff;
        setElapsedSeconds(currentWorked);
        setLiveWorkedHMS(formatSecondsToHMS(currentWorked));
        setLiveBreakWords(formatSecondsToWords(baseBreakRef.current));
        setLiveBreakHMS(formatSecondsToHMS(baseBreakRef.current));
      } else if (statusRef.current === 'on_break') {
        const currentBreak = baseBreakRef.current + diff;
        setBreakSeconds(currentBreak);
        // Worked time remains frozen while on break
        setLiveWorkedHMS(formatSecondsToHMS(baseWorkedRef.current));
        setLiveBreakWords(formatSecondsToWords(currentBreak));
        setLiveBreakHMS(formatSecondsToHMS(currentBreak));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Action 1: Check In (Start Work)
   */
  const checkIn = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await api.startWork({});

      // Fast optimistic UI update
      setStatus('working');
      statusRef.current = 'working';
      baseWorkedRef.current = 0;
      baseBreakRef.current = 0;
      anchorTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setLiveWorkedHMS('00:00:00');
      setLiveBreakWords('0s');

      // Sync backend state
      await refresh();

      // Update local memory record for today's logs
      const empId = user?.employeeId || user?.id || '';
      if (empId) {
        performCheckIn({
          id: empId,
          firstName: user?.firstName || 'Employee',
          lastName: user?.lastName || '',
          employeeCode: (user as any)?.employeeCode || '',
          departmentName: (user as any)?.departmentName || 'General Staff',
          companyId: user?.companyId,
          remarks: 'Work shift start',
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
      console.error('[WorkSessionContext] Check-in error:', err);
      showToast({
        title: 'Clock-In Failed',
        message: err.message || 'Could not start shift. Please try again.',
        type: 'error',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, refresh, showToast]);

  /**
   * Action 2: Take Break
   */
  const takeBreak = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await api.startBreak({});

      const nowIso = new Date().toISOString();
      if (clockRef.current) {
        clockRef.current = {
          ...clockRef.current,
          isLive: true,
          isOnBreak: true,
          openBreakStartTime: nowIso,
        };
        publishClock(clockRef.current);
      }
      setStatus('on_break');
      statusRef.current = 'on_break';

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
      console.error('[WorkSessionContext] Take break error:', err);
      showToast({
        title: 'Break Failed',
        message: err.message || 'Could not start break. Please try again.',
        type: 'error',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, refresh, showToast]);

  /**
   * Action 3: Resume Work
   */
  const resumeWork = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await api.resumeBreak({});

      if (clockRef.current?.openBreakStartTime) {
        const extra = Math.max(
          0,
          Math.floor((Date.now() - new Date(clockRef.current.openBreakStartTime).getTime()) / 1000),
        );
        clockRef.current = {
          ...clockRef.current,
          isOnBreak: false,
          openBreakStartTime: null,
          completedBreakSeconds: (Number(clockRef.current.completedBreakSeconds) || 0) + extra,
          sessionClosedBreakSeconds: (Number(clockRef.current.sessionClosedBreakSeconds) || 0) + extra,
        };
        publishClock(clockRef.current);
      }
      anchorTimeRef.current = Date.now();
      setStatus('working');
      statusRef.current = 'working';

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
      console.error('[WorkSessionContext] Resume work error:', err);
      showToast({
        title: 'Resume Failed',
        message: err.message || 'Could not resume work. Please try again.',
        type: 'error',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, refresh, showToast]);

  /**
   * Action 4: Check Out (End Day)
   */
  const checkOut = useCallback(async (): Promise<boolean> => {
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
      const res = await api.stopWork({});

      setStatus('completed');
      statusRef.current = 'completed';

      await refresh();

      const empId = user?.employeeId || user?.id || '';
      if (empId) {
        performCheckOut(empId, { remarks: 'Shift clock-out' });
      }

      window.dispatchEvent(new CustomEvent('hrms_work_status_updated'));
      window.dispatchEvent(new CustomEvent('hrms_attendance_updated'));

      showToast({
        title: 'Shift Completed',
        message: res?.message || 'Clocked out successfully. Have a great day!',
        type: 'success',
      });
      return true;
    } catch (err: any) {
      console.error('[WorkSessionContext] Check out error:', err);
      showToast({
        title: 'Clock-Out Failed',
        message: err.message || 'Could not complete shift. Please try again.',
        type: 'error',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, refresh, showToast]);

  return (
    <WorkSessionContext.Provider
      value={{
        status,
        liveWorkedHMS,
        liveBreakWords,
        liveBreakHMS,
        elapsedSeconds,
        breakSeconds,
        activeSession,
        currentBreak,
        lastCompletedSession,
        todaySummary,
        serverTime,
        actionLoading,
        initialLoading,
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
