import axios from 'axios';
import { getApiBaseUrl } from './config';
import { getCookie, setCookie } from './cookies';

export function clearApiCache(_endpointPrefix?: string) { }

const notConnected = async (..._args: unknown[]) => null;

export const http = axios.create({
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    const token = getCookie('hrms_auth_token') || getCookie('bearerToken');
    if (token && !config.headers.Authorization) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
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
    }
    config.data = form;
    config.headers.delete('Content-Type');
  }
  return config;
});

type CompanyRegisterInput = {
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

async function resetPassword(data: { token?: string; password: string; confirmPassword?: string }) {
  try {
    const form = new FormData();
    if (data.token) form.append('token', data.token);
    form.append('password', data.password);
    form.append('confirmPassword', data.confirmPassword || data.password);
    const response = await http.post('/users/reset-password', form);
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
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Employee could not be deleted.');
  }
}

async function deactivateEmployee(id: string) {
  try {
    const response = await http.patch(`/users/${id}`, { status: 'Inactive' });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Employee could not be deactivated.');
  }
}

async function activateEmployee(id: string) {
  try {
    const response = await http.patch(`/users/${id}`, { status: 'Active' });
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
    return response.data;
  } catch {
    return { url: '' };
  }
}

async function getDocuments(userId?: string) {
  try {
    const res = await listDocuments(userId ? { userId } : undefined);
    return Array.isArray(res?.data) ? res.data : Array.isArray(res?.documents) ? res.documents : Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function uploadDocumentFile(data: FormData | { title: string; file: File; userId?: string; companyId?: string }) {
  if (data instanceof FormData) {
    const response = await http.post('/documents', data);
    return response.data;
  }
  return createDocument(data);
}

async function verifyDocument(id: string, status: string) {
  try {
    const response = await http.patch(`/documents/${id}`, { status });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Document could not be verified.');
  }
}

const startWork = clockIn;
const checkIn = clockIn;
const stopWork = clockOut;
const checkOut = clockOut;
const getWorkStatus = getAttendanceLogic;

async function getWorkHistory(page = 1, limit = 100) {
  try {
    const response = await http.get('/attendance', { params: { page, limit } });
    return response.data;
  } catch {
    return [];
  }
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

export const api = new Proxy({
  registerCompany,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  getMe,
  getMyCompany,
  logout,
  createUser,
  listUsers,
  getEmployees,
  createEmployee,
  deleteEmployee,
  deactivateEmployee,
  activateEmployee,
  getNextEmployeeCode,
  uploadProfilePhoto,
  listDocuments,
  getDocuments,
  getDocument,
  createDocument,
  uploadDocumentFile,
  updateDocument,
  verifyDocument,
  deleteDocument,
  clockIn,
  checkIn,
  clockOut,
  checkOut,
  startWork,
  stopWork,
  startBreak,
  endBreak,
  resumeBreak,
  getAttendanceLogic,
  getWorkStatus,
  getWorkHistory,
} as Record<string, (...args: any[]) => Promise<any>>, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = notConnected;
    return target[prop];
  },
});
