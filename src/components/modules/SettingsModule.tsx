'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  ShieldCheck,
  Clock,
  Calendar,
  Check,
  Building,
  User,
  Bell,
  Lock,
  Globe,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Sliders,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Volume2,
  CreditCard,
  Sparkles,
  Download,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Crown,
  Fingerprint,
  FileText,
  RefreshCw,
  Receipt,
  ExternalLink,
  Users,
  ChevronRight,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { compressImage, validateImageFile } from '../../lib/imageUtils';
import { UpgradePlanModal } from '../modals/UpgradePlanModal';
import {
  getCompanySubscription,
  getCompanyInvoices,
  SUBSCRIPTION_FEATURES_MATRIX,
  SubscriptionInvoice,
} from '../../lib/subscriptionService';
import {
  getWorkScheduleConfig,
  saveWorkScheduleConfig,
  formatMinutesToTimeString,
  parseTimeToMinutes,
  WorkScheduleConfig,
} from '../../lib/shiftScheduleService';

interface SettingsModuleProps {
  portalMode?: 'employee' | 'admin';
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ portalMode: propPortalMode }) => {
  const { user, portalMode: authPortalMode, updateUserProfile } = useAuth();
  const { showToast } = useSocket();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isEmployee = (propPortalMode || authPortalMode) === 'employee';

  // Admin tabs state
  const [adminActiveTab, setAdminActiveTab] = useState<'company' | 'schedule' | 'leaves' | 'rbac' | 'billing' | 'preferences'>('company');

  // Employee tabs state
  const [empActiveTab, setEmpActiveTab] = useState<'profile' | 'notifications' | 'security' | 'preferences'>('profile');

  // Subscription state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [subData, setSubData] = useState(() => getCompanySubscription('comp-paneliya'));
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => getCompanyInvoices('comp-paneliya'));

  const refreshSubscriptionData = () => {
    setSubData(getCompanySubscription('comp-paneliya'));
    setInvoices(getCompanyInvoices('comp-paneliya'));
  };

  useEffect(() => {
    const handleUpdate = () => refreshSubscriptionData();
    window.addEventListener('hrms_companies_updated', handleUpdate);
    return () => window.removeEventListener('hrms_companies_updated', handleUpdate);
  }, []);

  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // --- Admin Settings State ---
  const [companyData, setCompanyData] = useState({
    name: 'Paneliya Technology Inc.',
    tagline: 'Enterprise Cloud & Next-Gen Software Engineering',
    taxId: 'US-EIN-984102941',
    supportEmail: 'support@paneliya.com',
    phone: '+1 (415) 555-0199',
    currency: 'USD ($)',
    address: '100 Silicon Vista Blvd, Suite 800, San Francisco, CA 94105',
  });

  const adminCompanyId = user.companyId || (user as any).companyId || 'comp-paneliya';
  const [scheduleData, setScheduleData] = useState<WorkScheduleConfig>(() => getWorkScheduleConfig(adminCompanyId));

  const [leavePolicyData, setLeavePolicyData] = useState({
    casualLeaveAnnual: 12,
    sickLeaveAnnual: 10,
    paidLeaveAnnual: 15,
    carryForwardLimit: 5,
  });

  // --- Employee Settings State ---
  const [empProfile, setEmpProfile] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    preferredName: '',
    phone: (user as any).phone || '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bio: '',
  });

  const [empNotifications, setEmpNotifications] = useState({
    dailyClockInReminder: true,
    shiftEndReminder: true,
    leaveStatusAlerts: true,
    chatMessageAlerts: true,
    announcementsAlerts: true,
    soundEffects: true,
  });

  const [empPreferences, setEmpPreferences] = useState({
    language: 'English',
    timeFormat: '12h',
    dateFormat: 'DD/MM/YYYY',
    workStatus: 'Working in Office',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Always load preferences, notifications, and profile extras from localStorage for all users (Admin & Employee)
    if (typeof window !== 'undefined') {
      try {
        const savedNotifs = localStorage.getItem('hrms_emp_notifications');
        if (savedNotifs) setEmpNotifications(JSON.parse(savedNotifs));

        const savedPrefs = localStorage.getItem('hrms_emp_preferences');
        if (savedPrefs) setEmpPreferences(JSON.parse(savedPrefs));

        const savedProf = localStorage.getItem('hrms_emp_profile_extra');
        if (savedProf) setEmpProfile((prev) => ({ ...prev, ...JSON.parse(savedProf) }));
      } catch (e) {
        console.error('Failed to load user preferences:', e);
      }
    }

    if (!isEmployee) {
      const loadSettings = async () => {
        try {
          const data = await api.getSettings();
          if (data) {
            if (data.company) setCompanyData((prev) => ({ ...prev, ...data.company }));
            if (data.workSchedule) {
              setScheduleData((prev) => ({ ...prev, ...data.workSchedule }));
            } else {
              setScheduleData(getWorkScheduleConfig(adminCompanyId));
            }
            if (data.leavePolicy) setLeavePolicyData((prev) => ({ ...prev, ...data.leavePolicy }));
          } else {
            setScheduleData(getWorkScheduleConfig(adminCompanyId));
          }
        } catch (err) {
          console.error('Failed to load settings:', err);
          setScheduleData(getWorkScheduleConfig(adminCompanyId));
        }
      };
      loadSettings();
    }
  }, [isEmployee, user]);

  const handleAdminSave = async () => {
    setLoading(true);
    try {
      saveWorkScheduleConfig(scheduleData, adminCompanyId);
      await api.updateSettings({
        company: companyData,
        workSchedule: scheduleData,
        leavePolicy: leavePolicyData,
        payrollPolicy: {
          payCycle: 'Monthly',
          disbursementDate: 28,
          pfContributionPercent: 12,
        },
      });

      setSavedMessage(true);
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'System parameters updated and synchronized.',
      });
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to update system settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast({ type: 'error', title: 'Invalid Image', message: validation.error || 'Please select a valid image.' });
      return;
    }

    setUploadingAvatar(true);
    try {
      let newAvatarUrl = '';
      try {
        const res = await api.uploadProfilePhoto(file);
        if (res.avatarUrl) newAvatarUrl = res.avatarUrl;
      } catch (err) {
        console.warn('Backend photo upload failed, using local compression fallback:', err);
      }

      if (!newAvatarUrl) {
        newAvatarUrl = await compressImage(file, 400, 400, 0.88);
      }

      updateUserProfile({ avatarUrl: newAvatarUrl });
      const empId = user.employeeId || user.id;
      if (empId) {
        await api.updateEmployee(empId, { avatarUrl: newAvatarUrl });
      }
      window.dispatchEvent(new Event('hrms_employees_updated'));
      showToast({ type: 'success', title: 'Profile Picture Updated', message: 'Your profile picture has been saved successfully.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Upload Failed', message: err.message || 'Could not update profile picture.' });
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    try {
      updateUserProfile({ avatarUrl: '' });
      const empId = user.employeeId || user.id;
      if (empId) {
        await api.updateEmployee(empId, { avatarUrl: '' });
      }
      window.dispatchEvent(new Event('hrms_employees_updated'));
      showToast({ type: 'success', title: 'Photo Removed', message: 'Your profile picture has been cleared.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not remove profile picture.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEmpProfileSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_emp_profile_extra', JSON.stringify(empProfile));
    }
    setSavedMessage(true);
    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal preferences have been saved.',
    });
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleEmpNotifSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_emp_notifications', JSON.stringify(empNotifications));
    }
    setSavedMessage(true);
    showToast({
      type: 'success',
      title: 'Notifications Updated',
      message: 'Your alert preferences have been saved.',
    });
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleEmpPrefSave = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_emp_preferences', JSON.stringify(empPreferences));
      localStorage.setItem('hrms_work_status', empPreferences.workStatus);
      localStorage.setItem('hrms_time_format', empPreferences.timeFormat);
      localStorage.setItem('hrms_date_format', empPreferences.dateFormat);
      localStorage.setItem('hrms_language', empPreferences.language);

      // System-wide broadcast to LiveClock, Header, and Sidebar
      window.dispatchEvent(new Event('hrms_preferences_updated'));
      window.dispatchEvent(new Event('hrms_employees_updated'));
    }

    // Sync workStatus to backend database for the user's employee record
    const empId = user?.employeeId || user?.id;
    if (empId) {
      try {
        await api.updateEmployee(empId, { workStatus: empPreferences.workStatus });
      } catch (err) {
        console.warn('Could not sync work status to employee API:', err);
      }
    }

    setSavedMessage(true);
    showToast({
      type: 'success',
      title: 'Preferences Saved & Applied',
      message: `Work status set to "${empPreferences.workStatus}" & live displays updated!`,
    });
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter your current password.' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast({ type: 'error', title: 'Error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast({ type: 'error', title: 'Error', message: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSavedMessage(true);
    showToast({
      type: 'success',
      title: 'Password Changed',
      message: 'Your account security credentials have been updated.',
    });
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const rbacMatrix = [
    { module: 'Employee Directory', companyAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Employee Edit / Delete', companyAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
    { module: 'Attendance Regularization', companyAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Leave Approvals', companyAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Monthly Payroll Runs', companyAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: true },
    { module: 'Job & Candidate Pipeline', companyAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: true, finance: false },
    { module: 'Hardware Assets', companyAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
    { module: 'System Audit Logs', companyAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
  ];

  // =========================================================================
  // SHARED: Work Availability & Display Preferences Luxury Green Panel
  // =========================================================================
  const renderWorkAndDisplayPanel = () => {
    const workStatusOptions = [
      {
        id: 'Working in Office',
        icon: '🏢',
        title: 'Working in Office',
        desc: 'Present at the official workstation. Available for face-to-face team discussions and offline meetings.',
        badge: 'In Office',
        accentColor: 'border-emerald-500 bg-emerald-50/60 text-emerald-950',
      },
      {
        id: 'Working Remotely',
        icon: '🏠',
        title: 'Working Remotely',
        desc: 'Operating from home or remote base. Readily reachable via chat, video conference, and enterprise email.',
        badge: 'Remote',
        accentColor: 'border-blue-500 bg-blue-50/60 text-blue-950',
      },
      {
        id: 'In Client Meeting',
        icon: '🤝',
        title: 'In Client Meeting',
        desc: 'Occupied with external customer consultation, sales demo, or client negotiations. Responses may be delayed.',
        badge: 'Client Visit',
        accentColor: 'border-amber-500 bg-amber-50/60 text-amber-950',
      },
      {
        id: 'Focus / Deep Work',
        icon: '🎯',
        title: 'Focus / Deep Work',
        desc: 'Heads-down on high-priority development or architecture. Notifications muted; urgent queries only.',
        badge: 'Do Not Disturb',
        accentColor: 'border-purple-500 bg-purple-50/60 text-purple-950',
      },
    ];

    const sampleNow = new Date();
    const is24 = empPreferences.timeFormat === '24h';
    const sampleTime = is24
      ? sampleNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : sampleNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    let sampleDateStr = '';
    const day = String(sampleNow.getDate()).padStart(2, '0');
    const month = String(sampleNow.getMonth() + 1).padStart(2, '0');
    const year = sampleNow.getFullYear();
    if (empPreferences.dateFormat === 'MM/DD/YYYY') {
      sampleDateStr = `${month}/${day}/${year}`;
    } else if (empPreferences.dateFormat === 'YYYY-MM-DD') {
      sampleDateStr = `${year}-${month}-${day}`;
    } else {
      sampleDateStr = `${day}/${month}/${year}`;
    }

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-7 max-w-4xl animate-in fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                <Sliders className="w-5 h-5 text-[#059669]" />
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Work Availability & Display Preferences
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select your real-time presence status, configure system 12h/24h time formatting, and regional date layouts.
            </p>
          </div>

          <button
            onClick={handleEmpPrefSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Apply Preferences</span>
          </button>
        </div>

        {/* Section 1: Work Presence Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                1. Today's Presence Status (Live across Header & Directory)
              </label>
              <p className="text-[11px] text-slate-400">
                Displayed in the top navigation bar, employee directory, and profile status tags.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Current: {empPreferences.workStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {workStatusOptions.map((opt) => {
              const isSelected = empPreferences.workStatus === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setEmpPreferences({ ...empPreferences, workStatus: opt.id })}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? `${opt.accentColor} shadow-xs ring-2 ring-emerald-500/30`
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-xl bg-white shadow-2xs border border-slate-100 shrink-0">
                        {opt.icon}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {opt.title}
                        </h4>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {opt.badge}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Clock & Time Format */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              2. Digital Clock Time Format
            </label>
            <p className="text-[11px] text-slate-400">
              Applies to the live pulse clock in the header, attendance punch records, and timesheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 12-Hour */}
            <div
              onClick={() => setEmpPreferences({ ...empPreferences, timeFormat: '12h' })}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                empPreferences.timeFormat === '12h'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/30'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-white border border-slate-100 text-emerald-600">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">
                      12-Hour Format (AM / PM)
                    </h4>
                    <p className="font-mono text-xs font-bold text-emerald-700 mt-0.5">
                      09:30:45 AM
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    empPreferences.timeFormat === '12h'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {empPreferences.timeFormat === '12h' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Standard commercial time format with morning (AM) and evening (PM) indicators.
              </p>
            </div>

            {/* 24-Hour */}
            <div
              onClick={() => setEmpPreferences({ ...empPreferences, timeFormat: '24h' })}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                empPreferences.timeFormat === '24h'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/30'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-white border border-slate-100 text-emerald-600">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">
                      24-Hour Format (Military / Railway)
                    </h4>
                    <p className="font-mono text-xs font-bold text-emerald-700 mt-0.5">
                      14:30:45
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    empPreferences.timeFormat === '24h'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {empPreferences.timeFormat === '24h' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Continuous 24-hour military/railway system format (e.g. 18:00 for 06:00 PM).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Date Format & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Calendar Date Format</span>
            </label>
            <select
              value={empPreferences.dateFormat}
              onChange={(e) => setEmpPreferences({ ...empPreferences, dateFormat: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium text-xs cursor-pointer"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY — 29/10/2026 (Indian & UK Standard)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY — 10/29/2026 (US Standard)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD — 2026-10-29 (ISO Database Standard)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Used across leaves, payroll disbursement & attendance calendars.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Display Language</span>
            </label>
            <select
              value={empPreferences.language}
              onChange={(e) => setEmpPreferences({ ...empPreferences, language: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium text-xs cursor-pointer"
            >
              <option value="English">English (United States / Global)</option>
              <option value="Hindi">Hindi (हिंदी - भारत)</option>
              <option value="Gujarati">Gujarati (ગુજરાતી)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Controls locale date representations, number formats, and labels.</p>
          </div>
        </div>

        {/* Section 4: Realtime Preview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#062d1f] to-[#0a422e] text-white border border-[#0d4a34] shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>REAL-TIME PREVIEW OF YOUR SELECTIONS</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Here is how your presence pill and clock appear across the application right now:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/15">
              {/* Status Pill Preview */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{empPreferences.workStatus}</span>
              </div>

              {/* Time Preview */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sampleTime}</span>
              </div>

              {/* Date Preview */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 text-slate-200 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sampleDateStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Clicking save will instantly synchronize all open browser tabs, Header, and Sidebar.
          </span>
          <button
            onClick={handleEmpPrefSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Apply Preferences</span>
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // EMPLOYEE VIEW: Personal Profile, Notifications, Password, Display
  // =========================================================================
  if (isEmployee) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in select-none">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                My Settings & Preferences
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Employee Account
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personalize your account profile, notification alerts, shift reminders, and login security
            </p>
          </div>

          {savedMessage && (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs flex items-center gap-1.5 border border-emerald-100 shadow-2xs">
              <Check className="w-3.5 h-3.5" /> Preferences Saved Successfully
            </span>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 text-xs font-bold border border-slate-200/60 shadow-2xs overflow-x-auto [scrollbar-width:none]">
          <button
            onClick={() => setEmpActiveTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              empActiveTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Contact</span>
          </button>
          <button
            onClick={() => setEmpActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              empActiveTab === 'notifications'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications & Reminders</span>
          </button>
          <button
            onClick={() => setEmpActiveTab('security')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              empActiveTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
          <button
            onClick={() => setEmpActiveTab('preferences')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              empActiveTab === 'preferences'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Work & Display</span>
          </button>
        </div>

        {/* Tab 1: Profile & Contact */}
        {empActiveTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative group/avatar shrink-0">
                  <div className="w-18 h-18 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 font-extrabold text-2xl flex items-center justify-center shadow-xs overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'E'}
                        {user.lastName?.[0] || ''}
                      </span>
                    )}
                  </div>
                  <label
                    className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-2xs text-white opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAvatar}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <label
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-95 transition-all"
                    title="Upload Photo"
                  >
                    <Camera className="w-3 h-3 stroke-[2.5]" />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAvatar}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(user as any).designationTitle || 'Staff Member'} • {(user as any).departmentName || 'General'}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold mt-1">
                    Active Employee
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition active:scale-95">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{user.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={uploadingAvatar}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 transition active:scale-95 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700">First Name</label>
                <input
                  type="text"
                  value={empProfile.firstName}
                  onChange={(e) => setEmpProfile({ ...empProfile, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Last Name</label>
                <input
                  type="text"
                  value={empProfile.lastName}
                  onChange={(e) => setEmpProfile({ ...empProfile, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Preferred Name / Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={empProfile.preferredName}
                  onChange={(e) => setEmpProfile({ ...empProfile, preferredName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={empProfile.phone}
                  onChange={(e) => setEmpProfile({ ...empProfile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1.5 text-slate-700">Official Work Email</label>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-mono font-medium">
                  <span>{user.email || 'employee@paneliya.com'}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Managed by HR</span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Emergency Contact Name</label>
                <input
                  type="text"
                  placeholder="Name of contact"
                  value={empProfile.emergencyContactName}
                  onChange={(e) => setEmpProfile({ ...empProfile, emergencyContactName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Emergency Contact Phone</label>
                <input
                  type="text"
                  placeholder="Emergency phone"
                  value={empProfile.emergencyContactPhone}
                  onChange={(e) => setEmpProfile({ ...empProfile, emergencyContactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1.5 text-slate-700">About Me / Bio</label>
                <textarea
                  rows={3}
                  placeholder="Share a short headline or bio with your team..."
                  value={empProfile.bio}
                  onChange={(e) => setEmpProfile({ ...empProfile, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleEmpProfileSave}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                Save Profile Details
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Notifications & Reminders */}
        {empActiveTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5 max-w-3xl">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Attendance & Alert Preferences
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose which notifications you wish to receive on this device
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">⏰ Daily Morning Attendance Reminder</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Send a reminder alert at 09:00 AM on scheduled work days to punch in.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={empNotifications.dailyClockInReminder}
                  onChange={(e) =>
                    setEmpNotifications({ ...empNotifications, dailyClockInReminder: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">🚪 Shift End / Clock-Out Reminder</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Notify me at 06:00 PM before shift ends so I never miss a punch-out.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={empNotifications.shiftEndReminder}
                  onChange={(e) =>
                    setEmpNotifications({ ...empNotifications, shiftEndReminder: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">📝 Leave Application Status Alerts</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Notify immediately when a submitted leave request is Approved or Rejected.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={empNotifications.leaveStatusAlerts}
                  onChange={(e) =>
                    setEmpNotifications({ ...empNotifications, leaveStatusAlerts: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">💬 Team Chat & Direct Messages</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Receive notification alerts when a colleague sends you a message.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={empNotifications.chatMessageAlerts}
                  onChange={(e) =>
                    setEmpNotifications({ ...empNotifications, chatMessageAlerts: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">📢 Company Notices & Announcements</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Get alerted whenever management posts critical company notices or holiday updates.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={empNotifications.announcementsAlerts}
                  onChange={(e) =>
                    setEmpNotifications({ ...empNotifications, announcementsAlerts: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">🔔 Sound Effects</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Play gentle chime sounds on attendance clock-in, clock-out, and incoming chat.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={empNotifications.soundEffects}
                  onChange={(e) =>
                    setEmpNotifications({ ...empNotifications, soundEffects: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleEmpNotifSave}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                Save Notification Preferences
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Password */}
        {empActiveTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl">
            {/* Left 7 Cols: Change Password Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Change Account Password
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your login credentials securely
                </p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Password requirements:</p>
                  <p>• At least 6 characters in length</p>
                  <p>• Include a mix of letters and numbers</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>

            {/* Right 5 Cols: Active Session & Security Overview */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Active Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Device & authentication status
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>Current Web Session</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Signed in via verified local network.
                </p>
                <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Now
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Two-Factor Authentication</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Account is protected by standard enterprise session tokens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Work & Display Preferences */}
        {empActiveTab === 'preferences' && renderWorkAndDisplayPanel()}
      </div>
    );
  }

  // =========================================================================
  // ADMIN VIEW: Company legal parameters, shifts, leaves, RBAC
  // =========================================================================
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings & Enterprise Policies
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure company legal entity parameters, working hours, leave quotas, and RBAC matrix
          </p>
        </div>

        {savedMessage && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs flex items-center gap-1.5 border border-emerald-100">
            <Check className="w-3.5 h-3.5" /> Changes Saved Successfully
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-semibold overflow-x-auto [scrollbar-width:none]">
        {[
          { id: 'company', label: 'Company Profile' },
          { id: 'schedule', label: 'Working Hours & Shifts' },
          { id: 'leaves', label: 'Leave Policies' },
          { id: 'rbac', label: 'Role Permissions (RBAC)' },
          { id: 'billing', label: 'Subscription & Billing 💎' },
          { id: 'preferences', label: 'Work & Display ⚙️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAdminActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
              adminActiveTab === t.id
                ? 'bg-[#ecfdf5] text-[#065f46] font-bold border border-[#a7f3d0]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Company Profile */}
      {adminActiveTab === 'company' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">Organization Identity</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-700">Company Name</label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Corporate Tagline</label>
              <input
                type="text"
                value={companyData.tagline}
                onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Federal Tax EIN</label>
                <input
                  type="text"
                  value={companyData.taxId}
                  onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700">Currency</label>
                <input
                  type="text"
                  value={companyData.currency}
                  onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Headquarters Address</label>
              <input
                type="text"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
            </div>

            <button
              onClick={handleAdminSave}
              disabled={loading}
              className="mt-3 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Company Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Working Hours & Shifts */}
      {adminActiveTab === 'schedule' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 max-w-3xl animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                  <Clock className="w-5 h-5 text-[#059669]" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Office Shifts & Attendance Buffer Window
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#065f46] border border-emerald-300 text-[10px] font-bold">
                    {companyData.name || 'Your Company'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure official shift timings and punch buffer minutes. These buffer rules apply exclusively to employees of <strong>{companyData.name || 'your company'}</strong>.
              </p>
            </div>

            <button
              onClick={handleAdminSave}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Shift Rules'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Shift Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Office Shift Start Time *</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={scheduleData.shiftStartTime || '09:00 AM'}
                  onChange={(e) => setScheduleData({ ...scheduleData, shiftStartTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Official time work begins in the morning.</p>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Office Shift End Time *</label>
                <input
                  type="text"
                  placeholder="e.g. 06:00 PM"
                  value={scheduleData.shiftEndTime || '06:00 PM'}
                  onChange={(e) => setScheduleData({ ...scheduleData, shiftEndTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Official time employees punch out at shift end.</p>
              </div>
            </div>

            {/* Buffers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700">
                  Early Arrival Buffer (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={scheduleData.earlyBufferMinutes ?? 30}
                    onChange={(e) => setScheduleData({ ...scheduleData, earlyBufferMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-slate-500 font-medium text-xs">Mins</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  How early employees are permitted to check in before shift starts.
                </p>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">
                  Late Grace Buffer (Minutes) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={scheduleData.gracePeriodMinutes ?? 15}
                    onChange={(e) => setScheduleData({ ...scheduleData, gracePeriodMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-slate-500 font-medium text-xs">Mins</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Buffer time after shift start up to which check-in is allowed.
                </p>
              </div>
            </div>

            {/* Standard Work Hours & Half Day */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Standard Daily Work Hours</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={scheduleData.workingHoursPerDay || 8}
                  onChange={(e) => setScheduleData({ ...scheduleData, workingHoursPerDay: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Half-Day Threshold Hours</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={scheduleData.halfDayHours || 4}
                  onChange={(e) => setScheduleData({ ...scheduleData, halfDayHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Strict Enforcement Toggle Card */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Enforce Strict Shift Timing Window</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  When enabled, attendance punch is <strong>strictly locked</strong> outside the buffer window. Employees attempting to punch in before the early buffer or after the late grace buffer will be blocked and required to request HR Regularization.
                </p>
              </div>
              <input
                type="checkbox"
                checked={scheduleData.enforceShiftWindow !== false}
                onChange={(e) => setScheduleData({ ...scheduleData, enforceShiftWindow: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5 shrink-0"
              />
            </div>

            {/* Real-time Calculated Allowed Punch Window Card */}
            {(() => {
              const startMins = parseTimeToMinutes(scheduleData.shiftStartTime || '09:00 AM');
              const allowedStart = formatMinutesToTimeString(startMins - Number(scheduleData.earlyBufferMinutes || 30));
              const allowedEnd = formatMinutesToTimeString(startMins + Number(scheduleData.gracePeriodMinutes || 15));
              return (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#062d1f] to-[#0a422e] text-white border border-[#0d4a34] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                        Calculated Attendance Check-In Window
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                      {scheduleData.enforceShiftWindow !== false ? '🔒 Strict Lock Active' : 'Flexible Attendance'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-white tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span>{allowedStart} — {allowedEnd}</span>
                  </div>
                  <p className="text-[11px] text-[#a7f3d0]/80">
                    Employees can check in starting at <strong>{allowedStart}</strong> until <strong>{allowedEnd}</strong> ({scheduleData.gracePeriodMinutes || 15} min grace buffer). Outside this timeframe, punch will be {scheduleData.enforceShiftWindow !== false ? 'strictly blocked' : 'allowed with late flag'}.
                  </p>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAdminSave}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Shift Rules & Buffer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Leave Policies */}
      {adminActiveTab === 'leaves' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">Annual Leave Quota Policy</h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-700">Casual Leave (Days / Year)</label>
              <input
                type="number"
                value={leavePolicyData.casualLeaveAnnual}
                onChange={(e) => setLeavePolicyData({ ...leavePolicyData, casualLeaveAnnual: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Sick Leave (Days / Year)</label>
              <input
                type="number"
                value={leavePolicyData.sickLeaveAnnual}
                onChange={(e) => setLeavePolicyData({ ...leavePolicyData, sickLeaveAnnual: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Paid / Annual Leave (Days / Year)</label>
              <input
                type="number"
                value={leavePolicyData.paidLeaveAnnual}
                onChange={(e) => setLeavePolicyData({ ...leavePolicyData, paidLeaveAnnual: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Max Carry Forward Limit</label>
              <input
                type="number"
                value={leavePolicyData.carryForwardLimit}
                onChange={(e) => setLeavePolicyData({ ...leavePolicyData, carryForwardLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <button
            onClick={handleAdminSave}
            disabled={loading}
            className="mt-3 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Leave Policy'}
          </button>
        </div>
      )}

      {/* Tab 4: RBAC Permissions Matrix */}
      {adminActiveTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Role-Based Access Control (RBAC) Permission Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Feature / Permission</th>
                  <th className="py-2.5 px-3 text-center">Company Admin</th>
                  <th className="py-2.5 px-3 text-center">HR Admin</th>
                  <th className="py-2.5 px-3 text-center">Manager</th>
                  <th className="py-2.5 px-3 text-center">Employee</th>
                  <th className="py-2.5 px-3 text-center">Recruiter</th>
                  <th className="py-2.5 px-3 text-center">Finance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rbacMatrix.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {row.module}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.hrAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.employee ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.recruiter ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.finance ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Subscription & Billing Management */}
      {adminActiveTab === 'billing' && (
        <div className="space-y-6 max-w-5xl animate-in fade-in duration-200">
          {/* Active Plan Overview Hero Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
            {/* Background glowing blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Subscription Active
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-bold">
                    {subData.billingCycle} Billing
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{subData.plan.name}</span>
                  {subData.plan.id === 'Enterprise' && (
                    <Crown className="w-6 h-6 text-amber-400" />
                  )}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
                  {subData.plan.tagline}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Next Auto-Renewal</span>
                    <span className="font-bold text-white text-sm">{subData.nextRenewalDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Billing Rate</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ₹{subData.billingCycle === 'Annual' ? subData.plan.priceAnnualINR.toLocaleString('en-IN') : subData.plan.priceMonthlyINR.toLocaleString('en-IN')} / {subData.billingCycle === 'Annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Tenant Code</span>
                    <span className="font-mono font-bold text-white text-sm">{subData.company?.code || 'PANELIYA-HQ'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Upgrade or Change Plan</span>
                </button>
                <button
                  onClick={() => {
                    showToast({
                      type: 'info',
                      title: 'Support Desk',
                      message: 'Priority billing support ticket opened (#PAN-8910).',
                    });
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-300" />
                  <span>Billing Support</span>
                </button>
              </div>
            </div>

            {/* Quota Usage Bar */}
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Employee Quota Capacity
                </span>
                <span className="text-white">
                  {subData.currentEmployeesCount} / {subData.maxEmployees >= 1000 ? 'Unlimited' : `${subData.maxEmployees}`} Employees ({subData.quotaPercent}% utilized)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    subData.isQuotaFull
                      ? 'bg-rose-500'
                      : subData.quotaPercent > 80
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(5, subData.quotaPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Tier Capabilities 3-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Biometric Machine Gateway</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Physical ZKTeco, eSSL & Realtime terminal cloud push integration enabled via ADMS.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked in Current Plan
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">GPS Geofence & Live Selfie</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Office coordinate boundary locking, hardware device detection, and live camera verification.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked in Current Plan
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Full Automated Payroll</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Direct salary calculation, EPF / ESIC deductions, and downloadable PDF payslips for all staff.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked in Current Plan
                </span>
              </div>
            </div>
          </div>

          {/* Feature Access Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-sm">Feature Comparison Matrix</h4>
                <p className="text-xs text-slate-500">
                  Compare plan entitlements across Starter, Growth, and Enterprise tiers
                </p>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Comparison</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">HRMS Feature</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Starter</th>
                    <th className="py-2.5 px-3 text-center">Growth</th>
                    <th className="py-2.5 px-3 text-center bg-indigo-50/50 rounded-t-xl font-bold text-indigo-900">
                      Enterprise (Active)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {SUBSCRIPTION_FEATURES_MATRIX.slice(0, 7).map((feat, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {feat.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {feat.category}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {feat.includedInStarter ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {feat.includedInGrowth ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-indigo-50/30">
                        {feat.includedInEnterprise ? (
                          <Check className="w-4 h-4 text-indigo-600 stroke-[2.5] mx-auto" />
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices & Billing History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-sm">Invoices & Payment History</h4>
                <p className="text-xs text-slate-500">
                  Download official GST-compliant tax invoices and receipts
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                GSTIN: 24AAACP1234F1Z5
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Plan & Tier</th>
                    <th className="py-2.5 px-3">Billing Cycle</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                        {inv.razorpayPaymentId && (
                          <span className="text-[10px] text-blue-600 font-mono block">
                            RZP: {inv.razorpayPaymentId}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 block">{inv.planName}</span>
                        <span className="text-[10px] text-slate-400 block">{inv.paymentMethod || 'Razorpay Gateway'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{inv.billingCycle}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        ₹{inv.amountINR.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            showToast({
                              type: 'success',
                              title: 'Receipt Downloaded',
                              message: `Invoice ${inv.invoiceNumber} receipt ${inv.razorpayPaymentId ? `(Ref: ${inv.razorpayPaymentId})` : ''} downloaded.`,
                            });
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Work & Display Preferences */}
      {adminActiveTab === 'preferences' && renderWorkAndDisplayPanel()}

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        companyId="comp-paneliya"
        onPlanUpdated={refreshSubscriptionData}
      />
    </div>
  );
};
