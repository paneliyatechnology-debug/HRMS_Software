'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  Building2,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { Employee, Department, AttendanceRecord, PayrollRecord, LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

interface ReportsModuleProps {
  company?: any;
  employees?: Employee[];
  departments?: Department[];
  attendance?: AttendanceRecord[];
  payroll?: PayrollRecord[];
  leaves?: LeaveRequest[];
  stats?: any;
}

type SavedReportId = 'employees' | 'attendance' | 'payroll' | 'leaves' | 'directory' | 'dept-cost';

const PIE_COLORS = [
  '#1b4332',
  '#2d6a4f',
  '#40916c',
  '#52b788',
  '#74c69d',
  '#95d5b2',
  '#d97706',
  '#64748b',
  '#0f766e',
];

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  company,
  employees: propEmployees,
  departments: propDepartments,
  attendance: propAttendance,
  payroll: propPayroll,
  leaves: propLeaves,
}) => {
  const { showToast } = useSocket();
  const [activeReport, setActiveReport] = useState<SavedReportId | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredDeptIdx, setHoveredDeptIdx] = useState<number | null>(null);
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  const [localEmployees, setLocalEmployees] = useState<Employee[]>(propEmployees || []);
  const [localDepartments, setLocalDepartments] = useState<Department[]>(propDepartments || []);
  const [localAttendance, setLocalAttendance] = useState<AttendanceRecord[]>(propAttendance || []);
  const [localPayroll, setLocalPayroll] = useState<PayrollRecord[]>(propPayroll || []);
  const [localLeaves, setLocalLeaves] = useState<LeaveRequest[]>(propLeaves || []);

  useEffect(() => {
    if (propEmployees) setLocalEmployees(propEmployees);
    if (propDepartments) setLocalDepartments(propDepartments);
    if (propAttendance) setLocalAttendance(propAttendance);
    if (propPayroll) setLocalPayroll(propPayroll);
    if (propLeaves) setLocalLeaves(propLeaves);
  }, [propEmployees, propDepartments, propAttendance, propPayroll, propLeaves]);

  // Fetch any datasets not provided via props so KPIs, charts, and saved reports use real backend data
  useEffect(() => {
    let isMounted = true;
    const fetchMissingData = async () => {
      try {
        setLoading(true);
        const [emps, depts, atts, lvs, pays] = await Promise.all([
          !propEmployees && localEmployees.length === 0 ? api.getEmployees().catch(() => null) : Promise.resolve(null),
          !propDepartments && localDepartments.length === 0 ? api.getDepartments().catch(() => null) : Promise.resolve(null),
          !propAttendance && localAttendance.length === 0 ? api.getAttendance().catch(() => null) : Promise.resolve(null),
          !propLeaves && localLeaves.length === 0 ? api.getLeaves().catch(() => null) : Promise.resolve(null),
          !propPayroll && localPayroll.length === 0 ? api.getPayroll().catch(() => null) : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        if (Array.isArray(emps)) setLocalEmployees(emps);
        if (Array.isArray(depts)) setLocalDepartments(depts);
        if (Array.isArray(atts)) setLocalAttendance(atts);
        if (Array.isArray(lvs)) setLocalLeaves(lvs);
        if (Array.isArray(pays)) setLocalPayroll(pays);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMissingData();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propEmployees, propDepartments, propAttendance, propLeaves, propPayroll]);

  // =========================================================================
  // GENUINE KPI CALCULATIONS (ZERO FABRICATED DATA)
  // =========================================================================
  const activeEmployees = useMemo(
    () => localEmployees.filter((e) => e.status === 'Active' || e.status === 'Probation' || e.status === 'On Notice'),
    [localEmployees]
  );
  const totalHeadcount = activeEmployees.length;

  const presentCount = useMemo(
    () =>
      localAttendance.filter(
        (a) =>
          a.status === 'Present' ||
          a.status === 'Late' ||
          (a.status as string) === 'Work From Home' ||
          (!a.isCompleted && Boolean(a.checkIn))
      ).length,
    [localAttendance]
  );

  const attendanceRateDisplay =
    localAttendance.length > 0 ? `${Math.round((presentCount / localAttendance.length) * 100)}%` : '0%';

  const exitedEmployees = useMemo(
    () =>
      localEmployees.filter(
        (e) => e.status === 'Resigned' || e.status === 'Terminated' || e.status === 'Retired' || e.status === 'Inactive'
      ),
    [localEmployees]
  );
  const attritionRateDisplay =
    localEmployees.length > 0 ? `${((exitedEmployees.length / localEmployees.length) * 100).toFixed(1)}%` : '0.0%';

  const medianTenureInfo = useMemo(() => {
    const now = Date.now();
    const tenures = localEmployees
      .map((e) => {
        if (!e.joiningDate) return null;
        const ts = Date.parse(e.joiningDate);
        if (Number.isNaN(ts) || ts > now) return null;
        return (now - ts) / (1000 * 60 * 60 * 24 * 365.25);
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    if (tenures.length === 0) {
      return { display: '—', pill: 'No dates', avgLabel: 'Joining dates missing' };
    }
    const mid = Math.floor(tenures.length / 2);
    const median = tenures.length % 2 === 0 ? (tenures[mid - 1] + tenures[mid]) / 2 : tenures[mid];
    const avg = tenures.reduce((a, b) => a + b, 0) / tenures.length;
    return {
      display: `${median.toFixed(1)}y`,
      pill: `Avg ${avg.toFixed(1)}y`,
      avgLabel: `${tenures.length} Staff`,
    };
  }, [localEmployees]);

  const totalPayrollCost = useMemo(
    () => localPayroll.reduce((acc, p) => acc + (Number(p.netSalary) || 0), 0),
    [localPayroll]
  );

  // =========================================================================
  // WORKFORCE DYNAMICS (9-MONTH TIMELINE FROM REAL JOINING DATES)
  // =========================================================================
  const workforceDynamics = useMemo(() => {
    const now = new Date();
    const months: Array<{
      key: string;
      label: string;
      endOfMonth: Date;
      hires: number;
      exits: number;
      total: number;
    }> = [];

    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      months.push({ key, label, endOfMonth, hires: 0, exits: 0, total: 0 });
    }

    localEmployees.forEach((emp) => {
      const joinTs = emp.joiningDate ? Date.parse(emp.joiningDate) : NaN;
      const isExited =
        emp.status === 'Resigned' || emp.status === 'Terminated' || emp.status === 'Retired' || emp.status === 'Inactive';

      if (!Number.isNaN(joinTs)) {
        const joinDate = new Date(joinTs);
        const joinKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        const mMatch = months.find((m) => m.key === joinKey);
        if (mMatch) mMatch.hires += 1;
      }

      months.forEach((m) => {
        if (!Number.isNaN(joinTs)) {
          if (joinTs <= m.endOfMonth.getTime()) {
            if (!isExited || m.key !== months[months.length - 1].key) {
              m.total += 1;
            }
          }
        } else if (!isExited) {
          m.total += 1;
        }
      });

      if (isExited) {
        months[months.length - 1].exits += 1;
      }
    });

    const maxVal = Math.max(
      4,
      ...months.map((m) => Math.max(m.total, m.hires, m.exits))
    );
    const niceMax = Math.ceil(maxVal / 4) * 4;
    return { months, niceMax };
  }, [localEmployees]);

  // =========================================================================
  // DEPARTMENT MIX (REAL EMPLOYEE DISTRIBUTION)
  // =========================================================================
  const departmentMix = useMemo(() => {
    const counts = new Map<string, number>();
    localDepartments.forEach((d) => {
      if (d.name) counts.set(d.name, 0);
    });

    localEmployees.forEach((emp) => {
      const matchedDept = localDepartments.find(
        (d) => d.id === emp.departmentId || d.name?.toLowerCase() === emp.departmentName?.toLowerCase()
      );
      const label = matchedDept?.name || emp.departmentName || 'General';
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    const slices = Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }));

    const total = slices.reduce((sum, s) => sum + s.count, 0);
    let cumulativeAngle = -Math.PI / 2;
    const segments = slices.map((s) => {
      const pct = total > 0 ? (s.count / total) * 100 : 0;
      const angle = total > 0 ? (s.count / total) * Math.PI * 2 : 0;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;
      return { ...s, pct, startAngle, endAngle };
    });

    return { segments, total };
  }, [localDepartments, localEmployees]);

  // =========================================================================
  // DEPARTMENT BREAKDOWN TABLE ROWS
  // =========================================================================
  const departmentRows = useMemo(
    () =>
      localDepartments.map((dept) => {
        const deptEmps = localEmployees.filter(
          (e) => e.departmentId === dept.id || e.departmentName?.toLowerCase() === dept.name.toLowerCase()
        );
        const empIds = new Set(deptEmps.map((e) => e.id));

        const deptAtt = localAttendance.filter((a) => empIds.has(a.employeeId));
        let ratioStr = '—';
        if (deptAtt.length > 0) {
          const pCount = deptAtt.filter(
            (a) => a.status === 'Present' || a.status === 'Late' || (!a.isCompleted && Boolean(a.checkIn))
          ).length;
          ratioStr = `${Math.round((pCount / deptAtt.length) * 100)}%`;
        }

        const deptPay = localPayroll.filter((p) => empIds.has(p.employeeId));
        const deptCost = deptPay.reduce((acc, p) => acc + (Number(p.netSalary) || 0), 0);
        const costStr = deptCost > 0 ? `₹${deptCost.toLocaleString()}` : '₹0';

        const exitedCount = deptEmps.filter(
          (e) => e.status === 'Resigned' || e.status === 'Terminated' || e.status === 'Inactive'
        ).length;
        const turnStr = deptEmps.length > 0 ? `${Math.round((exitedCount / deptEmps.length) * 100)}%` : '0%';

        return {
          dept: dept.name,
          code: dept.code || '—',
          count: deptEmps.length,
          ratio: ratioStr,
          cost: costStr,
          turn: turnStr,
        };
      }),
    [localDepartments, localEmployees, localAttendance, localPayroll]
  );

  // =========================================================================
  // EXPORTS (SINGLE REPORT CSV & EXPORT ALL XLSX)
  // =========================================================================
  const companyLabel = (company?.companyName || company?.name || 'Company').replace(/[^a-zA-Z0-9]/g, '_');

  const exportSingleReport = async (type: SavedReportId) => {
    setLoading(true);
    try {
      let csvContent = '';

      if (type === 'attendance') {
        if (localAttendance.length === 0) {
          showToast?.({ type: 'warning', title: 'No Data', message: 'No attendance records available to export.' });
          return;
        }
        csvContent = 'Date,Employee ID,Employee Name,Clock In,Clock Out,Break Mins,Working Hours,Status\n';
        localAttendance.forEach((a) => {
          csvContent += `"${a.date || ''}","${a.employeeId || ''}","${a.employeeName || ''}","${a.checkIn || ''}","${a.checkOut || ''}",${a.breakDurationMinutes || 0},${a.workingHours || 0},"${a.status || ''}"\n`;
        });
      } else if (type === 'employees' || type === 'dept-cost') {
        if (departmentRows.length === 0) {
          showToast?.({ type: 'warning', title: 'No Data', message: 'No department records available to export.' });
          return;
        }
        csvContent = 'Department,Code,Headcount,Present Ratio,Monthly Cost,Turnover %\n';
        departmentRows.forEach((r) => {
          csvContent += `"${r.dept}","${r.code}",${r.count},"${r.ratio}","${r.cost}","${r.turn}"\n`;
        });
      } else if (type === 'directory') {
        if (localEmployees.length === 0) {
          showToast?.({ type: 'warning', title: 'No Data', message: 'No employee records available to export.' });
          return;
        }
        csvContent = 'Employee ID,Code,Name,Department,Designation,Joining Date,Email,Phone,Employment Type,Status\n';
        localEmployees.forEach((e) => {
          csvContent += `"${e.id}","${e.employeeCode || ''}","${e.firstName || ''} ${e.lastName || ''}","${e.departmentName || ''}","${e.designationTitle || ''}","${e.joiningDate || ''}","${e.email || ''}","${e.phone || ''}","${e.employmentType || ''}","${e.status || ''}"\n`;
        });
      } else if (type === 'leaves') {
        if (localLeaves.length === 0) {
          showToast?.({ type: 'warning', title: 'No Data', message: 'No leave records available to export.' });
          return;
        }
        csvContent = 'Employee ID,Employee Name,Leave Type,Start Date,End Date,Days,Reason,Status\n';
        localLeaves.forEach((l) => {
          const days = l.daysCount ?? (l as any).days ?? 1;
          const lType = l.leaveType ?? (l as any).type ?? 'Leave';
          csvContent += `"${l.employeeId || ''}","${l.employeeName || ''}","${lType}","${l.startDate || ''}","${l.endDate || ''}",${days},"${(l.reason || '').replace(/"/g, '""')}","${l.status || ''}"\n`;
        });
      } else if (type === 'payroll') {
        if (localPayroll.length === 0) {
          showToast?.({ type: 'warning', title: 'No Data', message: 'No payroll records available to export.' });
          return;
        }
        csvContent = 'Employee ID,Employee Name,Period,Basic,Allowances,Deductions,Net Salary,Status\n';
        localPayroll.forEach((p) => {
          const period = p.payrollMonth || `${(p as any).month || ''} ${(p as any).year || ''}`.trim();
          const deductions = (p as any).deductions ?? ((p.pfDeduction || 0) + (p.taxDeduction || 0));
          csvContent += `"${p.employeeId || ''}","${p.employeeName || ''}","${period}",${p.basicSalary || 0},${p.allowances || 0},${deductions},${p.netSalary || 0},"${(p as any).status || 'Paid'}"\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyLabel}_${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showToast?.({
        type: 'success',
        title: 'Report Exported',
        message: `Official ${type} CSV export generated successfully.`,
      });
    } catch (err: any) {
      showToast?.({ type: 'error', title: 'Export Failed', message: err.message || 'Could not export dataset.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();
      let sheetsAdded = 0;

      if (departmentRows.length > 0) {
        const wsDept = XLSX.utils.json_to_sheet(
          departmentRows.map((r) => ({
            Department: r.dept,
            Code: r.code,
            Headcount: r.count,
            'Present Ratio': r.ratio,
            'Monthly Cost': r.cost,
            'Turnover %': r.turn,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsDept, 'Departments');
        sheetsAdded++;
      }

      if (localEmployees.length > 0) {
        const wsEmp = XLSX.utils.json_to_sheet(
          localEmployees.map((e) => ({
            Code: e.employeeCode || '',
            Name: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
            Department: e.departmentName || '',
            Designation: e.designationTitle || '',
            'Joining Date': e.joiningDate || '',
            Email: e.email || '',
            Status: e.status || '',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsEmp, 'Employees');
        sheetsAdded++;
      }

      if (localAttendance.length > 0) {
        const wsAtt = XLSX.utils.json_to_sheet(
          localAttendance.map((a) => ({
            Date: a.date || '',
            Employee: a.employeeName || a.employeeId,
            'Clock In': a.checkIn || '',
            'Clock Out': a.checkOut || '',
            'Break Mins': a.breakDurationMinutes || 0,
            'Worked Hours': a.workingHours || 0,
            Status: a.status || '',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance');
        sheetsAdded++;
      }

      if (localLeaves.length > 0) {
        const wsLeaves = XLSX.utils.json_to_sheet(
          localLeaves.map((l) => ({
            Employee: l.employeeName || l.employeeId,
            Type: l.leaveType || '',
            'Start Date': l.startDate || '',
            'End Date': l.endDate || '',
            Days: l.daysCount ?? 1,
            Status: l.status || '',
            Reason: l.reason || '',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsLeaves, 'Leaves');
        sheetsAdded++;
      }

      if (localPayroll.length > 0) {
        const wsPay = XLSX.utils.json_to_sheet(
          localPayroll.map((p) => ({
            Employee: p.employeeName || p.employeeId,
            Period: p.payrollMonth || '',
            'Basic Salary': p.basicSalary || 0,
            Allowances: p.allowances || 0,
            'Net Salary': p.netSalary || 0,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsPay, 'Payroll');
        sheetsAdded++;
      }

      if (sheetsAdded === 0) {
        showToast?.({ type: 'warning', title: 'No Data', message: 'No company records available to export yet.' });
        return;
      }

      XLSX.writeFile(wb, `${companyLabel}_HRMS_Analytics_All.xlsx`);
      showToast?.({
        type: 'success',
        title: 'Export All Complete',
        message: `Exported ${sheetsAdded} report sheets to Excel workbook.`,
      });
    } catch (err: any) {
      showToast?.({ type: 'error', title: 'Export Failed', message: err.message || 'Could not generate workbook.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSavedReport = (id: SavedReportId) => {
    setActiveReport(id);
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const savedReportCards: Array<{
    id: SavedReportId;
    title: string;
    description: string;
    icon: React.ReactNode;
    countLabel: string;
  }> = [
    {
      id: 'employees',
      title: 'Headcount by department',
      description: 'Distribution and department growth trends.',
      icon: <Building2 className="w-4 h-4 text-[#2d6a4f]" />,
      countLabel: `${localDepartments.length} depts`,
    },
    {
      id: 'attendance',
      title: 'Attendance & shift logs',
      description: 'Clock-ins, break duration, and worked hours.',
      icon: <Clock className="w-4 h-4 text-[#2d6a4f]" />,
      countLabel: `${localAttendance.length} logs`,
    },
    {
      id: 'payroll',
      title: 'Compensation benchmark',
      description: 'Monthly basic pay, allowances, and net salary.',
      icon: <DollarSign className="w-4 h-4 text-[#2d6a4f]" />,
      countLabel: `${localPayroll.length} slips`,
    },
    {
      id: 'leaves',
      title: 'Leave utilization',
      description: 'Approved, pending, and cancelled leave records.',
      icon: <Calendar className="w-4 h-4 text-[#2d6a4f]" />,
      countLabel: `${localLeaves.length} requests`,
    },
    {
      id: 'directory',
      title: 'Workforce directory',
      description: 'Complete active staff, designations, and tenure.',
      icon: <Users className="w-4 h-4 text-[#2d6a4f]" />,
      countLabel: `${localEmployees.length} staff`,
    },
    {
      id: 'dept-cost',
      title: 'Department cost summary',
      description: 'Present ratio, turnover, and monthly payroll cost.',
      icon: <FileSpreadsheet className="w-4 h-4 text-[#2d6a4f]" />,
      countLabel: totalPayrollCost > 0 ? `₹${totalPayrollCost.toLocaleString()}` : '₹0',
    },
  ];

  // SVG chart coordinate helpers for Workforce Dynamics
  const chartW = 640;
  const chartH = 220;
  const padL = 40;
  const padR = 20;
  const padT = 18;
  const padB = 28;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const { months: dynMonths, niceMax } = workforceDynamics;
  const stepX = dynMonths.length > 0 ? plotW / dynMonths.length : plotW;
  const yTicks = [0, Math.round(niceMax * 0.25), Math.round(niceMax * 0.5), Math.round(niceMax * 0.75), niceMax];
  const yFor = (val: number) => padT + plotH - (niceMax > 0 ? (val / niceMax) * plotH : 0);

  const linePoints = dynMonths
    .map((m, idx) => `${padL + idx * stepX + stepX / 2},${yFor(m.total)}`)
    .join(' ');

  const hoveredMonth = hoveredMonthIdx !== null ? dynMonths[hoveredMonthIdx] : null;

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* Top Right Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#dee2e6] bg-white text-slate-700 hover:bg-[#f8f9fa] font-semibold text-xs shadow-2xs transition cursor-pointer"
          title="Print Report"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Print</span>
        </button>
        <button
          type="button"
          onClick={handleExportAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dee2e6] bg-white hover:bg-[#f8f9fa] text-slate-800 font-semibold text-xs shadow-2xs active:scale-95 transition disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#2d6a4f]" />
          <span>{loading ? 'Exporting...' : 'Export All'}</span>
        </button>
      </div>

      {/* Row 1: 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Headcount */}
        <div className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 pb-4">
            <span className="text-slate-600 text-xs font-semibold block">Active Headcount</span>
            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5">{totalHeadcount}</p>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d8f3dc] text-[#1b4332] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>{localEmployees.length} Total</span>
            </span>
            <span className="text-slate-400 font-medium">{localDepartments.length} Depts</span>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 pb-4">
            <span className="text-slate-600 text-xs font-semibold block">Attendance Rate</span>
            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5">{attendanceRateDisplay}</p>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d8f3dc] text-[#1b4332] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>{presentCount} Present</span>
            </span>
            <span className="text-slate-400 font-medium">{localAttendance.length} Shifts</span>
          </div>
        </div>

        {/* Card 3: Attrition */}
        <div className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 pb-4">
            <span className="text-slate-600 text-xs font-semibold block">Attrition</span>
            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5">{attritionRateDisplay}</p>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                exitedEmployees.length > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-[#d8f3dc] text-[#1b4332]'
              }`}
            >
              {exitedEmployees.length > 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              <span>{exitedEmployees.length} Exits</span>
            </span>
            <span className="text-slate-400 font-medium">Staff Turnover</span>
          </div>
        </div>

        {/* Card 4: Median Tenure */}
        <div className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 pb-4">
            <span className="text-slate-600 text-xs font-semibold block">Median Tenure</span>
            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5">{medianTenureInfo.display}</p>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d8f3dc] text-[#1b4332] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>{medianTenureInfo.pill}</span>
            </span>
            <span className="text-slate-400 font-medium">{medianTenureInfo.avgLabel}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Workforce Dynamics (Left 2/3) + Department Mix (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workforce Dynamics Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[#dee2e6] shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">Workforce dynamics</h3>
            <span className="text-[11px] font-medium text-slate-400">Last 9 Months • Live Records</span>
          </div>

          {localEmployees.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No employee records available yet to plot workforce dynamics.
            </div>
          ) : (
            <div className="relative w-full">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-56 overflow-visible">
                {/* Horizontal dashed gridlines & Y-axis labels */}
                {yTicks.map((tick, idx) => {
                  const y = yFor(tick);
                  return (
                    <g key={`ytick-${idx}`}>
                      <line
                        x1={padL}
                        x2={chartW - padR}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={tick === 0 ? undefined : '3 3'}
                        strokeWidth={1}
                      />
                      <text
                        x={padL - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-medium"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Bars (Hires & Exits) and Hover Hit Zones */}
                {dynMonths.map((m, idx) => {
                  const cx = padL + idx * stepX + stepX / 2;
                  const barW = Math.min(18, stepX * 0.28);
                  const hiresH = niceMax > 0 ? (m.hires / niceMax) * plotH : 0;
                  const exitsH = niceMax > 0 ? (m.exits / niceMax) * plotH : 0;
                  const isHovered = hoveredMonthIdx === idx;

                  return (
                    <g
                      key={m.key}
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                      className="cursor-pointer"
                    >
                      {/* Invisible hover band */}
                      <rect
                        x={padL + idx * stepX}
                        y={padT}
                        width={stepX}
                        height={plotH + padB}
                        fill={isHovered ? 'rgba(216, 243, 220, 0.25)' : 'transparent'}
                        rx={6}
                      />
                      {/* Hires bar */}
                      <rect
                        x={cx - barW - 2}
                        y={yFor(m.hires)}
                        width={barW}
                        height={Math.max(m.hires > 0 ? 3 : 0, hiresH)}
                        rx={3}
                        fill="#2d6a4f"
                      />
                      {/* Exits bar */}
                      <rect
                        x={cx + 2}
                        y={yFor(m.exits)}
                        width={barW}
                        height={Math.max(m.exits > 0 ? 3 : 0, exitsH)}
                        rx={3}
                        fill="#e11d48"
                      />
                      {/* X-axis month label */}
                      <text
                        x={cx}
                        y={chartH - 6}
                        textAnchor="middle"
                        className={`text-[11px] font-medium ${isHovered ? 'fill-[#1b4332] font-bold' : 'fill-slate-500'}`}
                      >
                        {m.label}
                      </text>
                    </g>
                  );
                })}

                {/* Total Headcount Line & Dots */}
                <polyline
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth={2}
                  points={linePoints}
                />
                {dynMonths.map((m, idx) => {
                  const cx = padL + idx * stepX + stepX / 2;
                  const cy = yFor(m.total);
                  const isHovered = hoveredMonthIdx === idx;
                  return (
                    <circle
                      key={`dot-${m.key}`}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? '#1b4332' : '#ffffff'}
                      stroke="#0f172a"
                      strokeWidth={2}
                      className="pointer-events-none"
                    />
                  );
                })}
              </svg>

              {/* Floating Hover Tooltip */}
              {hoveredMonth && hoveredMonthIdx !== null && (
                <div
                  className="pointer-events-none absolute top-4 z-20 rounded-xl bg-white border border-[#dee2e6] shadow-lg px-3 py-2 text-xs min-w-[110px]"
                  style={{
                    left: `${Math.min(78, Math.max(8, ((hoveredMonthIdx + 0.5) / dynMonths.length) * 100))}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <p className="font-bold text-slate-900 mb-1">{hoveredMonth.label}</p>
                  <p className="text-[#2d6a4f] font-semibold">Hires : {hoveredMonth.hires}</p>
                  <p className="text-rose-600 font-semibold">Exits : {hoveredMonth.exits}</p>
                  <p className="text-slate-900 font-semibold">Total : {hoveredMonth.total}</p>
                </div>
              )}

              {/* Bottom Centered Legend */}
              <div className="mt-2 flex items-center justify-center">
                <div className="inline-flex items-center gap-4 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-[#2d6a4f]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2d6a4f]" />
                    Hires
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    Exits
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    Total
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Department Mix Pie Chart */}
        <div className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">Department mix</h3>
            <span className="text-[11px] font-medium text-slate-400">{departmentMix.total} Staff</span>
          </div>

          {departmentMix.segments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No department allocation data available yet.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 my-auto">
              <div className="relative">
                <svg viewBox="0 0 200 200" className="w-44 h-44">
                  {departmentMix.segments.length === 1 ? (
                    <circle
                      cx={100}
                      cy={100}
                      r={84}
                      fill={departmentMix.segments[0].color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      onMouseEnter={() => setHoveredDeptIdx(0)}
                      onMouseLeave={() => setHoveredDeptIdx(null)}
                      className="cursor-pointer"
                    />
                  ) : (
                    departmentMix.segments.map((seg, idx) => {
                      const r = hoveredDeptIdx === idx ? 88 : 84;
                      const x1 = 100 + r * Math.cos(seg.startAngle);
                      const y1 = 100 + r * Math.sin(seg.startAngle);
                      const x2 = 100 + r * Math.cos(seg.endAngle);
                      const y2 = 100 + r * Math.sin(seg.endAngle);
                      const largeArc = seg.endAngle - seg.startAngle > Math.PI ? 1 : 0;
                      const d = `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      return (
                        <path
                          key={seg.name}
                          d={d}
                          fill={seg.color}
                          stroke="#ffffff"
                          strokeWidth={2}
                          onMouseEnter={() => setHoveredDeptIdx(idx)}
                          onMouseLeave={() => setHoveredDeptIdx(null)}
                          className="cursor-pointer transition-all duration-150"
                        />
                      );
                    })
                  )}
                </svg>
                {hoveredDeptIdx !== null && departmentMix.segments[hoveredDeptIdx] && (
                  <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 text-white px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap shadow-md">
                    {departmentMix.segments[hoveredDeptIdx].name}: {departmentMix.segments[hoveredDeptIdx].count} (
                    {departmentMix.segments[hoveredDeptIdx].pct.toFixed(0)}%)
                  </div>
                )}
              </div>

              {/* Compact Department Legend */}
              <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px]">
                {departmentMix.segments.slice(0, 6).map((seg, idx) => (
                  <div
                    key={seg.name}
                    onMouseEnter={() => setHoveredDeptIdx(idx)}
                    onMouseLeave={() => setHoveredDeptIdx(null)}
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="font-medium text-slate-700 truncate max-w-[110px]">{seg.name}</span>
                    <span className="text-slate-400 font-semibold">{seg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Saved Reports Section */}
      <div className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Saved reports</h3>
          <span className="text-xs text-slate-400">
            {company?.companyName || company?.name || 'Company'} • Real-time Datasets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savedReportCards.map((card) => {
            const isSelected = activeReport === card.id;
            return (
              <div
                key={card.id}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-[#2d6a4f] bg-[#d8f3dc]/20 shadow-xs'
                    : 'border-[#dee2e6] bg-white hover:border-[#2d6a4f]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d8f3dc]/60 border border-[#b7e4c7] flex items-center justify-center shrink-0 mt-0.5">
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{card.title}</h4>
                      <span className="text-[10px] font-semibold text-[#1b4332] bg-[#d8f3dc]/60 px-2 py-0.5 rounded-full shrink-0">
                        {card.countLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{card.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-11">
                  <button
                    type="button"
                    onClick={() => handleOpenSavedReport(card.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition cursor-pointer"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => exportSingleReport(card.id)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Detailed Report Table (Opens when clicking "Open" on any Saved Report) */}
      {activeReport && (
        <div
          ref={detailSectionRef}
          className="rounded-2xl bg-white border border-[#dee2e6] shadow-2xs p-5 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2d6a4f]" />
              <span>{savedReportCards.find((c) => c.id === activeReport)?.title}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportSingleReport(activeReport)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                aria-label="Close report view"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin]">
            {(activeReport === 'employees' || activeReport === 'dept-cost') && (
              departmentRows.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No department data available.</div>
              ) : (
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Headcount</th>
                      <th className="py-3 px-4">Present Ratio</th>
                      <th className="py-3 px-4">Monthly Cost</th>
                      <th className="py-3 px-4">Turnover %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {row.dept} <span className="text-[10px] text-slate-400 font-mono">({row.code})</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#2d6a4f]">{row.count} Staff</td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">{row.ratio}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.cost}</td>
                        <td className="py-3 px-4 text-slate-500">{row.turn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeReport === 'directory' && (
              localEmployees.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No employee records available.</div>
              ) : (
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Joining Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-500">{emp.employeeCode || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{emp.firstName} {emp.lastName}</td>
                        <td className="py-3 px-4 text-slate-600">{emp.departmentName || 'General'}</td>
                        <td className="py-3 px-4 text-slate-600">{emp.designationTitle || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{emp.joiningDate || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d8f3dc] text-[#1b4332]">
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeReport === 'attendance' && (
              localAttendance.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No attendance records available.</div>
              ) : (
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Clock In</th>
                      <th className="py-3 px-4">Clock Out</th>
                      <th className="py-3 px-4">Break</th>
                      <th className="py-3 px-4">Worked Hours</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localAttendance.map((a) => (
                      <tr key={a.id || `${a.date}-${a.employeeId}`} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">{a.date}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{a.employeeName || a.employeeId}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{a.checkIn || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{a.checkOut || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{a.breakDurationMinutes ? `${a.breakDurationMinutes}m` : '0m'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#2d6a4f]">{a.workingHours ? `${a.workingHours}h` : '0h'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {a.status || 'Present'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeReport === 'leaves' && (
              localLeaves.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No leave requests available.</div>
              ) : (
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">End Date</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localLeaves.map((l) => {
                      const days = l.daysCount ?? (l as any).days ?? 1;
                      const lType = l.leaveType ?? (l as any).type ?? 'Leave';
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{l.employeeName || l.employeeId}</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{lType}</td>
                          <td className="py-3 px-4 text-slate-600">{l.startDate}</td>
                          <td className="py-3 px-4 text-slate-600">{l.endDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{days} {days === 1 ? 'day' : 'days'}</td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{l.reason || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : l.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : l.status === 'Cancelled'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}

            {activeReport === 'payroll' && (
              localPayroll.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No payroll records available.</div>
              ) : (
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Basic Pay</th>
                      <th className="py-3 px-4">Allowances</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4">Net Salary</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localPayroll.map((p) => {
                      const period = p.payrollMonth || `${(p as any).month || ''} ${(p as any).year || ''}`.trim();
                      const deductions = (p as any).deductions ?? ((p.pfDeduction || 0) + (p.taxDeduction || 0));
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.employeeName || p.employeeId}</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{period || 'Current'}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">₹{(p.basicSalary || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">₹{(p.allowances || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-rose-600">₹{deductions.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">₹{(p.netSalary || 0).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d8f3dc] text-[#1b4332]">
                              {(p as any).status || 'Paid'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
