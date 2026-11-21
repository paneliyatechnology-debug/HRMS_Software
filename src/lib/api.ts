
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
import { getCookie, setCookie, purgeAuthLocalStorage } from './cookies';

const getApiBase = () => getApiBaseUrl();

// In-flight GET request deduplication to prevent simultaneous identical requests
const inFlightGetRequests = new Map<string, Promise<any>>();

// Lightweight short-term response cache (TTL: 1500ms) to avoid duplicate API calls from rapid React re-renders
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const responseCache = new Map<string, CacheEntry<any>>();
let cacheGeneration = 0;

export function clearApiCache(endpointPrefix?: string) {
  cacheGeneration += 1;
  if (!endpointPrefix) {
    responseCache.clear();
    inFlightGetRequests.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(endpointPrefix)) {
      responseCache.delete(key);
    }
  }
<<<<<<< HEAD
  const contentType = (config.headers && typeof (config.headers as any).get === 'function')
    ? (config.headers as any).get('Content-Type')
    : (config.headers as any)?.['Content-Type'];

  const isExplicitJson = typeof contentType === 'string' && contentType.includes('application/json');

  const data = config.data;
  if (!isExplicitJson && data && typeof data === 'object' && !(data instanceof FormData)) {
    const form = new FormData();
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value == null || value === '') continue;
      form.append(key, value instanceof Blob ? value : String(value));
=======
  // Drop in-flight GETs too, so a refresh after create does not reuse a request that started before the employee existed.
  for (const key of inFlightGetRequests.keys()) {
    if (key.includes(endpointPrefix)) {
      inFlightGetRequests.delete(key);
>>>>>>> 8778032cb496482620ae0988c1a6b2b435b75d9d
    }
  }
}

/**
 * Universal API fetcher that forwards JWT Bearer token and gracefully falls back to local data.
 * Includes in-flight deduplication, short-lived GET caching, and a fail-fast timeout.
 */
async function fetchWithFallback<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // If a mutation occurs, invalidate cached GET endpoints.
  // POST /admin/employees must also drop GET /employees (the first path segment is only "admin").
  if (!isGet) {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    if (parts.length === 0) {
      clearApiCache();
    } else {
      for (const part of parts) clearApiCache(part);
    }
  }

  // Check short-term cache for GET requests
  const cacheKey = `${method}:${url}`;
  if (isGet) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }

    // Check if an identical request is already in-flight
    if (inFlightGetRequests.has(cacheKey)) {
      return inFlightGetRequests.get(cacheKey) as Promise<T>;
    }
  }

  const executeFetch = async (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const generationAtStart = cacheGeneration;

    try {
      const storedToken =
        typeof window !== 'undefined'
          ? getCookie('hrms_auth_token') ||
          getCookie('bearerToken') ||
          getCookie('accessToken') ||
          getCookie('token') ||
          (window.localStorage
            ? window.localStorage.getItem('hrms_auth_token') ||
            window.localStorage.getItem('bearerToken') ||
            window.localStorage.getItem('accessToken') ||
            window.localStorage.getItem('token')
            : null)
          : null;

      const token = storedToken;

      const res = await fetch(`${getApiBase()}${url}`, {
        cache: 'no-store',
        credentials: 'include',
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
        } catch (_) { }
        throw new Error(errorMsg);
      }

      const text = await res.text();
      if (!text || !text.trim()) {
        return { success: true } as unknown as T;
      }
      let resultData: T;
      try {
        resultData = JSON.parse(text) as T;
      } catch (_) {
        resultData = { success: true, message: text } as unknown as T;
      }

      // Store successful GET responses only. A fallback empty list must not stick for 15s after a failed fetch.
      if (isGet && resultData !== fallback && generationAtStart === cacheGeneration) {
        const isStableEndpoint = url.includes('/companies') || url.includes('/employees') || url.includes('/attendance');
        const ttl = isStableEndpoint ? 15000 : 3000;
        responseCache.set(cacheKey, {
          data: resultData,
          expiry: Date.now() + ttl,
        });
      }

      return resultData;
    } catch (err) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  if (isGet) {
    const promise = executeFetch().finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });
    inFlightGetRequests.set(cacheKey, promise);
    return promise;
  }

  return executeFetch();
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
          setCookie('hrms_auth_token', result.accessToken);
          setCookie('bearerToken', result.accessToken);
          purgeAuthLocalStorage();
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

  async resetPassword(data: {
    password: string;
    confirmPassword?: string;
    token?: string;
    email?: string;
    identifier?: string;
    userId?: string;
  }) {
    try {
      const storedToken =
        typeof window !== 'undefined'
          ? getCookie('hrms_auth_token') ||
            getCookie('bearerToken') ||
            getCookie('accessToken') ||
            getCookie('token')
          : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      } else if (data.token) {
        headers['Authorization'] = `Bearer ${data.token}`;
      }

      // 1. Try /auth/set-password
      const res = await fetch(`${getApiBase()}/auth/set-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...data,
          confirmPassword: data.confirmPassword || data.password,
        }),
      });

      if (res.ok) {
        return await res.json().catch(() => ({ success: true, message: 'Password updated successfully' }));
      }

      // 2. If 404, fallback to /auth/reset-password
      if (res.status === 404) {
        const res2 = await fetch(`${getApiBase()}/auth/reset-password`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...data,
            confirmPassword: data.confirmPassword || data.password,
          }),
        });

        if (res2.ok) {
          return await res2.json().catch(() => ({ success: true, message: 'Password reset successfully' }));
        }

        const err2 = await res2.json().catch(() => ({}));
        let message = 'Failed to reset password.';
        if (typeof err2?.message === 'string') message = err2.message;
        else if (Array.isArray(err2?.message)) message = err2.message.join(', ');
        else if (typeof err2?.error === 'string') message = err2.error;
        throw new Error(message);
      }

      const errData = await res.json().catch(() => ({}));
      let message = 'Failed to set password.';
      if (typeof errData?.message === 'string') message = errData.message;
      else if (Array.isArray(errData?.message)) message = errData.message.join(', ');
      else if (typeof errData?.error === 'string') message = errData.error;
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
        rawRole === 'ADMIN' || rawRole === 'HR' || rawRole === 'EMPLOYEE'
          ? rawRole
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
          setCookie('hrms_auth_token', result.accessToken);
          setCookie('bearerToken', result.accessToken);
          purgeAuthLocalStorage();
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
    companyLegalName?: string;
    companyId?: string;
    gstNumber?: string;
    gstin?: string;
    industry?: string;
    industrySector?: string;
    address?: string;
    officeAddress?: string;
    city?: string;
    state?: string;
    firstName: string;
    lastName: string;
    email: string;
    officialEmail?: string;
    phone: string;
    mobileNumber?: string;
    password: string;
    confirmPassword?: string;
  }) {
    const legalName = (data.companyLegalName || data.companyName || '').trim();
    const email = (data.officialEmail || data.email || '').trim().toLowerCase();
    const phone = (data.mobileNumber || data.phone || '').trim();
    const gstin = (data.gstin || data.gstNumber || '').trim().toUpperCase();
    const address = (data.officeAddress || data.address || '').trim();
    const city = (data.city || 'Surat').trim();
    const state = (data.state || 'Gujarat').trim();
    const industry = (data.industrySector || data.industry || 'Information Technology & Software').trim();

    // Dedicated /api/companies/register payload
    const createPayload = {
      companyLegalName: legalName,
      gstin: gstin,
      industrySector: industry,
      officeAddress: address || `${city}, ${state}`,
      city: city,
      state: state,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      officialEmail: email,
      mobileNumber: phone,
      password: data.password,
      confirmPassword: data.confirmPassword || data.password,
    };

    const storedToken =
      typeof window !== 'undefined'
        ? getCookie('hrms_auth_token') ||
        getCookie('bearerToken') ||
        getCookie('accessToken') ||
        getCookie('token') ||
        (window.localStorage
          ? window.localStorage.getItem('hrms_auth_token') ||
          window.localStorage.getItem('bearerToken') ||
          window.localStorage.getItem('accessToken') ||
          window.localStorage.getItem('token')
          : null)
        : null;
    const authToken = storedToken;

    const res = await fetch(`${getApiBase()}/companies/register`, {
      method: 'POST',
      credentials: 'include',
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
        `Company registration failed with status ${res.status}`;
      throw new Error(message);
    }

    const compRes = await res.json();

    return {
      success: true,
      message: compRes?.message || 'Company registration request submitted successfully!',
      status: compRes?.status,
      requestId: compRes?.requestId,
      company: compRes?.company || {
        id: compRes?.requestId || `cmp-${Date.now()}`,
        name: legalName,
        code: 'CMP-PENDING',
      },
      user: undefined as any,
      token: undefined as any,
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
        ? getCookie('hrms_auth_token') || getCookie('bearerToken')
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
        } catch (_) { }
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
    const result = await fetchWithFallback<any>(
      '/admin/employees',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    return (result?.employee || result?.data || result) as Employee;
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    return fetchWithFallback<Employee>(
      `/employees/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  async deleteEmployee(id: string, data?: Record<string, any>) {
    const cleanId = encodeURIComponent(String(id || '').trim());
    const payload = data ? JSON.stringify(data) : undefined;
    return fetchWithFallback<{ success: boolean; message: string }>(
      `/admin/employees/${cleanId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        ...(payload ? { body: payload } : {}),
      }
    );
  },

  async deactivateEmployee(id: string) {
    const cleanId = encodeURIComponent(String(id || '').trim());
    return fetchWithFallback<{ success: boolean; message: string }>(
      `/employees/${cleanId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
  },

  async activateEmployee(id: string) {
    const cleanId = encodeURIComponent(String(id || '').trim());
    return fetchWithFallback<{ success: boolean; message: string; employee?: Employee }>(
      `/employees/${cleanId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Active' }),
      }
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

  async addDesignationMembers(designationId: string, userIds: string[]) {
    return fetchWithFallback<{
      success: boolean;
      message: string;
      designation?: { id: string; title: string };
      assignedCount?: number;
      assignedMembers?: Array<{
        id: string;
        userId: string;
        employeeId: string;
        employeeCode: string;
        fullName: string;
        email: string;
        designationId: string;
        designationTitle: string;
        departmentName: string;
      }>;
    }>(
      `/organization/designations/${encodeURIComponent(designationId)}/members`,
      {
        method: 'POST',
        body: JSON.stringify({ userIds }),
      }
    );
  },

  async updateDesignationMember(
    designationId: string,
    userId: string,
    data: { designationId: string; departmentId: string; status?: string }
  ) {
    return fetchWithFallback<{ success: boolean; message?: string }>(
      `/organization/designations/${encodeURIComponent(designationId)}/members/${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  async removeDesignationMember(designationId: string, userId: string) {
    return fetchWithFallback<{ success: boolean; message?: string }>(
      `/organization/designations/${encodeURIComponent(designationId)}/members/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  async getDesignationMembers(designationId: string) {
    return fetchWithFallback<any>(
      `/organization/designations/${encodeURIComponent(designationId)}/members`,
      undefined,
      null
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
        if (found && found.id) {
          return found.id.startsWith('emp-') ? found.id : found.id.replace(/^user-/, 'emp-');
        }
      }
    } catch (e) {
      console.warn('Could not resolve attendance employee ID from backend:', e);
    }
    if (idOrCode && idOrCode.startsWith('user-')) {
      return idOrCode.replace(/^user-/, 'emp-');
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

  /**
   * Fetch daily attendance logs / history (Pre-configured for user's upcoming custom API endpoint)
   */
  async getDailyAttendanceLogs(params?: {
    employeeId?: string;
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.month) query.set('month', params.month);
    if (params?.year) query.set('year', params.year);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    // Default fallback to /attendance, ready to swap to custom endpoint when provided
    return fetchWithFallback<AttendanceRecord[]>(`/attendance${qs ? `?${qs}` : ''}`, undefined, []);
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
      backendRecord = await this.startWork({});
    } catch (err: any) {
      console.error('Check-in backend POST error:', err);
      return {
        success: false,
        message: err.message || 'Check-in failed.',
      };
    }

    if (backendRecord) {
      return {
        success: true,
        message: backendRecord.message || 'Clocked in successfully!',
        record: backendRecord.record || backendRecord,
      };
    }

    return {
      success: false,
      message: 'Failed to record check-in in database.',
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
      backendRecord = await this.stopWork({});
    } catch (err: any) {
      console.error('Check-out backend POST error:', err);
      return {
        success: false,
        message: err.message || 'Check-out failed.',
      };
    }

    if (backendRecord) {
      return {
        success: true,
        message: backendRecord.message || 'Clocked out successfully!',
        record: backendRecord.record || backendRecord,
      };
    }

    return {
      success: false,
      message: 'Failed to record check-out in database.',
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
    active?: boolean;
    hasActiveSession?: boolean;
    isOnBreak?: boolean;
    activeSession?: any;
    workSession?: any;
    currentBreak?: any;
    totalBreakSeconds?: number;
    formattedTotalBreak?: string;
    lastCompletedSession?: any;
    todaySummary?: any;
    elapsedSeconds?: number;
    assignedLocation?: any;
    assignedOffice?: any;
    serverTime?: string;
  }> {
    try {
      const res = await fetchWithFallback<any>('/api/attendance/work/status');
      if (res && (res.todaySummary || res.lastCompletedSession || res.activeSession || res.serverTime || res.assignedOffice)) {
        return res;
      }
    } catch (_) { }
    return fetchWithFallback<any>('/attendance/work/status', undefined, {
      active: false,
      hasActiveSession: false,
      serverTime: new Date().toISOString(),
    });
  },

  async startWork(data: any = {}) {
    return fetchWithFallback<any>(
      '/api/attendance/work/start',
      { method: 'POST', body: JSON.stringify(data || {}) }
    );
  },

  async stopWork(data: any = {}) {
    return fetchWithFallback<any>(
      '/api/attendance/work/stop',
      { method: 'POST', body: JSON.stringify(data || {}) }
    );
  },

  async startBreak(data: any = {}) {
    return fetchWithFallback<any>(
      '/api/attendance/work/break/start',
      { method: 'POST', body: JSON.stringify(data || {}) }
    );
  },

  async takeBreak(data: any = {}) {
    return this.startBreak(data);
  },

  async resumeBreak(data: any = {}) {
    return fetchWithFallback<any>(
      '/api/attendance/work/break/resume',
      { method: 'POST', body: JSON.stringify(data || {}) }
    );
  },

  async resumeWork(data: any = {}) {
    return this.resumeBreak(data);
  },

  async getWorkHistory(page = 1, limit = 50, employeeId?: string) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (employeeId) query.set('employeeId', employeeId);
    const res = await fetchWithFallback<{
      sessions?: any[];
      data?: any[];
      total: number;
      page: number;
      limit: number;
    }>(`/attendance/work/history?${query.toString()}`);
    const sessions = Array.isArray(res?.sessions)
      ? res.sessions
      : Array.isArray(res?.data)
        ? res.data
        : [];
    return { ...res, sessions, data: sessions };
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
    userId?: string;
    employeeId?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    daysCount?: number;
    isHalfDay?: boolean;
    halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF';
    dayBreakdown?: Array<{ date: string; session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF'; duration: number }>;
    employeeName?: string;
    employeeAvatar?: string;
    departmentName?: string;
  }) {
    const payload = {
      userId: data.userId || data.employeeId || '',
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      ...(typeof data.daysCount === 'number' ? { daysCount: data.daysCount } : {}),
      isHalfDay: Boolean(data.isHalfDay),
      ...(data.isHalfDay && data.halfDaySession ? { halfDaySession: data.halfDaySession } : {}),
      ...(data.dayBreakdown && data.dayBreakdown.length > 0 ? { dayBreakdown: data.dayBreakdown } : {}),
      reason: data.reason,
      employeeId: data.employeeId || data.userId || '',
      employeeName: data.employeeName,
      departmentName: data.departmentName,
    };

    return fetchWithFallback<LeaveRequest>(
      '/leaves/apply',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
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

  async approveLeave(id: string, role = 'HR', approverName = 'HR', comments?: string) {
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
    const cleanId = encodeURIComponent(String(id || '').trim());
    return fetchWithFallback<{ success: boolean; message?: string }>(
      `/holidays/${cleanId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      }
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
    const res = await fetchWithFallback<any>(
      '/settings',
      { method: 'PUT', body: JSON.stringify(data) }
    );
    clearApiCache('settings');
    clearApiCache('leaves');
    return res;
  },

  // =========================================================================
  // 20. TEAM CHAT
  // =========================================================================
  async getChatMessages() {
    return fetchWithFallback<any[]>('/chat/messages', undefined, []);
  },

  async saveChatMessage(message: any) {
    return fetchWithFallback<any>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  async markChatRead(conversationId: string) {
    return fetchWithFallback<any>('/chat/messages/read', {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    });
  },

  // =========================================================================
  // 21. COMPANIES (TENANT-LEVEL SCOPED ACCESS)
  // =========================================================================
  companyCache: null as any,

  async getMyCompany() {
    if (this.companyCache) return this.companyCache;
    const res = await fetchWithFallback<any>('/companies/my-company', undefined, null);
    if (res) this.companyCache = res;
    return res;
  },

  async getCompanyById(id: string) {
    if (this.companyCache && (this.companyCache.id === id || this.companyCache._id === id)) {
      return this.companyCache;
    }
    const res = await fetchWithFallback<any>(`/companies/${encodeURIComponent(id)}`, undefined, null);
    if (res) this.companyCache = res;
    return res;
  },

  async updateCompany(id: string, data: Record<string, any>) {
    return fetchWithFallback<any>(
      `/companies/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

};

<<<<<<< HEAD
async function login(email: string, password: string) {
  try {
    const response = await http.post('/users/login', { email, password });
    const data = response.data;
    const token = data?.token || data?.accessToken || (data && typeof data === 'object' && 'token' in data ? (data as any).token : null);
    if (token && typeof window !== 'undefined') {
      setCookie('hrms_auth_token', token);
      setCookie('bearerToken', token);
    }
    return data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Email or password is incorrect.');
  }
}

async function forgotPassword(email: string) {
  try {
    const response = await http.post('/users/forgot', { email }, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to send password reset link.');
  }
}

async function resetPassword(data: { token: string; password: string; confirmPassword?: string }) {
  try {
    const response = await http.post('/users/reset-password', data);
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to reset password.');
  }
}

async function logout() {
  await http.post('/users/logout');
}

async function getProfile() {
  try {
    const response = await http.get('/users/profile');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Profile could not be loaded.');
  }
}

async function listUsers(params: { page?: number; limit?: number; search?: string; status?: string; companyId?: string }) {
  try {
    const response = await http.get('/users', { params });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Users could not be loaded.');
  }
}

async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  address?: string;
  photo?: File | null;
  role?: string;
  status?: string;
  companyId?: string;
}) {
  try {
    const response = await http.post('/users', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      gender: data.gender || undefined,
      address: data.address || undefined,
      photo: data.photo || undefined,
      role: data.role || undefined,
      status: data.status || undefined,
      companyId: data.companyId || undefined,
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'User could not be created.');
  }
}

async function listDocuments(params?: { page?: number; limit?: number; userId?: string; scope?: string; companyId?: string }) {
  try {
    const response = await http.get('/documents', { params });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Documents could not be loaded.');
  }
}

async function getDocument(id: string) {
  try {
    const response = await http.get(`/documents/${id}`);
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be loaded.');
  }
}

async function updateDocument(id: string, data: { title: string; userId?: string; file?: File | null }) {
  try {
    const form = new FormData();
    form.append('title', data.title);
    if (data.userId !== undefined) form.append('userId', data.userId);
    if (data.file) form.append('file', data.file);
    const response = await http.patch(`/documents/${id}`, form);
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be updated.');
  }
}

async function deleteDocument(id: string) {
  try {
    const response = await http.delete(`/documents/${id}`);
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be deleted.');
  }
}
async function createDocument(data: { title: string; file: File; userId?: string; companyId?: string }) {
  try {
    const response = await http.post('/documents', {
      title: data.title,
      file: data.file,
      userId: data.userId || undefined,
      companyId: data.companyId || undefined,
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be uploaded.');
  }
}

async function clockIn(data?: { workMode?: 'Office' | 'Work From Home'; note?: string }) {
  try {
    const response = await http.post('/attendance/check-in', {
      workMode: data?.workMode || undefined,
      note: data?.note || undefined,
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Clock in failed.');
  }
}

async function getAttendanceLogic() {
  try {
    const response = await http.get('/attendance/logic');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance status could not be loaded.');
  }
}

async function startBreak(data?: { note?: string }) {
  try {
    const response = await http.post('/attendance/break/start', { note: data?.note || undefined });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Break could not be started.');
  }
}

async function endBreak(data?: { note?: string }) {
  try {
    const response = await http.post('/attendance/break/end', { note: data?.note || undefined });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Break could not be ended.');
  }
}

const resumeBreak = endBreak;

async function clockOut(data?: { note?: string }) {
  try {
    const response = await http.post('/attendance/check-out', {
      note: data?.note || undefined,
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Clock out failed.');
  }
}

async function registerCompany(data: CompanyRegisterInput) {
  try {
    const response = await http.post('/companies/register', {
      companyName: data.companyName,
      email: data.email,
      phone: data.phone || undefined,
      gstNumber: data.gstNumber || undefined,
      industrySector: data.industrySector || undefined,
      state: data.state || undefined,
      city: data.city || undefined,
      address: data.address || undefined,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Company registration failed.');
  }
}

export const api = new Proxy({ registerCompany, login, forgotPassword, resetPassword, getProfile, logout, createUser, listUsers, listDocuments, getDocument, createDocument, updateDocument, deleteDocument, clockIn, clockOut, startBreak, endBreak, resumeBreak, getAttendanceLogic } as Record<string, (...args: any[]) => Promise<any>>, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = notConnected;
    return target[prop];
  },
});
=======
>>>>>>> 8778032cb496482620ae0988c1a6b2b435b75d9d
