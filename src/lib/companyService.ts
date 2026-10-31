import { Employee, Role } from '../types/hrms';
import { getAllEmployees, saveEmployees } from './employeeService';

export interface CompanyAdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  designation: string;
  role: 'HR_ADMIN';
  lastLogin?: string;
  password?: string;
}

export interface CompanyTenant {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  industry: string;
  plan: 'Starter' | 'Growth' | 'Enterprise' | 'Custom';
  status: 'Active' | 'Suspended' | 'Pending Setup';
  createdAt: string;
  billingCycle: 'Monthly' | 'Annual';
  maxEmployees: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  adminUser: CompanyAdminUser;
  departments: string[];
  employeesCount?: number;
  monthlyPayrollEstimate?: number;
  activePunchesToday?: number;
}

const COMPANIES_STORAGE_KEY = 'hrms_multi_tenant_companies';
const TENANT_EMPLOYEES_STORAGE_KEY = 'hrms_tenant_company_employees';

export const initialCompanies: CompanyTenant[] = [];

// Pure In-Memory Company and Tenant Employee Storage
let liveCompaniesStore: CompanyTenant[] = [];
let liveTenantEmployeesStore: Record<string, Employee[]> = {};

export function setLiveCompanies(companies: CompanyTenant[]): void {
  liveCompaniesStore = Array.isArray(companies) ? [...companies] : [];
}

/**
 * Retrieve all registered tenant companies (from live database memory)
 */
export function getAllCompanies(): CompanyTenant[] {
  return liveCompaniesStore;
}

/**
 * Update companies and notify listeners (strictly avoids localStorage persistence)
 */
export function saveCompanies(companies: CompanyTenant[]): void {
  liveCompaniesStore = Array.isArray(companies) ? [...companies] : [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(COMPANIES_STORAGE_KEY);
      localStorage.removeItem(TENANT_EMPLOYEES_STORAGE_KEY);
      localStorage.removeItem('hrms_all_companies_v2');
      localStorage.removeItem('hrms_current_company');
    } catch {}
    window.dispatchEvent(new Event('hrms_companies_updated'));
  }
}

/**
 * Create a new tenant company with its owner admin
 */
export function createCompany(data: {
  id?: string;
  name: string;
  code?: string;
  industry: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminDesignation?: string;
  temporaryPassword?: string;
  city: string;
  state: string;
  address?: string;
  maxEmployees?: number;
  departments?: string[];
}): CompanyTenant {
  const all = getAllCompanies();
  const id = data.id || `comp-${Date.now()}`;
  const code = data.code || `COMP-${all.length + 101}`;

  const newCompany: CompanyTenant = {
    id,
    name: data.name,
    code,
    industry: data.industry || 'Technology & Services',
    plan: data.plan || 'Growth',
    status: 'Active',
    createdAt: new Date().toISOString().split('T')[0],
    billingCycle: 'Annual',
    maxEmployees: data.maxEmployees || 50,
    contactEmail: data.adminEmail,
    contactPhone: data.adminPhone,
    address: data.address || `${data.city} Tech Park`,
    city: data.city || 'Surat',
    state: data.state || 'Gujarat',
    country: 'India',
    adminUser: {
      id: `admin-${Date.now()}`,
      fullName: data.adminName,
      email: data.adminEmail,
      phone: data.adminPhone,
      designation: data.adminDesignation || 'Managing Director / Owner',
      role: 'HR_ADMIN',
      lastLogin: 'Never logged in',
      password: data.temporaryPassword || 'Admin@123',
    },
    departments: data.departments && data.departments.length > 0
      ? data.departments
      : ['General Administration', 'Operations', 'Human Resources', 'Technical Staff'],
    employeesCount: 0,
    monthlyPayrollEstimate: 0,
    activePunchesToday: 0,
  };

  const updated = [newCompany, ...all];
  saveCompanies(updated);
  return newCompany;
}

/**
 * Update an existing company
 */
export function updateCompany(id: string, updates: Partial<CompanyTenant>): void {
  const all = getAllCompanies();
  const updated = all.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCompanies(updated);
}

/**
 * Toggle active / suspended status
 */
export function toggleCompanyStatus(id: string): 'Active' | 'Suspended' {
  const all = getAllCompanies();
  let nextStatus: 'Active' | 'Suspended' = 'Active';
  const updated = all.map((c) => {
    if (c.id === id) {
      nextStatus = c.status === 'Active' ? 'Suspended' : 'Active';
      return { ...c, status: nextStatus };
    }
    return c;
  });
  saveCompanies(updated);
  return nextStatus;
}

/**
 * Retrieve all employees belonging to a specific company
 */
export function getCompanyEmployees(companyId: string, primaryEmployees: Employee[]): Employee[] {
  if (companyId === 'comp-paneliya') {
    return primaryEmployees || [];
  }
  return liveTenantEmployeesStore[companyId] || [];
}

/**
 * Persist tenant-specific employees (strictly in-memory, without localStorage)
 */
export function saveCompanyEmployees(companyId: string, employees: Employee[]): void {
  if (companyId === 'comp-paneliya') {
    saveEmployees(employees);
    return;
  }
  liveTenantEmployeesStore[companyId] = employees;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TENANT_EMPLOYEES_STORAGE_KEY);
    } catch {}
  }
  const companies = getAllCompanies();
  const targetComp = companies.find((c) => c.id === companyId);
  if (targetComp) {
    updateCompany(companyId, { employeesCount: employees.length });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('hrms_tenant_employees_updated'));
  }
}

/**
 * Add a new employee directly under a specific company
 */
export function addEmployeeToCompany(
  companyId: string,
  employeeData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    departmentName: string;
    designationTitle: string;
    salaryBasic?: number;
    employmentType?: 'Full-time' | 'Remote' | 'Part-time';
    employeeCode?: string;
    password?: string;
    role?: Role;
  },
  primaryEmployees: Employee[]
): Employee {
  const currentEmps = getCompanyEmployees(companyId, primaryEmployees);
  const nextNum = currentEmps.length + 1;
  const company = getAllCompanies().find((c) => c.id === companyId);
  const codePrefix = company ? company.code.substring(0, 3).toUpperCase() : 'EMP';
  const newEmpId = `emp-${companyId}-${Date.now()}`;
  const code = employeeData.employeeCode || `${codePrefix}-${nextNum.toString().padStart(3, '0')}`;

  const newEmp: Employee = {
    id: newEmpId,
    employeeCode: code,
    companyId: companyId,
    companyName: company?.name || '',
    password: employeeData.password || '',
    role: employeeData.role || 'EMPLOYEE',
    firstName: employeeData.firstName,
    lastName: employeeData.lastName,
    email: employeeData.email,
    phone: employeeData.phone,
    avatarUrl: '',
    gender: 'Other',
    dateOfBirth: '',
    address: [company?.city, company?.state].filter(Boolean).join(', '),
    emergencyContact: { name: '', relationship: '', phone: employeeData.phone },
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: employeeData.employmentType || 'Full-time',
    status: 'Active',
    departmentId: '',
    departmentName: employeeData.departmentName || '',
    designationId: '',
    designationTitle: employeeData.designationTitle || '',
    reportingManagerName: company?.adminUser?.fullName || '',
    workLocationId: '',
    workLocationName: company?.city ? `${company.city} Office` : '',
    shift: 'General Shift',
    bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: '' },
    taxInformation: { taxId: '', panOrSsn: '', taxRegime: 'New Regime' },
    education: [],
    previousExperience: [],
    skills: [],
    salary: {
      basic: employeeData.salaryBasic || 0,
      hra: Math.round((employeeData.salaryBasic || 0) * 0.4),
      allowances: 0,
      bonus: 0,
      pf: Math.round((employeeData.salaryBasic || 0) * 0.12),
      tax: 0,
      professionalTax: employeeData.salaryBasic ? 200 : 0,
      gross: Math.round((employeeData.salaryBasic || 0) * 1.4),
      net: Math.round((employeeData.salaryBasic || 0) * 1.4) - Math.round((employeeData.salaryBasic || 0) * 0.12) - (employeeData.salaryBasic ? 200 : 0),
    },
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  const updated = [newEmp, ...currentEmps];
  saveCompanyEmployees(companyId, updated);
  return newEmp;
}

/**
 * Remove an employee from a specific company
 */
export function removeEmployeeFromCompany(
  companyId: string,
  employeeId: string,
  primaryEmployees: Employee[]
): void {
  const current = getCompanyEmployees(companyId, primaryEmployees);
  const updated = current.filter((e) => e.id !== employeeId && (e as any)._id !== employeeId);
  saveCompanyEmployees(companyId, updated);
}

export interface OrganizationMembership {
  isMember: boolean;
  companyId?: string;
  companyName?: string;
  employee?: Employee;
  adminUser?: CompanyAdminUser;
  role?: Role;
  isCompanyAdmin?: boolean;
  matchedVia?: 'company_admin' | 'employee' | 'demo';
  password?: string;
}

/**
 * Checks whether the given email, phone, or employee code belongs to ANY company/organization.
 * Returns organization details if found, or { isMember: false } if not linked to any company.
 */
export function findOrganizationByEmail(rawInput: string): OrganizationMembership {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isMember: false };
  }

  const clean = rawInput.trim().toLowerCase();
  const digitsOnly = rawInput.replace(/\D/g, '');

  // 1. Check All Registered Companies (Admins and Contact Emails)
  const allCompanies = getAllCompanies();
  for (const comp of allCompanies) {
    const adminEmail = comp.adminUser?.email?.trim().toLowerCase();
    const contactEmail = comp.contactEmail?.trim().toLowerCase();
    const adminPhoneDigits = comp.adminUser?.phone?.replace(/\D/g, '') || '';
    const contactPhoneDigits = comp.contactPhone?.replace(/\D/g, '') || '';

    if (
      (adminEmail && adminEmail === clean) ||
      (contactEmail && contactEmail === clean) ||
      (digitsOnly && digitsOnly.length >= 7 && (adminPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(adminPhoneDigits))) ||
      (digitsOnly && digitsOnly.length >= 7 && (contactPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(contactPhoneDigits)))
    ) {
      return {
        isMember: true,
        companyId: comp.id,
        companyName: comp.name,
        adminUser: comp.adminUser,
        role: comp.adminUser?.role || 'HR_ADMIN',
        isCompanyAdmin: true,
        matchedVia: 'company_admin',
        password: comp.adminUser?.password,
      };
    }
  }

  // 2. Check Primary Company Employees
  const primaryEmployees = getAllEmployees();
  for (const emp of primaryEmployees) {
    const empEmail = emp.email?.trim().toLowerCase();
    const empCode = emp.employeeCode?.trim().toLowerCase();
    const empPhoneDigits = emp.phone?.replace(/\D/g, '') || '';

    if (
      (empEmail && empEmail === clean) ||
      (empCode && empCode === clean) ||
      (digitsOnly && digitsOnly.length >= 7 && empPhoneDigits.endsWith(digitsOnly))
    ) {
      return {
        isMember: true,
        companyId: emp.companyId,
        companyName: emp.companyName,
        employee: emp,
        role: emp.role || 'EMPLOYEE',
        isCompanyAdmin: emp.role === 'HR_ADMIN',
        matchedVia: 'employee',
        password: emp.password,
      };
    }
  }

  // 3. Check Multi-Tenant Company Employees
  for (const comp of allCompanies) {
    const tenantEmps = getCompanyEmployees(comp.id, []);
    for (const emp of tenantEmps) {
      const empEmail = emp.email?.trim().toLowerCase();
      const empCode = emp.employeeCode?.trim().toLowerCase();
      const empPhoneDigits = emp.phone?.replace(/\D/g, '') || '';

      if (
        (empEmail && empEmail === clean) ||
        (empCode && empCode === clean) ||
        (digitsOnly && digitsOnly.length >= 7 && empPhoneDigits.endsWith(digitsOnly))
      ) {
        return {
          isMember: true,
          companyId: comp.id,
          companyName: comp.name,
          employee: emp,
          role: emp.role || 'EMPLOYEE',
          isCompanyAdmin: emp.role === 'HR_ADMIN',
          matchedVia: 'employee',
          password: emp.password,
        };
      }
    }
  }

  return { isMember: false };
}

/**
 * Quick boolean check if email is linked to any organization
 */
export function isEmailInAnyOrganization(rawInput: string): boolean {
  return findOrganizationByEmail(rawInput).isMember;
}

