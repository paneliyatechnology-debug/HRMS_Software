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
  {
    id: 'dept-1',
    name: 'Administration & Management',
    code: 'ADM',
    headName: 'Keyur Sangani',
    employeeCount: 1,
    createdAt: '2026-10-19',
  },
];

export const mockDesignations: Designation[] = [
  {
    id: 'des-1',
    title: 'App Administrator',
    departmentId: 'dept-1',
    departmentName: 'Administration & Management',
    minSalary: 80000,
    maxSalary: 120000,
    createdAt: '2026-10-19',
  },
];

export const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Corporate HQ',
    city: 'Surat',
    country: 'India',
    address: 'paneliya technology, Surat, Gujarat',
    isHeadquarter: true,
  },
];

export const mockEmployees: Employee[] = [];

export const mockLeaveRequests: LeaveRequest[] = [];

export const mockLeaveBalances: LeaveBalance[] = [];

export const mockHolidays: Holiday[] = [];

export const mockJobs: JobOpening[] = [];

export const mockCandidates: Candidate[] = [];

export const mockPerformanceCycles: any[] = [];

export const mockPerformanceReviews: PerformanceReview[] = [];

export const mockTrainingPrograms: TrainingProgram[] = [];

export const mockTrainingEnrollments: any[] = [];

export const mockCompanyAssets: CompanyAsset[] = [];

export const mockResignations: Resignation[] = [];

export const mockAnnouncements: Announcement[] = [];

export const mockNotifications: NotificationItem[] = [];

export const mockAuditLogs: AuditLog[] = [];

export const mockDashboardStats = {
  kpiCards: {
    totalEmployees: { value: 0, growth: '+0%', subtext: '0 Employees' },
    todaysPresent: { count: 0, percentage: '0%', subtext: '0% Present Today' },
    totalExpense: { value: '₹0.00', growth: '0%', subtext: 'October 2026' },
    totalPayrolls: { value: '₹0.00', growth: '0%', subtext: 'Processed' },
  },
  attendanceSummary: {
    present: 0,
    late: 0,
    absent: 0,
    status: 'Normal',
    month: 'October 2026',
  },
  leaveStatus: {
    annualLeave: 0,
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
  employmentBreakdown: [],
  departmentStats: [],
  activeEmployees: 0,
  absentToday: 0,
  pendingLeaves: 0,
  totalCandidates: 0,
  openJobs: 0,
};

export const mockSystemSettings = {
  company: {
    name: 'Paneliya Technology Inc.',
    tagline: 'Enterprise Cloud & Next-Gen Software Engineering',
    currency: 'INR (₹)',
  },
  workSchedule: {
    workingHoursPerDay: 8,
    defaultShift: '09:00 AM - 06:00 PM',
    gracePeriodMinutes: 15,
  },
  leavePolicy: {
    casualLeaveAnnual: 12,
    sickLeaveAnnual: 10,
    paidLeaveAnnual: 15,
    carryForwardLimit: 5,
  },
  payrollPolicy: {
    payCycle: 'Monthly',
    disbursementDate: 28,
    pfContributionPercent: 12,
  },
};
