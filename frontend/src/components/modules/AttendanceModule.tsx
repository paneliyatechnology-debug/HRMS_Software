'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  Filter,
  Cpu,
  RefreshCw,
  Wifi,
  Radio,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

interface AttendanceModuleProps {
  records: AttendanceRecord[];
  employees: Employee[];
  onOpenPunchModal: () => void;
  onRefresh: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  records,
  employees,
  onOpenPunchModal,
  onRefresh,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-19');
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useSocket();

  const handleBiometricSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate hardware logs from physical ZKTeco terminal
      const hardwareLogs = [
        {
          deviceId: 'ZKT-SF5-HQ',
          employeeCode: 'EMP001',
          punchTime: `${new Date().toISOString().split('T')[0]}T09:04:12Z`,
          type: 'IN' as const,
        },
        {
          deviceId: 'ZKT-SF5-HQ',
          employeeCode: 'EMP002',
          punchTime: `${new Date().toISOString().split('T')[0]}T09:11:45Z`,
          type: 'IN' as const,
        },
        {
          deviceId: 'ZKT-SF5-HQ',
          employeeCode: 'EMP003',
          punchTime: `${new Date().toISOString().split('T')[0]}T09:28:10Z`,
          type: 'IN' as const,
        },
      ];

      const res = await api.syncBiometricAttendance(hardwareLogs);
      onRefresh();

      showToast({
        title: 'Biometric Machine Synced',
        message: `Synced ${res.syncedRecords || 3} hardware punch records from ZKTeco biometric turnstile.`,
        type: 'success',
        module: 'attendance',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to sync biometric hardware');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Attendance & Shift Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Biometric Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric punch tracking, working duration, overtime, and monthly attendance calendar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBiometricSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs shadow-xs border border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Terminals...' : 'Sync Biometric Hardware'}
          </button>

          <button
            onClick={onOpenPunchModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition"
          >
            <Clock className="w-4 h-4" /> Punch Check In / Out
          </button>
        </div>
      </div>

      {/* Hardware Terminal Status Widget */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">ZKTeco SpeedFace-V5L Turnstile [HQ Gate 1 & 2]</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Online • Ping 14ms
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocol: TCP/IP Webhook • IP: 192.168.1.240 • Firmware: v4.2.1-Enterprise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Today's Hardware Punches</span>
            <span className="text-sm font-bold text-white">18 Recorded</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Sync</span>
            <span className="text-sm font-bold text-emerald-400">Just Now</span>
          </div>
        </div>
      </div>

      {/* Attendance Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Present Today</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">20 Employees</p>
          <span className="text-[11px] text-emerald-600 font-bold">95% of active shifts</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Late Arrivals</span>
          <p className="text-2xl font-black text-amber-500 mt-1">2 Employees</p>
          <span className="text-[11px] text-slate-400">Past 09:30 AM grace period</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">On Leave Today</span>
          <p className="text-2xl font-black text-blue-600 mt-1">1 Employee</p>
          <span className="text-[11px] text-slate-400">Approved Sick Leave</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Avg Working Hours</span>
          <p className="text-2xl font-black text-purple-600 mt-1">8.4 Hours</p>
          <span className="text-[11px] text-slate-400">Target: 8.0 hrs/day</span>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" /> Daily Attendance Logs
          </h3>

          <div className="flex items-center gap-3 text-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks / Device Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {rec.employeeName || 'Employee'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{rec.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {rec.checkIn || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {rec.checkOut || 'In Progress'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">
                    {rec.workingHours ? `${rec.workingHours} hrs` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        rec.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-600'
                          : rec.status === 'Late'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium">
                    {rec.remarks || 'Standard Shift'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
