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
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Resignation, Employee } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const ResignationsModule: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal: File Resignation
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
      setResignations(resData);
      setEmployees(empData);
      if (empData.length > 0 && !resigningEmpId) {
        setResigningEmpId(user.employeeId || empData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast({ type: 'warning', title: 'Reason required', message: 'Please provide a reason for resignation.' });
      return;
    }
    try {
      const created = await api.submitResignation({
        employeeId: resigningEmpId,
        reason: reason.trim(),
        noticePeriodDays: Number(noticeDays) || 30,
      });

      setResignations((prev) => [created, ...prev]);
      showToast({
        type: 'success',
        title: 'Resignation Submitted',
        message: 'Resignation logged into exit clearance pipeline.',
      });

      setIsSubmitOpen(false);
      setReason('');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Submission Failed', message: err.message || 'Could not file resignation.' });
    }
  };

  const handleToggleClearance = async (res: Resignation, key: keyof Resignation['clearance']) => {
    const updatedClearance = {
      ...res.clearance,
      [key]: !res.clearance[key],
    };

    try {
      const updated = await api.updateResignationClearance(res.id, {
        clearance: updatedClearance,
        actorName: `${user.firstName || 'HR'} ${user.lastName || 'Admin'}`,
      });

      setResignations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast({
        type: 'success',
        title: 'Clearance Updated',
        message: `Updated clearance workflow item.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message || 'Could not update clearance.' });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Resignation & Exit Clearance
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold">
              {resignations.length} Active Filings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Notice period tracking, multi-department clearances, exit surveys, and automated relieving letter generation
          </p>
        </div>

        <button
          onClick={() => {
            setResigningEmpId(user.employeeId || (employees[0]?.id || 'emp-1'));
            setIsSubmitOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Submit Resignation</span>
        </button>
      </div>

      {/* Resignations List */}
      <div className="space-y-6">
        {resignations.map((res) => (
          <div
            key={res.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5 hover:shadow-md transition"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    res.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {res.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {res.employeeName} ({res.employeeCode})
                </h3>
                <p className="text-xs text-slate-400">
                  {res.departmentName} • Resigned on {res.resignationDate}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Last Working Day</span>
                <span className="text-base font-extrabold text-slate-900">
                  {res.lastWorkingDay}
                </span>
                <span className="text-xs text-blue-600 font-semibold block">Notice: {res.noticePeriodDays} Days</span>
              </div>
            </div>

            {/* Stated Reason */}
            <div className="p-3.5 rounded-2xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
              <span className="font-bold block text-slate-800 mb-0.5">Stated Exit Reason:</span>
              <p>{res.reason}</p>
            </div>

            {/* Clearance Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                Exit Clearance Workflow Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { key: 'departmentClearance' as const, label: '1. Department Handover' },
                  { key: 'assetReturned' as const, label: '2. IT Asset Return' },
                  { key: 'financeSettlement' as const, label: '3. Finance Settlement' },
                  { key: 'exitInterviewCompleted' as const, label: '4. Exit Interview' },
                ].map(({ key, label }) => {
                  const done = res.clearance[key];
                  return (
                    <button
                      key={key}
                      onClick={() => handleToggleClearance(res, key)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
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
            {res.status === 'Completed' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Exit Clearances 100% Completed
                  </h5>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    Employee marked as Resigned in roster. Ready to generate Relieving and Service Certificate.
                  </p>
                </div>
                <button
                  onClick={() => setRelievingLetterItem(res)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Relieving Letter</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Submit Resignation */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <LogOut className="w-5 h-5 text-blue-600" />
                Submit Employee Resignation
              </h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResignation} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={resigningEmpId}
                  onChange={(e) => setResigningEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName})
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
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Confirm & File Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Relieving & Experience Letter */}
      {relievingLetterItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900 text-base">Service & Relieving Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letter</span>
                </button>
                <button
                  onClick={() => setRelievingLetterItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                  Enterprise Cloud & Next-Gen Software Engineering • San Francisco, CA
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
                <strong>{relievingLetterItem.departmentName}</strong>.
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
