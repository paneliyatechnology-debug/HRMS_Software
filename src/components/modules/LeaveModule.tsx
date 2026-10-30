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
  const myName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

  const relevantLeaves =
    portalMode === 'employee'
      ? leaves.filter((l) => {
          if (myId && l.employeeId === myId) return true;
          if (user.id && l.employeeId === user.id) return true;
          if (user.employeeId && l.employeeId === user.employeeId) return true;
          if (myEmail && (l as any).employeeEmail?.toLowerCase() === myEmail) return true;
          if (myCode && (l as any).employeeCode?.toLowerCase() === myCode) return true;
          if (myName && l.employeeName?.toLowerCase() === myName) return true;
          if (user.firstName && l.employeeName?.toLowerCase().includes(user.firstName.toLowerCase())) return true;
          return false;
        })
      : leaves;

  const pendingLeaves = relevantLeaves.filter((l) => (l.status || '').toLowerCase() === 'pending');
  const approvedLeaves = relevantLeaves.filter((l) => (l.status || '').toLowerCase() === 'approved');
  const rejectedLeaves = relevantLeaves.filter((l) => (l.status || '').toLowerCase() === 'rejected');

  // Dynamic leave calculations for Employee Portal (Kitni leave hai & Kitni le li hai)
  const calculateDays = (typeKeywords: string[], targetStatus: 'Approved' | 'Pending') => {
    return relevantLeaves
      .filter((l) => {
        const type = (l.leaveType || '').toLowerCase();
        const status = (l.status || '').toLowerCase();
        const matchesType = typeKeywords.some((kw) => type.includes(kw.toLowerCase()));
        return matchesType && status === targetStatus.toLowerCase();
      })
      .reduce((sum, l) => sum + (Number(l.daysCount) || 1), 0);
  };

  // Quotas for standard employee annual allowance
  const CASUAL_QUOTA = 12;
  const SICK_QUOTA = 12;
  const PAID_QUOTA = 12;
  const OTHER_QUOTA = 6;
  const TOTAL_QUOTA = CASUAL_QUOTA + SICK_QUOTA + PAID_QUOTA + OTHER_QUOTA; // 42 days

  // 1. Casual Leave (CL)
  const casualTaken = calculateDays(['casual'], 'Approved');
  const casualPending = calculateDays(['casual'], 'Pending');
  const casualLeft = Math.max(0, CASUAL_QUOTA - casualTaken);

  // 2. Sick Leave (SL)
  const sickTaken = calculateDays(['sick', 'medical'], 'Approved');
  const sickPending = calculateDays(['sick', 'medical'], 'Pending');
  const sickLeft = Math.max(0, SICK_QUOTA - sickTaken);

  // 3. Paid / Annual Leave (PL)
  const paidTaken = calculateDays(['paid', 'annual', 'earned'], 'Approved');
  const paidPending = calculateDays(['paid', 'annual', 'earned'], 'Pending');
  const paidLeft = Math.max(0, PAID_QUOTA - paidTaken);

  // 4. Other / Comp Off Leave
  const otherTaken = calculateDays(['comp', 'unpaid', 'maternity', 'paternity', 'bereavement'], 'Approved');
  const otherPending = calculateDays(['comp', 'unpaid', 'maternity', 'paternity', 'bereavement'], 'Pending');
  const otherLeft = Math.max(0, OTHER_QUOTA - otherTaken);

  // Overall Total
  const totalTaken = casualTaken + sickTaken + paidTaken + otherTaken;
  const totalPending = casualPending + sickPending + paidPending + otherPending;
  const totalLeft = casualLeft + sickLeft + paidLeft + otherLeft;

  // Filter leaves according to current portal & filters
  const lq = search.trim().toLowerCase();
  const displayedLeaves = relevantLeaves.filter((l) => {
    const matchesSearch =
      !lq ||
      (l.employeeName || '').toLowerCase().includes(lq) ||
      (l.reason || '').toLowerCase().includes(lq) ||
      (l.leaveType || '').toLowerCase().includes(lq) ||
      (l.departmentName || '').toLowerCase().includes(lq);

    const matchesStatus =
      statusFilter === 'All' || (l.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string, empName: string, leaveType: string) => {
    setProcessingId(id);
    try {
      await api.approveLeave(
        id,
        'HR_ADMIN',
        user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'HR Administration',
        'Approved by HR Administration'
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
        user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'HR Administration',
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

          {/* Dynamic 4 Leave Balance & Consumption Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Total Overall Leaves */}
            <div className="p-4 rounded-2xl bg-white border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>Total Leaves</span>
                  </span>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    ANNUAL
                  </span>
                </div>

                {/* Prominent Taken/Total (3/12 format) */}
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{totalTaken}</span>
                  <span className="text-2xl font-black text-slate-400">/{TOTAL_QUOTA}</span>
                  <span className="text-xs font-bold text-indigo-600 ml-1.5">Used</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600">{totalTaken} Used</span>
                  <span className="font-bold text-emerald-600">{totalLeft} Available</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>{totalTaken}/{TOTAL_QUOTA} Days Used</span>
                  <span className="text-emerald-700 font-extrabold">{totalLeft} Remaining</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalTaken / TOTAL_QUOTA) * 100))}%` }}
                  />
                </div>
                {totalPending > 0 && (
                  <p className="text-[10px] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{totalPending} {totalPending === 1 ? 'day' : 'days'} pending review</span>
                  </p>
                )}
              </div>
            </div>

            {/* Card 2: Casual Leave (CL) */}
            <div className="p-4 rounded-2xl bg-white border-2 border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Casual Leave (CL)</span>
                  </span>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    CASUAL
                  </span>
                </div>

                {/* Prominent Taken/Total (e.g. 3/12 format) */}
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{casualTaken}</span>
                  <span className="text-2xl font-black text-slate-400">/{CASUAL_QUOTA}</span>
                  <span className="text-xs font-bold text-emerald-700 ml-1.5">Used</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600">{casualTaken} Used</span>
                  <span className="font-bold text-emerald-600">{casualLeft} Available</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>{casualTaken}/{CASUAL_QUOTA} Days Used</span>
                  <span className="text-emerald-700 font-extrabold">{casualLeft} Remaining</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((casualTaken / CASUAL_QUOTA) * 100))}%` }}
                  />
                </div>
                {casualPending > 0 && (
                  <p className="text-[10px] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{casualPending} {casualPending === 1 ? 'day' : 'days'} pending review</span>
                  </p>
                )}
              </div>
            </div>

            {/* Card 3: Sick Leave (SL) */}
            <div className="p-4 rounded-2xl bg-white border-2 border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Sick Leave (SL)</span>
                  </span>
                  <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    MEDICAL
                  </span>
                </div>

                {/* Prominent Taken/Total (e.g. 0/12 format) */}
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{sickTaken}</span>
                  <span className="text-2xl font-black text-slate-400">/{SICK_QUOTA}</span>
                  <span className="text-xs font-bold text-amber-700 ml-1.5">Used</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600">{sickTaken} Used</span>
                  <span className="font-bold text-emerald-600">{sickLeft} Available</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>{sickTaken}/{SICK_QUOTA} Days Used</span>
                  <span className="text-emerald-700 font-extrabold">{sickLeft} Remaining</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((sickTaken / SICK_QUOTA) * 100))}%` }}
                  />
                </div>
                {sickPending > 0 && (
                  <p className="text-[10px] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{sickPending} {sickPending === 1 ? 'day' : 'days'} pending review</span>
                  </p>
                )}
              </div>
            </div>

            {/* Card 4: Paid / Annual Leave (PL) */}
            <div className="p-4 rounded-2xl bg-white border-2 border-violet-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-black uppercase text-violet-800 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    <span>Paid Leave (PL)</span>
                  </span>
                  <span className="text-[10px] font-black bg-violet-50 text-violet-800 px-2 py-0.5 rounded-full border border-violet-200">
                    EARNED
                  </span>
                </div>

                {/* Prominent Taken/Total (e.g. 0/12 format) */}
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{paidTaken}</span>
                  <span className="text-2xl font-black text-slate-400">/{PAID_QUOTA}</span>
                  <span className="text-xs font-bold text-violet-700 ml-1.5">Used</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600">{paidTaken} Used</span>
                  <span className="font-bold text-emerald-600">{paidLeft} Available</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>{paidTaken}/{PAID_QUOTA} Days Used</span>
                  <span className="text-emerald-700 font-extrabold">{paidLeft} Remaining</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-violet-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((paidTaken / PAID_QUOTA) * 100))}%` }}
                  />
                </div>
                {paidPending > 0 && (
                  <p className="text-[10px] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{paidPending} {paidPending === 1 ? 'day' : 'days'} pending review</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTER BAR & STATUS TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Segmented Tabs (Scrollable on mobile) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70 shadow-2xs overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0 max-w-full">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
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
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[180px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {portalMode === 'admin' && (
            <button
              onClick={onOpenApplyModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-xs"
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

        {/* Mobile Leave Requests Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {displayedLeaves.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium text-xs">
              No leave applications matching your search or filter.
            </div>
          ) : (
            displayedLeaves.map((leave) => {
              const isProcessing = processingId === leave.id;
              return (
                <div key={leave.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 shrink-0">
                        {leave.employeeName?.[0] || 'E'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{leave.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{leave.departmentName || 'General'}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                        (leave.status || '').toLowerCase() === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (leave.status || '').toLowerCase() === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {(leave.status || '').toLowerCase() === 'approved' && <Check className="w-3 h-3 stroke-[3]" />}
                      {(leave.status || '').toLowerCase() === 'pending' && <Clock className="w-3 h-3 stroke-[2.5]" />}
                      {leave.status === 'Rejected' && <X className="w-3 h-3 stroke-[3]" />}
                      <span>{leave.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Dates</span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {leave.startDate} {leave.endDate !== leave.startDate ? `→ ${leave.endDate}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Type & Duration</span>
                      <span className="font-semibold text-indigo-700 text-[11px]">
                        {leave.leaveType} ({leave.daysCount}d)
                      </span>
                    </div>
                  </div>

                  {leave.reason && (
                    <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                      &ldquo;{leave.reason}&rdquo;
                    </p>
                  )}

                  {portalMode === 'admin' && (leave.status || '').toLowerCase() === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(leave.id, leave.employeeName, leave.leaveType)}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(leave)}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
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
                            (leave.status || '').toLowerCase() === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : (leave.status || '').toLowerCase() === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {(leave.status || '').toLowerCase() === 'approved' && <Check className="w-3 h-3 stroke-[3]" />}
                          {(leave.status || '').toLowerCase() === 'pending' && <Clock className="w-3 h-3 stroke-[2.5]" />}
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
                          {(leave.status || '').toLowerCase() === 'pending' ? (
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
