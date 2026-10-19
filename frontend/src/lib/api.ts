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
} from '../types/hrms';

const API_BASE = 'http://localhost:4000/api';

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

    return fetchWithFallback<Employee[]>(
      `/employees?${query.toString()}`,
      undefined,
      mockEmployees
    );
  },

  async getEmployeeById(id: string) {
    const fallback = mockEmployees.find((e) => e.id === id || e.employeeCode === id) || mockEmployees[0];
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
    return fetchWithFallback<Employee>(
      '/employees',
      { method: 'POST', body: JSON.stringify(data) },
      { ...mockEmployees[0], id: `emp-${Date.now()}`, ...data } as Employee
    );
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    return fetchWithFallback<Employee>(
      `/employees/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      { ...mockEmployees[0], id, ...data } as Employee
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
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.date) query.set('date', params.date);

    return fetchWithFallback<AttendanceRecord[]>('/attendance?' + query.toString(), undefined, [
      {
        id: 'att-1',
        employeeId: 'emp-8',
        employeeName: 'Juan Hogan',
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:15 AM',
        checkOut: '06:05 PM',
        breakDurationMinutes: 45,
        workingHours: 8.5,
        overtimeHours: 0.5,
        status: 'Present',
        createdAt: new Date().toISOString(),
      },
    ]);
  },

  async checkIn(employeeId: string, remarks?: string) {
    return fetchWithFallback<AttendanceRecord>(
      '/attendance/check-in',
      { method: 'POST', body: JSON.stringify({ employeeId, remarks }) },
      {
        id: `att-${Date.now()}`,
        employeeId,
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:00 AM',
        checkOut: '',
        breakDurationMinutes: 0,
        workingHours: 0,
        overtimeHours: 0,
        status: 'Present',
        createdAt: new Date().toISOString(),
      }
    );
  },

  async checkOut(employeeId: string, remarks?: string) {
    return fetchWithFallback<AttendanceRecord>(
      '/attendance/check-out',
      { method: 'POST', body: JSON.stringify({ employeeId, remarks }) },
      {
        id: `att-${Date.now()}`,
        employeeId,
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:00 AM',
        checkOut: '06:00 PM',
        breakDurationMinutes: 45,
        workingHours: 8.5,
        overtimeHours: 0.5,
        status: 'Present',
        createdAt: new Date().toISOString(),
      }
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
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.status) query.set('status', params.status);

    return fetchWithFallback<LeaveRequest[]>('/leaves?' + query.toString(), undefined, mockLeaveRequests);
  },

  async applyLeave(data: any) {
    return fetchWithFallback<LeaveRequest>(
      '/leaves/apply',
      { method: 'POST', body: JSON.stringify(data) },
      {
        id: `lr-${Date.now()}`,
        employeeId: data.employeeId,
        employeeName: 'John Deo',
        departmentName: 'Engineering',
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        daysCount: 1,
        isHalfDay: false,
        reason: data.reason,
        status: 'Pending',
        appliedDate: new Date().toISOString().split('T')[0],
      }
    );
  },

  async approveLeave(id: string, role = 'HR_ADMIN', approverName = 'Approver', comments?: string) {
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/approve`,
      { method: 'PUT', body: JSON.stringify({ role, approverName, comments }) },
      { id, status: 'Approved' } as any
    );
  },

  async rejectLeave(id: string, approverName = 'Approver', reason?: string) {
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/reject`,
      { method: 'PUT', body: JSON.stringify({ approverName, reason }) },
      { id, status: 'Rejected' } as any
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
};
