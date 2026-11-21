'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Briefcase,
  CalendarCheck,
  CalendarOff,
  CreditCard,
  FileText,
  TrendingUp,
  GraduationCap,
  HardDrive,
  History,
  Phone,
  Mail,
  MapPin,
  Building,
  Shield,
  Download,
  Smartphone,
  Laptop,
  Tablet,
  Camera,
  ShieldCheck,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Employee, LeaveRequest } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefinition } from '../../lib/roleConfig';
import { ChangeRoleModal } from './ChangeRoleModal';
import { useModalOverlay } from '../../lib/useModalOverlay';
import { getTodayRecordForEmployee, formatSecondsToHMS } from '../../lib/attendanceService';
import { compressImage, validateImageFile } from '../../lib/imageUtils';
import { api } from '../../lib/api';
import {
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
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(employee);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [empLeaveSummary, setEmpLeaveSummary] = useState<ResolvedLeaveQuotaSummary | null>(null);
  const [empLeaveLoading, setEmpLeaveLoading] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    setCurrentEmp(employee);
  }, [employee]);

  React.useEffect(() => {
    if (!isOpen || !currentEmp) return;
    let active = true;
    const loadEmployeeLeaves = async () => {
      setEmpLeaveLoading(true);
      try {
        const targetId = currentEmp.id || currentEmp.userId || '';
        const targetEmail = currentEmp.email?.toLowerCase() || '';
        const targetName = `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim().toLowerCase();

        const [quotaPayload, rawLeaves] = await Promise.all([
          fetchLeaveQuotaData(targetId),
          api.getLeaves(targetId ? { employeeId: targetId } : undefined).catch(() => [] as LeaveRequest[]),
        ]);
        if (!active) return;

        const allLeaves = Array.isArray(rawLeaves) ? rawLeaves : [];
        const empLeaves = allLeaves.filter((l) => {
          if (targetId && l.employeeId === targetId) return true;
          if (targetEmail && (l as any).employeeEmail?.toLowerCase() === targetEmail) return true;
          if (targetName && l.employeeName?.toLowerCase() === targetName) return true;
          return false;
        });

        setEmpLeaveSummary(
          resolveLeaveQuotaSummary(quotaPayload.settings, quotaPayload.balances, empLeaves)
        );
      } catch (_) {
        if (active) setEmpLeaveSummary(null);
      } finally {
        if (active) setEmpLeaveLoading(false);
      }
    };
    loadEmployeeLeaves();
    return () => {
      active = false;
    };
  }, [isOpen, currentEmp]);

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
      let newAvatarUrl = '';
      try {
        const res = await api.uploadProfilePhoto(file);
        if (res.avatarUrl) newAvatarUrl = res.avatarUrl;
      } catch (uploadErr) {
        console.warn('Backend photo upload failed, using local compression fallback:', uploadErr);
      }

      if (!newAvatarUrl) {
        newAvatarUrl = await compressImage(file, 400, 400, 0.88);
      }

      await api.updateEmployee(currentEmp.id, { avatarUrl: newAvatarUrl });
      setCurrentEmp((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));

      // If logged in user is this employee (or updating their own profile)
      const isSelf =
        (user.email && user.email.toLowerCase() === currentEmp.email?.toLowerCase()) ||
        (user.id && (user.id === currentEmp.id || user.id === currentEmp.userId)) ||
        (user.employeeId && user.employeeId === currentEmp.id);

      if (isSelf) {
        updateUserProfile({ avatarUrl: newAvatarUrl });
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
      await api.updateEmployee(currentEmp.id, { avatarUrl: '' });
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'leave', label: 'Leave', icon: CalendarOff },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'assets', label: 'Assets', icon: HardDrive },
    { id: 'activity', label: 'Activity History', icon: History },
  ];

  const firstLetter = (currentEmp.firstName || 'E').trim().charAt(0).toUpperCase();
  const lastLetter = (currentEmp.lastName || '').trim().charAt(0).toUpperCase();
  const initials = lastLetter ? `${firstLetter} ${lastLetter}` : firstLetter || 'EMP';
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
            : 'bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[92vh] sm:h-[86vh] shadow-2xl flex flex-col border border-slate-200 overflow-hidden cursor-default animate-modal-zoom'
        }
      >
        {/* Header Profile Hero */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-100 text-slate-900 relative shrink-0">
          {/* Status Message Banners */}
          {photoSuccess && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{photoSuccess}</span>
              </div>
              <button onClick={() => setPhotoSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer">&times;</button>
            </div>
          )}

          {photoError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{photoError}</span>
              </div>
              <button onClick={() => setPhotoError(null)} className="text-rose-700 hover:text-rose-900 font-bold text-sm cursor-pointer">&times;</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar Container */}
              <div className="relative group/avatar shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-500/20 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md overflow-hidden tracking-wider select-none">
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

                {/* Upload Hover Overlay */}
                <label
                  className={`absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center transition-opacity backdrop-blur-2xs ${
                    uploadingPhoto ? 'opacity-100 pointer-events-none' : 'opacity-0 group-hover/avatar:opacity-100 cursor-pointer'
                  }`}
                  title="Change profile picture"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
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

                {/* Camera Badge on Bottom Right */}
                <label
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-95 transition-all"
                  title="Upload Photo"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 stroke-[2.5]" />
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

              {/* Identity & Badges */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight capitalize truncate">
                    {currentEmp.firstName} {currentEmp.lastName}
                  </h2>
                  {currentEmp.employeeCode && (
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {currentEmp.employeeCode}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleDef.badgeClass}`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{roleDef.label}</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                    (currentEmp.status || 'Active').toLowerCase() === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      (currentEmp.status || 'Active').toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    {currentEmp.status || 'Active'}
                  </span>
                </div>

                {/* Subtitle: Designation & Dept */}
                <p className="text-slate-600 text-xs font-semibold mt-1 truncate">
                  {designationSubtitle || (currentEmp.companyName ? `Employee • ${currentEmp.companyName}` : 'Staff Member')}
                </p>

                {/* Contact items */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                  {currentEmp.email && (
                    <span className="inline-flex items-center gap-1.5 truncate max-w-[240px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{currentEmp.email}</span>
                    </span>
                  )}
                  {currentEmp.phone && (
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentEmp.phone}</span>
                    </span>
                  )}
                  {currentEmp.workLocationName && (
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentEmp.workLocationName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions & Close Button */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {portalMode === 'admin' && !isCurrentUser && (
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-all active:scale-95 shadow-2xs cursor-pointer"
                  title="Change system access role"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Change Role</span>
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
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="relative border-b border-slate-100 bg-slate-50/70 shrink-0 flex items-center px-1 sm:px-2">
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
            className="flex-1 overflow-x-auto scroll-smooth py-2 px-1 [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-slate-300"
          >
            <div className="flex items-center gap-1.5 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={(e) => {
                      setActiveTab(tab.id);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/80'
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

        {/* Tab Content Body */}
        <div className={`${isPageMode ? 'p-4 sm:p-6' : 'flex-1 overflow-y-auto p-4 sm:p-6'} text-xs text-slate-700 space-y-6`}>
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employment Type</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-base font-extrabold text-slate-900 capitalize">{currentEmp.employmentType || 'Full-time'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{currentEmp.shift || 'General Shift (9 AM - 6 PM)'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Joining Date</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">{currentEmp.joiningDate || 'Recent Onboarding'}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Active Workspace Member</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Monthly Salary</span>
                    <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">₹{(currentEmp?.salary?.net ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gross: ₹{(currentEmp?.salary?.gross ?? currentEmp?.salary?.basic ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Overview Details Summary Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Organizational Summary</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Department</span>
                    <span className="font-bold text-slate-800">{currentEmp.departmentName || 'General Staff'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Designation / Title</span>
                    <span className="font-bold text-slate-800">{currentEmp.designationTitle || 'Employee'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Assigned Shift</span>
                    <span className="font-bold text-slate-800">{currentEmp.shift || 'General Shift'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Work Location</span>
                    <span className="font-bold text-slate-800">{currentEmp.workLocationName || currentEmp.companyName || 'Headquarters'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Manager</span>
                    <span className="font-bold text-slate-800">{currentEmp.reportingManagerName || 'Executive Leadership'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Gender &amp; DOB</span>
                    <span className="font-bold text-slate-800">{currentEmp.gender || '—'} {currentEmp.dateOfBirth ? `• ${currentEmp.dateOfBirth}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Core Skills */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Core Skills &amp; Competencies</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(currentEmp?.skills || []).length > 0 ? (
                    currentEmp.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center w-full">
                      <p className="text-slate-400 text-xs italic">No specific skills listed for this employee profile.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Personal Information */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profile Photo Management Card */}
              <div className="col-span-1 sm:col-span-2 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    {currentEmp.avatarUrl ? (
                      <img src={currentEmp.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-emerald-800 font-bold text-lg">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Employee Profile Picture</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Used for attendance clocking identification, team chat, and employee directory.
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 inline-block">
                      Supported formats: PNG, JPG, JPEG, WEBP (Auto-optimized)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition active:scale-95">
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{currentEmp.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingPhoto}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  {currentEmp.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingPhoto}
                      className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 transition active:scale-95 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.dateOfBirth || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400">Gender</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.gender || 'Not specified'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400">Residential Address</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.address || 'No residential address on file'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400">Emergency Contact</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {currentEmp?.emergencyContact?.name
                    ? `${currentEmp.emergencyContact.name} (${currentEmp.emergencyContact.relationship || 'Contact'}) — ${currentEmp.emergencyContact.phone || ''}`
                    : 'Not provided'}
                </p>
              </div>
            </div>
          )}

          {/* 3. Employment */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">System Access Role</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${roleDef.badgeClass}`}>
                        <Shield className="w-3.5 h-3.5" />
                        <span>{roleDef.label}</span>
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{roleDef.description}</span>
                    </div>
                  </div>
                  {portalMode === 'admin' && !isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => setRoleModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs transition cursor-pointer"
                    >
                      Change Role
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Reporting Manager</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.reportingManagerName || 'Executive Leadership'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Shift</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.shift || 'General Shift'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Employment Type</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{currentEmp.employmentType || 'Full-time'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Work Location</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.workLocationName || currentEmp.companyName || 'Main Office'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Attendance */}
          {activeTab === 'attendance' && (() => {
            const todayRec = getTodayRecordForEmployee(currentEmp.id);
            return (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Today's Work Shift Status</span>
                  </h4>
                  {todayRec ? (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 text-xs">
                          {todayRec.date} • {todayRec.isCompleted ? 'Shift Completed' : todayRec.isOnBreak ? 'On Break' : 'Active Working'}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formatSecondsToHMS(todayRec.activeSeconds || 0)} Worked
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
              </div>
            );
          })()}

          {/* 5. Leave */}
          {activeTab === 'leave' && (
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
            </div>
          )}

          {/* 6. Payroll */}
          {activeTab === 'payroll' && (
            <div className="space-y-3">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Salary Structure Breakdown</h4>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <span className="text-slate-500">Basic Salary:</span>
                  <span className="font-bold">₹{(currentEmp?.salary?.basic ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500">HRA Allowance:</span>
                  <span className="font-bold">₹{(currentEmp?.salary?.hra ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500">Special Allowances:</span>
                  <span className="font-bold">₹{(currentEmp?.salary?.allowances ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500">PF Deduction (12%):</span>
                  <span className="font-bold text-rose-500">-₹{(currentEmp?.salary?.pf ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500">Net Take-Home:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">₹{(currentEmp?.salary?.net ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-2">
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900">Passport &amp; Identity Document.pdf</h5>
                  <span className="text-[11px] text-slate-400">Verified by HR • 2.4 MB</span>
                </div>
                <button className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          )}

          {/* 8. Performance */}
          {activeTab === 'performance' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Q3-Q4 Performance Appraisal</span>
              <p className="text-base font-bold text-slate-900 mt-1">Score: 4.8 / 5.0 &mdash; Exceeds Expectations</p>
              <p className="text-xs text-slate-600 mt-2">
                &ldquo;Outstanding initiative in design and engineering collaboration with high product velocity.&rdquo;
              </p>
            </div>
          )}

          {/* 9. Training */}
          {activeTab === 'training' && (
            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-slate-900">Enterprise Cybersecurity &amp; Data Privacy Standards</h5>
                <span className="text-[11px] text-slate-400">Progress: 100% Completed</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">Certificate Issued</span>
            </div>
          )}

          {/* 10. Assets */}
          {activeTab === 'assets' && (
            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-slate-900">MacBook Pro 16&quot; M3 Max (36GB, 1TB)</h5>
                <span className="text-[11px] text-slate-400">Tag: AST-MBP-001 • Condition: Excellent</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">Assigned</span>
            </div>
          )}

          {/* 11. Activity History */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">User Profile Authenticated</p>
                  <span className="text-[11px] text-slate-400">Active Session via Workspace</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (isPageMode) {
    return (
      <div className="space-y-5 w-full">
        {profileCardContent}

        {/* Change Role Modal */}
        <ChangeRoleModal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          employee={currentEmp}
          onSuccess={(updated) => {
            setCurrentEmp(updated);
            if (onRefresh) onRefresh();
          }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 cursor-pointer animate-in fade-in"
    >
      {profileCardContent}

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        employee={currentEmp}
        onSuccess={(updated) => {
          setCurrentEmp(updated);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
