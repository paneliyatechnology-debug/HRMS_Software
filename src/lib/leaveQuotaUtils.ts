import { LeaveBalance, LeaveRequest } from '../types/hrms';
import { api } from './api';

export interface LeaveCategorySummary {
  quota: number;
  taken: number;
  pending: number;
  available: number;
}

export interface ResolvedLeaveQuotaSummary {
  casual: LeaveCategorySummary;
  sick: LeaveCategorySummary;
  paid: LeaveCategorySummary;
  total: LeaveCategorySummary;
  carryForwardLimit: number;
  hasConfiguredQuota: boolean;
  source: 'settings' | 'balances' | 'none';
}

export interface RawLeaveQuotaPayload {
  settings: any | null;
  balances: LeaveBalance | null;
}

const toNonNegativeNumber = (val: unknown): number => {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Number(num.toFixed(2));
};

const hasNumericValue = (val: unknown): boolean => {
  if (val === null || val === undefined || val === '') return false;
  return Number.isFinite(Number(val));
};

const unwrapData = (payload: any): any => {
  if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
    return payload.data;
  }
  return payload;
};

export const sumLeaveDaysByType = (
  leaves: LeaveRequest[],
  typeKeywords: string[],
  targetStatus: 'Approved' | 'Pending'
): number => {
  const total = leaves
    .filter((l) => {
      const type = (l.leaveType || '').toLowerCase();
      const status = (l.status || '').toLowerCase();
      const matchesType = typeKeywords.some((kw) => type.includes(kw.toLowerCase()));
      return matchesType && status === targetStatus.toLowerCase();
    })
    .reduce((sum, l) => {
      const count = Number(l.daysCount);
      if (Number.isFinite(count) && count > 0) return sum + count;
      return sum + (l.isHalfDay ? 0.5 : 1);
    }, 0);

  return Number(total.toFixed(2));
};

export const resolveLeaveQuotaSummary = (
  settingsPayload: any | null,
  balancePayload: any | null,
  employeeLeaves?: LeaveRequest[],
  leaveTypesList?: Array<{ name?: string; daysPerYear?: number; daysAllowed?: number }>
): ResolvedLeaveQuotaSummary => {
  const settingsObj = unwrapData(settingsPayload);
  const balanceObj = unwrapData(balancePayload);
  const lp = settingsObj?.leavePolicy;

  let casualQuota = 0;
  let sickQuota = 0;
  let paidQuota = 0;
  let carryForwardLimit = 0;
  let source: 'settings' | 'balances' | 'none' = 'none';

  const hasSettingsPolicy =
    lp &&
    typeof lp === 'object' &&
    (hasNumericValue(lp.casualLeaveAnnual) ||
      hasNumericValue(lp.sickLeaveAnnual) ||
      hasNumericValue(lp.paidLeaveAnnual));

  if (hasSettingsPolicy) {
    casualQuota = toNonNegativeNumber(lp.casualLeaveAnnual);
    sickQuota = toNonNegativeNumber(lp.sickLeaveAnnual);
    paidQuota = toNonNegativeNumber(lp.paidLeaveAnnual);
    carryForwardLimit = toNonNegativeNumber(lp.carryForwardLimit);
    source = 'settings';
  } else if (
    balanceObj &&
    typeof balanceObj === 'object' &&
    (balanceObj.casualLeave || balanceObj.sickLeave || balanceObj.paidLeave)
  ) {
    casualQuota = toNonNegativeNumber(balanceObj.casualLeave?.total);
    sickQuota = toNonNegativeNumber(balanceObj.sickLeave?.total);
    paidQuota = toNonNegativeNumber(balanceObj.paidLeave?.total);
    source = 'balances';
  }

  // Fallback to configured leave types from GET /leave-types if quota is still 0
  let otherQuota = 0;
  let otherTaken = 0;
  let otherPending = 0;

  if (Array.isArray(leaveTypesList) && leaveTypesList.length > 0) {
    const casualLt = leaveTypesList.find((lt) => (lt.name || '').toLowerCase().includes('casual'));
    if (casualQuota === 0 && casualLt) {
      casualQuota = toNonNegativeNumber(casualLt.daysPerYear ?? casualLt.daysAllowed);
      if (source === 'none') source = 'settings';
    }

    const sickLt = leaveTypesList.find(
      (lt) => (lt.name || '').toLowerCase().includes('sick') || (lt.name || '').toLowerCase().includes('med')
    );
    if (sickQuota === 0 && sickLt) {
      sickQuota = toNonNegativeNumber(sickLt.daysPerYear ?? sickLt.daysAllowed);
      if (source === 'none') source = 'settings';
    }

    const paidLt = leaveTypesList.find(
      (lt) =>
        (lt.name || '').toLowerCase().includes('paid') ||
        (lt.name || '').toLowerCase().includes('annual') ||
        (lt.name || '').toLowerCase().includes('earn')
    );
    if (paidQuota === 0 && paidLt) {
      paidQuota = toNonNegativeNumber(paidLt.daysPerYear ?? paidLt.daysAllowed);
      if (source === 'none') source = 'settings';
    }

    // Account for any other configured categories (e.g. Gwewef) in total quota
    const otherTypes = leaveTypesList.filter((lt) => {
      const n = (lt.name || '').toLowerCase();
      return (
        !n.includes('casual') &&
        !n.includes('sick') &&
        !n.includes('med') &&
        !n.includes('paid') &&
        !n.includes('annual') &&
        !n.includes('earn')
      );
    });

    for (const lt of otherTypes) {
      const q = toNonNegativeNumber(lt.daysPerYear ?? lt.daysAllowed);
      otherQuota += q;
      const tName = (lt.name || '').toLowerCase();
      const tk = employeeLeaves ? sumLeaveDaysByType(employeeLeaves, [tName], 'Approved') : 0;
      const pnd = employeeLeaves ? sumLeaveDaysByType(employeeLeaves, [tName], 'Pending') : 0;
      otherTaken += tk;
      otherPending += pnd;
    }
  }

  const casualTaken = employeeLeaves
    ? sumLeaveDaysByType(employeeLeaves, ['casual'], 'Approved')
    : toNonNegativeNumber(balanceObj?.casualLeave?.used);
  const casualPending = employeeLeaves
    ? sumLeaveDaysByType(employeeLeaves, ['casual'], 'Pending')
    : 0;
  const casualAvailable = toNonNegativeNumber(Math.max(0, casualQuota - casualTaken));

  const sickTaken = employeeLeaves
    ? sumLeaveDaysByType(employeeLeaves, ['sick', 'medical'], 'Approved')
    : toNonNegativeNumber(balanceObj?.sickLeave?.used);
  const sickPending = employeeLeaves
    ? sumLeaveDaysByType(employeeLeaves, ['sick', 'medical'], 'Pending')
    : 0;
  const sickAvailable = toNonNegativeNumber(Math.max(0, sickQuota - sickTaken));

  const paidTaken = employeeLeaves
    ? sumLeaveDaysByType(employeeLeaves, ['paid', 'annual', 'earned'], 'Approved')
    : toNonNegativeNumber(balanceObj?.paidLeave?.used);
  const paidPending = employeeLeaves
    ? sumLeaveDaysByType(employeeLeaves, ['paid', 'annual', 'earned'], 'Pending')
    : 0;
  const paidAvailable = toNonNegativeNumber(Math.max(0, paidQuota - paidTaken));

  const totalQuota = toNonNegativeNumber(casualQuota + sickQuota + paidQuota + otherQuota);
  const totalTaken = toNonNegativeNumber(casualTaken + sickTaken + paidTaken + otherTaken);
  const totalPending = toNonNegativeNumber(casualPending + sickPending + paidPending + otherPending);
  const totalAvailable = toNonNegativeNumber(casualAvailable + sickAvailable + paidAvailable + Math.max(0, otherQuota - otherTaken));

  return {
    casual: { quota: casualQuota, taken: casualTaken, pending: casualPending, available: casualAvailable },
    sick: { quota: sickQuota, taken: sickTaken, pending: sickPending, available: sickAvailable },
    paid: { quota: paidQuota, taken: paidTaken, pending: paidPending, available: paidAvailable },
    total: { quota: totalQuota, taken: totalTaken, pending: totalPending, available: totalAvailable },
    carryForwardLimit,
    hasConfiguredQuota: totalQuota > 0,
    source,
  };
};

export const fetchLeaveQuotaData = async (employeeId?: string): Promise<RawLeaveQuotaPayload> => {
  const validEmpId = employeeId && employeeId !== 'emp-self' ? employeeId : '';
  const [settings, balances] = await Promise.all([
    api.getSettings().catch(() => null),
    validEmpId ? api.getLeaveBalances(validEmpId).catch(() => null) : Promise.resolve(null),
  ]);
  return { settings, balances };
};

export interface LeaveTypeCardTheme {
  border: string;
  dot: string;
  title: string;
  badge: string;
  usedTag: string;
  progressBar: string;
}

export interface LeaveTypeCardItem {
  id: string;
  name: string;
  quota: number;
  taken: number;
  pending: number;
  available: number;
  badge: string;
  theme: LeaveTypeCardTheme;
}

export interface EmployeeLeaveBalanceResult {
  cards: LeaveTypeCardItem[];
  totalQuota: number;
  totalTaken: number;
  totalPending: number;
  totalAvailable: number;
  hasConfiguredTypes: boolean;
}

export const LEAVE_CARD_THEMES: LeaveTypeCardTheme[] = [
  {
    border: 'border-emerald-100',
    dot: 'bg-emerald-500',
    title: 'text-emerald-800',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    usedTag: 'text-emerald-700',
    progressBar: 'bg-emerald-500',
  },
  {
    border: 'border-amber-100',
    dot: 'bg-amber-500',
    title: 'text-amber-800',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    usedTag: 'text-amber-700',
    progressBar: 'bg-amber-500',
  },
  {
    border: 'border-violet-100',
    dot: 'bg-violet-600',
    title: 'text-violet-800',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    usedTag: 'text-violet-700',
    progressBar: 'bg-violet-600',
  },
  {
    border: 'border-indigo-100',
    dot: 'bg-indigo-600',
    title: 'text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    usedTag: 'text-indigo-600',
    progressBar: 'bg-indigo-600',
  },
];

export const calculateEmployeeLeaveBalances = (
  leaveTypes: Array<{
    id: string;
    name: string;
    daysPerYear?: number;
    daysAllowed?: number;
    code?: string;
    color?: string;
    isPaid?: boolean;
  }>,
  employeeLeaves: LeaveRequest[],
  quotaSettings?: any,
  quotaBalances?: any
): EmployeeLeaveBalanceResult => {
  const quotaSummary = resolveLeaveQuotaSummary(quotaSettings, quotaBalances, employeeLeaves);
  const CASUAL_QUOTA = quotaSummary.casual.quota;
  const SICK_QUOTA = quotaSummary.sick.quota;
  const PAID_QUOTA = quotaSummary.paid.quota;

  const validTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

  // Filter out invalid names and deduplicate by name
  const seen = new Set<string>();
  const unique = validTypes.filter((lt) => {
    const name = (lt.name || '').trim();
    if (!name || seen.has(name.toLowerCase())) return false;
    seen.add(name.toLowerCase());
    return true;
  });

  // Sort by highest daysAllowed/daysPerYear descending
  const sorted = [...unique].sort((a, b) => {
    const quotaA = Number((a as any).daysAllowed ?? (a as any).daysPerYear ?? 0);
    const quotaB = Number((b as any).daysAllowed ?? (b as any).daysPerYear ?? 0);
    return quotaB - quotaA;
  });

  let totalQuota = 0;
  let totalTaken = 0;
  let totalPending = 0;
  let totalAvailable = 0;

  const cards: LeaveTypeCardItem[] = sorted.map((lt, idx) => {
    const tName = (lt.name || '').trim().toLowerCase();

    let quota = 0;
    if (tName.includes('casual') && CASUAL_QUOTA > 0) {
      quota = CASUAL_QUOTA;
    } else if ((tName.includes('sick') || tName.includes('med')) && SICK_QUOTA > 0) {
      quota = SICK_QUOTA;
    } else if ((tName.includes('paid') || tName.includes('annual') || tName.includes('earn')) && PAID_QUOTA > 0) {
      quota = PAID_QUOTA;
    } else if (typeof (lt as any).daysAllowed === 'number' && (lt as any).daysAllowed > 0) {
      quota = (lt as any).daysAllowed;
    } else if (typeof (lt as any).daysPerYear === 'number' && (lt as any).daysPerYear >= 0) {
      quota = (lt as any).daysPerYear;
    } else {
      quota = 0;
    }

    const taken = (employeeLeaves || [])
      .filter((l) => {
        const lType = (l.leaveType || '').trim().toLowerCase();
        const isApproved = (l.status || '').toLowerCase() === 'approved';
        return isApproved && (lType === tName || lType.includes(tName) || tName.includes(lType));
      })
      .reduce((sum, l) => {
        const count = Number(l.daysCount);
        if (Number.isFinite(count) && count > 0) return sum + count;
        return sum + (l.isHalfDay ? 0.5 : 1);
      }, 0);

    const pending = (employeeLeaves || [])
      .filter((l) => {
        const lType = (l.leaveType || '').trim().toLowerCase();
        const isPending = (l.status || '').toLowerCase() === 'pending';
        return isPending && (lType === tName || lType.includes(tName) || tName.includes(lType));
      })
      .reduce((sum, l) => {
        const count = Number(l.daysCount);
        if (Number.isFinite(count) && count > 0) return sum + count;
        return sum + (l.isHalfDay ? 0.5 : 1);
      }, 0);

    const available = Math.max(0, quota - taken);

    totalQuota += quota;
    totalTaken += taken;
    totalPending += pending;
    totalAvailable += available;

    let badge = (lt as any).code || '';
    if (!badge) {
      if (tName.includes('casual')) badge = 'CASUAL';
      else if (tName.includes('sick') || tName.includes('med')) badge = 'MEDICAL';
      else if (tName.includes('paid') || tName.includes('annual')) badge = 'EARNED';
      else if (tName.includes('privilege')) badge = 'PRIVILEGE';
      else if ((lt as any).isPaid === false) badge = 'UNPAID';
      else badge = (lt.name || '').toUpperCase().slice(0, 10);
    }

    return {
      id: lt.id,
      name: lt.name,
      quota,
      taken,
      pending,
      available,
      badge,
      theme: LEAVE_CARD_THEMES[idx % LEAVE_CARD_THEMES.length],
    };
  });

  if (cards.length === 0 && quotaSummary.hasConfiguredQuota) {
    totalQuota = quotaSummary.total.quota;
    totalTaken = quotaSummary.total.taken;
    totalPending = quotaSummary.total.pending;
    totalAvailable = quotaSummary.total.available;
  }

  return {
    cards,
    totalQuota,
    totalTaken,
    totalPending,
    totalAvailable,
    hasConfiguredTypes: cards.length > 0,
  };
};
