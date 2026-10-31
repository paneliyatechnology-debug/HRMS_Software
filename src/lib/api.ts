
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

/**
 * Universal API fetcher that forwards JWT Bearer token and gracefully falls back to local data.
 * Includes a 4-second fail-fast timeout so slow/unreachable network endpoints don't freeze mobile devices.
 */
async function fetchWithFallback<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const storedToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken')
        : null;

    const token = storedToken;

    const res = await fetch(`${getApiBase()}${url}`, {
      cache: 'no-store',
      signal: controller.signal,
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) errorMsg = errJson.error.message;
        else if (errJson?.message) errorMsg = errJson.message;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
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
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: email, email, password }),
      });

      if (res.ok) {
        const result = await res.json();
        if (typeof window !== 'undefined' && result?.accessToken) {
          localStorage.setItem('hrms_auth_token', result.accessToken);
          localStorage.setItem('bearerToken', result.accessToken);
        }
        return result;
      }

      const errData = await res.json().catch(() => ({}));
      let message = 'Login failed';
      if (typeof errData?.error?.message === 'string') {
        message = errData.error.message;
      } else if (typeof errData?.message === 'string') {
        message = errData.message;
      } else if (Array.isArray(errData?.message)) {
        message = errData.message.join(', ');
      } else if (typeof errData?.error === 'string') {
        message = errData.error;
      } else if (res.status === 401) {
        message = 'Invalid email, phone, employee code, or password.';
      } else {
        message = `Login failed with status ${res.status}`;
      }
      throw new Error(message);
    } catch (err: any) {
      throw err;
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
      const normalizedRole =
        rawRole === 'HR_ADMIN' || rawRole === 'ADMIN'
          ? 'ADMIN'
          : 'EMPLOYEE';

      const payload = {
        ...data,
        role: normalizedRole,
      };

      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (typeof window !== 'undefined' && result?.accessToken) {
          localStorage.setItem('hrms_auth_token', result.accessToken);
          localStorage.setItem('bearerToken', result.accessToken);
        }
        return result;
      }

      const errData = await res.json().catch(() => ({}));
      const message =
        (Array.isArray(errData?.error?.message) ? errData.error.message.join(', ') : null) ||
        errData?.error?.message ||
        (Array.isArray(errData?.message) ? errData.message.join(', ') : null) ||
        errData?.message ||
        `Registration failed with status ${res.status}`;
      throw new Error(message);
    } catch (err: any) {
      throw err;
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

    const storedToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken')
        : null;
    const authToken = storedToken;

    const res = await fetch(`${getApiBase()}/super-admin/companies`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(createPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message =
        (Array.isArray(errData?.error?.message) ? errData.error.message.join(', ') : null) ||
        errData?.error?.message ||
        (Array.isArray(errData?.message) ? errData.message.join(', ') : null) ||
        errData?.message ||
        `Company creation failed with status ${res.status}`;
      throw new Error(message);
    }

    const compRes = await res.json();
    const createdCompany = compRes?.company || compRes;
    const companyId = createdCompany?.id || `cmp-${Date.now()}`;
    const companyCode = createdCompany?.companyCode || 'CMP-000001';

    // Auto-login as Company Admin to get active session
    let loginRes: any = null;
    try {
      loginRes = await this.login(data.email.trim().toLowerCase(), data.password);
    } catch (loginErr) {
      console.warn('Auto-login after company creation warning:', loginErr);
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
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken')
        : null;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(`${getApiBase()}/users/profile/photo`, {
        method: 'PATCH',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `HTTP error ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) errorMsg = errJson.error.message;
          else if (errJson?.message) errorMsg = errJson.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const newAvatarUrl =
        data.avatarUrl || data.photoUrl || data.cloudinaryUrl || (data.user && data.user.avatarUrl) || '';

      return {
        success: true,
        avatarUrl: newAvatarUrl,
        user: data.user,
      };
    } finally {
      clearTimeout(timeoutId);
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
    return fetchWithFallback<Department>(
      '/organization/departments',
      { method: 'POST', body: JSON.stringify(data) }
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
      { method: 'PUT', body: JSON.stringify(data) }
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
    return fetchWithFallback<Designation>(
      '/organization/designations',
      { method: 'POST', body: JSON.stringify(data) }
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
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async syncBiometricAttendance(logs: any[], deviceId = 'GATE-01-TERMINAL') {
    return fetchWithFallback<any>(
      '/attendance/biometric-sync',
      { method: 'POST', body: JSON.stringify({ logs, deviceId }) }
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
      { method: 'POST', body: JSON.stringify(data) }
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
      { method: 'POST', body: JSON.stringify(data) }
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
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
    employeeName?: string;
    employeeAvatar?: string;
    departmentName?: string;
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
      { method: 'POST', body: JSON.stringify({ month, actorName }) }
    );
  },

  async getPayslip(id: string) {
    return fetchWithFallback<any>(`/payroll/payslip/${id}`, undefined, null);
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
      { method: 'PUT', body: JSON.stringify({ status, actorName: actor }) }
    );
  },

  // =========================================================================
  // 8. RECRUITMENT & TALENT PIPELINE (ATS)
  // =========================================================================
  async getJobs() {
    return fetchWithFallback<JobOpening[]>('/recruitment/jobs', undefined, []);
  },

  async createJob(data: Partial<JobOpening>) {
    return fetchWithFallback<JobOpening>(
      '/recruitment/jobs',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async getCandidates(jobId?: string) {
    const query = jobId && jobId !== 'ALL' ? `?jobId=${jobId}` : '';
    return fetchWithFallback<Candidate[]>(`/recruitment/candidates${query}`, undefined, []);
  },

  async createCandidate(data: Partial<Candidate>) {
    return fetchWithFallback<Candidate>(
      '/recruitment/candidates',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async updateCandidateStatus(id: string, status: string, actorName = 'Lead Recruiter') {
    return fetchWithFallback<Candidate>(
      `/recruitment/candidates/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status, actorName }) }
    );
  },

  async scheduleInterview(
    id: string,
    data: { round: string; interviewerName: string; scheduledAt: string }
  ) {
    return fetchWithFallback<any>(
      `/recruitment/candidates/${id}/schedule-interview`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async convertCandidateToEmployee(id: string, actorName = 'HR Admin') {
    return fetchWithFallback<any>(
      `/recruitment/candidates/${id}/convert`,
      { method: 'POST', body: JSON.stringify({ actorName }) }
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
      { method: 'POST', body: JSON.stringify(data) }
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
    return fetchWithFallback<TrainingProgram>(
      '/training/programs',
      { method: 'POST', body: JSON.stringify(data) }
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
    const empId = typeof trainingIdOrPayload === 'string' ? (employeeId || '') : trainingIdOrPayload.employeeId;
    return fetchWithFallback<any>(
      '/training/enroll',
      { method: 'POST', body: JSON.stringify({ trainingId, employeeId: empId }) }
    );
  },

  async updateTrainingProgress(id: string, progressPercent: number) {
    return fetchWithFallback<any>(
      `/training/enrollments/${id}/progress`,
      { method: 'PUT', body: JSON.stringify({ progressPercent }) }
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
    return fetchWithFallback<CompanyAsset>(
      '/assets',
      { method: 'POST', body: JSON.stringify(data) }
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
      { method: 'PUT', body: JSON.stringify({ employeeId, actorName: actor }) }
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
      { method: 'PUT', body: JSON.stringify({ condition, actorName: actor }) }
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
    return fetchWithFallback<Resignation>(
      '/resignations/submit',
      { method: 'POST', body: JSON.stringify(payload) }
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
      { method: 'PUT', body: JSON.stringify({ clearance, actorName: actor }) }
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
    return fetchWithFallback<Holiday>(
      '/holidays',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async deleteHoliday(id: string) {
    return fetchWithFallback<{ success: boolean }>(
      `/holidays/${id}`,
      { method: 'DELETE' }
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
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async uploadDocumentFile(formData: FormData) {
    const res = await fetch(`${getApiBase()}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
    return await res.json();
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
    return fetchWithFallback<any>('/notifications/mark-all-read', { method: 'PUT' });
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
      { method: 'PUT', body: JSON.stringify(data) }
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
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

};

