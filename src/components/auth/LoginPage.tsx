'use client';

import React, { useState } from 'react';
import {
  Shield,
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginAsAdmin, loginAsEmployee } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');

  // Admin form state
  const [adminIdentifier, setAdminIdentifier] = useState('keyur.sangani1234@gmail.com');
  const [adminPassword, setAdminPassword] = useState('123456789');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Employee form state
  const [empIdentifier, setEmpIdentifier] = useState('EMP-2');
  const [empPassword, setEmpPassword] = useState('123456');
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginAsAdmin(adminIdentifier, adminPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginAsEmployee(empIdentifier, empPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Employee not found');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Buttons
  const handleQuickAdmin = async (phone: string, pass: string) => {
    setAdminIdentifier(phone);
    setAdminPassword(pass);
    setLoading(true);
    await loginAsAdmin(phone, pass);
    setLoading(false);
  };

  const handleQuickEmployee = async (code: string) => {
    setEmpIdentifier(code);
    setEmpPassword('123456');
    setLoading(true);
    await loginAsEmployee(code, '123456');
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paneliya HRMS</h1>
        <p className="text-xs text-slate-500 mt-1">Enterprise Workforce & Attendance Management System</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Top Dual Tabs Switcher */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/80 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${activeTab === 'admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('employee');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'employee'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${activeTab === 'employee' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Employee Login</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'admin' ? (
            /* ============================================================== */
            /* ADMIN LOGIN FORM                                               */
            /* ============================================================== */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  <span>HR & Admin Portal</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sign In as Administrator</h2>
                <p className="text-xs text-slate-500">
                  Access employee management, leave approvals, payroll, and settings.
                </p>
              </div>

              {/* Email / Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Admin Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="keyur.sangani1234@gmail.com or 6352486893"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 z-10"
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Fill Box */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  ⚡ Quick Demo Login
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickAdmin('6352486893', '123456789')}
                  className="w-full p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 text-left flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                      KS
                    </div>
                    <div>
                      <p className="font-bold text-indigo-950">Keyur Sangani (Super Admin)</p>
                      <p className="text-[10px] text-indigo-600">6352486893 • Pass: 123456789</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    Auto Login ➔
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* ============================================================== */
            /* EMPLOYEE LOGIN FORM                                            */
            /* ============================================================== */
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  <User className="w-3 h-3" />
                  <span>Employee Self-Service</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sign In as Employee</h2>
                <p className="text-xs text-slate-500">
                  Punch live attendance, apply for leaves, and view your profile.
                </p>
              </div>

              {/* Employee Code or Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Employee Code or Work Email
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={empIdentifier}
                    onChange={(e) => setEmpIdentifier(e.target.value)}
                    placeholder="e.g. EMP-2 or rahul.sharma@paneliya.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password / PIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Password / PIN</label>
                  <span className="text-[11px] text-emerald-600 hover:underline cursor-pointer">
                    Help with PIN?
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEmpPassword ? 'text' : 'password'}
                    required
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmpPassword(!showEmpPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 z-10"
                    title={showEmpPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEmpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Logging in...' : 'Sign In to Employee Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Select Employee Chips */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  👥 Quick Select Team Member
                </p>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickEmployee('EMP-2')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                        RS
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Rahul Sharma</p>
                        <p className="text-[10px] text-slate-500">EMP-2 • Senior Fullstack Engineer</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">Login ➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickEmployee('EMP-3')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                        PP
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Priya Patel</p>
                        <p className="text-[10px] text-slate-500">EMP-3 • Lead Product Designer</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">Login ➔</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Nest.js REST API & WebSocket Active
          </span>
          <span className="font-semibold text-slate-600">v1.0.0</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-6 text-center">
        © 2026 paneliya technology. All rights reserved.
      </p>
    </div>
  );
};
