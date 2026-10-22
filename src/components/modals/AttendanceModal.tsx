'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Play, Square, Coffee, CheckCircle, MapPin, Pause } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  checkEmployeePunchEligibility,
  performCheckIn,
  performTakeBreak,
  performResumeWork,
  performCheckOut,
  formatSecondsToHMS,
  formatSecondsToWords,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
} from '../../lib/attendanceService';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const currentEmpId = user.employeeId || user.id || '';

  const [time, setTime] = useState<Date | null>(null);
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(currentEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [loading, setLoading] = useState(false);

  // Live ticking clock and punch state
  useEffect(() => {
    if (!isOpen) return;

    const tick = () => {
      setTime(new Date());
      const eligibility = checkEmployeePunchEligibility(currentEmpId);
      setPunchState(eligibility);

      if (eligibility.record) {
        const active = getLiveActiveSeconds(eligibility.record);
        const brk = getLiveBreakSeconds(eligibility.record);
        setLiveWorkedHMS(formatSecondsToHMS(active));
        setLiveBreakWords(formatSecondsToWords(brk));
      } else {
        setLiveWorkedHMS('00:00:00');
        setLiveBreakWords('0s');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentEmpId]);

  if (!isOpen) return null;

  const handleCheckIn = () => {
    setLoading(true);
    try {
      const res = performCheckIn({
        id: currentEmpId,
        firstName: user.firstName || 'Employee',
        lastName: user.lastName || '',
        employeeCode: (user as any).employeeCode || user.employeeId || currentEmpId,
      });
      if (!res.success) {
        alert(res.message);
      } else {
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTakeBreak = () => {
    setLoading(true);
    try {
      const res = performTakeBreak(currentEmpId);
      if (!res.success) alert(res.message);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleResumeWork = () => {
    setLoading(true);
    try {
      const res = performResumeWork(currentEmpId);
      if (!res.success) alert(res.message);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = () => {
    setLoading(true);
    try {
      const res = performCheckOut(currentEmpId);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in cursor-pointer"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative cursor-default">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-1 pb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 mx-auto flex items-center justify-center mb-2.5">
            <Clock className="w-6 h-6 text-slate-700" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Attendance Punch Clock</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Live shift tracking, timer & break management
          </p>
        </div>

        {/* Digital Clock & Timer Display */}
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200/80 my-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {punchState.status === 'working'
              ? 'Active Shift Timer'
              : punchState.status === 'on_break'
              ? 'Timer Paused (On Break)'
              : punchState.status === 'completed'
              ? 'Today’s Finalized Shift'
              : 'Current Time'}
          </p>

          <div className="text-3xl font-mono font-bold text-slate-900 tracking-wider mt-1">
            {punchState.status === 'working' || punchState.status === 'on_break'
              ? liveWorkedHMS
              : punchState.status === 'completed'
              ? formatSecondsToWords(punchState.record?.activeSeconds || 0)
              : time
              ? time.toLocaleTimeString('en-US')
              : '09:00:00 AM'}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {punchState.status === 'on_break'
              ? `Break time: ${liveBreakWords}`
              : time
              ? time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : 'October 21, 2026'}
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>HQ Office Verified (Surat HQ)</span>
          </div>
        </div>

        {/* Punch Status info */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Checked In</span>
            <span className="font-semibold text-slate-800 text-sm">
              {punchState.record?.checkIn || 'Not punched'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Checked Out</span>
            <span className="font-semibold text-slate-800 text-sm">
              {punchState.record?.checkOut || (punchState.status === 'working' ? 'In Progress' : '—')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {punchState.status === 'not_started' && (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Check In Now</span>
            </button>
          )}

          {punchState.status === 'working' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTakeBreak}
                disabled={loading}
                className="py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Take Break</span>
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Check Out</span>
              </button>
            </div>
          )}

          {punchState.status === 'on_break' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleResumeWork}
                disabled={loading}
                className="py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Work</span>
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Check Out</span>
              </button>
            </div>
          )}

          {punchState.status === 'completed' && (
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-800">
                Attendance Completed for Today!
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Next check-in available tomorrow
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
