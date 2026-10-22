import {
  mockDashboardStats,
  mockEmployees,
  mockDepartments,
  mockDesignations,
  mockLocations,
  mockLeaveRequests,
  mockLeaveBalances,
  mockHolidays,
  mockJobs,
  mockCandidates,
  mockPerformanceCycles,
  mockPerformanceReviews,
  mockTrainingPrograms,
  mockTrainingEnrollments,
  mockCompanyAssets,
  mockResignations,
  mockAnnouncements,
  mockNotifications,
  mockAuditLogs,
  mockSystemSettings,
  mockUsers,
} from './mockData';
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

import {
  getAllAttendanceRecords,
  performCheckIn,
  performCheckOut,
  getTodayRecordForEmployee,
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

/**
 * Universal API fetcher that forwards JWT Bearer token and gracefully falls back to local data.
 */
async function fetchWithFallback<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken')
        : null;

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  // =========================================================================
  // 1. SYSTEM HEALTH
  // =========================================================================
  async getHealth() {
    return fetchWithFallback('/health', undefined, {
      status: 'healthy',
      version: '1.0.0',
      service: 'Paneliya Enterprise HRMS API',
      timestamp: new Date().toISOString(),
    });
  },

  // =========================================================================
  // 2. AUTHENTICATION & ACCESS
  // =========================================================================
  async login(email: string, password?: string) {
    const result = await fetchWithFallback<any>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      {
        accessToken: `jwt_session_${Date.now()}`,
        user: mockUsers[0],
      }
    );

    if (typeof window !== 'undefined' && result?.accessToken) {
      localStorage.setItem('hrms_auth_token', result.accessToken);
      localStorage.setItem('bearerToken', result.accessToken);
    }
    return result;
  },

  async getProfile(token?: string) {
    return fetchWithFallback<User>(
      '/auth/me',
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      mockUsers[0]
    );
  },

  async switchRole(role: string) {
    return fetchWithFallback<any>(
      '/auth/switch-role',
      {
        method: 'POST',
        body: JSON.stringify({ role }),
      },
      {
        success: true,
        activeRole: role,
        accessToken: `jwt_switched_${role.toLowerCase()}_${Date.now()}`,
      }
    );
  },

  async getAuthUsers() {
    return fetchWithFallback<User[]>('/auth/users', undefined, mockUsers);
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
    const localEmployees = getAllEmployees();
    return fetchWithFallback<Employee[]>(
      `/employees${qs ? `?${qs}` : ''}`,
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
        leaveBalance: mockLeaveBalances[0] || {
          casualLeave: { total: 12, used: 2, remaining: 10 },
          sickLeave: { total: 10, used: 1, remaining: 9 },
          paidLeave: { total: 15, used: 3, remaining: 12 },
        },
        documents: [],
        assets: mockCompanyAssets.filter((a) => a.assignedToEmployeeId === fallback.id),
        performance: mockPerformanceReviews.filter((r) => r.employeeId === fallback.id),
        trainings: mockTrainingEnrollments.filter((t) => t.employeeId === fallback.id),
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

  // =========================================================================
  // 4. ORGANIZATION (DEPARTMENTS, DESIGNATIONS, LOCATIONS, HIERARCHY)
  // =========================================================================
  async getDepartments() {
    return fetchWithFallback<Department[]>('/organization/departments', undefined, mockDepartments);
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
      headName: data.headName || 'Keyur Sangani',
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
    const fallback = mockDepartments.find((d) => d.id === id) || mockDepartments[0];
    return fetchWithFallback<Department>(
      `/organization/departments/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      { ...fallback, ...data }
    );
  },

  async getDesignations() {
    return fetchWithFallback<Designation[]>('/organization/designations', undefined, mockDesignations);
  },

  async createDesignation(data: {
    title: string;
    departmentId: string;
    minSalary?: number;
    maxSalary?: number;
  }) {
    const matchedDept = mockDepartments.find((d) => d.id === data.departmentId) || mockDepartments[0];
    const newDes: Designation = {
      id: `des-${Date.now()}`,
      title: data.title,
      departmentId: data.departmentId,
      departmentName: matchedDept.name,
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
    return fetchWithFallback<Location[]>('/organization/locations', undefined, mockLocations);
  },

  async getHierarchy() {
    return fetchWithFallback<any>('/organization/hierarchy', undefined, {
      id: 'org-root',
      name: 'Paneliya Technology Inc.',
      head: 'Keyur Sangani',
      departments: mockDepartments.map((d) => ({
        ...d,
        totalHeadcount: d.employeeCount,
        managers: [],
      })),
    });
  },

  // =========================================================================
  // 5. ATTENDANCE & PUNCH CLOCK
  // =========================================================================
  async getAttendance(params?: { employeeId?: string; date?: string; departmentId?: string }) {
    const localRecords = getAllAttendanceRecords();
    return fetchWithFallback<AttendanceRecord[]>('/attendance', undefined, localRecords);
  },

  async getMyAttendanceStatus(employeeId: string) {
    const rec = getTodayRecordForEmployee(employeeId);
    return fetchWithFallback<any>(`/attendance/my-status/${employeeId}`, undefined, {
      employeeId,
      todayDate: new Date().toISOString().split('T')[0],
      checkIn: rec?.checkIn || null,
      checkOut: rec?.checkOut || null,
      isWorking: Boolean(rec && !rec.isCompleted && !rec.isOnBreak),
      isOnBreak: Boolean(rec?.isOnBreak),
      isCompleted: Boolean(rec?.isCompleted),
      totalSeconds: rec?.activeSeconds || 0,
      breakSeconds: rec?.breakSeconds || 0,
    });
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
  // 6. LEAVES & TIME-OFF MANAGEMENT
  // =========================================================================
  async getLeaves(params?: { employeeId?: string; status?: string }) {
    const localLeaves = getAllLeaves();
    return fetchWithFallback<LeaveRequest[]>('/leaves', undefined, localLeaves);
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
    const newLeave = applyForLeave({
      ...data,
      isHalfDay: Boolean(data.isHalfDay),
    });
    return fetchWithFallback<LeaveRequest>(
      '/leaves/apply',
      { method: 'POST', body: JSON.stringify(data) },
      newLeave
    );
  },

  async getLeaveBalances(employeeId: string) {
    const fallback = mockLeaveBalances.find((b) => b.employeeId === employeeId) || mockLeaveBalances[0];
    return fetchWithFallback<LeaveBalance>(
      `/leaves/balances/${employeeId}`,
      undefined,
      fallback
    );
  },

  async approveLeave(id: string, role = 'HR_ADMIN', approverName = 'Keyur Sangani', comments?: string) {
    const res = approveLeaveRequest(id, approverName);
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/approve`,
      { method: 'PUT', body: JSON.stringify({ role, approverName, comments }) },
      res.leave || ({ id, status: 'Approved' } as any)
    );
  },

  async rejectLeave(id: string, approverName = 'Keyur Sangani', reason?: string) {
    const res = rejectLeaveRequest(id, reason, approverName);
    return fetchWithFallback<LeaveRequest>(
      `/leaves/${id}/reject`,
      { method: 'PUT', body: JSON.stringify({ approverName, reason }) },
      res.leave || ({ id, status: 'Rejected' } as any)
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
      employeeName: 'Rahul Sharma',
      employeeCode: 'EMP-2',
      designationTitle: 'Senior Fullstack Engineer',
      departmentName: 'Engineering & Technology',
      basicSalary: 45000,
      hra: 18000,
      allowances: 8000,
      bonus: 4000,
      grossSalary: 75000,
      pfDeduction: 5400,
      taxDeduction: 6500,
      professionalTax: 200,
      totalDeductions: 12100,
      netSalary: 62900,
      paymentMethod: 'Direct Bank Transfer (SBI)',
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
    return fetchWithFallback<JobOpening[]>('/recruitment/jobs', undefined, mockJobs);
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
    return fetchWithFallback<Candidate[]>(`/recruitment/candidates${query}`, undefined, mockCandidates);
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
    return fetchWithFallback<any[]>('/performance/cycles', undefined, mockPerformanceCycles);
  },

  async getPerformanceReviews(employeeId?: string) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return fetchWithFallback<PerformanceReview[]>(
      `/performance/reviews${query}`,
      undefined,
      mockPerformanceReviews
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
    return fetchWithFallback<TrainingProgram[]>('/training/programs', undefined, mockTrainingPrograms);
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
      mockTrainingEnrollments
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
    return fetchWithFallback<CompanyAsset[]>(`/assets${query}`, undefined, mockCompanyAssets);
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
    return fetchWithFallback<Resignation[]>('/resignations', undefined, mockResignations);
  },

  async submitResignation(data: {
    employeeId: string;
    reason: string;
    noticePeriodDays: number;
  }) {
    const newRes: Resignation = {
      id: `res-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: 'Rahul Sharma',
      employeeCode: 'EMP-2',
      departmentName: 'Engineering & Technology',
      resignationDate: new Date().toISOString().split('T')[0],
      lastWorkingDay: new Date(Date.now() + data.noticePeriodDays * 86400000).toISOString().split('T')[0],
      noticePeriodDays: data.noticePeriodDays,
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
      { method: 'POST', body: JSON.stringify(data) },
      newRes
    );
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
      { id, clearance, actorName: actor, status: 'In Clearance' }
    );
  },

  // =========================================================================
  // 13. HOLIDAYS & CALENDAR
  // =========================================================================
  async getHolidays() {
    return fetchWithFallback<Holiday[]>('/holidays', undefined, mockHolidays);
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

  // =========================================================================
  // 16. NOTIFICATIONS CENTER
  // =========================================================================
  async getNotifications() {
    return fetchWithFallback<NotificationItem[]>('/notifications', undefined, mockNotifications);
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
    return fetchWithFallback<AuditLog[]>(`/audit-logs${query}`, undefined, mockAuditLogs);
  },

  // =========================================================================
  // 18. REPORTS & DASHBOARD ANALYTICS & BULK EXPORT
  // =========================================================================
  async getDashboardStats() {
    return fetchWithFallback('/reports/dashboard-stats', undefined, mockDashboardStats);
  },

  async exportReport(type: 'attendance' | 'employees' | 'leaves' | 'payroll') {
    return fetchWithFallback<any[]>(`/reports/export?type=${type}`, undefined, []);
  },

  // =========================================================================
  // 19. ENTERPRISE SETTINGS & POLICIES
  // =========================================================================
  async getSettings() {
    return fetchWithFallback<any>('/settings', undefined, mockSystemSettings);
  },

  async updateSettings(data: any) {
    return fetchWithFallback<any>(
      '/settings',
      { method: 'PUT', body: JSON.stringify(data) },
      { ...mockSystemSettings, ...data, updatedAt: new Date().toISOString() }
    );
  },
};
