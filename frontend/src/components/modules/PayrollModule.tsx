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
import { useSocket } from '../../context/SocketContext';

interface PayrollModuleProps {
  payrollRecords: PayrollRecord[];
  onRefresh: () => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  payrollRecords,
  onRefresh,
}) => {
  const { hasPermission } = useAuth();
  const { showToast } = useSocket();
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
      showToast({
        title: 'Payroll Generated',
        message: `Successfully calculated ${selectedMonth} payroll (${res.recordsGenerated} payslips created).`,
        type: 'success',
        module: 'payroll',
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Payroll generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = () => {
    if (!selectedPayslip) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${selectedPayslip.employee.name} (${selectedPayslip.payPeriod})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
            .title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
            .emp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 25px; font-size: 12px; }
            .emp-grid div { display: flex; flex-direction: column; }
            .emp-grid span.label { color: #94a3b8; font-weight: 700; text-transform: uppercase; font-size: 10px; }
            .emp-grid span.val { font-weight: 700; color: #0f172a; margin-top: 2px; }
            .tables-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 8px 0; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 11px; color: #475569; }
            td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .amount { text-align: right; font-weight: 700; }
            .net-box { background: #1e293b; color: white; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .net-val { font-size: 26px; font-weight: 900; color: #38bdf8; }
            .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">PANELIYA TECHNOLOGY INC.</div>
              <div class="subtitle">100 Silicon Vista Blvd, Suite 800, San Francisco, CA 94105</div>
              <div class="subtitle">EIN: US-EIN-984102941 • payroll@paneliya.com</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">OFFICIAL PAYSLIP</div>
              <div style="font-size: 16px; font-weight: 800; margin-top: 8px;">Period: ${selectedPayslip.payPeriod}</div>
              <div class="subtitle">Disbursed on ${selectedPayslip.paymentDate}</div>
            </div>
          </div>

          <div class="emp-grid">
            <div><span class="label">Employee Name</span><span class="val">${selectedPayslip.employee.name}</span></div>
            <div><span class="label">Employee ID</span><span class="val">${selectedPayslip.employee.code}</span></div>
            <div><span class="label">Department</span><span class="val">${selectedPayslip.employee.department}</span></div>
            <div><span class="label">Designation</span><span class="val">${selectedPayslip.employee.designation}</span></div>
            <div><span class="label">Joining Date</span><span class="val">${selectedPayslip.employee.joiningDate}</span></div>
            <div><span class="label">Bank Account</span><span class="val">${selectedPayslip.employee.bankName} (${selectedPayslip.employee.accountNumber})</span></div>
            <div><span class="label">Tax Identifier / SSN</span><span class="val">${selectedPayslip.employee.panOrSsn}</span></div>
            <div><span class="label">Payment Mode</span><span class="val">${selectedPayslip.paymentMethod}</span></div>
          </div>

          <div class="tables-grid">
            <div>
              <table>
                <thead><tr><th>Earnings</th><th style="text-align: right;">Amount (USD)</th></tr></thead>
                <tbody>
                  ${selectedPayslip.earnings.map((e: any) => `<tr><td>${e.item}</td><td class="amount">$${e.amount.toLocaleString()}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div>
              <table>
                <thead><tr><th>Deductions</th><th style="text-align: right;">Amount (USD)</th></tr></thead>
                <tbody>
                  ${selectedPayslip.deductions.map((d: any) => `<tr><td>${d.item}</td><td class="amount" style="color: #e11d48;">-$${d.amount.toLocaleString()}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="net-box">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">Net Take-Home Disbursed</div>
              <div class="net-val">$${selectedPayslip.summary.netSalary.toLocaleString()} USD</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #cbd5e1;">
              <div>Gross Pay: $${selectedPayslip.summary.grossSalary.toLocaleString()}</div>
              <div>Total Deductions: -$${selectedPayslip.summary.totalDeductions.toLocaleString()}</div>
            </div>
          </div>

          <div class="footer">
            <div>This is a computer-generated salary advice and requires no physical signature.</div>
            <div>Generated by Paneliya HRMS • Confidential</div>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayslip(null);
          }}
          className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto cursor-default">
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
                  onClick={handlePrintSlip}
                  className="px-4 py-2 rounded-xl bg-white text-blue-600 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-slate-100 transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={handlePrintSlip}
                  className="px-4 py-2 rounded-xl bg-blue-500/40 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 hover:bg-blue-500/60 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
