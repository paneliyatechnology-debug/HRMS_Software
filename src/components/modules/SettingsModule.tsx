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
  Phone,
  MapPin,
  CalendarOff,
  CalendarDays,
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
  getWeekendPolicyDescription,
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
  const [adminActiveTab, setAdminActiveTab] = useState<'company' | 'schedule' | 'leaves'>('company');

  // Employee tabs state
  const [empActiveTab, setEmpActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  const adminCompanyId = user.companyId || (user as any).companyId || '';

  // Subscription state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [subData, setSubData] = useState(() => getCompanySubscription(adminCompanyId || 'comp-paneliya'));
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => getCompanyInvoices(adminCompanyId || 'comp-paneliya'));

  const refreshSubscriptionData = () => {
    setSubData(getCompanySubscription(adminCompanyId || 'comp-paneliya'));
    setInvoices(getCompanyInvoices(adminCompanyId || 'comp-paneliya'));
  };

  useEffect(() => {
    const handleUpdate = () => refreshSubscriptionData();
    window.addEventListener('hrms_companies_updated', handleUpdate);
    return () => window.removeEventListener('hrms_companies_updated', handleUpdate);
  }, [adminCompanyId]);

  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // --- Admin Settings State ---
  const [companyData, setCompanyData] = useState({
    name: user.companyName || '',
    tagline: '',
    taxId: '',
    supportEmail: '',
    phone: '',
    currency: 'INR (₹)',
    address: '',
  });

  useEffect(() => {
    let isMounted = true;
    api.getMyCompany().then((comp) => {
      if (isMounted && comp) {
        setCompanyData({
          name: comp.name || user.companyName || '',
          tagline: comp.industry || '',
          taxId: comp.gstin || comp.taxId || '',
          supportEmail: comp.email || '',
          phone: comp.phone || '',
          currency: comp.currency || 'INR (₹)',
          address: comp.address || '',
        });
      }
    }).catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const [scheduleData, setScheduleData] = useState<WorkScheduleConfig>(() => getWorkScheduleConfig(adminCompanyId));
  const [settingsLoading, setSettingsLoading] = useState(!isEmployee);

  const [leavePolicyData, setLeavePolicyData] = useState({
    casualLeaveAnnual: 0,
    sickLeaveAnnual: 0,
    paidLeaveAnnual: 0,
    carryForwardLimit: 0,
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
    if (!isEmployee) {
      let active = true;
      const loadSettings = async () => {
        setSettingsLoading(true);
        try {
          const raw = await api.getSettings();
          const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
          if (!active) return;
          if (data) {
            if (data.company) setCompanyData((prev) => ({ ...prev, ...data.company }));
            if (data.workSchedule) {
              setScheduleData((prev) => ({ ...prev, ...data.workSchedule }));
            } else {
              setScheduleData(getWorkScheduleConfig(adminCompanyId));
            }
            if (data.leavePolicy) {
              setLeavePolicyData({
                casualLeaveAnnual: Math.max(0, Number(data.leavePolicy.casualLeaveAnnual) || 0),
                sickLeaveAnnual: Math.max(0, Number(data.leavePolicy.sickLeaveAnnual) || 0),
                paidLeaveAnnual: Math.max(0, Number(data.leavePolicy.paidLeaveAnnual) || 0),
                carryForwardLimit: Math.max(0, Number(data.leavePolicy.carryForwardLimit) || 0),
              });
            }
          } else {
            setScheduleData(getWorkScheduleConfig(adminCompanyId));
          }
        } catch (err) {
          console.error('Failed to load settings:', err);
          if (active) setScheduleData(getWorkScheduleConfig(adminCompanyId));
        } finally {
          if (active) setSettingsLoading(false);
        }
      };
      loadSettings();
      return () => {
        active = false;
      };
    }
  }, [isEmployee, user]);

  const handleAdminSave = async () => {
    setLoading(true);
    try {
      saveWorkScheduleConfig(scheduleData, adminCompanyId);
      const sanitizedLeavePolicy = {
        casualLeaveAnnual: Math.max(0, Number(leavePolicyData.casualLeaveAnnual) || 0),
        sickLeaveAnnual: Math.max(0, Number(leavePolicyData.sickLeaveAnnual) || 0),
        paidLeaveAnnual: Math.max(0, Number(leavePolicyData.paidLeaveAnnual) || 0),
        carryForwardLimit: Math.max(0, Number(leavePolicyData.carryForwardLimit) || 0),
      };
      setLeavePolicyData(sanitizedLeavePolicy);
      await api.updateSettings({
        company: companyData,
        workSchedule: scheduleData,
        leavePolicy: sanitizedLeavePolicy,
        payrollPolicy: {
          payCycle: 'Monthly',
          disbursementDate: 28,
          pfContributionPercent: 12,
        },
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hrms_settings_updated', {
            detail: { leavePolicy: sanitizedLeavePolicy },
          })
        );
      }

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

  const handleEmpProfileSave = async () => {
    const empId = user?.employeeId || user?.id;
    if (!empId) {
      showToast({ type: 'error', title: 'Error', message: 'Employee ID not found.' });
      return;
    }
    setLoading(true);
    try {
      await api.updateEmployee(empId, {
        phone: empProfile.phone,
        emergencyContact: {
          name: empProfile.emergencyContactName,
          relationship: 'Emergency Contact',
          phone: empProfile.emergencyContactPhone,
        },
      });
      setSavedMessage(true);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal employee details have been saved to the database.',
      });
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err: any) {
      showToast({
        type: 'warning',
        title: 'Profile Update Blocked',
        message: err.message || 'Employee self-service profile update API is not supported by the backend. Contact HR to edit details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmpNotifSave = () => {
    showToast({
      type: 'warning',
      title: 'Notification Settings Blocked',
      message: 'Notification alert preferences persistence API is pending backend implementation.',
    });
  };

  const handleEmpPrefSave = async () => {
    const empId = user?.employeeId || user?.id;
    if (empId) {
      try {
        await api.updateEmployee(empId, { workStatus: empPreferences.workStatus });
      } catch (err) {
        console.warn('Could not sync work status to employee API:', err);
      }
    }

    window.dispatchEvent(new Event('hrms_preferences_updated'));
    window.dispatchEvent(new Event('hrms_employees_updated'));

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

    showToast({
      type: 'warning',
      title: 'Password Update Blocked',
      message: 'User self-service password change API endpoint is not implemented on the backend. Please request a password reset via Super Admin.',
    });
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

  // ── Work Availability & Display Preferences Panel ──
  const renderWorkAndDisplayPanel = () => {
    const workStatusOptions = [
      {
        id: 'Working in Office',
        icon: 'Office',
        title: 'Working in Office',
        desc: 'Present at your workstation. Ready for face-to-face team discussions.',
        badge: 'In Office',
        accentColor: 'border-emerald-500 bg-emerald-50/70 text-emerald-950',
      },
      {
        id: 'Working Remotely',
        icon: 'Remote',
        title: 'Working Remotely',
        desc: 'Operating from home or remote base. Reachable via chat & video.',
        badge: 'Remote',
        accentColor: 'border-teal-500 bg-teal-50/70 text-teal-950',
      },
      {
        id: 'In Client Meeting',
        icon: 'Meeting',
        title: 'In Client Meeting',
        desc: 'Consulting with customers or attending external visits.',
        badge: 'Meeting',
        accentColor: 'border-amber-500 bg-amber-50/70 text-amber-950',
      },
      {
        id: 'Focus / Deep Work',
        icon: 'Focus',
        title: 'Focus / Deep Work',
        desc: 'Heads-down on high-priority development. Urgent queries only.',
        badge: 'DND',
        accentColor: 'border-slate-500 bg-slate-100 text-slate-900',
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
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Presence & Display Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your real-time status visible to colleagues, and configure time/date formats.
            </p>
          </div>

          {/* Section 1: Work Presence Status */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Today's Presence Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workStatusOptions.map((opt) => {
                const isSelected = empPreferences.workStatus === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setEmpPreferences({ ...empPreferences, workStatus: opt.id })}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${isSelected
                        ? `${opt.accentColor} shadow-xs ring-2 ring-emerald-500/20`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl p-1.5 rounded-xl bg-white shadow-2xs border border-slate-100 shrink-0">
                          {opt.icon}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-snug">
                            {opt.title}
                          </h4>
                          <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {opt.badge}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Clock Format */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Clock & Time Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setEmpPreferences({ ...empPreferences, timeFormat: '12h' })}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${empPreferences.timeFormat === '12h'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">12-Hour Format (AM / PM)</h4>
                  <p className="font-mono text-xs font-bold text-emerald-700 mt-0.5">02:30:45 PM</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border ${empPreferences.timeFormat === '12h'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                    }`}
                >
                  {empPreferences.timeFormat === '12h' && <Check className="w-3 h-3" />}
                </div>
              </div>

              <div
                onClick={() => setEmpPreferences({ ...empPreferences, timeFormat: '24h' })}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${empPreferences.timeFormat === '24h'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">24-Hour Military Format</h4>
                  <p className="font-mono text-xs font-bold text-emerald-700 mt-0.5">14:30:45</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border ${empPreferences.timeFormat === '24h'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                    }`}
                >
                  {empPreferences.timeFormat === '24h' && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Date & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Date Format</span>
              </label>
              <select
                value={empPreferences.dateFormat}
                onChange={(e) => setEmpPreferences({ ...empPreferences, dateFormat: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 29/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/29/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-29)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Display Language</span>
              </label>
              <select
                value={empPreferences.language}
                onChange={(e) => setEmpPreferences({ ...empPreferences, language: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
              </select>
            </div>
          </div>

          {/* Real-time Preview Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#343a40] to-[#343a40] text-white border border-[#343a40] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Preview Across Header</span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Your presence tag and clock will appear like this in the app:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/10">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {empPreferences.workStatus}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/30 text-white text-xs font-mono font-bold flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-emerald-400" />
                {sampleTime}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/30 text-slate-200 text-xs font-medium flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-emerald-400" />
                {sampleDateStr}
              </span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleEmpPrefSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Preferences</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEE VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (isEmployee) {
    const employeeNavItems = [
      { id: 'profile', label: 'Personal Profile', desc: 'Avatar, phone & emergency contact', icon: User },
      { id: 'security', label: 'Security & Password', desc: 'Password reset & active session', icon: Lock },
      { id: 'notifications', label: 'Notification Alerts', desc: 'Shift & message reminders', icon: Bell },
    ];

    return (
      <div className="space-y-5 w-full animate-in fade-in select-none">
        {/* Header */}
        {savedMessage && (
          <div className="flex justify-end pb-2">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 shadow-2xs">
              <Check className="w-3.5 h-3.5" /> Saved Successfully
            </span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <div className="w-full lg:w-72 shrink-0 bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Account Menu
            </div>
            {employeeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = empActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setEmpActiveTab(item.id as any)}
                  className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 cursor-pointer ${isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {/* Tab: Profile */}
            {empActiveTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Personal Profile Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your display avatar, personal phone number, and emergency contact details.
                  </p>
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-md overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.firstName?.[0] || 'E'}{user.lastName?.[0] || ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-800">Profile Photo</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                      </label>
                      {user.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          disabled={uploadingAvatar}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">JPG or PNG, max 5MB. Automatically optimized.</p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      disabled
                      value={empProfile.firstName}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      disabled
                      value={empProfile.lastName}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Personal Phone *</label>
                    <input
                      type="tel"
                      value={empProfile.phone}
                      onChange={(e) => setEmpProfile({ ...empProfile, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={empProfile.emergencyContactName}
                      onChange={(e) => setEmpProfile({ ...empProfile, emergencyContactName: e.target.value })}
                      placeholder="e.g. Ramesh Patel (Father)"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={empProfile.emergencyContactPhone}
                      onChange={(e) => setEmpProfile({ ...empProfile, emergencyContactPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleEmpProfileSave}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Security */}
            {empActiveTab === 'security' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Security & Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your account login password and view active sessions.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>

                {/* Active Session Card */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Current Web Session</p>
                      <p className="text-[11px] text-slate-500">Authenticated via secure enterprise JWT token</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
              </div>
            )}

            {/* Tab: Notifications */}
            {empActiveTab === 'notifications' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    Notification Preferences
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure which alerts, attendance reminders, and sounds you receive.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Daily Punch-In Reminder</h4>
                      <p className="text-slate-500 text-[11px]">Notify 10 minutes before shift starts if punch is missing.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={empNotifications.dailyClockInReminder}
                      onChange={(e) => setEmpNotifications({ ...empNotifications, dailyClockInReminder: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Leave Approval & Status Alerts</h4>
                      <p className="text-slate-500 text-[11px]">Instant notifications when your leave is approved or reviewed.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={empNotifications.leaveStatusAlerts}
                      onChange={(e) => setEmpNotifications({ ...empNotifications, leaveStatusAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Company Announcements</h4>
                      <p className="text-slate-500 text-[11px]">Important organization notices, events, and holiday announcements.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={empNotifications.announcementsAlerts}
                      onChange={(e) => setEmpNotifications({ ...empNotifications, announcementsAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Notification Audio Chimes</h4>
                      <p className="text-slate-500 text-[11px]">Play gentle sound on clock-in, clock-out, and messages.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={empNotifications.soundEffects}
                      onChange={(e) => setEmpNotifications({ ...empNotifications, soundEffects: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleEmpNotifSave}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Save Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN VIEW: Clean Modern Two-Column Layout
  // ═══════════════════════════════════════════════════════════════════════════
  const adminNavItems = [
    { id: 'company', label: 'Company Profile', desc: 'Name, GSTIN, contacts & address', icon: Building },
    { id: 'schedule', label: 'Shifts & Timing', desc: 'Working hours, buffer & clock-in window', icon: Clock },
    { id: 'leaves', label: 'Leave Quotas', desc: 'Annual quota allowances & carry forward', icon: CalendarOff },
  ];

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            {companyData.name || 'Admin Workspace'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 shadow-2xs">
              <Check className="w-3.5 h-3.5" /> All Changes Saved
            </span>
          )}

          <button
            onClick={handleAdminSave}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0 bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1">
          <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
            Configuration Sections
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminActiveTab(item.id as any)}
                className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 cursor-pointer ${isActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 min-w-0 w-full">
          {/* ── Tab 1: Company Profile ── */}
          {adminActiveTab === 'company' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Company Identity & Registration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official registered organization details used on tax slips, payslips, and correspondence.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="e.g. Paneliya Infotech Pvt Ltd"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Industry / Sector</label>
                  <input
                    type="text"
                    value={companyData.tagline}
                    onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                    placeholder="e.g. Information Technology"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax ID / GSTIN</label>
                  <input
                    type="text"
                    value={companyData.taxId}
                    onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Payroll Currency</label>
                  <input
                    type="text"
                    value={companyData.currency}
                    onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                    placeholder="INR (₹)"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={companyData.supportEmail}
                    onChange={(e) => setCompanyData({ ...companyData, supportEmail: e.target.value })}
                    placeholder="support@company.com"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Corporate Office Address</label>
                  <input
                    type="text"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="e.g. 402, Ring Road, Surat, Gujarat"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleAdminSave}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Company Details'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Tab 2: Shifts & Attendance ── */}
          {adminActiveTab === 'schedule' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Shift Timings & Punch Buffers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define working hours, allowable early/late buffer minutes, and half-day thresholds.
                </p>
              </div>

              {/* Shift Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Start Time *</label>
                  <input
                    type="text"
                    value={scheduleData.shiftStartTime || '09:00 AM'}
                    onChange={(e) => setScheduleData({ ...scheduleData, shiftStartTime: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official time work begins in the morning.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift End Time *</label>
                  <input
                    type="text"
                    value={scheduleData.shiftEndTime || '06:00 PM'}
                    onChange={(e) => setScheduleData({ ...scheduleData, shiftEndTime: e.target.value })}
                    placeholder="06:00 PM"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official shift wrap-up and punch-out time.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Early Arrival Buffer (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={scheduleData.earlyBufferMinutes ?? 30}
                    onChange={(e) => setScheduleData({ ...scheduleData, earlyBufferMinutes: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Minutes before shift start when clock-in opens.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Late Grace Period (Minutes) *</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={scheduleData.gracePeriodMinutes ?? 15}
                    onChange={(e) => setScheduleData({ ...scheduleData, gracePeriodMinutes: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Grace buffer before mark is flagged late.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Day Work Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={scheduleData.workingHoursPerDay || 8}
                    onChange={(e) => setScheduleData({ ...scheduleData, workingHoursPerDay: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Half Day Minimum Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={scheduleData.halfDayHours || 4}
                    onChange={(e) => setScheduleData({ ...scheduleData, halfDayHours: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Strict Lock Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Strict Shift Window Enforcement</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When active, employees cannot punch outside the allowable window without HR regularization.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleData.enforceShiftWindow !== false}
                  onChange={(e) => setScheduleData({ ...scheduleData, enforceShiftWindow: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Real-time Punch Window Calculation */}
              {(() => {
                const startMins = parseTimeToMinutes(scheduleData.shiftStartTime || '09:00 AM');
                const allowedStart = formatMinutesToTimeString(startMins - Number(scheduleData.earlyBufferMinutes || 30));
                const allowedEnd = formatMinutesToTimeString(startMins + Number(scheduleData.gracePeriodMinutes || 15));
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#343a40] to-[#343a40] text-white border border-[#343a40] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Calculated Daily Punch Window</span>
                      </div>
                      <p className="text-xl font-mono font-semibold tracking-tight text-white mt-1">
                        {allowedStart} — {allowedEnd}
                      </p>
                      <p className="text-[11px] text-emerald-100/70 mt-0.5">
                        Allowed clock-in starts at {allowedStart} with a {scheduleData.gracePeriodMinutes || 15}-minute grace window.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
                      {scheduleData.enforceShiftWindow !== false ? (
                        <><Lock className="w-3 h-3 shrink-0" /> Strict Mode Active</>
                      ) : (
                        'Flexible Clock-In'
                      )}
                    </span>
                  </div>
                );
              })()}

              {/* Weekly Weekend / Off Days Configuration */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>Company Weekend &amp; Weekly Off Days</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Select which days are official company non-working weekends. Only selected days will reflect as weekends in the Calendar and Attendance.
                  </p>
                </div>

                {/* Day selector pills (Sun - Sat) */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { day: 0, label: 'Sunday', short: 'Sun' },
                    { day: 1, label: 'Monday', short: 'Mon' },
                    { day: 2, label: 'Tuesday', short: 'Tue' },
                    { day: 3, label: 'Wednesday', short: 'Wed' },
                    { day: 4, label: 'Thursday', short: 'Thu' },
                    { day: 5, label: 'Friday', short: 'Fri' },
                    { day: 6, label: 'Saturday', short: 'Sat' },
                  ].map((d) => {
                    const isSelected = (scheduleData.weekendDays ?? [0]).includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => {
                          const current = scheduleData.weekendDays ?? [0];
                          let next: number[];
                          let nextSatRule = scheduleData.saturdayRule ?? 'none';
                          if (isSelected) {
                            next = current.filter((x) => x !== d.day);
                            if (d.day === 6) nextSatRule = 'none';
                          } else {
                            next = [...current, d.day].sort();
                            if (d.day === 6 && (!nextSatRule || nextSatRule === 'none')) {
                              nextSatRule = 'all';
                            }
                          }
                          setScheduleData({ ...scheduleData, weekendDays: next, saturdayRule: nextSatRule });
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#1b4332] text-white border-[#081c15] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{d.label}</span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected ? 'bg-white/20 text-emerald-100' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? 'Off' : 'Work'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Saturday Specific Rule Sub-Options (if Saturday is selected) */}
                {(scheduleData.weekendDays ?? [0]).includes(6) && (
                  <div className="pt-3 border-t border-slate-200/80 space-y-2">
                    <label className="block font-bold text-slate-700 text-xs">
                      Saturday Operational Schedule
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'all', title: 'All Saturdays Off', desc: 'Every Saturday is an official weekend' },
                        { id: 'alternate_2_4', title: '2nd & 4th Saturday Off', desc: '1st, 3rd & 5th Saturdays are working days' },
                        { id: 'alternate_1_3', title: '1st & 3rd Saturday Off', desc: '2nd & 4th Saturdays are working days' },
                      ].map((opt) => {
                        const isAct = (scheduleData.saturdayRule || 'all') === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setScheduleData({ ...scheduleData, saturdayRule: opt.id as any })}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isAct
                                ? 'border-[#1b4332] bg-[#d8f3dc]/30 ring-1 ring-[#1b4332]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                              <input
                                type="radio"
                                name="satRuleSettings"
                                checked={isAct}
                                onChange={() => {}}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary status tag */}
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    Current weekend schedule: <strong className="text-slate-900">{getWeekendPolicyDescription(scheduleData)}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleAdminSave}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Shift Rules'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Tab 3: Leave Quotas ── */}
          {adminActiveTab === 'leaves' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <CalendarOff className="w-4 h-4 text-emerald-600" />
                    Annual Leave Quotas & Carry-Forward
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set annual leave quotas allotted to every active employee. Employee leave balances reflect only these configured quotas.
                  </p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 shrink-0">
                  Total Annual Leaves:{' '}
                  <span className="font-semibold text-emerald-800">
                    {settingsLoading
                      ? 'Loading...'
                      : `${(Number(leavePolicyData.casualLeaveAnnual) || 0) + (Number(leavePolicyData.sickLeaveAnnual) || 0) + (Number(leavePolicyData.paidLeaveAnnual) || 0)} Days`}
                  </span>
                </div>
              </div>

              {settingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 animate-pulse">
                      <div className="h-4 w-32 bg-slate-200 rounded" />
                      <div className="h-11 w-full bg-slate-200/70 rounded-xl" />
                      <div className="h-3 w-48 bg-slate-200/60 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Casual Leave (CL)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Days / Year</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={leavePolicyData.casualLeaveAnnual}
                      onChange={(e) => setLeavePolicyData({ ...leavePolicyData, casualLeaveAnnual: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400">Short-notice unplanned personal time off.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Sick Leave (SL)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">Days / Year</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={leavePolicyData.sickLeaveAnnual}
                      onChange={(e) => setLeavePolicyData({ ...leavePolicyData, sickLeaveAnnual: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400">Medical recovery and illness leave.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Earned / Paid Leave (PL)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Days / Year</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={leavePolicyData.paidLeaveAnnual}
                      onChange={(e) => setLeavePolicyData({ ...leavePolicyData, paidLeaveAnnual: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400">Accrued annual vacation and personal holidays.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Carry Forward Limit</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Max Roll Over</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={leavePolicyData.carryForwardLimit}
                      onChange={(e) => setLeavePolicyData({ ...leavePolicyData, carryForwardLimit: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400">Maximum unspent leave allowed into next calendar year.</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleAdminSave}
                  disabled={loading || settingsLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Leave Quotas'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
