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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export type LoginSide = 'admin' | 'employee';

export interface LoginPageProps {
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome }) => {
  const router = useRouter();
  const { loginAsAdmin, loginAsEmployee, registerUser } = useAuth();
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
    setIdentifier('');
    setPassword('');
  };

  // Handle Side-Specific Login Submission
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      let res: { success: boolean; message?: string };

      if (loginSide === 'admin') {
        res = await loginAsAdmin(identifier, password);
      } else {
        res = await loginAsEmployee(identifier, password);
      }

      if (!res.success) {
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
    <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative select-none">
      <div className={`w-full ${viewMode === 'signup' ? 'max-w-md' : 'max-w-md'} transition-all duration-300 relative z-10`}>
        {/* Top Navigation Row: Back Link */}
        <div className="flex items-center justify-start mb-4">
          <button
            id="btn-back-to-landing"
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-100 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Product Overview</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-[13px] bg-gradient-to-tr from-[#6576ff] to-[#7f4cdb] text-white flex items-center justify-center mx-auto mb-3 shadow-md font-black text-2xl">
            M
          </div>
          <h1 className="text-2xl font-black text-[#152345] tracking-tight">
            My Own HRMS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'signup'
              ? 'Create a new employee or administrator account'
              : loginSide === 'admin'
              ? 'Company Owner & HR Management Portal'
              : 'Employee Workplace & Attendance Self-Service'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 p-6 sm:p-7">
          {/* 2-Side Switcher: Company Admin vs Employee */}
          {viewMode === 'login' ? (
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-semibold gap-1">
              {/* 1. Admin Side (Company Owner) */}
              <button
                id="tab-side-admin"
                type="button"
                onClick={() => switchSide('admin')}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 ${
                  loginSide === 'admin'
                    ? 'bg-white text-indigo-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2
                  className={`w-4 h-4 shrink-0 ${
                    loginSide === 'admin' ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Company Admin</span>
              </button>

              {/* 2. Employee Side */}
              <button
                id="tab-side-employee"
                type="button"
                onClick={() => switchSide('employee')}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 ${
                  loginSide === 'employee'
                    ? 'bg-white text-indigo-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User
                  className={`w-4 h-4 shrink-0 ${
                    loginSide === 'employee' ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Staff Employee</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">New User Registration</h2>
              </div>
              <button
                id="btn-back-to-login-sides"
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                ← Back to Login
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

          {viewMode === 'login' ? (
            /* ========================================================== */
            /* 2 DIFFERENT LOGIN SIDES (Company Admin & Employee)         */
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
                  <label className="block text-xs font-bold text-slate-700">
                    {loginSide === 'admin'
                      ? 'Company Admin Email or Phone'
                      : 'Employee Code, Email or Phone'}
                  </label>
                </div>
                <div className="relative">
                  {loginSide === 'admin' ? (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {loginSide === 'admin'
                      ? 'Admin Password'
                      : 'Password / 6-Digit PIN'}
                  </label>
                  <span className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    name="paneliya_auth_key"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    id="btn-toggle-login-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button Tailored for Active Side */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying {loginSide === 'admin' ? 'Company Admin' : 'Employee'}...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {loginSide === 'admin'
                        ? 'Sign In as Company Admin'
                        : 'Sign In to Employee Portal'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ========================================================== */
            /* NEW USER REGISTRATION / SIGN UP FORM                      */
            /* ========================================================== */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5" autoComplete="off">
              {/* Employee Auto-Link Callout */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/70 text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
                <span className="text-base leading-none">🏢</span>
                <div>
                  <p className="font-bold text-indigo-950">Joining as a Company Employee?</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-snug">
                    Enter the <strong>Email</strong> or <strong>Mobile Number</strong> added by your company owner. You will instantly be connected as an active employee with all your department &amp; job details!
                  </p>
                </div>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-signup-firstname"
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
                    id="input-signup-lastname"
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
                    id="input-signup-email"
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

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    id="select-signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  >
                    <option value="EMPLOYEE">Staff Employee</option>
                    <option value="HR_ADMIN">Company Admin / HR</option>
                    <option value="MANAGER">Department Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    id="select-signup-dept"
                    value={signupDepartmentId}
                    onChange={(e) => setSignupDepartmentId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
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
                    id="input-signup-confirm-password"
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
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
                id="btn-submit-signup"
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving account...</span>
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

          {/* Bottom Switcher Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            {viewMode === 'signup' ? (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  id="link-switch-to-login"
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                New user or organization?{' '}
                <button
                  id="link-switch-to-signup"
                  type="button"
                  onClick={() => {
                    setViewMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Create an account (Sign Up)
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          My Own HRMS Enterprise • Real-Time Cloud HRMS
        </p>
      </div>
    </div>
  );
};
