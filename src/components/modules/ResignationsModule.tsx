'use client';

import React, { useState, useEffect } from 'react';
import {
  LogOut,
  CheckCircle,
  Clock,
  Check,
  FileText,
  Plus,
  Printer,
  X,
  AlertCircle,
  Building,
  Search,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Send,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Resignation, Employee } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface ResignationsModuleProps {
  portalMode?: 'employee' | 'admin';
}

export const ResignationsModule: React.FC<ResignationsModuleProps> = ({ portalMode: propPortalMode }) => {
  const { user, portalMode: authPortalMode } = useAuth();
  const { showToast } = useSocket();

  const currentPortal = propPortalMode || authPortalMode || 'employee';
  const isEmployeeView = currentPortal === 'employee';

  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Admin filter & search
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states (Used by employee & admin modal)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [resigningEmpId, setResigningEmpId] = useState('');
  const [noticeDays, setNoticeDays] = useState(30);
  const [reason, setReason] = useState('');

  // Modal: Relieving Letter
  const [relievingLetterItem, setRelievingLetterItem] = useState<Resignation | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, empData] = await Promise.all([api.getResignations(), api.getEmployees()]);
      setResignations(resData || []);
      setEmployees(empData || []);
      if (empData && empData.length > 0 && !resigningEmpId) {
        setResigningEmpId(user.employeeId || empData[0].id);
      }
    } catch (err) {
      console.error('Failed to load resignations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Determine current logged in employee record
  const currentEmpId = user.employeeId || user.id || '';
  const currentEmp = employees.find(
    (e) =>
      e.id === currentEmpId ||
      e.employeeCode === currentEmpId ||
      (user.email && e.email?.toLowerCase() === user.email.toLowerCase())
  );
  const effectiveEmpId = currentEmp?.id || currentEmpId;

  // Filter resignation for employee view
  const myResignation = resignations.find(
    (r) =>
      r.employeeId === effectiveEmpId ||
      r.employeeId === currentEmpId ||
      r.employeeCode === (currentEmp?.employeeCode || (user as any).employeeCode) ||
      (r.employeeName && user.firstName && r.employeeName.toLowerCase().includes(user.firstName.toLowerCase()))
  );

  // Calculate projected last working day
  const calculateLastWorkingDay = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().split('T')[0];
  };

  // Submit resignation (Employee self-service or Admin filing)
  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast({ type: 'warning', title: 'Reason required', message: 'Please provide a reason for resignation.' });
      return;
    }

    const targetId = isEmployeeView ? effectiveEmpId : (resigningEmpId || effectiveEmpId);
    if (!targetId) {
      showToast({ type: 'error', title: 'Missing Employee ID', message: 'Could not identify employee record.' });
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.submitResignation({
        employeeId: targetId,
        reason: reason.trim(),
        noticePeriodDays: Number(noticeDays) || 30,
      });

      setResignations((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      showToast({
        type: 'success',
        title: 'Resignation Submitted',
        message: 'Resignation request submitted to Admin successfully!',
      });

      setIsSubmitOpen(false);
      setReason('');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Submission Failed', message: err.message || 'Could not file resignation.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Complete Approval by Admin
  const handleApproveResignation = async (resId: string) => {
    setApprovingId(resId);
    try {
      const actorName = `${user.firstName || 'HR'} ${user.lastName || 'Admin'}`;
      const updated = await api.approveResignation(resId, actorName);

      setResignations((prev) => prev.map((r) => (r.id === resId ? { ...r, ...updated, status: 'Completed' } : r)));
      showToast({
        type: 'success',
        title: 'Resignation Approved',
        message: 'Resignation approved! All department clearances marked complete and employee status updated to Resigned.',
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Approval Failed', message: err.message || 'Could not approve resignation.' });
    } finally {
      setApprovingId(null);
    }
  };

  // Individual clearance item toggle by Admin
  const handleToggleClearance = async (res: Resignation, key: keyof Resignation['clearance']) => {
    const updatedClearance = {
      ...res.clearance,
      [key]: !res.clearance[key],
    };

    try {
      const actorName = `${user.firstName || 'HR'} ${user.lastName || 'Admin'}`;
      const updated = await api.updateResignationClearance(res.id, {
        clearance: updatedClearance,
        actorName,
      });

      setResignations((prev) => prev.map((r) => (r.id === res.id ? { ...r, ...updated } : r)));
      showToast({
        type: 'success',
        title: 'Clearance Updated',
        message: `Updated clearance workflow item.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message || 'Could not update clearance.' });
    }
  };

  // Filtered resignations for Admin view
  const filteredResignations = resignations.filter((res) => {
    if (filterTab === 'pending' && res.status === 'Completed') return false;
    if (filterTab === 'completed' && res.status !== 'Completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = res.employeeName?.toLowerCase().includes(q);
      const matchCode = res.employeeCode?.toLowerCase().includes(q);
      const matchDept = res.departmentName?.toLowerCase().includes(q);
      const matchReason = res.reason?.toLowerCase().includes(q);
      return matchName || matchCode || matchDept || matchReason;
    }
    return true;
  });

  const pendingCount = resignations.filter((r) => r.status !== 'Completed').length;
  const completedCount = resignations.filter((r) => r.status === 'Completed').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Module Title & Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <LogOut className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEmployeeView ? 'My Resignation & Exit Pipeline' : 'Resignations & Exit Clearances'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEmployeeView
                  ? 'Submit formal resignation to HR Administration, monitor clearance status, and download relieving certificate.'
                  : 'Review employee resignation filings, approve exit requests, conduct department handoffs, and issue relieving letters.'}
              </p>
            </div>
          </div>
        </div>

        {!isEmployeeView && (
          <button
            onClick={() => {
              setResigningEmpId(employees[0]?.id || 'emp-1');
              setIsSubmitOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>File Employee Resignation</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EMPLOYEE PORTAL VIEW                                                      */}
      {/* ========================================================================= */}
      {isEmployeeView && (
        <div className="space-y-6">
          {myResignation ? (
            /* Active / Completed Resignation Card for Employee */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        myResignation.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {myResignation.status === 'Completed' ? '✓ Resignation Approved & Completed' : '⏳ Submitted (Pending Admin Clearance)'}
                    </span>
                    <span className="text-xs text-slate-400">ID: {myResignation.id}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {myResignation.employeeName} ({myResignation.employeeCode})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Department: <strong>{myResignation.departmentName || currentEmp?.departmentName || 'General'}</strong> • Filed on <strong>{myResignation.resignationDate}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Expected Last Working Day
                  </span>
                  <span className="text-lg font-black text-slate-900">{myResignation.lastWorkingDay}</span>
                  <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                    Notice: {myResignation.noticePeriodDays} Days
                  </span>
                </div>
              </div>

              {/* Stated Exit Reason */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block">
                  Your Stated Exit Reason:
                </span>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{myResignation.reason}&rdquo;
                </p>
              </div>

              {/* Multi-Department Clearance Pipeline (Read-Only for Employee) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Exit Clearance Tracking Status
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    {[
                      myResignation.clearance?.departmentClearance,
                      myResignation.clearance?.assetReturned,
                      myResignation.clearance?.financeSettlement,
                      myResignation.clearance?.exitInterviewCompleted,
                    ].filter(Boolean).length}{' '}
                    of 4 Cleared
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { key: 'departmentClearance' as const, label: '1. Department Handover', desc: 'Knowledge transfer & handoff' },
                    { key: 'assetReturned' as const, label: '2. IT Asset Return', desc: 'Laptop, ID card & hardware' },
                    { key: 'financeSettlement' as const, label: '3. Finance Settlement', desc: 'Full & final payroll settlement' },
                    { key: 'exitInterviewCompleted' as const, label: '4. Exit Interview', desc: 'HR exit review & feedback' },
                  ].map(({ key, label, desc }) => {
                    const done = Boolean(myResignation.clearance?.[key]);
                    return (
                      <div
                        key={key}
                        className={`p-4 rounded-2xl border transition-all ${
                          done
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold">{label}</span>
                          {done ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Cleared
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completed Banner & Relieving Certificate */}
              {myResignation.status === 'Completed' ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      All Exit Clearances Signed Off & Approved!
                    </h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Your formal resignation has been processed and approved by Administration. Your relieving and service certificate has been generated.
                    </p>
                  </div>
                  <button
                    onClick={() => setRelievingLetterItem(myResignation)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View & Print Relieving Letter</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    Your resignation is currently pending Admin clearance approval. Once HR Admin marks all clearances completed, your status will update and your official Relieving Letter will be available here.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Employee Resignation Submission Form */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <span className="text-[11px] font-extrabold uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Employee Self-Service
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  Submit Resignation Request to Admin
                </h2>
                <p className="text-xs text-slate-500">
                  Please fill out the form below to file your formal resignation. This will notify HR Administration and begin your exit clearance pipeline.
                </p>
              </div>

              {/* Employee Quick Info Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  {user.firstName?.[0] || 'E'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {user.firstName || 'Employee'} {user.lastName || ''} ({currentEmp?.employeeCode || (user as any).employeeCode || effectiveEmpId})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Department: {currentEmp?.departmentName || 'Engineering & Operations'} • Employee ID: {effectiveEmpId}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitResignation} className="space-y-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Agreed Notice Period (Days) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition"
                  >
                    <option value={15}>15 Days (Accelerated Release)</option>
                    <option value={30}>30 Days (Standard Notice Period)</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days (Senior Level / Leadership)</option>
                    <option value={90}>90 Days (Executive)</option>
                  </select>
                  <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Calculated Last Working Day: <strong>{calculateLastWorkingDay(noticeDays)}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Reason for Resignation <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please explain the reason for your resignation (e.g., career advancement, higher education, personal relocation, health)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your reason will be recorded in the audit trail and shared with HR Administration for clearance processing.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !reason.trim()}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting to Admin...' : 'Submit Resignation to Admin'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN PORTAL VIEW                                                         */}
      {/* ========================================================================= */}
      {!isEmployeeView && (
        <div className="space-y-6">
          {/* Admin Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Resignations
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{resignations.length}</span>
              <span className="text-[11px] text-slate-400">Total recorded filings</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Pending Clearance
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingCount}</span>
              <span className="text-[11px] text-slate-400">Awaiting clearance / approval</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Approved & Completed
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{completedCount}</span>
              <span className="text-[11px] text-slate-400">Relieving certificates issued</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Filings ({resignations.length})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'pending' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'completed' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by employee name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-900 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Resignations List */}
          {filteredResignations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No resignation records found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No resignation filings match the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredResignations.map((res) => {
                const isCompleted = res.status === 'Completed';
                const isApproving = approvingId === res.id;
                return (
                  <div
                    key={res.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {isCompleted ? '✓ Completed / Relieved' : '⏳ Clearance Pending'}
                          </span>
                          <span className="text-[11px] text-slate-400">ID: {res.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                          {res.employeeName} ({res.employeeCode})
                        </h3>
                        <p className="text-xs text-slate-500">
                          {res.departmentName || 'General'} • Resigned on {res.resignationDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                            Last Working Day
                          </span>
                          <span className="text-base font-extrabold text-slate-900">{res.lastWorkingDay}</span>
                          <span className="text-xs text-emerald-600 font-semibold block">Notice: {res.noticePeriodDays} Days</span>
                        </div>

                        {/* Admin 1-Click Approve Button */}
                        {!isCompleted && (
                          <button
                            type="button"
                            disabled={isApproving}
                            onClick={() => handleApproveResignation(res.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{isApproving ? 'Approving...' : 'Approve Resignation'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stated Reason */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
                      <span className="font-bold block text-slate-800 mb-0.5">Stated Exit Reason:</span>
                      <p className="italic">&ldquo;{res.reason}&rdquo;</p>
                    </div>

                    {/* Interactive Clearance Checklist for Admin */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                          Exit Clearance Workflow Checklist (Click to Toggle)
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500">
                          {[
                            res.clearance?.departmentClearance,
                            res.clearance?.assetReturned,
                            res.clearance?.financeSettlement,
                            res.clearance?.exitInterviewCompleted,
                          ].filter(Boolean).length}{' '}
                          / 4 Complete
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {[
                          { key: 'departmentClearance' as const, label: '1. Department Handover' },
                          { key: 'assetReturned' as const, label: '2. IT Asset Return' },
                          { key: 'financeSettlement' as const, label: '3. Finance Settlement' },
                          { key: 'exitInterviewCompleted' as const, label: '4. Exit Interview' },
                        ].map(({ key, label }) => {
                          const done = res.clearance?.[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleToggleClearance(res, key)}
                              className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                                done
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-xs font-bold">{label}</span>
                              {done ? (
                                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Completed Clearance Banner & Relieving Letter */}
                    {isCompleted && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" /> Exit Clearances 100% Completed
                          </h5>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Employee marked as Resigned in roster. Ready to generate Relieving and Service Certificate.
                          </p>
                        </div>
                        <button
                          onClick={() => setRelievingLetterItem(res)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Relieving Letter</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: File Resignation on Behalf of Employee (Admin)                     */}
      {/* ========================================================================= */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <LogOut className="w-5 h-5 text-emerald-600" />
                File Employee Resignation
              </h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResignation} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={resigningEmpId}
                  onChange={(e) => setResigningEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
                <select
                  value={noticeDays}
                  onChange={(e) => setNoticeDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  <option value={15}>15 Days (Accelerated)</option>
                  <option value={30}>30 Days (Standard Notice)</option>
                  <option value={45}>45 Days</option>
                  <option value={60}>60 Days (Senior Executive)</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Exit Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State reason for resignation (career advancement, relocation, further studies...)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm & File Resignation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Printable Relieving & Experience Certificate                       */}
      {/* ========================================================================= */}
      {relievingLetterItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-base">Service & Relieving Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letter</span>
                </button>
                <button
                  onClick={() => setRelievingLetterItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Certificate Format */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-4 leading-relaxed font-serif">
              <div className="text-center pb-3 border-b border-slate-200">
                <h4 className="font-black text-slate-900 text-base tracking-wide font-sans">
                  PANELIYA TECHNOLOGY INC.
                </h4>
                <p className="text-[10px] text-slate-500 font-sans">
                  Enterprise Cloud & Next-Gen Software Engineering
                </p>
              </div>

              <div className="flex justify-between font-sans text-[11px] font-semibold text-slate-500">
                <span>Ref: PTI/REL/{relievingLetterItem.employeeCode}/2026</span>
                <span>Date: {relievingLetterItem.lastWorkingDay}</span>
              </div>

              <h5 className="font-bold text-slate-900 text-sm text-center font-sans uppercase underline tracking-wider pt-2">
                TO WHOMSOEVER IT MAY CONCERN
              </h5>

              <p>
                This is to certify that <strong>{relievingLetterItem.employeeName}</strong> (Employee ID:{' '}
                <strong>{relievingLetterItem.employeeCode}</strong>) was employed with{' '}
                <strong>Paneliya Technology Inc.</strong> in the department of{' '}
                <strong>{relievingLetterItem.departmentName || 'Engineering & Operations'}</strong>.
              </p>

              <p>
                {relievingLetterItem.employeeName} tendered resignation on{' '}
                <strong>{relievingLetterItem.resignationDate}</strong> and has been formally relieved of all duties
                and responsibilities with effect from the close of business hours on{' '}
                <strong>{relievingLetterItem.lastWorkingDay}</strong> after successfully fulfilling all departmental
                handover, IT equipment return, and financial settlements.
              </p>

              <p>
                During the tenure with Paneliya Technology, conduct and professional dedication were found to be
                exemplary. We wish {relievingLetterItem.employeeName} every success in all future professional
                endeavors.
              </p>

              <div className="pt-6 font-sans text-xs">
                <p className="font-bold text-slate-900">For Paneliya Technology Inc.</p>
                <div className="mt-8">
                  <p className="font-bold text-slate-800">Authorized Signatory</p>
                  <p className="text-slate-500 text-[11px]">Human Resources & Operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
