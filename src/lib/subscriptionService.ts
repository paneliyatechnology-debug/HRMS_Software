import { CompanyTenant, getAllCompanies, saveCompanies } from './companyService';

export interface SubscriptionFeature {
  name: string;
  includedInStarter: boolean;
  includedInGrowth: boolean;
  includedInEnterprise: boolean;
  category: 'Attendance & Hardware' | 'HR & Payroll' | 'Security & Support';
  description?: string;
}

export interface SubscriptionPlan {
  id: 'Starter' | 'Growth' | 'Enterprise' | 'Custom';
  name: string;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  priceMonthlyINR: number;
  priceAnnualINR: number;
  maxEmployees: number; // e.g. 25, 100, 1000 (Unlimited)
  features: string[];
  color: {
    badgeBg: string;
    badgeText: string;
    border: string;
    gradient: string;
    accent: string;
  };
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amountINR: number;
  planName: string;
  billingCycle: 'Monthly' | 'Annual';
  status: 'Paid' | 'Processing' | 'Pending';
  pdfDownloadUrl?: string;
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'Starter',
    name: 'Starter Tier',
    tagline: 'Best for startups and growing boutique teams up to 25 staff members.',
    priceMonthlyINR: 1499,
    priceAnnualINR: 14990, // ~₹1,249/mo (Save ~17%)
    maxEmployees: 25,
    features: [
      'Up to 25 Employees Included',
      'Standard Web & Mobile Clock In / Out',
      'Leave Management & Approvals Workflow',
      'Office Shift & Working Hours Schedules',
      'Basic Attendance & Workhour Reports',
      'Email Notifications & Reminders',
      'Standard Community Support (48h SLA)',
    ],
    color: {
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800',
      border: 'border-slate-200',
      gradient: 'from-slate-50 to-slate-100/50',
      accent: 'bg-slate-900 text-white',
    },
  },
  {
    id: 'Growth',
    name: 'Growth Professional',
    tagline: 'Power features for established companies needing GPS tracking, selfie audit & full payroll.',
    badge: 'MOST POPULAR',
    isPopular: true,
    priceMonthlyINR: 3999,
    priceAnnualINR: 39990, // ~₹3,332/mo (Save 17%)
    maxEmployees: 100,
    features: [
      'Up to 100 Employees Included',
      'GPS Geofencing with Live Office Radius Pinning',
      'Live Front-Camera Selfie Verification with Anti-Spoofing',
      'Client Hardware Device & OS Detection Matrix',
      'Selective Work From Home (WFH) One-Click Overrides',
      'Complete Automated Payroll Engine & Salary Slips (PDF)',
      'Employee Performance Reviews & OKR Goals Tracking',
      'Company Notice Board & Broadcast Announcements',
      'Priority Email & Chat Support (12h SLA)',
    ],
    color: {
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      border: 'border-blue-300 ring-2 ring-blue-500/20',
      gradient: 'from-blue-50/60 to-indigo-50/40',
      accent: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25',
    },
  },
  {
    id: 'Enterprise',
    name: 'Enterprise Apex',
    tagline: 'Maximum security, physical biometric hardware sync, custom shifts & unlimited staff.',
    badge: 'UNLIMITED & HARDWARE',
    priceMonthlyINR: 8999,
    priceAnnualINR: 89990, // ~₹7,499/mo (Save 17%)
    maxEmployees: 1000, // Unlimited
    features: [
      'Unlimited Employees (Up to 1,000+ Included)',
      'Physical Biometric Hardware Gateway Hub (ZKTeco / eSSL / Realtime)',
      'Instant Cloud Push Webhook (ADMS / iclock / Python & Node Bridges)',
      'Live Hardware Punch Simulator & Terminal Health Heartbeat',
      'Advanced Multi-Tier RBAC Role Permissions Matrix',
      'Recruitment & ATS Candidate Pipeline Tracking',
      'Hardware & IT Asset Lifecycle Management',
      'Custom API Webhooks & Real-time Integrations',
      'Dedicated 24/7 Account Manager & 1-Hour SLA',
    ],
    color: {
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-900',
      border: 'border-purple-300 ring-2 ring-purple-500/20',
      gradient: 'from-purple-50/60 to-fuchsia-50/30',
      accent: 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-500/25',
    },
  },
];

export const SUBSCRIPTION_FEATURES_MATRIX: SubscriptionFeature[] = [
  {
    name: 'Standard Web & Mobile Clock In/Out',
    category: 'Attendance & Hardware',
    includedInStarter: true,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Manual punch from desktop browser or smartphone portal',
  },
  {
    name: 'GPS Geofencing Office Boundary Lock',
    category: 'Attendance & Hardware',
    includedInStarter: false,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Enforce attendance within precise office coordinate radius',
  },
  {
    name: 'Live Front-Camera Selfie Verification',
    category: 'Attendance & Hardware',
    includedInStarter: false,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Real-time selfie capture with anti-photo spoof protection',
  },
  {
    name: 'Device & Hardware Detector Audit',
    category: 'Attendance & Hardware',
    includedInStarter: false,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Detect whether employee punched from Mobile, Tablet, or PC',
  },
  {
    name: 'Work From Home (WFH) Bypass Toggles',
    category: 'Attendance & Hardware',
    includedInStarter: false,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Selectively allow remote workers to punch without GPS fence',
  },
  {
    name: 'Physical Biometric Device Integration (ZKTeco / eSSL)',
    category: 'Attendance & Hardware',
    includedInStarter: false,
    includedInGrowth: false,
    includedInEnterprise: true,
    description: 'Sync physical fingerprint and face-recognition machines via ADMS Cloud',
  },
  {
    name: 'Leave Management & Quota Policies',
    category: 'HR & Payroll',
    includedInStarter: true,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Paid, Casual, and Sick leave request approval workflows',
  },
  {
    name: 'Automated Monthly Payroll & Tax Slip Generator',
    category: 'HR & Payroll',
    includedInStarter: false,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'One-click salary disbursement calculation and printable PDF payslips',
  },
  {
    name: 'Performance Appraisals & OKR Goal Tracking',
    category: 'HR & Payroll',
    includedInStarter: false,
    includedInGrowth: true,
    includedInEnterprise: true,
    description: 'Conduct quarterly staff performance reviews with self-ratings',
  },
  {
    name: 'ATS Recruitment & Job Applicant Pipeline',
    category: 'HR & Payroll',
    includedInStarter: false,
    includedInGrowth: false,
    includedInEnterprise: true,
    description: 'Post job openings, screen candidate resumes, and manage interview stages',
  },
  {
    name: 'Custom Multi-Tier RBAC Role Security',
    category: 'Security & Support',
    includedInStarter: false,
    includedInGrowth: false,
    includedInEnterprise: true,
    description: 'Granular view/edit permissions across SuperAdmin, HR, Manager, and Finance',
  },
  {
    name: 'Dedicated 24/7 Priority SLA Support',
    category: 'Security & Support',
    includedInStarter: false,
    includedInGrowth: false,
    includedInEnterprise: true,
    description: 'Direct phone & priority Slack channel with engineering team',
  },
];

/**
 * Get all available plans
 */
export function getAllSubscriptionPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS;
}

/**
 * Get a specific plan by its ID
 */
export function getSubscriptionPlanById(planId: string): SubscriptionPlan {
  const match = SUBSCRIPTION_PLANS.find(
    (p) => p.id.toLowerCase() === (planId || '').toLowerCase()
  );
  return match || SUBSCRIPTION_PLANS[1]; // default Growth
}

/**
 * Get active subscription details for a specific tenant company
 */
export function getCompanySubscription(companyId: string = 'comp-paneliya'): {
  company: CompanyTenant | null;
  plan: SubscriptionPlan;
  billingCycle: 'Monthly' | 'Annual';
  maxEmployees: number;
  currentEmployeesCount: number;
  quotaPercent: number;
  isQuotaFull: boolean;
  nextRenewalDate: string;
} {
  const companies = getAllCompanies();
  const company = companies.find((c) => c.id === companyId) || companies[0] || null;

  const planId = company?.plan || 'Enterprise';
  const plan = getSubscriptionPlanById(planId);
  const billingCycle = company?.billingCycle || 'Annual';
  const maxEmployees = company?.maxEmployees || plan.maxEmployees;
  const currentEmployeesCount = company?.employeesCount || 0;

  const quotaPercent = Math.min(
    100,
    Math.round((currentEmployeesCount / (maxEmployees || 1)) * 100)
  );
  const isQuotaFull = currentEmployeesCount >= maxEmployees;

  // Next renewal date mock: 1 year / 1 month from created date or next month
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + (billingCycle === 'Annual' ? 12 : 1), today.getDate());
  const nextRenewalDate = nextMonth.toISOString().split('T')[0];

  return {
    company,
    plan,
    billingCycle,
    maxEmployees,
    currentEmployeesCount,
    quotaPercent,
    isQuotaFull,
    nextRenewalDate,
  };
}

/**
 * Update a company's subscription plan and billing cycle
 */
export function updateCompanySubscription(
  companyId: string,
  planId: 'Starter' | 'Growth' | 'Enterprise' | 'Custom',
  billingCycle: 'Monthly' | 'Annual' = 'Annual',
  paymentInfo?: {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    paymentMethod?: string;
  }
): boolean {
  const companies = getAllCompanies();
  const plan = getSubscriptionPlanById(planId);

  const updated = companies.map((c) => {
    if (c.id === companyId) {
      return {
        ...c,
        plan: planId,
        billingCycle,
        maxEmployees: plan.maxEmployees,
      };
    }
    return c;
  });

  saveCompanies(updated);

  // Generate an invoice for this transaction
  addCompanyInvoice(companyId, {
    planName: plan.name,
    amountINR: billingCycle === 'Annual' ? plan.priceAnnualINR : plan.priceMonthlyINR,
    billingCycle,
    paymentMethod: paymentInfo?.paymentMethod || 'Razorpay Gateway',
    razorpayPaymentId: paymentInfo?.razorpayPaymentId,
    razorpayOrderId: paymentInfo?.razorpayOrderId,
  });

  return true;
}

const INVOICES_STORAGE_PREFIX = 'hrms_subscription_invoices_';

/**
 * Get all billing invoices for a company
 */
export function getCompanyInvoices(companyId: string = 'comp-paneliya'): SubscriptionInvoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${INVOICES_STORAGE_PREFIX}${companyId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load invoices:', err);
  }

  // Initial seed invoices for demo
  const seedInvoices: SubscriptionInvoice[] = [
    {
      id: `inv-${Date.now() - 86400000 * 30}`,
      invoiceNumber: 'INV-2026-0891',
      date: '2026-01-10',
      amountINR: 89990,
      planName: 'Enterprise Apex',
      billingCycle: 'Annual',
      status: 'Paid',
    },
    {
      id: `inv-${Date.now() - 86400000 * 395}`,
      invoiceNumber: 'INV-2025-0342',
      date: '2025-01-10',
      amountINR: 79990,
      planName: 'Enterprise Apex',
      billingCycle: 'Annual',
      status: 'Paid',
    },
  ];

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      `${INVOICES_STORAGE_PREFIX}${companyId}`,
      JSON.stringify(seedInvoices)
    );
  }

  return seedInvoices;
}

/**
 * Add a new invoice when a plan is purchased or upgraded
 */
export function addCompanyInvoice(
  companyId: string,
  data: {
    planName: string;
    amountINR: number;
    billingCycle: 'Monthly' | 'Annual';
    paymentMethod?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  }
): SubscriptionInvoice {
  const current = getCompanyInvoices(companyId);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newInvoice: SubscriptionInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    date: dateStr,
    amountINR: data.amountINR,
    planName: data.planName,
    billingCycle: data.billingCycle,
    status: 'Paid',
    paymentMethod: data.paymentMethod || 'Razorpay (UPI / Card)',
    razorpayPaymentId: data.razorpayPaymentId,
    razorpayOrderId: data.razorpayOrderId,
  };

  const updated = [newInvoice, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      `${INVOICES_STORAGE_PREFIX}${companyId}`,
      JSON.stringify(updated)
    );
  }

  return newInvoice;
}

/**
 * Check if adding another employee is allowed under the current subscription
 */
export function isEmployeeAdditionAllowed(
  companyId: string,
  currentCount: number
): { allowed: boolean; maxEmployees: number; message?: string } {
  const sub = getCompanySubscription(companyId);
  if (currentCount >= sub.maxEmployees) {
    return {
      allowed: false,
      maxEmployees: sub.maxEmployees,
      message: `Your current ${sub.plan.name} plan is limited to ${sub.maxEmployees} employees. Please upgrade to Growth or Enterprise to add more staff members.`,
    };
  }
  return { allowed: true, maxEmployees: sub.maxEmployees };
}
