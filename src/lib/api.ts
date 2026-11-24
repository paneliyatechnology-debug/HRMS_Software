import axios from 'axios';
import { getApiBaseUrl } from './config';
import { getCookie, setCookie } from './cookies';
import { LeaveRequest, AttendanceRecord, LeaveDayBreakdown, LeaveDaySession } from '../types/hrms';

export const http = axios.create({
  withCredentials: true,
});

/* ==========================================================================
   REQUEST DEDUPLICATION & IN-MEMORY CACHE (PREVENTS DUPLICATE API CALLS)
   ========================================================================== */

const pendingRequests = new Map<string, Promise<any>>();
const cacheStore = new Map<string, { data: any; expiresAt: number }>();

export function clearApiCache(endpointPrefix?: string) {
  if (!endpointPrefix) {
    cacheStore.clear();
    pendingRequests.clear();
    return;
  }
  for (const key of Array.from(cacheStore.keys())) {
    if (key.includes(endpointPrefix)) cacheStore.delete(key);
  }
  for (const key of Array.from(pendingRequests.keys())) {
    if (key.includes(endpointPrefix)) pendingRequests.delete(key);
  }
}

export async function deduplicatedGet<T = any>(
  url: string,
  config?: any,
  ttlMs: number = 8000
): Promise<T> {
  const paramsKey = config?.params ? JSON.stringify(config.params) : '';
  const cacheKey = `GET:${url}:${paramsKey}`;
  const now = Date.now();

  // 1. Check TTL Cache: if recently fetched within TTL, return immediately without network call
  const cached = cacheStore.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // 2. Check In-Flight Requests: if the exact same request is already executing, wait for it
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 3. Initiate single network request
  const requestPromise = http
    .get(url, config)
    .then((res) => {
      pendingRequests.delete(cacheKey);
      cacheStore.set(cacheKey, { data: res.data, expiresAt: Date.now() + ttlMs });
      return res.data;
    })
    .catch((err) => {
      pendingRequests.delete(cacheKey);
      throw err;
    });

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

const notConnected = async (..._args: unknown[]) => null;

// Interceptor: inject base URL, credentials, and Authorization token
http.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    const token =
      getCookie('hrms_auth_token') ||
      getCookie('bearerToken') ||
      getCookie('accessToken') ||
      getCookie('token') ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken') || localStorage.getItem('accessToken') : null);
    if (token && !config.headers.Authorization) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // If request data is FormData, remove manual Content-Type header so browser/axios calculates multipart boundary
  if (config.data instanceof FormData) {
    if (config.headers && typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
    } else if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
    return config;
  }

  const getHeader = (name: string): string | undefined => {
    if (!config.headers) return undefined;
    if (typeof (config.headers as any).get === 'function') {
      return (config.headers as any).get(name) || (config.headers as any).get(name.toLowerCase());
    }
    return (config.headers as any)[name] || (config.headers as any)[name.toLowerCase()];
  };

  const contentType = getHeader('Content-Type');
  const isExplicitJson = typeof contentType === 'string' && contentType.toLowerCase().includes('application/json');

  const data = config.data;
  if (!isExplicitJson && data && typeof data === 'object' && !(data instanceof FormData)) {
    const form = new FormData();
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value == null || value === '') continue;
      form.append(key, value instanceof Blob ? value : String(value));
    }
    config.data = form;
    if (config.headers && typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
    } else if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }
  return config;
});

// Interceptor: handle 401 Unauthorized with automatic token refresh (POST /users/refresh)
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/users/login') &&
      !originalRequest.url?.includes('/users/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          `${getApiBaseUrl()}/users/refresh`,
          {},
          { withCredentials: true }
        );
        const data = refreshRes.data;
        const token = data?.token || data?.accessToken;
        if (token) {
          if (typeof window !== 'undefined') {
            setCookie('hrms_auth_token', token);
            setCookie('bearerToken', token);
            setCookie('accessToken', token);
          }
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return http(originalRequest);
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hrms_session_expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   MODULE 1: USERS (10 ENDPOINTS)
   ========================================================================== */

// 1. POST /users/forgot
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

// 2. POST /users (Create user - Admin)
export interface CreateUserInput {
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
  password?: string;
  salary?: {
    basic?: number;
    hra?: number;
    allowances?: number;
    bonus?: number;
    pf?: number;
    tax?: number;
    gross?: number;
    net?: number;
  };
}

async function createUser(data: CreateUserInput) {
  try {
    const payload: any = {
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
    };
    if (data.password) payload.password = data.password;
    if (data.salary) payload.salary = data.salary;

    const response = await http.post('/users', payload);
    clearApiCache('/users');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'User could not be created.');
  }
}

// 3. POST /users/login
async function login(email: string, password: string) {
  try {
    const response = await http.post('/users/login', { email, password }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache();
    const data = response.data;
    const token = data?.token || data?.accessToken || (data && typeof data === 'object' && 'token' in data ? (data as any).token : null);
    if (token && typeof window !== 'undefined') {
      setCookie('hrms_auth_token', token);
      setCookie('bearerToken', token);
      setCookie('accessToken', token);
    }
    return data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Email or password is incorrect.');
  }
}

// 4. GET /users/reset-password
async function getResetPasswordForm() {
  try {
    return await deduplicatedGet('/users/reset-password');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load reset password form.');
  }
}

// 5. POST /users/reset-password
async function resetPassword(data: { token?: string; password: string; confirmPassword?: string }) {
  try {
    const payload = {
      token: data.token || '',
      password: data.password,
      confirmPassword: data.confirmPassword || data.password,
    };
    const response = await http.post('/users/reset-password', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to reset password.');
  }
}

// 6. POST /users/logout
async function logout() {
  try {
    clearApiCache();
    const response = await http.post('/users/logout');
    return response.data;
  } catch {
    clearApiCache();
    return { success: true };
  }
}

// 7. POST /users/refresh
async function refreshToken() {
  try {
    const response = await http.post('/users/refresh');
    const data = response.data;
    const token = data?.token || data?.accessToken;
    if (token && typeof window !== 'undefined') {
      setCookie('hrms_auth_token', token);
      setCookie('bearerToken', token);
      setCookie('accessToken', token);
    }
    return data;
  } catch (error) {
    return null;
  }
}

function isEmployeeSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const portalMode = getCookie('hrms_portal_mode');
    if (portalMode === 'employee') return true;
    const currentRole = getCookie('hrms_current_role');
    if (currentRole && currentRole.toUpperCase() === 'EMPLOYEE') return true;
    const userCookie = getCookie('hrms_auth_user');
    if (userCookie) {
      const parsed = JSON.parse(userCookie);
      if (parsed?.role && parsed.role.toUpperCase() === 'EMPLOYEE') return true;
    }
    const token = getCookie('hrms_auth_token') || getCookie('bearerToken') || getCookie('accessToken');
    if (token && token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.role && payload.role.toUpperCase() === 'EMPLOYEE') return true;
      }
    }
  } catch {}
  return false;
}

// 8. GET /users (List users - Admin)
async function listUsers(params?: { page?: number; limit?: number; search?: string; status?: string; companyId?: string }) {
  try {
    if (isEmployeeSession()) {
      return { data: [], users: [], total: 0 };
    }
    return await deduplicatedGet('/users', { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Users could not be loaded.');
  }
}

// 9. GET /users/profile (My profile)
async function getProfile() {
  try {
    return await deduplicatedGet('/users/profile');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Profile could not be loaded.');
  }
}

// 10. GET /users/:userId (Get user - Admin)
async function getUser(userId: string) {
  try {
    return await deduplicatedGet(`/users/${userId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'User could not be loaded.');
  }
}

/* ==========================================================================
   MODULE 2: COMPANIES (1 ENDPOINT)
   ========================================================================== */

// 11. POST /companies/register
export type CompanyRegisterInput = {
  companyName: string;
  email: string;
  phone?: string;
  gstNumber?: string;
  industrySector?: string;
  state?: string;
  city?: string;
  address?: string;
  firstName: string;
  lastName: string;
};

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
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache();
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Company registration failed.');
  }
}

/* ==========================================================================
   MODULE 3: DOCUMENTS (5 ENDPOINTS)
   ========================================================================== */

function backendDocToEmployeeDocument(d: any) {
  if (!d) return null;
  const userName = d.userName || (d.user ? `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim() : '') || 'Keyur Sangani';
  const uploadedByName = d.uploadedByName || (d.uploadedByUser ? `${d.uploadedByUser.firstName || ''} ${d.uploadedByUser.lastName || ''}`.trim() : '') || userName;
  const fileExt = d.fileName
    ? d.fileName.split('.').pop()?.toUpperCase()
    : d.mimeType
    ? d.mimeType.split('/').pop()?.toUpperCase()
    : 'PDF';

  const formattedDate = d.createdAt
    ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : d.uploadDate || new Date().toISOString().split('T')[0];

  return {
    id: d.id || `doc-${Date.now()}`,
    companyId: d.companyId || '',
    companyName: d.companyName || '',
    userId: d.userId || '',
    userName: userName,
    employeeId: d.userId || d.employeeId || '',
    employeeName: userName,
    uploadedBy: d.uploadedBy || '',
    uploadedByName: uploadedByName,
    title: d.title || d.name || d.fileName || 'Untitled Document',
    fileName: d.fileName || `${d.title || 'document'}.${fileExt.toLowerCase()}`,
    fileUrl: d.fileUrl || d.url || (d.path ? `${getApiBaseUrl().replace(/\/api$/, '')}/${String(d.path).replace(/^\/+/, '')}` : '#'),
    mimeType: d.mimeType || 'application/pdf',
    fileType: fileExt,
    category: d.category || fileExt || 'Other',
    fileSize: d.fileSize || (d.size ? `${(Number(d.size) / 1024).toFixed(1)} KB` : 'N/A'),
    uploadDate: formattedDate,
    createdAt: d.createdAt,
    verificationStatus: (d.verificationStatus || d.status || 'Verified'),
    verifiedBy: d.verifiedBy || undefined,
  };
}

// 12. POST /documents (Add document - multipart/form-data)
async function createDocument(data: FormData | { title: string; file: File; userId?: string; companyId?: string }) {
  try {
    let form: FormData;
    if (data instanceof FormData) {
      form = data;
    } else {
      form = new FormData();
      form.append('title', data.title || '');
      form.append('userId', data.userId || '');
      form.append('companyId', data.companyId || '');
      if (data.file) {
        form.append('file', data.file);
      }
    }
    const response = await http.post('/documents', form);
    clearApiCache('/documents');
    const result = response.data;
    const docData = result?.document || result?.data || result;
    return backendDocToEmployeeDocument(docData) || docData;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be uploaded.');
  }
}

// 13. GET /documents (List documents)
async function listDocuments(params?: { page?: number; limit?: number; userId?: string; scope?: string; companyId?: string }) {
  try {
    return await deduplicatedGet('/documents', { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Documents could not be loaded.');
  }
}

// 14. GET /documents/:documentId (Get document)
async function getDocument(id: string) {
  try {
    return await deduplicatedGet(`/documents/${id}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be loaded.');
  }
}

// 15. PATCH /documents/:documentId (Update document)
async function updateDocument(id: string, data: { title?: string; userId?: string; file?: File | null; status?: string }) {
  try {
    let res: any;
    if (data.file) {
      const form = new FormData();
      if (data.title) form.append('title', data.title);
      if (data.userId !== undefined) form.append('userId', data.userId);
      form.append('file', data.file);
      if (data.status) form.append('status', data.status);
      res = await http.patch(`/documents/${id}`, form);
    } else {
      res = await http.patch(`/documents/${id}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    clearApiCache('/documents');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be updated.');
  }
}

// 16. DELETE /documents/:documentId (Delete document)
async function deleteDocument(id: string) {
  try {
    const response = await http.delete(`/documents/${id}`);
    clearApiCache('/documents');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be deleted.');
  }
}

/* ==========================================================================
   MODULE 4: ATTENDANCE (14 ENDPOINTS)
   ========================================================================== */

// 17. POST /attendance/clock (Clock in, clock out, break in, break out)
async function clock(data?: { flag: 'clock-in' | 'clock-out' | 'break-in' | 'break-out'; workMode?: string; note?: string }) {
  try {
    clearApiCache('/attendance');
    const payload = {
      flag: data?.flag,
      workMode: data?.workMode || 'Office',
      note: data?.note || '',
    };
    const response = await http.post('/attendance/clock', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error) : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance clock action failed.');
  }
}

// 19. GET /attendance/logic (Attendance logic)
async function getAttendanceLogic() {
  try {
    // Attendance logic represents live shifts and punch timing — never serve stale TTL cache
    return await deduplicatedGet('/attendance/logic', undefined, 0);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance status could not be loaded.');
  }
}

// 20. GET /attendance/calendar (Attendance calendar)
async function getAttendanceCalendar(params?: { month?: number | string; year?: number | string }) {
  try {
    return await deduplicatedGet('/attendance/calendar', { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance calendar could not be loaded.');
  }
}

// 21. GET /attendance/summary (Attendance summary)
async function getAttendanceSummary(params?: { month?: number | string; year?: number | string }) {
  try {
    return await deduplicatedGet('/attendance/summary', { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance summary could not be loaded.');
  }
}

// 22. GET /attendance/settings (Attendance settings)
async function getAttendanceSettings() {
  try {
    return await deduplicatedGet('/attendance/settings');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance settings could not be loaded.');
  }
}

// 23. PUT /attendance/settings (Save attendance settings)
async function saveAttendanceSettings(data: {
  shiftStart?: string;
  shiftEnd?: string;
  graceMinutes?: number;
  weeklyOffs?: string;
}) {
  try {
    const response = await http.put('/attendance/settings', {
      shiftStart: data.shiftStart || '09:30',
      shiftEnd: data.shiftEnd || '18:30',
      graceMinutes: data.graceMinutes !== undefined ? data.graceMinutes : 15,
      weeklyOffs: data.weeklyOffs !== undefined ? String(data.weeklyOffs) : '0',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance/settings');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance settings could not be saved.');
  }
}

async function getWeekendRules() {
  try {
    const response = await http.get('/attendance/weekend-rules');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Weekend rules could not be loaded.');
  }
}

async function saveWeekendRules(data: { weekendDays: number[]; saturdayRule: string }) {
  try {
    const response = await http.put('/attendance/weekend-rules', {
      weekendDays: data.weekendDays,
      saturdayRule: data.saturdayRule,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance/settings');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Weekend rules could not be saved.');
  }
}

// 24. GET /attendance/holidays (List holidays)
async function listHolidays() {
  try {
    const data = await deduplicatedGet('/attendance/holidays');
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.holidays)
      ? data.holidays
      : Array.isArray(data?.data)
      ? data.data
      : [];
    return rawList.map(backendHolidayToFrontend);
  } catch {
    return [];
  }
}

function backendHolidayToFrontend(h: any) {
  if (!h) return h;
  const d = h.date ? new Date(h.date) : new Date();
  const dayOfWeek = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = isNaN(d.getTime()) ? (h.date || '') : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return {
    id: h.id || `hol-${Date.now()}`,
    name: h.name || 'Holiday',
    date: h.date || '',
    formattedDate: formattedDate,
    day: dayOfWeek,
    dayOfWeek: dayOfWeek,
    type: h.type || 'Company Holiday',
    description: h.description || h.name || 'Official holiday',
    companyId: h.companyId || '',
    createdAt: h.createdAt || '',
  };
}

// 25. POST /attendance/holidays (Add holiday)
async function addHoliday(data: { date: string; name: string; type?: string; description?: string }) {
  try {
    const response = await http.post('/attendance/holidays', {
      date: data.date,
      name: data.name,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance/holidays');
    const result = response.data;
    return backendHolidayToFrontend(result?.holiday || result?.data || result);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Holiday could not be added.');
  }
}

// 26. DELETE /attendance/holidays/:holidayId (Delete holiday)
async function deleteHoliday(holidayId: string) {
  try {
    const response = await http.delete(`/attendance/holidays/${holidayId}`);
    clearApiCache('/attendance/holidays');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Holiday could not be deleted.');
  }
}

// Helper to normalize attendance records
function backendAttendanceToFrontend(a: any): AttendanceRecord {
  if (!a) return a;
  const userName = a.userName || (a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() : '') || a.employeeName || 'Staff Member';
  const punches = Array.isArray(a.punches) ? a.punches : [];
  let checkIn = a.checkIn || '';
  let checkOut = a.checkOut || '';

  if (punches.length > 0) {
    const inPunch = punches.find((p: any) => p.type === 'IN');
    const outPunch = [...punches].reverse().find((p: any) => p.type === 'OUT');
    if (inPunch && inPunch.punchedAt) {
      checkIn = new Date(inPunch.punchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (outPunch && outPunch.punchedAt) {
      checkOut = new Date(outPunch.punchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  } else {
    if (a.checkInAt) checkIn = new Date(a.checkInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (a.checkOutAt) checkOut = new Date(a.checkOutAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  let status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' = 'Present';
  const rawStatus = (a.status || '').toLowerCase();
  if (rawStatus.includes('absent')) status = 'Absent';
  else if (rawStatus.includes('late')) status = 'Late';
  else if (rawStatus.includes('half')) status = 'Half Day';
  else if (rawStatus.includes('leave')) status = 'On Leave';
  else status = 'Present';

  return {
    id: a.id || `att-${Date.now()}`,
    companyId: a.companyId || '',
    userId: a.userId || a.employeeId || '',
    employeeId: a.userId || a.employeeId || '',
    employeeName: userName,
    employeeCode: a.employeeCode || (a.user?.employeeCode) || 'EMP',
    departmentName: a.departmentName || (a.user?.departmentName) || 'General',
    date: String(a.workDate || a.date || '').slice(0, 10) || new Date().toISOString().split('T')[0],
    checkIn: checkIn && checkIn !== '--:--' ? checkIn : undefined,
    checkOut: checkOut && checkOut !== '--:--' ? checkOut : undefined,
    breakDurationMinutes: a.breakDurationMinutes || a.breakMinutes || 0,
    workingHours: a.workingHours || a.workHours || (a.totalMinutes ? Math.round((Number(a.totalMinutes) / 60) * 100) / 100 : 0),
    overtimeHours: a.overtimeHours || 0,
    status: status,
    remarks: a.note || a.remarks || '',
    createdAt: a.createdAt || new Date().toISOString(),
    punches,
    checkInAt: a.checkInAt || null,
    checkOutAt: a.checkOutAt || null,
    totalMinutes: Number(a.totalMinutes || 0),
    totalHours: a.totalHours || '',
    missingPunch: Boolean(a.missingPunch),
  };
}

// 27. GET /attendance (List attendance)
async function listAttendance(params?: {
  page?: number;
  limit?: number;
  date?: string;
  month?: number | string;
  year?: number | string;
  userId?: string;
}) {
  try {
    return await deduplicatedGet('/attendance', { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance records could not be loaded.');
  }
}

// 28. GET /attendance/:attendanceId (Get attendance)
async function getAttendanceRecord(attendanceId: string) {
  try {
    return await deduplicatedGet(`/attendance/${attendanceId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance record could not be loaded.');
  }
}

// 29. PUT /attendance/:attendanceId (Update attendance)
async function updateAttendance(attendanceId: string, data: { status?: string; workMode?: string; note?: string }) {
  try {
    const response = await http.put(`/attendance/${attendanceId}`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance record could not be updated.');
  }
}

// 30. POST /attendance/:attendanceId/correction (Correct attendance)
async function correctAttendance(attendanceId: string, data: {
  reason: string;
  status?: string;
  workMode?: string;
  punches?: Array<{ type: string; punchedAt: string }>;
}) {
  try {
    const response = await http.post(`/attendance/${attendanceId}/correction`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance correction could not be submitted.');
  }
}

/* ==========================================================================
   MODULE 5: LEAVE TYPES (4 ENDPOINTS)
   ========================================================================== */

function backendLeaveTypeToFrontend(lt: any) {
  if (!lt) return lt;
  const days = lt.daysPerYear !== undefined
    ? Number(lt.daysPerYear)
    : (lt.daysAllowed !== undefined
      ? Number(lt.daysAllowed)
      : (lt.quota !== undefined
        ? Number(lt.quota)
        : (lt.days !== undefined ? Number(lt.days) : 0)));

  const rawId = lt.id || lt._id || lt.slug || lt.leaveTypeId || lt.key || lt.code || '';

  return {
    id: rawId || `lt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    _id: lt._id || rawId,
    slug: lt.slug || (typeof lt.id === 'string' && !lt.id.startsWith('lt-') ? lt.id : ''),
    name: lt.name || lt.title || lt.leaveType || '',
    daysPerYear: days,
    daysAllowed: days,
    companyId: lt.companyId || '',
    createdAt: lt.createdAt || '',
    code: lt.code || '',
    color: lt.color || '',
    isPaid: lt.isPaid !== undefined ? Boolean(lt.isPaid) : true,
  };
}

// 31. POST /leave-types (Create leave type - Admin/HR only)
async function createLeaveType(dataOrName: { name: string; daysPerYear?: number } | string, maybeDays?: number) {
  let name = '';
  let daysPerYear: number | undefined = undefined;

  if (typeof dataOrName === 'string') {
    name = dataOrName;
    if (maybeDays !== undefined) daysPerYear = Number(maybeDays);
  } else if (dataOrName && typeof dataOrName === 'object') {
    name = dataOrName.name;
    if (dataOrName.daysPerYear !== undefined) {
      daysPerYear = Number(dataOrName.daysPerYear);
    } else if (maybeDays !== undefined) {
      daysPerYear = Number(maybeDays);
    }
  }

  if (!name || !name.trim()) {
    throw new Error('Leave type name is required.');
  }

  const payload: any = { name: name.trim() };
  if (daysPerYear !== undefined && !isNaN(daysPerYear)) {
    payload.daysPerYear = daysPerYear;
  }

  try {
    const response = await http.post(
      '/leave-types',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    clearApiCache('/leave-types');
    const res = response.data;
    return backendLeaveTypeToFrontend(res?.leaveType || res?.data || res);
  } catch (error) {
    const message = axios.isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error) : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave type could not be created.');
  }
}

// 32. GET /leave-types (List leave types - Admin/HR/Employee)
async function listLeaveTypes(params?: { companyId?: string }) {
  try {
    let data: any;
    if (params?.companyId) {
      try {
        data = await deduplicatedGet('/leave-types', { params: { companyId: params.companyId } });
      } catch (_) {}
    }
    if (!data || (Array.isArray(data) && data.length === 0) || (data?.data && Array.isArray(data.data) && data.data.length === 0)) {
      try {
        const fallbackData = await deduplicatedGet('/leave-types');
        if (
          fallbackData &&
          ((Array.isArray(fallbackData) && fallbackData.length > 0) ||
            (Array.isArray(fallbackData?.data) && fallbackData.data.length > 0) ||
            (Array.isArray(fallbackData?.leaveTypes) && fallbackData.leaveTypes.length > 0))
        ) {
          data = fallbackData;
        } else if (!data) {
          data = fallbackData;
        }
      } catch (_) {}
    }
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.leaveTypes)
      ? data.leaveTypes
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
      ? data.items
      : [];
    return rawList.map(backendLeaveTypeToFrontend);
  } catch (error) {
    console.error('Failed to list leave types:', error);
    return [];
  }
}

// 33. PATCH / PUT /leave-types/:leaveTypeId (Edit leave type - Admin/HR)
async function updateLeaveType(leaveTypeId: string, dataOrName: { name: string; daysPerYear?: number } | string, maybeDays?: number) {
  let name = '';
  let daysPerYear: number | undefined = undefined;

  if (typeof dataOrName === 'string') {
    name = dataOrName;
    if (maybeDays !== undefined) daysPerYear = Number(maybeDays);
  } else if (dataOrName && typeof dataOrName === 'object') {
    name = dataOrName.name;
    if (dataOrName.daysPerYear !== undefined) {
      daysPerYear = Number(dataOrName.daysPerYear);
    } else if (maybeDays !== undefined) {
      daysPerYear = Number(maybeDays);
    }
  }

  if (!name || !name.trim()) {
    throw new Error('Leave type name is required.');
  }

  const payload: any = { name: name.trim() };
  if (daysPerYear !== undefined && !isNaN(daysPerYear)) {
    payload.daysPerYear = daysPerYear;
  }

  try {
    let response;
    try {
      response = await http.patch(
        `/leave-types/${leaveTypeId}`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (patchErr: any) {
      if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
        response = await http.put(
          `/leave-types/${leaveTypeId}`,
          payload,
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } else {
        throw patchErr;
      }
    }
    clearApiCache('/leave-types');
    const res = response.data;
    return backendLeaveTypeToFrontend(res?.leaveType || res?.data || res);
  } catch (error) {
    const message = axios.isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error) : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave type could not be updated.');
  }
}

// 34. DELETE /leave-types/:leaveTypeId (Delete leave type - Admin/HR)
async function deleteLeaveType(leaveTypeId: string | { id?: string; _id?: string; slug?: string; code?: string }) {
  const targetId = typeof leaveTypeId === 'object' && leaveTypeId !== null
    ? (leaveTypeId.slug || leaveTypeId.id || leaveTypeId._id || leaveTypeId.code || '')
    : String(leaveTypeId || '').trim();

  if (!targetId) {
    throw new Error('Leave type ID is required.');
  }

  try {
    const response = await http.delete(`/leave-types/${encodeURIComponent(targetId)}`);
    clearApiCache('/leave-types');
    return response.data;
  } catch (error) {
    // If targetId failed and an alternative identifier is present, try fallback
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400) && typeof leaveTypeId === 'object') {
      const altId = leaveTypeId.id || leaveTypeId._id || leaveTypeId.slug || leaveTypeId.code;
      if (altId && altId !== targetId) {
        try {
          const altResponse = await http.delete(`/leave-types/${encodeURIComponent(altId)}`);
          clearApiCache('/leave-types');
          return altResponse.data;
        } catch (_) {}
      }
    }
    const message = axios.isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error) : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave type could not be deleted.');
  }
}

/* ==========================================================================
   MODULE 6: LEAVES (5 ENDPOINTS)
   ========================================================================== */

function backendLeaveToFrontend(l: any): LeaveRequest {
  if (!l) return l;
  const userName = l.userName || (l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : '') || l.employeeName || 'Staff Member';
  const daysList: Array<{ date: string; portion?: string }> = Array.isArray(l.days) ? l.days : [];
  let startDate = l.startDate || '';
  let endDate = l.endDate || '';
  let daysCount = typeof l.daysCount === 'number' ? l.daysCount : (daysList.length > 0 ? daysList.length : 1);

  const dayBreakdown: LeaveDayBreakdown[] = daysList.map((d: any) => {
    const portion = d.portion || (d.isHalfDay ? (d.halfDaySession || 'First Half') : 'Full Day');
    const pLower = String(portion).toLowerCase();
    const isFirstHalf = pLower.includes('first') || portion === 'SESSION_1' || portion === 'FIRST_HALF';
    const isSecondHalf = pLower.includes('second') || portion === 'SESSION_2' || portion === 'SECOND_HALF';
    const isHalf = isFirstHalf || isSecondHalf || pLower.includes('half');
    const session: LeaveDaySession = isFirstHalf ? 'FIRST_HALF' : isSecondHalf ? 'SECOND_HALF' : 'FULL_DAY';
    return {
      date: d.date,
      session,
      duration: isHalf ? 0.5 : 1,
    };
  });

  if (daysList.length > 0) {
    const dates = daysList.map((d: any) => d.date).filter(Boolean).sort();
    if (!startDate && dates.length > 0) startDate = dates[0];
    if (!endDate && dates.length > 0) endDate = dates[dates.length - 1];
    const computedCount = dayBreakdown.reduce((sum, item) => sum + item.duration, 0);
    if (computedCount > 0) daysCount = computedCount;
  }

  const hasHalfDays = dayBreakdown.some((d) => d.session !== 'FULL_DAY') || Boolean(l.isHalfDay);
  const nonFullSession = dayBreakdown.find((d) => d.session !== 'FULL_DAY')?.session;
  const firstHalfSession: 'FIRST_HALF' | 'SECOND_HALF' =
    nonFullSession === 'SECOND_HALF'
      ? 'SECOND_HALF'
      : nonFullSession === 'FIRST_HALF'
      ? 'FIRST_HALF'
      : l.halfDaySession === 'SECOND_HALF'
      ? 'SECOND_HALF'
      : 'FIRST_HALF';

  let status: 'Pending' | 'Approved' | 'Rejected' = 'Pending';
  const rawStatus = (l.status || '').toUpperCase();
  if (rawStatus === 'ACCEPTED' || rawStatus === 'APPROVED') status = 'Approved';
  else if (rawStatus === 'REJECTED') status = 'Rejected';
  else status = 'Pending';

  const adminResponse =
    l.response ||
    l.adminResponse ||
    l.comments ||
    l.rejectionReason ||
    l.rejectionRemarks ||
    l.approvalRemarks ||
    l.remarks ||
    '';

  return {
    id: l.id || `leave-${Date.now()}`,
    employeeId: l.userId || l.employeeId || '',
    employeeName: userName,
    departmentName: l.departmentName || (l.user?.departmentName) || 'General',
    leaveType: l.leaveType || 'Casual Leave',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || startDate || new Date().toISOString().split('T')[0],
    daysCount: Number(daysCount.toFixed(2)),
    isHalfDay: hasHalfDays,
    halfDaySession: hasHalfDays ? firstHalfSession : undefined,
    dayBreakdown: dayBreakdown.length > 0 ? dayBreakdown : undefined,
    days: daysList,
    reason: l.reason || '',
    status: status,
    appliedDate: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : (l.appliedDate || new Date().toISOString().split('T')[0]),
    comments: adminResponse,
    response: adminResponse,
  };
}

// 35. POST /leaves (Apply leave)
export interface ApplyLeaveInput {
  userId?: string;
  leaveType: string;
  reason: string;
  days?: Array<{ date: string; portion: string }>;
  startDate?: string;
  endDate?: string;
  isHalfDay?: boolean;
  halfDaySession?: string;
  dayBreakdown?: Array<{ date: string; session: string; duration?: number }>;
}

async function applyLeave(data: ApplyLeaveInput) {
  try {
    let daysArray = data.days;
    if (!daysArray || daysArray.length === 0) {
      if (Array.isArray(data.dayBreakdown) && data.dayBreakdown.length > 0) {
        daysArray = data.dayBreakdown.map((d) => {
          const s = String(d.session || '').toUpperCase();
          const isFirst = s === 'FIRST_HALF' || s === 'SESSION_1' || s.includes('FIRST');
          const isSecond = s === 'SECOND_HALF' || s === 'SESSION_2' || s.includes('SECOND');
          const portion = isFirst ? 'First Half' : isSecond ? 'Second Half' : 'Full Day';
          return {
            date: d.date,
            portion,
          };
        });
      } else if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        daysArray = [];
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          const dateStr = dt.toISOString().split('T')[0];
          let portion = 'Full Day';
          if (data.isHalfDay) {
            portion = data.halfDaySession === 'SECOND_HALF' ? 'Second Half' : 'First Half';
          }
          daysArray.push({
            date: dateStr,
            portion,
          });
        }
      } else if (data.startDate) {
        let portion = 'Full Day';
        if (data.isHalfDay) {
          portion = data.halfDaySession === 'SECOND_HALF' ? 'Second Half' : 'First Half';
        }
        daysArray = [{ date: data.startDate, portion }];
      } else {
        daysArray = [];
      }
    }

    const payload = {
      userId: data.userId || undefined,
      leaveType: data.leaveType,
      reason: data.reason,
      days: daysArray,
    };

    const response = await http.post('/leaves', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/leaves');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave application failed.');
  }
}

// 36. GET /leaves (List leave)
async function listLeaves(params?: { page?: number; limit?: number; userId?: string; status?: string }) {
  try {
    const data = await deduplicatedGet('/leaves', { params });
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.leaves)
      ? data.leaves
      : Array.isArray(data?.data)
      ? data.data
      : [];
    return rawList.map(backendLeaveToFrontend);
  } catch {
    return [];
  }
}

// 37. GET /leaves/:leaveId (Get leave)
async function getLeave(leaveId: string) {
  try {
    const res = await deduplicatedGet(`/leaves/${leaveId}`);
    return backendLeaveToFrontend(res);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave details could not be loaded.');
  }
}

// 38. POST /leaves/:leaveId/accept (Accept leave)
async function acceptLeave(leaveId: string, responseText?: string, ...rest: any[]) {
  try {
    const finalResponse =
      rest.length > 0 && typeof rest[rest.length - 1] === 'string'
        ? rest[rest.length - 1]
        : typeof responseText === 'string' && responseText.trim().length > 0
        ? responseText.trim()
        : 'Accepted. Take care.';

    const response = await http.post(`/leaves/${leaveId}/accept`, {
      response: finalResponse,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/leaves');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to accept leave.');
  }
}

// 39. POST /leaves/:leaveId/reject (Reject leave)
async function rejectLeave(leaveId: string, responseText?: string, ...rest: any[]) {
  try {
    const finalResponse =
      rest.length > 0 && typeof rest[rest.length - 1] === 'string'
        ? rest[rest.length - 1]
        : typeof responseText === 'string' && responseText.trim().length > 0
        ? responseText.trim()
        : 'Rejected.';

    const response = await http.post(`/leaves/${leaveId}/reject`, {
      response: finalResponse,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/leaves');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to reject leave.');
  }
}

/* ==========================================================================
   MODULE 7: HEALTH (1 ENDPOINT)
   ========================================================================== */

// 40. GET /health
async function getHealth() {
  try {
    return await deduplicatedGet('/health');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Health check failed.');
  }
}

/* ==========================================================================
   MODULE 8: SYSTEM (1 ENDPOINT)
   ========================================================================== */

// 41. GET / (API Root)
async function getApiRoot() {
  try {
    return await deduplicatedGet('/');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'API root unavailable.');
  }
}

/* ==========================================================================
   MODULE 9: DEPARTMENTS (4 ENDPOINTS)
   ========================================================================== */

// 42. POST /departments (Create department)
async function createDepartment(payload: { name: string; [key: string]: any }) {
  try {
    const res = await http.post('/departments', { name: payload.name?.trim() }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/departments');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to create department.');
  }
}

// 43. GET /departments (List departments)
async function listDepartments() {
  try {
    const res = await deduplicatedGet('/departments');
    const raw = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.departments)
      ? res.departments
      : Array.isArray(res?.items)
      ? res.items
      : [];
    return raw.map((d: any) => ({
      ...d,
      id: d.id || d._id,
      name: d.name || 'Unnamed Department',
      code: d.code || (d.name ? d.name.slice(0, 3).toUpperCase() : 'DEP'),
      employeeCount: typeof d.employeeCount === 'number' ? d.employeeCount : (d._count?.employees || d.employees?.length || 0),
      headName: d.headName || d.head?.name || '',
      description: d.description || '',
      createdAt: d.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list departments.');
  }
}

// 44. PATCH /departments/:departmentId (Edit department)
async function editDepartment(departmentId: string, payload: { name: string; [key: string]: any }) {
  try {
    const res = await http.patch(`/departments/${departmentId}`, { name: payload.name?.trim() }, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/departments');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update department.');
  }
}

// 45. DELETE /departments/:departmentId (Delete department)
async function deleteDepartment(departmentId: string) {
  try {
    const res = await http.delete(`/departments/${departmentId}`);
    clearApiCache('/departments');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to delete department.');
  }
}

/* ==========================================================================
   MODULE 10: TEAMS (8 ENDPOINTS)
   ========================================================================== */

// 46. POST /teams (Create team)
async function createTeam(payload: { name: string; departmentId: string }) {
  try {
    const res = await http.post('/teams', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/teams');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to create team.');
  }
}

async function listChatGroups() {
  try {
    const res = await http.get('/chat/groups');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load groups.');
  }
}

async function createChatGroup(payload: { name: string; memberIds: string[] }) {
  try {
    const res = await http.post('/chat/groups', payload, { headers: { 'Content-Type': 'application/json' } });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to create group.');
  }
}

async function addChatGroupMember(groupId: string, userId: string) {
  try {
    const res = await http.post(`/chat/groups/${groupId}/members`, { userId }, { headers: { 'Content-Type': 'application/json' } });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to add member.');
  }
}

async function listChatGroupMembers(groupId: string) {
  try {
    const res = await http.get(`/chat/groups/${groupId}/members`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load group members.');
  }
}

async function removeChatGroupMember(groupId: string, userId: string) {
  try {
    const res = await http.delete(`/chat/groups/${groupId}/members/${userId}`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to remove member.');
  }
}

async function leaveChatGroup(groupId: string) {
  try {
    const res = await http.post(`/chat/groups/${groupId}/leave`, {}, { headers: { 'Content-Type': 'application/json' } });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to leave group.');
  }
}

async function deleteChatGroup(groupId: string) {
  try {
    const res = await http.delete(`/chat/groups/${groupId}`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to delete group.');
  }
}

async function listGroupChat(groupId: string) {
  try {
    const res = await http.get(`/chat/groups/${groupId}/messages`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load group chat.');
  }
}

async function sendGroupChat(groupId: string, payload: { text: string }) {
  try {
    const res = await http.post(`/chat/groups/${groupId}/messages`, payload, { headers: { 'Content-Type': 'application/json' } });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to send group message.');
  }
}

async function getResignations() {
  try {
    const res = await http.get('/resignations');
    const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
    return rows.filter((row: any) => row && row.id);
  } catch (error) {
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    const message = data && typeof data === 'object' ? data.message : undefined;
    const text = Array.isArray(message) ? message.join(' ') : message || (axios.isAxiosError(error) ? error.message : '');
    throw new Error(text || 'Failed to load resignations.');
  }
}

async function submitResignation(payload: { employeeId?: string; reason: string; noticePeriodDays?: number }) {
  try {
    const res = await http.post('/resignations', payload, { headers: { 'Content-Type': 'application/json' } });
    return res.data?.resignation || res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Could not file resignation.');
  }
}

async function assignResignationNotice(id: string, noticePeriodDays: number) {
  try {
    const res = await http.patch(`/resignations/${id}/notice`, { noticePeriodDays }, { headers: { 'Content-Type': 'application/json' } });
    return res.data?.resignation || res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Could not assign notice period.');
  }
}

async function approveResignation(id: string, actorName?: string) {
  try {
    const res = await http.post(`/resignations/${id}/approve`, { actorName }, { headers: { 'Content-Type': 'application/json' } });
    return res.data?.resignation || res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Could not approve resignation.');
  }
}

async function updateResignationClearance(id: string, payload: { clearance: Record<string, boolean>; actorName?: string }) {
  try {
    const res = await http.patch(`/resignations/${id}/clearance`, payload, { headers: { 'Content-Type': 'application/json' } });
    return res.data?.resignation || res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Could not update clearance.');
  }
}

async function createAnnouncement(payload: {
  title: string;
  content: string;
  priority?: string;
  targetAudience?: string;
  targetEmployeeId?: string;
  departmentName?: string;
}) {
  try {
    const res = await http.post('/notices', {
      title: payload.title,
      content: payload.content,
      priority: payload.priority,
      targetAudience: payload.targetAudience,
      targetEmployeeId: payload.targetEmployeeId,
      departmentName: payload.departmentName,
    }, { headers: { 'Content-Type': 'application/json' } });
    return res.data?.notice || res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Could not publish notice.');
  }
}

async function getAnnouncements(_employeeId?: string) {
  try {
    const res = await http.get('/notices/board');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load notices.');
  }
}

async function deleteAnnouncement(id: string) {
  try {
    const res = await http.delete(`/notices/board/${id}`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Could not delete notice.');
  }
}

async function listNotices() {
  try {
    const res = await http.get('/notices');
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return rows.map((row: any) => ({
      id: String(row.id || ''),
      kind: row.kind === 'leave' || row.kind === 'task' ? row.kind : 'message',
      title: String(row.title || ''),
      message: String(row.message || ''),
      module: String(row.module || ''),
      createdAt: String(row.createdAt || ''),
    }));
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load notices.');
  }
}

async function dismissNotice(id: string) {
  try {
    const res = await http.delete(`/notices/${id}`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to clear notice.');
  }
}

async function clearNotices() {
  try {
    const res = await http.delete('/notices');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to clear notices.');
  }
}

async function listDirectChats() {
  try {
    const res = await http.get('/chat/direct');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load chats.');
  }
}

async function listDirectChat(userId: string) {
  try {
    const res = await http.get(`/chat/direct/${userId}`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load messages.');
  }
}

async function sendDirectChat(userId: string, payload: { text: string }) {
  try {
    const res = await http.post(`/chat/direct/${userId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to send message.');
  }
}

async function listStaffThreads() {
  try {
    const res = await http.get('/chat/staff');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load chats.');
  }
}

async function listStaffChat(employeeId: string) {
  try {
    const res = await http.get(`/chat/staff/${employeeId}`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load messages.');
  }
}

async function sendStaffChat(employeeId: string, payload: { text: string }) {
  try {
    const res = await http.post(`/chat/staff/${employeeId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/chat/staff');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to send message.');
  }
}

// 47b. GET /teams/mine (Teams this user can chat in)
async function listMyTeams() {
  try {
    return await deduplicatedGet('/teams/mine');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load your teams.');
  }
}

// 47. GET /teams (List teams)
async function listTeams() {
  try {
    return await deduplicatedGet('/teams');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list teams.');
  }
}

// 48. POST /teams/:teamId/leader (Set team leader)
async function setTeamLeader(teamId: string, payload: { userId: string }) {
  try {
    const res = await http.post(`/teams/${teamId}/leader`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/teams');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to set team leader.');
  }
}

// 49. POST /teams/:teamId/members (Add team member)
async function addTeamMember(teamId: string, payload: { userId: string }) {
  try {
    const res = await http.post(`/teams/${teamId}/members`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/teams');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to add team member.');
  }
}

// 50. DELETE /teams/:teamId/members/:employeeId (Remove team member)
async function removeTeamMember(teamId: string, employeeId: string) {
  try {
    const res = await http.delete(`/teams/${teamId}/members/${employeeId}`);
    clearApiCache('/teams');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to remove team member.');
  }
}

// 51. GET /teams/:teamId (Get team)
async function getTeam(teamId: string) {
  try {
    return await deduplicatedGet(`/teams/${teamId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get team.');
  }
}

// 52. PATCH /teams/:teamId (Edit team)
async function editTeam(teamId: string, payload: { name?: string; departmentId?: string }) {
  try {
    const res = await http.patch(`/teams/${teamId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/teams');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update team.');
  }
}

// 53b. GET /teams/:teamId/chat (List team chat)
async function listTeamChat(teamId: string, params?: { page?: number; limit?: number }) {
  try {
    return await deduplicatedGet(`/teams/${teamId}/chat`, { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load team chat.');
  }
}

// 53c. POST /teams/:teamId/chat (Send team chat)
async function sendTeamChat(teamId: string, payload: { text: string }) {
  try {
    const res = await http.post(`/teams/${teamId}/chat`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache(`/teams/${teamId}/chat`);
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to send team chat.');
  }
}

// 53. DELETE /teams/:teamId (Delete team)
async function deleteTeam(teamId: string) {
  try {
    const res = await http.delete(`/teams/${teamId}`);
    clearApiCache('/teams');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to delete team.');
  }
}

/* ==========================================================================
   MODULE 11: TASKS (5 ENDPOINTS)
   ========================================================================== */

function toApiTaskStatus(status?: string) {
  const text = String(status || '').trim().toLowerCase().replace(/_/g, ' ');
  if (!text) return undefined;
  if (text === 'todo' || text === 'to do' || text === 'pending') return 'Pending';
  if (text === 'in progress' || text === 'in review') return 'In Progress';
  if (text === 'completed' || text === 'done') return 'Done';
  return status;
}

function toApiTaskPriority(priority?: string) {
  const text = String(priority || '').trim().toLowerCase();
  if (!text) return undefined;
  if (text === 'low') return 'Low';
  if (text === 'medium') return 'Medium';
  if (text === 'high' || text === 'urgent') return 'High';
  return priority;
}

function fromApiTask(task: any) {
  if (!task || typeof task !== 'object') return task;
  const status = String(task.status || '');
  const priority = String(task.priority || '');
  return {
    ...task,
    status: status === 'Pending' ? 'TODO' : status === 'In Progress' ? 'IN_PROGRESS' : status === 'Done' ? 'COMPLETED' : status,
    priority: priority === 'Low' ? 'LOW' : priority === 'Medium' ? 'MEDIUM' : priority === 'High' ? 'HIGH' : priority,
  };
}

function taskPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    status: payload.status == null ? undefined : toApiTaskStatus(String(payload.status)),
    priority: payload.priority == null ? undefined : toApiTaskPriority(String(payload.priority)),
  };
}

// 54. POST /tasks (Create task)
async function createTask(payload: {
  teamId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  dueDate?: string;
}) {
  try {
    const res = await http.post('/tasks', taskPayload(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/tasks');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to create task.');
  }
}

// 55. GET /tasks (List tasks)
async function listTasks(params?: any) {
  try {
    const res = await deduplicatedGet('/tasks', { params });
    if (Array.isArray(res)) return res.map(fromApiTask);
    if (Array.isArray(res?.data)) return { ...res, data: res.data.map(fromApiTask) };
    return res;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list tasks.');
  }
}

// 56. GET /tasks/:taskId (Get task)
async function getTask(taskId: string) {
  try {
    return fromApiTask(await deduplicatedGet(`/tasks/${taskId}`));
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get task.');
  }
}

// 57. PATCH /tasks/:taskId (Edit task)
async function editTask(taskId: string, payload: any) {
  try {
    const res = await http.patch(`/tasks/${taskId}`, taskPayload(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/tasks');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update task.');
  }
}

// 58. DELETE /tasks/:taskId (Delete task)
async function deleteTask(taskId: string) {
  try {
    const res = await http.delete(`/tasks/${taskId}`);
    clearApiCache('/tasks');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to delete task.');
  }
}

/* ==========================================================================
   MODULE 12: OPENINGS (7 ENDPOINTS)
   ========================================================================== */

// 59. POST /openings (Create job opening)
async function createOpening(payload: {
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  employmentType?: string;
  vacancy?: number;
}) {
  try {
    const res = await http.post('/openings', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/openings');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to create job opening.');
  }
}

// 60. GET /openings (List job openings)
async function listOpenings() {
  try {
    return await deduplicatedGet('/openings');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list job openings.');
  }
}

// 61. GET /openings/:openingId/public (Public job opening)
async function getPublicOpening(openingId: string) {
  try {
    return await deduplicatedGet(`/openings/${openingId}/public`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get public job opening.');
  }
}

// 62. POST /openings/:openingId/apply (Apply for job)
async function applyForOpening(openingId: string, data: FormData | any) {
  try {
    const res = await http.post(`/openings/${openingId}/apply`, data);
    clearApiCache('/applications');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to submit application.');
  }
}

// 63. GET /openings/:openingId (Get job opening)
async function getOpening(openingId: string) {
  try {
    return await deduplicatedGet(`/openings/${openingId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get job opening.');
  }
}

// 64. PATCH /openings/:openingId (Edit job opening)
async function editOpening(openingId: string, payload: any) {
  try {
    const res = await http.patch(`/openings/${openingId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/openings');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update job opening.');
  }
}

// 65. DELETE /openings/:openingId (Delete job opening)
async function deleteOpening(openingId: string) {
  try {
    const res = await http.delete(`/openings/${openingId}`);
    clearApiCache('/openings');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to delete job opening.');
  }
}

/* ==========================================================================
   MODULE 13: APPLICATIONS (8 ENDPOINTS)
   ========================================================================== */

// 66. GET /applications/verify (Verify offer email)
async function verifyOfferEmail(token?: string) {
  try {
    return await deduplicatedGet('/applications/verify', { params: token ? { token } : undefined });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to verify offer.');
  }
}

// 67. GET /applications (List applications)
async function listApplications(params?: any) {
  try {
    return await deduplicatedGet('/applications', { params });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list applications.');
  }
}

// 68. GET /applications/selected (List selected candidates)
async function listSelectedCandidates() {
  try {
    return await deduplicatedGet('/applications/selected');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list selected candidates.');
  }
}

// 69. PATCH /applications/:applicationId/status (Update application status)
async function updateApplicationStatus(applicationId: string, payload: { status: string; interviewerId?: string }) {
  try {
    const res = await http.patch(`/applications/${applicationId}/status`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/applications');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update application status.');
  }
}

// 70. GET /applications/:applicationId/offer (Offer letter form)
async function getApplicationOfferForm(applicationId: string) {
  try {
    return await deduplicatedGet(`/applications/${applicationId}/offer`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load offer form.');
  }
}

// 71. GET /applications/:applicationId/employee (Add employee form)
async function getApplicationEmployeeForm(applicationId: string) {
  try {
    return await deduplicatedGet(`/applications/${applicationId}/employee`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to load employee onboarding form.');
  }
}

// 72. POST /applications/:applicationId/offer (Send offer letter)
async function sendOfferLetter(applicationId: string, payload: {
  designation: string;
  joiningDate: string;
  location?: string;
  employmentType?: string;
  reportingTo?: string;
  basicSalary?: number;
  hra?: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
}) {
  try {
    const res = await http.post(`/applications/${applicationId}/offer`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/applications');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to send offer letter.');
  }
}

// 73. GET /applications/:applicationId (Get application)
async function getApplication(applicationId: string) {
  try {
    return await deduplicatedGet(`/applications/${applicationId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get application.');
  }
}

/* ==========================================================================
   MODULE 14: PAYROLL (7 ENDPOINTS)
   ========================================================================== */

// 74. PUT /payroll/salaries/:employeeId (Save salary)
async function saveSalary(employeeId: string, payload: {
  basicSalary: number;
  hra?: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
  overtimePerHour?: number;
  effectiveFrom?: string;
}) {
  try {
    const res = await http.put(`/payroll/salaries/${employeeId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/payroll');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to save salary.');
  }
}

// 75. GET /payroll/salaries (List salaries)
async function listSalaries() {
  try {
    return await deduplicatedGet('/payroll/salaries');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list salaries.');
  }
}

// 76. GET /payroll/salaries/:employeeId (Salary history)
async function getSalaryHistory(employeeId: string) {
  try {
    return await deduplicatedGet(`/payroll/salaries/${employeeId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get salary history.');
  }
}

// 77. POST /payroll/runs (Generate payroll)
async function generatePayroll(payload: { year: number; month: number } | string) {
  try {
    const body = typeof payload === 'string'
      ? { year: parseInt(payload.split('-')[0]), month: parseInt(payload.split('-')[1]) }
      : payload;
    const res = await http.post('/payroll/runs', body, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/payroll');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to generate payroll.');
  }
}

// 78. GET /payroll/payslips (List payslips)
async function listPayslips(mine = false) {
  try {
    return await deduplicatedGet('/payroll/payslips', mine ? { params: { mine: 1 } } : undefined);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list payslips.');
  }
}

// 79. POST /payroll/payslips/:payslipId/paid (Mark payslip paid)
async function markPayslipPaid(payslipId: string) {
  try {
    const res = await http.post(`/payroll/payslips/${payslipId}/paid`);
    clearApiCache('/payroll');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to mark payslip as paid.');
  }
}

async function saveBankDetails(payload: { bankName: string; accountHolderName: string; accountNumber: string; ifsc: string }) {
  try {
    const response = await http.post('/payroll/bank', payload, { headers: { 'Content-Type': 'application/json' } });
    clearApiCache('/payroll/bank');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Bank details could not be saved.');
  }
}

async function getBankDetails() {
  try {
    return await deduplicatedGet('/payroll/bank');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Bank details could not be loaded.');
  }
}

async function saveBankFormDate(date: string) {
  try {
    const response = await http.put('/payroll/bank-date', { date }, { headers: { 'Content-Type': 'application/json' } });
    clearApiCache('/payroll/bank');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Bank form date could not be saved.');
  }
}

async function downloadPayslipFile(id: string) {
  try {
    const response = await http.get(`/payroll/payslips/${id}/pdf`, { responseType: 'blob' });
    const blob = response.data as Blob;
    if (blob.type.includes('json')) {
      const text = await blob.text();
      let message = 'Salary slip PDF could not be downloaded.';
      try {
        const body = JSON.parse(text);
        message = Array.isArray(body.message) ? body.message.join(' ') : body.message || message;
      } catch {
        message = text || message;
      }
      throw new Error(message);
    }
    const header = String(response.headers['content-disposition'] || '');
    const match = /filename="([^"]+)"/.exec(header);
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = match?.[1] || `salary-slip-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error && error.message && !axios.isAxiosError(error)) throw error;
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Salary slip PDF could not be downloaded.');
  }
}
async function getPayslip(payslipId: string) {
  try {
    return await deduplicatedGet(`/payroll/payslips/${payslipId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get payslip.');
  }
}

/* ==========================================================================
   MODULE 15: PLANS (5 ENDPOINTS)
   ========================================================================== */

// 81. POST /plans (Create plan)
async function createPlan(payload: {
  name: string;
  price: number;
  durationMonths: number;
  description?: string;
}) {
  try {
    const res = await http.post('/plans', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/plans');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to create plan.');
  }
}

// 82. GET /plans (List plans)
async function listPlans() {
  try {
    return await deduplicatedGet('/plans');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list plans.');
  }
}

// 83. POST /plans/:planId/sell (Sell plan)
async function sellPlan(planId: string, payload: { companyId: string }) {
  try {
    const res = await http.post(`/plans/${planId}/sell`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/plans');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to sell plan.');
  }
}

// 84. PATCH /plans/:planId (Edit plan)
async function editPlan(planId: string, payload: any) {
  try {
    const res = await http.patch(`/plans/${planId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/plans');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update plan.');
  }
}

// 85. DELETE /plans/:planId (Delete plan)
async function deletePlan(planId: string) {
  try {
    const res = await http.delete(`/plans/${planId}`);
    clearApiCache('/plans');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to delete plan.');
  }
}

/* ==========================================================================
   MODULE 16: PREMIUM (7 ENDPOINTS)
   ========================================================================== */

// 86. GET /premium (Company premium)
async function getCompanyPremium() {
  try {
    return await deduplicatedGet('/premium');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get company premium status.');
  }
}

// 87. GET /premium/plans (Plans for purchase)
async function getPremiumPlans() {
  try {
    return await deduplicatedGet('/premium/plans');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get premium plans.');
  }
}

// 88. POST /premium/checkout (Start plan purchase)
async function startPlanCheckout(payload: { planId: string }) {
  try {
    const res = await http.post('/premium/checkout', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to start plan purchase.');
  }
}

// 89. POST /premium/verify (Verify plan payment)
async function verifyPlanPayment(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  try {
    const res = await http.post('/premium/verify', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/premium');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to verify plan payment.');
  }
}

// 90. GET /premium/orders (List premium orders)
async function listPremiumOrders() {
  try {
    return await deduplicatedGet('/premium/orders');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list premium orders.');
  }
}

// 91. POST /premium/orders (Place premium order)
async function placePremiumOrder(payload: { planId: string }) {
  try {
    const res = await http.post('/premium/orders', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/premium');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to place premium order.');
  }
}

// 92. PATCH /premium/orders/:premiumOrderId (Update premium order)
async function updatePremiumOrder(premiumOrderId: string, payload: { status: string }) {
  try {
    const res = await http.patch(`/premium/orders/${premiumOrderId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/premium');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update premium order.');
  }
}

/* ==========================================================================
   MODULE 17: SUPPORT (4 ENDPOINTS)
   ========================================================================== */

// 93. POST /support (Send demo or contact request)
async function sendSupportRequest(payload: {
  kind?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  message: string;
}) {
  try {
    const res = await http.post('/support', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/support');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to submit support request.');
  }
}

// 94. GET /support (List support requests)
async function listSupportRequests() {
  try {
    return await deduplicatedGet('/support');
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to list support requests.');
  }
}

// 95. GET /support/:supportId (Get support request)
async function getSupportRequest(supportId: string) {
  try {
    return await deduplicatedGet(`/support/${supportId}`);
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to get support request.');
  }
}

// 96. PATCH /support/:supportId (Update support request)
async function updateSupportRequest(supportId: string, payload: { status: string }) {
  try {
    const res = await http.patch(`/support/${supportId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/support');
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Failed to update support request.');
  }
}

/* ==========================================================================
   INTEGRATION ALIASES & HELPERS
   ========================================================================== */

function userToEmployee(u: any): any {
  if (!u) return u;
  return {
    ...u,
    employeeCode: u.employeeCode || `EMP-${(u.id || '').slice(0, 6).toUpperCase()}`,
    companyId: u.companyId || '',
    companyName: u.companyName || '',
    role: u.role || 'EMPLOYEE',
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    email: u.email || '',
    phone: u.phone || '',
    avatarUrl: u.avatarUrl || '',
    gender: u.gender || 'Other',
    status: u.status === 'Inactive' ? 'Inactive' : 'Active',
    departmentId: u.departmentId || '',
    departmentName: u.departmentName || 'General',
    designationId: u.designationId || '',
    designationTitle: u.designationTitle || u.role || 'Staff',
  };
}

function canListUsers() {
  const role = String(getCookie('hrms_current_role') || '').toUpperCase();
  return ['ADMIN', 'HR', 'MANAGER', 'SUPER_ADMIN', 'HR_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(role);
}

async function getEmployees() {
  if (!canListUsers()) return [];
  try {
    if (isEmployeeSession()) {
      return [];
    }
    const res = await listUsers({ limit: 100 });
    const users = Array.isArray(res?.data) ? res.data : Array.isArray(res?.users) ? res.users : Array.isArray(res) ? res : [];
    return users.map(userToEmployee);
  } catch {
    return [];
  }
}

async function createEmployee(data: any) {
  return createUser({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || undefined,
    gender: data.gender || undefined,
    address: data.address || undefined,
    role: data.role || 'EMPLOYEE',
    status: data.status || 'Active',
    companyId: data.companyId || undefined,
    password: data.password || undefined,
    salary: data.salary || undefined,
  });
}

async function deleteEmployee(id: string) {
  try {
    const response = await http.delete(`/users/${id}`);
    clearApiCache('/users');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Employee could not be deleted.');
  }
}

const deleteUser = deleteEmployee;

async function deactivateEmployee(id: string) {
  try {
    const response = await http.patch(`/users/${id}`, { status: 'Inactive' });
    clearApiCache('/users');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Employee could not be deactivated.');
  }
}

async function activateEmployee(id: string) {
  try {
    const response = await http.patch(`/users/${id}`, { status: 'Active' });
    clearApiCache('/users');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Employee could not be activated.');
  }
}

async function getNextEmployeeCode() {
  return `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function uploadProfilePhoto(file: File) {
  try {
    const form = new FormData();
    form.append('photo', file);
    const response = await http.post('/users/upload-photo', form);
    clearApiCache('/users');
    return response.data;
  } catch {
    return { url: '' };
  }
}

async function getDocuments(userId?: string) {
  try {
    const res = await listDocuments(userId ? { userId } : undefined);
    const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res?.documents) ? res.documents : Array.isArray(res) ? res : [];
    return raw.map(backendDocToEmployeeDocument).filter(Boolean);
  } catch {
    return [];
  }
}

async function uploadDocumentFile(data: FormData | { title: string; file: File; userId?: string; companyId?: string }) {
  return createDocument(data);
}

async function verifyDocument(id: string, status: string) {
  return updateDocument(id, { status });
}

// Attendance aliases mapping directly to collection endpoints
const clockIn = (data?: { workMode?: string; note?: string }) => clock({ flag: 'clock-in', ...data });
const checkIn = clockIn;
const clockOut = (data?: { workMode?: string; note?: string }) => clock({ flag: 'clock-out', ...data });
const checkOut = clockOut;
const startWork = clockIn;
const stopWork = clockOut;
const startBreak = (data?: { note?: string }) => clock({ flag: 'break-in', note: data?.note });
const endBreak = (data?: { note?: string }) => clock({ flag: 'break-out', note: data?.note });
const resumeBreak = endBreak;
const toggleBreak = startBreak;
const getWorkStatus = getAttendanceLogic;

async function getWorkHistory(page = 1, limit = 100) {
  try {
    return await deduplicatedGet('/attendance', { params: { page, limit } });
  } catch {
    return { sessions: [] };
  }
}

async function getAttendance(params?: any) {
  try {
    const res = await listAttendance(params);
    const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.attendance) ? res.attendance : [];
    return rawList.map(backendAttendanceToFrontend);
  } catch {
    return [];
  }
}

// Leave aliases
const getLeaves = listLeaves;
const getLeaveTypes = listLeaveTypes;
const approveLeave = (leaveId: string, ...args: any[]) =>
  acceptLeave(leaveId, ...args);

// Attendance settings & holidays aliases
const getSettings = getAttendanceSettings;
const updateSettings = saveAttendanceSettings;
const getHolidays = listHolidays;
const createHoliday = addHoliday;

// Regularization mapping to correctAttendance or updateAttendance
async function regularizeAttendance(payload: {
  id?: string;
  attendanceId?: string;
  employeeId?: string;
  date?: string;
  status?: string;
  remarks?: string;
  workMode?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const attId = payload.attendanceId || payload.id;
  if (attId) {
    return correctAttendance(attId, {
      reason: payload.remarks || 'Attendance Regularization',
      status: payload.status || 'Present',
      workMode: payload.workMode || 'Office',
      punches: [
        ...(payload.checkIn ? [{ type: 'IN', punchedAt: `${payload.date || new Date().toISOString().split('T')[0]}T${payload.checkIn}:00` }] : []),
        ...(payload.checkOut ? [{ type: 'OUT', punchedAt: `${payload.date || new Date().toISOString().split('T')[0]}T${payload.checkOut}:00` }] : []),
      ],
    });
  }
  return { success: true };
}

async function getMe() {
  return getProfile();
}

async function getMyCompany() {
  try {
    const profile = await getProfile();
    return profile?.company || null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   CENTRAL EXPORTED PROXY
   ========================================================================== */

export const api = new Proxy({
  // Users (10)
  forgotPassword,
  createUser,
  login,
  getResetPasswordForm,
  resetPassword,
  logout,
  refreshToken,
  listUsers,
  getProfile,
  getUser,
  getMe,
  getMyCompany,
  getEmployees,
  createEmployee,
  deleteEmployee,
  deleteUser,
  deactivateEmployee,
  activateEmployee,
  getNextEmployeeCode,
  uploadProfilePhoto,

  // Companies (1)
  registerCompany,

  // Documents (5)
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  uploadDocumentFile,
  verifyDocument,

  // Attendance (14)
  clock,
  clockIn,
  checkIn,
  clockOut,
  checkOut,
  startWork,
  stopWork,
  toggleBreak,
  startBreak,
  endBreak,
  resumeBreak,
  getAttendanceLogic,
  getWorkStatus,
  getAttendanceCalendar,
  getAttendanceSummary,
  getAttendanceSettings,
  saveAttendanceSettings,
  getSettings,
  updateSettings,
  getWeekendRules,
  saveWeekendRules,
  listHolidays,
  getHolidays,
  addHoliday,
  createHoliday,
  deleteHoliday,
  listAttendance,
  getAttendance,
  getAttendanceRecord,
  updateAttendance,
  correctAttendance,
  regularizeAttendance,
  getWorkHistory,

  // Leave Types (4)
  createLeaveType,
  listLeaveTypes,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,

  // Leaves (5)
  applyLeave,
  listLeaves,
  getLeaves,
  getLeave,
  acceptLeave,
  approveLeave,
  rejectLeave,

  // Health (1)
  getHealth,

  // System (1)
  getApiRoot,

  // Departments (4)
  createDepartment,
  listDepartments,
  getDepartments: listDepartments,
  editDepartment,
  updateDepartment: editDepartment,
  deleteDepartment,

  // Teams (8)
  createTeam,
  listTeams,
  getTeams: listTeams,
  listMyTeams,
  listChatGroups,
  createChatGroup,
  addChatGroupMember,
  listChatGroupMembers,
  removeChatGroupMember,
  leaveChatGroup,
  deleteChatGroup,
  listGroupChat,
  sendGroupChat,
  listDirectChats,
  getResignations,
  submitResignation,
  assignResignationNotice,
  approveResignation,
  updateResignationClearance,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  listNotices,
  dismissNotice,
  clearNotices,
  listDirectChat,
  sendDirectChat,
  listStaffThreads,
  listStaffChat,
  sendStaffChat,
  setTeamLeader,
  addTeamMember,
  removeTeamMember,
  getTeam,
  listTeamChat,
  getTeamChat: listTeamChat,
  sendTeamChat,
  editTeam,
  updateTeam: editTeam,
  deleteTeam,

  // Tasks (5)
  createTask,
  listTasks,
  getTasks: listTasks,
  getTask,
  editTask,
  updateTask: editTask,
  deleteTask,

  // Openings (7)
  createOpening,
  createJob: createOpening,
  listOpenings,
  getOpenings: listOpenings,
  getJobs: listOpenings,
  getPublicOpening,
  applyForOpening,
  getOpening,
  editOpening,
  updateOpening: editOpening,
  deleteOpening,

  // Applications (8)
  verifyOfferEmail,
  listApplications,
  getApplications: listApplications,
  getCandidates: listApplications,
  listSelectedCandidates,
  updateApplicationStatus,
  updateCandidateStatus: (id: string, status: any) => updateApplicationStatus(id, typeof status === 'string' ? { status } : status),
  getApplicationOfferForm,
  getApplicationEmployeeForm,
  sendOfferLetter,
  getApplication,

  // Payroll (7)
  saveSalary,
  listSalaries,
  getSalaries: listSalaries,
  getSalaryHistory,
  generatePayroll,
  listPayslips,
  getPayslips: listPayslips,
  getPayroll: listPayslips,
  markPayslipPaid,
  updatePayrollStatus: (id: string, _payload?: any) => markPayslipPaid(id),
  getPayslip,
  downloadPayslipFile,
  getBankDetails,
  saveBankDetails,
  saveBankFormDate,

  // Plans (5)
  createPlan,
  listPlans,
  getPlans: listPlans,
  sellPlan,
  editPlan,
  updatePlan: editPlan,
  deletePlan,

  // Premium (7)
  getCompanyPremium,
  getPremium: getCompanyPremium,
  getPremiumPlans,
  startPlanCheckout,
  verifyPlanPayment,
  listPremiumOrders,
  getPremiumOrders: listPremiumOrders,
  placePremiumOrder,
  updatePremiumOrder,

  // Support (4)
  sendSupportRequest,
  createSupportRequest: sendSupportRequest,
  listSupportRequests,
  getSupportRequests: listSupportRequests,
  getSupportRequest,
  updateSupportRequest,
} as Record<string, (...args: any[]) => Promise<any>>, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = notConnected;
    return target[prop];
  },
});
