import { Employee } from '../types/hrms';

const EMPLOYEES_STORAGE_KEY = 'hrms_employees_records';

/**
 * Pure In-Memory Employee Storage
 * All employees strictly originate from backend database via API.
 * NO employee data is cached or stored in browser LocalStorage.
 */
let liveEmployees: Employee[] = [];

export function setLiveEmployees(employees: Employee[]): void {
  liveEmployees = Array.isArray(employees) ? [...employees] : [];
}

/**
 * Retrieve all employees from live database memory
 */
export function getAllEmployees(): Employee[] {
  return liveEmployees;
}

/**
 * Update live employees and notify listeners (strictly avoids localStorage persistence)
 */
export function saveEmployees(employees: Employee[]): void {
  liveEmployees = Array.isArray(employees) ? [...employees] : [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
      localStorage.removeItem('hrms_employees');
    } catch {}
    window.dispatchEvent(new Event('hrms_employees_updated'));
  }
}

/**
 * Add a new employee to the roster
 */
export function addEmployee(data: Partial<Employee>): Employee {
  const current = getAllEmployees();
  const nextNum = current.length + 1;
  const newId = data.id || `emp-${Date.now()}`;
  const code = data.employeeCode || `EMP-${nextNum}`;

  const newEmployee: Employee = {
    id: newId,
    employeeCode: code,
    companyId: data.companyId || '',
    companyName: data.companyName || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    password: data.password || '',
    avatarUrl: data.avatarUrl || '',
    gender: data.gender || 'Other',
    dateOfBirth: data.dateOfBirth || '',
    address: data.address || '',
    emergencyContact: data.emergencyContact || {
      name: '',
      relationship: '',
      phone: '',
    },
    joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
    employmentType: data.employmentType || 'Full-time',
    status: data.status || 'Active',
    departmentId: data.departmentId || '',
    departmentName: data.departmentName || '',
    designationId: data.designationId || '',
    designationTitle: data.designationTitle || '',
    reportingManagerId: data.reportingManagerId || '',
    reportingManagerName: data.reportingManagerName || '',
    workLocationId: data.workLocationId || '',
    workLocationName: data.workLocationName || '',
    shift: data.shift || 'General Shift',
    bankDetails: data.bankDetails || {
      bankName: '',
      accountNumber: '',
      ifscOrRouting: '',
      accountHolderName: '',
    },
    taxInformation: data.taxInformation || {
      taxId: '',
      panOrSsn: '',
      taxRegime: 'New Regime',
    },
    education: data.education || [],
    previousExperience: data.previousExperience || [],
    skills: data.skills || [],
    salary: data.salary || {
      basic: 0,
      hra: 0,
      allowances: 0,
      bonus: 0,
      pf: 0,
      tax: 0,
      professionalTax: 0,
      gross: 0,
      net: 0,
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
