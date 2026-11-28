'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  Download,
  CheckCircle,
  FileText,
  DollarSign,
  Play,
  X,
  RotateCcw,
  Plus,
  Edit2,
  History,
  Loader2,
  Users,
  Eye,
  PauseCircle,
  PlayCircle,
  XCircle,
  ShieldCheck,
  BarChart3,
  Wallet,
  Search,
} from 'lucide-react';
import { PayrollRecord } from '../../types/hrms';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCompanyLive } from '../../lib/useCompanyLive';

interface PayrollModuleProps {
  payrollRecords: PayrollRecord[];
  onRefresh: () => void;
  loading?: boolean;
}

const inr = (val: unknown) => `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  onRefresh,
  loading: parentLoading = false,
}) => {
  const { user, hasPermission } = useAuth();
  const { showToast } = useSocket();
  const canManage = hasPermission('payroll.manage');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [activeTab, setActiveTab] = useState<'runs' | 'salaries' | 'advances' | 'reports'>('runs');

  const [yearNum, monthNum] = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return [y || new Date().getFullYear(), m || new Date().getMonth() + 1];
  }, [selectedMonth]);

  // Dashboard & Records
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Preview Modal
  const [previewItems, setPreviewItems] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Selected Payslip Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Payment Modal
  const [payingRecord, setPayingRecord] = useState<any | null>(null);
  const [payingBank, setPayingBank] = useState<any | null>(null);
  const [payingBankLoading, setPayingBankLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState('');
  const [payBusy, setPayBusy] = useState(false);

  const openPayModal = (rec: any) => {
    setPayingRecord(rec);
    setPayingBank(null);
    setPayingBankLoading(true);
    api.getBankDetails(rec.userId)
      .then((res) => setPayingBank(res?.bank || null))
      .catch(() => setPayingBank(null))
      .finally(() => setPayingBankLoading(false));
  };

  // Salaries
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loadingSalaries, setLoadingSalaries] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bankDate, setBankDate] = useState('');
  const [savingBankDate, setSavingBankDate] = useState(false);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Configure Salary Modal
  const [editingSalaryEmp, setEditingSalaryEmp] = useState<any | null>(null);
  const [salaryForm, setSalaryForm] = useState({
    userId: '',
    monthlySalary: 25000,
    basicSalary: 12500,
    hra: 5000,
    da: 0,
    otherAllowances: 7500,
    travelAllowance: 0,
    medicalAllowance: 0,
    bonus: 0,
    incentives: 0,
    otherEarnings: 0,
    overtimeRate: 0,
    workingHoursPerDay: 8,
    workingDaysPerMonth: 30,
    pfApplicable: true,
    pfWage: 12500,
    pfWageCeiling: 15000,
    employeePfRate: 12,
    employerPfRate: 12,
    loanDeduction: 0,
    professionalTax: 200,
    tds: 0,
    otherDeductions: 0,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    reason: '',
  });
  const [savingSalary, setSavingSalary] = useState(false);

  // Salary Revision History Modal
  const [revisionEmp, setRevisionEmp] = useState<any | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Advances
  const [advances, setAdvances] = useState<any[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advForm, setAdvForm] = useState({
    userId: '',
    amount: 3000,
    recoveryPerMonth: 3000,
    advanceDate: new Date().toISOString().slice(0, 10),
    reason: '',
  });
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Reports
  const [deptReport, setDeptReport] = useState<any[]>([]);
  const [pfReport, setPfReport] = useState<any | null>(null);
  const [yearlyReport, setYearlyReport] = useState<any | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadRunsAndDashboard = async () => {
    try {
      const [payslipsRes, dashRes] = await Promise.all([
        api.listPayslips(false, { year: yearNum, month: monthNum }),
        canManage ? api.getPayrollDashboard(yearNum, monthNum).catch(() => null) : Promise.resolve(null),
      ]);
      const list = Array.isArray(payslipsRes) ? payslipsRes : (payslipsRes as any)?.data || [];
      setRecords(list);
      setDashboard(dashRes);
    } catch (err: any) {
      setRecords([]);
      showToast({ title: 'Payroll', message: err.message || 'Could not load payroll records.', type: 'error' });
    }
  };

  const fetchSalaries = async () => {
    setLoadingSalaries(true);
    try {
      const res = await api.listSalaries();
      setSalaries(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err: any) {
      showToast({ title: 'Salaries', message: err.message || 'Could not load salary structures.', type: 'error' });
    } finally {
      setLoadingSalaries(false);
    }
  };

  const fetchAdvances = async () => {
    setLoadingAdvances(true);
    try {
      const [advList, recList] = await Promise.all([
        api.listAdvances(),
        api.listAdvanceRecoveries(),
      ]);
      setAdvances(advList);
      setRecoveries(recList);
    } catch (err: any) {
      showToast({ title: 'Advances', message: err.message || 'Could not load advances.', type: 'error' });
    } finally {
      setLoadingAdvances(false);
    }
  };

  const fetchReports = async () => {
    if (!canManage) return;
    setLoadingReports(true);
    try {
      const [deptRes, pfRes, yearRes] = await Promise.all([
        api.getPayrollDepartmentReport(yearNum, monthNum),
        api.getPayrollPfReport(yearNum, monthNum),
        api.getPayrollYearlyReport(yearNum),
      ]);
      setDeptReport(deptRes?.departments || []);
      setPfReport(pfRes);
      setYearlyReport(yearRes);
    } catch (err: any) {
      showToast({ title: 'Reports', message: err.message || 'Could not load reports.', type: 'error' });
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadRunsAndDashboard();
    if (activeTab === 'reports') fetchReports();
  }, [yearNum, monthNum]);

  useEffect(() => {
    if (!canManage) return;
    api.getBankDetails().then((data) => setBankDate(data?.salaryDate || data?.date || '')).catch(() => undefined);
    api.getEmployees().then((list) => {
      if (Array.isArray(list)) {
        setStaffOptions(
          list
            .filter((e: any) => String(e.role || '').toUpperCase() !== 'ADMIN')
            .map((e: any) => ({ id: e.id, name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email })),
        );
      }
    }).catch(() => undefined);
  }, [canManage]);

  useEffect(() => {
    if (activeTab === 'salaries') fetchSalaries();
    if (activeTab === 'advances') fetchAdvances();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  useCompanyLive(['payroll', 'attendance', 'leave', 'users'], () => {
    loadRunsAndDashboard();
    if (activeTab === 'salaries') fetchSalaries();
    if (activeTab === 'advances') fetchAdvances();
  });

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      const st = String(r.status || '');
      if (statusFilter !== 'All' && st !== statusFilter) return false;
      if (!q) return true;
      return (
        String(r.userName || '').toLowerCase().includes(q) ||
        String(r.departmentName || '').toLowerCase().includes(q) ||
        String(r.userEmail || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, statusFilter]);

  useEffect(() => setPage(1), [searchQuery, statusFilter, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const handlePreviewPayroll = async () => {
    setPreviewLoading(true);
    try {
      const res = await api.previewPayroll({
        year: yearNum,
        month: monthNum,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        userIds: selectedUserIds.length ? selectedUserIds : undefined,
      });
      setPreviewItems(res?.items || []);
    } catch (err: any) {
      showToast({ title: 'Preview Failed', message: err.message, type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setLoading(true);
    try {
      const res = await api.generatePayroll({
        year: yearNum,
        month: monthNum,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        userIds: selectedUserIds.length ? selectedUserIds : undefined,
      });
      await loadRunsAndDashboard();
      onRefresh();
      setPreviewItems(null);
      showToast({
        title: 'Payroll Generated',
        message: `Generated ${res?.generatedCount ?? 0} record(s) for ${selectedMonth}.`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Generate Failed', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rec: any) => {
    try {
      await api.approvePayroll(rec.id);
      showToast({ title: 'Approved', message: `Approved payroll for ${rec.userName}.`, type: 'success' });
      loadRunsAndDashboard();
    } catch (err: any) {
      showToast({ title: 'Approve Failed', message: err.message, type: 'error' });
    }
  };

  const handleReject = async (rec: any) => {
    const reason = window.prompt(`Enter rejection reason for ${rec.userName}:`, 'Needs attendance verification');
    if (reason === null) return;
    try {
      await api.rejectPayroll(rec.id, reason);
      showToast({ title: 'Rejected', message: `Payroll rejected for ${rec.userName}.`, type: 'warning' });
      loadRunsAndDashboard();
    } catch (err: any) {
      showToast({ title: 'Reject Failed', message: err.message, type: 'error' });
    }
  };

  const handleHoldRecord = async (rec: any, hold: boolean) => {
    let reason: string | undefined;
    if (hold) {
      const entered = window.prompt(`Enter hold reason for ${rec.userName}:`, 'Pending clearance');
      if (entered === null) return;
      reason = entered;
    }
    try {
      await api.holdPayrollRecord(rec.id, hold, reason);
      showToast({ title: hold ? 'Put On Hold' : 'Hold Released', message: `${rec.userName} updated.`, type: 'info' });
      loadRunsAndDashboard();
    } catch (err: any) {
      showToast({ title: 'Action Failed', message: err.message, type: 'error' });
    }
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    setPayBusy(true);
    try {
      await api.markPayslipPaid(payingRecord.id, {
        paymentMethod: payMethod,
        paymentReference: payReference.trim() || undefined,
        paymentDate: payDate,
        paymentNotes: payNotes.trim() || undefined,
      });
      showToast({ title: 'Marked Paid', message: `Salary paid to ${payingRecord.userName}.`, type: 'success' });
      setPayingRecord(null);
      setPayReference('');
      setPayNotes('');
      loadRunsAndDashboard();
      onRefresh();
    } catch (err: any) {
      showToast({ title: 'Payment Failed', message: err.message, type: 'error' });
    } finally {
      setPayBusy(false);
    }
  };

  const openConfigureSalary = (emp?: any) => {
    setEditingSalaryEmp(emp || { isNew: true });
    if (emp && !emp.isNew) {
      setSalaryForm({
        userId: emp.userId,
        monthlySalary: Number(emp.monthlySalary || 0),
        basicSalary: Number(emp.basicSalary || 0),
        hra: Number(emp.hra || 0),
        da: Number(emp.da || 0),
        otherAllowances: Number(emp.otherAllowances || 0),
        travelAllowance: Number(emp.travelAllowance || 0),
        medicalAllowance: Number(emp.medicalAllowance || 0),
        bonus: Number(emp.bonus || 0),
        incentives: Number(emp.incentives || 0),
        otherEarnings: Number(emp.otherEarnings || 0),
        overtimeRate: Number(emp.overtimeRate || 0),
        workingHoursPerDay: Number(emp.workingHoursPerDay || 8),
        workingDaysPerMonth: Number(emp.workingDaysPerMonth || 30),
        pfApplicable: emp.pfApplicable !== false,
        pfWage: Number(emp.pfWage || emp.basicSalary || 0),
        pfWageCeiling: Number(emp.pfWageCeiling || 15000),
        employeePfRate: Number(emp.employeePfRate ?? 12),
        employerPfRate: Number(emp.employerPfRate ?? 12),
        loanDeduction: Number(emp.loanDeduction || 0),
        professionalTax: Number(emp.professionalTax || 0),
        tds: Number(emp.tds || 0),
        otherDeductions: Number(emp.otherDeductions || 0),
        effectiveFrom: emp.effectiveFrom || new Date().toISOString().slice(0, 10),
        reason: '',
      });
    } else {
      setSalaryForm((prev) => ({ ...prev, userId: staffOptions[0]?.id || '', reason: 'Initial salary setup' }));
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.userId) {
      showToast({ title: 'Employee Required', message: 'Please select an employee.', type: 'warning' });
      return;
    }
    setSavingSalary(true);
    try {
      await api.saveSalary(salaryForm.userId, salaryForm);
      showToast({ title: 'Salary Saved', message: 'Salary structure updated successfully.', type: 'success' });
      setEditingSalaryEmp(null);
      fetchSalaries();
    } catch (err: any) {
      showToast({ title: 'Save Failed', message: err.message, type: 'error' });
    } finally {
      setSavingSalary(false);
    }
  };

  const openRevisions = async (emp: any) => {
    setRevisionEmp(emp);
    setLoadingRevisions(true);
    try {
      setRevisions(await api.getSalaryRevisions(emp.userId));
    } catch {
      setRevisions([]);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleToggleStructureHold = async (s: any) => {
    const hold = !s.isSalaryHeld;
    const reason = hold ? window.prompt(`Hold reason for ${s.userName}:`, 'Administrative hold') ?? undefined : undefined;
    if (hold && reason === undefined) return;
    try {
      await api.holdSalaryStructure(s.id, hold, reason);
      showToast({ title: hold ? 'Salary Held' : 'Hold Released', message: `${s.userName} updated.`, type: 'info' });
      fetchSalaries();
      loadRunsAndDashboard();
    } catch (err: any) {
      showToast({ title: 'Failed', message: err.message, type: 'error' });
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advForm.userId) return;
    setSavingAdvance(true);
    try {
      await api.createAdvance(advForm);
      showToast({ title: 'Advance Added', message: 'Advance salary recorded.', type: 'success' });
      setIsAdvanceModalOpen(false);
      fetchAdvances();
    } catch (err: any) {
      showToast({ title: 'Failed', message: err.message, type: 'error' });
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleManualRecover = async (adv: any) => {
    const val = window.prompt(`Enter recovery amount (Pending: ${inr(adv.pendingAmount)}):`, String(adv.pendingAmount));
    if (!val) return;
    const amt = Number(val);
    if (!Number.isFinite(amt) || amt <= 0) return;
    try {
      await api.recoverAdvanceManually(adv.id, amt, 'Manual recovery via Payroll UI');
      showToast({ title: 'Recovered', message: `Recovered ${inr(amt)}.`, type: 'success' });
      fetchAdvances();
    } catch (err: any) {
      showToast({ title: 'Recovery Failed', message: err.message, type: 'error' });
    }
  };

  const saveBankDate = async () => {
    if (!bankDate) return;
    setSavingBankDate(true);
    try {
      await api.saveBankFormDate(bankDate);
      showToast({ title: 'Saved', message: 'Salary release date updated.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed', message: err.message, type: 'error' });
    } finally {
      setSavingBankDate(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payroll &amp; Compensation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hours-based salary, EPF compliance, advance recovery, approvals, and statutory reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {([
              ['runs', 'Payroll Runs', Play],
              ['salaries', 'Salary & PF', Users],
              ['advances', 'Advances', Wallet],
              ['reports', 'Reports', BarChart3],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === key ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard KPIs */}
      {canManage && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-slate-500">Total Net Payroll</p>
            <p className="text-lg font-black text-slate-900 mt-1">{inr(dashboard.totalNetSalary)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Gross: {inr(dashboard.totalGrossSalary)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-slate-500">EPF (Emp / Er)</p>
            <p className="text-lg font-black text-indigo-700 mt-1">{inr(dashboard.totalPfDeduction)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Employer: {inr(dashboard.totalEmployerPf)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-slate-500">Advance Recovery</p>
            <p className="text-lg font-black text-amber-700 mt-1">{inr(dashboard.totalAdvanceRecovery)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{dashboard.totalEmployees} active staff</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-slate-500">Paid / Approved</p>
            <p className="text-lg font-black text-emerald-700 mt-1">
              {dashboard.paidCount} / {dashboard.approvedCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Paid: {inr(dashboard.totalPaidPayroll)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-slate-500">Pending / Held / Rejected</p>
            <p className="text-lg font-black text-rose-700 mt-1">
              {dashboard.pendingCount} / {dashboard.heldCount} / {dashboard.rejectedCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Held: {inr(dashboard.heldPayroll)}</p>
          </div>
        </div>
      )}

      {/* TAB 1: PAYROLL RUNS */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
              />
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                title="Custom Period Start (Optional)"
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-slate-700"
              />
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                title="Custom Period End (Optional)"
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-slate-700"
              />
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee..."
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-slate-700"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="On Hold">On Hold</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handlePreviewPayroll}
                  disabled={previewLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewLoading ? 'Previewing...' : 'Preview'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePayroll}
                  disabled={loading || parentLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{loading ? 'Generating...' : selectedUserIds.length ? `Generate (${selectedUserIds.length})` : 'Generate Payroll'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => api.exportPayrollCsv(yearNum, monthNum)}
                  className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Worked / OT</th>
                    <th className="py-3 px-3">Gross</th>
                    <th className="py-3 px-3">PF (Emp/Er)</th>
                    <th className="py-3 px-3">Advance</th>
                    <th className="py-3 px-3">Net Pay</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No payroll records for {selectedMonth}. Click &quot;Generate Payroll&quot; to calculate.
                      </td>
                    </tr>
                  ) : (
                    pagedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{rec.userName || 'Employee'}</div>
                          <div className="text-[11px] text-slate-500">{rec.departmentName || 'General'}</div>
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          <div>{rec.actualWorkingHours}h / {rec.overtimeHours}h OT</div>
                          <div className="text-[11px] text-slate-400">
                            {rec.presentDays ?? 0}d • PL {rec.paidLeaveDays} • UL {rec.unpaidLeaveDays}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 tabular-nums">{inr(rec.grossSalary)}</td>
                        <td className="py-3 px-3 tabular-nums">
                          <div>{inr(rec.employeePfAmount)}</div>
                          <div className="text-[11px] text-slate-400">Er: {inr(rec.employerPfAmount)}</div>
                        </td>
                        <td className="py-3 px-3 tabular-nums text-amber-700 font-semibold">{inr(rec.advanceSalaryDeduction)}</td>
                        <td className="py-3 px-3 font-black text-emerald-800 tabular-nums">{inr(rec.netSalary)}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              rec.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rec.status === 'Approved'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : rec.status === 'On Hold'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : rec.status === 'Rejected'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPayslip(rec)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              title="View Payslip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => api.downloadPayslipFile(rec.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {canManage && rec.status === 'Pending' && !rec.isHeld && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(rec)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(rec)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                                  title="Reject"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {canManage && rec.status !== 'Paid' && (
                              <button
                                type="button"
                                onClick={() => handleHoldRecord(rec, !rec.isHeld)}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                                title={rec.isHeld ? 'Release Hold' : 'Put On Hold'}
                              >
                                {rec.isHeld ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {canManage && (rec.status === 'Approved' || rec.status === 'Pending') && !rec.isHeld && (
                              <button
                                type="button"
                                onClick={() => openPayModal(rec)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > pageSize && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Page {page} of {totalPages} ({filteredRecords.length} records)</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALARY STRUCTURES & PF */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Payslip Release Date:</span>
              <input
                type="date"
                value={bankDate}
                onChange={(e) => setBankDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200"
              />
              <button
                type="button"
                onClick={saveBankDate}
                disabled={savingBankDate}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
              >
                {savingBankDate ? 'Saving...' : 'Save Date'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => openConfigureSalary()}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Salary Structure</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Select</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Monthly CTC</th>
                    <th className="py-3 px-3">Basic / HRA</th>
                    <th className="py-3 px-3">PF Config</th>
                    <th className="py-3 px-3">Hold Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingSalaries ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
                  ) : salaries.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">No salary structures configured yet.</td></tr>
                  ) : (
                    salaries.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(s.userId)}
                            onChange={(e) =>
                              setSelectedUserIds((prev) =>
                                e.target.checked ? [...prev, s.userId] : prev.filter((id) => id !== s.userId),
                              )
                            }
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.userName}</div>
                          <div className="text-[11px] text-slate-500">{s.departmentName || 'General'}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{inr(s.monthlySalary)}</td>
                        <td className="py-3 px-3">{inr(s.basicSalary)} / {inr(s.hra)}</td>
                        <td className="py-3 px-3">
                          {s.pfApplicable ? (
                            <span className="text-indigo-700 font-semibold">
                              ON ({s.employeePfRate}% / {s.employerPfRate}%, Cap {inr(s.pfWageCeiling)})
                            </span>
                          ) : (
                            <span className="text-slate-400">OFF</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {s.isSalaryHeld ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                              Held
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Active</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => openConfigureSalary(s)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            title="Edit Structure"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openRevisions(s)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            title="Revision History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStructureHold(s)}
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                            title={s.isSalaryHeld ? 'Release Hold' : 'Hold Salary'}
                          >
                            {s.isSalaryHeld ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADVANCE SALARY MANAGEMENT */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Employee Advances &amp; Auto-Recovery</h3>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setAdvForm((f) => ({ ...f, userId: staffOptions[0]?.id || '' }));
                  setIsAdvanceModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Advance</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Recovered</th>
                  <th className="py-3 px-3">Pending</th>
                  <th className="py-3 px-3">Monthly Recovery</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAdvances ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : advances.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">No advance salary records.</td></tr>
                ) : (
                  advances.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.userName}</td>
                      <td className="py-3 px-3">{a.advanceDate}</td>
                      <td className="py-3 px-3 font-semibold">{inr(a.amount)}</td>
                      <td className="py-3 px-3 text-emerald-700">{inr(a.recoveredAmount)}</td>
                      <td className="py-3 px-3 font-bold text-rose-700">{inr(a.pendingAmount)}</td>
                      <td className="py-3 px-3">{inr(a.recoveryPerMonth)}</td>
                      <td className="py-3 px-3 font-semibold">{a.status}</td>
                      <td className="py-3 px-4 text-right">
                        {canManage && a.pendingAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleManualRecover(a)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold cursor-pointer"
                          >
                            Manual Recover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {recoveries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Recovery History</h4>
              <div className="space-y-1.5 text-xs">
                {recoveries.slice(0, 15).map((r) => (
                  <div key={r.id} className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>{r.userName} • {r.recoveryDate} • {r.note || (r.isManual ? 'Manual' : 'Auto Payroll')}</span>
                    <span className="font-bold text-emerald-700">{inr(r.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-700">
              Reports for <span className="font-bold">{selectedMonth}</span> (Year {yearNum})
            </div>
            <button
              type="button"
              onClick={() => api.exportPayrollCsv(yearNum, monthNum)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel / CSV</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading reports...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Department-Wise Payroll</h4>
                <div className="space-y-2 text-xs">
                  {deptReport.length === 0 ? (
                    <p className="text-slate-400">No department data.</p>
                  ) : (
                    deptReport.map((d) => (
                      <div key={d.departmentName} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-800">{d.departmentName}</div>
                          <div className="text-[11px] text-slate-500">{d.employees} employees</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-800">{inr(d.netSalary)}</div>
                          <div className="text-[11px] text-slate-500">PF: {inr(d.employeePf + d.employerPf)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">PF Summary ({selectedMonth})</h4>
                <div className="flex gap-4 mb-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-800 font-bold">
                    Employee PF: {inr(pfReport?.totalEmployeePf)}
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
                    Employer PF: {inr(pfReport?.totalEmployerPf)}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
                  {(pfReport?.items || []).map((item: any) => (
                    <div key={item.userId} className="flex justify-between border-b border-slate-100 pb-1">
                      <span>{item.userName} (Wage: {inr(item.pfWage)})</span>
                      <span className="font-semibold">Emp {inr(item.employeePfAmount)} / Er {inr(item.employerPfAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {yearlyReport && (
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Yearly Payroll Summary ({yearlyReport.year})</h4>
                  <div className="flex flex-wrap gap-3 text-xs mb-3">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 font-bold">Total Gross: {inr(yearlyReport.totalGross)}</span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold">Total Net: {inr(yearlyReport.totalNet)}</span>
                    <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-800 font-bold">Total Emp PF: {inr(yearlyReport.totalEmployeePf)}</span>
                    <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold">Total Advance Recovery: {inr(yearlyReport.totalAdvanceRecovery)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: PREVIEW PAYROLL */}
      {mounted && previewItems && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setPreviewItems(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Payroll Preview — {selectedMonth}</h3>
              <button onClick={() => setPreviewItems(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Employee</th>
                    <th className="py-2 px-3">Payable Hrs</th>
                    <th className="py-2 px-3">Gross</th>
                    <th className="py-2 px-3">PF (Emp/Er)</th>
                    <th className="py-2 px-3">Advance</th>
                    <th className="py-2 px-3">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.map((item) => (
                    <tr key={item.userId}>
                      <td className="py-2 px-3 font-semibold">{item.userName}</td>
                      <td className="py-2 px-3">{item.payableHours}h</td>
                      <td className="py-2 px-3">{inr(item.grossSalary)}</td>
                      <td className="py-2 px-3">{inr(item.employeePfAmount)} / {inr(item.employerPfAmount)}</td>
                      <td className="py-2 px-3 text-amber-700">{inr(item.advanceSalaryDeduction)}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">{inr(item.netSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setPreviewItems(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer">Close</button>
              <button onClick={handleGeneratePayroll} className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer">Confirm &amp; Generate</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* MODAL: MARK PAID */}
      {mounted && payingRecord && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setPayingRecord(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Record Payment — {payingRecord.userName}</h3>
              <button onClick={() => setPayingRecord(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleConfirmPay} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold">
                Net Payable: {inr(payingRecord.netSalary)}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold uppercase text-slate-500">Employee Bank Account</div>
                {payingBankLoading ? (
                  <div className="text-slate-400">Loading bank details...</div>
                ) : payingBank ? (
                  <div className="space-y-0.5 text-slate-800">
                    <div><b>Bank:</b> {payingBank.bankName}</div>
                    <div><b>Holder:</b> {payingBank.accountHolderName}</div>
                    <div><b>A/C No:</b> <span className="font-mono">{payingBank.accountNumber}</span></div>
                    <div><b>IFSC:</b> <span className="font-mono">{payingBank.ifsc}</span></div>
                  </div>
                ) : (
                  <div className="text-amber-700 font-semibold">
                    Employee has not added bank details yet.
                  </div>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS/RTGS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Reference / UTR</label>
                <input type="text" value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder="e.g. UTR123456789" className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPayingRecord(null)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={payBusy} className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold cursor-pointer">
                  {payBusy ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* MODAL: CONFIGURE SALARY STRUCTURE */}
      {mounted && editingSalaryEmp && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setEditingSalaryEmp(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Configure Salary Structure &amp; PF</h3>
              <button onClick={() => setEditingSalaryEmp(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSalary} className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {editingSalaryEmp.isNew && (
                <div className="col-span-2 sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                  <select value={salaryForm.userId} onChange={(e) => setSalaryForm((f) => ({ ...f, userId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    {staffOptions.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              )}
              {([
                ['monthlySalary', 'Monthly Salary'],
                ['basicSalary', 'Basic Salary'],
                ['hra', 'HRA'],
                ['da', 'DA'],
                ['otherAllowances', 'Other Allowances'],
                ['travelAllowance', 'Travel Allowance'],
                ['medicalAllowance', 'Medical Allowance'],
                ['bonus', 'Bonus'],
                ['incentives', 'Incentives'],
                ['overtimeRate', 'Overtime / Hr'],
                ['workingHoursPerDay', 'Hours / Day'],
                ['workingDaysPerMonth', 'Days / Month'],
                ['pfWageCeiling', 'PF Wage Cap'],
                ['employeePfRate', 'Employee PF %'],
                ['employerPfRate', 'Employer PF %'],
                ['loanDeduction', 'Loan Deduction'],
                ['professionalTax', 'Professional Tax'],
                ['tds', 'TDS'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block font-semibold text-slate-600 mb-1">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(salaryForm as any)[key]}
                    onChange={(e) => setSalaryForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={salaryForm.pfApplicable}
                  onChange={(e) => setSalaryForm((f) => ({ ...f, pfApplicable: e.target.checked }))}
                />
                <label className="font-semibold text-slate-700">PF Applicable</label>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Effective From</label>
                <input type="date" value={salaryForm.effectiveFrom} onChange={(e) => setSalaryForm((f) => ({ ...f, effectiveFrom: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Revision Reason</label>
                <input type="text" value={salaryForm.reason} onChange={(e) => setSalaryForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Annual increment..." className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200" />
              </div>
              <div className="col-span-2 sm:col-span-3 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSalaryEmp(null)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingSalary} className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-semibold cursor-pointer">
                  {savingSalary ? 'Saving...' : 'Save Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* MODAL: ISSUE ADVANCE */}
      {mounted && isAdvanceModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsAdvanceModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Issue Advance Salary</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select value={advForm.userId} onChange={(e) => setAdvForm((f) => ({ ...f, userId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  {staffOptions.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Advance Amount</label>
                  <input type="number" min="1" required value={advForm.amount} onChange={(e) => setAdvForm((f) => ({ ...f, amount: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Recovery</label>
                  <input type="number" min="0" required value={advForm.recoveryPerMonth} onChange={(e) => setAdvForm((f) => ({ ...f, recoveryPerMonth: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input type="date" value={advForm.advanceDate} onChange={(e) => setAdvForm((f) => ({ ...f, advanceDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <input type="text" value={advForm.reason} onChange={(e) => setAdvForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Medical / personal..." className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingAdvance} className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold cursor-pointer">
                  {savingAdvance ? 'Saving...' : 'Issue Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* MODAL: SALARY REVISION HISTORY */}
      {mounted && revisionEmp && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setRevisionEmp(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Salary Revisions — {revisionEmp.userName}</h3>
              <button onClick={() => setRevisionEmp(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {loadingRevisions ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : revisions.length === 0 ? (
              <p className="text-xs text-slate-400">No revisions recorded.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
                {revisions.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold">{inr(rev.previousMonthlySalary)} → {inr(rev.newMonthlySalary)}</div>
                      <div className="text-[11px] text-slate-500">Effective: {rev.effectiveFrom} • By {rev.updatedByName || 'Admin'}</div>
                      {rev.reason && <div className="text-[11px] text-slate-600">{rev.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* MODAL: PAYSLIP DETAIL */}
      {mounted && selectedPayslip && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedPayslip(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPayslip.userName}</h3>
                <p className="text-slate-500">{selectedPayslip.payrollMonth} • {selectedPayslip.status}</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
              <div>Worked: <b>{selectedPayslip.actualWorkingHours}h</b></div>
              <div>Overtime: <b>{selectedPayslip.overtimeHours}h</b></div>
              <div>Paid Leave: <b>{selectedPayslip.paidLeaveDays}d</b></div>
              <div>Unpaid Leave: <b>{selectedPayslip.unpaidLeaveDays}d</b></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Earned Basic</span><span>{inr(selectedPayslip.earnedBasicSalary)}</span></div>
              <div className="flex justify-between"><span>HRA + Allowances</span><span>{inr(selectedPayslip.hra + selectedPayslip.da + selectedPayslip.otherAllowances + selectedPayslip.travelAllowance + selectedPayslip.medicalAllowance)}</span></div>
              <div className="flex justify-between"><span>Bonus + Overtime</span><span>{inr(selectedPayslip.bonus + selectedPayslip.incentives + selectedPayslip.overtimePay)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-100 pt-1"><span>Gross Salary</span><span>{inr(selectedPayslip.grossSalary)}</span></div>
              <div className="flex justify-between text-rose-700"><span>Employee PF</span><span>-{inr(selectedPayslip.employeePfAmount)}</span></div>
              <div className="flex justify-between text-rose-700"><span>Advance Recovery</span><span>-{inr(selectedPayslip.advanceSalaryDeduction)}</span></div>
              <div className="flex justify-between text-rose-700"><span>PT + TDS + Loan + Other</span><span>-{inr(selectedPayslip.professionalTax + selectedPayslip.tds + selectedPayslip.loanDeduction + selectedPayslip.otherDeductions)}</span></div>
              <div className="flex justify-between text-base font-black text-emerald-800 border-t border-slate-200 pt-2">
                <span>Net Salary</span><span>{inr(selectedPayslip.netSalary)}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Employer PF (separate): {inr(selectedPayslip.employerPfAmount)}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => api.downloadPayslipFile(selectedPayslip.id)} className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
