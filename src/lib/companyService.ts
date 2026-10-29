import { Employee, Role } from '../types/hrms';
import { getAllEmployees, saveEmployees } from './employeeService';

export interface CompanyAdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  designation: string;
  role: 'SUPER_ADMIN' | 'HR_ADMIN';
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

// Initial mock employees for sub-companies (strictly empty, data comes only from real additions / API)
const initialTenantEmployees: Record<string, Employee[]> = {};

/**
 * Retrieve all registered tenant companies
 */
export function getAllCompanies(): CompanyTenant[] {
  if (typeof window === 'undefined') return initialCompanies;
  try {
    const saved = localStorage.getItem(COMPANIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed
          .filter(
            (c: any) =>
              c.id !== 'comp-apex' &&
              c.id !== 'comp-nexus' &&
              c.id !== 'comp-spw' &&
              c.id !== 'comp-vanguard' &&
              c.id !== 'comp-horizon'
          )
          .map((c: any) => ({
            ...c,
            adminUser:
              c.adminUser?.id === 'admin-keyur' || c.adminUser?.fullName === 'Keyur Sangani'
                ? {
                    id: 'admin-paneliya',
                    fullName: 'Paneliya Admin',
                    email: 'admin@paneliya.com',
                    phone: '+91 9876543210',
                    designation: 'Company Director & HR Head',
                    role: 'HR_ADMIN',
                    lastLogin: 'Just now',
                  }
                : c.adminUser,
            departments: Array.isArray(c.departments)
              ? Array.from(new Set(c.departments.filter(Boolean)))
              : [],
          }));
        if (clean.length > 0) {
          localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(clean));
          return clean;
        }
      }
    }
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(initialCompanies));
    return initialCompanies;
  } catch (err) {
    console.error('Failed to load companies:', err);
    return initialCompanies;
  }
}

/**
 * Persist companies to localStorage
 */
export function saveCompanies(companies: CompanyTenant[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies));
    window.dispatchEvent(new Event('hrms_companies_updated'));
  } catch (err) {
    console.error('Failed to save companies:', err);
  }
}

/**
 * Create a new tenant company with its owner admin
 */
export function createCompany(data: {
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
  const id = `comp-${Date.now()}`;
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
  // Flagship company (Paneliya) has the primary live database employees roster
  if (companyId === 'comp-paneliya') {
    return primaryEmployees || [];
  }

  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(TENANT_EMPLOYEES_STORAGE_KEY);
    if (saved) {
      const store = JSON.parse(saved);
      if (store['comp-apex'] || store['comp-nexus']) {
        delete store['comp-apex'];
        delete store['comp-nexus'];
        localStorage.setItem(TENANT_EMPLOYEES_STORAGE_KEY, JSON.stringify(store));
      }
      return store[companyId] || [];
    }
    return [];
  } catch (err) {
    console.error('Failed to load company employees:', err);
    return [];
  }
}

/**
 * Persist tenant-specific employees
 */
export function saveCompanyEmployees(companyId: string, employees: Employee[]): void {
  if (companyId === 'comp-paneliya') {
    saveEmployees(employees);
    return;
  }

  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(TENANT_EMPLOYEES_STORAGE_KEY);
    let store: Record<string, Employee[]> = saved ? JSON.parse(saved) : { ...initialTenantEmployees };
    store[companyId] = employees;
    localStorage.setItem(TENANT_EMPLOYEES_STORAGE_KEY, JSON.stringify(store));

    // Also update company employeesCount cache
    const companies = getAllCompanies();
    const targetComp = companies.find((c) => c.id === companyId);
    if (targetComp) {
      updateCompany(companyId, { employeesCount: employees.length });
    }
    window.dispatchEvent(new Event('hrms_tenant_employees_updated'));
  } catch (err) {
    console.error('Failed to save tenant employees:', err);
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
    companyName: company?.name || 'Paneliya Technology Inc.',
    password: employeeData.password || 'Password@123',
    role: employeeData.role || 'EMPLOYEE',
    firstName: employeeData.firstName,
    lastName: employeeData.lastName,
    email: employeeData.email,
    phone: employeeData.phone,
    avatarUrl: '',
    gender: 'Other',
    dateOfBirth: '1995-01-01',
    address: `${company?.city || 'Surat'}, ${company?.state || 'Gujarat'}`,
    emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: employeeData.phone },
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: employeeData.employmentType || 'Full-time',
    status: 'Active',
    departmentId: `dept-${Date.now()}`,
    departmentName: employeeData.departmentName || 'General',
    designationId: `des-${Date.now()}`,
    designationTitle: employeeData.designationTitle || 'Staff',
    reportingManagerName: company?.adminUser.fullName || 'Company Admin',
    workLocationId: 'loc-main',
    workLocationName: `${company?.city || 'Corporate'} Office`,
    shift: 'General Shift (09:00 AM – 06:00 PM)',
    bankDetails: { bankName: 'HDFC Bank', accountNumber: '000012345678', ifscOrRouting: 'HDFC0001234', accountHolderName: `${employeeData.firstName} ${employeeData.lastName}` },
    taxInformation: { taxId: 'TAX-000', panOrSsn: 'ABCDE1234F', taxRegime: 'New Regime' },
    education: [],
    previousExperience: [],
    skills: ['Operations', 'Teamwork'],
    salary: {
      basic: employeeData.salaryBasic || 40000,
      hra: Math.round((employeeData.salaryBasic || 40000) * 0.4),
      allowances: 10000,
      bonus: 5000,
      pf: 4800,
      tax: 2500,
      professionalTax: 200,
      gross: (employeeData.salaryBasic || 40000) + Math.round((employeeData.salaryBasic || 40000) * 0.4) + 15000,
      net: (employeeData.salaryBasic || 40000) + Math.round((employeeData.salaryBasic || 40000) * 0.4) + 7500,
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
  isSuperAdmin?: boolean;
  matchedVia?: 'superadmin' | 'company_admin' | 'employee' | 'demo';
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

  // 1. Check SuperAdmin accounts (Strict platform administration only)
  const superAdminEmails = [
    'superadmin@paneliya.com',
  ];
  if (superAdminEmails.includes(clean) || (digitsOnly && digitsOnly.endsWith('9999900000'))) {
    return {
      isMember: true,
      companyId: 'comp-paneliya',
      companyName: 'Paneliya Technology Inc.',
      role: 'SUPER_ADMIN',
      isCompanyAdmin: true,
      isSuperAdmin: true,
      matchedVia: 'superadmin',
    };
  }

  // 4. Check All Registered Companies (Admins and Contact Emails)
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
        isSuperAdmin: comp.adminUser?.role === 'SUPER_ADMIN',
        matchedVia: 'company_admin',
        password: comp.adminUser?.password || 'Admin@123',
      };
    }
  }

  // 5. Check Primary Company Employees (comp-paneliya)
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
        companyId: emp.companyId || 'comp-paneliya',
        companyName: emp.companyName || 'Paneliya Technology Inc.',
        employee: emp,
        role: emp.role || 'EMPLOYEE',
        isCompanyAdmin: emp.role === 'HR_ADMIN' || emp.role === 'SUPER_ADMIN',
        isSuperAdmin: emp.role === 'SUPER_ADMIN',
        matchedVia: 'employee',
        password: emp.password || 'Password@123',
      };
    }
  }

  // 6. Check Multi-Tenant Company Employees
  for (const comp of allCompanies) {
    if (comp.id === 'comp-paneliya') continue;
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
          isCompanyAdmin: emp.role === 'HR_ADMIN' || emp.role === 'SUPER_ADMIN',
          isSuperAdmin: emp.role === 'SUPER_ADMIN',
          matchedVia: 'employee',
          password: emp.password || 'Password@123',
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

