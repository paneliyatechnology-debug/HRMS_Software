'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Headphones,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useModalOverlay } from '../../lib/useModalOverlay';

type SupportStatus = 'New' | 'Read' | 'Closed';

interface SupportItem {
  id: string;
  kind: 'Demo' | 'Contact';
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  message: string;
  status: SupportStatus;
  createdAt?: string;
}

export const SupportModule: React.FC = () => {
  const { showToast } = useSocket();
  const [requests, setRequests] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'Demo' | 'Contact'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SupportStatus>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupportItem | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listSupportRequests({
        page: 1,
        limit: 50,
        kind: kindFilter !== 'ALL' ? kindFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRequests(list);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to load support requests',
        message: err instanceof Error ? err.message : 'Could not fetch inquiries.',
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [kindFilter, statusFilter, search, showToast]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadRequests();
    }, 200);
    return () => clearTimeout(t);
  }, [loadRequests]);

  useModalOverlay({
    isOpen: Boolean(selected),
    onClose: () => setSelected(null),
  });

  const handleStatusChange = async (item: SupportItem, nextStatus: SupportStatus) => {
    setBusyId(item.id);
    try {
      const res = await api.updateSupportRequest(item.id, { status: nextStatus });
      const updated = res?.request || res?.data || { ...item, status: nextStatus };
      setRequests((prev) => prev.map((r) => (r.id === item.id ? { ...r, ...updated, status: nextStatus } : r)));
      if (selected?.id === item.id) {
        setSelected((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      showToast({
        type: 'success',
        title: 'Status Updated',
        message: `Marked inquiry from ${item.name} as ${nextStatus}.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Could not update status.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenDetail = async (item: SupportItem) => {
    setSelected(item);
    if (item.status === 'New') {
      void handleStatusChange(item, 'Read');
    }
  };

  const newCount = requests.filter((r) => r.status === 'New').length;
  const readCount = requests.filter((r) => r.status === 'Read').length;
  const closedCount = requests.filter((r) => r.status === 'Closed').length;

  return (
    <div className="space-y-5 w-full animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </span>
            Support &amp; Demo Inquiries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming demo bookings and contact requests from prospective companies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Requests</p>
            <p className="text-xl font-black text-slate-900">{requests.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">New</p>
            <p className="text-xl font-black text-slate-900">{newCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Read</p>
            <p className="text-xl font-black text-slate-900">{readCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Closed</p>
            <p className="text-xl font-black text-slate-900">{closedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or company..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'Demo', 'Contact'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  kindFilter === k ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {k === 'ALL' ? 'All Types' : k}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'New', 'Read', 'Closed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Loading support inquiries...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">No support or demo inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Requester</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Message</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => {
                  const isBusy = busyId === item.id;
                  const badge =
                    item.status === 'New'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : item.status === 'Read'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {item.email}
                        </p>
                        {(item.companyName || item.phone) && (
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            {item.companyName && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" /> {item.companyName}
                              </span>
                            )}
                            {item.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> {item.phone}
                              </span>
                            )}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.kind}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 line-clamp-2">{item.message}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleOpenDetail(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {item.status !== 'Closed' ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(item, 'Closed')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Close
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(item, 'New')}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" /> Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selected.kind} Request · {selected.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">{selected.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Email</span>
                <span className="font-semibold text-slate-800">{selected.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone</span>
                <span className="font-semibold text-slate-800">{selected.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Company</span>
                <span className="font-semibold text-slate-800">{selected.companyName || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Submitted</span>
                <span className="font-semibold text-slate-800">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Message</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-2xl border border-slate-200">
                {selected.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {selected.status !== 'Read' && (
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void handleStatusChange(selected, 'Read')}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Mark as Read
                </button>
              )}
              {selected.status !== 'Closed' ? (
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void handleStatusChange(selected, 'Closed')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Close Inquiry
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void handleStatusChange(selected, 'New')}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Reopen as New
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
