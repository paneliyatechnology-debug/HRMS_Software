import {
  Department,
  Designation,
  Location,
  User,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  Holiday,
  PayrollRecord,
  JobOpening,
  Candidate,
  CompanyAsset,
  Announcement,
  NotificationItem,
  AuditLog,
  EmployeeDocument,
  PerformanceReview,
  TrainingProgram,
  Resignation,
} from '../types/hrms';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'keyur.sangani1234@gmail.com',
    firstName: 'Keyur',
    lastName: 'Sangani',
    role: 'SUPER_ADMIN',
    employeeId: 'emp-1',
    avatarUrl: '',
  },
];

export const mockDepartments: Department[] = [
  { id: 'dept-1', name: 'Administration & Management', code: 'ADM', headName: 'Keyur Sangani', employeeCount: 1, createdAt: '2026-10-19' },
];

export const mockDesignations: Designation[] = [
  { id: 'des-1', title: 'App Administrator', departmentId: 'dept-1', departmentName: 'Administration & Management', minSalary: 0, maxSalary: 0, createdAt: '2026-10-19' },
];

export const mockLocations: Location[] = [
  { id: 'loc-1', name: 'Corporate HQ', city: 'Surat', country: 'India', address: 'paneliya technology, Surat, Gujarat', isHeadquarter: true },
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-1',
    firstName: 'Keyur',
    lastName: 'Sangani',
    email: 'keyur.sangani1234@gmail.com',
    phone: '6352486893',
    avatarUrl: '',
    gender: 'Male',
    dateOfBirth: '1996-05-15',
    address: 'Surat, Gujarat',
    emergencyContact: { name: '', relationship: '', phone: '' },
    joiningDate: '2026-10-19',
    employmentType: 'Full-time',
    status: 'Active',
    departmentId: 'dept-1',
    departmentName: '--',
    designationId: 'des-1',
    designationTitle: 'App Administrator',
    reportingManagerId: '',
    reportingManagerName: '—',
    workLocationId: 'loc-1',
    workLocationName: '--',
    shift: 'General Shift (09:00 AM – 06:00 PM)',
    bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: 'Keyur Sangani' },
    taxInformation: { taxId: '', panOrSsn: '', taxRegime: 'New Regime' },
    education: [],
    previousExperience: [],
    skills: ['App Administrator', 'Project Management'],
    salary: { basic: 50000, hra: 20000, allowances: 10000, bonus: 5000, pf: 6000, tax: 8000, professionalTax: 200, gross: 85000, net: 70800 },
    createdAt: '2026-10-19',
    updatedAt: '2026-10-19',
  },
];

export const mockLeaveRequests: LeaveRequest[] = [];

export const mockLeaveBalances: LeaveBalance[] = [
  {
    id: 'bal-emp-1',
    employeeId: 'emp-1',
    year: 2026,
    casualLeave: { total: 3.12, used: 0, remaining: 3.12 },
    sickLeave: { total: 0, used: 0, remaining: 0 },
    paidLeave: { total: 3.12, used: 0, remaining: 3.12 },
  },
];

export const mockHolidays: Holiday[] = [
  { id: 'hol-1', name: 'Diwali', date: '2026-11-08', dayOfWeek: 'Sunday', type: 'Public', description: 'Festival of Lights' },
  { id: 'hol-2', name: 'Christmas Day', date: '2026-12-25', dayOfWeek: 'Friday', type: 'Public', description: 'Christmas' },
];

export const mockDashboardStats = {
  kpiCards: {
    totalEmployees: { value: 1, growth: '+0%', subtext: '1 Employee Active' },
    todaysPresent: { count: 0, percentage: '0%', subtext: '0% Present Today' },
    totalExpense: { value: '₹0.00', growth: '0%', subtext: 'October 2026' },
    totalPayrolls: { value: '₹0.00', growth: '0%', subtext: 'Processed' },
  },
  attendanceSummary: {
    present: 0,
    late: 0,
    absent: 13,
    status: 'Critical',
    month: 'October 2026',
  },
  leaveStatus: {
    annualLeave: 3.12,
    nextLeave: 'No upcoming leave',
  },
  nextHoliday: 'No upcoming holiday',
  performanceOverview: [
    { month: 'Mon', hours: 0 },
    { month: 'Tue', hours: 0 },
    { month: 'Wed', hours: 0 },
    { month: 'Thu', hours: 0 },
    { month: 'Fri', hours: 0 },
    { month: 'Sat', hours: 0 },
    { month: 'Sun', hours: 0 },
  ],
  leaveApplications: [],
  employmentBreakdown: [
    { label: 'Full-time', count: 1, percent: 100, color: '#3b82f6' },
  ],
  departmentStats: [
    { name: 'Administration', count: 1 },
  ],
  activeEmployees: 1,
  absentToday: 1,
  pendingLeaves: 0,
  totalCandidates: 0,
  openJobs: 0,
};

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to paneliya technology Portal',
    content: 'HR & Project Management OS setup completed. Manage attendance, leave, and tasks in real-time.',
    authorName: 'Keyur Sangani (App Administrator)',
    priority: 'High',
    publishDate: '2026-10-19T09:00:00Z',
    expiryDate: '2026-12-31T23:59:59Z',
    targetAudience: 'All',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Welcome to paneliya technology',
    message: 'Read the Employee Guide to learn how to use attendance, leave, and your profile.',
    type: 'system',
    isRead: false,
    createdAt: '2026-10-19T09:00:00Z',
    link: '/account/dashboard',
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userName: 'Keyur Sangani',
    userRole: 'App Administrator',
    action: 'LOGIN',
    module: 'Auth',
    recordId: 'user-1',
    details: 'Signed into paneliya technology HR & Project Management OS',
    ipAddress: '127.0.0.1',
    createdAt: '2026-10-19T18:00:00Z',
  },
];
