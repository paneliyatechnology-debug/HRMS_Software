'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  ArrowUpRight,
  CreditCard,
  Eye,
  X,
  FileText,
  Clock,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { PayrollRecord, Employee } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  numberToWords,
} from '../../lib/payrollService';
import { getAllEmployees } from '../../lib/employeeService';
import { api } from '../../lib/api';

function amount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPayrollRecord(row: any): PayrollRecord {
  const year = Number(row?.year || 0);
  const month = Number(row?.month || 0);
  const payrollMonth = row?.payrollMonth || (year && month ? `${year}-${String(month).padStart(2, '0')}` : '');
  const deduction = amount(row?.totalDeductions ?? row?.deduction ?? row?.deductions);
  const pf = amount(row?.employeePfAmount ?? row?.pfDeduction);
  const tax = amount(row?.tds ?? row?.taxDeduction);
  const pt = amount(row?.professionalTax);
  const otherDed = amount(row?.otherDeductions) + amount(row?.loanDeduction) + amount(row?.advanceSalaryDeduction);
  const hasSplit = pf > 0 || tax > 0 || pt > 0 || otherDed > 0;
  return {
    id: String(row?.id || ''),
    payrollMonth,
    employeeId: row?.employeeId || row?.userId || '',
    employeeName: row?.employeeName || row?.userName || '',
    employeeCode: row?.employeeCode || '',
    designationTitle: row?.designationTitle || row?.designation || row?.role || '',
    departmentName: row?.departmentName || '',
    basicSalary: amount(row?.earnedBasicSalary ?? row?.basicSalary),
    hra: amount(row?.hra),
    allowances: amount(row?.allowances ?? (amount(row?.da) + amount(row?.otherAllowances) + amount(row?.travelAllowance) + amount(row?.medicalAllowance))),
    bonus: amount(row?.bonus) + amount(row?.incentives),
    overtimePay: amount(row?.overtimePay),
    grossSalary: amount(row?.grossSalary ?? row?.grossPay),
    pfDeduction: pf,
    taxDeduction: tax,
    professionalTax: pt,
    otherDeductions: hasSplit ? otherDed : deduction,
    totalDeductions: deduction,
    netSalary: amount(row?.netSalary ?? row?.netPay),
    status: row?.status || 'Paid',
    paymentDate: row?.paymentDate || (row?.paidAt ? String(row.paidAt).slice(0, 10) : undefined),
    paymentMethod: row?.paymentMethod,
  };
}

interface EmployeePayslipsModuleProps {
  onRefresh?: () => void;
  employees?: Employee[];
}

export const EmployeePayslipsModule: React.FC<EmployeePayslipsModuleProps> = ({ employees = [] }) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [mounted, setMounted] = useState(false);
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [bank, setBank] = useState<{ bankName: string; accountHolderName?: string; accountNumber: string; ifsc: string } | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
  });
  const [salaryNote, setSalaryNote] = useState('');

  const openBankModal = () => {
    setBankForm({
      bankName: bank?.bankName || '',
      accountHolderName: bank?.accountHolderName || currentEmpName || '',
      accountNumber: bank?.accountNumber || '',
      ifsc: bank?.ifsc || '',
    });
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaving(true);
    try {
      const res = await api.saveBankDetails(bankForm);
      setBank(res?.bank || { ...bankForm });
      setIsBankModalOpen(false);
      showToast({ title: 'Bank Saved', message: 'Your bank details have been saved.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Save Failed', message: err?.message || 'Could not save bank details.', type: 'error' });
    } finally {
      setBankSaving(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  // Find corresponding employee record for bank details and tax info
  const currentEmpId = user.employeeId || user.id || '';
  const currentEmpEmail = user.email || '';
  const currentEmpCode = (user as any).employeeCode || '';
  const currentEmpName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  const employeeDetails: Employee | undefined = useMemo(() => {
    const list = employees && employees.length > 0 ? employees : getAllEmployees();
    return list.find(
      (e) =>
        (currentEmpId && e.id === currentEmpId) ||
        (currentEmpEmail && e.email && e.email.toLowerCase() === currentEmpEmail.toLowerCase()) ||
        (currentEmpCode && e.employeeCode && e.employeeCode.toLowerCase() === currentEmpCode.toLowerCase())
    );
  }, [currentEmpId, currentEmpEmail, currentEmpCode]);

  // Load payslips on mount and on storage events
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      // Fetch live records directly from backend Database (Zero synthetic fallbacks)
      try {
        let apiRecords: any[] = [];
        try {
          const res = await api.listPayslips(true);
          apiRecords = Array.isArray(res) ? res : (res as any)?.data || [];
          const releaseDate = (res as any)?.date;
          const released = (res as any)?.released;
          if (releaseDate && released === false) {
            setSalaryNote(`Your salary opens on ${releaseDate}. That slip is for the previous month.`);
          } else if (!releaseDate) {
            setSalaryNote('Admin has not set the salary date yet.');
          } else if (!apiRecords.length) {
            setSalaryNote('No salary slip for the released month yet.');
          } else {
            setSalaryNote('');
          }
        } catch {
          if (currentEmpId) {
            const fallback = await api.getPayroll({ employeeId: currentEmpId });
            apiRecords = Array.isArray(fallback) ? fallback : (fallback as any)?.data || [];
          }
        }
        const bankRes = await api.getBankDetails().catch(() => null);
        if (isMounted) {
          setBank(bankRes?.bank || null);
          setPayslips((Array.isArray(apiRecords) ? apiRecords : []).map(toPayrollRecord));
        }
      } catch (err) {
        console.warn('Could not fetch payroll records from backend API:', err);
        if (isMounted) {
          setPayslips([]);
        }
      }
    };

    load();
    window.addEventListener('hrms_payroll_updated', load);
    window.addEventListener('hrms_employees_updated', load);
    return () => {
      isMounted = false;
      window.removeEventListener('hrms_payroll_updated', load);
      window.removeEventListener('hrms_employees_updated', load);
    };
  }, [currentEmpId, currentEmpEmail, currentEmpCode, currentEmpName]);

  // Available years from payslips
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    payslips.forEach((p) => {
      if (p.payrollMonth && p.payrollMonth.includes('-')) {
        years.add(p.payrollMonth.split('-')[0]);
      }
    });
    return Array.from(years).sort().reverse();
  }, [payslips]);

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      const matchesYear =
        selectedYear === 'All' || (p.payrollMonth && p.payrollMonth.startsWith(selectedYear));
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (p.payrollMonth || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q) ||
        (p.paymentMethod || '').toLowerCase().includes(q);
      return matchesYear && matchesQuery;
    });
  }, [payslips, selectedYear, searchQuery]);

  // KPI calculations
  const latestPayslip = payslips[0];
  const totalDisbursed = useMemo(() => {
    return payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  }, [payslips]);
  const avgSalary = useMemo(() => {
    return payslips.length > 0 ? Math.round(totalDisbursed / payslips.length) : 0;
  }, [payslips, totalDisbursed]);

  const formatMonthName = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrint = async (id?: string) => {
    const payslipId = id || selectedPayslip?.id;
    if (!payslipId) return;
    try {
      await api.downloadPayslipFile(payslipId);
      showToast({ title: 'Downloaded', message: 'Salary slip PDF downloaded.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Print failed', message: err.message || 'Could not load the salary slip.', type: 'error' });
    }
  };

  const handleViewSlip = async (id: string) => {
    try {
      const data = await api.getPayslip(id);
      setSelectedPayslip(toPayrollRecord(data));
    } catch (err: any) {
      showToast({ title: 'Salary slip', message: err.message || 'Could not load the salary slip.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Salary */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">
              Latest In-Hand Salary
            </span>
            {latestPayslip ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Paid
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                No Record
              </span>
            )}
          </div>
          <div className="mt-2.5">
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-800">
              {latestPayslip ? `₹${amount(latestPayslip.netSalary).toLocaleString('en-IN')}` : '—'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{latestPayslip ? formatMonthName(latestPayslip.payrollMonth) : 'No Records'}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Disbursed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-emerald-700 tracking-wider">
              Total Earnings Received
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
              All Time
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-800">
              ₹{totalDisbursed.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Across {payslips.length} monthly salary cycles
            </p>
          </div>
        </div>

        {/* Card 3: Average Take-Home */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-violet-700 tracking-wider">
              Average Net Pay
            </span>
            <span className="text-[10px] font-bold text-slate-400">Monthly</span>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-800">
              ₹{avgSalary.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Standard net compensation
            </p>
          </div>
        </div>

        {/* Card 4: Disbursed Account */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">
              Payment Account
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold ${bank?.accountNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{bank?.accountNumber ? 'Saved' : 'Not added'}</span>
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-base font-bold text-slate-900 truncate">
              {bank?.bankName || 'No bank yet'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {bank?.accountNumber
                ? `A/C ****${bank.accountNumber.slice(-4)} • ${bank.ifsc || ''}`
                : 'Add your bank once so HR/Admin can transfer salary.'}
            </p>
            <button
              type="button"
              onClick={openBankModal}
              className="mt-2 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
            >
              {bank?.accountNumber ? 'Update Bank' : '+ Add Bank Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Payslips Table / History Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Header & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Month-wise Salary Slips ({filteredPayslips.length})
            </h2>
          
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by month or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredPayslips.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400 text-xs">
              {salaryNote || 'No salary slip yet.'}
            </div>
          ) : (
            filteredPayslips.map((rec) => (
              <div key={`mob-${rec.id}`} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-xs">
                      {rec.payrollMonth ? rec.payrollMonth.split('-')[1] : 'M'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{formatMonthName(rec.payrollMonth)}</p>
                      <span className="text-[11px] text-slate-400 font-mono">{rec.paymentDate || 'Not paid yet'}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{rec.status || 'Paid'}</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross</span>
                    <span className="text-xs font-bold text-slate-800">₹{amount(rec.grossSalary).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Deductions</span>
                    <span className="text-xs font-bold text-rose-600">-₹{amount(rec.totalDeductions).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Net Pay</span>
                    <span className="text-xs font-black text-emerald-700">₹{amount(rec.netSalary).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewSlip(rec.id)}
                    className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint(rec.id)}
                    className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table List (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Disbursement Date</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4 font-black text-indigo-950">Net Take-Home</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {salaryNote || 'No salary slip yet.'}
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Pay Period */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 font-black text-xs">
                          {rec.payrollMonth ? rec.payrollMonth.split('-')[1] : 'M'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">
                            {formatMonthName(rec.payrollMonth)}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rec.payrollMonth}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Disbursement Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {rec.paymentDate || 'Not paid yet'}
                    </td>

                    {/* Gross Earnings */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{amount(rec.grossSalary).toLocaleString('en-IN')}
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 text-rose-600 font-bold">
                      -₹{amount(rec.totalDeductions).toLocaleString('en-IN')}
                    </td>

                    {/* Net Take-Home */}
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      ₹{amount(rec.netSalary).toLocaleString('en-IN')}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                        <span>{rec.status || 'Paid'}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewSlip(rec.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title="View detailed payslip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>

                        <button
                          onClick={() => handlePrint(rec.id)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                          title="Print / Save PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED PRINTABLE PAYSLIP MODAL */}
      {/* ========================================================================= */}
      {mounted && selectedPayslip && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayslip(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/80 relative animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col overflow-hidden cursor-default transition-all"
          >
            {/* Modal Actions Header (Hidden when printing) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white print:hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Employee Salary Slip • {formatMonthName(selectedPayslip.payrollMonth)}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Official payslip document
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.2]" />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP CONTENT */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto [scrollbar-width:thin]">
              <div id="printable-payslip" className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white space-y-6">
              {/* Company Branding */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                      {(user?.companyName?.[0] || 'O').toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {user?.companyName || 'Corporate Organization'}
                      </h2>
                      <p className="text-[11px] font-bold text-emerald-700">
                        Human Resource Management & Payroll Division
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm">
                    {user?.companyName ? `Corporate Payroll Division • ${user.companyName}` : 'Corporate Payroll & Finance Division'}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider inline-block">
                    PAYSLIP CONFIRMATION
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-2">
                    Pay Period: {formatMonthName(selectedPayslip.payrollMonth)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Disbursed: {selectedPayslip.paymentDate || 'Not paid yet'}
                  </p>
                </div>
              </div>

              {/* Employee & Bank Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Employee Name:</span>
                    <span className="font-extrabold text-slate-900">{selectedPayslip.employeeName || currentEmpName || 'Employee'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Employee Code:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {selectedPayslip.employeeCode || employeeDetails?.employeeCode || (user as any).employeeCode || '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Designation:</span>
                    <span className="font-bold text-slate-800">
                      {selectedPayslip.designationTitle || employeeDetails?.designationTitle || (employeeDetails as any)?.designation || (user as any).designation || user?.role || 'EMPLOYEE'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Department:</span>
                    <span className="font-bold text-slate-800">
                      {selectedPayslip.departmentName || employeeDetails?.departmentName || (user as any).departmentName || 'General'}
                    </span>
                  </p>
                </div>

                <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Bank Name:</span>
                    <span className="font-bold text-slate-800">{bank?.bankName || 'Not added'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Account Number:</span>
                    <span className="font-bold text-slate-800 font-mono">{bank?.accountNumber ? `****${bank.accountNumber.slice(-4)}` : 'Not added'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">IFSC:</span>
                    <span className="font-bold text-slate-800">{bank?.ifsc || 'Not added'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Status:</span>
                    <span className="font-bold text-slate-800">{selectedPayslip.status || 'Generated'}</span>
                  </p>
                </div>
              </div>

              {/* Side-by-Side Earnings and Deductions Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings Column */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex justify-between items-center">
                    <span className="font-black text-xs text-emerald-900 uppercase">Earnings</span>
                    <span className="font-bold text-xs text-emerald-700">Amount (INR)</span>
                  </div>
                  <div className="p-3 text-xs space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span>Basic Salary</span>
                      <span className="font-bold">₹{amount(selectedPayslip.basicSalary).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-bold">₹{amount(selectedPayslip.hra).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Special / Conveyance Allowance</span>
                      <span className="font-bold">₹{amount(selectedPayslip.allowances).toLocaleString('en-IN')}</span>
                    </div>
                    {selectedPayslip.bonus > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Performance Bonus / Incentive</span>
                        <span className="font-bold text-emerald-600">+₹{amount(selectedPayslip.bonus).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                    <span>Total Gross Earnings:</span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{amount(selectedPayslip.grossSalary).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex justify-between items-center">
                    <span className="font-black text-xs text-rose-900 uppercase">Deductions</span>
                    <span className="font-bold text-xs text-rose-700">Amount (INR)</span>
                  </div>
                  <div className="p-3 text-xs space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span>Deductions</span>
                      <span className="font-bold">₹{amount(selectedPayslip.totalDeductions).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                    <span>Total Deductions:</span>
                    <span className="text-sm font-black text-rose-600">
                      -₹{amount(selectedPayslip.totalDeductions).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Take-Home Highlight Banner */}
              <div className="p-4 sm:p-5 rounded-xl bg-indigo-50 border-2 border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">
                    Net Take-Home Disbursed Amount
                  </span>
                  <p className="text-xs text-indigo-900/80 font-medium mt-0.5 italic">
                    {numberToWords(amount(selectedPayslip.netSalary))}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-indigo-700">
                    ₹{amount(selectedPayslip.netSalary).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    ● Disbursed to Bank
                  </span>
                </div>
              </div>

              {/* Verification & Stamp Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-700">{user?.companyName || 'Corporate'} HR & Finance Systems</p>
                  <p className="text-[10px]">This is a computer generated salary document and does not require a physical signature.</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-lg border-2 border-emerald-600 text-emerald-700 font-black text-[10px] uppercase tracking-widest rotate-[-2deg]">
                    ✓ PAID & CONFIRMED
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && isBankModalOpen && createPortal(
        <div
          onClick={() => setIsBankModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Bank Account Details</h3>
              <button type="button" onClick={() => setIsBankModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                  placeholder="Full name as per bank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="Enter bank account number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={bankForm.ifsc}
                  onChange={(e) => setBankForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase() }))}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={bankSaving} className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold cursor-pointer disabled:opacity-50">
                  {bankSaving ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
