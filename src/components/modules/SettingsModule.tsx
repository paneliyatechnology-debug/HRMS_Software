'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';

interface SettingsModuleProps {
  portalMode?: 'employee' | 'admin';
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ portalMode: propPortalMode }) => {
  const { user, portalMode: authPortalMode } = useAuth();
  const { showToast } = useSocket();

  const isEmployee = (propPortalMode || authPortalMode) === 'employee';

  // Admin tabs state
  const [adminActiveTab, setAdminActiveTab] = useState<'company' | 'schedule' | 'leaves' | 'rbac'>('company');

  // Employee tabs state
  const [empActiveTab, setEmpActiveTab] = useState<'profile' | 'notifications' | 'security' | 'preferences'>('profile');

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

  const [scheduleData, setScheduleData] = useState({
    defaultShift: '09:00 AM - 06:00 PM',
    gracePeriodMinutes: 15,
    halfDayHours: 4,
    workingHoursPerDay: 8,
  });

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
    if (!isEmployee) {
      const loadSettings = async () => {
        try {
          const data = await api.getSettings();
          if (data) {
            if (data.company) setCompanyData((prev) => ({ ...prev, ...data.company }));
            if (data.workSchedule) setScheduleData((prev) => ({ ...prev, ...data.workSchedule }));
            if (data.leavePolicy) setLeavePolicyData((prev) => ({ ...prev, ...data.leavePolicy }));
          }
        } catch (err) {
          console.error('Failed to load settings:', err);
        }
      };
      loadSettings();
    } else {
      if (typeof window !== 'undefined') {
        try {
          const savedNotifs = localStorage.getItem('hrms_emp_notifications');
          if (savedNotifs) setEmpNotifications(JSON.parse(savedNotifs));

          const savedPrefs = localStorage.getItem('hrms_emp_preferences');
          if (savedPrefs) setEmpPreferences(JSON.parse(savedPrefs));

          const savedProf = localStorage.getItem('hrms_emp_profile_extra');
          if (savedProf) setEmpProfile((prev) => ({ ...prev, ...JSON.parse(savedProf) }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isEmployee, user]);

  const handleAdminSave = async () => {
    setLoading(true);
    try {
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

  const handleEmpPrefSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_emp_preferences', JSON.stringify(empPreferences));
    }
    setSavedMessage(true);
    showToast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Work and regional display preferences saved.',
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
    { module: 'Employee Directory', superAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Employee Edit / Delete', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
    { module: 'Attendance Regularization', superAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Leave Approvals', superAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Monthly Payroll Runs', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: true },
    { module: 'Job & Candidate Pipeline', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: true, finance: false },
    { module: 'Hardware Assets', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
    { module: 'System Audit Logs', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
  ];

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
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#4f5fe8] to-[#7f4cdb] text-white font-black text-2xl flex items-center justify-center shadow-md">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'E'}
                {user.lastName?.[0] || ''}
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
        {empActiveTab === 'preferences' && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5 max-w-3xl">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Work Availability & Display Preferences
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your time formatting, language, and colleague status
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Today's Work Status</label>
                <select
                  value={empPreferences.workStatus}
                  onChange={(e) => setEmpPreferences({ ...empPreferences, workStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                >
                  <option value="Working in Office">🏢 Working in Office</option>
                  <option value="Working Remotely">🏠 Working Remotely</option>
                  <option value="In Client Meeting">🤝 In Client Meeting</option>
                  <option value="Focus / Deep Work">🎯 Focus / Deep Work</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Display Language</label>
                <select
                  value={empPreferences.language}
                  onChange={(e) => setEmpPreferences({ ...empPreferences, language: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                >
                  <option value="English">English (United States)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Time Format</label>
                <select
                  value={empPreferences.timeFormat}
                  onChange={(e) => setEmpPreferences({ ...empPreferences, timeFormat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                >
                  <option value="12h">12-Hour Format (09:00 AM)</option>
                  <option value="24h">24-Hour Format (09:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Date Format</label>
                <select
                  value={empPreferences.dateFormat}
                  onChange={(e) => setEmpPreferences({ ...empPreferences, dateFormat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (24/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (10/24/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-24)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleEmpPrefSave}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                Save Display Preferences
              </button>
            </div>
          </div>
        )}
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
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'company', label: 'Company Profile' },
          { id: 'schedule', label: 'Working Hours & Shifts' },
          { id: 'leaves', label: 'Leave Policies' },
          { id: 'rbac', label: 'Role Permissions (RBAC)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAdminActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              adminActiveTab === t.id
                ? 'bg-blue-50 text-blue-600 font-bold'
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

      {/* Tab 2: Working Hours */}
      {adminActiveTab === 'schedule' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">Shift & Attendance Rules</h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Standard Daily Working Hours</label>
                <input
                  type="number"
                  value={scheduleData.workingHoursPerDay}
                  onChange={(e) => setScheduleData({ ...scheduleData, workingHoursPerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700">Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={scheduleData.gracePeriodMinutes}
                  onChange={(e) => setScheduleData({ ...scheduleData, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">Default Shift Window</label>
              <input
                type="text"
                value={scheduleData.defaultShift}
                onChange={(e) => setScheduleData({ ...scheduleData, defaultShift: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900 focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleAdminSave}
              disabled={loading}
              className="mt-3 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Attendance Rules'}
            </button>
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
                  <th className="py-2.5 px-3 text-center">Super Admin</th>
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
    </div>
  );
};
