
import axios, { AxiosRequestConfig, isAxiosError } from 'axios';
import {
  Employee,
  Department,
  Designation,
  Location,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  Holiday,
  PayrollRecord,
  JobOpening,
  Candidate,
  CompanyAsset,
  NotificationItem,
  AuditLog,
  PerformanceReview,
  TrainingProgram,
  Resignation,
  Announcement,
  User,
} from '../types/hrms';

import { getApiBaseUrl } from './config';

const getApiBase = () => getApiBaseUrl();

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken');
}

function extractErrorMessage(err: unknown, fallbackStatus?: number): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as any;
    if (typeof data?.error?.message === 'string') return data.error.message;
    if (Array.isArray(data?.error?.message)) return data.error.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.error === 'string') return data.error;
    const status = err.response?.status ?? fallbackStatus;
    if (status) return `HTTP error ${status}`;
    if (err.code === 'ECONNABORTED') return 'Request timed out';
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Request failed';
}

/** Shared Axios client — all HRMS API traffic goes through this instance. */
export const axiosClient = axios.create({
  timeout: 6000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  config.baseURL = getApiBase();
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary for FormData uploads
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && 'Content-Type' in config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }
  return config;
});

/**
 * Universal Axios helper that forwards JWT Bearer token and gracefully falls back to local data.
 * Includes a 6-second fail-fast timeout so slow/unreachable network endpoints don't freeze mobile devices.
 */
async function fetchWithFallback<T>(
  url: string,
  options?: AxiosRequestConfig & { method?: string; body?: any; headers?: Record<string, string> },
  fallback?: T
): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  try {
    const { body, headers, ...rest } = options || {};

    let data = body;
    if (typeof body === 'string') {
      try {
        data = JSON.parse(body);
      } catch {
        data = body;
      }
    }

    const res = await axiosClient.request<T>({
      url,
      method,
      data,
      headers: headers || {},
      ...rest,
    });

    return res.data;
  } catch (err) {
    const isRead = method === 'GET' || method === 'HEAD';
    if (isRead && fallback !== undefined) {
      return fallback;
    }
    throw new Error(extractErrorMessage(err));
  }
}

export const api = {
  // =========================================================================
  // 1. SYSTEM HEALTH
  // =========================================================================
  async getApiVitality() {
    return fetchWithFallback<any>('/api', undefined, {
      status: 'healthy',
      vitality: true,
      service: 'Paneliya Enterprise HRMS API',
    });
  },

  async getHealth() {
    return fetchWithFallback('/health', undefined, {
      status: 'healthy',
      version: '1.0.0',
      service: 'My Own HRMS API',
      timestamp: new Date().toISOString(),
    });
  },

  // =========================================================================
  // 2. AUTHENTICATION & ACCESS
  // =========================================================================
  async login(email: string, password?: string) {
    try {
      const { data: result } = await axiosClient.post('/auth/login', {
        identifier: email,
        email,
        password,
      });

      if (typeof window !== 'undefined' && result?.accessToken) {
        localStorage.setItem('hrms_auth_token', result.accessToken);
        localStorage.setItem('bearerToken', result.accessToken);
        if (result.user?.companyId) {
          localStorage.setItem('hrms_company_id', result.user.companyId);
        }
        if (result.user?.companyCode) {
          localStorage.setItem('hrms_company_code', result.user.companyCode);
        }
      }
      return result;
    } catch (err: any) {
      if (isAxiosError(err) && err.response?.status === 401) {
        throw new Error('Invalid email, phone, employee code, or password.');
      }
      throw new Error(extractErrorMessage(err) || 'Login failed');
    }
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
    companyId?: string;
  }) {
    try {
      const rawRole = (data.role || 'EMPLOYEE').toUpperCase().trim();
      const allowedRoles = [
        'SUPER_ADMIN',
        'ADMIN',
        'HR_ADMIN',
        'HR_EXECUTIVE',
        'MANAGER',
        'TEAM_LEADER',
        'RECRUITER',
        'FINANCE_ADMIN',
        'EMPLOYEE',
      ];
      const normalizedRole = allowedRoles.includes(rawRole) ? rawRole : 'EMPLOYEE';

      const payload = {
        ...data,
        role: normalizedRole,
      };

      const { data: result } = await axiosClient.post('/auth/register', payload);

      if (typeof window !== 'undefined' && result?.accessToken) {
        localStorage.setItem('hrms_auth_token', result.accessToken);
        localStorage.setItem('bearerToken', result.accessToken);
      }
      return result;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err) || 'Registration failed');
    }
  },

  async registerCompany(data: {
    companyName: string;
    companyId?: string;
    gstNumber?: string;
    industry?: string;
    address?: string;
    city?: string;
    state?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const fullAddress = [data.address, data.city, data.state, 'India'].filter(Boolean).join(', ');

    // Provision new company and administrator via backend API
    // Inserts the new company into database `companies` table and provisions owner Admin
    const createPayload = {
      companyName: data.companyName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      address: fullAddress,
      status: 'Active',
      adminEmail: data.email.trim().toLowerCase(),
      adminPassword: data.password,
      adminFirstName: data.firstName.trim(),
      adminLastName: data.lastName.trim(),
    };

    let compRes: any;
    try {
      const { data } = await axiosClient.post('/auth/register-company', createPayload);
      compRes = data;
    } catch (err) {
      throw new Error(extractErrorMessage(err) || 'Company creation failed');
    }

    const createdCompany = compRes?.company || compRes;
    const companyId = createdCompany?.id || `cmp-${Date.now()}`;
    const companyCode = createdCompany?.companyCode || 'CMP-000001';

    // Postman Step 5: Login as Company Admin to get active session
    let loginRes: any = null;
    try {
      loginRes = await this.login(data.email.trim().toLowerCase(), data.password);
    } catch (loginErr) {
      console.warn('Auto-login after company creation warning:', loginErr);
    }

    // Cache company details in localStorage for frontend dashboard
    if (typeof window !== 'undefined') {
      const companyObj = {
        id: companyId,
        companyCode: companyCode,
        name: data.companyName.trim(),
        companyName: data.companyName.trim(),
        gstNumber: data.gstNumber || '',
        industry: data.industry || 'IT & Software Services',
        address: fullAddress,
        city: data.city || '',
        state: data.state || '',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('hrms_company_id', companyId);
      localStorage.setItem('hrms_company_code', companyCode);
      localStorage.setItem('hrms_company_name', data.companyName.trim());
      localStorage.setItem('hrms_current_company', JSON.stringify(companyObj));
      if (data.gstNumber) localStorage.setItem('hrms_company_gst', data.gstNumber);
    }

    return {
      success: true,
      user: loginRes?.user || {
        id: createdCompany?.adminUserId || `user-${Date.now()}`,
        email: data.email.trim().toLowerCase(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: 'ADMIN',
        companyId,
        companyCode,
      },
      token: loginRes?.accessToken || loginRes?.token,
      company: createdCompany,
    };
  },

  async getMe(token?: string): Promise<User> {
    return fetchWithFallback<User>('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async switchRole(role: string) {
    return fetchWithFallback<any>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  async getAuthUsers() {
    return fetchWithFallback<User[]>('/auth/users', undefined, []);
  },

  // =========================================================================
  // USER PROFILE & PHOTO
  // =========================================================================
  async uploadProfilePhoto(file: File | Blob): Promise<{ success: boolean; avatarUrl: string; user?: any }> {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const { data } = await axiosClient.patch('/users/profile/photo', formData, {
        timeout: 20000,
        headers: { Accept: 'application/json' },
      });

      const newAvatarUrl =
        data.avatarUrl || data.photoUrl || data.cloudinaryUrl || (data.user && data.user.avatarUrl) || '';

      return {
        success: true,
        avatarUrl: newAvatarUrl,
        user: data.user,
      };
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  },

  // =========================================================================
  // 3. EMPLOYEES & WORKFORCE DOSSIER
  // =========================================================================
  async getEmployees(params?: {
    search?: string;
    departmentId?: string;
    status?: string;
    employmentType?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.departmentId && params.departmentId !== 'ALL') query.set('departmentId', params.departmentId);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.employmentType && params.employmentType !== 'All') query.set('employmentType', params.employmentType);

    const qs = query.toString();
    return fetchWithFallback<Employee[]>(
      `/employees${qs ? `?${qs}` : ''}`,
      undefined,
      []
    );
  },

  async getNextEmployeeCode(companyId?: string): Promise<{ nextCode: string; companyCode?: string; currentMaxNumber?: number }> {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return fetchWithFallback<{ nextCode: string; companyCode?: string; currentMaxNumber?: number }>(
      `/employees/next-code${qs}`,
      undefined,
      { nextCode: 'EMP-000001' }
    );
  },

  async getEmployeeById(id: string) {
    return fetchWithFallback<any>(`/employees/${id}`);
  },

  async createEmployee(data: Partial<Employee>) {
    return fetchWithFallback<Employee>(
      '/employees',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    return fetchWithFallback<Employee>(
      `/employees/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  async deleteEmployee(id: string) {
    return fetchWithFallback<{ success: boolean; message: string }>(
      `/employees/${id}`,
      { method: 'DELETE' }
    );
  },

  // =========================================================================
  // 4. ORGANIZATION (DEPARTMENTS, DESIGNATIONS, LOCATIONS, HIERARCHY)
  // =========================================================================
  async getDepartments() {
    return fetchWithFallback<Department[]>('/organization/departments', undefined, []);
  },

  async createDepartment(data: {
    name: string;
    code: string;
    headEmployeeId?: string;
    headName?: string;
    description?: string;
  }) {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: data.name,
      code: data.code,
      headName: data.headName || 'HR Administration',
      employeeCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    return fetchWithFallback<Department>(
      '/organization/departments',
      { method: 'POST', body: JSON.stringify(data) },
      newDept
    );
  },

  async updateDepartment(
    id: string,
    data: {
      name?: string;
      code?: string;
      headEmployeeId?: string;
      headName?: string;
      description?: string;
    }
  ) {
    return fetchWithFallback<Department>(
      `/organization/departments/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      { id, ...data } as Department
    );
  },

  async getDesignations() {
    return fetchWithFallback<Designation[]>('/organization/designations', undefined, []);
  },

  async createDesignation(data: {
    title: string;
    departmentId: string;
    minSalary?: number;
    maxSalary?: number;
  }) {
    const newDes: Designation = {
      id: `des-${Date.now()}`,
      title: data.title,
      departmentId: data.departmentId,
      departmentName: 'Department',
      minSalary: data.minSalary || 50000,
      maxSalary: data.maxSalary || 100000,
      createdAt: new Date().toISOString().split('T')[0],
    };
    return fetchWithFallback<Designation>(
      '/organization/designations',
      { method: 'POST', body: JSON.stringify(data) },
      newDes
    );
  },

  async getLocations() {
    return fetchWithFallback<Location[]>('/organization/locations', undefined, []);
  },

  async getHierarchy() {
    return fetchWithFallback<any>('/organization/hierarchy', undefined, null);
  },

  // =========================================================================
  // 5. ATTENDANCE & PUNCH CLOCK
  // =========================================================================
  async resolveAttendanceEmployeeId(idOrCode: string, employeeMeta?: any): Promise<string> {
    if (idOrCode && idOrCode.startsWith('emp-')) return idOrCode;
    if (employeeMeta?.employeeId && employeeMeta.employeeId.startsWith('emp-')) return employeeMeta.employeeId;
    try {
      const emps = await this.getEmployees();
      if (Array.isArray(emps)) {
        const found = emps.find((e: any) =>
          e.id === idOrCode ||
          e.userId === idOrCode ||
          (employeeMeta?.email && e.email?.toLowerCase() === employeeMeta.email.toLowerCase()) ||
          (employeeMeta?.employeeCode && e.employeeCode?.toLowerCase() === employeeMeta.employeeCode.toLowerCase()) ||
          (employeeMeta?.firstName && `${e.firstName} ${e.lastName || ''}`.trim().toLowerCase() === `${employeeMeta.firstName} ${employeeMeta.lastName || ''}`.trim().toLowerCase())
        );
        if (found && found.id) return found.id;
      }
    } catch (e) {
      console.warn('Could not resolve attendance employee ID from backend:', e);
    }
    return idOrCode;
  },

  async getAttendance(params?: { employeeId?: string; date?: string; departmentId?: string }) {
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.date) query.set('date', params.date);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    const qs = query.toString();
    return fetchWithFallback<AttendanceRecord[]>(`/attendance${qs ? `?${qs}` : ''}`, undefined, []);
  },

  async getMyAttendanceStatus(employeeId: string) {
    return fetchWithFallback<any>(`/attendance/my-status/${employeeId}`, undefined, {
      employeeId,
      todayDate: new Date().toISOString().split('T')[0],
      checkIn: null,
      checkOut: null,
      isWorking: false,
      isOnBreak: false,
      isCompleted: false,
      totalSeconds: 0,
      breakSeconds: 0,
    });
  },

  async checkIn(
    employeeId: string,
    remarks?: string,
    employeeMeta?: any,
    geoData?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      distanceMeters?: number;
      locationAddress?: string;
      isGeofenceVerified?: boolean;
      photo?: string;
      device?: any;
    }
  ): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
    const targetEmpId = await this.resolveAttendanceEmployeeId(employeeId, employeeMeta);
    const finalRemarks = remarks || 'Morning shift clock-in';
    const payload = {
      employeeId: targetEmpId,
      remarks: finalRemarks,
    };

    let backendRecord: any = null;
    try {
      backendRecord = await fetchWithFallback<any>(
        '/attendance/check-in',
        { method: 'POST', body: JSON.stringify(payload) },
        null
      );
    } catch (err) {
      console.error('Check-in backend POST error:', err);
    }

    // Also record secure geo-fenced work session if selfie & coordinates provided
    if (geoData?.latitude && geoData?.longitude && geoData?.photo) {
      this.startWork({
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        accuracy: geoData.accuracy || 10,
        selfie: geoData.photo,
        deviceInfo: typeof geoData.device === 'string' ? geoData.device : JSON.stringify(geoData.device || {}),
      }).catch((e) => console.warn('Background work/start sync notice:', e));
    }

    if (backendRecord && backendRecord.id) {
      return {
        success: true,
        message: 'Clocked in successfully!',
        record: backendRecord,
      };
    }

    return {
      success: false,
      message: 'Failed to record check-in in database. Please check connection.',
    };
  },

  async checkOut(
    employeeId: string,
    remarks?: string,
    employeeMeta?: any,
    geoData?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      distanceMeters?: number;
      locationAddress?: string;
      photo?: string;
      device?: any;
    }
  ): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
    const targetEmpId = await this.resolveAttendanceEmployeeId(employeeId, employeeMeta);
    const finalRemarks = remarks || 'Evening clock-out';
    const payload = {
      employeeId: targetEmpId,
      remarks: finalRemarks,
    };

    let backendRecord: any = null;
    try {
      backendRecord = await fetchWithFallback<any>(
        '/attendance/check-out',
        { method: 'POST', body: JSON.stringify(payload) },
        null
      );
    } catch (err) {
      console.error('Check-out backend POST error:', err);
    }

    // Also record secure geo-fenced work session stop if coordinates provided
    if (geoData?.latitude && geoData?.longitude) {
      this.stopWork({
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        accuracy: geoData.accuracy || 10,
        selfie: geoData.photo || '',
        remarks: finalRemarks,
      }).catch((e) => console.warn('Background work/stop sync notice:', e));
    }

    if (backendRecord && backendRecord.id) {
      return {
        success: true,
        message: 'Clocked out successfully!',
        record: backendRecord,
      };
    }

    return {
      success: false,
      message: 'Failed to record check-out in database. Please check connection.',
    };
  },

  async regularizeAttendance(data: {
    employeeId: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    status: string;
    remarks?: string;
  }) {
    return fetchWithFallback<any>(
      '/attendance/regularize',
      { method: 'POST', body: JSON.stringify(data) },
      {
        success: true,
        message: 'Attendance regularized successfully',
        entry: data,
      }
    );
  },

  async syncBiometricAttendance(logs: any[], deviceId = 'GATE-01-TERMINAL') {
    return fetchWithFallback<any>(
      '/attendance/biometric-sync',
      { method: 'POST', body: JSON.stringify({ logs, deviceId }) },
      { status: 'success', syncedRecords: logs.length, deviceId }
    );
  },

  // =========================================================================
  // 5.1. SECURE GEO-FENCED WORK TIMER & SELFIE API (POSTMAN: Selfie_location)
  // =========================================================================
  async getWorkStatus(): Promise<{
    active: boolean;
    workSession?: any;
    elapsedSeconds?: number;
    assignedLocation?: any;
    serverTime?: string;
  }> {
    return fetchWithFallback<any>('/attendance/work/status', undefined, {
      active: false,
      serverTime: new Date().toISOString(),
    });
  },

  async startWork(data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    selfie?: string;
    deviceInfo?: string;
  }) {
    return fetchWithFallback<any>(
      '/attendance/work/start',
      { method: 'POST', body: JSON.stringify(data) },
      { success: true, message: 'Work started successfully', ...data }
    );
  },

  async stopWork(data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    selfie?: string;
    remarks?: string;
  }) {
    return fetchWithFallback<any>(
      '/attendance/work/stop',
      { method: 'POST', body: JSON.stringify(data) },
      { success: true, message: 'Work stopped successfully', ...data }
    );
  },

  async getWorkHistory(page = 1, limit = 10) {
    return fetchWithFallback<{
      data: any[];
      total: number;
      page: number;
      limit: number;
    }>(`/attendance/work/history?page=${page}&limit=${limit}`, undefined, {
      data: [],
      total: 0,
      page,
      limit,
    });
  },

  getWorkSelfieUrl(workSessionId: string, type: 'start' | 'stop') {
    return `${getApiBase()}/attendance/work/selfie/${workSessionId}/${type}`;
  },

  // =========================================================================
  // 6. LEAVES & TIME-OFF MANAGEMENT
  // =========================================================================
  async getLeaves(params?: { employeeId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return fetchWithFallback<LeaveRequest[]>(`/leaves${qs ? `?${qs}` : ''}`, undefined, []);
  },

  async applyLeave(data: {
    employeeId: string;
    employeeCode?: string;
    employeeName?: string;
    employeeEmail?: string;
    employeeAvatar?: string;
    departmentName?: string;
    companyId?: string;
    companyCode?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
  }) {
    return fetchWithFallback<LeaveRequest>(
      '/leaves/apply',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async getLeaveBalances(employeeId: string) {
    return fetchWithFallback<LeaveBalance>(
      `/leaves/balances/${employeeId}`,
      undefined,
      {
        id: `lb-${employeeId}`,
        employeeId,
        year: new Date().getFullYear(),
        casualLeave: { total: 0, used: 0, remaining: 0 },
        sickLeave: { total: 0, used: 0, remaining: 0 },
        paidLeave: { total: 0, used: 0, remaining: 0 },
      }
    );
  },

  async approveLeave(id: string, role = 'HR_ADMIN', approverName = 'HR Administration', comments?: string) {
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/approve`,
      { method: 'PUT', body: JSON.stringify({ role, approverName, comments }) }
    );
  },

  async rejectLeave(id: string, approverName = 'HR Administration', reason?: string) {
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/reject`,
      { method: 'PUT', body: JSON.stringify({ approverName, reason }) }
    );
  },

  // =========================================================================
  // 7. PAYROLL & COMPENSATION
  // =========================================================================
  async getPayroll(params?: { month?: string; status?: string; employeeId?: string }) {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.status) query.set('status', params.status);
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    const qs = query.toString();
    return fetchWithFallback<PayrollRecord[]>(`/payroll${qs ? `?${qs}` : ''}`, undefined, []);
  },

  async generatePayroll(month: string, actorName = 'Finance Admin') {
    return fetchWithFallback<any>(
      '/payroll/generate',
      { method: 'POST', body: JSON.stringify({ month, actorName }) },
      { success: true, month, recordsGenerated: 21, actorName }
    );
  },

  async getPayslip(id: string) {
    return fetchWithFallback<any>(`/payroll/payslip/${id}`, undefined, {
      id,
      payrollMonth: '2026-10',
      employeeName: 'Paneliya Staff',
      employeeCode: id,
      designationTitle: 'Team Member',
      departmentName: 'Paneliya Technology',
      basicSalary: 0,
      hra: 0,
      allowances: 0,
      bonus: 0,
      grossSalary: 0,
      pfDeduction: 0,
      taxDeduction: 0,
      professionalTax: 0,
      totalDeductions: 0,
      netSalary: 0,
      paymentMethod: 'Bank Transfer',
    });
  },

  async updatePayrollStatus(
    id: string,
    statusOrPayload: string | { status: string; actorName?: string },
    actorName = 'Finance Admin'
  ) {
    const status = typeof statusOrPayload === 'string' ? statusOrPayload : statusOrPayload.status;
    const actor = typeof statusOrPayload === 'string' ? actorName : (statusOrPayload.actorName || actorName);
    return fetchWithFallback<any>(
      `/payroll/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status, actorName: actor }) },
      { id, status, actorName: actor, updatedAt: new Date().toISOString() }
    );
  },

  // =========================================================================
  // 8. RECRUITMENT & TALENT PIPELINE (ATS)
  // =========================================================================
  async getJobs() {
    return fetchWithFallback<JobOpening[]>('/recruitment/jobs', undefined, []);
  },

  async createJob(data: Partial<JobOpening>) {
    const newJob: JobOpening = {
      id: `job-${Date.now()}`,
      title: data.title || 'New Job Opening',
      departmentId: data.departmentId || 'dept-2',
      departmentName: data.departmentName || 'Engineering & Technology',
      designationTitle: data.designationTitle || data.title || 'Software Engineer',
      location: data.location || 'Surat, Gujarat',
      employmentType: data.employmentType || 'Full-time',
      experienceLevel: data.experienceLevel || 'Mid-Senior',
      openingsCount: data.openingsCount || 1,
      salaryRange: data.salaryRange || '₹8,00,000 - ₹12,00,000',
      description: data.description || '',
      skillsRequired: data.skillsRequired || ['TypeScript', 'React'],
      status: 'Published',
      postedDate: new Date().toISOString().split('T')[0],
      applicantCount: 0,
    };
    return fetchWithFallback<JobOpening>(
      '/recruitment/jobs',
      { method: 'POST', body: JSON.stringify(data) },
      newJob
    );
  },

  async getCandidates(jobId?: string) {
    const query = jobId && jobId !== 'ALL' ? `?jobId=${jobId}` : '';
    return fetchWithFallback<Candidate[]>(`/recruitment/candidates${query}`, undefined, []);
  },

  async createCandidate(data: Partial<Candidate>) {
    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      jobId: data.jobId || 'job-1',
      jobTitle: data.jobTitle || 'Senior Software Engineer',
      fullName: data.fullName || 'Candidate Name',
      email: data.email || 'candidate@example.com',
      phone: data.phone || '+91 98765 00000',
      resumeUrl: data.resumeUrl || '/resumes/sample.pdf',
      experienceYears: data.experienceYears || 3,
      currentCompany: data.currentCompany || 'Tech Corp',
      skills: data.skills || ['React', 'TypeScript'],
      source: data.source || 'Website',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      rating: 4.5,
      notes: data.notes || '',
    };
    return fetchWithFallback<Candidate>(
      '/recruitment/candidates',
      { method: 'POST', body: JSON.stringify(data) },
      newCand
    );
  },

  async updateCandidateStatus(id: string, status: string, actorName = 'Lead Recruiter') {
    return fetchWithFallback<Candidate>(
      `/recruitment/candidates/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status, actorName }) },
      ({ id, status } as any)
    );
  },

  async scheduleInterview(
    id: string,
    data: { round: string; interviewerName: string; scheduledAt: string }
  ) {
    return fetchWithFallback<any>(
      `/recruitment/candidates/${id}/schedule-interview`,
      { method: 'POST', body: JSON.stringify(data) },
      { id, ...data, status: 'Scheduled' }
    );
  },

  async convertCandidateToEmployee(id: string, actorName = 'HR Admin') {
    return fetchWithFallback<any>(
      `/recruitment/candidates/${id}/convert`,
      { method: 'POST', body: JSON.stringify({ actorName }) },
      { success: true, candidateId: id, status: 'Hired', convertedAt: new Date().toISOString() }
    );
  },

  // =========================================================================
  // 9. PERFORMANCE & APPRAISALS
  // =========================================================================
  async getPerformanceCycles() {
    return fetchWithFallback<any[]>('/performance/cycles', undefined, []);
  },

  async getPerformanceReviews(employeeId?: string) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return fetchWithFallback<PerformanceReview[]>(
      `/performance/reviews${query}`,
      undefined,
      []
    );
  },

  async ratePerformanceReview(
    id: string,
    data: {
      selfRating?: number;
      selfComments?: string;
      managerRating?: number;
      managerFeedback?: string;
      appraisalRecommended?: string;
      role?: string;
      actorName?: string;
    }
  ) {
    return fetchWithFallback<PerformanceReview>(
      `/performance/reviews/${id}/rate`,
      { method: 'POST', body: JSON.stringify(data) },
      ({ id, ...data, status: 'Completed' } as any)
    );
  },

  // =========================================================================
  // 10. TRAINING & UPSKILLING
  // =========================================================================
  async getTrainingPrograms() {
    return fetchWithFallback<TrainingProgram[]>('/training/programs', undefined, []);
  },

  async createTrainingProgram(data: {
    title: string;
    description: string;
    trainerName: string;
    skillsCovered?: string[];
    startDate: string;
    endDate: string;
    durationHours: number;
  }) {
    const newProg: TrainingProgram = {
      id: `trn-${Date.now()}`,
      title: data.title,
      description: data.description,
      trainerName: data.trainerName,
      skillsCovered: data.skillsCovered || [],
      startDate: data.startDate,
      endDate: data.endDate,
      durationHours: data.durationHours,
      status: 'Upcoming',
      enrolledCount: 0,
    };
    return fetchWithFallback<TrainingProgram>(
      '/training/programs',
      { method: 'POST', body: JSON.stringify(data) },
      newProg
    );
  },

  async getTrainingEnrollments(employeeId?: string) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return fetchWithFallback<any[]>(
      `/training/enrollments${query}`,
      undefined,
      []
    );
  },

  async enrollTraining(
    trainingIdOrPayload: string | { trainingId: string; employeeId: string },
    employeeId?: string
  ) {
    const trainingId = typeof trainingIdOrPayload === 'string' ? trainingIdOrPayload : trainingIdOrPayload.trainingId;
    const empId = typeof trainingIdOrPayload === 'string' ? (employeeId || 'emp-1') : trainingIdOrPayload.employeeId;
    return fetchWithFallback<any>(
      '/training/enroll',
      { method: 'POST', body: JSON.stringify({ trainingId, employeeId: empId }) },
      {
        id: `enr-${Date.now()}`,
        trainingId,
        employeeId: empId,
        trainingTitle: 'Professional Upskilling Program',
        employeeName: 'Enrolled Employee',
        status: 'In Progress',
        progressPercent: 0,
      }
    );
  },

  async updateTrainingProgress(id: string, progressPercent: number) {
    return fetchWithFallback<any>(
      `/training/enrollments/${id}/progress`,
      { method: 'PUT', body: JSON.stringify({ progressPercent }) },
      { id, progressPercent }
    );
  },

  // =========================================================================
  // 11. COMPANY ASSETS
  // =========================================================================
  async getAssets(category?: string) {
    const query = category && category !== 'ALL' ? `?category=${category}` : '';
    return fetchWithFallback<CompanyAsset[]>(`/assets${query}`, undefined, []);
  },

  async createAsset(data: {
    name: string;
    category: 'Laptop' | 'Monitor' | 'Mobile' | 'Access Card' | 'Vehicle' | 'Other';
    assetCode: string;
    serialNumber: string;
    condition: 'Excellent' | 'Good' | 'Fair' | 'Damaged';
    purchaseDate: string;
  }) {
    const newAsset: CompanyAsset = {
      id: `ast-${Date.now()}`,
      name: data.name,
      category: data.category,
      assetCode: data.assetCode,
      serialNumber: data.serialNumber,
      condition: data.condition,
      status: 'Available',
      purchaseDate: data.purchaseDate,
    };
    return fetchWithFallback<CompanyAsset>(
      '/assets',
      { method: 'POST', body: JSON.stringify(data) },
      newAsset
    );
  },

  async assignAsset(
    id: string,
    employeeIdOrPayload: string | { employeeId: string; actorName?: string },
    actorName = 'IT Admin'
  ) {
    const employeeId = typeof employeeIdOrPayload === 'string' ? employeeIdOrPayload : employeeIdOrPayload.employeeId;
    const actor = typeof employeeIdOrPayload === 'string' ? actorName : (employeeIdOrPayload.actorName || actorName);
    return fetchWithFallback<any>(
      `/assets/${id}/assign`,
      { method: 'PUT', body: JSON.stringify({ employeeId, actorName: actor }) },
      { id, assignedToEmployeeId: employeeId, status: 'Assigned', actorName: actor }
    );
  },

  async returnAsset(
    id: string,
    conditionOrPayload: string | { condition: string; actorName?: string },
    actorName = 'IT Admin'
  ) {
    const condition = typeof conditionOrPayload === 'string' ? conditionOrPayload : conditionOrPayload.condition;
    const actor = typeof conditionOrPayload === 'string' ? actorName : (conditionOrPayload.actorName || actorName);
    return fetchWithFallback<any>(
      `/assets/${id}/return`,
      { method: 'PUT', body: JSON.stringify({ condition, actorName: actor }) },
      { id, status: 'Available', condition, actorName: actor }
    );
  },

  // =========================================================================
  // 12. RESIGNATIONS & OFFBOARDING
  // =========================================================================
  async getResignations() {
    return fetchWithFallback<Resignation[]>('/resignations', undefined, []);
  },

  async submitResignation(data: {
    employeeId: string;
    reason: string;
    noticePeriodDays?: number;
  }) {
    const targetEmpId = await this.resolveAttendanceEmployeeId(data.employeeId);
    const noticePeriod = Number(data.noticePeriodDays) || 30;
    const payload = {
      employeeId: targetEmpId,
      reason: data.reason,
      noticePeriodDays: noticePeriod,
    };
    const newRes: Resignation = {
      id: `res-${Date.now()}`,
      employeeId: targetEmpId,
      employeeName: 'Employee',
      employeeCode: targetEmpId,
      departmentName: 'Paneliya Technology',
      resignationDate: new Date().toISOString().split('T')[0],
      lastWorkingDay: new Date(Date.now() + noticePeriod * 86400000).toISOString().split('T')[0],
      noticePeriodDays: noticePeriod,
      reason: data.reason,
      status: 'Submitted' as any,
      managerApproval: { status: 'Pending' },
      clearance: {
        departmentClearance: false,
        assetReturned: false,
        financeSettlement: false,
        exitInterviewCompleted: false,
      },
    };
    return fetchWithFallback<Resignation>(
      '/resignations/submit',
      { method: 'POST', body: JSON.stringify(payload) },
      newRes
    );
  },

  async approveResignation(id: string, actorName = 'HR Admin') {
    return this.updateResignationClearance(id, {
      clearance: {
        departmentClearance: true,
        assetReturned: true,
        financeSettlement: true,
        exitInterviewCompleted: true,
      },
      actorName,
    });
  },

  async updateResignationClearance(
    id: string,
    clearanceOrPayload:
      | {
        departmentClearance?: boolean;
        assetReturned?: boolean;
        financeSettlement?: boolean;
        exitInterviewCompleted?: boolean;
      }
      | {
        clearance: {
          departmentClearance?: boolean;
          assetReturned?: boolean;
          financeSettlement?: boolean;
          exitInterviewCompleted?: boolean;
        };
        actorName?: string;
      },
    actorName = 'HR Admin'
  ) {
    const clearance = 'clearance' in clearanceOrPayload ? clearanceOrPayload.clearance : clearanceOrPayload;
    const actor = 'actorName' in clearanceOrPayload && clearanceOrPayload.actorName ? clearanceOrPayload.actorName : actorName;
    return fetchWithFallback<any>(
      `/resignations/${id}/clearance`,
      { method: 'PUT', body: JSON.stringify({ clearance, actorName: actor }) },
      { id, clearance, actorName: actor, status: 'Completed' }
    );
  },

  // =========================================================================
  // 13. HOLIDAYS & CALENDAR
  // =========================================================================
  async getHolidays() {
    return fetchWithFallback<Holiday[]>('/holidays', undefined, []);
  },

  async createHoliday(data: {
    name: string;
    date: string;
    dayOfWeek: string;
    type: 'Public' | 'Optional' | 'Company';
    description: string;
    locationId?: string;
  }) {
    const newHol: Holiday = {
      id: `hol-${Date.now()}`,
      ...data,
    };
    return fetchWithFallback<Holiday>(
      '/holidays',
      { method: 'POST', body: JSON.stringify(data) },
      newHol
    );
  },

  async deleteHoliday(id: string) {
    return fetchWithFallback<{ success: boolean }>(
      `/holidays/${id}`,
      { method: 'DELETE' },
      { success: true }
    );
  },

  // =========================================================================
  // 14. DOCUMENTS & COMPLIANCE DOSSIER
  // =========================================================================
  async getDocuments(employeeId?: string) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return fetchWithFallback<any[]>(`/documents${query}`, undefined, []);
  },

  async createDocumentMetadata(data: {
    employeeId: string;
    title: string;
    category: string;
    fileUrl: string;
    fileSize: string;
    expiryDate?: string;
  }) {
    return fetchWithFallback<any>(
      '/documents',
      { method: 'POST', body: JSON.stringify(data) },
      { id: `doc-${Date.now()}`, ...data, verificationStatus: 'Pending' }
    );
  },

  async uploadDocumentFile(formData: FormData) {
    try {
      const { data } = await axiosClient.post('/documents/upload', formData, {
        timeout: 20000,
      });
      return data;
    } catch (err) {
      console.warn('Backend upload fallback:', err);
      return {
        id: `doc-${Date.now()}`,
        title: formData.get('title') || 'Uploaded Document',
        category: formData.get('category') || 'Other',
        fileUrl: '/docs/sample.pdf',
        fileSize: '1.2 MB',
        uploadDate: new Date().toISOString().split('T')[0],
        verificationStatus: 'Pending',
      };
    }
  },

  async verifyDocument(id: string, status: 'Verified' | 'Rejected', verifiedBy = 'HR Admin') {
    return fetchWithFallback<any>(`/documents/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status, verifiedBy }),
    });
  },

  // =========================================================================
  // 15. ANNOUNCEMENTS & NOTICES
  // =========================================================================
  async getAnnouncements(employeeId?: string, departmentName?: string) {
    const query = new URLSearchParams();
    if (employeeId) query.set('employeeId', employeeId);
    if (departmentName) query.set('departmentName', departmentName);
    const qs = query.toString();
    return fetchWithFallback<Announcement[]>(`/announcements${qs ? `?${qs}` : ''}`, undefined, []);
  },

  async createAnnouncement(data: {
    title: string;
    content: string;
    targetAudience: 'All' | 'Department' | 'Individual';
    targetEmployeeId?: string;
    targetEmployeeName?: string;
    departmentName?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    authorName?: string;
    authorRole?: string;
  }) {
    return fetchWithFallback<Announcement>(
      '/announcements',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async deleteAnnouncement(id: string) {
    return fetchWithFallback<{ success: boolean }>(
      `/announcements/${id}`,
      { method: 'DELETE' }
    );
  },

  // =========================================================================
  // 16. NOTIFICATIONS CENTER
  // =========================================================================
  async getNotifications() {
    return fetchWithFallback<NotificationItem[]>('/notifications', undefined, []);
  },

  async markNotificationRead(id: string) {
    return fetchWithFallback<NotificationItem>(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead() {
    return fetchWithFallback<any>('/notifications/mark-all-read', { method: 'PUT' }, { success: true });
  },

  // =========================================================================
  // 17. AUDIT LOGS
  // =========================================================================
  async getAuditLogs(module?: string) {
    const query = module && module !== 'ALL' ? `?module=${module}` : '';
    return fetchWithFallback<AuditLog[]>(`/audit-logs${query}`, undefined, []);
  },

  // =========================================================================
  // 18. REPORTS & DASHBOARD ANALYTICS & BULK EXPORT
  // =========================================================================
  async getDashboardStats() {
    return fetchWithFallback('/reports/dashboard-stats', undefined, null);
  },

  async exportReport(type: 'attendance' | 'employees' | 'leaves' | 'payroll') {
    return fetchWithFallback<any[]>(`/reports/export?type=${type}`, undefined, []);
  },

  // =========================================================================
  // 19. ENTERPRISE SETTINGS & POLICIES
  // =========================================================================
  async getSettings() {
    return fetchWithFallback<any>('/settings', undefined, null);
  },

  async updateSettings(data: any) {
    return fetchWithFallback<any>(
      '/settings',
      { method: 'PUT', body: JSON.stringify(data) },
      { ...data, updatedAt: new Date().toISOString() }
    );
  },

  // =========================================================================
  // 20. COMPANIES (TENANT-LEVEL SCOPED ACCESS)
  // =========================================================================
  async getMyCompany() {
    return fetchWithFallback<any>('/companies/my-company', undefined, null);
  },

  async getCompanyById(id: string) {
    return fetchWithFallback<any>(`/companies/${encodeURIComponent(id)}`, undefined, null);
  },

  async updateCompany(id: string, data: { companyName?: string; phone?: string; address?: string; status?: string }) {
    return fetchWithFallback<any>(
      `/companies/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(data) },
      { id, ...data, updatedAt: new Date().toISOString() }
    );
  },

};

