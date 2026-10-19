'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  Cpu,
  RefreshCw,
  Radio,
  MoreVertical,
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

  const defaultMockLogs = [
    {
      id: 'att-1',
      name: 'Gregory Patton',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100',
      date: '2026-10-19',
      in: '—',
      out: 'In Progress',
      hours: '—',
      status: 'On Leave',
      source: 'Medical Leave',
    },
    {
      id: 'att-2',
      name: 'Adarson Miller',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      date: '2026-10-19',
      in: '08:50 AM',
      out: '05:50 PM',
      hours: '8.0 hrs',
      status: 'Present',
      source: 'Biometric Gate 1',
    },
    {
      id: 'att-3',
      name: 'Wes Carr',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      date: '2026-10-19',
      in: '09:40 AM',
      out: 'In Progress',
      hours: '6.2 hrs',
      status: 'Late',
      source: 'Mobile Geo-punch',
    },
    {
      id: 'att-4',
      name: 'Maci Guerra',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      date: '2026-10-19',
      in: '09:00 AM',
      out: 'In Progress',
      hours: '7.0 hrs',
      status: 'Present',
      source: 'Biometric Turnstile',
    },
    {
      id: 'att-5',
      name: 'Blake Mejia',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
      date: '2026-10-19',
      in: '09:05 AM',
      out: 'In Progress',
      hours: '6.8 hrs',
      status: 'Present',
      source: 'Web Portal',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Attendance & Shifts
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold flex items-center gap-1.5 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Biometric Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time biometric punch tracking, shift hours, and automated overtime
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleBiometricSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Hardware'}</span>
          </button>

          <button
            onClick={onOpenPunchModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Punch Check In / Out</span>
          </button>
        </div>
      </div>

      {/* 4 Attendance KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Present Today</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">20</p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold">95% on duty</span>
            <span className="text-slate-400">Target 90%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Late Arrivals</span>
          <p className="text-2xl font-bold text-amber-500 mt-2">2</p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-semibold">Past 09:30 AM</span>
            <span className="text-slate-400">Grace: 15m</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">On Leave Today</span>
          <p className="text-2xl font-bold text-blue-600 mt-2">1</p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-blue-600 font-semibold">Sick Leave</span>
            <span className="text-slate-400">Approved</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Avg Working Hours</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">8.4 hrs</p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold">+0.4 hrs</span>
            <span className="text-slate-400">Standard 8 hrs</span>
          </div>
        </div>
      </div>

      {/* Daily Attendance Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Daily Attendance Logs
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200/80 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Check In</th>
                <th className="py-2.5 px-3">Check Out</th>
                <th className="py-2.5 px-3">Working Hours</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {defaultMockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={log.avatar}
                        alt={log.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-900">{log.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{log.date}</td>
                  <td className="py-3 px-3 font-medium text-slate-700">{log.in}</td>
                  <td className="py-3 px-3 text-slate-500">{log.out}</td>
                  <td className="py-3 px-3 font-semibold text-blue-600">{log.hours}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        log.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-600'
                          : log.status === 'Late'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{log.source}</td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    <button className="p-1 hover:bg-slate-100 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
