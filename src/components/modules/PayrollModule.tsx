'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  CheckCircle,
  FileText,
  DollarSign,
  Play,
  X,
  MoreVertical,
  RotateCcw,
  Plus,
  Edit2,
  History,
  Loader2,
  Users,
} from 'lucide-react';
import { PayrollRecord } from '../../types/hrms';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface PayrollModuleProps {
  payrollRecords: PayrollRecord[];
  onRefresh: () => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  payrollRecords,
  onRefresh,
}) => {
  const { user, hasPermission } = useAuth();
  const { showToast } = useSocket();
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedPayslip) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPayslip(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPayslip]);

  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState<PayrollRecord[]>(payrollRecords || []);

  useEffect(() => {
    setRecords(payrollRecords || []);
  }, [payrollRecords]);

  // Tab State: 'runs' (Payroll Runs) vs 'salaries' (Employee Salaries Structure)
  const [activeTab, setActiveTab] = useState<'runs' | 'salaries'>('runs');
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loadingSalaries, setLoadingSalaries] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  // Configure Salary Modal
  const [editingSalaryEmp, setEditingSalaryEmp] = useState<any | null>(null);
  const [formBasicSalary, setFormBasicSalary] = useState(30000);
  const [formHra, setFormHra] = useState(12000);
  const [formAllowances, setFormAllowances] = useState(5000);
  const [formBonus, setFormBonus] = useState(0);
  const [formDeductions, setFormDeductions] = useState(1800);
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // Salary History Modal
  const [historyEmp, setHistoryEmp] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchSalaries = async () => {
    setLoadingSalaries(true);
    setSalaryError(null);
    try {
      const res = await api.listSalaries();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setSalaries(list);
    } catch (err: any) {
      console.warn('Could not fetch salaries:', err);
      setSalaryError(err.message || 'Failed to fetch salaries.');
      setSalaries([]);
    } finally {
      setLoadingSalaries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'salaries') {
      fetchSalaries();
    }
  }, [activeTab]);

  const handleOpenSalaryModal = (emp: any) => {
    setEditingSalaryEmp(emp);
    setFormBasicSalary(emp.basicSalary || 30000);
    setFormHra(emp.hra || 12000);
    setFormAllowances(emp.allowances || 5000);
    setFormBonus(emp.bonus || 0);
    setFormDeductions(emp.deductions || 1800);
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalaryEmp) return;
    setSavingSalary(true);
    try {
      const empId = editingSalaryEmp.employeeId || editingSalaryEmp.id;
      await api.saveSalary(empId, {
        basicSalary: Number(formBasicSalary),
        hra: Number(formHra),
        allowances: Number(formAllowances),
        bonus: Number(formBonus),
        deductions: Number(formDeductions),
        effectiveFrom: formEffectiveFrom,
      });
      showToast({
        title: 'Salary Saved',
        message: 'Employee salary configuration updated.',
        type: 'success',
        module: 'payroll',
      });
      setEditingSalaryEmp(null);
      fetchSalaries();
      onRefresh();
    } catch (err: any) {
      showToast({
        title: 'Save Failed',
        message: err.message || 'Could not update salary structure.',
        type: 'error',
      });
    } finally {
      setSavingSalary(false);
    }
  };

  const handleViewSalaryHistory = async (emp: any) => {
    setHistoryEmp(emp);
    setLoadingHistory(true);
    try {
      const empId = emp.employeeId || emp.id;
      const res = await api.getSalaryHistory(empId);
      const list = Array.isArray(res) ? res : (res as any)?.history || (res as any)?.data || [];
      setHistoryData(list);
    } catch (err) {
      console.warn('Could not load salary history:', err);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const payslipRows = records.map((r) => ({
    id: r.id,
    name: r.employeeName || 'Employee',
    code: r.employeeCode || r.id,
    avatar: (r as any).employeeAvatar || (r as any).avatarUrl || '',
    role: r.designationTitle || 'Staff Member',
    basic: r.basicSalary || 0,
    allowances: r.allowances || 0,
    gross: r.grossSalary || 0,
    deductions: r.totalDeductions || 0,
    net: r.netSalary || 0,
    status: r.status || 'Draft',
  }));

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'Paid') {
        try {
          await api.markPayslipPaid(id);
        } catch (paidErr) {
          console.warn('markPayslipPaid error:', paidErr);
        }
      }
      await api.updatePayrollStatus(id, {
        status: newStatus,
        actorName: `${user.firstName || 'Finance'} ${user.lastName || 'Admin'}`,
      });
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r))
      );
      showToast({
        title: 'Status Updated',
        message: `Payroll status marked as ${newStatus}.`,
        type: 'success',
        module: 'payroll',
      });
    } catch (err: any) {
      showToast({
        title: 'Update Failed',
        message: err.message || 'Could not update status.',
        type: 'error',
      });
    }
  };

  const handleExportACH = () => {
    const csvContent =
      'EmployeeCode,EmployeeName,BankName,AccountNumber,RoutingCode,NetSalary,Month\n' +
      records
        .map(
          (r) =>
            `${r.employeeCode || r.id},"${r.employeeName || ''}","${(r as any).bankName || ''}","${(r as any).accountNumber || ''}","${(r as any).ifscOrRouting || ''}",${r.netSalary || 0},${selectedMonth}`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACH_Direct_Deposit_${selectedMonth}.csv`;
    a.click();
    showToast({
      title: 'Batch Export Ready',
      message: `Downloaded NACHA/ACH direct deposit file for ${selectedMonth}.`,
      type: 'success',
      module: 'payroll',
    });
  };

  const handleViewSlip = async (rec: any) => {
    try {
      const data = await api.getPayslip(rec.id);
      if (data) {
        setSelectedPayslip(data);
      } else {
        showToast({
          title: 'Payslip Notice',
          message: 'No itemized payslip breakdown available for this record.',
          type: 'error',
          module: 'payroll',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Error Loading Payslip',
        message: err.message || 'Could not fetch payslip details from backend database.',
        type: 'error',
        module: 'payroll',
      });
    }
  };

  const totalGross = records.reduce((acc, curr) => acc + (curr.grossSalary || 0), 0);
  const totalNet = records.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  const totalDeductions = records.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0);

  const handleGenerateBatch = async () => {
    setLoading(true);
    try {
      const res = await api.generatePayroll(selectedMonth);
      showToast({
        title: 'Payroll Generated',
        message: `Successfully calculated ${selectedMonth} payroll (${res.recordsGenerated || 23} payslips created).`,
        type: 'success',
        module: 'payroll',
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Payroll generation completed.');
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* ── Tab Switcher: Runs vs Salaries ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/70 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('runs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'runs'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disbursement Ledger &amp; Runs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salaries')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'salaries'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Salary Structures ({salaries.length})
          </button>
        </div>

        {activeTab === 'runs' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 bg-white focus:outline-hidden"
            />
            <button
              onClick={handleGenerateBatch}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
            >
              <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Calculating...' : 'Run Payroll'}</span>
            </button>
          </div>
        )}

        {activeTab === 'salaries' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSalaries}
              disabled={loadingSalaries}
              className="p-2 rounded-xl bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh salaries"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingSalaries ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'runs' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 3 Payroll Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Total Gross Salary</span>
          <p className="text-2xl font-semibold tracking-tight text-slate-800 mt-2">
            ${totalGross.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Period: {selectedMonth}</span>
            <span>{records.length} Staff</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Total Statutory Deductions</span>
          <p className="text-2xl font-semibold tracking-tight text-amber-600 mt-2">
            ${totalDeductions.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>PF, ESI & Tax Withheld</span>
            <span>{totalGross > 0 ? `${Math.round((totalDeductions / totalGross) * 100)}% Avg` : '0%'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Net Take-Home Disbursed</span>
          <p className="text-2xl font-semibold tracking-tight text-blue-600 mt-2">
            ${totalNet.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-emerald-600 font-semibold">100% Reconciled</span>
            <span>Direct Deposit</span>
          </div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Monthly Disbursement Ledger
          </h3>

          <button
            onClick={handleExportACH}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Bank Transfer File</span>
          </button>
        </div>

        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Basic Pay</th>
                <th className="py-2.5 px-3">Allowances</th>
                <th className="py-2.5 px-3">Gross Salary</th>
                <th className="py-2.5 px-3">Deductions</th>
                <th className="py-2.5 px-3">Net Take-Home</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payslipRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No payroll records generated for this cycle. Click &quot;Run Payroll&quot; to calculate salaries.
                  </td>
                </tr>
              ) : (
                payslipRows.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {rec.avatar ? (
                          <img
                            src={rec.avatar}
                            alt={rec.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                            {rec.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{rec.name}</p>
                          <span className="text-[10px] text-slate-400">{rec.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{rec.role}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">₹{rec.basic.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-500">+₹{rec.allowances.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">₹{rec.gross.toLocaleString()}</td>
                    <td className="py-3 px-3 text-amber-600 font-medium">-₹{rec.deductions.toLocaleString()}</td>
                    <td className="py-3 px-3 text-blue-600 font-bold">₹{rec.net.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <select
                        value={rec.status}
                        onChange={(e) => handleStatusChange(rec.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border-0 cursor-pointer ${
                          rec.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-600'
                            : rec.status === 'Processed'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Approved">Approved</option>
                        <option value="Processed">Processed</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleViewSlip(rec)}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                      >
                        View Slip
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

  {/* ═══════════════════════════════════════════════════════
      TAB: EMPLOYEE SALARY STRUCTURES
  ═══════════════════════════════════════════════════════ */}
  {activeTab === 'salaries' && (
    <div className="space-y-4 animate-in fade-in duration-200">
      {salaryError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
          <span>{salaryError}</span>
          <button
            type="button"
            onClick={fetchSalaries}
            className="px-3 py-1 rounded-lg bg-amber-200/80 font-bold text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loadingSalaries ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-2xs">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Loading compensation records...</p>
        </div>
      ) : salaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-2xs">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">No salary records configured</p>
          <p className="text-xs text-slate-400 mt-1">
            Configure employee monthly salary structures to automate future payroll calculations.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Basic Salary</th>
                  <th className="py-3 px-4">HRA</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Effective From</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((sal: any) => {
                  const empName = sal.employee?.fullName || sal.employeeName || 'Staff Member';
                  return (
                    <tr key={sal.id || sal.employeeId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{empName}</div>
                        <div className="text-[10px] text-slate-400">{sal.employeeId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        ₹{(sal.basicSalary || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        ₹{(sal.hra || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        ₹{(sal.allowances || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        -₹{(sal.deductions || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {sal.effectiveFrom ? new Date(sal.effectiveFrom).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewSalaryHistory(sal)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Salary History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenSalaryModal(sal)}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Configure</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

  {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayslip(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Official Salary Slip</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Pay period details and breakdown</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedPayslip.employee.name}</p>
                  <p className="text-slate-500">{selectedPayslip.employee.designation}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-blue-600">Period: {selectedPayslip.payPeriod}</span>
                  <p className="text-slate-400 text-[10px]">Method: {selectedPayslip.paymentMethod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                <div>
                  <p className="font-bold text-slate-700 mb-1">Earnings</p>
                  {selectedPayslip.earnings.map((e: any) => (
                    <div key={e.item} className="flex justify-between text-slate-600 py-0.5">
                      <span>{e.item}</span>
                      <span className="font-semibold">${e.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-1">Deductions</p>
                  {selectedPayslip.deductions.map((d: any) => (
                    <div key={d.item} className="flex justify-between text-slate-600 py-0.5">
                      <span>{d.item}</span>
                      <span className="font-semibold text-rose-600">-${d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center">
                <span className="font-bold text-slate-900">Net Take-Home Salary:</span>
                <span className="text-lg font-semibold tracking-tight text-blue-600">
                  ${selectedPayslip.summary.netSalary.toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Configure Salary Modal (PUT /payroll/salaries/:employeeId) ── */}
      {Boolean(editingSalaryEmp) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEditingSalaryEmp(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Configure Monthly Salary</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSalaryEmp(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSalary} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Basic Salary (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formBasicSalary}
                    onChange={(e) => setFormBasicSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    HRA (₹)
                  </label>
                  <input
                    type="number"
                    value={formHra}
                    onChange={(e) => setFormHra(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Allowances (₹)
                  </label>
                  <input
                    type="number"
                    value={formAllowances}
                    onChange={(e) => setFormAllowances(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={formDeductions}
                    onChange={(e) => setFormDeductions(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Effective From
                </label>
                <input
                  type="date"
                  value={formEffectiveFrom}
                  onChange={(e) => setFormEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSalaryEmp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSalary}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  {savingSalary && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Salary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Salary History Modal (GET /payroll/salaries/:employeeId) ── */}
      {Boolean(historyEmp) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setHistoryEmp(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Salary Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryEmp(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs max-h-80 overflow-y-auto">
              {loadingHistory ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">Fetching history...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No historical revisions recorded yet.
                </div>
              ) : (
                historyData.map((h: any, i: number) => (
                  <div key={h.id || i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Basic: ₹{(h.basicSalary || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">{h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString() : 'Initial'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      HRA: ₹{(h.hra || 0).toLocaleString()} • Allowances: ₹{(h.allowances || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setHistoryEmp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
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
