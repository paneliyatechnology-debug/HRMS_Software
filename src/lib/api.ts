import {
  mockDashboardStats,
  mockEmployees,
  mockDepartments,
  mockDesignations,
  mockLeaveRequests,
  mockUsers,
} from './mockData';
import {
  Employee,
  Department,
  Designation,
  AttendanceRecord,
  LeaveRequest,
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
} from '../types/hrms';

import {
  getAllAttendanceRecords,
  performCheckIn,
  performCheckOut,
} from './attendanceService';
import {
  getAllLeaves,
  applyForLeave,
  approveLeaveRequest,
  rejectLeaveRequest,
} from './leaveService';
import {
  getAllEmployees,
  addEmployee,
  removeEmployee,
  updateEmployee as updateEmployeeRecord,
} from './employeeService';
import {
  getAllAnnouncements,
  sendNotice,
  deleteNotice,
  getNoticesForEmployee,
} from './announcementService';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchWithFallback<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export const api = {
  // Dashboard & Reports
  async getDashboardStats() {
    return fetchWithFallback('/reports/dashboard-stats', undefined, mockDashboardStats);
  },

  // Employees
  async getEmployees(params?: { search?: string; departmentId?: string; status?: string; employmentType?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.status) query.set('status', params.status);
    if (params?.employmentType) query.set('employmentType', params.employmentType);

    const localEmployees = getAllEmployees();
    return fetchWithFallback<Employee[]>(
      `/employees?${query.toString()}`,
      undefined,
      localEmployees
    );
  },

  async getEmployeeById(id: string) {
    const all = getAllEmployees();
    const fallback = all.find((e) => e.id === id || e.employeeCode === id) || all[0];
    return fetchWithFallback<any>(`/employees/${id}`, undefined, {
      ...fallback,
      tabsData: {
        attendance: [],
        leaves: mockLeaveRequests.filter((l) => l.employeeId === fallback.id),
        leaveBalance: {
          casualLeave: { total: 12, used: 2, remaining: 10 },
          sickLeave: { total: 10, used: 1, remaining: 9 },
          paidLeave: { total: 15, used: 3, remaining: 12 },
        },
        documents: [],
        assets: [],
        performance: [],
        trainings: [],
        payrolls: [],
        activity: [],
      },
    });
  },

  async createEmployee(data: Partial<Employee>) {
    const newEmp = addEmployee(data);
    return fetchWithFallback<Employee>(
      '/employees',
      { method: 'POST', body: JSON.stringify(data) },
      newEmp
    );
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    const updated = updateEmployeeRecord(id, data);
    return fetchWithFallback<Employee>(
      `/employees/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      (updated || { ...mockEmployees[0], id, ...data }) as Employee
    );
  },

  async deleteEmployee(id: string) {
    const res = removeEmployee(id);
    return fetchWithFallback<{ success: boolean; message: string }>(
      `/employees/${id}`,
      { method: 'DELETE' },
      res
    );
  },

  // Organization
  async getDepartments() {
    return fetchWithFallback<Department[]>('/organization/departments', undefined, mockDepartments);
  },

  async getDesignations() {
    return fetchWithFallback<Designation[]>('/organization/designations', undefined, mockDesignations);
  },

  async getHierarchy() {
    return fetchWithFallback<any>('/organization/hierarchy', undefined, {
      id: 'org-root',
      name: 'Paneliya Technology Inc.',
      head: 'John Deo',
      departments: mockDepartments.map((d) => ({
        ...d,
        totalHeadcount: d.employeeCount,
        managers: [],
      })),
    });
  },

  // Attendance
  async getAttendance(params?: { employeeId?: string; date?: string; departmentId?: string }) {
    const localRecords = getAllAttendanceRecords();
    return fetchWithFallback<AttendanceRecord[]>('/attendance', undefined, localRecords);
  },

  async checkIn(employeeId: string, remarks?: string, employeeMeta?: any) {
    const res = performCheckIn({
      id: employeeId,
      firstName: employeeMeta?.firstName || 'Employee',
      lastName: employeeMeta?.lastName || '',
      employeeCode: employeeMeta?.employeeCode || employeeId,
      departmentName: employeeMeta?.departmentName || 'General',
    });
    return fetchWithFallback<AttendanceRecord>(
      '/attendance/check-in',
      { method: 'POST', body: JSON.stringify({ employeeId, remarks }) },
      res.record!
    );
  },

  async checkOut(employeeId: string, remarks?: string) {
    const res = performCheckOut(employeeId);
    return fetchWithFallback<AttendanceRecord>(
      '/attendance/check-out',
      { method: 'POST', body: JSON.stringify({ employeeId, remarks }) },
      res.record!
    );
  },

  async syncBiometricAttendance(logs: any[]) {
    return fetchWithFallback<any>(
      '/attendance/biometric-sync',
      { method: 'POST', body: JSON.stringify({ logs }) },
      { status: 'success', syncedRecords: logs.length }
    );
  },

  // Leaves
  async getLeaves(params?: { employeeId?: string; status?: string }) {
    const localLeaves = getAllLeaves();
    return fetchWithFallback<LeaveRequest[]>('/leaves', undefined, localLeaves);
  },

  async applyLeave(data: any) {
    const newLeave = applyForLeave(data);
    return fetchWithFallback<LeaveRequest>(
      '/leaves/apply',
      { method: 'POST', body: JSON.stringify(data) },
      newLeave
    );
  },

  async approveLeave(id: string, role = 'HR_ADMIN', approverName = 'Admin', comments?: string) {
    const res = approveLeaveRequest(id, approverName);
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/approve`,
      { method: 'PUT', body: JSON.stringify({ role, approverName, comments }) },
      res.leave || ({ id, status: 'Approved' } as any)
    );
  },

  async rejectLeave(id: string, approverName = 'Admin', reason?: string) {
    const res = rejectLeaveRequest(id, reason, approverName);
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/reject`,
      { method: 'PUT', body: JSON.stringify({ approverName, reason }) },
      res.leave || ({ id, status: 'Rejected' } as any)
    );
  },

  // Payroll
  async getPayroll(params?: { month?: string; status?: string; employeeId?: string }) {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    return fetchWithFallback<PayrollRecord[]>('/payroll?' + query.toString(), undefined, []);
  },

  async generatePayroll(month: string) {
    return fetchWithFallback<any>(
      '/payroll/generate',
      { method: 'POST', body: JSON.stringify({ month }) },
      { success: true, recordsGenerated: 21 }
    );
  },

  async getPayslip(id: string) {
    return fetchWithFallback<any>(`/payroll/payslip/${id}`);
  },

  // Recruitment
  async getJobs() {
    return fetchWithFallback<JobOpening[]>('/recruitment/jobs', undefined, []);
  },

  async getCandidates(jobId?: string) {
    const query = jobId ? `?jobId=${jobId}` : '';
    return fetchWithFallback<Candidate[]>(`/recruitment/candidates${query}`, undefined, []);
  },

  async updateCandidateStatus(id: string, status: string) {
    return fetchWithFallback<Candidate>(`/recruitment/candidates/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async convertCandidateToEmployee(id: string) {
    return fetchWithFallback<any>(`/recruitment/candidates/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Performance
  async getPerformanceReviews(employeeId?: string) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return fetchWithFallback<PerformanceReview[]>(`/performance/reviews${query}`, undefined, []);
  },

  // Training
  async getTrainingPrograms() {
    return fetchWithFallback<TrainingProgram[]>('/training/programs', undefined, []);
  },

  // Assets
  async getAssets() {
    return fetchWithFallback<CompanyAsset[]>('/assets', undefined, []);
  },

  // Resignations
  async getResignations() {
    return fetchWithFallback<Resignation[]>('/resignations', undefined, []);
  },

  // Notifications
  async getNotifications() {
    return fetchWithFallback<NotificationItem[]>('/notifications', undefined, []);
  },

  async markNotificationRead(id: string) {
    return fetchWithFallback<NotificationItem>(`/notifications/${id}/read`, { method: 'PUT' });
  },

  // Audit Logs
  async getAuditLogs(module?: string) {
    const query = module ? `?module=${module}` : '';
    return fetchWithFallback<AuditLog[]>(`/audit-logs${query}`, undefined, []);
  },

  // Settings
  async getSettings() {
    return fetchWithFallback<any>('/settings');
  },

  // Documents
  async getDocuments(employeeId?: string) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return fetchWithFallback<any[]>(`/documents${query}`, undefined, []);
  },

  async uploadDocumentFile(formData: FormData) {
    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
      return await res.json();
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

  async verifyDocument(id: string, status: 'Verified' | 'Rejected') {
    return fetchWithFallback<any>(`/documents/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status, verifiedBy: 'HR Admin' }),
    });
  },

  // Authentication
  async login(email: string, password?: string) {
    return fetchWithFallback<any>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      {
        accessToken: `jwt_fallback_${Date.now()}`,
        user: mockUsers[0],
      }
    );
  },

  async getProfile(token?: string) {
    return fetchWithFallback<any>(
      '/auth/me',
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      mockUsers[0]
    );
  },

  // Announcements & Notices
  async getAnnouncements(employeeId?: string, departmentName?: string) {
    const local = employeeId
      ? getNoticesForEmployee(employeeId, departmentName)
      : getAllAnnouncements();
    return fetchWithFallback<Announcement[]>('/announcements', undefined, local);
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
    const notice = sendNotice(data);
    return fetchWithFallback<Announcement>(
      '/announcements',
      { method: 'POST', body: JSON.stringify(data) },
      notice
    );
  },

  async deleteAnnouncement(id: string) {
    const res = deleteNotice(id);
    return fetchWithFallback<{ success: boolean }>(
      `/announcements/${id}`,
      { method: 'DELETE' },
      res
    );
  },
};
