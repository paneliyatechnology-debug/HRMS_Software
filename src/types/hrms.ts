export type Role =
  | 'SUPER_ADMIN'
  | 'HR_ADMIN'
  | 'HR_EXECUTIVE'
  | 'MANAGER'
  | 'TEAM_LEADER'
  | 'EMPLOYEE'
  | 'RECRUITER'
  | 'FINANCE_ADMIN';

export type EmployeeStatus =
  | 'Active'
  | 'Probation'
  | 'On Notice'
  | 'Resigned'
  | 'Terminated'
  | 'Retired'
  | 'Inactive';

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'Late'
  | 'On Leave'
  | 'Holiday'
  | 'Week Off';

export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Paid Leave'
  | 'Earned Leave'
  | 'Unpaid Leave'
  | 'Comp Off'
  | 'Maternity Leave'
  | 'Paternity Leave';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type CandidateStatus =
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Shortlisted'
  | 'Selected'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export type AssetStatus = 'Assigned' | 'Available' | 'Under Repair' | 'Retired';

export type TrainingStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export type ResignationStatus =
  | 'Submitted'
  | 'Manager Approved'
  | 'HR Approved'
  | 'In Clearance'
  | 'Completed'
  | 'Rejected';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  employeeId?: string;
  employeeCode?: string;
  phone?: string;
  departmentName?: string;
  designationTitle?: string;
  avatarUrl?: string;
  companyId?: string;
  companyName?: string;
  workStatus?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headEmployeeId?: string;
  headName?: string;
  employeeCount: number;
  description?: string;
  createdAt: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  minSalary: number;
  maxSalary: number;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  isHeadquarter: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  companyId?: string;
  companyName?: string;
  userId?: string;
  password?: string;
  role?: Role;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  joiningDate: string;
  employmentType: 'Full-time' | 'Remote' | 'Part-time' | 'Contractual' | 'Hourly';
  status: EmployeeStatus;
  isWFH?: boolean;
  workStatus?: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  workLocationId: string;
  workLocationName: string;
  shift: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscOrRouting: string;
    accountHolderName: string;
  };
  taxInformation: {
    taxId: string;
    panOrSsn: string;
    taxRegime: string;
  };
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  previousExperience: Array<{
    company: string;
    role: string;
    years: number;
  }>;
  skills: string[];
  salary: {
    basic: number;
    hra: number;
    allowances: number;
    bonus: number;
    pf: number;
    tax: number;
    professionalTax: number;
    gross: number;
    net: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  breakDurationMinutes: number;
  workingHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  remarks?: string;
  lateReason?: string;
  createdAt: string;
  activeSeconds?: number;
  breakSeconds?: number;
  isOnBreak?: boolean;
  isCompleted?: boolean;
  lastActiveTimestamp?: number;
  lastBreakTimestamp?: number;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInAccuracy?: number;
  checkInDistanceMeters?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutDistanceMeters?: number;
  isGeofenceVerified?: boolean;
  isWFH?: boolean;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  checkInDevice?: DevicePunchInfo;
  checkOutDevice?: DevicePunchInfo;
}

export interface DevicePunchInfo {
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  deviceModel: string;
  os: string;
  browser: string;
  screenResolution: string;
  orientation?: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  timestamp?: string;
  ipAddress?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  managerApproverId?: string;
  managerApproverName?: string;
  managerApprovedAt?: string;
  hrApproverId?: string;
  hrApproverName?: string;
  hrApprovedAt?: string;
  comments?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  casualLeave: { total: number; used: number; remaining: number };
  sickLeave: { total: number; used: number; remaining: number };
  paidLeave: { total: number; used: number; remaining: number };
  maternityLeave?: { total: number; used: number; remaining: number };
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  type: 'Public' | 'Optional' | 'Company';
  description: string;
  locationId?: string;
}

export interface PayrollRecord {
  id: string;
  payrollMonth: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designationTitle: string;
  departmentName: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  overtimePay: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Processed' | 'Paid';
  paymentDate?: string;
  paymentMethod?: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName?: string;
  title: string;
  category: 'Identity' | 'Tax' | 'Resume' | 'Offer Letter' | 'Appointment' | 'Experience' | 'Education' | 'Salary' | 'Other';
  fileUrl: string;
  fileSize: string;
  uploadDate: string;
  expiryDate?: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  verifiedBy?: string;
}

export interface PerformanceCycle {
  id: string;
  title: string;
  year: number;
  period: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Active' | 'Under Review' | 'Completed';
}

export interface PerformanceReview {
  id: string;
  cycleId: string;
  cycleTitle: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  goals: Array<{
    title: string;
    description: string;
    weight: number;
    progress: number;
  }>;
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerFeedback?: string;
  finalRating?: number;
  appraisalRecommended?: string;
  status: 'Goals Set' | 'Self Assessment' | 'Manager Review' | 'Completed';
  completedAt?: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  trainerName: string;
  skillsCovered: string[];
  startDate: string;
  endDate: string;
  durationHours: number;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  enrolledCount: number;
}

export interface EmployeeTraining {
  id: string;
  trainingId: string;
  trainingTitle: string;
  employeeId: string;
  employeeName: string;
  status: TrainingStatus;
  progressPercent: number;
  completionDate?: string;
  certificateUrl?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  designationTitle: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  openingsCount: number;
  salaryRange: string;
  description: string;
  skillsRequired: string[];
  status: 'Draft' | 'Published' | 'Closed';
  postedDate: string;
  applicantCount: number;
}

export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  experienceYears: number;
  currentCompany?: string;
  skills: string[];
  source: string;
  status: CandidateStatus;
  appliedDate: string;
  rating?: number;
  notes?: string;
  interviews?: Array<{
    id: string;
    round: string;
    interviewerName: string;
    scheduledAt: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    feedback?: string;
    rating?: number;
  }>;
}

export interface CompanyAsset {
  id: string;
  assetCode: string;
  name: string;
  category: 'Laptop' | 'Monitor' | 'Mobile' | 'Access Card' | 'Vehicle' | 'Other';
  serialNumber: string;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedDate?: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Damaged';
  status: AssetStatus;
  purchaseDate: string;
}

export interface Resignation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  resignationDate: string;
  lastWorkingDay: string;
  noticePeriodDays: number;
  reason: string;
  status: ResignationStatus;
  managerApproval: {
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedAt?: string;
    notes?: string;
  };
  clearance: {
    departmentClearance: boolean;
    assetReturned: boolean;
    financeSettlement: boolean;
    exitInterviewCompleted: boolean;
  };
  exitFeedback?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string;
  targetAudience: 'All' | 'Department' | 'Management' | 'Individual';
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  departmentId?: string;
  departmentName?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  authorName: string;
  authorRole?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'payroll' | 'performance' | 'system' | 'birthday';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  recordId?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'document' | 'pdf';
  url?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'employee';
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: ChatAttachment[];
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'broadcast';
  participantIds: string[];
  participantNames: Record<string, string>;
  participantRoles?: Record<string, 'admin' | 'employee'>;
  participantAvatars?: Record<string, string>;
  participantCodes?: Record<string, string>;
  participantEmails?: Record<string, string>;
  participantDesignations?: Record<string, string>;
  title?: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  lastSenderId?: string;
  unreadCount: Record<string, number>;
  updatedAt: string;
}
