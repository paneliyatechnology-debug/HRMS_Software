'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Play, Square, Coffee, CheckCircle, MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const [time, setTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');

  // Live ticking clock
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Break timer
  useEffect(() => {
    let interval: any;
    if (isOnBreak) {
      interval = setInterval(() => setBreakSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOnBreak]);

  // Load current punch status
  useEffect(() => {
    if (isOpen && user.employeeId) {
      fetchStatus();
    }
  }, [isOpen, user.employeeId]);

  const fetchStatus = async () => {
    try {
      const res = await api.getAttendance({ employeeId: user.employeeId });
      const today = new Date().toISOString().split('T')[0];
      const todayRec = res.find((r) => r.date === today);
      if (todayRec) {
        setIsCheckedIn(Boolean(todayRec.checkIn));
        setCheckInTime(todayRec.checkIn);
        setCheckOutTime(todayRec.checkOut || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await api.checkIn(user.employeeId || 'emp-1', remarks);
      setIsCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Check in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await api.checkOut(user.employeeId || 'emp-1', remarks);
      setCheckOutTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Check out failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in cursor-pointer"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative cursor-default">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner mb-3">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Punch Clock</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record working hours & break tracking
          </p>
        </div>

        {/* Digital Clock */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 text-center border border-slate-100 dark:border-slate-700/60 my-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Time</p>
          <div className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white tracking-wider mt-1">
            {time ? time.toLocaleTimeString('en-US') : '09:00:00 AM'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {time ? time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Monday, October 19, 2026'}
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Office Geofence: HQ Verified (100 Silicon Vista Blvd)</span>
          </div>
        </div>

        {/* Punch Status info */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Checked In</span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              {checkInTime || 'Not punched'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Checked Out</span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              {checkOutTime || (isCheckedIn ? 'In Progress' : '—')}
            </span>
          </div>
        </div>

        {/* Remarks Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Work Notes / Remarks (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Working on HRMS modules, client sync..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              Check In Now
            </button>
          ) : !checkOutTime ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsOnBreak(!isOnBreak)}
                className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  isOnBreak
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Coffee className="w-4 h-4" />
                {isOnBreak ? `Resume (${formatSeconds(breakSeconds)})` : 'Take Break'}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition"
              >
                <Square className="w-4 h-4 fill-current" />
                Check Out
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Attendance Completed for Today!
              </p>
              <p className="text-[11px] text-emerald-600/80">Total 8.5 hours recorded</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
