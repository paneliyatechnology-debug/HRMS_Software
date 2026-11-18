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
  Briefcase,
  FileText,
  MapPin,
  Info,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  validateEmail,
  validatePhone,
  validateGstin,
  validateName,
  validatePassword,
  validatePasswordMatch,
  validateLoginIdentifier,
  cleanPhoneNumber,
  checkDuplicateEmailOrPhone,
} from '../../lib/validation';

export interface LoginPageProps {
  onBackToHome?: () => void;
  initialMode?: 'login' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, initialMode = 'login' }) => {
  const router = useRouter();
  const { login, registerCompanyAccount } = useAuth();
  const handleBack = onBackToHome || (() => router.push('/dashboard'));

  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'registration_pending'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/register') {
      return 'signup';
    }
    return initialMode;
  });

  const [registeredCompanyInfo, setRegisteredCompanyInfo] = useState<{
    companyName: string;
    ownerEmail: string;
    ownerName: string;
  }>({
    companyName: '',
    ownerEmail: '',
    ownerName: '',
  });

  const handleSwitchToSignup = () => {
    clearAllSignupFields();
    setViewMode('signup');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/register') {
      window.history.pushState(null, '', '/register');
    }
  };

  const handleSwitchToLogin = () => {
    clearAllSignupFields();
    clearLoginFields();
    setViewMode('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/register') {
        setViewMode('signup');
      } else if (window.location.pathname === '/login') {
        setViewMode('login');
      }
    }
  }, []);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Company Registration Form State
  const [companyName, setCompanyName] = useState('');
  const [companyGst, setCompanyGst] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('IT & Software Services');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');

  // Company Owner Account State
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showOwnerConfirmPassword, setShowOwnerConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  // Anti-autofill state for login & password fields so browser never auto-detects or pre-fills them
  const [loginIdentifierReadOnly, setLoginIdentifierReadOnly] = useState(true);
  const [loginPasswordReadOnly, setLoginPasswordReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);
  const [confirmPasswordReadOnly, setConfirmPasswordReadOnly] = useState(true);

  const clearLoginFields = () => {
    setIdentifier('');
    setPassword('');
    setLoginIdentifierReadOnly(true);
    setLoginPasswordReadOnly(true);
    setFieldErrors({});
  };

  const clearAllSignupFields = () => {
    setCompanyName('');
    setCompanyGst('');
    setCompanyIndustry('IT & Software Services');
    setCompanyAddress('');
    setCompanyCity('');
    setCompanyState('');
    setOwnerFirstName('');
    setOwnerLastName('');
    setOwnerEmail('');
    setOwnerPhone('');
    setOwnerPassword('');
    setOwnerConfirmPassword('');
    setFieldErrors({});
    setPasswordReadOnly(true);
    setConfirmPasswordReadOnly(true);
  };

  useEffect(() => {
    if (viewMode === 'login') {
      clearLoginFields();
      const t1 = setTimeout(() => {
        setIdentifier('');
        setPassword('');
      }, 50);
      const t2 = setTimeout(() => {
        setIdentifier('');
        setPassword('');
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'signup') {
      clearAllSignupFields();
      const t1 = setTimeout(() => {
        setOwnerPassword('');
        setOwnerConfirmPassword('');
      }, 50);
      const t2 = setTimeout(() => {
        setOwnerPassword('');
        setOwnerConfirmPassword('');
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [viewMode]);

  // Bottom Popup State for unassociated / unlinked organization users
  const [notInOrgPopup, setNotInOrgPopup] = useState<{
    open: boolean;
    email: string;
    attemptRole?: string;
  } | null>(null);

  // Handle Unified Login Submission with Automatic Role & Workspace Detection
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotInOrgPopup(null);
    const errors: Record<string, string> = {};

    // Validate Identifier
    const idCheck = validateLoginIdentifier(identifier);
    if (!idCheck.isValid) {
      errors.identifier = idCheck.error || 'Please enter a valid email, 10-digit mobile number, or employee code.';
    }

    // Validate Password
    if (!password || password.trim().length === 0) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Single unified login: automatically identifies Owner/Admin or Employee based on role in database
      const res = await login(identifier, password);

      if (!res.success) {
        if (
          res.notInOrganization ||
          res.message?.toLowerCase().includes('not part of any organization')
        ) {
          setNotInOrgPopup({
            open: true,
            email: identifier.trim(),
            attemptRole: 'Workspace User',
          });
        }

        setErrorMessage(
          res.message || 'Invalid credentials. Please verify your email, mobile number or employee code and password.'
        );
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Handle Company Registration (Owner Onboarding)
  const handleRegisterCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const errors: Record<string, string> = {};

    // 1. Company Legal Name validation
    const compCheck = validateName(companyName, 'Company legal name', 2, true);
    if (!compCheck.isValid) {
      errors.companyName = compCheck.error || 'Company legal name is required.';
    }

    // 2. GSTIN format validation (if provided)
    if (companyGst.trim()) {
      const gstCheck = validateGstin(companyGst, false);
      if (!gstCheck.isValid) {
        errors.companyGst = gstCheck.error || 'Invalid GSTIN format. Example: 24AAAAA0000A1Z5';
      }
    }

    // 3. Owner First Name & Last Name validation
    const fNameCheck = validateName(ownerFirstName, 'Owner first name', 2, true);
    if (!fNameCheck.isValid) {
      errors.ownerFirstName = fNameCheck.error || 'Owner first name is required (at least 2 letters).';
    }
    const lNameCheck = validateName(ownerLastName, 'Owner last name', 2, true);
    if (!lNameCheck.isValid) {
      errors.ownerLastName = lNameCheck.error || 'Owner last name is required (at least 2 letters).';
    }

    // 4. Owner Email validation
    const emailCheck = validateEmail(ownerEmail, true);
    if (!emailCheck.isValid) {
      errors.ownerEmail = emailCheck.error || 'Please enter a valid official email address.';
    }

    // 5. Owner Phone validation
    const phoneCheck = validatePhone(ownerPhone, true);
    if (!phoneCheck.isValid) {
      errors.ownerPhone = phoneCheck.error || 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
    }

    // 6. Password validation
    const passCheck = validatePassword(ownerPassword, 6);
    if (!passCheck.isValid) {
      errors.ownerPassword = passCheck.error || 'Password must be at least 6 characters long.';
    }

    // 7. Password Match validation
    const matchCheck = validatePasswordMatch(ownerPassword, ownerConfirmPassword);
    if (!matchCheck.isValid) {
      errors.ownerConfirmPassword = matchCheck.error || 'Passwords do not match. Please verify your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // 8. Strict Uniqueness Check: 1 Email = 1 Account & 1 Mobile Number = 1 Account
    const allEmps = await api.getEmployees().catch(() => []);
    const dupCheck = checkDuplicateEmailOrPhone({
      email: ownerEmail,
      phone: ownerPhone,
      existingEmployees: allEmps,
    });
    if (!dupCheck.isValid) {
      const msg = dupCheck.error || 'This email or mobile number is already registered.';
      if (msg.toLowerCase().includes('email')) {
        errors.ownerEmail = msg;
      } else {
        errors.ownerPhone = msg;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const res = await registerCompanyAccount({
        companyName: companyName.trim(),
        companyLegalName: companyName.trim(),
        gstNumber: companyGst.trim() ? companyGst.trim().toUpperCase() : '',
        gstin: companyGst.trim() ? companyGst.trim().toUpperCase() : '',
        industry: companyIndustry || 'Information Technology & Software',
        industrySector: companyIndustry || 'Information Technology & Software',
        address: companyAddress.trim() || '',
        officeAddress: companyAddress.trim() || '',
        city: companyCity.trim() || 'Surat',
        state: companyState.trim() || 'Gujarat',
        firstName: ownerFirstName.trim(),
        lastName: ownerLastName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        officialEmail: ownerEmail.trim().toLowerCase(),
        phone: phoneCheck.cleanPhone || ownerPhone.trim(),
        mobileNumber: phoneCheck.cleanPhone || ownerPhone.trim(),
        password: ownerPassword,
        confirmPassword: ownerConfirmPassword || ownerPassword,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Company registration failed. Please try again.');
      } else {
        setRegisteredCompanyInfo({
          companyName: companyName.trim(),
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerName: `${ownerFirstName.trim()} ${ownerLastName.trim()}`,
        });
        setViewMode('registration_pending');
        setErrorMessage(null);
        setSuccessMessage(null);
        clearAllSignupFields();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Company registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f8f9fa] via-[#f8f9fa] to-[#f8f9fa] flex flex-col justify-between items-center px-4 sm:px-6 py-5 sm:py-8 relative selection:bg-emerald-600 selection:text-white overflow-x-hidden">

      {/* Modern dot mesh and ambient glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-emerald-300/20 via-teal-200/15 to-emerald-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar: Back Link Positioned Cleanly at Top-Left & Enterprise Badge */}
      <header className="w-full max-w-6xl flex items-center justify-between z-20 mb-3 sm:mb-6">
        <button
          id="btn-back-to-landing"
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 hover:border-emerald-300 px-3.5 sm:px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer group whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:-translate-x-1 transition-transform shrink-0" />
          <span className="hidden sm:inline">Back to Home Overview</span>
          <span className="sm:hidden">Back to Home</span>
        </button>

      </header>

      {/* Main Center Form Area */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-2 z-10">
        <div className={`w-full ${viewMode === 'signup' ? 'max-w-2xl' : viewMode === 'registration_pending' ? 'max-w-lg' : 'max-w-md'} transition-all duration-300`}>

          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center mx-auto mb-3.5 shadow-xl shadow-emerald-900/15 border border-emerald-400/30 ring-4 ring-emerald-500/10">
              <Building2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Own HRMS
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {viewMode === 'signup'
                ? 'Register your company workspace & owner account'
                : viewMode === 'registration_pending'
                  ? 'Company Registration Status'
                  : 'Unified Workspace Login • Employee & Admin'}
            </p>
          </div>

          {/* Luxury Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(5,150,105,0.08),0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-9">

            {/* Top Header Row for Signup Mode */}
            {viewMode === 'signup' && (
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <Building2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Register Your Company</h2>
                    <p className="text-[11px] text-slate-500">New Company Owner & Workspace Setup</p>
                  </div>
                </div>
                <button
                  id="btn-back-to-login-sides"
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="text-xs font-bold text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
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

            {viewMode === 'registration_pending' ? (
              /* ========================================================== */
              /* PENDING APPROVAL CONFIRMATION VIEW                         */
              /* ========================================================== */
              <div className="py-2 text-center animate-in fade-in zoom-in-95 duration-200">
                {/* Success Badge Icon */}
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Company Registration Submitted!
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your company registration request has been successfully recorded.
                </p>

                {/* Informational Text Box */}
                <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 border border-emerald-200 text-left space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Pending Administrator Approval
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        Your company <strong className="text-slate-900 font-bold">{registeredCompanyInfo.companyName}</strong> has been registered successfully.
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Your workspace is currently under review by the administrator. Once your company registration is approved by the admin, you will be able to log in to your account.
                      </p>
                    </div>
                  </div>

                  {registeredCompanyInfo.ownerEmail && (
                    <div className="pt-3 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-600">
                      <span>Registered Admin Email:</span>
                      <span className="font-mono font-bold text-slate-900 break-all">{registeredCompanyInfo.ownerEmail}</span>
                    </div>
                  )}
                </div>

                {/* Back to Login Page Button */}
                <div className="pt-1">
                  <button
                    id="btn-back-to-login-after-reg"
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login Page</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'login' ? (
              /* ========================================================== */
              /* UNIFIED LOGIN FORM (RE-DESIGNED)                           */
              /* ========================================================== */
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-4"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
              >
                {/* Trap inputs to absorb browser autofill and auto-detection */}
                <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}>
                  <input type="text" name="fake_user_trap_login" tabIndex={-1} autoComplete="off" />
                  <input type="password" name="fake_pwd_trap_login" tabIndex={-1} autoComplete="new-password" />
                </div>

                {/* Identifier Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-login-identifier" className="text-xs font-bold text-slate-700">
                      Enter your Work Email, Mobile Number
                    </label>
                    {fieldErrors.identifier && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.identifier}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-identifier"
                      name="paneliya_fld_usr_noautofill"
                      type="text"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      readOnly={loginIdentifierReadOnly}
                      onFocus={() => setLoginIdentifierReadOnly(false)}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        clearFieldError('identifier');
                      }}
                      placeholder="Enter email, mobile number"
                      className={`w-full h-12 pl-11 pr-4 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${
                        fieldErrors.identifier
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-login-password" className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    {fieldErrors.password && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-password"
                      name="paneliya_fld_pwd_noautofill"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      readOnly={loginPasswordReadOnly}
                      onFocus={() => setLoginPasswordReadOnly(false)}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder="••••••••"
                      className={`w-full h-12 pl-11 pr-11 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${
                        fieldErrors.password
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                      }`}
                    />
                    <button
                      id="btn-toggle-login-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <span className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 hover:underline cursor-pointer">
                      Forgot?
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group whitespace-nowrap shrink-0"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In to Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Bottom Switcher: Register Company */}
                <div className="pt-5 mt-5 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Are you a Company Owner?{' '}
                    <button
                      id="link-switch-to-signup"
                      type="button"
                      onClick={handleSwitchToSignup}
                      className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer inline-flex items-center gap-1 group"
                    >
                      <span>Register Your Company Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* ========================================================== */
              /* COMPANY REGISTRATION FORM (Only Company Owner Onboards)     */
              /* ========================================================== */
              <form
                onSubmit={handleRegisterCompanySubmit}
                className="space-y-4"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              >
                {/* Trap inputs to absorb browser autofill */}
                <div
                  style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
                  aria-hidden="true"
                >
                  <input type="text" name="fake_username_trap" tabIndex={-1} autoComplete="off" />
                  <input type="password" name="fake_password_trap" tabIndex={-1} autoComplete="new-password" />
                </div>
                {/* Employee Warning Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-slate-800 flex items-start gap-2.5 shadow-2xs">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Important for Staff Employees:</p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                      Employees <strong>cannot self-register</strong> here. Only new <strong>Company Owners</strong> register their company. Once registered, the owner will add your Email or Phone in their Owner Dashboard, enabling your employee login.
                    </p>
                  </div>
                </div>

                {/* Section 1: Company Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      1. Company Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Company Legal Name <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.companyName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.companyName}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-company-name"
                        name="reg_company_legal_name"
                        type="text"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          clearFieldError('companyName');
                        }}
                        placeholder="e.g. Paneliya Infotech Pvt Ltd"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.companyName
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          GSTIN / Tax ID <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                        </label>
                        {fieldErrors.companyGst && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.companyGst}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-company-gst"
                        name="reg_company_tax_gstin"
                        type="text"
                        maxLength={15}
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyGst}
                        onChange={(e) => {
                          setCompanyGst(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15));
                          clearFieldError('companyGst');
                        }}
                        placeholder="e.g. 24AAAAA0000A1Z5"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all uppercase ${fieldErrors.companyGst
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">15-char format (e.g. 24AAAAA0000A1Z5)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Industry Sector</label>
                      <select
                        id="select-company-industry"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="IT & Software Services">Information Technology & Software</option>
                        <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                        <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                        <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                        <option value="Construction & Real Estate">Construction & Real Estate</option>
                        <option value="Financial & Banking">Financial & Banking</option>
                        <option value="Education & EdTech">Education & EdTech</option>
                        <option value="Hospitality & Services">Hospitality & Services</option>
                        <option value="General Corporate">General Corporate / Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                      <input
                        id="input-company-address"
                        name="reg_company_office_address"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="e.g. 402, Ring Road"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                      <input
                        id="input-company-city"
                        name="reg_company_office_city"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="e.g. Surat"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                      <input
                        id="input-company-state"
                        name="reg_company_office_state"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyState}
                        onChange={(e) => setCompanyState(e.target.value)}
                        placeholder="e.g. Gujarat"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Account */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. Company Owner & Administrator Account
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerFirstName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerFirstName}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-owner-firstname"
                        name="reg_owner_given_name"
                        type="text"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={ownerFirstName}
                        onChange={(e) => {
                          setOwnerFirstName(e.target.value);
                          clearFieldError('ownerFirstName');
                        }}
                        placeholder="e.g. Ravi"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerFirstName
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerLastName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerLastName}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-owner-lastname"
                        name="reg_owner_family_name"
                        type="text"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={ownerLastName}
                        onChange={(e) => {
                          setOwnerLastName(e.target.value);
                          clearFieldError('ownerLastName');
                        }}
                        placeholder="e.g. Paneliya"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerLastName
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Official Owner Email <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerEmail && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerEmail}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-owner-email"
                          name="reg_owner_primary_email"
                          type="email"
                          required
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          value={ownerEmail}
                          onChange={(e) => {
                            setOwnerEmail(e.target.value);
                            clearFieldError('ownerEmail');
                          }}
                          placeholder="owner@company.com"
                          className={`w-full h-11 pl-9 pr-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerEmail
                            ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerPhone && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerPhone}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-owner-phone"
                          name="reg_owner_mobile_number"
                          type="tel"
                          maxLength={13}
                          required
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          value={ownerPhone}
                          onChange={(e) => {
                            setOwnerPhone(e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 13));
                            clearFieldError('ownerPhone');
                          }}
                          placeholder="9876543210"
                          className={`w-full h-11 pl-9 pr-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerPhone
                            ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">10-digit Indian mobile number (e.g. 9876543210)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Owner Password <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerPassword && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerPassword}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-owner-password"
                          name="company_owner_new_registration_password"
                          type={showOwnerPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          data-form-type="other"
                          readOnly={passwordReadOnly}
                          onFocus={() => setPasswordReadOnly(false)}
                          value={ownerPassword}
                          onChange={(e) => {
                            setOwnerPassword(e.target.value);
                            clearFieldError('ownerPassword');
                          }}
                          placeholder="Min 6 characters"
                          className={`w-full h-11 pl-9 pr-10 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerPassword
                            ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerConfirmPassword && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerConfirmPassword}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-owner-confirm-password"
                          name="company_owner_new_registration_confirm_password"
                          type={showOwnerConfirmPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          data-form-type="other"
                          readOnly={confirmPasswordReadOnly}
                          onFocus={() => setConfirmPasswordReadOnly(false)}
                          value={ownerConfirmPassword}
                          onChange={(e) => {
                            setOwnerConfirmPassword(e.target.value);
                            clearFieldError('ownerConfirmPassword');
                          }}
                          placeholder="Repeat password"
                          className={`w-full h-11 pl-9 pr-10 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerConfirmPassword
                            ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwnerConfirmPassword(!showOwnerConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showOwnerConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Sign Up Button */}
                <button
                  id="btn-submit-company-register"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Company & Onboarding Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Company &amp; Launch Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Switcher Link (for Signup Mode) */}
            {viewMode === 'signup' && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs font-medium text-slate-500">
                  Already have an account?{' '}
                  <button
                    id="link-switch-to-login"
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Security & Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role-Based Multi-Tenant Isolation</span>
            </div>
          </div>
        </div>
      </main>

     

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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(6,45,31,0.15)] overflow-hidden">
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
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                    You are not part of any organization
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    The email or ID <span className="font-mono bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">{notInOrgPopup.email}</span> has not been added to any company or organization yet.
                  </p>
                </div>
              </div>

              {/* Informative Guidance Box */}
              <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px] uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How to get access:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Contact your <strong>Company Administrator or HR</strong>.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  2. Ask them to add your email using the <strong>Add Employee</strong> button in their company dashboard.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  3. Once added, you will automatically be linked to their company workspace and can log in here!
                </p>
              </div>

              {/* Actions Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  id="btn-popup-try-another"
                  type="button"
                  onClick={() => {
                    setNotInOrgPopup(null);
                    setIdentifier('');
                    const inputEl = document.getElementById('input-login-identifier');
                    if (inputEl) inputEl.focus();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  Try Another Email
                </button>
                <button
                  id="btn-popup-dismiss"
                  type="button"
                  onClick={() => setNotInOrgPopup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
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
