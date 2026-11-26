'use client';

import React, { useState, useEffect } from 'react';
import { useCompanyLive } from '../../lib/useCompanyLive';
import { createPortal } from 'react-dom';
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
  loading?: boolean;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  onRefresh,
  loading: parentLoading = false,
}) => {
  const { user, hasPermission } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { showToast } = useSocket();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const day = new Date();
    day.setMonth(day.getMonth() - 1);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
  });
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

  const [records, setRecords] = useState<any[]>([]);

  const loadPayslips = async () => {
    try {
      const res = await api.listPayslips();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setRecords(list);
    } catch (err: any) {
      setRecords([]);
      showToast({ title: 'Payroll', message: err.message || 'Could not load payslips.', type: 'error' });
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  // Tab State: 'runs' (Payroll Runs) vs 'salaries' (Employee Salaries Structure)
  const [activeTab, setActiveTab] = useState<'runs' | 'salaries'>('runs');
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loadingSalaries, setLoadingSalaries] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [bankDate, setBankDate] = useState('');
  const [savingBankDate, setSavingBankDate] = useState(false);

  // Configure Salary Modal
  const [editingSalaryEmp, setEditingSalaryEmp] = useState<any | null>(null);
  const [formBasicSalary, setFormBasicSalary] = useState(30000);
  const [formHra, setFormHra] = useState(12000);
  const [formAllowances, setFormAllowances] = useState(5000);
  const [formBonus, setFormBonus] = useState(0);
  const [formDeductions, setFormDeductions] = useState(0);
  const [formOvertimePerHour, setFormOvertimePerHour] = useState(0);
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Salary History Modal
  const [historyEmp, setHistoryEmp] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!hasPermission('payroll.manage')) return;
    api.getBankDetails().then((data) => setBankDate(data?.date || '')).catch(() => undefined);
  }, [hasPermission]);

  const saveBankDate = async () => {
    if (!bankDate) {
      showToast({ title: 'Date required', message: 'Select the date when last month salary should open.', type: 'warning' });
      return;
    }
    setSavingBankDate(true);
    try {
      const saved = await api.saveBankFormDate(bankDate);
      setBankDate(saved?.date || bankDate);
      showToast({ title: 'Saved', message: 'On this date, last month salary opens for Employee, HR, and Manager.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Could not save', message: err.message || 'Try again.', type: 'error' });
    } finally {
      setSavingBankDate(false);
    }
  };

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
    fetchSalaries();
  }, []);
  useCompanyLive(['payroll', 'employees'], () => {
    void loadPayslips();
    void fetchSalaries();
    onRefresh();
  });

  useEffect(() => {
    if (activeTab === 'salaries') {
      fetchSalaries();
    }
  }, [activeTab]);

  const salaryUserId = (row: any) => String(row?.userId || row?.employeeId || '');
  const salaryName = (row: any) =>
    row?.userName || row?.employee?.fullName || row?.employeeName || 'Staff Member';
  const money = (value: unknown) => Number(value || 0);
  const showDate = (value?: string) => {
    const day = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'Active';
    const [year, month, date] = day.split('-');
    return `${Number(month)}/${Number(date)}/${year}`;
  };

  const handleOpenSalaryModal = (emp: any) => {
    setEditingSalaryEmp(emp);
    setFormBasicSalary(money(emp.basicSalary));
    setFormHra(money(emp.hra));
    setFormAllowances(money(emp.allowances));
    setFormBonus(money(emp.bonus));
    setFormDeductions(money(emp.deductions));
    setFormOvertimePerHour(money(emp.overtimePerHour));
    setFormEffectiveFrom(String(emp.effectiveFrom || new Date().toISOString()).slice(0, 10));
  };

  const handleAddSalary = async () => {
    try {
      const people = await api.getEmployees();
      const options = (Array.isArray(people) ? people : [])
        .map((person: any) => ({
          id: String(person.id || person.userId || ''),
          name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email || 'Employee',
        }))
        .filter((person) => person.id);
      setStaffOptions(options);
      const today = new Date().toISOString().slice(0, 10);
      setEditingSalaryEmp({ userId: options[0]?.id || '', userName: options[0]?.name || '' });
      setFormBasicSalary(0);
      setFormHra(0);
      setFormAllowances(0);
      setFormBonus(0);
      setFormDeductions(0);
      setFormOvertimePerHour(0);
      setFormEffectiveFrom(today);
    } catch (err: any) {
      showToast({ title: 'Employees', message: err.message || 'Could not load employees.', type: 'error' });
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalaryEmp) return;
    const empId = salaryUserId(editingSalaryEmp);
    if (!empId) {
      showToast({ title: 'Employee required', message: 'Choose the employee for this salary.', type: 'warning' });
      return;
    }
    setSavingSalary(true);
    try {
      await api.saveSalary(empId, {
        basicSalary: Number(formBasicSalary),
        hra: Number(formHra),
        allowances: Number(formAllowances),
        bonus: Number(formBonus),
        deductions: Number(formDeductions),
        overtimePerHour: Number(formOvertimePerHour),
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
      const empId = salaryUserId(emp);
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

  const monthOf = (row: any) => {
    if (row?.payrollMonth) return String(row.payrollMonth).slice(0, 7);
    if (row?.year && row?.month) return `${row.year}-${String(row.month).padStart(2, '0')}`;
    return '';
  };
  const monthRecords = records.filter((row) => monthOf(row) === selectedMonth);
  const payslipRows = monthRecords.map((r: any) => ({
    id: r.id,
    name: r.employeeName || r.userName || 'Employee',
    code: r.employeeCode || `EMP-${String(r.userId || r.employeeId || r.id).slice(0, 6).toUpperCase()}`,
    avatar: r.employeeAvatar || r.avatarUrl || '',
    role: r.designationTitle || r.role || 'Staff Member',
    basic: Number(r.basicSalary || 0),
    allowances: Number(r.allowances || 0),
    gross: Number(r.grossSalary || r.grossPay || 0),
    deductions: Number(r.totalDeductions || r.deduction || r.deductions || 0),
    net: Number(r.netSalary || r.netPay || 0),
    status: r.status || 'Generated',
  }));

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus !== 'Paid') return;
    try {
      await api.markPayslipPaid(id);
      setRecords((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'Paid' } : row)));
      showToast({ title: 'Marked paid', message: 'This salary slip is now paid.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Update failed', message: err.message || 'Could not mark this slip paid.', type: 'error' });
    }
  };

  const handleExportACH = () => {
    const csvContent =
      'Name,Role,NetPay,Month\n' +
      records
        .filter((row: any) => {
          const month = row.payrollMonth || (row.year && row.month ? `${row.year}-${String(row.month).padStart(2, '0')}` : '');
          return month === selectedMonth;
        })
        .map(
          (r: any) =>
            `"${r.userName || r.employeeName || ''}","${r.role || r.designationTitle || ''}",${Number(r.netPay || r.netSalary || 0)},${selectedMonth}`
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

  const handlePrintSlip = async () => {
    if (!selectedPayslip?.id) return;
    try {
      await api.downloadPayslipFile(selectedPayslip.id);
      showToast({ title: 'Downloaded', message: 'Salary slip PDF downloaded.', type: 'success' });
    } catch (err: any) {
      showToast({
        title: 'Print failed',
        message: err.message || 'Could not load the salary slip.',
        type: 'error',
      });
    }
  };

  const totalGross = payslipRows.reduce((acc, curr) => acc + curr.gross, 0);
  const totalNet = payslipRows.reduce((acc, curr) => acc + curr.net, 0);
  const totalDeductions = payslipRows.reduce((acc, curr) => acc + curr.deductions, 0);

  const handleGenerateBatch = async () => {
    if (salaries.length === 0) {
      showToast({
        title: 'Salary Structures Required',
        message: 'No employee salary structures found in the database. Please configure employee monthly salaries in the "Salary Structures" tab before running payroll.',
        type: 'error',
        module: 'payroll',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await api.generatePayroll(selectedMonth);
      const count = Array.isArray(res?.generated) ? res.generated.length : 0;
      const missing = Array.isArray(res?.missingSalary) ? res.missingSalary.length : 0;
      showToast({
        title: 'Payroll generated',
        message: missing
          ? `${count} slips created. ${missing} people have no salary for this month.`
          : `${count} salary slips created for ${selectedMonth}.`,
        type: missing ? 'warning' : 'success',
      });
      await loadPayslips();
      onRefresh();
    } catch (err: any) {
      showToast({
        title: 'Payroll Calculation Error',
        message: err?.message || 'Backend payroll generation failed (500). Please ensure employee salaries and attendance are recorded for this month.',
        type: 'error',
        module: 'payroll',
      });
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
            Payslips
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
            Salary setup ({salaries.length})
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
              onClick={handleAddSalary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b4332] text-white font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add salary</span>
            </button>
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
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3">
              <label className="text-xs font-bold text-slate-700">
                Salary date
                <input
                  type="date"
                  value={bankDate}
                  onChange={(event) => setBankDate(event.target.value)}
                  className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={saveBankDate}
                disabled={savingBankDate}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60"
              >
                {savingBankDate ? 'Saving...' : 'Save date'}
              </button>
              <p className="text-[11px] text-slate-500 max-w-xl">
                1. Set salary in Salary setup. 2. Choose a month and press Run Payroll. 3. On this date, Employee, HR, and Manager see last month&apos;s slip. Bank details are added by them, one time, from their own screen.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Gross</span>
          <p className="text-2xl font-semibold tracking-tight text-slate-800 mt-2">
            ₹{totalGross.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{selectedMonth}</span>
            <span>{payslipRows.length} slips</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Deductions</span>
          <p className="text-2xl font-semibold tracking-tight text-amber-600 mt-2">
            ₹{totalDeductions.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-400">From the salary structure</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Net pay</span>
          <p className="text-2xl font-semibold tracking-tight text-blue-600 mt-2">
            ₹{totalNet.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-400">Payable for {selectedMonth}</div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Monthly slips
          </h3>

          <button
            onClick={handleExportACH}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV</span>
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
                    <p className="mb-1 font-semibold text-slate-500">No payroll records generated for this cycle.</p>
                    {salaries.length === 0 ? (
                      <p className="text-amber-700 font-medium text-[11px] mt-1">
                        âš ï¸ Please configure employee salaries in the{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('salaries')}
                          className="underline font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        >
                          Salary Structures tab
                        </button>{' '}
                        first before running payroll.
                      </p>
                    ) : (
                      <p className="text-slate-400 text-[11px]">
                        Click &quot;Run Payroll&quot; above to calculate salaries for {salaries.length} employee{salaries.length > 1 ? 's' : ''}.
                      </p>
                    )}
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
                        <option value="Generated">Generated</option>
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

  {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
      TAB: EMPLOYEE SALARY STRUCTURES
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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

      {loadingSalaries || (parentLoading && salaries.length === 0) ? (
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
                  const empName = salaryName(sal);
                  const empId = salaryUserId(sal);
                  return (
                    <tr key={sal.id || empId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{empName}</div>
                        <div className="text-[10px] text-slate-400">{sal.role || ''}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        ₹{money(sal.basicSalary).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        ₹{money(sal.hra).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        ₹{money(sal.allowances).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        -₹{money(sal.deductions).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {showDate(sal.effectiveFrom)}
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
      {mounted && selectedPayslip && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayslip(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer overflow-y-auto"
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
                  onClick={handlePrintSlip}
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
                  <p className="font-bold text-slate-900 text-sm">{selectedPayslip.userName || selectedPayslip.employeeName || 'Employee'}</p>
                  <p className="text-slate-500">{selectedPayslip.role || selectedPayslip.designationTitle || ''}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-blue-600">
                    Period: {selectedPayslip.year && selectedPayslip.month ? `${selectedPayslip.year}-${String(selectedPayslip.month).padStart(2, '0')}` : selectedPayslip.payPeriod || ''}
                  </span>
                  <p className="text-slate-400 text-[10px]">Status: {selectedPayslip.status || 'Generated'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-1">Earnings</p>
                  <div className="flex justify-between text-slate-600 py-0.5"><span>Basic</span><span>₹{money(selectedPayslip.basicSalary).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-600 py-0.5"><span>HRA</span><span>₹{money(selectedPayslip.hra).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-600 py-0.5"><span>Allowances</span><span>₹{money(selectedPayslip.allowances).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-600 py-0.5"><span>Bonus</span><span>₹{money(selectedPayslip.bonus).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-600 py-0.5"><span>Overtime</span><span>₹{money(selectedPayslip.overtimePay).toLocaleString('en-IN')}</span></div>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-1">Deductions</p>
                  <div className="flex justify-between text-slate-600 py-0.5">
                    <span>Total deductions</span>
                    <span className="font-semibold text-rose-600">₹{money(selectedPayslip.deduction ?? selectedPayslip.deductions).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center">
                <span className="font-bold text-slate-900">Net Take-Home Salary:</span>
                <span className="text-lg font-semibold tracking-tight text-blue-600">
                  ₹{money(selectedPayslip.netPay ?? selectedPayslip.netSalary).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Configure Salary Modal (PUT /payroll/salaries/:employeeId) ── */}
      {mounted && Boolean(editingSalaryEmp) && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setEditingSalaryEmp(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
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
            <form onSubmit={handleSaveSalary} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              {!editingSalaryEmp?.id && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Employee</label>
                  <select
                    required
                    value={salaryUserId(editingSalaryEmp)}
                    onChange={(event) => {
                      const picked = staffOptions.find((person) => person.id === event.target.value);
                      setEditingSalaryEmp({ userId: event.target.value, userName: picked?.name || '' });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  >
                    {staffOptions.map((person) => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editingSalaryEmp?.id && (
                <p className="text-xs font-semibold text-slate-700">{salaryName(editingSalaryEmp)}</p>
              )}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bonus (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formBonus}
                    onChange={(e) => setFormBonus(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Overtime / hour (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formOvertimePerHour}
                    onChange={(e) => setFormOvertimePerHour(Number(e.target.value))}
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
        </div>,
        document.body
      )}

      {/* ── Salary History Modal (GET /payroll/salaries/:employeeId) ── */}
      {mounted && Boolean(historyEmp) && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setHistoryEmp(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
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
                      <span className="font-bold text-slate-800">Basic: ₹{money(h.basicSalary).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400">{showDate(h.effectiveFrom)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      HRA: ₹{money(h.hra).toLocaleString('en-IN')} • Allowances: ₹{money(h.allowances).toLocaleString('en-IN')} • Bonus: ₹{money(h.bonus).toLocaleString('en-IN')}
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
        </div>,
        document.body
      )}
    </div>
  );
};
