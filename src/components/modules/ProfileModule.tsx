'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Building2,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Key,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Briefcase,
  Search,
} from 'lucide-react';
import axios from 'axios';
import { getCookie } from '../../lib/cookies';
import { api } from '../../lib/api';

/* ==========================================================================
   TYPE DEFINITIONS (Strictly matching the /api/users/profile response)
   ========================================================================== */

export interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string | null;
  address: string | null;
  avatarUrl: string | null;
  companyId: string;
  companyName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePermission {
  key: string;
  label: string;
}

export interface ProfileCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  gstNumber: string | null;
  industrySector: string;
  industryId: string | null;
  state: string;
  city: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponseData {
  user: ProfileUser;
  role: string;
  permissions: ProfilePermission[];
  company: ProfileCompany;
}

interface ProfileModuleProps {
  onNavigateSettings?: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = () => {
  const [profileData, setProfileData] = useState<ProfileResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState<string>('');

  /* ==========================================================================
     FETCH PROFILE FROM API
     ========================================================================== */
  const fetchProfile = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch directly from the profile endpoint
      let data: ProfileResponseData | null = null;

      try {
        // 1. Try via Next.js route handler /api/users/profile
        const res = await axios.get('/api/users/profile', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${getCookie('accessToken') || getCookie('hrms_auth_token') || getCookie('bearerToken') || ''}`,
          },
        });
        if (res.data && res.data.user) {
          data = res.data;
        }
      } catch (err: any) {
        console.warn('[ProfileModule] /api/users/profile attempt:', err?.message);
      }

      // 2. If not loaded, fallback to api.getProfile()
      if (!data) {
        const apiRes = await api.getProfile();
        if (apiRes && (apiRes as any).user) {
          data = apiRes as ProfileResponseData;
        }
      }

      if (data && data.user) {
        setProfileData(data);
      } else {
        throw new Error('Invalid profile response received from server.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load your profile details. Please verify your connection.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(false);
  }, [fetchProfile]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString || '—';
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString || '—';
    }
  };

  const filteredPermissions = useMemo(() => {
    if (!profileData?.permissions) return [];
    if (!permSearch.trim()) return profileData.permissions;
    const q = permSearch.toLowerCase().trim();
    return profileData.permissions.filter(
      (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
    );
  }, [profileData?.permissions, permSearch]);

  /* ==========================================================================
     LOADING STATE
     ========================================================================== */
  if (loading) {
    return (
      <div className="space-y-6 w-full animate-in fade-in duration-200">
        {/* Skeleton Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="space-y-2">
              <div className="w-48 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-32 h-4 bg-slate-100 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="w-28 h-9 bg-slate-100 rounded-xl animate-pulse" />
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-40 h-5 bg-slate-100 rounded-md animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                  <div className="w-20 h-3 bg-slate-200/60 rounded-sm animate-pulse" />
                  <div className="w-32 h-4 bg-slate-200/80 rounded-sm animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-40 h-5 bg-slate-100 rounded-md animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                  <div className="w-20 h-3 bg-slate-200/60 rounded-sm animate-pulse" />
                  <div className="w-32 h-4 bg-slate-200/80 rounded-sm animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     ERROR STATE
     ========================================================================== */
  if (error || !profileData) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Failed to Load Profile</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {error || 'Unable to retrieve your profile details from the server.'}
          </p>
        </div>
        <button
          onClick={() => fetchProfile(false)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const { user, role, permissions, company } = profileData;
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Profile';
  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200 select-none pb-8">
      {/* ==================================================================== */}
      {/* 1. TOP HERO PROFILE CARD                                             */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Main Info */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0 tracking-wider">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Name, Badges & Meta */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="w-3 h-3" />
                  <span>{user.role || role || 'USER'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{user.status || 'Active'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                {user.email && (
                  <span className="inline-flex items-center gap-1.5 text-slate-600 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.email}</span>
                  </span>
                )}
                {user.phone && (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.phone}</span>
                  </span>
                )}
                {user.companyName && (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{user.companyName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons & Member Since */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={() => fetchProfile(true)}
              disabled={refreshing}
              title="Refresh profile details"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2-COLUMN DETAILS LAYOUT (User & Company)                             */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================================================================== */}
        {/* CARD A: USER DETAILS                                               */}
        {/* ================================================================== */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">User Account Details</h2>
                <p className="text-[11px] text-slate-500">Personal credentials and account identifiers</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
              Profile Data
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* First Name */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">First Name</span>
              <span className="font-semibold text-slate-800 text-sm block">{user.firstName || '—'}</span>
            </div>

            {/* Last Name */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Last Name</span>
              <span className="font-semibold text-slate-800 text-sm block">{user.lastName || '—'}</span>
            </div>

            {/* Email */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
              <span className="font-semibold text-slate-800 truncate block" title={user.email}>
                {user.email || '—'}
              </span>
            </div>

            {/* Phone */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone Number</span>
              <span className="font-semibold text-slate-800 block">{user.phone || '—'}</span>
            </div>

            {/* Gender */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gender</span>
              <span className="font-semibold text-slate-800 block capitalize">{user.gender || 'Not specified'}</span>
            </div>

            {/* Account Role */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Access Role</span>
              <span className="font-bold text-emerald-700 block">{user.role || '—'}</span>
            </div>

            {/* Residential Address (Full span) */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Residential Address</span>
              <span className="font-semibold text-slate-800 block">{user.address || 'Not specified'}</span>
            </div>

            {/* User ID (Full span) */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">User System ID</span>
                <button
                  onClick={() => handleCopy(user.id, 'user-id')}
                  className="text-[10px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedKey === 'user-id' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <span className="font-mono text-xs text-slate-700 block truncate select-all">{user.id || '—'}</span>
            </div>

            {/* Timestamps */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Created At
              </span>
              <span className="font-semibold text-slate-700 text-xs block">{formatDateTime(user.createdAt)}</span>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated At
              </span>
              <span className="font-semibold text-slate-700 text-xs block">{formatDateTime(user.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* CARD B: COMPANY DETAILS                                            */}
        {/* ================================================================== */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Company Information</h2>
                <p className="text-[11px] text-slate-500">Associated tenant workspace & organization profile</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md">
              {company.status || 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Company Name */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Company Name</span>
              <span className="font-bold text-slate-900 text-sm block">{company.name || '—'}</span>
            </div>

            {/* Industry Sector */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Industry Sector
              </span>
              <span className="font-semibold text-slate-800 block">{company.industrySector || '—'}</span>
            </div>

            {/* Company Email */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Official Email</span>
              <span className="font-semibold text-slate-800 truncate block" title={company.email}>
                {company.email || '—'}
              </span>
            </div>

            {/* Company Phone */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone</span>
              <span className="font-semibold text-slate-800 block">{company.phone || '—'}</span>
            </div>

            {/* GST Number */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">GSTIN / Tax ID</span>
              <span className="font-semibold text-slate-800 block font-mono">{company.gstNumber || 'Not Registered'}</span>
            </div>

            {/* Location */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </span>
              <span className="font-semibold text-slate-800 block">
                {company.city ? `${company.city}, ${company.state}` : company.state || '—'}
              </span>
            </div>

            {/* Office Address (Full span) */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Registered Address</span>
              <span className="font-semibold text-slate-800 block">{company.address || '—'}</span>
            </div>

            {/* Company ID (Full span) */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Company Workspace ID</span>
                <button
                  onClick={() => handleCopy(company.id, 'company-id')}
                  className="text-[10px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedKey === 'company-id' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <span className="font-mono text-xs text-slate-700 block truncate select-all">{company.id || '—'}</span>
            </div>

            {/* Timestamps */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Established
              </span>
              <span className="font-semibold text-slate-700 text-xs block">{formatDate(company.createdAt)}</span>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Record Updated
              </span>
              <span className="font-semibold text-slate-700 text-xs block">{formatDate(company.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ASSIGNED SYSTEM PERMISSIONS                                       */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Assigned System Permissions</h2>
              <p className="text-[11px] text-slate-500">
                Access control privileges granted to your account role ({role || user.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search filter for permissions */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400"
              />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
              {permissions?.length || 0} Total
            </span>
          </div>
        </div>

        {/* Permissions Grid */}
        {filteredPermissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPermissions.map((perm) => (
              <div
                key={perm.key}
                className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all flex items-start gap-2.5 group"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 block leading-snug">
                    {perm.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 block mt-0.5 truncate">
                    {perm.key}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No permissions matching &quot;{permSearch}&quot;
          </div>
        )}
      </div>
    </div>
  );
};
