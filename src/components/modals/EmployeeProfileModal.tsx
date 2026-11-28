'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Briefcase,
  CalendarCheck,
  CalendarOff,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Building2,
  Shield,
  Smartphone,
  Laptop,
  Camera,
  ShieldCheck,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRequest } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefinition } from '../../lib/roleConfig';
import { useModalOverlay } from '../../lib/useModalOverlay';
import { getTodayRecordForEmployee, getTodayDateString, parseTimeStringToTimestamp } from '../../lib/attendanceService';
import { compressImage, validateImageFile } from '../../lib/imageUtils';
import { api, clearApiCache } from '../../lib/api';
import { ProfilePhotoCard } from '../common/ProfilePhotoCard';
import {
  calculateEmployeeLeaveBalances,
  fetchLeaveQuotaData,
  resolveLeaveQuotaSummary,
  ResolvedLeaveQuotaSummary,
} from '../../lib/leaveQuotaUtils';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose?: () => void;
  onRefresh?: () => void;
  variant?: 'modal' | 'page';
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
  onRefresh,
  variant = 'modal',
}) => {
  const isPageMode = variant === 'page';
  const { portalMode, user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(employee);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoAccess, setPhotoAccess] = useState<{ canUpload: boolean; locked: boolean; requestStatus: string | null } | null>(null);
  const [requestingPhoto, setRequestingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditingEmp, setIsEditingEmp] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    address: '',
    role: 'EMPLOYEE',
    status: 'Active',
  });

  const openEditEmployee = () => {
    if (!currentEmp) return;
    setEditForm({
      firstName: currentEmp.firstName || '',
      lastName: currentEmp.lastName || '',
      email: currentEmp.email || '',
      phone: currentEmp.phone || '',
      gender: currentEmp.gender || 'Male',
      dateOfBirth: currentEmp.dateOfBirth ? String(currentEmp.dateOfBirth).slice(0, 10) : '',
      address: currentEmp.address || '',
      role: String(currentEmp.role || 'EMPLOYEE').toUpperCase(),
      status: currentEmp.status || 'Active',
    });
    setPhotoError(null);
    setPhotoSuccess(null);
    setIsEditingEmp(true);
  };

  const handleSaveEmployeeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;
    setSavingEmp(true);
    setPhotoError(null);
    try {
      await api.updateEmployee(currentEmp.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim() || null,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth || null,
        address: editForm.address.trim() || null,
        role: editForm.role,
        status: editForm.status,
      });
      clearApiCache('/attendance/events');
      setCurrentEmp((prev) =>
        prev
          ? {
              ...prev,
              firstName: editForm.firstName.trim(),
              lastName: editForm.lastName.trim(),
              email: editForm.email.trim().toLowerCase(),
              phone: editForm.phone.trim(),
              gender: editForm.gender as any,
              dateOfBirth: editForm.dateOfBirth || '',
              address: editForm.address.trim(),
              role: editForm.role as any,
              status: editForm.status as any,
            }
          : prev,
      );
      setIsEditingEmp(false);
      setPhotoSuccess('Employee details updated successfully.');
      window.dispatchEvent(new CustomEvent('hrms_employees_updated'));
      onRefresh?.();
    } catch (err: any) {
      setPhotoError(err?.message || 'Could not update employee details.');
    } finally {
      setSavingEmp(false);
    }
  };
  const [empLeaveSummary, setEmpLeaveSummary] = useState<ResolvedLeaveQuotaSummary | null>(null);
  const [empDynamicLeave, setEmpDynamicLeave] = useState<ReturnType<typeof calculateEmployeeLeaveBalances> | null>(null);
  const [empLeaveRequests, setEmpLeaveRequests] = useState<LeaveRequest[]>([]);
  const [empLeaveLoading, setEmpLeaveLoading] = useState(false);
  const [liveTodayRec, setLiveTodayRec] = useState<AttendanceRecord | null>(null);
  const [empAttendanceRecords, setEmpAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [empAttendanceLoading, setEmpAttendanceLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<{
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
  } | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
  });
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const resolveWorkedSeconds = (rec: AttendanceRecord): number => {
    const breakSecs =
      (typeof rec.breakSeconds === 'number' && rec.breakSeconds > 0 ? rec.breakSeconds : 0) ||
      (typeof rec.breakDurationMinutes === 'number' && rec.breakDurationMinutes > 0
        ? Math.round(rec.breakDurationMinutes * 60)
        : 0);

    if (typeof rec.activeSeconds === 'number' && rec.activeSeconds > 0) {
      return rec.activeSeconds;
    }

    if (rec.checkIn && rec.checkOut && rec.checkIn !== '—' && rec.checkOut !== '—') {
      const inTs = parseTimeStringToTimestamp(rec.checkIn, rec.date, rec.createdAt);
      const outTs = parseTimeStringToTimestamp(rec.checkOut, rec.date);
      if (inTs > 0 && outTs > inTs) {
        const gross = Math.max(0, Math.floor((outTs - inTs) / 1000));
        return Math.max(0, gross - breakSecs);
      }
    }

    const totalHoursRaw = String((rec as any).totalHours || '').trim();
    if (totalHoursRaw && totalHoursRaw !== '00:00' && totalHoursRaw !== '00:00:00') {
      const parts = totalHoursRaw.split(':').map((n) => Number(n));
      if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
        return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
      }
    }

    if (!rec.isCompleted && !rec.checkOut && rec.checkIn && rec.checkIn !== '—' && !rec.isOnBreak) {
      const inTs = parseTimeStringToTimestamp(rec.checkIn, rec.date, rec.createdAt);
      if (inTs > 0 && Date.now() > inTs) {
        const gross = Math.floor((Date.now() - inTs) / 1000);
        return Math.max(0, gross - breakSecs);
      }
    }

    return 0;
  };

  const formatWorkedDuration = (rec: AttendanceRecord): string => {
    const totalSecs = resolveWorkedSeconds(rec);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return mins > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min` : `${hrs} hr${hrs > 1 ? 's' : ''}`;
    }
    if (mins > 0) {
      return secs > 0 ? `${mins} min ${secs}s` : `${mins} min`;
    }
    return `${secs}s`;
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  React.useEffect(() => {
    setCurrentEmp(employee);
  }, [employee]);

  const isOwnProfile = Boolean(
    currentEmp && (
      (user?.email && user.email.toLowerCase() === currentEmp.email?.toLowerCase()) ||
      (user?.id && (user.id === currentEmp.id || user.id === currentEmp.userId)) ||
      (user?.employeeId && user.employeeId === currentEmp.id)
    ),
  );

  const canManageOwnBank =
    isOwnProfile && ['HR', 'MANAGER', 'EMPLOYEE'].includes(String(user?.role || '').toUpperCase());

  useEffect(() => {
    if ((!isPageMode && !isOpen) || !canManageOwnBank) return;
    let active = true;
    setBankLoading(true);
    setBankError(null);
    api.getBankDetails()
      .then((data) => {
        if (!active) return;
        setBankDetails(data?.bank || null);
      })
      .catch((err: any) => {
        if (!active) return;
        setBankError(err?.message || 'Could not load bank details.');
      })
      .finally(() => {
        if (active) setBankLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isPageMode, canManageOwnBank]);

  useEffect(() => {
    if (!isOpen || !isOwnProfile) return;
    let active = true;
    api.getPhotoAccess()
      .then((access) => { if (active) setPhotoAccess(access); })
      .catch(() => { if (active) setPhotoAccess(null); });
    return () => { active = false; };
  }, [isOpen, isOwnProfile, currentEmp?.avatarUrl]);

  React.useEffect(() => {
    if ((!isOpen && !isPageMode) || !currentEmp) return;
    let active = true;
    const loadEmployeeAttendance = async () => {
      setEmpAttendanceLoading(true);
      try {
        const allRecords = await api.getAttendance().catch(() => [] as AttendanceRecord[]);
        if (!active) return;

        const candIds = [
          currentEmp.id,
          (currentEmp as any)._id,
          currentEmp.userId,
          currentEmp.employeeCode,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        const fullName = `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim().toLowerCase();

        const matchesEmp = (r: AttendanceRecord) => {
          const rEmpId = String(r.employeeId || '').toLowerCase();
          const rUserId = String((r as any).userId || '').toLowerCase();
          const rCode = String((r as any).employeeCode || '').toLowerCase();
          if (candIds.includes(rEmpId) || candIds.includes(rUserId) || candIds.includes(rCode)) return true;
          if (fullName && r.employeeName && r.employeeName.toLowerCase().trim() === fullName) return true;
          return false;
        };

        const empRecs = (Array.isArray(allRecords) ? allRecords : [])
          .filter(matchesEmp)
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        const today = getTodayDateString();
        const todayMatch = empRecs.find((r) => r.date === today) || null;
        setLiveTodayRec(todayMatch);
        setEmpAttendanceRecords(empRecs.slice(0, 10));
      } catch (_) {
        if (active) {
          setLiveTodayRec(null);
          setEmpAttendanceRecords([]);
        }
      } finally {
        if (active) setEmpAttendanceLoading(false);
      }
    };
    loadEmployeeAttendance();
    return () => {
      active = false;
    };
  }, [isOpen, isPageMode, currentEmp]);

  React.useEffect(() => {
    if ((!isOpen && !isPageMode) || !currentEmp) return;
    const profileRole = String(currentEmp.role || '').toUpperCase();
    if (['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(profileRole)) {
      setEmpLeaveSummary(null);
      setEmpDynamicLeave(null);
      setEmpLeaveRequests([]);
      setEmpLeaveLoading(false);
      return;
    }
    let active = true;
    const loadEmployeeLeaves = async () => {
      setEmpLeaveLoading(true);
      try {
        const targetId = currentEmp.id || currentEmp.userId || '';
        const candIds = [
          currentEmp.id,
          (currentEmp as any)._id,
          currentEmp.userId,
          currentEmp.employeeCode,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        const targetEmail = currentEmp.email?.toLowerCase() || '';
        const targetName = `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim().toLowerCase();
        const compId = (user as any)?.companyId || (currentEmp as any)?.companyId || '';

        const [quotaPayload, rawLeaves, rawLeaveTypes] = await Promise.all([
          fetchLeaveQuotaData(targetId),
          api.getLeaves().catch(() => [] as LeaveRequest[]),
          api.listLeaveTypes(compId ? { companyId: compId } : undefined).catch(() => []),
        ]);
        if (!active) return;

        const allLeaves = Array.isArray(rawLeaves) ? rawLeaves : [];
        const empLeaves = allLeaves.filter((l) => {
          const lEmpId = String(l.employeeId || '').toLowerCase();
          const lUserId = String((l as any).userId || '').toLowerCase();
          if (lEmpId && candIds.includes(lEmpId)) return true;
          if (lUserId && candIds.includes(lUserId)) return true;
          if (targetEmail && (l as any).employeeEmail?.toLowerCase() === targetEmail) return true;
          if (targetName && l.employeeName?.toLowerCase().trim() === targetName) return true;
          return false;
        });

        const leaveTypesList = Array.isArray(rawLeaveTypes) ? rawLeaveTypes : [];
        setEmpLeaveRequests(empLeaves);
        setEmpLeaveSummary(
          resolveLeaveQuotaSummary(quotaPayload.settings, quotaPayload.balances, empLeaves, leaveTypesList)
        );
        setEmpDynamicLeave(
          calculateEmployeeLeaveBalances(leaveTypesList, empLeaves, quotaPayload.settings, quotaPayload.balances)
        );
      } catch (_) {
        if (active) {
          setEmpLeaveSummary(null);
          setEmpDynamicLeave(null);
          setEmpLeaveRequests([]);
        }
      } finally {
        if (active) setEmpLeaveLoading(false);
      }
    };
    loadEmployeeLeaves();
    return () => {
      active = false;
    };
  }, [isOpen, isPageMode, currentEmp, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentEmp) return;
    setPhotoError(null);
    setPhotoSuccess(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid image file.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const role = String(user?.role || '').toUpperCase();
      const skipFace = role === 'ADMIN' || role === 'SUPER_ADMIN';
      const faceDescriptor = skipFace ? null : await (await import('../../lib/faceMatch')).assertFaceInPhoto(file);
      const saved = await api.uploadProfilePhoto(file, faceDescriptor);
      const newAvatarUrl = saved.avatarUrl || '';
      if (!newAvatarUrl) throw new Error('Profile photo was not saved.');
      setCurrentEmp((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));
      setPhotoAccess({ canUpload: false, locked: true, requestStatus: 'Used' });

      // If logged in user is this employee (or updating their own profile)
      const isSelf =
        (user.email && user.email.toLowerCase() === currentEmp.email?.toLowerCase()) ||
        (user.id && (user.id === currentEmp.id || user.id === currentEmp.userId)) ||
        (user.employeeId && user.employeeId === currentEmp.id);

      if (isSelf) {
        updateUserProfile({ avatarUrl: newAvatarUrl, photoChangeAllowed: false });
      }

      window.dispatchEvent(new Event('hrms_employees_updated'));
      onRefresh?.();
      setPhotoSuccess('Profile picture updated successfully!');
      setTimeout(() => setPhotoSuccess(null), 3500);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to update profile picture.');
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentEmp) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    setPhotoSuccess(null);
    try {
      if (String(user?.role || currentEmp.role || '').toUpperCase() === 'EMPLOYEE') {
        throw new Error('Employees cannot remove the profile photo.');
      }
      setCurrentEmp((prev) => (prev ? { ...prev, avatarUrl: '' } : null));

      const isSelf =
        (user.email && user.email.toLowerCase() === currentEmp.email?.toLowerCase()) ||
        (user.id && (user.id === currentEmp.id || user.id === currentEmp.userId)) ||
        (user.employeeId && user.employeeId === currentEmp.id);

      if (isSelf) {
        updateUserProfile({ avatarUrl: '' });
      }

      window.dispatchEvent(new Event('hrms_employees_updated'));
      onRefresh?.();
      setPhotoSuccess('Profile picture removed.');
      setTimeout(() => setPhotoSuccess(null), 3000);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to remove picture.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useModalOverlay({
    isOpen: !isPageMode && isOpen,
    onClose: () => onClose?.(),
  });

  if ((!isPageMode && !isOpen) || !employee || !currentEmp) return null;

  const roleDef = getRoleDefinition(currentEmp.role || 'EMPLOYEE');
  const isCurrentUser = Boolean(
    user && currentEmp && (
      Boolean(user.email && currentEmp.email && user.email.toLowerCase() === currentEmp.email.toLowerCase()) ||
      Boolean(user.employeeId && (currentEmp.id === user.employeeId || (currentEmp as any).employeeId === user.employeeId)) ||
      Boolean(user.id && (currentEmp.id === user.id || (currentEmp as any).userId === user.id))
    )
  );

  const hasSalaryData = Boolean(
    currentEmp?.salary &&
      (Number(currentEmp.salary.net || 0) > 0 ||
        Number(currentEmp.salary.gross || 0) > 0 ||
        Number(currentEmp.salary.basic || 0) > 0 ||
        Number(currentEmp.salary.hra || 0) > 0 ||
        Number(currentEmp.salary.allowances || 0) > 0)
  );

  const profileRole = String(currentEmp.role || '').toUpperCase();
  const showLeave = !['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(profileRole);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal & Photo', icon: UserCheck },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    ...(showLeave ? [{ id: 'leave', label: 'Leave', icon: CalendarOff }] : []),
    ...(canManageOwnBank ? [{ id: 'bank', label: 'Bank Details', icon: CreditCard }] : []),
    ...(hasSalaryData ? [{ id: 'payroll', label: 'Salary', icon: CreditCard }] : []),
  ];

  const effectiveTab = tabs.some((t) => t.id === activeTab) ? activeTab : 'overview';

  const firstLetter = (currentEmp.firstName || 'E').trim().charAt(0).toUpperCase();
  const lastLetter = (currentEmp.lastName || '').trim().charAt(0).toUpperCase();
  const initials = lastLetter ? `${firstLetter}${lastLetter}` : firstLetter || 'EMP';
  const designationSubtitle = [currentEmp.designationTitle, currentEmp.departmentName]
    .map((s) => (s || '').trim())
    .filter((s) => s && s !== '.' && s !== '-')
    .join(' • ');

  const profileCardContent = (
    <div
      onClick={(e) => {
        if (!isPageMode) e.stopPropagation();
      }}
      className={
        isPageMode
          ? 'bg-white rounded-2xl w-full shadow-sm flex flex-col border border-slate-200 overflow-hidden cursor-default'
          : 'bg-white rounded-2xl sm:rounded-3xl w-full max-w-[min(896px,calc(100vw-24px))] sm:max-w-[min(896px,calc(100vw-48px))] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)] shadow-2xl flex flex-col border border-slate-200/80 overflow-hidden cursor-default my-auto animate-modal-zoom'
      }
    >
      {/* â•â•â• CLEAN HEADER: AVATAR, IDENTITY & CONTACT ROW â•â•â• */}
      <div className="p-4 sm:p-6 bg-white border-b border-slate-100 shrink-0">
        {/* Status Message Banners */}
        {photoSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{photoSuccess}</span>
            </div>
            <button
              onClick={() => setPhotoSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {photoError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{photoError}</span>
            </div>
            <button
              onClick={() => setPhotoError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold text-sm cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Avatar + Details */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar with Camera Overlay */}
            <div className="relative group/avatar shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#1b4332] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-md overflow-hidden tracking-wider select-none">
                {currentEmp.avatarUrl ? (
                  <img
                    src={currentEmp.avatarUrl}
                    alt={currentEmp.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Status Indicator */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-white shadow-xs ${(currentEmp.status || 'Active').toLowerCase() === 'active'
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                  }`}
                title={`Status: ${currentEmp.status || 'Active'}`}
              />

              {/* Camera Upload Overlay */}
              <label
                className={`absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center transition-opacity backdrop-blur-2xs ${uploadingPhoto ? 'opacity-100 pointer-events-none' : 'opacity-0 group-hover/avatar:opacity-100 cursor-pointer'
                  }`}
                title="Change profile picture"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 stroke-[2.2]" />
                    <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingPhoto}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Identity Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize truncate">
                  {currentEmp.firstName} {currentEmp.lastName}
                </h2>

                {currentEmp.employeeCode && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentEmp.employeeCode || '', 'code')}
                    className="group font-mono text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                    title="Click to copy employee ID"
                  >
                    <span>{currentEmp.employeeCode}</span>
                    {copiedKey === 'code' ? (
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleDef.badgeClass}`}
                >
                  <Shield className="w-3 h-3" />
                  <span>{roleDef.label}</span>
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${(currentEmp.status || 'Active').toLowerCase() === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${(currentEmp.status || 'Active').toLowerCase() === 'active'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-rose-500'
                      }`}
                  />
                  {currentEmp.status || 'Active'}
                </span>
              </div>

              {/* Subtitle: Designation & Department */}
              <p className="text-slate-500 text-xs font-medium mt-1 truncate">
                {designationSubtitle || (currentEmp.companyName ? `Staff Member • ${currentEmp.companyName}` : 'Staff Member')}
              </p>

              {/* Contact items row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                {currentEmp.email && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentEmp.email, 'email')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer truncate max-w-[260px]"
                    title="Click to copy email"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentEmp.email}</span>
                    {copiedKey === 'email' && <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />}
                  </button>
                )}

                {currentEmp.phone && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentEmp.phone || '', 'phone')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                    title="Click to copy phone"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentEmp.phone}</span>
                    {copiedKey === 'phone' && <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />}
                  </button>
                )}

                {currentEmp.workLocationName && (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentEmp.workLocationName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions & Close Button */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {portalMode === 'admin' && (
              <button
                type="button"
                onClick={() => (isEditingEmp ? setIsEditingEmp(false) : openEditEmployee())}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isEditingEmp
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isEditingEmp ? 'Cancel Edit' : 'Edit Details'}
              </button>
            )}
            {!isPageMode && onClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {isEditingEmp && portalMode === 'admin' && (
          <form onSubmit={handleSaveEmployeeEdit} className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">First Name</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Date of Birth (Birthday)</label>
              <input
                type="date"
                value={editForm.dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Gender</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingEmp(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEmp}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold disabled:opacity-50 cursor-pointer"
              >
                {savingEmp ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* â•â•â• CLEAN HORIZONTAL NAVIGATION TABS â•â•â• */}
      <div className="relative border-b border-slate-100 bg-[#f8fafc] shrink-0 flex items-center px-2 sm:px-3">
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="hidden sm:flex items-center justify-center w-7 h-7 mx-0.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors shrink-0 shadow-2xs border border-transparent hover:border-slate-200 cursor-pointer"
          title="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsRef}
          className="flex-1 overflow-x-auto scroll-smooth py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const isActive = effectiveTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    setActiveTab(tab.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                  }}
                  className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${isActive
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="hidden sm:flex items-center justify-center w-7 h-7 mx-0.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors shrink-0 shadow-2xs border border-transparent hover:border-slate-200 cursor-pointer"
          title="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* â•â•â• TAB CONTENT BODY â•â•â• */}
      <div className={`${isPageMode ? 'p-4 sm:p-6' : 'flex-1 overflow-y-auto p-4 sm:p-6'} text-xs text-slate-700 space-y-5 bg-white`}>
        {/* ── 1. Overview (Only real, non-empty employee data) ── */}
        {effectiveTab === 'overview' && (() => {
          const overviewFields = [
            { label: 'Company', value: currentEmp.companyName },
            { label: 'Department', value: currentEmp.departmentName },
            { label: 'Designation', value: currentEmp.designationTitle },
            { label: 'Employment Type', value: currentEmp.employmentType },
            { label: 'Joining Date', value: currentEmp.joiningDate },
            { label: 'Assigned Shift', value: currentEmp.shift },
            { label: 'Work Location', value: currentEmp.workLocationName },
            { label: 'Reporting Manager', value: currentEmp.reportingManagerName },
            { label: 'Gender', value: currentEmp.gender },
            { label: 'Date of Birth', value: currentEmp.dateOfBirth },
            { label: 'Address', value: currentEmp.address },
          ].filter((item) => item.value && String(item.value).trim() !== '' && item.value !== '—');

          return (
            <div className="space-y-4">
              {hasSalaryData && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Net Monthly Salary</span>
                    <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                      ₹{(currentEmp?.salary?.net ?? 0).toLocaleString()}
                    </p>
                  </div>
                  {(currentEmp?.salary?.gross ?? currentEmp?.salary?.basic ?? 0) > 0 && (
                    <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-200/70">
                      Gross: ₹{(currentEmp?.salary?.gross ?? currentEmp?.salary?.basic ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {overviewFields.length > 0 ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#1b4332]" />
                    <span>Employee Details</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {overviewFields.map((field) => (
                      <div
                        key={field.label}
                        className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all min-w-0"
                      >
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{field.label}</span>
                        <span className="font-bold text-slate-800 text-sm break-words block">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No additional profile details recorded yet. Use the tabs above to manage photo, attendance, or leaves.
                </div>
              )}

              {(currentEmp?.skills || []).length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentEmp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 2. Personal Information & Photo ── */}
        {effectiveTab === 'personal' && (() => {
          const personalFields = [
            { label: 'Full Name', value: `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim() },
            { label: 'Email', value: currentEmp.email },
            { label: 'Phone', value: currentEmp.phone },
            { label: 'Date of Birth', value: currentEmp.dateOfBirth },
            { label: 'Gender', value: currentEmp.gender },
            { label: 'Residential Address', value: currentEmp.address, fullSpan: true },
            {
              label: 'Emergency Contact',
              value: currentEmp?.emergencyContact?.name
                ? `${currentEmp.emergencyContact.name}${currentEmp.emergencyContact.relationship ? ` (${currentEmp.emergencyContact.relationship})` : ''}${currentEmp.emergencyContact.phone ? ` — ${currentEmp.emergencyContact.phone}` : ''}`
                : '',
              fullSpan: true,
            },
          ].filter((f) => f.value && String(f.value).trim() !== '');

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {isOwnProfile && ['EMPLOYEE', 'HR', 'MANAGER'].includes(String(user?.role || '').toUpperCase()) && (
                <div className="col-span-1 sm:col-span-2">
                  <ProfilePhotoCard />
                </div>
              )}
              {/* Profile Photo Management Card */}
              <div className="col-span-1 sm:col-span-2 p-4 sm:p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    {currentEmp.avatarUrl ? (
                      <img src={currentEmp.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#1b4332] font-bold text-lg">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">Profile Picture</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      PNG, JPG, JPEG, WEBP supported.
                    </p>
                  </div>
                </div>

                {!(isOwnProfile && ['EMPLOYEE', 'HR', 'MANAGER'].includes(String(user?.role || '').toUpperCase())) && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!isOwnProfile && ['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(String(user?.role || '').toUpperCase()) && (
                    <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs shadow-xs cursor-pointer">
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>Change employee photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingPhoto}
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file || !currentEmp) return;
                          const employeeId = currentEmp.id || currentEmp.userId;
                          if (!employeeId) return;
                          setUploadingPhoto(true);
                          setPhotoError(null);
                          setPhotoSuccess(null);
                          try {
                            const saved = await api.uploadEmployeePhoto(employeeId, file);
                            if (!saved.avatarUrl) throw new Error('Profile photo was not saved.');
                            setCurrentEmp((prev) => (prev ? { ...prev, avatarUrl: saved.avatarUrl } : null));
                            window.dispatchEvent(new Event('hrms_employees_updated'));
                            onRefresh?.();
                            setPhotoSuccess('Employee profile photo updated.');
                          } catch (err: unknown) {
                            setPhotoError(err instanceof Error ? err.message : 'Could not change the employee photo.');
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }}
                      />
                    </label>
                  )}
                  {isOwnProfile && (photoAccess ? photoAccess.canUpload : !(['EMPLOYEE', 'HR', 'MANAGER'].includes(String(user?.role || '').toUpperCase()) && Boolean(currentEmp.avatarUrl))) ? (
                    <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs shadow-xs cursor-pointer transition active:scale-95">
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{currentEmp.avatarUrl ? 'Upload approved photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingPhoto}
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      disabled={requestingPhoto || photoAccess?.requestStatus === 'Pending'}
                      onClick={async () => {
                        setRequestingPhoto(true);
                        setPhotoError(null);
                        try {
                          const result = await api.requestPhotoChange();
                          setPhotoSuccess(result.message);
                          const access = await api.getPhotoAccess();
                          setPhotoAccess(access);
                        } catch (err: any) {
                          setPhotoError(err.message || 'Could not request a photo change.');
                        } finally {
                          setRequestingPhoto(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                    >
                      {photoAccess?.requestStatus === 'Pending' ? 'Waiting for admin approval' : 'Ask admin to change photo'}
                    </button>
                  ) : null}
                  {isOwnProfile && currentEmp.avatarUrl && !photoAccess?.locked && !['EMPLOYEE', 'HR', 'MANAGER'].includes(String(user?.role || '').toUpperCase()) && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingPhoto}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 transition active:scale-95 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                )}
              </div>

              {personalFields.map((field) => (
                <div
                  key={field.label}
                  className={`${field.fullSpan ? 'col-span-1 sm:col-span-2' : ''} p-4 rounded-2xl bg-slate-50 border border-slate-200/80 min-w-0`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-400">{field.label}</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 break-words">{field.value}</p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── 3. Employment ── */}
        {effectiveTab === 'employment' && (() => {
          const employmentFields = [
            { label: 'Employee ID', value: currentEmp.employeeCode },
            { label: 'Company', value: currentEmp.companyName },
            { label: 'Department', value: currentEmp.departmentName },
            { label: 'Designation', value: currentEmp.designationTitle },
            { label: 'Reporting Manager', value: currentEmp.reportingManagerName },
            { label: 'Assigned Shift', value: currentEmp.shift },
            { label: 'Employment Type', value: currentEmp.employmentType },
            { label: 'Joining Date', value: currentEmp.joiningDate },
            { label: 'Work Location', value: currentEmp.workLocationName },
          ].filter((f) => f.value && String(f.value).trim() !== '');

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400">System Role</span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${roleDef.badgeClass}`}>
                        <Shield className="w-3.5 h-3.5" />
                        <span>{roleDef.label}</span>
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{roleDef.description}</span>
                    </div>
                  </div>
                </div>

                {employmentFields.map((field) => (
                  <div key={field.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400">{field.label}</span>
                    <p className="text-sm font-bold text-slate-900 mt-1 break-words">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── 4. Attendance ── */}
        {effectiveTab === 'attendance' && (() => {
          const todayRec = liveTodayRec || getTodayRecordForEmployee(currentEmp.id);
          return (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1b4332]" />
                  <span>Today's Work Shift Status</span>
                </h4>
                {empAttendanceLoading && !todayRec ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2d6a4f]" />
                    <span>Loading live attendance...</span>
                  </div>
                ) : todayRec ? (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-900 text-xs">
                        {todayRec.date} • {(todayRec.isCompleted || (todayRec.checkOut && todayRec.checkOut !== '—')) ? 'Shift Completed' : todayRec.isOnBreak ? 'On Break' : 'Active Working'}
                      </span>
                      <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {formatWorkedDuration(todayRec)} Worked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Clock In Time</span>
                        <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{todayRec.checkIn || '—'}</p>
                        {todayRec.checkInPhoto && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={todayRec.checkInPhoto}
                              alt="Check-in selfie"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Selfie Verified
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Clock Out Time</span>
                        <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{todayRec.checkOut || 'Pending'}</p>
                        {todayRec.checkOutPhoto && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={todayRec.checkOutPhoto}
                              alt="Check-out selfie"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                            <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Selfie Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Device Hardware Info Card */}
                    {todayRec.checkInDevice && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                          {todayRec.checkInDevice.deviceType === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          Punch Device Hardware Detected
                        </span>
                        <p className="font-bold text-slate-900">
                          {todayRec.checkInDevice.deviceModel} ({todayRec.checkInDevice.deviceType})
                        </p>
                        <p className="text-[11px] font-mono text-slate-600">
                          {todayRec.checkInDevice.os} • {todayRec.checkInDevice.browser} • {todayRec.checkInDevice.screenResolution}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No clock-in recorded for today yet.
                  </div>
                )}
              </div>

              {empAttendanceRecords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2">
                    Recent Attendance Logs ({empAttendanceRecords.length})
                  </h4>
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
                    {empAttendanceRecords.slice(0, 5).map((rec) => (
                      <div key={rec.id || rec.date} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{rec.date}</p>
                          <p className="text-[11px] text-slate-500">
                            {rec.checkIn || '—'} – {rec.checkOut || (rec.isCompleted ? '—' : 'Working')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-slate-800 block">
                            {formatWorkedDuration(rec)}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            {rec.status || ((rec.isCompleted || (rec.checkOut && rec.checkOut !== '—')) ? 'Completed' : rec.isOnBreak ? 'On Break' : 'Working')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 5. Leave ── */}
        {effectiveTab === 'leave' && (
          <div className="space-y-4">
            {empLeaveLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                    <div className="h-3 w-20 mx-auto bg-slate-200 rounded" />
                    <div className="h-6 w-16 mx-auto bg-slate-200 rounded" />
                    <div className="h-3 w-24 mx-auto bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : empDynamicLeave?.hasConfiguredTypes && empDynamicLeave.cards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {empDynamicLeave.cards.map((card) => (
                  <div key={card.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">{card.name}</span>
                    <p className="text-xl font-extrabold text-[#1b4332] mt-1">{card.available} Left</p>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {card.taken} Used / {card.quota} Total
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Casual Leave</span>
                  <p className="text-xl font-extrabold text-blue-700 mt-1">
                    {empLeaveSummary ? `${empLeaveSummary.casual.available} Left` : '0 Left'}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {empLeaveSummary
                      ? `${empLeaveSummary.casual.taken} Used / ${empLeaveSummary.casual.quota} Total`
                      : '0 Used / 0 Total'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Sick Leave</span>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">
                    {empLeaveSummary ? `${empLeaveSummary.sick.available} Left` : '0 Left'}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {empLeaveSummary
                      ? `${empLeaveSummary.sick.taken} Used / ${empLeaveSummary.sick.quota} Total`
                      : '0 Used / 0 Total'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Paid / Annual</span>
                  <p className="text-xl font-extrabold text-purple-700 mt-1">
                    {empLeaveSummary ? `${empLeaveSummary.paid.available} Left` : '0 Left'}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {empLeaveSummary
                      ? `${empLeaveSummary.paid.taken} Used / ${empLeaveSummary.paid.quota} Total`
                      : '0 Used / 0 Total'}
                  </span>
                </div>
              </div>
            )}

            {!empLeaveLoading && empLeaveRequests.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2">
                  Recent Leave Requests ({empLeaveRequests.length})
                </h4>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
                  {empLeaveRequests.slice(0, 5).map((lv) => (
                    <div key={lv.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{lv.leaveType}</p>
                        <p className="text-[11px] text-slate-500">
                          {lv.startDate}{lv.endDate && lv.endDate !== lv.startDate ? ` – ${lv.endDate}` : ''} ({lv.daysCount || 1}d)
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                          lv.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lv.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {lv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 6. Salary ── */}
        {effectiveTab === 'payroll' && hasSalaryData && (
          <div className="space-y-3">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3">Salary Breakdown</h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <span className="text-slate-500">Basic Salary:</span>
                <span className="font-bold">₹{(currentEmp?.salary?.basic ?? 0).toLocaleString()}</span>
                <span className="text-slate-500">HRA Allowance:</span>
                <span className="font-bold">₹{(currentEmp?.salary?.hra ?? 0).toLocaleString()}</span>
                <span className="text-slate-500">Special Allowances:</span>
                <span className="font-bold">₹{(currentEmp?.salary?.allowances ?? 0).toLocaleString()}</span>
                <span className="text-slate-500">PF Deduction:</span>
                <span className="font-bold text-rose-500">-₹{(currentEmp?.salary?.pf ?? 0).toLocaleString()}</span>
                <span className="text-slate-500">Net Take-Home:</span>
                <span className="font-extrabold text-emerald-600 text-sm">₹{(currentEmp?.salary?.net ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Bank Details (One-time add, then read-only) ── */}
        {effectiveTab === 'bank' && canManageOwnBank && (
          <div className="space-y-4">
            {bankSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{bankSuccess}</span>
              </div>
            )}
            {bankError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{bankError}</span>
              </div>
            )}

            {bankLoading ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#2d6a4f]" />
                <span>Loading bank details...</span>
              </div>
            ) : bankDetails ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#1b4332]" />
                    <h4 className="font-bold text-slate-900 text-sm">Saved Bank Account</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Saved
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bank Name</span>
                    <span className="font-bold text-slate-800 text-sm">{bankDetails.bankName || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Account Holder</span>
                    <span className="font-bold text-slate-800 text-sm">{bankDetails.accountHolderName || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Account Number</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{bankDetails.accountNumber || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{bankDetails.ifsc || '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBankSaving(true);
                  setBankError(null);
                  setBankSuccess(null);
                  try {
                    const res = await api.saveBankDetails(bankForm);
                    setBankDetails(res?.bank || { ...bankForm });
                    setBankSuccess('Bank details saved successfully.');
                  } catch (err: any) {
                    setBankError(err?.message || 'Could not save bank details.');
                  } finally {
                    setBankSaving(false);
                  }
                }}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#1b4332]" />
                    <span>Add Bank Details</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    One bank account only. Once saved, it cannot be added again.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))}
                      placeholder="e.g. HDFC Bank"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                      placeholder="Name as per bank passbook"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))}
                      placeholder="Enter account number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-semibold focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={bankForm.ifsc}
                      onChange={(e) => setBankForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                      placeholder="e.g. HDFC0001234"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-semibold uppercase focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={bankSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                  >
                    {bankSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{bankSaving ? 'Saving...' : 'Save Bank Details'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isPageMode) {
    return (
      <div className="space-y-5 w-full">
        {profileCardContent}
      </div>
    );
  }

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/25 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer animate-in fade-in"
    >
      {profileCardContent}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
