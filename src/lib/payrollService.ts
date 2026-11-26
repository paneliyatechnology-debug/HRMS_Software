import { PayrollRecord, Employee } from '../types/hrms';
import { getAllEmployees } from './employeeService';

const PAYROLL_STORAGE_KEY = 'hrms_payroll_records';

/**
 * Default past months to generate historical salary records for
 */
const DEFAULT_MONTHS = [
  { month: '2026-10', date: '2026-10-31', days: 31, paidDays: 31 },
  { month: '2026-09', date: '2026-09-30', days: 30, paidDays: 30 },
  { month: '2026-08', date: '2026-08-31', days: 31, paidDays: 31 },
  { month: '2026-07', date: '2026-07-31', days: 31, paidDays: 30 },
  { month: '2026-06', date: '2026-06-30', days: 30, paidDays: 30 },
  { month: '2026-05', date: '2026-05-31', days: 31, paidDays: 31 },
];

/**
 * Calculate salary breakdown for an employee
 */
export function calculateEmployeeSalary(emp: Employee | any) {
  const basic = emp.salary?.basic || 0;
  const hra = emp.salary?.hra || Math.round(basic * 0.4);
  const allowances = emp.salary?.allowances || Math.round(basic * 0.15);
  const bonus = emp.salary?.bonus || 0;
  const overtimePay = 0;
  const grossSalary = basic + hra + allowances + bonus + overtimePay;

  const pfDeduction = emp.salary?.pf || Math.round(basic * 0.12);
  const taxDeduction = emp.salary?.tax || Math.round(grossSalary * 0.05);
  const professionalTax = emp.salary?.professionalTax || (basic > 0 ? 200 : 0);
  const otherDeductions = 0;
  const totalDeductions = pfDeduction + taxDeduction + professionalTax + otherDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    basicSalary: basic,
    hra,
    allowances,
    bonus,
    overtimePay,
    grossSalary,
    pfDeduction,
    taxDeduction,
    professionalTax,
    otherDeductions,
    totalDeductions,
    netSalary,
  };
}

/**
 * Retrieve seed payroll records (empty array - all real records originate from database)
 */
export function generateSeedPayrollRecords(): PayrollRecord[] {
  return [];
}

// Pure In-Memory Payroll Storage - live from database via API
let livePayrollStore: PayrollRecord[] = [];

export function setLivePayroll(records: PayrollRecord[]): void {
  livePayrollStore = Array.isArray(records) ? [...records] : [];
}

/**
 * Retrieve all payroll records (strictly from live database memory)
 */
export function getAllPayrollRecords(): PayrollRecord[] {
  return livePayrollStore;
}

/**
 * Save payroll records (strictly avoids localStorage persistence)
 */
export function savePayrollRecords(records: PayrollRecord[]): void {
  livePayrollStore = Array.isArray(records) ? [...records] : [];
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PAYROLL_STORAGE_KEY);
    window.dispatchEvent(new Event('hrms_payroll_updated'));
  } catch (err) {
    console.error('Failed to notify payroll update:', err);
  }
}

/**
 * Retrieve all payslips for a specific employee
 */
export function getEmployeePayslips(
  employeeId?: string,
  employeeEmail?: string,
  employeeCode?: string,
  employeeName?: string
): PayrollRecord[] {
  const allRecords = getAllPayrollRecords();

  const idNorm = (employeeId || '').toLowerCase().trim();
  const emailNorm = (employeeEmail || '').toLowerCase().trim();
  const codeNorm = (employeeCode || '').toLowerCase().trim();
  const nameNorm = (employeeName || '').toLowerCase().trim();

  const matched = allRecords.filter((r) => {
    const rId = (r.employeeId || '').toLowerCase().trim();
    const rCode = (r.employeeCode || '').toLowerCase().trim();
    const rName = (r.employeeName || '').toLowerCase().trim();

    return (
      (idNorm && rId === idNorm) ||
      (codeNorm && rCode === codeNorm) ||
      (nameNorm && rName === nameNorm)
    );
  });

  // Sort descending by month (latest month first)
  return matched.sort((a, b) => (b.payrollMonth || '').localeCompare(a.payrollMonth || ''));
}

/**
 * Convert number to Indian currency words (for payslip net pay)
 */
export function numberToWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Indian Rupees';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 === 0 ? '' : ' ' + inWords(n % 1000));
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 === 0 ? '' : ' ' + inWords(n % 100000));
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 === 0 ? '' : ' ' + inWords(n % 10000000));
  }

  return `${inWords(Math.round(num))} Indian Rupees Only`;
}
