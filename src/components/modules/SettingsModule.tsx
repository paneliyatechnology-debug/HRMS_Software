'use client';

import React, { useState, useEffect } from 'react';
import { OfficeGeofenceCard } from './OfficeGeofenceCard';
import {
  KIOSK_VOICE_LANGUAGES,
  buildKioskPhrase,
  speakKioskText,
  unlockKioskSpeech,
  type KioskVoiceGender,
  type KioskVoiceLang,
} from '../../lib/kioskVoice';
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
  FileText,
  RefreshCw,
  Receipt,
  ExternalLink,
  Users,
  ChevronRight,
  Trash2,
  Phone,
  MapPin,
  CalendarOff,
  CalendarDays,
  Headphones,
  Plus,
  Pencil,
  Package,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { useCompanyLive } from '../../lib/useCompanyLive';
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
  const { user, portalMode: authPortalMode } = useAuth();
  const { showToast } = useSocket();

  useEffect(() => {
    const pendingPlan = window.sessionStorage.getItem('hrms_pending_plan');
    if (!pendingPlan) return;
    const role = String(user?.role || '').toUpperCase();
    if (!role) return;
    const canBuy = role === 'ADMIN' || role === 'COMPANY_ADMIN' || role === 'ORG_ADMIN';
    window.sessionStorage.removeItem('hrms_pending_plan');
    if (!canBuy) return;
    setAdminActiveTab('plans');
    setIsUpgradeModalOpen(true);
  }, [user?.role]);
  const isEmployee = (propPortalMode || authPortalMode) === 'employee';
  const canManagePlans = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';

  // Admin tabs state
  const [adminActiveTab, setAdminActiveTab] = useState<'company' | 'geofence' | 'schedule' | 'leaves' | 'plans' | 'support'>(
    canManagePlans ? 'support' : 'company'
  );

  // Employee tabs state
  const [empActiveTab, setEmpActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  const adminCompanyId = user.companyId || (user as any).companyId || '';

  // Subscription state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [subData, setSubData] = useState(() => getCompanySubscription(adminCompanyId || 'comp-paneliya'));
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => getCompanyInvoices(adminCompanyId || 'comp-paneliya'));

  // Plans & Premium State
  const [plansList, setPlansList] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [premiumOrders, setPremiumOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);
  const [sellingPlan, setSellingPlan] = useState<any>(null);
  const [sellCompanyId, setSellCompanyId] = useState('');
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 999,
    durationMonths: 1,
    description: '',
    status: 'Active',
  });
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderStatusVal, setOrderStatusVal] = useState('Active');

  // Support State
  const [supportList, setSupportList] = useState<any[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [viewingSupport, setViewingSupport] = useState<any>(null);

  const loadPlansAndPremium = async () => {
    setPlansLoading(true);
    setOrdersLoading(true);
    try {
      const [premRes, plansRes, ordersRes] = await Promise.allSettled([
        api.getCompanyPremium(),
        canManagePlans ? api.listPlans() : api.getPremiumPlans(),
        api.listPremiumOrders(),
      ]);
      if (premRes.status === 'fulfilled' && premRes.value) {
        setPremiumStatus(premRes.value?.data || premRes.value);
      }
      if (plansRes.status === 'fulfilled' && plansRes.value) {
        const pList = Array.isArray(plansRes.value) ? plansRes.value : (plansRes.value?.data || []);
        setPlansList(pList);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const oList = Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value?.data || []);
        setPremiumOrders(oList);
      }
    } finally {
      setPlansLoading(false);
      setOrdersLoading(false);
    }
  };

  const loadSupportData = async () => {
    setSupportLoading(true);
    try {
      const res = await api.listSupportRequests();
      const sList = Array.isArray(res) ? res : (res?.data || []);
      setSupportList(sList);
    } catch {
      setSupportList([]);
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    if (adminActiveTab === 'plans') {
      loadPlansAndPremium();
    } else if (adminActiveTab === 'support') {
      loadSupportData();
    }
  }, [adminActiveTab]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.editPlan(editingPlan.id, planForm);
        showToast({ type: 'success', title: 'Plan Updated', message: `Plan ${planForm.name} updated successfully.` });
      } else {
        await api.createPlan(planForm);
        showToast({ type: 'success', title: 'Plan Created', message: `Plan ${planForm.name} created successfully.` });
      }
      setIsCreatePlanOpen(false);
      setEditingPlan(null);
      setPlanForm({ name: '', price: 999, durationMonths: 1, description: '', status: 'Active' });
      loadPlansAndPremium();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed', message: err?.message || 'Error saving plan.' });
    }
  };

  const handleDeletePlanConfirm = async () => {
    if (!deletingPlan) return;
    try {
      await api.deletePlan(deletingPlan.id);
      showToast({ type: 'success', title: 'Plan Deleted', message: 'Plan has been removed.' });
      setDeletingPlan(null);
      loadPlansAndPremium();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete Failed', message: err?.message || 'Error deleting plan.' });
    }
  };

  const handleSellPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingPlan || !sellCompanyId) return;
    try {
      await api.sellPlan(sellingPlan.id, { companyId: sellCompanyId });
      showToast({ type: 'success', title: 'Plan Assigned', message: `Plan assigned to company ${sellCompanyId}.` });
      setSellingPlan(null);
      setSellCompanyId('');
      loadPlansAndPremium();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Sell Failed', message: err?.message || 'Could not assign plan.' });
    }
  };

  const handlePlaceOrderDirect = async (planId: string) => {
    try {
      await api.placePremiumOrder({ planId });
      showToast({ type: 'success', title: 'Order Placed', message: 'Premium order submitted.' });
      loadPlansAndPremium();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Order Failed', message: err?.message || 'Could not place order.' });
    }
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await api.updatePremiumOrder(editingOrder.id, { status: orderStatusVal });
      showToast({ type: 'success', title: 'Order Updated', message: 'Order status updated.' });
      setEditingOrder(null);
      loadPlansAndPremium();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err?.message || 'Could not update order.' });
    }
  };

  const handleUpdateSupportReqStatus = async (supportId: string, status: string) => {
    try {
      await api.updateSupportRequest(supportId, { status });
      showToast({ type: 'success', title: 'Status Updated', message: `Support request marked as ${status}.` });
      if (viewingSupport && viewingSupport.id === supportId) {
        setViewingSupport({ ...viewingSupport, status });
      }
      loadSupportData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err?.message || 'Could not update status.' });
    }
  };

  const handleViewSupportReq = async (item: any) => {
    try {
      const details = await api.getSupportRequest(item.id);
      setViewingSupport(details?.data || details || item);
    } catch {
      setViewingSupport(item);
    }
  };

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
          tagline: typeof comp.industry === 'object' && comp.industry !== null
            ? comp.industry.name || comp.industry.code || ''
            : comp.industry || '',
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
  useCompanyLive(['settings'], () => {
    api.getMyCompany().then((comp) => {
      if (!comp) return;
      setCompanyData({
        name: comp.name || user.companyName || '',
        tagline: typeof comp.industry === 'object' && comp.industry !== null
          ? comp.industry.name || comp.industry.code || ''
          : comp.industry || '',
        taxId: comp.gstin || comp.taxId || '',
        supportEmail: comp.email || '',
        phone: comp.phone || '',
        currency: comp.currency || 'INR (₹)',
        address: comp.address || '',
      });
    }).catch(() => undefined);
  });

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
    if (!isEmployee && user?.id) {
      const role = String(user?.role || '').toUpperCase();
      if (role === 'SUPER_ADMIN' && !adminCompanyId) {
        setScheduleData(getWorkScheduleConfig(adminCompanyId));
        setSettingsLoading(false);
        return;
      }
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
        } catch (err: any) {
          const msg = String(err?.message || '').toLowerCase();
          if (!msg.includes('login required') && !msg.includes('unauthorized') && !msg.includes('401')) {
            console.warn('Failed to load settings:', err?.message || err);
          }
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
  }, [isEmployee, user, adminCompanyId]);

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
                <option value="Gujarati">Gujarati (àª—à«àªœàª°àª¾àª¤à«€)</option>
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // EMPLOYEE VIEW
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
                    Profile photo is required for employees. Attendance matches this face.
                  </p>
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ADMIN VIEW: Clean Modern Two-Column Layout
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const allAdminNavItems = [
    { id: 'company', label: 'Company Profile', desc: 'Name, GSTIN, contacts & address', icon: Building },
    { id: 'geofence', label: 'Office Geofencing', desc: 'GPS coordinates, radius & punch lock', icon: MapPin },
    { id: 'schedule', label: 'Shifts & Timing', desc: 'Working hours, buffer & clock-in window', icon: Clock },
    { id: 'leaves', label: 'Leave Quotas', desc: 'Annual quota allowances & carry forward', icon: CalendarOff },
    { id: 'plans', label: 'Subscription & Plans', desc: 'Active tier, checkout & orders', icon: Crown },
    { id: 'support', label: 'Support Inquiries', desc: 'Demo requests & customer leads', icon: Headphones },
  ];
  const adminNavItems = canManagePlans
    ? allAdminNavItems.filter((item) => item.id === 'support')
    : allAdminNavItems;

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* 2-Column Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Navigation Sidebar */}
        {!canManagePlans && (
        <div className="w-full lg:w-72 lg:sticky lg:top-4 shrink-0 bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1">
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
        )}

        {/* Right Main Content Area */}
        <div className="flex-1 min-w-0 w-full">
          {/* ── Tab: Office Geofencing ── */}
          {adminActiveTab === 'geofence' && (
            <div className="animate-in fade-in duration-200">
              <OfficeGeofenceCard />
            </div>
          )}

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

              <KioskVoiceCard
                onSaved={(msg) => showToast({ type: 'success', title: 'Voice Saved', message: msg })}
                onError={(msg) => showToast({ type: 'error', title: 'Voice Save Failed', message: msg })}
              />

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
                    Annual Leave Quotas &amp; Carry-Forward
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

          {/* ── Tab 4: Plans & Premium (GET /premium, GET /plans, POST /plans, PATCH /plans/:id, DELETE /plans/:id, POST /plans/:id/sell, GET /premium/orders, POST /premium/orders, PATCH /premium/orders/:id) ── */}
          {adminActiveTab === 'plans' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {!canManagePlans && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{premiumStatus?.planName || 'No active plan'}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${premiumStatus?.premium ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {premiumStatus?.premium ? 'Active' : premiumStatus?.expired ? 'Expired' : 'Not purchased'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {premiumStatus?.order
                          ? `₹${Number(premiumStatus.order.price || 0).toLocaleString('en-IN')} for ${premiumStatus.order.durationMonths || 1} month${Number(premiumStatus.order.durationMonths) === 1 ? '' : 's'} · ends ${premiumStatus.endsOn || '—'}`
                          : 'Pick a plan below and pay with Razorpay.'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Price', premiumStatus?.order?.price != null ? `₹${Number(premiumStatus.order.price).toLocaleString('en-IN')}` : '—'],
                    ['Duration', premiumStatus?.order?.durationMonths ? `${premiumStatus.order.durationMonths} month${Number(premiumStatus.order.durationMonths) === 1 ? '' : 's'}` : '—'],
                    ['Payment', 'Razorpay'],
                    ['Status', premiumStatus?.premium ? 'Paid' : premiumStatus?.order?.status || 'None'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
                      <span className="mt-1 block text-sm font-bold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Package className="h-4 w-4 text-emerald-600" />
                      Plans
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {canManagePlans ? 'Add a plan, change its price, or remove it.' : 'These are the plans you can buy for this company.'}
                    </p>
                  </div>
                  {canManagePlans && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlan(null);
                        setPlanForm({ name: '', price: 999, durationMonths: 1, description: '', status: 'Active' });
                        setIsCreatePlanOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 self-start rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create plan
                    </button>
                  )}
                </div>

                {plansLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold">Loading plans...</span>
                  </div>
                ) : plansList.length === 0 ? (
                  <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                    <Package className="mb-3 h-6 w-6 text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-800">No plans yet</h4>
                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      {canManagePlans ? 'Create a plan for companies to purchase.' : 'A super admin has not added a plan yet.'}
                    </p>
                    {canManagePlans && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlan(null);
                          setPlanForm({ name: '', price: 999, durationMonths: 1, description: '', status: 'Active' });
                          setIsCreatePlanOpen(true);
                        }}
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Create plan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {plansList.map((plan: any) => {
                      const months = Number(plan.durationMonths) || 1;
                      const price = Number(plan.price) || 0;
                      const isCurrent = !canManagePlans && premiumStatus?.premium && premiumStatus?.order?.planId === plan.id;
                      const inactive = String(plan.status || 'Active') !== 'Active';
                      return (
                        <div
                          key={plan.id}
                          className={`flex flex-col rounded-2xl border p-5 ${isCurrent ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isCurrent ? 'bg-emerald-600 text-white' : inactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                              {isCurrent ? 'Current' : plan.status || 'Active'}
                            </span>
                          </div>
                          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">₹{price.toLocaleString('en-IN')}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{months} month{months === 1 ? '' : 's'}</p>
                          <p className="mt-3 min-h-10 text-sm leading-5 text-slate-600">{plan.description || 'Company plan'}</p>
                          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                            {canManagePlans ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPlan(plan);
                                    setPlanForm({
                                      name: plan.name || '',
                                      price,
                                      durationMonths: months,
                                      description: plan.description || '',
                                      status: plan.status || 'Active',
                                    });
                                    setIsCreatePlanOpen(true);
                                  }}
                                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingPlan(plan)}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold ${isCurrent ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                              >
                                {isCurrent ? 'Current plan' : 'Purchase'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Premium Orders History (GET /premium/orders) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      Premium Orders
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Payments for this company.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadPlansAndPremium}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                    title="Refresh Orders"
                  >
                    <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="py-8 flex justify-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                  </div>
                ) : premiumOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No premium orders recorded yet.
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden divide-y divide-slate-100 rounded-2xl border border-slate-100">
                      {premiumOrders.map((ord: any) => (
                        <div key={`mob-ord-${ord.id}`} className="p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 truncate">{ord.planName || ord.planId || 'Plan Tier'}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 shrink-0">
                              {ord.status || 'Completed'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono">{ord.id?.slice(0, 12)}...</span>
                            <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrder(ord);
                                setOrderStatusVal(ord.status || 'Active');
                              }}
                              className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Plan</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {premiumOrders.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                              {ord.id?.slice(0, 12)}...
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {ord.planName || ord.planId || 'Plan Tier'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                {ord.status || 'Completed'}
                            </span>
                          </td>
                            <td className="px-4 py-3 text-slate-500">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="px-4 py-3 text-right">
                            {canManagePlans && (
                            <button
                                type="button"
                              onClick={() => {
                                  setEditingOrder(ord);
                                  setOrderStatusVal(ord.status || 'Active');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                              >
                                Update Status
                            </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Tab 5: Support Inquiries (GET /support, GET /support/:id, PATCH /support/:id) ── */}
          {adminActiveTab === 'support' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-600" />
                    Support &amp; Demo Inquiries
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Leads and demo requests submitted through the portal (GET /support, PATCH /support/:id)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSupportData}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supportLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {supportLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold">Loading inquiries...</span>
                </div>
              ) : supportList.length === 0 ? (
                <div className="py-16 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Inquiries Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    When visitors submit demo bookings or contact requests on the website, they will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View (< md) */}
                  <div className="md:hidden divide-y divide-slate-100 rounded-2xl border border-slate-100">
                    {supportList.map((item: any) => (
                      <div key={`mob-sup-${item.id}`} className="p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-50 text-indigo-700">
                            {item.kind || 'Demo'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Read'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status || 'New'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name} {item.companyName ? `(${item.companyName})` : ''}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.email} • {item.phone || 'No phone'}</p>
                        </div>
                        {item.message && <p className="text-slate-600 line-clamp-2">{item.message}</p>}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleViewSupportReq(item)}
                            className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                          >
                            View
                          </button>
                          {item.status !== 'Resolved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSupportReqStatus(item.id, 'Resolved')}
                              className="min-h-[36px] px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Message</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supportList.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">
                              {item.kind || 'Demo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{item.email} &bull; {item.phone || 'No phone'}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {item.companyName || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                            {item.message || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'Read'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status || 'New'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleViewSupportReq(item)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                              >
                                View
                              </button>
                              {item.status !== 'Resolved' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSupportReqStatus(item.id, 'Resolved')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition cursor-pointer"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {isUpgradeModalOpen && (
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
          onPlanUpdated={() => {
            refreshSubscriptionData();
            loadPlansAndPremium();
          }}
        />
      )}

      {/* Create / Edit Plan Modal (POST /plans, PATCH /plans/:id) */}
      {isCreatePlanOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setIsCreatePlanOpen(false);
            setEditingPlan(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPlan ? 'Edit System Plan' : 'Create System Plan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatePlanOpen(false);
                  setEditingPlan(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Plan Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Enterprise Pro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    required
                    value={planForm.durationMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationMonths: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Plan features and coverage description..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 resize-none font-semibold"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatePlanOpen(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold transition cursor-pointer shadow-xs"
                >
                  {editingPlan ? 'Update Plan' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Plan Modal (DELETE /plans/:id) */}
      {Boolean(deletingPlan) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingPlan(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto flex flex-col p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete System Plan?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-700">{deletingPlan.name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingPlan(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlanConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer shadow-xs"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Plan Modal (POST /plans/:id/sell) */}
      {Boolean(sellingPlan) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSellingPlan(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Sell Plan to Company</h3>
              <button
                type="button"
                onClick={() => setSellingPlan(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSellPlanSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              <p className="text-slate-500">
                Assigning <span className="font-bold text-slate-800">{sellingPlan.name}</span> directly to a target company.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Company ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sellCompanyId}
                  onChange={(e) => setSellCompanyId(e.target.value)}
                  placeholder="UUID e.g. 92744968-6ab2-4dd7-..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSellingPlan(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold transition cursor-pointer shadow-xs"
                >
                  Assign Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Order Status Modal (PATCH /premium/orders/:id) */}
      {Boolean(editingOrder) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setEditingOrder(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Update Order Status</h3>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateOrderStatus} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={orderStatusVal}
                  onChange={(e) => setOrderStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold transition cursor-pointer shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Support Details Modal (GET /support/:id, PATCH /support/:id) */}
      {Boolean(viewingSupport) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingSupport(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {viewingSupport.kind || 'Demo'} Inquiry Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSupport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Name</span>
                  <span className="font-bold text-slate-900">{viewingSupport.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Company</span>
                  <span className="font-bold text-slate-900">{viewingSupport.companyName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                  <span className="font-bold text-slate-900">{viewingSupport.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                  <span className="font-bold text-slate-900">{viewingSupport.phone || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Message</span>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {viewingSupport.message || 'No additional message provided.'}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Status: <span className="font-bold text-slate-800">{viewingSupport.status || 'New'}</span>
                </span>
                <div className="flex items-center gap-2">
                  {viewingSupport.status !== 'Read' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSupportReqStatus(viewingSupport.id, 'Read')}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition cursor-pointer"
                    >
                      Mark as Read
                    </button>
                  )}
                  {viewingSupport.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSupportReqStatus(viewingSupport.id, 'Resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer shadow-xs"
                    >
                      Mark Resolved
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingSupport(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function KioskVoiceCard({
  onSaved,
  onError,
}: {
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [lang, setLang] = useState<KioskVoiceLang>('en-IN');
  const [gender, setGender] = useState<KioskVoiceGender>('female');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.getKioskVoice()
      .then((res: any) => {
        if (!active) return;
        const nextLang = String(res?.kioskVoiceLang || 'en-IN') as KioskVoiceLang;
        if (KIOSK_VOICE_LANGUAGES.some((item) => item.code === nextLang)) {
          setLang(nextLang);
        }
        setGender(res?.kioskVoiceGender === 'male' ? 'male' : 'female');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveKioskVoice({ kioskVoiceLang: lang, kioskVoiceGender: gender });
      onSaved('Face Clock Kiosk voice language and type updated.');
    } catch (err: any) {
      onError(err?.message || 'Could not save voice settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Face Clock Kiosk Voice &amp; Language</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Choose the spoken language and voice type (Female / Male) for Face Clock announcements.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            unlockKioskSpeech();
            speakKioskText({ kind: 'test' }, {
              enabled: true,
              lang,
              gender,
            });
          }}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          Test Voice
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {KIOSK_VOICE_LANGUAGES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLang(item.code)}
            className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
              lang === item.code
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div>{item.label}</div>
            <div className="text-[10px] text-slate-500">{item.native}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1">
          {(['female', 'male'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                gender === g ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Voice'}</span>
        </button>
      </div>
    </div>
  );
}
