'use client';

import React, { useState, useEffect } from 'react';
import { useCompanyLive } from '../../lib/useCompanyLive';
import { ShieldCheck, Search, Filter, Clock, User, Globe, RefreshCw, X } from 'lucide-react';
import { AuditLog } from '../../types/hrms';
import { api } from '../../lib/api';

export const AuditLogsModule: React.FC = () => {
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(moduleFilter !== 'ALL' ? moduleFilter : undefined);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);
  useCompanyLive(['all'], loadLogs);

  const aq = search.trim().toLowerCase();
  const filtered = logs.filter((l) => {
    const matchesModule = moduleFilter === 'ALL' || (l.module || '').toLowerCase() === moduleFilter.toLowerCase();
    const matchesQuery =
      !aq ||
      (l.userName || '').toLowerCase().includes(aq) ||
      (l.action || '').toLowerCase().includes(aq) ||
      (l.details || '').toLowerCase().includes(aq) ||
      (l.module || '').toLowerCase().includes(aq) ||
      (l.ipAddress || '').toLowerCase().includes(aq);
    return matchesModule && matchesQuery;
  });

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> SOC 2 / GDPR Compliant
          </span>
        </div>
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
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'Authentication', 'Leave Management', 'Payroll', 'Attendance', 'Recruitment'].map((m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  moduleFilter === m
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((log) => (
            <div key={`mob-${log.id}`} className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 truncate">{log.userName}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold shrink-0">{log.userRole}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-blue-600 font-semibold">{log.module}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono font-bold text-slate-800">{log.action}</span>
              </div>
              <p className="text-slate-600 text-xs">{log.details}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>{new Date(log.createdAt).toLocaleString()}</span>
                <span>{log.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[720px] text-left text-xs">
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
                  <td className="py-3.5 px-4 text-emerald-700 font-sans font-semibold">
                    {log.module}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-sans">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {log.ipAddress || '127.0.0.1'}
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
