'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
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
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  RawLeaveQuotaPayload,
} from '../../lib/leaveQuotaUtils';
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
  const { showToast, emitLeaveStatusUpdated } = useSocket();

  // Real-time socket sync: refresh immediately on leave events
  useEffect(() => {
    const handleUpdate = () => {
      onRefresh();
    };
    window.addEventListener('hrms_leaves_updated', handleUpdate);
    return () => window.removeEventListener('hrms_leaves_updated', handleUpdate);
  }, [onRefresh]);
  const [duration, setDuration] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Approval modal state
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Rejection modal / prompt state
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!rejectingLeave && !approvingLeave) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRejectingLeave(null);
        setApprovingLeave(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rejectingLeave, approvingLeave]);

  const myId = user.employeeId || user.id || '';
  const myEmail = user.email?.toLowerCase() || '';
  const myCode = ((user as any).employeeCode || '').toLowerCase();
  const myName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

  // Live backend leave quotas configured by Admin (Settings -> Leave Quotas) & employee balances
  const [quotaData, setQuotaData] = useState<RawLeaveQuotaPayload | null>(null);
  const [quotaLoading, setQuotaLoading] = useState<boolean>(portalMode === 'employee');
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const loadQuotaData = React.useCallback(async () => {
    if (portalMode !== 'employee') return;
    setQuotaLoading(true);
    setQuotaError(null);
    try {
      const payload = await fetchLeaveQuotaData(myId);
      setQuotaData(payload);
    } catch (err: any) {
      setQuotaError(err?.message || 'Unable to load leave quotas from server.');
    } finally {
      setQuotaLoading(false);
    }
  }, [portalMode, myId]);

  useEffect(() => {
    if (portalMode !== 'employee') return;
    loadQuotaData();

    const handleSettingsOrLeaveSync = () => {
      loadQuotaData();
    };
    window.addEventListener('hrms_settings_updated', handleSettingsOrLeaveSync);
    window.addEventListener('hrms_leaves_updated', handleSettingsOrLeaveSync);
    return () => {
      window.removeEventListener('hrms_settings_updated', handleSettingsOrLeaveSync);
      window.removeEventListener('hrms_leaves_updated', handleSettingsOrLeaveSync);
    };
  }, [portalMode, loadQuotaData]);

  const relevantLeaves =
    portalMode === 'employee'
      ? leaves.filter((l) => {
        if (myId && l.employeeId === myId) return true;
        if (myEmail && (l as any).employeeEmail?.toLowerCase() === myEmail) return true;
        if (myCode && (l as any).employeeCode?.toLowerCase() === myCode) return true;
        if (myName && l.employeeName?.toLowerCase() === myName) return true;
        return false;
      })
      : leaves;

  const pendingLeaves = relevantLeaves.filter((l) => l.status === 'Pending');
  const approvedLeaves = relevantLeaves.filter((l) => l.status === 'Approved');
  const rejectedLeaves = relevantLeaves.filter((l) => l.status === 'Rejected');

  // Dynamic leave quota & balance calculation strictly from Admin-configured backend quotas
  const quotaSummary = resolveLeaveQuotaSummary(
    quotaData?.settings ?? null,
    quotaData?.balances ?? null,
    relevantLeaves
  );

  const CASUAL_QUOTA = quotaSummary.casual.quota;
  const casualTaken = quotaSummary.casual.taken;
  const casualPending = quotaSummary.casual.pending;
  const casualLeft = quotaSummary.casual.available;

  const SICK_QUOTA = quotaSummary.sick.quota;
  const sickTaken = quotaSummary.sick.taken;
  const sickPending = quotaSummary.sick.pending;
  const sickLeft = quotaSummary.sick.available;

  const PAID_QUOTA = quotaSummary.paid.quota;
  const paidTaken = quotaSummary.paid.taken;
  const paidPending = quotaSummary.paid.pending;
  const paidLeft = quotaSummary.paid.available;

  const TOTAL_QUOTA = quotaSummary.total.quota;
  const totalTaken = quotaSummary.total.taken;
  const totalPending = quotaSummary.total.pending;
  const totalLeft = quotaSummary.total.available;

  const getUsagePercent = (taken: number, quota: number) =>
    quota > 0 ? Math.min(100, Math.round((taken / quota) * 100)) : 0;

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

  const totalPages = Math.max(1, Math.ceil(displayedLeaves.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, displayedLeaves.length);
  const paginatedLeaves = displayedLeaves.slice(startIndex, endIndex);

  const handleOpenApproveModal = (leave: LeaveRequest) => {
    setApprovingLeave(leave);
    setApprovalRemarks('');
  };

  const handleConfirmApprove = async () => {
    if (!approvingLeave) return;
    const id = approvingLeave.id;
    const empName = approvingLeave.employeeName;
    const leaveType = approvingLeave.leaveType;
    const empId = approvingLeave.employeeId;

    setProcessingId(id);
    try {
      await api.approveLeave(
        id,
        user?.role || 'HR',
        user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'HR Administration',
        approvalRemarks.trim() || 'Approved by HR Administration'
      );
      showToast({
        type: 'success',
        title: 'Leave Approved Successfully',
        message: `${empName}'s ${leaveType} has been approved and leave balance deducted.`,
      });
      emitLeaveStatusUpdated({
        id,
        employeeId: empId,
        employeeName: empName,
        leaveType,
        status: 'Approved',
      });
      setApprovingLeave(null);
      setApprovalRemarks('');
      onRefresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: { id, employeeId: empId, status: 'Approved' } }));
      }
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
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeave) return;
    const leaveId = rejectingLeave.id;
    const empName = rejectingLeave.employeeName;
    const empId = rejectingLeave.employeeId;
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
      emitLeaveStatusUpdated({
        id: leaveId,
        employeeId: empId,
        employeeName: empName,
        status: 'Rejected',
        reason: rejectionReason,
      });
      setRejectingLeave(null);
      setRejectionReason('');
      onRefresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: { id: leaveId, employeeId: empId, status: 'Rejected' } }));
      }
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
    <div className="space-y-5 w-full select-none">
      {portalMode !== 'employee' && (
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
          <h1 className="hrms-page-title">Leave Requests</h1>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMPLOYEE PORTAL VIEW: PERSONAL LEAVE BALANCES */}
      {/* ========================================================================= */}
      {portalMode === 'employee' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
            <div>
              <h1 className="hrms-page-title">
                My Leaves &amp; Balance
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
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Error State */}
          {quotaError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{quotaError}</span>
              </div>
              <button
                onClick={loadQuotaData}
                className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty / Unconfigured Admin Quota Notice */}
          {!quotaLoading && !quotaError && !quotaSummary.hasConfiguredQuota && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                No annual leave quotas have been configured by Admin yet. Once Admin adds leave quotas in{' '}
                <strong className="font-bold">Settings &rarr; Leave Quotas</strong>, your allotted balance will appear here automatically.
              </span>
            </div>
          )}

          {/* Dynamic 4 Leave Balance & Consumption Cards */}
          {quotaLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-14 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-8 w-28 bg-slate-200 rounded" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-14 bg-slate-100 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
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

                  {/* Prominent Taken/Total */}
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-semibold tracking-tight text-slate-800">{totalTaken}</span>
                    <span className="text-2xl font-semibold text-slate-400">/{TOTAL_QUOTA}</span>
                    <span className="text-xs font-semibold text-indigo-600 ml-1.5">Used</span>
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
                      style={{ width: `${getUsagePercent(totalTaken, TOTAL_QUOTA)}%` }}
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

                  {/* Prominent Taken/Total */}
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-semibold tracking-tight text-slate-800">{casualTaken}</span>
                    <span className="text-2xl font-semibold text-slate-400">/{CASUAL_QUOTA}</span>
                    <span className="text-xs font-semibold text-emerald-700 ml-1.5">Used</span>
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
                      style={{ width: `${getUsagePercent(casualTaken, CASUAL_QUOTA)}%` }}
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

                  {/* Prominent Taken/Total */}
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-semibold tracking-tight text-slate-800">{sickTaken}</span>
                    <span className="text-2xl font-semibold text-slate-400">/{SICK_QUOTA}</span>
                    <span className="text-xs font-semibold text-amber-700 ml-1.5">Used</span>
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
                      style={{ width: `${getUsagePercent(sickTaken, SICK_QUOTA)}%` }}
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

                  {/* Prominent Taken/Total */}
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-semibold tracking-tight text-slate-800">{paidTaken}</span>
                    <span className="text-2xl font-semibold text-slate-400">/{PAID_QUOTA}</span>
                    <span className="text-xs font-semibold text-violet-700 ml-1.5">Used</span>
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
                      style={{ width: `${getUsagePercent(paidTaken, PAID_QUOTA)}%` }}
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
          )}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isActive ? 'bg-[#2d6a4f] text-white' : 'bg-[#e9ecef] text-[#495057]'
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
            paginatedLeaves.map((leave) => {
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
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${leave.status === 'Approved'
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

                  {portalMode === 'admin' && leave.status === 'Pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenApproveModal(leave)}
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
                paginatedLeaves.map((leave) => {
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
                        <div>
                          {leave.startDate}{' '}
                          {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                        </div>
                        {Array.isArray(leave.dayBreakdown) && leave.dayBreakdown.some((d) => d.session !== 'FULL_DAY') ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {leave.dayBreakdown
                              .filter((d) => d.session !== 'FULL_DAY')
                              .map((d) => (
                                <span
                                  key={d.date}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f8f9fa] text-[#343a40] border border-[#dee2e6]"
                                >
                                  {d.date}: {d.session === 'FIRST_HALF' ? '1st Half' : '2nd Half'}
                                </span>
                              ))}
                          </div>
                        ) : leave.isHalfDay && leave.halfDaySession ? (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f8f9fa] text-[#343a40] border border-[#dee2e6]">
                            {leave.halfDaySession === 'FIRST_HALF' ? 'First Half' : 'Second Half'}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {leave.daysCount} {leave.daysCount === 1 ? 'Day' : 'Days'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {leave.leaveType}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${leave.status === 'Approved'
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
                                onClick={() => handleOpenApproveModal(leave)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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

        {/* Pagination Bar (10 records per page) */}
        {displayedLeaves.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{displayedLeaves.length === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-800">{displayedLeaves.length}</span> records
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      totalPages > 7 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - safeCurrentPage) > 1
                    ) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400 select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                  title="Next Page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal Dialog */}
      {approvingLeave && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setApprovingLeave(null);
          }}
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Approve Leave Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingLeave(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to approve the leave application for{' '}
                <strong className="text-slate-900">{approvingLeave.employeeName}</strong>?
              </p>

              {/* Leave Details Summary Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Leave Type:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {approvingLeave.leaveType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">
                    {approvingLeave.startDate} to {approvingLeave.endDate} ({approvingLeave.daysCount} {approvingLeave.daysCount === 1 ? 'day' : 'days'})
                  </span>
                </div>
                {approvingLeave.departmentName && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">Department:</span>
                    <span className="font-medium text-slate-700">{approvingLeave.departmentName}</span>
                  </div>
                )}
                {approvingLeave.reason && (
                  <div className="pt-1.5 border-t border-slate-200/60 text-[11px]">
                    <span className="font-semibold text-slate-500 block mb-0.5">Reason:</span>
                    <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-100">
                      &ldquo;{approvingLeave.reason}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Approval Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  placeholder="e.g. Approved by HR Administration"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingLeave(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={processingId === approvingLeave.id}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {processingId === approvingLeave.id ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Confirm Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {rejectingLeave && (
        <div onClick={(e) => {
          if (e.target === e.currentTarget) setRejectingLeave(null);
        }}
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
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
