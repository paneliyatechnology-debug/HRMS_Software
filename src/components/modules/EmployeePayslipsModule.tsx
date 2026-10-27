'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  getEmployeePayslips,
  numberToWords,
} from '../../lib/payrollService';
import { getAllEmployees } from '../../lib/employeeService';

interface EmployeePayslipsModuleProps {
  onRefresh?: () => void;
}

export const EmployeePayslipsModule: React.FC<EmployeePayslipsModuleProps> = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  // Find corresponding employee record for bank details and tax info
  const currentEmpId = user.employeeId || user.id || '';
  const currentEmpEmail = user.email || '';
  const currentEmpCode = (user as any).employeeCode || '';
  const currentEmpName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  const employeeDetails: Employee | undefined = useMemo(() => {
    const list = getAllEmployees();
    return list.find(
      (e) =>
        (currentEmpId && e.id === currentEmpId) ||
        (currentEmpEmail && e.email && e.email.toLowerCase() === currentEmpEmail.toLowerCase()) ||
        (currentEmpCode && e.employeeCode && e.employeeCode.toLowerCase() === currentEmpCode.toLowerCase())
    );
  }, [currentEmpId, currentEmpEmail, currentEmpCode]);

  // Load payslips on mount and on storage events
  useEffect(() => {
    const load = () => {
      const records = getEmployeePayslips(
        currentEmpId,
        currentEmpEmail,
        currentEmpCode,
        currentEmpName
      );
      setPayslips(records);
    };

    load();
    window.addEventListener('hrms_payroll_updated', load);
    window.addEventListener('hrms_employees_updated', load);
    return () => {
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                My Payslips & Salary History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                View, download, and print your month-wise official salary disbursement slips.
              </p>
            </div>
          </div>
        </div>

        {/* Year Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setSelectedYear('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedYear === 'All'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Years
          </button>
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedYear === yr
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Salary */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">
              Latest In-Hand Salary
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Paid
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{(latestPayslip?.netSalary || 0).toLocaleString('en-IN')}
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
            <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
              Total Earnings Received
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
              All Time
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
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
            <span className="text-[11px] font-black uppercase text-violet-700 tracking-wider">
              Average Net Pay
            </span>
            <span className="text-[10px] font-bold text-slate-400">Monthly</span>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
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
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-base font-bold text-slate-900 truncate">
              {employeeDetails?.bankDetails?.bankName || 'HDFC Bank'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              A/C: **** {employeeDetails?.bankDetails?.accountNumber?.slice(-4) || '4819'} • Direct Deposit
            </p>
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
            <p className="text-xs text-slate-500">
              Click &quot;View Slip&quot; on any month to see the complete salary breakdown and download PDF.
            </p>
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

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Disbursement Date</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions (PF & Tax)</th>
                <th className="py-3 px-4 font-black text-indigo-950">Net Take-Home</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No payslips found matching your filters.
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
                      {rec.paymentDate || 'End of Month'}
                    </td>

                    {/* Gross Earnings */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{rec.grossSalary.toLocaleString('en-IN')}
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 text-rose-600 font-bold">
                      -₹{rec.totalDeductions.toLocaleString('en-IN')}
                    </td>

                    {/* Net Take-Home */}
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      ₹{rec.netSalary.toLocaleString('en-IN')}
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
                          onClick={() => setSelectedPayslip(rec)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95"
                          title="View detailed payslip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPayslip(rec);
                            setTimeout(() => {
                              window.print();
                            }, 300);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all"
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
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto [scrollbar-width:thin]">
            {/* Modal Actions Header (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Employee Salary Slip • {formatMonthName(selectedPayslip.payrollMonth)}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 stroke-[2.2]" />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP CONTENT */}
            <div id="printable-payslip" className="mt-4 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 bg-white space-y-6">
              {/* Company Branding */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                      P
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Paneliya Technology Inc.
                      </h2>
                      <p className="text-[11px] font-bold text-indigo-600">
                        Human Resource Management & Payroll Division
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm">
                    Corporate Office: Paneliya Technology Park, Surat, Gujarat, India • CIN: U72900GJ2026PTC10928
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider inline-block">
                    PAYSLIP CONFIRMATION
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-2">
                    Pay Period: {formatMonthName(selectedPayslip.payrollMonth)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Disbursed: {selectedPayslip.paymentDate || '2026-10-31'}
                  </p>
                </div>
              </div>

              {/* Employee & Bank Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Employee Name:</span>
                    <span className="font-extrabold text-slate-900">{selectedPayslip.employeeName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Employee Code:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedPayslip.employeeCode}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Designation:</span>
                    <span className="font-bold text-slate-800">{selectedPayslip.designationTitle}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Department:</span>
                    <span className="font-bold text-slate-800">{selectedPayslip.departmentName}</span>
                  </p>
                </div>

                <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Bank Name:</span>
                    <span className="font-bold text-slate-800">
                      {employeeDetails?.bankDetails?.bankName || 'HDFC Bank Ltd.'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Account Number:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      **** **** {employeeDetails?.bankDetails?.accountNumber?.slice(-4) || '4819'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800">{selectedPayslip.paymentMethod || 'Direct Deposit'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-slate-500">PAN / Tax ID:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {employeeDetails?.taxInformation?.panOrSsn || 'ABCDE1234F'}
                    </span>
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
                      <span className="font-bold">₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-bold">₹{selectedPayslip.hra.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Special / Conveyance Allowance</span>
                      <span className="font-bold">₹{selectedPayslip.allowances.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedPayslip.bonus > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Performance Bonus / Incentive</span>
                        <span className="font-bold text-emerald-600">+₹{selectedPayslip.bonus.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                    <span>Total Gross Earnings:</span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{selectedPayslip.grossSalary.toLocaleString('en-IN')}
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
                      <span>Provident Fund (EPF Employee Share)</span>
                      <span className="font-bold">₹{selectedPayslip.pfDeduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Tax Deducted at Source (TDS)</span>
                      <span className="font-bold">₹{selectedPayslip.taxDeduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Professional Tax (PT)</span>
                      <span className="font-bold">₹{selectedPayslip.professionalTax.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedPayslip.otherDeductions > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Other Deductions</span>
                        <span className="font-bold">₹{selectedPayslip.otherDeductions.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                    <span>Total Deductions:</span>
                    <span className="text-sm font-black text-rose-600">
                      -₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}
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
                    {numberToWords(selectedPayslip.netSalary)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-black text-indigo-700">
                    ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    ● Disbursed to Bank
                  </span>
                </div>
              </div>

              {/* Verification & Stamp Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-700">Paneliya Technology HR & Finance Systems</p>
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
      )}
    </div>
  );
};
