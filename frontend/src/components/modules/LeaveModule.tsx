'use client';

import React, { useState } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  MoreVertical,
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
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Leave Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track leave balances, vacation requests, and manager approval workflows
          </p>
        </div>

        <button
          onClick={onOpenApplyModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* 4 Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Casual Leave (CL)</span>
          <p className="text-2xl font-bold text-blue-600 mt-2">10 Days</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Used: 2 days</span>
            <span>Total: 12</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Sick Leave (SL)</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">9 Days</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Used: 1 day</span>
            <span>Total: 10</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Paid Leave (PL)</span>
          <p className="text-2xl font-bold text-purple-600 mt-2">12 Days</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Used: 3 days</span>
            <span>Total: 15</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Compensatory Off</span>
          <p className="text-2xl font-bold text-amber-500 mt-2">2 Days</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Weekend credits</span>
            <span>Total: 2</span>
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Leave Applications
          </h3>

          <div className="flex items-center gap-1.5">
            {['ALL', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  filterStatus === status
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Applicant</th>
                <th className="py-2.5 px-3">Leave Type</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Days</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={l.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                        alt="User"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-900">
                        {l.employeeName || 'Staff Member'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-600">{l.leaveType}</td>
                  <td className="py-3 px-3 text-slate-500">
                    {l.startDate} → {l.endDate}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{l.daysCount}d</td>
                  <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{l.reason}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        l.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : l.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {l.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApprove(l.id)}
                          disabled={processingId === l.id}
                          className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(l.id)}
                          disabled={processingId === l.id}
                          className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Reviewed</span>
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
