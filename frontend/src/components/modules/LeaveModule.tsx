'use client';

import React, { useState } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  onOpenApplyModal: () => void;
  onRefresh: () => void;
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  leaves,
  onOpenApplyModal,
  onRefresh,
}) => {
  const { hasPermission, role } = useAuth();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredLeaves =
    filterStatus === 'ALL' ? leaves : leaves.filter((l) => l.status === filterStatus);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.approveLeave(id, role, 'Approver', 'Approved via HRMS Manager portal');
      alert('Leave application approved! Employee leave balance updated.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter rejection remarks:');
    if (!reason) return;

    setProcessingId(id);
    try {
      await api.rejectLeave(id, 'Approver', reason);
      alert('Leave application rejected.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Leave Management & Approvals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track leave balances, multi-day requests, manager reviews, and company holiday integrations
          </p>
        </div>

        <button
          onClick={onOpenApplyModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Casual Leave (CL)</span>
          <p className="text-2xl font-black text-blue-600 mt-1">10 Days Left</p>
          <span className="text-[11px] text-slate-400">Total 12 • 2 Used</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Sick Leave (SL)</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">9 Days Left</p>
          <span className="text-[11px] text-slate-400">Total 10 • 1 Used</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Paid / Annual (PL)</span>
          <p className="text-2xl font-black text-purple-600 mt-1">12 Days Left</p>
          <span className="text-[11px] text-slate-400">Total 15 • 3 Used</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Compensatory Off</span>
          <p className="text-2xl font-black text-amber-500 mt-1">2 Days Left</p>
          <span className="text-[11px] text-slate-400">Weekend work credits</span>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-blue-600" /> Leave Applications Workflow
          </h3>

          <div className="flex items-center gap-2">
            {['ALL', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredLeaves.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={req.employeeName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span>{req.employeeName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {req.leaveType}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {req.startDate} to {req.endDate}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">
                    {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                          : req.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {hasPermission('APPROVE_LEAVES') && req.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={processingId === req.id}
                          onClick={() => handleApprove(req.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          disabled={processingId === req.id}
                          onClick={() => handleReject(req.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {req.comments || 'Reviewed'}
                      </span>
                    )}
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
