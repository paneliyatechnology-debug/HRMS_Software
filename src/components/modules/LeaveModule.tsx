'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Edit2,
  Trash2,
  Loader2,
  Sun,
  RotateCcw,
} from 'lucide-react';
import { LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';
import {
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  calculateEmployeeLeaveBalances,
  RawLeaveQuotaPayload,
} from '../../lib/leaveQuotaUtils';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { canApproveRejectLeave, canManageLeaveTypes } from '../../lib/rolePermissions';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  leaveTypes?: Array<{ id: string; name: string; daysPerYear?: number; daysAllowed?: number; code?: string; color?: string; isPaid?: boolean; usedDays?: number; remainingDays?: number }>;
  onOpenApplyModal: () => void;
  onRefresh: () => void;
  portalMode?: 'employee' | 'admin';
  loading?: boolean;
}

const formatLeaveDate = (dateStr?: string): string => {
  if (!dateStr) return '--';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const getLeaveDayDetails = (leave: LeaveRequest): Array<{ date: string; label: string; isHalf: boolean }> => {
  if (Array.isArray(leave.days) && leave.days.length > 0) {
    return leave.days.map((d) => {
      const portion = d.portion || 'Full Day';
      const pLower = portion.toLowerCase();
      const isHalf = pLower.includes('half') || pLower.includes('first') || pLower.includes('second');
      return {
        date: formatLeaveDate(d.date),
        label: portion,
        isHalf,
      };
    });
  }
  if (Array.isArray(leave.dayBreakdown) && leave.dayBreakdown.length > 0) {
    return leave.dayBreakdown.map((d) => {
      const isHalf = d.session !== 'FULL_DAY';
      const label =
        d.session === 'FIRST_HALF'
          ? 'First Half'
          : d.session === 'SECOND_HALF'
            ? 'Second Half'
            : 'Full Day';
      return {
        date: formatLeaveDate(d.date),
        label,
        isHalf,
      };
    });
  }
  const items: Array<{ date: string; label: string; isHalf: boolean }> = [];
  if (leave.startDate) {
    const [sy, sm, sd] = String(leave.startDate).split('-').map(Number);
    const [ey, em, ed] = String(leave.endDate || leave.startDate).split('-').map(Number);
    if (sy && sm && sd && ey && em && ed) {
      const cur = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      let guard = 0;
      while (cur <= end && guard < 60) {
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        const isSingleHalf = Boolean(leave.isHalfDay && leave.startDate === leave.endDate);
        items.push({
          date: `${dd}-${mm}-${yyyy}`,
          label: isSingleHalf
            ? leave.halfDaySession === 'SECOND_HALF'
              ? 'Second Half'
              : 'First Half'
            : 'Full Day',
          isHalf: isSingleHalf,
        });
        cur.setDate(cur.getDate() + 1);
        guard += 1;
      }
    }
  }
  return items;
};

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  leaves,
  leaveTypes: initialLeaveTypes,
  onOpenApplyModal,
  onRefresh,
  portalMode = 'admin',
  loading = false,
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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'>('All');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedLeaveId, setExpandedLeaveId] = useState<string | null>(null);
  const [avatarByEmployee, setAvatarByEmployee] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    let active = true;
    api
      .getEmployees()
      .then((emps) => {
        if (!active || !Array.isArray(emps)) return;
        const map: Record<string, string> = {};
        emps.forEach((emp: any) => {
          const pic = emp?.avatarUrl || emp?.profileImage || emp?.avatar;
          if (!pic) return;
          if (emp.id) map[String(emp.id)] = pic;
          if (emp.userId) map[String(emp.userId)] = pic;
          if (emp.employeeCode) map[String(emp.employeeCode).toLowerCase()] = pic;
          if (emp.email) map[String(emp.email).toLowerCase()] = pic;
          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
          if (fullName) map[fullName] = pic;
        });
        setAvatarByEmployee(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const getLeaveAvatar = (leave: LeaveRequest): string | undefined => {
    const anyLeave = leave as any;
    const direct = anyLeave.avatarUrl || anyLeave.employeeAvatar || anyLeave.user?.avatarUrl;
    if (direct) return direct;
    if (leave.employeeId && avatarByEmployee[String(leave.employeeId)]) {
      return avatarByEmployee[String(leave.employeeId)];
    }
    if (anyLeave.userId && avatarByEmployee[String(anyLeave.userId)]) {
      return avatarByEmployee[String(anyLeave.userId)];
    }
    const nameKey = (leave.employeeName || '').trim().toLowerCase();
    if (nameKey && avatarByEmployee[nameKey]) {
      return avatarByEmployee[nameKey];
    }
    if (portalMode === 'employee' && user?.avatarUrl) {
      return user.avatarUrl;
    }
    return undefined;
  };

  const toggleExpandRow = (id: string) => {
    setExpandedLeaveId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Approval modal state
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Rejection modal / prompt state
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancellingLeave, setCancellingLeave] = useState<LeaveRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Role permissions check (Admin & HR only)
  const isAdminOrHr = canManageLeaveTypes(user);
  const adminHasNoLeave = ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(String(user?.role || '').toUpperCase());

  // Leave Types Modal State (Admin, HR, Employee, Manager)
  const [isLeaveTypesModalOpen, setIsLeaveTypesModalOpen] = useState(false);
  const [leaveTypesList, setLeaveTypesList] = useState<Array<{ id: string; name: string; daysPerYear?: number; daysAllowed?: number; code?: string; color?: string; isPaid?: boolean; usedDays?: number; remainingDays?: number }>>(initialLeaveTypes || []);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [newLeaveTypeName, setNewLeaveTypeName] = useState('');
  const [newLeaveTypeDays, setNewLeaveTypeDays] = useState<string>('12');
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(null);
  const [editingLeaveTypeName, setEditingLeaveTypeName] = useState('');
  const [editingLeaveTypeDays, setEditingLeaveTypeDays] = useState<string>('12');
  const [isSubmittingLeaveType, setIsSubmittingLeaveType] = useState(false);
  const [deletingLeaveTypeId, setDeletingLeaveTypeId] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(initialLeaveTypes) && initialLeaveTypes.length > 0) {
      setLeaveTypesList(initialLeaveTypes);
    }
  }, [initialLeaveTypes]);

  const loadLeaveTypes = React.useCallback(async () => {
    setLeaveTypesLoading(true);
    try {
      const userCompId = user?.companyId;
      const list = await api.listLeaveTypes(userCompId ? { companyId: userCompId } : undefined);
      if (Array.isArray(list) && list.length > 0) {
        setLeaveTypesList(list);
      } else if (Array.isArray(initialLeaveTypes) && initialLeaveTypes.length > 0) {
        setLeaveTypesList(initialLeaveTypes);
      } else {
        setLeaveTypesList([]);
      }
    } catch (err: any) {
      if (isAdminOrHr) {
        showToast({ type: 'error', title: 'Failed to load leave types', message: err.message || 'Error' });
      }
    } finally {
      setLeaveTypesLoading(false);
    }
  }, [showToast, user?.companyId, initialLeaveTypes, isAdminOrHr]);

  useEffect(() => {
    loadLeaveTypes();
  }, [loadLeaveTypes]);

  useEffect(() => {
    if (isLeaveTypesModalOpen) {
      loadLeaveTypes();
    }
  }, [isLeaveTypesModalOpen, loadLeaveTypes]);

  useEffect(() => {
    if (!isLeaveTypesModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLeaveTypesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLeaveTypesModalOpen]);

  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrHr) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Admin and HR can configure leave types.' });
      return;
    }
    const nameToAdd = newLeaveTypeName.trim();
    if (!nameToAdd) {
      showToast({ type: 'warning', title: 'Name Required', message: 'Please enter a leave type name.' });
      return;
    }
    const parsedDays = Number(newLeaveTypeDays);
    if (newLeaveTypeDays === '' || isNaN(parsedDays) || parsedDays < 0) {
      showToast({ type: 'warning', title: 'Invalid Days', message: 'Days per year must be a valid positive number.' });
      return;
    }

    setIsSubmittingLeaveType(true);
    try {
      const created = await api.createLeaveType({ name: nameToAdd, daysPerYear: parsedDays });
      showToast({
        type: 'success',
        title: 'Leave Type Created',
        message: `"${created?.name || nameToAdd}" (${parsedDays} days/year) created successfully.`,
      });
      setNewLeaveTypeName('');
      setNewLeaveTypeDays('12');
      await loadLeaveTypes();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hrms_leave_types_updated'));
    } catch (err: any) {
      showToast({ type: 'error', title: 'Creation Failed', message: err.message || 'Could not create leave type' });
    } finally {
      setIsSubmittingLeaveType(false);
    }
  };

  const handleUpdateLeaveType = async (id: string) => {
    if (!isAdminOrHr) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Admin and HR can update leave types.' });
      return;
    }
    const nameToUpdate = editingLeaveTypeName.trim();
    if (!nameToUpdate) {
      showToast({ type: 'warning', title: 'Name Required', message: 'Please enter a valid leave type name.' });
      return;
    }
    const parsedDays = Number(editingLeaveTypeDays);
    if (editingLeaveTypeDays === '' || isNaN(parsedDays) || parsedDays < 0) {
      showToast({ type: 'warning', title: 'Invalid Days', message: 'Days per year must be a valid positive number.' });
      return;
    }

    setIsSubmittingLeaveType(true);
    try {
      const updated = await api.updateLeaveType(id, { name: nameToUpdate, daysPerYear: parsedDays });
      showToast({
        type: 'success',
        title: 'Leave Type Updated',
        message: `"${updated?.name || nameToUpdate}" (${parsedDays} days/year) updated successfully.`,
      });
      setEditingLeaveTypeId(null);
      setEditingLeaveTypeName('');
      setEditingLeaveTypeDays('12');
      await loadLeaveTypes();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hrms_leave_types_updated'));
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message || 'Could not update leave type' });
    } finally {
      setIsSubmittingLeaveType(false);
    }
  };

  const handleDeleteLeaveType = async (id: string, name?: string, rawLt?: any) => {
    if (!isAdminOrHr) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Admin and HR can delete leave types.' });
      return;
    }
    const nameStr = name ? ` "${name}"` : '';
    if (!window.confirm(`Are you sure you want to delete leave type${nameStr}? This action cannot be undone.`)) {
      return;
    }
    setDeletingLeaveTypeId(id);
    try {
      const deleteIdentifier = rawLt?.slug || rawLt?._id || rawLt?.id || id;
      await api.deleteLeaveType(deleteIdentifier);
      showToast({ type: 'success', title: 'Leave Type Deleted', message: `Leave type${nameStr} removed successfully.` });
      await loadLeaveTypes();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hrms_leave_types_updated'));
    } catch (err: any) {
      showToast({ type: 'error', title: 'Deletion Failed', message: err.message || 'Could not delete leave type' });
    } finally {
      setDeletingLeaveTypeId(null);
    }
  };

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
  const cancelledLeaves = relevantLeaves.filter((l) => l.status === 'Cancelled');

  // Dynamic leave quota & balance calculation strictly from Admin-configured backend quotas & leave types
  const quotaSummary = resolveLeaveQuotaSummary(
    quotaData?.settings ?? null,
    quotaData?.balances ?? null,
    relevantLeaves,
    leaveTypesList
  );

  const empLeaveResult = useMemo(() => {
    return calculateEmployeeLeaveBalances(
      leaveTypesList,
      relevantLeaves,
      quotaData?.settings ?? null,
      quotaData?.balances ?? null
    );
  }, [leaveTypesList, relevantLeaves, quotaData]);

  const dynamicLeaveCards = empLeaveResult.cards;
  const TOTAL_QUOTA = empLeaveResult.totalQuota;
  const totalTaken = empLeaveResult.totalTaken;
  const totalPending = empLeaveResult.totalPending;
  const totalLeft = empLeaveResult.totalAvailable;

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

  const totalPages = Math.max(1, Math.ceil(displayedLeaves.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, displayedLeaves.length);
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
    const note = approvalRemarks.trim() || 'Accepted. Take care.';

    setProcessingId(id);
    try {
      await api.acceptLeave(id, note);
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
        reason: note,
      });
      setApprovingLeave(null);
      setApprovalRemarks('');
      onRefresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hrms_leaves_updated', {
            detail: { id, employeeId: empId, status: 'Approved', response: note, comments: note },
          })
        );
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

  const todayKey = new Date().toLocaleDateString('en-CA');

  const handleCancelLeave = async () => {
    if (!cancellingLeave) return;
    const reason = cancelReason.trim();
    if (!reason) {
      showToast({ type: 'error', title: 'Reason required', message: 'Write why this leave is being cancelled.' });
      return;
    }
    setProcessingId(cancellingLeave.id);
    try {
      await api.cancelLeave(cancellingLeave.id, reason);
      showToast({
        type: 'success',
        title: 'Leave cancelled',
        message: `${cancellingLeave.leaveType} from ${cancellingLeave.startDate} to ${cancellingLeave.endDate} was cancelled.`,
      });
      setCancellingLeave(null);
      setCancelReason('');
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Cancel failed',
        message: err.message || 'Could not cancel leave.',
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
    const note = rejectionReason.trim() || 'Rejected.';

    setProcessingId(leaveId);
    try {
      await api.rejectLeave(leaveId, note);
      showToast({
        type: 'warning',
        title: 'Leave Request Rejected',
        message: `${empName}'s leave application was rejected with note: "${note}"`,
      });
      emitLeaveStatusUpdated({
        id: leaveId,
        employeeId: empId,
        employeeName: empName,
        status: 'Rejected',
        reason: note,
      });
      setRejectingLeave(null);
      setRejectionReason('');
      onRefresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hrms_leaves_updated', {
            detail: { id: leaveId, employeeId: empId, status: 'Rejected', response: note, comments: note },
          })
        );
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
    <div className="space-y-4 w-full select-none md:h-[calc(100vh-115px)] md:flex md:flex-col md:overflow-hidden">
      {/* ========================================================================= */}
      {/* EMPLOYEE PORTAL VIEW: PERSONAL LEAVE BALANCES */}
      {/* ========================================================================= */}
      {portalMode === 'employee' && (
        <div className="space-y-4 shrink-0">
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
          {!quotaLoading && !quotaError && !quotaSummary.hasConfiguredQuota && dynamicLeaveCards.length === 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                No annual leave quotas have been configured by Admin yet. Once Admin adds leave quotas in{' '}
                <strong className="font-bold">Settings &rarr; Leave Quotas</strong>, your allotted balance will appear here automatically.
              </span>
            </div>
          )}

          {/* Dynamic Leave Balance & Consumption Cards (Compact) */}
          {quotaLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-3.5 w-12 bg-slate-100 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-slate-200 rounded" />
                    <div className="h-3 w-14 bg-slate-100 rounded" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : dynamicLeaveCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dynamicLeaveCards.map((card: any) => (
                <div
                  key={card.id}
                  className={`p-3 rounded-2xl bg-white border ${card.theme.border} shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-2`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-[11px] font-extrabold uppercase ${card.theme.title} tracking-wide flex items-center gap-1.5 truncate`}>
                      <span className={`w-2 h-2 rounded-full ${card.theme.dot} shrink-0`} />
                      <span className="truncate">{card.name}</span>
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${card.theme.badge} shrink-0`}>
                      {card.badge}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold tracking-tight text-slate-800">{card.taken}</span>
                      <span className="text-sm font-semibold text-slate-400">/{card.quota}</span>
                      <span className={`text-[10px] font-semibold ${card.theme.usedTag} ml-1`}>Used</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 whitespace-nowrap">
                      {card.available} Available
                    </span>
                  </div>

                  <div>
                    {(() => {
                      const approvedPct =
                        card.quota > 0
                          ? getUsagePercent(card.taken, card.quota)
                          : card.taken > 0
                            ? card.pending > 0
                              ? 50
                              : 100
                            : 0;
                      const pendingPct =
                        card.pending > 0
                          ? card.quota > 0
                            ? Math.min(Math.max(0, 100 - approvedPct), Math.max(8, getUsagePercent(card.pending, card.quota)))
                            : card.taken > 0
                              ? 50
                              : 100
                          : 0;
                      return (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                          {approvedPct > 0 && (
                            <div
                              className="bg-emerald-600 h-1.5 transition-all duration-500"
                              style={{ width: `${approvedPct}%` }}
                            />
                          )}
                          {pendingPct > 0 && (
                            <div
                              className="bg-amber-400 h-1.5 transition-all duration-500"
                              style={{ width: `${pendingPct}%` }}
                            />
                          )}
                        </div>
                      );
                    })()}
                    {card.pending > 0 && (
                      <p className="text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{card.pending} {card.pending === 1 ? 'day' : 'days'} pending</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-600">No leave categories configured by your company yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Once Admin configures leave types in the Leave Types modal, the top leave categories and balances will appear here automatically.</p>
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
          {(['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? relevantLeaves.length
                : tab === 'Pending'
                  ? pendingLeaves.length
                  : tab === 'Approved'
                    ? approvedLeaves.length
                    : tab === 'Rejected'
                      ? rejectedLeaves.length
                      : cancelledLeaves.length;
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
          {portalMode === 'admin' && (
            <button
              onClick={() => {
                setIsLeaveTypesModalOpen(true);
                loadLeaveTypes();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <List className="w-3.5 h-3.5 text-emerald-600" />
              <span>Leave Types</span>
            </button>
          )}
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
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-xs cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {(portalMode === 'employee' || (portalMode === 'admin' && !adminHasNoLeave)) && (
            <button
              onClick={onOpenApplyModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{portalMode === 'employee' ? 'Apply for Leave' : 'Apply Leave'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEAVES TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden md:flex-1 md:min-h-0 md:flex md:flex-col">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
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
          {loading && leaves.length === 0 ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`skel-lv-m-${idx}`} className="p-3.5 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="w-28 h-3.5 bg-slate-200 rounded" />
                      <div className="w-20 h-2.5 bg-slate-100 rounded" />
                    </div>
                    <div className="w-16 h-5 bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedLeaves.length === 0 ? (
            leaves.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Leave Requests Recorded</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Apply for personal, sick, or casual leave using the button below.
                  </p>
                </div>
                {!adminHasNoLeave && (
                <button
                  type="button"
                  onClick={onOpenApplyModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply Leave</span>
                </button>
                )}
              </div>
            ) : (
              <div className="py-10 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">No Matching Leave Requests</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No leaves match &quot;{search || statusFilter}&quot;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('All');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters</span>
                </button>
              </div>
            )
          ) : (
            paginatedLeaves.map((leave) => {
              const isProcessing = processingId === leave.id;
              const avatarUrl = getLeaveAvatar(leave);
              return (
                <div key={leave.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 shrink-0 overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={leave.employeeName || 'Employee'} className="w-full h-full object-cover" />
                        ) : (
                          leave.employeeName?.[0] || 'E'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{leave.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{leave.departmentName || 'General'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold ${leave.status === 'Approved'
                          ? 'text-emerald-700'
                          : leave.status === 'Pending'
                            ? 'text-amber-700'
                            : leave.status === 'Cancelled'
                              ? 'text-slate-600'
                              : 'text-rose-700'
                          }`}
                      >
                        {leave.status === 'Approved' && <Check className="w-3 h-3 stroke-[3]" />}
                        {leave.status === 'Pending' && <Clock className="w-3 h-3 stroke-[2.5]" />}
                        {leave.status === 'Rejected' && <X className="w-3 h-3 stroke-[3]" />}
                        <span>{leave.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Dates</span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {formatLeaveDate(leave.startDate)} {leave.endDate !== leave.startDate ? `→ ${formatLeaveDate(leave.endDate)}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Type & Duration</span>
                      <span className="font-semibold text-indigo-700 text-[11px] flex items-center gap-1 flex-wrap">
                        <span>{leave.leaveType}</span>
                        <span>({leave.daysCount}d{leave.isHalfDay ? ` • ${leave.halfDaySession === 'SECOND_HALF' ? 'Half Day 2nd' : 'Half Day 1st'}` : ' • Full Day'})</span>
                      </span>
                    </div>
                  </div>

                  {portalMode === 'admin' && leave.reason && (
                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason</span>
                      <p className="italic text-slate-800">&ldquo;{leave.reason}&rdquo;</p>
                    </div>
                  )}

                  {portalMode === 'employee' && (leave.response || leave.comments) && (
                    <div
                      className={`text-xs space-y-0.5 ${
                        leave.status === 'Rejected'
                          ? 'text-rose-700'
                          : leave.status === 'Cancelled'
                            ? 'text-slate-600'
                            : 'text-emerald-700'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block">
                        Reason
                      </span>
                      <p className="font-semibold">&ldquo;{leave.response || leave.comments}&rdquo;</p>
                    </div>
                  )}

                  {portalMode === 'employee' && (leave.status === 'Pending' || leave.status === 'Approved') && leave.endDate >= todayKey && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setCancellingLeave(leave);
                          setCancelReason('');
                        }}
                        disabled={isProcessing}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? 'Cancelling...' : 'Cancel leave'}
                      </button>
                    </div>
                  )}

                  {canApproveRejectLeave(user) && leave.status === 'Pending' && (
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
        <div className="hidden md:block flex-1 min-h-0 overflow-y-auto overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <th className="py-3 px-4 font-bold">EMPLOYEE</th>
                <th className="py-3 px-4 font-bold">DEPARTMENT</th>
                <th className="py-3 px-4 font-bold">START DATE</th>
                <th className="py-3 px-4 font-bold">END DATE</th>
                <th className="py-3 px-4 font-bold">DAY</th>
                <th className="py-3 px-4 font-bold">TYPE</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold">REASON</th>
                <th className="py-3 px-4 font-bold text-right">
                  {portalMode === 'admin' ? 'ADMIN ACTION' : 'ACTION'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && leaves.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-lv-d-${idx}`} className="animate-pulse !bg-white hover:!bg-white">
                    <td className="py-3.5 px-4"><div className="w-24 h-3.5 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-12 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-5 bg-slate-100 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-28 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-14 h-6 bg-slate-100 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : displayedLeaves.length === 0 ? (
                <tr className="!bg-white hover:!bg-white">
                  <td
                    colSpan={9}
                    className="py-14 text-center text-slate-500 font-medium !bg-white hover:!bg-white"
                  >
                    {leaves.length === 0 ? (
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">No Leave Requests Recorded</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Apply for personal, sick, or casual leave using the button below.
                          </p>
                        </div>
                        {!adminHasNoLeave && (
                        <button
                          type="button"
                          onClick={onOpenApplyModal}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Apply Leave</span>
                        </button>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">No Matching Leave Requests</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            No leave applications match &quot;{search || statusFilter}&quot;.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('All');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Filters</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedLeaves.map((leave) => {
                  const isProcessing = processingId === leave.id;
                  const isExpanded = expandedLeaveId === leave.id;
                  const dayDetails = getLeaveDayDetails(leave);
                  const avatarUrl = getLeaveAvatar(leave);
                  return (
                    <React.Fragment key={leave.id}>
                    <tr
                      onClick={() => toggleExpandRow(leave.id)}
                      className={`transition-colors cursor-pointer ${
                        isExpanded ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-4 font-normal text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 shrink-0 overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={leave.employeeName || 'Employee'} className="w-full h-full object-cover" />
                            ) : (
                              leave.employeeName?.[0] || 'E'
                            )}
                          </div>
                          <span>{leave.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-700">
                        {leave.departmentName || '--'}
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-700 whitespace-nowrap">
                        {formatLeaveDate(leave.startDate)}
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-700 whitespace-nowrap">
                        {formatLeaveDate(leave.endDate)}
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-700">
                        <span>
                          {leave.daysCount} {leave.daysCount === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-700">
                        {leave.leaveType}
                      </td>
                      <td className="py-3 px-4 font-normal">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-normal ${leave.status === 'Approved'
                            ? 'text-emerald-700'
                            : leave.status === 'Pending'
                              ? 'text-amber-700'
                              : leave.status === 'Cancelled'
                                ? 'text-slate-600'
                                : 'text-rose-700'
                            }`}
                        >
                          {leave.status === 'Approved' && <Check className="w-3 h-3 stroke-[2.5]" />}
                          {leave.status === 'Pending' && <Clock className="w-3 h-3 stroke-[2]" />}
                          {leave.status === 'Rejected' && <X className="w-3 h-3 stroke-[2.5]" />}
                          <span>{leave.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-700 max-w-xs">
                        {portalMode === 'admin' ? (
                          <div className="truncate" title={`Employee Reason: ${leave.reason || '--'}`}>
                            <span className="text-slate-700 font-normal text-xs">{leave.reason || '--'}</span>
                          </div>
                        ) : (leave.response || leave.comments) ? (
                          <div
                            className={`truncate text-xs font-normal ${
                              leave.status === 'Rejected'
                                ? 'text-rose-700'
                                : leave.status === 'Cancelled'
                                  ? 'text-slate-600'
                                  : 'text-emerald-700'
                            }`}
                            title={leave.response || leave.comments}
                          >
                            {leave.response || leave.comments}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">--</span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {portalMode === 'employee' && (leave.status === 'Pending' || leave.status === 'Approved') && leave.endDate >= todayKey && (
                            <button
                              onClick={() => {
                                setCancellingLeave(leave);
                                setCancelReason('');
                              }}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isProcessing ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                          {canApproveRejectLeave(user) && leave.status === 'Pending' && (
                            <>
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
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                    <tr className={isExpanded ? 'bg-slate-50/80' : 'border-0'}>
                      <td colSpan={9} className="p-0 border-0">
                        <div
                          className={`grid transition-all duration-200 ease-out ${
                            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70">
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {dayDetails.map((d, idx) => (
                                  <div
                                    key={`${leave.id}-day-${idx}`}
                                    className="px-3 py-2 rounded-xl bg-white border border-slate-200/90 flex flex-col gap-0.5"
                                  >
                                    <span className="text-[11px] font-bold text-slate-800">{d.date}</span>
                                    <span
                                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                                        d.isHalf ? 'text-amber-700' : 'text-emerald-700'
                                      }`}
                                    >
                                      {d.isHalf && <Sun className="w-3 h-3 text-amber-600 shrink-0" />}
                                      <span>{d.label}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {displayedLeaves.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span>
                Showing <span className="font-bold text-slate-800">{displayedLeaves.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
                <span className="font-bold text-slate-800">{displayedLeaves.length}</span> records
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Rows:</span>
                <select
                  aria-label="Rows per page"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2d6a4f] cursor-pointer"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
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
                      type="button"
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isActive
                          ? 'bg-[#2d6a4f] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal Dialog */}
      {approvingLeave && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setApprovingLeave(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Approve Leave Application
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Confirm manager approval
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingLeave(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to approve the leave application for{' '}
                <strong className="text-slate-900">{approvingLeave.employeeName}</strong>?
              </p>

              {/* Leave Details Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Leave Type:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {approvingLeave.leaveType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">
                    {approvingLeave.startDate} to {approvingLeave.endDate} ({approvingLeave.daysCount} {approvingLeave.daysCount === 1 ? 'day' : 'days'})
                    {approvingLeave.isHalfDay ? (
                      <span className="ml-1 text-amber-700 font-semibold">• Half Day ({approvingLeave.halfDaySession === 'SECOND_HALF' ? '2nd Half' : '1st Half'})</span>
                    ) : (
                      <span className="ml-1 text-emerald-700 font-semibold">• Full Day</span>
                    )}
                  </span>
                </div>
                {Array.isArray(approvingLeave.days) && approvingLeave.days.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/60 text-[11px]">
                    <span className="font-semibold text-slate-500 block mb-1">Date-Wise Breakdown:</span>
                    <div className="flex flex-wrap gap-1">
                      {approvingLeave.days.map((d, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[10px]">
                          {d.date}: <strong className="text-slate-900">{d.portion || 'Full Day'}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {approvingLeave.departmentName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Department:</span>
                    <span className="font-medium text-slate-700">{approvingLeave.departmentName}</span>
                  </div>
                )}
                {approvingLeave.reason && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="font-semibold text-slate-500 block mb-1">Reason:</span>
                    <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      &ldquo;{approvingLeave.reason}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Approval Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  placeholder="e.g. Approved by HR Administration"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setApprovingLeave(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={processingId === approvingLeave.id}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {processingId === approvingLeave.id ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancellingLeave && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancellingLeave(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel leave</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cancellingLeave.leaveType} · {cancellingLeave.startDate} to {cancellingLeave.endDate}</p>
              </div>
              <button type="button" onClick={() => setCancellingLeave(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400"
                placeholder="Why are you cancelling this leave?"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setCancellingLeave(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">
                Close
              </button>
              <button
                type="button"
                onClick={handleCancelLeave}
                disabled={processingId === cancellingLeave.id || !cancelReason.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {processingId === cancellingLeave.id ? 'Cancelling...' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {rejectingLeave && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectingLeave(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <X className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Reject Leave Application
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Decline employee request
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingLeave(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are about to reject the leave application for{' '}
                <strong className="text-slate-900">{rejectingLeave.employeeName}</strong> (
                {rejectingLeave.leaveType}, {rejectingLeave.daysCount} {rejectingLeave.daysCount === 1 ? 'day' : 'days'}{rejectingLeave.isHalfDay ? ' • Half Day' : ' • Full Day'}).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rejection Remarks (Shared with employee):
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  placeholder="Enter detailed reason for rejection..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setRejectingLeave(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingId === rejectingLeave.id}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {processingId === rejectingLeave.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Leave Types Management Modal (Accessible by Admin, HR, Employee, Manager) */}
      {isLeaveTypesModalOpen && (
        <div
          onClick={() => setIsLeaveTypesModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <List className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">Manage Leave Types</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Configure company leave categories.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLeaveTypesModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              {/* Role restriction banner for non-admin/hr */}
              {!isAdminOrHr && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Company leave categories and annual allowances. (View only)</span>
                </div>
              )}

              {/* Add New Leave Type Form (Admin & HR only) */}
              {isAdminOrHr && (
                <form onSubmit={handleCreateLeaveType} className="space-y-2 p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Add Leave Type</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newLeaveTypeName}
                        onChange={(e) => setNewLeaveTypeName(e.target.value)}
                        placeholder="Leave type name (e.g. Privilege)..."
                        disabled={isSubmittingLeaveType}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={newLeaveTypeDays}
                        onChange={(e) => setNewLeaveTypeDays(e.target.value)}
                        placeholder="Days / Year"
                        disabled={isSubmittingLeaveType}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingLeaveType || !newLeaveTypeName.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      {isSubmittingLeaveType ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add Leave Type</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Leave Types List */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configured Types</h4>
              {leaveTypesLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Loading leave types from server...</span>
                </div>
              ) : leaveTypesList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No leave types created yet. Add one above.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {leaveTypesList.map((lt) => (
                    <div key={lt.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/70">
                      {editingLeaveTypeId === lt.id ? (
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={editingLeaveTypeName}
                            onChange={(e) => setEditingLeaveTypeName(e.target.value)}
                            placeholder="Leave type name"
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="365"
                              value={editingLeaveTypeDays}
                              onChange={(e) => setEditingLeaveTypeDays(e.target.value)}
                              placeholder="Days/Yr"
                              className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Days/Yr</span>
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleUpdateLeaveType(lt.id)}
                              disabled={isSubmittingLeaveType || !editingLeaveTypeName.trim()}
                              className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {isSubmittingLeaveType ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <span>Save</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLeaveTypeId(null);
                                setEditingLeaveTypeName('');
                                setEditingLeaveTypeDays('12');
                              }}
                              disabled={isSubmittingLeaveType}
                              className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-100 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-xs text-slate-800">{lt.name}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {lt.daysPerYear ?? lt.daysAllowed ?? 0} Days/Year
                            </span>
                          </div>
                          {isAdminOrHr && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLeaveTypeId(lt.id);
                                  setEditingLeaveTypeName(lt.name);
                                  setEditingLeaveTypeDays(String(lt.daysPerYear ?? lt.daysAllowed ?? 12));
                                }}
                                disabled={isSubmittingLeaveType || deletingLeaveTypeId !== null}
                                className="p-1.5 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 cursor-pointer transition-colors"
                                title="Edit leave type"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLeaveType((lt as any).slug || lt.id, lt.name, lt)}
                                disabled={isSubmittingLeaveType || deletingLeaveTypeId !== null}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 cursor-pointer transition-colors"
                                title="Delete leave type"
                              >
                                {deletingLeaveTypeId === lt.id || (Boolean((lt as any).slug) && deletingLeaveTypeId === (lt as any).slug) ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsLeaveTypesModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
