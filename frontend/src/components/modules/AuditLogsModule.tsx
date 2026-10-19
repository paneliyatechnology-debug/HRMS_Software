'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, Globe } from 'lucide-react';
import { AuditLog } from '../../types/hrms';

export const AuditLogsModule: React.FC = () => {
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const logs: AuditLog[] = [
    {
      id: 'log-1',
      userId: 'user-1',
      userName: 'John Deo',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_LOGIN',
      module: 'Authentication',
      recordId: 'user-1',
      details: 'Successful login from IP 192.168.1.100 (Chrome/macOS)',
      ipAddress: '192.168.1.100',
      createdAt: '2026-10-19T08:55:00Z',
    },
    {
      id: 'log-2',
      userId: 'user-2',
      userName: 'Sarah Jenkins',
      userRole: 'HR_ADMIN',
      action: 'LEAVE_APPROVED',
      module: 'Leave Management',
      recordId: 'lr-1',
      details: 'Approved Sick Leave for Adarson Miller (Oct 21, 2026)',
      ipAddress: '192.168.1.105',
      createdAt: '2026-10-19T09:15:00Z',
    },
    {
      id: 'log-3',
      userId: 'user-7',
      userName: 'Rachel Green',
      userRole: 'FINANCE_ADMIN',
      action: 'PAYROLL_GENERATED',
      module: 'Payroll',
      recordId: 'pr-2026-10',
      details: 'Initiated monthly payroll computation for October 2026 (21 employees)',
      ipAddress: '192.168.1.112',
      createdAt: '2026-10-19T07:00:00Z',
    },
    {
      id: 'log-4',
      userId: 'user-4',
      userName: 'Alex Mercer',
      userRole: 'MANAGER',
      action: 'ATTENDANCE_CHECKIN',
      module: 'Attendance',
      recordId: 'att-3',
      details: 'Employee punched in at 08:45 AM (Office Geofence Verified)',
      ipAddress: '192.168.1.108',
      createdAt: '2026-10-19T08:45:00Z',
    },
    {
      id: 'log-5',
      userId: 'user-2',
      userName: 'Sarah Jenkins',
      userRole: 'HR_ADMIN',
      action: 'ANNOUNCEMENT_PUBLISHED',
      module: 'Announcements',
      recordId: 'anc-2',
      details: 'Published open enrollment notification to all employees',
      ipAddress: '192.168.1.105',
      createdAt: '2026-10-17T11:00:00Z',
    },
  ];

  const filtered = logs.filter((l) => {
    const matchMod = moduleFilter === 'ALL' || l.module.toLowerCase() === moduleFilter.toLowerCase();
    const matchQ =
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    return matchMod && matchQ;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Security & Compliance Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all user logins, administrative state updates, payroll executions, and permission changes
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> SOC 2 / GDPR Compliant
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'Authentication', 'Leave Management', 'Payroll', 'Attendance'].map((m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                  moduleFilter === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition font-mono">
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                    {log.userName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold font-sans">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-blue-600 font-sans font-semibold">
                    {log.module}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-sans">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {log.ipAddress}
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
