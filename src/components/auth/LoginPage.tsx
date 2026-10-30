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
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome }) => {
  const router = useRouter();
  const { login, registerCompanyAccount } = useAuth();
  const handleBack = onBackToHome || (() => router.push('/'));
  
  const [viewMode, setViewMode] = useState<'login' | 'signup'>('login');

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

    // Validate Identifier
    const idCheck = validateLoginIdentifier(identifier);
    if (!idCheck.isValid) {
      setErrorMessage(idCheck.error || 'Please enter a valid email, 10-digit mobile number, or employee code.');
      return;
    }

    // Validate Password
    if (!password || password.trim().length === 0) {
      setErrorMessage('Please enter your password.');
      return;
    }

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
        router.push('/');
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

    // 1. Company Legal Name validation
    const compCheck = validateName(companyName, 'Company legal name', 2, true);
    if (!compCheck.isValid) {
      setErrorMessage(compCheck.error || 'Company legal name is required.');
      return;
    }

    // 2. GSTIN format validation (if provided)
    if (companyGst.trim()) {
      const gstCheck = validateGstin(companyGst, false);
      if (!gstCheck.isValid) {
        setErrorMessage(gstCheck.error || 'Invalid GSTIN format. Example: 24AAAAA0000A1Z5');
        return;
      }
    }

    // 3. Owner First Name & Last Name validation
    const fNameCheck = validateName(ownerFirstName, 'Owner first name', 2, true);
    if (!fNameCheck.isValid) {
      setErrorMessage(fNameCheck.error || 'Owner first name is required (at least 2 letters).');
      return;
    }
    const lNameCheck = validateName(ownerLastName, 'Owner last name', 2, true);
    if (!lNameCheck.isValid) {
      setErrorMessage(lNameCheck.error || 'Owner last name is required (at least 2 letters).');
      return;
    }

    // 4. Owner Email validation
    const emailCheck = validateEmail(ownerEmail, true);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Please enter a valid official email address.');
      return;
    }

    // 5. Owner Phone validation
    const phoneCheck = validatePhone(ownerPhone, true);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    // 6. Password validation
    const passCheck = validatePassword(ownerPassword, 6);
    if (!passCheck.isValid) {
      setErrorMessage(passCheck.error || 'Password must be at least 6 characters long.');
      return;
    }

    // 7. Password Match validation
    const matchCheck = validatePasswordMatch(ownerPassword, ownerConfirmPassword);
    if (!matchCheck.isValid) {
      setErrorMessage(matchCheck.error || 'Passwords do not match. Please verify your password.');
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
      setErrorMessage(dupCheck.error || 'This email or mobile number is already registered.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCompanyAccount({
        companyName: companyName.trim(),
        gstNumber: companyGst.trim() ? companyGst.trim().toUpperCase() : undefined,
        industry: companyIndustry || undefined,
        address: companyAddress.trim() || undefined,
        city: companyCity.trim() || undefined,
        state: companyState.trim() || undefined,
        firstName: ownerFirstName.trim(),
        lastName: ownerLastName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        phone: phoneCheck.cleanPhone || ownerPhone.trim(),
        password: ownerPassword,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Company registration failed. Please try again.');
      } else {
        setSuccessMessage(`Company "${companyName.trim()}" registered successfully! Launching your Owner Workspace...`);
        setTimeout(() => {
          router.push('/');
        }, 900);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Company registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f2f9f5] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative selection:bg-emerald-600 selection:text-white overflow-hidden">
      
      {/* Elegant ambient light mint / emerald glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-teal-200/35 blur-3xl -z-10 pointer-events-none" />

      <div className={`w-full ${viewMode === 'signup' ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300 relative z-10`}>
        
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
              ? 'Register your company workspace & owner account'
              : 'Unified Workspace Login • Automatic Role Detection'}
          </p>
        </div>

        {/* Luxury Green Main Card */}
        <div className="bg-white rounded-3xl border border-[#d8ebd9] shadow-[0_12px_40px_rgba(6,45,31,0.06)] p-6 sm:p-8">
          
          {/* Top Header Row for Signup Mode */}
          {viewMode === 'signup' && (
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d8ebd9]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0d271d]">Register Your Company</h2>
                  <p className="text-[11px] text-[#4e6a5d]">New Company Owner & Workspace Setup</p>
                </div>
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
                ← Back to Login
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
            /* UNIFIED LOGIN FORM (Automatic Role Detection)             */
            /* ========================================================== */
            <form
              onSubmit={handleLoginSubmit}
              className="space-y-4"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            >
              {/* Workspace Sign-In Header Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-[#d8ebd9] mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0d271d]">Sign In to Your Workspace</h2>
                    <p className="text-[11px] text-[#4e6a5d]">Automatic Role Detection (Employee & Owner)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Single Login
                </span>
              </div>

              {/* Identifier Input */}
              <div>
                <label className="block text-xs font-bold text-[#0d271d] mb-1.5">
                  Work Email, Mobile Number or Employee ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-identifier"
                    name="paneliya_auth_user"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter email, mobile number or employee code"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 transition-all bg-[#fcfdfd] focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#0d271d]">
                    Password
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
                    autoComplete="current-password"
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
                    <span>Signing In & Detecting Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Switcher: Register Company */}
              <div className="pt-4 border-t border-[#d8ebd9] text-center">
                <p className="text-xs text-[#4e6a5d]">
                  Are you a Company Owner?{' '}
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
                    Register Your Company Workspace →
                  </button>
                </p>
              </div>

            </form>
          ) : (
            /* ========================================================== */
            /* COMPANY REGISTRATION FORM (Only Company Owner Onboards)     */
            /* ========================================================== */
            <form onSubmit={handleRegisterCompanySubmit} className="space-y-4" autoComplete="off">
              {/* Employee Warning Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-[#0d271d] flex items-start gap-2.5">
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
                <div className="flex items-center gap-2 pb-1 border-b border-[#e2efe4]">
                  <Building2 className="w-4 h-4 text-[#059669]" />
                  <h3 className="text-xs font-bold text-[#062d1f] uppercase tracking-wider">
                    1. Company Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      Company Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Paneliya Infotech Pvt Ltd"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      GSTIN / Tax ID <span className="text-xs text-[#4e6a5d] font-normal">(Optional)</span>
                    </label>
                    <input
                      id="input-company-gst"
                      type="text"
                      maxLength={15}
                      value={companyGst}
                      onChange={(e) => setCompanyGst(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15))}
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all uppercase"
                    />
                    <p className="text-[10px] text-[#4e6a5d] mt-1">15-char format (e.g. 24AAAAA0000A1Z5)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">Industry Sector</label>
                    <select
                      id="select-company-industry"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] font-semibold focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
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
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">Office Address</label>
                    <input
                      id="input-company-address"
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="e.g. 402, Ring Road"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">City</label>
                    <input
                      id="input-company-city"
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="e.g. Surat"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">State</label>
                    <input
                      id="input-company-state"
                      type="text"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      placeholder="e.g. Gujarat"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Owner Account */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-[#e2efe4]">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <h3 className="text-xs font-bold text-[#062d1f] uppercase tracking-wider">
                    2. Company Owner & Administrator Account
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-owner-firstname"
                      type="text"
                      required
                      value={ownerFirstName}
                      onChange={(e) => setOwnerFirstName(e.target.value)}
                      placeholder="e.g. Ravi"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-owner-lastname"
                      type="text"
                      required
                      value={ownerLastName}
                      onChange={(e) => setOwnerLastName(e.target.value)}
                      placeholder="e.g. Paneliya"
                      className="w-full h-10 px-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      Official Owner Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-owner-email"
                        type="email"
                        required
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@company.com"
                        className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-owner-phone"
                        type="tel"
                        maxLength={13}
                        required
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 13))}
                        placeholder="9876543210"
                        className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-[#4e6a5d] mt-1">10-digit Indian mobile number (e.g. 9876543210)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      Owner Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-owner-password"
                        type={showOwnerPassword ? 'text' : 'password'}
                        required
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full h-10 pl-8 pr-9 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4e6a5d] hover:text-[#0d271d] cursor-pointer"
                      >
                        {showOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0d271d] mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-owner-confirm-password"
                        type={showOwnerConfirmPassword ? 'text' : 'password'}
                        required
                        value={ownerConfirmPassword}
                        onChange={(e) => setOwnerConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full h-10 pl-8 pr-9 rounded-xl border border-[#d8ebd9] text-xs text-[#0d271d] placeholder:text-[#4e6a5d]/60 font-medium focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 bg-[#fcfdfd] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerConfirmPassword(!showOwnerConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4e6a5d] hover:text-[#0d271d] cursor-pointer"
                      >
                        {showOwnerConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="mt-6 pt-4 border-t border-[#d8ebd9] text-center">
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
            </div>
          )}
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
