'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  Shield,
  User,
  UserPlus,
  Phone,
  Briefcase,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const LoginPage: React.FC = () => {
  const { loginAsAdmin, loginAsEmployee, registerUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'employee' | 'signup'>('admin');

  // Admin login states - Pre-filled with verified credentials
  const [adminIdentifier, setAdminIdentifier] = useState('keyursangani1210@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Keyursangani_932006');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Employee login states
  const [empIdentifier, setEmpIdentifier] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  // Sign up states
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'EMPLOYEE' | 'HR_ADMIN' | 'MANAGER'>('EMPLOYEE');
  const [signupDepartmentId, setSignupDepartmentId] = useState('dept-1');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Available departments list
  const [departments, setDepartments] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDepartments()
      .then((deps) => {
        if (Array.isArray(deps) && deps.length > 0) {
          setDepartments(deps);
          setSignupDepartmentId(deps[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleAdminSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await loginAsAdmin(adminIdentifier, adminPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await loginAsEmployee(empIdentifier, empPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Employee record not found');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend validations
    if (!signupFirstName.trim() || !signupLastName.trim()) {
      setErrorMessage('First name and last name are required.');
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        phone: signupPhone.trim(),
        role: signupRole,
        departmentId: signupDepartmentId || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Registration failed. Please try again.');
      } else {
        setSuccessMessage('Account created successfully! Logging you in...');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden select-none">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className={`w-full ${activeTab === 'signup' ? 'max-w-md' : 'max-w-sm'} transition-all duration-300 relative z-10`}>
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span>Paneliya HRMS • Jibble Platform</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Paneliya Technology
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'signup'
              ? 'Register a new account directly in database'
              : 'Sign in to your workplace time-tracking portal'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-950/40 border border-slate-100 p-6 sm:p-7">
          {/* Jibble Tab Selector */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('employee');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'employee'
                  ? 'bg-white text-indigo-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Employee</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-white text-indigo-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Quick-fill credentials banner for Super Admin */}
          {activeTab === 'admin' && (
            <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-indigo-50/90 border border-indigo-100 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  KS
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">Keyur Sangani</p>
                    <span className="px-1.5 py-0.2 rounded-md bg-indigo-600 text-[9px] text-white font-extrabold uppercase tracking-wider">
                      Owner
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">keyursangani1210@gmail.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminIdentifier('keyursangani1210@gmail.com');
                  setAdminPassword('Keyursangani_932006');
                  handleAdminSubmit();
                }}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1"
                title="1-Click Login with Keyur Sangani"
              >
                <span>Fast Login</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'admin' ? (
            /* ========================================================== */
            /* ADMIN LOGIN                                                */
            /* ========================================================== */
            <form onSubmit={handleAdminSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="Email or phone (e.g. keyursangani1210@gmail.com)"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <span className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : activeTab === 'employee' ? (
            /* ========================================================== */
            /* EMPLOYEE LOGIN                                             */
            /* ========================================================== */
            <form onSubmit={handleEmployeeSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Employee ID, Email, or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={empIdentifier}
                    onChange={(e) => setEmpIdentifier(e.target.value)}
                    placeholder="e.g. EMP-1, EMP-2, or employee email"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password / PIN</label>
                  <span className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                    Need help?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEmpPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmpPassword(!showEmpPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEmpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Punch Clock</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ========================================================== */
            /* SIGN UP / NEW REGISTRATION (DIRECT TO DATABASE)            */
            /* ========================================================== */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5" autoComplete="off">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="e.g. Keyur"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    placeholder="e.g. Sangani"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@paneliya.com"
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full h-10 pl-8 pr-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={signupDepartmentId}
                    onChange={(e) => setSignupDepartmentId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:border-indigo-600"
                  >
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <option value="dept-1">Administration & Management</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole('EMPLOYEE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      signupRole === 'EMPLOYEE'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Staff / Member</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('HR_ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      signupRole === 'HR_ADMIN'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>HR / Admin</span>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Create Password (min. 6 chars) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSignupConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving directly to Database...</span>
                  </>
                ) : (
                  <>
                    <span>Register &amp; Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Helper Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            {activeTab === 'signup' ? (
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign in as Administrator
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                New user without account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign Up &amp; Save to Database
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          Paneliya Technology Enterprise • Real-Time Cloud HRMS
        </p>
      </div>
    </div>
  );
};
