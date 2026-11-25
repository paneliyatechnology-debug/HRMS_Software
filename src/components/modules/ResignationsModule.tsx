'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Users,
  CheckSquare,
  X,
  Send,
  Loader2,
  Calendar,
  Laptop,
  CreditCard,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface ResignationsModuleProps {
  portalMode?: 'employee' | 'admin';
}

interface ResignationItem {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  designationTitle?: string;
  reason: string;
  status: 'Pending' | 'Notice Period' | 'Clearance' | 'Approved' | 'Relieved' | string;
  noticePeriodDays?: number;
  noticeAssigned?: boolean;
  submittedAt?: string;
  lastWorkingDay?: string;
  clearance?: {
    itAssets?: boolean;
    finance?: boolean;
    hrExit?: boolean;
    handover?: boolean;
    [key: string]: boolean | undefined;
  };
  approvedAt?: string;
  approvedBy?: string;
}

export const ResignationsModule: React.FC<ResignationsModuleProps> = ({
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const userRole = (user?.role || 'EMPLOYEE').toUpperCase();
  const isAdminOrHr = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR' || userRole === 'HR_ADMIN';

  const [resignations, setResignations] = useState<ResignationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ResignationItem | null>(null);
  const [approveConfirmRecord, setApproveConfirmRecord] = useState<ResignationItem | null>(null);

  // Form states
  const [fileReason, setFileReason] = useState('');
  const [assignNoticeDays, setAssignNoticeDays] = useState(30);
  const [clearanceState, setClearanceState] = useState<{
    itAssets: boolean;
    finance: boolean;
    hrExit: boolean;
    handover: boolean;
  }>({
    itAssets: false,
    finance: false,
    hrExit: false,
    handover: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch resignations
  const loadResignations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getResignations();
      const rows = Array.isArray(data) ? data : [];
      const formatted: ResignationItem[] = rows.map((r: any) => ({
        id: String(r.id || r._id || Math.random()),
        employeeId: String(r.employeeId || r.userId || ''),
        employeeName: r.employeeName || (r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : 'Staff Member'),
        employeeCode: r.employeeCode || r.user?.employeeCode || 'EMP',
        departmentName: r.departmentName || r.department || r.user?.departmentName || 'General',
        designationTitle: r.designationTitle || r.designation || r.user?.designationTitle || 'Employee',
        reason: r.reason || 'No reason provided',
        status: r.status === 'Completed' || r.approvedAt ? 'Completed' : r.noticeAssigned ? 'Notice Period' : (r.status || 'Submitted'),
        noticePeriodDays: Number(r.noticePeriodDays || 0),
        noticeAssigned: Boolean(r.noticeAssigned),
        submittedAt: r.submittedAt || r.createdAt || new Date().toISOString(),
        lastWorkingDay: r.lastWorkingDay || r.effectiveDate || '',
        clearance: typeof r.clearance === 'object' && r.clearance ? r.clearance : {},
        approvedAt: r.approvedAt,
        approvedBy: r.approvedBy,
      }));
      setResignations(formatted);
    } catch (err: any) {
      setError(err?.message || 'Could not load resignations from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResignations();
  }, [loadResignations]);

  // File Resignation Submit
  const handleFileResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileReason.trim()) {
      setActionError('Please state the reason for separation.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.submitResignation({
        employeeId: user?.id,
        reason: fileReason.trim(),
      });

      setSuccessToast('Your resignation has been formally submitted to Human Resources.');
      setTimeout(() => setSuccessToast(null), 4000);
      setIsFileModalOpen(false);
      setFileReason('');
      await loadResignations();
    } catch (err: any) {
      setActionError(err?.message || 'Could not file resignation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign Notice Period Submit
  const handleAssignNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.assignResignationNotice(selectedRecord.id, assignNoticeDays);
      setSuccessToast(`Notice period of ${assignNoticeDays} days assigned successfully.`);
      setTimeout(() => setSuccessToast(null), 3000);
      setIsNoticeModalOpen(false);
      setSelectedRecord(null);
      await loadResignations();
    } catch (err: any) {
      setActionError(err?.message || 'Could not assign notice period.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Clearance Submit
  const handleUpdateClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.updateResignationClearance(selectedRecord.id, {
        clearance: clearanceState,
        actorName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'HR Admin',
      });

      setSuccessToast('Departmental clearance checklist updated.');
      setTimeout(() => setSuccessToast(null), 3000);
      setIsClearanceModalOpen(false);
      setSelectedRecord(null);
      await loadResignations();
    } catch (err: any) {
      setActionError(err?.message || 'Could not update clearance checklist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Approve Confirmation Popup
  const handleApproveResignation = (record: ResignationItem) => {
    setActionError(null);
    setApproveConfirmRecord(record);
  };

  // Confirm & Execute Resignation Approval
  const confirmApproveResignation = async () => {
    const record = approveConfirmRecord;
    if (!record) return;

    const actor = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'HR Admin';
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await api.approveResignation(record.id, actor);
      const isAlready = res?.alreadyApproved;

      setResignations((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                status: 'Approved',
                approvedAt: item.approvedAt || new Date().toISOString(),
                approvedBy: item.approvedBy || actor,
              }
            : item
        )
      );

      setApproveConfirmRecord(null);
      setSuccessToast(
        isAlready
          ? `${record.employeeName}'s resignation is already approved.`
          : `Resignation approved and employee separation confirmed.`
      );
      setTimeout(() => setSuccessToast(null), 3500);
      await loadResignations();
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('already approved') || errMsg.toLowerCase().includes('already')) {
        setApproveConfirmRecord(null);
        setSuccessToast(`${record.employeeName}'s resignation is already approved.`);
        setTimeout(() => setSuccessToast(null), 3500);
        await loadResignations();
        return;
      }
      setActionError(errMsg || 'Could not approve resignation.');
      await loadResignations();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Clearance Modal
  const openClearanceModal = (rec: ResignationItem) => {
    setSelectedRecord(rec);
    setClearanceState({
      itAssets: Boolean(rec.clearance?.itAssets),
      finance: Boolean(rec.clearance?.finance),
      hrExit: Boolean(rec.clearance?.hrExit),
      handover: Boolean(rec.clearance?.handover),
    });
    setIsClearanceModalOpen(true);
  };

  // Open Notice Modal
  const openNoticeModal = (rec: ResignationItem) => {
    setSelectedRecord(rec);
    setAssignNoticeDays(rec.noticePeriodDays || 30);
    setIsNoticeModalOpen(true);
  };

  // My own resignation record if employee
  const myResignation = resignations.find(
    (r) =>
      r.employeeId === user?.id ||
      r.employeeId === (user as any)?.userId ||
      (user?.employeeCode && r.employeeCode === user.employeeCode)
  );

  // Filtered Resignations for Admin Table
  const filteredResignations = resignations.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rec.employeeName?.toLowerCase().includes(q) ||
      rec.employeeCode?.toLowerCase().includes(q) ||
      rec.reason.toLowerCase().includes(q);
    const recStatus = (rec.status || '').toUpperCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APPROVED' && (recStatus.includes('APPROV') || recStatus.includes('RELIEV') || recStatus.includes('COMPLET'))) ||
      (statusFilter === 'NOTICE PERIOD' && recStatus.includes('NOTICE')) ||
      (statusFilter === 'CLEARANCE' && recStatus.includes('CLEARANCE')) ||
      (statusFilter === 'PENDING' && (recStatus.includes('PENDING') || recStatus.includes('SUBMIT')));
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('APPROV') || s.includes('RELIEV') || s.includes('COMPLET')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Approved / Relieved
        </span>
      );
    }
    if (s.includes('CLEARANCE')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          Clearance In Progress
        </span>
      );
    }
    if (s.includes('NOTICE') || s.includes('ON_NOTICE')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3 text-amber-600" />
          Serving Notice
        </span>
      );
    }
    if (s.includes('REJECT')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit">
        Pending Review
      </span>
    );
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto select-none">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-900 text-white shadow-xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
                </div>
              )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-md shrink-0">
              <LogOut className="w-6 h-6" />
                </div>
                <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Resignations &amp; Clearance</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {resignations.length} {resignations.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff separation workflows, notice period management, clearance checklist, and relieving letters
                  </p>
                </div>
              </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={loadResignations}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Refresh Resignations"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

                  <button
              type="button"
              onClick={() => setIsFileModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>File Resignation</span>
                  </button>
                </div>
            </div>

        {/* Quick KPI Stat Bar for Admin/HR */}
        {isAdminOrHr && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Separations</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{resignations.length}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700">Serving Notice</span>
              <p className="text-lg font-bold text-amber-800 mt-0.5">
                {resignations.filter((r) => (r.status || '').toUpperCase().includes('NOTICE')).length}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-700">Under Clearance</span>
              <p className="text-lg font-bold text-blue-800 mt-0.5">
                {resignations.filter((r) => (r.status || '').toUpperCase().includes('CLEARANCE')).length}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Approved / Relieved</span>
              <p className="text-lg font-bold text-emerald-800 mt-0.5">
                {resignations.filter((r) => {
                  const s = (r.status || '').toUpperCase();
                  return s.includes('APPROV') || s.includes('RELIEV') || s.includes('COMPLET') || Boolean(r.approvedAt);
                }).length}
              </p>
            </div>
          </div>
        )}
          </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <Loader2 className="w-7 h-7 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading separation records...</p>
          <p className="text-[11px] text-slate-400">Querying organization resignation and clearance status</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 text-rose-800 space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-600 mx-auto" />
          <p className="text-xs font-bold">{error}</p>
              <button
            type="button"
            onClick={loadResignations}
            className="px-4 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition cursor-pointer"
          >
            Retry Loading
              </button>
            </div>
      ) : isAdminOrHr ? (
        /* ADMIN & HR VIEW: Full Workforce Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Table Header Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by employee name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="NOTICE PERIOD">Serving Notice</option>
                <option value="CLEARANCE">Clearance In Progress</option>
                <option value="APPROVED">Approved / Relieved</option>
              </select>
            </div>
          </div>

          {filteredResignations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Resignation Records Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No separation requests match your selected filters.'
                  : 'There are currently no resignation or clearance requests on file.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">EMPLOYEE</th>
                    <th className="py-2.5 px-4 font-medium">REASON FOR RESIGNATION</th>
                    <th className="py-2.5 px-4 font-medium">NOTICE PERIOD</th>
                    <th className="py-2.5 px-4 font-medium">CLEARANCE PROGRESS</th>
                    <th className="py-2.5 px-4 font-medium">STATUS</th>
                    <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResignations.map((rec) => {
                    const cl = rec.clearance || {};
                    const totalChecks = 4;
                    const doneChecks = [cl.itAssets, cl.finance, cl.hrExit, cl.handover].filter(Boolean).length;
                    const recStatusUpper = (rec.status || '').toUpperCase();
                    const isApproved =
                      recStatusUpper.includes('APPROV') ||
                      recStatusUpper.includes('RELIEV') ||
                      recStatusUpper.includes('COMPLET') ||
                      Boolean(rec.approvedAt) ||
                      Boolean(rec.approvedBy);

                return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {rec.employeeName?.[0] || 'E'}
                        </div>
                          <div>
                            <p className="font-bold text-slate-900">{rec.employeeName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {rec.employeeCode} • {rec.departmentName}
                        </p>
                      </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={rec.reason}>
                          {rec.reason}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div className="space-y-0.5">
                            <span className="font-semibold">{rec.noticeAssigned ? `${rec.noticePeriodDays} Days` : 'Not assigned'}</span>
                            {rec.submittedAt && (
                              <p className="text-[10px] text-slate-400">Filed {formatDate(rec.submittedAt)}</p>
                            )}
                        </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                              <span>{doneChecks} / {totalChecks} Cleared</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  doneChecks === totalChecks ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${(doneChecks / totalChecks) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">{getStatusBadge(rec.status)}</td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                              onClick={() => openNoticeModal(rec)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                              title="Assign Notice Days"
                            >
                              Notice
                            </button>

                            <button
                              type="button"
                              onClick={() => openClearanceModal(rec)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                              title="Departmental Clearance Checklist"
                            >
                              Clearance
                            </button>

                            {isApproved ? (
                              <span
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs"
                                title="Resignation Approved"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Approved
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApproveResignation(rec)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs active:scale-95"
                                title="Approve Relieving"
                              >
                                Approve
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
      ) : (
        /* EMPLOYEE / MANAGER PERSONAL VIEW */
        <div className="space-y-5">
          {myResignation ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Your Resignation Case</span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">Separation Status &amp; Relieving</h3>
                </div>
                {getStatusBadge(myResignation.status)}
                    </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Notice Period</span>
                  <p className="text-sm font-bold text-slate-800">
                    {myResignation.noticeAssigned ? `${myResignation.noticePeriodDays} Days` : 'HR or Admin will assign it'}
                  </p>
                  <p className="text-[11px] text-slate-500">Submitted on {formatDate(myResignation.submittedAt)}</p>
                    </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reason on Record</span>
                  <p className="text-xs font-semibold text-slate-700 line-clamp-2">{myResignation.reason}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Approval / Relieving</span>
                  <p className="text-xs font-semibold text-slate-800">
                    {myResignation.approvedAt ? `Relieved on ${formatDate(myResignation.approvedAt)}` : 'In review by HR'}
                  </p>
                </div>
              </div>

              {/* Clearance Checklist Status */}
                    <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Departmental Clearance Progress
                        </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Laptop className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">IT Hardware &amp; Assets Handover</span>
                    </div>
                    {myResignation.clearance?.itAssets ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">Pending Return</span>
                    )}
                      </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Finance &amp; Dues Settlement</span>
                    </div>
                    {myResignation.clearance?.finance ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">Pending Review</span>
                    )}
                      </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">HR Exit Interview</span>
                    </div>
                    {myResignation.clearance?.hrExit ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">Scheduled</span>
                    )}
                    </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Project Knowledge Transfer</span>
                    </div>
                    {myResignation.clearance?.handover ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <LogOut className="w-7 h-7" />
              </div>
                        <div>
                <h3 className="text-base font-bold text-slate-900">No Resignation on File</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  You are currently active in your role. If you plan to tender a formal resignation, you can submit your notice and separation request directly through this portal.
                          </p>
                        </div>
                        <button
                type="button"
                onClick={() => setIsFileModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                <Plus className="w-4 h-4" />
                <span>Submit Separation Request</span>
                        </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: File Resignation Modal */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">File Formal Resignation</h3>
                  <p className="text-[11px] text-slate-400">Submit your separation notice to Human Resources</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFileResignation} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
              </div>
              )}

              <p className="text-xs text-slate-600 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                Notice period is not chosen here. HR or Admin will assign it after this request is filed.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Resignation *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="State your formal reason for leaving, career transition, or personal reasons..."
                  value={fileReason}
                  onChange={(e) => setFileReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Resignation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Notice Period (Admin & HR) */}
      {isNoticeModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
              </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign Notice Period</h3>
                  <p className="text-[11px] text-slate-400">For {selectedRecord.employeeName}</p>
                </div>
              </div>
                <button
                type="button"
                onClick={() => setIsNoticeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleAssignNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Days</label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={assignNoticeDays}
                  onChange={(e) => setAssignNoticeDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Update Notice'}
                </button>
              </div>
            </form>
            </div>
        </div>
      )}

      {/* MODAL 3: Departmental Clearance Checklist (Admin & HR) */}
      {isClearanceModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clearance Checklist</h3>
                  <p className="text-[11px] text-slate-400">Departmental sign-offs for {selectedRecord.employeeName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              </div>

            <form onSubmit={handleUpdateClearance} className="p-6 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearanceState.itAssets}
                    onChange={(e) => setClearanceState((p) => ({ ...p, itAssets: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">IT Hardware &amp; Assets Returned</span>
                    <span className="text-[10px] text-slate-400">Laptop, security keys, monitors and accessories</span>
              </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearanceState.finance}
                    onChange={(e) => setClearanceState((p) => ({ ...p, finance: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Finance Dues &amp; Claims Cleared</span>
                    <span className="text-[10px] text-slate-400">Salary advances, expense reimbursements verified</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearanceState.hrExit}
                    onChange={(e) => setClearanceState((p) => ({ ...p, hrExit: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">HR Exit Interview Completed</span>
                    <span className="text-[10px] text-slate-400">Formal feedback received and documentation archived</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearanceState.handover}
                    onChange={(e) => setClearanceState((p) => ({ ...p, handover: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Knowledge Transfer &amp; Handover</span>
                    <span className="text-[10px] text-slate-400">Project repos, client credentials and documents handed over</span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsClearanceModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Clearance'}
                </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Resignation Confirmation Popup */}
      {approveConfirmRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isSubmitting && setApproveConfirmRecord(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Approve Resignation</h3>
                  <p className="text-[11px] text-slate-400">Confirm employee separation &amp; relieving</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setApproveConfirmRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to approve separation and relieving for{' '}
                <strong className="text-slate-900">{approveConfirmRecord.employeeName}</strong>?
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Employee</span>
                  <span className="font-semibold text-slate-800">{approveConfirmRecord.employeeName}</span>
                </div>
                {approveConfirmRecord.employeeCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Employee ID</span>
                    <span className="font-mono text-slate-700">{approveConfirmRecord.employeeCode}</span>
                  </div>
                )}
                {approveConfirmRecord.lastWorkingDay && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Working Date</span>
                    <span className="font-medium text-slate-800">{approveConfirmRecord.lastWorkingDay}</span>
                  </div>
                )}
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApproveConfirmRecord(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmApproveResignation}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Approving...' : 'Confirm & Approve'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
