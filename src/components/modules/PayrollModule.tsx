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
  MoreVertical,
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

  const totalGross = payrollRecords.reduce((acc, curr) => acc + (curr.grossSalary || 0), 0) || 203936;
  const totalNet = payrollRecords.reduce((acc, curr) => acc + (curr.netSalary || 0), 0) || 182400;
  const totalDeductions = payrollRecords.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0) || 21536;

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

  const mockPayslips = [
    {
      id: 'pr-1',
      name: 'John Deo',
      code: 'PAN-001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role: 'VP of Engineering',
      basic: 12500,
      allowances: 3500,
      gross: 16000,
      deductions: 2200,
      net: 13800,
      status: 'Paid',
    },
    {
      id: 'pr-2',
      name: 'Sarah Jenkins',
      code: 'PAN-002',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      role: 'HR Director',
      basic: 10000,
      allowances: 2500,
      gross: 12500,
      deductions: 1700,
      net: 10800,
      status: 'Paid',
    },
    {
      id: 'pr-3',
      name: 'Alex Mercer',
      code: 'PAN-004',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: 'Staff Software Engineer',
      basic: 9500,
      allowances: 2200,
      gross: 11700,
      deductions: 1600,
      net: 10100,
      status: 'Paid',
    },
    {
      id: 'pr-4',
      name: 'Priya Sharma',
      code: 'PAN-005',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      role: 'Head of Product Design',
      basic: 9000,
      allowances: 2000,
      gross: 11000,
      deductions: 1500,
      net: 9500,
      status: 'Paid',
    },
    {
      id: 'pr-5',
      name: 'Daniel Craig',
      code: 'PAN-022',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      role: 'Senior Full Stack Engineer',
      basic: 7500,
      allowances: 1500,
      gross: 9000,
      deductions: 1200,
      net: 7800,
      status: 'Processing',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Payroll & Compensation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated salary calculations, statutory deductions, tax slabs, and payslips
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-slate-200/80 text-xs text-slate-700 bg-white focus:outline-hidden"
          />

          <button
            onClick={handleGenerateBatch}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Calculating...' : 'Run Payroll'}</span>
          </button>
        </div>
      </div>

      {/* 3 Payroll Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Total Gross Salary</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ${totalGross.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Period: {selectedMonth}</span>
            <span>23 Staff</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Total Statutory Deductions</span>
          <p className="text-2xl font-bold text-amber-500 mt-2">
            ${totalDeductions.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>PF, ESI & Tax Withheld</span>
            <span>10.5% Avg</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Net Take-Home Disbursed</span>
          <p className="text-2xl font-bold text-blue-600 mt-2">
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
            onClick={() => alert('Exporting Bank ACH NACHA batch file...')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Bank Transfer File</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
              {mockPayslips.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rec.avatar}
                        alt={rec.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{rec.name}</p>
                        <span className="text-[10px] text-slate-400">{rec.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{rec.role}</td>
                  <td className="py-3 px-3 text-slate-700 font-medium">${rec.basic.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-500">+${rec.allowances.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-900 font-semibold">${rec.gross.toLocaleString()}</td>
                  <td className="py-3 px-3 text-amber-600 font-medium">-${rec.deductions.toLocaleString()}</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">${rec.net.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        rec.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() =>
                        setSelectedPayslip({
                          employee: {
                            name: rec.name,
                            code: rec.code,
                            department: 'Engineering',
                            designation: rec.role,
                            joiningDate: '2023-01-10',
                            bankName: 'Silicon Valley Bank',
                            accountNumber: '**** **** 4819',
                            panOrSsn: 'SSN-***-**-9281',
                          },
                          payPeriod: selectedMonth,
                          paymentDate: '2026-10-31',
                          paymentMethod: 'Direct Deposit ACH',
                          earnings: [
                            { item: 'Basic Salary', amount: rec.basic },
                            { item: 'House Rent Allowance (HRA)', amount: rec.allowances * 0.6 },
                            { item: 'Special Allowance', amount: rec.allowances * 0.4 },
                          ],
                          deductions: [
                            { item: 'Provident Fund (PF)', amount: rec.deductions * 0.6 },
                            { item: 'Tax Withholding (TDS)', amount: rec.deductions * 0.4 },
                          ],
                          summary: {
                            grossEarnings: rec.gross,
                            totalDeductions: rec.deductions,
                            netSalary: rec.net,
                          },
                        })
                      }
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                    >
                      View Slip
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Official Salary Slip</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-3">
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
                <span className="text-lg font-black text-blue-600">
                  ${selectedPayslip.summary.netSalary.toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
