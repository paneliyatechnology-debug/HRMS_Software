import axios from 'axios';
import { getApiBaseUrl } from './config';
import { getCookie, setCookie } from './cookies';
import { LeaveRequest, AttendanceRecord } from '../types/hrms';

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
    const token = getCookie('hrms_auth_token') || getCookie('bearerToken') || getCookie('accessToken');
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
}

async function createUser(data: CreateUserInput) {
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

// 17. POST /attendance/clock (Clock in or out)
async function clock(data?: { workMode?: string; note?: string }) {
  try {
    const payload = {
      workMode: data?.workMode || 'Office',
      note: data?.note || '',
    };
    const response = await http.post('/attendance/clock', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance clock action failed.');
  }
}

// 18. POST /attendance/break (Break in or out)
async function toggleBreak(data?: { note?: string }) {
  try {
    const payload = {
      note: data?.note || 'Break',
    };
    const response = await http.post('/attendance/break', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    clearApiCache('/attendance');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Attendance break action failed.');
  }
}

// 19. GET /attendance/logic (Attendance logic)
async function getAttendanceLogic() {
  try {
    return await deduplicatedGet('/attendance/logic');
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
    employeeId: a.userId || a.employeeId || '',
    employeeName: userName,
    employeeCode: a.employeeCode || (a.user?.employeeCode) || 'EMP',
    departmentName: a.departmentName || (a.user?.departmentName) || 'General',
    date: a.date ? (typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    checkIn: checkIn || '--:--',
    checkOut: checkOut || undefined,
    breakDurationMinutes: a.breakDurationMinutes || a.breakMinutes || 0,
    workingHours: a.workingHours || a.workHours || 0,
    overtimeHours: a.overtimeHours || 0,
    status: status,
    remarks: a.note || a.remarks || '',
    createdAt: a.createdAt || new Date().toISOString(),
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
  return {
    id: lt.id || lt._id || `lt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: lt.name || lt.title || lt.leaveType || '',
    companyId: lt.companyId || '',
    createdAt: lt.createdAt || '',
    daysAllowed: lt.daysAllowed !== undefined ? Number(lt.daysAllowed) : (lt.quota !== undefined ? Number(lt.quota) : (lt.days !== undefined ? Number(lt.days) : 0)),
    code: lt.code || '',
    color: lt.color || '',
    isPaid: lt.isPaid !== undefined ? Boolean(lt.isPaid) : true,
  };
}

// 31. POST /leave-types (Create leave type - Admin/HR only)
async function createLeaveType(dataOrName: { name: string } | string) {
  const name = typeof dataOrName === 'string' ? dataOrName : dataOrName?.name;
  if (!name || !name.trim()) {
    throw new Error('Leave type name is required.');
  }

  try {
    const response = await http.post(
      '/leave-types',
      { name: name.trim() },
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
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
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
async function updateLeaveType(leaveTypeId: string, dataOrName: { name: string } | string) {
  const name = typeof dataOrName === 'string' ? dataOrName : dataOrName?.name;
  if (!name || !name.trim()) {
    throw new Error('Leave type name is required.');
  }

  try {
    let response;
    try {
      response = await http.patch(
        `/leave-types/${leaveTypeId}`,
        { name: name.trim() },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (patchErr: any) {
      if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
        response = await http.put(
          `/leave-types/${leaveTypeId}`,
          { name: name.trim() },
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
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave type could not be updated.');
  }
}

// 34. DELETE /leave-types/:leaveTypeId (Delete leave type - Admin/HR)
async function deleteLeaveType(leaveTypeId: string) {
  try {
    const response = await http.delete(`/leave-types/${leaveTypeId}`);
    clearApiCache('/leave-types');
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Leave type could not be deleted.');
  }
}

/* ==========================================================================
   MODULE 6: LEAVES (5 ENDPOINTS)
   ========================================================================== */

function backendLeaveToFrontend(l: any): LeaveRequest {
  if (!l) return l;
  const userName = l.userName || (l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : '') || l.employeeName || 'Staff Member';
  const daysList = Array.isArray(l.days) ? l.days : [];
  let startDate = l.startDate || '';
  let endDate = l.endDate || '';
  let daysCount = l.daysCount || (daysList.length > 0 ? daysList.length : 1);

  if (daysList.length > 0) {
    const dates = daysList.map((d: any) => d.date).sort();
    if (!startDate) startDate = dates[0];
    if (!endDate) endDate = dates[dates.length - 1];
    let computedCount = 0;
    daysList.forEach((d: any) => {
      if (d.portion === 'First Half' || d.portion === 'Second Half' || d.portion === 'Half Day') {
        computedCount += 0.5;
      } else {
        computedCount += 1;
      }
    });
    if (computedCount > 0) daysCount = computedCount;
  }

  let status: 'Pending' | 'Approved' | 'Rejected' = 'Pending';
  const rawStatus = (l.status || '').toUpperCase();
  if (rawStatus === 'ACCEPTED' || rawStatus === 'APPROVED') status = 'Approved';
  else if (rawStatus === 'REJECTED') status = 'Rejected';
  else status = 'Pending';

  return {
    id: l.id || `leave-${Date.now()}`,
    employeeId: l.userId || l.employeeId || '',
    employeeName: userName,
    departmentName: l.departmentName || (l.user?.departmentName) || 'General',
    leaveType: l.leaveType || 'Casual Leave',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || startDate || new Date().toISOString().split('T')[0],
    daysCount: daysCount,
    isHalfDay: daysList.some((d: any) => d.portion && d.portion !== 'Full Day'),
    reason: l.reason || '',
    status: status,
    appliedDate: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : (l.appliedDate || new Date().toISOString().split('T')[0]),
    comments: l.response || l.comments || '',
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
  dayBreakdown?: Array<{ date: string; session: string }>;
}

async function applyLeave(data: ApplyLeaveInput) {
  try {
    let daysArray = data.days;
    if (!daysArray || daysArray.length === 0) {
      if (Array.isArray(data.dayBreakdown) && data.dayBreakdown.length > 0) {
        daysArray = data.dayBreakdown.map((d) => ({
          date: d.date,
          portion: d.session === 'SESSION_1' ? 'First Half' : d.session === 'SESSION_2' ? 'Second Half' : 'Full Day',
        }));
      } else if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        daysArray = [];
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          daysArray.push({
            date: dt.toISOString().split('T')[0],
            portion: 'Full Day',
          });
        }
      } else if (data.startDate) {
        daysArray = [{ date: data.startDate, portion: 'Full Day' }];
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
async function acceptLeave(leaveId: string, responseText?: string) {
  try {
    const response = await http.post(`/leaves/${leaveId}/accept`, {
      response: responseText || 'Accepted. Take care.',
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
async function rejectLeave(leaveId: string, responseText?: string) {
  try {
    const response = await http.post(`/leaves/${leaveId}/reject`, {
      response: responseText || 'Rejected.',
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

async function getEmployees() {
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
const clockIn = clock;
const checkIn = clock;
const clockOut = clock;
const checkOut = clock;
const startWork = clock;
const stopWork = clock;
const startBreak = toggleBreak;
const endBreak = toggleBreak;
const resumeBreak = toggleBreak;
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
const approveLeave = (leaveId: string, _role?: string, _name?: string, responseText?: string) =>
  acceptLeave(leaveId, responseText);

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
} as Record<string, (...args: any[]) => Promise<any>>, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = notConnected;
    return target[prop];
  },
});
