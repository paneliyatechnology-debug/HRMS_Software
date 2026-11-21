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
  employeeLeaves?: LeaveRequest[]
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

  const totalQuota = toNonNegativeNumber(casualQuota + sickQuota + paidQuota);
  const totalTaken = toNonNegativeNumber(casualTaken + sickTaken + paidTaken);
  const totalPending = toNonNegativeNumber(casualPending + sickPending + paidPending);
  const totalAvailable = toNonNegativeNumber(casualAvailable + sickAvailable + paidAvailable);

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
