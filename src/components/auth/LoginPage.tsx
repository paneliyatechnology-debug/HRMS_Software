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
    <div className="min-h-screen w-full bg-[#f2f9f5] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative select-none selection:bg-emerald-600 selection:text-white overflow-hidden">
      
      {/* Elegant ambient light mint / emerald glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-teal-200/35 blur-3xl -z-10 pointer-events-none" />

      <div className={`w-full ${viewMode === 'signup' ? 'max-w-md' : 'max-w-md'} transition-all duration-300 relative z-10`}>
        
        {/* Top Navigation Row: Back Link */}
        <div className="flex items-center justify-start mb-5">
          <button
            id="btn-back-to-landing"
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0d271d] bg-white hover:bg-emerald-50 border border-[#d8ebd9] px-3.5 py-1.5 rounded-xl shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#059669] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home Overview</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#062d1f] to-[#0b3b29] text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-950/20 border border-emerald-800/40 font-bold text-2xl">
            <Building2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d271d] tracking-tight">
            My Own HRMS
          </h1>
          <p className="text-xs font-medium text-[#4e6a5d] mt-1">
            {viewMode === 'signup'
              ? 'Create a new employee or administrator account'
              : loginSide === 'admin'
              ? 'Company Owner & HR Management Portal'
              : 'Employee Workplace & Attendance Self-Service'}
          </p>
        </div>

        {/* Luxury Green Main Card */}
        <div className="bg-white rounded-3xl border border-[#d8ebd9] shadow-[0_12px_40px_rgba(6,45,31,0.06)] p-6 sm:p-8">
          
          {/* 2-Side Switcher: Company Admin vs Employee */}
          {viewMode === 'login' ? (
            <div className="grid grid-cols-2 bg-[#f2f9f5] p-1.5 rounded-2xl mb-6 text-xs font-semibold border border-[#d8ebd9] gap-1.5">
              {/* 1. Admin Side */}
              <button
                id="tab-side-admin"
                type="button"
                onClick={() => switchSide('admin')}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginSide === 'admin'
                    ? 'bg-[#062d1f] text-white font-bold shadow-sm'
                    : 'text-[#4e6a5d] hover:bg-white hover:text-[#0d271d]'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="truncate">Company Admin</span>
              </button>

              {/* 2. Employee Side */}
              <button
                id="tab-side-employee"
                type="button"
                onClick={() => switchSide('employee')}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginSide === 'employee'
                    ? 'bg-[#059669] text-white font-bold shadow-sm'
                    : 'text-[#4e6a5d] hover:bg-white hover:text-[#0d271d]'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">Staff Employee</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d8ebd9]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#0d271d]">New User Registration</h2>
              </div>
              <button
                id="btn-back-to-login-sides"
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-[#059669] hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
                  <label className="block text-xs font-bold text-[#0d271d]">
                    {loginSide === 'admin'
                      ? 'Company Admin Email or Phone'
                      : 'Employee Code, Email or Phone'}
                  </label>
                </div>
                <div className="relative">
                  {loginSide === 'admin' ? (
                    <Mail className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <User className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 transition-all bg-[#fcfdfd] focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#0d271d]">
                    {loginSide === 'admin'
                      ? 'Admin Password'
                      : 'Password / PIN'}
                  </label>
                  <span className="text-xs text-[#059669] font-semibold hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    name="paneliya_auth_key"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 transition-all bg-[#fcfdfd] focus:bg-white"
                  />
                  <button
                    id="btn-toggle-login-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4e6a5d] hover:text-[#0d271d] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying {loginSide === 'admin' ? 'Company Admin' : 'Employee'}...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {loginSide === 'admin'
                        ? 'Sign In as Company Admin'
                        : 'Sign In to Employee Portal'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          ) : (
            /* ========================================================== */
            /* NEW USER REGISTRATION FORM                                 */
            /* ========================================================== */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5" autoComplete="off">
              {/* Employee Auto-Link Callout */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-[#0d271d] flex items-start gap-2.5">
                <span className="text-lg leading-none">🏢</span>
                <div>
                  <p className="font-bold text-[#062d1f]">Joining as an Employee?</p>
                  <p className="text-[11px] text-[#4e6a5d] mt-0.5 leading-snug">
                    Enter the <strong>Email</strong> or <strong>Mobile Number</strong> assigned by your company admin for instant access!
                  </p>
                </div>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0d271d] mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-signup-firstname"
                    type="text"
                    required
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0d271d] mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-signup-lastname"
                    type="text"
                    required
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    placeholder="e.g. Sangani"
                    className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-[#0d271d] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-[#0d271d] mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0d271d] mb-1">Role</label>
                  <select
                    id="select-signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full h-10 px-2.5 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] font-semibold focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  >
                    <option value="EMPLOYEE">Staff Employee</option>
                    <option value="HR_ADMIN">Company Admin / HR</option>
                    <option value="MANAGER">Department Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0d271d] mb-1">Department</label>
                  <select
                    id="select-signup-dept"
                    value={signupDepartmentId}
                    onChange={(e) => setSignupDepartmentId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] font-semibold focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
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
                <label className="block text-xs font-bold text-[#0d271d] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4e6a5d] hover:text-[#0d271d] cursor-pointer"
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
                <label className="block text-xs font-bold text-[#0d271d] mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-confirm-password"
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full h-10 pl-8 pr-9 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4e6a5d] hover:text-[#0d271d] cursor-pointer"
                  >
                    {showSignupConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Sign Up Button */}
              <button
                id="btn-submit-signup"
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving account...</span>
                  </>
                ) : (
                  <>
                    <span>Register &amp; Enter Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Switcher Link */}
          <div className="mt-6 pt-4 border-t border-[#d8ebd9] text-center">
            {viewMode === 'signup' ? (
              <p className="text-xs font-medium text-[#4e6a5d]">
                Already have an account?{' '}
                <button
                  id="link-switch-to-login"
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#059669] hover:text-[#047857] hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p className="text-xs font-medium text-[#4e6a5d]">
                New user or organization?{' '}
                <button
                  id="link-switch-to-signup"
                  type="button"
                  onClick={() => {
                    setViewMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#059669] hover:text-[#047857] hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Create an account (Sign Up)
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] font-semibold text-[#4e6a5d] mt-6">
          <span className="bg-white/80 px-3.5 py-1.5 rounded-full border border-[#d8ebd9] shadow-xs">
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
          <div className="bg-white rounded-3xl border border-[#d8ebd9] shadow-[0_20px_50px_rgba(6,45,31,0.15)] overflow-hidden">
            {/* Top alert header bar */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Access Restricted • Organization Required
                </span>
              </div>
              <button
                id="btn-close-not-in-org-popup"
                type="button"
                onClick={() => setNotInOrgPopup(null)}
                className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#0d271d] tracking-tight leading-tight">
                    You are not part of any organization
                  </h3>
                  <p className="text-xs text-[#4e6a5d] mt-1 leading-snug">
                    The email or ID <span className="font-mono bg-emerald-50 text-[#062d1f] px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">{notInOrgPopup.email}</span> has not been added to any company or organization yet.
                  </p>
                </div>
              </div>

              {/* Informative Guidance Box */}
              <div className="mt-3.5 p-3 rounded-2xl bg-[#f2f9f5] border border-[#d8ebd9] text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#062d1f] text-[11px] uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>How to get access:</span>
                </div>
                <p className="text-[11px] text-[#4e6a5d] leading-relaxed">
                  1. Contact your <strong>Company Administrator or HR</strong>.
                </p>
                <p className="text-[11px] text-[#4e6a5d] leading-relaxed">
                  2. Ask them to add your email using the <strong>Add Employee</strong> button in their company dashboard.
                </p>
                <p className="text-[11px] text-[#4e6a5d] leading-relaxed">
                  3. Once added, you will automatically be linked to their company workspace and can log in here!
                </p>
              </div>

              {/* Actions Row */}
              <div className="mt-4 pt-3 border-t border-[#d8ebd9] flex items-center justify-end gap-2.5">
                <button
                  id="btn-popup-try-another"
                  type="button"
                  onClick={() => {
                    setNotInOrgPopup(null);
                    setIdentifier('');
                    const inputEl = document.getElementById('input-login-identifier');
                    if (inputEl) inputEl.focus();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0d271d] bg-white hover:bg-[#f2f9f5] border border-[#d8ebd9] transition-colors cursor-pointer"
                >
                  Try Another Email
                </button>
                <button
                  id="btn-popup-dismiss"
                  type="button"
                  onClick={() => setNotInOrgPopup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-sm transition-colors cursor-pointer"
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
