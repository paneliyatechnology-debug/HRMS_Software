import { Employee } from '../types/hrms';
import { mockEmployees } from './mockData';

const EMPLOYEES_STORAGE_KEY = 'hrms_employees_records';

/**
 * Retrieve all employees from localStorage, initialized with mockEmployees
 */
export function getAllEmployees(): Employee[] {
  if (typeof window === 'undefined') return mockEmployees;
  try {
    const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy demo employees
        const clean = parsed.filter(
          (e) =>
            e.id !== 'emp-2' &&
            e.id !== 'emp-3' &&
            !(e.firstName === 'Rahul' && e.lastName === 'Sharma') &&
            !(e.firstName === 'Priya' && e.lastName === 'Patel')
        );
        return clean.length > 0 ? clean : mockEmployees;
      }
    }
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(mockEmployees));
    return mockEmployees;
  } catch (err) {
    console.error('Failed to load employees from storage:', err);
    return mockEmployees;
  }
}

/**
 * Persist employees to localStorage and dispatch update event
 */
export function saveEmployees(employees: Employee[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    window.dispatchEvent(new Event('hrms_employees_updated'));
  } catch (err) {
    console.error('Failed to save employees:', err);
  }
}

/**
 * Add a new employee to the roster
 */
export function addEmployee(data: Partial<Employee>): Employee {
  const current = getAllEmployees();
  const nextNum = current.length + 1;
  const newId = `emp-${Date.now()}`;
  const code = data.employeeCode || `EMP-${nextNum}`;

  const newEmployee: Employee = {
    id: newId,
    employeeCode: code,
    firstName: data.firstName || 'New',
    lastName: data.lastName || 'Staff',
    email: data.email || `employee.${Date.now()}@paneliya.com`,
    phone: data.phone || '+91 98765 43210',
    avatarUrl: data.avatarUrl || '',
    gender: data.gender || 'Male',
    dateOfBirth: data.dateOfBirth || '1995-01-01',
    address: data.address || 'Corporate Tower, Paneliya HRMS',
    emergencyContact: data.emergencyContact || {
      name: 'Emergency Contact',
      relationship: 'Family',
      phone: '+91 98765 00000',
    },
    joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
    employmentType: data.employmentType || 'Full-time',
    status: 'Active',
    departmentId: data.departmentId || 'dept-1',
    departmentName: data.departmentName || 'Engineering',
    designationId: data.designationId || 'desig-1',
    designationTitle: data.designationTitle || 'Software Engineer',
    reportingManagerId: data.reportingManagerId || 'emp-1',
    reportingManagerName: data.reportingManagerName || 'Keyur Sangani',
    workLocationId: 'loc-1',
    workLocationName: 'Corporate Headquarters',
    shift: data.shift || 'General Shift (09:30 AM - 06:30 PM)',
    bankDetails: data.bankDetails || {
      bankName: 'HDFC Bank',
      accountNumber: '99201948191',
      ifscOrRouting: 'HDFC0001234',
      accountHolderName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    },
    taxInformation: {
      taxId: 'PAN123456',
      panOrSsn: 'ABCDE1234F',
      taxRegime: 'New Regime (2026-2027)',
    },
    education: [
      {
        degree: 'Bachelor of Technology in Computer Engineering',
        institution: 'Gujarat Technological University',
        year: 2020,
      },
    ],
    previousExperience: [
      {
        company: 'Technology Solutions Ltd.',
        role: 'Junior Engineer',
        years: 2,
      },
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'System Architecture'],
    salary: data.salary || {
      basic: 65000,
      hra: 26000,
      allowances: 10000,
      bonus: 5000,
      pf: 7800,
      tax: 8000,
      professionalTax: 200,
      gross: 106000,
      net: 90000,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newEmployee, ...current];
  saveEmployees(updated);
  return newEmployee;
}

/**
 * Remove / Delete an employee by ID
 */
export function removeEmployee(id: string): { success: boolean; message: string } {
  const current = getAllEmployees();
  const found = current.find((e) => e.id === id);

  if (!found) {
    return { success: false, message: 'Employee not found.' };
  }

  // Prevent deleting primary super admin
  if (found.email === 'keyur.sangani@paneliya.com' && current.length > 1) {
    return { success: false, message: 'Cannot remove the primary Super Admin account.' };
  }

  const updated = current.filter((e) => e.id !== id);
  saveEmployees(updated);

  return {
    success: true,
    message: `${found.firstName} ${found.lastName} (${found.employeeCode}) has been removed from staff.`,
  };
}

/**
 * Update an employee's details
 */
export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
  const current = getAllEmployees();
  const idx = current.findIndex((e) => e.id === id);

  if (idx === -1) return null;

  current[idx] = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveEmployees(current);
  return current[idx];
}
