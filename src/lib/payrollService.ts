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
  const basic = emp.salary?.basic || 45000;
  const hra = emp.salary?.hra || Math.round(basic * 0.4);
  const allowances = emp.salary?.allowances || Math.round(basic * 0.15);
  const bonus = emp.salary?.bonus || 0;
  const overtimePay = 0;
  const grossSalary = basic + hra + allowances + bonus + overtimePay;

  const pfDeduction = emp.salary?.pf || Math.round(basic * 0.12);
  const taxDeduction = emp.salary?.tax || Math.round(grossSalary * 0.05);
  const professionalTax = emp.salary?.professionalTax || 200;
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
 * Generate seed payroll records for all employees across the last 6 months
 */
export function generateSeedPayrollRecords(): PayrollRecord[] {
  const employees = getAllEmployees();
  const records: PayrollRecord[] = [];

  if (employees.length === 0) {
    return [];
  }

  const employeeList = employees;

  employeeList.forEach((emp) => {
    const salary = calculateEmployeeSalary(emp);
    const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Employee';

    DEFAULT_MONTHS.forEach((m, idx) => {
      // Add a slight realistic variation for bonus on specific festival month (e.g. October)
      const bonus = idx === 0 ? 5000 : 0;
      const gross = salary.grossSalary + bonus;
      const net = gross - salary.totalDeductions;

      records.push({
        id: `pay-${emp.id}-${m.month}`,
        payrollMonth: m.month,
        employeeId: emp.id,
        employeeName: empName,
        employeeCode: emp.employeeCode || `EMP-${emp.id.replace('emp-', '')}`,
        designationTitle: emp.designationTitle || 'Staff Member',
        departmentName: emp.departmentName || 'Technology',
        basicSalary: salary.basicSalary,
        hra: salary.hra,
        allowances: salary.allowances,
        bonus,
        overtimePay: 0,
        grossSalary: gross,
        pfDeduction: salary.pfDeduction,
        taxDeduction: salary.taxDeduction,
        professionalTax: salary.professionalTax,
        otherDeductions: 0,
        totalDeductions: salary.totalDeductions,
        netSalary: net,
        status: 'Paid',
        paymentDate: m.date,
        paymentMethod: 'Bank Direct Deposit (NEFT/RTGS)',
      });
    });
  });

  return records;
}

/**
 * Retrieve all payroll records from localStorage
 */
export function getAllPayrollRecords(): PayrollRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(PAYROLL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed initial records if not yet created
    const seeded = generateSeedPayrollRecords();
    savePayrollRecords(seeded);
    return seeded;
  } catch (err) {
    console.error('Failed to get payroll records:', err);
    return [];
  }
}

/**
 * Save payroll records to localStorage
 */
export function savePayrollRecords(records: PayrollRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('hrms_payroll_updated'));
  } catch (err) {
    console.error('Failed to save payroll records:', err);
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

  let matched = allRecords.filter((r) => {
    const rId = (r.employeeId || '').toLowerCase().trim();
    const rCode = (r.employeeCode || '').toLowerCase().trim();
    const rName = (r.employeeName || '').toLowerCase().trim();

    return (
      (idNorm && rId === idNorm) ||
      (codeNorm && rCode === codeNorm) ||
      (nameNorm && rName === nameNorm)
    );
  });

  // If no records matched for this employee, dynamically generate their 6-month history!
  if (matched.length === 0) {
    const employees = getAllEmployees();
    const foundEmp = employees.find(
      (e) =>
        (idNorm && e.id.toLowerCase() === idNorm) ||
        (emailNorm && e.email.toLowerCase() === emailNorm) ||
        (codeNorm && e.employeeCode.toLowerCase() === codeNorm)
    );

    const empObj = foundEmp || {
      id: employeeId || 'emp-self',
      employeeCode: employeeCode || 'EMP-101',
      firstName: employeeName ? employeeName.split(' ')[0] : 'Employee',
      lastName: employeeName ? employeeName.split(' ').slice(1).join(' ') : '',
      email: employeeEmail || 'staff@paneliya.com',
      departmentName: 'Engineering',
      designationTitle: 'Staff Member',
      salary: {
        basic: 50000,
        hra: 20000,
        allowances: 10000,
        bonus: 0,
        pf: 6000,
        tax: 4000,
        professionalTax: 200,
        gross: 80000,
        net: 69800,
      },
    };

    const salary = calculateEmployeeSalary(empObj);
    const resolvedName =
      `${empObj.firstName || ''} ${empObj.lastName || ''}`.trim() ||
      employeeName ||
      'Employee';

    const newRecords: PayrollRecord[] = DEFAULT_MONTHS.map((m, idx) => {
      const bonus = idx === 0 ? 5000 : 0;
      const gross = salary.grossSalary + bonus;
      const net = gross - salary.totalDeductions;

      return {
        id: `pay-${empObj.id}-${m.month}`,
        payrollMonth: m.month,
        employeeId: empObj.id,
        employeeName: resolvedName,
        employeeCode: empObj.employeeCode || `EMP-${empObj.id}`,
        designationTitle: empObj.designationTitle || 'Staff Member',
        departmentName: empObj.departmentName || 'Paneliya Technology',
        basicSalary: salary.basicSalary,
        hra: salary.hra,
        allowances: salary.allowances,
        bonus,
        overtimePay: 0,
        grossSalary: gross,
        pfDeduction: salary.pfDeduction,
        taxDeduction: salary.taxDeduction,
        professionalTax: salary.professionalTax,
        otherDeductions: 0,
        totalDeductions: salary.totalDeductions,
        netSalary: net,
        status: 'Paid',
        paymentDate: m.date,
        paymentMethod: 'Bank Direct Deposit (NEFT/RTGS)',
      };
    });

    const updatedAll = [...allRecords, ...newRecords];
    savePayrollRecords(updatedAll);
    matched = newRecords;
  }

  // Sort descending by month (latest month first)
  return matched.sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth));
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
