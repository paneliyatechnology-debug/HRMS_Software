'use client';

import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Filter,
  Calendar,
  User,
  List,
  Search,
  ChevronDown,
  Check,
  X,
  Clock,
  Shield,
  CalendarOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  onOpenApplyModal: () => void;
  onRefresh: () => void;
  portalMode?: 'employee' | 'admin';
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  leaves,
  onOpenApplyModal,
  onRefresh,
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [duration, setDuration] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection modal / prompt state
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const myId = user.employeeId || user.id || '';
  const myEmail = user.email?.toLowerCase() || '';
  const myCode = ((user as any).employeeCode || '').toLowerCase();

  const relevantLeaves =
    portalMode === 'employee'
      ? leaves.filter((l) => {
          if (myId && l.employeeId === myId) return true;
          if (myEmail && (l as any).employeeEmail?.toLowerCase() === myEmail) return true;
          if (myCode && (l as any).employeeCode?.toLowerCase() === myCode) return true;
          return false;
        })
      : leaves;

  const pendingLeaves = relevantLeaves.filter((l) => l.status === 'Pending');
  const approvedLeaves = relevantLeaves.filter((l) => l.status === 'Approved');
  const rejectedLeaves = relevantLeaves.filter((l) => l.status === 'Rejected');

  // Filter leaves according to current portal & filters
  const displayedLeaves = relevantLeaves.filter((l) => {
    const matchesSearch =
      l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      l.reason?.toLowerCase().includes(search.toLowerCase()) ||
      l.leaveType?.toLowerCase().includes(search.toLowerCase()) ||
      l.departmentName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || l.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string, empName: string, leaveType: string) => {
    setProcessingId(id);
    try {
      await api.approveLeave(
        id,
        'SUPER_ADMIN',
        'Keyur Sangani',
        'Approved by Keyur Sangani (HR & Admin)'
      );
      showToast({
        type: 'success',
        title: 'Leave Approved Successfully',
        message: `${empName}'s ${leaveType} has been approved and leave balance deducted.`,
      });
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'Could not approve leave. Please check server connection.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (leave: LeaveRequest) => {
    setRejectingLeave(leave);
    setRejectionReason('Project deliverable timeline conflict. Please discuss with team lead.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeave) return;
    const leaveId = rejectingLeave.id;
    const empName = rejectingLeave.employeeName;
    setProcessingId(leaveId);
    try {
      await api.rejectLeave(
        leaveId,
        'Keyur Sangani',
        rejectionReason || 'Rejected by HR Admin'
      );
      showToast({
        type: 'warning',
        title: 'Leave Request Rejected',
        message: `${empName}'s leave application was rejected with note: "${rejectionReason}"`,
      });
      setRejectingLeave(null);
      setRejectionReason('');
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rejection Failed',
        message: err.message || 'Could not reject leave.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Employee,Department,Leave Date,Duration,Status,Type,Reason\n' +
      displayedLeaves
        .map(
          (l) =>
            `"${l.employeeName}","${l.departmentName || '--'}","${l.startDate} to ${l.endDate}","${l.daysCount} days","${l.status}","${l.leaveType}","${l.reason?.replace(/"/g, '""') || ''}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'leaves_export.csv');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto select-none pb-12">
      {/* ========================================================================= */}
      {/* HR / ADMIN PORTAL VIEW: PENDING APPROVALS QUEUE */}
      {/* ========================================================================= */}
      {portalMode === 'admin' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Pending Leave Approvals Queue</span>
                  {pendingLeaves.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black animate-pulse">
                      {pendingLeaves.length} Action Needed
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Observe and execute 1-click Approve or Reject decisions for employee requests
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {leaves.length} Total Applications
              </span>
            </div>
          </div>

          {/* Pending Leaves Cards */}
          {pendingLeaves.length === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  All Leave Requests are Reviewed!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  There are currently zero pending employee leave applications in the approval queue.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {pendingLeaves.map((leave) => {
                const isProcessing = processingId === leave.id;
                return (
                  <div
                    key={leave.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                            {leave.employeeName?.[0] || 'E'}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                              {leave.employeeName}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {leave.departmentName || 'Employee'}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                          {leave.leaveType}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Dates</span>
                          <p className="font-semibold text-slate-800">
                            {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                          <p className="font-bold text-indigo-700">
                            {leave.daysCount} {leave.daysCount === 1 ? 'Day' : 'Days'}
                          </p>
                        </div>
                      </div>

                      {/* Reason quote */}
                      <div className="mt-2.5 text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200/70 italic">
                        <span className="font-bold not-italic text-slate-400 text-[10px] uppercase block mb-0.5">
                          Reason for leave
                        </span>
                        "{leave.reason}"
                      </div>
                    </div>

                    {/* Action Buttons: 1-click Approve and Reject */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleApprove(leave.id, leave.employeeName, leave.leaveType)}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        title="Approve employee leave request"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenRejectModal(leave)}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                        title="Reject employee leave request"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMPLOYEE PORTAL VIEW: PERSONAL LEAVE BALANCES */}
      {/* ========================================================================= */}
      {portalMode === 'employee' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                My Leaves & Balance
              </h1>
              <p className="text-xs text-slate-500">
                Track your active leave allowance and submit new leave applications.
              </p>
            </div>

            <button
              onClick={onOpenApplyModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Apply for Leave</span>
            </button>
          </div>

          {/* 4 Leave Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Annual Leave
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">3.12</p>
              <p className="text-[11px] text-slate-500 mt-1">out of 12 days available</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full w-[26%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Casual Leave
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">10</p>
              <p className="text-[11px] text-slate-500 mt-1">out of 12 days available</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-[83%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sick Leave
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">9</p>
              <p className="text-[11px] text-slate-500 mt-1">out of 12 days available</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full w-[75%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Bereavement
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">3</p>
              <p className="text-[11px] text-slate-500 mt-1">out of 3 days available</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-slate-500 h-1.5 rounded-full w-[100%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTER BAR & STATUS TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Segmented Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70 shadow-2xs overflow-x-auto">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? relevantLeaves.length
                : tab === 'Pending'
                ? pendingLeaves.length
                : tab === 'Approved'
                ? approvedLeaves.length
                : rejectedLeaves.length;
            const isActive = statusFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs"
            />
          </div>

          {portalMode === 'admin' && (
            <button
              onClick={onOpenApplyModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEAVES TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            {portalMode === 'admin' ? 'All Employee Leave Records' : 'My Leave Applications'} (
            {displayedLeaves.length})
          </span>
          <span className="text-[11px] text-slate-400">
            {portalMode === 'admin' ? 'Admin controls enabled' : 'Personal records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 font-bold">EMPLOYEE</th>
                <th className="py-3 px-4 font-bold">DEPARTMENT</th>
                <th className="py-3 px-4 font-bold">LEAVE DATES</th>
                <th className="py-3 px-4 font-bold">DURATION</th>
                <th className="py-3 px-4 font-bold">TYPE</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold">REASON</th>
                {portalMode === 'admin' && (
                  <th className="py-3 px-4 font-bold text-right">ADMIN ACTION</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={portalMode === 'admin' ? 8 : 7}
                    className="py-12 text-center text-slate-500 font-medium"
                  >
                    No leave applications matching your search or filter.
                  </td>
                </tr>
              ) : (
                displayedLeaves.map((leave) => {
                  const isProcessing = processingId === leave.id;
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 shrink-0">
                            {leave.employeeName?.[0] || 'E'}
                          </div>
                          <span>{leave.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {leave.departmentName || '--'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {leave.startDate}{' '}
                        {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {leave.daysCount} {leave.daysCount === 1 ? 'Day' : 'Days'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {leave.leaveType}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : leave.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {leave.status === 'Approved' && <Check className="w-3 h-3 stroke-[3]" />}
                          {leave.status === 'Pending' && <Clock className="w-3 h-3 stroke-[2.5]" />}
                          {leave.status === 'Rejected' && <X className="w-3 h-3 stroke-[3]" />}
                          <span>{leave.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={leave.reason}>
                        {leave.reason || '--'}
                      </td>

                      {/* Admin 1-Click Action Column */}
                      {portalMode === 'admin' && (
                        <td className="py-3 px-4 text-right">
                          {leave.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  handleApprove(leave.id, leave.employeeName, leave.leaveType)
                                }
                                disabled={isProcessing}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(leave)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Reviewed ({leave.status})
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal Dialog */}
      {rejectingLeave && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reject Leave Application
                </h3>
              </div>
              <button
                onClick={() => setRejectingLeave(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                You are about to reject the leave application for{' '}
                <strong className="text-slate-900">{rejectingLeave.employeeName}</strong> (
                {rejectingLeave.leaveType}, {rejectingLeave.daysCount} days).
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Rejection Remarks (Shared with employee):
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Enter detailed reason for rejection..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectingLeave(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingLeave.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                {processingId === rejectingLeave.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
