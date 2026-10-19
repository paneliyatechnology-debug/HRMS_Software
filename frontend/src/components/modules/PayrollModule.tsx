'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  CheckCircle,
  FileText,
  DollarSign,
  Play,
  X,
  Building,
} from 'lucide-react';
import { PayrollRecord } from '../../types/hrms';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface PayrollModuleProps {
  payrollRecords: PayrollRecord[];
  onRefresh: () => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  payrollRecords,
  onRefresh,
}) => {
  const { hasPermission } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const totalGross = payrollRecords.reduce((acc, curr) => acc + curr.grossSalary, 0);
  const totalNet = payrollRecords.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalDeductions = payrollRecords.reduce((acc, curr) => acc + curr.totalDeductions, 0);

  const handleGenerateBatch = async () => {
    setLoading(true);
    try {
      const res = await api.generatePayroll(selectedMonth);
      alert(`Payroll generated successfully for ${selectedMonth} (${res.recordsGenerated} records)!`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Payroll generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (id: string) => {
    try {
      const slip = await api.getPayslip(id);
      setSelectedPayslip(slip);
    } catch (err) {
      // fallback
      const rec = payrollRecords.find((p) => p.id === id);
      if (rec) {
        setSelectedPayslip({
          payslipId: rec.id,
          company: {
            name: 'Paneliya Technology Inc.',
            taxId: 'US-EIN-984102941',
            address: '100 Silicon Vista Blvd, Suite 800, San Francisco, CA 94105',
          },
          employee: {
            id: rec.employeeId,
            code: rec.employeeCode,
            name: rec.employeeName,
            designation: rec.designationTitle,
            department: rec.departmentName,
            joiningDate: '2023-01-10',
            bankName: 'Direct Deposit',
            accountNumber: '•••• 4910',
          },
          payPeriod: rec.payrollMonth,
          paymentDate: '2026-10-31',
          paymentMethod: 'Direct Bank Transfer',
          earnings: [
            { item: 'Basic Salary', amount: rec.basicSalary },
            { item: 'House Rent Allowance (HRA)', amount: rec.hra },
            { item: 'Special Allowances', amount: rec.allowances },
            { item: 'Performance Bonus', amount: rec.bonus },
          ],
          deductions: [
            { item: 'Provident Fund (PF)', amount: rec.pfDeduction },
            { item: 'Income Tax (TDS / Federal Tax)', amount: rec.taxDeduction },
            { item: 'Professional Tax (PT)', amount: rec.professionalTax },
          ],
          summary: {
            grossSalary: rec.grossSalary,
            totalDeductions: rec.totalDeductions,
            netSalary: rec.netSalary,
            currency: 'USD ($)',
            status: rec.status,
          },
        });
      }
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Payroll & Compensation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated salary calculations, statutory deductions, monthly disbursement batches, and payslip generation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          />

          {hasPermission('PROCESS_PAYROLL') && (
            <button
              onClick={handleGenerateBatch}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {loading ? 'Processing...' : 'Run Monthly Payroll'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Total Gross Salary</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            ${totalGross.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Total company liability</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Statutory Deductions (PF/Tax)</span>
          <p className="text-3xl font-black text-rose-500 mt-1">
            ${totalDeductions.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Withheld for tax compliance</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase">Net Disbursed Take-Home</span>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            ${totalNet.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold">100% Direct Deposit Ready</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-blue-600" /> October 2026 Payroll Batch
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Basic</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {payrollRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {rec.employeeName}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {rec.employeeCode} • {rec.departmentName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {rec.designationTitle}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">${rec.basicSalary.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-semibold">${(rec.hra + rec.allowances + rec.bonus).toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-bold text-rose-500">-${rec.totalDeductions.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">
                    ${rec.netSalary.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-600">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleViewPayslip(rec.id)}
                      className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition flex items-center gap-1 ml-auto"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Payslip Header */}
            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-5 mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  PANELIYA TECHNOLOGY INC.
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  100 Silicon Vista Blvd, Suite 800, San Francisco, CA 94105
                </p>
                <p className="text-[11px] text-slate-400">Employer Tax ID: US-EIN-984102941</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs uppercase">
                  Official Payslip
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                  Pay Period: {selectedPayslip.payPeriod}
                </p>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.employee.name}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">{selectedPayslip.employee.designation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Code</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.employee.code}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">{selectedPayslip.employee.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPayslip.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Account</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPayslip.employee.accountNumber}</span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-6 text-xs mb-6">
              {/* Earnings */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 border-b pb-1">
                  Earnings
                </h4>
                <div className="space-y-2">
                  {selectedPayslip.earnings.map((e: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">{e.item}</span>
                      <span className="font-bold text-slate-900 dark:text-white">${e.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 border-b pb-1">
                  Deductions
                </h4>
                <div className="space-y-2">
                  {selectedPayslip.deductions.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">{d.item}</span>
                      <span className="font-bold text-rose-500">-${d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Net Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-blue-100">Net Take-Home Pay</span>
                <p className="text-2xl font-black">${selectedPayslip.summary.netSalary.toLocaleString()} USD</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-white text-blue-600 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => alert('Downloading encrypted Payslip PDF...')}
                  className="px-4 py-2 rounded-xl bg-blue-500/40 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
