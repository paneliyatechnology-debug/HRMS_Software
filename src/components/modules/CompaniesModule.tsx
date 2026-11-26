'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

type CompanyStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected';

interface CompanyItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gstNumber?: string | null;
  industrySector?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  status: CompanyStatus;
  createdAt?: string;
}

export const CompaniesModule: React.FC = () => {
  const { showToast } = useSocket();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listCompanies({
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCompanies(list);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to load companies',
        message: err instanceof Error ? err.message : 'Could not fetch companies.',
      });
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCompanies();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadCompanies]);

  const handleStatusChange = async (company: CompanyItem, nextStatus: CompanyStatus) => {
    setBusyId(company.id);
    try {
      await api.updateCompanyStatus(company.id, nextStatus);
      showToast({
        type: 'success',
        title: nextStatus === 'Active' ? 'Company Approved' : nextStatus === 'Rejected' ? 'Company Rejected' : 'Status Updated',
        message: `${company.name} is now ${nextStatus}.`,
      });
      await loadCompanies();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err instanceof Error ? err.message : 'Could not update company status.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = companies.filter((c) => c.status === 'Pending').length;
  const activeCount = companies.filter((c) => c.status === 'Active').length;
  const rejectedCount = companies.filter((c) => c.status === 'Rejected' || c.status === 'Inactive').length;

  return (
    <div className="space-y-5 w-full animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </span>
            All Companies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review registered companies and approve or reject company access requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCompanies()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Active Companies</p>
            <p className="text-xl font-black text-slate-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Pending Approval</p>
            <p className="text-xl font-black text-slate-900">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Rejected / Inactive</p>
            <p className="text-xl font-black text-slate-900">{rejectedCount}</p>
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
            placeholder="Search by company name, email, phone, or city..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'Pending', 'Active', 'Inactive', 'Rejected'] as const).map((st) => (
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

      {/* Companies Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No companies found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Industry &amp; Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((comp) => {
                  const isBusy = busyId === comp.id;
                  const statusBadge =
                    comp.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : comp.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{comp.name}</p>
                        {comp.gstNumber && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">GST: {comp.gstNumber}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{comp.email}</span>
                        </p>
                        {comp.phone && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{comp.phone}</span>
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        {comp.industrySector && (
                          <p className="text-slate-700 flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{comp.industrySector}</span>
                          </p>
                        )}
                        {(comp.city || comp.state) && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{[comp.city, comp.state].filter(Boolean).join(', ')}</span>
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {comp.status !== 'Active' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(comp, 'Active')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                            >
                              {isBusy ? 'Saving...' : 'Approve'}
                            </button>
                          )}
                          {comp.status !== 'Rejected' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(comp, 'Rejected')}
                              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] cursor-pointer disabled:opacity-50"
                            >
                              Reject
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
    </div>
  );
};
