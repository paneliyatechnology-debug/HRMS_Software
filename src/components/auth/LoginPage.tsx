'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  User,
  UserPlus,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export type LoginSide = 'admin' | 'employee';

export interface LoginPageProps {
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome }) => {
  const router = useRouter();
  const { loginAsAdmin, loginAsEmployee, registerUser, loginWithDemoAccount } = useAuth();
  const handleBack = onBackToHome || (() => router.push('/'));
  
  // Login side switcher: Company Admin or Staff Employee
  const [loginSide, setLoginSide] = useState<LoginSide>('admin');
  const [viewMode, setViewMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up / New User state
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

  // Bottom Popup State for unassociated / unlinked organization users
  const [notInOrgPopup, setNotInOrgPopup] = useState<{
    open: boolean;
    email: string;
    attemptRole?: string;
  } | null>(null);

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

  // Handle switching login sides
  const switchSide = (side: LoginSide) => {
    setLoginSide(side);
    setViewMode('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotInOrgPopup(null);
    setIdentifier('');
    setPassword('');
  };

  // Handle Side-Specific Login Submission
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotInOrgPopup(null);
    setLoading(true);

    try {
      let res: { success: boolean; message?: string; notInOrganization?: boolean };

      if (loginSide === 'admin') {
        res = await loginAsAdmin(identifier, password);
      } else {
        res = await loginAsEmployee(identifier, password);
      }

      if (!res.success) {
        if (
          res.notInOrganization ||
          res.message?.toLowerCase().includes('not part of any organization')
        ) {
          setNotInOrgPopup({
            open: true,
            email: identifier.trim(),
            attemptRole: loginSide === 'admin' ? 'Company Admin' : 'Staff Employee',
          });
        }

        setErrorMessage(
          res.message ||
            (loginSide === 'admin'
              ? 'Invalid Admin credentials. Please verify your company email or phone.'
              : 'Invalid Employee credentials. Please check your Employee ID, email or PIN.')
        );
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Login (No Database Needed)
  const handleQuickDemoLogin = async (key: 'admin' | 'employee' | 'superadmin') => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await loginWithDemoAccount(key);
      if (res.success) {
        setSuccessMessage(`Logged in as ${key === 'admin' ? 'Company Admin' : key === 'superadmin' ? 'Super Admin' : 'Staff Employee'} (Demo Mode)!`);
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        setErrorMessage(res.message || 'Demo login failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle New User Registration
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validations
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
      setErrorMessage('Passwords do not match. Please verify your password.');
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
        if (
          res.notInOrganization ||
          res.message?.toLowerCase().includes('not part of any organization')
        ) {
          setNotInOrgPopup({
            open: true,
            email: signupEmail.trim(),
            attemptRole: signupRole === 'EMPLOYEE' ? 'Staff Employee' : 'Company Admin',
          });
        }
        setErrorMessage(res.message || 'Registration failed. Please try again.');
      } else {
        setSuccessMessage('Account registered successfully! Entering your workspace...');
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative select-none selection:bg-[#FFE600] selection:text-black">
      
      {/* Subtle retro Neo-Brutalist decorative shapes */}
      <div className="absolute top-10 left-10 w-24 h-24 rounded-2xl border-2 border-black bg-[#FFE600]/40 -rotate-6 -z-10 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-12 right-12 w-28 h-28 rounded-full border-2 border-black bg-[#00F0B5]/30 rotate-12 -z-10 pointer-events-none hidden sm:block" />

      <div className={`w-full ${viewMode === 'signup' ? 'max-w-md' : 'max-w-md'} transition-all duration-300 relative z-10`}>
        
        {/* Top Navigation Row: Back Link */}
        <div className="flex items-center justify-start mb-5">
          <button
            id="btn-back-to-landing"
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-[#FFE600] border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home Overview</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FFE600] border-[3px] border-black text-black flex items-center justify-center mx-auto mb-3 shadow-[4px_4px_0px_0px_#000] -rotate-1 font-black text-2xl">
            <Building2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            My Own HRMS
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-1">
            {viewMode === 'signup'
              ? 'Create a new employee or administrator account'
              : loginSide === 'admin'
              ? 'Company Owner & HR Management Portal'
              : 'Employee Workplace & Attendance Self-Service'}
          </p>
        </div>

        {/* Neo-Brutalist Main Card */}
        <div className="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0px_0px_#000] p-6 sm:p-8">
          
          {/* 2-Side Switcher: Company Admin vs Employee */}
          {viewMode === 'login' ? (
            <div className="grid grid-cols-2 bg-[#FAF8F5] p-1.5 rounded-2xl mb-6 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#000] gap-1.5">
              {/* 1. Admin Side */}
              <button
                id="tab-side-admin"
                type="button"
                onClick={() => switchSide('admin')}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginSide === 'admin'
                    ? 'bg-[#FFE600] text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-black hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span className="truncate">Company Admin</span>
              </button>

              {/* 2. Employee Side */}
              <button
                id="tab-side-employee"
                type="button"
                onClick={() => switchSide('employee')}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginSide === 'employee'
                    ? 'bg-[#00F0B5] text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-black hover:bg-slate-100 border border-transparent'
                }`}
              >
                <User className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span className="truncate">Staff Employee</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center">
                  <UserPlus className="w-4 h-4 stroke-[2.5] text-black" />
                </div>
                <h2 className="text-sm font-black text-black uppercase tracking-wider">New User Registration</h2>
              </div>
              <button
                id="btn-back-to-login-sides"
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-black text-black hover:bg-[#FFE600] px-2 py-1 rounded border border-black shadow-[1px_1px_0px_0px_#000] cursor-pointer"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FF5E97] border-2 border-black text-black text-xs font-black flex items-start gap-2.5 shadow-[3px_3px_0px_0px_#000] animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#00F0B5] border-2 border-black text-black text-xs font-black flex items-start gap-2.5 shadow-[3px_3px_0px_0px_#000] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{successMessage}</span>
            </div>
          )}

          {viewMode === 'login' ? (
            /* ========================================================== */
            /* LOGIN FORM (Admin & Employee)                              */
            /* ========================================================== */
            <form
              onSubmit={handleLoginSubmit}
              className="space-y-4"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            >

              {/* Identifier Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    {loginSide === 'admin'
                      ? 'Company Admin Email or Phone'
                      : 'Employee Code, Email or Phone'}
                  </label>
                </div>
                <div className="relative">
                  {loginSide === 'admin' ? (
                    <Mail className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  ) : (
                    <User className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  )}
                  <input
                    id="input-login-identifier"
                    name="paneliya_auth_user"
                    type="text"
                    required
                    autoComplete="one-time-code"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      loginSide === 'admin'
                        ? 'Enter admin email or phone'
                        : 'Enter employee code, email or phone'
                    }
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-500 font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all bg-[#FAF8F5] focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    {loginSide === 'admin'
                      ? 'Admin Password'
                      : 'Password / PIN'}
                  </label>
                  <span className="text-xs text-black font-black hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    id="input-login-password"
                    name="paneliya_auth_key"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-500 font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all bg-[#FAF8F5] focus:bg-white"
                  />
                  <button
                    id="btn-toggle-login-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-[#00F0B5] hover:bg-[#00e0a5] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying {loginSide === 'admin' ? 'Company Admin' : 'Employee'}...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {loginSide === 'admin'
                        ? 'Sign In as Company Admin'
                        : 'Sign In to Employee Portal'}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Quick 1-Click Demo Login (No Database Needed) */}
              <div className="mt-5 pt-4 border-t-2 border-black">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00F0B5] animate-pulse" />
                    <span>Quick Demo Access (No DB Needed)</span>
                  </span>
                  <span className="text-[10px] font-black bg-[#FFE600] text-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]">
                    1-CLICK LOGIN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-demo-admin-login"
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin')}
                    disabled={loading}
                    className="p-2.5 rounded-xl border-2 border-black bg-[#FAF8F5] hover:bg-[#FFE600] text-black text-left transition-all shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">🏢 Demo Admin</span>
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">HR ADMIN</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-700 truncate mt-1">admin@paneliya.com</p>
                    <p className="text-[9px] font-mono text-slate-500">Pass: admin123</p>
                  </button>

                  <button
                    id="btn-demo-employee-login"
                    type="button"
                    onClick={() => handleQuickDemoLogin('employee')}
                    disabled={loading}
                    className="p-2.5 rounded-xl border-2 border-black bg-[#FAF8F5] hover:bg-[#00F0B5] text-black text-left transition-all shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">👤 Demo Employee</span>
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">STAFF</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-700 truncate mt-1">employee@paneliya.com</p>
                    <p className="text-[9px] font-mono text-slate-500">Pass: emp123 (EMP-101)</p>
                  </button>
                </div>

                <button
                  id="btn-demo-superadmin-login"
                  type="button"
                  onClick={() => handleQuickDemoLogin('superadmin')}
                  disabled={loading}
                  className="w-full mt-2 py-2 px-3 rounded-xl border-2 border-black bg-white hover:bg-purple-100 text-black text-center transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>👑 1-Click Super Admin (superadmin@paneliya.com • superadmin123)</span>
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================== */
            /* NEW USER REGISTRATION FORM                                 */
            /* ========================================================== */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5" autoComplete="off">
              {/* Employee Auto-Link Callout */}
              <div className="p-3.5 rounded-2xl bg-[#FFFDF0] border-2 border-black text-xs text-black flex items-start gap-2.5 shadow-[2px_2px_0px_0px_#000]">
                <span className="text-lg leading-none">🏢</span>
                <div>
                  <p className="font-black text-black">Joining as an Employee?</p>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5 leading-snug">
                    Enter the <strong>Email</strong> or <strong>Mobile Number</strong> assigned by your company admin for instant access!
                  </p>
                </div>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-signup-firstname"
                    type="text"
                    required
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="e.g. Keyur"
                    className="w-full h-10 px-3 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-400 font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-signup-lastname"
                    type="text"
                    required
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    placeholder="e.g. Sangani"
                    className="w-full h-10 px-3 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-400 font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 pl-8 pr-3 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-400 font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    id="input-signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 pl-8 pr-3 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-400 font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">Role</label>
                  <select
                    id="select-signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full h-10 px-2.5 rounded-xl border-2 border-black text-xs text-black font-bold focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  >
                    <option value="EMPLOYEE">Staff Employee</option>
                    <option value="HR_ADMIN">Company Admin / HR</option>
                    <option value="MANAGER">Department Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">Department</label>
                  <select
                    id="select-signup-dept"
                    value={signupDepartmentId}
                    onChange={(e) => setSignupDepartmentId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border-2 border-black text-xs text-black font-bold focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                    {departments.length === 0 && (
                      <option value="dept-1">Administration</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    id="input-signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-400 font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-slate-700 cursor-pointer"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    id="input-signup-confirm-password"
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border-2 border-black text-xs text-black placeholder:text-slate-400 font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-[#FAF8F5] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-slate-700 cursor-pointer"
                  >
                    {showSignupConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Sign Up Button */}
              <button
                id="btn-submit-signup"
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-[#FFE600] hover:bg-[#ffd700] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Saving account...</span>
                  </>
                ) : (
                  <>
                    <span>Register &amp; Enter Workspace</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Switcher Link */}
          <div className="mt-6 pt-4 border-t-2 border-black text-center">
            {viewMode === 'signup' ? (
              <p className="text-xs font-bold text-slate-700">
                Already have an account?{' '}
                <button
                  id="link-switch-to-login"
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-black text-black underline hover:bg-[#FFE600] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p className="text-xs font-bold text-slate-700">
                New user or organization?{' '}
                <button
                  id="link-switch-to-signup"
                  type="button"
                  onClick={() => {
                    setViewMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-black text-black underline hover:bg-[#FFE600] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Create an account (Sign Up)
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] font-black uppercase tracking-wider text-black mt-6">
          <span className="bg-[#FAF8F5] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            My Own HRMS • Enterprise Cloud Suite
          </span>
        </p>
      </div>

      {/* ================================================================ */}
      {/* BOTTOM POPUP: "You are not part of any organization"             */}
      {/* ================================================================ */}
      {notInOrgPopup?.open && (
        <div
          id="not-in-org-bottom-popup"
          role="alert"
          aria-live="assertive"
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
        >
          <div className="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
            {/* Top alert header bar */}
            <div className="bg-[#FF5E97] px-4 py-2 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-black animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-black">
                  Access Restricted • Organization Required
                </span>
              </div>
              <button
                id="btn-close-not-in-org-popup"
                type="button"
                onClick={() => setNotInOrgPopup(null)}
                className="w-6 h-6 rounded-lg bg-white hover:bg-[#FFE600] border-2 border-black text-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-[2.5px] border-black text-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#000] -rotate-2">
                  <ShieldAlert className="w-6 h-6 stroke-[2.5] text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-black text-black tracking-tight leading-tight">
                    You are not part of any organization
                  </h3>
                  <p className="text-xs font-bold text-slate-700 mt-1 leading-snug">
                    The email or ID <span className="font-mono bg-[#FFFDF0] px-1.5 py-0.5 rounded border border-black font-black text-black">{notInOrgPopup.email}</span> has not been added to any company or organization yet.
                  </p>
                </div>
              </div>

              {/* Informative Guidance Box */}
              <div className="mt-3.5 p-3 rounded-2xl bg-[#FAF8F5] border-2 border-black text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-black text-[11px] uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>How to get access:</span>
                </div>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                  1. Contact your <strong>Company Administrator or HR</strong>.
                </p>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                  2. Ask them to add your email using the <strong>Add Employee</strong> button in their company dashboard.
                </p>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                  3. Once added, you will automatically be linked to their company workspace and can log in here!
                </p>
              </div>

              {/* Actions Row */}
              <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-end gap-2.5">
                <button
                  id="btn-popup-try-another"
                  type="button"
                  onClick={() => {
                    setNotInOrgPopup(null);
                    setIdentifier('');
                    const inputEl = document.getElementById('input-login-identifier');
                    if (inputEl) inputEl.focus();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white hover:bg-slate-100 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                >
                  Try Another Email
                </button>
                <button
                  id="btn-popup-dismiss"
                  type="button"
                  onClick={() => setNotInOrgPopup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#00F0B5] hover:bg-[#00e0a5] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
