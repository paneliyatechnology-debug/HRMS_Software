'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

export const OrdersModule: React.FC = () => {
  const { showToast } = useSocket();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listPremiumOrders();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setOrders(list);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to load orders',
        message: err instanceof Error ? err.message : 'Could not fetch premium orders.',
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleUpdateOrder = async (orderId: string, status: 'Active' | 'Cancelled') => {
    setBusyId(orderId);
    try {
      await api.updatePremiumOrder(orderId, { status });
      showToast({
        type: 'success',
        title: status === 'Active' ? 'Order Activated' : 'Order Cancelled',
        message: `Order status updated to ${status}.`,
      });
      await loadOrders();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err instanceof Error ? err.message : 'Could not update order.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const text = `${o.companyName || ''} ${o.companyId || ''} ${o.planName || ''} ${o.razorpayOrderId || ''}`.toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  const activeOrdersCount = orders.filter((o) => o.status === 'Active').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'Active' || o.status === 'Expired')
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  return (
    <div className="space-y-5 w-full animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </span>
            Premium Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View all company subscription orders, Razorpay transactions, and activate or cancel orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
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
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Orders</p>
            <p className="text-xl font-black text-slate-900">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Active</p>
            <p className="text-xl font-black text-slate-900">{activeOrdersCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Pending</p>
            <p className="text-xl font-black text-slate-900">{pendingOrdersCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
            ₹
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Revenue</p>
            <p className="text-xl font-black text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
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
            placeholder="Search by company, plan, or Razorpay order ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'Active', 'Pending', 'Cancelled', 'Expired'] as const).map((st) => (
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

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Amount &amp; Duration</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ord) => {
                  const isBusy = busyId === ord.id;
                  const badge =
                    ord.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : ord.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200';
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{ord.companyName || ord.companyId}</p>
                        {ord.razorpayOrderId && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ord.razorpayOrderId}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{ord.planName}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">₹{Number(ord.price || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-500">{ord.durationMonths} month(s)</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {ord.startsOn && ord.endsOn ? `${ord.startsOn} → ${ord.endsOn}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {ord.status === 'Pending' ? (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleUpdateOrder(ord.id, 'Active')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Accept
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleUpdateOrder(ord.id, 'Cancelled')}
                                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              {ord.status === 'Active' ? 'Accepted' : ord.status === 'Cancelled' ? 'Rejected' : ord.status}
                            </span>
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
